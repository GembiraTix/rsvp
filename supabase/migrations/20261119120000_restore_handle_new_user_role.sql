-- Restores the roles-aware handle_new_user() from 20261018140329_roles.sql.
-- 20261020063745_handle_new_user_update.sql overwrote it with a version that
-- only copies name, dropping role mirroring into public.users.
-- public.users.role stays the source of truth: custom_access_token_hook and
-- is_admin() both read it.

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
