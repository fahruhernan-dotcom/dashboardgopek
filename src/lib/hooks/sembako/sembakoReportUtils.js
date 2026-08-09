import { format } from 'date-fns'

/**
 * 1. Laba Rugi (Accrual P&L)
 */
export function calculatePL(sales, expenses, payroll, batches, supplierPayments, startDate, endDate) {
  const totalGrossRevenue = sales.reduce((s, i) => s + (Number(i.subtotal) || 0), 0)
  const totalReturns = sales.reduce((s, i) => s + (Number(i.totalReturnAmount) || 0), 0)
  const totalRevenue = sales.reduce((s, i) => s + (Number(i.total_amount) || 0), 0)
  const totalCOGS = sales.reduce((s, i) => s + (Number(i.total_cogs) || 0), 0)
  const totalDeliveryCost = sales.reduce((s, i) => s + (Number(i.delivery_cost) || 0), 0)
  const totalOtherCost = sales.reduce((s, i) => s + (Number(i.other_cost) || 0), 0)
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const totalPayroll = payroll.reduce((s, p) => s + (Number(p.total_pay) || 0), 0)

  const grossProfit = totalRevenue - totalCOGS
  const netProfit = grossProfit - totalDeliveryCost - totalOtherCost - totalExpenses - totalPayroll

  const grossMarginPct = totalRevenue > 0 ? Number((grossProfit / totalRevenue * 100).toFixed(1)) : 0
  const netMarginPct = totalRevenue > 0 ? Number((netProfit / totalRevenue * 100).toFixed(1)) : 0

  // Hutang Supplier Baru yang Terbentuk di Periode Ini (Belanja Stok - Pembayaran Supplier)
  const stockPurchasePeriod = batches
    .filter(b => {
      const date = b.purchase_date?.slice(0, 10)
      return date >= startDate && date <= endDate
    })
    .reduce((s, b) => {
      return s + (Number(b.total_cost) > 0 ? Number(b.total_cost) : (Number(b.qty_masuk || 0) * Number(b.buy_price || 0)))
    }, 0)

  const supplierPaymentPeriod = supplierPayments.reduce((s, sp) => s + (Number(sp.amount) || 0), 0)
  const unpaidSupplierPeriod = Math.max(0, stockPurchasePeriod - supplierPaymentPeriod)

  return {
    totalGrossRevenue,
    totalReturns,
    totalRevenue,
    totalCOGS,
    totalDeliveryCost,
    totalOtherCost,
    totalExpenses,
    totalPayroll,
    grossProfit,
    netProfit,
    grossMarginPct,
    netMarginPct,
    unpaidSupplierPeriod, // Untuk diagram lingkaran (Breakdown Pengeluaran)
  }
}

/**
 * 2. Arus Kas (Cash Flow)
 * Menyertakan Opening Balance, Cash In/Out period berjalan, dan Ending Balance.
 * Dipisah berdasarkan Tunai (Cash On Hand) vs Bank (Bank Balance).
 */
