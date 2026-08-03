// DesktopBeranda.jsx — Layout Beranda Desktop
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  CreditCard, TrendingUp, Package, Receipt,
  Plus, AlertTriangle, ChevronRight,
} from 'lucide-react'
import { canViewProfit } from '@/lib/auth/business-roles'
import { formatIDR } from '@/lib/format'
import SmartInsight from '@/dashboard/_shared/components/SmartInsight'
import { C } from '../sembakoSaleUtils'
import { KPICard, InvoiceRow, QuickStatRow } from './BerandaUtils'
import { ProfitChart, StockTrendChart } from './BerandaCharts'
import { AgendaSection } from './BerandaAgenda'
import { CollectionReminders } from './CollectionReminders'

export function DesktopBeranda({
  profile, products = [], stats, sales, employees, navigate, name, salesLoading,
  insight, kpiTrends, chartPeriod, setChartPeriod, weeklyChartData, monthlyChartData,
  deliveries, selectedDate, setSelectedDate, currentMonth, setCurrentMonth,
  agendaFilter, setAgendaFilter, setStokOpen,
}) {
  const { brokerType } = useParams()
  const brokerBase = `/broker/${brokerType}`
  const now = new Date()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
  const recentSales = useMemo(() => sales.slice(0, 5), [sales])
  const invoiceThisMonth = sales.filter(s => new Date(s.transaction_date) > thirtyDaysAgo).length
  const activeEmployees  = employees.filter(e => e.status === 'aktif').length
  const lowStock  = stats?.stok?.lowStock || []
  const overdue   = stats?.penjualan?.overdueCount || 0
  const totalExp  = (stats?.pengeluaran?.totalExpenseThisMonth || 0) + (stats?.pengeluaran?.totalPayrollThisMonth || 0)
  const showProfit = canViewProfit(profile)

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: C.text, fontFamily: 'DM Sans' }}>
            Selamat datang, {name}
          </h1>
          <p style={{ fontSize: '12px', color: C.muted, marginTop: '4px', fontWeight: 600, letterSpacing: '0.08em' }}>
            DASHBOARD DISTRIBUTOR ROKOK
          </p>
          <SmartInsight insight={insight} className="mt-2" />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setStokOpen(true)}
            style={{
              background: 'rgba(234,88,12,0.1)', color: C.accent, border: `1px solid rgba(234,88,12,0.2)`, borderRadius: '12px',
              padding: '0 20px', height: '40px', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <Package size={16} /> Tambah Stok
          </button>
          <button
            onClick={() => navigate(`${brokerBase}/penjualan?action=new`)}
            style={{
              background: '#EA580C', color: '#fff', border: 'none', borderRadius: '12px',
              padding: '0 20px', height: '40px', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 16px rgba(234,88,12,0.3)',
            }}
          >
            <Plus size={16} /> Catat Penjualan
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px', marginTop: '20px' }}>
        <KPICard icon={CreditCard}  label="Piutang Toko"       value={formatIDR(stats?.penjualan?.totalOutstanding || 0)} sub={overdue > 0 ? `${overdue} jatuh tempo` : 'Semua lancar'} urgent={(stats?.penjualan?.totalOutstanding||0)>0} trend={kpiTrends?.piutangTrend} />
        <KPICard icon={TrendingUp}  label="Revenue Bulan Ini"  value={formatIDR(stats?.penjualan?.revenueThisMonth || 0)}  sub={showProfit ? `Net profit (after ops): ${formatIDR(stats?.penjualan?.netProfitThisMonth || 0)}` : 'Akses Admin (Profit Disembunyikan)'} trend={kpiTrends?.txTrend} />
        <KPICard icon={Package}     label="Nilai Stok Gudang"  value={formatIDR(stats?.stok?.nilaiStok || 0)}              sub={`${stats?.stok?.totalProduk || 0} jenis produk`} accentColor={C.amber} badge={lowStock.length > 0 ? `${lowStock.length} menipis` : null} />
        <KPICard icon={Receipt}     label="Pengeluaran Bulan Ini" value={showProfit ? formatIDR(totalExp) : '***'} sub="Termasuk gaji pegawai" accentColor="#EF4444" />
      </div>

      {/* Main grid: left content + right agenda */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div>
          {showProfit && (
            <ProfitChart weeklyData={weeklyChartData} monthlyData={monthlyChartData} chartPeriod={chartPeriod} setChartPeriod={setChartPeriod} isDesktop={true} />
          )}

          {/* Grafik Stok Gudang */}
          <StockTrendChart products={products} isDesktop={true} />

          {lowStock.length > 0 && (
            <div style={{ background: 'rgba(245,158,11,0.06)', border: `1px solid ${C.borderAm}`, borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <AlertTriangle size={16} color={C.amber} />
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.amber, letterSpacing: '0.1em' }}>STOK MENIPIS</span>
                <span style={{ background: 'rgba(245,158,11,0.15)', color: C.amber, fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '6px' }}>{lowStock.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lowStock.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.card, borderRadius: '10px', padding: '10px 12px' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{p.product_name}</p>
                      <p style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>Sisa: {p.current_stock} {p.unit || ''} · Min: {p.min_stock_alert}</p>
                    </div>
                    <button onClick={() => navigate(`${brokerBase}/gudang?action=tambah&product=${p.id}`)}
                      style={{ background: 'rgba(234,88,12,0.15)', border: `1px solid rgba(234,88,12,0.3)`, color: C.accent, borderRadius: '8px', padding: '5px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                      Tambah Stok
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <CollectionReminders sales={sales} navigate={navigate} brokerBase={brokerBase} />

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '16px' }}>
            <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em' }}>INVOICE TERBARU</span>
                <button onClick={() => navigate(`${brokerBase}/penjualan`)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: C.muted, fontSize: '11px', fontWeight: 600 }}>
                  Lihat semua <ChevronRight size={12} />
                </button>
              </div>
              {salesLoading
                ? <p style={{ color: C.muted, fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>Memuat...</p>
                : recentSales.length === 0
                  ? <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted, fontSize: '13px' }}>
                      <Package size={28} color={C.muted} style={{ margin: '0 auto 8px' }} />
                      <p>Belum ada invoice</p>
                    </div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {recentSales.map(s => (
                        <InvoiceRow
                          key={s.id}
                          sale={s}
                          onClick={() => navigate(`${brokerBase}/penjualan?saleId=${s.id}`)}
                        />
                      ))}
                    </div>
              }
            </div>
            <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em', marginBottom: '6px' }}>RINGKASAN</span>
              <QuickStatRow label="Produk Aktif"       value={stats?.stok?.totalProduk || 0} />
              <QuickStatRow label="Pegawai Aktif"       value={activeEmployees} />
              <QuickStatRow label="Invoice Bulan Ini"   value={invoiceThisMonth} />
              <QuickStatRow label="Total Piutang"       value={formatIDR(stats?.penjualan?.totalOutstanding || 0)} />
              <QuickStatRow label="Invoice Jatuh Tempo" value={overdue > 0 ? <span style={{ color: '#EF4444' }}>{overdue}</span> : '0'} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Agenda */}
        <AgendaSection
          sales={sales}
          deliveries={deliveries}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          agendaFilter={agendaFilter}
          setAgendaFilter={setAgendaFilter}
          isMobile={false}
        />

      </div>
    </div>
  )
}
