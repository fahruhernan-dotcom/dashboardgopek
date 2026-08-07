import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Phone, MapPin, Star, Building2, Store, Package,
  ChevronRight, Calculator, CheckCircle2,
  Calendar, Info, AlertCircle, Trash2, Edit,
  Wallet, Receipt, ChevronDown, Check, Plus, Filter,
  TrendingDown, TrendingUp, History, MessageCircle, ExternalLink, ShieldCheck, CreditCard, Sparkles
} from 'lucide-react'
import { toWaLink } from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'
import {
  useSembakoCustomers, useSembakoSuppliers,
  useSembakoCustomerInvoices, useSembakoCustomerPayments,
  useSembakoSupplierInvoices, useRecordSembakoPayment,
  useSembakoSupplierPayments, useRecordSembakoSupplierPayment,
  useUpdateSembakoCustomer, useUpdateSembakoSupplier
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
  const { data: allCustomers, isLoading: loadingCustomers } = useSembakoCustomers()
  const { data: allSuppliers, isLoading: loadingSuppliers } = useSembakoSuppliers()

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

  if (!profileData && !loadingCustomers && !loadingSuppliers && !loadingCInvoices && !loadingSInvoices) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen flex items-center justify-center p-6 text-slate-900">
        <EmptyState
          icon={AlertCircle}
          title="Data Tidak Ditemukan"
          description="Link mungkin sudah kedaluwarsa atau data telah dihapus."
          action={<Button onClick={() => navigate('../')} className="bg-[#0F172A] hover:bg-slate-900 rounded-xl font-bold !text-white border-none">Kembali</Button>}
        />
      </div>
    )
  }

  const outstanding = isCustomer 
    ? (customerInvoices || []).reduce((sum, inv) => sum + (Number(inv.remaining_amount) || 0), 0)
    : 0
  const activeCount = isCustomer ? customerInvoices?.filter(i => i.remaining_amount > 0).length : 0

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="bg-[#F8FAFC] min-h-screen pb-24 text-slate-900 selection:bg-slate-200 selection:text-slate-800"
    >
      {/* Dynamic Background Glow (Removed in Minimalist Light Mode) */}

      {/* Header Bar */}
      <header className="px-4 sm:px-8 py-5 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-40 border-b border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all active:scale-95 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-[#0F172A] tracking-widest uppercase bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {isCustomer ? 'Toko / Customer' : 'Supplier / Agen'}
              </span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase truncate max-w-[280px] sm:max-w-md">
              {profileData?.customer_name || profileData?.supplier_name || 'Loading...'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenModal('edit')}
            className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl font-bold text-xs gap-2 px-3.5 h-10 shadow-sm"
          >
            <Edit size={14} className="text-slate-600" />
            <span className="hidden sm:inline">Edit Profil</span>
          </Button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="px-4 sm:px-8 pt-6 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Column: Profile Card & Actions */}
          <div className="lg:col-span-5 space-y-6">

            {/* Main Profile Card */}
            <Card className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm relative overflow-hidden group">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm shrink-0">
                  <AvatarFallback className="bg-transparent text-slate-700 font-display font-black text-2xl tracking-wider">
                    {(profileData?.customer_name || profileData?.supplier_name || 'TS')?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display font-black text-slate-900 text-xl sm:text-2xl tracking-tight leading-tight uppercase truncate">
                      {profileData?.customer_name || profileData?.supplier_name}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {isCustomer && (
                      <Badge className="bg-slate-100 text-slate-750 border border-slate-200 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg shadow-none">
                        {profileData?.customer_type || 'Toko'}
                      </Badge>
                    )}
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200/50 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-none">
                      <Star size={10} className="fill-amber-500 text-amber-500" />
                      <span>{profileData?.reliability_score || 5}.0 Rating</span>
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-100 my-5" />

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Phone size={12} className="text-slate-500" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">No. HP / WA</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {profileData?.phone || '-'}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin size={12} className="text-emerald-600" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Area / Wilayah</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {profileData?.area || 'Utama'}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <ShieldCheck size={12} className="text-blue-600" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Termin Bayar</span>
                  </div>
                  <p className="text-sm font-extrabold text-blue-700 uppercase">
                    {profileData?.payment_terms || 'CASH'}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <CreditCard size={12} className="text-purple-650" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Limit Kredit</span>
                  </div>
                  <p className="text-sm font-extrabold text-purple-700">
                    {profileData?.credit_limit ? formatIDRShort(profileData.credit_limit) : 'Rp 0'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 mt-4 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Building2 size={12} className="text-slate-500" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Alamat Lengkap</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 line-clamp-2 leading-relaxed">
                  {profileData?.address || 'Belum ada catatan alamat'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-2">
                <Button
                  asChild
                  className="w-full bg-[#0F172A] hover:bg-slate-900 !text-white h-13 rounded-2xl font-black text-xs uppercase tracking-widest gap-2.5 shadow-md border-none active:scale-[0.98] transition-all"
                >
                  <a href={toWaLink(profileData?.phone) || '#'} target="_blank" rel="noreferrer">
                    <MessageCircle size={18} className="fill-white/10" />
                    Hubungi via WhatsApp
                    <ExternalLink size={14} className="opacity-70 ml-auto" />
                  </a>
                </Button>
              </div>
            </Card>

          </div>

          {/* Right Column: Financial Summary & Transaction Logs */}
          <div className="lg:col-span-7 space-y-6">

            {/* Financial Summary Card */}
            {isCustomer ? (
              <Card className="rounded-[28px] p-6 border border-slate-200 bg-white shadow-sm relative overflow-hidden transition-all duration-300">
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        outstanding > 0 ? "bg-rose-500" : "bg-emerald-500"
                      )} />
                      <p className={cn(
                        "text-xs font-black uppercase tracking-widest leading-none",
                        outstanding > 0 ? "text-rose-600" : "text-emerald-600"
                      )}>
                        Saldo Piutang Toko Aktif
                      </p>
                    </div>
                    <p className={cn(
                      "font-display text-4xl sm:text-5xl font-black tracking-tight tabular-nums pt-1",
                      outstanding > 0 ? "text-rose-600" : "text-emerald-600"
                    )}>
                      {formatIDR(outstanding)}
                    </p>
                  </div>

                  <div className={cn(
                    "p-4 rounded-2xl border shrink-0",
                    outstanding > 0 ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100"
                  )}>
                    {outstanding > 0
                      ? <TrendingDown size={28} className="text-rose-600" />
                      : <TrendingUp size={28} className="text-emerald-600" />
                    }
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>{activeCount} Nota Belum Lunas</span>
                  <span className="text-slate-650">
                    Status: <strong className={outstanding > 0 ? "text-rose-600" : "text-emerald-600"}>
                      {outstanding > 0 ? 'Ada Piutang' : 'Lunas Bersih'}
                    </strong>
                  </span>
                </div>
              </Card>
            ) : (
              <Card className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm relative overflow-hidden">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Total Belanja Stok Supplier</p>
                <p className="font-display text-4xl sm:text-5xl font-black text-slate-900 tracking-tight tabular-nums">
                  {formatIDR(supplierInvoices?.reduce((acc, b) => acc + (b.total_cost || 0), 0) || 0)}
                </p>

                <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Terbayar</p>
                    <p className="text-base font-black text-emerald-600 tabular-nums">
                      {formatIDR(supplierPayments?.reduce((s, p) => s + (p.amount || 0), 0) || 0)}
                    </p>
                  </div>
                  <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Sisa Hutang</p>
                    <p className="text-base font-black text-rose-600 tabular-nums">
                      {formatIDR(supplierTotalHutang)}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Activity Tabs */}
            <Card className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm">
              <Tabs defaultValue="log" className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-display font-black text-slate-900 text-xl tracking-tight uppercase leading-none flex items-center gap-2">
                      <History size={20} className="text-slate-700" />
                      Riwayat Aktivitas & Transaksi
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Daftar invoice, retur, dan catatan pembayaran</p>
                  </div>

                  <TabsList className="bg-slate-100 border border-slate-200/60 h-11 p-1 rounded-2xl self-start sm:self-auto">
                    <TabsTrigger value="log" className="text-xs font-bold uppercase px-4 h-9 rounded-xl text-slate-650 data-[state=active]:bg-[#0F172A] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                      Tagihan / Stok
                    </TabsTrigger>
                    <TabsTrigger value="pembayaran" className="text-xs font-bold uppercase px-4 h-9 rounded-xl text-slate-650 data-[state=active]:bg-[#0F172A] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
                      Pembayaran
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="log" className="mt-0 space-y-4">
                  {isCustomer ? (
                    <CustomerInvoiceList
                      invoices={customerInvoices}
                      onPay={(inv) => { setSelectedInvoice(inv); setOpenModal('bayar') }}
                    />
                  ) : (
                    <SupplierBatchList batches={supplierInvoices} />
                  )}
                </TabsContent>

                <TabsContent value="pembayaran" className="mt-0 space-y-4">
                  <div className="mb-4">
                    <Button
                      onClick={() => setOpenModal('bayar')}
                      className="w-full h-12 rounded-2xl bg-[#0F172A] hover:bg-slate-900 !text-white font-black text-xs uppercase tracking-widest gap-2 shadow-md border-none active:scale-[0.98] transition-all"
                    >
                      <Plus size={16} /> {isCustomer ? 'Terima Pembayaran Piutang' : 'Catat Bayar Hutang Supplier'}
                    </Button>
                  </div>
                  <PaymentHistory payments={isCustomer ? customerPayments : supplierPayments} isCustomer={isCustomer} />
                </TabsContent>
              </Tabs>
            </Card>

          </div>

        </div>
      </main>

      {/* Sheets / Modals */}
      <Sheet open={openModal === 'bayar'} onOpenChange={(v) => { if (!v) { setOpenModal(null); setSelectedInvoice(null); } }}>
        <SheetContent side="right" className="bg-white border-slate-200 text-left p-6 sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-display font-black text-slate-900 uppercase text-xl text-left flex items-center gap-2">
              <Wallet size={22} className="text-slate-800" />
              Catat Pembayaran
            </SheetTitle>
            <SheetDescription className="sr-only">Form untuk mencatat pembayaran sembako.</SheetDescription>
          </SheetHeader>
          {selectedInvoice || !isCustomer ? (
            <PaymentForm
              key={selectedInvoice?.id || 'supplier'}
              invoice={selectedInvoice}
              isCustomer={isCustomer}
              parentId={id}
              maxAmount={isCustomer ? selectedInvoice?.remaining_amount : supplierTotalHutang}
              onClose={() => { setOpenModal(null); setSelectedInvoice(null); queryClient.invalidateQueries() }}
            />
          ) : (
            <div className="text-center py-12 space-y-3">
              <Receipt size={40} className="mx-auto text-slate-500 opacity-50" />
              <p className="text-slate-400 font-bold text-xs uppercase">Pilih nota/invoice di tab Tagihan terlebih dahulu</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={openModal === 'edit'} onOpenChange={(v) => !v && setOpenModal(null)}>
        <SheetContent side="right" className="bg-white border-slate-200 text-left p-6 sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6 text-left">
            <SheetTitle className="font-display font-black text-slate-900 uppercase text-xl text-left flex items-center gap-2">
              <Edit size={20} className="text-slate-800" />
              Edit Profil {isCustomer ? 'Toko' : 'Supplier'}
            </SheetTitle>
            <SheetDescription className="sr-only">Form untuk memperbarui profil customer atau supplier sembako.</SheetDescription>
          </SheetHeader>
          <EditProfileForm
            key={profileData?.id || 'edit'}
            profile={profileData}
            isCustomer={isCustomer}
            onClose={() => { setOpenModal(null); queryClient.invalidateQueries() }}
          />
        </SheetContent>
      </Sheet>
    </motion.div>
  )
}

function CustomerInvoiceList({ invoices, onPay }) {
  if (!invoices?.length) {
    return (
      <EmptyState
        icon={Receipt}
        title="Belum ada transaksi"
        description="Transaksi penjualan dengan toko ini akan tercatat otomatis di sini."
      />
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
      {invoices.map(inv => {
        const telahDibayar = inv.total_amount - inv.remaining_amount
        return (
          <motion.div key={inv.id} variants={fadeUp}>
            <Card className="bg-slate-50 border-slate-200/60 hover:border-slate-300 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300">
              {/* Header: Date, Invoice number & Status Badge */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{inv.invoice_number}</p>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-3.5">
                    {formatDate(inv.transaction_date)}
                  </p>
                </div>
                <Badge className={cn(
                  "border-none rounded-lg text-[10px] font-black uppercase px-2.5 py-1 tracking-wider shadow-none",
                  inv.payment_status === 'lunas' ? "bg-emerald-50 text-emerald-700 border border-emerald-250/30" :
                  inv.payment_status === 'sebagian' ? "bg-amber-50 text-amber-700 border border-amber-250/30" :
                  "bg-rose-50 text-rose-700 border border-rose-250/30"
                )}>
                  {inv.payment_status?.replace('_', ' ')}
                </Badge>
              </div>

              {/* Financial Details Box */}
              <div className="bg-white border border-slate-100 rounded-xl p-3.5 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Total Tagihan</span>
                  <span className="font-black text-slate-800 tabular-nums">{formatIDR(inv.total_amount)}</span>
                </div>
                
                {telahDibayar > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">Telah Dibayar</span>
                    <span className="font-bold text-emerald-600 tabular-nums">{formatIDR(telahDibayar)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="font-black text-slate-700">Sisa Piutang</span>
                  <span className={cn("font-black text-sm tabular-nums", inv.remaining_amount > 0 ? "text-rose-600" : "text-emerald-600")}>
                    {formatIDR(inv.remaining_amount)}
                  </span>
                </div>
              </div>

              {/* Pay Action Button */}
              {inv.payment_status !== 'lunas' && (
                <Button 
                  onClick={() => onPay(inv)} 
                  className="w-full bg-[#0F172A] hover:bg-slate-900 !text-white text-xs font-black h-10 rounded-xl shadow-sm border-none transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <CreditCard size={14} />
                  BAYAR PIUTANG
                </Button>
              )}
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

function SupplierBatchList({ batches }) {
  if (!batches?.length) {
    return (
      <EmptyState
        icon={History}
        title="Belum ada stok masuk"
        description="Riwayat pembelian dari supplier akan muncul di sini."
      />
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
      {batches.map(batch => (
        <motion.div key={batch.id} variants={fadeUp}>
          <Card className="bg-slate-50 border border-slate-200/60 hover:border-slate-300 rounded-2xl p-4.5 space-y-3 shadow-sm transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{formatDate(batch.purchase_date)}</p>
                <p className="text-base font-black text-slate-900 uppercase tracking-tight">{batch.sembako_products?.product_name || 'Produk'}</p>
              </div>
              <Badge className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-none">
                {batch.qty_masuk} {batch.sembako_products?.unit || 'Unit'}
              </Badge>
            </div>

            <div className="flex justify-between items-center pt-1">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Nilai Pembelian</p>
                <p className="font-black text-base text-slate-900 tabular-nums leading-none">{formatIDR(batch.total_cost)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Sisa Stok Batch</p>
                <p className={cn("font-black text-sm tabular-nums leading-none", batch.qty_sisa > 0 ? "text-emerald-600" : "text-slate-450")}>
                  {batch.qty_sisa} {batch.sembako_products?.unit || 'Unit'}
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
  if (!payments?.length) {
    return (
      <EmptyState
        icon={Wallet}
        title="Belum ada riwayat bayar"
        description="Semua cicilan dan pelunasan akan tercatat di sini."
      />
    )
  }

  return (
    <div className="space-y-3">
      {payments.map(p => (
        <Card key={p.id} className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex justify-between items-center shadow-sm">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{formatDate(p.payment_date)}</p>
            {isCustomer && <p className="text-xs font-bold text-slate-700 uppercase">Nota: {p.sembako_sales?.invoice_number || '-'}</p>}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase mb-0.5">{p.payment_method || 'Cash'}</p>
            <p className={cn("font-black text-base tabular-nums leading-none", isCustomer ? "text-emerald-600" : "text-rose-600")}>
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

  const safeMax = maxAmount ?? Infinity
  const [amount, setAmount] = useState(() => Math.min(maxAmount || 0, safeMax))
  const [method, setMethod] = useState('transfer')
  const [refNo, setRefNo] = useState('')
  const [loading, setLoading] = useState(false)

  const isOverpay = maxAmount !== undefined && maxAmount !== null && amount > maxAmount
  const isZeroDebt = !isCustomer && (maxAmount === 0 || maxAmount === null || maxAmount === undefined)

  const handlePay = async () => {
    if (amount <= 0) {
      toast.error('Nominal tidak valid (harus > Rp 0)')
      return
    }
    if (isZeroDebt) {
      toast.error('Tidak ada sisa hutang ke supplier ini')
      return
    }
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
    } catch (_err) {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pt-2">
      <div className={cn(
        "text-center space-y-1 p-5 rounded-2xl border",
        isCustomer ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"
      )}>
        <p className="text-[10px] font-black uppercase tracking-widest">
          {isCustomer ? 'Sisa Tagihan Nota' : 'Total Sisa Hutang'}
        </p>
        <p className="font-display text-3xl font-black tracking-tight tabular-nums">
          {formatIDR(maxAmount || 0)}
        </p>
        {isZeroDebt && (
          <p className="text-xs font-black text-emerald-400 mt-1">✅ Tidak ada hutang ke supplier ini</p>
        )}
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-black tracking-widest text-slate-550 ml-1">Jumlah Pembayaran (Rp)</Label>
          <InputRupiah
            value={amount}
            onChange={setAmount}
            className={cn(
              "bg-slate-50 h-14 text-xl font-black text-slate-900 rounded-2xl transition-all",
              isOverpay
                ? "border-rose-500/50 focus:ring-rose-500/20"
                : "border-slate-200 focus:ring-slate-250"
            )}
          />
          {isOverpay && (
            <p className="text-xs font-bold text-rose-600 ml-1 flex items-center gap-1.5">
              🚨 Melebihi sisa hutang sebesar {formatIDR(amount - maxAmount)}
            </p>
          )}
          {!isOverpay && amount > 0 && maxAmount !== undefined && amount === maxAmount && (
            <p className="text-xs font-bold text-emerald-600 ml-1 flex items-center gap-1.5">
              ✅ Pas — hutang akan lunas setelah pembayaran ini
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-black tracking-widest text-slate-550 ml-1">Metode Pembayaran</Label>
          <div className="flex gap-2">
            {['transfer', 'cash', 'qris'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={cn(
                  "flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95",
                  method === m
                    ? "bg-[#0F172A] text-white shadow-md"
                    : "bg-slate-50 text-slate-650 border border-slate-200 hover:text-slate-900"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-black tracking-widest text-slate-550 ml-1">No. Referensi (Opsional)</Label>
          <input
            value={refNo}
            onChange={e => setRefNo(e.target.value)}
            placeholder="Contoh: REF123..."
            className="w-full bg-slate-50 border-slate-200 h-12 px-4 text-sm font-bold text-slate-900 rounded-2xl focus:ring-slate-200 border focus:border-slate-300 outline-none transition-all"
          />
        </div>

        <div className="pt-3">
          <Button
            onClick={handlePay}
            disabled={loading || isOverpay || isZeroDebt || amount <= 0}
            className={cn(
              "w-full h-14 rounded-2xl text-xs font-black border-none shadow-md uppercase tracking-widest transition-all active:scale-95 text-white",
              (isOverpay || isZeroDebt || amount <= 0)
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-[#0F172A] hover:bg-slate-900"
            )}
          >
            {loading ? 'Memproses...' : isOverpay ? 'Nominal Terlalu Besar' : isZeroDebt ? 'Hutang Sudah Lunas' : 'Konfirmasi Pembayaran'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function EditProfileForm({ profile, isCustomer, onClose }) {
  const updateCustomer = useUpdateSembakoCustomer()
  const updateSupplier = useUpdateSembakoSupplier()

  const [form, setForm] = useState({
    customer_name: profile?.customer_name || '',
    supplier_name: profile?.supplier_name || '',
    customer_type: profile?.customer_type || 'warung',
    phone: profile?.phone || '',
    area: profile?.area || '',
    address: profile?.address || '',
    payment_terms: profile?.payment_terms || 'cash',
    credit_limit: profile?.credit_limit || 0,
    reliability_score: profile?.reliability_score || 5,
    notes: profile?.notes || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isCustomer) {
        await updateCustomer.mutateAsync({
          id: profile.id,
          customer_name: form.customer_name,
          customer_type: form.customer_type,
          phone: form.phone,
          area: form.area,
          address: form.address,
          payment_terms: form.payment_terms,
          credit_limit: Number(form.credit_limit || 0),
          reliability_score: Number(form.reliability_score || 5),
        })
      } else {
        await updateSupplier.mutateAsync({
          id: profile.id,
          supplier_name: form.supplier_name,
          phone: form.phone,
          area: form.area,
          address: form.address,
          notes: form.notes,
        })
      }
      onClose()
    } catch (_err) {
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
      <div className="space-y-1.5">
        <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500 ml-1">
          {isCustomer ? 'Nama Toko / Pelanggan' : 'Nama Supplier / Pemasok'}
        </Label>
        <Input
          value={isCustomer ? form.customer_name : form.supplier_name}
          onChange={e => setForm(f => ({ ...f, [isCustomer ? 'customer_name' : 'supplier_name']: e.target.value }))}
          required
          className="bg-slate-50 border-slate-200 h-12 text-sm font-bold text-slate-900 rounded-xl focus:border-slate-350 focus:ring-slate-250"
        />
      </div>

      {isCustomer && (
        <div className="space-y-1.5">
          <Label className="uppercase text-[10px] font-black tracking-widest text-slate-550 ml-1">Jenis Toko</Label>
          <Select
            value={form.customer_type}
            onValueChange={v => setForm(f => ({ ...f, customer_type: v }))}
          >
            <SelectTrigger className="bg-slate-50 border-slate-200 h-12 text-sm font-bold text-slate-900 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
              <SelectItem value="warung">Warung Kelontong</SelectItem>
              <SelectItem value="grosir">Grosir Sembako</SelectItem>
              <SelectItem value="semi_grosir">Semi Grosir</SelectItem>
              <SelectItem value="sales_keliling">Sales Keliling</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="uppercase text-[10px] font-black tracking-widest text-slate-550 ml-1">No. Handphone / WA</Label>
          <Input
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="0812..."
            className="bg-slate-50 border-slate-200 h-12 text-sm font-bold text-slate-900 rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="uppercase text-[10px] font-black tracking-widest text-slate-550 ml-1">Area / Wilayah</Label>
          <Input
            value={form.area}
            onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
            placeholder="Contoh: Utamakan"
            className="bg-slate-50 border-slate-200 h-12 text-sm font-bold text-slate-900 rounded-xl"
          />
        </div>
      </div>

      {isCustomer && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="uppercase text-[10px] font-black tracking-widest text-slate-550 ml-1">Termin Bayar</Label>
            <Select
              value={form.payment_terms}
              onValueChange={v => setForm(f => ({ ...f, payment_terms: v }))}
            >
              <SelectTrigger className="bg-slate-50 border-slate-200 h-12 text-sm font-bold text-slate-900 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="cash">CASH / TUNAI</SelectItem>
                <SelectItem value="tempo_7">Tempo 7 Hari</SelectItem>
                <SelectItem value="tempo_14">Tempo 14 Hari</SelectItem>
                <SelectItem value="tempo_30">Tempo 30 Hari</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="uppercase text-[10px] font-black tracking-widest text-slate-550 ml-1">Limit Kredit (Rp)</Label>
            <InputRupiah
              value={form.credit_limit}
              onChange={v => setForm(f => ({ ...f, credit_limit: v }))}
              className="bg-slate-50 border-slate-200 h-12 text-sm font-bold text-slate-900 rounded-xl"
            />
          </div>
        </div>
      )}

      {isCustomer && (
        <div className="space-y-1.5">
          <Label className="uppercase text-[10px] font-black tracking-widest text-slate-555 ml-1">Rating Keandalan (1-5)</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setForm(f => ({ ...f, reliability_score: star }))}
                className={cn(
                  "flex-1 h-10 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95",
                  form.reliability_score === star
                    ? "bg-[#0F172A] text-white font-extrabold shadow-sm"
                    : "bg-slate-50 text-slate-550 border border-slate-200 hover:text-slate-900"
                )}
              >
                <Star size={12} className={form.reliability_score === star ? "fill-white text-white" : ""} />
                {star}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="uppercase text-[10px] font-black tracking-widest text-slate-550 ml-1">Alamat Lengkap</Label>
        <Textarea
          value={form.address}
          onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          rows={3}
          placeholder="Jl. Merdeka No. 45..."
          className="bg-slate-50 border-slate-200 text-slate-900 text-sm font-bold rounded-xl resize-none"
        />
      </div>

      <div className="pt-3">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0F172A] hover:bg-slate-900 h-13 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-md transition-all active:scale-95 border-none"
        >
          {loading ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
        </Button>
      </div>
    </form>
  )
}
