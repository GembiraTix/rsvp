alter table "public"."events" add column "created_by" uuid not null;

alter table "public"."events" add constraint "events_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."events" validate constraint "events_created_by_fkey";


  create policy "Enable delete for authenticated users"
  on "public"."rsvps"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "Enable insert for all users"
  on "public"."rsvps"
  as permissive
  for insert
  to public
with check (true);



  create policy "Enable read for all users"
  on "public"."rsvps"
  as permissive
  for select
  to public
using (true);



  create policy "Enable update for all users"
  on "public"."rsvps"
  as permissive
  for update
  to public
using (true)
with check (true);


-- CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();



