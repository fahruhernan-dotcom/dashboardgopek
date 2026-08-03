import React, { Suspense, useState } from 'react'
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Printer, Save, Loader2, CheckCircle2, Lock, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/useAuth'
import { getSubscriptionStatus } from '@/lib/subscriptionUtils'
import { SaleInvoice } from './templates/SaleInvoice'
import { PurchaseInvoice } from './templates/PurchaseInvoice'
import { DeliveryReceipt } from './templates/DeliveryReceipt'
import { PaymentReceipt } from './templates/PaymentReceipt'
import { PeternakInvoice } from './templates/PeternakInvoice'
import { RPATokoInvoice } from './templates/RPATokoInvoice'
import { SembakoInvoice } from './templates/SembakoInvoice'
import { useSaveInvoice } from '@/lib/invoice/useInvoice'
import { generateInvoiceNumber } from '@/lib/invoice/invoiceUtils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDocument({ type, invoiceNumber, data }) {
  const {
    tenant, sale, rpa, farm, delivery, purchase, payment, payments,
    cycle, broker_name, total_ekor, total_berat, price_per_kg,
    invoice, customer, items, showProfit,
    generatedBy,
  } = data

  if (type === 'sale') {
    return (
      <SaleInvoice
        tenant={tenant}
        sale={sale}
        rpa={rpa}
        farm={farm}
        delivery={delivery}
        invoiceNumber={invoiceNumber}
        generatedBy={generatedBy}
        payments={payments}
      />
    )
  }

  if (type === 'purchase') {
    return (
      <PurchaseInvoice
        tenant={tenant}
        purchase={purchase}
        farm={farm}
        invoiceNumber={invoiceNumber}
        generatedBy={generatedBy}
      />
    )
  }

  if (type === 'delivery') {
    return (
      <DeliveryReceipt
        tenant={tenant}
        delivery={delivery}
        sale={sale}
        farm={farm}
        rpa={rpa}
        invoiceNumber={invoiceNumber}
        generatedBy={generatedBy}
      />
    )
  }

  if (type === 'payment_receipt') {
    return (
      <PaymentReceipt
        tenant={tenant}
        payment={payment}
        sale={sale}
        rpa={rpa}
        invoiceNumber={invoiceNumber}
        generatedBy={generatedBy}
      />
    )
  }

  if (type === 'peternak_invoice') {
    return (
      <PeternakInvoice
        tenant={tenant}
        cycle={cycle}
        farm={farm}
        broker_name={broker_name}
        total_ekor={total_ekor}
        total_berat={total_berat}
        price_per_kg={price_per_kg}
        invoiceNumber={invoiceNumber}
        generatedBy={generatedBy}
      />
    )
  }

  if (type === 'rpa_to_toko') {
    return (
      <RPATokoInvoice
        tenant={tenant}
        invoice={invoice}
        customer={customer}
        items={items || []}
        invoiceNumber={invoiceNumber}
        generatedBy={generatedBy}
        showProfit={showProfit ?? false}
      />
    )
  }

  if (type === 'sembako_sale') {
    return (
      <SembakoInvoice
        tenant={tenant}
        invoice={invoice}
        customer={customer}
        items={items || []}
        invoiceNumber={invoiceNumber}
        generatedBy={generatedBy}
        showProfit={showProfit ?? false}
      />
    )
  }

  return null
}

