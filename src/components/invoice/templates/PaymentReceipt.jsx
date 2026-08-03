import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatRupiahPDF, formatDatePDF, terbilang } from '@/lib/invoice/invoiceUtils'

const C = {
  bg:       '#FFFFFF',
  text:     '#1a1a1a',
  muted:    '#666666',
  faint:    '#999999',
  light:    '#F9FAFB',
  border:   '#E5E7EB',
  header:   '#0C1319',
  accent:   '#021a02',
  accentBg: '#F0FDF4',
}

const s = StyleSheet.create({
  page: {
    fontFamily:      'Helvetica',
    fontSize:        10,
    paddingTop:      40,
    paddingBottom:   60,
    paddingLeft:     40,
    paddingRight:    40,
    backgroundColor: C.bg,
    color:           C.text,
  },
  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    marginBottom:      24,
    paddingBottom:     20,
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
    borderBottomStyle: 'solid',
  },
  companyName:   { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.header },
  companyDetail: { fontSize: 8,  color: C.muted, marginTop: 3 },
  docTitle:      { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.accent, textAlign: 'right' },
  docNum:        { fontSize: 9,  color: C.muted, textAlign: 'right', marginTop: 3 },
  docDate:       { fontSize: 9,  color: C.muted, textAlign: 'right', marginTop: 2 },

  // Large receipt box
  receiptBox: {
    marginBottom:   24,
    paddingTop:     20,
    paddingBottom:  20,
    paddingLeft:    24,
    paddingRight:   24,
    backgroundColor: C.accentBg,
    borderWidth:    2,
    borderColor:    C.accent,
    borderStyle:    'solid',
    borderRadius:   8,
    alignItems:     'center',
  },
  receiptLabel:  { fontSize: 9,  color: C.muted,  letterSpacing: 1, marginBottom: 6 },
  receiptPayer:  { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.header, marginBottom: 10, textAlign: 'center' },
  receiptAmtLabel: { fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 4 },
  receiptAmount: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: C.accent, textAlign: 'center' },

  // Detail table
  detailSection: { marginBottom: 20 },
  detailRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    paddingTop:        6,
    paddingBottom:     6,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: 'solid',
  },
  detailLabel: { fontSize: 9, color: C.muted },
  detailValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.text },

  // Summary box
  summarySection: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
  summaryBox: { width: '50%' },
  summaryRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    paddingTop:        4,
    paddingBottom:     4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: 'solid',
  },
  summaryLabel: { fontSize: 9, color: C.muted },
  summaryVal:   { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.text },
  totalRow: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    paddingTop:      8,
    paddingBottom:   8,
    paddingLeft:     10,
    paddingRight:    10,
    backgroundColor: C.accent,
    borderRadius:    4,
    marginTop:       4,
  },
  totalLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  totalVal:   { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },

  // Terbilang
  terbilangBox: {
    marginBottom:    20,
    paddingTop:      10,
    paddingBottom:   10,
    paddingLeft:     14,
    paddingRight:    14,
    backgroundColor: C.light,
    borderRadius:    6,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
    borderLeftStyle: 'solid',
  },
  terbilangLabel: { fontSize: 8, color: C.muted, marginBottom: 3 },
  terbilangText:  { fontSize: 9, fontFamily: 'Helvetica-BoldOblique', color: C.text },

  // LUNAS badge
  lunasBadge: {
    marginBottom:    20,
    paddingTop:      10,
    paddingBottom:   10,
    paddingLeft:     14,
    paddingRight:    14,
    backgroundColor: C.accentBg,
    borderWidth:     1,
    borderColor:     C.accent,
    borderStyle:     'solid',
    borderRadius:    6,
    flexDirection:   'row',
    alignItems:      'center',
  },
  lunasText: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.accent },

  // Signature
  sigSection: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 36 },
  sigBox:     { width: '40%', alignItems: 'center' },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: C.text,
    borderBottomStyle: 'solid',
    width:      '100%',
    marginTop:  40,
    marginBottom: 6,
  },
  sigName:  { fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  sigLabel: { fontSize: 8, color: C.muted, textAlign: 'center' },

  footer: {
    position:    'absolute',
    bottom:      24,
    left:        40,
    right:       40,
    paddingTop:  8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: 'solid',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: C.faint },
})

// ── Component ─────────────────────────────────────────────────────────────────
// Props:
//   tenant: { business_name, phone, location }
//   payment: { id, amount, payment_method, payment_date, notes }
//   sale: { id, total_revenue, paid_amount, payment_status }
//   rpa: { rpa_name, location, phone }
//   invoiceNumber: string
//   generatedBy: string

