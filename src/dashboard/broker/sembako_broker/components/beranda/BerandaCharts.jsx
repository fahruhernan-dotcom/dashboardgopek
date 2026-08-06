// ProfitChart.jsx + StockTrendChart.jsx — chart components
import React, { useMemo, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatIDR } from '@/lib/format'
import { C } from '../sembakoSaleUtils'
import { ChartTooltip, StockChartTooltip } from './BerandaUtils'
import { getSupplierRecommendation } from '@/lib/hooks/sembako/sembakoSupplierAssistant'

// ── Legend Dot ───────────────────────────────────────────────────────────────
function LegendDot({ color, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
      <span style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8' }}>{label}</span>
    </span>
  )
}

// ── Sales Performance Chart ──────────────────────────────────────────────────
export function SalesChart({ weeklyData, monthlyData, chartPeriod, setChartPeriod, isDesktop, unrealizedProfitSnapshot = 0 }) {
  const data = chartPeriod === 'weekly' ? weeklyData : monthlyData
  const totalGrossProfit = data.reduce((s, d) => s + (d.grossProfit || 0), 0)
  const totalNetProfit = data.reduce((s, d) => s + (d.netProfit || 0), 0)

  return (
    <div style={{
      background: C.card, borderRadius: '16px', padding: '16px',
      border: `1px solid ${C.border}`, width: '100%', marginBottom: '20px',
    }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div>
          <span style={{ fontSize: '10px', fontWeight: 800, color: C.muted, letterSpacing: '0.1em' }}>KINERJA PENJUALAN</span>
          <p style={{ fontSize: '9px', color: '#64748B', marginTop: '1px', fontWeight: 500 }}>Berdasarkan tanggal penjualan</p>
          {/* KPI figures */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '4px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 600, marginBottom: '1px' }}>Gross Profit</p>
              <p style={{ fontSize: '15px', fontWeight: 900, color: '#10B981', fontFamily: 'DM Sans', lineHeight: 1.1 }}>
                {formatIDR(totalGrossProfit)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 600, marginBottom: '1px' }}>Net Profit</p>
              <p style={{ fontSize: '15px', fontWeight: 900, color: '#EA580C', fontFamily: 'DM Sans', lineHeight: 1.1 }}>
                {formatIDR(totalNetProfit)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 600, marginBottom: '1px' }}>Belum Terrealisasi</p>
              <p style={{ fontSize: '15px', fontWeight: 900, color: '#EF4444', fontFamily: 'DM Sans', lineHeight: 1.1 }}>
                {formatIDR(unrealizedProfitSnapshot)}
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
        <LegendDot color="#EA580C" label="Net Profit (setelah biaya ops)" />
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
                <stop offset="5%"  stopColor="#EA580C" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#EA580C" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(234,88,12,0.12)" vertical={false} />
            <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} minTickGap={16} />
            <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false}
              tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+'jt' : v >= 1000 ? (v/1000).toFixed(0)+'rb' : v}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(234,88,12,0.2)', strokeWidth: 1 }} />

            {/* Gross Profit — dashed line */}
            <Area type="monotone" dataKey="grossProfit" name="Gross Profit"
              stroke="#10B981" strokeWidth={1.5} strokeDasharray="5 3"
              fillOpacity={1} fill="url(#grossGrad)"
              isAnimationActive={false}
              activeDot={{ r: 4, fill: '#10B981', stroke: C.card, strokeWidth: 2 }}
            />

            {/* Net Profit — solid line, emphasis */}
            <Area type="monotone" dataKey="netProfit" name="Net Profit"
              stroke="#EA580C" strokeWidth={2.5}
              fillOpacity={1} fill="url(#netGrad)"
              isAnimationActive={false}
              activeDot={{ r: 5, fill: '#EA580C', stroke: C.card, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Cash Summary Card ────────────────────────────────────────────────────────
export function CashSummaryCard({ cashSummary = {}, stats, isDesktop }) {
  const {
    totalCashIn = 0,
    totalCashOut = 0,
    totalCashOutPurchases = 0,
    totalCashOutExpenses = 0,
    totalCashOutPayroll = 0,
    cashBalance = 0,
    realizedProfit = 0,
  } = cashSummary

  const rowStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px',
  }
  const labelStyle = { fontSize: '11px', color: '#94A3B8', fontWeight: 600 }
  const valueStyle = { fontSize: '13px', fontWeight: 800, color: C.text, fontFamily: 'DM Sans' }

  return (
    <div style={{
      background: C.card, borderRadius: '16px', padding: '16px',
      border: `1px solid ${C.border}`, width: '100%', marginBottom: '20px',
    }}>
      <div style={{ marginBottom: '12px' }}>
        <span style={{ fontSize: '10px', fontWeight: 800, color: C.muted, letterSpacing: '0.1em' }}>RINGKASAN KAS</span>
        <p style={{ fontSize: '9px', color: '#64748B', marginTop: '1px', fontWeight: 500 }}>Berdasarkan tanggal pembayaran</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: '6px' }}>
        {/* Kas Masuk */}
        <div style={rowStyle}>
          <span style={labelStyle}>Kas Masuk</span>
          <span style={{ ...valueStyle, color: '#10B981' }}>{formatIDR(totalCashIn)}</span>
        </div>

        {/* Kas Keluar */}
        <div style={rowStyle}>
          <div>
            <span style={labelStyle}>Kas Keluar</span>
            {(totalCashOutPurchases > 0 || totalCashOutExpenses > 0 || totalCashOutPayroll > 0) && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                {totalCashOutPurchases > 0 && <span style={{ fontSize: '9px', color: '#64748B' }}>Stok {formatIDR(totalCashOutPurchases)}</span>}
                {totalCashOutExpenses > 0 && <span style={{ fontSize: '9px', color: '#64748B' }}>Ops {formatIDR(totalCashOutExpenses)}</span>}
                {totalCashOutPayroll > 0 && <span style={{ fontSize: '9px', color: '#64748B' }}>Gaji {formatIDR(totalCashOutPayroll)}</span>}
              </div>
            )}
          </div>
          <span style={{ ...valueStyle, color: '#EF4444' }}>{formatIDR(totalCashOut)}</span>
        </div>

        {/* Saldo Kas */}
        <div style={{
          ...rowStyle,
          background: cashBalance >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
          border: cashBalance >= 0 ? '1px solid rgba(16,185,129,0.15)' : '1px solid rgba(239,68,68,0.15)',
        }}>
          <span style={{ ...labelStyle, fontWeight: 700, color: cashBalance >= 0 ? '#10B981' : '#EF4444' }}>Saldo Kas</span>
          <span style={{ ...valueStyle, fontSize: '15px', fontWeight: 900, color: cashBalance >= 0 ? '#10B981' : '#EF4444' }}>
            {formatIDR(cashBalance)}
          </span>
        </div>

        {/* Profit Direalisasi */}
        <div style={{
          ...rowStyle,
          background: 'rgba(234,88,12,0.06)',
          border: '1px solid rgba(234,88,12,0.15)',
        }}>
          <div>
            <span style={{ ...labelStyle, fontWeight: 700, color: '#EA580C' }}>Profit Direalisasi</span>
            <p style={{ fontSize: '9px', color: '#64748B', marginTop: '1px' }}>Dari pembayaran diterima</p>
          </div>
          <span style={{ ...valueStyle, fontSize: '15px', fontWeight: 900, color: '#EA580C' }}>
            {formatIDR(realizedProfit)}
          </span>
        </div>
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
        color = '#3B82F6' // Blue
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
          <button onClick={() => setFilter('semua')} style={filterBtnSt(filter === 'semua')}>Semua</button>
          <button onClick={() => setFilter('kritis_menipis')} style={filterBtnSt(filter === 'kritis_menipis')}>Kritis/Menipis</button>
          <button onClick={() => setFilter('overstock')} style={filterBtnSt(filter === 'overstock')}>Overstock</button>
        </div>
      </div>

      {/* Legend Row */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', justifyContent: 'flex-start' }}>
        <LegendDot color="#EF4444" label="Kritis (≤ 2 hari)" />
        <LegendDot color="#F59E0B" label="Menipis (≤ 7 hari)" />
        <LegendDot color="#10B981" label="Aman" />
        <LegendDot color="#3B82F6" label="Overstock (> 30 hari)" />
      </div>

      {stockChartData.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px', color: C.muted, fontSize: '12px', fontStyle: 'italic' }}>
          Tidak ada produk yang sesuai dengan filter ini.
        </div>
      ) : (
        <div style={{ width: '100%', height: isDesktop ? '220px' : '180px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stockChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,158,11,0.12)" vertical={false} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<StockChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="stok" name="Stok Fisik" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                {stockChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
