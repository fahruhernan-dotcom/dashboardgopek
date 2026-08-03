import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import { ChevronDown, Check, Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatIDR } from '@/lib/format'

// ── Palette ──────────────────────────────────────────────────────────────────
export const C = {
  bg: '#06090F', card: '#1C1208', input: '#231A0E',
  accent: '#EA580C', amber: '#F59E0B', green: '#021a02', red: '#EF4444',
  text: '#FEF3C7', muted: '#92400E',
  border: 'rgba(234,88,12,0.15)', borderAm: 'rgba(245,158,11,0.25)',
}

// ── Constants ─────────────────────────────────────────────────────────────────
export const PAYMENT_TERMS_DAYS = { cash: 0, net3: 3, net7: 7, net14: 14, net30: 30 }
export const PAYMENT_TERMS_LABEL = { cash: 'Cash', net3: 'NET 3', net7: 'NET 7', net14: 'NET 14', net30: 'NET 30' }

export const CUSTOMER_TYPES = [
  'warung','toko_retail','supermarket','restoran','catering','grosir','lainnya'
]
export const CUSTOMER_TYPE_OPTIONS = CUSTOMER_TYPES.map(t => ({ value: t, label: t.toUpperCase() }))
export const PAYMENT_METHOD_OPTIONS = ['cash','transfer','qris','giro','cek'].map(m => ({ value: m, label: m.toUpperCase() }))
export const INVOICE_FILTERS = [
  { id: 'all', label: 'Semua Invoice' },
  { id: 'unpaid', label: 'Punya Piutang' },
  { id: 'paid', label: 'Sudah Lunas' },
  { id: 'partial', label: 'Bayar Sebagian' },
  { id: 'overdue', label: 'Jatuh Tempo' },
]

// ── Style objects ─────────────────────────────────────────────────────────────
export const sInput = {
  background: C.input, border: `1px solid ${C.border}`, borderRadius: '10px',
  padding: '10px 12px', color: C.text, fontSize: '16px', fontWeight: 600,
  outline: 'none', width: '100%', appearance: 'none', WebkitAppearance: 'none',
  minHeight: '44px',
  colorScheme: 'dark',
}

export const sBtn = (primary) => ({
  background: primary ? C.accent : 'transparent',
  border: primary ? 'none' : `1px solid ${C.border}`,
  color: primary ? '#fff' : C.text, borderRadius: '10px',
  padding: '10px 18px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
})

export const sLabel = { fontSize: '11px', color: C.muted, fontWeight: 700, letterSpacing: '0.06em', marginBottom: '4px' }

// ── Utility functions ─────────────────────────────────────────────────────────

/**
 * Build a wa.me link from a raw phone number.
 * Handles Indonesian prefix: 08xxx → 628xxx, +62xxx → 62xxx.
 * @param {string} phone  Raw phone (may contain dashes, spaces, +)
 * @param {string} [encodedText]  Already-encodeURIComponent'd message
 * @returns {string|null}  Full wa.me URL or null if phone is empty
 */
export function toWaLink(phone, encodedText) {
  if (!phone) return null
  const digits = phone.replace(/[^0-9]/g, '')
  if (!digits) return null
  const normalized = digits.startsWith('0') ? '62' + digits.slice(1) : digits
  const base = `https://wa.me/${normalized}`
  return encodedText ? `${base}?text=${encodedText}` : base
}

export function fmtDate(d) {
  if (!d) return '-'
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return '-' }
}

export function generateWAMessage(sale, tenant) {
  const items = Array.isArray(sale.sembako_sale_items) ? sale.sembako_sale_items : (sale.items || [])
  const itemList = items.map(it => `- ${it.product_name || it.name} (${it.quantity || it.quantity_kg} ${it.unit || 'pcs'})`).join('\n')
  const status = sale.payment_status === 'lunas' ? '[LUNAS]' : '[BELUM LUNAS]'

  const text = `*NOTA PENJUALAN*\n` +
    `--------------------------\n` +
    `No: ${sale.invoice_number || sale.invoiceNumber || '-'}\n` +
    `Toko: ${sale.sembako_customers?.customer_name || sale.customer_name || sale.customerName || '-'}\n` +
    `Tanggal: ${new Date(sale.transaction_date || new Date()).toLocaleDateString('id-ID')}\n\n` +
    `*Detail Barang:*\n${itemList}\n\n` +
    `*Total: ${formatIDR(sale.total_amount || sale.revenue)}*\n` +
    `Status: ${status}\n` +
    ((sale.remaining_amount > 0 || sale.payment_status !== 'lunas') ? `Sisa Tagihan: ${formatIDR(sale.remaining_amount || (sale.total_amount || sale.revenue))}\n` : '') +
    `--------------------------\n` +
    `Terima kasih telah berbelanja di *${tenant?.business_name || 'Toko Kami'}*`

  return encodeURIComponent(text)
}

