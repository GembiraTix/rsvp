CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
  declare
    claims jsonb;
    username text;
begin
  select raw_user_meta_data->>'name'::text into username from auth.users where email=new.email;

  insert into public.users (id, email, name)
  values (new.id, new.email, username);
  return new;
end;
$function$
;

