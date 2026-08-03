import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, PackageX, User, Store, ArrowUpRight, ArrowDownLeft, X, ChevronDown, Check } from 'lucide-react'
import { toast } from 'sonner'
import { BrokerMobileHeader } from '@/dashboard/broker/_shared/components/BrokerMobileHeader'
import { C } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import { 
  useSembakoProducts, 
  useSembakoCustomers, 
  useSembakoSuppliers,
  useSembakoReturns,
  useCreateSembakoReturn,
  useUpdateSembakoReturnStatus
} from '@/lib/hooks/useSembakoData'
import { useNavigate, useParams } from 'react-router-dom'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

const fmt = (n) => new Intl.NumberFormat('id-ID').format(Math.round(n || 0))

export default function SembakoRetur() {
  const { brokerType } = useParams()
  const brokerBase = `/broker/${brokerType || 'distributor_sembako'}`
  const navigate = useNavigate()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const { data: products = [] } = useSembakoProducts()
  const { data: customers = [] } = useSembakoCustomers()
  const { data: suppliers = [] } = useSembakoSuppliers()
  
  const { data: returnsList = [], isLoading: returnsLoading } = useSembakoReturns()
  const createReturnMut = useCreateSembakoReturn()
  const updateStatusMut = useUpdateSembakoReturnStatus()

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'sale_return', 'purchase_return'
  const [sheetOpen, setSheetOpen] = useState(false)

  // Form State for new Return
  const [form, setForm] = useState({
    type: 'sale_return',
    party_name: '',
    product_id: '',
    quantity: 1,
    unit: 'slop',
    unit_price: '',
    reason: 'Pita Cukai Cacat',
    action: 'fifo_stock',
    notes: '',
  })

  const handleCreateReturn = async (e) => {
    e.preventDefault()
    if (!form.party_name.trim()) return toast.error('Nama Toko / Supplier wajib diisi')
    if (!form.product_id) return toast.error('Pilih produk yang diretur')
    if (!form.quantity || form.quantity <= 0) return toast.error('Jumlah retur tidak valid')

    const selectedProduct = products.find(p => p.id === form.product_id)
    const unitPrice = form.unit_price ? Number(String(form.unit_price).replace(/\D/g, '')) : (selectedProduct?.sell_price || 0)
    const totalAmount = unitPrice * Number(form.quantity)

    await createReturnMut.mutateAsync({
      return_type: form.type,
      party_name: form.party_name,
      product_id: form.product_id,
      product_name: selectedProduct ? selectedProduct.product_name : 'Produk Rokok',
      quantity: Number(form.quantity),
      unit: form.unit,
      unit_price: unitPrice,
      total_amount: totalAmount,
      reason: form.reason,
      action: form.action,
      financial_action: form.financial_action || 'potong_piutang',
      notes: form.notes,
    })

    setSheetOpen(false)
    setForm({
      type: 'sale_return',
      party_name: '',
      product_id: '',
      quantity: 1,
      unit: 'slop',
      unit_price: '',
      reason: 'Pita Cukai Cacat',
      action: 'fifo_stock',
      notes: '',
    })
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'pending' ? 'completed' : 'pending'
    await updateStatusMut.mutateAsync({ id, status: nextStatus })
    toast.info(`Status retur diubah ke ${nextStatus === 'completed' ? 'Selesai' : 'Diproses'}`)
  }

  const filteredReturns = useMemo(() => {
    return returnsList.filter(r => {
      const matchSearch = r.party_name.toLowerCase().includes(search.toLowerCase()) ||
                          r.product_name.toLowerCase().includes(search.toLowerCase()) ||
                          r.id.toLowerCase().includes(search.toLowerCase())
      const matchType = filterType === 'all' ? true : r.type === filterType
      return matchSearch && matchType
    })
  }, [returnsList, search, filterType])

  const totalReturnAmount = useMemo(() => {
    return returnsList.reduce((acc, curr) => acc + (curr.amount || 0), 0)
  }, [returnsList])

  const pendingCount = useMemo(() => {
    return returnsList.filter(r => r.status === 'pending').length
  }, [returnsList])

  return (
    <div className="bg-background min-h-screen text-white pb-28">
      <BrokerMobileHeader title="Retur Produk Rokok" />

      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-4 md:pt-8">
        {/* Header Title Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-600/15 via-[#121824] to-[#121824] border border-orange-500/25 rounded-2xl p-5 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400/90 mb-1 block">
                MANAJEMEN DISTRIBUSI ROKOK
              </span>
              <h1 className="text-xl md:text-2xl font-black font-['Sora'] text-white flex items-center gap-2.5">
                <RotateCcw className="text-orange-500" size={26} /> Retur & Klaim Produk Rokok
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Pencatatan klaim barang cacat, pita cukai rusak, atau pengembalian stok toko dengan kalkulasi stok FIFO otomatis.
              </p>
            </div>
            <button
              onClick={() => setSheetOpen(true)}
              className="h-11 px-5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
            >
              <Plus size={16} /> Catat Retur Baru
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 mb-6">
          <div className="bg-[#121824] border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 transition-all">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <PackageX size={14} className="text-orange-500" /> Total Retur
            </div>
            <p className="text-xl md:text-2xl font-black font-['Sora'] text-white">{returnsList.length} Transaksi</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{pendingCount} perlu diproses</p>
          </div>

          <div className="bg-[#121824] border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 transition-all">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <RotateCcw size={14} className="text-red-400" /> Nilai Barang Diretur
            </div>
            <p className="text-xl md:text-2xl font-black font-['Sora'] text-red-400">Rp {fmt(totalReturnAmount)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Penjualan & Pembelian</p>
          </div>

          <div className="col-span-2 md:col-span-1 bg-[#121824] border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 transition-all">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Clock size={14} className="text-amber-400" /> Penanganan Stok
            </div>
            <p className="text-sm font-bold text-amber-400 mt-1">FIFO Reversal & Loss Report</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Otomatis update stok gudang</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5">
          {/* Tabs */}
          <div className="flex bg-[#121824] p-1 rounded-xl border border-slate-800/80 self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterType === 'all' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'text-slate-400 hover:text-white'}`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType('sale_return')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterType === 'sale_return' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'text-slate-400 hover:text-white'}`}
            >
              Retur Pelanggan (Jual)
            </button>
            <button
              onClick={() => setFilterType('purchase_return')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterType === 'purchase_return' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'text-slate-400 hover:text-white'}`}
            >
              Retur Pabrik (Beli)
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari toko, produk, atau ID..."
              className="w-full bg-[#121824] border border-slate-800/90 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-orange-500 transition-all"
            />
          </div>
        </div>

        {/* Returns List */}
        {filteredReturns.length === 0 ? (
          <div className="bg-[#121824] border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500">
            <RotateCcw size={36} className="mx-auto mb-3 opacity-30 text-orange-500" />
            <p className="text-base font-bold text-slate-300">Belum ada riwayat retur produk</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Klik "+ Catat Retur Baru" untuk menambah klaim produk rokok dari toko atau ke supplier.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReturns.map(r => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#121824] border border-slate-800/80 hover:border-orange-500/40 rounded-2xl p-4 md:p-5 transition-all shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                      r.type === 'sale_return' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {r.type === 'sale_return' ? 'Retur dari Toko' : 'Retur ke Pabrik'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">{r.id}</span>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(r.id, r.status)}
                    className={`text-[10px] font-bold px-3 py-1 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all ${
                      r.status === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                    }`}
                  >
                    {r.status === 'completed' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                    {r.status === 'completed' ? 'Selesai' : 'Diproses'}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/60 pt-3">
                  <div>
                    <h3 className="text-base font-bold text-white font-['Sora']">{r.product_name}</h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <Store size={13} className="text-slate-500" /> <span className="font-semibold text-slate-200">{r.party_name}</span>
                      <span>·</span>
                      <span className="text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">{r.quantity} {r.unit}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Alasan: <span className="text-slate-300 italic">{r.reason}</span> · Action: <span className="text-amber-400 font-semibold">{r.action === 'fifo_stock' ? 'Masuk Stok (FIFO)' : 'Afkir / Loss'}</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right mt-2 sm:mt-0 bg-[#0E1420] sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nilai Retur</p>
                    <p className="text-lg font-black font-['Sora'] text-red-400 mt-0.5">Rp {fmt(r.amount)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal / Sheet Catat Retur Baru */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setSheetOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0E1420] border-t-2 border-orange-500 sm:border sm:border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <RotateCcw className="text-orange-500" size={20} />
                  <h2 className="text-base font-bold font-['Sora'] text-white">Catat Retur Produk Rokok</h2>
                </div>
                <button onClick={() => setSheetOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateReturn} className="space-y-4 text-xs">
                {/* Tipe Retur */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">Tipe Transaksi Retur</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, type: 'sale_return' })}
                      className={`p-3 rounded-xl border font-bold text-left transition-all ${
                        form.type === 'sale_return' ? 'bg-orange-600/15 border-orange-500 text-orange-400' : 'bg-[#121824] border-slate-800 text-slate-400'
                      }`}
                    >
                      <ArrowDownLeft size={16} className="mb-1" />
                      Retur dari Toko / Buyer
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, type: 'purchase_return' })}
                      className={`p-3 rounded-xl border font-bold text-left transition-all ${
                        form.type === 'purchase_return' ? 'bg-blue-600/15 border-blue-500 text-blue-400' : 'bg-[#121824] border-slate-800 text-slate-400'
                      }`}
                    >
                      <ArrowUpRight size={16} className="mb-1" />
                      Retur ke Pabrik / Supplier
                    </button>
                  </div>
                </div>

                {/* Pilih Toko / Supplier (Custom Select) */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">
                    {form.type === 'sale_return' ? 'Pilih Toko / Pelanggan *' : 'Pilih Pabrik / Supplier *'}
                  </label>
                  <CustomSelect
                    value={form.party_name}
                    onChange={val => setForm({ ...form, party_name: val === 'custom' ? '' : val, is_custom_party: val === 'custom' })}
                    placeholder={`-- ${form.type === 'sale_return' ? 'Pilih Toko Terdaftar' : 'Pilih Supplier Terdaftar'} --`}
                    options={[
                      { value: '', label: `-- ${form.type === 'sale_return' ? 'Pilih Toko Terdaftar' : 'Pilih Supplier Terdaftar'} --` },
                      ...(form.type === 'sale_return'
                        ? customers.map(c => ({ value: c.customer_name, label: `${c.customer_name} ${c.address ? `(${c.address})` : ''}` }))
                        : suppliers.map(s => ({ value: s.supplier_name, label: s.supplier_name }))
                      ),
                      { value: 'custom', label: '✏️ + Input Nama Toko / Supplier Baru' }
                    ]}
                  />

                  {(form.is_custom_party || (form.type === 'sale_return' && customers.length === 0) || (form.type === 'purchase_return' && suppliers.length === 0)) && (
                    <input
                      type="text"
                      value={form.party_name}
                      onChange={e => setForm({ ...form, party_name: e.target.value })}
                      placeholder={form.type === 'sale_return' ? 'Ketik Nama Toko / Pelanggan Baru...' : 'Ketik Nama Pabrik / Supplier Baru...'}
                      className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500 mt-2"
                    />
                  )}
                </div>

                {/* Pilih Produk */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">Produk Rokok *</label>
                  <CustomSelect
                    value={form.product_id}
                    onChange={val => setForm({ ...form, product_id: val })}
                    placeholder="-- Pilih Produk Rokok --"
                    options={[
                      { value: '', label: '-- Pilih Produk Rokok --' },
                      ...products.map(p => ({
                        value: p.id,
                        label: `${p.product_name} (Stok: ${p.current_stock} ${p.unit || 'slop'})`
                      }))
                    ]}
                  />
                </div>

                {/* Qty & Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1.5">Jumlah (Qty)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.quantity}
                      onChange={e => setForm({ ...form, quantity: e.target.value })}
                      className="w-full bg-[#121824] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1.5">Satuan</label>
                    <CustomSelect
                      value={form.unit}
                      onChange={val => setForm({ ...form, unit: val })}
                      placeholder="Pilih Satuan"
                      options={[
                        { value: 'slop', label: 'Slop' },
                        { value: 'pres', label: 'Pres' },
                        { value: 'bal', label: 'Bal' },
                        { value: 'karton', label: 'Karton / Dus' },
                        { value: 'pack', label: 'Pack / Bungkus' },
                      ]}
                    />
                  </div>
                </div>

                {/* Alasan Retur */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">Alasan Retur</label>
                  <CustomSelect
                    value={form.reason}
                    onChange={val => setForm({ ...form, reason: val })}
                    placeholder="Pilih Alasan Retur"
                    options={[
                      { value: 'Pita Cukai Cacat', label: 'Pita Cukai Cacat / Rusak' },
                      { value: 'Bungkus Sobek / Penyok', label: 'Bungkus Sobek / Penyok Saat Transit' },
                      { value: 'Rokok Lembab / Jamuran', label: 'Rokok Lembab / Jamuran' },
                      { value: 'Salah Kirim Varian', label: 'Salah Kirim Varian' },
                      { value: 'Expired / Tukar Pabrik', label: 'Expired / Tukar Pabrik' },
                    ]}
                  />
                </div>

                {/* Tindakan Stok (FIFO) */}
                <div>
                  <label className="block text-slate-400 font-bold mb-1.5">Tindakan terhadap Stok (FIFO)</label>
                  <CustomSelect
                    value={form.action}
                    onChange={val => setForm({ ...form, action: val })}
                    placeholder="Pilih Tindakan Stok"
                    options={[
                      { value: 'fifo_stock', label: 'Kembalikan ke Stok FIFO Gudang (Bisa dijual lagi)' },
                      { value: 'loss', label: 'Buang ke Loss / Afkir (Rusak total)' },
                    ]}
                  />
                </div>

                {/* Penanganan Piutang / Keuangan Toko */}
                {form.type === 'sale_return' && (
                  <div>
                    <label className="block text-slate-400 font-bold mb-1.5">Penanganan Piutang / Keuangan Toko</label>
                    <CustomSelect
                      value={form.financial_action || 'potong_piutang'}
                      onChange={val => setForm({ ...form, financial_action: val })}
                      placeholder="Pilih Penanganan Piutang"
                      options={[
                        { value: 'potong_piutang', label: '💳 Potong Piutang Toko (Otomatis Kurangi Hutang & Tandai Lunas)' },
                        { value: 'refund_cash', label: '💵 Refund Tunai / Cash (Uang Kembali ke Toko)' },
                        { value: 'store_credit', label: '🏦 Deposit / Kredit Toko (Untuk Pembelian Berikutnya)' },
                      ]}
                    />
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full h-12 bg-orange-600 hover:bg-orange-500 font-bold text-white rounded-xl shadow-lg shadow-orange-600/30 transition-all mt-2 cursor-pointer"
                >
                  Simpan Retur Produk
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CustomSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full bg-[#121824] border ${open ? 'border-orange-500 ring-1 ring-orange-500/50' : 'border-slate-800'} rounded-xl px-3.5 py-2.5 text-left text-xs text-white flex items-center justify-between transition-all cursor-pointer outline-none`}
      >
        <span className={`truncate ${selected && selected.value !== '' ? 'text-white font-bold' : 'text-slate-500 font-normal'}`}>
          {selected && selected.value !== '' ? selected.label : placeholder || 'Pilih...'}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2 ${open ? 'rotate-180 text-orange-500' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#161D2B] border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-800/40"
            >
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    value === opt.value
                      ? 'bg-orange-600/15 text-orange-400 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white font-medium'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <Check size={14} className="text-orange-500 flex-shrink-0 ml-2" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
