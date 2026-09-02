-- Harden evidence immutability independently from the service-event trigger.
-- A completion protects every evidence item created before that completion,
-- while evidence added after a reopen remains editable until the next one.

update public.service_order_evidence e
set locked_at = (
  select min(ev.created_at)
  from public.service_order_events ev
  where ev.service_order_id = e.service_order_id
    and ev.event_type = 'completed'
    and ev.created_at >= e.created_at
)
where e.status = 'active'
  and e.locked_at is null
  and exists (
    select 1 from public.service_order_events ev
    where ev.service_order_id = e.service_order_id
      and ev.event_type = 'completed'
      and ev.created_at >= e.created_at
  );

insert into public.service_order_evidence_events(
  evidence_id, service_order_id, business_id, event_type, note, actor_user_id, created_at
)
select e.id, e.service_order_id, e.business_id, 'locked', 'Ordem concluída',
  completion.actor_user_id, e.locked_at
from public.service_order_evidence e
join lateral (
  select ev.actor_user_id
  from public.service_order_events ev
  where ev.service_order_id = e.service_order_id
    and ev.event_type = 'completed'
    and ev.created_at = e.locked_at
  order by ev.id
  limit 1
) completion on true
where e.status = 'active'
  and e.locked_at is not null
  and not exists (
    select 1 from public.service_order_evidence_events audit
    where audit.evidence_id = e.id and audit.event_type = 'locked'
  );

create or replace function public.lock_service_evidence_on_order_completion()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  with locked as (
    update public.service_order_evidence
    set locked_at = clock_timestamp()
    where service_order_id = new.id
      and status = 'active'
      and locked_at is null
    returning *
  )
  insert into public.service_order_evidence_events(
    evidence_id, service_order_id, business_id, event_type, note, actor_user_id
  )
  select id, service_order_id, business_id, 'locked', 'Ordem concluída', auth.uid()
  from locked;
  return new;
end;
$$;

drop trigger if exists service_evidence_lock_on_order_completion on public.service_orders;
create trigger service_evidence_lock_on_order_completion
after update of status on public.service_orders
for each row
when (new.status = 'completed' and old.status is distinct from new.status)
execute function public.lock_service_evidence_on_order_completion();

create or replace function public.delete_service_evidence(
  p_business_id uuid, p_evidence_id uuid, p_reason text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare e public.service_order_evidence; o public.service_orders; n text;
begin
  select * into e from public.service_order_evidence
    where id = p_evidence_id and business_id = p_business_id for update;
  if not found then raise exception 'EVIDENCE_NOT_OWNED' using errcode = '42501'; end if;
  select * into o from public.service_orders
    where id = e.service_order_id and business_id = p_business_id for update;
  if not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  if e.status <> 'active' or e.locked_at is not null
    or o.status not in ('pending', 'in_progress', 'paused')
    or exists (
      select 1 from public.service_order_events ev
      where ev.service_order_id = e.service_order_id
        and ev.event_type = 'completed'
        and ev.created_at >= e.created_at
    )
  then raise exception 'EVIDENCE_IMMUTABLE'; end if;
  n := nullif(btrim(p_reason), '');
  if n is null or char_length(n) not between 2 and 500
    then raise exception 'DELETE_REASON_REQUIRED'; end if;
  update public.service_order_evidence
    set status = 'deleted', deleted_at = clock_timestamp(), deleted_by = auth.uid()
    where id = e.id returning * into e;
  insert into public.service_order_evidence_events(
    evidence_id, service_order_id, business_id, event_type, note, actor_user_id
  ) values (e.id, e.service_order_id, e.business_id, 'deleted', n, auth.uid());
  return jsonb_build_object('storagePath', e.storage_path);
end;
$$;

revoke execute on function public.delete_service_evidence(uuid, uuid, text) from public, anon;
grant execute on function public.delete_service_evidence(uuid, uuid, text) to authenticated;
