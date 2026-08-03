import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { toast } from 'sonner'
import { useAuth } from './useAuth'
import { normalizeSupabaseError } from '../supabaseErrorHandler'
import { logSupabaseError } from '@/lib/logger/supabaseLogger'
import { logError } from '@/lib/logger/errorLogger'

// ── READ HOOKS ────────────────────────────────────────────────────────────────

const STALE_5M = 5 * 60 * 1000

async function getTenantId() {
  const activeTenantId = localStorage.getItem('ternakos_active_tenant_id')
  if (activeTenantId) return activeTenantId

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .limit(1)

      if (profiles && profiles.length > 0 && profiles[0].tenant_id) {
        return profiles[0].tenant_id
      }
    }
  } catch (e) {
    // ignore
  }

  return '00000000-0000-0000-0000-000000000002'
}

export const useSembakoProducts = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-products', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('sembako_products')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('product_name')
        if (error) { console.warn('[useSembakoProducts]', error.message); return [] }
        return data || []
      } catch (e) { console.warn('[useSembakoProducts]', e); return [] }
    }
  })
}

export const useSembakoStockBatches = (productId) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-batches', tenant?.id, productId],
    enabled: !!productId && !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('sembako_stock_batches')
          .select('*, sembako_suppliers(supplier_name)')
          .eq('tenant_id', tenant.id)
          .eq('product_id', productId)
          .eq('is_deleted', false)
          .gt('qty_sisa', 0)
          .order('created_at', { ascending: true }) // FIFO
        if (error || !data) return []
        return data
      } catch {
        return []
      }
    }
  })
}

export const useSembakoCustomers = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-customers', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('sembako_customers')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('customer_name')
        if (error) { console.warn('[useSembakoCustomers]', error.message); return [] }
        return data || []
      } catch (e) { console.warn('[useSembakoCustomers]', e); return [] }
    }
  })
}

export const useSembakoSuppliers = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-suppliers', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('sembako_suppliers')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('supplier_name')
        if (error) { console.warn('[useSembakoSuppliers]', error.message); return [] }
        return data || []
      } catch (e) { console.warn('[useSembakoSuppliers]', e); return [] }
    }
  })
}

export const useSembakoSales = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-sales', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('sembako_sales')
          .select('*, sembako_customers(customer_name, customer_type, phone), sembako_sale_items(*), sembako_deliveries(id, status)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('transaction_date', { ascending: false })
        if (error) { console.warn('[useSembakoSales]', error.message); return [] }
        return data || []
      } catch (e) { console.warn('[useSembakoSales]', e); return [] }
    }
  })
}

// useSembakoAllBatches — semua batch (termasuk habis), untuk riwayat masuk
export const useSembakoAllBatches = (productId) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-all-batches', tenant?.id, productId ?? 'all'],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      let q = supabase.from('sembako_stock_batches')
          .select('*, sembako_suppliers(supplier_name), sembako_products(product_name, unit)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
        if (productId) q = q.eq('product_id', productId)
        const { data, error } = await q
        if (error) throw normalizeSupabaseError(error)
        return data
    }
  })
}

// useSembakoStockOut — riwayat pengurangan stok (FIFO)
export const useSembakoStockOut = (productId) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-stock-out', tenant?.id, productId ?? 'all'],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      let q = supabase.from('sembako_stock_out')
          .select('*, sembako_products(product_name, unit), sembako_stock_batches(batch_code), sembako_sales(invoice_number, customer_name)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
        if (productId) q = q.eq('product_id', productId)
        const { data, error } = await q
        if (error) throw normalizeSupabaseError(error)
        return data
    }
  })
}

export const useSembakoEmployees = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-employees', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('sembako_employees')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('full_name')
        if (error) { console.warn('[useSembakoEmployees]', error.message); return [] }
        return data || []
      } catch (e) { console.warn('[useSembakoEmployees]', e); return [] }
    }
  })
}

