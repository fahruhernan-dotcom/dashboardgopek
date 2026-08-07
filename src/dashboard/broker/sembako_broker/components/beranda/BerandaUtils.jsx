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
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'

export function KPICard({ icon: Icon, label, value, sub, accentColor = C.accent, urgent, badge, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flex: 1 }}
    >
      <Card
        style={{
          background: C.card,
          borderRadius: '14px',
          padding: '12px 14px',
          border: `1px solid ${C.border}`,
          borderLeft: urgent ? `4px solid ${accentColor}` : `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '8px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          fontFamily: "'Sora', 'Inter', sans-serif",
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <p style={{
            fontSize: '10px', color: C.muted, fontWeight: 800,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            lineHeight: 1.3,
            fontFamily: "'Sora', 'Inter', sans-serif"
          }}>{label}</p>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
            background: `${accentColor}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${accentColor}30`,
          }}>
            <Icon size={16} color={accentColor} />
          </div>
        </div>

        <div>
          <p style={{
            fontSize: '18px', fontWeight: 850, color: C.text,
            lineHeight: 1.2, fontFamily: "'Sora', 'Inter', sans-serif",
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            letterSpacing: '-0.02em',
          }}>{value}</p>
          {sub && (
            <p style={{
              fontSize: '10px', color: C.muted, marginTop: '3px', lineHeight: 1.4,
              fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              fontFamily: "'Sora', 'Inter', sans-serif"
            }}>{sub}</p>
          )}
        </div>

        {(trend != null || !!badge) && (
          <div style={{ paddingTop: '8px', borderTop: `1px solid ${C.border}60`, marginTop: 'auto' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              background: trend != null
                ? (trend >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)')
                : 'rgba(248, 150, 30, 0.12)',
              color: trend != null ? (trend >= 0 ? '#34D399' : '#F87171') : '#F59E0B',
              fontSize: '10px', fontWeight: 800, padding: '3px 8px',
              borderRadius: '6px', letterSpacing: '0.02em', whiteSpace: 'nowrap',
              border: trend != null
                ? (trend >= 0 ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)')
                : '1px solid rgba(248, 150, 30, 0.25)',
              fontFamily: "'Sora', 'Inter', sans-serif"
            }}>
              {trend != null
                ? `${trend >= 0 ? '↑' : '↓'} ${Math.abs(trend).toFixed(0)}% bln lalu`
                : badge}
            </span>
          </div>
        )}
      </Card>
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

// ── Chart Tooltip (Sales Performance Chart) ──────────────────────────────────
export function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const grossProfit = d.grossProfit || 0
  const netProfit = d.netProfit || 0
  const opsCost = grossProfit - netProfit

  const statusColors = {
    lunas: { bg: 'rgba(16,185,129,0.12)', color: '#34D399', label: 'Lunas' },
    sebagian: { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', label: 'Sebagian' },
    belum_lunas: { bg: 'rgba(239,68,68,0.12)', color: '#F87171', label: 'Belum Lunas' },
  }

  const hasUnpaid = d.txs?.some(tx => tx.paymentStatus !== 'lunas')

  return (
    <div style={{
      background: '#130C06', border: `1px solid ${C.border}`, borderRadius: '14px',
      padding: '12px 14px', minWidth: '220px', maxWidth: '280px', boxShadow: '0 8px 24px rgba(0,0,0,0.55)',
    }}>
      <p style={{ fontSize: '10px', color: C.muted, fontWeight: 700, marginBottom: '8px', letterSpacing: '0.05em' }}>{d.fullDate}</p>

      {/* ── PENJUALAN section ── */}
      <p style={{ fontSize: '9px', color: '#64748B', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '5px' }}>PENJUALAN</p>

      {/* Gross Profit */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
          <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>Gross Profit</span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#10B981' }}>{formatIDR(grossProfit)}</span>
      </div>

      {/* Net Profit */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EA580C', display: 'inline-block' }} />
          <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>Net Profit</span>
        </div>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#EA580C' }}>{formatIDR(netProfit)}</span>
      </div>

      {/* Ops Cost */}
      {opsCost > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
          <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600, paddingLeft: '13px' }}>Biaya Ops</span>
          <span style={{ fontSize: '11px', color: '#F87171', fontWeight: 700 }}>− {formatIDR(opsCost)}</span>
        </div>
      )}

      {/* ── TRANSAKSI section ── */}
      {d.txs?.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '7px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <p style={{ fontSize: '9px', color: '#64748B', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '2px' }}>
            TRANSAKSI ({d.txCount || d.txs.length})
          </p>
          {d.txs.map((tx, i) => {
            const st = statusColors[tx.paymentStatus] || statusColors.belum_lunas
            return (
              <div key={tx.id || i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '6px 8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: C.text, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                    {tx.label}
                  </span>
                  <span style={{
                    fontSize: '8px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px',
                    background: st.bg, color: st.color,
                  }}>{st.label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '2px' }}>
                  <span style={{ color: '#94A3B8' }}>Invoice {formatIDR(tx.amount)}</span>
                  <span style={{ color: '#EA580C', fontWeight: 700 }}>Profit {formatIDR(tx.netProfit)}</span>
                </div>
                {tx.paymentStatus !== 'lunas' && (
                  <div style={{ fontSize: '9px', color: '#64748B', marginTop: '1px' }}>
                    Dibayar {formatIDR(tx.paid)} · Sisa {formatIDR(tx.remaining)}
                  </div>
                )}
              </div>
            )
          })}
          {(d.txCount || 0) > 3 && (
            <p style={{ fontSize: '9px', color: '#64748B', textAlign: 'center', fontWeight: 600 }}>
              +{d.txCount - 3} transaksi lagi
            </p>
          )}
        </div>
      )}

      {/* Contextual note for unpaid invoices */}
      {hasUnpaid && grossProfit > 0 && (
        <p style={{
          fontSize: '9px', color: '#64748B', marginTop: '6px', fontStyle: 'italic',
          borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '5px',
        }}>
          ℹ Profit akan terealisasi setelah pembayaran diterima
        </p>
      )}
    </div>
  )
}

// ── Stock Chart Tooltip ────────────────────────────────────────────────────────
export function StockChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload || {}
  const stok = d.stok || 0
  const ads = Number(d.ads) || 0
  const doi = d.doi
  const statusLabel = d.statusLabel || 'Aman'
  const color = d.color || '#10B981'
  const modalTertahan = d.modalTertahan || 0
  const potensiOmzet = d.potensiOmzet || 0
  const recSupplierName = d.recSupplierName
  const recStatusText = d.recStatusText
  const reorderQty = d.reorderQty || 0
  const unit = d.unit || 'unit'

  return (
    <div style={{
      background: '#130C06', border: `1px solid rgba(234,88,12,0.25)`, borderRadius: '12px',
      padding: '12px 14px', minWidth: '220px', boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
      fontFamily: 'DM Sans'
    }}>
      <p style={{ fontSize: '12px', fontWeight: 800, color: C.text, marginBottom: '6px' }}>{d.fullName || label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '11px' }}>
          <span style={{ color: '#94A3B8' }}>Stok Fisik</span>
          <span style={{ color: C.text, fontWeight: 700 }}>{stok} {unit}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '11px' }}>
          <span style={{ color: '#94A3B8' }}>Status</span>
          <span style={{ color: color, fontWeight: 800 }}>{statusLabel}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '11px' }}>
          <span style={{ color: '#94A3B8' }}>Estimasi Habis</span>
          <span style={{ color: color, fontWeight: 700 }}>
            {doi === 999 ? '∞ Aman (Tidak Bergerak)' : `${doi.toFixed(1)} hari lagi`}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '11px' }}>
          <span style={{ color: '#94A3B8' }}>Kecepatan Keluar</span>
          <span style={{ color: '#FEF3C7', fontWeight: 600 }}>{ads.toFixed(1)} {unit}/hari</span>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '11px' }}>
            <span style={{ color: '#94A3B8' }}>Modal Tertahan</span>
            <span style={{ color: '#FDBA74', fontWeight: 700 }}>{formatIDR(modalTertahan)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '11px' }}>
            <span style={{ color: '#94A3B8' }}>Potensi Omzet</span>
            <span style={{ color: '#10B981', fontWeight: 700 }}>{formatIDR(potensiOmzet)}</span>
          </div>
        </div>

        {reorderQty > 0 && recSupplierName && (
          <div style={{ borderTop: '1px solid rgba(234,88,12,0.15)', paddingTop: '6px', marginTop: '4px', background: 'rgba(234,88,12,0.08)', borderRadius: '6px', padding: '6px 8px' }}>
            <p style={{ fontSize: '9px', fontWeight: 800, color: '#FDBA74', textTransform: 'uppercase', marginBottom: '2px' }}>💡 REKOMENDASI PEMBELIAN</p>
            <p style={{ fontSize: '10px', color: '#FEF3C7', lineHeight: '1.3', fontWeight: 500 }}>
              Pesan <strong style={{ color: '#EA580C' }}>±{reorderQty} {unit}</strong> ke <strong style={{ color: '#EA580C' }}>{recSupplierName}</strong> ({recStatusText})
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
