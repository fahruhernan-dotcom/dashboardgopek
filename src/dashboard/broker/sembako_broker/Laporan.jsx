import React, { useState, useMemo } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { BrokerMobileHeader } from '@/dashboard/broker/_shared/components/BrokerMobileHeader'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, DollarSign, Receipt,
  ChevronDown, ChevronUp, Calendar, Lock, BarChart3, Printer, FileText,
} from 'lucide-react'
import FinancialReportPdfModal from '@/dashboard/broker/sembako_broker/components/FinancialReportPdfModal'
import { useAuth } from '@/lib/hooks/useAuth'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts'
import { useSembakoLaporan } from '@/lib/hooks/useSembakoData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR } from '@/lib/format'
import TopBar from '@/dashboard/_shared/components/TopBar'
import { DatePicker } from '@/components/ui/DatePicker'
import { C, fmtDate, CustomSelect } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import { SembakoErrorState } from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'

const PIE_COLORS = ['#EA580C', '#F59E0B', '#021a02', '#60A5FA', '#A78BFA', '#F472B6', '#FB923C']
const CATEGORY_LABEL = {
  sewa_gudang: 'Sewa Gudang', listrik_air: 'Listrik & Air', bbm: 'BBM',
  perawatan: 'Perawatan', packaging: 'Packaging', administrasi: 'Administrasi', lainnya: 'Lainnya',
}
const STATUS_STYLE = {
  lunas: { bg: 'rgba(2, 26, 2,0.12)', color: C.green, label: 'Lunas' },
  sebagian: { bg: 'rgba(245,158,11,0.12)', color: C.amber, label: 'Sebagian' },
  belum_lunas: { bg: 'rgba(239,68,68,0.12)', color: C.red, label: 'Belum Lunas' },
}

