import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import {
  useSembakoDashboardStats,
  useSembakoSales,
  useSembakoEmployees,
  useSembakoDeliveries,
  useSembakoProducts,
  useSembakoSuppliers,
  useSembakoAllBatches,
  useSembakoExpenses,
  useSembakoPayroll
} from '@/lib/hooks/useSembakoData'
import {
  startOfWeek, startOfMonth, subMonths, addDays, format,
} from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { C } from './components/sembakoSaleUtils'
import { SembakoTambahStokSheet } from './components/SembakoTambahStokSheet'
import { SembakoErrorState } from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'
 
import { BerandaSkeleton } from './components/beranda/BerandaUtils'
import { DesktopBeranda } from './components/beranda/DesktopBeranda'
import { MobileBeranda } from './components/beranda/MobileBeranda'

const MC = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  input: '#F1F5F9',
  accent: '#0F172A',
  amber: '#D97706',
  green: '#16A34A',
  red: '#DC2626',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  borderAm: '#F1F5F9',
}

export default function SembakoBeranda() {
  const navigate    = useNavigate()
  const { profile, tenant, profiles, switchTenant } = useAuth()
  const isDesktop  = useMediaQuery('(min-width: 1024px)')
 
  const { data: stats, isLoading: statsLoading, isError: isStatsError, error: statsError, refetch: refetchStats } = useSembakoDashboardStats()
  const { data: sales = [],      isLoading: salesLoading } = useSembakoSales()
  const { data: employees = [] }                           = useSembakoEmployees()
  const { data: deliveries = [] }                          = useSembakoDeliveries()
  const { data: products = [] }                            = useSembakoProducts()
  const { data: suppliers = [] }                           = useSembakoSuppliers()
  const { data: batches = [] }                             = useSembakoAllBatches()
  const { data: expenses = [] }                            = useSembakoExpenses()
  const { data: payroll = [] }                             = useSembakoPayroll()

  // Chart + insight state
  const [chartPeriod,   setChartPeriod]   = useState('weekly')
  const [selectedDate,  setSelectedDate]  = useState(new Date())
  const [currentMonth,  setCurrentMonth]  = useState(new Date())
  const [agendaFilter,  setAgendaFilter]  = useState('Semua')
  const [stokOpen,      setStokOpen]      = useState(false)

  const name = profile?.full_name?.split(' ')[0] || 'Pengguna'

  // Build chart data — Sales chart (invoice-date) + Cash summary (payment-date)
  const { weeklyChartData, monthlyChartData, insight, kpiTrends, cashSummary, unrealizedProfitSnapshot } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const mondayStart = startOfWeek(today, { weekStartsOn: 1 })
    const monthStart  = startOfMonth(today)
    const m1Start     = startOfMonth(subMonths(today, 1))

    // ── Sales Chart Data (pure invoice-date based) ──
    const buildData = (start, end) => {
      const days = []
      let curr = new Date(start)
      while (curr <= end) {
        const dStr = format(curr, 'yyyy-MM-dd')
        const isFuture = curr > today
        const daySales = isFuture ? [] : sales.filter(s => s.transaction_date?.slice(0, 10) === dStr)
        const isWeekly = (end - start) / 86400000 < 8

        // Gross Profit = Revenue - COGS (before ops deduction)
        const grossProfit = isFuture ? 0 : daySales.reduce((s, sale) => {
          const net = Number(sale.net_profit) || 0
          const ops = Number(sale.delivery_cost || 0) + Number(sale.other_cost || 0)
          return s + (net + ops)
        }, 0)

        // Net Profit = Revenue - COGS - Ops
        const netProfit = isFuture ? 0 : daySales.reduce((s, sale) => {
          return s + (Number(sale.net_profit) || 0)
        }, 0)

        days.push({
          name: isWeekly
            ? format(curr, 'EEE', { locale: idLocale })
            : format(curr, 'd'),
          fullDate: format(curr, 'EEEE, d MMMM yyyy', { locale: idLocale }),
          grossProfit,
          netProfit,
          txs: daySales.slice(0, 3).map(s => ({
            id: s.id,
            label: s.sembako_customers?.customer_name || s.customer_name || `Invoice #${s.id?.slice(0, 4)}`,
            amount: Number(s.total_amount) || 0,
            paid: Number(s.paid_amount) || 0,
            remaining: Number(s.remaining_amount) || 0,
            netProfit: Number(s.net_profit) || 0,
            paymentStatus: s.payment_status || 'belum_lunas',
          })),
          txCount: daySales.length,
        })
        curr = addDays(curr, 1)
      }
      return days
    }

    const weeklyChartData  = buildData(mondayStart, addDays(mondayStart, 6))
    const monthlyChartData = buildData(monthStart, today)

    // ── Cash Summary (payment-date based, computed once for current state) ──
    const INITIAL_CAPITAL = 0

    // Cash In: all payments ever received (including negative refund payments to get net cash inflow)
    const totalCashIn = sales.reduce((sum, s) => {
      return sum + (s.sembako_payments || [])
        .filter(p => !p.is_deleted)
        .reduce((acc, p) => acc + (Number(p.amount || p.amount_paid || 0)), 0)
    }, 0)

    // Cash Out: purchases + expenses + payroll
    const totalCashOutPurchases = suppliers.reduce((sum, s) => sum + (Number(s.total_paid_value) || 0), 0)
    const totalCashOutExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    const totalCashOutPayroll = payroll.reduce((sum, p) => sum + (Number(p.total_pay) || 0), 0)
    const totalCashOut = totalCashOutPurchases + totalCashOutExpenses + totalCashOutPayroll
    const cashBalance = INITIAL_CAPITAL + totalCashIn - totalCashOut

    // Realized & Unrealized Profit: computed per sale as clean integers with no rounding discrepancies
    let totalRealizedProfit = 0
    let totalUnrealizedProfit = 0

    sales.forEach(s => {
      const net = Number(s.net_profit) || 0
      const total = Number(s.total_amount) || 0
      const paid = Number(s.paid_amount) || 0
      let realized = 0
      if (total > 0) {
        const ratio = Math.max(0, Math.min(1, paid / total))
        realized = Math.round(net * ratio)
      } else {
        realized = net
      }
      const unrealized = net - realized
      totalRealizedProfit += realized
      totalUnrealizedProfit += unrealized
    })

    const cashSummary = {
      totalCashIn,
      totalCashOutPurchases,
      totalCashOutExpenses,
      totalCashOutPayroll,
      totalCashOut,
      cashBalance,
      realizedProfit: totalRealizedProfit,
    }

    // ── Unrealized Profit Snapshot ──
    const unrealizedProfitSnapshot = totalUnrealizedProfit

    // ── Smart insight: W0 vs W1 (net profit based on invoice date — stable) ──
    const w0Start = addDays(today, -6)
    const w1End   = addDays(w0Start, -1)
    const w1Start = addDays(w1End, -6)
    const getNetProfit = (from, to) => sales
      .filter(s => { const d = new Date(s.transaction_date); return d >= from && d <= to })
      .reduce((sum, s) => sum + (Number(s.net_profit) || 0), 0)

    const w0 = getNetProfit(w0Start, today)
    const w1 = getNetProfit(w1Start, w1End)
    let insight = null
    if (w1 !== 0) {
      const diff = ((w0 - w1) / Math.abs(w1)) * 100
      insight = {
        type: diff >= 0 ? 'up' : 'down',
        value: Math.abs(diff).toFixed(0),
        text: diff >= 0
          ? `↑ Profit naik +${Math.abs(diff).toFixed(0)}% dibanding minggu lalu`
          : `↓ Profit turun ${Math.abs(diff).toFixed(0)}% dibanding minggu lalu`,
      }
    }

    // KPI trends: this month vs last month
    const m0Sales = sales.filter(s => new Date(s.transaction_date) >= monthStart && new Date(s.transaction_date) <= today)
    const m1Sales = sales.filter(s => { const d = new Date(s.transaction_date); return d >= m1Start && d < monthStart })
    const m0Outstanding = m0Sales.filter(s => s.payment_status !== 'lunas').reduce((s, i) => s + (i.remaining_amount || 0), 0)
    const m1Outstanding = m1Sales.filter(s => s.payment_status !== 'lunas').reduce((s, i) => s + (i.remaining_amount || 0), 0)
    const piutangTrend = m1Outstanding !== 0 ? ((m0Outstanding - m1Outstanding) / m1Outstanding) * 100 : null
    const txTrend = m1Sales.length !== 0 ? ((m0Sales.length - m1Sales.length) / m1Sales.length) * 100 : null

    // ── Diagnostic Logging for Verification ──
    console.group('[Dashboard Audit Log]')
    console.log('Total sales loaded:', sales.length)
    let debugRevenue = 0, debugNetProfit = 0, debugPiutang = 0, debugPaid = 0, debugRealized = 0, debugUnrealized = 0
    sales.forEach((s, i) => {
      const net = Number(s.net_profit) || 0
      const total = Number(s.total_amount) || 0
      const paid = Number(s.paid_amount) || 0
      const remaining = Number(s.remaining_amount) || 0
      
      const ratio = total > 0 ? Math.max(0, Math.min(1, paid / total)) : 1
      const realized = Math.round(net * ratio)
      const unrealized = net - realized

      debugRevenue += total
      debugNetProfit += net
      debugPiutang += remaining
      debugPaid += paid
      debugRealized += realized
      debugUnrealized += unrealized

      console.log(`Invoice #${i+1} (ID: ${s.id?.slice(0,6)}) | Rev: ${total} | Paid: ${paid} | Outstanding: ${remaining} | Profit: ${net} | Realized: ${realized} | Unrealized: ${unrealized} | Status: ${s.payment_status}`)
    })
    console.log('----------------------------------------')
    console.log(`Calculated Total Revenue:        Rp${debugRevenue}`)
    console.log(`Calculated Total Net Profit:     Rp${debugNetProfit}`)
    console.log(`Calculated Total Piutang:        Rp${debugPiutang}`)
    console.log(`Calculated Total Paid (Invoices):Rp${debugPaid}`)
    console.log(`Calculated Total Realized Profit:Rp${debugRealized}`)
    console.log(`Calculated Total Unrealized:     Rp${debugUnrealized}`)
    console.log(`Calculated Total Cash In (Net):  Rp${totalCashIn}`)
    console.log(`Calculated Cash Balance:         Rp${cashBalance}`)
    console.groupEnd()

    return { weeklyChartData, monthlyChartData, insight, kpiTrends: { piutangTrend, txTrend }, cashSummary, unrealizedProfitSnapshot }
  }, [sales, batches, expenses, payroll, suppliers])

  if (statsLoading && !!tenant?.id) {
    return (
      <div style={{ background: MC.bg, minHeight: '100vh' }}>
        <BerandaSkeleton isDesktop={isDesktop} />
      </div>
    )
  }

  if (isStatsError) return <div style={{ minHeight: '100vh', background: MC.bg }}><SembakoErrorState error={statsError} onRetry={refetchStats} /></div>

  const sharedProps = {
    profile, stats, sales, employees, deliveries, products, navigate, name, salesLoading,
    insight, kpiTrends, chartPeriod, setChartPeriod,
    weeklyChartData, monthlyChartData, cashSummary, unrealizedProfitSnapshot,
    selectedDate, setSelectedDate,
    currentMonth, setCurrentMonth,
    agendaFilter, setAgendaFilter,
    setStokOpen,
    batches,
    suppliers
  }

  return (
    <div style={{ background: MC.bg, minHeight: '100vh', color: MC.text }}>
      {isDesktop ? (
        <DesktopBeranda {...sharedProps} />
      ) : (
        <MobileBeranda {...sharedProps} profile={profile} tenant={tenant} profiles={profiles} switchTenant={switchTenant} />
      )}

      <AnimatePresence>
        {stokOpen && (
          <SembakoTambahStokSheet
            onClose={() => setStokOpen(false)}
            products={products}
            suppliers={suppliers}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