// ── UI Primitives ─────────────────────────────────────────────────────────────
export function CustomSelect({ value, onChange, options, placeholder, onAddNew, id, style }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <div
        id={id}
        onClick={() => setOpen(!open)}
        style={{
          ...sInput,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: open ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
          transition: 'all 0.2s'
        }}
      >
        <span style={{ color: value ? C.text : C.muted, fontSize: '14px' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} color={C.muted} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      <AnimatePresence>
        {open && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 998 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                background: '#130C06', border: `1px solid ${C.border}`, borderRadius: '14px',
                zIndex: 999, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {options.length === 0 && !onAddNew && (
                  <div style={{ padding: '16px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
                    Tidak ada pilihan
                  </div>
                )}
                {options.map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    style={{
                      padding: '12px 16px', fontSize: '14px', color: value === opt.value ? C.accent : C.text,
                      background: value === opt.value ? 'rgba(234,88,12,0.1)' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}
                  >
                    <span>{opt.label}</span>
                    {value === opt.value && <Check size={14} />}
                  </div>
                ))}
              </div>
              {onAddNew && (
                <div
                  onClick={() => { onAddNew(); setOpen(false) }}
                  style={{
                    padding: '12px 16px', fontSize: '14px', color: C.accent,
                    fontWeight: 700, borderTop: `1px solid ${C.border}`,
                    cursor: 'pointer', background: 'rgba(234,88,12,0.05)',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <Plus size={14} /> Tambah Baru
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export function InputRupiah({ value, onChange, placeholder, style, disabled }) {
  const display = value ? Number(value).toLocaleString('id-ID') : ''
  return (
    <input style={{ ...sInput, ...style, opacity: disabled ? 0.5 : 1 }} placeholder={placeholder || 'Rp 0'}
      value={display ? `Rp ${display}` : ''}
      disabled={disabled}
      onChange={e => {
        const raw = e.target.value.replace(/[^0-9]/g, '')
        onChange(raw ? parseInt(raw) : 0)
      }} />
  )
}

export function ProgressIndicator({ currentStep, steps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, padding: '16px 0', marginBottom: '20px', borderTop: `1px solid ${C.border}` }}>
      {steps.map((label, i) => {
        const done = i < currentStep
        const active = i === currentStep
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0, flex: 1 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: done ? C.green : active ? 'rgba(2, 26, 2,0.15)' : 'rgba(255,255,255,0.05)',
                border: done ? 'none' : active ? `2px solid ${C.green}` : `2px solid ${C.border}`,
              }}>
                {done
                  ? <Check size={12} color="white" strokeWidth={3} />
                  : <span style={{ fontSize: 10, fontWeight: 700, color: active ? C.green : C.muted }}>{i + 1}</span>
                }
              </div>
              <span style={{
                fontSize: 9, color: done ? C.green : active ? C.green : C.muted,
                textAlign: 'center', marginTop: 4, fontWeight: 600,
                width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                display: 'block',
              }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, marginTop: 11, background: i < currentStep ? C.green : C.border }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1,2,3].map(i => (
        <Skeleton key={i} style={{ height: '140px', width: '100%', borderRadius: '20px', background: 'rgba(255,255,255,0.05)' }} />
      ))}
    </div>
  )
}

export function EmptyBox({ icon: Icon, text, hint, actionLabel, onAction }) {
  const EmptyIcon = Icon
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: `1px dashed ${C.border}` }}>
      <EmptyIcon size={40} color={C.muted} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
      <p style={{ color: C.muted, fontSize: '14px', fontWeight: 600 }}>{text}</p>
      {hint && (
        <p style={{ color: C.muted, fontSize: '12px', fontWeight: 500, marginTop: '6px', opacity: 0.7, lineHeight: 1.5 }}>{hint}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: '16px',
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 22px', borderRadius: '12px',
            background: C.accent, color: '#fff',
            fontSize: '13px', fontWeight: 700, fontFamily: 'DM Sans',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(234,88,12,0.3)',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export function DetailRow({ label, value, color = C.text, bold, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
      <span style={{ fontSize: '11px', color: C.muted, fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
      <span style={{
        fontSize: highlight ? '16px' : '13px',
        fontWeight: bold || highlight ? 900 : 600,
        color: color,
        fontFamily: highlight ? 'DM Sans' : 'inherit'
      }}>{value}</span>
    </div>
  )
}

export function SummaryLine({ label, value, bold, color = C.text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
      <span style={{ fontSize: '12px', color: C.muted }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: bold ? 800 : 500, color: color }}>{value}</span>
    </div>
  )
}