export function PaymentReceipt({ tenant, payment, sale, rpa, invoiceNumber, generatedBy }) {
  const amount        = Number(payment?.amount || 0)
  const totalRevenue  = Number(sale?.total_revenue || 0)
  const paidAmount    = Number(sale?.paid_amount || 0)
  const sisaSetelah   = Math.max(0, totalRevenue - paidAmount)
  const paidBefore    = Math.max(0, paidAmount - amount)
  const isLunas       = sale?.payment_status === 'lunas' || sisaSetelah <= 0

  const methodLabels = {
    cash:          'Tunai',
    transfer:      'Transfer Bank',
    bank_transfer: 'Transfer Bank',
    check:         'Cek / Giro',
    other:         'Lainnya',
  }
  const methodLabel = methodLabels[payment?.payment_method] || payment?.payment_method || '-'

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* HEADER */}
        <View style={s.header}>
          <View>
            <Text style={s.companyName}>{tenant?.business_name || 'Bisnis'}</Text>
            <Text style={s.companyDetail}>{tenant?.location || '-'}</Text>
            <Text style={s.companyDetail}>Tel: {tenant?.phone || '-'}</Text>
            <Text style={s.companyDetail}>TernakOS — Platform Manajemen Peternakan</Text>
          </View>
          <View>
            <Text style={s.docTitle}>KWITANSI</Text>
            <Text style={s.docNum}>{invoiceNumber}</Text>
            <Text style={s.docDate}>Tgl: {formatDatePDF(payment?.payment_date)}</Text>
          </View>
        </View>

        {/* PENERIMAAN BOX */}
        <View style={s.receiptBox}>
          <Text style={s.receiptLabel}>TELAH DITERIMA DARI</Text>
          <Text style={s.receiptPayer}>{rpa?.rpa_name || '-'}</Text>
          <Text style={s.receiptAmtLabel}>SEBESAR</Text>
          <Text style={s.receiptAmount}>{formatRupiahPDF(amount)}</Text>
        </View>

        {/* DETAIL PEMBAYARAN */}
        <View style={s.detailSection}>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Metode Pembayaran</Text>
            <Text style={s.detailValue}>{methodLabel}</Text>
          </View>
          <View style={s.detailRow}>
            <Text style={s.detailLabel}>Tanggal Pembayaran</Text>
            <Text style={s.detailValue}>{formatDatePDF(payment?.payment_date)}</Text>
          </View>
          {payment?.notes ? (
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Keterangan</Text>
              <Text style={s.detailValue}>{payment.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* SUMMARY */}
        <View style={s.summarySection}>
          <View style={s.summaryBox}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Total Tagihan</Text>
              <Text style={s.summaryVal}>{formatRupiahPDF(totalRevenue)}</Text>
            </View>
            {paidBefore > 0 && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Sudah Dibayar Sebelumnya</Text>
                <Text style={[s.summaryVal, { color: C.accent }]}>
                  ({formatRupiahPDF(paidBefore)})
                </Text>
              </View>
            )}
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Pembayaran Ini</Text>
              <Text style={[s.summaryVal, { color: C.accent }]}>
                ({formatRupiahPDF(amount)})
              </Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>SISA HUTANG</Text>
              <Text style={s.totalVal}>{formatRupiahPDF(sisaSetelah)}</Text>
            </View>
          </View>
        </View>

        {/* TERBILANG */}
        <View style={s.terbilangBox}>
          <Text style={s.terbilangLabel}>TERBILANG (PEMBAYARAN INI)</Text>
          <Text style={s.terbilangText}>{terbilang(amount)}</Text>
        </View>

        {/* LUNAS BADGE */}
        {isLunas && (
          <View style={s.lunasBadge}>
            <Text style={s.lunasText}>
              {'✓  HUTANG TELAH LUNAS — TERIMA KASIH'}
            </Text>
          </View>
        )}

        {/* TANDA TANGAN */}
        <View style={s.sigSection}>
          <View style={s.sigBox}>
            <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>Yang Menerima,</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{generatedBy || tenant?.business_name || '-'}</Text>
            <Text style={s.sigLabel}>Penjual / Broker</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>Yang Membayar,</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{rpa?.rpa_name || '________________'}</Text>
            <Text style={s.sigLabel}>Pembeli / RPA</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {invoiceNumber} | Dibuat: {formatDatePDF(new Date())} | {generatedBy || '-'}
          </Text>
          <Text style={s.footerText}>Powered by TernakOS — ternakos.com</Text>
        </View>

      </Page>
    </Document>
  )
}
