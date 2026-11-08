-- The rename preserves the live free event's existing organization answers.
-- Singular on purpose: when multi-question support lands, add a jsonb
-- custom_question_answers column and backfill from this one.
alter table "public"."rsvps" rename column "organization" to "custom_question_answer";

alter table "public"."rsvps"
  add column "identity_type" "public"."identity_type",
  add column "identity_number" text,
  add column "whatsapp" text,
  add column "gender" "public"."attendee_gender";

alter table "public"."events"
  add column "custom_question_label" text,
  add column "custom_question_required" boolean not null default false;

-- Events that already collected answers keep collecting them under the old label
update "public"."events" e
set "custom_question_label" = 'Organisasi / Latar Belakang'
where exists (
  select 1 from "public"."rsvps" r
  where r.event_id = e.id and r.custom_question_answer is not null
);
