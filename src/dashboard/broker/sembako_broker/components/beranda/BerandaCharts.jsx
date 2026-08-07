// ProfitChart.jsx + StockTrendChart.jsx — chart components
import React, { useMemo, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, Cell, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatIDR } from '@/lib/format'
import { C } from '../sembakoSaleUtils'
import { ChartTooltip, StockChartTooltip } from './BerandaUtils'
import { getSupplierRecommendation } from '@/lib/hooks/sembako/sembakoSupplierAssistant'
import { ChartContainer } from '@/components/ui/chart'
import { Button } from '@/components/ui/button'

const chartConfig = {
  stok: {
    label: "Stok Fisik",
  },
}

const salesChartConfig = {
  grossProfit: {
    label: "Gross Profit",
    color: "#10B981",
  },
  netProfit: {
    label: "Net Profit",
    color: "#EA580C",
  },
}

// ── Legend Dot ───────────────────────────────────────────────────────────────
function LegendDot({ color, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
      <span style={{ fontSize: '10px', fontWeight: 800, color: C.text }}>{label}</span>
    </span>
  )
}

// ── Sales Performance Chart ──────────────────────────────────────────────────
// ── Sales & Cash Flow Assistant Chart ────────────────────────────────────────
export function SalesAndCashChart({ 
  weeklyData, 
  monthlyData, 
  chartPeriod, 
  setChartPeriod, 
  isDesktop, 
  unrealizedProfitSnapshot = 0,
  cashSummary = {},
  stats
}) {
  const data = chartPeriod === 'weekly' ? weeklyData : monthlyData
  const totalGrossProfit = data.reduce((s, d) => s + (d.grossProfit || 0), 0)
  const totalNetProfit = data.reduce((s, d) => s + (d.netProfit || 0), 0)

  const {
    totalCashIn = 0,
    totalCashOut = 0,
    totalCashOutPurchases = 0,
    totalCashOutExpenses = 0,
    totalCashOutPayroll = 0,
    cashBalance = 0,
    realizedProfit = 0,
  } = cashSummary

  const kpiBoxStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '12px 14px',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.005) 100%)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    fontFamily: "'Sora', 'Inter', sans-serif",
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  }
  const kpiLabelStyle = { fontSize: '10px', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.02em', fontFamily: "'Sora', 'Inter', sans-serif" }
  const kpiValueStyle = { fontSize: '16px', fontWeight: 900, fontFamily: "'Sora', 'Inter', sans-serif", marginTop: '3px', lineHeight: '1.2' }

  return (
    <div style={{
      background: C.card, borderRadius: '18px', padding: '16px',
      border: `1px solid ${C.border}`, width: '100%', marginBottom: '20px',
      fontFamily: 'inherit'
    }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'center' : 'stretch', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: C.amber, letterSpacing: '0.1em' }}>KINERJA PENJUALAN & ALUR KAS</span>
          <p style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>Ringkasan akrual penjualan (Invoice) & arus kas riil (Pembayaran)</p>
        </div>

        {/* Period Switcher */}
        <div style={{
          display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
          padding: '3px', border: `1px solid ${C.border}`, alignSelf: isDesktop ? 'auto' : 'flex-start'
        }}>
          {[['weekly', 'Minggu'], ['monthly', 'Bulan']].map(([key, label]) => (
            <Button
              key={key}
              onClick={() => setChartPeriod(key)}
              variant={chartPeriod === key ? 'default' : 'ghost'}
              size="sm"
              className="px-3 h-7 text-[10px] font-bold rounded-lg transition-all border-none"
              style={{
                background: chartPeriod === key ? C.accent : 'transparent',
                color: chartPeriod === key ? '#fff' : C.muted,
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '18px' }}>
        
        {/* Kolom Penjualan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em' }}>📊 PENJUALAN (AKRUAL)</span>
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr 1fr' : '1fr', gap: '10px' }}>
            <div style={{ ...kpiBoxStyle, borderLeft: '3.5px solid #10B981' }}>
              <span style={kpiLabelStyle}>Gross Profit</span>
              <span style={{ ...kpiValueStyle, color: '#10B981' }}>{formatIDR(totalGrossProfit)}</span>
            </div>
            <div style={{ ...kpiBoxStyle, borderLeft: '3.5px solid #EA580C' }}>
              <span style={kpiLabelStyle}>Net Profit</span>
              <span style={{ ...kpiValueStyle, color: '#EA580C' }}>{formatIDR(totalNetProfit)}</span>
            </div>
            <div style={{ ...kpiBoxStyle, borderLeft: '3.5px solid #EF4444' }}>
              <span style={kpiLabelStyle}>Belum Terealisasi (Piutang)</span>
              <span style={{ ...kpiValueStyle, color: '#EF4444' }}>{formatIDR(unrealizedProfitSnapshot)}</span>
            </div>
          </div>
        </div>

        {/* Kolom Arus Kas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em' }}>💸 ARUS KAS (RIIL)</span>
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr 1fr 1fr' : '1fr 1fr', gap: '10px' }}>
            <div style={{ ...kpiBoxStyle, borderLeft: '3.5px solid #10B981' }}>
              <span style={kpiLabelStyle}>Kas Masuk</span>
              <span style={{ ...kpiValueStyle, color: '#10B981' }}>{formatIDR(totalCashIn)}</span>
            </div>
            <div style={{ ...kpiBoxStyle, borderLeft: '3.5px solid #EF4444' }}>
              <span style={kpiLabelStyle}>Kas Keluar</span>
              <span style={{ ...kpiValueStyle, color: '#EF4444' }}>{formatIDR(totalCashOut)}</span>
              {(totalCashOutPurchases > 0 || totalCashOutExpenses > 0 || totalCashOutPayroll > 0) && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '5px', flexWrap: 'wrap', fontSize: '8px', color: '#94A3B8', fontFamily: "'Sora', 'Inter', sans-serif" }}>
                  {totalCashOutPurchases > 0 && <span style={{ background: 'rgba(255,255,255,0.03)', padding: '2px 4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>Stok {formatIDR(totalCashOutPurchases)}</span>}
                  {totalCashOutExpenses > 0 && <span style={{ background: 'rgba(255,255,255,0.03)', padding: '2px 4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>Ops {formatIDR(totalCashOutExpenses)}</span>}
                  {totalCashOutPayroll > 0 && <span style={{ background: 'rgba(255,255,255,0.03)', padding: '2px 4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>Gaji {formatIDR(totalCashOutPayroll)}</span>}
                </div>
              )}
            </div>
            <div style={{
              ...kpiBoxStyle,
              borderLeft: cashBalance >= 0 ? '3.5px solid #10B981' : '3.5px solid #EF4444',
              background: cashBalance >= 0 
                ? 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(255,255,255,0.005) 100%)' 
                : 'linear-gradient(135deg, rgba(239,68,68,0.05) 0%, rgba(255,255,255,0.005) 100%)',
            }}>
              <span style={{ ...kpiLabelStyle, color: cashBalance >= 0 ? '#10B981' : '#EF4444' }}>Saldo Kas</span>
              <span style={{ ...kpiValueStyle, color: cashBalance >= 0 ? '#10B981' : '#EF4444' }}>{formatIDR(cashBalance)}</span>
            </div>
            <div style={{
              ...kpiBoxStyle,
              borderLeft: '3.5px solid #EA580C',
              background: 'linear-gradient(135deg, rgba(234,88,12,0.05) 0%, rgba(255,255,255,0.005) 100%)',
            }}>
              <span style={{ ...kpiLabelStyle, color: '#EA580C' }}>Profit Direalisasi</span>
              <span style={{ ...kpiValueStyle, color: '#EA580C' }}>{formatIDR(realizedProfit)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
        <LegendDot color="#10B981" label="Gross Profit (Rev − COGS)" />
        <LegendDot color="#EA580C" label="Net Profit (setelah biaya ops)" />
      </div>

      {/* ── Chart Area ── */}
      <div style={{ width: '100%', height: isDesktop ? '200px' : '150px' }}>
        <ChartContainer config={salesChartConfig} style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(234,88,12,0.12)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke={C.text}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={16}
            />
            <YAxis
              stroke={C.text}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+'jt' : v >= 1000 ? (v/1000).toFixed(0)+'rb' : v}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(234,88,12,0.2)', strokeWidth: 1 }} />

            {/* Gross Profit — monotone curve, dashed line */}
            <Area
              type="monotone"
              dataKey="grossProfit"
              name="Gross Profit"
              stroke="var(--color-grossProfit)"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              fill="var(--color-grossProfit)"
              fillOpacity={0.15}
              isAnimationActive={false}
              activeDot={{ r: 4, fill: '#10B981', stroke: C.card, strokeWidth: 2 }}
            />

            {/* Net Profit — monotone curve, solid line */}
            <Area
              type="monotone"
              dataKey="netProfit"
              name="Net Profit"
              stroke="var(--color-netProfit)"
              strokeWidth={2.5}
              fill="var(--color-netProfit)"
              fillOpacity={0.25}
              isAnimationActive={false}
              activeDot={{ r: 5, fill: '#EA580C', stroke: C.card, strokeWidth: 2 }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  )
}

// ── Stock Trend Chart ────────────────────────────────────────────────────────
export function StockTrendChart({ products = [], sales = [], batches = [], suppliers = [], isDesktop = true }) {
  const [filter, setFilter] = useState('semua') // 'semua', 'kritis_menipis', 'overstock'

  // Calculate 30-day product sales velocity
  const productSalesQty = useMemo(() => {
    const now = new Date()
    const sales30Days = sales.filter(s => {
      if (s.is_deleted) return false
      const date = new Date(s.transaction_date || s.created_at)
      const diff = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24))
      return diff <= 30
    })

    const qtyMap = {}
    sales30Days.forEach(s => {
      const items = s.items || s.sembako_sale_items || []
      items.forEach(it => {
        const pId = it.product_id
        const qty = Number(it.quantity) || 0
        if (pId) {
          qtyMap[pId] = (qtyMap[pId] || 0) + qty
        }
      })
    })
    return qtyMap
  }, [sales])

  // Calculate health stats for each product
  const calculatedProducts = useMemo(() => {
    return products.map(p => {
      const pId = p.id
      const totalSold30d = productSalesQty[pId] || 0
      const ads = totalSold30d / 30
      const stock = p.current_stock || 0
      const modal = p.avg_buy_price || 0
      const sellPrice = p.sell_price || 0
      const modalTertahan = stock * modal
      const potensiOmzet = stock * sellPrice

      let doi = 999
      if (ads > 0) {
        doi = stock / ads
      } else if (stock === 0) {
        doi = 0
      }

      let status = 'aman'
      let statusLabel = 'Aman'
      let color = '#10B981' // Green

      if (stock === 0 && ads > 0) {
        status = 'kritis'
        statusLabel = 'Kritis'
        color = '#EF4444' // Red
      } else if (doi <= 2) {
        status = 'kritis'
        statusLabel = 'Kritis'
        color = '#EF4444' // Red
      } else if (doi <= 7) {
        status = 'menipis'
        statusLabel = 'Menipis'
        color = '#F59E0B' // Yellow/Orange
      } else if (doi > 30) {
        status = 'overstock'
        statusLabel = 'Overstock'
        color = '#06B6D4' // Teal/Cyan
      }

      return {
        ...p,
        totalSold30d,
        ads,
        doi,
        modalTertahan,
        potensiOmzet,
        status,
        statusLabel,
        color
      }
    })
  }, [products, productSalesQty])

  // Sort by status weight (Critical > Thin > Overstock > Safe), then by locked capital desc
  const sortedProducts = useMemo(() => {
    const statusWeight = {
      kritis: 4,
      menipis: 3,
      overstock: 2,
      aman: 1
    }

    return [...calculatedProducts].sort((a, b) => {
      const weightA = statusWeight[a.status] || 0
      const weightB = statusWeight[b.status] || 0
      if (weightA !== weightB) {
        return weightB - weightA
      }
      return b.modalTertahan - a.modalTertahan
    })
  }, [calculatedProducts])

  // Apply quick filter
  const filteredProducts = useMemo(() => {
    if (filter === 'semua') {
      return sortedProducts.slice(0, 7)
    }
    if (filter === 'kritis_menipis') {
      return sortedProducts.filter(p => p.status === 'kritis' || p.status === 'menipis').slice(0, 7)
    }
    if (filter === 'overstock') {
      return sortedProducts.filter(p => p.status === 'overstock').slice(0, 7)
    }
    return sortedProducts.slice(0, 7)
  }, [sortedProducts, filter])

  // Map to chart payload
  const stockChartData = useMemo(() => {
    return filteredProducts.map(p => {
      const rec = getSupplierRecommendation(p.id, batches, suppliers)
      return {
        name: p.product_name?.length > 12 ? p.product_name.slice(0, 10) + '..' : p.product_name,
        fullName: p.product_name,
        stok: p.current_stock || 0,
        ads: p.ads,
        doi: p.doi,
        statusLabel: p.statusLabel,
        color: p.color,
        modalTertahan: p.modalTertahan,
        potensiOmzet: p.potensiOmzet,
        id: p.id,
        unit: p.unit || 'unit',
        recSupplierName: rec?.supplierName || null,
        recStatusText: rec?.statusText || null,
        reorderQty: p.status === 'kritis' || p.status === 'menipis'
          ? Math.max(0, Math.ceil(p.ads * 30 - p.current_stock))
          : 0
      }
    })
  }, [filteredProducts, batches, suppliers])

  if (products.length === 0) return null

  const filterBtnSt = (active) => ({
    padding: '4px 10px',
    borderRadius: '7px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: 800,
    background: active ? C.accent : 'transparent',
    color: active ? '#fff' : C.muted,
    transition: 'all 0.15s',
  })

  const chartHeight = Math.min(isDesktop ? 300 : 240, Math.max(90, stockChartData.length * (isDesktop ? 44 : 38) + 15))

  return (
    <div style={{ background: C.card, borderRadius: '20px', padding: isDesktop ? '20px' : '16px', border: `1px solid ${C.border}`, marginBottom: '20px' }}>
      {/* Header & Filter Row */}
      <div style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', alignItems: isDesktop ? 'flex-start' : 'stretch', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: C.amber, letterSpacing: '0.1em' }}>INVENTORY HEALTH ASSISTANT</span>
          <p style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>Analisis tingkat risiko kehabisan stok & dana tertahan</p>
        </div>

        {/* Filter Switcher */}
        <div style={{
          display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
          padding: '3px', border: `1px solid ${C.border}`, alignSelf: isDesktop ? 'auto' : 'flex-start'
        }}>
          <Button
            onClick={() => setFilter('semua')}
            variant={filter === 'semua' ? 'default' : 'ghost'}
            size="sm"
            className="px-2.5 h-6 text-[10px] font-bold rounded-lg transition-all border-none"
            style={{
              background: filter === 'semua' ? C.accent : 'transparent',
              color: filter === 'semua' ? '#fff' : C.muted,
            }}
          >
            Semua
          </Button>
          <Button
            onClick={() => setFilter('kritis_menipis')}
            variant={filter === 'kritis_menipis' ? 'default' : 'ghost'}
            size="sm"
            className="px-2.5 h-6 text-[10px] font-bold rounded-lg transition-all border-none"
            style={{
              background: filter === 'kritis_menipis' ? C.accent : 'transparent',
              color: filter === 'kritis_menipis' ? '#fff' : C.muted,
            }}
          >
            Kritis/Menipis
          </Button>
          <Button
            onClick={() => setFilter('overstock')}
            variant={filter === 'overstock' ? 'default' : 'ghost'}
            size="sm"
            className="px-2.5 h-6 text-[10px] font-bold rounded-lg transition-all border-none"
            style={{
              background: filter === 'overstock' ? C.accent : 'transparent',
              color: filter === 'overstock' ? '#fff' : C.muted,
            }}
          >
            Overstock
          </Button>
        </div>
      </div>

      {/* Legend Row */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', justifyContent: 'flex-start' }}>
        <LegendDot color="#EF4444" label="Kritis (≤ 2 hari)" />
        <LegendDot color="#F59E0B" label="Menipis (≤ 7 hari)" />
        <LegendDot color="#10B981" label="Aman" />
        <LegendDot color="#06B6D4" label="Overstock (> 30 hari)" />
      </div>

      {stockChartData.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px', color: C.muted, fontSize: '12px', fontStyle: 'italic' }}>
          Tidak ada produk yang sesuai dengan filter ini.
        </div>
      ) : (
        <div style={{ width: '100%', height: `${chartHeight}px` }}>
          <ChartContainer config={chartConfig} style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}>
            <BarChart
              data={stockChartData}
              layout="vertical"
              margin={{ top: 5, right: 45, left: 0, bottom: 5 }}
            >
              <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.06)" />
              <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} hide />
              <XAxis dataKey="stok" type="number" hide />
              <Tooltip content={<StockChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="stok" radius={6} barSize={isDesktop ? 22 : 18} isAnimationActive={false}>
                {stockChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="name"
                  position="insideLeft"
                  offset={10}
                  style={{
                    fill: '#06090F', // Dark text color inside bright colored bars for maximum contrast
                    fontWeight: 900,
                    fontSize: '11px',
                    fontFamily: "'Sora', 'Inter', sans-serif"
                  }}
                />
                <LabelList
                  dataKey="stok"
                  position="right"
                  offset={8}
                  style={{
                    fill: C.text, // Warm light yellow text for high contrast on dark brown background
                    fontWeight: 900,
                    fontSize: '11px',
                    fontFamily: "'Sora', 'Inter', sans-serif"
                  }}
                  formatter={(val, entry) => {
                    const item = stockChartData.find(d => d.stok === val);
                    const unit = item?.unit || 'slop';
                    return `${val} ${unit}`;
                  }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </div>
  )
}