export const useSembakoDashboardStats = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-dashboard-stats', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const [productsRes, salesRes, expensesRes, payrollRes] =
          await Promise.all([
            supabase.from('sembako_products')
              .select('id, product_name, current_stock, avg_buy_price, sell_price, min_stock_alert')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false).eq('is_active', true),
            supabase.from('sembako_sales')
              .select('id, total_amount, total_cogs, net_profit, payment_status, remaining_amount, transaction_date, due_date')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false),
            supabase.from('sembako_expenses')
              .select('amount, expense_date, category')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false),
            supabase.from('sembako_payroll')
              .select('total_pay, period_date, payment_status')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false),
          ])

        // Log errors if any, but continue if possible
        if (productsRes.error) console.error('Sembako Stats (Products):', productsRes.error)
        if (salesRes.error) console.error('Sembako Stats (Sales):', salesRes.error)
        if (expensesRes.error) console.error('Sembako Stats (Expenses):', expensesRes.error)
        if (payrollRes.error) console.error('Sembako Stats (Payroll):', payrollRes.error)

      const products  = productsRes.data  || []
      const sales     = salesRes.data     || []
      const expenses  = expensesRes.data  || []
      const payroll   = payrollRes.data   || []
      const now = new Date()
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

      const expenseThisMonth = expenses
        .filter(e => new Date(e.expense_date) > thirtyDaysAgo)
        .reduce((s, e) => s + (e.amount || 0), 0)
      const payrollThisMonth = payroll
        .filter(p => new Date(p.period_date) > thirtyDaysAgo)
        .reduce((s, p) => s + (p.total_pay || 0), 0)

      // gross net profit from sales only (revenue - cogs - delivery - other)
      const saleNetProfitThisMonth = sales
        .filter(s => new Date(s.transaction_date) > thirtyDaysAgo)
        .reduce((s, i) => s + (i.net_profit || 0), 0)

      return {
        stok: {
          totalProduk: products.length,
          lowStock: products.filter(p =>
            p.min_stock_alert > 0 && p.current_stock <= p.min_stock_alert
          ),
          nilaiStok: products.reduce((s, p) =>
            s + (p.current_stock * p.avg_buy_price), 0
          ),
        },
        penjualan: {
          totalRevenue: sales.reduce((s, i) => s + (i.total_amount || 0), 0),
          revenueThisMonth: sales
            .filter(s => new Date(s.transaction_date) > thirtyDaysAgo)
            .reduce((s, i) => s + (i.total_amount || 0), 0),
          // True net profit = sale margin - operational expenses - payroll (same as Laporan)
          netProfitThisMonth: saleNetProfitThisMonth - expenseThisMonth - payrollThisMonth,
          grossProfitThisMonth: saleNetProfitThisMonth,
          totalOutstanding: sales
            .reduce((s, i) => s + (i.remaining_amount || 0), 0),
          overdueCount: sales.filter(s =>
            s.payment_status !== 'lunas' && s.due_date && new Date(s.due_date) < now
          ).length,
        },
        pengeluaran: {
          totalExpenseThisMonth: expenseThisMonth,
          totalPayrollThisMonth: payrollThisMonth,
        },
      }
    } catch (err) {
      console.warn('[useSembakoDashboardStats] Error:', err)
      return {
        stok: { totalProduk: 0, lowStock: [], nilaiStok: 0 },
        penjualan: { totalRevenue: 0, revenueThisMonth: 0, netProfitThisMonth: 0, grossProfitThisMonth: 0, totalOutstanding: 0, overdueCount: 0 },
        pengeluaran: { totalExpenseThisMonth: 0, totalPayrollThisMonth: 0 }
      }
    }
  }
})
}
export const useCreateSembakoCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      const { data, error } = await supabase.from('sembako_customers')
        .insert({ ...payload, tenant_id })
        .select().single()
      if (error) {
        logSupabaseError(error, { table: 'sembako_customers', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.customer.create' })
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      toast.success('Toko berhasil ditambahkan')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useUpdateSembakoCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase.from('sembako_customers')
        .update(updates).eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_customers', operation: 'update', component: 'useSembakoData', actionName: 'sembako.customer.update' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      toast.success('Toko berhasil diperbarui')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useDeleteSembakoCustomer = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('sembako_customers')
        .update({ is_deleted: true }).eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_customers', operation: 'update', component: 'useSembakoData', actionName: 'sembako.customer.delete' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Toko berhasil dihapus')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useUpdateSembakoSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase.from('sembako_suppliers')
        .update(updates).eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_suppliers', operation: 'update', component: 'useSembakoData', actionName: 'sembako.supplier.update' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      toast.success('Supplier berhasil diperbarui')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useDeleteSembakoSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('sembako_suppliers')
        .update({ is_deleted: true }).eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_suppliers', operation: 'update', component: 'useSembakoData', actionName: 'sembako.supplier.delete' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      toast.success('Supplier berhasil dihapus')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useUpdateSembakoEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase.from('sembako_employees')
        .update(updates).eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_employees', operation: 'update', component: 'useSembakoData', actionName: 'sembako.employee.update' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-employees'] })
      toast.success('Data pegawai diperbarui')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useCreateSembakoDelivery = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      const { error } = await supabase.from('sembako_deliveries')
        .insert({ ...payload, tenant_id })
      if (error) {
        logSupabaseError(error, { table: 'sembako_deliveries', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.delivery.create' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales-pending-delivery'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      toast.success('Trip berhasil dicatat')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useCompleteSembakoDelivery = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (deliveryId) => {
      const { error } = await supabase
        .from('sembako_deliveries')
        .update({ status: 'delivered', completed_at: new Date().toISOString() })
        .eq('id', deliveryId)
      if (error) {
        logSupabaseError(error, { table: 'sembako_deliveries', operation: 'update', component: 'useSembakoData', actionName: 'sembako.delivery.complete' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales-pending-delivery'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      toast.success('Pengiriman selesai')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useStartSembakoDelivery = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (deliveryId) => {
      const { error } = await supabase
        .from('sembako_deliveries')
        .update({ status: 'on_route', departed_at: new Date().toISOString() })
        .eq('id', deliveryId)
      if (error) {
        logSupabaseError(error, { table: 'sembako_deliveries', operation: 'update', component: 'useSembakoData', actionName: 'sembako.delivery.start' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales-pending-delivery'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      toast.success('Pengiriman berangkat')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useArriveSembakoDelivery = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (deliveryId) => {
      const { error } = await supabase
        .from('sembako_deliveries')
        .update({ status: 'arrived', arrived_at: new Date().toISOString() })
        .eq('id', deliveryId)
      if (error) {
        logSupabaseError(error, { table: 'sembako_deliveries', operation: 'update', component: 'useSembakoData', actionName: 'sembako.delivery.arrive' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-deliveries'] })
      toast.success('Kedatangan dicatat')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useUpdateSembakoDeliveryTimestamps = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, departed_at, arrived_at, completed_at }) => {
      const updates = {}
      if (departed_at  !== undefined) updates.departed_at  = departed_at
      if (arrived_at   !== undefined) updates.arrived_at   = arrived_at
      if (completed_at !== undefined) updates.completed_at = completed_at
      const { error } = await supabase
        .from('sembako_deliveries')
        .update(updates)
        .eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_deliveries', operation: 'update', component: 'useSembakoData', actionName: 'sembako.delivery.update_timestamps' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-deliveries'] })
      toast.success('Waktu pengiriman berhasil diperbarui')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useMarkPayrollPaid = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('sembako_payroll')
        .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_payroll', operation: 'update', component: 'useSembakoData', actionName: 'sembako.payroll.mark_paid' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-payroll'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Gaji ditandai lunas')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

// ── DETAIL HOOKS ─────────────────────────────────────────────────────────────

export const useSembakoCustomerInvoices = (customerId) => useQuery({
  queryKey: ['sembako-customer-invoices', customerId],
  enabled: !!customerId,
  staleTime: STALE_5M,
  queryFn: async () => {
    const { data, error } = await supabase.from('sembako_sales')
        .select('*, sembako_sale_items(*)')
        .eq('customer_id', customerId)
        .eq('is_deleted', false)
        .order('transaction_date', { ascending: false })
      if (error) throw normalizeSupabaseError(error)
        return data
  }
})

export const useSembakoCustomerPayments = (customerId) => useQuery({
  queryKey: ['sembako-customer-payments', customerId],
  enabled: !!customerId,
  staleTime: STALE_5M,
  queryFn: async () => {
    const { data, error } = await supabase.from('sembako_payments')
        .select('*, sembako_sales!inner(invoice_number, is_deleted)')
        .eq('customer_id', customerId)
        .eq('sembako_sales.is_deleted', false)
        .order('payment_date', { ascending: false })
      if (error) throw normalizeSupabaseError(error)
        return data
  }
})

export const useSembakoSupplierInvoices = (supplierId) => useQuery({
  queryKey: ['sembako-supplier-invoices', supplierId],
  enabled: !!supplierId,
  staleTime: STALE_5M,
  queryFn: async () => {
    const { data, error } = await supabase.from('sembako_stock_batches')
        .select('*, sembako_products(product_name, unit)')
        .eq('supplier_id', supplierId)
        .eq('is_deleted', false)
        .order('purchase_date', { ascending: false })
      if (error) throw normalizeSupabaseError(error)
        return data
  }
})

// ── LAPORAN (Phase 4) ────────────────────────────────────────────────────────

export const useSembakoLaporan = (startDate, endDate) => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-laporan', tenant?.id, startDate, endDate],
    enabled: !!startDate && !!endDate && !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
    try {
      const [salesRes, expensesRes, payrollRes, batchesRes] = await Promise.all([
        supabase.from('sembako_sales')
          .select('*, sembako_sale_items(*), sembako_customers(customer_name, customer_type)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate),
        supabase.from('sembako_expenses')
          .select('*').eq('tenant_id', tenant.id).eq('is_deleted', false)
          .gte('expense_date', startDate).lte('expense_date', endDate),
        supabase.from('sembako_payroll')
          .select('*, sembako_employees(full_name, role)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .gte('period_date', startDate).lte('period_date', endDate),
        supabase.from('sembako_stock_batches')
          .select('*, sembako_products(product_name, category)')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .gte('purchase_date', startDate).lte('purchase_date', endDate),
      ])

      if (salesRes.error) console.error('Sembako Report (Sales):', salesRes.error)
      if (expensesRes.error) console.error('Sembako Report (Expenses):', expensesRes.error)
      if (payrollRes.error) console.error('Sembako Report (Payroll):', payrollRes.error)
      if (batchesRes.error) console.error('Sembako Report (Batches):', batchesRes.error)

      const sales    = salesRes.data    || []
      const expenses = expensesRes.data || []
      const payroll  = payrollRes.data  || []
      const batches  = batchesRes.data  || []

      const totalRevenue      = sales.reduce((s, i) => s + (i.total_amount || 0), 0)
      const totalCOGS         = sales.reduce((s, i) => s + (i.total_cogs || 0), 0)
      const totalDeliveryCost = sales.reduce((s, i) => s + (i.delivery_cost || 0), 0)
      const totalOtherCost    = sales.reduce((s, i) => s + (i.other_cost || 0), 0)
      const totalExpenses     = expenses.reduce((s, e) => s + (e.amount || 0), 0)
      const totalPayroll      = payroll.reduce((s, p) => s + (p.total_pay || 0), 0)
      const grossProfit       = totalRevenue - totalCOGS
      const netProfit         = grossProfit - totalDeliveryCost - totalOtherCost - totalExpenses - totalPayroll
      const grossMarginPct    = totalRevenue > 0 ? (grossProfit / totalRevenue * 100).toFixed(1) : 0
      const netMarginPct      = totalRevenue > 0 ? (netProfit / totalRevenue * 100).toFixed(1) : 0

      // Group by product
      const byProduct = {}
      sales.forEach(sale => {
        ;(sale.sembako_sale_items || []).forEach(item => {
          const key = item.product_name || 'Lainnya'
          if (!byProduct[key]) byProduct[key] = { revenue: 0, cogs: 0, qty: 0, unit: item.unit }
          byProduct[key].revenue += item.subtotal || 0
          byProduct[key].cogs   += item.cogs_total || 0
          byProduct[key].qty    += item.quantity || 0
        })
      })

      // Group by customer
      const byCustomer = {}
      sales.forEach(sale => {
        const key = sale.customer_name || 'Umum'
        if (!byCustomer[key]) byCustomer[key] = { revenue: 0, profit: 0, count: 0, type: sale.sembako_customers?.customer_type }
        byCustomer[key].revenue += sale.total_amount || 0
        byCustomer[key].profit  += sale.net_profit || 0
        byCustomer[key].count++
      })

      // Expense breakdown
      const expenseByCategory = {}
      expenses.forEach(e => {
        const cat = e.category || 'lainnya'
        if (!expenseByCategory[cat]) expenseByCategory[cat] = 0
        expenseByCategory[cat] += e.amount || 0
      })

      return {
        summary: {
          totalRevenue, totalCOGS, grossProfit, grossMarginPct,
          totalDeliveryCost, totalOtherCost, totalExpenses, totalPayroll,
          netProfit, netMarginPct,
          totalStockPurchase: batches.reduce((s, b) => s + (b.total_cost || 0), 0),
        },
        byProduct, byCustomer, expenseByCategory,
        sales, expenses, payroll,
      }
    } catch (err) {
      throw normalizeSupabaseError(err)
    }
  }
})}
export const useDeleteSembakoSale = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      // 1. Ambil semua data stok keluar terkait sale ini untuk reversal
      const { data: stockOuts } = await supabase
        .from('sembako_stock_out')
        .select('batch_id, qty_keluar')
        .eq('sale_id', id)

      // 2. Kembalikan qty ke batch asli (FIFO Reversal)
      if (stockOuts && stockOuts.length > 0) {
        for (const record of stockOuts) {
          // Ambil sisa qty saat ini di batch
          const { data: batch } = await supabase
            .from('sembako_stock_batches')
            .select('qty_sisa')
            .eq('id', record.batch_id)
            .single()

          if (batch) {
            await supabase
              .from('sembako_stock_batches')
              .update({ qty_sisa: (batch.qty_sisa || 0) + record.qty_keluar })
              .eq('id', record.batch_id)
          }
        }
        await supabase.from('sembako_stock_out').delete().eq('sale_id', id)
      }

      // 3. Soft delete: set is_deleted = true di header
      const { error } = await supabase.from('sembako_sales')
        .update({ is_deleted: true })
        .eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_sales', operation: 'update', component: 'useSembakoData', actionName: 'sembako.sale.delete' })
        throw error
      }

      // 4. Hard delete related payments (sembako_payments has NO is_deleted column)
      const { error: payDelErr } = await supabase.from('sembako_payments')
        .delete()
        .eq('sale_id', id)
      if (payDelErr) {
        // Partial: sale soft-deleted but payments still exist.
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.sale.delete.payments_cleanup',
          error: payDelErr,
          metadata: { table: 'sembako_payments', operation: 'delete', partial: true, step: 'payments_delete', sale_id: id },
        })
      }

      // 5. Hard delete sale items — cegah orphan records di analitik (SIM-04)
      const { error: itemsDelErr } = await supabase.from('sembako_sale_items')
        .delete()
        .eq('sale_id', id)
      if (itemsDelErr) {
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.sale.delete.items_cleanup',
          error: itemsDelErr,
          metadata: { table: 'sembako_sale_items', operation: 'delete', partial: true, step: 'sale_items_delete', sale_id: id },
        })
      }

      // 6. Hard delete deliveries terkait — cegah orphan tracking (SIM-04)
      const { error: delivDelErr } = await supabase.from('sembako_deliveries')
        .delete()
        .eq('sale_id', id)
      if (delivDelErr) {
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.sale.delete.deliveries_cleanup',
          error: delivDelErr,
          metadata: { table: 'sembako_deliveries', operation: 'delete', partial: true, step: 'deliveries_delete', sale_id: id },
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-payments'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-invoices'] })
      toast.success('Transaksi dihapus & Stok dikembalikan')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}
