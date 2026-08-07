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
  const itemsRaw = sale.sembako_sale_items || []
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

  return {
    itemsSubtotal,
    totalReturnAmount,
    initialSubtotal,
    total_amount,
    paidFromPayments,
    refundFromPayments,
    netPaidFromPayments,
    raw_paid,
    paid_amount,
    remaining_amount
  }
}

async function runAudit() {
  const { data: salesCheck } = await supabase.from('sembako_sales').select('tenant_id').limit(1)
  const tenantId = salesCheck[0].tenant_id

  // Fetch returns
  const { data: dbReturns } = await supabase.from('sembako_returns').select('*').eq('tenant_id', tenantId).eq('is_deleted', false)

  // Fetch sale #1 with items and payments
  const { data: sale } = await supabase
    .from('sembako_sales')
    .select('*, sembako_sale_items(*), sembako_payments(*)')
    .eq('id', 'c47db40a-d196-4a12-89b8-c2348512d224')
    .single()

  const res = processSaleRowLocal(sale, dbReturns)
  console.log('--- AUDIT OF SALE #1 LOCAL SIMULATION ---')
  console.log(res)
}
runAudit()
