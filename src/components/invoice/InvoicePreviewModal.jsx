import React from 'react'
import { PDFDownloadLink } from '@/lib/pdfFallback.jsx'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Printer, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { generateInvoiceNumber } from '@/lib/invoice/invoiceUtils'
import { SembakoInvoice } from './templates/SembakoInvoice'
import { SembakoInvoicePaper } from '@/dashboard/broker/sembako_broker/SembakoInvoicePreview'

export default function InvoicePreviewModal({ type = 'sembako_sale', data, isOpen, onClose }) {
  const { tenant } = useAuth()
  if (!isOpen || !data) return null

  // Normalize data for both paper preview & PDF generation
  const inv = data.invoice || data.sale || data
  const cust = data.customer || inv?.sembako_customers || inv?.customer || {}
  const rawItems = data.items || inv?.sembako_sale_items || inv?.items || []

  const invNo = inv?.invoice_number || data.invoiceNumber || generateInvoiceNumber('sembako_sale')
  const txnDate = inv?.transaction_date || data.transactionDate || new Date().toISOString()
  const dueDate = inv?.due_date || data.dueDate || null

  const normalizedItems = rawItems.map(item => {
    const qty = Number(item.quantity || item.quantity_kg || item.qty || 0)
    const price = Number(item.price_per_unit ?? item.sell_price ?? item.unit_price ?? item.price ?? item.price_per_kg ?? (qty > 0 && item.subtotal ? item.subtotal / qty : 0) ?? 0)
    const cost = Number(item.cogs_per_unit ?? item.cost_per_unit ?? item.cost_per_kg ?? item.cogs ?? 0)
    const subtotal = Number(item.subtotal ?? Math.round(qty * price))
    return {
      product_name: item.product_name || item.sembako_products?.product_name || 'Produk',
      quantity: qty,
      quantity_kg: qty,
      unit: item.unit || item.sembako_products?.unit || 'pcs',
      price_per_unit: price,
      sell_price: price,
      price_per_kg: price,
      cost_per_unit: cost,
      cost_per_kg: cost,
      subtotal: subtotal
    }
  })

  const totalAmount = Number(inv?.total_amount || data.revenue || data.total_amount || 0)
  const paidAmount = Number(inv?.paid_amount || data.paid_amount || 0)
  const remainingAmount = Number(inv?.remaining_amount ?? Math.max(0, totalAmount - paidAmount))
  const paymentStatus = inv?.payment_status || data.payment_status || (remainingAmount === 0 ? 'lunas' : paidAmount > 0 ? 'sebagian' : 'belum_lunas')
  const payments = inv?.sembako_payments || data.payments || data.sembako_payments || []

  const paperData = {
    tenant: data.tenant || tenant || { business_name: 'GPK', phone: '-' },
    invoice_number: invNo,
    transaction_date: txnDate,
    due_date: dueDate,
    customer_name: cust?.customer_name || inv?.customer_name || data.customerName || 'Customer',
    customer_type: cust?.customer_type || 'warung',
    customer_phone: cust?.phone || data.customerPhone || '-',
    customer_address: cust?.address || data.customerAddress || '',
    total_amount: totalAmount,
    paid_amount: paidAmount,
    remaining_amount: remainingAmount,
    delivery_cost: Number(inv?.delivery_cost || data.delivery_cost || data.deliveryCost || 0),
    other_cost: Number(inv?.other_cost || data.other_cost || data.otherCost || 0),
    payment_status: paymentStatus,
    items: normalizedItems,
    payments: payments,
    sembako_payments: payments,
    notes: inv?.notes || data.notes || '',
    sembako_deliveries: inv?.sembako_deliveries || data.sembako_deliveries || [],
  }

  const pdfDoc = (
    <SembakoInvoice
      tenant={paperData.tenant}
      invoice={{
        invoice_number: invNo,
        transaction_date: txnDate,
        due_date: dueDate,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        remaining_amount: remainingAmount,
        delivery_cost: paperData.delivery_cost,
        other_cost: paperData.other_cost,
        payment_status: paymentStatus,
        notes: paperData.notes,
        sembako_payments: payments,
      }}
      customer={{
        customer_name: paperData.customer_name,
        customer_type: paperData.customer_type,
        phone: paperData.customer_phone,
        address: paperData.customer_address,
      }}
      items={normalizedItems}
      payments={payments}
      invoiceNumber={invNo}
      generatedBy={data.generatedBy || 'Admin GPK'}
      showProfit={data.showProfit ?? false}
    />
  )

  const fileName = `Invoice_${invNo}.pdf`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        className="bg-[#0C1319] border border-white/[0.08] p-0 flex flex-col overflow-hidden max-w-[850px] w-[95vw] h-[92dvh] rounded-[20px]"
      >
        {/* Header */}
        <DialogHeader className="flex-row items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-white/[0.08] shrink-0">
          <div>
            <DialogTitle className="font-display font-bold text-base sm:text-lg text-white leading-none">
              Invoice Penjualan Sembako
            </DialogTitle>
            <DialogDescription className="text-[10px] sm:text-[11px] text-[#4B6478] mt-1 font-mono">
              {invNo}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Paper Preview Container (100% Reliable HTML Rendering) */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-950/80 flex justify-center items-start print:bg-white print:p-0">
          <div className="w-full max-w-[800px] shadow-2xl rounded-lg overflow-hidden bg-white">
            <SembakoInvoicePaper data={paperData} mode="invoice" />
          </div>
        </div>

        {/* Action Bar */}
        <div className="shrink-0 p-4 sm:px-6 sm:py-4 border-t border-white/[0.08] flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">

          <Button
            variant="outline"
            onClick={() => window.print()}
            className="flex-1 sm:flex-none h-11 border-white/10 bg-white/[0.03] text-[#94A3B8] font-semibold text-[10px] sm:text-xs uppercase tracking-widest rounded-xl hover:bg-white/[0.06]"
          >
            <Printer size={14} className="mr-1 sm:mr-2" />
            Print
          </Button>

          {/* Download PDF */}
          <PDFDownloadLink document={pdfDoc} fileName={fileName} className="w-full sm:w-auto sm:ml-auto">
            {({ loading }) => (
              <Button
                disabled={loading}
                className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] sm:text-xs uppercase tracking-widest rounded-xl shadow-[0_4px_16px_rgba(245,158,11,0.25)] active:scale-95 transition-transform disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin mr-1 sm:mr-2" />
                ) : (
                  <Download size={14} className="mr-1 sm:mr-2" />
                )}
                {loading ? 'Memproses...' : 'Download PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </DialogContent>
    </Dialog>
  )
}
