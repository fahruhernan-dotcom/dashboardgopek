import React, { useState, useMemo, useEffect } from 'react'
import { Plus, Search, X, ChevronDown, ToggleLeft, ToggleRight, Trash2, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useSembakoProducts,
  useCreateSembakoProduct,
  useUpdateSembakoProduct,
  useSoftDeleteSembakoProduct,
} from '@/lib/hooks/useSembakoData'
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom'
import { C } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import { BrokerMobileHeader } from '@/dashboard/broker/_shared/components/BrokerMobileHeader'
import { SembakoErrorState } from '@/dashboard/broker/sembako_broker/components/SembakoUiPrimitives'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

// ── Constants ─────────────────────────────────────────────────────────────────

const TEXT_SEC = '#94A3B8'

const CATEGORIES = [
  'SKM (Sigaret Kretek Mesin)',
  'SKT (Sigaret Kretek Tangan)',
  'SPM (Sigaret Putih Mesin)',
  'Filter Premium',
  'Kretek Bold',
  'Menthol & Flavor',
  'Cerutu & Lainnya',
]

const UNITS = ['slop', 'pres', 'bal', 'karton', 'pack', 'bungkus', 'pcs', 'dus']

const fmt = (n) => new Intl.NumberFormat('id-ID').format(Math.round(n || 0))

// ── Stock bar helpers ─────────────────────────────────────────────────────────

function stockPercent(product) {
  const { current_stock, min_stock_alert } = product
  if (!min_stock_alert || min_stock_alert <= 0) return null
  return Math.min(100, Math.round((current_stock / (min_stock_alert * 3)) * 100))
}

function stockColor(pct) {
  if (pct === null) return '#4B5563'
  if (pct > 50) return '#021a02'
  if (pct > 20) return '#FBBF24'
  return '#F87171'
}

function stockLabel(product) {
  const { current_stock, min_stock_alert, unit } = product
  if (!min_stock_alert || current_stock > min_stock_alert) return null
  return `Stok menipis: ${current_stock} ${unit}`
}

// ── Margin badge ──────────────────────────────────────────────────────────────

function marginInfo(product) {
  const { sell_price, avg_buy_price } = product
  if (!sell_price || !avg_buy_price || avg_buy_price === 0) return null
  const margin = ((sell_price - avg_buy_price) / sell_price) * 100
  return { pct: margin.toFixed(1), color: margin > 15 ? '#021a02' : margin > 5 ? '#FBBF24' : '#F87171' }
}

// ── Sheet overlay ─────────────────────────────────────────────────────────────