export const useUpdateSembakoSale = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates, items }) => {
      const tenant_id = await getTenantId()

      // ── 1. Recalculate piutang jika total_amount berubah ──────────────────
      if (updates.total_amount !== undefined) {
        const { data: sale } = await supabase
          .from('sembako_sales')
          .select('paid_amount')
          .eq('id', id)
          .single()

        if (sale) {
          const paidAmount   = sale.paid_amount || 0
          const newTotal     = updates.total_amount
          const newRemaining = Math.max(0, newTotal - paidAmount)
          const newStatus    =
            paidAmount <= 0        ? 'belum_lunas'
            : paidAmount >= newTotal ? 'lunas'
            : 'sebagian'

          // Medium #5: track overpayment so caller can warn the user
          if (paidAmount > newTotal) {
            updates = { ...updates, _overpaid: paidAmount - newTotal }
          }

          updates = { ...updates, remaining_amount: newRemaining, payment_status: newStatus }
        }
      }

      // ── 2. FIFO Reversal + Re-deduct jika items diberikan ─────────────────
      if (items && items.length > 0) {
        // 2a. Ambil semua stock_out lama (product_id + buy_price diperlukan untuk compensating rollback)
        const { data: oldStockOuts } = await supabase
          .from('sembako_stock_out')
          .select('batch_id, qty_keluar, product_id, buy_price')
          .eq('sale_id', id)

        // 2b. Kembalikan stok ke batch asal (reversal FIFO)
        if (oldStockOuts && oldStockOuts.length > 0) {
          for (const rec of oldStockOuts) {
            const { data: batch } = await supabase
              .from('sembako_stock_batches')
              .select('qty_sisa')
              .eq('id', rec.batch_id)
              .single()
            if (batch) {
              await supabase.from('sembako_stock_batches')
                .update({ qty_sisa: (batch.qty_sisa || 0) + rec.qty_keluar })
                .eq('id', rec.batch_id)
            }
          }
          await supabase.from('sembako_stock_out').delete().eq('sale_id', id)
        }

        // 2c. HIGH-03 + HIGH-04: pre-flight stock check + FIFO COGS in one pass (post-reversal)
        // Wrapped in try-catch: if pre-flight fails, compensating rollback re-deducts original
        // quantities so stock + stock_out remain consistent even on failure.
        const editFifoCogs   = {}
        const editBatchCache = {}
        try {
          for (const item of items) {
            if (!item.product_id) continue
            const { data: batches } = await supabase
              .from('sembako_stock_batches')
              .select('id, qty_sisa, buy_price')
              .eq('product_id', item.product_id)
              .eq('is_deleted', false)
              .gt('qty_sisa', 0)
              .order('created_at', { ascending: true })
            const available = (batches || []).reduce((s, b) => s + (b.qty_sisa || 0), 0)
            if (item.quantity > available) {
              throw new Error(
                `Stok ${item.product_name || 'produk'} tidak cukup — tersedia ${available} ${item.unit || 'unit'}, diminta ${item.quantity}`
              )
            }
            let remaining = item.quantity
            let totalCost = 0
            for (const b of (batches || [])) {
              if (remaining <= 0) break
              const take = Math.min(b.qty_sisa, remaining)
              totalCost += take * (b.buy_price || 0)
              remaining -= take
            }
            editFifoCogs[item.product_id]   = item.quantity > 0 ? Math.round(totalCost / item.quantity) : 0
            editBatchCache[item.product_id] = batches || []
          }
        } catch (preflightErr) {
          // Compensating rollback: restore original stock_out + re-deduct batches
          for (const rec of (oldStockOuts || [])) {
            const { data: batch } = await supabase
              .from('sembako_stock_batches')
              .select('qty_sisa')
              .eq('id', rec.batch_id)
              .single()
            if (batch) {
              await supabase.from('sembako_stock_batches')
                .update({ qty_sisa: Math.max(0, (batch.qty_sisa || 0) - rec.qty_keluar) })
                .eq('id', rec.batch_id)
            }
            await supabase.from('sembako_stock_out').insert({
              tenant_id,
              product_id: rec.product_id,
              batch_id: rec.batch_id,
              sale_id: id,
              qty_keluar: rec.qty_keluar,
              buy_price: rec.buy_price || 0,
            })
          }
          throw preflightErr
        }

        // Recompute totals with FIFO COGS and push to updates
        const editTotalCogs = items.reduce((s, i) =>
          s + Math.round(i.quantity * (i.product_id
            ? (editFifoCogs[i.product_id] ?? i.cogs_per_unit ?? 0)
            : (i.cogs_per_unit || 0)
          )), 0)
        updates = { ...updates, total_cogs: editTotalCogs }

        // 2e. Hapus sale_items lama
        await supabase.from('sembako_sale_items').delete().eq('sale_id', id)

        // 2f. Insert sale_items baru dengan FIFO-accurate COGS
        const itemsToInsert = items.map(item => ({
          sale_id: id,
          product_id: item.product_id || null,
          product_name: item.product_name,
          unit: item.unit,
          quantity: item.quantity,
          price_per_unit: item.price_per_unit,
          cogs_per_unit: item.product_id
            ? (editFifoCogs[item.product_id] ?? item.cogs_per_unit ?? 0)
            : (item.cogs_per_unit || 0),
        }))
        const { error: itemErr } = await supabase.from('sembako_sale_items').insert(itemsToInsert)
        if (itemErr) {
          // Partial: old items deleted but new items insert failed → sale_items orphan state.
          logError({
            level: 'error', source: 'supabase', component: 'useSembakoData',
            actionName: 'sembako.sale.update.items_replace',
            error: itemErr,
            metadata: { table: 'sembako_sale_items', operation: 'insert', partial: true, step: 'sale_items_reinsert', sale_id: id },
          })
          throw itemErr
        }

        // 2g. FIFO re-deduct — reuse cached batches
        for (const item of items) {
          if (!item.product_id) continue
          let qtyToDeduct = item.quantity
          const batches = editBatchCache[item.product_id] || []

          for (const batch of batches) {
            if (qtyToDeduct <= 0) break
            const deduct = Math.min(batch.qty_sisa, qtyToDeduct)
            await supabase.from('sembako_stock_batches')
              .update({ qty_sisa: batch.qty_sisa - deduct })
              .eq('id', batch.id)
            await supabase.from('sembako_stock_out').insert({
              tenant_id,
              product_id: item.product_id,
              batch_id: batch.id,
              sale_id: id,
              qty_keluar: deduct,
              buy_price: batch.buy_price || 0,
            })
            qtyToDeduct -= deduct
          }
        }
      }

      // ── 3. Update sale header ─────────────────────────────────────────────
      const { _overpaid, ...cleanUpdates } = updates  // strip UI-only hint
      const { error } = await supabase.from('sembako_sales').update(cleanUpdates).eq('id', id)
      if (error) {
        // Header update failed — but stock/items may already have been mutated above.
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.sale.update.header',
          error,
          metadata: { table: 'sembako_sales', operation: 'update', partial: items && items.length > 0, step: 'sale_header_update', sale_id: id },
        })
        throw error
      }
      return { _overpaid }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-stock-out'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-payments'] })
      if (result?._overpaid) {
        const fmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
        toast.warning(`Transaksi diperbarui — kelebihan bayar ${fmt.format(result._overpaid)} dicatat sebagai LUNAS`)
      } else {
        toast.success('Transaksi diperbarui')
      }
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useSembakoSupplierPayments = (supplierId) => useQuery({
  queryKey: ['sembako-supplier-payments', supplierId],
  enabled: !!supplierId,
  staleTime: STALE_5M,
  queryFn: async () => {
    const { data, error } = await supabase.from('sembako_supplier_payments')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('is_deleted', false)
        .order('payment_date', { ascending: false })
      if (error) throw normalizeSupabaseError(error)
        return data
  }
})

export const useRecordSembakoSupplierPayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      const { error } = await supabase
        .from('sembako_supplier_payments')
        .insert({ ...payload, tenant_id })
      if (error) {
        logSupabaseError(error, { table: 'sembako_supplier_payments', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.supplier_payment.create' })
        throw error
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['sembako-supplier-payments', vars.supplier_id] })
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Pembayaran ke supplier dicatat')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useVoidSembakoSaleReturn = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sale_id, items }) => {
      // 1. Reverse stock: kembalikan qty ke batch masing-masing (FIFO Reversal)
      for (const item of items) {
        if (!item.batch_id) continue
        const { data: batch } = await supabase
          .from('sembako_stock_batches')
          .select('qty_sisa')
          .eq('id', item.batch_id)
          .single()
        
        if (batch) {
          await supabase.from('sembako_stock_batches')
            .update({ qty_sisa: (batch.qty_sisa || 0) + item.quantity })
            .eq('id', item.batch_id)
        }
      }

      // 2. Hapus stock_out records terkait sale ini
      //    (mencegah ghost movements di Kartu Stok & Riwayat Keluar)
      const { error: stockOutErr } = await supabase
        .from('sembako_stock_out')
        .delete()
        .eq('sale_id', sale_id)
      if (stockOutErr) {
        // Stock already reversed (step 1) but stock_out cleanup failed → partial state.
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.sale.return.stock_out_cleanup',
          error: stockOutErr,
          metadata: { table: 'sembako_stock_out', operation: 'delete', partial: true, step: 'stock_out_delete', sale_id },
        })
        throw stockOutErr
      }

      // 3. Hapus payment records terkait sale ini
      //    (mencegah orphan payments setelah retur)
      const { error: payErr } = await supabase
        .from('sembako_payments')
        .delete()
        .eq('sale_id', sale_id)
      if (payErr) {
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.sale.return.payments_cleanup',
          error: payErr,
          metadata: { table: 'sembako_payments', operation: 'delete', partial: true, step: 'payments_delete', sale_id },
        })
        throw payErr
      }

      // 4. Soft delete: beri catatan retur di sales header
      const { error } = await supabase
        .from('sembako_sales')
        .update({
          is_deleted: true,
          notes: `[RETUR ${new Date().toLocaleDateString('id-ID')}] Barang dikembalikan & stok dipulihkan.`
        })
        .eq('id', sale_id)

      if (error) {
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.sale.return.header',
          error,
          metadata: { table: 'sembako_sales', operation: 'update', partial: true, step: 'sale_soft_delete', sale_id },
        })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-stock-out'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-payments'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customer-invoices'] })
      toast.success('Nota Berhasil di-Retur')
    },
    onError: (err) => toast.error('Gagal proses retur: ' + normalizeSupabaseError(err).message),
  })
}

