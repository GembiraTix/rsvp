-- RSVP-49: per-attendee data on tickets, registration dedupe

create type "public"."attendee_gender" as enum ('laki-laki', 'perempuan');

create type "public"."identity_type" as enum ('ktp', 'sim', 'paspor', 'kartu_pelajar');

alter table "public"."tickets"
  add column "identity_type" "public"."identity_type",
  add column "identity_number" text,
  add column "whatsapp" text,
  add column "gender" "public"."attendee_gender";

alter table "public"."order_items" drop column "attendee_data";

create unique index "rsvps_event_email_key"
  on "public"."rsvps" using btree ("event_id", lower("email"));
