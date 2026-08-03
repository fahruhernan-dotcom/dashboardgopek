import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatIDR, formatIDRShort } from '@/lib/format'
import { BrokerBaseCard } from '@/dashboard/_shared/components/transactions/BrokerBaseCard'
import { ChevronDown, Truck, User, Package } from 'lucide-react'
import {
  useSembakoDeliveries,
  useSembakoEmployees,
  useSembakoCustomers,
  useSembakoSalesPendingDelivery,
  useStartSembakoDelivery,
  useCompleteSembakoDelivery,
} from '@/lib/hooks/useSembakoData'
import { C, sBtn, fmtDate } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import { TambahTripSheet } from '@/dashboard/broker/sembako_broker/components/SembakoDeliveryShared'

function getDeliveryBadge(deliveries) {
  if (!deliveries || deliveries.length === 0) {
    return { label: 'Belum Dikirim', color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)', icon: '📦' }
  }
  const allDelivered = deliveries.every(d => d.status === 'delivered')
  const anyInTransit = deliveries.some(d => d.status === 'in_transit')
  const anyDelivered = deliveries.some(d => d.status === 'delivered')

  if (allDelivered) {
    return { label: 'Terkirim', color: '#34D399', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.20)', icon: '✓' }
  }
  if (anyInTransit || anyDelivered) {
    return { label: 'Di Jalan', color: '#FBBF24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.15)', icon: '🚚' }
  }
  return { label: 'Siap Kirim', color: '#93C5FD', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.15)', icon: '📦' }
}

function fmtDateLocal(value) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '-'
  }
}

// ── Mini delivery row (mobile expand panel) ───────────────────────────────────
function MiniDeliveryRow({ delivery, onStart, onComplete, onNavigate }) {
  const statusMeta = {
    pending:   { label: 'Disiapkan', color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
    on_route:  { label: 'Di Jalan',  color: '#60A5FA', bg: 'rgba(59,130,246,0.1)', pulse: true },
    delivered: { label: 'Selesai',   color: '#34D399', bg: 'rgba(16, 185, 129, 0.1)' },
  }
  const meta = statusMeta[delivery.status] || statusMeta.pending
  const emp = delivery.sembako_employees
  const vehicle = [delivery.vehicle_type, delivery.vehicle_plate].filter(Boolean).join(' ') || '—'

  return (
    <div
      onClick={e => { e.stopPropagation(); onNavigate?.(delivery.id) }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Row 1: status + date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '9px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '2px 7px', borderRadius: '6px',
          background: meta.bg, color: meta.color,
          display: 'inline-flex', alignItems: 'center', gap: '4px',
        }}>
          {meta.pulse && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: meta.color }} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: meta.color }} />
            </span>
          )}
          {meta.label}
        </span>
        <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700 }}>{fmtDate(delivery.delivery_date)}</span>
      </div>

      {/* Row 2: driver + vehicle */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
          <User size={10} color="#94A3B8" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {emp?.full_name || delivery.driver_name || '—'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <Truck size={10} color="#94A3B8" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700 }}>{vehicle}</span>
        </div>
      </div>

      {/* Action button */}
      {delivery.status === 'pending' && (
        <button
          onClick={() => onStart(delivery.id)}
          style={{ ...sBtn(false), padding: '7px', fontSize: '11px', width: '100%', marginTop: '2px', color: '#60A5FA', borderColor: 'rgba(59,130,246,0.3)' }}
        >
          <Truck size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Mulai Perjalanan
        </button>
      )}
      {delivery.status === 'on_route' && (
        <button
          onClick={() => onComplete(delivery.id)}
          style={{ ...sBtn(true), padding: '7px', fontSize: '11px', width: '100%', marginTop: '2px', background: '#10B981' }}
        >
          ✓ Selesaikan
        </button>
      )}
    </div>
  )
}

