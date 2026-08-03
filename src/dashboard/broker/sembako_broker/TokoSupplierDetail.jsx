import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Phone, MapPin, Star, Building2, Store, Package, 
  ChevronRight, Calculator, CheckCircle2, 
  Calendar, Info, AlertCircle, Trash2, Edit,
  Wallet, Receipt, ChevronDown, Check, Plus, Filter,
  TrendingDown, TrendingUp, History
} from 'lucide-react'
import { toWaLink } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import {
  useSembakoCustomers, useSembakoSuppliers,
  useSembakoCustomerInvoices, useSembakoCustomerPayments,
  useSembakoSupplierInvoices, useRecordSembakoPayment,
  useSembakoSupplierPayments, useRecordSembakoSupplierPayment
} from '@/lib/hooks/useSembakoData'
import { 
  formatIDR, formatDate,
  formatIDRShort
} from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { InputRupiah } from '@/components/ui/InputRupiah'
import { useAuth } from '@/lib/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import EmptyState from '@/components/EmptyState'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"

// ── Palette Sembako Premium ───────────────────────────────────────────────────
const C = {
  bg: '#06090F', card: '#111C24', accent: '#EA580C', 
  green: '#021a02', red: '#F87171', amber: '#F59E0B',
  muted: '#4B6478', text: '#F1F5F9', border: 'rgba(255,255,255,0.06)'
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } }
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } 
  }
}

