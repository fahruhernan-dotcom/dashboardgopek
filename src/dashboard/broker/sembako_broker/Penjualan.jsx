import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useLocation, useNavigate, useOutletContext, Link } from 'react-router-dom'
import { BrokerMobileHeader } from '@/dashboard/broker/_shared/components/BrokerMobileHeader'
import {
  Plus, CreditCard, CheckCircle2, AlertTriangle,
  History, Lock, FileSpreadsheet,
} from 'lucide-react'
import ImportCsvModal from '@/components/ui/ImportCsvModal'
import { useSembakoSales, useSembakoReturns, useSembakoProducts } from '@/lib/hooks/useSembakoData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR } from '@/lib/format'
import { SembakoPageHeader } from '@/dashboard/broker/sembako_broker/components/SembakoPageHeader'
import { SembakoSummaryStrip } from '@/dashboard/broker/sembako_broker/components/SembakoSummaryStrip'
import { SembakoInvoiceCard } from '@/dashboard/broker/sembako_broker/components/SembakoInvoiceCard'
import { SembakoStatCard, SembakoErrorState } from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'
import { Button } from '@/components/ui/button'
import { SembakoSaleDetailSheet } from '@/dashboard/broker/sembako_broker/components/SembakoSaleDetailSheet'
import { SembakoCreateInvoiceSheet } from '@/dashboard/broker/sembako_broker/components/SembakoCreateInvoiceSheet'
import { C, INVOICE_FILTERS, LoadingSkeleton, EmptyBox } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import { useAuth } from '@/lib/hooks/useAuth'
import { useTransactionQuota } from '@/lib/hooks/useTransactionQuota'

export default function SembakoPenjualan() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const location = useLocation()
  const [openWizard, setOpenWizard] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('action') === 'new'
  })
  const navigate = useNavigate()

  const { setSidebarOpen = () => window.dispatchEvent(new Event('toggleMobileSidebar')) } = useOutletContext() || {}

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('action') === 'new') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpenWizard(true)
    }
  }, [location.search])

  // URL cleanup: when wizard closes, strip ?action=new if present
  useEffect(() => {
    if (!openWizard && location.search.includes('action=new')) {
      navigate(location.pathname, { replace: true })
    }
  }, [openWizard, location.search, location.pathname, navigate])

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: '96px' }}>
      {!isDesktop && <BrokerMobileHeader title="Penjualan" onMenuClick={() => setSidebarOpen(true)} />}
      <div style={{ maxWidth: '1600px', margin: '0 auto', fontFamily: "'Sora', 'Inter', sans-serif" }}>
        <TabInvoice isDesktop={isDesktop} openWizard={openWizard} setOpenWizard={setOpenWizard} />
      </div>
    </div>
  )
}

