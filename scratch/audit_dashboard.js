import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envText = fs.readFileSync('.env', 'utf-8')
const envConfig = {}
envText.split('\n').forEach(line => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    envConfig[parts[0].trim()] = parts.slice(1).join('=').trim()
  }
})

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY)

function processSaleRowLocal(sale, returnsData = [], itemsBySaleId = {}) {
  const itemsFromRel = sale.sembako_sale_items || []
  const itemsFromDirect = itemsBySaleId[sale.id] || []
  const itemsRaw = itemsFromRel.length > 0 ? itemsFromRel : itemsFromDirect
  const items = itemsRaw.map(it => ({
    ...it,
    price_per_unit: Number(it.price_per_unit ?? it.sell_price ?? it.unit_price ?? it.price_per_kg ?? 0)
  }))

  const saleReturns = (returnsData || []).filter(r => {
    if (!r || r.is_deleted) return false
    if (sale.id && (r.sale_id === sale.id || String(r.sale_id) === String(sale.id))) return true
    if (sale.invoice_number && r.invoice_number && String(r.invoice_number).trim() === String(sale.invoice_number).trim()) return true
    return false
  })

  const totalReturnAmount = saleReturns.reduce((sum, r) => {
    const amt = Number(r.total_amount || r.amount || 0)
    if (amt > 0) return sum + amt
    const matchItem = items.find(i => i.product_id === r.product_id || i.product_name === r.product_name)
    const price = Number(r.unit_price || matchItem?.price_per_unit || 0)
    return sum + (Number(r.quantity || 0) * price)
  }, 0)

  const payments = Array.isArray(sale.sembako_payments) ? sale.sembako_payments.filter(p => !p.is_deleted) : []
  const paidFromPayments = payments
    .filter(p => Number(p.amount || p.amount_paid || 0) > 0 && p.payment_method !== 'pengembalian_tunai_retur')
    .reduce((s, p) => s + (Number(p.amount || p.amount_paid) || 0), 0)
  const refundFromPayments = payments
    .filter(p => p.payment_method === 'pengembalian_tunai_retur' || Number(p.amount || p.amount_paid || 0) < 0)
    .reduce((s, p) => s + Math.abs(Number(p.amount || p.amount_paid || 0)), 0)
  const itemsSubtotal = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (i.price_per_unit || 0)), 0)
  const deliveryCost = Number(sale.delivery_cost) || 0
  const otherCost = Number(sale.other_cost) || 0

  const initialSubtotal = itemsSubtotal > 0
    ? itemsSubtotal
    : (Number(sale.subtotal) > 0 ? Number(sale.subtotal) : Number(sale.total_amount) + totalReturnAmount)

  const total_amount = Math.max(0, initialSubtotal - totalReturnAmount)

  const netPaidFromPayments = Math.max(0, paidFromPayments - refundFromPayments)
  const raw_paid = Math.max(Number(sale.paid_amount || 0), netPaidFromPayments)
  const is_overpaid = raw_paid > total_amount
  const overpay_amount = is_overpaid ? (raw_paid - total_amount) : 0
  const paid_amount = Math.min(total_amount, raw_paid)
  const remaining_amount = Math.max(0, total_amount - paid_amount)

  const cogsFromItems = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (i.cogs_per_unit || 0)), 0)
  const fallbackCogs = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (Number(i.cogs_per_unit || i.buy_price || 0) || (i.price_per_unit * 0.75))), 0)
  const totalCogs = Number(sale.total_cogs) || cogsFromItems || fallbackCogs || Math.round(itemsSubtotal * 0.75)
  const returnCogs = saleReturns.reduce((s, r) => {
    const matchItem = items.find(i => i.product_id === r.product_id || i.product_name === r.product_name)
    const cogs = Number(r.cogs_per_unit || matchItem?.cogs_per_unit || (matchItem ? matchItem.price_per_unit * 0.75 : 80000))
    return s + Math.round((Number(r.quantity) || 0) * cogs)
  }, 0)
  const effectiveCogs = Math.max(0, totalCogs - returnCogs)
  const grossProfit = Math.max(0, (itemsSubtotal - totalReturnAmount) - effectiveCogs)
  const totalExpenses = deliveryCost + otherCost
  const computedNetProfit = Math.max(0, grossProfit - totalExpenses)
  const net_profit = (Number(sale.net_profit) > 0)
    ? Number(sale.net_profit)
    : computedNetProfit

  return {
    ...sale,
    total_amount,
    paid_amount,
    remaining_amount,
    net_profit,
    gross_profit: grossProfit,
  }
}

async function runAudit() {
  const { data: salesCheck } = await supabase.from('sembako_sales').select('tenant_id').limit(1)
  const tenantId = salesCheck[0].tenant_id

  // Fetch returns
  const { data: dbReturns } = await supabase.from('sembako_returns').select('*').eq('tenant_id', tenantId).eq('is_deleted', false)

  // Fetch sales with items and payments
  const { data: rawSales } = await supabase
    .from('sembako_sales')
    .select('*, sembako_sale_items(*), sembako_payments(*)')
    .eq('tenant_id', tenantId)
    .eq('is_deleted', false)

  const processedSales = rawSales.map(s => processSaleRowLocal(s, dbReturns))

  console.log('--- PROCESSED SALES SUMMARY ---')
  let totalRevenue = 0
  let totalNetProfit = 0
  let totalOutstanding = 0
  let totalPaidAmount = 0
  processedSales.forEach((s, idx) => {
    console.log(`Sale #${idx + 1}: ID=${s.id} | Date=${s.transaction_date} | Total=${s.total_amount} | Paid=${s.paid_amount} | Remaining=${s.remaining_amount} | NetProfit=${s.net_profit} | Status=${s.payment_status}`)
    totalRevenue += s.total_amount
    totalNetProfit += s.net_profit
    totalOutstanding += s.remaining_amount
    totalPaidAmount += s.paid_amount
  })

  console.log('\n--- AGGREGATE TOTALS ---')
  console.log(`Sum of total_amount (Revenue):      Rp${totalRevenue.toLocaleString()}`)
  console.log(`Sum of net_profit (Net Profit):     Rp${totalNetProfit.toLocaleString()}`)
  console.log(`Sum of remaining_amount (Piutang):  Rp${totalOutstanding.toLocaleString()}`)
  console.log(`Sum of paid_amount:                 Rp${totalPaidAmount.toLocaleString()}`)
}
runAudit()
