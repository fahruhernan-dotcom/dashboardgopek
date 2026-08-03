import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { BrokerMobileHeader } from '@/dashboard/broker/_shared/components/BrokerMobileHeader'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Truck, User, MapPin, Package,
  CheckCircle2, Check, Clock, Share2, MessageCircle,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useSembakoSalesPendingDelivery, useSembakoDeliveries,
  useSembakoEmployees, useSembakoCustomers,
  useCompleteSembakoDelivery,
  useStartSembakoDelivery,
  useArriveSembakoDelivery,
} from '@/lib/hooks/useSembakoData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR } from '@/lib/format'
import { SembakoPageHeader } from '@/dashboard/broker/sembako_broker/components/SembakoPageHeader'
import { SembakoErrorState } from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'
import { Button } from '@/components/ui/button'
import {
  C, sLabel, sBtn, fmtDate, EmptyBox, CustomSelect,
} from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import { SembakoTimeline, TambahTripSheet, SembakoDeliveryDetailSheet } from '@/dashboard/broker/sembako_broker/components/SembakoDeliveryShared'

const FILTER_TABS = [
  { id: '',          label: 'Semua' },
  { id: 'aktif',     label: 'Aktif' },
  { id: 'delivered', label: 'Selesai' },
]

// ── SalePendingCard ───────────────────────────────────────────────────────────
function SalePendingCard({ sale, onBuatDelivery }) {
  const customer = sale.sembako_customers || {}
  const custName = customer.customer_name || sale.customer_name || 'Umum'
  const items = sale.sembako_sale_items || []
  const itemSummary = items.length > 0
    ? (items.length > 1 ? `${items[0].product_name} +${items.length - 1} lainnya` : items[0].product_name)
    : '-'
  const hasPartial = (sale.sembako_deliveries || []).length > 0

  return (
    <div style={{
      background: C.card, borderRadius: '16px', border: `1px solid ${C.borderAm}`,
      padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 800, color: C.text, margin: 0 }}>{custName}</p>
          <p style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
            {sale.invoice_number} · {fmtDate(sale.transaction_date)}
          </p>
        </div>
        <span style={{
          background: hasPartial ? 'rgba(96,165,250,0.12)' : 'rgba(245,158,11,0.12)',
          color: hasPartial ? C.blue : C.amber,
          fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '5px',
          letterSpacing: '0.05em', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '8px',
        }}>
          {hasPartial ? 'SEBAGIAN' : 'BELUM DIKIRIM'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <p style={{ ...sLabel, marginBottom: '2px' }}>Produk</p>
          <p style={{ fontSize: '12px', color: C.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemSummary}</p>
        </div>
        <div>
          <p style={{ ...sLabel, marginBottom: '2px' }}>Total</p>
          <p style={{ fontSize: '12px', color: C.accent, fontWeight: 800 }}>{formatIDR(sale.total_amount)}</p>
        </div>
      </div>

      {customer.address && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <MapPin size={11} color={C.muted} />
          <p style={{ fontSize: '11px', color: C.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.address}</p>
        </div>
      )}

      <button
        onClick={onBuatDelivery}
        style={{ ...sBtn(true), width: '100%', padding: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
      >
        <Truck size={13} /> Buat Pengiriman
      </button>
    </div>
  )
}

// ── buildSuratJalanWA ─────────────────────────────────────────────────────────
function buildSuratJalanWA(delivery) {
  const sale = delivery.sembako_sales
  const emp = delivery.sembako_employees
  const items = sale?.sembako_sale_items || []
  const customer = sale?.sembako_customers?.customer_name || sale?.customer_name || 'Umum'
  const driver = emp?.full_name || delivery.driver_name || '—'
  const vehicle = [delivery.vehicle_type, delivery.vehicle_plate].filter(Boolean).join(' ') || '—'
  const date = fmtDate(delivery.delivery_date)
  const itemLines = items.length
    ? items.map(i => `- ${i.product_name} (${i.quantity} ${i.unit || 'pcs'})`).join('\n')
    : '—'
  return encodeURIComponent(
    `*SURAT JALAN*\n────────────────\nTanggal  : ${date}\nTujuan   : ${customer}\nSopir    : ${driver}\nKendaraan: ${vehicle}\n────────────────\n*Muatan:*\n${itemLines}\n────────────────\nTerima kasih! 🚚`
  )
}

// ── DeliveryCard ──────────────────────────────────────────────────────────────
function DeliveryCard({ delivery, onStart, onArrive, onComplete, highlighted, onShowDetail }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const cardRef = useRef(null)
  const [flash, setFlash] = useState(highlighted)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!highlighted) return
    setFlash(true)
    const scrollTimer = setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350)
    const fadeTimer = setTimeout(() => setFlash(false), 3000)
    return () => { clearTimeout(scrollTimer); clearTimeout(fadeTimer) }
  }, [highlighted])

  const statusMeta = {
    pending:   { label: 'Disiapkan',  bg: 'rgba(255,255,255,0.06)', color: '#94A3B8' },
    on_route:  { label: 'Di Jalan',   bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA', pulse: true },
    arrived:   { label: 'Tiba',       bg: 'rgba(245,158,11,0.12)',  color: '#FBBF24' },
    delivered: { label: 'Terkirim',   bg: 'rgba(16, 185, 129, 0.1)',  color: '#34D399' },
  }

  const meta = statusMeta[delivery.status] || statusMeta.pending
  const sale = delivery.sembako_sales
  const emp = delivery.sembako_employees
  const items = sale?.sembako_sale_items || []
  const rpaName = sale?.sembako_customers?.customer_name || sale?.customer_name || delivery.delivery_area || 'Tujuan Umum'
  const itemSummary = items.length > 0
    ? (items.length > 1 ? `${items[0].product_name} +${items.length - 1} lainnya` : items[0].product_name)
    : '-'

  return (
    <>
      <motion.div ref={cardRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card
          className={cn('bg-[#111C24] overflow-hidden shadow-xl transition-all', isDesktop ? 'rounded-[28px]' : 'rounded-[22px]')}
          style={{
            borderColor: flash ? 'rgba(234,88,12,0.55)' : undefined,
            boxShadow: flash ? '0 0 0 1px rgba(234,88,12,0.3), 0 0 28px rgba(234,88,12,0.18)' : undefined,
            border: flash ? undefined : '1px solid rgba(255,255,255,0.05)',
            transition: 'border-color 1.2s ease, box-shadow 1.2s ease',
          }}
        >
          <CardContent className="p-0">
            {/* Header */}
            <div
              className={cn('flex justify-between items-start cursor-pointer', isDesktop ? 'p-6 pb-4' : 'p-4 pb-3')}
              onClick={onShowDetail}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                <div
                  className={cn('px-2.5 py-1 rounded-lg font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0', isDesktop ? 'text-[9px] px-3 py-1.5' : 'text-[10px]')}
                  style={{ backgroundColor: meta.bg, color: meta.color }}
                >
                  {meta.pulse && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: meta.color }} />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: meta.color }} />
                    </span>
                  )}
                  {meta.label}
                </div>
                <h4 className={cn('font-display font-black text-white uppercase tracking-tight truncate', isDesktop ? 'text-sm max-w-[150px]' : 'text-[13px]')}>{rpaName}</h4>
              </div>
              <span className={cn('font-black text-[#94A3B8] uppercase tracking-widest shrink-0', isDesktop ? 'text-[10px]' : 'text-[9px] text-right leading-tight')}>
                {fmtDate(delivery.delivery_date)}
              </span>
            </div>

            {/* Rute */}
            <div className={cn('bg-white/[0.02] flex items-center gap-3 cursor-pointer', isDesktop ? 'px-6 py-4' : 'px-4 py-3')} onClick={onShowDetail}>
              <div className="flex-1 min-w-0">
                <p className={cn('font-black text-[#94A3B8] uppercase tracking-widest mb-1', isDesktop ? 'text-[10px]' : 'text-[9px]')}>Dari lokasi</p>
                <p className={cn('font-black text-[#94A3B8] truncate', isDesktop ? 'text-xs' : 'text-[11px]')}>Gudang Utama</p>
              </div>
              <div className={cn('rounded-full border border-white/5 bg-secondary/10 flex items-center justify-center text-blue-500/40 shrink-0', isDesktop ? 'w-10 h-10' : 'w-7 h-7')}>
                <Truck size={isDesktop ? 18 : 14} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className={cn('font-black text-[#94A3B8] uppercase tracking-widest mb-1', isDesktop ? 'text-[10px]' : 'text-[9px]')}>Ke Customer</p>
                <p className={cn('font-black text-[#F1F5F9] truncate', isDesktop ? 'text-xs' : 'text-[11px]')}>{rpaName}</p>
              </div>
            </div>

            {/* Detail Grid */}
            <div className={cn('grid grid-cols-3 cursor-pointer', isDesktop ? 'p-6 gap-6' : 'p-4 gap-3')} onClick={onShowDetail}>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[#94A3B8]">
                  <Truck size={12} strokeWidth={2.5} />
                  <span className={cn('font-black uppercase tracking-widest', isDesktop ? 'text-[9px]' : 'text-[10px]')}>Kendaraan</span>
                </div>
                <span className={cn('font-black text-white uppercase tracking-tight truncate block', isDesktop ? 'text-[11px]' : 'text-[11px]')}>
                  {delivery.vehicle_type ? `${delivery.vehicle_type} ${delivery.vehicle_plate || ''}`.trim() : '—'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[#94A3B8]">
                  <User size={12} strokeWidth={2.5} />
                  <span className={cn('font-black uppercase tracking-widest', isDesktop ? 'text-[9px]' : 'text-[10px]')}>Sopir</span>
                </div>
                <span className={cn('font-black text-white uppercase tracking-tight truncate block', isDesktop ? 'text-[11px]' : 'text-[11px]')}>
                  {emp?.full_name || delivery.driver_name || '—'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[#94A3B8]">
                  <Package size={12} strokeWidth={2.5} />
                  <span className={cn('font-black uppercase tracking-widest', isDesktop ? 'text-[9px]' : 'text-[10px]')}>Muatan</span>
                </div>
                <span className={cn('font-black text-white uppercase tracking-tight truncate block', isDesktop ? 'text-[11px]' : 'text-[11px]')}>{itemSummary}</span>
              </div>
            </div>

            {/* Timeline */}
            <div className={cn('mt-1', isDesktop ? 'px-6 pb-6' : 'px-4 pb-4')}>
              <SembakoTimeline delivery={delivery} />
            </div>

            {/* Actions */}
            <div className="p-3 bg-white/[0.03] border-t border-white/5 space-y-2">
              <div className="flex gap-2">
                {delivery.status === 'pending' && (
                  <Button
                    onClick={() => onStart(delivery.id)}
                    className={cn('flex-1 text-blue-400 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 font-black uppercase tracking-widest rounded-xl gap-2', isDesktop ? 'h-12 text-[11px]' : 'h-10 text-[11px]')}
                  >
                    <Truck size={15} /> Mulai Perjalanan
                  </Button>
                )}
                {delivery.status === 'on_route' && (
                  <Button
                    onClick={() => onArrive(delivery.id)}
                    className={cn('flex-1 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest rounded-xl gap-2', isDesktop ? 'h-12 text-[11px]' : 'h-10 text-[11px]')}
                  >
                    <MapPin size={15} /> Catat Kedatangan
                  </Button>
                )}
                {delivery.status === 'arrived' && (
                  <Button
                    onClick={() => setShowConfirm(true)}
                    className={cn('flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest rounded-xl gap-2', isDesktop ? 'h-12 text-[11px]' : 'h-10 text-[11px]')}
                  >
                    <CheckCircle2 size={15} /> Selesaikan
                  </Button>
                )}
                {delivery.status === 'delivered' && (
                  <Button
                    variant="ghost"
                    disabled
                    className={cn('flex-1 h-9 opacity-40 font-black uppercase tracking-widest', isDesktop ? 'text-[10px]' : 'text-[10px]')}
                    style={{ color: '#94A3B8' }}
                  >
                    <CheckCircle2 size={13} className="mr-1.5" /> Terkirim
                  </Button>
                )}
              </div>

              {delivery.status !== 'pending' && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://wa.me/?text=${buildSuratJalanWA(delivery)}`, '_blank')}
                  className={cn('w-full border-green-500/20 bg-green-500/5 hover:bg-green-500/10 text-green-400 font-black uppercase tracking-widest gap-2', isDesktop ? 'h-10 text-[10px]' : 'h-9 text-[10px]')}
                >
                  <MessageCircle size={13} /> Bagikan Surat Jalan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirm complete */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-[#0C1319] border border-white/10 rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(2, 26, 2,0.15), rgba(245,158,11,0.15))' }}
              >
                <CheckCircle2 size={20} style={{ color: '#F59E0B' }} />
              </div>
              <AlertDialogTitle className="text-white font-black text-base uppercase tracking-wide">
                Selesaikan Pengiriman?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {/* Blok 1 – Detail Logistik */}
                <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 space-y-2.5 text-[11px]">
                  <div className="flex justify-between pb-2 border-b border-white/5 items-center">
                    <span className="text-[#94A3B8] font-black uppercase tracking-widest">Detail Logistik</span>
                    <Truck size={14} className="text-emerald-500/50" />
                  </div>
                  {(() => {
                    const s = delivery.sembako_sales
                    const e = delivery.sembako_employees
                    const customer = s?.sembako_customers?.customer_name || s?.customer_name || 'Umum'
                    const driver = e?.full_name || delivery.driver_name || '—'
                    const vehicle = [delivery.vehicle_type, delivery.vehicle_plate].filter(Boolean).join(' ') || '—'
                    const its = s?.sembako_sale_items || []
                    
                    // Time calculations
                    let waktuTiba = '—'
                    let lamaJalan = '—'
                    if (delivery.arrived_at) {
                      const arr = new Date(delivery.arrived_at)
                      waktuTiba = format(arr, 'HH:mm')
                      if (delivery.started_at) {
                        const start = new Date(delivery.started_at)
                        const diffMins = Math.floor((arr - start) / 60000)
                        const h = Math.floor(diffMins / 60)
                        const m = diffMins % 60
                        lamaJalan = h > 0 ? `${h}j ${m}m` : `${m}m`
                      }
                    }

                    const totalQty = its.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)

                    return (
                      <div className="grid grid-cols-2 gap-y-2">
                        <span className="text-[#94A3B8] font-bold uppercase">Tujuan</span>
                        <span className="text-white font-black text-right truncate">{customer}</span>
                        <span className="text-[#94A3B8] font-bold uppercase">Sopir</span>
                        <span className="text-white font-black text-right truncate">{driver}</span>
                        <span className="text-[#94A3B8] font-bold uppercase">Kendaraan</span>
                        <span className="text-white font-black text-right">{vehicle}</span>
                        <span className="text-[#94A3B8] font-bold uppercase">Waktu Tiba</span>
                        <span className="text-white font-black text-right">{waktuTiba}</span>
                        <span className="text-[#94A3B8] font-bold uppercase">Lama Jalan</span>
                        <span className="text-white font-black text-right">{lamaJalan}</span>
                        {its.length > 0 && <>
                          <span className="text-[#94A3B8] font-bold uppercase">Muatan</span>
                          <span className="text-white font-black text-right">{totalQty} item ({its.length} SKU)</span>
                        </>}
                      </div>
                    )
                  })()}
                </div>

                {/* Blok 2 – Status note */}
                <div className="rounded-xl bg-emerald-500/[0.03] border border-emerald-500/10 p-4 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8] font-bold uppercase text-[11px] tracking-wider">Status Baru</span>
                    <span className="text-emerald-400 font-black text-[11px]">TERKIRIM</span>
                  </div>
                  <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                    Setelah diselesaikan, status pengiriman tidak dapat diubah kembali ke &ldquo;Tiba&rdquo;.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2">
            <AlertDialogCancel className="flex-1 h-11 bg-white/5 border-white/10 text-white font-black uppercase text-xs tracking-wider hover:bg-white/10">
              Cek Lagi
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onComplete(delivery.id)}
              className="flex-1 h-11 font-black uppercase text-xs tracking-wider text-white border-0"
              style={{ background: 'linear-gradient(135deg, #021a02 0%, #F59E0B 100%)' }}
            >
              Ya, Selesaikan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ── SummaryCard ───────────────────────────────────────────────────────────────
function SummaryCard({ label, value, icon: Icon, color, subLabel }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const colors = {
    blue:    { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.15)',  text: '#60A5FA',  dot: 'bg-blue-500' },
    emerald: { bg: 'rgba(16, 185, 129, 0.08)',  border: 'rgba(16, 185, 129, 0.15)', text: '#34D399',  dot: 'bg-emerald-500' },
    amber:   { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.15)', text: '#FBBF24',  dot: 'bg-amber-500' },
  }
  const c = colors[color] || colors.blue
  return (
    <div
      className={cn('rounded-2xl p-4 flex-shrink-0', isDesktop ? 'min-w-0' : 'min-w-[140px]')}
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
        <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-2xl font-black" style={{ color: c.text }}>{value}</p>
      {subLabel && <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest mt-1">{subLabel}</p>}
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function SembakoPengiriman() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setSidebarOpen = () => window.dispatchEvent(new Event('toggleMobileSidebar')) } = useOutletContext() || {}
  const location = useLocation()
  const navigate = useNavigate()

  const { data: deliveries = [], isLoading: loadingDeliveries, isError: isErrD, error: errD, refetch: refD } = useSembakoDeliveries()
  const { data: salesPending = [], isLoading: loadingSales, isError: isErrS, error: errS, refetch: refS } = useSembakoSalesPendingDelivery()
  const { data: employees = [] } = useSembakoEmployees()
  const { data: customers = [] } = useSembakoCustomers()
  const completeDelivery = useCompleteSembakoDelivery()
  const startDelivery    = useStartSembakoDelivery()
  const arriveDelivery   = useArriveSembakoDelivery()

  const [filterTab, setFilterTab] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [prefillSale, setPrefillSale] = useState(null)
  const [highlightedDeliveryId, setHighlightedDeliveryId] = useState(null)
  const [detailDelivery, setDetailDelivery] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const highlightDelivery = params.get('highlightDelivery')
    const saleId = params.get('saleId')
    if (highlightDelivery) {
      setHighlightedDeliveryId(highlightDelivery)
      navigate(location.pathname, { replace: true })
    } else if (saleId && salesPending.length > 0) {
      const sale = salesPending.find(s => s.id === saleId)
      if (sale) { setPrefillSale(sale); setSheetOpen(true); navigate(location.pathname, { replace: true }) }
    }
  }, [location.search, salesPending, navigate, location.pathname])

  const filteredDeliveries = useMemo(() => {
    if (!filterTab) return deliveries
    if (filterTab === 'aktif') return deliveries.filter(d => ['pending', 'on_route', 'arrived'].includes(d.status))
    return deliveries.filter(d => d.status === filterTab)
  }, [deliveries, filterTab])

  const stats = useMemo(() => {
    const aktif = deliveries.filter(d => ['pending', 'on_route', 'arrived'].includes(d.status)).length
    const today = format(new Date(), 'yyyy-MM-dd')
    const selesaiHariIni = deliveries.filter(d =>
      d.status === 'delivered' &&
      d.completed_at && format(new Date(d.completed_at), 'yyyy-MM-dd') === today
    ).length
    return { aktif, selesaiHariIni }
  }, [deliveries])

  function openForSale(sale) { setPrefillSale(sale); setSheetOpen(true) }
  function openIndependent() { setPrefillSale(null); setSheetOpen(true) }
  function closeSheet() { setSheetOpen(false); setPrefillSale(null) }

  async function handleComplete(deliveryId) {
    try { await completeDelivery.mutateAsync(deliveryId) } catch { /* mutation errors surfaced by react-query */ }
  }
  async function handleStart(deliveryId) {
    try { await startDelivery.mutateAsync(deliveryId) } catch { /* mutation errors surfaced by react-query */ }
  }
  async function handleArrive(deliveryId) {
    try { await arriveDelivery.mutateAsync(deliveryId) } catch { /* mutation errors surfaced by react-query */ }
  }

  if (isErrD || isErrS) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <SembakoErrorState error={isErrD ? errD : errS} onRetry={() => { refD(); refS(); }} />
    </div>
  )

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: '96px' }}>
      {!isDesktop && <BrokerMobileHeader title="Pengiriman" onMenuClick={() => setSidebarOpen(true)} />}

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <SembakoPageHeader
          title={isDesktop ? 'Pengiriman & Trip' : ''}
          subtitle={isDesktop ? `${stats.aktif} pengiriman aktif` : ''}
          isDesktop={isDesktop}
          filters={FILTER_TABS}
          activeFilter={filterTab}
          onFilterChange={setFilterTab}
          actionButton={
            <Button
              type="button"
              onClick={openIndependent}
              className="h-10 rounded-xl bg-[#EA580C] px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-950/20"
            >
              <Plus size={15} className="mr-1" /> Tambah Trip
            </Button>
          }
        />

        <div style={{ padding: isDesktop ? '24px 40px' : '20px 16px' }}>
          {/* Summary Stats */}
          <div className={cn(
            isDesktop ? 'grid grid-cols-2 gap-4 mb-8' : 'flex gap-3 overflow-x-auto pb-2 scrollbar-none pr-4 mb-6'
          )}>
            <SummaryCard
              label="Aktif"
              value={stats.aktif}
              icon={Truck}
              color="blue"
              subLabel="Dalam proses pengiriman"
            />
            <SummaryCard
              label="Selesai Hari Ini"
              value={stats.selesaiHariIni}
              icon={CheckCircle2}
              color="emerald"
              subLabel="Pengiriman terkirim"
            />
          </div>

          {/* Sales Perlu Dikirim */}
          {!loadingSales && salesPending.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <p style={{ ...sLabel, fontSize: '11px', marginBottom: '12px', color: C.amber }}>
                Sales Perlu Dikirim ({salesPending.length})
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isDesktop ? 'repeat(2,1fr)' : '1fr',
                gap: '10px',
              }}>
                {salesPending.map(sale => (
                  <SalePendingCard
                    key={sale.id}
                    sale={sale}
                    onBuatDelivery={() => openForSale(sale)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Delivery list */}
          {loadingDeliveries ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: '90px', borderRadius: '16px', background: C.card, opacity: 0.5 }} />
              ))}
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <EmptyBox
              icon={Truck}
              text="Belum ada pengiriman di kategori ini"
              hint="Pengiriman otomatis muncul saat Anda mengaktifkan opsi kirim di transaksi penjualan"
            />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? 'repeat(2,1fr)' : '1fr',
              gap: '12px',
            }}>
              {filteredDeliveries.map(d => (
                <DeliveryCard
                  key={d.id}
                  delivery={d}
                  onStart={handleStart}
                  onArrive={handleArrive}
                  onComplete={handleComplete}
                  highlighted={highlightedDeliveryId != null && d.id === highlightedDeliveryId}
                  onShowDetail={() => setDetailDelivery(d)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <SembakoDeliveryDetailSheet
        delivery={detailDelivery}
        onClose={() => setDetailDelivery(null)}
      />

      <TambahTripSheet
        open={sheetOpen}
        onClose={closeSheet}
        prefillSale={prefillSale}
        salesPending={salesPending}
        employees={employees}
        customers={customers}
      />
    </div>
  )
}
