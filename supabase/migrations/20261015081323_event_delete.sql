alter table "public"."events" add column "deleted_at" timestamp with time zone;

CREATE INDEX idx_events_deleted_at ON public.events USING btree (deleted_at);


  create policy "Enable delete for authenticated users only"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (true);



  create policy "Enable insert for authenticated users only"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Enable read access for all users"
  on "storage"."objects"
  as permissive
  for select
  to public
using (true);



  create policy "Enable update for authenticated users only"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (true)
with check (true);




