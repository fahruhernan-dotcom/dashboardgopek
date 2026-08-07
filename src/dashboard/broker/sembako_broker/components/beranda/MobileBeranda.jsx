// MobileBeranda.jsx — Layout Beranda Mobile
import { useState, useMemo } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Receipt, Warehouse, Wallet,
  Plus, AlertTriangle, ChevronRight, ShoppingCart, ChevronDown, ChevronUp
} from 'lucide-react'
import { formatIDR } from '@/lib/format'
import { format } from 'date-fns'
import SmartInsight from '@/dashboard/_shared/components/SmartInsight'
import { BrokerMobileHeader } from '@/dashboard/broker/_shared/components/BrokerMobileHeader'
import { C } from '../sembakoSaleUtils'
import { InvoiceRow } from './BerandaUtils'
import { SalesAndCashChart } from './BerandaCharts'
import { AgendaSection } from './BerandaAgenda'
import { CollectionReminders } from './CollectionReminders'
import { SembakoOnboardingChecklist } from '../SembakoOnboardingChecklist'
import { useSembakoProducts, useSembakoAllBatches, useSembakoCustomers, useSembakoSales } from '@/lib/hooks/useSembakoData'

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

function OnboardingWrapper({ setStokOpen }) {
  const { data: products = [] } = useSembakoProducts()
  const { data: batches = [] } = useSembakoAllBatches()
  const { data: customers = [] } = useSembakoCustomers()
  const { data: sales = [] } = useSembakoSales()

  return (
    <SembakoOnboardingChecklist
      productsCount={products.length}
      batchesCount={batches.length}
      customersCount={customers.length}
      salesCount={sales.length}
      onStokOpen={() => setStokOpen(true)}
    />
  )
}