export function calculateCashFlow(
  sales,
  allPayments,
  allSupplierPayments,
  allExpenses,
  allPayroll,
  startDate,
  endDate
) {
  // --- 1. HISTORICAL AGGREGATES (Sebelum startDate) ---
  const paymentsBefore = allPayments.filter(p => {
    const payDate = (p.payment_date || p.created_at)?.slice(0, 10)
    return payDate < startDate
  })
  const supplierPaymentsBefore = allSupplierPayments.filter(sp => {
    const payDate = sp.payment_date?.slice(0, 10)
    return payDate < startDate
  })
  const expensesBefore = allExpenses.filter(e => {
    const date = e.expense_date?.slice(0, 10)
    return date < startDate
  })
  const payrollBefore = allPayroll.filter(p => {
    const date = p.period_date?.slice(0, 10)
    return date < startDate && p.payment_status === 'paid'
  })

  // Cash In Tunai vs Transfer (Historis)
  const cashInBeforeTunai = paymentsBefore
    .filter(p => (p.payment_method || 'cash') === 'cash')
    .reduce((s, p) => s + (Number(p.amount) || 0), 0)

  const cashInBeforeTransfer = paymentsBefore
    .filter(p => p.payment_method === 'transfer')
    .reduce((s, p) => s + (Number(p.amount) || 0), 0)

  // Cash Out Tunai vs Transfer (Historis)
  // Supplier Payments
  const supplierOutBeforeTunai = supplierPaymentsBefore
    .filter(sp => (sp.payment_method || 'cash') === 'cash')
    .reduce((s, sp) => s + (Number(sp.amount) || 0), 0)

  const supplierOutBeforeTransfer = supplierPaymentsBefore
    .filter(sp => sp.payment_method === 'transfer')
    .reduce((s, sp) => s + (Number(sp.amount) || 0), 0)

  // Expenses & Payroll (Semua diasumsikan Tunai)
  const expensesOutBeforeTunai = expensesBefore.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const payrollOutBeforeTunai = payrollBefore.reduce((s, p) => s + (Number(p.total_pay) || 0), 0)

  // Total Opening Cash & Bank
  const openingCashOnHand = cashInBeforeTunai - supplierOutBeforeTunai - expensesOutBeforeTunai - payrollOutBeforeTunai
  const openingBankBalance = cashInBeforeTransfer - supplierOutBeforeTransfer

  // --- 2. PERIOD AGGREGATES (Antara startDate dan endDate) ---
  // Pemasukan (Cash In) Periode Berjalan
  let cashInPeriodTunai = 0
  let cashInPeriodTransfer = 0

  sales.forEach(sale => {
    (sale.sembako_payments || []).forEach(p => {
      if (p.is_deleted) return
      const payDate = (p.payment_date || p.created_at)?.slice(0, 10)
      if (payDate >= startDate && payDate <= endDate) {
        const amt = Number(p.amount) || 0
        if (p.payment_method === 'transfer') {
          cashInPeriodTransfer += amt
        } else {
          cashInPeriodTunai += amt
        }
      }
    })
  })

  // Pengeluaran (Cash Out) Periode Berjalan
  // Filter supplier payments in period
  const supplierPaymentsPeriod = allSupplierPayments.filter(sp => {
    const payDate = sp.payment_date?.slice(0, 10)
    return payDate >= startDate && payDate <= endDate
  })

  const supplierOutPeriodTunai = supplierPaymentsPeriod
    .filter(sp => (sp.payment_method || 'cash') === 'cash')
    .reduce((s, sp) => s + (Number(sp.amount) || 0), 0)

  const supplierOutPeriodTransfer = supplierPaymentsPeriod
    .filter(sp => sp.payment_method === 'transfer')
    .reduce((s, sp) => s + (Number(sp.amount) || 0), 0)

  // Gaji Karyawan (Dibayar)
  const payrollPeriod = allPayroll.filter(p => {
    const date = p.period_date?.slice(0, 10)
    return date >= startDate && date <= endDate
  })
  const payrollPaidPeriod = payrollPeriod.filter(p => p.payment_status === 'paid')
  const payrollOutPeriodTunai = payrollPaidPeriod.reduce((s, p) => s + (Number(p.total_pay) || 0), 0)

  // Prive (Owner Draw) vs Operasional Biasa
  const expensesPeriod = allExpenses.filter(e => {
    const date = e.expense_date?.slice(0, 10)
    return date >= startDate && date <= endDate
  })
  const priveExpenses = expensesPeriod.filter(e => e.category === 'prive' || e.category === 'tarikan_pemilik')
  const regularExpenses = expensesPeriod.filter(e => e.category !== 'prive' && e.category !== 'tarikan_pemilik')

  const priveOutPeriodTunai = priveExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const regularExpensesOutPeriodTunai = regularExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)

  // Biaya Kirim / Pengiriman Armada dari transaksi penjualan (diasumsikan Tunai)
  const deliveryOutPeriodTunai = sales.reduce((s, i) => s + (Number(i.delivery_cost) || 0), 0)

  // Net Cash Flow Period
  const cashInTotal = cashInPeriodTunai + cashInPeriodTransfer
  const cashOutTotal =
    supplierOutPeriodTunai +
    supplierOutPeriodTransfer +
    payrollOutPeriodTunai +
    priveOutPeriodTunai +
    regularExpensesOutPeriodTunai +
    deliveryOutPeriodTunai

  const netCashFlowPeriod = cashInTotal - cashOutTotal

  // Ending Cash Balances
  const endingCashOnHand = openingCashOnHand + (cashInPeriodTunai - supplierOutPeriodTunai - payrollOutPeriodTunai - priveOutPeriodTunai - regularExpensesOutPeriodTunai - deliveryOutPeriodTunai)
  const endingBankBalance = openingBankBalance + (cashInPeriodTransfer - supplierOutPeriodTransfer)

  return {
    openingCashOnHand,
    openingBankBalance,
    cashInPeriodTunai,
    cashInPeriodTransfer,
    supplierOutPeriodTunai,
    supplierOutPeriodTransfer,
    payrollOutPeriodTunai,
    priveOutPeriodTunai,
    regularExpensesOutPeriodTunai,
    deliveryOutPeriodTunai,
    netCashFlowPeriod,
    endingCashOnHand,
    endingBankBalance,
  }
}

