-- =============================================================================
-- GOPEK / SEMBAKO OS - SET USER FAHRUHERNANSAKTI@GMAIL.COM AS DEV SUPERADMIN
-- Jalankan script ini di Supabase SQL Editor:
-- (Supabase Dashboard -> SQL Editor -> Run)
-- =============================================================================

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 1. Ensure Default Tenant Exists
    IF NOT EXISTS (SELECT 1 FROM tenants WHERE id = '00000000-0000-0000-0000-000000000002') THEN
        INSERT INTO tenants (id, owner_id, business_name)
        VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Broker Dashboard Sembako');
    END IF;

    -- 2. Find Auth User ID for fahruhernansakti@gmail.com
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'fahruhernansakti@gmail.com' LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        -- Update or Insert profile safely without ON CONFLICT constraints
        IF EXISTS (SELECT 1 FROM profiles WHERE auth_user_id = v_user_id OR email = 'fahruhernansakti@gmail.com') THEN
            UPDATE profiles 
            SET role = 'dev',
                app_role = 'dev',
                user_type = 'broker',
                sub_type = 'distributor_sembako',
                tenant_id = '00000000-0000-0000-0000-000000000002',
                onboarded = true
            WHERE auth_user_id = v_user_id OR email = 'fahruhernansakti@gmail.com';
        ELSE
            INSERT INTO profiles (
                id, auth_user_id, tenant_id, full_name, email, role, app_role, user_type, sub_type, business_name, onboarded
            ) VALUES (
                gen_random_uuid(),
                v_user_id,
                '00000000-0000-0000-0000-000000000002',
                'Fahru Hernan Sakti',
                'fahruhernansakti@gmail.com',
                'dev',
                'dev',
                'broker',
                'distributor_sembako',
                'Broker Dashboard Sembako',
                true
            );
        END IF;

        -- 3. Add to tenant_memberships if table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_memberships') THEN
            IF NOT EXISTS (SELECT 1 FROM tenant_memberships WHERE tenant_id = '00000000-0000-0000-0000-000000000002' AND user_id = v_user_id) THEN
                INSERT INTO tenant_memberships (tenant_id, user_id, role)
                VALUES ('00000000-0000-0000-0000-000000000002', v_user_id, 'owner');
            END IF;
        END IF;

        RAISE NOTICE 'Akun fahruhernansakti@gmail.com berhasil dijadikan DEV Superadmin!';
    ELSE
        RAISE NOTICE 'User fahruhernansakti@gmail.com belum ada di auth.users. Membuat user di auth.users...';
    END IF;
END $$;