// ── Sale delivery panel (shown in mobile expand) ──────────────────────────────
function SaleDeliveryPanel({ sale, onOpenDetail }) {
  const { data: allDeliveries = [] } = useSembakoDeliveries()
  const { data: employees = [] } = useSembakoEmployees()
  const { data: customers = [] } = useSembakoCustomers()
  const { data: salesPending = [] } = useSembakoSalesPendingDelivery()
  const startDelivery = useStartSembakoDelivery()
  const completeDelivery = useCompleteSembakoDelivery()
  const [sheetOpen, setSheetOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const saleDeliveries = allDeliveries.filter(d => d.sale_id === sale.id && !d.is_deleted)
  const allDone = saleDeliveries.length > 0 && saleDeliveries.every(d => d.status === 'delivered')

  const handleNavigateToDelivery = (deliveryId) => {
    const pengirimanPath = location.pathname.replace('/penjualan', '/pengiriman')
    navigate(`${pengirimanPath}?highlightDelivery=${deliveryId}`)
  }

  return (
    <div style={{
      background: '#0F1A10',
      borderRadius: '0 0 18px 18px',
      border: `1px solid ${C.border}`,
      borderTop: 'none',
      padding: '12px 14px 14px',
    }}>
      {/* Section header */}
      <p style={{
        fontSize: '9px', fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: '#94A3B8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px',
      }}>
        <Truck size={11} color="#94A3B8" />
        Pengiriman ({saleDeliveries.length})
      </p>

      {/* Delivery list */}
      {saleDeliveries.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0', marginBottom: '10px' }}>
          <Package size={13} color={C.muted} />
          <p style={{ fontSize: '12px', color: C.muted, margin: 0, fontWeight: 600 }}>Belum ada pengiriman</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
          {saleDeliveries.map(d => (
            <MiniDeliveryRow
              key={d.id}
              delivery={d}
              onStart={id => startDelivery.mutate(id)}
              onComplete={id => completeDelivery.mutate(id)}
              onNavigate={handleNavigateToDelivery}
            />
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {!allDone && (
          <button
            onClick={e => { e.stopPropagation(); setSheetOpen(true) }}
            style={{ ...sBtn(true), flex: 1, padding: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
          >
            <Truck size={13} /> Buat Pengiriman
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onOpenDetail?.() }}
          style={{ ...sBtn(false), flex: 1, padding: '10px', fontSize: '12px' }}
        >
          Detail Invoice
        </button>
      </div>

      <TambahTripSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        prefillSale={sale}
        salesPending={salesPending}
        employees={employees}
        customers={customers}
      />
    </div>
  )
}

// ── Main card component ───────────────────────────────────────────────────────
export function SembakoInvoiceCard({ sale, onOpenDetail, onManageDelivery, isDesktop }) {
  const [expanded, setExpanded] = useState(false)

  const customerName = sale.sembako_customers?.customer_name || sale.customer_name || 'Umum'
  const items = Array.isArray(sale.sembako_sale_items) ? sale.sembako_sale_items : []
  const deliveries = Array.isArray(sale.sembako_deliveries) ? sale.sembako_deliveries : []

  const initialCustomer = customerName.charAt(0).toUpperCase()
  const hasDebt = (sale.remaining_amount || 0) > 0
  const isLunas = sale.payment_status === 'lunas'
  const isSebagian = sale.payment_status === 'sebagian'

  const topItem = items[0]
  const totalQty = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
  const itemUnit = topItem?.unit || 'unit'

  const deliveryBadge = getDeliveryBadge(deliveries)
  const allDelivered = deliveries.length > 0 && deliveries.every(d => d.status === 'delivered')

  const fmt = isDesktop ? formatIDR : formatIDRShort
  const valSize = isDesktop ? 'text-[18px]' : 'text-[13px]'

  // ── Avatar color by payment state ──
  const avatarCn = isLunas
    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
    : hasDebt
      ? 'bg-red-500/10 border-red-500/40 text-red-500'
      : 'bg-amber-500/10 border-amber-500/40 text-amber-400'

  const paymentLabel = isLunas ? 'LUNAS' : isSebagian ? 'SEBAGIAN' : 'BELUM LUNAS'

  // ── DESKTOP header ──
  const desktopHeader = (
    <>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn('w-[34px] h-[34px] rounded-xl flex items-center justify-center font-black text-lg border-2', avatarCn)}>
          {initialCustomer}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-sm text-[#F1F5F9] leading-none uppercase tracking-tight truncate">
            {customerName}
          </h3>
          <p className="text-xs font-medium text-[#94A3B8] mt-1.5 tabular-nums truncate">
            {sale.invoice_number || '-'} · {fmtDateLocal(sale.transaction_date)}
            {sale.due_date ? ` · Tempo: ${fmtDateLocal(sale.due_date)}` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '2px 8px', borderRadius: '99px',
          background: isLunas ? 'rgba(16, 185, 129, 0.1)' : isSebagian ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)',
          color: isLunas ? '#34D399' : isSebagian ? '#FBBF24' : '#F87171',
          fontSize: '8px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          {paymentLabel}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 900, padding: '3px 12px', borderRadius: '99px', background: deliveryBadge.bg, border: `1px solid ${deliveryBadge.border}`, color: deliveryBadge.color, textTransform: 'uppercase' }}>
          {deliveryBadge.icon && <span style={{ opacity: 0.7 }}>{deliveryBadge.icon}</span>}
          {deliveryBadge.label}
        </span>
      </div>
    </>
  )

  // ── MOBILE header — 2-row layout ──
  const mobileHeader = (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Row 1: avatar + name + payment badge */}
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center font-black text-base border-2 shrink-0', avatarCn)}>
          {initialCustomer}
        </div>
        <h3 className="font-display font-bold text-[12px] text-[#F1F5F9] leading-none uppercase tracking-tight flex-1 min-w-0 truncate">
          {customerName}
        </h3>
        <span style={{
          display: 'inline-flex', alignItems: 'center', flexShrink: 0,
          padding: '2px 7px', borderRadius: '99px',
          background: isLunas ? 'rgba(16, 185, 129, 0.1)' : isSebagian ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)',
          color: isLunas ? '#34D399' : isSebagian ? '#FBBF24' : '#F87171',
          fontSize: '8px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          {isLunas ? 'LUNAS' : isSebagian ? 'SEBAGIAN' : 'BELUM LUNAS'}
        </span>
        {/* Expand chevron */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-[#94A3B8]"
        >
          <ChevronDown size={15} />
        </motion.div>
      </div>
      {/* Row 2: invoice info + delivery badge */}
      <div className="flex items-center justify-between pl-10">
        <p className="text-[10px] font-medium text-[#94A3B8] tabular-nums truncate">
          {sale.invoice_number || '-'} · {fmtDateLocal(sale.transaction_date)}
        </p>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '9px', fontWeight: 900, padding: '2px 7px', borderRadius: '99px', background: deliveryBadge.bg, border: `1px solid ${deliveryBadge.border}`, color: deliveryBadge.color, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {deliveryBadge.icon && <span style={{ opacity: 0.7 }}>{deliveryBadge.icon}</span>}
          {deliveryBadge.label}
        </span>
      </div>
    </div>
  )

  // ── Footer (desktop only) ──
  const footer = isDesktop ? (
    <>
      <div className="text-left">
        {isLunas ? (
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-[#34D399] tracking-widest leading-none">TOTAL DIBAYAR</p>
            <p className={cn('font-display font-bold text-[#34D399] leading-none mt-1 tabular-nums', valSize)}>
              {fmt(sale.total_amount || 0)}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase font-bold text-[#F87171] tracking-widest leading-none">SISA PIUTANG</p>
              {!allDelivered && (
                <button
                  onClick={(e) => { e.stopPropagation(); onManageDelivery?.() }}
                  className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter active:scale-90 transition-all"
                >
                  Kirim
                </button>
              )}
            </div>
            <p className={cn('font-display font-bold text-[#F87171] tabular-nums leading-none mt-1', valSize)}>
              {fmt(sale.remaining_amount || 0)}
            </p>
          </div>
        )}
      </div>

      <div className="text-right">
        <p className="text-[10px] font-black uppercase tracking-widest leading-none text-[#94A3B8]">TOTAL TAGIHAN</p>
        <p className={cn('font-display font-bold tabular-nums leading-none mt-1.5 text-[#F1F5F9]', valSize)}>
          {fmt(sale.total_amount || 0)}
        </p>
      </div>
    </>
  ) : undefined

  // ── DESKTOP body — 3 columns ──
  const desktopBody = (
    <div className="grid grid-cols-[1fr_1fr_1.6fr] gap-4">
      {/* Kolom 1: ITEM */}
      <div className="space-y-2 text-left border-r border-white/[0.08] pr-4 min-w-0">
        <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Item</p>
        <p className="font-display text-[22px] font-bold text-[#F1F5F9] tabular-nums leading-none">
          {items.length} <span className="text-xs font-normal text-[#94A3B8] ml-0.5">jenis</span>
        </p>
        <div className="space-y-1">
          {topItem && (
            <p className="text-[11px] font-medium text-[#94A3B8] truncate">{topItem.product_name}</p>
          )}
          <p className="text-[11px] font-medium text-[#94A3B8]">Total {totalQty} {itemUnit}</p>
        </div>
      </div>

      {/* Kolom 2: TAGIHAN */}
      <div className="space-y-2 text-left border-r border-white/[0.08] pr-4 min-w-0">
        <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Tagihan</p>
        <p className="font-display text-[22px] font-bold text-[#F1F5F9] tabular-nums leading-none">
          {formatIDR(sale.total_amount || 0)}
        </p>
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-[#94A3B8]">Dibayar: {formatIDR(sale.paid_amount || 0)}</p>
          {hasDebt && (
            <p className="text-[11px] font-medium text-[#F87171]">Sisa: {formatIDR(sale.remaining_amount || 0)}</p>
          )}
        </div>
      </div>

      {/* Kolom 3: PENGIRIMAN */}
      <div className="space-y-3 text-left min-w-0">
        <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">Pengiriman</p>
        <div className="grid grid-cols-1 gap-y-3">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase leading-none">Status Kirim</p>
            <p className="text-[13px] font-black leading-none" style={{ color: deliveryBadge.color }}>
              {deliveryBadge.label}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#94A3B8] leading-none">Total Trip</p>
            <p className="text-[13px] font-semibold text-[#F1F5F9] tabular-nums leading-none">
              {deliveries.length > 0 ? deliveries.length : '—'}
            </p>
          </div>
          {!allDelivered && (
            <>
              <div className="border-t border-white/5 my-1" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onManageDelivery?.() }}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#94A3B8] transition-colors hover:border-[#EA580C]/20 hover:text-[#FEF3C7] w-full text-left"
              >
                Atur Pengiriman →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  // ── MOBILE body — 2-row compact strip ──
  const mobileBody = (
    <div className="space-y-1.5">
      {/* Row 1: item count + total amount */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1 flex-1 min-w-0">
          <span className="text-[13px] font-bold text-[#F1F5F9] tabular-nums leading-none">{items.length}</span>
          <span className="text-[9px] font-medium text-[#94A3B8] leading-none">jenis</span>
          <span className="text-[9px] text-[#94A3B8] leading-none mx-0.5">·</span>
          <span className="text-[13px] font-bold text-[#F1F5F9] tabular-nums leading-none">{totalQty}</span>
          <span className="text-[9px] font-medium text-[#94A3B8] leading-none">{itemUnit}</span>
        </div>
        <span className="font-display text-[14px] font-bold text-[#F1F5F9] tabular-nums leading-none shrink-0">
          {expanded ? formatIDR(sale.total_amount || 0) : formatIDRShort(sale.total_amount || 0)}
        </span>
      </div>

      {/* Row 2: top product + payment summary */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-medium text-[#94A3B8] truncate flex-1">
          {topItem?.product_name || '—'}
        </span>
        {isLunas ? (
          <span className="text-[10px] font-black text-[#34D399] shrink-0">✓ Lunas</span>
        ) : (
          <span className="text-[10px] font-black text-[#F87171] tabular-nums shrink-0">
            Sisa {expanded ? formatIDR(sale.remaining_amount || 0) : formatIDRShort(sale.remaining_amount || 0)}
          </span>
        )}
      </div>
    </div>
  )

  const handleCardClick = isDesktop
    ? onOpenDetail
    : () => setExpanded(v => !v)

  return (
    <div>
      <BrokerBaseCard
        onClick={handleCardClick}
        isLoss={false}
        header={isDesktop ? desktopHeader : mobileHeader}
        footer={footer}
        isDesktop={isDesktop}
        className={!isDesktop && expanded ? 'rounded-b-none border-b-0' : ''}
      >
        {isDesktop ? desktopBody : mobileBody}
      </BrokerBaseCard>

      <AnimatePresence>
        {!isDesktop && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: 'hidden' }}
          >
            <SaleDeliveryPanel sale={sale} onOpenDetail={onOpenDetail} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