/**
 * 3. Modal Beredar / Aset Lancar & Hutang Supplier (Liabilitas)
 */
export function calculateWorkingCapital(allSales, allBatches, allSupplierPayments) {
  // Piutang Dagang (Aset Lancar - Seluruh Tagihan Belum Terbayar dari Dulu s/d Sekarang)
  const outstandingReceivable = allSales.reduce((s, sale) => s + (Number(sale.remaining_amount) || 0), 0)

  // Persediaan Barang (Aset Lancar - Nilai Stok Gudang Aktif saat ini)
  const activeBatches = allBatches.filter(b => Number(b.qty_sisa) > 0)
  const stockValue = activeBatches.reduce((s, b) => {
    return s + (Number(b.qty_sisa || 0) * Number(b.buy_price || 0))
  }, 0)

  // Hutang Dagang Supplier (Liabilitas - Seluruh Hutang ke Supplier dari Dulu s/d Sekarang)
  const totalPurchased = allBatches.reduce((s, b) => {
    return s + (Number(b.total_cost) > 0 ? Number(b.total_cost) : (Number(b.qty_masuk || 0) * Number(b.buy_price || 0)))
  }, 0)
  const totalSupplierPaid = allSupplierPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const outstandingPayable = Math.max(0, totalPurchased - totalSupplierPaid)

  return {
    outstandingReceivable,
    stockValue,
    outstandingPayable,
  }
}

/**
 * 4. Estimasi Laba Terkonversi Kas (Cash Margin Estimate)
 * Menghitung porsi keuntungan akrual yang sudah benar-benar dicairkan ke uang kas,
 * dikurangi pengeluaran tunai period tersebut.
 */
export function calculateRealizedProfit(sales, totalExpenses, totalPayroll) {
  let realizedGrossProfit = 0
  sales.forEach(s => {
    const net = Number(s.net_profit) || 0
    const total = Number(s.total_amount) || 0
    const paid = Number(s.paid_amount) || 0
    if (total > 0) {
      const ratio = Math.max(0, Math.min(1, paid / total))
      realizedGrossProfit += Math.round(net * ratio)
    } else {
      realizedGrossProfit += net
    }
  })

  // Laba bersih terkonversi kas estimasi
  const cashMarginEstimate = Math.max(0, realizedGrossProfit - totalExpenses - totalPayroll)

  return {
    cashMarginEstimate,
  }
}