// ── MAIN ────────────────────────────────────────────────────────────────────
export default function SembakoLaporan() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setSidebarOpen = () => window.dispatchEvent(new Event('toggleMobileSidebar')) } = useOutletContext() || {}
  const { tenant } = useAuth()
  const sub = getSubscriptionStatus(tenant)
  const isStarter = sub.status !== 'active' && sub.status !== 'trial'

  // Compute before useState so initial values are stable regardless of isStarter.
  // Rules of Hooks: all hooks must be called unconditionally before any early return.
  const now = new Date()

  // Default ke bulan berjalan agar first load cepat dan relevan
  const bulanStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const bulanEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const [startDate, setStartDate] = useState(bulanStart)
  const [endDate, setEndDate] = useState(bulanEnd)
  const [preset, setPreset] = useState('bulan_ini')
  const [pdfModal, setPdfModal] = useState({ open: false, type: 'business_result' })

  const { data, isLoading, isFetching, isError, error, refetch } = useSembakoLaporan(startDate, endDate)

  // ── Upgrade wall — must come after all hooks ──────────────────────────────
  if (isStarter) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh' }}>
        {!isDesktop && <BrokerMobileHeader title="Laporan" onMenuClick={() => setSidebarOpen(true)} />}
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(234,88,12,0.12)', border: '1px solid rgba(234,88,12,0.25)' }}>
            <Lock size={28} style={{ color: '#EA580C' }} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
              style={{ background: 'rgba(234,88,12,0.1)', border: '1px solid rgba(234,88,12,0.2)' }}>
              <BarChart3 size={11} style={{ color: '#EA580C' }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#EA580C' }}>Fitur Pro</span>
            </div>
            <h2 className="font-display font-black text-xl text-white mb-2">Laporan Keuangan</h2>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color: '#64748B' }}>
              Akses laporan P&L, analitik pengeluaran, dan breakdown omzet tersedia di plan{' '}
              <span className="text-white font-bold">Pro</span> dan <span className="text-white font-bold">Business</span>.
            </p>
          </div>
          <Link
            to="/upgrade"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm text-white transition-colors"
            style={{ background: '#EA580C', boxShadow: '0 4px 20px rgba(234,88,12,0.3)' }}
          >
            Lihat Paket Pro →
          </Link>
        </div>
      </div>
    )
  }

  const handlePresetChange = (val) => {
    setPreset(val)
    const t = new Date()
    if (val === 'hari_ini') {
      const d = t.toISOString().slice(0, 10)
      setStartDate(d)
      setEndDate(d)
    } else if (val === 'minggu_ini') {
      const d = new Date(t)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
      const start = new Date(d.setDate(diff))
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      setStartDate(start.toISOString().slice(0, 10))
      setEndDate(end.toISOString().slice(0, 10))
    } else if (val === 'bulan_ini') {
      const start = new Date(t.getFullYear(), t.getMonth(), 1)
      const end = new Date(t.getFullYear(), t.getMonth() + 1, 0) // Last day
      setStartDate(start.toISOString().slice(0, 10))
      setEndDate(end.toISOString().slice(0, 10))
    } else if (val === 'keseluruhan') {
      const start = tenant?.created_at ? new Date(tenant.created_at).toISOString().slice(0, 10) : '2024-01-01'
      const end = t.toISOString().slice(0, 10)
      setStartDate(start)
      setEndDate(end)
    }
  }

  const s = data?.summary || {}

  return (
    <div className="bg-background min-h-screen text-foreground pb-24 text-left">
      {!isDesktop && <BrokerMobileHeader title="Laporan" onMenuClick={() => setSidebarOpen(true)} />}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-4 sm:pt-6">

        {/* Header + Date picker */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="hidden md:block text-2xl font-bold text-foreground">
              Laporan Keuangan & Bisnis
            </h1>
            <p className="hidden md:block text-xs text-muted-foreground mt-0.5">
              Analisis performa omzet, HPP, margin & laba bersih
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <div className="w-full sm:w-36">
              <CustomSelect
                value={preset}
                onChange={handlePresetChange}
                options={[
                  { value: 'hari_ini', label: 'Hari Ini' },
                  { value: 'minggu_ini', label: 'Minggu Ini' },
                  { value: 'bulan_ini', label: 'Bulan Ini' },
                  { value: 'keseluruhan', label: 'Keseluruhan' },
                  { value: 'custom', label: 'Kustom' }
                ]}
                placeholder="Pilih Rentang"
              />
            </div>
            {preset === 'custom' && (
              <div className="flex items-center gap-2">
                <DatePicker id="start-date" value={startDate} onChange={val => setStartDate(val)} placeholder="Start" />
                <span className="text-muted-foreground font-bold text-xs">—</span>
                <DatePicker id="end-date" value={endDate} onChange={val => setEndDate(val)} placeholder="End" />
              </div>
            )}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPdfModal({ open: true, type: 'business_result' })}
                disabled={!data}
                className="flex items-center gap-1.5 px-3 h-10 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white transition-all cursor-pointer shadow-lg shadow-amber-600/20 active:scale-95 disabled:opacity-50 border-0"
              >
                <Printer size={14} />
                <span>PDF Hasil Bisnis</span>
              </button>
              <button
                type="button"
                onClick={() => setPdfModal({ open: true, type: 'cashflow' })}
                disabled={!data}
                className="flex items-center gap-1.5 px-3 h-10 rounded-xl font-bold text-xs bg-card border border-border/60 hover:bg-muted text-foreground transition-all cursor-pointer disabled:opacity-50"
              >
                <FileText size={14} className="text-amber-500" />
                <span>PDF Arus Kas</span>
              </button>
            </div>
          </div>
        </div>

        {isLoading ? <LoadingSkeleton /> : isError ? (
          <SembakoErrorState error={error} onRetry={refetch} />
        ) : !data ? (
          <p style={{ color: C.muted, textAlign: 'center', padding: '60px 0' }}>Pilih rentang tanggal untuk melihat laporan</p>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Overlay saat ganti periode / refetch */}
            {isFetching && !isLoading && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(6,9,15,0.55)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1C1208', border: '1px solid rgba(234,88,12,0.2)', borderRadius: 12, padding: '10px 20px' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(234,88,12,0.3)', borderTopColor: '#EA580C', animation: 'spin 0.7s linear infinite' }} />
                  <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#FEF3C7', fontWeight: 600 }}>Memuat data...</span>
                </div>
              </div>
            )}
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <>
              {/* SECTION A — KPI Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4,1fr)' : 'repeat(2,1fr)', gap: '12px', marginBottom: '24px' }}>
                <KPICard icon={DollarSign} label="Revenue (Akrual)" value={formatIDR(s.totalRevenue)} color={C.accent} />
                <KPICard icon={s.netProfit >= 0 ? TrendingUp : TrendingDown} label="Net Profit (Akrual)"
                  value={formatIDR(s.netProfit)}
                  badge={`${s.netMarginPct}%`}
                  color={s.netProfit >= 0 ? C.green : C.red} />
                <KPICard icon={s.netCashFlowPeriod >= 0 ? TrendingUp : TrendingDown} label="Arus Kas Bersih"
                  value={formatIDR(s.netCashFlowPeriod)}
                  color={s.netCashFlowPeriod >= 0 ? C.green : C.red}
                  subtitle="Kas Masuk - Kas Keluar" />
                <KPICard icon={TrendingUp} label="Laba Terkonversi Kas (Est)"
                  value={formatIDR(s.cashMarginEstimate)}
                  color={C.green}
                  subtitle="Estimasi laba cair proporsional" />
              </div>

              {/* SECTION B — Laba Rugi & Modal Beredar */}
              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1.2fr 0.8fr' : '1fr', gap: '16px', marginBottom: '24px' }}>
                <WaterfallPL summary={s} />
                <WorkingCapitalCard summary={s} />
              </div>

              {/* SECTION C — Laporan Arus Kas Rincian */}
              <CashFlowStatement summary={s} />

              {/* SECTION D — 2 columns */}
              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '3fr 2fr' : '1fr', gap: '16px', marginTop: '24px' }}>
                <ProductMarginTable byProduct={data.byProduct} />
                <TopCustomers byCustomer={data.byCustomer} />
              </div>

              {/* SECTION E — Expense Pie */}
              <ExpensePie expenseByCategory={data.expenseByCategory} summary={s} isDesktop={isDesktop} />

              {/* SECTION F — Invoice Table (Collapsible) */}
              <InvoiceCollapsible sales={data.sales} />
            </>
          </div>
        )}
      </div>

      <FinancialReportPdfModal
        open={pdfModal.open}
        onClose={() => setPdfModal(prev => ({ ...prev, open: false }))}
        reportType={pdfModal.type}
        data={data}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// KPI Card
