import React from 'react'
import { formatIDR } from '@/lib/format'

const COLOR_MAP = {
  red:   { text: '#F87171', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)',   bar: '#EF4444' },
  green: { text: '#34D399', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)',  bar: '#10B981' },
  amber: { text: '#FBBF24', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  bar: '#F59E0B' },
  default:{ text: '#F59E0B', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.2)',   bar: '#D97706' },
}

export function SembakoSummaryStrip({ items = [] }) {
  if (!items.length) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-6 py-4">
      {items.map((item) => {
        const c = COLOR_MAP[item.color] || COLOR_MAP.default
        const displayValue = item.isCurrency
          ? formatIDR(Math.abs(item.value || 0))
          : (item.value ?? '—')

        return (
          <div
            key={item.label}
            className="relative overflow-hidden rounded-2xl p-4 transition-all shadow-sm border"
            style={{
              background: c.bg,
              borderColor: c.border,
            }}
          >
            {/* Accent bar top */}
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{ background: c.bar }}
            />

            <p
              className="text-[11px] font-extrabold tracking-wider uppercase mb-1.5"
              style={{ color: c.text }}
            >
              {item.label}
            </p>

            <p className="text-xl sm:text-2xl font-black text-foreground tracking-tight font-sans truncate">
              {displayValue}
            </p>

            {item.subLabel && (
              <p
                className="text-xs font-semibold mt-1.5 line-clamp-1"
                style={{ color: c.text }}
              >
                {item.subLabel}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
