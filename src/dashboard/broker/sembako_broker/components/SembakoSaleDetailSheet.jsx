import React, { useState } from 'react'
import { Truck, Store, FileText, CreditCard, Smartphone, ArrowRightLeft, Pencil, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { formatIDR } from '@/lib/format'
import { useAuth } from '@/lib/hooks/useAuth'
import { isSuperadmin } from '@/lib/auth'
import { useDeleteSembakoSale, useVoidSembakoSaleReturn } from '@/lib/hooks/useSembakoData'
import InvoicePreviewModal from '@/components/invoice/InvoicePreviewModal'
import { C, sBtn, sLabel, DetailRow, fmtDate, generateWAMessage, toWaLink } from './sembakoSaleUtils'
import { SembakoPaymentSheet } from './SembakoPaymentSheet'

export function SembakoSaleDetailSheet({ isOpen, onOpenChange, sale, onEdit }) {
  const { tenant, profile } = useAuth()
  const deleteSale = useDeleteSembakoSale()
  const createReturn = useVoidSembakoSaleReturn()
  const isOwner = profile?.role === 'owner' || isSuperadmin(profile)
  const [payTarget, setPayTarget] = useState(null)
  const [invoiceModal, setInvoiceModal] = useState({ open: false, type: null })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmReturn, setConfirmReturn] = useState(false)

  if (!sale) return null

  const items = Array.isArray(sale.sembako_sale_items) ? sale.sembako_sale_items : []
  const totalCogs = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (i.cogs_per_unit || 0)), 0)
  const profit = (sale.total_amount || 0) - totalCogs - (sale.delivery_cost || 0) - (sale.other_cost || 0)

  const handleWA = () => {
    const phone = sale.sembako_customers?.phone || ''
    const msg = generateWAMessage(sale, tenant)
    window.open(toWaLink(phone, msg), '_blank')
  }

  const handleReturn = async () => {
    try {
      const returnItems = items.map(it => ({
        product_id: it.product_id,
        quantity: it.quantity,
        batch_id: it.batch_id || it.sembako_stock_out?.[0]?.batch_id
      })).filter(it => it.product_id && it.batch_id)

      if (returnItems.length === 0) {
        setConfirmReturn(false)
        return toast.error('Data batch produk tidak ditemukan. Retur gagal.')
      }

      await createReturn.mutateAsync({
        sale_id: sale.id,
        customer_id: sale.customer_id,
        items: returnItems
      })
      setConfirmReturn(false)
      onOpenChange(false)
    } catch { /* error handled by hook */ }
  }

  const handleDelete = async () => {
    try {
      await deleteSale.mutateAsync(sale.id)
      toast.success('Transaksi dihapus')
      setConfirmDelete(false)
      onOpenChange(false)
    } catch { /* error handled by hook */ }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="right" style={{ background: C.bg, borderLeft: `1px solid ${C.border}`, width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', padding: 0 }}>
          <SheetHeader style={{ padding: '24px', borderBottom: `1px solid ${C.border}`, textAlign: 'left' }}>
            <SheetDescription className="sr-only">Detail rincian transaksi penjualan sembako</SheetDescription>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <SheetTitle style={{ color: C.text, fontWeight: 900, fontSize: '20px', fontFamily: 'DM Sans' }}>Detail Penjualan</SheetTitle>
                <p style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>{sale.invoice_number} - {fmtDate(sale.transaction_date)}</p>
              </div>
              <Badge className={cn(
                "rounded-full px-3 py-1 border-none font-black text-[10px] uppercase tracking-wider pointer-events-none",
                sale.payment_status === 'lunas' ? 'bg-emerald-500/10 text-emerald-400' :
                sale.payment_status === 'sebagian' ? 'bg-amber-500/10 text-amber-400' :
                'bg-red-500/10 text-red-400'
              )}>
                {sale.payment_status === 'lunas' ? 'LUNAS' : sale.payment_status === 'sebagian' ? 'SEBAGIAN' : 'BELUM LUNAS'}
              </Badge>
            </div>
          </SheetHeader>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Section: Customer */}
            <div style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: '16px' }}>
              <p style={sLabel}>TOKO / CUSTOMER</p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(234,88,12,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
                  <Store size={20} />
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: C.text }}>{sale.sembako_customers?.customer_name || sale.customer_name || 'Umum'}</p>
                  <p style={{ fontSize: '12px', color: C.muted }}>{sale.sembako_customers?.phone || '-'}</p>
                </div>
              </div>
            </div>

            {/* Section: Items Table */}
            <div>
              <p style={sLabel}>DAFTAR BARANG</p>
              <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px', color: C.muted, fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>Produk</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: C.muted, fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: C.muted, fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>Harga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td style={{ padding: '12px', color: C.text, fontWeight: 600 }}>{it.product_name}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: C.text }}>{it.quantity} {it.unit}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: C.text, fontWeight: 700 }}>{formatIDR(it.price_per_unit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section: Financials */}
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}` }}>
              <DetailRow label="Subtotal Barang" value={formatIDR(sale.total_amount)} />
              <DetailRow label="Biaya Kirim" value={formatIDR(sale.delivery_cost)} />
              <DetailRow label="Biaya Lainnya" value={formatIDR(sale.other_cost)} />
              <div style={{ height: 1, background: C.border, margin: '12px 0' }} />
              <DetailRow label="Total Tagihan" value={formatIDR(sale.total_amount)} highlight />
              <DetailRow label="Sudah Dibayar" value={formatIDR(sale.paid_amount)} color={C.green} />
              <DetailRow label="Sisa Piutang" value={formatIDR(sale.remaining_amount)} color={sale.remaining_amount > 0 ? C.red : C.green} bold />
            </div>

            {/* Section: Profit Analysis (Owner Only) */}
            {isOwner && (
              <div style={{ background: 'rgba(2, 26, 2,0.05)', borderRadius: '16px', padding: '16px', border: `1px solid rgba(2, 26, 2,0.15)` }}>
                <p style={{ ...sLabel, color: C.green }}>ANALISIS LABA (INTERNAL)</p>
                <div style={{ marginTop: '8px' }}>
                  <DetailRow label="Total COGS / Modal" value={formatIDR(totalCogs)} />
                  <DetailRow label="Estimasi Net Profit" value={formatIDR(profit)} color={profit >= 0 ? C.green : C.red} bold highlight />
                </div>
              </div>
            )}

            {/* Section: Delivery Link */}
            {sale.sembako_deliveries?.[0] && (
              <div style={{ background: 'rgba(96,165,250,0.05)', borderRadius: '16px', padding: '16px', border: `1px solid rgba(96,165,250,0.15)` }}>
                <p style={{ ...sLabel, color: '#60A5FA' }}>PENGIRIMAN</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Truck size={14} color="#60A5FA" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.text }}>{sale.sembako_deliveries[0].vehicle_plate}</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: '#60A5FA', textTransform: 'uppercase' }}>{sale.sembako_deliveries[0].status}</span>
                </div>
              </div>
            )}

            {sale.notes && (
              <div>
                <p style={sLabel}>CATATAN</p>
                <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: `1px solid ${C.border}`, marginTop: '8px' }}>
                  "{sale.notes}"
                </p>
              </div>
            )}
          </div>

          <div style={{ padding: '20px 24px 32px', borderTop: `1px solid ${C.border}`, background: C.bg, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => setInvoiceModal({ open: true, type: 'sale' })}
                style={{ ...sBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
              >
                <FileText size={16} /> Invoice
              </button>
              {sale.payment_status !== 'lunas' && (
                <button
                  onClick={() => setPayTarget(sale)}
                  style={{ ...sBtn(true), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
                >
                  <CreditCard size={16} /> Bayar
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={handleWA}
                style={{ ...sBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderColor: '#25D366', color: '#25D366' }}
              >
                <Smartphone size={16} /> Kirim WA
              </button>
              <button
                onClick={() => setConfirmReturn(true)}
                style={{ ...sBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderColor: C.amber, color: C.amber }}
              >
                <ArrowRightLeft size={16} /> Retur Barang
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => onEdit(sale)}
                style={{ ...sBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
              >
                <Pencil size={16} /> Edit
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                style={{ ...sBtn(false), color: C.red, border: `1px solid rgba(239,68,68,0.2)`, background: 'rgba(239,68,68,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
              >
                <Trash2 size={16} /> Hapus
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmReturn} onOpenChange={setConfirmReturn}>
        <AlertDialogContent className="bg-[#0C1319] border border-white/10 rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-500 font-black text-base uppercase tracking-wide">
              Konfirmasi Retur
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#4B6478] text-sm font-medium">
              Catat RETUR untuk seluruh barang di nota ini? Stok akan dikembalikan ke gudang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2">
            <AlertDialogCancel className="flex-1 h-11 bg-white/5 border-white/10 text-white font-black uppercase text-xs tracking-wider hover:bg-white/10">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReturn}
              className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black uppercase text-xs tracking-wider border-none"
            >
              Ya, Retur
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="bg-[#0C1319] border border-white/10 rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500 font-black text-base uppercase tracking-wide">
              Hapus Transaksi?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#4B6478] text-sm font-medium">
              Transaksi ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2">
            <AlertDialogCancel className="flex-1 h-11 bg-white/5 border-white/10 text-white font-black uppercase text-xs tracking-wider hover:bg-white/10">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white font-black uppercase text-xs tracking-wider border-none"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SembakoPaymentSheet sale={payTarget} onClose={() => setPayTarget(null)} />

      {sale && invoiceModal.open && (
        <InvoicePreviewModal
          type={invoiceModal.type === 'sale' ? 'sembako_sale' : invoiceModal.type}
          isOpen={invoiceModal.open}
          onClose={() => setInvoiceModal({ open: false, type: null })}
          data={{
            tenant:      { business_name: tenant?.business_name, phone: tenant?.phone, location: tenant?.location },
            invoice:     sale,
            customer:    sale.sembako_customers,
            items:       items.map(it => ({
              product_name: it.product_name,
              quantity_kg: it.quantity,
              price_per_kg: it.price_per_unit,
              cost_per_kg: it.cogs_per_unit,
              subtotal: (it.quantity || 0) * (it.price_per_unit || 0)
            })),
            generatedBy: profile?.full_name || '',
            showProfit:  false,
          }}
        />
      )}
    </>
  )
}
