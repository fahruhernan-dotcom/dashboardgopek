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
      <div className="bg-[#06090F] min-h-screen flex items-center justify-center p-6 text-slate-100">
        <EmptyState
          icon={AlertCircle}
          title="Data Tidak Ditemukan"
          description="Link mungkin sudah kedaluwarsa atau data telah dihapus."
          action={<Button onClick={() => navigate('../')} className="bg-[#EA580C] hover:bg-[#D44E0A] rounded-xl font-bold">Kembali</Button>}
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
      className="bg-[#06090F] min-h-screen pb-24 text-slate-100 selection:bg-[#EA580C]/30 selection:text-orange-200"
    >
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#EA580C]/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Header Bar */}
      <header className="px-4 sm:px-8 py-5 flex items-center justify-between sticky top-0 bg-[#06090F] z-40 border-b border-white/5 shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-[#EA580C] tracking-widest uppercase bg-[#EA580C]/10 px-2 py-0.5 rounded-md border border-[#EA580C]/20">
                {isCustomer ? 'Toko / Customer' : 'Supplier / Agen'}
              </span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight uppercase truncate max-w-[280px] sm:max-w-md">
              {profileData?.customer_name || profileData?.supplier_name || 'Loading...'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenModal('edit')}
            className="bg-white/5 hover:bg-white/10 border-white/10 text-slate-200 hover:text-white rounded-xl font-bold text-xs gap-2 px-3.5 h-10 shadow-sm"
          >
            <Edit size={14} className="text-[#EA580C]" />
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
            <Card className="bg-[#0F172A] border border-slate-800 rounded-[28px] p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#EA580C]/10 to-transparent rounded-bl-full pointer-events-none" />

              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EA580C] to-amber-600 border border-white/20 shadow-lg shrink-0">
                  <AvatarFallback className="bg-transparent text-white font-display font-black text-2xl tracking-wider">
                    {(profileData?.customer_name || profileData?.supplier_name || 'TS')?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display font-black text-white text-xl sm:text-2xl tracking-tight leading-tight uppercase truncate">
                      {profileData?.customer_name || profileData?.supplier_name}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {isCustomer && (
                      <Badge className="bg-white/5 text-orange-400 border border-orange-500/20 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg">
                        {profileData?.customer_type || 'Toko'}
                      </Badge>
                    )}
                    <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      <span>{profileData?.reliability_score || 5}.0 Rating</span>
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/10 my-5" />

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] p-3.5 rounded-2xl border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[#4B6478]">
                    <Phone size={12} className="text-[#EA580C]" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">No. HP / WA</span>
                  </div>
                  <p className="text-sm font-bold text-white truncate">
                    {profileData?.phone || '-'}
                  </p>
                </div>

                <div className="bg-white/[0.02] p-3.5 rounded-2xl border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[#4B6478]">
                    <MapPin size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Area / Wilayah</span>
                  </div>
                  <p className="text-sm font-bold text-white truncate">
                    {profileData?.area || 'Utama'}
                  </p>
                </div>

                <div className="bg-white/[0.02] p-3.5 rounded-2xl border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[#4B6478]">
                    <ShieldCheck size={12} className="text-blue-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Termin Bayar</span>
                  </div>
                  <p className="text-sm font-extrabold text-blue-300 uppercase">
                    {profileData?.payment_terms || 'CASH'}
                  </p>
                </div>

                <div className="bg-white/[0.02] p-3.5 rounded-2xl border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[#4B6478]">
                    <CreditCard size={12} className="text-purple-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Limit Kredit</span>
                  </div>
                  <p className="text-sm font-extrabold text-purple-300">
                    {profileData?.credit_limit ? formatIDRShort(profileData.credit_limit) : 'Rp 0'}
                  </p>
                </div>
              </div>

              <div className="bg-white/[0.02] p-3.5 rounded-2xl border border-white/5 mt-4 space-y-1">
                <div className="flex items-center gap-1.5 text-[#4B6478]">
                  <Building2 size={12} className="text-slate-400" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Alamat Lengkap</span>
                </div>
                <p className="text-xs font-semibold text-slate-300 line-clamp-2 leading-relaxed">
                  {profileData?.address || 'Belum ada catatan alamat'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-2">
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-[#EA580C] to-orange-600 hover:from-orange-600 hover:to-orange-700 h-13 rounded-2xl font-black text-xs uppercase tracking-widest gap-2.5 shadow-xl shadow-orange-950/40 active:scale-[0.98] transition-all"
                >
                  <a href={toWaLink(profileData?.phone) || '#'} target="_blank" rel="noreferrer">
                    <MessageCircle size={18} className="fill-white/20" />
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
              <Card className={cn(
                "rounded-[28px] p-6 border-none shadow-2xl relative overflow-hidden backdrop-blur-xl transition-all duration-300",
                outstanding > 0
                  ? "bg-gradient-to-br from-rose-950/40 via-[#111C24] to-[#06090F] ring-1 ring-rose-500/30"
                  : "bg-gradient-to-br from-emerald-950/40 via-[#111C24] to-[#06090F] ring-1 ring-emerald-500/30"
              )}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2.5 h-2.5 rounded-full animate-pulse",
                        outstanding > 0 ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]" : "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                      )} />
                      <p className={cn(
                        "text-xs font-black uppercase tracking-widest leading-none",
                        outstanding > 0 ? "text-rose-400" : "text-emerald-400"
                      )}>
                        Saldo Piutang Toko Aktif
                      </p>
                    </div>
                    <p className={cn(
                      "font-display text-4xl sm:text-5xl font-black tracking-tight tabular-nums pt-1",
                      outstanding > 0 ? "text-rose-400" : "text-emerald-400"
                    )}>
                      {formatIDR(outstanding)}
                    </p>
                  </div>

                  <div className={cn(
                    "p-4 rounded-2xl border shadow-inner shrink-0",
                    outstanding > 0 ? "bg-rose-500/10 border-rose-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                  )}>
                    {outstanding > 0
                      ? <TrendingDown size={28} className="text-rose-400" />
                      : <TrendingUp size={28} className="text-emerald-400" />
                    }
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>{activeCount} Nota Belum Lunas</span>
                  <span className="text-slate-300">
                    Status: <strong className={outstanding > 0 ? "text-rose-400" : "text-emerald-400"}>
                      {outstanding > 0 ? 'Ada Piutang' : 'Lunas Bersih'}
                    </strong>
                  </span>
                </div>
              </Card>
            ) : (
              <Card className="bg-[#0F172A] border border-slate-800 rounded-[28px] p-6 shadow-xl relative overflow-hidden">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Total Belanja Stok Supplier</p>
                <p className="font-display text-4xl sm:text-5xl font-black text-white tracking-tight tabular-nums">
                  {formatIDR(supplierInvoices?.reduce((acc, b) => acc + (b.total_cost || 0), 0) || 0)}
                </p>

                <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div className="space-y-1 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Terbayar</p>
                    <p className="text-base font-black text-emerald-400 tabular-nums">
                      {formatIDR(supplierPayments?.reduce((s, p) => s + (p.amount || 0), 0) || 0)}
                    </p>
                  </div>
                  <div className="space-y-1 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sisa Hutang</p>
                    <p className="text-base font-black text-rose-400 tabular-nums">
                      {formatIDR(supplierTotalHutang)}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Activity Tabs */}
            <Card className="bg-[#0F172A] border border-slate-800 rounded-[28px] p-6 shadow-xl">
              <Tabs defaultValue="log" className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-display font-black text-white text-xl tracking-tight uppercase leading-none flex items-center gap-2">
                      <History size={20} className="text-[#EA580C]" />
                      Riwayat Aktivitas & Transaksi
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-1">Daftar invoice, retur, dan catatan pembayaran</p>
                  </div>

                  <TabsList className="bg-white/5 border border-white/10 h-11 p-1 rounded-2xl self-start sm:self-auto">
                    <TabsTrigger value="log" className="text-xs font-bold uppercase px-4 h-9 rounded-xl data-[state=active]:bg-[#EA580C] data-[state=active]:text-white transition-all">
                      Tagihan / Stok
                    </TabsTrigger>
                    <TabsTrigger value="pembayaran" className="text-xs font-bold uppercase px-4 h-9 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all">
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
                      className={cn(
                        "w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest gap-2 shadow-lg transition-all active:scale-[0.98]",
                        isCustomer ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-rose-600 hover:bg-rose-500 text-white"
                      )}
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
        <SheetContent side="right" className="bg-[#06090F] border-white/10 text-left p-6 sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-display font-black text-white uppercase text-xl text-left flex items-center gap-2">
              <Wallet size={22} className="text-emerald-400" />
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
        <SheetContent side="right" className="bg-[#06090F] border-white/10 text-left p-6 sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6 text-left">
            <SheetTitle className="font-display font-black text-white uppercase text-xl text-left flex items-center gap-2">
              <Edit size={20} className="text-[#EA580C]" />
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
            <Card className="bg-[#111C24]/80 border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-md hover:shadow-xl transition-all duration-300">
              {/* Header: Date, Invoice number & Status Badge */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
                    <p className="text-sm font-black text-white uppercase tracking-tight">{inv.invoice_number}</p>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-3.5">
                    {formatDate(inv.transaction_date)}
                  </p>
                </div>
                <Badge className={cn(
                  "border-none rounded-lg text-[10px] font-black uppercase px-2.5 py-1 tracking-wider",
                  inv.payment_status === 'lunas' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  inv.payment_status === 'sebagian' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                  "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                )}>
                  {inv.payment_status?.replace('_', ' ')}
                </Badge>
              </div>

              {/* Financial Details Box */}
              <div className="bg-[#0A1015]/60 border border-white/5 rounded-xl p-3.5 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400">Total Tagihan</span>
                  <span className="font-black text-slate-200 tabular-nums">{formatIDR(inv.total_amount)}</span>
                </div>
                
                {telahDibayar > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-400">Telah Dibayar</span>
                    <span className="font-bold text-emerald-400 tabular-nums">{formatIDR(telahDibayar)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                  <span className="font-black text-slate-300">Sisa Piutang</span>
                  <span className={cn("font-black text-sm tabular-nums", inv.remaining_amount > 0 ? "text-rose-400" : "text-emerald-400")}>
                    {formatIDR(inv.remaining_amount)}
                  </span>
                </div>
              </div>

              {/* Pay Action Button */}
              {inv.payment_status !== 'lunas' && (
                <Button 
                  onClick={() => onPay(inv)} 
                  className="w-full bg-gradient-to-r from-[#EA580C] to-[#D44E0A] hover:from-[#F06313] hover:to-[#EB5505] text-white text-xs font-black h-10 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
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
          <Card className="bg-[#111C24]/80 border-white/5 hover:border-white/10 rounded-2xl p-4.5 space-y-3 shadow-md hover:shadow-xl transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDate(batch.purchase_date)}</p>
                <p className="text-base font-black text-white uppercase tracking-tight">{batch.sembako_products?.product_name || 'Produk'}</p>
              </div>
              <Badge className="bg-white/5 text-slate-300 border border-white/10 text-[10px] font-black px-2.5 py-1 rounded-lg">
                {batch.qty_masuk} {batch.sembako_products?.unit || 'Unit'}
              </Badge>
            </div>

            <div className="flex justify-between items-center pt-1">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Nilai Pembelian</p>
                <p className="font-black text-base text-white tabular-nums leading-none">{formatIDR(batch.total_cost)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Sisa Stok Batch</p>
                <p className={cn("font-black text-sm tabular-nums leading-none", batch.qty_sisa > 0 ? "text-emerald-400" : "text-slate-500")}>
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
        <Card key={p.id} className="bg-[#111C24]/80 border-white/5 rounded-2xl p-4 flex justify-between items-center shadow-md">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDate(p.payment_date)}</p>
            {isCustomer && <p className="text-xs font-bold text-slate-300 uppercase">Nota: {p.sembako_sales?.invoice_number || '-'}</p>}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">{p.payment_method || 'Cash'}</p>
            <p className={cn("font-black text-base tabular-nums leading-none", isCustomer ? "text-emerald-400" : "text-rose-400")}>
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
        isCustomer ? "bg-rose-500/10 border-rose-500/20 text-rose-300" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
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
          <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-1">Jumlah Pembayaran (Rp)</Label>
          <InputRupiah
            value={amount}
            onChange={setAmount}
            className={cn(
              "bg-[#111C24] h-14 text-xl font-black text-white rounded-2xl transition-all",
              isOverpay
                ? "border-rose-500/50 focus:ring-rose-500/20"
                : "border-white/10 focus:ring-[#EA580C]/20"
            )}
          />
          {isOverpay && (
            <p className="text-xs font-bold text-rose-400 ml-1 flex items-center gap-1.5">
              🚨 Melebihi sisa hutang sebesar {formatIDR(amount - maxAmount)}
            </p>
          )}
          {!isOverpay && amount > 0 && maxAmount !== undefined && amount === maxAmount && (
            <p className="text-xs font-bold text-emerald-400 ml-1 flex items-center gap-1.5">
              ✅ Pas — hutang akan lunas setelah pembayaran ini
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-1">Metode Pembayaran</Label>
          <div className="flex gap-2">
            {['transfer', 'cash', 'qris'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={cn(
                  "flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95",
                  method === m
                    ? (isCustomer ? "bg-[#EA580C]" : "bg-rose-600") + " text-white shadow-lg"
                    : "bg-white/5 text-slate-400 border border-white/5 hover:text-white"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-1">No. Referensi (Opsional)</Label>
          <input
            value={refNo}
            onChange={e => setRefNo(e.target.value)}
            placeholder="Contoh: REF123..."
            className="w-full bg-[#111C24] border-white/10 h-12 px-4 text-sm font-bold text-white rounded-2xl focus:ring-[#EA580C]/20 border focus:border-[#EA580C]/40 outline-none transition-all"
          />
        </div>

        <div className="pt-3">
          <Button
            onClick={handlePay}
            disabled={loading || isOverpay || isZeroDebt || amount <= 0}
            className={cn(
              "w-full h-14 rounded-2xl text-xs font-black border-none shadow-xl uppercase tracking-widest transition-all active:scale-95 text-white",
              (isOverpay || isZeroDebt || amount <= 0)
                ? "bg-white/10 text-white/30 cursor-not-allowed"
                : isCustomer ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
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
        <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-1">
          {isCustomer ? 'Nama Toko / Pelanggan' : 'Nama Supplier / Pemasok'}
        </Label>
        <Input
          value={isCustomer ? form.customer_name : form.supplier_name}
          onChange={e => setForm(f => ({ ...f, [isCustomer ? 'customer_name' : 'supplier_name']: e.target.value }))}
          required
          className="bg-[#111C24] border-white/10 h-12 text-sm font-bold text-white rounded-xl focus:border-[#EA580C]"
        />
      </div>

      {isCustomer && (
        <div className="space-y-1.5">
          <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-1">Jenis Toko</Label>
          <Select
            value={form.customer_type}
            onValueChange={v => setForm(f => ({ ...f, customer_type: v }))}
          >
            <SelectTrigger className="bg-[#111C24] border-white/10 h-12 text-sm font-bold text-white rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#111C24] border-white/10 text-white">
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
          <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-1">No. Handphone / WA</Label>
          <Input
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="0812..."
            className="bg-[#111C24] border-white/10 h-12 text-sm font-bold text-white rounded-xl"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-1">Area / Wilayah</Label>
          <Input
            value={form.area}
            onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
            placeholder="Contoh: Utamakan"
            className="bg-[#111C24] border-white/10 h-12 text-sm font-bold text-white rounded-xl"
          />
        </div>
      </div>

      {isCustomer && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-1">Termin Bayar</Label>
            <Select
              value={form.payment_terms}
              onValueChange={v => setForm(f => ({ ...f, payment_terms: v }))}
            >
              <SelectTrigger className="bg-[#111C24] border-white/10 h-12 text-sm font-bold text-white rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111C24] border-white/10 text-white">
                <SelectItem value="cash">CASH / TUNAI</SelectItem>
                <SelectItem value="tempo_7">Tempo 7 Hari</SelectItem>
                <SelectItem value="tempo_14">Tempo 14 Hari</SelectItem>
                <SelectItem value="tempo_30">Tempo 30 Hari</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-1">Limit Kredit (Rp)</Label>
            <InputRupiah
              value={form.credit_limit}
              onChange={v => setForm(f => ({ ...f, credit_limit: v }))}
              className="bg-[#111C24] border-white/10 h-12 text-sm font-bold text-white rounded-xl"
            />
          </div>
        </div>
      )}

      {isCustomer && (
        <div className="space-y-1.5">
          <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-1">Rating Keandalan (1-5)</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setForm(f => ({ ...f, reliability_score: star }))}
                className={cn(
                  "flex-1 h-10 rounded-xl font-black text-xs flex items-center justify-center gap-1 transition-all active:scale-95",
                  form.reliability_score === star
                    ? "bg-amber-500 text-slate-950 font-extrabold shadow-lg"
                    : "bg-white/5 text-slate-400 border border-white/5 hover:text-white"
                )}
              >
                <Star size={12} className={form.reliability_score === star ? "fill-slate-950 text-slate-950" : ""} />
                {star}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="uppercase text-[10px] font-black tracking-widest text-slate-400 ml-1">Alamat Lengkap</Label>
        <Textarea
          value={form.address}
          onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          rows={3}
          placeholder="Jl. Merdeka No. 45..."
          className="bg-[#111C24] border-white/10 text-sm font-bold text-white rounded-xl resize-none"
        />
      </div>

      <div className="pt-3">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#EA580C] hover:bg-[#D44E0A] h-13 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-orange-950/30 transition-all active:scale-95"
        >
          {loading ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
        </Button>
      </div>
    </form>
  )
}
