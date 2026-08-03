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
  useSembakoSuppliers
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

  // Chart + insight state
  const [chartPeriod,   setChartPeriod]   = useState('weekly')
  const [selectedDate,  setSelectedDate]  = useState(new Date())
  const [currentMonth,  setCurrentMonth]  = useState(new Date())
  const [agendaFilter,  setAgendaFilter]  = useState('Semua')
  const [stokOpen,      setStokOpen]      = useState(false)

  const name = profile?.full_name?.split(' ')[0] || 'Pengguna'

  // Build chart data
  const { weeklyChartData, monthlyChartData, insight, kpiTrends } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const mondayStart = startOfWeek(today, { weekStartsOn: 1 })
    const monthStart  = startOfMonth(today)
    const m1Start     = startOfMonth(subMonths(today, 1))

    const buildData = (start, end) => {
      const days = []
      let curr = new Date(start)
      while (curr <= end) {
        const dStr = format(curr, 'yyyy-MM-dd')
        const isFuture = curr > today
        const daySales = isFuture ? [] : sales.filter(s => s.transaction_date?.slice(0, 10) === dStr)
        const isWeekly = (end - start) / 86400000 < 8
        days.push({
          name: isWeekly
            ? format(curr, 'EEE', { locale: idLocale })
            : format(curr, 'd'),
          fullDate: format(curr, 'EEEE, d MMMM yyyy', { locale: idLocale }),
          profit: isFuture ? 0 : daySales.reduce((s, sale) => {
            const rev  = Number(sale.total_amount || 0)
            const cogs = Number(sale.total_cogs   || 0)
            const del  = Number(sale.delivery_cost || 0)
            const oth  = Number(sale.other_cost    || 0)
            return s + (rev - cogs - del - oth)
          }, 0),
          txs: daySales.map(s => ({
            id: s.id,
            label: s.sembako_customers?.customer_name || s.customer_name || `Invoice #${s.id?.slice(0, 4)}`,
            value: Number(s.net_profit || 0),
          })),
        })
        curr = addDays(curr, 1)
      }
      return days
    }

    const weeklyChartData  = buildData(mondayStart, addDays(mondayStart, 6))
    const monthlyChartData = buildData(monthStart, today)

    // Smart insight: W0 vs W1
    const w0Start = addDays(today, -6)
    const w1End   = addDays(w0Start, -1)
    const w1Start = addDays(w1End, -6)
    const getProfit = (from, to) => sales
      .filter(s => { const d = new Date(s.transaction_date); return d >= from && d <= to })
      .reduce((sum, s) => sum + Number(s.net_profit || 0), 0)
    const w0 = getProfit(w0Start, today)
    const w1 = getProfit(w1Start, w1End)
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

    return { weeklyChartData, monthlyChartData, insight, kpiTrends: { piutangTrend, txTrend } }
  }, [sales])

  if (statsLoading && !!tenant?.id) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh' }}>
        <BerandaSkeleton isDesktop={isDesktop} />
      </div>
    )
  }

  if (isStatsError) return <div style={{ minHeight: '100vh', background: C.bg }}><SembakoErrorState error={statsError} onRetry={refetchStats} /></div>

  const sharedProps = {
    profile, stats, sales, employees, deliveries, products, navigate, name, salesLoading,
    insight, kpiTrends, chartPeriod, setChartPeriod,
    weeklyChartData, monthlyChartData,
    selectedDate, setSelectedDate,
    currentMonth, setCurrentMonth,
    agendaFilter, setAgendaFilter,
    setStokOpen,
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
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
