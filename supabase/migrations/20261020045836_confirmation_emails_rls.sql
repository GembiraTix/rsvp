drop policy "Enable insert for authenticated users" on "public"."confirmation_emails";

drop policy "Enable read for authenticated users" on "public"."confirmation_emails";

drop policy "Enable update for authenticated users" on "public"."confirmation_emails";


  create policy "Enable insert for authenticated users"
  on "public"."confirmation_emails"
  as permissive
  for insert
  to public
with check (true);



  create policy "Enable read for authenticated users"
  on "public"."confirmation_emails"
  as permissive
  for select
  to public
using (true);



  create policy "Enable update for authenticated users"
  on "public"."confirmation_emails"
  as permissive
  for update
  to public
using (true)
with check (true);



