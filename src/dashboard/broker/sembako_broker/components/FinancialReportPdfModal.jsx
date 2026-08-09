import React, { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Printer, X, FileText, CheckCircle2, ShieldCheck } from 'lucide-react'
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
  const opexCategories = data?.expenseByCategory || data?.opexByCategory || {}

  const businessName = tenant?.name || profile?.full_name || 'Distributor Sembako & Rokok'
  const businessAddress = tenant?.address || 'Jl. Raya Utama No. 1'
  const printDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  const isBusinessResult = reportType === 'business_result'

  const handlePrint = () => {
    window.print()
  }

  // Safe percentage helper to avoid NaN%
  const calcPct = (amount) => {
    const rev = Number(summary.totalRevenue || summary.grossRevenue || 0)
    if (!rev || rev === 0 || isNaN(rev)) return '0.0%'
    const val = (Number(amount || 0) / rev) * 100
    return isNaN(val) ? '0.0%' : `${val.toFixed(1)}%`
  }

  const formatStatus = (status) => {
    if (status === 'lunas') return 'LUNAS'
    if (status === 'sebagian') return 'SEBAGIAN'
    return 'BELUM LUNAS'
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
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="font-display font-black text-sm text-white m-0 uppercase tracking-wide">
                  {isBusinessResult ? 'Template PDF Audit — Laporan Hasil Bisnis & Laba Rugi' : 'Template PDF Audit — Laporan Arus Kas (Cash Flow Statement)'}
                </h3>
                <p className="text-[11px] text-[#94A3B8] m-0">
                  Pratinjau Resmi A4 Siap Cetak / Save PDF · Periode: {startDate} s/d {endDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 h-9 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white transition-all cursor-pointer shadow-lg shadow-amber-600/20 active:scale-95 border-0"
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#18222B] flex justify-center">
            {/* Printable A4 Container */}
            <div
              ref={printRef}
              id="printable-financial-report"
              className="w-full max-w-[210mm] bg-white text-slate-900 p-8 sm:p-10 shadow-2xl rounded-sm text-left font-sans text-xs leading-normal font-normal"
              style={{ minHeight: '297mm', colorScheme: 'light' }}
            >
              {/* CSS Rule for Native Print */}
              <style>{`
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #printable-financial-report, #printable-financial-report * {
                    visibility: visible !important;
                  }
                  #printable-financial-report {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    max-width: none !important;
                    margin: 0 !important;
                    padding: 15mm !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                  }
                  @page {
                    size: A4 portrait;
                    margin: 0;
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
                  <div className="inline-block bg-amber-600 text-white font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-sm mb-1.5">
                    {isBusinessResult ? 'LAPORAN HASIL BISNIS (P&L)' : 'LAPORAN ARUS KAS (CASH FLOW)'}
                  </div>
                  <p className="text-slate-700 text-[11px] font-semibold m-0">
                    Periode: <span className="font-bold text-slate-900">{startDate} s.d. {endDate}</span>
                  </p>
                  <p className="text-slate-400 text-[10px] m-0 mt-0.5">
                    Tanggal Cetak: {printDate}
                  </p>
                </div>
              </div>

              {/* ── REPORT CONTENT TYPE 1: BUSINESS RESULT (P&L) ──────────── */}
              {isBusinessResult ? (
                <div className="space-y-6">
                  {/* Summary Ringkasan Kunci */}
                  <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">Total Omzet</p>
                      <p className="text-sm font-bold text-amber-700 m-0">{formatIDR(summary.totalRevenue || 0)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">Laba Kotor (Gross)</p>
                      <p className="text-sm font-bold text-slate-800 m-0">{formatIDR(summary.grossProfit || 0)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">Total Operasional & Opex</p>
                      <p className="text-sm font-bold text-rose-700 m-0">{formatIDR((summary.totalOpex || 0) + (summary.deliveryCost || 0))}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 m-0">Laba Bersih (Net)</p>
                      <p className="text-sm font-bold text-emerald-700 m-0">{formatIDR(summary.netProfit || 0)}</p>
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
                          <td className="p-2 font-bold text-slate-900">+ Penjualan Kotor (Gross Sales Revenue)</td>
                          <td className="p-2 text-right font-bold">{formatIDR(summary.grossRevenue || summary.totalRevenue || 0)}</td>
                          <td className="p-2 text-right font-semibold">100.0%</td>
                        </tr>
                        {Number(summary.totalReturnsAmount) > 0 && (
                          <tr className="text-rose-700">
                            <td className="p-2 pl-4">− Potongan Retur Penjualan Toko</td>
                            <td className="p-2 text-right">({formatIDR(summary.totalReturnsAmount)})</td>
                            <td className="p-2 text-right">{calcPct(summary.totalReturnsAmount)}</td>
                          </tr>
                        )}
                        <tr className="bg-slate-50 font-bold">
                          <td className="p-2">= Pendapatan Bersih Penjualan (Net Revenue)</td>
                          <td className="p-2 text-right">{formatIDR(summary.totalRevenue || 0)}</td>
                          <td className="p-2 text-right">100.0%</td>
                        </tr>
                        <tr className="text-slate-700">
                          <td className="p-2 pl-4">− Harga Pokok Penjualan (HPP / COGS FIFO)</td>
                          <td className="p-2 text-right">({formatIDR(summary.cogs || 0)})</td>
                          <td className="p-2 text-right">{calcPct(summary.cogs)}</td>
                        </tr>
                        <tr className="bg-slate-100 font-bold text-slate-900 border-t border-b border-slate-300">
                          <td className="p-2">= LABA KOTOR (GROSS PROFIT)</td>
                          <td className="p-2 text-right">{formatIDR(summary.grossProfit || 0)}</td>
                          <td className="p-2 text-right">{summary.grossMarginPct || calcPct(summary.grossProfit)}</td>
                        </tr>
                        <tr>
                          <td className="p-2 pl-4 text-slate-700">− Biaya Operasional Toko & Gudang (OPEX)</td>
                          <td className="p-2 text-right text-rose-700">({formatIDR(summary.totalOpex || 0)})</td>
                          <td className="p-2 text-right">{calcPct(summary.totalOpex)}</td>
                        </tr>
                        {Number(summary.deliveryCost) > 0 && (
                          <tr>
                            <td className="p-2 pl-4 text-slate-700">− Biaya Pengiriman & Armada (Asumsi Tunai)</td>
                            <td className="p-2 text-right text-rose-700">({formatIDR(summary.deliveryCost)})</td>
                            <td className="p-2 text-right">{calcPct(summary.deliveryCost)}</td>
                          </tr>
                        )}
                        <tr className="bg-emerald-50 text-emerald-900 font-extrabold text-sm border-2 border-emerald-500">
                          <td className="p-2.5">= LABA BERSIH OPERASIONAL (NET PROFIT)</td>
                          <td className="p-2.5 text-right">{formatIDR(summary.netProfit || 0)}</td>
                          <td className="p-2.5 text-right">{summary.netMarginPct || calcPct(summary.netProfit)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 2. Breakdown Penjualan per Produk */}
                  {Object.keys(byProduct).length > 0 && (
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
                        2. Breakdown Performa Penjualan Per Produk & Katalog
                      </h3>
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                          <tr>
                            <th className="p-2">Nama Produk / Item</th>
                            <th className="p-2 text-center">Qty Terjual</th>
                            <th className="p-2 text-right">Total Omzet (Rp)</th>
                            <th className="p-2 text-right">Estimasi HPP (Rp)</th>
                            <th className="p-2 text-right">Laba Kotor (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {Object.entries(byProduct).map(([pName, pData]) => {
                            const margin = pData.revenue - pData.cogs
                            return (
                              <tr key={pName}>
                                <td className="p-2 font-semibold text-slate-900">{pName}</td>
                                <td className="p-2 text-center">{pData.qty} {pData.unit || 'unit'}</td>
                                <td className="p-2 text-right font-semibold">{formatIDR(pData.revenue)}</td>
                                <td className="p-2 text-right text-slate-600">{formatIDR(pData.cogs)}</td>
                                <td className="p-2 text-right font-bold text-emerald-700">{formatIDR(margin)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 3. Daftar Invoice Penjualan Periode Ini */}
                  {sales.length > 0 && (
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
                        3. Daftar Transaksi Invoice Penjualan (Toko & Pelanggan)
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
                          {sales.slice(0, 30).map(sale => (
                            <tr key={sale.id}>
                              <td className="p-2 font-mono font-bold text-slate-900">{sale.invoice_number}</td>
                              <td className="p-2 text-slate-600">{sale.transaction_date}</td>
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
                      {sales.length > 30 && (
                        <p className="text-[10px] text-slate-500 font-italic mt-1 text-right">* Menampilkan 30 transaksi teratas dari total {sales.length} nota.</p>
                      )}
                    </div>
                  )}

                  {/* 4. Rincian Operational Expenses */}
                  {Object.keys(opexCategories).length > 0 && (
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
                        4. Rincian Pengeluaran Operasional Toko & Gudang
                      </h3>
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                          <tr>
                            <th className="p-2">Kategori Pengeluaran</th>
                            <th className="p-2 text-right">Jumlah Nominal (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {Object.entries(opexCategories).map(([cat, amount]) => (
                            <tr key={cat}>
                              <td className="p-2 capitalize">{cat.replace(/_/g, ' ')}</td>
                              <td className="p-2 text-right font-semibold">{formatIDR(amount)}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-100 font-bold border-t border-slate-300">
                            <td className="p-2">Total Operasional</td>
                            <td className="p-2 text-right text-rose-700">{formatIDR(summary.totalOpex || 0)}</td>
                          </tr>
                        </tbody>
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
                          <td className="p-2 text-right">({formatIDR(summary.cashOutOpex || 0)})</td>
                        </tr>
                        {Number(summary.cashOutPayroll) > 0 && (
                          <tr className="text-slate-700">
                            <td className="p-2 pl-6">· Gaji Pegawai & Tim Management</td>
                            <td className="p-2 text-right">({formatIDR(summary.cashOutPayroll)})</td>
                          </tr>
                        )}

                        {/* Section D: Ending Cash */}
                        <tr className="bg-amber-100 text-slate-900 font-extrabold text-sm border-t-2 border-b-2 border-amber-600">
                          <td className="p-3">= SALDO KAS AKHIR PERIODE</td>
                          <td className="p-3 text-right">{formatIDR(summary.endingCashOnHand || 0)}</td>
                        </tr>
                        <tr className="text-slate-700 font-semibold bg-slate-50">
                          <td className="p-2 pl-6">· Saldo Kas Tunai Akhir (Cash on Hand)</td>
                          <td className="p-2 text-right">{formatIDR(summary.cashTunaiAkhir || 0)}</td>
                        </tr>
                        <tr className="text-slate-700 font-semibold bg-slate-50">
                          <td className="p-2 pl-6">· Saldo Bank Akhir</td>
                          <td className="p-2 text-right">{formatIDR(summary.cashBankAkhir || 0)}</td>
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
                          {sales.filter(s => (s.remaining_amount || 0) > 0).slice(0, 20).map(s => (
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
