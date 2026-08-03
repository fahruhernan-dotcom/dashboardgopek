// BerandaUtils.js — shared constants, helpers, dan shared mini-components
// Tidak ada React state — import-safe dari semua komponen beranda

import { formatIDR } from '@/lib/format'
import { C } from '../sembakoSaleUtils'

// ── Date formatter ─────────────────────────────────────────────────────────────
export function fmtDate(d) {
  if (!d) return '-'
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) }
  catch { return '-' }
}

// ── Payment status styles ──────────────────────────────────────────────────────
export const STATUS_STYLE = {
  lunas:       { bg: 'rgba(16, 185, 129, 0.1)',  color: '#34D399', label: 'Lunas',       border: 'rgba(16, 185, 129, 0.2)' },
  sebagian:    { bg: 'rgba(245, 158, 11, 0.1)',  color: '#FBBF24', label: 'Sebagian',    border: 'rgba(245, 158, 11, 0.2)' },
  belum_lunas: { bg: 'rgba(239, 68, 68, 0.1)',   color: '#F87171', label: 'Belum Lunas', border: 'rgba(239, 68, 68, 0.2)' },
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
export function Skel({ h = '60px', w = '100%', r = '14px' }) {
  return (
    <div className="animate-pulse" style={{ background: '#231A0E', borderRadius: r, height: h, width: w }} />
  )
}

export function BerandaSkeleton({ isDesktop }) {
  if (isDesktop) {
    return (
      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Skel h="22px" w="160px" r="8px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[...Array(4)].map((_, i) => <Skel key={i} h="88px" r="18px" />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <Skel h="260px" r="20px" />
          <Skel h="260px" r="20px" />
        </div>
        <Skel h="200px" r="20px" />
      </div>
    )
  }
  return (
    <div>
      <div style={{ background: '#0E0905', height: '60px', borderBottom: '1px solid rgba(234,88,12,0.1)' }} />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Skel h="20px" w="55%" r="8px" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[...Array(4)].map((_, i) => <Skel key={i} h="72px" r="14px" />)}
        </div>
        <Skel h="180px" r="20px" />
        {[...Array(3)].map((_, i) => <Skel key={i} h="78px" r="16px" />)}
      </div>
    </div>
  )
}

// ── KPI Card ───────────────────────────────────────────────────────────────────
import { motion } from 'framer-motion'

export function KPICard({ icon: Icon, label, value, sub, accentColor = C.accent, urgent, badge, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: C.card, borderRadius: '14px', padding: '12px 14px',
        border: `1px solid ${C.border}`,
        borderLeft: urgent ? `3px solid ${accentColor}` : `1px solid ${C.border}`,
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        width: '32px', height: '32px', borderRadius: '99px', flexShrink: 0, marginTop: '2px',
        background: `${accentColor}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} color={accentColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '9px', color: C.muted, fontWeight: 700,
          letterSpacing: '0.05em', textTransform: 'uppercase',
          marginBottom: '3px', lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{label}</p>
        <p style={{
          fontSize: '15px', fontWeight: 800, color: C.text,
          lineHeight: 1.1, fontFamily: 'DM Sans',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{value}</p>
        {sub && (
          <p style={{ fontSize: '9px', color: C.muted, marginTop: '3px', lineHeight: 1.3,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{sub}</p>
        )}
        <span style={{
          display: 'inline-block', marginTop: '4px',
          background: trend != null
            ? (trend >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)')
            : 'rgba(148, 163, 184, 0.1)',
          color: trend != null ? (trend >= 0 ? '#34D399' : '#F87171') : '#94A3B8',
          fontSize: '8px', fontWeight: 800, padding: '2px 5px',
          borderRadius: '4px', letterSpacing: '0.02em', whiteSpace: 'nowrap',
          border: trend != null
            ? (trend >= 0 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)')
            : '1px solid rgba(148, 163, 184, 0.2)',
        }}>
          {trend != null
            ? `${trend >= 0 ? '↑' : '↓'} ${Math.abs(trend).toFixed(0)}%`
            : (badge || 'Belum ada pembanding')}
        </span>
      </div>
    </motion.div>
  )
}

// ── Invoice Row ────────────────────────────────────────────────────────────────
export function InvoiceRow({ sale, onClick }) {
  const st = STATUS_STYLE[sale.payment_status] || STATUS_STYLE.belum_lunas
  const name = sale.sembako_customers?.customer_name || sale.customer_name || '-'
  return (
    <div
      onClick={onClick}
      style={{
        background: C.input, borderRadius: '10px', padding: '10px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
        <p style={{ fontSize: '11px', color: C.muted, marginTop: '1px' }}>{fmtDate(sale.transaction_date)}</p>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{formatIDR(sale.total_amount)}</p>
        <span style={{
          display: 'inline-block', marginTop: '2px',
          background: st.bg, color: st.color,
          fontSize: '9px', fontWeight: 900, padding: '1px 5px', borderRadius: '4px',
          border: st.border ? `1px solid ${st.border}` : 'none',
        }}>{st.label}</span>
      </div>
    </div>
  )
}

// ── QuickStat Row ──────────────────────────────────────────────────────────────
export function QuickStatRow({ label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', background: C.input, borderRadius: '10px',
    }}>
      <span style={{ fontSize: '12px', color: C.muted, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: 800, color: C.text }}>{value}</span>
    </div>
  )
}

// ── Chart Tooltip ──────────────────────────────────────────────────────────────
export function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: '#130C06', border: `1px solid ${C.border}`, borderRadius: '12px',
      padding: '12px 14px', minWidth: '180px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <p style={{ fontSize: '10px', color: C.muted, fontWeight: 700, marginBottom: '6px' }}>{d.fullDate}</p>
      <p style={{ fontSize: '13px', fontWeight: 800, color: C.accent, marginBottom: '6px' }}>{formatIDR(d.profit)}</p>
      {d.txs?.length > 0 && (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {d.txs.map(tx => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '11px' }}>
              <span style={{ color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>{tx.label}</span>
              <span style={{ color: C.text, fontWeight: 700, whiteSpace: 'nowrap' }}>{formatIDR(tx.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
