import React, { useState } from 'react'
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  useAddStockBatch, 
  useCreateSembakoSupplier, 
  useUpdateSembakoProduct,
  useCreateSembakoProduct,
  useSembakoAllBatches
} from '@/lib/hooks/useSembakoData'
import { DatePicker } from '@/components/ui/DatePicker'
import { C, CustomSelect, InputRupiah } from './sembakoSaleUtils'

const TEXT_SEC = '#A8764A'

const fmt = (n) => new Intl.NumberFormat('id-ID').format(Math.round(n || 0))

function genBatchCode() {
  const now = new Date()
  const d = now.toISOString().slice(0, 10).replace(/-/g, '')
  // Tambah ms-timestamp untuk entropy — eliminasi birthday paradox (ATTACK-04)
  const ms  = now.getTime().toString(36).slice(-3).toUpperCase()
  const r   = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `BATCH-${d}-${ms}${r}`
}

const inputSt = {
  width: '100%',
  height: 48,
  background: '#231A0E',
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: '0 14px',
  color: C.text,
  fontFamily: 'DM Sans',
  fontSize: 14,
  fontWeight: 600,
  outline: 'none',
}

const SField = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontFamily: 'DM Sans', fontSize: 10, fontWeight: 900, color: '#92400E', textTransform: 'uppercase', tracking: '0.1em' }}>{label}</label>
    {children}
  </div>
)

