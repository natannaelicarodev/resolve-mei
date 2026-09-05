alter table public.businesses
  add column if not exists onboarding_priority text,
  add column if not exists onboarding_focus_consumed_at timestamptz;

alter table public.businesses
  drop constraint if exists businesses_onboarding_priority_check;

alter table public.businesses
  add constraint businesses_onboarding_priority_check check (
    onboarding_priority is null or
    onboarding_priority in ('quotes', 'collections', 'agenda', 'profit')
  );

comment on column public.businesses.onboarding_priority is
  'Single priority selected during onboarding for the first contextual Home action.';

comment on column public.businesses.onboarding_focus_consumed_at is
  'When the temporary post-onboarding contextual action was opened or dismissed.';
