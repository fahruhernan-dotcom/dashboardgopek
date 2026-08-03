import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatRupiahPDF, formatDatePDF, terbilang } from '@/lib/invoice/invoiceUtils'

const C = {
  bg:      '#FFFFFF',
  text:    '#1a1a1a',
  muted:   '#666666',
  faint:   '#999999',
  light:   '#F9FAFB',
  border:  '#E5E7EB',
  header:  '#0C1319',
  accent:  '#021a02',
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
  docTitle:      { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.accent, textAlign: 'right' },
  docNum:        { fontSize: 9,  color: C.muted, textAlign: 'right', marginTop: 3 },
  docDate:       { fontSize: 9,  color: C.muted, textAlign: 'right', marginTop: 2 },

  parties: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  partyBox: { width: '45%' },
  partyLabel:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.accent, letterSpacing: 1, marginBottom: 6 },
  partyName:   { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.header },
  partyDetail: { fontSize: 9, color: C.muted, marginTop: 2 },

  tableHeader: {
    flexDirection:   'row',
    backgroundColor: C.header,
    paddingTop:      8,
    paddingBottom:   8,
    paddingLeft:     10,
    paddingRight:    10,
    borderRadius:    4,
  },
  thText:   { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  tableRow: {
    flexDirection:     'row',
    paddingTop:        8,
    paddingBottom:     8,
    paddingLeft:       10,
    paddingRight:      10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: 'solid',
  },
  tableRowAlt: { backgroundColor: C.light },
  td:   { fontSize: 9, color: C.text },

  col1: { width: '35%' },
  col2: { width: '15%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '18%', textAlign: 'right' },
  col5: { width: '17%', textAlign: 'right' },

  summarySection: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
  summaryBox: { width: '45%' },
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
    flexDirection:  'row',
    justifyContent: 'space-between',
    paddingTop:     8,
    paddingBottom:  8,
    paddingLeft:    10,
    paddingRight:   10,
    backgroundColor: C.accent,
    borderRadius:   4,
    marginTop:      4,
  },
  totalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  totalVal:   { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },

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

  // Paid stamp box
  paidBox: {
    marginBottom:   20,
    paddingTop:     10,
    paddingBottom:  10,
    paddingLeft:    14,
    paddingRight:   14,
    backgroundColor: '#F0FDF4',
    borderWidth:    1,
    borderColor:    C.accent,
    borderStyle:    'solid',
    borderRadius:   6,
    flexDirection:  'row',
    alignItems:     'center',
  },
  paidText: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.accent },

  sigSection: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 36 },
  sigBox:  { width: '40%', alignItems: 'center' },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: C.text,
    borderBottomStyle: 'solid',
    width:    '100%',
    marginTop: 40,
    marginBottom: 6,
  },
  sigName:  { fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  sigLabel: { fontSize: 8, color: C.muted, textAlign: 'center' },

  footer: {
    position:   'absolute',
    bottom:     24,
    left:       40,
    right:      40,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: 'solid',
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: C.faint },
})

// ── Component ─────────────────────────────────────────────────────────────────
// Props:
//   tenant: { business_name, phone, location }
//   purchase: { id, transaction_date, quantity, avg_weight_kg,
//               total_weight_kg, price_per_kg, transport_cost,
//               other_cost, total_cost, notes }
//   farm: { farm_name, owner_name, location, phone }
//   invoiceNumber: string
//   generatedBy: string