export function SembakoTambahStokSheet({ preselectedProductId, products = [], suppliers = [], onClose }) {
  const addBatch  = useAddStockBatch()
  const createSup = useCreateSembakoSupplier()
  const createProd = useCreateSembakoProduct()
  const { data: allBatches = [] } = useSembakoAllBatches()

  const [form, setForm] = useState({
    product_id:    preselectedProductId || '',
    supplier_id:   '',
    qty_masuk:     '',
    buy_price:     '',
    sell_price:    '',
    purchase_date: new Date().toISOString().slice(0, 10),
    expiry_date:   '',
    notes:         '',
    batch_code:    genBatchCode(),
  })
  const [newSupplier, setNewSupplier] = useState('')
  const [showAddSup,  setShowAddSup]  = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showAddProd, setShowAddProd] = useState(false)
  const [newProdName, setNewProdName] = useState('')
  const [newProdUnit, setNewProdUnit] = useState('kg')
  const updateProduct = useUpdateSembakoProduct()

  const handleAddProduct = async () => {
    if (!newProdName.trim()) return toast.error('Nama produk wajib diisi')
    try {
      const p = await createProd.mutateAsync({
        product_name: newProdName.trim(),
        category: 'lainnya',
        unit: newProdUnit,
        current_stock: 0,
        avg_buy_price: 0,
        sell_price: 0,
        is_active: true,
      })
      if (p?.id) set('product_id', p.id)
      setNewProdName('')
      setShowAddProd(false)
      toast.success('Produk berhasil ditambahkan!')
    } catch { /* handled by hook */ }
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const selectedProduct = products.find(p => p.id === form.product_id)

  const handleAddSupplier = async () => {
    if (!newSupplier.trim()) return
    try {
      const sup = await createSup.mutateAsync({ supplier_name: newSupplier.trim() })
      set('supplier_id', sup.id)
      setNewSupplier('')
      setShowAddSup(false)
    } catch { /* ignore */ }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.product_id) return toast.error('Pilih produk terlebih dahulu')
    if (!form.qty_masuk || Number(form.qty_masuk) <= 0) return toast.error('Jumlah harus > 0')
    
    const finalBuyPrice = Number(String(form.buy_price).replace(/\D/g, ''))
    const finalSellPrice = Number(String(form.sell_price).replace(/\D/g, ''))
    
    if (finalBuyPrice <= 0) return toast.error('Harga beli wajib diisi')

    await addBatch.mutateAsync({
      product_id:    form.product_id,
      supplier_id:   form.supplier_id || null,
      qty_masuk:     Number(form.qty_masuk),
      buy_price:     finalBuyPrice,
      purchase_date: form.purchase_date,
      expiry_date:   form.expiry_date || null,
      notes:         form.notes || null,
    })

    if (selectedProduct && finalSellPrice > 0 && finalSellPrice !== selectedProduct.sell_price) {
      await updateProduct.mutateAsync({
        id: form.product_id,
        sell_price: finalSellPrice
      })
    }

    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{ background: '#100A03', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '540px', padding: '0 0 32px', borderTop: `1px solid ${C.border}`, maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 16px' }}>
          <h2 style={{ fontFamily: 'Sora', fontSize: 17, fontWeight: 700, color: C.text, margin: 0 }}>Tambah Stok Masuk</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#94A3B8" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 20px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SField label="Produk *">
            <AnimatePresence mode="wait">
              {showAddProd ? (
                <motion.div key="add" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={newProdName}
                      onChange={e => setNewProdName(e.target.value)}
                      placeholder="Nama produk baru"
                      style={{ ...inputSt, flex: 1 }}
                      autoFocus
                    />
                    <select
                      value={newProdUnit}
                      onChange={e => setNewProdUnit(e.target.value)}
                      style={{ ...inputSt, width: 80, padding: '0 8px' }}
                    >
                      {['kg', 'liter', 'pcs', 'karung', 'karton', 'sak'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={handleAddProduct} disabled={createProd.isPending || !newProdName.trim()}
                      style={{ flex: 1, background: C.accent, border: 'none', borderRadius: 10, height: 40, color: 'white', fontFamily: 'DM Sans', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (createProd.isPending || !newProdName.trim()) ? 0.6 : 1 }}>
                      {createProd.isPending ? 'Menyimpan...' : '✓ Simpan Produk'}
                    </button>
                    <button type="button" onClick={() => setShowAddProd(false)} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={14} color="#6B7280" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <CustomSelect
                    id="stok-product"
                    value={form.product_id}
                    onChange={val => {
                      const p = products.find(x => x.id === val)
                      const lastB = allBatches.find(b => b.product_id === val)
                      setForm(f => ({ 
                        ...f, 
                        product_id: val,
                        buy_price: lastB?.buy_price || p?.avg_buy_price || '',
                        sell_price: p?.sell_price || ''
                      }))
                    }}
                    options={products.map(p => ({ value: p.id, label: `${p.product_name} (${p.unit})` }))}
                    placeholder="-- Pilih produk --"
                    onAddNew={() => setShowAddProd(true)}
                  />
                  {products.length === 0 && (
                    <button type="button" onClick={() => setShowAddProd(true)}
                      style={{ marginTop: 8, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10, background: 'rgba(234,88,12,0.08)', border: `1px dashed ${C.accent}`, color: C.accent, fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans', cursor: 'pointer' }}>
                      <Plus size={14} /> Tambah Produk Baru
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </SField>

          {/* Batch code in collapsible 'Detail Lanjutan' */}
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: TEXT_SEC, fontSize: 11, fontWeight: 700, fontFamily: 'DM Sans', padding: '4px 0' }}
          >
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Detail Lanjutan
          </button>
          <AnimatePresence>
            {showAdvanced && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <SField label="Kode Batch">
                  <input
                    id="batch-code" name="batch_code" type="text"
                    value={form.batch_code} readOnly
                    style={{ ...inputSt, opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </SField>
              </motion.div>
            )}
          </AnimatePresence>

          <SField label="Supplier">
            {showAddSup ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="new-supplier" name="new_supplier" type="text"
                  value={newSupplier}
                  onChange={e => setNewSupplier(e.target.value)}
                  placeholder="Nama supplier baru"
                  style={{ ...inputSt, flex: 1 }}
                />
                <button type="button" onClick={handleAddSupplier} disabled={createSup.isPending || !newSupplier.trim()}
                  style={{ background: C.accent, border: 'none', borderRadius: 10, padding: '0 14px', color: 'white', fontFamily: 'DM Sans', fontSize: 13, cursor: 'pointer' }}>
                  {createSup.isPending ? '...' : 'Tambah'}
                </button>
                <button type="button" onClick={() => setShowAddSup(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <CustomSelect
                  id="stok-supplier"
                  value={form.supplier_id}
                  onChange={val => set('supplier_id', val)}
                  options={suppliers.map(s => ({ value: s.id, label: s.supplier_name }))}
                  placeholder="-- Pilih supplier --"
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={() => setShowAddSup(true)}
                  style={{ background: 'rgba(234,88,12,0.1)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '0 12px', color: C.accent, fontSize: 13, fontFamily: 'DM Sans', cursor: 'pointer', flexShrink: 0 }}>
                  + Baru
                </button>
              </div>
            )}
          </SField>

          <SField label={`Jumlah${selectedProduct ? ` (${selectedProduct.unit})` : ''} *`}>
            <input
              id="stok-qty" name="qty_masuk" type="number" min="0.01" step="0.01"
              value={form.qty_masuk}
              onChange={e => set('qty_masuk', e.target.value)}
              placeholder="0"
              style={inputSt}
            />
          </SField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <SField label="Harga Beli / satuan *">
              <InputRupiah
                value={form.buy_price}
                onChange={val => set('buy_price', val)}
                placeholder="Rp 0"
              />
              <p style={{ fontSize: 10, color: '#6B7280', marginTop: 4, fontFamily: 'DM Sans' }}>Harga per satuan dari supplier</p>
            </SField>
            <SField label="Harga Jual / satuan">
              <InputRupiah
                value={form.sell_price}
                onChange={val => set('sell_price', val)}
                placeholder="Rp 0"
              />
              <p style={{ fontSize: 10, color: '#6B7280', marginTop: 4, fontFamily: 'DM Sans' }}>Harga jual ke toko</p>
            </SField>
          </div>

          {form.qty_masuk && form.buy_price && (
            <div style={{ background: 'rgba(234,88,12,0.06)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: TEXT_SEC }}>Total nilai</span>
              <span style={{ fontFamily: 'Sora', fontSize: 14, fontWeight: 700, color: C.accent }}>
                Rp {fmt(Number(form.qty_masuk) * Number(String(form.buy_price).replace(/\D/g, '')))}
              </span>
            </div>
          )}

          <SField label="Tanggal Masuk *">
            <DatePicker
              value={form.purchase_date}
              onChange={val => set('purchase_date', val)}
              placeholder="Pilih tanggal"
            />
          </SField>
          <SField label="Tanggal Kadaluarsa">
            <DatePicker
              value={form.expiry_date}
              onChange={val => set('expiry_date', val)}
              placeholder="Pilih tanggal"
            />
          </SField>

          <SField label="Catatan">
            <input
              id="stok-notes" name="notes" type="text"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Opsional"
              style={inputSt}
            />
          </SField>

          <button
            type="submit"
            disabled={!form.product_id || !form.qty_masuk || !form.buy_price || addBatch.isPending}
            style={{
              marginTop: 10, height: 52, borderRadius: 14, background: C.accent, color: 'white',
              fontFamily: 'Sora', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(234,88,12,0.3)', opacity: (!form.product_id || !form.qty_masuk || !form.buy_price || addBatch.isPending) ? 0.6 : 1
            }}
          >
            {addBatch.isPending ? 'Menyimpan...' : 'Simpan Stok Masuk'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}
