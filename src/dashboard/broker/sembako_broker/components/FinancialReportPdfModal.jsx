import React, { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Printer, X, FileText, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatIDR } from '@/lib/format'
import { useBackHandler } from '@/lib/hooks/useBackHandler'

export default function FinancialReportPdfModal({ open, onClose, reportType = 'business_result', data, startDate, endDate }) {
  useBackHandler(open, onClose)
  const { tenant, profile } = useAuth()
  const printRef = useRef(null)

  if (!open || !data) return null

  const summary = data?.summary || {}
  const sales = data?.sales || []
  const byProduct = data?.byProduct || {}
  const byCustomer = data?.byCustomer || {}
  const rawExpenses = data?.expenses || []
  const supplierPayments = data?.supplierPayments || []

  // Ensure OPEX categories are properly gathered
  const opexCategories = { ...(data?.expenseByCategory || data?.opexByCategory || {}) }
  if (Object.keys(opexCategories).length === 0 && rawExpenses.length > 0) {
    rawExpenses.forEach(e => {
      const cat = e.category || 'Lainnya'
      opexCategories[cat] = (opexCategories[cat] || 0) + (Number(e.amount) || 0)
    })
  }

  // Calculate total OPEX robustly from totalExpenses, totalOpex, or categoriesSum
  const categoriesSum = Object.values(opexCategories).reduce((s, v) => s + (Number(v) || 0), 0)
  const rawTotalOpex = Number(summary.totalOpex || summary.totalExpenses || 0)
  const displayTotalOpex = Math.max(rawTotalOpex, categoriesSum)

  const businessName = tenant?.name || profile?.full_name || 'Distributor Sembako & Rokok'
  const businessAddress = tenant?.address || 'Jl. Raya Utama No. 1'
  const printDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const isBusinessResult = reportType === 'business_result'

  // Safe percentage helper to avoid NaN%
  const calcPct = (amount, total) => {
    const base = total !== undefined ? Number(total) : Number(summary.totalRevenue || summary.grossRevenue || 0)
    if (!base || base === 0 || isNaN(base)) return '0.0%'
    const val = (Number(amount || 0) / base) * 100
    return isNaN(val) ? '0.0%' : `${val.toFixed(1)}%`
  }

  const formatStatus = (status) => {
    if (status === 'lunas') return 'LUNAS'
    if (status === 'sebagian') return 'SEBAGIAN'
    return 'BELUM LUNAS'
  }

  const formatDateOnly = (dStr) => {
    if (!dStr) return '-'
    return String(dStr).slice(0, 10)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#0C1319] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl my-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Top Bar Controls */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-[#121B22] print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0F172A]/15 border border-[#0F172A]/30 flex items-center justify-center text-[#0F172A]">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="font-display font-black text-sm text-white m-0 uppercase tracking-wide">
                  {isBusinessResult ? 'Template PDF Audit — Laporan Hasil Bisnis & Laba Rugi' : 'Template PDF Audit — Laporan Arus Kas (Cash Flow Statement)'}
                </h3>
                <p className="text-[11px] text-[#94A3B8] m-0">
                  Pratinjau Resmi A4 Siap Cetak / Save PDF · Periode: {formatDateOnly(startDate)} s/d {formatDateOnly(endDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 h-9 rounded-xl font-bold text-xs bg-[#0F172A] hover:bg-slate-900 text-white transition-all cursor-pointer shadow-lg shadow-slate-950/10 active:scale-95 border-0"
              >
                <Printer size={15} />
                <span>Cetak / Save PDF</span>
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors border-0 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Document Preview Box */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#18222B] flex justify-center items-start">
            {/* Printable A4 Container */}
            <div
              ref={printRef}
              id="printable-financial-report"
              className="w-full max-w-[210mm] bg-white text-slate-900 p-8 sm:p-10 shadow-2xl rounded-sm text-left font-sans text-xs leading-normal font-normal min-h-[297mm] h-auto my-auto sm:my-0 mb-8"
              style={{ colorScheme: 'light' }}
            >
              {/* CSS Rule for Multi-Page Native Print */}
              <style>{`
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  html, body, #root, [class*="fixed"], [class*="overflow-"] {
                    overflow: visible !important;
                    height: auto !important;
                    position: static !important;
                    background: white !important;
                  }
                  #printable-financial-report, #printable-financial-report * {
                    visibility: visible !important;
                  }
                  #printable-financial-report {
                    position: relative !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    max-width: none !important;
                    margin: 0 !important;
                    padding: 8mm 12mm !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    background: white !important;
                    color: black !important;
                    height: auto !important;
                    min-height: auto !important;
                    overflow: visible !important;
                  }
                  tr, table {
                    page-break-inside: auto !important;
                  }
                  tr {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                  }
                  h1, h2, h3 {
                    page-break-after: avoid !important;
                    break-after: avoid !important;
                  }
                  @page {
                    size: A4 portrait;
                    margin: 10mm 10mm 10mm 10mm;
                  }
                }
              `}</style>

              {/* ── Kop Dokumen ───────────────────────────────────────────── */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
                <div>
                  <h1 className="font-serif text-xl font-bold text-slate-900 uppercase tracking-wide m-0">
                    {businessName}
                  </h1>
                  <p className="text-slate-600 text-[11px] m-0 mt-1">
                    {businessAddress}
                  </p>
                  <p className="text-slate-500 text-[10px] m-0 mt-0.5 flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-600 inline" /> Dokumen Audit Keuangan Keagenan Resmi
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-[#0F172A] text-white font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-sm mb-1.5">
                    {isBusinessResult ? 'LAPORAN HASIL BISNIS (P&L)' : 'LAPORAN ARUS KAS (CASH FLOW)'}
                  </div>
                  <p className="text-slate-700 text-[11px] font-semibold m-0">
                    Periode: <span className="font-bold text-slate-900">{formatDateOnly(startDate)} s.d. {formatDateOnly(endDate)}</span>
                  </p>
                  <p className="text-slate-400 text-[10px] m-0 mt-0.5">
                    Tanggal Cetak: {printDate}
                  </p>
                </div>
              </div>

              {/* ── REPORT CONTENT TYPE 1: BUSINESS RESULT (P&L) ──────────── */}
              {isBusinessResult ? (
                <div className="space-y-6">
                  {/* Summary Ringkasan Kunci (4 KPI Cards) */}
                  <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">Revenue (Akrual)</p>
                      <p className="text-sm font-bold text-amber-700 m-0">{formatIDR(summary.totalRevenue || 0)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">Net Profit ({summary.netMarginPct || calcPct(summary.netProfit)}%)</p>
                      <p className="text-sm font-bold text-emerald-700 m-0">{formatIDR(summary.netProfit || 0)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">Arus Kas Bersih</p>
                      <p className={`text-sm font-bold m-0 ${summary.netCashFlowPeriod >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatIDR(summary.netCashFlowPeriod || 0)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">Laba Terkonversi Kas</p>
                      <p className="text-sm font-bold text-emerald-700 m-0">{formatIDR(summary.cashMarginEstimate || summary.realizedNetProfit || 0)}</p>
                    </div>
                  </div>

                  {/* 1. Waterfall P&L Table */}
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
                      1. Perhitungan Laba Rugi Laporan Bisnis (Profit & Loss Statement)
                    </h3>
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-2">Komponen Pos Keuangan</th>
                          <th className="p-2 text-right">Nilai Nominal (Rp)</th>
                          <th className="p-2 text-right">% dari Omzet</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-2 font-bold text-slate-900">+ Penjualan Kotor (Gross)</td>
                          <td className="p-2 text-right font-bold">{formatIDR(summary.totalGrossRevenue || summary.grossRevenue || summary.totalRevenue || 0)}</td>
                          <td className="p-2 text-right font-semibold">100.0%</td>
                        </tr>
                        <tr>
                          <td className="p-2 pl-4 text-slate-700">− Retur Penjualan (Returns)</td>
                          <td className="p-2 text-right text-rose-700">({formatIDR(summary.totalReturns || summary.totalReturnsAmount || 0)})</td>
                          <td className="p-2 text-right">{calcPct(summary.totalReturns || summary.totalReturnsAmount || 0)}</td>
                        </tr>
                        <tr className="bg-slate-50 font-bold">
                          <td className="p-2">= Revenue Bersih (Net Revenue)</td>
                          <td className="p-2 text-right">{formatIDR(summary.totalRevenue || 0)}</td>
                          <td className="p-2 text-right">100.0%</td>
                        </tr>
                        <tr className="text-slate-700">
                          <td className="p-2 pl-4">− HPP (COGS FIFO)</td>
                          <td className="p-2 text-right">({formatIDR(summary.totalCOGS || summary.cogs || 0)})</td>
                          <td className="p-2 text-right">{calcPct(summary.totalCOGS || summary.cogs || 0)}</td>
                        </tr>
                        <tr className="bg-slate-100 font-bold text-slate-900 border-t border-b border-slate-300">
                          <td className="p-2">= Gross Profit (Laba Kotor)</td>
                          <td className="p-2 text-right">{formatIDR(summary.grossProfit || 0)}</td>
                          <td className="p-2 text-right">{summary.grossMarginPct || calcPct(summary.grossProfit)}%</td>
                        </tr>
                        <tr>
                          <td className="p-2 pl-4 text-slate-700">− Biaya Kirim / Pengiriman</td>
                          <td className="p-2 text-right text-rose-700">({formatIDR(summary.totalDeliveryCost || summary.deliveryCost || 0)})</td>
                          <td className="p-2 text-right">{calcPct(summary.totalDeliveryCost || summary.deliveryCost || 0)}</td>
                        </tr>
                        <tr>
                          <td className="p-2 pl-4 text-slate-700">− Biaya Lain</td>
                          <td className="p-2 text-right text-rose-700">({formatIDR(summary.totalOtherCost || summary.otherCost || 0)})</td>
                          <td className="p-2 text-right">{calcPct(summary.totalOtherCost || summary.otherCost || 0)}</td>
                        </tr>
                        <tr>
                          <td className="p-2 pl-4 text-slate-700">− Biaya Operasional (OPEX)</td>
                          <td className="p-2 text-right text-rose-700">({formatIDR(displayTotalOpex)})</td>
                          <td className="p-2 text-right">{calcPct(displayTotalOpex)}</td>
                        </tr>
                        <tr>
                          <td className="p-2 pl-4 text-slate-700">− Gaji Pegawai & Tim Management</td>
                          <td className="p-2 text-right text-rose-700">({formatIDR(summary.totalPayroll || 0)})</td>
                          <td className="p-2 text-right">{calcPct(summary.totalPayroll || 0)}</td>
                        </tr>
                        <tr className="bg-emerald-50 text-emerald-900 font-extrabold text-sm border-2 border-emerald-500">
                          <td className="p-2.5">= NET PROFIT (LABA BERSIH)</td>
                          <td className="p-2.5 text-right">{formatIDR(summary.netProfit || 0)}</td>
                          <td className="p-2.5 text-right">{summary.netMarginPct || calcPct(summary.netProfit)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 2. Likuiditas & Modal Beredar (Working Capital & Balance Sheet Summary) */}
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
                      2. Likuiditas & Modal Beredar (Working Capital & Asset Summary)
                    </h3>
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-2 text-slate-700">💵 Cash On Hand (Kas Tunai di Tangan/Kasir)</td>
                          <td className="p-2 text-right font-semibold">{formatIDR(summary.endingCashOnHand || summary.cashTunaiAkhir || 0)}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-slate-700">🏦 Bank Balance (Saldo Rekening Bank Sistem)</td>
                          <td className="p-2 text-right font-semibold">{formatIDR(summary.endingBankBalance || summary.cashBankAkhir || 0)}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-slate-700">📦 Persediaan (Stok Barang di Gudang)</td>
                          <td className="p-2 text-right font-semibold">{formatIDR(summary.inventoryValue || summary.nilaiStok || 0)}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-slate-700">🧾 Piutang Dagang (Tagihan Toko Belum Lunas)</td>
                          <td className="p-2 text-right font-semibold">{formatIDR(summary.totalAr || summary.totalOutstanding || 0)}</td>
                        </tr>
                        <tr className="bg-slate-100 font-bold border-t border-b border-slate-300">
                          <td className="p-2 text-slate-900">= TOTAL ASET LANCAR</td>
                          <td className="p-2 text-right text-emerald-800">{formatIDR(summary.totalCurrentAssets || ((summary.endingCashOnHand || 0) + (summary.endingBankBalance || 0) + (summary.inventoryValue || 0) + (summary.totalAr || 0)))}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-slate-700">🤝 Hutang Dagang (Kewajiban ke Supplier)</td>
                          <td className="p-2 text-right text-rose-700">({formatIDR(summary.totalAp || summary.unpaidSupplierPeriod || 0)})</td>
                        </tr>
                        <tr className="bg-amber-50 font-extrabold text-amber-950 border-2 border-amber-400">
                          <td className="p-2 font-bold">= MODAL KERJA BERSIH (NET WORKING CAPITAL)</td>
                          <td className="p-2 text-right text-amber-900">{formatIDR(summary.netWorkingCapital || (summary.totalCurrentAssets - summary.totalAp))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 3. Laporan Arus Kas (Cash Flow Statement Box) */}
                  <div className="bg-slate-50 border border-slate-300 p-3.5 rounded-lg space-y-2">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-amber-800 border-b border-slate-300 pb-1 m-0">
                      3. Laporan Arus Kas (Cash Flow Statement)
                    </h3>
                    <div className="text-[10px] text-amber-700 bg-amber-50/80 p-2 rounded border border-amber-200">
                      <strong>💡 Batasan Sistem:</strong> Saldo Kas Awal dihitung berdasarkan riwayat transaksi yang tercatat di sistem aplikasi dan belum memperhitungkan saldo kas awal fisik atau penyesuaian manual luar sistem.
                    </div>
                    <div className="space-y-1.5 pt-1">
                      {/* Opening Cash */}
                      <div className="flex justify-between items-center font-bold text-slate-900 border-b border-dashed border-slate-300 pb-1">
                        <span>SALDO KAS AWAL</span>
                        <span>{formatIDR((summary.openingCashOnHand || 0) + (summary.openingBankBalance || 0))}</span>
                      </div>
                      <div className="flex gap-4 text-[10px] text-slate-500 pl-3">
                        <span>Tunai: {formatIDR(summary.openingCashOnHand || 0)}</span>
                        <span>Bank: {formatIDR(summary.openingBankBalance || 0)}</span>
                      </div>

                      {/* Cash In */}
                      <div className="flex justify-between items-center font-bold text-emerald-700 pt-1">
                        <span>+ Penerimaan Pembayaran (Cash In)</span>
                        <span>{formatIDR((summary.cashInPeriodTunai || 0) + (summary.cashInPeriodTransfer || 0))}</span>
                      </div>
                      <div className="flex gap-4 text-[10px] text-slate-500 pl-3">
                        <span>Tunai: {formatIDR(summary.cashInPeriodTunai || 0)}</span>
                        <span>Bank: {formatIDR(summary.cashInPeriodTransfer || 0)}</span>
                      </div>

                      {/* Cash Out Breakdown */}
                      <div className="pl-3 border-l-2 border-slate-300 space-y-1 pt-1">
                        <div className="flex justify-between text-slate-700">
                          <span>− Pembelian Stok & Bayar Supplier</span>
                          <span className="font-semibold text-rose-700">({formatIDR((summary.supplierOutPeriodTunai || 0) + (summary.supplierOutPeriodTransfer || 0))})</span>
                        </div>
                        <div className="flex gap-4 text-[10px] text-slate-500 pl-2">
                          <span>Tunai: {formatIDR(summary.supplierOutPeriodTunai || 0)}</span>
                          <span>Bank: {formatIDR(summary.supplierOutPeriodTransfer || 0)}</span>
                        </div>

                        {Number(summary.payrollOutPeriodTunai) > 0 && (
                          <div className="flex justify-between text-slate-700">
                            <span>− Gaji Pegawai Terbayar (Asumsi Tunai)</span>
                            <span className="font-semibold text-rose-700">({formatIDR(summary.payrollOutPeriodTunai)})</span>
                          </div>
                        )}

                        {Number(summary.deliveryOutPeriodTunai || summary.deliveryCost) > 0 && (
                          <div className="flex justify-between text-slate-700">
                            <span>− Biaya Pengiriman & Armada (Asumsi Tunai)</span>
                            <span className="font-semibold text-rose-700">({formatIDR(summary.deliveryOutPeriodTunai || summary.deliveryCost || 0)})</span>
                          </div>
                        )}

                        {Number(summary.regularExpensesOutPeriodTunai || displayTotalOpex) > 0 && (
                          <div className="flex justify-between text-slate-700">
                            <span>− Biaya Operasional Toko & Gudang</span>
                            <span className="font-semibold text-rose-700">({formatIDR(summary.regularExpensesOutPeriodTunai || displayTotalOpex || 0)})</span>
                          </div>
                        )}

                        {Number(summary.priveOutPeriodTunai) > 0 && (
                          <div className="flex justify-between text-slate-700">
                            <span>− Pengambilan Pemilik / Prive (Draw)</span>
                            <span className="font-semibold text-rose-700">({formatIDR(summary.priveOutPeriodTunai)})</span>
                          </div>
                        )}
                      </div>

                      {/* Total Cash Out */}
                      <div className="flex justify-between items-center font-bold text-rose-700 pt-1 border-t border-slate-200">
                        <span>= Total Pengeluaran Kas (Cash Out)</span>
                        <span>− {formatIDR((summary.supplierOutPeriodTunai || 0) + (summary.supplierOutPeriodTransfer || 0) + (summary.payrollOutPeriodTunai || 0) + (summary.regularExpensesOutPeriodTunai || displayTotalOpex || 0) + (summary.priveOutPeriodTunai || 0) + (summary.deliveryOutPeriodTunai || summary.deliveryCost || 0))}</span>
                      </div>

                      {/* Ending Cash */}
                      <div className="flex justify-between items-center font-extrabold text-slate-900 border-t-2 border-slate-800 pt-1.5 text-xs">
                        <span>SALDO KAS AKHIR</span>
                        <span className="text-amber-800">{formatIDR((summary.endingCashOnHand || 0) + (summary.endingBankBalance || 0))}</span>
                      </div>
                      <div className="flex gap-4 text-[10px] text-slate-600 font-semibold pl-3">
                        <span>Tunai (Cash On Hand): {formatIDR(summary.endingCashOnHand || summary.cashTunaiAkhir || 0)}</span>
                        <span>Bank (System Balance): {formatIDR(summary.endingBankBalance || summary.cashBankAkhir || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Margin Per Produk */}
                  {Object.keys(byProduct).length > 0 && (
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
                        3. Breakdown Performa & Margin Per Produk
                      </h3>
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                          <tr>
                            <th className="p-2">Nama Produk / Item</th>
                            <th className="p-2 text-center">Qty Terjual</th>
                            <th className="p-2 text-right">Revenue (Omzet)</th>
                            <th className="p-2 text-right">HPP (COGS)</th>
                            <th className="p-2 text-right">Profit</th>
                            <th className="p-2 text-right">Margin %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {Object.entries(byProduct).map(([pName, pData]) => {
                            const profit = pData.revenue - pData.cogs
                            const marginPct = pData.revenue > 0 ? ((profit / pData.revenue) * 100).toFixed(1) : '0.0'
                            return (
                              <tr key={pName}>
                                <td className="p-2 font-semibold text-slate-900">{pName}</td>
                                <td className="p-2 text-center">{pData.qty} {pData.unit || 'slop'}</td>
                                <td className="p-2 text-right font-semibold">{formatIDR(pData.revenue)}</td>
                                <td className="p-2 text-right text-slate-600">{formatIDR(pData.cogs)}</td>
                                <td className="p-2 text-right font-bold text-emerald-700">{formatIDR(profit)}</td>
                                <td className="p-2 text-right font-bold text-slate-800">{marginPct}%</td>
                              </tr>
                            )
                          })}
                        </tbody>
                        <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                          <tr>
                            <td className="p-2">TOTAL</td>
                            <td className="p-2 text-center">
                              {Object.values(byProduct).reduce((s, p) => s + (p.qty || 0), 0)}
                            </td>
                            <td className="p-2 text-right text-amber-700">
                              {formatIDR(Object.values(byProduct).reduce((s, p) => s + (p.revenue || 0), 0))}
                            </td>
                            <td className="p-2 text-right text-slate-600">
                              {formatIDR(Object.values(byProduct).reduce((s, p) => s + (p.cogs || 0), 0))}
                            </td>
                            <td className="p-2 text-right text-emerald-700">
                              {formatIDR(Object.values(byProduct).reduce((s, p) => s + (p.revenue - p.cogs), 0))}
                            </td>
                            <td className="p-2 text-right">
                              {summary.grossMarginPct || calcPct(summary.grossProfit)}%
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* 4. Top Toko / Pelanggan */}
                  {Object.keys(byCustomer).length > 0 && (
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
                        4. Top Toko / Pelanggan Terbaik Periode Ini
                      </h3>
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                          <tr>
                            <th className="p-2">Nama Toko / Pelanggan</th>
                            <th className="p-2 text-center">Jumlah Invoice</th>
                            <th className="p-2 text-right">Total Omzet (Rp)</th>
                            <th className="p-2 text-right">Total Profit (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {Object.entries(byCustomer).map(([cName, cData]) => (
                            <tr key={cName}>
                              <td className="p-2 font-bold text-slate-900">{cName}</td>
                              <td className="p-2 text-center font-medium">{cData.count} invoice</td>
                              <td className="p-2 text-right font-semibold text-amber-700">{formatIDR(cData.revenue)}</td>
                              <td className="p-2 text-right font-bold text-emerald-700">{formatIDR(cData.profit)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 5. Breakdown Pengeluaran */}
                  {Object.keys(opexCategories).length > 0 && (
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
                        5. Breakdown Pengeluaran & Beban Operasional
                      </h3>
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                          <tr>
                            <th className="p-2">Pos Pengeluaran</th>
                            <th className="p-2 text-right">Nominal (Rp)</th>
                            <th className="p-2 text-right">Persentase</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr>
                            <td className="p-2 font-semibold">HPP (COGS)</td>
                            <td className="p-2 text-right">{formatIDR(summary.totalCOGS || summary.cogs || 0)}</td>
                            <td className="p-2 text-right">{calcPct(summary.totalCOGS || summary.cogs || 0)}</td>
                          </tr>
                          {Number(summary.deliveryCost) > 0 && (
                            <tr>
                              <td className="p-2 font-semibold">Biaya Kirim & Armada</td>
                              <td className="p-2 text-right">{formatIDR(summary.deliveryCost)}</td>
                              <td className="p-2 text-right">{calcPct(summary.deliveryCost)}</td>
                            </tr>
                          )}
                          {Object.entries(opexCategories).map(([cat, amount]) => (
                            <tr key={cat}>
                              <td className="p-2 capitalize">{cat.replace(/_/g, ' ')}</td>
                              <td className="p-2 text-right font-semibold">{formatIDR(amount)}</td>
                              <td className="p-2 text-right">{calcPct(amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 6. Ringkasan Transaksi Invoice Terakhir */}
                  {sales.length > 0 && (
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
                        6. Ringkasan Transaksi Invoice Terakhir (5 Teratas dari Total {sales.length} Nota)
                      </h3>
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                          <tr>
                            <th className="p-2">No. Invoice</th>
                            <th className="p-2">Tanggal</th>
                            <th className="p-2">Nama Toko / Pelanggan</th>
                            <th className="p-2 text-right">Total Nota</th>
                            <th className="p-2 text-right">Terbayar</th>
                            <th className="p-2 text-right">Sisa Piutang</th>
                            <th className="p-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {sales.slice(0, 5).map(sale => (
                            <tr key={sale.id}>
                              <td className="p-2 font-mono font-bold text-slate-900">{sale.invoice_number}</td>
                              <td className="p-2 text-slate-600">{formatDateOnly(sale.transaction_date)}</td>
                              <td className="p-2 font-medium">{sale.customer_name || 'Pelanggan General'}</td>
                              <td className="p-2 text-right font-semibold">{formatIDR(sale.total_amount || 0)}</td>
                              <td className="p-2 text-right text-emerald-700">{formatIDR(sale.paid_amount || 0)}</td>
                              <td className="p-2 text-right text-rose-700">{formatIDR(sale.remaining_amount || 0)}</td>
                              <td className="p-2 text-center font-bold text-[10px]">
                                <span className={`px-1.5 py-0.5 rounded ${sale.payment_status === 'lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                  {formatStatus(sale.payment_status)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {sales.length > 5 && (
                        <p className="text-[10px] text-slate-500 font-italic mt-1 text-right">* Ringkasan 5 nota terbaru. Total keseluruhan periode ini: {sales.length} nota.</p>
                      )}
                    </div>
                  )}

                  {/* 7. Rincian Pelunasan & Pembayaran ke Supplier */}
                  {supplierPayments.length > 0 && (
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
                        7. Rincian Pelunasan & Pembayaran ke Supplier ({supplierPayments.length})
                      </h3>
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                          <tr>
                            <th className="p-2">Tanggal</th>
                            <th className="p-2">Nama Supplier</th>
                            <th className="p-2 text-center">Metode Bayar</th>
                            <th className="p-2 text-right">Nominal Dibayar (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {supplierPayments.map((sp, idx) => (
                            <tr key={sp.id || idx}>
                              <td className="p-2 text-slate-600">{formatDateOnly(sp.payment_date || sp.created_at)}</td>
                              <td className="p-2 font-bold text-slate-900">{sp.supplier_name || 'Supplier'}</td>
                              <td className="p-2 text-center uppercase font-semibold text-[10px]">
                                <span className={`px-1.5 py-0.5 rounded ${sp.payment_method === 'transfer' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                  {sp.payment_method || 'cash'}
                                </span>
                              </td>
                              <td className="p-2 text-right font-bold text-rose-700">{formatIDR(sp.amount || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                          <tr>
                            <td colSpan={3} className="p-2">TOTAL PELUNASAN SUPPLIER</td>
                            <td className="p-2 text-right text-rose-700">
                              {formatIDR(supplierPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* ── REPORT CONTENT TYPE 2: CASH FLOW STATEMENT ───────────── */
                <div className="space-y-6">
                  {/* Cash Summary Banner */}
                  <div className="grid grid-cols-3 gap-3 bg-amber-50/60 p-4 rounded-lg border border-amber-200">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">Saldo Kas Awal</p>
                      <p className="text-sm font-bold text-slate-800 m-0">{formatIDR(summary.startingCashOnHand || 0)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">Net Arus Kas Periode</p>
                      <p className={`text-sm font-bold m-0 ${summary.netCashFlowPeriod >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatIDR(summary.netCashFlowPeriod || 0)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">Saldo Kas Akhir</p>
                      <p className="text-sm font-extrabold text-amber-800 m-0">{formatIDR(summary.endingCashOnHand || 0)}</p>
                    </div>
                  </div>

                  {/* Cash Flow Detailed Table */}
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
                      1. Rincian Arus Kas Lengkap (Cash Flow Statement)
                    </h3>
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-slate-200">
                        {/* Section A: Starting Cash */}
                        <tr className="bg-slate-100 font-bold text-slate-900">
                          <td className="p-2.5">SALDO KAS AWAL PERIODE</td>
                          <td className="p-2.5 text-right font-extrabold">{formatIDR(summary.startingCashOnHand || 0)}</td>
                        </tr>
                        <tr className="text-slate-600">
                          <td className="p-2 pl-6">· Saldo Kas Tunai Awal</td>
                          <td className="p-2 text-right">{formatIDR(summary.cashTunaiAwal || 0)}</td>
                        </tr>
                        <tr className="text-slate-600">
                          <td className="p-2 pl-6">· Saldo Bank Awal</td>
                          <td className="p-2 text-right">{formatIDR(summary.cashBankAwal || 0)}</td>
                        </tr>

                        {/* Section B: Cash In */}
                        <tr className="bg-emerald-50 text-emerald-950 font-bold border-t-2 border-emerald-300">
                          <td className="p-2.5">+ PENERIMAAN KAS (CASH IN)</td>
                          <td className="p-2.5 text-right font-extrabold">{formatIDR(summary.cashInPeriod || 0)}</td>
                        </tr>
                        <tr className="text-slate-700">
                          <td className="p-2 pl-6">· Penerimaan Pembayaran Tunai (Cash)</td>
                          <td className="p-2 text-right">{formatIDR(summary.cashInPeriodTunai || 0)}</td>
                        </tr>
                        <tr className="text-slate-700">
                          <td className="p-2 pl-6">· Penerimaan Pelunasan Transfer Bank</td>
                          <td className="p-2 text-right">{formatIDR(summary.cashInPeriodTransfer || 0)}</td>
                        </tr>

                        {/* Section C: Cash Out */}
                        <tr className="bg-rose-50 text-rose-950 font-bold border-t-2 border-rose-300">
                          <td className="p-2.5">− PENGELUARAN KAS (CASH OUT)</td>
                          <td className="p-2.5 text-right font-extrabold">({formatIDR(summary.cashOutPeriod || 0)})</td>
                        </tr>
                        <tr className="text-slate-700">
                          <td className="p-2 pl-6">· Pembelian Stok Supplier (Tunai & Transfer)</td>
                          <td className="p-2 text-right">({formatIDR(summary.cashOutPurchases || 0)})</td>
                        </tr>
                        <tr className="text-slate-700">
                          <td className="p-2 pl-6">· Biaya Pengiriman & Armada (Asumsi Tunai)</td>
                          <td className="p-2 text-right">({formatIDR(summary.deliveryOutPeriodTunai || summary.deliveryCost || 0)})</td>
                        </tr>
                        <tr className="text-slate-700">
                          <td className="p-2 pl-6">· Biaya Operasional Toko & Gudang</td>
                          <td className="p-2 text-right">({formatIDR(summary.cashOutOpex || displayTotalOpex)})</td>
                        </tr>
                        {Number(summary.cashOutPayroll) > 0 && (
                          <tr className="text-slate-700">
                            <td className="p-2 pl-6">· Gaji Pegawai & Tim Management</td>
                            <td className="p-2 text-right">({formatIDR(summary.cashOutPayroll)})</td>
                          </tr>
                        )}

                        {/* Section D: Ending Cash */}
                        <tr className="bg-amber-100 text-slate-900 font-extrabold text-sm border-t-2 border-b-2 border-[#0F172A]">
                          <td className="p-3">= SALDO KAS AKHIR PERIODE</td>
                          <td className="p-3 text-right">{formatIDR(summary.endingCashOnHand || 0)}</td>
                        </tr>
                        <tr className="text-slate-700 font-semibold bg-slate-50">
                          <td className="p-2 pl-6">· Saldo Kas Tunai Akhir (Cash on Hand)</td>
                          <td className="p-2 text-right">{formatIDR(summary.cashTunaiAkhir || summary.endingCashOnHand || 0)}</td>
                        </tr>
                        <tr className="text-slate-700 font-semibold bg-slate-50">
                          <td className="p-2 pl-6">· Saldo Bank Akhir</td>
                          <td className="p-2 text-right">{formatIDR(summary.cashBankAkhir || summary.endingBankBalance || 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 2. Daftar Toko dengan Sisa Piutang Aktif */}
                  {sales.filter(s => (s.remaining_amount || 0) > 0).length > 0 && (
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
                        2. Ringkasan Piutang Toko Aktif (Accounts Receivable)
                      </h3>
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                          <tr>
                            <th className="p-2">Nama Toko / Pelanggan</th>
                            <th className="p-2">No. Invoice</th>
                            <th className="p-2 text-right">Total Nota</th>
                            <th className="p-2 text-right">Sisa Piutang (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {sales.filter(s => (s.remaining_amount || 0) > 0).map(s => (
                            <tr key={s.id}>
                              <td className="p-2 font-bold text-slate-900">{s.customer_name || 'Pelanggan'}</td>
                              <td className="p-2 font-mono text-slate-600">{s.invoice_number}</td>
                              <td className="p-2 text-right">{formatIDR(s.total_amount || 0)}</td>
                              <td className="p-2 text-right font-bold text-rose-700">{formatIDR(s.remaining_amount || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 3. Rincian Riwayat Pembayaran ke Supplier Periode Ini */}
                  {supplierPayments.length > 0 && (
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
                        3. Rincian Riwayat Pembayaran ke Supplier Periode Ini ({supplierPayments.length})
                      </h3>
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                          <tr>
                            <th className="p-2">Tanggal</th>
                            <th className="p-2">Nama Supplier</th>
                            <th className="p-2 text-center">Metode Bayar</th>
                            <th className="p-2 text-right">Nominal Dibayar (Rp)</th>
                            <th className="p-2">Catatan / Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {supplierPayments.map((sp, idx) => (
                            <tr key={sp.id || idx}>
                              <td className="p-2 text-slate-600">{formatDateOnly(sp.payment_date || sp.created_at)}</td>
                              <td className="p-2 font-bold text-slate-900">{sp.supplier_name || sp.sembako_suppliers?.supplier_name || 'Supplier'}</td>
                              <td className="p-2 text-center uppercase font-semibold text-[10px]">
                                <span className={`px-1.5 py-0.5 rounded ${sp.payment_method === 'transfer' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                  {sp.payment_method || 'cash'}
                                </span>
                              </td>
                              <td className="p-2 text-right font-bold text-rose-700">{formatIDR(sp.amount || 0)}</td>
                              <td className="p-2 text-slate-500 italic text-[11px]">{sp.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400">
                          <tr>
                            <td colSpan={3} className="p-2">TOTAL PEMBAYARAN SUPPLIER</td>
                            <td className="p-2 text-right text-rose-700">
                              {formatIDR(supplierPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0))}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── Document Signatures ────────────────────────────────────── */}
              <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 m-0 mb-12">Dibuat Oleh (Finance / Kasir)</p>
                  <p className="font-bold text-slate-900 underline m-0">{profile?.full_name || 'Staff Keuangan'}</p>
                  <p className="text-[10px] text-slate-500 m-0">Tanda Tangan & Nama Terang</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 m-0 mb-12">Disetujui Oleh (Owner / Manager)</p>
                  <p className="font-bold text-slate-900 underline m-0">Pemilik Bisnis</p>
                  <p className="text-[10px] text-slate-500 m-0">Tanda Tangan & Cap Usaha</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