export const useAdjustBatchStock = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ batch_id, qty_change }) => {
      const tenant_id = await getTenantId()
      
      const { data: batch } = await supabase
        .from('sembako_stock_batches')
        .select('qty_sisa, product_id, buy_price')
        .eq('id', batch_id)
        .single()
      
      if (!batch) throw new Error('Batch tidak ditemukan')
      
      const newQty = (batch.qty_sisa || 0) + qty_change
      if (newQty < 0) throw new Error('Penyesuaian menyebabkan stok negatif')

      const { error: updErr } = await supabase
        .from('sembako_stock_batches')
        .update({ qty_sisa: newQty })
        .eq('id', batch_id)
      if (updErr) {
        logSupabaseError(updErr, { table: 'sembako_stock_batches', operation: 'update', component: 'useSembakoData', actionName: 'sembako.stock_batch.adjust' })
        throw updErr
      }

      // BUG-05 fix: sync product.current_stock dengan SUM semua batch aktif
      // agar UI tidak tampilkan stok yang sudah stale
      const { data: batchTotals } = await supabase
        .from('sembako_stock_batches')
        .select('qty_sisa')
        .eq('product_id', batch.product_id)
        .gt('qty_sisa', 0)
      const syncedStock = (batchTotals || []).reduce((s, b) => s + (b.qty_sisa || 0), 0)
      const { error: prodSyncErr } = await supabase
        .from('sembako_products')
        .update({ current_stock: syncedStock })
        .eq('id', batch.product_id)
      if (prodSyncErr) {
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.stock_batch.adjust.product_sync',
          error: prodSyncErr,
          metadata: { table: 'sembako_products', operation: 'update', partial: true, step: 'product_current_stock_sync', batch_id, product_id: batch.product_id },
        })
      }

      // Jika pengurangan stok, catat di sembako_stock_out
      if (qty_change < 0) {
        const { error: outErr } = await supabase
          .from('sembako_stock_out')
          .insert({
            tenant_id,
            product_id: batch.product_id,
            batch_id: batch_id,
            qty_keluar: Math.abs(qty_change),
            buy_price: batch.buy_price || 0,
          })
        if (outErr) {
          logError({
            level: 'error', source: 'supabase', component: 'useSembakoData',
            actionName: 'sembako.stock_batch.adjust.stock_out',
            error: outErr,
            metadata: { table: 'sembako_stock_out', operation: 'insert', partial: true, step: 'stock_out_insert', batch_id },
          })
          throw outErr
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-stock-out'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Penyesuaian stok berhasil disimpan')
    },
    onError: (err) => toast.error('Gagal adjust stok: ' + normalizeSupabaseError(err).message),
  })
}

