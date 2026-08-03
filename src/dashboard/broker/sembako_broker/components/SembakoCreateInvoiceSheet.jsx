import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ChevronLeft, Loader2, Search, Check, ChevronDown, Truck, Bike, Package2, Car } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { toast } from 'sonner'
import { formatIDR } from '@/lib/format'
import {
  useSembakoProducts, useSembakoCustomers, useSembakoSales, useSembakoEmployees, useSembakoDeliveries,
  useCreateSembakoProduct, useUpdateSembakoProduct, useCreateSembakoSale, useCreateSembakoDelivery,
  useRecordSembakoPayment, useUpdateSembakoSale, useCreateSembakoCustomer, useCreateSembakoEmployee,
} from '@/lib/hooks/useSembakoData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import SembakoInvoicePreview from '../SembakoInvoicePreview'
import {
  C,
  CustomSelect, InputRupiah, ProgressIndicator, SummaryLine,
  PAYMENT_TERMS_DAYS, PAYMENT_TERMS_LABEL,
  CUSTOMER_TYPE_OPTIONS,
} from './sembakoSaleUtils'
import { SembakoSuccessCard } from './SembakoSuccessCard'

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT   = C.accent   // #EA580C
const BG       = C.bg       // #06090F
const SURFACE  = C.card     // #1C1208
const MUTED    = C.muted    // #92400E
const TEXT     = C.text     // #FEF3C7
const BORDER   = C.border   // rgba(234,88,12,0.15)
const INPUT_BG = C.input    // #231A0E

const inputCn = `w-full h-12 bg-[#231A0E] border border-[#EA580C]/15 rounded-xl px-4 text-[#FEF3C7] text-sm font-semibold focus:border-[#EA580C]/50 focus:outline-none focus:ring-1 focus:ring-[#EA580C]/20 transition-colors [color-scheme:dark] appearance-none`
const labelCn = `block text-[9px] font-black text-[#92400E] uppercase tracking-[0.15em] mb-1.5`