function TabInvoice({ isDesktop, openWizard, setOpenWizard }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { tenant } = useAuth()
  const quota = useTransactionQuota(tenant, { tableName: 'sembako_sales', queryKeyPrefix: 'sembako-transaction-quota' })

  const { data: sales = [], isLoading, isError, error, refetch } = useSembakoSales()
  const { data: returnsList = [] } = useSembakoReturns()
  const { data: products = [] } = useSembakoProducts()
  const [search, setSearch] = useState('')
  const [invoiceFilter, setInvoiceFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [selectedSaleId, setSelectedSaleId] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [editSaleId, setEditSaleId] = useState(null)
  const [importCsvOpen, setImportCsvOpen] = useState(false)

  // Context preservation: auto-open sale detail sheet if saleId is passed
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const saleId = params.get('saleId')
    if (saleId && sales.length > 0) {
      const match = sales.find(s => s.id === saleId)
      if (match) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedSaleId(saleId)
        setShowDetail(true)
        const newParams = new URLSearchParams(location.search)
        newParams.delete('saleId')
        const searchStr = newParams.toString()
        navigate(location.pathname + (searchStr ? `?${searchStr}` : ''), { replace: true })
      }
    }
  }, [location.search, sales, navigate, location.pathname])
  const PER_PAGE = 20

  const stats = useMemo(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now - 30 * 86400000)
    const thisMonth = sales.filter(s => new Date(s.transaction_date) > thirtyDaysAgo)
    return {
      piutang: sales.reduce((s, i) => s + (i.remaining_amount || 0), 0),
      revenue: thisMonth.reduce((s, i) => s + (i.total_amount || 0), 0),
      lunas: sales.filter(s => s.payment_status === 'lunas').length,
      overdue: sales.filter(s => s.payment_status !== 'lunas' && s.due_date && new Date(s.due_date) < now).length,
    }
  }, [sales])

  const summaryItems = useMemo(() => ([
    { label: 'Piutang Aktif', value: stats.piutang, isCurrency: true, color: 'red' },
    { label: 'Invoice Lunas', value: stats.lunas, color: 'green' },
    { label: 'Lewat Jatuh Tempo', value: stats.overdue, color: stats.overdue > 0 ? 'red' : 'green' },
  ]), [stats])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return sales.filter(s => {
      const matchesSearch =
        (s.invoice_number || '').toLowerCase().includes(q) ||
        (s.customer_name || '').toLowerCase().includes(q) ||
        (s.sembako_customers?.customer_name || '').toLowerCase().includes(q)

      if (!matchesSearch) return false
      if (invoiceFilter === 'all') return true
      if (invoiceFilter === 'paid') return s.payment_status === 'lunas'
      if (invoiceFilter === 'partial') return s.payment_status === 'sebagian'
      if (invoiceFilter === 'unpaid') return (s.remaining_amount || 0) > 0
      if (invoiceFilter === 'overdue') {
        return s.payment_status !== 'lunas' && s.due_date && new Date(s.due_date) < new Date()
      }
      return true
    })
  }, [sales, search, invoiceFilter])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const activePage = page >= totalPages ? 0 : page
  const paged = filtered.slice(activePage * PER_PAGE, (activePage + 1) * PER_PAGE)

  const selectedSale = useMemo(() =>
    sales.find(s => s.id === selectedSaleId),
    [sales, selectedSaleId]
  )

  const handleOpenEdit = useCallback((sale) => {
    setEditSaleId(sale.id)
    setShowDetail(false)
    setTimeout(() => {
      setOpenWizard(true)
    }, 150)
  }, [setEditSaleId, setShowDetail, setOpenWizard])

  const handleWizardClose = useCallback((open) => {
    if (!open) {
      setOpenWizard(false)
      setEditSaleId(null)
    } else {
      setOpenWizard(true)
    }
  }, [setOpenWizard, setEditSaleId])

  const handleManageDelivery = useCallback((saleId) => {
    const base = location.pathname.replace('/penjualan', '/pengiriman')
    navigate(`${base}?saleId=${saleId}`)
  }, [location.pathname, navigate])

  if (isError) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <SembakoErrorState error={error} onRetry={refetch} />
    </div>
  )

  return (
    <div>
      <SembakoPageHeader
        title="Penjualan & Invoice"
        subtitle="Arus transaksi, piutang, dan status pengiriman"
        isDesktop={isDesktop}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari invoice atau nama toko..."
        filters={INVOICE_FILTERS}
        activeFilter={invoiceFilter}
        onFilterChange={setInvoiceFilter}
        actionButton={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setImportCsvOpen(true)}
              className="h-10 rounded-xl px-3 text-[10px] font-bold text-foreground bg-card border border-border/60 hover:bg-muted transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FileSpreadsheet size={15} className="text-[#0F172A]" />
              <span>Import CSV</span>
            </button>
            <button
              type="button"
              onClick={() => !quota.isAtLimit && setOpenWizard(true)}
              disabled={quota.isAtLimit}
              title={quota.isAtLimit ? 'Kuota transaksi bulan ini habis — Upgrade ke Pro' : undefined}
              className="h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-white dark:text-tko-forest-950 dark:font-black bg-[#0F172A] dark:bg-tko-brand-500 hover:opacity-95 shadow-tko-brand disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none flex items-center"
              style={quota.isAtLimit ? { background: '#6B7280' } : {}}
            >
              {quota.isAtLimit ? <Lock size={14} className="mr-1" /> : <Plus size={15} className="mr-1" />}
              {quota.isAtLimit ? 'Kuota Habis' : 'Catat Penjualan'}
            </button>
          </div>
        }
      />

      {!isDesktop && <SembakoSummaryStrip isDesktop={isDesktop} items={summaryItems} />}

      {isDesktop && (
        <div style={{ padding: '20px 24px 0', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
          <SembakoStatCard icon={CreditCard} label="Piutang" value={formatIDR(stats.piutang)} color="red" subLabel="Sisa tagihan aktif" />
          <SembakoStatCard icon={CheckCircle2} label="Lunas" value={stats.lunas} color="green" subLabel="Invoice selesai" />
          <SembakoStatCard icon={AlertTriangle} label="Jatuh Tempo" value={stats.overdue} color={stats.overdue > 0 ? 'red' : 'green'} subLabel="Butuh follow-up" />
        </div>
      )}

      {/* Quota Banner — Starter only */}
      {quota.isStarter && (
        <div style={{ padding: isDesktop ? '0 24px' : '0 16px', marginBottom: '12px' }}>
          <div
            className="px-4 py-3 rounded-xl flex items-center justify-between gap-3"
            style={{
              background: quota.isAtLimit
                ? 'rgba(239,68,68,0.08)'
                : quota.remaining <= 5
                  ? 'rgba(245,158,11,0.08)'
                  : 'rgba(15,23,42,0.06)',
              border: `1px solid ${quota.isAtLimit
                ? 'rgba(239,68,68,0.25)'
                : quota.remaining <= 5
                  ? 'rgba(245,158,11,0.2)'
                  : 'rgba(15,23,42,0.12)'}`,
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: quota.isAtLimit ? 'rgba(239,68,68,0.15)' : 'rgba(15,23,42,0.08)' }}
              >
                <span className="text-[11px]">{quota.isAtLimit ? '🔒' : '📊'}</span>
              </div>
              <div className="min-w-0">
                <p
                  className="text-[11px] font-bold leading-tight"
                  style={{ color: quota.isAtLimit ? '#F87171' : quota.remaining <= 5 ? '#FBBF24' : '#94A3B8' }}
                >
                  {quota.isAtLimit
                    ? 'Kuota bulan ini habis'
                    : `${quota.used} / ${quota.limit} transaksi bulan ini`}
                </p>
                {quota.isAtLimit && (
                  <p className="text-[10px] mt-0.5" style={{ color: '#64748B' }}>
                    Upgrade ke Pro untuk transaksi unlimited
                  </p>
                )}
              </div>
            </div>
            {!quota.isAtLimit && (
              <div className="w-20 flex-shrink-0">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (quota.used / quota.limit) * 100)}%`,
                      background: quota.remaining <= 5 ? '#F59E0B' : '#0F172A',
                    }}
                  />
                </div>
                <p className="text-[9px] text-right mt-0.5" style={{ color: '#94A3B8' }}>{quota.remaining} sisa</p>
              </div>
            )}
            {quota.isAtLimit && (
              <Link
                to="/upgrade"
                className="flex-shrink-0 text-[10px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors"
                style={{ color: '#0F172A', border: '1px solid rgba(15,23,42,0.3)' }}
              >
                Upgrade
              </Link>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: isDesktop ? '0 24px' : '0 16px' }}>
        {isLoading ? <LoadingSkeleton /> : paged.length === 0 ? (
          sales.length === 0 && invoiceFilter === 'all' && !search ? (
            <EmptyBox
              icon={History}
              text="Belum ada transaksi penjualan"
              hint="Catat penjualan pertama Anda untuk mulai mengelola bisnis"
              actionLabel="+ Catat Penjualan Pertama"
              onAction={() => setOpenWizard(true)}
            />
          ) : (
            <EmptyBox icon={History} text="Belum ada invoice yang cocok dengan filter ini" />
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {paged.map(sale => (
              <SembakoInvoiceCard
                key={sale.id}
                sale={sale}
                returnsList={returnsList}
                products={products}
                isDesktop={isDesktop}
                onOpenDetail={() => {
                  setSelectedSaleId(sale.id)
                  setShowDetail(true)
                }}
                onEdit={() => handleOpenEdit(sale)}
                onManageDelivery={() => handleManageDelivery(sale.id)}
              />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px', padding: isDesktop ? '0 24px' : '0 16px' }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)} style={{
              width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: activePage === i ? C.accent : C.card, color: activePage === i ? '#fff' : C.muted,
              fontWeight: 700, fontSize: '12px',
            }}>{i + 1}</button>
          ))}
        </div>
      )}

      <SembakoCreateInvoiceSheet open={openWizard} onOpenChange={handleWizardClose} editId={editSaleId} />
      <SembakoSaleDetailSheet
        isOpen={showDetail}
        onOpenChange={setShowDetail}
        sale={selectedSale}
        onEdit={handleOpenEdit}
      />
      <ImportCsvModal
        open={importCsvOpen}
        onClose={() => setImportCsvOpen(false)}
        defaultEntity="sales"
      />
    </div>
  )
}
