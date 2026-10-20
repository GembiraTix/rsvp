create type "public"."user_role" as enum ('user', 'admin', 'super_admin');

alter table "public"."users" add column "role" public.user_role not null default 'user'::public.user_role;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
  DECLARE
    claims jsonb;
    user_role public.user_role;
  BEGIN
    SELECT role INTO user_role
    FROM public.users
    WHERE id = (event ->> 'user_id')::uuid;

    claims := event -> 'claims';

    IF user_role IS NOT NULL THEN
      -- inject role into claim
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
      -- Also mirror into app_metadata so standard libraries / context pick it up
      claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(user_role));
    ELSE
      claims := jsonb_set(claims, '{user_role}', '"user"');
      claims := jsonb_set(claims, '{app_metadata,role}', '"user"');
    END IF;

    event := jsonb_set(event, '{claims}', claims);
    RETURN event;
  END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    DECLARE
      extracted_role text;
      assigned_role public.user_role := 'user'::public.user_role;
    BEGIN
      -- Check raw_app_meta_data first, fallback to raw_user_meta_data
      extracted_role := COALESCE(
        new.raw_app_meta_data ->> 'role',
        new.raw_user_meta_data ->> 'role'
      );

      -- validate whether the extracted role matches the enum values
      IF extracted_role IN ('user', 'admin', 'super_admin') THEN
        assigned_role := extracted_role::public.user_role;
      END IF;

      INSERT INTO public.users (id, email, name, role)
      VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
        assigned_role
      )
      ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            name = COALESCE(EXCLUDED.name, public.users.name),
            role = CASE
              WHEN EXCLUDED.role != 'user'::public.user_role THEN EXCLUDED.role
              ELSE public.users.role
            END;

      RETURN new;
    END;
    $function$
;

grant select on table "public"."users" to "supabase_auth_admin";



