import React, { useCallback } from 'react'
import { motion } from 'framer-motion' // eslint-disable-line no-unused-vars
import { FileText, Truck, Smartphone } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { formatIDR } from '@/lib/format'
import { useAuth } from '@/lib/hooks/useAuth'
import { C, sBtn, DetailRow, generateWAMessage, toWaLink } from './sembakoSaleUtils'

import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

export function SembakoSuccessCard({ isOpen, onClose, data, onPrint }) {
  const { tenant } = useAuth()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const handleSheetClose = useCallback((v) => { if (!v) onClose() }, [onClose])
  if (!data) return null

  const handleWA = () => {
    const msg = generateWAMessage(data, tenant)
    const url = toWaLink(data.customerPhone, msg) || `https://wa.me/?text=${msg}`
    window.open(url, '_blank')
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetClose}>
      <SheetContent
        side={isDesktop ? 'right' : 'bottom'}
        className="hide-scrollbar"
        style={{
          background: C.bg,
          width: isDesktop ? '480px' : '100%',
          height: isDesktop ? '100vh' : 'auto',
          maxHeight: isDesktop ? '100vh' : '90vh',
          padding: '0',
          borderLeft: isDesktop ? `1px solid ${C.border}` : 'none',
          borderRadius: isDesktop ? '0' : '24px 24px 0 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Penjualan Berhasil</SheetTitle>
          <SheetDescription>Ringkasan transaksi penjualan sembako yang baru saja disimpan.</SheetDescription>
        </SheetHeader>
        <div style={{ flex: 1, minHeight: 0, padding: '32px 24px', overflowY: 'auto' }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{ width: 80, height: 80, borderRadius: '24px', background: 'rgba(2, 26, 2,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 40px rgba(2, 26, 2,0.2)' }}
          >
            <motion.svg width="40" height="40" viewBox="0 0 50 50">
              <motion.circle cx="25" cy="25" r="22" fill="none" stroke="#021a02" strokeWidth="4" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} />
              <motion.path d="M 14 26 L 22 34 L 38 16" fill="transparent" stroke="#021a02" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }} />
            </motion.svg>
          </motion.div>

          <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 900, color: C.text, fontFamily: 'DM Sans', marginBottom: '8px' }}>
            Penjualan Berhasil!
          </h2>
          <p style={{ textAlign: 'center', fontSize: '13px', color: C.muted, marginBottom: '24px' }}>
            Invoice <strong style={{ color: C.text }}>{data.invoiceNumber || 'Baru'}</strong> telah dicatat untuk <strong style={{ color: C.text }}>{data.customerName}</strong>.
          </p>

          <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}`, marginBottom: '16px' }}>
            <DetailRow label="Total Tagihan" value={formatIDR(data.revenue || 0)} bold />
            <DetailRow label="Estimasi HPP" value={formatIDR(data.cogs || 0)} />
            {data.deliveryCost > 0 && <DetailRow label="Biaya Kirim (Tercatat)" value={formatIDR(data.deliveryCost || 0)} />}
            {data.otherCost > 0 && <DetailRow label="Biaya Lain" value={formatIDR(data.otherCost || 0)} />}
            <div style={{ height: 1, background: C.border, margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: C.muted }}>Net Profit</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: data.netProfit >= 0 ? C.green : C.red }}>{formatIDR(data.netProfit || 0)}</span>
            </div>
          </div>

          {/* Tombol Cetak / Surat Jalan */}
          {data.hasDelivery && data.deliveryStatus === 'pending' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <button onClick={() => onPrint('invoice')} style={{ ...sBtn(false), height: '48px', fontSize: '11px', gap: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}`, color: C.text }}>
                <FileText size={16} /> INVOICE
              </button>
              <button onClick={() => onPrint('delivery')} style={{ ...sBtn(false), height: '48px', fontSize: '11px', gap: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}`, color: C.text }}>
                <Truck size={16} /> SURAT JALAN
              </button>
            </div>
          ) : (
            <button onClick={() => onPrint('invoice')} style={{ ...sBtn(false), width: '100%', height: '48px', fontSize: '12px', gap: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}`, color: C.text, marginBottom: '12px' }}>
              <FileText size={16} /> CETAK INVOICE
            </button>
          )}

          <button
            onClick={handleWA}
            style={{ ...sBtn(false), width: '100%', height: '48px', fontSize: '13px', marginBottom: '8px', borderColor: '#25D366', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Smartphone size={16} /> KIRIM STRUK KE WA
          </button>

          <button onClick={onClose} style={{ ...sBtn(true), width: '100%', height: '48px', fontSize: '15px' }}>
            Tutup & Kembali
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