export function PurchaseInvoice({ tenant, purchase, farm, invoiceNumber, generatedBy }) {
  const totalModal = Number(purchase?.total_cost || 0)
  const transportCost = Number(purchase?.transport_cost || 0)
  const otherCost = Number(purchase?.other_cost || 0)
  const basePrice = totalModal - transportCost - otherCost

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
            <Text style={s.docTitle}>BUKTI PEMBELIAN</Text>
            <Text style={s.docNum}>{invoiceNumber}</Text>
            <Text style={s.docDate}>Tgl: {formatDatePDF(purchase?.transaction_date)}</Text>
          </View>
        </View>

        {/* PARTIES */}
        <View style={s.parties}>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>PEMBELI</Text>
            <Text style={s.partyName}>{tenant?.business_name || '-'}</Text>
            <Text style={s.partyDetail}>{tenant?.location || '-'}</Text>
            <Text style={s.partyDetail}>Tel: {tenant?.phone || '-'}</Text>
          </View>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>DARI KANDANG</Text>
            <Text style={s.partyName}>{farm?.farm_name || '-'}</Text>
            {farm?.owner_name ? (
              <Text style={s.partyDetail}>Pemilik: {farm.owner_name}</Text>
            ) : null}
            <Text style={s.partyDetail}>{farm?.location || '-'}</Text>
            {farm?.phone ? (
              <Text style={s.partyDetail}>Tel: {farm.phone}</Text>
            ) : null}
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

          {/* Beli ayam */}
          <View style={s.tableRow}>
            <View style={s.col1}>
              <Text style={s.td}>Pembelian Ayam</Text>
              <Text style={[s.td, { color: C.muted, marginTop: 2 }]}>
                Kandang: {farm?.farm_name || '-'}
              </Text>
            </View>
            <Text style={[s.td, s.col2]}>
              {Number(purchase?.quantity || 0).toLocaleString('id-ID')}
            </Text>
            <Text style={[s.td, s.col3]}>
              {Number(purchase?.total_weight_kg || 0).toFixed(2)} kg
            </Text>
            <Text style={[s.td, s.col4]}>{formatRupiahPDF(purchase?.price_per_kg)}</Text>
            <Text style={[s.td, s.col5]}>{formatRupiahPDF(basePrice)}</Text>
          </View>

          {/* Transport cost */}
          {transportCost > 0 && (
            <View style={[s.tableRow, s.tableRowAlt]}>
              <Text style={[s.td, s.col1]}>Biaya Transport / Perjalanan</Text>
              <Text style={[s.td, s.col2]}>-</Text>
              <Text style={[s.td, s.col3]}>-</Text>
              <Text style={[s.td, s.col4]}>-</Text>
              <Text style={[s.td, s.col5]}>{formatRupiahPDF(transportCost)}</Text>
            </View>
          )}

          {/* Other cost */}
          {otherCost > 0 && (
            <View style={[s.tableRow, s.tableRowAlt]}>
              <Text style={[s.td, s.col1]}>Biaya Lain-lain</Text>
              <Text style={[s.td, s.col2]}>-</Text>
              <Text style={[s.td, s.col3]}>-</Text>
              <Text style={[s.td, s.col4]}>-</Text>
              <Text style={[s.td, s.col5]}>{formatRupiahPDF(otherCost)}</Text>
            </View>
          )}
        </View>

        {/* SUMMARY */}
        <View style={s.summarySection}>
          <View style={s.summaryBox}>
            {transportCost > 0 && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Harga Beli</Text>
                <Text style={s.summaryVal}>{formatRupiahPDF(basePrice)}</Text>
              </View>
            )}
            {transportCost > 0 && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Transport</Text>
                <Text style={s.summaryVal}>{formatRupiahPDF(transportCost)}</Text>
              </View>
            )}
            {otherCost > 0 && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Biaya Lain</Text>
                <Text style={s.summaryVal}>{formatRupiahPDF(otherCost)}</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TOTAL MODAL</Text>
              <Text style={s.totalVal}>{formatRupiahPDF(totalModal)}</Text>
            </View>
          </View>
        </View>

        {/* TERBILANG */}
        <View style={s.terbilangBox}>
          <Text style={s.terbilangLabel}>TERBILANG</Text>
          <Text style={s.terbilangText}>{terbilang(totalModal)}</Text>
        </View>

        {/* PAID STAMP */}
        <View style={s.paidBox}>
          <Text style={s.paidText}>✓  PEMBELIAN TELAH DILAKUKAN — LUNAS</Text>
        </View>

        {/* TANDA TANGAN */}
        <View style={s.sigSection}>
          <View style={s.sigBox}>
            <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>Pembeli,</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{generatedBy || tenant?.business_name || '-'}</Text>
            <Text style={s.sigLabel}>Broker / Pembeli</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>Penjual,</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{farm?.owner_name || farm?.farm_name || '________________'}</Text>
            <Text style={s.sigLabel}>Pemilik Kandang</Text>
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