export const useCreateSembakoProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      const { error } = await supabase.from('sembako_products')
        .insert({ ...payload, tenant_id })
      if (error) {
        logSupabaseError(error, { table: 'sembako_products', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.product.create' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Produk berhasil ditambahkan')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useAddStockBatch = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ product_id, supplier_id, qty_masuk,
      buy_price, purchase_date, expiry_date, notes }) => {
      const tenant_id = await getTenantId()
      const { error } = await supabase.from('sembako_stock_batches')
        .insert({
          tenant_id, product_id, supplier_id,
          qty_masuk,
          qty_sisa: qty_masuk,
          buy_price, purchase_date, expiry_date, notes,
        })
      if (error) {
        logSupabaseError(error, { table: 'sembako_stock_batches', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.stock_batch.create' })
        throw error
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-batches', vars.product_id] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Stok berhasil ditambahkan')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useCreateSembakoSale = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ customer_id, customer_name, transaction_date,
      due_date, items, delivery_cost, other_cost, notes }) => {
      const tenant_id = await getTenantId()
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const rand = Array.from(crypto.getRandomValues(new Uint8Array(3)))
        .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().slice(0, 4)
      const invoice_number = `SMB-${dateStr}-${rand}`

      const itemFifoCogs = {}
      const itemBatchCache = {}

      for (const item of items) {
        if (!item.product_id) continue
        const { data: batches } = await supabase
          .from('sembako_stock_batches')
          .select('id, qty_sisa, buy_price')
          .eq('product_id', item.product_id)
          .eq('is_deleted', false)
          .gt('qty_sisa', 0)
          .order('created_at', { ascending: true })

        const available = (batches || []).reduce((s, b) => s + (b.qty_sisa || 0), 0)
        if (item.quantity > available) {
          throw new Error(`Stok ${item.product_name || 'produk'} tidak cukup — tersedia ${available} ${item.unit || 'unit'}, diminta ${item.quantity}`)
        }

        let remaining = item.quantity
        let totalCost = 0
        for (const batch of (batches || [])) {
          if (remaining <= 0) break
          const take = Math.min(batch.qty_sisa, remaining)
          totalCost += take * (batch.buy_price || 0)
          remaining -= take
        }
        itemFifoCogs[item.product_id] = item.quantity > 0 ? Math.round(totalCost / item.quantity) : 0
        itemBatchCache[item.product_id] = batches || []
      }

      const total_amount = items.reduce((s, i) => s + Math.round(i.quantity * i.price_per_unit), 0)
      const total_cogs = items.reduce((s, i) => s + Math.round(i.quantity * (i.product_id ? (itemFifoCogs[i.product_id] ?? i.cogs_per_unit ?? 0) : (i.cogs_per_unit || 0))), 0)

      const { data: sale, error: saleErr } = await supabase
        .from('sembako_sales').insert({
          tenant_id, customer_id, customer_name, invoice_number,
          transaction_date, due_date,
          total_amount, total_cogs,
          delivery_cost: delivery_cost || 0,
          other_cost: other_cost || 0,
          payment_status: 'belum_lunas',
          paid_amount: 0,
          notes,
        }).select().single()
      if (saleErr) {
        logSupabaseError(saleErr, { table: 'sembako_sales', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.sale.create' })
        throw saleErr
      }

      const itemsToInsert = items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        unit: item.unit,
        quantity: item.quantity,
        price_per_unit: item.price_per_unit,
        cogs_per_unit: item.product_id ? (itemFifoCogs[item.product_id] ?? item.cogs_per_unit ?? 0) : (item.cogs_per_unit || 0),
      }))
      const { error: itemErr } = await supabase.from('sembako_sale_items').insert(itemsToInsert)
      if (itemErr) {
        // Partial: sale header inserted but items failed → orphan sale.
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.sale.create.items',
          error: itemErr,
          metadata: { table: 'sembako_sale_items', operation: 'insert', partial: true, step: 'sale_items_insert', sale_id: sale.id },
        })
        throw itemErr
      }

      try {
        for (const item of items) {
          if (!item.product_id) continue
          let qtyToDeduct = item.quantity
          const batches = itemBatchCache[item.product_id] || []
          for (const batch of batches) {
            if (qtyToDeduct <= 0) break
            const deduct = Math.min(batch.qty_sisa, qtyToDeduct)
            const { error: batchErr } = await supabase.from('sembako_stock_batches').update({ qty_sisa: batch.qty_sisa - deduct }).eq('id', batch.id)
            if (batchErr) {
              logError({
                level: 'error', source: 'supabase', component: 'useSembakoData',
                actionName: 'sembako.sale.create.stock_deduct',
                error: batchErr,
                metadata: { table: 'sembako_stock_batches', operation: 'update', partial: true, step: 'stock_batches_deduct', sale_id: sale.id, batch_id: batch.id },
              })
              throw batchErr
            }
            const { error: outErr } = await supabase.from('sembako_stock_out').insert({
              tenant_id, product_id: item.product_id, batch_id: batch.id, sale_id: sale.id, qty_keluar: deduct, buy_price: batch.buy_price || 0,
            })
            if (outErr) {
              logError({
                level: 'error', source: 'supabase', component: 'useSembakoData',
                actionName: 'sembako.sale.create.stock_out',
                error: outErr,
                metadata: { table: 'sembako_stock_out', operation: 'insert', partial: true, step: 'stock_out_insert', sale_id: sale.id, batch_id: batch.id },
              })
              throw outErr
            }
            qtyToDeduct -= deduct
          }
        }
      } catch (deductErr) {
        // Compensating rollback: best-effort cleanup. Note: stock_batches updates
        // already done in this loop are NOT reversed here — superadmin may need
        // to reconcile via the partial logs above.
        await supabase.from('sembako_sale_items').delete().eq('sale_id', sale.id)
        await supabase.from('sembako_sales').delete().eq('id', sale.id)
        throw deductErr
      }
      return sale
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Invoice berhasil dibuat')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useRecordSembakoPayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sale_id, customer_id, amount,
      payment_date, payment_method, reference_number, notes }) => {
      const tenant_id = await getTenantId()
      const { error: payErr } = await supabase.from('sembako_payments').insert({
        tenant_id, sale_id, customer_id, amount, payment_date, payment_method, reference_number, notes,
      })
      if (payErr) {
        logSupabaseError(payErr, { table: 'sembako_payments', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.payment.create' })
        throw payErr
      }
      const { data: sale } = await supabase.from('sembako_sales').select('total_amount, paid_amount').eq('id', sale_id).single()
      const newPaid = (sale.paid_amount || 0) + amount
      const newStatus = newPaid >= sale.total_amount ? 'lunas' : newPaid > 0 ? 'sebagian' : 'belum_lunas'
      const { error: saleSyncErr } = await supabase.from('sembako_sales').update({ paid_amount: newPaid, payment_status: newStatus }).eq('id', sale_id)
      if (saleSyncErr) {
        // Partial commit: payment recorded but sale paid_amount/status not synced.
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.payment.create.sale_sync',
          error: saleSyncErr,
          metadata: { table: 'sembako_sales', operation: 'update', partial: true, step: 'sale_paid_amount_sync', sale_id },
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-sales'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-customers'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Pembayaran berhasil dicatat')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useCreateSembakoEmployee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const tenant_id = await getTenantId()
      const { error } = await supabase.from('sembako_employees').insert({ ...payload, tenant_id })
      if (error) {
        logSupabaseError(error, { table: 'sembako_employees', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.employee.create' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-employees'] })
      toast.success('Pegawai berhasil ditambahkan')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useRecordPayroll = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ employee_id, period_type, period_date,
      work_days, trip_count, sales_amount, base_amount,
      commission_amount, bonus, deduction, notes }) => {
      const tenant_id = await getTenantId()
      const { error } = await supabase.from('sembako_payroll').insert({
        tenant_id, employee_id, period_type, period_date, work_days, trip_count, sales_amount, base_amount, commission_amount, bonus, deduction, notes, payment_status: 'pending',
      })
      if (error) {
        logSupabaseError(error, { table: 'sembako_payroll', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.payroll.create' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-payroll'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Gaji berhasil dicatat')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useUpdateSembakoProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase.from('sembako_products').update(updates).eq('id', id)
      if (error) {
        logSupabaseError(error, { table: 'sembako_products', operation: 'update', component: 'useSembakoData', actionName: 'sembako.product.update' })
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Produk berhasil diperbarui')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useSoftDeleteSembakoProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error: errProduct } = await supabase.from('sembako_products').update({ is_deleted: true }).eq('id', id)
      if (errProduct) {
        logSupabaseError(errProduct, { table: 'sembako_products', operation: 'update', component: 'useSembakoData', actionName: 'sembako.product.delete' })
        throw errProduct
      }
      const { error: errBatch } = await supabase.from('sembako_stock_batches').update({ is_deleted: true }).eq('product_id', id)
      if (errBatch) {
        // Partial commit: product marked deleted but related batches still active.
        logError({
          level: 'error', source: 'supabase', component: 'useSembakoData',
          actionName: 'sembako.product.delete.batch_sync',
          error: errBatch,
          metadata: { table: 'sembako_stock_batches', operation: 'update', partial: true, step: 'batch_soft_delete', product_id: id },
        })
        throw errBatch
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-products'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-all-batches'] })
      queryClient.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Produk dihapus')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useCreateSembakoSupplier = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ supplier_name, phone, address, notes }) => {
      const tenant_id = await getTenantId()
      const { data, error } = await supabase.from('sembako_suppliers').insert({ tenant_id, supplier_name, phone, address, notes }).select().single()
      if (error) {
        logSupabaseError(error, { table: 'sembako_suppliers', operation: 'insert', component: 'useSembakoData', actionName: 'sembako.supplier.create' })
        throw error
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sembako-suppliers'] })
      toast.success('Supplier berhasil ditambahkan')
    },
    onError: (err) => toast.error(normalizeSupabaseError(err).message),
  })
}

export const useSembakoDeliveries = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-deliveries', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('sembako_deliveries')
          .select(`*, sembako_sales(id, invoice_number, total_amount, payment_status, transaction_date, customer_name, sembako_customers(id, customer_name, phone, address), sembako_sale_items(id, product_name, quantity, unit))`)
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
        if (error) { console.warn('[useSembakoDeliveries]', error.message); return [] }
        return data || []
      } catch (e) { console.warn('[useSembakoDeliveries]', e); return [] }
    }
  })
}

