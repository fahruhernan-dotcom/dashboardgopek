import React, { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Plus, ChevronDown, ChevronUp, X, Search, Package, ArrowRightLeft, History } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  useSembakoProducts,
  useSembakoSuppliers,
  useSembakoAllBatches,
  useSembakoStockOut,
  useAdjustBatchStock,
} from '@/lib/hooks/useSembakoData'
import { useSearchParams, useOutletContext } from 'react-router-dom'
import { DatePicker } from '@/components/ui/DatePicker'
import { C, fmtDate, CustomSelect, InputRupiah } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import { BrokerMobileHeader } from '@/dashboard/broker/_shared/components/BrokerMobileHeader'
import { SembakoErrorState } from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { SembakoTambahStokSheet } from './components/SembakoTambahStokSheet'

// ── Constants ─────────────────────────────────────────────────────────────────

const TEXT_SEC = '#A8764A'

const fmt = (n) => new Intl.NumberFormat('id-ID').format(Math.round(n || 0))




// ── Tab: Stok Saat Ini ────────────────────────────────────────────────────────

function StokSaatIni({ products, onTambah, onAdjust, onShowHistory }) {
  const [expanded, setExpanded] = useState(null)
  const [search,   setSearch]   = useState('')

  const { data: allBatches = [], isError: batchesIsError, error: batchesError, refetch: batchesRefetch } = useSembakoAllBatches()

  const filtered = useMemo(() => {
    if (!search) return products.filter(p => p.is_active && !p.is_deleted)
    return products.filter(p =>
      (p.is_active && !p.is_deleted) &&
      p.product_name.toLowerCase().includes(search.toLowerCase())
    )
  }, [products, search])

  const batchesForProduct = (productId) =>
    allBatches.filter(b => b.product_id === productId && b.qty_sisa > 0)

  if (batchesIsError) {
    return <SembakoErrorState error={batchesError} onRetry={batchesRefetch} />
  }

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={15} color="#6B7280" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          id="gudang-search" name="gudang_search" type="text"
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari produk..."
          style={{ ...inputSt, paddingLeft: 36 }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={14} color="#6B7280" />
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: `1px dashed ${C.border}` }}>
          <Package size={40} color="#4B5563" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontFamily: 'DM Sans', fontSize: 14, fontWeight: 600, color: TEXT_SEC }}>Belum ada produk aktif</p>
          <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#4B5563', marginTop: 6, opacity: 0.7 }}>
            Tambahkan produk terlebih dahulu di halaman Inventori & HPP
          </p>
        </div>
      )}

      {filtered.map(product => {
        const batches  = batchesForProduct(product.id)
        const isOpen   = expanded === product.id
        const isLow    = product.min_stock_alert > 0 && product.current_stock <= product.min_stock_alert

        return (
          <div key={product.id} style={{ marginBottom: 8, background: C.card, border: `1px solid ${isLow ? 'rgba(248,113,113,0.3)' : C.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : product.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', gap: 12 }}
            >
              <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontFamily: 'Sora', fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{product.product_name}</span>
                  {isLow && <span style={{ fontSize: 10, background: 'rgba(248,113,113,0.15)', color: '#F87171', padding: '1px 8px', borderRadius: 20, fontFamily: 'DM Sans', fontWeight: 600 }}>Menipis</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, color: isLow ? '#F87171' : C.accent, fontFamily: 'DM Sans', fontWeight: 600 }}>
                    {fmt(product.current_stock)} {product.unit}
                  </span>
                  <span style={{ fontSize: 13, color: '#6B7280', fontFamily: 'DM Sans' }}>
                    Jual: Rp {fmt(product.sell_price)}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'DM Sans' }}>{batches.length} batch</div>
                {isOpen ? <ChevronUp size={16} color="#6B7280" /> : <ChevronDown size={16} color="#6B7280" />}
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: '8px 14px 12px' }}>
                    {batches.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#6B7280', fontFamily: 'DM Sans', padding: '8px 0' }}>Tidak ada stok tersisa di batch manapun.</p>
                    ) : (
                      batches.map((batch, i) => (
                        <div key={batch.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < batches.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11, fontFamily: 'DM Sans', color: '#94A3B8' }}>{batch.batch_code || 'N/A'}</span>
                              {i === 0 && <span style={{ fontSize: 9, background: 'rgba(234,88,12,0.15)', color: C.accent, padding: '1px 6px', borderRadius: 10, fontWeight: 700, letterSpacing: '0.04em' }}>FIFO NEXT</span>}
                            </div>
                            <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'DM Sans', marginTop: 2 }}>
                              {fmtDate(batch.purchase_date)}
                              {batch.expiry_date && <span style={{ color: new Date(batch.expiry_date) < new Date() ? '#F87171' : '#6B7280' }}> · exp {fmtDate(batch.expiry_date)}</span>}
                            </div>
                            {batch.sembako_suppliers?.supplier_name && (
                              <div style={{ fontSize: 11, color: '#4B5563', fontFamily: 'DM Sans' }}>{batch.sembako_suppliers.supplier_name}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                             <div style={{ textAlign: 'right' }}>
                               <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: C.text }}>{fmt(batch.qty_sisa)} {product.unit}</div>
                               <div style={{ fontSize: 11, color: TEXT_SEC, fontFamily: 'DM Sans' }}>@ Rp {fmt(batch.buy_price)}</div>
                             </div>
                             <button
                               onClick={(e) => { e.stopPropagation(); onAdjust(batch, product) }}
                               className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-all"
                             >
                                <ArrowRightLeft size={14} />
                             </button>
                          </div>
                        </div>
                      ))
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => onTambah(product.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(234,88,12,0.08)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '7px 14px', color: C.accent, fontFamily: 'DM Sans', fontSize: 12, cursor: 'pointer' }}
                      >
                        <Plus size={14} /> Stok Masuk
                      </button>
                      <button
                        type="button"
                        onClick={() => onShowHistory(product)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '7px 14px', color: '#94A3B8', fontFamily: 'DM Sans', fontSize: 12, cursor: 'pointer' }}
                      >
                        <History size={14} /> Kartu Stok
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// ── Tab: Riwayat Masuk ────────────────────────────────────────────────────────

function RiwayatMasuk() {
  const { data: batches = [], isLoading, isError, error, refetch } = useSembakoAllBatches()

  if (isLoading) return <LoadingRow />
  if (isError) return <SembakoErrorState error={error} onRetry={refetch} />

  return (
    <div>
      {batches.length === 0 && (
        <EmptyState label="Belum ada riwayat stok masuk" />
      )}
      {batches.map(batch => (
        <div key={batch.id} style={{ marginBottom: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
            <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {batch.sembako_products?.product_name || '-'}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'DM Sans' }}>{batch.batch_code}</div>
            <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans', marginTop: 2 }}>
              {fmtDate(batch.purchase_date)}
              {batch.sembako_suppliers?.supplier_name && ` · ${batch.sembako_suppliers.supplier_name}`}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: C.accent }}>
              +{fmt(batch.qty_masuk)} {batch.sembako_products?.unit}
            </div>
            <div style={{ fontSize: 11, color: TEXT_SEC, fontFamily: 'DM Sans' }}>@ Rp {fmt(batch.buy_price)}</div>
            <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans' }}>
              Sisa: {fmt(batch.qty_sisa)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tab: Riwayat Keluar ───────────────────────────────────────────────────────

function RiwayatKeluar() {
  const { data: stockOuts = [], isLoading, isError, error, refetch } = useSembakoStockOut()

  if (isLoading) return <LoadingRow />
  if (isError) return <SembakoErrorState error={error} onRetry={refetch} />

  if (stockOuts.length === 0) return <EmptyState label="Belum ada riwayat stok keluar" sub="Stok berkurang otomatis saat penjualan dicatat" />

  return (
    <div>
      {stockOuts.map(s => (
        <div key={s.id} style={{ marginBottom: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
            <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.sembako_products?.product_name || '-'}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'DM Sans' }}>
              {s.sembako_stock_batches?.batch_code || '-'}
            </div>
            {s.sembako_sales?.invoice_number && (
              <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans' }}>{s.sembako_sales.invoice_number}</div>
            )}
            <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans' }}>{fmtDate(s.created_at)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: '#F87171' }}>
              -{fmt(s.qty_keluar)} {s.sembako_products?.unit}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SkeletonBox({ w = '100%', h = 16, r = 8, mb = 0, opacity = 1 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, rgba(234,88,12,0.07) 0%, rgba(234,88,12,0.13) 50%, rgba(234,88,12,0.07) 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      marginBottom: mb, opacity,
    }} />
  )
}

function LoadingRow() {
  return (
    <div>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      {[1,2,3].map(i => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px', marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <SkeletonBox w="55%" h={14} r={6} mb={8} />
              <SkeletonBox w="35%" h={12} r={6} />
            </div>
            <SkeletonBox w={48} h={12} r={6} />
          </div>
        </div>
      ))}
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 14px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <SkeletonBox w={`${45 + i * 8}%`} h={14} r={6} mb={8} />
              <SkeletonBox w="28%" h={12} r={6} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <SkeletonBox w={40} h={12} r={6} mb={6} />
              <SkeletonBox w={16} h={16} r={4} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ label, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <Package size={32} color="#4B5563" style={{ margin: '0 auto 12px' }} />
      <p style={{ fontFamily: 'Sora', fontSize: 14, color: TEXT_SEC, marginBottom: 4 }}>{label}</p>
      {sub && <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#4B5563' }}>{sub}</p>}
    </div>
  )
}

function Chip({ label, value, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, padding: '8px 14px', borderRadius: 12, flexShrink: 0 }}>
      <p style={{ fontSize: 10, color: '#6B7280', fontFamily: 'DM Sans', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: color, fontFamily: 'Sora' }}>{value}</p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

const TABS = ['Stok Saat Ini', 'Riwayat Masuk', 'Riwayat Keluar']

export default function Gudang() {
  const [searchParams] = useSearchParams()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setSidebarOpen = () => window.dispatchEvent(new Event('toggleMobileSidebar')) } = useOutletContext() || {}
  const preProductId   = searchParams.get('product') || null

  const { data: products  = [], isLoading: productsLoading, isError: productsIsError, error: productsError, refetch: productsRefetch } = useSembakoProducts()
  const { data: suppliers = [], isError: supErr, error: supError, refetch: supRefetch } = useSembakoSuppliers()

  const [activeTab,        setActiveTab]        = useState(0)
  const [showTambahSheet,  setShowTambahSheet]  = useState(!!preProductId || searchParams.get('action') === 'add-stock')
  const [tambahProductId,  setTambahProductId]  = useState(preProductId)

  React.useEffect(() => {
    if (searchParams.get('action') === 'add-stock') {
      setShowTambahSheet(true)
    }
  }, [searchParams])
  
  const [showAdjustSheet, setShowAdjustSheet] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  
  const [showHistorySheet, setShowHistorySheet] = useState(false)
  const [historyProduct, setHistoryProduct] = useState(null)

  const openTambah = (productId = null) => {
    setTambahProductId(productId)
    setShowTambahSheet(true)
  }

  const openAdjust = (batch, product) => {
    setSelectedBatch(batch)
    setSelectedProduct(product)
    setShowAdjustSheet(true)
  }

  const totalStokNilai = useMemo(() =>
    products.filter(p => p.is_active && !p.is_deleted)
      .reduce((s, p) => s + (p.current_stock * (p.avg_buy_price || 0)), 0),
    [products]
  )
  const lowStockCount = useMemo(() =>
    products.filter(p => p.is_active && !p.is_deleted && p.min_stock_alert > 0 && p.current_stock <= p.min_stock_alert).length,
    [products]
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 80 }}>
      {!isDesktop && <BrokerMobileHeader title="Gudang" onMenuClick={() => setSidebarOpen(true)} />}
      
      <div style={{ padding: '20px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: isDesktop ? 'block' : 'none' }}>
          <h1 style={{ fontFamily: 'Sora', fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>Gudang</h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: TEXT_SEC, marginTop: 2 }}>
            Stok · {products.filter(p => p.is_active && !p.is_deleted).length} produk
          </p>
        </div>
        <button
          onClick={() => openTambah()}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 6, background: C.accent, border: 'none', 
            borderRadius: 12, padding: '10px 16px', color: 'white', fontFamily: 'Sora', 
            fontSize: 14, fontWeight: 700, cursor: 'pointer', 
            boxShadow: '0 4px 12px rgba(234,88,12,0.35)',
            marginLeft: isDesktop ? 0 : 'auto'
          }}
        >
          <Plus size={16} /> Stok Masuk
        </button>
      </div>

      {/* Summary chips */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px 0', overflowX: 'auto' }}>
        <Chip label="Nilai Stok" value={`Rp ${totalStokNilai >= 1_000_000 ? (totalStokNilai / 1_000_000).toFixed(1) + 'jt' : new Intl.NumberFormat('id-ID').format(totalStokNilai)}`} color={C.accent} />
        <Chip label="Stok Menipis" value={`${lowStockCount} produk`} color={lowStockCount > 0 ? '#F87171' : '#021a02'} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '16px 16px 0', gap: 0, borderBottom: `1px solid ${C.border}`, marginTop: 8 }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              borderBottom: activeTab === i ? `2px solid ${C.accent}` : '2px solid transparent',
              padding: '10px 0', color: activeTab === i ? C.accent : TEXT_SEC,
              fontFamily: activeTab === i ? 'Sora' : 'DM Sans',
              fontSize: 13, fontWeight: activeTab === i ? 700 : 400,
              cursor: 'pointer', transition: 'color 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '14px 16px 0' }}>
        {activeTab === 0 && (
          productsLoading
            ? <ProductSkeleton />
            : productsIsError || supErr
              ? <SembakoErrorState error={productsError || supError} onRetry={() => { productsRefetch(); supRefetch(); }} />
              : <StokSaatIni
                  products={products}
                  onTambah={openTambah}
                  onAdjust={openAdjust}
                  onShowHistory={p => { setHistoryProduct(p); setShowHistorySheet(true) }}
                />
        )}
        {activeTab === 1 && <RiwayatMasuk />}
        {activeTab === 2 && <RiwayatKeluar />}
      </div>

      {/* Sheet Stok Masuk */}
      <AnimatePresence>
        {showTambahSheet && (
          <SembakoTambahStokSheet
            preselectedProductId={tambahProductId}
            products={products.filter(p => p.is_active && !p.is_deleted)}
            suppliers={suppliers}
            onClose={() => { setShowTambahSheet(false); setTambahProductId(null) }}
          />
        )}
      </AnimatePresence>

      {/* Sheet Adjust Stok (Owner Only) */}
      <AnimatePresence>
        {showAdjustSheet && (
          <AdjustStokSheet
            batch={selectedBatch}
            product={selectedProduct}
            onClose={() => { setShowAdjustSheet(false); setSelectedBatch(null); setSelectedProduct(null) }}
          />
        )}
      </AnimatePresence>

      {/* Sheet Kartu Stok (Unified Log) */}
      <AnimatePresence>
        {showHistorySheet && (
          <KartuStokSheet
            product={historyProduct}
            onClose={() => { setShowHistorySheet(false); setHistoryProduct(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function KartuStokSheet({ product, onClose }) {
  const { data: batches = [], isLoading: bLoad, isError: bErr, error: bError, refetch: bRefetch } = useSembakoAllBatches()
  const { data: stockOuts = [], isLoading: sLoad, isError: sErr, error: sError, refetch: sRefetch } = useSembakoStockOut()

  const isError = bErr || sErr
  const error = bError || sError
  const isLoading = bLoad || sLoad
  const refetch = () => { bRefetch(); sRefetch() }

  const movements = useMemo(() => {
    if (!product) return []
    
    const logs = []
    
    // 1. Stock In (Batches)
    batches.filter(b => b.product_id === product.id).forEach(b => {
      logs.push({
        id: `in-${b.id}`,
        date: b.purchase_date || b.created_at,
        type: 'IN',
        qty: b.qty_masuk,
        ref: b.batch_code,
        notes: b.sembako_suppliers?.supplier_name || 'Stok Masuk',
        color: 'text-emerald-500'
      })
    })
    
    // 2. Stock Out (Sales & Adjustments)
    stockOuts.filter(s => s.product_id === product.id).forEach(s => {
      logs.push({
        id: `out-${s.id}`,
        date: s.created_at,
        type: s.reason === 'adjustment' ? 'ADJ' : 'OUT',
        qty: -s.qty_keluar,
        ref: s.sembako_sales?.invoice_number || s.sembako_stock_batches?.batch_code,
        notes: s.notes || (s.reason === 'adjustment' ? 'Penyesuaian' : 'Penjualan'),
        color: s.reason === 'adjustment' ? 'text-orange-500' : 'text-red-500'
      })
    })

    return logs.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [product, batches, stockOuts])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        style={{ background: '#0A0F14', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '540px', padding: '0 0 32px', borderTop: `1px solid ${C.border}`, height: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
           <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '0 auto' }} />
        </div>
        
        <div style={{ padding: '4px 20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <div className="flex items-center gap-3">
              <div>
                <h2 className="font-display font-black text-white uppercase text-lg leading-none">Kartu Stok</h2>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-1">{product?.product_name}</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 rounded-lg bg-white/5 text-[#4B6478]">
              <X size={20} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-20">
           {isError ? (
             <div className="py-10"><SembakoErrorState error={error} onRetry={refetch} /></div>
           ) : isLoading ? (
             <p className="text-center py-20 text-[#4B6478] font-bold text-xs uppercase">Memuat data...</p>
           ) : movements.length === 0 ? (
             <p className="text-center py-20 text-[#4B6478] font-bold text-xs uppercase">Belum ada riwayat pergerakan</p>
           ) : (
             movements.map(m => (
               <div key={m.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full bg-white/10 uppercase tracking-widest", m.color)}>
                         {m.type}
                       </span>
                       <span className="text-[10px] font-bold text-[#4B6478] uppercase">{fmtDate(m.date)}</span>
                    </div>
                    <p className="text-sm font-black text-white leading-tight uppercase">{m.ref}</p>
                    <p className="text-[11px] font-bold text-[#4B6478] uppercase truncate max-w-[200px]">{m.notes}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-display text-lg font-black tabular-nums", m.color)}>
                       {m.qty > 0 ? '+' : ''}{m.qty}
                    </p>
                    <p className="text-[10px] font-black text-[#4B6478] uppercase">{product?.unit}</p>
                  </div>
               </div>
             ))
           )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function AdjustStokSheet({ batch, product, onClose }) {
  const adjustMut = useAdjustBatchStock()
  const [qtyChange, setQtyChange] = useState('')
  const [reason, setReason] = useState('broken') // 'broken' | 'lost' | 'found' | 'other'
  const [notes, setNotes] = useState('')

  const handleAdjust = async (e) => {
    e.preventDefault()
    const change = Number(qtyChange)
    if (isNaN(change) || change === 0) return toast.error('Jumlah perubahan tidak boleh 0')
    
    // Logic: If 'broken' or 'lost', we expect a negative number or we auto-negate it
    const finalChange = (reason === 'broken' || reason === 'lost') ? -Math.abs(change) : change

    await adjustMut.mutateAsync({
      batch_id: batch.id,
      qty_change: finalChange,
      reason,
      notes
    })
    onClose()
  }

  const isLoading = adjustMut.isPending

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        style={{ background: '#100A03', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '540px', padding: '0 0 32px', borderTop: `2px solid ${C.accent}`, maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
           <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '0 auto' }} />
        </div>
        
        <div style={{ padding: '4px 20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <ArrowRightLeft size={20} />
              </div>
              <div>
                <h2 className="font-display font-black text-white uppercase text-lg leading-none">Otoritas Penyesuaian</h2>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-1">Hanya untuk Owner</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 rounded-lg bg-white/5 text-[#4B6478] hover:bg-white/10">
              <X size={20} />
           </button>
        </div>

        <form onSubmit={handleAdjust} style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
           <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
              <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">{product.product_name}</p>
              <p className="text-sm font-black text-white uppercase tracking-tight">Batch: {batch.batch_code}</p>
              <p className="text-xs font-bold text-orange-400">Stok Digital Saat Ini: {batch.qty_sisa} {product.unit}</p>
           </div>

           <SField label="Aksi">
              <div className="grid grid-cols-2 gap-2">
                 {[
                   { id: 'broken', label: 'RUSAK (-)', color: 'text-red-400', bg: 'bg-red-500/10' },
                   { id: 'lost', label: 'HILANG (-)', color: 'text-red-400', bg: 'bg-red-500/10' },
                   { id: 'found', label: 'TEMUAN (+)', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                   { id: 'other', label: 'LAINNYA', color: 'text-blue-400', bg: 'bg-blue-500/10' }
                 ].map(opt => (
                   <button
                     key={opt.id} type="button"
                     onClick={() => setReason(opt.id)}
                     className={cn(
                       "h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                       reason === opt.id ? "border-orange-500 bg-orange-500/20 text-white shadow-lg" : "border-white/5 bg-white/5 text-[#4B6478]"
                     )}
                   >
                     {opt.label}
                   </button>
                 ))}
              </div>
           </SField>

           <SField label={`Jumlah Fisik yang di-Adjust (${product.unit})`}>
              <input
                type="number" step="0.01"
                value={qtyChange}
                onChange={e => setQtyChange(e.target.value)}
                placeholder="0"
                style={inputSt}
                autoFocus
              />
           </SField>

           <SField label="Keterangan / Alasan">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Contoh: Pecah saat pemindahan atau salah hitung awal"
                style={{ ...inputSt, minHeight: 80, fontSize: 13, padding: 12 }}
              />
           </SField>

           <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !qtyChange}
                className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-950/40 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? 'MEMPROSES...' : 'SIMPAN PENYESUAIAN'}
              </button>
           </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

