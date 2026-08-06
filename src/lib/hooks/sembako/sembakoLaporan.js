import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../supabase'
import { useAuth } from '../useAuth'
import { normalizeSupabaseError } from '../../supabaseErrorHandler'
import { STALE_5M } from './sembakoCommon'
import { processSaleRow } from './sembakoSales'

export const useSembakoDashboardStats = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-dashboard-stats', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      try {
        const [productsRes, salesRes, expensesRes, payrollRes, returnsRes, batchesRes] =
          await Promise.all([
            supabase.from('sembako_products')
              .select('id, product_name, current_stock, avg_buy_price, sell_price, min_stock_alert')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false).eq('is_active', true),
            supabase.from('sembako_sales')
              .select('*, sembako_sale_items(*), sembako_payments(*)')
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
            supabase.from('sembako_returns')
              .select('quantity, unit_price, total_amount, created_at')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false),
            supabase.from('sembako_stock_batches')
              .select('product_id, qty_sisa, buy_price')
              .eq('tenant_id', tenant.id)
              .eq('is_deleted', false)
              .gt('qty_sisa', 0),
          ])

        if (productsRes.error) console.error('Sembako Stats (Products):', productsRes.error)
        if (salesRes.error) console.error('Sembako Stats (Sales):', salesRes.error)
        if (expensesRes.error) console.error('Sembako Stats (Expenses):', expensesRes.error)
        if (payrollRes.error) console.error('Sembako Stats (Payroll):', payrollRes.error)

        const products = productsRes.data || []
        const rawSales = salesRes.data || []
        const expenses = expensesRes.data || []
        const payroll = payrollRes.data || []
        const returnsList = returnsRes.data || []
        const activeBatches = batchesRes.data || []

        const sales = rawSales.map(sale => processSaleRow(sale, returnsList))

        const now = new Date()
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

        const expenseThisMonth = expenses
          .filter(e => new Date(e.expense_date) > thirtyDaysAgo)
          .reduce((s, e) => s + (e.amount || 0), 0)
        const payrollThisMonth = payroll
          .filter(p => new Date(p.period_date) > thirtyDaysAgo)
          .reduce((s, p) => s + (p.total_pay || 0), 0)

        const salesThisMonth = sales.filter(s => new Date(s.transaction_date) > thirtyDaysAgo)

        const revenueThisMonth = salesThisMonth.reduce((s, i) => s + (i.total_amount || 0), 0)
        const saleNetProfitThisMonth = salesThisMonth.reduce((s, i) => s + (i.net_profit || 0), 0)
        const netProfitThisMonth = Math.max(0, saleNetProfitThisMonth - expenseThisMonth - payrollThisMonth)
        const grossProfitThisMonth = salesThisMonth.reduce((s, i) => s + (i.gross_profit || 0), 0)

        return {
          stok: {
            totalProduk: products.length,
            lowStock: products.filter(p =>
              p.min_stock_alert > 0 && p.current_stock <= p.min_stock_alert
            ),
            nilaiStok: activeBatches.length > 0
              ? activeBatches.reduce((s, b) => s + (Number(b.qty_sisa || 0) * Number(b.buy_price || 0)), 0)
              : products.reduce((s, p) => s + (p.current_stock * p.avg_buy_price), 0),
          },
          penjualan: {
            totalRevenue: sales.reduce((s, i) => s + (i.total_amount || 0), 0),
            revenueThisMonth,
            netProfitThisMonth,
            grossProfitThisMonth,
            totalOutstanding: sales.reduce((s, i) => s + (i.remaining_amount || 0), 0),
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

        const sales = salesRes.data || []
        const expenses = expensesRes.data || []
        const payroll = payrollRes.data || []
        const batches = batchesRes.data || []

        const totalRevenue = sales.reduce((s, i) => s + (i.total_amount || 0), 0)
        const totalCOGS = sales.reduce((s, i) => s + (i.total_cogs || 0), 0)
        const totalDeliveryCost = sales.reduce((s, i) => s + (i.delivery_cost || 0), 0)
        const totalOtherCost = sales.reduce((s, i) => s + (i.other_cost || 0), 0)
        const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0)
        const totalPayroll = payroll.reduce((s, p) => s + (p.total_pay || 0), 0)
        const grossProfit = totalRevenue - totalCOGS
        const netProfit = grossProfit - totalDeliveryCost - totalOtherCost - totalExpenses - totalPayroll
        const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue * 100).toFixed(1) : 0
        const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue * 100).toFixed(1) : 0

        const byProduct = {}
        sales.forEach(sale => {
          ;(sale.sembako_sale_items || []).forEach(item => {
            const key = item.product_name || 'Lainnya'
            if (!byProduct[key]) byProduct[key] = { revenue: 0, cogs: 0, qty: 0, unit: item.unit }
            const qty = item.quantity || 0
            const sellPrice = item.sell_price || 0
            const cogsPerUnit = item.cogs_per_unit || 0
            // Use stored subtotal/cogs_total if available; fall back to computed values for old data
            byProduct[key].revenue += (item.subtotal > 0 ? item.subtotal : Math.round(qty * sellPrice))
            byProduct[key].cogs    += (item.cogs_total > 0 ? item.cogs_total : Math.round(qty * cogsPerUnit))
            byProduct[key].qty     += qty
          })
        })

        const byCustomer = {}
        sales.forEach(sale => {
          const key = sale.customer_name || 'Umum'
          if (!byCustomer[key]) byCustomer[key] = { revenue: 0, profit: 0, count: 0, type: sale.sembako_customers?.customer_type }
          byCustomer[key].revenue += sale.total_amount || 0
          byCustomer[key].profit += sale.net_profit || 0
          byCustomer[key].count++
        })

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
  })
}

export const useSembakoExpenses = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-expenses', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sembako_expenses')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('expense_date', { ascending: true })
      if (error) throw normalizeSupabaseError(error)
      return data || []
    }
  })
}

export const useSembakoPayroll = () => {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['sembako-payroll', tenant?.id],
    enabled: !!tenant?.id,
    staleTime: STALE_5M,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sembako_payroll')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('period_date', { ascending: true })
      if (error) throw normalizeSupabaseError(error)
      return data || []
    }
  })
}

