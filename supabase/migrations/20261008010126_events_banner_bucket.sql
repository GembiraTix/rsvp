CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


  create policy "Give authenticated users admin access 1faluac_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'event-banners'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Give authenticated users admin access 1faluac_1"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'event-banners'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Give authenticated users admin access 1faluac_3"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'event-banners'::text) AND (auth.role() = 'authenticated'::text)));