export const useSembakoSalesPendingDelivery = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-sales-pending-delivery', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('sembako_sales')
          .select(`id, invoice_number, transaction_date, total_amount, payment_status, customer_name, sembako_customers(id, customer_name, address, phone), sembako_sale_items(id, product_name, quantity, unit), sembako_deliveries(id, status, is_deleted)`)
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('transaction_date', { ascending: false })
        if (error || !data) return []
        return (data || []).filter(sale => {
          const activeDeliveries = (sale.sembako_deliveries || []).filter(d => !d.is_deleted)
          return activeDeliveries.length === 0
        })
      } catch {
        return []
      }
    }
  })
}

export const useSembakoPayrolls = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-payroll', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('sembako_payroll')
          .select('total_pay, period_date, payment_status')
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
        if (error || !data) return []
        return data
      } catch {
        return []
      }
    }
  })
}

// ── RETURNS HOOKS (Retur Produk Rokok) ────────────────────────────────────────

export const useSembakoReturns = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-returns', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('sembako_returns')
          .select(`*, sembako_products(id, product_name, unit, current_stock)`)
          .eq('tenant_id', tenant.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
        if (error) {
          console.warn('[useSembakoReturns] Falling back to local storage', error.message)
          const saved = localStorage.getItem('gopek_retur_list')
          return saved ? JSON.parse(saved) : []
        }
        return data || []
      } catch (e) {
        console.warn('[useSembakoReturns]', e)
        const saved = localStorage.getItem('gopek_retur_list')
        return saved ? JSON.parse(saved) : []
      }
    }
  })
}