// ═══════════════════════════════════════════════════════════════════════════
function KPICard({ icon: Icon, label, value, badge, color, subtitle }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{
      background: C.card, borderRadius: '14px', padding: '14px',
      border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
        {badge && (
          <span style={{
            fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
            background: `${color}18`, color,
          }}>{badge}</span>
        )}
      </div>
      <p style={{ fontSize: '10px', color: C.muted, fontWeight: 700, letterSpacing: '0.06em' }}>{label.toUpperCase()}</p>
      <p style={{ fontSize: '18px', fontWeight: 800, color: C.text, fontFamily: 'DM Sans', lineHeight: 1.2 }}>{value}</p>
      {subtitle && <p style={{ fontSize: '9px', color: C.muted, marginTop: '4px' }}>{subtitle}</p>}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Waterfall P&L
// ═══════════════════════════════════════════════════════════════════════════
function WaterfallPL({ summary: s }) {
  const maxVal = Math.max(s.totalGrossRevenue || s.totalRevenue, 1)
  const rows = [
    { label: 'Penjualan Kotor (Gross)', value: s.totalGrossRevenue || s.totalRevenue, type: 'positive' },
    { label: 'Retur Penjualan (Returns)', value: -Math.abs(s.totalReturns || 0), type: 'negative' },
    { label: 'Revenue Bersih', value: s.totalRevenue, type: 'subtotal' },
    { label: 'HPP (COGS)', value: -s.totalCOGS, type: 'negative' },
    { label: 'Gross Profit', value: s.grossProfit, type: 'subtotal' },
    { label: 'Biaya Kirim', value: -s.totalDeliveryCost, type: 'negative' },
    { label: 'Biaya Lain', value: -s.totalOtherCost, type: 'negative' },
    { label: 'Operasional', value: -s.totalExpenses, type: 'negative' },
    { label: 'Gaji Pegawai', value: -s.totalPayroll, type: 'negative' },
    { label: 'NET PROFIT', value: s.netProfit, type: 'total' },
  ]

  return (
    <div style={{ background: C.card, borderRadius: '16px', padding: '20px', border: `1px solid ${C.border}` }}>
      <p style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em', marginBottom: '16px' }}>LABA RUGI</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rows.map((row, i) => {
          const absVal = Math.abs(row.value)
          const barPct = maxVal > 0 ? Math.min((absVal / maxVal) * 100, 100) : 0
          const isNeg = row.type === 'negative'
          const isTot = row.type === 'total' || row.type === 'subtotal'
          const barColor = isNeg ? C.red : row.value >= 0 ? C.green : C.red
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '120px 1fr 110px', alignItems: 'center', gap: '10px',
              padding: isTot ? '8px 0' : '4px 0',
              borderTop: isTot ? `1px solid ${C.border}` : 'none',
            }}>
              <span style={{ fontSize: '11px', color: isTot ? C.text : C.muted, fontWeight: isTot ? 800 : 600 }}>
                {isNeg ? '−' : row.type === 'positive' ? '+' : '='} {row.label}
              </span>
              <div style={{ height: '10px', background: C.input, borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{
                  width: `${barPct}%`, height: '100%', borderRadius: '5px',
                  background: barColor, opacity: isTot ? 1 : 0.7,
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <span style={{
                fontSize: isTot ? '14px' : '12px', fontWeight: isTot ? 900 : 600,
                color: isNeg ? C.red : row.value >= 0 ? (isTot ? C.text : C.green) : C.red,
                textAlign: 'right', fontFamily: isTot ? 'DM Sans' : 'inherit',
              }}>
                {isNeg ? `- ${formatIDR(absVal)}` : formatIDR(absVal)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Product Margin Table
// ═══════════════════════════════════════════════════════════════════════════
function ProductMarginTable({ byProduct }) {
  const products = useMemo(() => {
    return Object.entries(byProduct).map(([name, d]) => {
      const profit = d.revenue - d.cogs
      const margin = d.revenue > 0 ? (profit / d.revenue * 100) : 0
      return { name, ...d, profit, margin }
    }).sort((a, b) => b.margin - a.margin)
  }, [byProduct])

  const totals = useMemo(() => products.reduce((t, p) => ({
    revenue: t.revenue + p.revenue, cogs: t.cogs + p.cogs, profit: t.profit + p.profit, qty: t.qty + p.qty,
  }), { revenue: 0, cogs: 0, profit: 0, qty: 0 }), [products])
  const totalMargin = totals.revenue > 0 ? (totals.profit / totals.revenue * 100) : 0

  function marginColor(m) { return m >= 20 ? C.green : m >= 10 ? C.amber : C.red }

  return (
    <div style={{ background: C.card, borderRadius: '16px', padding: '20px', border: `1px solid ${C.border}` }}>
      <p style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em', marginBottom: '14px' }}>MARGIN PER PRODUK</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Produk', 'Qty', 'Revenue', 'HPP', 'Profit', 'Margin'].map(h => (
                <th key={h} style={{ textAlign: h === 'Produk' ? 'left' : 'right', padding: '6px 4px', color: C.muted, fontWeight: 700, fontSize: '9px', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={i} style={{ borderBottom: `1px solid rgba(234,88,12,0.06)` }}>
                <td style={{ padding: '7px 4px', color: C.text, fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: '7px 4px', color: C.muted, textAlign: 'right' }}>{p.qty} {p.unit}</td>
                <td style={{ padding: '7px 4px', color: C.text, textAlign: 'right' }}>{formatIDR(p.revenue)}</td>
                <td style={{ padding: '7px 4px', color: C.muted, textAlign: 'right' }}>{formatIDR(p.cogs)}</td>
                <td style={{ padding: '7px 4px', color: p.profit >= 0 ? C.green : C.red, textAlign: 'right', fontWeight: 600 }}>{formatIDR(p.profit)}</td>
                <td style={{ padding: '7px 4px', textAlign: 'right' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '5px',
                    background: `${marginColor(p.margin)}18`, color: marginColor(p.margin),
                  }}>{p.margin.toFixed(1)}%</span>
                </td>
              </tr>
            ))}
            {/* Footer total */}
            <tr style={{ borderTop: `2px solid ${C.border}` }}>
              <td style={{ padding: '8px 4px', color: C.text, fontWeight: 800 }}>TOTAL</td>
              <td style={{ padding: '8px 4px', color: C.muted, textAlign: 'right', fontWeight: 700 }}>{totals.qty}</td>
              <td style={{ padding: '8px 4px', color: C.text, textAlign: 'right', fontWeight: 800 }}>{formatIDR(totals.revenue)}</td>
              <td style={{ padding: '8px 4px', color: C.muted, textAlign: 'right', fontWeight: 700 }}>{formatIDR(totals.cogs)}</td>
              <td style={{ padding: '8px 4px', color: totals.profit >= 0 ? C.green : C.red, textAlign: 'right', fontWeight: 800 }}>{formatIDR(totals.profit)}</td>
              <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '5px',
                  background: `${marginColor(totalMargin)}18`, color: marginColor(totalMargin),
                }}>{totalMargin.toFixed(1)}%</span>
              </td>
            </tr>
          </tbody>
        </table>
        {products.length === 0 && <p style={{ color: C.muted, fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>Tidak ada data produk</p>}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Top Customers
// ═══════════════════════════════════════════════════════════════════════════
function TopCustomers({ byCustomer }) {
  const customers = useMemo(() =>
    Object.entries(byCustomer).map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue).slice(0, 10)
    , [byCustomer])

  return (
    <div style={{ background: C.card, borderRadius: '16px', padding: '20px', border: `1px solid ${C.border}` }}>
      <p style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em', marginBottom: '14px' }}>TOP TOKO</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {customers.map((c, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 10px', background: C.input, borderRadius: '10px',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '20px', height: '20px', borderRadius: '6px',
                  background: i < 3 ? 'rgba(234,88,12,0.2)' : 'transparent',
                  color: i < 3 ? C.accent : C.muted,
                  fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{i + 1}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{formatIDR(c.revenue)}</p>
              <p style={{ fontSize: '9px', color: C.muted }}>{c.count} invoice</p>
            </div>
          </div>
        ))}
        {customers.length === 0 && <p style={{ color: C.muted, fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>Tidak ada data</p>}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Expense Pie Chart
// ═══════════════════════════════════════════════════════════════════════════
function ExpensePie({ expenseByCategory, summary: s, isDesktop }) {
  const pieData = useMemo(() => {
    const entries = [
      { name: 'HPP (COGS)', value: s.totalCOGS },
      { name: 'Biaya Kirim', value: s.totalDeliveryCost },
      { name: 'Gaji Pegawai', value: s.totalPayroll },
      ...Object.entries(expenseByCategory).map(([cat, val]) => ({
        name: CATEGORY_LABEL[cat] || cat, value: val,
      })),
    ].filter(d => d.value > 0)
    return entries
  }, [expenseByCategory, s])

  if (pieData.length === 0) return null

  return (
    <div style={{ background: C.card, borderRadius: '16px', padding: '20px', border: `1px solid ${C.border}`, marginTop: '24px' }}>
      <p style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em', marginBottom: '14px' }}>BREAKDOWN PENGELUARAN</p>
      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '20px', alignItems: 'center' }}>
        <div style={{ height: '240px', width: '100%', overflow: 'hidden' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2} strokeWidth={0}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', fontSize: '12px', color: C.text }}
                itemStyle={{ color: C.text }}
                formatter={(val) => [formatIDR(val), 'Jumlah']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {pieData.map((d, i) => {
            const total = pieData.reduce((s, x) => s + x.value, 0)
            const pct = total > 0 ? (d.value / total * 100).toFixed(1) : 0
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: C.muted, flex: 1 }}>{d.name}</span>
                <span style={{ fontSize: '11px', color: C.text, fontWeight: 700 }}>{formatIDR(d.value)}</span>
                <span style={{ fontSize: '10px', color: C.muted, fontWeight: 600, width: '36px', textAlign: 'right' }}>{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Collapsible Invoice Table
// ═══════════════════════════════════════════════════════════════════════════
function InvoiceCollapsible({ sales }) {
  const [open, setOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const filtered = filterStatus ? sales.filter(s => s.payment_status === filterStatus) : sales

  return (
    <div style={{ background: C.card, borderRadius: '16px', padding: '20px', border: `1px solid ${C.border}`, marginTop: '24px' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
      }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em' }}>
          SEMUA INVOICE PERIODE INI ({sales.length})
        </span>
        {open ? <ChevronUp size={16} color={C.muted} /> : <ChevronDown size={16} color={C.muted} />}
      </button>

      {open && (
        <div style={{ marginTop: '14px' }}>
          <div style={{ marginBottom: '10px' }}>
            <CustomSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'lunas', label: 'Lunas' },
                { value: 'sebagian', label: 'Sebagian' },
                { value: 'belum_lunas', label: 'Belum Lunas' },
              ]}
              placeholder="Semua Status"
              style={{ width: 'auto', minWidth: '150px' }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['No Invoice', 'Toko', 'Tanggal', 'Total', 'HPP', 'Profit', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: h === 'No Invoice' || h === 'Toko' ? 'left' : 'right', padding: '6px 4px', color: C.muted, fontWeight: 700, fontSize: '9px', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const st = STATUS_STYLE[s.payment_status] || STATUS_STYLE.belum_lunas
                  return (
                    <tr key={s.id} style={{ borderBottom: `1px solid rgba(234,88,12,0.06)` }}>
                      <td style={{ padding: '7px 4px', color: C.text, fontWeight: 600 }}>{s.invoice_number}</td>
                      <td style={{ padding: '7px 4px', color: C.muted }}>{s.customer_name || '-'}</td>
                      <td style={{ padding: '7px 4px', color: C.muted, textAlign: 'right' }}>{fmtDate(s.transaction_date)}</td>
                      <td style={{ padding: '7px 4px', color: C.text, textAlign: 'right', fontWeight: 600 }}>{formatIDR(s.total_amount)}</td>
                      <td style={{ padding: '7px 4px', color: C.muted, textAlign: 'right' }}>{formatIDR(s.total_cogs)}</td>
                      <td style={{ padding: '7px 4px', color: s.net_profit >= 0 ? C.green : C.red, textAlign: 'right', fontWeight: 600 }}>{formatIDR(s.net_profit)}</td>
                      <td style={{ padding: '7px 4px', textAlign: 'right' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '5px', background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <p style={{ color: C.muted, fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>Tidak ada invoice</p>}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[1, 2, 3, 4].map(i => <div key={i} style={{ background: C.card, borderRadius: '14px', height: '100px', border: `1px solid ${C.border}`, opacity: 0.5 }} />)}
      </div>
      <div style={{ background: C.card, borderRadius: '16px', height: '250px', border: `1px solid ${C.border}`, opacity: 0.4 }} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Working Capital Card (Modal Beredar / Aset Lancar)
// ═══════════════════════════════════════════════════════════════════════════
function WorkingCapitalCard({ summary: s }) {
  const cashOnHand = s.endingCashOnHand || 0
  const bankBalance = s.endingBankBalance || 0
  const stockValue = s.stockValue || 0
  const receivables = s.outstandingReceivable || 0
  const payables = s.outstandingPayable || 0
  const totalAssets = cashOnHand + bankBalance + stockValue + receivables
  const netWorkingCapital = totalAssets - payables

  return (
    <div style={{ background: C.card, borderRadius: '16px', padding: '20px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <p style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em', marginBottom: '16px' }}>LIKUIDITAS & MODAL BEREDAR</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>💵</span>
            <div>
              <p style={{ fontSize: '11px', color: C.text, fontWeight: 700 }}>Cash On Hand</p>
              <p style={{ fontSize: '9px', color: C.muted }}>Uang tunai di kasir/tangan</p>
            </div>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{formatIDR(cashOnHand)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🏦</span>
            <div>
              <p style={{ fontSize: '11px', color: C.text, fontWeight: 700 }}>Bank Balance (System)</p>
              <p style={{ fontSize: '9px', color: C.muted }}>Uang di rekening bank tercatat</p>
            </div>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{formatIDR(bankBalance)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>📦</span>
            <div>
              <p style={{ fontSize: '11px', color: C.text, fontWeight: 700 }}>Persediaan (Stok Gudang)</p>
              <p style={{ fontSize: '9px', color: C.muted }}>Nilai modal barang di gudang</p>
            </div>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{formatIDR(stockValue)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🧾</span>
            <div>
              <p style={{ fontSize: '11px', color: C.text, fontWeight: 700 }}>Piutang Dagang (Toko)</p>
              <p style={{ fontSize: '9px', color: C.muted }}>Tagihan belum dilunasi toko</p>
            </div>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{formatIDR(receivables)}</span>
        </div>

        <div style={{ height: '1px', background: C.border, margin: '4px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: C.text }}>TOTAL ASET LANCAR</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>{formatIDR(totalAssets)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🤝</span>
            <div>
              <p style={{ fontSize: '11px', color: C.red, fontWeight: 700 }}>Hutang Dagang (Supplier)</p>
              <p style={{ fontSize: '9px', color: C.muted }}>Kewajiban belum dibayar ke supplier</p>
            </div>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: C.red }}>{formatIDR(payables)}</span>
        </div>
      </div>

      <div style={{ height: '1.5px', background: C.accent, opacity: 0.3, margin: '14px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: C.text }}>MODAL KERJA BERSIH (NET)</span>
        <span style={{ fontSize: '15px', fontWeight: 900, color: C.green }}>{formatIDR(netWorkingCapital)}</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Detailed Cash Flow Statement (Arus Kas Terperinci)
// ═══════════════════════════════════════════════════════════════════════════
function CashFlowStatement({ summary: s }) {
  const openingCash = s.openingCashOnHand + s.openingBankBalance
  const cashIn = s.cashInPeriodTunai + s.cashInPeriodTransfer
  
  const supplierOut = s.supplierOutPeriodTunai + s.supplierOutPeriodTransfer
  const payrollOut = s.payrollOutPeriodTunai
  const opsOut = s.regularExpensesOutPeriodTunai
  const priveOut = s.priveOutPeriodTunai
  const deliveryOut = s.deliveryOutPeriodTunai || 0
  const totalOut = supplierOut + payrollOut + opsOut + priveOut + deliveryOut
  
  const endingCash = s.endingCashOnHand + s.endingBankBalance

  return (
    <div style={{ background: C.card, borderRadius: '16px', padding: '20px', border: `1px solid ${C.border}`, marginTop: '24px' }}>
      <p style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em', marginBottom: '16px' }}>LAPORAN ARUS KAS (CASH FLOW)</p>

      {/* Warning Known Limitation */}
      <div style={{ 
        background: 'rgba(217,119,6,0.06)', 
        border: '1px solid rgba(217,119,6,0.15)', 
        borderRadius: '8px', 
        padding: '10px 12px', 
        marginBottom: '16px',
        fontSize: '10px',
        color: '#D97706',
        lineHeight: '1.4'
      }}>
        <strong>💡 Batasan Sistem:</strong> Saldo Kas Awal dihitung berdasarkan riwayat transaksi yang tercatat di sistem aplikasi dan belum memperhitungkan saldo kas awal fisik atau penyesuaian manual luar sistem.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Opening Balance */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px dashed ${C.border}` }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: C.text }}>SALDO KAS AWAL</span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: C.text }}>{formatIDR(openingCash)}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '12px', fontSize: '9px', color: C.muted, marginTop: '-4px' }}>
          <span>Tunai: {formatIDR(s.openingCashOnHand)}</span>
          <span>Bank: {formatIDR(s.openingBankBalance)}</span>
        </div>

        {/* Cash In */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', marginTop: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: C.green }}>+ Penerimaan Pembayaran (Cash In)</span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: C.green }}>{formatIDR(cashIn)}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '12px', fontSize: '9px', color: C.muted, marginTop: '-6px', marginBottom: '4px' }}>
          <span>Tunai: {formatIDR(s.cashInPeriodTunai)}</span>
          <span>Bank: {formatIDR(s.cashInPeriodTransfer)}</span>
        </div>

        {/* Cash Out Flow (Penjualan, Supplier, Gaji, Ops, Prive, Delivery) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '12px', borderLeft: `2px solid ${C.border}` }}>
          {/* Supplier */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.text }}>
            <span style={{ color: C.muted }}>− Pembelian Stok & Bayar Supplier</span>
            <span style={{ fontWeight: 600, color: C.red }}>{formatIDR(supplierOut)}</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', paddingLeft: '10px', fontSize: '9px', color: C.muted, marginTop: '-4px', marginBottom: '2px' }}>
            <span>Tunai: {formatIDR(s.supplierOutPeriodTunai)}</span>
            <span>Bank: {formatIDR(s.supplierOutPeriodTransfer)}</span>
          </div>

          {/* Gaji */}
          {payrollOut > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.text, marginBottom: '4px' }}>
              <span style={{ color: C.muted }}>− Gaji Pegawai Terbayar (Asumsi Tunai)</span>
              <span style={{ fontWeight: 600, color: C.red }}>{formatIDR(payrollOut)}</span>
            </div>
          )}

          {/* Biaya Kirim / Pengiriman */}
          {deliveryOut > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.text, marginBottom: '4px' }}>
              <span style={{ color: C.muted }}>− Biaya Pengiriman & Armada (Asumsi Tunai)</span>
              <span style={{ fontWeight: 600, color: C.red }}>{formatIDR(deliveryOut)}</span>
            </div>
          )}

          {/* Operasional */}
          {opsOut > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.text, marginBottom: '4px' }}>
              <span style={{ color: C.muted }}>− Biaya Operasional Toko (Asumsi Tunai)</span>
              <span style={{ fontWeight: 600, color: C.red }}>{formatIDR(opsOut)}</span>
            </div>
          )}

          {/* Prive */}
          {priveOut > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: C.text, marginBottom: '4px' }}>
              <span style={{ color: C.muted }}>− Penarikan Pemilik (Prive)</span>
              <span style={{ fontWeight: 600, color: C.red }}>{formatIDR(priveOut)}</span>
            </div>
          )}
        </div>

        {/* Total Cash Out Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', marginTop: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: C.red }}>= Total Pengeluaran Kas (Cash Out)</span>
          <span style={{ fontSize: '12px', fontWeight: 800, color: C.red }}>− {formatIDR(totalOut)}</span>
        </div>

        {/* Ending Balance */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: `2px solid ${C.border}`, marginTop: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 900, color: C.text }}>SALDO KAS AKHIR</span>
          <span style={{ fontSize: '14px', fontWeight: 900, color: C.accent }}>{formatIDR(endingCash)}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '12px', fontSize: '9px', color: C.muted, marginTop: '-6px' }}>
          <span>Tunai (Cash On Hand): {formatIDR(s.endingCashOnHand)}</span>
          <span>Bank (System Balance): {formatIDR(s.endingBankBalance)}</span>
        </div>
      </div>
    </div>
  )
}