// ─── Mobile Customer Search Overlay ──────────────────────────────────────────
function MobileCustomerSearch({ customers, value, onSelect, onAddNew, onClose }) {
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100) }, [])

  const filtered = useMemo(() => {
    if (!q) return customers
    const lq = q.toLowerCase()
    return customers.filter(c =>
      c.customer_name?.toLowerCase().includes(lq) ||
      c.customer_type?.toLowerCase().includes(lq)
    )
  }, [customers, q])

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: BG }}>
      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b" style={{ borderColor: BORDER }}>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.05)', color: TEXT }}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Cari toko / customer..."
            className={inputCn + ' pl-9'}
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {onAddNew && (
          <button
            onClick={() => { onAddNew(); onClose() }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all"
            style={{ background: `rgba(234,88,12,0.08)`, border: `1px dashed ${ACCENT}`, color: ACCENT }}
          >
            <Plus size={16} /> Tambah Toko Baru
          </button>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-10" style={{ color: MUTED, fontSize: 13 }}>Tidak ada hasil</div>
        )}
        {filtered.map(c => (
          <button
            key={c.id}
            onClick={() => { onSelect(c.id); onClose() }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
            style={{
              background: value === c.id ? 'rgba(234,88,12,0.1)' : SURFACE,
              border: `1px solid ${value === c.id ? ACCENT : BORDER}`,
            }}
          >
            <div>
              <p className="font-bold text-sm" style={{ color: TEXT }}>{c.customer_name}</p>
              <p className="text-[11px] mt-0.5 font-medium" style={{ color: MUTED }}>
                {c.customer_type?.toUpperCase()} · {PAYMENT_TERMS_LABEL[c.payment_terms] || c.payment_terms}
              </p>
            </div>
            {value === c.id && <Check size={16} style={{ color: ACCENT }} />}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Quick Add Customer Card ──────────────────────────────────────────────────
function QuickAddCustomer({ form, onChange, onSave, onCancel, saving }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="rounded-2xl p-4 space-y-3"
      style={{ background: SURFACE, border: `1px solid ${ACCENT}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-black" style={{ color: TEXT }}>Toko Baru</span>
        <button onClick={onCancel} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)', color: MUTED }}>
          <X size={14} />
        </button>
      </div>
      <div className="space-y-2.5">
        <div>
          <label className={labelCn}>Nama Toko *</label>
          <input className={inputCn} value={form.customer_name} onChange={e => onChange({ ...form, customer_name: e.target.value })} placeholder="Contoh: Toko Berkah" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCn}>Tipe Toko</label>
            <CustomSelect value={form.customer_type} onChange={v => onChange({ ...form, customer_type: v })} options={CUSTOMER_TYPE_OPTIONS} placeholder="Pilih Tipe" />
          </div>
          <div>
            <label className={labelCn}>Terms Bayar</label>
            <CustomSelect
              value={form.payment_terms}
              onChange={v => onChange({ ...form, payment_terms: v })}
              options={Object.entries(PAYMENT_TERMS_LABEL).map(([k, v]) => ({ value: k, label: v }))}
              placeholder="Pilih"
            />
          </div>
        </div>
        <div>
          <label className={labelCn}>No HP</label>
          <PhoneInput value={form.phone} onChange={e => onChange({ ...form, phone: e.target.value })} placeholder="0812..." />
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full h-11 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-opacity"
          style={{ background: ACCENT, color: '#fff', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {saving ? 'Menyimpan...' : 'Simpan Toko'}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Quick Add Product Card ───────────────────────────────────────────────────
function QuickAddProduct({ form, onChange, onSave, onCancel, saving }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="rounded-2xl p-4 space-y-3"
      style={{ background: SURFACE, border: `1px solid ${ACCENT}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-black" style={{ color: TEXT }}>Produk Baru</span>
        <button onClick={onCancel} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)', color: MUTED }}>
          <X size={14} />
        </button>
      </div>
      <div className="space-y-2.5">
        <div>
          <label className={labelCn}>Nama Produk *</label>
          <input className={inputCn} value={form.product_name} onChange={e => onChange({ ...form, product_name: e.target.value })} placeholder="Beras Maknyus 5Kg" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCn}>Kategori</label>
            <input className={inputCn} value={form.category} onChange={e => onChange({ ...form, category: e.target.value })} placeholder="beras / minyak..." />
          </div>
          <div>
            <label className={labelCn}>Satuan</label>
            <input className={inputCn} value={form.unit} onChange={e => onChange({ ...form, unit: e.target.value })} placeholder="kg/pcs/sak" />
          </div>
        </div>
        <div>
          <label className={labelCn}>Harga Jual Standard</label>
          <InputRupiah value={form.sell_price} onChange={v => onChange({ ...form, sell_price: v })} />
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full h-11 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-opacity"
          style={{ background: ACCENT, color: '#fff', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {saving ? 'Menyimpan...' : 'Simpan Produk'}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Product Item Row ─────────────────────────────────────────────────────────
function ProductItemRow({ item, idx, products: _products, productOptions, total: _total, overStock, onChangeItem, onRemove, onAddNew, isOnly }) {
  const subtotal = Math.round((item.quantity || 0) * (item.price_per_unit || 0))

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        background: SURFACE,
        border: `1px solid ${overStock ? 'rgba(239,68,68,0.35)' : BORDER}`,
        position: 'relative',
      }}
    >
      {/* Row: product selector + remove */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className={labelCn}>Produk</label>
          <CustomSelect
            value={item.product_id}
            placeholder="Pilih produk..."
            options={productOptions}
            onChange={val => onChangeItem(idx, 'product_id', val)}
            onAddNew={onAddNew}
          />
        </div>
        {!isOnly && (
          <button
            onClick={() => onRemove(idx)}
            className="self-end w-10 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Row: qty + price */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCn}>QTY ({item.unit || '…'})</label>
          <input
            type="number"
            inputMode="decimal"
            value={item.quantity || ''}
            onChange={e => onChangeItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
            className={inputCn}
            placeholder="0"
          />
          {overStock && (
            <p className="text-[10px] font-bold mt-1" style={{ color: '#EF4444' }}>Stok tidak cukup</p>
          )}
        </div>
        <div>
          <label className={labelCn}>Harga / Unit</label>
          <InputRupiah value={item.price_per_unit} onChange={v => onChangeItem(idx, 'price_per_unit', v)} />
        </div>
      </div>

      {/* Subtotal pill */}
      {subtotal > 0 && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: `rgba(234,88,12,0.07)`, border: `1px solid ${BORDER}` }}>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: MUTED }}>Subtotal</span>
          <span className="text-sm font-black" style={{ color: TEXT }}>{formatIDR(subtotal)}</span>
        </div>
      )}
    </div>
  )
}

// ─── Payment Method Buttons ───────────────────────────────────────────────────
const VEHICLE_TYPES = [
  { value: 'Mobil Box',  label: 'Mobil Box',  Icon: Package2 },
  { value: 'Pick Up',    label: 'Pick Up',    Icon: Truck },
  { value: 'L300',       label: 'L300',       Icon: Car },
  { value: 'Motor',      label: 'Motor',      Icon: Bike },
  { value: 'Truk',       label: 'Truk',       Icon: Truck },
]

const PAY_METHOD_CONFIG = {
  cash:     { label: 'Cash',     color: '#EA580C', bg: 'rgba(234,88,12,0.12)' },
  transfer: { label: 'Transfer', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
  qris:     { label: 'QRIS',     color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
}

function PayMethodButton({ method, selected, onClick }) {
  const cfg = PAY_METHOD_CONFIG[method]
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide transition-all"
      style={{
        background: selected ? cfg.bg : 'transparent',
        border: `${selected ? 2 : 1}px solid ${selected ? cfg.color : BORDER}`,
        color: selected ? cfg.color : MUTED,
      }}
    >
      {cfg.label}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function SembakoCreateInvoiceSheet({ open, onOpenChange, editId }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { data: customers = [], isLoading: customersLoading } = useSembakoCustomers()
  const { data: products = [], isLoading: productsLoading } = useSembakoProducts()
  const { data: employees = [] } = useSembakoEmployees()
  const { data: allSales = [] } = useSembakoSales()
  const { data: allDeliveries = [] } = useSembakoDeliveries()

  const createSale     = useCreateSembakoSale()
  const updateSale     = useUpdateSembakoSale()
  const createCustomer = useCreateSembakoCustomer()
  const createProduct  = useCreateSembakoProduct()
  const updateProduct  = useUpdateSembakoProduct()
  const createDelivery = useCreateSembakoDelivery()
  const recordPayment  = useRecordSembakoPayment()
  const createEmployee = useCreateSembakoEmployee()

  const [step, setStep]           = useState(0)
  const [custId, setCustId]       = useState('')
  const [txnDate, setTxnDate]     = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate]     = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) })
  const [items, setItems]         = useState([{ product_id: '', product_name: '', unit: '', quantity: 0, price_per_unit: 0, cogs_per_unit: 0 }])
  const [deliveryCost, setDeliveryCost] = useState(0)
  const [otherCost, setOtherCost] = useState(0)
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState('cash')
  const [notes, setNotes]         = useState('')

  const [showCustSearch, setShowCustSearch] = useState(false)
  const [quickAddCust, setQuickAddCust]     = useState(false)
  const [newCustForm, setNewCustForm]       = useState({ customer_name: '', customer_type: 'warung', phone: '', address: '', payment_terms: 'cash' })
  const [quickAddProd, setQuickAddProd]     = useState(false)
  const [newProdForm, setNewProdForm]       = useState({ product_name: '', category: 'lainnya', unit: 'pcs', sell_price: 0 })

  const [useDelivery, setUseDelivery]           = useState(false)
  const [deliveryDriver, setDeliveryDriver]     = useState('')
  const [deliveryVehicle, setDeliveryVehicle]   = useState('')
  const [deliveryPlate, setDeliveryPlate]       = useState('')
  const [deliveryArea, setDeliveryArea]         = useState('')
  const [fuelCost, setFuelCost]                 = useState(0)
  const [addKurir, setAddKurir]                 = useState(false)
  const [newKurirForm, setNewKurirForm]         = useState({ full_name: '', phone: '' })

  // Auto-prefill kendaraan & plat saat pilih sopir
  const handleSelectDriver = useCallback((driverId) => {
    setDeliveryDriver(driverId)
    if (!driverId) return
    const lastDelivery = allDeliveries
      .filter(d => d.employee_id === driverId && d.vehicle_type)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    if (lastDelivery) {
      if (lastDelivery.vehicle_type) setDeliveryVehicle(lastDelivery.vehicle_type)
      if (lastDelivery.vehicle_plate) setDeliveryPlate(lastDelivery.vehicle_plate)
    }
  }, [allDeliveries])

  const handleSaveKurir = async () => {
    if (!newKurirForm.full_name.trim()) { toast.error('Nama kurir wajib diisi'); return }
    try {
      await createEmployee.mutateAsync({ full_name: newKurirForm.full_name.trim(), phone: newKurirForm.phone, role: 'sopir', status: 'aktif' })
      setAddKurir(false)
      setNewKurirForm({ full_name: '', phone: '' })
    } catch { /* handled by hook */ }
  }

  const [successData, setSuccessData] = useState(null)
  const [printData, setPrintData]     = useState(null)
  const [printMode, setPrintMode]     = useState('invoice')
  const lastPrefillKeyRef = useRef(null)

  // ── Derived data ────────────────────────────────────────────────────────────
  const customerOptions = useMemo(() =>
    customers.map(c => ({ value: c.id, label: c.customer_name })),
    [customers]
  )
  const productOptions = useMemo(() =>
    products.map(p => ({ value: p.id, label: `${p.product_name} (${p.current_stock} ${p.unit})` })),
    [products]
  )
  const editSale = useMemo(() => {
    if (!editId) return null
    return allSales.find(s => s.id === editId) || null
  }, [allSales, editId])

  const selectedCust = customers.find(c => c.id === custId)
  const totalAmount  = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (i.price_per_unit || 0)), 0)
  const totalCogs    = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (i.cogs_per_unit || 0)), 0)
  const grossProfit  = totalAmount - totalCogs
  const netProfit    = grossProfit - deliveryCost - otherCost
  const marginPct    = totalAmount > 0 ? Math.round((grossProfit / totalAmount) * 100) : 0

  // ── Edit prefill ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !editSale) {
      if (!open) lastPrefillKeyRef.current = null
      return
    }
    const prefillKey = `${editSale.id}:${editSale.updated_at || editSale.transaction_date || ''}`
    if (lastPrefillKeyRef.current === prefillKey) return
    lastPrefillKeyRef.current = prefillKey

    setCustId(editSale.customer_id || '')
    setTxnDate(editSale.transaction_date?.slice(0, 10) || new Date().toISOString().slice(0, 10))
    setDueDate(editSale.due_date?.slice(0, 10) || '')
    setDeliveryCost(editSale.delivery_cost || 0)
    setOtherCost(editSale.other_cost || 0)
    setNotes(editSale.notes || '')

    if (Array.isArray(editSale.sembako_sale_items) && editSale.sembako_sale_items.length > 0) {
      setItems(editSale.sembako_sale_items.map(it => ({
        product_id: it.product_id, product_name: it.product_name, unit: it.unit,
        quantity: it.quantity, price_per_unit: it.price_per_unit, cogs_per_unit: it.cogs_per_unit
      })))
    } else {
      setItems([{ product_id: '', product_name: '', unit: '', quantity: 0, price_per_unit: 0, cogs_per_unit: 0 }])
    }
  }, [open, editSale])

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleSelectCustomer(id) {
    setCustId(id)
    const c = customers.find(x => x.id === id)
    if (c?.payment_terms && PAYMENT_TERMS_DAYS[c.payment_terms]) {
      const d = new Date(txnDate)
      d.setDate(d.getDate() + PAYMENT_TERMS_DAYS[c.payment_terms])
      setDueDate(d.toISOString().slice(0, 10))
    }
  }

  async function handleSaveQuickCust() {
    if (!newCustForm.customer_name) { toast.error('Nama toko wajib diisi'); return }
    try {
      const res = await createCustomer.mutateAsync(newCustForm)
      if (res?.id) { handleSelectCustomer(res.id); setQuickAddCust(false) }
    } catch { /* handled by hook */ }
  }

  async function handleSaveQuickProd() {
    if (!newProdForm.product_name) { toast.error('Nama produk wajib diisi'); return }
    try {
      await createProduct.mutateAsync({ ...newProdForm, current_stock: 0, avg_buy_price: 0, is_active: true })
      setQuickAddProd(false)
    } catch { /* handled by hook */ }
  }

  function handleItemChange(idx, field, val) {
    const next = [...items]
    next[idx] = { ...next[idx], [field]: val }
    if (field === 'product_id') {
      const p = products.find(x => x.id === val)
      if (p) {
        next[idx].product_name  = p.product_name
        next[idx].unit          = p.unit
        
        // --- Smart Prefill ---
        // 1. Coba cari harga terakhir ke CUSTOMER ini
        let lastPrice = 0
        if (custId) {
          const lastSale = allSales.find(s => 
            s.customer_id === custId && 
            s.sembako_sale_items?.some(it => it.product_id === val)
          )
          if (lastSale) {
            const lastItem = lastSale.sembako_sale_items.find(it => it.product_id === val)
            lastPrice = lastItem?.price_per_unit
          }
        }
        
        next[idx].price_per_unit = lastPrice || p.sell_price || 0
        next[idx].cogs_per_unit  = p.avg_buy_price || 0
      }
    }
    setItems(next)
  }

  async function handleSubmit() {
    const validItems = items.filter(i => i.product_id && i.quantity > 0)
    if (!validItems.length) { toast.error('Tambahkan minimal 1 produk'); return }

    try {
      const custName = selectedCust?.customer_name || 'Umum'

      if (editId) {
        await updateSale.mutateAsync({
          id: editId,
          updates: {
            customer_id: custId || null, customer_name: custName,
            transaction_date: txnDate, due_date: dueDate || null,
            total_amount: totalAmount, total_cogs: totalCogs,
            delivery_cost: deliveryCost, other_cost: otherCost, notes,
          },
          items: validItems,
        })
        handleClose()
        return
      }

      const sale = await createSale.mutateAsync({
        customer_id: custId || null, customer_name: custName,
        transaction_date: txnDate, due_date: dueDate || null,
        items: validItems, delivery_cost: deliveryCost, other_cost: otherCost, notes,
      })

      if (payAmount > 0 && sale?.id) {
        await recordPayment.mutateAsync({
          sale_id: sale.id, customer_id: custId || null,
          amount: payAmount, payment_date: txnDate,
          payment_method: payMethod, reference_number: null,
          notes: 'Pembayaran awal (wizard)',
        })
      }

      if (useDelivery && sale?.id) {
        await createDelivery.mutateAsync({
          sale_id: sale.id,
          employee_id: deliveryDriver || null,
          driver_name: employees.find(e => e.id === deliveryDriver)?.full_name || null,
          vehicle_type: deliveryVehicle, vehicle_plate: deliveryPlate.toUpperCase(),
          delivery_date: txnDate,
          delivery_area: deliveryArea || selectedCust?.address || '',
          delivery_cost: deliveryCost, status: 'pending',
          notes: 'Otomatis dari wizard penjualan',
        })
      }

      // Sync master prices if changed
      for (const item of validItems) {
        const p = products.find(x => x.id === item.product_id)
        if (p && item.price_per_unit > 0 && item.price_per_unit !== p.sell_price) {
          // Update global master price
          updateProduct.mutate({ id: p.id, sell_price: item.price_per_unit })
        }
      }

      setSuccessData({
        id: sale.id, invoiceNumber: sale.invoice_number, invoice_number: sale.invoice_number,
        customerName: custName, customer_name: custName,
        customerPhone: selectedCust?.phone || null,
        revenue: totalAmount, total_amount: totalAmount,
        cogs: totalCogs, deliveryCost, delivery_cost: deliveryCost,
        otherCost, other_cost: otherCost,
        netProfit: grossProfit - deliveryCost - otherCost,
        hasDelivery: useDelivery,
        driverName: employees.find(e => e.id === deliveryDriver)?.full_name,
        transaction_date: txnDate, sembako_sale_items: validItems,
        remaining_amount: totalAmount - payAmount,
      })
    } catch (err) {
      console.error(err)
    }
  }

  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- React Compiler skip; manual useCallback must remain
  const handleClose = useCallback(() => {
    lastPrefillKeyRef.current = null
    const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) }
    setStep(0); setCustId(''); setTxnDate(new Date().toISOString().slice(0, 10)); setDueDate(tomorrow())
    setItems([{ product_id: '', product_name: '', unit: '', quantity: 0, price_per_unit: 0, cogs_per_unit: 0 }])
    setDeliveryCost(0); setOtherCost(0); setNotes('')
    setPayAmount(0); setPayMethod('cash')
    setUseDelivery(false); setDeliveryDriver(''); setDeliveryVehicle(''); setDeliveryPlate(''); setDeliveryArea(''); setFuelCost(0)
    setAddKurir(false); setNewKurirForm({ full_name: '', phone: '' })
    setQuickAddCust(false); setQuickAddProd(false); setShowCustSearch(false)
    onOpenChange(false)
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- closing line suppress
  }, [onOpenChange])

  const handleSheetOpenChange = v => { if (!v) handleClose(); else onOpenChange(true) }

  const STEPS = ['Pilih Toko', 'Input Produk', 'Pengiriman', 'Summary']

  const goNext = () => {
    if (step === 0 && !custId) {
      toast.error('Pilih toko / customer dulu sebelum lanjut'); return
    }
    if (step === 1) {
      const validItems = items.filter(i => i.product_id && i.quantity > 0)
      if (validItems.length === 0) {
        toast.error('Tambahkan minimal 1 produk'); return
      }
      const zeroPriceItem = validItems.find(i => !i.price_per_unit || i.price_per_unit <= 0)
      if (zeroPriceItem) {
        toast.error('Harga jual per unit wajib diisi (tidak boleh Rp 0)'); return
      }
      // In edit mode, this sale's original qty will be restored before re-deduction,
      // so effective available = current_stock + original qty for that product in this sale
      const getEffectiveStock = (productId) => {
        const prod = products.find(p => p.id === productId)
        if (!prod) return 0
        const originalQty = editId
          ? (editSale?.sembako_sale_items || [])
              .filter(it => it.product_id === productId)
              .reduce((s, it) => s + (it.quantity || 0), 0)
          : 0
        return (prod.current_stock || 0) + originalQty
      }
      const overStockItem = validItems.find(i => {
        const prod = products.find(p => p.id === i.product_id)
        return prod && i.quantity > getEffectiveStock(i.product_id)
      })
      if (overStockItem) {
        const prod = products.find(p => p.id === overStockItem.product_id)
        const available = getEffectiveStock(overStockItem.product_id)
        toast.error(`Stok ${prod?.product_name} tidak cukup — tersedia ${available} ${prod?.unit ?? 'unit'}`)
        return
      }
    }
    setStep(s => s + 1)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Sheet open={open && !successData} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          side={isDesktop ? 'right' : 'bottom'}
          hideClose
          className="hide-scrollbar"
          style={{
            width: isDesktop ? '480px' : '100%',
            height: isDesktop ? '100vh' : '100dvh',
            maxHeight: isDesktop ? '100vh' : '100dvh',
            padding: 0,
            background: BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Mobile fullscreen customer search — inside Portal so aria-hidden on main app doesn't block it */}
          <AnimatePresence>
            {showCustSearch && !isDesktop && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                style={{ position: 'fixed', inset: 0, zIndex: 4100, pointerEvents: showCustSearch ? 'auto' : 'none' }}
              >
                <MobileCustomerSearch
                  customers={customers}
                  value={custId}
                  onSelect={handleSelectCustomer}
                  onAddNew={() => { setQuickAddCust(true); setShowCustSearch(false) }}
                  onClose={() => setShowCustSearch(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Header ── */}
          <div style={{ padding: isDesktop ? '20px 20px 0' : 'env(safe-area-inset-top, 16px) 20px 0', flexShrink: 0 }}>
            {!isDesktop && (
              <div className="flex justify-end mb-3">
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)', color: TEXT }}
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between mb-1">
              <SheetTitle className="font-black text-[22px]" style={{ color: TEXT, fontFamily: 'Sora', margin: 0 }}>
                {editId ? 'Edit Transaksi' : 'Catat Penjualan'}
              </SheetTitle>
              <SheetDescription className="sr-only">Wizard untuk mencatat penjualan sembako baru.</SheetDescription>
              {isDesktop && (
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)', color: TEXT }}
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* ── Progress ── */}
          <div className="px-5">
            <ProgressIndicator currentStep={step} steps={STEPS} />
          </div>

          {/* ── Step content ── */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 pb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                {/* ════════════════════════════════════════
                    STEP 0 — Pilih Toko
                ════════════════════════════════════════ */}
                {step === 0 && (
                  <>
                    <AnimatePresence mode="wait">
                      {!quickAddCust ? (
                        <motion.div key="cust-pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                          <div>
                            <label className={labelCn}>Toko / Customer</label>
                            {customersLoading ? (
                              <div className="h-12 rounded-xl animate-pulse" style={{ background: 'rgba(234,88,12,0.07)' }} />
                            ) : customers.length === 0 ? (
                              /* Auto-show Quick Add when no customers exist */
                              <div
                                className="rounded-xl px-4 py-3 text-center"
                                style={{ background: 'rgba(234,88,12,0.04)', border: `1px dashed ${BORDER}` }}
                              >
                                <p className="text-sm font-semibold mb-2" style={{ color: TEXT }}>Belum ada toko / customer</p>
                                <p className="text-xs mb-3" style={{ color: MUTED }}>Tambahkan toko pertama untuk mulai catat penjualan</p>
                                <button
                                  onClick={() => setQuickAddCust(true)}
                                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                                  style={{ background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(234,88,12,0.3)' }}
                                >
                                  <Plus size={14} /> Tambah Toko Pertama
                                </button>
                              </div>
                            ) : isDesktop ? (
                              // Desktop: inline dropdown
                              <CustomSelect
                                id="invoice-customer"
                                value={custId}
                                placeholder="-- Pilih toko / customer --"
                                options={customerOptions}
                                onChange={handleSelectCustomer}
                                onAddNew={() => setQuickAddCust(true)}
                              />
                            ) : (
                              // Mobile: tap to open fullscreen search
                              <button
                                onClick={() => setShowCustSearch(true)}
                                className="w-full h-12 rounded-xl px-4 flex items-center justify-between text-sm font-semibold transition-colors"
                                style={{
                                  background: INPUT_BG,
                                  border: `1px solid ${BORDER}`,
                                  color: custId ? TEXT : MUTED,
                                }}
                              >
                                <span>{selectedCust?.customer_name || '-- Pilih toko / customer --'}</span>
                                <Search size={16} style={{ color: MUTED }} />
                              </button>
                            )}
                          </div>

                          {/* Selected customer info */}
                          <AnimatePresence>
                            {selectedCust && (
                              <motion.div
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                                className="rounded-xl p-3 space-y-1.5 text-sm"
                                style={{ background: 'rgba(234,88,12,0.04)', border: `1px solid ${BORDER}` }}
                              >
                                <div className="flex justify-between">
                                  <span style={{ color: MUTED, fontWeight: 600 }}>Tipe</span>
                                  <span style={{ color: TEXT, fontWeight: 700 }}>{selectedCust.customer_type?.toUpperCase() || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span style={{ color: MUTED, fontWeight: 600 }}>Terms</span>
                                  <span style={{ color: ACCENT, fontWeight: 800 }}>{PAYMENT_TERMS_LABEL[selectedCust.payment_terms] || selectedCust.payment_terms}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span style={{ color: MUTED, fontWeight: 600 }}>Piutang Aktif</span>
                                  <span className="font-black" style={{ color: selectedCust.total_outstanding > 0 ? '#EF4444' : C.green }}>
                                    {formatIDR(selectedCust.total_outstanding || 0)}
                                  </span>
                                </div>
                                {selectedCust.credit_limit > 0 && (
                                  <div className="pt-2 border-t space-y-1" style={{ borderColor: BORDER }}>
                                    <div className="flex justify-between text-[10px]">
                                      <span style={{ color: MUTED, fontWeight: 800 }}>BATAS KREDIT: {formatIDR(selectedCust.credit_limit)}</span>
                                      <span style={{ color: (selectedCust.total_outstanding || 0) > selectedCust.credit_limit ? '#EF4444' : MUTED }}>
                                        {Math.round(((selectedCust.total_outstanding || 0) / selectedCust.credit_limit) * 100)}%
                                      </span>
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                          width: `${Math.min(100, ((selectedCust.total_outstanding || 0) / selectedCust.credit_limit) * 100)}%`,
                                          background: (selectedCust.total_outstanding || 0) > selectedCust.credit_limit ? '#EF4444' : ACCENT,
                                        }}
                                      />
                                    </div>
                                    {(selectedCust.total_outstanding || 0) > selectedCust.credit_limit && (
                                      <p className="text-center text-[10px] font-black" style={{ color: '#EF4444' }}>
                                        WARNING: BATAS KREDIT TERLAMPAUI!
                                      </p>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ) : (
                        <motion.div key="cust-add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <QuickAddCustomer
                            form={newCustForm}
                            onChange={setNewCustForm}
                            onSave={handleSaveQuickCust}
                            onCancel={() => setQuickAddCust(false)}
                            saving={createCustomer.isPending}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Dates — always stacked individually */}
                    <div>
                      <label className={labelCn}>Tanggal Transaksi</label>
                      <DatePicker value={txnDate} onChange={setTxnDate} />
                    </div>
                    <div>
                      <label className={labelCn}>Jatuh Tempo</label>
                      <DatePicker value={dueDate || ''} onChange={setDueDate} />
                    </div>

                    <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: `1px dashed ${BORDER}` }}>
                      <p className="text-[12px] leading-relaxed" style={{ color: MUTED }}>
                        <span style={{ color: ACCENT, fontWeight: 800 }}>Info:</span> Invoice number dibuat otomatis saat disimpan.
                      </p>
                    </div>
                  </>
                )}

                {/* ════════════════════════════════════════
                    STEP 1 — Input Produk
                ════════════════════════════════════════ */}
                {step === 1 && (
                  <>
                    <div className="flex items-center justify-between">
                      <label className={labelCn}>Item Produk</label>
                      {productsLoading
                        ? <span className="text-[10px] font-bold animate-pulse" style={{ color: ACCENT }}>Memuat...</span>
                        : <span className="text-[10px] font-bold" style={{ color: MUTED }}>{items.length} Item</span>
                      }
                    </div>

                    {/* Quick-add product */}
                    <AnimatePresence>
                      {quickAddProd && (
                        <QuickAddProduct
                          form={newProdForm}
                          onChange={setNewProdForm}
                          onSave={handleSaveQuickProd}
                          onCancel={() => setQuickAddProd(false)}
                          saving={createProduct.isPending}
                        />
                      )}
                    </AnimatePresence>

                    {/* Loading skeletons */}
                    {productsLoading && (
                      <div className="space-y-3">
                        {[1, 2].map(i => (
                          <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'rgba(234,88,12,0.07)' }} />
                        ))}
                      </div>
                    )}

                    {/* Product rows */}
                    <div className="space-y-3">
                      {items.map((item, idx) => {
                        const prod = products.find(p => p.id === item.product_id)
                        const originalQty = editId
                          ? (editSale?.sembako_sale_items || [])
                              .filter(it => it.product_id === item.product_id)
                              .reduce((s, it) => s + (it.quantity || 0), 0)
                          : 0
                        const overStock = prod && item.quantity > ((prod.current_stock || 0) + originalQty)
                        return (
                          <ProductItemRow
                            key={idx}
                            item={item}
                            idx={idx}
                            products={products}
                            productOptions={productOptions}
                            overStock={overStock}
                            onChangeItem={handleItemChange}
                            onRemove={idx => setItems(items.filter((_, i) => i !== idx))}
                            onAddNew={() => setQuickAddProd(true)}
                            isOnly={items.length === 1}
                          />
                        )
                      })}
                    </div>

                    {/* Add item */}
                    <button
                      onClick={() => setItems([...items, { product_id: '', product_name: '', unit: '', quantity: 0, price_per_unit: 0, cogs_per_unit: 0 }])}
                      className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all"
                      style={{ border: `1px dashed ${BORDER}`, color: MUTED, background: 'transparent' }}
                    >
                      <Plus size={16} /> Tambah Item Lain
                    </button>

                    {/* Running total */}
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: MUTED }}>Total Sementara</span>
                      <span className="text-base font-black" style={{ color: TEXT }}>{formatIDR(totalAmount)}</span>
                    </div>
                  </>
                )}

                {/* ════════════════════════════════════════
                    STEP 2 — Pengiriman
                ════════════════════════════════════════ */}
                {step === 2 && (
                  <>
                    {/* Toggle switch card */}
                    <button
                      type="button"
                      onClick={() => setUseDelivery(v => !v)}
                      className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left"
                      style={{
                        background: useDelivery ? 'rgba(96,165,250,0.08)' : SURFACE,
                        border: `${useDelivery ? 2 : 1}px solid ${useDelivery ? '#60A5FA' : BORDER}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ width: 44, height: 24, borderRadius: 12, background: useDelivery ? '#3B82F6' : 'rgba(255,255,255,0.12)', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                        <div style={{ position: 'absolute', top: 3, left: useDelivery ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.35)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm" style={{ color: useDelivery ? '#93C5FD' : TEXT }}>Jadwalkan Pengiriman</p>
                        <p className="text-[11px] mt-0.5 font-medium" style={{ color: MUTED }}>Trip pengiriman otomatis dibuat saat simpan</p>
                      </div>
                    </button>

                    <AnimatePresence>
                      {useDelivery && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 overflow-hidden"
                        >
                          {/* Jenis Kendaraan chips */}
                          <div>
                            <label className={labelCn}>Jenis Kendaraan</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {VEHICLE_TYPES.map(({ value, label, Icon }) => {
                                const active = deliveryVehicle === value
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() => setDeliveryVehicle(active ? '' : value)}
                                    className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold transition-all"
                                    style={{
                                      background: active ? 'rgba(96,165,250,0.15)' : INPUT_BG,
                                      border: `${active ? 2 : 1}px solid ${active ? '#60A5FA' : 'rgba(234,88,12,0.15)'}`,
                                      color: active ? '#93C5FD' : TEXT,
                                    }}
                                  >
                                    <Icon size={13} strokeWidth={2.5} />
                                    {label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* No. Plat */}
                          <div>
                            <label className={labelCn}>No. Plat</label>
                            <input
                              className={inputCn}
                              value={deliveryPlate}
                              onChange={e => setDeliveryPlate(e.target.value.toUpperCase())}
                              placeholder="B 1234 XY"
                            />
                          </div>

                          {/* Sopir / Kurir */}
                          <div>
                            <label className={labelCn}>Sopir / Kurir (Opsional)</label>
                            <div className="space-y-2">
                              {/* Belum Ditentukan */}
                              <button
                                type="button"
                                onClick={() => setDeliveryDriver('')}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                                style={{
                                  background: !deliveryDriver ? 'rgba(96,165,250,0.08)' : SURFACE,
                                  border: `1px solid ${!deliveryDriver ? '#60A5FA' : BORDER}`,
                                }}
                              >
                                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, color: MUTED }}>–</div>
                                <span className="font-bold text-sm" style={{ color: !deliveryDriver ? '#93C5FD' : MUTED }}>Belum Ditentukan</span>
                                {!deliveryDriver && <Check size={14} color="#60A5FA" strokeWidth={3} className="ml-auto" />}
                              </button>

                              {/* Employee cards */}
                              {employees.filter(e => e.status === 'aktif').map(e => (
                                <button
                                  key={e.id}
                                  type="button"
                                  onClick={() => handleSelectDriver(e.id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                                  style={{
                                    background: deliveryDriver === e.id ? 'rgba(96,165,250,0.08)' : SURFACE,
                                    border: `1px solid ${deliveryDriver === e.id ? '#60A5FA' : BORDER}`,
                                  }}
                                >
                                  <div style={{ width: 32, height: 32, borderRadius: 10, background: deliveryDriver === e.id ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>👤</div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate" style={{ color: deliveryDriver === e.id ? '#93C5FD' : TEXT }}>{e.full_name}</p>
                                    <p className="text-[11px] font-medium capitalize" style={{ color: MUTED }}>{e.role}</p>
                                  </div>
                                  {deliveryDriver === e.id && <Check size={14} color="#60A5FA" strokeWidth={3} />}
                                </button>
                              ))}

                              {/* Tambah Kurir Baru */}
                              {!addKurir ? (
                                <button
                                  type="button"
                                  onClick={() => setAddKurir(true)}
                                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all"
                                  style={{ background: 'rgba(234,88,12,0.06)', border: `1px dashed ${ACCENT}`, color: ACCENT }}
                                >
                                  <Plus size={15} /> Tambah Kurir Baru
                                </button>
                              ) : (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="space-y-3 overflow-hidden p-4 rounded-2xl"
                                  style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
                                >
                                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: MUTED }}>Data Kurir Baru</p>
                                  <input
                                    className={inputCn}
                                    placeholder="Nama lengkap *"
                                    value={newKurirForm.full_name}
                                    onChange={e => setNewKurirForm(f => ({ ...f, full_name: e.target.value }))}
                                  />
                                  <input
                                    className={inputCn}
                                    placeholder="No. HP (opsional)"
                                    value={newKurirForm.phone}
                                    onChange={e => setNewKurirForm(f => ({ ...f, phone: e.target.value }))}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => { setAddKurir(false); setNewKurirForm({ full_name: '', phone: '' }) }}
                                      className="flex-1 h-10 rounded-xl text-xs font-bold"
                                      style={{ background: 'rgba(255,255,255,0.05)', color: MUTED, border: `1px solid ${BORDER}` }}
                                    >
                                      Batal
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleSaveKurir}
                                      disabled={createEmployee.isPending}
                                      className="flex-1 h-10 rounded-xl text-xs font-bold"
                                      style={{ background: '#3B82F6', color: '#fff', opacity: createEmployee.isPending ? 0.6 : 1 }}
                                    >
                                      {createEmployee.isPending ? 'Menyimpan...' : 'Simpan Kurir'}
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </div>

                          {/* Area Pengiriman */}
                          <div>
                            <label className={labelCn}>Area Pengiriman</label>
                            <input
                              className={inputCn}
                              value={deliveryArea}
                              onChange={e => setDeliveryArea(e.target.value)}
                              placeholder="Contoh: Kec. Setiabudi"
                            />
                          </div>

                          {/* Biaya BBM */}
                          <div>
                            <label className={labelCn}>Biaya BBM (Internal)</label>
                            <InputRupiah value={fuelCost} onChange={setFuelCost} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {/* ════════════════════════════════════════
                    STEP 3 — Summary & Payment
                ════════════════════════════════════════ */}
                {step === 3 && (
                  <>
                    {/* Summary card */}
                    <div className="rounded-2xl p-4 space-y-2" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                      <SummaryLine label="Toko / Customer" value={selectedCust?.customer_name || 'Umum'} bold />
                      <SummaryLine label="Jumlah Item" value={`${items.filter(i => i.product_id).length} Item`} />
                      <div className="h-px my-1" style={{ background: BORDER }} />
                      <SummaryLine label="Total Barang" value={formatIDR(totalAmount)} bold />
                      <SummaryLine label="Estimasi HPP" value={formatIDR(totalCogs)} />
                    </div>

                    {/* Profit preview card */}
                    <div
                      className="rounded-2xl p-4 space-y-3"
                      style={{
                        background: grossProfit >= 0 ? 'rgba(2, 26, 2,0.05)' : 'rgba(239,68,68,0.05)',
                        border: `1px solid ${grossProfit >= 0 ? 'rgba(2, 26, 2,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      }}
                    >
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: grossProfit >= 0 ? '#021a02' : '#EF4444' }}>
                            Estimasi Net Profit
                          </p>
                          <p className="text-2xl font-black" style={{ color: grossProfit >= 0 ? '#021a02' : '#EF4444', fontFamily: 'Sora' }}>
                            {formatIDR(netProfit)}
                          </p>
                        </div>
                        <div
                          className="px-3 py-1.5 rounded-full text-xs font-black"
                          style={{ background: grossProfit >= 0 ? 'rgba(2, 26, 2,0.15)' : 'rgba(239,68,68,0.15)', color: grossProfit >= 0 ? '#021a02' : '#EF4444' }}
                        >
                          Margin {marginPct}%
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span style={{ color: MUTED }}>Gross Profit</span>
                          <p className="font-black mt-0.5" style={{ color: grossProfit >= 0 ? '#021a02' : '#EF4444' }}>{formatIDR(grossProfit)}</p>
                        </div>
                        {(deliveryCost > 0 || otherCost > 0) && (
                          <div>
                            <span style={{ color: MUTED }}>Dikurangi Biaya</span>
                            <p className="font-black mt-0.5" style={{ color: '#EF4444' }}>-{formatIDR(deliveryCost + otherCost)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Medium #5: overpayment warning (edit mode only) */}
                    {editId && editSale && (editSale.paid_amount || 0) > totalAmount && (
                      <div
                        className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
                      >
                        <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
                        <div>
                          <p className="text-xs font-bold" style={{ color: '#F59E0B' }}>Kelebihan Bayar</p>
                          <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                            Toko sudah bayar {formatIDR(editSale.paid_amount || 0)} tapi total baru {formatIDR(totalAmount)}.
                            Sisa kelebihan {formatIDR((editSale.paid_amount || 0) - totalAmount)} — invoice akan ditandai <strong>LUNAS</strong>.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Margin warning for negative margins (RUGI) */}
                    {totalAmount > 0 && marginPct < 0 && (
                      <div
                        className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
                      >
                        <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>🚨</span>
                        <div>
                          <p className="text-xs font-bold" style={{ color: '#EF4444' }}>PERHATIAN: Transaksi ini RUGI ({marginPct}%)</p>
                          <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Harga jual lebih rendah dari HPP. Periksa harga atau COGS sebelum menyimpan.</p>
                        </div>
                      </div>
                    )}

                    {/* Margin warning for thin margins (0-5%) */}
                    {totalAmount > 0 && marginPct < 5 && marginPct >= 0 && (
                      <div
                        className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                      >
                        <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
                        <div>
                          <p className="text-xs font-bold" style={{ color: '#F59E0B' }}>Margin tipis ({marginPct}%)</p>
                          <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Pastikan harga jual sudah benar agar keuntungan optimal</p>
                        </div>
                      </div>
                    )}


                    {/* Cost inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCn}>Biaya Kirim</label>
                        <InputRupiah value={deliveryCost} onChange={setDeliveryCost} />
                      </div>
                      <div>
                        <label className={labelCn}>Biaya Lain</label>
                        <InputRupiah value={otherCost} onChange={setOtherCost} />
                      </div>
                    </div>

                    {/* Payment section */}
                    <div
                      className="rounded-2xl p-4 space-y-3"
                      style={{ background: 'rgba(2, 26, 2,0.04)', border: '1px solid rgba(2, 26, 2,0.15)' }}
                    >
                      <label className={labelCn + ' text-[#021a02]'}>Pembayaran Awal (Opsional)</label>
                      <InputRupiah value={payAmount} onChange={setPayAmount} placeholder="Jumlah bayar..." />
                      <AnimatePresence>
                        {payAmount > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex gap-2 overflow-hidden"
                          >
                            {Object.keys(PAY_METHOD_CONFIG).map(m => (
                              <PayMethodButton key={m} method={m} selected={payMethod === m} onClick={() => setPayMethod(m)} />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {payAmount > 0 && (
                        <div className="flex justify-between text-[11px]">
                          <span style={{ color: MUTED }}>Sisa Piutang</span>
                          <span className="font-black" style={{ color: totalAmount - payAmount > 0 ? '#EF4444' : '#021a02' }}>
                            {formatIDR(Math.max(0, totalAmount - payAmount))}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className={labelCn}>Catatan Invoice</label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className={inputCn + ' h-20 py-3 resize-none leading-relaxed'}
                        placeholder="Contoh: Titip di satpam, barang diskon..."
                      />
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Footer ── */}
          <div
            className="flex gap-3 px-5 pt-4 border-t"
            style={{
              borderColor: BORDER,
              background: BG,
              paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
            }}
          >
            {step > 0 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all"
                style={{ border: `1px solid ${BORDER}`, color: TEXT, background: 'transparent' }}
              >
                <ChevronLeft size={16} /> Kembali
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="flex-1 h-12 rounded-xl font-bold text-sm transition-all"
                style={{ border: `1px solid ${BORDER}`, color: TEXT, background: 'transparent' }}
              >
                Batal
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={goNext}
                className="flex-[2] h-12 rounded-xl font-black text-sm transition-all"
                style={{ background: ACCENT, color: '#fff', boxShadow: '0 4px 16px rgba(234,88,12,0.3)' }}
              >
                Lanjut →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createSale.isPending || updateSale.isPending}
                className="flex-[2] h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: ACCENT,
                  color: '#fff',
                  opacity: (createSale.isPending || updateSale.isPending) ? 0.6 : 1,
                  boxShadow: '0 4px 16px rgba(234,88,12,0.3)',
                }}
              >
                {(createSale.isPending || updateSale.isPending)
                  ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
                  : 'Simpan Invoice'
                }
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <SembakoSuccessCard
        isOpen={!!successData && !printData}
        onClose={() => { setSuccessData(null); handleClose() }}
        data={successData}
        onPrint={(mode) => { setPrintData(successData); setPrintMode(mode) }}
      />

      {printData && (
        <SembakoInvoicePreview
          data={printData}
          mode={printMode}
          onClose={() => setPrintData(null)}
        />
      )}
    </>
  )
}