export function MobileBeranda({
  stats, sales, products = [], deliveries, navigate, tenant, insight,
  chartPeriod, setChartPeriod, weeklyChartData, monthlyChartData,
  cashSummary, unrealizedProfitSnapshot,
  selectedDate, setSelectedDate, currentMonth, setCurrentMonth,
  agendaFilter, setAgendaFilter, setStokOpen, salesLoading,
}) {
  const { brokerType } = useParams()
  const brokerBase = `/broker/${brokerType}`
  const { setSidebarOpen = () => window.dispatchEvent(new Event('toggleMobileSidebar')) } = useOutletContext() || {}

  const [showTodayDetail, setShowTodayDetail] = useState(false)
  const [showInventoryDetail, setShowInventoryDetail] = useState(false)
  const [showFinanceDetail, setShowFinanceDetail] = useState(false)

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])

  const todaySales = useMemo(() => sales.filter(s => s.transaction_date?.slice(0, 10) === todayStr), [sales, todayStr])
  const todayOmzet = useMemo(() => todaySales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0), [todaySales])
  const todayProfit = useMemo(() => todaySales.reduce((sum, s) => sum + Number(s.net_profit || 0), 0), [todaySales])
  const todayCash = useMemo(() => todaySales.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0), [todaySales])
  const todayPiutang = useMemo(() => todaySales.reduce((sum, s) => sum + Number(s.remaining_amount || 0), 0), [todaySales])
  const cashPct = useMemo(() => todayOmzet > 0 ? (todayCash / todayOmzet) * 100 : 0, [todayCash, todayOmzet])

  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.current_stock * b.avg_buy_price) - (a.current_stock * a.avg_buy_price))
      .slice(0, 5)
  }, [products])

  const recentSales = useMemo(() => sales.slice(0, 3), [sales])
  const lowStock = stats?.stok?.lowStock || []
  const totalExp = (stats?.pengeluaran?.totalExpenseThisMonth || 0) + (stats?.pengeluaran?.totalPayrollThisMonth || 0)

  return (
    <>
      <BrokerMobileHeader
        showGreeting
        businessLabel={tenant?.business_name || 'DISTRIBUTOR ROKOK'}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <div style={{ padding: '12px 16px 128px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {insight && (
          <div style={{ marginTop: '-4px' }}>
            <SmartInsight insight={insight} />
          </div>
        )}

        <OnboardingWrapper setStokOpen={setStokOpen} />

        {/* Today's Sales & Cash Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: MC.card,
            borderRadius: '18px',
            padding: '16px',
            border: `1px solid ${MC.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '9px', color: MC.muted, fontWeight: 700, letterSpacing: '0.1em', marginBottom: '4px' }}>
                HARI INI
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: MC.text, fontFamily: "'Sora', 'Inter', sans-serif" }}>
                  {formatIDR(todayOmzet)}
                </span>
                <span style={{ fontSize: '10px', color: MC.green, fontWeight: 700 }}>
                  Profit: {formatIDR(todayProfit)}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowTodayDetail(!showTodayDetail)}
              style={{
                background: MC.input,
                border: `1px solid ${MC.border}`,
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 700,
                color: MC.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {showTodayDetail ? 'Tutup' : 'Detail'}
              {showTodayDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          <AnimatePresence>
            {showTodayDetail && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginTop: '12px', borderTop: `1px solid ${MC.border}`, paddingTop: '12px' }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: MC.muted, marginBottom: '6px' }}>
                    <span>Cash Diterima: <strong style={{ color: MC.amber }}>{formatIDR(todayCash)}</strong></span>
                    <span>Piutang Baru: <strong style={{ color: MC.red }}>{formatIDR(todayPiutang)}</strong></span>
                  </div>
                  <div style={{ background: '#E2E8F0', height: '8px', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${cashPct}%`, background: MC.amber, height: '100%' }} />
                    <div style={{ flex: 1, background: MC.red, height: '100%' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: MC.muted, marginTop: '4px' }}>
                    <span>{cashPct.toFixed(0)}% Cash</span>
                    <span>{(100 - cashPct).toFixed(0)}% Piutang</span>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '10px', color: MC.muted, fontWeight: 700, letterSpacing: '0.05em', marginBottom: '8px' }}>
                    TRANSAKSI HARI INI ({todaySales.length})
                  </p>
                  {todaySales.length === 0 ? (
                    <p style={{ fontSize: '11px', color: MC.muted, fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                      Belum ada transaksi hari ini.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {todaySales.map(s => (
                        <div
                          key={s.id}
                          onClick={() => navigate(`${brokerBase}/penjualan?saleId=${s.id}`)}
                          style={{
                            background: MC.card,
                            borderRadius: '10px',
                            padding: '10px 12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            border: `1px solid ${MC.border}`,
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontSize: '12px', fontWeight: 700, color: MC.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.sembako_customers?.customer_name || s.customer_name || '-'}
                            </p>
                            <p style={{ fontSize: '10px', color: MC.muted }}>{s.invoice_number}</p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontSize: '12px', fontWeight: 700, color: MC.text }}>
                              {formatIDR(s.total_amount)}
                            </p>
                            <span style={{
                              fontSize: '8px',
                              fontWeight: 900,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: s.payment_status === 'lunas' ? 'rgba(22, 163, 74, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                              color: s.payment_status === 'lunas' ? MC.green : MC.red,
                              border: s.payment_status === 'lunas' ? '1px solid rgba(22, 163, 74, 0.15)' : '1px solid rgba(220, 38, 38, 0.15)',
                            }}>
                              {s.payment_status?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {lowStock.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(217,119,6,0.06)', border: `1px solid ${MC.border}`,
              borderRadius: '14px', padding: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={14} color={MC.amber} />
                <span style={{ fontSize: '10px', fontWeight: 800, color: MC.amber, letterSpacing: '0.1em' }}>STOK MENIPIS</span>
                <span style={{ background: 'rgba(217,119,6,0.15)', color: MC.amber, fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '5px' }}>{lowStock.length}</span>
              </div>
              <button
                onClick={() => navigate(`${brokerBase}/gudang`)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: MC.accent, fontSize: '11px', fontWeight: 700, padding: 0 }}
              >
                Lihat semua
              </button>
            </div>
            {lowStock.slice(0, 3).map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: MC.card, borderRadius: '9px', padding: '9px 11px', marginBottom: '6px',
                gap: '8px', border: `1px solid ${MC.border}`,
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: MC.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_name}</p>
                  <p style={{ fontSize: '10px', color: MC.muted, marginTop: '1px' }}>
                    Sisa {p.current_stock} {p.unit || ''} · Min {p.min_stock_alert}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`${brokerBase}/gudang?action=tambah&product=${p.id}`)}
                  style={{
                    background: MC.input, border: `1px solid ${MC.border}`,
                    color: MC.text, borderRadius: '7px', padding: '6px 12px',
                    fontSize: '11px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    minHeight: '32px'
                  }}
                >
                  Tambah
                </button>
              </div>
            ))}
          </motion.div>
        )}

        <CollectionReminders
          sales={sales}
          navigate={navigate}
          brokerBase={brokerBase}
          maxItems={3}
          isMobile={true}
        />

        {/* Quick Actions Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => navigate(`${brokerBase}/penjualan?action=new`)}
              style={{
                flex: 1, height: '48px', borderRadius: '12px',
                background: MC.accent, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                color: '#fff', fontWeight: 700, fontSize: '13px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Plus size={16} /> Catat Jual
            </button>
            <button
              onClick={() => setStokOpen(true)}
              style={{
                flex: 1, height: '48px', borderRadius: '12px',
                background: MC.card, border: `1px solid ${MC.border}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                color: MC.text, fontWeight: 700, fontSize: '13px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Package size={16} /> Tambah Stok
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => navigate(`${brokerBase}/produk?action=new`)}
              style={{
                flex: 1, height: '44px', borderRadius: '10px',
                background: MC.card, border: `1px solid ${MC.border}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                color: MC.text, fontWeight: 700, fontSize: '11px',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Plus size={12} className="text-slate-600" /> + Produk
            </button>
            <button
              onClick={() => navigate(`${brokerBase}/toko-supplier?action=new`)}
              style={{
                flex: 1, height: '44px', borderRadius: '10px',
                background: MC.card, border: `1px solid ${MC.border}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                color: MC.text, fontWeight: 700, fontSize: '11px',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Plus size={12} className="text-slate-600" /> + Toko
            </button>
            <button
              onClick={() => navigate(`${brokerBase}/laporan`)}
              style={{
                flex: 1, height: '44px', borderRadius: '10px',
                background: MC.card, border: `1px solid ${MC.border}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                color: MC.text, fontWeight: 700, fontSize: '11px',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Receipt size={12} className="text-slate-600" /> + Pengeluaran
            </button>
          </div>
        </div>

        {/* Inventory Snapshot Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: MC.card,
            borderRadius: '16px',
            padding: '14px',
            border: `1px solid ${MC.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px',
                background: MC.input,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${MC.border}`,
              }}>
                <Warehouse size={16} color="#475569" />
              </div>
              <div>
                <p style={{ fontSize: '9px', color: MC.muted, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '2px' }}>
                  NILAI STOK GUDANG
                </p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: MC.text, fontFamily: "'Sora', 'Inter', sans-serif", lineHeight: 1.1 }}>
                  {formatIDR(stats?.stok?.nilaiStok || 0)}
                </p>
                <p style={{ fontSize: '9px', color: MC.muted, marginTop: '2px' }}>
                  {stats?.stok?.totalProduk || 0} jenis produk aktif
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInventoryDetail(!showInventoryDetail)}
              style={{
                background: MC.input,
                border: `1px solid ${MC.border}`,
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 700,
                color: MC.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {showInventoryDetail ? 'Tutup' : 'Detail'}
              {showInventoryDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          <AnimatePresence>
            {showInventoryDetail && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginTop: '12px', borderTop: `1px solid ${MC.border}`, paddingTop: '12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ fontSize: '10px', color: MC.muted, fontWeight: 700, letterSpacing: '0.05em' }}>
                    TOP 5 PRODUK TERBANYAK
                  </p>
                  <button
                    onClick={() => navigate(`${brokerBase}/gudang`)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', color: MC.accent, fontSize: '11px', fontWeight: 600 }}
                  >
                    Gudang <ChevronRight size={11} />
                  </button>
                </div>
                {topProducts.length === 0 ? (
                  <p style={{ fontSize: '11px', color: MC.muted, fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                    Belum ada produk terdaftar.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {topProducts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => navigate(`${brokerBase}/gudang?product=${p.id}`)}
                        style={{
                          background: MC.card,
                          borderRadius: '10px',
                          padding: '10px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          border: `1px solid ${MC.border}`,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: MC.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_name}</p>
                          <p style={{ fontSize: '10px', color: MC.muted, marginTop: '2px' }}>Stok: {p.current_stock} {p.unit || ''}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: MC.text }}>
                            {formatIDR(p.current_stock * p.avg_buy_price)}
                          </p>
                          {p.current_stock <= p.min_stock_alert && p.min_stock_alert > 0 && (
                            <span style={{ fontSize: '8px', fontWeight: 800, color: MC.red, textTransform: 'uppercase' }}>Tipis</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Finance Snapshot Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: MC.card,
            borderRadius: '16px',
            padding: '14px',
            border: `1px solid ${MC.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px',
                background: MC.input,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${MC.border}`,
              }}>
                <Wallet size={16} color="#475569" />
              </div>
              <div>
                <p style={{ fontSize: '9px', color: MC.muted, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '2px' }}>
                  PIUTANG TOKO & OUTSTANDING
                </p>
                <p style={{ fontSize: '16px', fontWeight: 800, color: MC.text, fontFamily: "'Sora', 'Inter', sans-serif", lineHeight: 1.1 }}>
                  {formatIDR(stats?.penjualan?.totalOutstanding || 0)}
                </p>
                <p style={{ fontSize: '9px', color: MC.muted, marginTop: '2px' }}>
                  Pengeluaran bulan ini: {formatIDR(totalExp)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFinanceDetail(!showFinanceDetail)}
              style={{
                background: MC.input,
                border: `1px solid ${MC.border}`,
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '11px',
                fontWeight: 700,
                color: MC.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {showFinanceDetail ? 'Tutup' : 'Detail'}
              {showFinanceDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          <AnimatePresence>
            {showFinanceDetail && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginTop: '12px', borderTop: `1px solid ${MC.border}`, paddingTop: '12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ fontSize: '10px', color: MC.muted, fontWeight: 700, letterSpacing: '0.05em' }}>
                    DESKRIPSI KEUANGAN BULAN INI
                  </p>
                  <button
                    onClick={() => navigate(`${brokerBase}/laporan`)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', color: MC.accent, fontSize: '11px', fontWeight: 600 }}
                  >
                    Laporan <ChevronRight size={11} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: MC.card, border: `1px solid ${MC.border}`, borderRadius: '10px', padding: '10px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: MC.muted }}>Penjualan Kotor (Gross Profit)</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: MC.text, marginTop: '2px' }}>{formatIDR(stats?.penjualan?.grossProfitThisMonth || 0)}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: MC.card, border: `1px solid ${MC.border}`, borderRadius: '10px', padding: '10px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: MC.muted }}>Operasional (Expenses)</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: MC.text, marginTop: '2px' }}>{formatIDR(stats?.pengeluaran?.totalExpenseThisMonth || 0)}</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => navigate(`${brokerBase}/pegawai`)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: MC.card, border: `1px solid ${MC.border}`, borderRadius: '10px', padding: '10px 12px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  >
                    <div>
                      <p style={{ fontSize: '11px', color: MC.muted }}>Gaji Pegawai (Payroll) ↗</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: MC.text, marginTop: '2px' }}>{formatIDR(stats?.pengeluaran?.totalPayrollThisMonth || 0)}</p>
                    </div>
                    <span style={{ fontSize: '10px', color: MC.accent, fontWeight: 700 }}>Kelola Pegawai</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(22,163,74,0.06)', border: `1px solid rgba(22,163,74,0.15)`, borderRadius: '10px', padding: '10px 12px' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: MC.green, fontWeight: 700 }}>Profit Bersih (Net Profit)</p>
                      <p style={{ fontSize: '15px', fontWeight: 900, color: MC.green, marginTop: '2px' }}>{formatIDR(stats?.penjualan?.netProfitThisMonth || 0)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Agenda Section */}
        <div>
          <AgendaSection
            sales={sales}
            deliveries={deliveries}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            agendaFilter={agendaFilter}
            setAgendaFilter={setAgendaFilter}
            isMobile={true}
          />
        </div>

        {/* Sales Performance Chart + Cash Summary */}
        <SalesAndCashChart
          weeklyData={weeklyChartData}
          monthlyData={monthlyChartData}
          chartPeriod={chartPeriod}
          setChartPeriod={setChartPeriod}
          isDesktop={false}
          unrealizedProfitSnapshot={unrealizedProfitSnapshot}
          cashSummary={cashSummary}
          stats={stats}
        />

        {/* Invoice Terbaru (Sliced to max 3 on mobile) */}
        <div style={{
          background: MC.card, borderRadius: '16px',
          padding: '14px', border: `1px solid ${MC.border}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: MC.accent, letterSpacing: '0.1em' }}>
              INVOICE TERBARU
            </span>
            <button
              onClick={() => navigate(`${brokerBase}/penjualan`)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', color: MC.muted, fontSize: '11px', fontWeight: 600 }}
            >
              Lihat semua <ChevronRight size={11} />
            </button>
          </div>
          {salesLoading ? (
            <p style={{ color: MC.muted, fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Memuat...</p>
          ) : recentSales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: MC.muted }}>
              <ShoppingCart size={24} color={MC.muted} style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '12px' }}>Belum ada invoice</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {recentSales.map(s => (
                <InvoiceRow
                  key={s.id}
                  sale={s}
                  onClick={() => navigate(`${brokerBase}/penjualan?saleId=${s.id}`)}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  )
}
