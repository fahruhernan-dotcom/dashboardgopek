import React from 'react'
import { Printer, X, Download, FileText, Truck } from 'lucide-react'
import { formatIDR, formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * SembakoInvoicePreview
 * Professional Printable Invoice & Surat Jalan
 * @param {Object} data - The sale/invoice data
 * @param {string} mode - 'invoice' (with prices) or 'delivery' (Surat Jalan, no prices)
 */
export default function SembakoInvoicePreview({ data, mode = 'invoice', onClose }) {
  if (!data) return null

  const handlePrint = () => {
    window.print()
  }

  const isDelivery = mode === 'delivery'

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 print:p-0 print:bg-white print:relative print:z-0">
      {/* Controls - Hidden on Print */}
      <div className="absolute top-4 right-4 flex gap-2 print:hidden">
        <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 gap-2 shadow-xl">
          <Printer size={18} /> Cetak {isDelivery ? 'Surat Jalan' : 'Invoice'}
        </Button>
        <Button onClick={onClose} variant="secondary" className="bg-[#111C24] text-white hover:bg-white/10 border-white/10">
          <X size={18} />
        </Button>
      </div>

      {/* Paper Container */}
      <div className={cn(
        "bg-white text-slate-950 w-full max-w-[800px] min-h-[1050px] shadow-2xl p-[40px] md:p-[60px] flex flex-col font-sans overflow-y-auto",
        "print:shadow-none print:max-w-full print:min-h-0 print:p-0"
      )}>
        
        {/* Header */}
        <div className="flex justify-between items-start mb-10 border-b-2 border-slate-900 pb-8">
           <div className="space-y-1">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
                {isDelivery ? 'SURAT JALAN' : 'INVOICE'}
              </h1>
              <p className="text-xs font-bold text-slate-500 tracking-widest">{data.invoiceNumber || data.invoice_number}</p>
           </div>
           <div className="text-right">
              <h2 className="text-xl font-black text-slate-900 uppercase">SEMBAKO DISTRIBUSI</h2>
              <p className="text-[10px] font-bold text-slate-600 max-w-[200px] ml-auto uppercase leading-tight">
                Jl. Niaga Utama No. 88, Kawasan Pergudangan<br/>
                Telp: (021) 8899-7766 | WA: 0812-3456-7890
              </p>
           </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-10 mb-10">
           <div className="space-y-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Kepada Yth:</p>
                <p className="text-lg font-black text-slate-900 uppercase leading-none mb-1">{data.customerName || data.customer_name}</p>
                <p className="text-xs font-bold text-slate-600 uppercase leading-tight">{data.customerAddress || 'Alamat tidak tersedia'}</p>
                {data.customerPhone && <p className="text-xs font-bold text-slate-500 mt-1">Telp: {data.customerPhone}</p>}
              </div>
           </div>
           <div className="space-y-4 text-right flex flex-col items-end">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right w-full max-w-[240px]">
                 <span className="text-[9px] font-black text-slate-400 uppercase">Tanggal:</span>
                 <span className="text-[11px] font-black text-slate-900">{formatDate(data.transactionDate || data.transaction_date)}</span>
                 
                 <span className="text-[9px] font-black text-slate-400 uppercase">Jatuh Tempo:</span>
                 <span className="text-[11px] font-black text-slate-900">{data.dueDate ? formatDate(data.dueDate) : '-'}</span>
                 
                 {data.driverName && (
                   <>
                    <span className="text-[9px] font-black text-slate-400 uppercase">Sopir:</span>
                    <span className="text-[11px] font-black text-slate-900 uppercase">{data.driverName}</span>
                   </>
                 )}
                 {data.vehiclePlate && (
                    <>
                      <span className="text-[9px] font-black text-slate-400 uppercase">No. Polisi:</span>
                      <span className="text-[11px] font-black text-slate-900 uppercase">{data.vehiclePlate}</span>
                    </>
                 )}
              </div>
           </div>
        </div>

        {/* Table */}
        <div className="flex-1">
           <table className="w-full border-collapse">
              <thead>
                 <tr className="border-y-2 border-slate-900">
                    <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-900 w-12">No</th>
                    <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-900">Item Produk</th>
                    <th className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-900 w-24">Unit</th>
                    <th className="py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-900 w-32">Jumlah</th>
                    {!isDelivery && (
                      <th className="py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-900 w-40">Harga / Unit</th>
                    )}
                    {!isDelivery && (
                      <th className="py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-900 w-48">Subtotal</th>
                    )}
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {(data.items || data.sembako_sale_items || []).map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-b-0">
                       <td className="py-4 text-xs font-bold text-slate-400">{idx + 1}</td>
                       <td className="py-4">
                          <p className="text-xs font-black text-slate-900 uppercase leading-none">{item.product_name}</p>
                       </td>
                       <td className="py-4 text-center text-xs font-bold text-slate-600 uppercase">{item.unit || 'PCS'}</td>
                       <td className="py-4 text-right text-xs font-black text-slate-900">{item.quantity}</td>
                       {!isDelivery && (
                         <td className="py-4 text-right text-xs font-bold text-slate-900">{formatIDR(item.price_per_unit)}</td>
                       )}
                       {!isDelivery && (
                         <td className="py-4 text-right text-xs font-black text-slate-900">{formatIDR(item.quantity * item.price_per_unit)}</td>
                       )}
                    </tr>
                 ))}
                 
                 {/* Filler Rows to push footer down if few items */}
                 {/* (Omitted for simplicity, table is flex-1 anyway) */}
              </tbody>
           </table>
        </div>

        {/* Summary Block */}
        {!isDelivery && (
          <div className="mt-8 border-t-2 border-slate-900 pt-6 flex justify-between">
             <div className="w-1/2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Catatan:</p>
                <p className="text-[10px] italic text-slate-600 leading-tight">
                  {data.notes || 'Hanya barang yang sudah dicek dapat dikembalikan. Pembayaran lunas dianggap sah jika disertai stempel resmi.'}
                </p>
             </div>
             <div className="w-full max-w-[280px] space-y-2">
                <div className="flex justify-between items-center text-xs">
                   <span className="font-bold text-slate-500 uppercase">Subtotal</span>
                   <span className="font-black text-slate-900">{formatIDR(data.revenue || data.total_amount)}</span>
                </div>
                {data.otherCost > 0 && (
                  <div className="flex justify-between items-center text-xs">
                     <span className="font-bold text-slate-500 uppercase">Biaya Lain</span>
                     <span className="font-black text-slate-900">{formatIDR(data.otherCost)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                   <span className="text-sm font-black text-slate-900 uppercase">TOTAL AKHIR</span>
                   <span className="text-lg font-black text-slate-900">{formatIDR((data.revenue || data.total_amount) + (data.otherCost || 0))}</span>
                </div>
             </div>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-20 grid grid-cols-3 gap-8">
           <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-16">Diterima Oleh,</p>
              <div className="w-32 h-[1px] bg-slate-400 mx-auto" />
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">( Cap & Tanda-Tangan Toko )</p>
           </div>
           <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-16">Diserahkan Oleh,</p>
              <div className="w-32 h-[1px] bg-slate-400 mx-auto" />
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">( Sopir / Dealer )</p>
           </div>
           <div className="text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-16">Hormat Kami,</p>
              <div className="w-32 h-[1px] bg-slate-900 mx-auto" />
              <p className="text-[9px] font-black text-slate-950 uppercase mt-1">Admin Sembako</p>
           </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-10 text-center">
           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">
             Dokumen ini dicetak secara otomatis melalui Sistem Broker Dashboard pada {new Date().toLocaleString()}
           </p>
        </div>

      </div>
    </div>
  )
}
