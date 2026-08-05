// ProfitChart.jsx + StockTrendChart.jsx — chart components
import React from 'react'
import { useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatIDR } from '@/lib/format'
import { C } from '../sembakoSaleUtils'
import { ChartTooltip, StockChartTooltip } from './BerandaUtils'

// ── Legend Dot ───────────────────────────────────────────────────────────────
function LegendDot({ color, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
      <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8' }}>{label}</span>
    </span>
  )
}

// ── Profit Chart ─────────────────────────────────────────────────────────────
export function ProfitChart({ weeklyData, monthlyData, chartPeriod, setChartPeriod, isDesktop }) {
  const data = chartPeriod === 'weekly' ? weeklyData : monthlyData
  const totalNetProfit   = data.reduce((s, d) => s + (d.netProfit   || 0), 0)
  const totalGrossProfit = data.reduce((s, d) => s + (d.grossProfit || 0), 0)

  return (
    <div style={{
      background: C.card, borderRadius: '16px', padding: '16px',
      border: `1px solid ${C.border}`, width: '100%', marginBottom: '20px',
    }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div>
          <span style={{ fontSize: '10px', fontWeight: 800, color: C.muted, letterSpacing: '0.1em' }}>GRAFIK PROFIT</span>
          {/* Two profit KPI figures */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '4px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 600, marginBottom: '1px' }}>Gross Profit</p>
              <p style={{ fontSize: '16px', fontWeight: 900, color: '#10B981', fontFamily: 'DM Sans', lineHeight: 1.1 }}>
                {formatIDR(totalGrossProfit)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 600, marginBottom: '1px' }}>Net Profit</p>
              <p style={{ fontSize: '16px', fontWeight: 900, color: C.accent, fontFamily: 'DM Sans', lineHeight: 1.1 }}>
                {formatIDR(totalNetProfit)}
              </p>
            </div>
          </div>
        </div>

        {/* Period Switcher */}
        <div style={{
          display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
          padding: '3px', border: `1px solid ${C.border}`,
        }}>
          {[['weekly', 'Minggu'], ['monthly', 'Bulan']].map(([key, label]) => (
            <button key={key} onClick={() => setChartPeriod(key)} style={{
              padding: '5px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontSize: '10px', fontWeight: 800,
              background: chartPeriod === key ? C.accent : 'transparent',
              color: chartPeriod === key ? '#fff' : C.muted,
              transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
        <LegendDot color="#10B981" label="Gross Profit (Rev − COGS)" />
        <LegendDot color={C.accent} label="Net Profit (setelah biaya ops)" />
      </div>

      {/* ── Chart Area ── */}
      <div style={{ width: '100%', height: isDesktop ? '200px' : '150px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.accent} stopOpacity={0.35}/>
                <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(234,88,12,0.12)" vertical={false} />
            <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} minTickGap={16} />
            <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false}
              tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+'jt' : v >= 1000 ? (v/1000).toFixed(0)+'rb' : v}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(234,88,12,0.2)', strokeWidth: 1 }} />
            {/* Gross Profit — rendered first so it appears behind Net Profit */}
            <Area type="monotone" dataKey="grossProfit" name="Gross Profit"
              stroke="#10B981" strokeWidth={1.5} strokeDasharray="5 3"
              fillOpacity={1} fill="url(#grossGrad)"
              isAnimationActive={false}
              activeDot={{ r: 4, fill: '#10B981', stroke: C.card, strokeWidth: 2 }}
            />
            {/* Net Profit — primary metric, solid line */}
            <Area type="monotone" dataKey="netProfit" name="Net Profit"
              stroke={C.accent} strokeWidth={2.5}
              fillOpacity={1} fill="url(#netGrad)"
              isAnimationActive={false}
              activeDot={{ r: 5, fill: C.accent, stroke: C.card, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Stock Trend Chart ────────────────────────────────────────────────────────
export function StockTrendChart({ products = [], isDesktop = true }) {
  const stockChartData = useMemo(() => {
    return products.slice(0, 7).map(p => ({
      name: p.product_name?.length > 12 ? p.product_name.slice(0, 10) + '..' : p.product_name,
      fullName: p.product_name,
      stok: p.current_stock || 0,
      minAlert: p.min_stock_alert || 0,
      // Pass Rp value to tooltip only — not rendered as a bar
      nilaiStok: Math.round((p.current_stock || 0) * (p.avg_buy_price || 0)),
    }))
  }, [products])

  if (stockChartData.length === 0) return null

  return (
    <div style={{ background: C.card, borderRadius: '20px', padding: isDesktop ? '20px' : '16px', border: `1px solid ${C.border}`, marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: C.amber, letterSpacing: '0.1em' }}>GRAFIK LEVEL STOK GUDANG</span>
          <p style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>Perbandingan stok fisik aktif vs batas minimum alert</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <LegendDot color={C.accent} label="Stok Fisik" />
          <LegendDot color={C.amber} label="Min Alert" />
        </div>
      </div>
      <div style={{ width: '100%', height: isDesktop ? '200px' : '160px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stockChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,158,11,0.15)" vertical={false} />
            <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip content={<StockChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="stok"     name="Stok Fisik" fill={C.accent} radius={[6, 6, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="minAlert" name="Min Alert"  fill={C.amber}  radius={[6, 6, 0, 0]} opacity={0.6} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
