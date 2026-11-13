-- Global platform settings (single row), currently only the admin fee.
create table "public"."app_settings" (
  "id" smallint not null default 1,
  "admin_fee" integer not null default 0,
  "updated_at" timestamp with time zone not null default now(),
  constraint "app_settings_id_check" check (id = 1),
  constraint "app_settings_admin_fee_check" check (admin_fee >= 0),
  constraint "app_settings_pkey" primary key ("id")
);

insert into "public"."app_settings" ("id") values (1);

alter table "public"."app_settings" enable row level security;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
    and role = 'super_admin'
  );
$$;

create policy "Anyone can read app settings"
  on public.app_settings
  for select
  to anon, authenticated
  using (true);

create policy "Super admins can update app settings"
  on public.app_settings
  for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

grant select on table "public"."app_settings" to "anon";

grant select on table "public"."app_settings" to "authenticated";

grant update on table "public"."app_settings" to "authenticated";

grant select, update on table "public"."app_settings" to "service_role";

-- Amounts are whole rupiah, drop the _cents suffix.
-- admin_fee_fixed: null = inherit the global fee, a number = per-event override
alter table "public"."event_payment_settings" rename column "admin_fee_fixed_cents" to "admin_fee_fixed";
alter table "public"."event_payment_settings" alter column "admin_fee_fixed" drop not null;
alter table "public"."event_payment_settings" add constraint "event_payment_settings_admin_fee_fixed_check" check (admin_fee_fixed is null or admin_fee_fixed >= 0);
alter table "public"."event_payment_settings" rename column "refund_default_cents" to "refund_default";
alter table "public"."event_payment_settings" drop column "admin_fee_mode";
alter table "public"."event_payment_settings" drop column "admin_fee_percent";

-- Fee resolution runs under the buyer's JWT, so read must not be admin-only
create policy "Anyone can read event payment settings"
  on public.event_payment_settings
  for select
  to anon, authenticated
  using (true);
