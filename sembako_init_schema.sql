-- ==============================================================================
-- TERNAKOS / SEMBAKO CLIENT - COMPLETE DATABASE MIGRATION SCRIPT
-- Jalankan script SQL ini di Supabase SQL Editor (kqbxzokrpcwuxrfjshuf.supabase.co)
-- ==============================================================================

-- 1. EXTENSIONS & FUNCTIONS SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. TENANTS TABLE
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL,
    business_vertical TEXT DEFAULT 'distributor_sembako',
    user_type TEXT DEFAULT 'broker',
    sub_type TEXT DEFAULT 'distributor_sembako',
    owner_id UUID,
    plan TEXT DEFAULT 'starter',
    province TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'owner',
    app_role TEXT DEFAULT 'user',
    user_type TEXT DEFAULT 'broker',
    sub_type TEXT DEFAULT 'distributor_sembako',
    business_name TEXT,
    onboarded BOOLEAN DEFAULT true,
    business_model_selected BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TENANT MEMBERSHIPS TABLE
CREATE TABLE IF NOT EXISTS tenant_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'owner',
    app_role TEXT DEFAULT 'user',
    full_name TEXT,
    email TEXT,
    onboarded BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(auth_user_id, tenant_id)
);

-- 5. TEAM INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    invited_by UUID,
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SEMBAKO PRODUCTS
CREATE TABLE IF NOT EXISTS sembako_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    category TEXT DEFAULT 'Sembako',
    unit TEXT DEFAULT 'Kg',
    current_stock NUMERIC(15,2) DEFAULT 0,
    min_stock_alert NUMERIC(15,2) DEFAULT 10,
    avg_buy_price NUMERIC(15,2) DEFAULT 0,
    sell_price NUMERIC(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SEMBAKO SUPPLIERS
CREATE TABLE IF NOT EXISTS sembako_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    supplier_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SEMBAKO CUSTOMERS / TOKO
CREATE TABLE IF NOT EXISTS sembako_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_type TEXT DEFAULT 'Toko',
    phone TEXT,
    address TEXT,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SEMBAKO SALES (TRANSAKSI PENJUALAN)
CREATE TABLE IF NOT EXISTS sembako_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES sembako_customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    invoice_number TEXT,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    total_amount NUMERIC(15,2) DEFAULT 0,
    total_cogs NUMERIC(15,2) DEFAULT 0,
    delivery_cost NUMERIC(15,2) DEFAULT 0,
    other_cost NUMERIC(15,2) DEFAULT 0,
    net_profit NUMERIC(15,2) DEFAULT 0,
    paid_amount NUMERIC(15,2) DEFAULT 0,
    remaining_amount NUMERIC(15,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'belum_lunas',
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SEMBAKO SALE ITEMS (ITEM PENJUALAN)
CREATE TABLE IF NOT EXISTS sembako_sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sembako_sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES sembako_products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    unit TEXT,
    quantity NUMERIC(15,2) DEFAULT 0,
    sell_price NUMERIC(15,2) DEFAULT 0,
    subtotal NUMERIC(15,2) DEFAULT 0,
    cogs_per_unit NUMERIC(15,2) DEFAULT 0,
    cogs_total NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SEMBAKO STOCK BATCHES (STOK MASUK / GUDANG)
CREATE TABLE IF NOT EXISTS sembako_stock_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID REFERENCES sembako_products(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES sembako_suppliers(id) ON DELETE SET NULL,
    batch_code TEXT,
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    qty_awal NUMERIC(15,2) DEFAULT 0,
    qty_sisa NUMERIC(15,2) DEFAULT 0,
    buy_price NUMERIC(15,2) DEFAULT 0,
    total_cost NUMERIC(15,2) DEFAULT 0,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SEMBAKO STOCK OUT (PELACAKAN FIFO STOK KELUAR)
CREATE TABLE IF NOT EXISTS sembako_stock_out (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sembako_sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES sembako_products(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES sembako_stock_batches(id) ON DELETE CASCADE,
    qty_keluar NUMERIC(15,2) DEFAULT 0,
    buy_price NUMERIC(15,2) DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SEMBAKO DELIVERIES (PENGIRIMAN TRIP)
CREATE TABLE IF NOT EXISTS sembako_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sembako_sales(id) ON DELETE CASCADE,
    driver_name TEXT,
    vehicle_plate TEXT,
    status TEXT DEFAULT 'pending',
    departed_at TIMESTAMPTZ,
    arrived_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    delivery_notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. SEMBAKO EMPLOYEES (PEGAWAI / KARYAWAN)
CREATE TABLE IF NOT EXISTS sembako_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'Staff',
    phone TEXT,
    base_salary NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'aktif',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. SEMBAKO PAYROLL (PENGGAJIAN PEGAWAI)
CREATE TABLE IF NOT EXISTS sembako_payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES sembako_employees(id) ON DELETE CASCADE,
    period_date TIMESTAMPTZ DEFAULT NOW(),
    base_salary NUMERIC(15,2) DEFAULT 0,
    bonus NUMERIC(15,2) DEFAULT 0,
    deductions NUMERIC(15,2) DEFAULT 0,
    total_pay NUMERIC(15,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'unpaid',
    paid_at TIMESTAMPTZ,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. SEMBAKO EXPENSES (PENGELUARAN OPERASIONAL)
CREATE TABLE IF NOT EXISTS sembako_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    category TEXT DEFAULT 'operasional',
    description TEXT,
    amount NUMERIC(15,2) DEFAULT 0,
    expense_date TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. SEMBAKO PAYMENTS (RIWAYAT PEMBAYARAN CICILAN/PIUTANG)
CREATE TABLE IF NOT EXISTS sembako_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sembako_sales(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES sembako_customers(id) ON DELETE CASCADE,
    amount NUMERIC(15,2) DEFAULT 0,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. INDEXES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_auth ON tenant_memberships(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_sembako_products_tenant ON sembako_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sembako_stock_batches_prod ON sembako_stock_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_sembako_sales_tenant ON sembako_sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sembako_sales_customer ON sembako_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sembako_sale_items_sale ON sembako_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sembako_deliveries_sale ON sembako_deliveries(sale_id);

-- 19. DISABLE RLS OR ALLOW FULL AUTHENTICATED ACCESS FOR EASY INITIALIZATION
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_stock_out ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sembako_payments ENABLE ROW LEVEL SECURITY;

-- Permissive policies for logged in users
CREATE POLICY "Public Read/Write for Tenants" ON tenants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for Profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for Memberships" ON tenant_memberships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for Products" ON sembako_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for Suppliers" ON sembako_suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for Customers" ON sembako_customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for Sales" ON sembako_sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for Sale Items" ON sembako_sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for Batches" ON sembako_stock_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for Stock Out" ON sembako_stock_out FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for Deliveries" ON sembako_deliveries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for Employees" ON sembako_employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for Payroll" ON sembako_payroll FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for Expenses" ON sembako_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for Payments" ON sembako_payments FOR ALL USING (true) WITH CHECK (true);

-- Done!
