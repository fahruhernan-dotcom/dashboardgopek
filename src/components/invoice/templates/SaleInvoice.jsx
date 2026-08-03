import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatRupiahPDF, formatDatePDF, terbilang } from '@/lib/invoice/invoiceUtils'

// ── Styles ────────────────────────────────────────────────────────────────────
// NOTE: react-pdf tidak support CSS shorthand border/gap/text-transform
// Gunakan longhand properties + JS string manipulation

const C = {
  bg:         '#FFFFFF',
  text:       '#1a1a1a',
  muted:      '#666666',
  faint:      '#999999',
  light:      '#F9FAFB',
  border:     '#E5E7EB',
  header:     '#0C1319',
  accent:     '#021a02',
  accentBg:   '#F0FDF4',
  accentBorder:'#021a02',
  warn:       '#F59E0B',
  danger:     '#EF4444',
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

  // Header
  header: {
    flexDirection:       'row',
    justifyContent:      'space-between',
    marginBottom:        24,
    paddingBottom:       20,
    borderBottomWidth:   2,
    borderBottomColor:   C.accent,
    borderBottomStyle:   'solid',
  },
  companyName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.header },
  companyDetail: { fontSize: 8, color: C.muted, marginTop: 3 },
  invoiceTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.accent, textAlign: 'right' },
  invoiceNum: { fontSize: 9, color: C.muted, textAlign: 'right', marginTop: 3 },
  invoiceDate: { fontSize: 9, color: C.muted, textAlign: 'right', marginTop: 2 },
  invoiceDue: { fontSize: 9, color: C.warn, textAlign: 'right', marginTop: 2 },

  // Status badge
  statusWrap: { marginBottom: 16, flexDirection: 'row' },
  statusBadge: { paddingTop: 4, paddingBottom: 4, paddingLeft: 12, paddingRight: 12, borderRadius: 4 },
  statusText: { fontSize: 9, fontFamily: 'Helvetica-Bold' },

  // Bill to / from
  parties: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  partyBox: { width: '45%' },
  partyLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.accent, letterSpacing: 1, marginBottom: 6 },
  partyName: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.header },
  partyDetail: { fontSize: 9, color: C.muted, marginTop: 2 },

  // Table
  tableHeader: {
    flexDirection:   'row',
    backgroundColor: C.header,
    paddingTop:      8,
    paddingBottom:   8,
    paddingLeft:     10,
    paddingRight:    10,
    borderRadius:    4,
  },
  thText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  tableRow: {
    flexDirection:   'row',
    paddingTop:      8,
    paddingBottom:   8,
    paddingLeft:     10,
    paddingRight:    10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: 'solid',
  },
  tableRowAlt: { backgroundColor: C.light },
  td: { fontSize: 9, color: C.text },

  // Column widths
  col1: { width: '35%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '18%', textAlign: 'right' },
  col5: { width: '17%', textAlign: 'right' },

  // Summary
  summarySection: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 24 },
  summaryBox: { width: '55%' },
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
  summaryVal: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.text },
  totalRow: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingTop:      8,
    paddingBottom:   8,
    paddingLeft:     10,
    paddingRight:    10,
    backgroundColor: C.accent,
    borderRadius:    4,
    marginTop:       4,
  },
  totalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', flex: 1 },
  totalVal:   { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', textAlign: 'right' },

  // Terbilang
  terbilangBox: {
    marginBottom:  20,
    paddingTop:    10,
    paddingBottom: 10,
    paddingLeft:   14,
    paddingRight:  14,
    backgroundColor: C.light,
    borderRadius:  6,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
    borderLeftStyle: 'solid',
  },
  terbilangLabel: { fontSize: 8, color: C.muted, marginBottom: 3 },
  terbilangText:  { fontSize: 9, fontFamily: 'Helvetica-BoldOblique', color: C.text },

  // Payment info box
  paymentBox: {
    marginBottom:   20,
    paddingTop:     14,
    paddingBottom:  14,
    paddingLeft:    14,
    paddingRight:   14,
    backgroundColor: C.accentBg,
    borderWidth:    1,
    borderColor:    C.accentBorder,
    borderStyle:    'solid',
    borderRadius:   6,
  },
  paymentLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.accent, letterSpacing: 1, marginBottom: 6 },
  paymentText:  { fontSize: 9, color: C.text, marginBottom: 3 },
  paymentNote:  { fontSize: 8, color: C.muted, marginTop: 4, fontFamily: 'Helvetica-Oblique' },

  // Signature
  sigSection: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 36 },
  sigBox: { width: '40%', alignItems: 'center' },
  sigLine: { borderBottomWidth: 1, borderBottomColor: C.text, borderBottomStyle: 'solid', width: '100%', marginTop: 40, marginBottom: 6 },
  sigName:  { fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  sigLabel: { fontSize: 8, color: C.muted, textAlign: 'center' },

  // Footer (fixed)
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
//   sale: { id, transaction_date, due_date, payment_status,
//           total_revenue, paid_amount, delivery_cost, price_per_kg,
//           total_weight_kg, quantity }
//   rpa: { rpa_name, phone, location }
//   farm: { farm_name, owner_name, location }
//   delivery: { arrived_weight_kg, arrived_count } (optional)
//   invoiceNumber: string
//   generatedBy: string

export function SaleInvoice({ tenant, sale, rpa, farm, delivery, invoiceNumber, generatedBy, payments = [] }) {
  const allPayments = payments.length > 0 ? payments : (sale?.payments || [])
  const remaining = (Number(sale?.total_revenue) || 0) - (Number(sale?.paid_amount) || 0)

  const statusColors = {
    lunas:       { bg: '#F0FDF4', border: '#021a02', text: '#021a02' },
    belum_lunas: { bg: '#FEF3C7', border: '#F59E0B', text: '#F59E0B' },
    sebagian:    { bg: '#EFF6FF', border: '#3B82F6', text: '#3B82F6' },
  }
  const sc = statusColors[sale?.payment_status] || statusColors.belum_lunas
  const statusLabel = { lunas: 'LUNAS', belum_lunas: 'BELUM DIBAYAR', sebagian: 'SEBAGIAN' }[sale?.payment_status] || '-'

  const weightJual = delivery?.arrived_weight_kg
    ? Number(delivery.arrived_weight_kg)
    : Number(sale?.total_weight_kg || 0)

  const totalFinal = sale?.payment_status === 'lunas'
    ? Number(sale?.total_revenue || 0)
    : remaining

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
            <Text style={s.invoiceTitle}>INVOICE</Text>
            <Text style={s.invoiceNum}>{invoiceNumber}</Text>
            <Text style={s.invoiceDate}>Tgl: {formatDatePDF(sale?.transaction_date)}</Text>
            {sale?.due_date && (
              <Text style={s.invoiceDue}>Jatuh Tempo: {formatDatePDF(sale.due_date)}</Text>
            )}
          </View>
        </View>

        {/* STATUS BADGE */}
        <View style={s.statusWrap}>
          <View style={[s.statusBadge, { backgroundColor: sc.bg, borderWidth: 1, borderColor: sc.border, borderStyle: 'solid' }]}>
            <Text style={[s.statusText, { color: sc.text }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* BILL TO / FROM */}
        <View style={s.parties}>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>DARI (SELLER)</Text>
            <Text style={s.partyName}>{tenant?.business_name || '-'}</Text>
            <Text style={s.partyDetail}>{tenant?.location || '-'}</Text>
            <Text style={s.partyDetail}>Tel: {tenant?.phone || '-'}</Text>
          </View>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>KEPADA (BUYER)</Text>
            <Text style={s.partyName}>{rpa?.rpa_name || '-'}</Text>
            <Text style={s.partyDetail}>{rpa?.location || '-'}</Text>
            <Text style={s.partyDetail}>Tel: {rpa?.phone || '-'}</Text>
          </View>
        </View>

        {/* TABLE */}
        <View style={{ marginBottom: 20 }}>
          <View style={s.tableHeader}>
            <Text style={[s.thText, s.col1]}>Deskripsi</Text>
            <Text style={[s.thText, s.col2]}>Ekor</Text>
            <Text style={[s.thText, s.col3]}>Berat (kg)</Text>
            <Text style={[s.thText, s.col4]}>Harga/kg</Text>
            <Text style={[s.thText, s.col5]}>Subtotal</Text>
          </View>

          {/* Row utama */}
          <View style={s.tableRow}>
            <View style={s.col1}>
              <Text style={s.td}>Penjualan Ayam</Text>
              <Text style={[s.td, { color: C.muted, marginTop: 2 }]}>
                Kandang: {farm?.farm_name || '-'}
              </Text>
            </View>
            <Text style={[s.td, s.col2]}>
              {Number(sale?.quantity || 0).toLocaleString('id-ID')}
            </Text>
            <Text style={[s.td, s.col3]}>{weightJual.toFixed(2)} kg</Text>
            <Text style={[s.td, s.col4]}>{formatRupiahPDF(sale?.price_per_kg)}</Text>
            <Text style={[s.td, s.col5]}>{formatRupiahPDF(sale?.total_revenue)}</Text>
          </View>

          {/* Biaya pengiriman removed as borne by broker */}
        </View>

        {/* SUMMARY */}
        <View style={s.summarySection}>
          <View style={s.summaryBox}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Subtotal</Text>
              <Text style={s.summaryVal}>{formatRupiahPDF(sale?.total_revenue)}</Text>
            </View>
            {/* Biaya pengiriman summary removed as borne by broker */}
            {Number(sale?.paid_amount) > 0 && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Sudah Dibayar</Text>
                <Text style={[s.summaryVal, { color: C.accent }]}>
                  ({formatRupiahPDF(sale.paid_amount)})
                </Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>
                {sale?.payment_status === 'lunas' ? 'TOTAL' : 'SISA TAGIHAN (HUTANG)'}
              </Text>
              <Text style={s.totalVal}>{formatRupiahPDF(totalFinal)}</Text>
            </View>
          </View>
        </View>

        {/* RIWAYAT PEMBAYARAN (jika ada) */}
        {allPayments.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={[s.partyLabel, { marginBottom: 8 }]}>RIWAYAT PEMBAYARAN / CICILAN</Text>
            <View style={[s.tableHeader, { backgroundColor: '#F3F4F6' }]}>
              <Text style={[s.thText, { color: '#4B6478', width: '40%' }]}>Tgl & Hari</Text>
              <Text style={[s.thText, { color: '#4B6478', width: '30%' }]}>Metode</Text>
              <Text style={[s.thText, { color: '#4B6478', width: '30%', textAlign: 'right' }]}>Jumlah</Text>
            </View>
            {allPayments.map((p, i) => (
              <View key={i} style={[s.tableRow, { borderBottomColor: '#F3F4F6' }]}>
                <Text style={[s.td, { width: '40%' }]}>{formatDatePDF(p.payment_date, true)}</Text>
                <Text style={[s.td, { width: '30%', textTransform: 'uppercase' }]}>{p.payment_method}</Text>
                <Text style={[s.td, { width: '30%', textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>{formatRupiahPDF(p.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* TERBILANG */}
        <View style={s.terbilangBox}>
          <Text style={s.terbilangLabel}>TERBILANG</Text>
          <Text style={s.terbilangText}>{terbilang(totalFinal)}</Text>
        </View>

        {/* PAYMENT INFO (jika belum lunas) */}
        {sale?.payment_status !== 'lunas' && (
          <View style={s.paymentBox}>
            <Text style={s.paymentLabel}>INFO PEMBAYARAN</Text>
            <Text style={s.paymentText}>Harap transfer ke rekening atas nama:</Text>
            <Text style={[s.paymentText, { fontFamily: 'Helvetica-Bold' }]}>
              {tenant?.business_name || '-'}
            </Text>
            <Text style={s.paymentNote}>
              * Konfirmasi pembayaran via WhatsApp/telepon setelah transfer
            </Text>
          </View>
        )}

        {/* TANDA TANGAN */}
        <View style={s.sigSection}>
          <View style={s.sigBox}>
            <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>Hormat kami,</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{generatedBy || tenant?.business_name || '-'}</Text>
            <Text style={s.sigLabel}>Penjual / Broker</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>Diterima oleh,</Text>
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


