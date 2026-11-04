update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}' where auth.users.email = 'efraim@test.com';
update auth.users set raw_user_meta_data = raw_user_meta_data || '{"role": "super_admin"}' where auth.users.email = 'efraim@test.com';
update public.users set role='super_admin' where email = 'efraim@test.com';