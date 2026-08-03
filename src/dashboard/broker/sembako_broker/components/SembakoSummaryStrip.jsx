import React from 'react'
import { formatIDR } from '@/lib/format'

const COLOR_MAP = {
  red:   { text: '#F87171', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.18)',   bar: '#EF4444' },
  green: { text: '#34D399', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.18)',  bar: '#10B981' },
  amber: { text: '#FBBF24', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.18)',  bar: '#F59E0B' },
  default:{ text: '#FEF3C7', bg: 'rgba(234,88,12,0.06)', border: 'rgba(234,88,12,0.15)',   bar: '#EA580C' },
}

export function SembakoSummaryStrip({ items = [] }) {
  if (!items.length) return null

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`,
      gap: '10px',
      padding: '12px 20px',
    }}>
      {items.map((item) => {
        const c = COLOR_MAP[item.color] || COLOR_MAP.default
        const displayValue = item.isCurrency
          ? formatIDR(Math.abs(item.value || 0))
          : (item.value ?? '—')

        return (
          <div
            key={item.label}
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: '14px',
              padding: '12px 14px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* accent bar top */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: '3px', background: c.bar, borderRadius: '14px 14px 0 0',
              opacity: 0.7,
            }} />

            <p style={{
              fontSize: '9px', fontWeight: 900, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: c.text, opacity: 0.7,
              marginBottom: '6px', fontFamily: 'DM Sans',
            }}>
              {item.label}
            </p>

            <p style={{
              fontSize: item.isCurrency ? '15px' : '22px',
              fontWeight: 900, fontFamily: 'Sora, DM Sans',
              color: c.text, lineHeight: 1,
              letterSpacing: item.isCurrency ? '-0.02em' : '0',
            }}>
              {displayValue}
            </p>

            {item.subLabel && (
              <p style={{
                fontSize: '10px', fontWeight: 600, color: c.text,
                opacity: 0.45, marginTop: '4px', fontFamily: 'DM Sans',
              }}>
                {item.subLabel}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
