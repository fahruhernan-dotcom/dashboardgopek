-- =============================================================================
-- GOPEK / SEMBAKO OS - REGISTER & SET USER MUHILHAM4141@GMAIL.COM AS ADMIN
-- Jalankan script ini di Supabase SQL Editor:
-- (Supabase Dashboard -> SQL Editor -> Run)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID := '00000000-0000-0000-0000-000000000002';
    v_email TEXT := 'muhilham4141@gmail.com';
    v_password TEXT := 'admin123';
BEGIN
    -- 1. Ensure Default Tenant Exists
    IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = v_tenant_id) THEN
        INSERT INTO tenants (id, owner_id, business_name, business_type, subscription_plan)
        VALUES (v_tenant_id, v_tenant_id, 'Broker Dashboard Sembako', 'distributor_sembako', 'pro');
    END IF;

    -- 2. Find or Create Auth User in auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email LIMIT 1;

    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();

        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Muh Ilham"}',
            NOW(),
            NOW()
        );

        INSERT INTO auth.identities (
            id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            v_user_id::text,
            v_user_id,
            jsonb_build_object('sub', v_user_id::text, 'email', v_email),
            'email',
            NOW(),
            NOW(),
            NOW()
        );
    ELSE
        -- Update password for existing user
        UPDATE auth.users 
        SET encrypted_password = crypt(v_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW())
        WHERE id = v_user_id;
    END IF;

    -- 3. Update or Insert Profile Record
    IF EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = v_user_id OR email = v_email) THEN
        UPDATE profiles 
        SET role = 'admin',
            app_role = 'admin',
            user_type = 'broker',
            sub_type = 'distributor_sembako',
            tenant_id = v_tenant_id,
            full_name = COALESCE(full_name, 'Muh Ilham'),
            onboarded = true
        WHERE auth_user_id = v_user_id OR email = v_email;
    ELSE
        INSERT INTO profiles (
            id, auth_user_id, tenant_id, full_name, email, role, app_role, user_type, sub_type, business_name, onboarded
        ) VALUES (
            gen_random_uuid(),
            v_user_id,
            v_tenant_id,
            'Muh Ilham',
            v_email,
            'admin',
            'admin',
            'broker',
            'distributor_sembako',
            'Broker Dashboard Sembako',
            true
        );
    END IF;

    RAISE NOTICE 'Akun % berhasil didaftarkan sebagai ADMIN dengan password %!', v_email, v_password;
END $$;
