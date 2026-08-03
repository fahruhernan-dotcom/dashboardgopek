import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatRupiahPDF, formatDatePDF } from '@/lib/invoice/invoiceUtils'

// Blue accent — beda dari SaleInvoice (emerald) agar mudah dibedakan
const C = {
  bg:      '#FFFFFF',
  text:    '#1a1a1a',
  muted:   '#666666',
  faint:   '#999999',
  light:   '#F9FAFB',
  border:  '#E5E7EB',
  header:  '#0C1319',
  accent:  '#3B82F6',  // blue
  accentBg:'#EFF6FF',
  warn:    '#EF4444',
  ok:      '#021a02',
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
  docTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.accent, textAlign: 'right' },
  docSubTitle: { fontSize: 9, color: C.muted, textAlign: 'right', marginTop: 2 },
  docNum: { fontSize: 9, color: C.muted, textAlign: 'right', marginTop: 2 },
  docDate: { fontSize: 9, color: C.muted, textAlign: 'right', marginTop: 2 },

  parties: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  partyBox: { width: '45%' },
  partyLabel: {
    fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.accent,
    letterSpacing: 1, marginBottom: 6,
  },
  partyName:   { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.header },
  partyDetail: { fontSize: 9, color: C.muted, marginTop: 2 },

  // Table pengiriman
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
  td: { fontSize: 9, color: C.text },

  colDesc:   { width: '28%' },
  colAwal:   { width: '18%', textAlign: 'right' },
  colTiba:   { width: '18%', textAlign: 'right' },
  colSelisih:{ width: '18%', textAlign: 'right' },
  colKet:    { width: '18%', textAlign: 'center' },

  // Info box pengiriman
  infoBox: {
    marginBottom:    20,
    paddingTop:      14,
    paddingBottom:   14,
    paddingLeft:     16,
    paddingRight:    16,
    backgroundColor: C.accentBg,
    borderWidth:     1,
    borderColor:     C.accent,
    borderStyle:     'solid',
    borderRadius:    6,
  },
  infoBoxLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.accent, letterSpacing: 1, marginBottom: 10 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  infoItem: { width: '50%', marginBottom: 8 },
  infoLabel: { fontSize: 8, color: C.muted, marginBottom: 2 },
  infoValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.text },

  // Financial summary (jika ada harga)
  summarySection: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 },
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
  summaryVal:   { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.text },
  summaryWarn:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.warn },
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

  // Signature — 3 pihak
  sigSection: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    marginTop:       40,
  },
  sigBox:  { width: '30%', alignItems: 'center' },
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function durasi(departure, arrival) {
  if (!departure || !arrival) return '-'
  const diff = new Date(arrival) - new Date(departure)
  if (diff <= 0) return '-'
  const totalMin = Math.round(diff / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h} jam ${m} mnt` : `${m} menit`
}

function formatTime(val) {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// ── Component ─────────────────────────────────────────────────────────────────
// Props:
//   tenant: { business_name, phone, location }
//   delivery: { id, status, initial_count, arrived_count, initial_weight_kg,
//               arrived_weight_kg, shrinkage_kg, departure_time, arrival_time,
//               driver_name, driver_phone, vehicle_plate, vehicle_type,
//               mortality_count, delivery_cost }
//   sale: { id, price_per_kg, total_revenue }
//   farm: { farm_name, location }
//   rpa: { rpa_name, location }
//   invoiceNumber: string
//   generatedBy: string

export function DeliveryReceipt({ tenant, delivery, sale, farm, rpa, invoiceNumber, generatedBy }) {
  const isArrived    = ['arrived', 'completed'].includes(delivery?.status)
  const initCount    = Number(delivery?.initial_count || 0)
  const arrivedCount = isArrived ? Number(delivery?.arrived_count || 0) : null
  const initWeight   = Number(delivery?.initial_weight_kg || 0)
  const arrivedWeight = isArrived ? Number(delivery?.arrived_weight_kg || 0) : null

  const mortality    = isArrived ? Number(delivery?.mortality_count || initCount - arrivedCount || 0) : null
  const shrinkage    = isArrived ? Number(delivery?.shrinkage_kg || initWeight - arrivedWeight || 0) : null
  const pricePerKg   = Number(sale?.price_per_kg || 0)

  const shrinkagePct = (isArrived && initWeight > 0) ? (shrinkage / initWeight) * 100 : 0
  const revenueAktual   = isArrived ? arrivedWeight * pricePerKg : 0
  const revenueEstimasi = initWeight * pricePerKg
  const selisihFinancial = revenueEstimasi - revenueAktual

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
            <Text style={s.docTitle}>SURAT JALAN</Text>
            <Text style={s.docSubTitle}>DELIVERY ORDER</Text>
            <Text style={s.docNum}>{invoiceNumber}</Text>
            <Text style={s.docDate}>Tgl: {formatDatePDF(delivery?.departure_time || new Date())}</Text>
          </View>
        </View>

        {/* FROM / TO */}
        <View style={s.parties}>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>DARI (ASAL)</Text>
            <Text style={s.partyName}>{farm?.farm_name || '-'}</Text>
            <Text style={s.partyDetail}>{farm?.location || '-'}</Text>
          </View>
          <View style={s.partyBox}>
            <Text style={s.partyLabel}>TUJUAN</Text>
            <Text style={s.partyName}>{rpa?.rpa_name || '-'}</Text>
            <Text style={s.partyDetail}>{rpa?.location || '-'}</Text>
          </View>
        </View>

        {/* TABLE */}
        <View style={{ marginBottom: 20 }}>
          <View style={s.tableHeader}>
            <Text style={[s.thText, s.colDesc]}>Deskripsi</Text>
            <Text style={[s.thText, s.colAwal]}>Awal</Text>
            <Text style={[s.thText, s.colTiba]}>Tiba</Text>
            <Text style={[s.thText, s.colSelisih]}>Selisih</Text>
            <Text style={[s.thText, s.colKet]}>Ket</Text>
          </View>

          {/* Jumlah Ekor */}
          <View style={s.tableRow}>
            <Text style={[s.td, s.colDesc]}>Jumlah Ayam (ekor)</Text>
            <Text style={[s.td, s.colAwal]}>{initCount.toLocaleString('id-ID')}</Text>
            <Text style={[s.td, s.colTiba]}>{isArrived ? arrivedCount.toLocaleString('id-ID') : '-'}</Text>
            <Text style={[s.td, s.colSelisih, { color: mortality > 0 ? C.warn : C.text }]}>
              {isArrived ? (mortality > 0 ? `-${mortality}` : '0') : '-'}
            </Text>
            <Text style={[s.td, s.colKet, { color: mortality > 0 ? C.warn : C.text }]}>
              {isArrived ? (mortality > 0 ? 'Ada kematian' : 'OK') : '-'}
            </Text>
          </View>

          {/* Berat */}
          <View style={[s.tableRow, s.tableRowAlt]}>
            <Text style={[s.td, s.colDesc]}>Berat (kg)</Text>
            <Text style={[s.td, s.colAwal]}>{initWeight.toFixed(2)}</Text>
            <Text style={[s.td, s.colTiba]}>{isArrived ? arrivedWeight.toFixed(2) : '-'}</Text>
            <Text style={[s.td, s.colSelisih, { color: shrinkage > 0 ? C.warn : C.text }]}>
              {isArrived ? (shrinkage > 0 ? `-${shrinkage.toFixed(2)}` : '0.00') : '-'}
            </Text>
            <Text style={[s.td, s.colKet, { color: shrinkagePct > 2 ? C.warn : C.text }]}>
              {isArrived ? (shrinkage > 0 ? `${shrinkagePct.toFixed(1)}%` : 'OK') : '-'}
            </Text>
          </View>
        </View>

        {/* INFO PENGIRIMAN */}
        <View style={s.infoBox}>
          <Text style={s.infoBoxLabel}>DETAIL PENGIRIMAN</Text>
          <View style={s.infoGrid}>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Sopir</Text>
              <Text style={s.infoValue}>{delivery?.driver_name || '-'}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Kendaraan</Text>
              <Text style={s.infoValue}>
                {[delivery?.vehicle_type, delivery?.vehicle_plate].filter(Boolean).join(' · ') || '-'}
              </Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Jam Muat</Text>
              <Text style={s.infoValue}>{formatTime(delivery?.load_time)}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Waktu Berangkat</Text>
              <Text style={s.infoValue}>{formatTime(delivery?.departure_time)}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Waktu Tiba</Text>
              <Text style={s.infoValue}>{formatTime(delivery?.arrival_time)}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Durasi</Text>
              <Text style={s.infoValue}>{durasi(delivery?.departure_time, delivery?.arrival_time)}</Text>
            </View>

          </View>
        </View>

        {/* FINANCIAL SUMMARY (jika ada harga) */}
        {(pricePerKg > 0 && isArrived) && (
          <View style={s.summarySection}>
            <View style={s.summaryBox}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Estimasi ({initWeight.toFixed(2)} kg)</Text>
                <Text style={s.summaryVal}>{formatRupiahPDF(revenueEstimasi)}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Aktual ({arrivedWeight.toFixed(2)} kg)</Text>
                <Text style={s.summaryVal}>{formatRupiahPDF(revenueAktual)}</Text>
              </View>
              {shrinkage > 0 && (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>
                    Susut {shrinkagePct.toFixed(1)}%{shrinkagePct > 2 ? ' ⚠' : ''}
                  </Text>
                  <Text style={[s.summaryVal, { color: shrinkagePct > 2 ? C.warn : C.text }]}>
                    -{formatRupiahPDF(selisihFinancial)}
                  </Text>
                </View>
              )}
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>PENDAPATAN AKTUAL</Text>
                <Text style={s.totalVal}>{formatRupiahPDF(revenueAktual)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* TANDA TANGAN 3 PIHAK */}
        <View style={s.sigSection}>
          <View style={s.sigBox}>
            <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4, textAlign: 'center' }}>Pengirim,</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{generatedBy || tenant?.business_name || '-'}</Text>
            <Text style={s.sigLabel}>Broker / Pengirim</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4, textAlign: 'center' }}>Sopir,</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{delivery?.driver_name || '________________'}</Text>
            <Text style={s.sigLabel}>Sopir Pengiriman</Text>
          </View>
          <View style={s.sigBox}>
            <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4, textAlign: 'center' }}>Penerima,</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{rpa?.rpa_name || '________________'}</Text>
            <Text style={s.sigLabel}>Penerima / RPA</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {invoiceNumber} | {formatDatePDF(new Date())} | {generatedBy || '-'}
          </Text>
          <Text style={s.footerText}>Powered by TernakOS — ternakos.com</Text>
        </View>

      </Page>
    </Document>
  )
}