function ProductSheet({ product, onClose }) {
  const isEdit = !!product?.id
  const createMut = useCreateSembakoProduct()
  const updateMut = useUpdateSembakoProduct()

  const [form, setForm] = useState({
    product_name: product?.product_name || '',
    category: product?.category || 'SKM (Sigaret Kretek Mesin)',
    unit: product?.unit || 'slop',
    sell_price: product?.sell_price || '',
    avg_buy_price: product?.avg_buy_price || '',
    current_stock: product?.current_stock || 0,
    min_stock_alert: product?.min_stock_alert || '',
    notes: product?.notes || '',
    is_active: product?.is_active ?? true,
    secondary_unit: product?.secondary_unit || '',
    conversion_rate: product?.conversion_rate || '',
  })
  const [catOpen, setCatOpen] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.product_name.trim()) return toast.error('Nama produk wajib diisi')
    const payload = {
      ...form,
      sell_price: form.sell_price ? Number(String(form.sell_price).replace(/\D/g, '')) : null,
      avg_buy_price: form.avg_buy_price ? Number(String(form.avg_buy_price).replace(/\D/g, '')) : null,
      min_stock_alert: form.min_stock_alert ? Number(String(form.min_stock_alert).replace(/\D/g, '')) : null,
      conversion_rate: form.conversion_rate ? Number(form.conversion_rate) : null,
    }
    if (isEdit) {
      await updateMut.mutateAsync({ id: product.id, ...payload })
    } else {
      await createMut.mutateAsync(payload)
    }
    onClose()
  }

  const isLoading = createMut.isPending || updateMut.isPending

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{
          background: '#0E1420',
          borderRadius: '24px 24px 0 0',
          width: '100%',
          maxWidth: '560px',
          padding: '0 0 32px',
          borderTop: '2px solid #EA580C',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(234,88,12,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(234,88,12,0.3)' }}>
              <Package size={18} color="#EA580C" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'Sora', fontSize: 16, fontWeight: 800, color: '#F3F4F6', margin: 0 }}>
                {isEdit ? 'Edit Produk Rokok' : 'Tambah Produk Rokok Baru'}
              </h2>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>Katalog Distributor Gopek</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#94A3B8" />
          </button>
        </div>

        {/* FIFO Info Banner */}
        <div style={{ margin: '14px 20px 0', background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.2)', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          <p style={{ fontSize: 11, color: '#FB923C', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
            <strong style={{ color: '#FFF' }}>Metode Stok FIFO (First-In, First-Out)</strong>: Stok tertua dipotong otomatis saat penjualan untuk perhitungan HPP & margin yang akurat.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Nama produk */}
          <Field label="Nama Produk Rokok *">
            <input
              id="product-name" name="product_name" type="text"
              value={form.product_name}
              onChange={e => set('product_name', e.target.value)}
              placeholder="contoh: Sampoerna Mild 16 (Slop / Dus)"
              style={inputStyle}
            />
          </Field>

          {/* Kategori — autocomplete dropdown */}
          <Field label="Kategori Produk">
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <input
                  id="product-category" name="category" type="text"
                  value={form.category}
                  onChange={e => { set('category', e.target.value); setCatOpen(true) }}
                  onFocus={() => setCatOpen(true)}
                  onBlur={() => setTimeout(() => setCatOpen(false), 200)}
                  placeholder="Pilih atau ketik kategori"
                  style={{ ...inputStyle, paddingRight: 36 }}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setCatOpen(!catOpen)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
                >
                  <ChevronDown size={16} color={TEXT_SEC} style={{ transform: catOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              </div>

              <AnimatePresence>
                {catOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                      background: '#161D2B', border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 12,
                      marginTop: 6, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                      maxHeight: '180px', overflowY: 'auto'
                    }}
                  >
                    {CATEGORIES
                      .filter(c => !form.category || c.toLowerCase().includes(form.category.toLowerCase()))
                      .map(c => (
                        <button
                          key={c} type="button"
                          onMouseDown={() => { set('category', c); setCatOpen(false) }}
                          style={{
                            display: 'block', width: '100%', padding: '12px 14px', border: 'none',
                            background: form.category === c ? 'rgba(234,88,12,0.15)' : 'transparent',
                            color: form.category === c ? '#EA580C' : '#F3F4F6',
                            fontSize: 13, fontFamily: 'DM Sans', fontWeight: form.category === c ? 700 : 500, textAlign: 'left', cursor: 'pointer',
                            transition: 'background 0.2s',
                            borderBottom: `1px solid rgba(255,255,255,0.03)`
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    {form.category && !CATEGORIES.find(c => c.toLowerCase() === form.category.toLowerCase()) && (
                      <div style={{ padding: '12px 14px', fontSize: 13, color: TEXT_SEC, fontStyle: 'italic', background: 'rgba(234,88,12,0.03)' }}>
                        Kategori baru: "{form.category}"
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Field>

          {/* Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Satuan Utama (Retail)">
              <CustomSelect
                id="product-unit"
                value={form.unit}
                onChange={val => set('unit', val)}
                options={UNITS.map(u => ({ value: u, label: u }))}
                placeholder="Pilih"
              />
            </Field>
            <Field label="Satuan Grosir (Karton/Dus)">
              <CustomSelect
                id="product-sec-unit"
                value={form.secondary_unit}
                onChange={val => set('secondary_unit', val)}
                options={['', ...UNITS].map(u => ({ value: u, label: u || 'Tidak ada' }))}
                placeholder="Tanpa Grosir"
              />
            </Field>
          </div>

          {/* Conversion Rate */}
          {form.secondary_unit && (
            <Field label={`Konversi: Isi per ${form.secondary_unit} (${form.unit})`}>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={form.conversion_rate}
                  onChange={e => set('conversion_rate', e.target.value)}
                  placeholder="Contoh: 20 (1 Karton = 20 Slop)"
                  style={{ ...inputStyle, paddingLeft: 44 }}
                />
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C.accent, fontWeight: 800 }}>1x</span>
              </div>
              <p style={{ fontSize: 10, color: TEXT_SEC, marginTop: 4, fontStyle: 'italic' }}>
                * Saat jual "{form.secondary_unit}", stok terpotong otomatis sebanyak {form.conversion_rate || '...'} "{form.unit}".
              </p>
            </Field>
          )}

          {/* Harga jual + beli dengan Rp Prefix */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Harga Jual per Satuan">
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: '#EA580C' }}>Rp</span>
                <input
                  id="sell-price" name="sell_price" type="text" inputMode="numeric"
                  value={form.sell_price ? fmt(form.sell_price) : ''}
                  onChange={e => set('sell_price', e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  style={{ ...inputStyle, paddingLeft: 36 }}
                />
              </div>
            </Field>
            <Field label="Harga Beli / HPP (Avg)">
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: '#94A3B8' }}>Rp</span>
                <input
                  id="buy-price" name="avg_buy_price" type="text" inputMode="numeric"
                  value={form.avg_buy_price ? fmt(form.avg_buy_price) : ''}
                  onChange={e => set('avg_buy_price', e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  style={{ ...inputStyle, paddingLeft: 36 }}
                />
              </div>
            </Field>
          </div>

          {/* Stok alert */}
          <Field label="Alert Stok Minimum">
            <input
              id="min-stock" name="min_stock_alert" type="text" inputMode="numeric"
              value={form.min_stock_alert || ''}
              onChange={e => set('min_stock_alert', e.target.value.replace(/\D/g, ''))}
              placeholder="contoh: 10 (Peringatan saat stok menipis)"
              style={inputStyle}
            />
          </Field>

          {/* Keterangan */}
          <Field label="Keterangan Tambahan">
            <textarea
              id="product-notes" name="notes"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Contoh: Pita cukai 2026, kemasan 16 batang"
              rows={2}
              style={{ ...inputStyle, resize: 'none', lineHeight: '1.5' }}
            />
          </Field>

          {/* Toggle aktif */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <label htmlFor="product-active" style={{ fontFamily: 'DM Sans', fontSize: 14, color: TEXT_SEC, cursor: 'pointer' }}>
              Produk Aktif
            </label>
            <button
              id="product-active" type="button"
              onClick={() => set('is_active', !form.is_active)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: form.is_active ? C.accent : '#4B5563', display: 'flex' }}
            >
              {form.is_active
                ? <ToggleRight size={32} color={C.accent} />
                : <ToggleLeft size={32} color="#4B5563" />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !form.product_name.trim()}
            style={{
              marginTop: 4,
              width: '100%',
              height: 50,
              background: form.product_name.trim() && !isLoading ? C.accent : 'rgba(234,88,12,0.3)',
              border: 'none', borderRadius: 14,
              color: 'white', fontFamily: 'Sora', fontSize: 15, fontWeight: 700,
              cursor: form.product_name.trim() && !isLoading ? 'pointer' : 'not-allowed',
              boxShadow: form.product_name.trim() ? '0 4px 16px rgba(234,88,12,0.3)' : 'none',
            }}
          >
            {isLoading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ── UI Helpers ───────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontFamily: 'DM Sans', color: TEXT_SEC, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function CustomSelect({ value, onChange, options, placeholder, id }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        id={id}
        onClick={() => setOpen(!open)}
        style={{
          ...inputStyle,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: open ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
          transition: 'all 0.2s'
        }}
      >
        <span style={{ color: value ? C.text : TEXT_SEC, fontSize: '14px' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} color={TEXT_SEC} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'transparent' }}
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
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {options.map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    style={{
                      padding: '12px 16px', fontSize: '14px', color: value === opt.value ? C.accent : C.text,
                      background: value === opt.value ? 'rgba(234,88,12,0.1)' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      borderBottom: `1px solid rgba(255,255,255,0.03)`
                    }}
                  >
                    <span>{opt.label}</span>
                    {value === opt.value && <span style={{ fontSize: '10px' }}>✓</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}


const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: '10px 14px',
  color: C.text,
  fontSize: 14,
  fontFamily: 'DM Sans',
  outline: 'none',
  boxSizing: 'border-box',
  appearance: 'none',
  WebkitAppearance: 'none',
  colorScheme: 'dark',
}


// ── Product card ──────────────────────────────────────────────────────────────

function ProductCard({ product, onEdit, onDelete }) {
  const pct = stockPercent(product)
  const sColor = stockColor(pct)
  const margin = marginInfo(product)
  const warning = stockLabel(product)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: '14px 14px 12px',
        cursor: 'pointer',
        position: 'relative',
        opacity: product.is_active ? 1 : 0.5,
      }}
      onClick={() => onEdit(product)}
      whileTap={{ scale: 0.98 }}
    >
      {/* Badge kategori */}
      {product.category && (
        <span style={{ fontSize: 10, fontFamily: 'DM Sans', fontWeight: 600, color: C.accent, background: 'rgba(234,88,12,0.12)', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.03em' }}>
          {product.category}
        </span>
      )}

      {/* Nama produk */}
      <p style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 14, color: C.text, margin: '8px 0 4px', lineHeight: 1.3, wordBreak: 'break-word' }}>
        {product.product_name}
      </p>

      {/* Harga jual */}
      <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: C.accent, fontWeight: 600, margin: '0 0 10px' }}>
        Rp {fmt(product.sell_price)} / {product.unit}
      </p>

      {/* Margin badge */}
      {margin && (
        <span style={{ fontSize: 11, fontWeight: 600, color: margin.color, background: `${margin.color}18`, padding: '2px 8px', borderRadius: 20, marginBottom: 8, display: 'inline-block' }}>
          Margin {margin.pct}%
        </span>
      )}

      {/* Stock bar */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans' }}>Stok</span>
          <span style={{ fontSize: 11, color: sColor, fontFamily: 'DM Sans', fontWeight: 600 }}>
            {fmt(product.current_stock)} {product.unit}
          </span>
        </div>
        {pct !== null && (
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: sColor, borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
        )}
      </div>

      {/* Warning */}
      {warning && (
        <p style={{ fontSize: 11, color: '#F87171', marginTop: 6, fontFamily: 'DM Sans' }}>
          ⚠ {warning}
        </p>
      )}

      {/* Delete button — top right */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(product) }}
        style={{ position: 'absolute', top: 12, right: 12, background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, opacity: 0.5 }}
      >
        <Trash2 size={14} color="#F87171" />
      </button>
    </motion.div>
  )
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px' }}>
      <p style={{ fontSize: 11, color: TEXT_SEC, fontFamily: 'DM Sans', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Sora', color: color || C.text, margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#6B7280', fontFamily: 'DM Sans', marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Produk() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { setSidebarOpen = () => window.dispatchEvent(new Event('toggleMobileSidebar')) } = useOutletContext() || {}
  const location = useLocation()
  const navigate = useNavigate()
  const { data: products = [], isLoading, isError, error, refetch } = useSembakoProducts()
  const deleteMut = useSoftDeleteSembakoProduct()

  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('Semua')
  const [sheet, setSheet] = useState(null) // null | 'new' | product object
  const [showInactive, setShowInactive] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('action') === 'new') {
      setSheet('new')
      navigate(location.pathname, { replace: true })
    }
  }, [location.search, location.pathname, navigate])

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))]
    return ['Semua', ...cats]
  }, [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (!showInactive && !p.is_active) return false
      if (catFilter !== 'Semua' && p.category !== catFilter) return false
      if (search && !p.product_name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [products, search, catFilter, showInactive])

  const stats = useMemo(() => {
    const active = products.filter(p => p.is_active && !p.is_deleted)
    const lowStock = active.filter(p => p.min_stock_alert > 0 && p.current_stock <= p.min_stock_alert)
    const nilaiStok = active.reduce((s, p) => s + (p.current_stock * (p.avg_buy_price || 0)), 0)
    return { total: active.length, lowStock: lowStock.length, nilaiStok }
  }, [products])

  const handleDelete = (product) => {
    setProductToDelete(product)
  }

  const confirmDeleteProduct = () => {
    if (!productToDelete) return
    deleteMut.mutate(productToDelete.id)
    setProductToDelete(null)
  }

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: TEXT_SEC, fontFamily: 'DM Sans' }}>Memuat produk...</p>
    </div>
  )

  if (isError) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <SembakoErrorState error={error} onRetry={refetch} />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 80 }}>
      {/* Header */}
      {!isDesktop && <BrokerMobileHeader title="Produk" onMenuClick={() => setSidebarOpen(true)} />}

      <div style={{ padding: '20px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: isDesktop ? 'block' : 'none' }}>
          <h1 style={{ fontFamily: 'Sora', fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>Manajemen Produk</h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: TEXT_SEC, marginTop: 2 }}>{stats.total} produk aktif</p>
        </div>
        <button
          onClick={() => setSheet('new')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: C.accent, border: 'none',
            borderRadius: 12, padding: '10px 16px', color: 'white', fontFamily: 'Sora',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(234,88,12,0.35)',
            marginLeft: isDesktop ? 0 : 'auto'
          }}
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '16px 16px 0' }}>
        <StatCard label="Total Produk" value={stats.total} color={C.text} />
        <StatCard label="Stok Menipis" value={stats.lowStock} color={stats.lowStock > 0 ? '#F87171' : '#021a02'} sub={stats.lowStock > 0 ? 'perlu restock' : 'aman'} />
        <StatCard label="Nilai Stok" value={`Rp ${stats.nilaiStok >= 1_000_000 ? (stats.nilaiStok / 1_000_000).toFixed(1) + 'jt' : fmt(stats.nilaiStok)}`} color={C.accent} />
      </div>

      {/* Search + filter */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={15} color="#6B7280" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            id="product-search" name="search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari produk..."
            style={{ ...inputStyle, paddingLeft: 36, background: C.card }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={14} color="#6B7280" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              style={{
                flexShrink: 0, background: catFilter === cat ? 'rgba(234,88,12,0.15)' : C.card,
                border: `1px solid ${catFilter === cat ? 'rgba(234,88,12,0.5)' : C.border}`,
                borderRadius: 20, padding: '6px 14px',
                color: catFilter === cat ? C.accent : TEXT_SEC,
                fontSize: 12, fontFamily: 'DM Sans', fontWeight: catFilter === cat ? 700 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle non-aktif */}
      <div style={{ padding: '10px 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setShowInactive(v => !v)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: showInactive ? C.accent : '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {showInactive ? <ToggleRight size={20} color={C.accent} /> : <ToggleLeft size={20} color="#6B7280" />}
          <span style={{ fontFamily: 'DM Sans', fontSize: 12 }}>Tampilkan non-aktif</span>
        </button>
      </div>

      {/* Product grid */}
      <div style={{ padding: '14px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0' }}>
              <Package size={40} color="#4B5563" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontFamily: 'Sora', fontSize: 16, color: TEXT_SEC, marginBottom: 8 }}>
                {search ? 'Produk tidak ditemukan' : 'Belum ada produk'}
              </p>
              <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#4B5563', marginBottom: search ? 0 : 16 }}>
                {search ? 'Coba kata kunci lain' : 'Mulai dengan menambahkan produk yang Anda jual'}
              </p>
              {!search && (
                <button
                  onClick={() => setSheet('new')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 22px', borderRadius: 12,
                    background: C.accent, color: '#fff',
                    fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans',
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(234,88,12,0.3)',
                  }}
                >
                  <Plus size={15} /> Tambah Produk Pertama
                </button>
              )}
            </div>
          ) : (
            filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={setSheet}
                onDelete={handleDelete}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Sheet */}
      <AnimatePresence>
        {sheet && (
          <ProductSheet
            product={sheet === 'new' ? null : sheet}
            onClose={() => setSheet(null)}
          />
        )}
      </AnimatePresence>

      <AlertDialog open={!!productToDelete} onOpenChange={(v) => !v && setProductToDelete(null)}>
        <AlertDialogContent className="bg-[#0C1319] border border-white/10 rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 font-black text-base uppercase tracking-wide">
              Hapus Produk?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#4B6478] text-sm font-medium">
              Hapus "{productToDelete?.product_name}"? Data tidak bisa dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2">
            <AlertDialogCancel className="flex-1 h-11 bg-white/5 border-white/10 text-white font-black uppercase text-xs tracking-wider hover:bg-white/10">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white font-black uppercase text-xs tracking-wider border-none"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
