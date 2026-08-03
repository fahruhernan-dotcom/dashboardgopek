// ProfitChart.jsx + StockTrendChart.jsx — chart components
import React from 'react'
import { useMemo } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatIDR } from '@/lib/format'
import { C } from '../sembakoSaleUtils'
import { ChartTooltip } from './BerandaUtils'

// ── Profit Chart ───────────────────────────────────────────────────────────────
export function ProfitChart({ weeklyData, monthlyData, chartPeriod, setChartPeriod, isDesktop }) {
  const data = chartPeriod === 'weekly' ? weeklyData : monthlyData
  const totalProfit = data.reduce((s, d) => s + d.profit, 0)

  return (
    <div style={{
      background: C.card, borderRadius: '16px', padding: '16px',
      border: `1px solid ${C.border}`, width: '100%', marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div>
          <span style={{ fontSize: '10px', fontWeight: 800, color: C.muted, letterSpacing: '0.1em' }}>NET PROFIT</span>
          <p style={{ fontSize: '20px', fontWeight: 900, color: C.text, fontFamily: 'DM Sans', lineHeight: 1.1 }}>
            {formatIDR(totalProfit)}
          </p>
        </div>
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
      <div style={{ width: '100%', height: isDesktop ? '200px' : '150px', marginTop: '12px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.accent} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(234,88,12,0.15)" vertical={false} />
            <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} minTickGap={16} />
            <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false}
              tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+'jt' : v >= 1000 ? (v/1000).toFixed(0)+'rb' : v}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(234,88,12,0.2)', strokeWidth: 1 }} />
            <Area type="monotone" dataKey="profit" stroke={C.accent} strokeWidth={2.5}
              fillOpacity={1} fill="url(#profitGrad)"
              isAnimationActive={false}
              activeDot={{ r: 5, fill: C.accent, stroke: C.card, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Stock Trend Chart ─────────────────────────────────────────────────────────
export function StockTrendChart({ products = [], isDesktop = true }) {
  const stockChartData = useMemo(() => {
    return products.slice(0, 7).map(p => ({
      name: p.product_name?.length > 12 ? p.product_name.slice(0, 10) + '..' : p.product_name,
      stok: p.current_stock || 0,
      minAlert: p.min_stock_alert || 0,
    }))
  }, [products])

  if (stockChartData.length === 0) return null

  return (
    <div style={{ background: C.card, borderRadius: '20px', padding: isDesktop ? '20px' : '16px', border: `1px solid ${C.border}`, marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: C.amber, letterSpacing: '0.1em' }}>GRAFIK LEVEL STOK GUDANG</span>
          <p style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>Perbandingan stok fisik aktif vs batas minimum alert</p>
        </div>
      </div>
      <div style={{ width: '100%', height: isDesktop ? '200px' : '160px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stockChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,158,11,0.15)" vertical={false} />
            <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
            <Bar dataKey="stok"     name="Stok Fisik" fill="#EA580C" radius={[6, 6, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="minAlert" name="Min Alert"  fill="#F59E0B" radius={[6, 6, 0, 0]} opacity={0.6} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
