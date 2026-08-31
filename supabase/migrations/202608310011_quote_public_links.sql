create extension if not exists pgcrypto with schema extensions;

alter table public.quotes
add column if not exists shared_version integer not null default 0
check (shared_version >= 0);

create table if not exists public.quote_public_links (
  id uuid primary key default extensions.gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  version integer not null check (version > 0),
  token_hash bytea not null unique check (octet_length(token_hash) = 32),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  responded_at timestamptz,
  created_by uuid not null,
  check (expires_at > issued_at),
  check (revoked_at is null or revoked_at >= issued_at),
  check (responded_at is null or responded_at >= issued_at),
  unique (quote_id, version)
);

create unique index if not exists quote_public_links_one_current_idx
on public.quote_public_links (quote_id) where revoked_at is null;
create index if not exists quote_public_links_owner_state_idx
on public.quote_public_links (business_id, quote_id, issued_at desc);

create table if not exists public.quote_client_decisions (
  id uuid primary key default extensions.gen_random_uuid(),
  link_id uuid not null unique references public.quote_public_links(id) on delete restrict,
  quote_id uuid not null references public.quotes(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  version integer not null check (version > 0),
  decision text not null check (decision in ('approved', 'rejected')),
  responder_name text not null check (char_length(btrim(responder_name)) between 2 and 120),
  reason text check (reason is null or char_length(reason) <= 1000),
  source text not null default 'client_link' check (source = 'client_link'),
  responded_at timestamptz not null default now(),
  unique (quote_id, version)
);

create index if not exists quote_client_decisions_owner_idx
on public.quote_client_decisions (business_id, quote_id, responded_at desc);

create table if not exists public.quote_status_events (
  id bigint generated always as identity primary key,
  quote_id uuid not null references public.quotes(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  link_id uuid references public.quote_public_links(id) on delete restrict,
  version integer,
  event_type text not null check (
    event_type in ('link_published', 'link_revoked', 'client_approved',
      'client_rejected', 'manual_status_change', 'terms_changed')
  ),
  from_status text,
  to_status text,
  actor_user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists quote_status_events_owner_idx
on public.quote_status_events (business_id, quote_id, created_at desc);

create table if not exists public.quote_public_rate_limits (
  token_hash bytea not null,
  action text not null check (action in ('read', 'respond')),
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (token_hash, action, window_started_at)
);

alter table public.quote_public_links enable row level security;
alter table public.quote_client_decisions enable row level security;
alter table public.quote_status_events enable row level security;
alter table public.quote_public_rate_limits enable row level security;

create policy quote_public_links_select_owner on public.quote_public_links
for select to authenticated using (
  exists (select 1 from public.businesses b
    where b.id = quote_public_links.business_id and b.owner_id = (select auth.uid()))
);
create policy quote_client_decisions_select_owner on public.quote_client_decisions
for select to authenticated using (
  exists (select 1 from public.businesses b
    where b.id = quote_client_decisions.business_id and b.owner_id = (select auth.uid()))
);
create policy quote_status_events_select_owner on public.quote_status_events
for select to authenticated using (
  exists (select 1 from public.businesses b
    where b.id = quote_status_events.business_id and b.owner_id = (select auth.uid()))
);

revoke all on table public.quote_public_links from public, anon, authenticated;
revoke all on table public.quote_client_decisions from public, anon, authenticated;
revoke all on table public.quote_status_events from public, anon, authenticated;
revoke all on table public.quote_public_rate_limits from public, anon, authenticated;

grant select on table public.quote_public_links to authenticated;
grant select on table public.quote_client_decisions to authenticated;
grant select on table public.quote_status_events to authenticated;

create or replace function public.consume_quote_public_rate_limit(
  p_token_hash bytea, p_action text, p_limit integer
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare v_window timestamptz := date_bin('5 minutes', clock_timestamp(), '2000-01-01');
declare v_count integer;
begin
  if p_action not in ('read', 'respond') or p_limit not between 1 and 100 then return false; end if;
  insert into public.quote_public_rate_limits(token_hash, action, window_started_at)
  values (p_token_hash, p_action, v_window)
  on conflict (token_hash, action, window_started_at) do update
    set request_count = public.quote_public_rate_limits.request_count + 1
  returning request_count into v_count;
  delete from public.quote_public_rate_limits where window_started_at < now() - interval '1 day';
  return v_count <= p_limit;
end;
$$;

create or replace function public.issue_quote_public_link(p_quote_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_quote public.quotes; v_business public.businesses; v_token text;
  v_hash bytea; v_version integer; v_expires timestamptz; v_link public.quote_public_links;
  v_snapshot jsonb; v_previous_status text;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED' using errcode = '42501'; end if;
  select q.* into v_quote from public.quotes q join public.businesses b on b.id = q.business_id
  where q.id = p_quote_id and b.owner_id = auth.uid() for update of q;
  if not found then raise exception 'QUOTE_NOT_OWNED' using errcode = '42501'; end if;
  if v_quote.status not in ('draft', 'sent') then raise exception 'QUOTE_NOT_PUBLISHABLE'; end if;
  v_expires := least(
    clock_timestamp() + interval '7 days',
    (v_quote.valid_until + 1)::timestamp at time zone 'America/Sao_Paulo'
  );
  if v_expires <= clock_timestamp() then raise exception 'QUOTE_EXPIRED'; end if;
  select * into v_business from public.businesses where id = v_quote.business_id;
  update public.quote_public_links set revoked_at = clock_timestamp()
    where quote_id = v_quote.id and revoked_at is null;
  v_version := v_quote.shared_version + 1;
  v_token := rtrim(translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/', '-_'), '=');
  v_hash := extensions.digest(v_token, 'sha256');
  v_snapshot := jsonb_build_object(
    'provider', jsonb_strip_nulls(jsonb_build_object(
      'businessName', v_business.business_name,
      'phone', nullif(btrim(v_business.professional_phone), ''),
      'email', nullif(btrim(v_business.email), '')
    )),
    'client', jsonb_build_object('name', v_quote.client_name_snapshot),
    'quoteNumber', v_quote.quote_number,
    'version', v_version,
    'issuedOn', v_quote.issued_on,
    'validUntil', v_quote.valid_until,
    'status', 'sent',
    'items', (select coalesce(jsonb_agg(jsonb_build_object(
      'name', i.name_snapshot, 'description', i.description_snapshot,
      'quantity', i.quantity, 'unitPriceCents', i.unit_price_cents,
      'totalCents', i.item_total_cents
    ) order by i.position), '[]'::jsonb) from public.quote_items i where i.quote_id = v_quote.id),
    'subtotalCents', v_quote.subtotal_cents,
    'discountCents', v_quote.discount_cents,
    'totalCents', v_quote.total_cents
  );
  if jsonb_array_length(v_snapshot->'items') = 0 then raise exception 'QUOTE_REQUIRES_ITEMS'; end if;
  insert into public.quote_public_links(
    quote_id, business_id, version, token_hash, snapshot, expires_at, created_by
  ) values (
    v_quote.id, v_quote.business_id, v_version, v_hash, v_snapshot, v_expires, auth.uid()
  ) returning * into v_link;
  v_previous_status := v_quote.status;
  perform set_config('app.quote_status_origin', 'link', true);
  update public.quotes set status = 'sent', shared_version = v_version
    where id = v_quote.id;
  insert into public.quote_status_events(
    quote_id, business_id, link_id, version, event_type, from_status, to_status, actor_user_id
  ) values (
    v_quote.id, v_quote.business_id, v_link.id, v_version, 'link_published',
    v_previous_status, 'sent', auth.uid()
  );
  return jsonb_build_object(
    'token', v_token, 'version', v_version, 'expiresAt', v_expires,
    'state', 'active', 'quoteStatus', 'sent'
  );
end;
$$;

create or replace function public.revoke_quote_public_link(p_quote_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_quote public.quotes; v_link public.quote_public_links;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED' using errcode = '42501'; end if;
  select q.* into v_quote from public.quotes q join public.businesses b on b.id = q.business_id
  where q.id = p_quote_id and b.owner_id = auth.uid() for update of q;
  if not found then raise exception 'QUOTE_NOT_OWNED' using errcode = '42501'; end if;
  update public.quote_public_links set revoked_at = clock_timestamp()
  where quote_id = v_quote.id and revoked_at is null returning * into v_link;
  if found then
    insert into public.quote_status_events(
      quote_id, business_id, link_id, version, event_type, actor_user_id
    ) values (v_quote.id, v_quote.business_id, v_link.id, v_link.version, 'link_revoked', auth.uid());
  end if;
  return jsonb_build_object('state', case when found then 'revoked' else 'none' end);
end;
$$;

create or replace function public.get_quote_public_link_state(p_quote_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_quote public.quotes; v_link public.quote_public_links; v_decision public.quote_client_decisions;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED' using errcode = '42501'; end if;
  select q.* into v_quote from public.quotes q join public.businesses b on b.id = q.business_id
  where q.id = p_quote_id and b.owner_id = auth.uid();
  if not found then raise exception 'QUOTE_NOT_OWNED' using errcode = '42501'; end if;
  select * into v_link from public.quote_public_links where quote_id = v_quote.id
    order by issued_at desc limit 1;
  if not found then return jsonb_build_object('state', 'none'); end if;
  select * into v_decision from public.quote_client_decisions where link_id = v_link.id;
  return jsonb_strip_nulls(jsonb_build_object(
    'state', case when v_link.revoked_at is not null then 'revoked'
      when v_link.expires_at <= clock_timestamp() then 'expired'
      when v_decision.id is not null then 'responded' else 'active' end,
    'version', v_link.version, 'issuedAt', v_link.issued_at,
    'expiresAt', v_link.expires_at, 'revokedAt', v_link.revoked_at,
    'decision', case when v_decision.id is null then null else jsonb_build_object(
      'value', v_decision.decision, 'responderName', v_decision.responder_name,
      'reason', v_decision.reason, 'respondedAt', v_decision.responded_at,
      'source', v_decision.source, 'version', v_decision.version
    ) end
  ));
end;
$$;

create or replace function public.resolve_public_quote(p_token text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_hash bytea; v_link public.quote_public_links; v_decision public.quote_client_decisions;
begin
  if p_token is null or octet_length(p_token) > 256 then
    return jsonb_build_object('state', 'unavailable');
  end if;
  v_hash := extensions.digest(p_token, 'sha256');
  if not public.consume_quote_public_rate_limit(v_hash, 'read', 60) then
    return jsonb_build_object('state', 'unavailable');
  end if;
  if p_token !~ '^[A-Za-z0-9_-]{43}$' then
    return jsonb_build_object('state', 'unavailable');
  end if;
  select * into v_link from public.quote_public_links where token_hash = v_hash;
  if not found or v_link.revoked_at is not null or v_link.expires_at <= clock_timestamp() then
    return jsonb_build_object('state', 'unavailable');
  end if;
  select * into v_decision from public.quote_client_decisions where link_id = v_link.id;
  return jsonb_strip_nulls(jsonb_build_object(
    'state', case when v_decision.id is null then 'available' else 'responded' end,
    'quote', v_link.snapshot,
    'expiresAt', v_link.expires_at,
    'decision', case when v_decision.id is null then null else jsonb_build_object(
      'value', v_decision.decision, 'responderName', v_decision.responder_name,
      'reason', v_decision.reason, 'respondedAt', v_decision.responded_at,
      'version', v_decision.version
    ) end
  ));
end;
$$;

create or replace function public.respond_public_quote(
  p_token text, p_decision text, p_responder_name text, p_reason text default null
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_hash bytea; v_link public.quote_public_links; v_quote public.quotes;
declare v_existing public.quote_client_decisions; v_name text; v_reason text;
begin
  if p_token is null or octet_length(p_token) > 256 then
    return jsonb_build_object('state', 'unavailable');
  end if;
  v_hash := extensions.digest(p_token, 'sha256');
  if not public.consume_quote_public_rate_limit(v_hash, 'respond', 10) then
    return jsonb_build_object('state', 'unavailable');
  end if;
  if p_token !~ '^[A-Za-z0-9_-]{43}$' then
    return jsonb_build_object('state', 'unavailable');
  end if;
  if p_decision not in ('approved', 'rejected') then raise exception 'INVALID_DECISION'; end if;
  v_name := btrim(regexp_replace(coalesce(p_responder_name, ''), '\s+', ' ', 'g'));
  v_reason := nullif(btrim(coalesce(p_reason, '')), '');
  if char_length(v_name) not between 2 and 120 then raise exception 'INVALID_RESPONDER_NAME'; end if;
  if v_reason is not null and char_length(v_reason) > 1000 then raise exception 'INVALID_REASON'; end if;
  select * into v_link from public.quote_public_links where token_hash = v_hash for update;
  if not found or v_link.revoked_at is not null or v_link.expires_at <= clock_timestamp() then
    return jsonb_build_object('state', 'unavailable');
  end if;
  select * into v_quote from public.quotes where id = v_link.quote_id for update;
  select * into v_existing from public.quote_client_decisions where link_id = v_link.id;
  if found then return jsonb_build_object(
    'state', 'responded', 'decision', v_existing.decision,
    'responderName', v_existing.responder_name, 'respondedAt', v_existing.responded_at
  ); end if;
  if v_link.version <> v_quote.shared_version or v_quote.status <> 'sent' then
    return jsonb_build_object('state', 'unavailable');
  end if;
  insert into public.quote_client_decisions(
    link_id, quote_id, business_id, version, decision, responder_name, reason
  ) values (
    v_link.id, v_quote.id, v_quote.business_id, v_link.version,
    p_decision, v_name, v_reason
  );
  update public.quote_public_links set responded_at = clock_timestamp() where id = v_link.id;
  perform set_config('app.quote_status_origin', 'client', true);
  update public.quotes set status = p_decision where id = v_quote.id;
  insert into public.quote_status_events(
    quote_id, business_id, link_id, version, event_type, from_status, to_status
  ) values (
    v_quote.id, v_quote.business_id, v_link.id, v_link.version,
    case when p_decision = 'approved' then 'client_approved' else 'client_rejected' end,
    v_quote.status, p_decision
  );
  return jsonb_build_object(
    'state', 'responded', 'decision', p_decision,
    'responderName', v_name, 'respondedAt', clock_timestamp()
  );
end;
$$;

create or replace function public.audit_manual_quote_status_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_link public.quote_public_links;
begin
  if old.status = new.status or current_setting('app.quote_status_origin', true) in ('link', 'client') then
    return new;
  end if;
  if new.status in ('approved', 'rejected', 'canceled') then
    update public.quote_public_links set revoked_at = clock_timestamp()
      where quote_id = old.id and revoked_at is null and responded_at is null
      returning * into v_link;
  end if;
  insert into public.quote_status_events(
    quote_id, business_id, link_id, version, event_type,
    from_status, to_status, actor_user_id
  ) values (
    old.id, old.business_id, v_link.id, v_link.version, 'manual_status_change',
    old.status, new.status, auth.uid()
  );
  return new;
end;
$$;

drop trigger if exists quotes_audit_manual_status on public.quotes;
create trigger quotes_audit_manual_status after update of status on public.quotes
for each row execute function public.audit_manual_quote_status_change();

create or replace function public.invalidate_quote_public_link_on_terms_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if row(new.client_id, new.valid_until, new.subtotal_cents, new.discount_cents,
      new.total_cents, new.notes, new.client_name_snapshot, new.client_phone_snapshot,
      new.client_email_snapshot)
    is distinct from
    row(old.client_id, old.valid_until, old.subtotal_cents, old.discount_cents,
      old.total_cents, old.notes, old.client_name_snapshot, old.client_phone_snapshot,
      old.client_email_snapshot) then
    update public.quote_public_links set revoked_at = clock_timestamp()
      where quote_id = old.id and revoked_at is null and responded_at is null;
    if found then
      new.shared_version := old.shared_version + 1;
      insert into public.quote_status_events(
        quote_id, business_id, version, event_type, actor_user_id
      ) values (old.id, old.business_id, new.shared_version, 'terms_changed', auth.uid());
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists quotes_invalidate_public_link on public.quotes;
create trigger quotes_invalidate_public_link before update on public.quotes
for each row execute function public.invalidate_quote_public_link_on_terms_change();

create or replace function public.invalidate_quote_public_link_on_item_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare v_quote_id uuid := coalesce(new.quote_id, old.quote_id); v_business_id uuid;
begin
  select business_id into v_business_id from public.quotes where id = v_quote_id;
  update public.quote_public_links set revoked_at = clock_timestamp()
    where quote_id = v_quote_id and revoked_at is null and responded_at is null;
  if found then
    update public.quotes set shared_version = shared_version + 1 where id = v_quote_id;
    insert into public.quote_status_events(quote_id, business_id, event_type, actor_user_id)
    values (v_quote_id, v_business_id, 'terms_changed', auth.uid());
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists quote_items_invalidate_public_link on public.quote_items;
create trigger quote_items_invalidate_public_link after insert or update or delete on public.quote_items
for each row execute function public.invalidate_quote_public_link_on_item_change();

revoke execute on function public.consume_quote_public_rate_limit(bytea, text, integer) from public, anon, authenticated;
revoke execute on function public.issue_quote_public_link(uuid) from public, anon;
revoke execute on function public.revoke_quote_public_link(uuid) from public, anon;
revoke execute on function public.get_quote_public_link_state(uuid) from public, anon;
grant execute on function public.issue_quote_public_link(uuid) to authenticated;
grant execute on function public.revoke_quote_public_link(uuid) to authenticated;
grant execute on function public.get_quote_public_link_state(uuid) to authenticated;
revoke execute on function public.resolve_public_quote(text) from public, authenticated;
revoke execute on function public.respond_public_quote(text, text, text, text) from public, authenticated;
grant execute on function public.resolve_public_quote(text) to anon;
grant execute on function public.respond_public_quote(text, text, text, text) to anon;