function getFileName(type, invoiceNumber) {
  const prefixes = {
    sale:             'Invoice',
    purchase:         'BuktiBeli',
    delivery:         'SuratJalan',
    payment_receipt:  'Kwitansi',
    peternak_invoice: 'TagihanTernak',
    rpa_to_toko:      'InvoiceRPA',
    sembako_sale:     'InvoiceSembako',
  }
  return `${prefixes[type] || 'Dokumen'}_${invoiceNumber}.pdf`
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function PDFSkeleton() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-[#111C24] rounded-xl">
      <Loader2 size={28} className="animate-spin text-emerald-400" />
      <p className="text-sm text-[#4B6478] font-medium">Memuat preview PDF...</p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
// Props:
//   type: 'sale' | 'purchase'
//   data: object — lihat buildDocument()
//   isOpen: boolean
//   onClose: () => void

export default function InvoicePreviewModal({ type, data, isOpen, onClose }) {
  const typeMap = {
    sale: 'sale', purchase: 'purchase', delivery: 'delivery',
    payment_receipt: 'payment_receipt',
    peternak_invoice: 'peternak_invoice', rpa_to_toko: 'rpa_to_toko',
    sembako_sale: 'sembako_sale',
  }
  const [invoiceNumber] = useState(() => generateInvoiceNumber(typeMap[type] || 'sale'))
  const [saved, setSaved] = useState(false)

  const { tenant } = useAuth()
  const sub = getSubscriptionStatus(tenant)
  const isStarter = sub.status !== 'active' && sub.status !== 'trial'

  const { mutate: saveInvoice, isPending: isSaving } = useSaveInvoice()

  if (!isOpen || !data) return null

  const doc = buildDocument({ type, invoiceNumber, data })
  if (!doc) return null

  const fileName = getFileName(type, invoiceNumber)

  const titles = {
    sale:             'Invoice Penjualan',
    purchase:         'Bukti Pembelian',
    delivery:         'Surat Jalan',
    payment_receipt:  'Kwitansi Pembayaran',
    peternak_invoice: 'Tagihan Penjualan Ternak',
    rpa_to_toko:      'Invoice Penjualan (RPA)',
    sembako_sale:     'Invoice Penjualan Sembako',
  }
  const title = titles[type] || 'Dokumen'

  const referenceId =
    type === 'purchase'         ? data.purchase?.id :
    type === 'delivery'         ? data.delivery?.id :
    type === 'payment_receipt'  ? data.payment?.id  :
    type === 'peternak_invoice' ? data.cycle?.id    :
    type === 'rpa_to_toko'      ? data.invoice?.id  :
    type === 'sembako_sale'     ? data.invoice?.id  :
    data.sale?.id

  const recipientName =
    type === 'purchase'         ? (data.farm?.farm_name               || '-') :
    type === 'peternak_invoice' ? (data.broker_name                   || '-') :
    type === 'rpa_to_toko'      ? (data.customer?.customer_name       || '-') :
    type === 'sembako_sale'     ? (data.customer?.customer_name       || '-') :
    (data.rpa?.rpa_name || '-')

  const totalAmount =
    type === 'purchase'         ? Number(data.purchase?.total_cost    || 0) :
    type === 'payment_receipt'  ? Number(data.payment?.amount         || 0) :
    type === 'peternak_invoice' ? Number(data.cycle?.total_revenue    || 0) :
    type === 'rpa_to_toko'      ? Number(data.invoice?.total_amount   || 0) :
    type === 'sembako_sale'     ? Number(data.invoice?.total_amount   || 0) :
    Number(data.sale?.total_revenue || 0)

  const handleSave = () => {
    saveInvoice(
      {
        invoice_type:   type,
        reference_id:   referenceId,
        recipient_name: recipientName,
        total_amount:   totalAmount,
        metadata: {
          invoice_number: invoiceNumber,
          generated_by:   data.generatedBy,
        },
      },
      {
        onSuccess: () => {
          setSaved(true)
          toast.success('Invoice tersimpan ke riwayat')
        },
        onError: (err) => {
          toast.error('Gagal simpan: ' + err.message)
        },
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        className="bg-[#0C1319] border border-white/[0.08] p-0 flex flex-col overflow-hidden max-w-[900px] w-[95vw] h-[90dvh] rounded-[20px]"
      >
        {/* Header */}
        <DialogHeader className="flex-row items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-white/[0.08] shrink-0">
          <div>
            <DialogTitle className="font-display font-bold text-base sm:text-lg text-white leading-none">
              {title}
            </DialogTitle>
            <DialogDescription className="text-[10px] sm:text-[11px] text-[#4B6478] mt-1 font-mono">
              {invoiceNumber}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* PDF Viewer / Upgrade Wall */}
        <div className="flex-1 overflow-hidden px-2 sm:px-4 py-2 sm:py-3">
          {isStarter ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 rounded-xl relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0D1F2E 0%, #0A1520 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {/* Blurred fake lines */}
              <div className="absolute inset-0 opacity-10 pointer-events-none select-none p-8 flex flex-col gap-3 blur-sm">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-3 rounded-full bg-white/40" style={{ width: `${55 + (i % 3) * 15}%` }} />
                ))}
              </div>

              {/* Lock overlay */}
              <div className="relative z-10 flex flex-col items-center text-center gap-4 px-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Lock size={28} className="text-emerald-400" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
                    <FileText size={11} className="text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Fitur Pro</span>
                  </div>
                  <h3 className="font-display text-xl font-black text-white mb-2">
                    Generate Invoice & PDF
                  </h3>
                  <p className="text-sm text-[#64748B] max-w-xs leading-relaxed">
                    Buat invoice, surat jalan, dan kwitansi PDF profesional. Tersedia di plan <span className="text-white font-bold">Pro</span> dan <span className="text-white font-bold">Business</span>.
                  </p>
                </div>
                <Link
                  to="/upgrade"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm rounded-xl transition-colors shadow-[0_4px_20px_rgba(2, 26, 2,0.3)]"
                >
                  Lihat Paket Pro →
                </Link>
              </div>
            </div>
          ) : (
          <Suspense fallback={<PDFSkeleton />}>
            <PDFViewer
              width="100%"
              height="100%"
              style={{ borderRadius: '12px', border: 'none' }}
              showToolbar={true}
            >
              {doc}
            </PDFViewer>
          </Suspense>
          )}
        </div>

        {/* Footer actions */}
        <div className="shrink-0 p-4 sm:px-6 sm:py-4 border-t border-white/[0.08] flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 overflow-y-auto max-h-[30dvh]">
          {/* Simpan ke riwayat */}
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || saved || isStarter}
            className="flex-1 sm:flex-none h-11 border-white/10 bg-white/[0.03] text-[#94A3B8] font-semibold text-[10px] sm:text-xs uppercase tracking-widest rounded-xl hover:bg-white/[0.06] disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin mr-1 sm:mr-2" />
            ) : saved ? (
              <CheckCircle2 size={14} className="text-emerald-400 mr-1 sm:mr-2" />
            ) : (
              <Save size={14} className="mr-1 sm:mr-2" />
            )}
            {saved ? 'Tersimpan' : 'Simpan'}
          </Button>

          {/* Print */}
          <Button
            variant="outline"
            onClick={() => window.print()}
            disabled={isStarter}
            className="flex-1 sm:flex-none h-11 border-white/10 bg-white/[0.03] text-[#94A3B8] font-semibold text-[10px] sm:text-xs uppercase tracking-widest rounded-xl hover:bg-white/[0.06] disabled:opacity-50"
          >
            <Printer size={14} className="mr-1 sm:mr-2" />
            Print
          </Button>

          {/* Download PDF */}
          {isStarter ? (
            <Button
              disabled
              className="w-full sm:w-auto sm:ml-auto h-11 bg-white/[0.05] text-white/30 font-bold text-[10px] sm:text-xs uppercase tracking-widest rounded-xl cursor-not-allowed"
            >
              <Lock size={14} className="mr-1 sm:mr-2" />
              Download — Pro Only
            </Button>
          ) : (
          <PDFDownloadLink document={doc} fileName={fileName} className="w-full sm:w-auto sm:ml-auto">
            {({ loading }) => (
              <Button
                disabled={loading}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest rounded-xl shadow-[0_4px_16px_rgba(2, 26, 2,0.25)] active:scale-95 transition-transform disabled:opacity-60"
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
