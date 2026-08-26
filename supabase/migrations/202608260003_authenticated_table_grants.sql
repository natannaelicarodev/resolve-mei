grant usage on schema public to authenticated;

revoke all privileges on table public.profiles from public, anon;
revoke all privileges on table public.businesses from public, anon;

revoke all privileges on table public.profiles from authenticated;
revoke all privileges on table public.businesses from authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.businesses to authenticated;
