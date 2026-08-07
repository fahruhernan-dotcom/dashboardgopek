import React, { useState } from 'react'
import { Truck, Store, FileText, CreditCard, Smartphone, ArrowRightLeft, Pencil, Trash2, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
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
import {
  useDeleteSembakoSale,
  useCreateSembakoReturn,
  useVoidSembakoReturnsBySale,
  useSembakoProducts,
  useSembakoReturns,
  useCompleteSembakoDelivery,
  useCreateSembakoDelivery,
  useRefundSembakoSaleOverpay,
} from '@/lib/hooks/useSembakoData'
import InvoicePreviewModal from '@/components/invoice/InvoicePreviewModal'
import { C, sBtn, sLabel, DetailRow, fmtDate, generateWAMessage, toWaLink, InputRupiah, CustomSelect, calculateSaleFinancials } from './sembakoSaleUtils'
import { SembakoPaymentSheet } from './SembakoPaymentSheet'
import { useBackHandler } from '@/lib/hooks/useBackHandler'

export function SembakoSaleDetailSheet({ isOpen, onOpenChange, sale, onEdit }) {
  useBackHandler(isOpen, () => onOpenChange(false))
  const { tenant, profile } = useAuth()
  const deleteSale = useDeleteSembakoSale()
  const createReturn = useCreateSembakoReturn()
  const voidReturnsMut = useVoidSembakoReturnsBySale()
  const completeDelivery = useCompleteSembakoDelivery()
  const createDelivery = useCreateSembakoDelivery()
  const refundOverpay = useRefundSembakoSaleOverpay()
  const { data: products = [] } = useSembakoProducts()
  const { data: returnsList = [] } = useSembakoReturns()

  const [payTarget, setPayTarget] = useState(null)
  const [invoiceModal, setInvoiceModal] = useState({ open: false, type: null })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmReturn, setConfirmReturn] = useState(false)
  const [confirmCancelReturn, setConfirmCancelReturn] = useState(false)
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false)
  const [isRefunding, setIsRefunding] = useState(false)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundInputAmount, setRefundInputAmount] = useState(0)
  const [refundMethod, setRefundMethod] = useState('cash')
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [returnFormItems, setReturnFormItems] = useState([])
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false)

  if (!sale) return null

  const fin = calculateSaleFinancials(sale, returnsList, products)
  const items = fin.items
  const deliveries = Array.isArray(sale.sembako_deliveries) ? sale.sembako_deliveries : []
  const isDelivered = deliveries.length > 0 && deliveries.every(d => d.status === 'delivered')

  const saleReturns = fin.saleReturns
  const totalReturnAmount = fin.totalReturnAmount
  const totalReturnCogs = fin.totalReturnCogs
  const effectiveCogs = fin.effectiveCogs
  const itemsSubtotal = fin.itemsSubtotal
  const deliveryCost = fin.deliveryCost
  const otherCost = fin.otherCost
  const grandTotal = fin.grandTotal
  const rawPaidAmount = fin.rawPaidAmount
  const paidAmount = fin.paidAmount
  const remainingAmount = fin.remainingAmount
  const isOverpaid = fin.isOverpaid
  const overpayAmount = fin.overpayAmount
  const grossProfit = fin.grossProfit
  const profit = fin.profit
  const netMarginPct = fin.netMarginPct
  const isOwner = profile?.role === 'owner' || isSuperadmin(profile)

  const openRefundDialog = () => {
    setRefundInputAmount(overpayAmount)
    setRefundMethod('cash')
    setRefundDialogOpen(true)
  }

  const handleProcessRefund = async () => {
    if (!sale || refundInputAmount <= 0) return
    if (refundInputAmount > overpayAmount) {
      return toast.error(`Nominal melebihi saldo deposit toko (${formatIDR(overpayAmount)})`)
    }
    try {
      setIsRefunding(true)
      await refundOverpay.mutateAsync({
        saleId: sale.id,
        refundAmount: refundInputAmount,
        notes: `Pengembalian (${refundMethod.toUpperCase()}) retur toko (${sale.customer_name || 'Toko'}) Rp ${refundInputAmount}`,
      })
      setRefundDialogOpen(false)
    } catch (e) {
      // handled by toast
    } finally {
      setIsRefunding(false)
    }
  }



  const handleMarkDelivered = async () => {
    try {
      setIsSubmittingDelivery(true)
      if (deliveries.length > 0) {
        const pending = deliveries.filter(d => d.status !== 'delivered')
        for (const d of pending) {
          await completeDelivery.mutateAsync(d.id)
        }
      } else {
        await createDelivery.mutateAsync({
          sale_id: sale.id,
          driver_name: 'Langsung',
          vehicle_type: 'Langsung',
          vehicle_plate: '-',
          delivery_date: sale.transaction_date || new Date().toISOString().slice(0, 10),
          status: 'delivered',
          completed_at: new Date().toISOString(),
          notes: 'Ditandai terkirim via detail nota',
        })
      }
      toast.success('Pesanan berhasil ditandai TERKIRIM')
    } catch (err) {
      console.error('Failed to mark delivery:', err)
    } finally {
      setIsSubmittingDelivery(false)
    }
  }

  const openReturnDialog = () => {
    if (!items || items.length === 0) {
      return toast.error('Tidak ada item pada nota ini untuk diretur.')
    }

    const initialForm = items.map(it => {
      const itemPrice = Number(it.price_per_unit ?? it.sell_price ?? it.unit_price ?? it.price_per_kg ?? 0)
      const existingReturs = saleReturns.filter(r => r.product_id === it.product_id || r.product_name === it.product_name)
      const alreadyReturned = existingReturs.reduce((s, r) => s + Number(r.quantity || 0), 0)
      const maxQty = Math.max(0, Number(it.quantity || 0) - alreadyReturned)

      return {
        product_id: it.product_id,
        product_name: it.product_name,
        unit: it.unit || 'slop',
        unit_price: itemPrice,
        max_qty: maxQty,
        return_qty: 0,
        reason: 'Pita Cukai Cacat / Rusak',
      }
    })

    setReturnFormItems(initialForm)
    setReturnDialogOpen(true)
  }

  const updateReturnFormItem = (idx, field, value) => {
    setReturnFormItems(prev => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  const handleProcessReturn = async () => {
    const activeReturns = returnFormItems.filter(i => Number(i.return_qty) > 0)
    if (activeReturns.length === 0) {
      return toast.error('Silakan isi jumlah barang (qty > 0) yang ingin diretur.')
    }

    for (const it of activeReturns) {
      if (Number(it.return_qty) > it.max_qty) {
        return toast.error(`Jumlah retur ${it.product_name} (${it.return_qty}) melebihi sisa barang (${it.max_qty}).`)
      }
    }

    try {
      setIsSubmittingReturn(true)
      for (const it of activeReturns) {
        const qty = Number(it.return_qty)
        const total = Math.round(qty * it.unit_price)

        await createReturn.mutateAsync({
          return_type: 'sale_return',
          sale_id: sale.id,
          invoice_number: sale.invoice_number,
          customer_id: sale.customer_id,
          party_name: sale.sembako_customers?.customer_name || sale.customer_name || 'Pelanggan',
          product_id: it.product_id,
          product_name: it.product_name,
          quantity: qty,
          unit: it.unit,
          unit_price: it.unit_price,
          total_amount: total,
          reason: it.reason || 'Retur Nota Penjualan',
          action: 'fifo_stock',
          status: 'completed',
          financial_action: 'none',   // jangan auto-potong piutang — user handle refund via dialog
          notes: `Retur ${qty} ${it.unit} ${it.product_name} dari Nota ${sale.invoice_number || sale.id}`
        })
      }

      toast.success('Retur barang berhasil dicatat & disesuaikan ke nota!')
      setReturnDialogOpen(false)
    } catch (err) {
      console.error('[handleProcessReturn error]', err)
      toast.error('Gagal memproses retur barang.')
    } finally {
      setIsSubmittingReturn(false)
    }
  }

  const handleCancelReturn = async () => {
    try {
      await voidReturnsMut.mutateAsync({
        saleId: sale.id,
        invoiceNumber: sale.invoice_number
      })
      setConfirmCancelReturn(false)
    } catch (e) {
      console.error('[handleCancelReturn error]', e)
    }
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
                "rounded-full px-3 py-1 border-none font-black text-[10px] uppercase tracking-wider pointer-events-none shadow-none",
                sale.payment_status === 'lunas' ? 'bg-emerald-55 border-emerald-200 text-emerald-700' :
                sale.payment_status === 'sebagian' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                'bg-rose-50 border-rose-200 text-rose-700'
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
                <div style={{ width: 40, height: 40, borderRadius: '12px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F172A' }}>
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
              <div style={{ marginTop: '12px', background: '#F8FAFC', borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ background: '#F1F5F9' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px', color: C.muted, fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>Produk</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: C.muted, fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: C.muted, fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}>Harga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => {
                      const itemPrice = Number(it.price_per_unit ?? it.sell_price ?? it.unit_price ?? it.price_per_kg ?? 0)
                      const itemReturs = saleReturns.filter(r => r.product_id === it.product_id || r.product_name === it.product_name)
                      const returQty = itemReturs.reduce((s, r) => s + Number(r.quantity || 0), 0)
                      const netQty = Math.max(0, Number(it.quantity || 0) - returQty)

                      return (
                        <tr key={idx} style={{ borderTop: `1px solid ${C.border}` }}>
                          <td style={{ padding: '12px', color: C.text, fontWeight: 600 }}>
                            {it.product_name}
                            {returQty > 0 && (
                              <span style={{ fontSize: '10px', color: '#DC2626', display: 'block', fontWeight: 700, marginTop: '2px' }}>
                                🔄 Ada Retur: -{returQty} {it.unit || 'unit'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: C.text }}>
                            <span style={{ fontWeight: returQty > 0 ? 800 : 600, color: returQty > 0 ? '#16A34A' : C.text }}>
                              {netQty} {it.unit || 'unit'}
                            </span>
                            {returQty > 0 && (
                              <span style={{ fontSize: '10px', color: C.muted, display: 'block', textDecoration: 'line-through' }}>
                                Awal: {it.quantity} {it.unit || 'unit'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', color: C.text, fontWeight: 700 }}>
                            {formatIDR(netQty * itemPrice)}
                            {returQty > 0 && (
                              <span style={{ fontSize: '10px', color: C.muted, display: 'block', fontWeight: 500 }}>
                                @{formatIDR(itemPrice)}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section: Riwayat / Rincian Retur Barang */}
            {saleReturns.length > 0 && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <p style={{ ...sLabel, color: '#DC2626' }}>🔄 RINCIAN RETUR BARANG ({saleReturns.length})</p>
                  <span style={{ fontSize: '11px', fontWeight: 900, color: '#B91C1C' }}>
                    Total Retur: {formatIDR(totalReturnAmount)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {saleReturns.map((ret, rIdx) => (
                    <div key={ret.id || rIdx} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{ret.product_name}</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#DC2626' }}>-{ret.quantity} {ret.unit}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11px', color: '#64748B' }}>
                        <span>Alasan: {ret.reason || 'Klaim Retur'}</span>
                        <span style={{ color: '#D97706', fontWeight: 700 }}>{formatIDR(Number(ret.total_amount || ret.amount || 0) || Math.round(Number(ret.quantity || 0) * Number(ret.unit_price || 0)))}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748B', marginTop: '3px' }}>
                        Status: <strong style={{ color: ret.status === 'completed' ? '#16A34A' : '#D97706' }}>{ret.status === 'completed' ? 'Selesai (Stok Diterima)' : 'Diproses (Pending Validasi Gudang)'}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section: Financials */}
            <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}` }}>
              <DetailRow label="Subtotal Barang" value={formatIDR(itemsSubtotal)} />
              {totalReturnAmount > 0 && (
                <DetailRow label="Potongan Retur Barang" value={`-${formatIDR(totalReturnAmount)}`} color={C.red} bold />
              )}
              {deliveryCost > 0 && (
                <DetailRow label="Biaya Kirim (Tanggungan Seller)" value={formatIDR(deliveryCost)} color="#94A3B8" />
              )}
              {otherCost > 0 && <DetailRow label="Biaya Lainnya" value={formatIDR(otherCost)} />}
              <div style={{ height: 1, background: C.border, margin: '12px 0' }} />
              <DetailRow label={totalReturnAmount > 0 ? "Total Tagihan (Nota Bersih)" : "Total Tagihan"} value={formatIDR(grandTotal)} highlight />
              
              {(fin.grossPaidAmount > 0 || rawPaidAmount > 0) && (
                <DetailRow label="Total Uang Toko Diterima" value={formatIDR(fin.grossPaidAmount || rawPaidAmount)} color={C.green} />
              )}
              {fin.refundPaymentsAmount > 0 && (
                <DetailRow label="Pengembalian Uang Ke Toko (Refund)" value={`-${formatIDR(fin.refundPaymentsAmount)}`} color="#34D399" bold />
              )}
              <DetailRow label="Sudah Dibayar (Bersih)" value={formatIDR(paidAmount)} color={C.green} bold />
              <DetailRow label="Sisa Piutang" value={formatIDR(remainingAmount)} color={remainingAmount > 0 ? C.red : C.green} bold />
              {isOverpaid && (
                <DetailRow label="Sisa Saldo Deposit Toko (Overpay)" value={formatIDR(overpayAmount)} color="#34D399" bold />
              )}

              {/* Warning Alert Banner for Overpaid / Return Cashback */}
              {isOverpaid && (
                <div style={{ marginTop: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <AlertCircle size={18} style={{ color: '#16A34A', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '11px', fontWeight: 900, color: '#16A34A', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        💵 WAJIB KEMBALIKAN UANG KE TOKO: {formatIDR(overpayAmount)}
                      </p>
                      <p style={{ fontSize: '11px', color: '#15803D', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                        Akibat retur barang, total pembayaran yang telah diterima (<strong>{formatIDR(rawPaidAmount)}</strong>) melebihi tagihan bersih (<strong>{formatIDR(grandTotal)}</strong>).<br/>
                        Jika uang sudah diserahkan/ditransfer ke toko, klik tombol di bawah untuk menyelesaikannya.
                      </p>
                      <button
                        type="button"
                        disabled={isRefunding}
                        onClick={openRefundDialog}
                        style={{
                          marginTop: '10px',
                          width: '100%',
                          background: '#0F172A',
                          color: '#FFFFFF',
                          fontWeight: 900,
                          fontSize: '11px',
                          padding: '9px 14px',
                          borderRadius: '10px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
                        }}
                      >
                        {isRefunding ? <Loader2 size={14} className="animate-spin" /> : `✓ Atur / Tandai Pengembalian Uang (${formatIDR(overpayAmount)})`}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section: Profit Analysis (Owner Only) */}
            {isOwner && (
              <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '16px', border: `1px solid #E2E8F0` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ ...sLabel, color: C.green }}>ANALISIS LABA (INTERNAL)</p>
                  <span style={{ fontSize: '10px', fontWeight: 900, color: profit >= 0 ? C.green : C.red }}>
                    Net Margin {netMarginPct}%
                  </span>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <DetailRow label="Total Tagihan" value={formatIDR(grandTotal)} />
                  <DetailRow
                    label={totalReturnAmount > 0 ? 'Total COGS / Modal (Bersih)' : fin.cogsIsEstimate ? 'Total COGS / Modal (estimasi batch)' : 'Total COGS / Modal'}
                    value={formatIDR(effectiveCogs)}
                    color={fin.cogsIsEstimate ? '#F59E0B' : undefined}
                  />
                  <DetailRow label="Gross Profit" value={formatIDR(grossProfit)} color={C.green} />
                  {fin.totalExpenses > 0 && (
                    <DetailRow label="Dikurangi Biaya Operasional" value={`-${formatIDR(fin.totalExpenses)}`} color={C.red} />
                  )}
                  <DetailRow label="Estimasi Net Profit" value={formatIDR(profit)} color={profit >= 0 ? C.green : C.red} bold highlight />
                </div>
              </div>
            )}

            {/* Section: Delivery Status */}
            <div style={{ background: '#F0F9FF', borderRadius: '16px', padding: '16px', border: `1px solid #BAE6FD` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ ...sLabel, color: '#60A5FA' }}>PENGIRIMAN</p>
                <span style={{
                  fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', padding: '3px 10px', borderRadius: '99px',
                  background: isDelivered ? '#F0FDF4' : deliveries.length > 0 ? '#FFFBEB' : '#F1F5F9',
                  color: isDelivered ? '#16A34A' : deliveries.length > 0 ? '#D97706' : '#64748B'
                }}>
                  {isDelivered ? '✓ TERKIRIM' : deliveries.length > 0 ? 'DI JALAN' : 'BELUM DIKIRIM'}
                </span>
              </div>

              {deliveries.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {deliveries.map((d, i) => (
                    <div key={d.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', background: '#FFFFFF', padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Truck size={14} color="#0284C7" />
                        <span style={{ color: C.text, fontWeight: 700 }}>{[d.vehicle_type, d.vehicle_plate].filter(Boolean).join(' ') || 'Pengiriman'}</span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: d.status === 'delivered' ? '#16A34A' : '#D97706' }}>
                        {d.status === 'delivered' ? '✓ Terkirim' : d.status === 'on_route' ? 'Di Jalan' : 'Disiapkan'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {sale.notes && (
              <div>
                <p style={sLabel}>CATATAN</p>
                <p style={{ fontSize: '13px', color: C.muted, fontStyle: 'italic', background: '#F8FAFC', padding: '12px', borderRadius: '12px', border: `1px solid ${C.border}`, marginTop: '8px' }}>
                  "{sale.notes}"
                </p>
              </div>
            )}
          </div>

          <div style={{ padding: '20px 24px 32px', borderTop: `1px solid ${C.border}`, background: C.bg, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!isDelivered ? (
              <button
                onClick={handleMarkDelivered}
                disabled={isSubmittingDelivery}
                style={{
                  ...sBtn(true),
                  background: '#10B981',
                  borderColor: '#10B981',
                  color: '#06090F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  fontWeight: 900,
                  fontSize: '14px',
                  cursor: isSubmittingDelivery ? 'not-allowed' : 'pointer',
                  opacity: isSubmittingDelivery ? 0.7 : 1,
                }}
              >
                {isSubmittingDelivery ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                Pesanan Terkirim
              </button>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px',
                background: 'rgba(16,185,129,0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(16,185,129,0.2)',
                color: '#34D399',
                fontSize: '13px',
                fontWeight: 800,
              }}>
                <CheckCircle2 size={18} /> Pesanan Terkirim
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: (isOverpaid && overpayAmount > 0) || remainingAmount > 0 ? '1fr 1fr' : '1fr', gap: '12px' }}>
              <button
                onClick={() => setInvoiceModal({ open: true, type: 'sale' })}
                style={{ ...sBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
              >
                <FileText size={16} /> Invoice
              </button>
              {isOverpaid && overpayAmount > 0 ? (
                <button
                  disabled={isRefunding}
                  onClick={openRefundDialog}
                  style={{
                    ...sBtn(true),
                    background: '#10B981',
                    borderColor: '#10B981',
                    color: '#022C22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px',
                    fontWeight: 900
                  }}
                >
                  {isRefunding ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Konfirmasi Refund
                </button>
              ) : remainingAmount > 0 ? (
                <button
                  onClick={() => setPayTarget(sale)}
                  style={{ ...sBtn(true), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
                >
                  <CreditCard size={16} /> Bayar
                </button>
              ) : null}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <a
                href={toWaLink(sale.sembako_customers?.phone || '', generateWAMessage(sale, tenant)) || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border border-[#25D366] text-[#25D366] rounded-xl hover:bg-[#25D366]/5 active:scale-95 transition-all text-xs font-bold"
                style={{ height: '48px', textDecoration: 'none' }}
              >
                <Smartphone size={16} /> Kirim WA
              </a>
              {saleReturns.length > 0 ? (
                <button
                  onClick={() => setConfirmCancelReturn(true)}
                  style={{ ...sBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderColor: '#F87171', color: '#F87171', background: 'rgba(248,113,113,0.08)' }}
                >
                  <ArrowRightLeft size={16} /> Batalkan Retur
                </button>
              ) : (
                <button
                  onClick={openReturnDialog}
                  style={{ ...sBtn(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderColor: C.amber, color: C.amber }}
                >
                  <ArrowRightLeft size={16} /> Retur Barang
                </button>
              )}
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

      <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <AlertDialogContent className="bg-[#0C1319] border border-white/10 rounded-2xl max-w-md p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-400 font-black text-lg uppercase tracking-wide flex items-center gap-2">
              💵 Pengembalian Uang Retur / Overpay
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#94A3B8] text-xs">
              Atur nominal pengembalian uang tunai/transfer ke Toko <strong>{sale?.customer_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 my-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Saldo Deposit / Overpay Maksimal</p>
              <p className="text-lg font-black text-emerald-400">{formatIDR(overpayAmount)}</p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#FCD34D] uppercase tracking-wider block mb-1">
                NOMINAL DIKEMBALIKAN SAAT INI
              </label>
              <InputRupiah
                value={refundInputAmount}
                onChange={(v) => setRefundInputAmount(v)}
                placeholder={`Maks ${formatIDR(overpayAmount)}`}
              />
              <p className="text-[10px] text-[#94A3B8] mt-1">
                *Bisa dicicil pengembaliannya (maksimal {formatIDR(overpayAmount)}).
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#FCD34D] uppercase tracking-wider block mb-1">
                METODE PENGEMBALIAN
              </label>
              <CustomSelect
                value={refundMethod}
                onChange={setRefundMethod}
                options={[
                  { value: 'cash', label: 'CASH / TUNAI' },
                  { value: 'transfer', label: 'TRANSFER BANK' },
                ]}
              />
            </div>
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-[#121B22] text-[#94A3B8] border-white/10 hover:bg-white/10 rounded-xl">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRefunding || refundInputAmount <= 0 || refundInputAmount > overpayAmount}
              onClick={handleProcessRefund}
              className="bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400 rounded-xl"
            >
              {isRefunding ? <Loader2 size={16} className="animate-spin" /> : `Kembalikan ${formatIDR(refundInputAmount)}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <AlertDialogContent className="bg-[#0C1319] border border-white/10 rounded-2xl max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-400 font-black text-lg uppercase tracking-wide flex items-center gap-2">
              <ArrowRightLeft size={20} /> Konfirmasi & Input Retur Barang
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#94A3B8] text-xs font-medium">
              Pilih barang dan jumlah (qty) yang dikembalikan oleh toko untuk Nota <span className="font-bold text-white">{sale?.invoice_number}</span>. Stok barang akan otomatis dikembalikan ke gudang.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 my-4">
            {returnFormItems.map((item, idx) => {
              const currentReturVal = Number(item.return_qty || 0) * item.unit_price
              return (
                <div key={idx} className="p-3.5 bg-white/[0.03] border border-white/10 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-white">{item.product_name}</p>
                      <p className="text-[11px] text-[#94A3B8]">
                        Harga: <span className="font-semibold text-white">{formatIDR(item.unit_price)}</span> / {item.unit}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px] font-bold">
                      Maks Retur: {item.max_qty} {item.unit}
                    </Badge>
                  </div>

                  {item.max_qty > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">
                          JUMLAH RETUR ({item.unit.toUpperCase()})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.max_qty}
                          value={item.return_qty}
                          onChange={(e) => {
                            const val = Math.min(item.max_qty, Math.max(0, parseInt(e.target.value) || 0))
                            updateReturnFormItem(idx, 'return_qty', val)
                          }}
                          className="w-full bg-[#121B22] border border-white/10 rounded-lg px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">
                          ALASAN RETUR
                        </label>
                        <CustomSelect
                          value={item.reason}
                          onChange={(val) => updateReturnFormItem(idx, 'reason', val)}
                          options={[
                            { value: 'Pita Cukai Cacat / Rusak', label: 'Pita Cukai Cacat / Rusak' },
                            { value: 'Expired / Rusak', label: 'Expired / Rusak' },
                            { value: 'Toko Minta Dikembalikan', label: 'Toko Minta Dikembalikan' },
                            { value: 'Salah Kirim Barang', label: 'Salah Kirim Barang' },
                            { value: 'Lainnya', label: 'Lainnya' },
                          ]}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-red-400 italic">Seluruh barang ini sudah diretur sebelumnya.</p>
                  )}

                  {Number(item.return_qty) > 0 && (
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                      <span className="text-[#94A3B8]">Nilai Potongan Retur:</span>
                      <span className="font-extrabold text-amber-400">{formatIDR(currentReturVal)}</span>
                    </div>
                  )}
                </div>
              )
            })}

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex justify-between items-center text-sm">
              <span className="text-amber-200 font-bold">TOTAL ESTIMASI POTONGAN:</span>
              <span className="text-amber-400 font-black text-base">
                {formatIDR(
                  returnFormItems.reduce((s, i) => s + (Number(i.return_qty || 0) * i.unit_price), 0)
                )}
              </span>
            </div>
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-white/5 text-[#94A3B8] border-white/10 hover:bg-white/10 rounded-xl">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmittingReturn || !returnFormItems.some(i => Number(i.return_qty) > 0)}
              onClick={handleProcessReturn}
              className="bg-amber-500 text-slate-950 font-black hover:bg-amber-400 rounded-xl"
            >
              {isSubmittingReturn ? <Loader2 size={16} className="animate-spin" /> : 'Konfirmasi & Simpan Retur'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmCancelReturn} onOpenChange={setConfirmCancelReturn}>
        <AlertDialogContent className="bg-[#0C1319] border border-white/10 rounded-2xl max-w-md p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 font-black text-lg uppercase tracking-wide flex items-center gap-2">
              ⚠️ Batalkan Retur & Refund Barang?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#94A3B8] text-xs">
              Membatalkan retur pada Nota <strong className="text-white">{sale?.invoice_number}</strong> akan menghapus potongan retur barang dan mengembalikan nilai tagihan nota ke semula.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 my-3 space-y-1">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Retur Terpasang Saat Ini:</p>
            <p className="text-sm font-extrabold text-white">
              {saleReturns.reduce((s, r) => s + Number(r.quantity || 0), 0)} unit items · Potongan {formatIDR(saleReturns.reduce((s, r) => s + Number(r.total_amount || 0), 0))}
            </p>
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-[#121B22] text-[#94A3B8] border-white/10 hover:bg-white/10 rounded-xl">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={voidReturnsMut.isPending}
              onClick={handleCancelReturn}
              className="bg-red-500 text-white font-black hover:bg-red-600 rounded-xl"
            >
              {voidReturnsMut.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Ya, Batalkan Retur'}
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
