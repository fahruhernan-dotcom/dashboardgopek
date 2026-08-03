import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatRupiahPDF, formatDatePDF, terbilang } from '@/lib/invoice/invoiceUtils'

const C = {
  bg:       '#FFFFFF',
  text:     '#1a1a1a',
  muted:    '#666666',
  faint:    '#999999',
  light:    '#F5F3FF',   // purple tint
  border:   '#E5E7EB',
  header:   '#0C1319',
  accent:   '#7C3AED',   // purple
  accentBg: '#F5F3FF',
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
  docTitle:      { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.accent, textAlign: 'right' },
  docSubTitle:   { fontSize: 8,  color: C.muted, textAlign: 'right', marginTop: 2 },
  docNum:        { fontSize: 9,  color: C.muted, textAlign: 'right', marginTop: 2 },
  docDate:       { fontSize: 9,  color: C.muted, textAlign: 'right', marginTop: 2 },

  // Parties
  parties:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  partyBox:    { width: '45%' },
  partyLabel:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.accent, letterSpacing: 1, marginBottom: 6 },
  partyName:   { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.header },
  partyDetail: { fontSize: 9, color: C.muted, marginTop: 2 },

  // Cycle info box
  cycleBox: {
    marginBottom:    20,
    paddingTop:      12,
    paddingBottom:   12,
    paddingLeft:     14,
    paddingRight:    14,
    backgroundColor: C.accentBg,
    borderWidth:     1,
    borderColor:     C.accent,
    borderStyle:     'solid',
    borderRadius:    6,
    flexDirection:   'row',
    flexWrap:        'wrap',
  },
  cycleItem: { width: '25%', marginBottom: 4 },
  cycleLabel: { fontSize: 7, color: C.muted, letterSpacing: 0.5 },
  cycleValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.text },

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
  td: { fontSize: 9, color: C.text },

  col1: { width: '30%' },  // Jenis Ternak
  col2: { width: '12%', textAlign: 'right' },  // Ekor
  col3: { width: '14%', textAlign: 'right' },  // Berat Avg
  col4: { width: '16%', textAlign: 'right' },  // Total Berat
  col5: { width: '14%', textAlign: 'right' },  // Harga/kg
  col6: { width: '14%', textAlign: 'right' },  // Subtotal

  // Summary
  summarySection: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
  summaryBox:  { width: '45%' },
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
  totalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  totalVal:   { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },

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

  // Notes
  notesBox: {
    marginBottom:    20,
    paddingTop:      10,
    paddingBottom:   10,
    paddingLeft:     14,
    paddingRight:    14,
    backgroundColor: 'rgba(255,255,255,0)',
    borderWidth:     1,
    borderColor:     C.border,
    borderStyle:     'solid',
    borderRadius:    6,
  },
  notesLabel: { fontSize: 8, color: C.muted, marginBottom: 3 },
  notesText:  { fontSize: 9, color: C.text },

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

  // Footer
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

// ── Helpers ────────────────────────────────────────────────────────────────────

const CHICKEN_LABELS = {
  ayam_broiler:  'Ayam Broiler',
  ayam_pejantan: 'Ayam Pejantan',
  ayam_kampung:  'Ayam Kampung',
  ayam_layer:    'Ayam Layer (Afkir)',
}

// ── Component ──────────────────────────────────────────────────────────────────
// Props:
//   tenant: { business_name, phone, location }
//   cycle: { id, cycle_number, chicken_type, doc_count, total_mortality,
//             sell_price_per_kg, total_revenue, total_cost,
//             actual_harvest_date, final_fcr, notes }
//   farm: { farm_name, location, business_model, mitra_company }
//   broker_name: string  (pembeli/broker)
//   total_ekor: number   (ekor yang dijual)
//   total_berat: number  (kg total bobot)
//   price_per_kg: number
//   invoiceNumber: string
//   generatedBy: string

