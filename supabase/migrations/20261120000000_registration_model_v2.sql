-- RSVP-71: registration model v2 — one registration per ticket, orderer data on orders

alter table "public"."rsvps"
  add column "ticket_id" bigint references "public"."tickets"("id");

-- one paid registration per ticket; free RSVPs keep one email per event
create unique index "rsvps_ticket_id_key"
  on "public"."rsvps" ("ticket_id") where "ticket_id" is not null;

create unique index "rsvps_free_event_email_key"
  on "public"."rsvps" ("event_id", lower("email")) where "ticket_id" is null;

drop index "public"."rsvps_event_email_key";

-- nullable: legacy orders have no orderer data; required-ness enforced in zod for new orders
alter table "public"."orders"
  add column "orderer_name" text,
  add column "orderer_email" text,
  add column "orderer_whatsapp" text,
  add column "orderer_identity_type" "public"."identity_type",
  add column "orderer_identity_number" text;

-- order-level e-ticket emails log against the order, not an rsvp
alter table "public"."confirmation_emails"
  alter column "rsvp_id" drop not null,
  add column "order_id" uuid references "public"."orders"("id");
