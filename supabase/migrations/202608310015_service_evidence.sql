create table public.service_order_evidence (
 id uuid primary key default extensions.gen_random_uuid(), service_order_id uuid not null references public.service_orders(id) on delete restrict,
 business_id uuid not null references public.businesses(id) on delete restrict, category text not null check(category in ('before','during','after')),
 note text check(note is null or char_length(note) between 1 and 500), storage_path text not null unique,
 status text not null check(status in ('pending','active','deleted')), byte_size bigint, locked_at timestamptz,
 created_by uuid not null, created_at timestamptz not null default now(), deleted_at timestamptz, deleted_by uuid,
 check(storage_path !~* '^https?://' and storage_path ~ '^[0-9a-f-]+/[0-9a-f-]+/[0-9a-f-]+/[0-9a-f-]+\.jpg$')
);
create index service_order_evidence_order_idx on public.service_order_evidence(service_order_id,created_at,id);
create table public.service_order_evidence_events (
 id bigint generated always as identity primary key, evidence_id uuid not null references public.service_order_evidence(id) on delete restrict,
 service_order_id uuid not null references public.service_orders(id) on delete restrict, business_id uuid not null references public.businesses(id) on delete restrict,
 event_type text not null check(event_type in ('added','deleted','locked')), note text, actor_user_id uuid not null, created_at timestamptz not null default now()
);
alter table public.service_order_evidence enable row level security;
alter table public.service_order_evidence_events enable row level security;
create policy service_evidence_select_owner on public.service_order_evidence for select to authenticated using(exists(select 1 from public.businesses b where b.id=service_order_evidence.business_id and b.owner_id=(select auth.uid())));
create policy service_evidence_events_select_owner on public.service_order_evidence_events for select to authenticated using(exists(select 1 from public.businesses b where b.id=service_order_evidence_events.business_id and b.owner_id=(select auth.uid())));
revoke all on public.service_order_evidence, public.service_order_evidence_events from public,anon,authenticated;
grant select on public.service_order_evidence, public.service_order_evidence_events to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('service-evidence','service-evidence',false,3145728,array['image/jpeg'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy service_evidence_object_select on storage.objects for select to authenticated using(bucket_id='service-evidence' and exists(select 1 from public.service_order_evidence e join public.businesses b on b.id=e.business_id where e.storage_path=name and b.owner_id=(select auth.uid())));
create policy service_evidence_object_insert on storage.objects for insert to authenticated with check(bucket_id='service-evidence' and lower(storage.extension(name))='jpg' and exists(select 1 from public.service_order_evidence e join public.businesses b on b.id=e.business_id where e.storage_path=name and e.status='pending' and e.created_by=(select auth.uid()) and b.owner_id=(select auth.uid())));
create policy service_evidence_object_delete on storage.objects for delete to authenticated using(bucket_id='service-evidence' and exists(select 1 from public.service_order_evidence e join public.businesses b on b.id=e.business_id where e.storage_path=name and e.status in ('pending','deleted') and b.owner_id=(select auth.uid())));

create function public.reserve_service_evidence(p_business_id uuid,p_service_order_id uuid,p_category text,p_note text default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.service_orders; e public.service_order_evidence; n text; eid uuid:=extensions.gen_random_uuid();
begin
 if auth.uid() is null or not exists(select 1 from public.businesses where id=p_business_id and owner_id=auth.uid()) then raise exception 'BUSINESS_NOT_OWNED' using errcode='42501'; end if;
 select * into o from public.service_orders where id=p_service_order_id and business_id=p_business_id for update;
 if not found then raise exception 'SERVICE_ORDER_NOT_OWNED' using errcode='42501'; end if;
 if o.status not in ('pending','in_progress','paused') then raise exception 'EVIDENCE_ORDER_LOCKED'; end if;
 if p_category not in ('before','during','after') then raise exception 'INVALID_EVIDENCE_CATEGORY'; end if;
 if (select count(*) from public.service_order_evidence where service_order_id=o.id and status in ('pending','active'))>=20 then raise exception 'EVIDENCE_LIMIT_REACHED'; end if;
 n:=nullif(btrim(regexp_replace(coalesce(p_note,''),'\s+',' ','g')),''); if n is not null and char_length(n)>500 then raise exception 'NOTE_TOO_LONG'; end if;
 insert into public.service_order_evidence(id,service_order_id,business_id,category,note,storage_path,status,created_by)
 values(eid,o.id,o.business_id,p_category,n,auth.uid()::text||'/'||o.business_id::text||'/'||o.id::text||'/'||eid::text||'.jpg','pending',auth.uid()) returning * into e;
 return jsonb_build_object('id',e.id,'storagePath',e.storage_path);
end $$;
create function public.finalize_service_evidence(p_business_id uuid,p_evidence_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.service_order_evidence; obj storage.objects; begin
 select * into e from public.service_order_evidence where id=p_evidence_id and business_id=p_business_id for update;
 if not found or e.created_by<>auth.uid() then raise exception 'EVIDENCE_NOT_OWNED' using errcode='42501'; end if;
 if e.status<>'pending' then raise exception 'EVIDENCE_STALE'; end if;
 select * into obj from storage.objects where bucket_id='service-evidence' and name=e.storage_path;
 if not found or coalesce((obj.metadata->>'size')::bigint,0) not between 1 and 3145728 or obj.metadata->>'mimetype'<>'image/jpeg' then raise exception 'INVALID_EVIDENCE_OBJECT'; end if;
 update public.service_order_evidence set status='active',byte_size=(obj.metadata->>'size')::bigint where id=e.id returning * into e;
 insert into public.service_order_evidence_events(evidence_id,service_order_id,business_id,event_type,note,actor_user_id) values(e.id,e.service_order_id,e.business_id,'added',e.note,auth.uid()); return to_jsonb(e);
end $$;
create function public.delete_service_evidence(p_business_id uuid,p_evidence_id uuid,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.service_order_evidence; o public.service_orders; n text; begin
 select * into e from public.service_order_evidence where id=p_evidence_id and business_id=p_business_id for update;
 if not found then raise exception 'EVIDENCE_NOT_OWNED' using errcode='42501'; end if;
 select * into o from public.service_orders where id=e.service_order_id and business_id=p_business_id for update;
 if not exists(select 1 from public.businesses where id=p_business_id and owner_id=auth.uid()) then raise exception 'BUSINESS_NOT_OWNED' using errcode='42501'; end if;
 if e.status<>'active' or e.locked_at is not null or o.status not in ('pending','in_progress','paused') then raise exception 'EVIDENCE_IMMUTABLE'; end if;
 n:=nullif(btrim(p_reason),''); if n is null or char_length(n) not between 2 and 500 then raise exception 'DELETE_REASON_REQUIRED'; end if;
 update public.service_order_evidence set status='deleted',deleted_at=clock_timestamp(),deleted_by=auth.uid() where id=e.id returning * into e;
 insert into public.service_order_evidence_events(evidence_id,service_order_id,business_id,event_type,note,actor_user_id) values(e.id,e.service_order_id,e.business_id,'deleted',n,auth.uid()); return jsonb_build_object('storagePath',e.storage_path);
end $$;
create function public.cancel_service_evidence_reservation(p_business_id uuid,p_evidence_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 delete from public.service_order_evidence where id=p_evidence_id and business_id=p_business_id and created_by=auth.uid() and status='pending';
 if not found then raise exception 'EVIDENCE_RESERVATION_STALE'; end if;
end $$;
create function public.lock_service_evidence_after_completion() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if new.event_type='completed' then
  with locked as (update public.service_order_evidence set locked_at=new.created_at where service_order_id=new.service_order_id and status='active' and locked_at is null returning *)
  insert into public.service_order_evidence_events(evidence_id,service_order_id,business_id,event_type,note,actor_user_id) select id,service_order_id,business_id,'locked','Ordem concluída',new.actor_user_id from locked;
 end if; return new; end $$;
create trigger service_evidence_lock_on_completion after insert on public.service_order_events for each row execute function public.lock_service_evidence_after_completion();
revoke execute on function public.reserve_service_evidence(uuid,uuid,text,text),public.finalize_service_evidence(uuid,uuid),public.delete_service_evidence(uuid,uuid,text),public.cancel_service_evidence_reservation(uuid,uuid) from public,anon;
grant execute on function public.reserve_service_evidence(uuid,uuid,text,text),public.finalize_service_evidence(uuid,uuid),public.delete_service_evidence(uuid,uuid,text),public.cancel_service_evidence_reservation(uuid,uuid) to authenticated;