export const useCreateSembakoReturn = () => {
  const qc = useQueryClient()
  const { tenant, user } = useAuth()

  return useMutation({
    mutationFn: async (payload) => {
      const tenantId = tenant?.id || (await getTenantId())
      const {
        return_type,
        party_name,
        product_id,
        product_name,
        quantity,
        unit,
        unit_price,
        total_amount,
        reason,
        action,
        notes
      } = payload

      const returnNumber = `RET-${Date.now().toString().slice(-6)}`

      // 1. Try DB insert into sembako_returns
      let returnData = null
      try {
        const { data, error } = await supabase.from('sembako_returns').insert({
          tenant_id: tenantId,
          created_by: user?.id || null,
          return_number: returnNumber,
          return_type: return_type || 'sale_return',
          party_name: party_name || '',
          product_id: product_id || null,
          product_name: product_name || '',
          quantity: Number(quantity || 1),
          unit: unit || 'slop',
          unit_price: Number(unit_price || 0),
          total_amount: Number(total_amount || 0),
          reason: reason || 'Lainnya',
          action: action || 'fifo_stock',
          status: 'pending',
          notes: notes || '',
        }).select().single()

        if (!error && data) {
          returnData = data
        }
      } catch (e) {
        console.warn('[useCreateSembakoReturn] DB Insert warning:', e)
      }

      // 2. Perform FIFO Stock adjustment if action is 'fifo_stock'
      if (product_id && action === 'fifo_stock') {
        try {
          const { data: prod } = await supabase.from('sembako_products').select('current_stock').eq('id', product_id).single()
          if (prod) {
            const qty = Number(quantity || 0)
            const newStock = return_type === 'sale_return' 
              ? (prod.current_stock || 0) + qty  // Retur dari toko -> stok bertambah
              : Math.max(0, (prod.current_stock || 0) - qty) // Retur ke pabrik -> stok berkurang
            
            await supabase.from('sembako_products').update({ current_stock: newStock }).eq('id', product_id)

            // Add batch entry for FIFO if sale return
            if (return_type === 'sale_return' && qty > 0) {
              await supabase.from('sembako_stock_batches').insert({
                tenant_id: tenantId,
                product_id: product_id,
                qty_in: qty,
                qty_remaining: qty,
                buy_price_per_unit: Number(unit_price || 0),
                notes: `Retur Penjualan (${party_name}) - FIFO Reversal`,
              })
            }
          }
        } catch (stkErr) {
          console.warn('[useCreateSembakoReturn] Stock adjustment warning:', stkErr)
        }
      }

      // 3. Automatic Piutang Deduction (Potong Piutang Toko -> Auto Mark Lunas)
      const financialAction = payload.financial_action || 'potong_piutang'
      if (return_type === 'sale_return' && financialAction === 'potong_piutang' && total_amount > 0) {
        try {
          // Find unpaid sales for this customer/party
          const { data: unpaidSales } = await supabase.from('sembako_sales')
            .select('id, remaining_amount, paid_amount, total_amount, invoice_number')
            .eq('tenant_id', tenantId)
            .eq('is_deleted', false)
            .neq('payment_status', 'lunas')
            .order('transaction_date', { ascending: true })

          let remainingCredit = Number(total_amount)

          if (unpaidSales && unpaidSales.length > 0) {
            for (const sale of unpaidSales) {
              if (remainingCredit <= 0) break
              const curRem = Number(sale.remaining_amount || 0)
              if (curRem <= 0) continue

              const deduct = Math.min(curRem, remainingCredit)
              const newRem = curRem - deduct
              const newPaid = Number(sale.paid_amount || 0) + deduct
              const newStatus = newRem <= 0 ? 'lunas' : 'sebagian'

              await supabase.from('sembako_sales').update({
                remaining_amount: newRem,
                paid_amount: newPaid,
                payment_status: newStatus,
              }).eq('id', sale.id)

              // Record payment entry
              await supabase.from('sembako_payments').insert({
                tenant_id: tenantId,
                sale_id: sale.id,
                amount_paid: deduct,
                payment_method: 'potong_piutang_retur',
                notes: `Potong Piutang Retur ${returnNumber} (${product_name})`,
              })

              remainingCredit -= deduct
            }
          }
        } catch (piutangErr) {
          console.warn('[useCreateSembakoReturn] Piutang deduction warning:', piutangErr)
        }
      }

      // 3. Always maintain localStorage sync for instant reactivity
      const saved = localStorage.getItem('gopek_retur_list')
      const currentList = saved ? JSON.parse(saved) : []
      const localEntry = returnData || {
        id: returnNumber,
        date: new Date().toISOString().split('T')[0],
        type: return_type,
        party_name,
        product_name,
        quantity: Number(quantity),
        unit,
        amount: Number(total_amount),
        reason,
        action,
        status: 'pending',
        notes
      }
      localStorage.setItem('gopek_retur_list', JSON.stringify([localEntry, ...currentList]))

      return localEntry
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sembako-returns'] })
      qc.invalidateQueries({ queryKey: ['sembako-products'] })
      qc.invalidateQueries({ queryKey: ['sembako-dashboard-stats'] })
      toast.success('Retur produk rokok berhasil dicatat!')
    },
    onError: (err) => {
      toast.error(err.message || 'Gagal menginput retur')
    }
  })
}

export const useUpdateSembakoReturnStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => {
      try {
        await supabase.from('sembako_returns').update({ status }).eq('id', id)
      } catch (e) {
        // ignore
      }
      // Update local storage
      const saved = localStorage.getItem('gopek_retur_list')
      if (saved) {
        const list = JSON.parse(saved)
        const updated = list.map(r => r.id === id ? { ...r, status } : r)
        localStorage.setItem('gopek_retur_list', JSON.stringify(updated))
      }
      return { id, status }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sembako-returns'] })
    }
  })
}