export default function SembakoTokoSupplierDetail() {
  const { type, id } = useParams() // type: 'customer' | 'supplier'
  const isCustomer = type === 'customer'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  useAuth()
  
  // Data Queries
  const { data: allCustomers } = useSembakoCustomers()
  const { data: allSuppliers } = useSembakoSuppliers()
  
  const profileData = useMemo(() => {
    if (isCustomer) return allCustomers?.find(c => c.id === id)
    return allSuppliers?.find(s => s.id === id)
  }, [allCustomers, allSuppliers, id, isCustomer])

  const { data: customerInvoices, isLoading: loadingCInvoices } = useSembakoCustomerInvoices(isCustomer ? id : null)
  const { data: customerPayments } = useSembakoCustomerPayments(isCustomer ? id : null)
  const { data: supplierInvoices, isLoading: loadingSInvoices } = useSembakoSupplierInvoices(!isCustomer ? id : null)
  const { data: supplierPayments } = useSembakoSupplierPayments(!isCustomer ? id : null)

  const [openModal, setOpenModal] = useState(null) // 'bayar' | 'edit'
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  const supplierTotalHutang = useMemo(() => {
    if (isCustomer) return 0;
    const totalCost = supplierInvoices?.reduce((s, b) => s + (b.total_cost || 0), 0) || 0;
    const totalPaid = supplierPayments?.reduce((s, p) => s + (p.amount || 0), 0) || 0;
    return Math.max(0, totalCost - totalPaid);
  }, [isCustomer, supplierInvoices, supplierPayments])

  if (!profileData && !loadingCInvoices && !loadingSInvoices) {
    return (
      <div className="bg-[#06090F] min-h-screen flex items-center justify-center p-6">
        <EmptyState 
          icon={AlertCircle} 
          title="Data Tidak Ditemukan" 
          description="Link mungkin sudah kedaluwarsa atau data telah dihapus."
          action={<Button onClick={() => navigate('../')} className="bg-[#EA580C]">Kembali</Button>}
        />
      </div>
    )
  }

  const outstanding = isCustomer ? profileData?.total_outstanding : 0
  const activeCount = isCustomer ? customerInvoices?.filter(i => i.payment_status !== 'lunas').length : 0

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="bg-[#06090F] min-h-screen pb-24 text-left"
    >
      {/* Header Premium */}
      <header className="px-5 pt-10 pb-4 flex items-center justify-between sticky top-0 bg-[#06090F]/90 backdrop-blur-md z-40 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white active:scale-95 transition-transform">
            <ArrowLeft size={18} />
          </button>
          <div className="space-y-0.5">
            <h1 className="font-display text-lg font-black text-white tracking-tight leading-none uppercase truncate max-w-[200px]">
              {profileData?.customer_name || profileData?.supplier_name}
            </h1>
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-[0.15em] flex items-center gap-1.5">
              {isCustomer ? <Store size={10} className="text-amber-500" /> : <Package size={10} className="text-emerald-400" />}
              {isCustomer ? 'Toko / Customer' : 'Supplier / Agen'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpenModal('edit')} className="text-slate-400 hover:text-white rounded-xl">
          <Edit size={18} />
        </Button>
      </header>

      <div className="px-5 pt-4 space-y-4 max-w-2xl mx-auto">
        {/* Profile Card */}
        <Card className="bg-[#111C24] border-white/5 rounded-[24px] p-5 shadow-xl">
          <div className="flex gap-4 items-center">
            <Avatar className="w-16 h-16 rounded-[20px] bg-[#EA580C]/10 border border-[#EA580C]/20 shadow-inner">
              <AvatarFallback className="bg-transparent text-[#EA580C] font-display font-black text-2xl">
                {(profileData?.customer_name || profileData?.supplier_name)?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-white text-xl tracking-tight leading-none uppercase">
                  {profileData?.customer_name || profileData?.supplier_name}
                </h2>
                {isCustomer && (
                  <Badge className="bg-white/5 text-[#94A3B8] border-white/10 text-[9px] uppercase font-black px-2 py-0.5 rounded-md">
                    {profileData?.customer_type}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <a href={`tel:${profileData?.phone}`} className="flex items-center gap-1.5 text-[11px] font-black text-[#4B6478] hover:text-[#EA580C] transition-colors">
                  <Phone size={11} /> {profileData?.phone || 'No Phone'}
                </a>
                <span className="text-white/5">•</span>
                <div className="flex items-center gap-1.5 text-[11px] font-black text-[#4B6478]">
                   <Star size={11} className="fill-amber-400 text-amber-400" />
                   <span>{profileData?.reliability_score || 5}.0 Reliabilitas</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-white/5 my-5" />

          <div className="grid grid-cols-2 gap-y-4 gap-x-2">
             <DetailInfo label="Alamat" value={profileData?.address || 'N/A'} />
             <DetailInfo label="Area" value={profileData?.area || 'N/A'} />
             {isCustomer && <DetailInfo label="Terms" value={profileData?.payment_terms?.toUpperCase() || 'CASH'} />}
             {isCustomer && <DetailInfo label="Limit Kredit" value={formatIDRShort(profileData?.credit_limit || 0)} />}
          </div>
          
          <div className="mt-6">
            <Button asChild className="w-full bg-[#EA580C] hover:bg-[#D44E0A] h-12 rounded-2xl font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-orange-950/20 active:scale-[0.98]">
              <a href={toWaLink(profileData?.phone) || '#'} target="_blank" rel="noreferrer">
                Hubungi via WhatsApp
              </a>
            </Button>
          </div>
        </Card>

        {/* Financial Summary */}
        {isCustomer ? (
          <Card className={cn(
            "rounded-[24px] p-5 flex flex-col gap-4 border-none shadow-2xl relative overflow-hidden",
            outstanding > 0 ? "bg-red-500/5 ring-1 ring-red-500/20" : "bg-emerald-500/5 ring-1 ring-emerald-500/20"
          )}>
            <div className="flex justify-between items-start">
               <div className="space-y-1">
                 <p className={cn("text-[10px] font-black uppercase tracking-widest leading-none", outstanding > 0 ? "text-red-400" : "text-emerald-400")}>
                   Saldo Piutang Aktif
                 </p>
                 <p className={cn("font-display text-3xl font-black tracking-tight", outstanding > 0 ? "text-red-500" : "text-emerald-500")}>
                   {formatIDR(outstanding)}
                 </p>
               </div>
               <div className={cn("p-3 rounded-2xl", outstanding > 0 ? "bg-red-500/10" : "bg-emerald-500/10")}>
                  {outstanding > 0 ? <TrendingDown size={20} className="text-red-400" /> : <TrendingUp size={20} className="text-emerald-400" />}
               </div>
            </div>
            {outstanding > 0 && <p className="text-[11px] font-black text-red-400/60 uppercase tracking-wider leading-none">{activeCount} Invoice Belum Lunas</p>}
          </Card>
        ) : (
          <Card className="bg-[#111C24] border-white/5 rounded-[24px] p-5 flex flex-col gap-1 border-none shadow-2xl">
             <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest leading-none mb-1">Total Pembelian Stok</p>
             <p className="font-display text-3xl font-black text-white tracking-tight">
               {formatIDR(supplierInvoices?.reduce((acc, b) => acc + (b.total_cost || 0), 0) || 0)}
             </p>
              <p className="text-[11px] font-black text-[#4B6478] uppercase tracking-wider leading-none mt-1">{supplierInvoices?.length || 0} Batch Masuk</p>
              
              <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <p className="text-[9px] font-black text-[#4B6478] uppercase">Terbayar</p>
                   <p className="text-sm font-black text-emerald-400">{formatIDR(supplierPayments?.reduce((s, p) => s + (p.amount || 0), 0) || 0)}</p>
                 </div>
                 <div className="space-y-1">
                   <p className="text-[9px] font-black text-[#4B6478] uppercase">Sisa Hutang</p>
                   <p className="text-sm font-black text-red-500">
                     {formatIDR(supplierTotalHutang)}
                   </p>
                 </div>
              </div>
           </Card>
        )}

        {/* Activity Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="log" className="w-full">
            <div className="flex items-end justify-between px-1 mb-4">
              <h3 className="font-display font-black text-white text-lg tracking-tight uppercase leading-none">Riwayat Aktivitas</h3>
              <TabsList className="bg-[#111C24] border border-white/5 h-10 p-1 rounded-xl">
                <TabsTrigger value="log" className="text-[10px] font-black uppercase px-4 data-[state=active]:bg-[#EA580C] data-[state=active]:text-white">Log</TabsTrigger>
                <TabsTrigger value="pembayaran" className="text-[10px] font-black uppercase px-4 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Bayar</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="log" className="mt-0 space-y-3">
              {isCustomer ? (
                <CustomerInvoiceList 
                  invoices={customerInvoices} 
                  onPay={(inv) => { setSelectedInvoice(inv); setOpenModal('bayar') }} 
                />
              ) : (
                <SupplierBatchList batches={supplierInvoices} />
              )}
            </TabsContent>

            <TabsContent value="pembayaran" className="mt-0 space-y-3">
               <div className="mb-4">
                  <Button onClick={() => setOpenModal('bayar')} className={cn("w-full h-11 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg", isCustomer ? "bg-emerald-500" : "bg-red-500")}>
                    <Plus size={16} /> {isCustomer ? 'Terima Pembayaran' : 'Catat Bayar Supplier'}
                  </Button>
               </div>
               <PaymentHistory payments={isCustomer ? customerPayments : supplierPayments} isCustomer={isCustomer} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      <Sheet open={openModal === 'bayar'} onOpenChange={(v) => !v && setOpenModal(null)}>
        <SheetContent side="right" className="bg-[#06090F] border-white/5 text-left p-6 overflow-y-auto">
           <SheetHeader className="mb-6">
             <SheetTitle className="font-display font-black text-white uppercase text-xl text-left">Catat Pembayaran</SheetTitle>
             <SheetDescription className="sr-only">Form untuk mencatat pembayaran sembako.</SheetDescription>
           </SheetHeader>
           {selectedInvoice || !isCustomer ? (
             <PaymentForm 
               invoice={selectedInvoice} 
               isCustomer={isCustomer}
               parentId={id}
               maxAmount={isCustomer ? selectedInvoice?.remaining_amount : supplierTotalHutang}
               onClose={() => { setOpenModal(null); queryClient.invalidateQueries() }} 
             />
           ) : (
             <p className="text-center py-10 text-[#4B6478] font-bold text-xs uppercase">Pilih nota di tab Tagihan</p>
           )}
        </SheetContent>
      </Sheet>

      <Sheet open={openModal === 'edit'} onOpenChange={(v) => !v && setOpenModal(null)}>
        <SheetContent side="right" className="bg-[#06090F] border-white/5 text-left p-6">
           <SheetHeader className="mb-6 text-left">
             <SheetTitle className="font-display font-black text-white uppercase text-xl text-left">Edit Data</SheetTitle>
             <SheetDescription className="sr-only">Form untuk memperbarui profil customer atau supplier sembako.</SheetDescription>
           </SheetHeader>
           {/* Form Edit reuse common logic */}
        </SheetContent>
      </Sheet>
    </motion.div>
  )
}

function DetailInfo({ label, value }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[9px] font-black text-[#4B6478] uppercase tracking-widest">{label}</p>
      <p className="text-[13px] font-bold text-white truncate uppercase tracking-tight">{value}</p>
    </div>
  )
}

function CustomerInvoiceList({ invoices, onPay }) {
  if (!invoices?.length) return <EmptyState icon={Receipt} title="Belum ada transaksi" description="Transaksi penjualan akan muncul di sini." />
  
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
      {invoices.map(inv => (
        <motion.div key={inv.id} variants={fadeUp}>
          <Card className="bg-[#111C24] border-white/5 rounded-3xl p-4 flex flex-col gap-3 shadow-md active:bg-white/[0.02] transition-colors">
             <div className="flex justify-between items-start">
               <div className="space-y-1">
                 <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">{formatDate(inv.transaction_date)}</p>
                 <p className="text-sm font-black text-white uppercase tracking-tight leading-none">{inv.invoice_number}</p>
               </div>
               <Badge className={cn(
                 "border-none rounded-lg text-[9px] font-black uppercase px-2 h-6",
                 inv.payment_status === 'lunas' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-500"
               )}>
                 {inv.payment_status}
               </Badge>
             </div>

             <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-[#4B6478] uppercase">Total Tagihan</p>
                  <p className="font-black text-base text-white tabular-nums leading-none">
                    {formatIDR(inv.total_amount)}
                  </p>
                </div>
                {inv.payment_status !== 'lunas' && (
                  <Button onClick={() => onPay(inv)} size="sm" className="bg-white/5 hover:bg-white/10 text-[#EA580C] text-[10px] font-black h-8 px-4 rounded-xl border border-white/5">
                    BAYAR
                  </Button>
                )}
             </div>

             {inv.remaining_amount > 0 && inv.remaining_amount !== inv.total_amount && (
               <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px]">
                 <span className="font-bold text-[#4B6478] uppercase">Sisa Piutang:</span>
                 <span className="font-black text-red-400 tabular-nums">{formatIDR(inv.remaining_amount)}</span>
               </div>
             )}
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

function SupplierBatchList({ batches }) {
  if (!batches?.length) return <EmptyState icon={History} title="Belum ada stok masuk" description="Riwayat pembelian dari supplier akan muncul di sini." />
  
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
      {batches.map(batch => (
        <motion.div key={batch.id} variants={fadeUp}>
           <Card className="bg-[#111C24] border-white/5 rounded-3xl p-4 space-y-3 shadow-md">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                   <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">{formatDate(batch.purchase_date)}</p>
                   <p className="text-sm font-black text-white uppercase tracking-tight leading-none">{batch.sembako_products?.product_name}</p>
                 </div>
                 <Badge className="bg-white/5 text-[#94A3B8] border-none text-[10px] font-black h-6 px-2 rounded-lg">
                   {batch.qty_masuk} {batch.sembako_products?.unit}
                 </Badge>
              </div>
              <div className="flex justify-between items-center pt-1">
                 <div className="space-y-0.5">
                   <p className="text-[9px] font-bold text-[#4B6478] uppercase">Nilai Transaksi</p>
                   <p className="font-black text-base text-white tabular-nums leading-none">{formatIDR(batch.total_cost)}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[9px] font-bold text-[#4B6478] uppercase">Sisa Stok</p>
                   <p className={cn("font-black text-sm tabular-nums leading-none", batch.qty_sisa > 0 ? "text-emerald-400" : "text-[#4B6478]")}>
                     {batch.qty_sisa} {batch.sembako_products?.unit}
                   </p>
                 </div>
              </div>
           </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}

function PaymentHistory({ payments, isCustomer }) {
  if (!payments?.length) return <EmptyState icon={Wallet} title="Belum ada riwayat bayar" description="Semua cicilan dan pelunasan akan tercatat di sini." />

  return (
    <div className="space-y-3">
      {payments.map(p => (
        <Card key={p.id} className="bg-[#111C24] border-white/5 rounded-3xl p-4 flex justify-between items-center shadow-md">
           <div className="space-y-1">
              <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">{formatDate(p.payment_date)}</p>
              {isCustomer && <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-tight">Kredit: {p.sembako_sales?.invoice_number}</p>}
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black text-[#4B6478] uppercase mb-0.5">{p.payment_method}</p>
              <p className={cn("font-black text-base tabular-nums leading-none", isCustomer ? "text-emerald-400" : "text-red-400")}>
                {isCustomer ? '+' : '-'}{formatIDR(p.amount)}
              </p>
           </div>
        </Card>
      ))}
    </div>
  )
}

function PaymentForm({ invoice, isCustomer, parentId, maxAmount, onClose }) {
  const recordCustomerPayment = useRecordSembakoPayment()
  const recordSupplierPayment = useRecordSembakoSupplierPayment()
  
  // Clamp initial value agar tidak melebihi maxAmount
  const safeMax = maxAmount ?? Infinity
  const [amount, setAmount] = useState(() => Math.min(maxAmount || 0, safeMax))
  const [method, setMethod] = useState('transfer')
  const [refNo, setRefNo] = useState('')
  const [loading, setLoading] = useState(false)

  // Real-time overpay detection
  const isOverpay = maxAmount !== undefined && maxAmount !== null && amount > maxAmount
  const isZeroDebt = !isCustomer && (maxAmount === 0 || maxAmount === null || maxAmount === undefined)

  const handlePay = async () => {
    if (amount <= 0) {
      toast.error('Nominal tidak valid (harus > Rp 0)')
      return
    }
    // Guard: tidak ada hutang
    if (isZeroDebt) {
      toast.error('Tidak ada sisa hutang ke supplier ini')
      return
    }
    // Guard: overpay
    if (isOverpay) {
      toast.error(`Nominal melebihi sisa hutang (${formatIDR(maxAmount)})`)
      return
    }
    setLoading(true)
    try {
      if (isCustomer) {
        await recordCustomerPayment.mutateAsync({
          sale_id: invoice.id,
          customer_id: parentId,
          amount,
          payment_method: method,
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: refNo || null,
        })
      } else {
        await recordSupplierPayment.mutateAsync({
          supplier_id: parentId,
          amount,
          payment_method: method,
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: refNo || null,
          notes: `Bayar hutang supplier`
        })
      }
      onClose()
    } catch (_err) { // payment errors surfaced via UI state; swallow here
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 pt-4">
        <div className={cn("text-center space-y-1 p-6 rounded-[24px] border", isCustomer ? "bg-red-500/5 border-red-500/10" : "bg-emerald-500/5 border-emerald-500/10")}>
          <p className={cn("text-[10px] font-black uppercase tracking-widest leading-none mb-1", isCustomer ? "text-red-400" : "text-emerald-400")}>
            {isCustomer ? 'Sisa Tagihan Nota' : 'Total Sisa Hutang'}
          </p>
          <p className={cn("font-display text-4xl font-black tracking-tight tabular-nums", isCustomer ? "text-red-500" : "text-emerald-500")}>
            {formatIDR(maxAmount || 0)}
          </p>
          {/* Peringatan jika hutang sudah lunas */}
          {isZeroDebt && (
            <p className="text-[11px] font-black text-emerald-400 mt-1">✅ Tidak ada hutang ke supplier ini</p>
          )}
       </div>

       <div className="space-y-6">
          <div className="space-y-2">
            <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478] ml-2">Jumlah (Rp)</Label>
            <InputRupiah 
              value={amount} 
              onChange={setAmount}
              className={cn(
                "bg-[#111C24] h-16 text-2xl font-black text-white rounded-2xl transition-all",
                isOverpay
                  ? "border-red-500/50 focus:ring-red-500/20"
                  : "border-white/10 focus:ring-[#EA580C]/20"
              )}
            />
            {/* Real-time overpay feedback */}
            {isOverpay && (
              <p className="text-[11px] font-black text-red-400 ml-2 flex items-center gap-1.5">
                🚨 Melebihi sisa hutang sebesar {formatIDR(amount - maxAmount)}
              </p>
            )}
            {/* Lunas indicator */}
            {!isOverpay && amount > 0 && maxAmount !== undefined && amount === maxAmount && (
              <p className="text-[11px] font-black text-emerald-400 ml-2 flex items-center gap-1.5">
                ✅ Pas — hutang akan lunas setelah pembayaran ini
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478] ml-2">Metode</Label>
            <div className="flex gap-2">
              {['transfer', 'cash', 'qris'].map(m => (
                <button 
                  key={m} 
                  type="button"
                  onClick={() => setMethod(m)}
                  className={cn(
                    "flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                    method === m ? (isCustomer ? "bg-[#EA580C]" : "bg-red-500") + " text-white shadow-lg shadow-orange-950/40" : "bg-white/5 text-[#4B6478] border border-white/5"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="uppercase text-[10px] font-black tracking-widest text-[#4B6478] ml-2">No. Referensi (Opsional)</Label>
            <input 
              value={refNo} 
              onChange={e => setRefNo(e.target.value)}
              placeholder="Contoh: REF123..."
              className="w-full bg-[#111C24] border-white/10 h-14 px-4 text-sm font-bold text-white rounded-2xl focus:ring-[#EA580C]/20 border focus:border-[#EA580C]/40 outline-none transition-all"
            />
          </div>

          <div className="pt-4">
             <Button 
               onClick={handlePay} 
               disabled={loading || isOverpay || isZeroDebt || amount <= 0}
               className={cn(
                 "w-full h-16 rounded-2xl text-sm font-black border-none shadow-xl uppercase tracking-[0.2em] transition-all active:scale-95 text-white",
                 (isOverpay || isZeroDebt || amount <= 0)
                   ? "bg-white/10 text-white/30 cursor-not-allowed"
                   : isCustomer ? "bg-emerald-500" : "bg-red-500"
               )}
             >
               {loading ? 'Memproses...' : isOverpay ? 'Nominal Terlalu Besar' : isZeroDebt ? 'Hutang Sudah Lunas' : 'Konfirmasi Catat'}
             </Button>
          </div>
       </div>
    </div>
  )
}
