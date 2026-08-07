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

function processSaleRow(sale, returnsData = [], itemsBySaleId = {}) {
  const itemsFromRel = Array.isArray(sale.sembako_sale_items) && sale.sembako_sale_items.length > 0 ? sale.sembako_sale_items : null
  const itemsFromDirect = itemsBySaleId[sale.id] && itemsBySaleId[sale.id].length > 0 ? itemsBySaleId[sale.id] : null
  const itemsRaw = itemsFromRel || itemsFromDirect || []
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
  const payment_status = remaining_amount <= 0 && total_amount > 0 ? 'lunas' : paid_amount > 0 ? 'sebagian' : (sale.payment_status || 'belum_lunas')

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
  const net_profit = (totalReturnAmount > 0)
    ? computedNetProfit
    : ((Number(sale.net_profit) > 0) ? Number(sale.net_profit) : computedNetProfit)

  return {
    ...sale,
    remaining_amount,
    payment_status,
    net_profit,
    gross_profit: grossProfit,
    due_date: sale.due_date
  }
}

async function runLaporanAudit() {
  const { data: salesCheck } = await supabase.from('sembako_sales').select('tenant_id').limit(1)
  const tenantId = salesCheck[0].tenant_id

  const [salesRes, returnsRes] = await Promise.all([
    supabase.from('sembako_sales').select('*, sembako_sale_items(*), sembako_payments(*)').eq('tenant_id', tenantId).eq('is_deleted', false),
    supabase.from('sembako_returns').select('quantity, unit_price, total_amount, created_at, sale_id, product_id, product_name, is_deleted').eq('tenant_id', tenantId).eq('is_deleted', false)
  ])

  const rawSales = salesRes.data || []
  const returnsList = returnsRes.data || []

  const sales = rawSales.map(sale => processSaleRow(sale, returnsList))

  sales.forEach((s, idx) => {
    console.log(`\nProcessed Sale #${idx+1}: Invoice=${s.invoice_number}`)
    console.log(`  remaining_amount: ${s.remaining_amount} (Type: ${typeof s.remaining_amount})`)
    console.log(`  payment_status:   ${s.payment_status}`)
    console.log(`  due_date:         ${s.due_date}`)
  })

  const totalOutstanding = sales.reduce((s, i) => s + (Number(i.remaining_amount) || 0), 0)
  console.log('\nCalculated totalOutstanding:', totalOutstanding)
}
runLaporanAudit()
