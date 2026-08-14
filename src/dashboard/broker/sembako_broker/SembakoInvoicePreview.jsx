import React from 'react'
import {
  Printer, X, Store, User, Calendar, CreditCard,
  CheckCircle2, Clock, AlertCircle, Phone, MapPin,
  Building2, Receipt, Truck, ArrowDownRight, ShieldCheck
} from 'lucide-react'
import { formatIDR, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { terbilang } from '@/lib/invoice/invoiceUtils'

/**
 * Clean internal operational tags from customer-facing notes
 */
export function cleanCustomerNotes(notes) {
  if (!notes || typeof notes !== 'string') return ''
  return notes
    .replace(/\[Biaya Operasional:[^\]]*\]/gi, '')
    .replace(/\[Operasional:[^\]]*\]/gi, '')
    .replace(/Biaya Tambahan:[^\n]+/gi, '')
    .trim()
}

/**
 * SembakoInvoicePaper
 * Pure printable & responsive invoice paper component with premium aesthetics
 */
export function SembakoInvoicePaper({ data, mode = 'invoice' }) {
  if (!data) return null

  const isDelivery = mode === 'delivery'
  const companyName = data.tenant?.business_name || 'Gudang Sembako GPK'
  const companyPhone = data.tenant?.phone || '-'
  const customerName = data.customerName || data.customer_name || 'Pelanggan Umum'
  const customerType = data.customerType || data.customer_type || 'warung'
  const customerPhone = data.customerPhone || data.customer_phone || '-'
  const customerAddress = data.customerAddress || data.customer_address || ''

  const deliveryCost = Number(data.delivery_cost || data.deliveryCost || 0)
  const totalAmount = Number(data.total_amount || data.revenue || 0)
  const paidAmount = Number(data.paid_amount || data.payAmount || 0)
  const remainingAmount = Number(data.remaining_amount ?? Math.max(0, totalAmount - paidAmount))

  const paymentStatus = data.payment_status || (remainingAmount === 0 ? 'lunas' : paidAmount > 0 ? 'sebagian' : 'belum_lunas')
  const isLunas = paymentStatus === 'lunas'

  const rawItems = data.items || data.sembako_sale_items || []
  const items = Array.isArray(rawItems) ? rawItems : []
  const payments = Array.isArray(data.sembako_payments) ? data.sembako_payments : (Array.isArray(data.payments) ? data.payments : [])
  const validPayments = payments.filter(p => !p.is_deleted)

  const invoiceNo = data.invoiceNumber || data.invoice_number || 'SMB-2026-PREVIEW'
  const txnDate = data.transactionDate || data.transaction_date || new Date().toISOString()
  const dueDate = data.dueDate || data.due_date

  // Calculate items subtotal
  const itemsSubtotal = items.reduce((s, i) => {
    const qty = Number(i.quantity || i.quantity_kg || 0)
    const price = Number(i.sell_price ?? i.price_per_unit ?? i.price_per_kg ?? i.unit_price ?? 0)
    return s + (Number(i.subtotal) || (qty * price))
  }, 0) || totalAmount

  const customerNotes = cleanCustomerNotes(data.notes)
  const terbilangText = terbilang(isLunas ? totalAmount : remainingAmount)

  return (
    <div className={cn(
      "bg-white text-slate-900 w-full max-w-[800px] mx-auto p-5 sm:p-8 md:p-10 flex flex-col font-sans rounded-2xl text-left border border-slate-200/90 shadow-2xl relative",
      "print:shadow-none print:max-w-full print:p-0 print:border-none print:rounded-none print:min-h-0"
    )} style={{ pageBreakInside: 'avoid' }}>
      
      {/* ── Top Header: Brand & Invoice Meta ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b-2 border-slate-800/90">
        {/* Left: Brand Identity */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center text-white shadow-md shrink-0">
            {isDelivery ? <Truck size={22} className="text-amber-400" /> : <Store size={22} className="text-emerald-400" />}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                {companyName}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <ShieldCheck size={11} /> Terverifikasi
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
              <Phone size={12} className="text-slate-400" /> {companyPhone}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              Distributor Sembako & Platform Manajemen Bisnis GPK
            </p>
          </div>
        </div>

        {/* Right: Invoice Type & Number */}
        <div className="sm:text-right w-full sm:w-auto bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-100">
          <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-black tracking-wider uppercase mb-1">
            {isDelivery ? 'SURAT JALAN' : 'INVOICE RESMI'}
          </div>
          <p className="text-xs font-mono font-bold text-slate-900 flex sm:justify-end items-center gap-1">
            <span className="text-slate-500 font-normal">No:</span> {invoiceNo}
          </p>
          <p className="text-[11px] text-slate-600 font-medium flex sm:justify-end items-center gap-1">
            <Calendar size={12} className="text-slate-400" /> {formatDate(txnDate)}
          </p>
          {dueDate && !isDelivery && (
            <p className="text-[11px] text-amber-700 font-bold flex sm:justify-end items-center gap-1 mt-0.5">
              <Clock size={12} className="text-amber-600" /> Jth Tempo: {formatDate(dueDate)}
            </p>
          )}
        </div>
      </div>

      {/* ── Status Banner ── */}
      {!isDelivery && (
        <div className="mt-4 mb-5">
          {paymentStatus === 'lunas' ? (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-bold tracking-wide uppercase">FAKTUR LUNAS (PAID)</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700">Pembayaran telah lunas</span>
            </div>
          ) : paymentStatus === 'sebagian' ? (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-800">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-600 shrink-0" />
                <span className="text-xs font-bold tracking-wide uppercase">SEBAGIAN DIBAYAR (PARTIAL)</span>
              </div>
              <span className="text-[11px] font-semibold text-blue-700">Sisa {formatIDR(remainingAmount)}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <span className="text-xs font-bold tracking-wide uppercase">BELUM LUNAS (UNPAID)</span>
              </div>
              <span className="text-[11px] font-semibold text-amber-800">Menunggu Pelunasan</span>
            </div>
          )}
        </div>
      )}

      {/* ── Parties Info Card (Seller & Buyer) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5">
        {/* Seller Info */}
        <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/80 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <Building2 size={12} className="text-slate-400" /> Diterbitkan Oleh (Seller)
          </div>
          <p className="text-sm font-black text-slate-900 leading-snug">{companyName}</p>
          <p className="text-xs text-slate-600 flex items-center gap-1">
            <Phone size={11} className="text-slate-400" /> {companyPhone}
          </p>
        </div>

        {/* Buyer Info */}
        <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <User size={12} className="text-slate-400" /> Ditujukan Kepada (Buyer)
            </div>
            {customerType && (
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                {customerType}
              </span>
            )}
          </div>
          <p className="text-sm font-black text-slate-900 leading-snug">{customerName}</p>
          <div className="flex flex-wrap gap-x-3 text-xs text-slate-600">
            {customerPhone && customerPhone !== '-' && (
              <span className="flex items-center gap-1"><Phone size={11} className="text-slate-400" /> {customerPhone}</span>
            )}
            {customerAddress && (
              <span className="flex items-center gap-1"><MapPin size={11} className="text-slate-400" /> {customerAddress}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Product Items Table ── */}
      <div className="mb-5 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-bold">
              <th className="py-2.5 px-3.5 text-left uppercase tracking-wider text-[11px]">Item Produk</th>
              <th className="py-2.5 px-3 text-center uppercase tracking-wider text-[11px]">Jumlah</th>
              {!isDelivery && (
                <th className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]">Harga Satuan</th>
              )}
              {!isDelivery && (
                <th className="py-2.5 px-3.5 text-right uppercase tracking-wider text-[11px]">Subtotal</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length > 0 ? (
              items.map((item, idx) => {
                const qty = Number(item.quantity || item.quantity_kg || 0)
                const price = Number(item.sell_price ?? item.price_per_unit ?? item.price_per_kg ?? item.unit_price ?? 0)
                const subtotal = Number(item.subtotal ?? (qty * price))
                const unit = item.unit || 'pcs'
                return (
                  <tr key={idx} className={cn("hover:bg-slate-50/80 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-slate-50/40")}>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">{item.product_name}</td>
                    <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                      <span className="font-bold text-slate-900">{qty}</span> <span className="text-slate-500 text-[11px]">{unit}</span>
                    </td>
                    {!isDelivery && (
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">{formatIDR(price)}</td>
                    )}
                    {!isDelivery && (
                      <td className="py-2.5 px-3.5 text-right font-black text-slate-900">{formatIDR(subtotal)}</td>
                    )}
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={isDelivery ? 2 : 4} className="py-6 text-center text-slate-400 font-medium">
                  Tidak ada item produk
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Summary & Grand Total Block ── */}
      {!isDelivery && (
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
          {/* Left: Customer Notes */}
          <div className="w-full sm:flex-1 space-y-2">
            {customerNotes ? (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catatan Nota:</p>
                <p className="text-xs text-slate-700 font-medium mt-0.5 whitespace-pre-wrap">{customerNotes}</p>
              </div>
            ) : null}
          </div>

          {/* Right: Customer Bill Breakdown */}
          <div className="w-full sm:w-[340px] bg-slate-50/90 rounded-xl p-3.5 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>Subtotal Produk</span>
              <span className="font-bold text-slate-900">{formatIDR(itemsSubtotal)}</span>
            </div>
            {deliveryCost > 0 && (
              <div className="flex justify-between items-center text-xs text-slate-600">
                <span>Ongkos Kirim</span>
                <span className="font-semibold text-slate-800">+{formatIDR(deliveryCost)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200">
              <span className="font-bold text-slate-800">Total Tagihan</span>
              <span className="font-black text-slate-900 text-sm">{formatIDR(totalAmount)}</span>
            </div>
            {paidAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-emerald-700">
                <span>Sudah Dibayar</span>
                <span className="font-bold">-{formatIDR(paidAmount)}</span>
              </div>
            )}

            {/* High-Contrast Grand Total / Sisa Tagihan Box */}
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className={cn(
                "rounded-xl p-3 flex justify-between items-center shadow-md text-white transition-all",
                isLunas ? "bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800" : "bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950"
              )}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    {isLunas ? 'STATUS TAGIHAN' : 'SISA PEMBAYARAN'}
                  </p>
                  <p className="text-xs font-black">
                    {isLunas ? 'LUNAS SEPENUHNYA' : 'SISA TAGIHAN'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base sm:text-lg font-black tracking-tight text-white">
                    {formatIDR(isLunas ? totalAmount : remainingAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Terbilang Box ── */}
      {!isDelivery && (
        <div className="mb-5 bg-indigo-50/60 rounded-xl p-3 border-l-4 border-indigo-600 space-y-0.5">
          <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
            TERBILANG ({isLunas ? 'TOTAL' : 'SISA TAGIHAN'})
          </p>
          <p className="text-xs font-bold italic text-slate-800 capitalize leading-relaxed">
            "{terbilangText || 'Nol rupiah'}"
          </p>
        </div>
      )}

      {/* ── Payment History (Riwayat Pembayaran Pelanggan) ── */}
      {!isDelivery && (validPayments.length > 0 || paidAmount > 0) && (
        <div className="mb-5 bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard size={13} className="text-slate-600" /> Riwayat Pembayaran Pelanggan
            </p>
            <p className="text-xs font-black text-emerald-700">
              Total Diterima: {formatIDR(paidAmount)}
            </p>
          </div>
          <div className="space-y-1.5">
            {validPayments.length > 0 ? (
              validPayments.map((p, pIdx) => (
                <div key={pIdx} className="flex justify-between items-center text-xs py-1.5 px-2.5 rounded-lg bg-white border border-slate-200/80 shadow-sm">
                  <span className="text-slate-700 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>{formatDate(p.payment_date || p.created_at)}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold uppercase text-slate-900 px-1.5 py-0.5 rounded bg-slate-100 text-[10px]">{p.payment_method || 'CASH'}</span>
                    {p.notes && <span className="text-slate-500 italic text-[11px]">({p.notes})</span>}
                  </span>
                  <span className="font-black text-slate-900 font-mono">{formatIDR(p.amount || p.amount_paid)}</span>
                </div>
              ))
            ) : (
              <div className="flex justify-between items-center text-xs py-1.5 px-2.5 rounded-lg bg-white border border-slate-200/80 shadow-sm">
                <span className="text-slate-700 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>{formatDate(txnDate)}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-bold uppercase text-slate-900 px-1.5 py-0.5 rounded bg-slate-100 text-[10px]">PEMBAYARAN SAAT TRANSAKSI</span>
                </span>
                <span className="font-black text-slate-900 font-mono">{formatIDR(paidAmount)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Surat Jalan Delivery Notes ── */}
      {isDelivery && customerNotes && (
        <div className="mb-5 bg-slate-50 rounded-xl p-3 border border-slate-200/80">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catatan Pengiriman:</p>
          <p className="text-xs text-slate-700 font-medium mt-0.5 whitespace-pre-wrap">{customerNotes}</p>
        </div>
      )}

      {/* ── Signatures ── */}
      <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-center">
        <div className="space-y-10">
          <p className="text-xs font-semibold text-slate-500">Hormat Kami (Penjual),</p>
          <div>
            <div className="w-36 h-[1px] bg-slate-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-900">{companyName}</p>
            <p className="text-[10px] text-slate-400">Pihak Toko / Distributor</p>
          </div>
        </div>
        <div className="space-y-10">
          <p className="text-xs font-semibold text-slate-500">Diterima Oleh (Pembeli),</p>
          <div>
            <div className="w-36 h-[1px] bg-slate-400 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-900">{customerName}</p>
            <p className="text-[10px] text-slate-400">Pihak Pelanggan</p>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-6 pt-3 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 font-medium">
          Faktur Sah Dicetak Otomatis oleh Dashboard Gopek • Ref: {invoiceNo} • {formatDate(txnDate)}
        </p>
      </div>

    </div>
  )
}

/**
 * SembakoInvoicePreview
 * Printable Modal Wrapper with High Z-Index and Non-Overlapping Controls
 */
export default function SembakoInvoicePreview({ data, mode = 'invoice', onClose }) {
  if (!data) return null

  const handlePrint = () => {
    window.print()
  }

  const isDelivery = mode === 'delivery'

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-start p-0 sm:p-4 md:p-6 overflow-y-auto print:p-0 print:bg-white print:relative print:z-0">
      
      {/* ── Top Floating Action Bar ── */}
      <div className="sticky top-0 z-50 w-full max-w-[800px] bg-slate-900/95 backdrop-blur-xl border-b sm:border border-white/10 sm:rounded-2xl px-4 py-3 mb-3 flex items-center justify-between shadow-2xl shrink-0 print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Receipt size={18} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-white leading-tight">
              Preview {isDelivery ? 'Surat Jalan' : 'Faktur Penjualan'}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              {data.invoiceNumber || data.invoice_number || 'Faktur'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handlePrint}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5 shadow-lg text-xs h-9 px-3.5 rounded-xl border-none active:scale-95 transition-all"
          >
            <Printer size={15} /> <span className="hidden sm:inline">Cetak</span> Faktur
          </Button>
          <Button
            onClick={onClose}
            size="sm"
            variant="ghost"
            className="bg-white/10 text-white hover:bg-white/20 h-9 w-9 p-0 rounded-xl active:scale-95 transition-all"
          >
            <X size={18} />
          </Button>
        </div>
      </div>

      {/* ── Paper Container (with safe area bottom padding to prevent bottom nav overlap) ── */}
      <div className="w-full max-w-[800px] pb-36 sm:pb-12 print:pb-0">
        <SembakoInvoicePaper data={data} mode={mode} />
      </div>
    </div>
  )
}
