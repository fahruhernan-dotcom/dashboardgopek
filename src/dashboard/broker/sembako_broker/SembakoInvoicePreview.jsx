import React from 'react'
import { Printer, X } from 'lucide-react'
import { formatIDR, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { terbilang } from '@/lib/invoice/invoiceUtils'

/**
 * SembakoInvoicePaper
 * Pure paper content element used inside InvoicePreviewModal or print view
 */
export function SembakoInvoicePaper({ data, mode = 'invoice' }) {
  if (!data) return null

  const isDelivery = mode === 'delivery'
  const companyName = data.tenant?.business_name || 'GPK'
  const companyPhone = data.tenant?.phone || '-'
  const customerName = data.customerName || data.customer_name || 'Lemonaru'
  const customerType = data.customerType || data.customer_type || 'warung'
  const customerPhone = data.customerPhone || data.customer_phone || '-'
  const customerAddress = data.customerAddress || data.customer_address || ''
  
  const totalAmount = Number(data.total_amount || data.revenue || 0)
  const paidAmount = Number(data.paid_amount || 0)
  const remainingAmount = Number(data.remaining_amount ?? Math.max(0, totalAmount - paidAmount))
  
  const paymentStatus = data.payment_status || (remainingAmount === 0 ? 'lunas' : paidAmount > 0 ? 'sebagian' : 'belum_lunas')
  const isLunas = paymentStatus === 'lunas'

  const items = data.items || data.sembako_sale_items || []
  const payments = Array.isArray(data.sembako_payments) ? data.sembako_payments : (Array.isArray(data.payments) ? data.payments : [])
  const validPayments = payments.filter(p => !p.is_deleted)

  const invoiceNo = data.invoiceNumber || data.invoice_number || 'SMB-20260805-A116'
  const txnDate = data.transactionDate || data.transaction_date || new Date().toISOString()
  const dueDate = data.dueDate || data.due_date

  const terbilangText = terbilang(isLunas ? totalAmount : remainingAmount)

  return (
    <div className={cn(
      "bg-white text-slate-950 w-full max-w-[800px] p-[24px] md:p-[32px] flex flex-col font-sans rounded-md text-left",
      "print:shadow-none print:max-w-full print:p-4 print:rounded-none print:min-h-0"
    )} style={{ pageBreakInside: 'avoid' }}>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4 pb-2">
         <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              {companyName}
            </h1>
            <p className="text-xs text-slate-500 font-medium leading-tight">
              Tel: {companyPhone}
            </p>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">
              Dashboard GPK — Platform Manajemen Bisnis
            </p>
         </div>
         <div className="text-right space-y-0.5">
            <h2 className="text-xl md:text-2xl font-black text-[#F59E0B] tracking-wide uppercase">
              {isDelivery ? 'SURAT JALAN' : 'INVOICE'}
            </h2>
            <p className="text-xs text-slate-500">Ref: {invoiceNo}</p>
            <p className="text-xs text-slate-600 font-medium">Tgl: {formatDate(txnDate)}</p>
            {dueDate && (
              <p className="text-xs text-[#F59E0B] font-bold">
                Jatuh Tempo: {formatDate(dueDate)}
              </p>
            )}
         </div>
      </div>

      {/* Orange Divider */}
      <div className="w-full h-[2px] bg-[#F59E0B] mb-4" />

      {/* Status Badge */}
      {!isDelivery && (
        <div className="mb-4 flex items-center justify-between">
          <span className={cn(
            "px-3 py-1 rounded-lg border text-[11px] font-black tracking-wider uppercase",
            paymentStatus === 'lunas' && "bg-emerald-50 border-emerald-500 text-emerald-700",
            paymentStatus === 'sebagian' && "bg-blue-50 border-blue-500 text-blue-700",
            paymentStatus === 'belum_lunas' && "bg-[#FFFBEB] border-[#F59E0B] text-[#D97706]"
          )}>
            {paymentStatus === 'lunas' ? 'LUNAS' : paymentStatus === 'sebagian' ? 'SEBAGIAN DIBAYAR' : 'BELUM DIBAYAR'}
          </span>
        </div>
      )}

      {/* Info Grid (Seller vs Buyer) */}
      <div className="grid grid-cols-2 gap-6 mb-5">
         {/* Seller */}
         <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider">
              DARI (SELLER)
            </p>
            <p className="text-sm font-black text-slate-900 leading-snug">
              {companyName}
            </p>
            <p className="text-xs text-slate-500">
              Tel: {companyPhone}
            </p>
         </div>

         {/* Buyer */}
         <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider">
              KEPADA (BUYER)
            </p>
            <p className="text-sm font-black text-slate-900 leading-snug">
              {customerName}
            </p>
            {customerType && (
              <p className="text-xs text-slate-500 leading-tight capitalize">
                {customerType}
              </p>
            )}
            {customerAddress && (
              <p className="text-xs text-slate-500 leading-tight">
                {customerAddress}
              </p>
            )}
            <p className="text-xs text-slate-500">
              Tel: {customerPhone}
            </p>
         </div>
      </div>

      {/* Table */}
      <div className="mb-4">
         <table className="w-full border-collapse">
            <thead>
               <tr className="bg-[#0C1319] text-white">
                  <th className="py-2 px-3 text-left text-xs font-bold uppercase tracking-wider rounded-l-sm">Produk</th>
                  <th className="py-2 px-3 text-center text-xs font-bold uppercase tracking-wider">Jumlah</th>
                  {!isDelivery && (
                    <th className="py-2 px-3 text-right text-xs font-bold uppercase tracking-wider">Harga / Unit</th>
                  )}
                  {!isDelivery && (
                    <th className="py-2 px-3 text-right text-xs font-bold uppercase tracking-wider rounded-r-sm">Subtotal</th>
                  )}
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
               {items.length > 0 ? (
                 items.map((item, idx) => {
                   const qty = Number(item.quantity || item.quantity_kg || 0)
                   const price = Number(item.price_per_unit ?? item.sell_price ?? item.price_per_kg ?? item.unit_price ?? 0)
                   const subtotal = Number(item.subtotal ?? (qty * price))
                   const unit = item.unit || 'pcs'
                   return (
                      <tr key={idx} className="border-b border-slate-100">
                         <td className="py-2 px-3 text-xs font-semibold text-slate-900">{item.product_name}</td>
                         <td className="py-2 px-3 text-center text-xs font-medium text-slate-700">{qty} {unit}</td>
                         {!isDelivery && (
                           <td className="py-2 px-3 text-right text-xs font-medium text-slate-700">{formatIDR(price)}</td>
                         )}
                         {!isDelivery && (
                           <td className="py-2 px-3 text-right text-xs font-bold text-slate-900">{formatIDR(subtotal)}</td>
                         )}
                      </tr>
                   )
                 })
               ) : (
                 <tr>
                   <td colSpan={isDelivery ? 2 : 4} className="py-4 text-center text-slate-400 text-xs">
                     Tidak ada item produk
                   </td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>

      {/* Subtotal & Sisa Tagihan */}
      {!isDelivery && (
        <div className="flex justify-end mb-4">
           <div className="w-full max-w-[320px] space-y-1.5">
              <div className="flex justify-between items-center text-xs px-2">
                 <span className="font-semibold text-slate-500">Subtotal</span>
                 <span className="font-black text-slate-900">{formatIDR(totalAmount)}</span>
              </div>
              
              {/* Solid Orange Box */}
              <div className="bg-[#F59E0B] text-white rounded-lg p-2.5 flex justify-between items-center shadow-sm">
                 <span className="text-xs font-black uppercase tracking-wide">
                   {isLunas ? 'TOTAL' : 'SISA TAGIHAN'}
                 </span>
                 <span className="text-sm font-black">
                   {formatIDR(isLunas ? totalAmount : remainingAmount)}
                 </span>
              </div>
           </div>
        </div>
      )}

      {/* Riwayat Pembayaran Toko */}
      {!isDelivery && validPayments.length > 0 && (
        <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5">
          <div className="flex justify-between items-center border-b border-slate-200 pb-1">
            <p className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider">
              RIWAYAT PEMBAYARAN TOKO
            </p>
            <p className="text-[10px] font-black text-slate-700">
              Total Dibayar: {formatIDR(paidAmount)}
            </p>
          </div>
          <div className="space-y-1">
            {validPayments.map((p, pIdx) => (
              <div key={pIdx} className="flex justify-between items-center text-xs py-0.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-600 font-medium">
                  📅 {formatDate(p.payment_date || p.created_at)} · <span className="font-bold capitalize">{p.payment_method || 'cash'}</span>
                  {p.notes && <span className="text-slate-400"> ({p.notes})</span>}
                </span>
                <span className="font-bold text-slate-900">{formatIDR(p.amount || p.amount_paid)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terbilang Box */}
      {!isDelivery && (
        <div className="mb-4 bg-[#FFFBEB] rounded-xl p-3 border-l-4 border-[#F59E0B] space-y-0.5">
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
             TERBILANG
           </p>
           <p className="text-xs font-bold italic text-slate-800">
             {terbilangText || 'Nol rupiah'}
           </p>
        </div>
      )}

      {/* Info Pembayaran Box */}
      {!isDelivery && !isLunas && (
        <div className="mb-4 bg-[#FFFBEB] rounded-xl p-3 border border-[#FCD34D] space-y-1">
           <p className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider">
             INFO PEMBAYARAN REKENING
           </p>
           <p className="text-xs text-slate-700 font-medium">
             Transfer ke rekening atas nama: <strong className="text-slate-900">{companyName}</strong>
           </p>
        </div>
      )}

      {/* Signatures */}
      <div className="mt-auto pt-4 grid grid-cols-2 gap-8">
         <div className="text-center space-y-8">
            <p className="text-xs font-medium text-slate-500">Hormat kami,</p>
            <div>
              <div className="w-32 h-[1px] bg-slate-300 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-800">{companyName}</p>
              <p className="text-[10px] text-slate-400">Pihak Penjual</p>
            </div>
         </div>
         <div className="text-center space-y-8">
            <p className="text-xs font-medium text-slate-500">Diterima oleh,</p>
            <div>
              <div className="w-32 h-[1px] bg-slate-300 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-800">{customerName}</p>
              <p className="text-[10px] text-slate-400">Pihak Pembeli</p>
            </div>
         </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-2 border-t border-slate-100 text-center">
         <p className="text-[9px] text-slate-400 font-medium">
           Ref: {invoiceNo} | {formatDate(txnDate)} | Dashboard GPK — Platform Manajemen Bisnis
         </p>
      </div>

    </div>
  )
}

/**
 * SembakoInvoicePreview
 * Printable Modal Wrapper
 */
export default function SembakoInvoicePreview({ data, mode = 'invoice', onClose }) {
  if (!data) return null

  const handlePrint = () => {
    window.print()
  }

  const isDelivery = mode === 'delivery'

  return (
    <div className="fixed inset-0 z-[100] bg-[#0F172A]/40 backdrop-blur-md flex items-center justify-center p-4 md:p-8 print:p-0 print:bg-white print:relative print:z-0">
      {/* Controls - Hidden on Print */}
      <div className="absolute top-4 right-4 flex gap-2 print:hidden">
        <Button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2 shadow-xl border-none">
          <Printer size={18} /> Cetak {isDelivery ? 'Surat Jalan' : 'Invoice'}
        </Button>
        <Button onClick={onClose} variant="secondary" className="bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm">
          <X size={18} />
        </Button>
      </div>

      {/* Paper Container */}
      <div className="w-full max-w-[800px] max-h-[90vh] overflow-y-auto rounded-md shadow-2xl">
        <SembakoInvoicePaper data={data} mode={mode} />
      </div>
    </div>
  )
}