export function PeternakInvoice({
  tenant, cycle, farm, broker_name,
  total_ekor, total_berat, price_per_kg,
  invoiceNumber, generatedBy,
}) {
  const ekor     = Number(total_ekor   || 0)
  const berat    = Number(total_berat  || 0)
  const priceKg  = Number(price_per_kg || 0)
  const subtotal = Number(cycle?.total_revenue || (berat * priceKg))
  const avgWeight = ekor > 0 ? (berat / ekor) : 0

  const cycleNum   = cycle?.cycle_number ?? '-'
  const chickenLbl = CHICKEN_LABELS[cycle?.chicken_type] || cycle?.chicken_type || '-'
  const harvestDate = cycle?.actual_harvest_date
  const fcr = cycle?.final_fcr ? Number(cycle.final_fcr).toFixed(2) : '-'

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* HEADER */}
        <View style={s.header}>
          <View>
            <Text style={s.companyName}>{tenant?.business_name || 'Peternak'}</Text>
            <Text style={s.companyDetail}>{farm?.farm_name || tenant?.location || '-'}</Text>
            <Text style={s.companyDetail}>Tel: {tenant?.phone || '-'}</Text>
            <Text style={s.companyDetail}>TernakOS — Platform Manajemen Peternakan</Text>
          </View>
          <View>
            <Text style={s.docTitle}>TAGIHAN</Text>
            <Text style={s.docSubTitle}>PENJUALAN TERNAK</Text>
            <Text style={s.docNum}>{invoiceNumber}</Text>
            <Text style={s.docDate}>Tgl: {formatDatePDF(harvestDate || new Date())}</Text>
          </View>
        </View>

        {/* PARTIES */}
        <View style={s.parties}>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>DARI (PETERNAK)</Text>
            <Text style={s.partyName}>{tenant?.business_name || '-'}</Text>
            <Text style={s.partyDetail}>{farm?.farm_name || '-'}</Text>
            <Text style={s.partyDetail}>{tenant?.location || '-'}</Text>
            <Text style={s.partyDetail}>Tel: {tenant?.phone || '-'}</Text>
          </View>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>KEPADA (PEMBELI)</Text>
            <Text style={s.partyName}>{broker_name || '—'}</Text>
          </View>
        </View>

        {/* CYCLE INFO BOX */}
        <View style={s.cycleBox}>
          <View style={s.cycleItem}>
            <Text style={s.cycleLabel}>SIKLUS</Text>
            <Text style={s.cycleValue}>#{cycleNum}</Text>
          </View>
          <View style={s.cycleItem}>
            <Text style={s.cycleLabel}>JENIS TERNAK</Text>
            <Text style={s.cycleValue}>{chickenLbl}</Text>
          </View>
          <View style={s.cycleItem}>
            <Text style={s.cycleLabel}>TGL PANEN</Text>
            <Text style={s.cycleValue}>{formatDatePDF(harvestDate)}</Text>
          </View>
          <View style={s.cycleItem}>
            <Text style={s.cycleLabel}>FCR FINAL</Text>
            <Text style={s.cycleValue}>{fcr}</Text>
          </View>
          {farm?.mitra_company ? (
            <View style={s.cycleItem}>
              <Text style={s.cycleLabel}>MITRA</Text>
              <Text style={s.cycleValue}>{farm.mitra_company}</Text>
            </View>
          ) : null}
        </View>

        {/* TABLE */}
        <View style={{ marginBottom: 20 }}>
          <View style={s.tableHeader}>
            <Text style={[s.thText, s.col1]}>Jenis Ternak</Text>
            <Text style={[s.thText, s.col2]}>Ekor</Text>
            <Text style={[s.thText, s.col3]}>Berat Avg</Text>
            <Text style={[s.thText, s.col4]}>Total Berat</Text>
            <Text style={[s.thText, s.col5]}>Harga/kg</Text>
            <Text style={[s.thText, s.col6]}>Subtotal</Text>
          </View>

          <View style={s.tableRow}>
            <View style={s.col1}>
              <Text style={s.td}>{chickenLbl}</Text>
              <Text style={[s.td, { color: C.muted, marginTop: 2 }]}>
                {farm?.farm_name || '-'}
              </Text>
            </View>
            <Text style={[s.td, s.col2]}>
              {ekor > 0 ? ekor.toLocaleString('id-ID') : '-'}
            </Text>
            <Text style={[s.td, s.col3]}>
              {avgWeight > 0 ? `${avgWeight.toFixed(2)} kg` : '-'}
            </Text>
            <Text style={[s.td, s.col4]}>
              {berat > 0 ? `${berat.toFixed(2)} kg` : '-'}
            </Text>
            <Text style={[s.td, s.col5]}>
              {priceKg > 0 ? formatRupiahPDF(priceKg) : '-'}
            </Text>
            <Text style={[s.td, s.col6]}>{formatRupiahPDF(subtotal)}</Text>
          </View>
        </View>

        {/* SUMMARY */}
        <View style={s.summarySection}>
          <View style={s.summaryBox}>
            {Number(cycle?.total_cost) > 0 && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Biaya Produksi</Text>
                <Text style={s.summaryVal}>{formatRupiahPDF(cycle.total_cost)}</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TOTAL TAGIHAN</Text>
              <Text style={s.totalVal}>{formatRupiahPDF(subtotal)}</Text>
            </View>
          </View>
        </View>

        {/* TERBILANG */}
        <View style={s.terbilangBox}>
          <Text style={s.terbilangLabel}>TERBILANG</Text>
          <Text style={s.terbilangText}>{terbilang(subtotal)}</Text>
        </View>

        {/* NOTES */}
        {cycle?.notes ? (
          <View style={s.notesBox}>
            <Text style={s.notesLabel}>CATATAN</Text>
            <Text style={s.notesText}>{cycle.notes}</Text>
          </View>
        ) : null}

        {/* TANDA TANGAN */}
        <View style={s.sigSection}>
          <View style={s.sigBox}>
            <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>Penjual,</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{generatedBy || tenant?.business_name || '-'}</Text>
            <Text style={s.sigLabel}>Peternak / Penjual</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>Pembeli,</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{broker_name || '________________'}</Text>
            <Text style={s.sigLabel}>Broker / Pembeli</Text>
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
