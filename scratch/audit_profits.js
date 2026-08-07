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

  const itemsSubtotal = items.reduce((s, i) => s + Math.round((i.quantity || 0) * (i.price_per_unit || 0)), 0)
  const deliveryCost = Number(sale.delivery_cost) || 0
  const otherCost = Number(sale.other_cost) || 0

  const initialSubtotal = itemsSubtotal > 0
    ? itemsSubtotal
    : (Number(sale.subtotal) > 0 ? Number(sale.subtotal) : Number(sale.total_amount) + totalReturnAmount)

  const total_amount = Math.max(0, initialSubtotal - totalReturnAmount)

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

  return {
    ...sale,
    items,
    saleReturns,
    totalReturnAmount,
    itemsSubtotal,
    total_amount,
    cogsFromItems,
    fallbackCogs,
    totalCogs,
    returnCogs,
    effectiveCogs,
    grossProfit,
    totalExpenses,
    computedNetProfit
  }
}

async function runAudit() {
  const { data: salesCheck } = await supabase.from('sembako_sales').select('tenant_id').limit(1)
  const tenantId = salesCheck[0].tenant_id

  const { data: dbReturns } = await supabase.from('sembako_returns').select('*').eq('tenant_id', tenantId).eq('is_deleted', false)
  const { data: rawSales } = await supabase
    .from('sembako_sales')
    .select('*, sembako_sale_items(*), sembako_payments(*)')
    .eq('tenant_id', tenantId)
    .eq('is_deleted', false)

  rawSales.forEach((s, idx) => {
    const res = processSaleRowLocal(s, dbReturns)
    console.log(`\n=== SALE #${idx+1} (ID: ${s.id}) ===`)
    console.log(`Date:                 ${s.transaction_date}`)
    console.log(`Original DB NetProfit:Rp${Number(s.net_profit).toLocaleString()}`)
    console.log(`Computed Net Profit:  Rp${res.computedNetProfit.toLocaleString()}`)
    console.log(`Items Subtotal:       Rp${res.itemsSubtotal.toLocaleString()}`)
    console.log(`Total Return Amount:  Rp${res.totalReturnAmount.toLocaleString()}`)
    console.log(`Effective COGS:       Rp${res.effectiveCogs.toLocaleString()} (Total COGS: Rp${res.totalCogs.toLocaleString()} - Return COGS: Rp${res.returnCogs.toLocaleString()})`)
    console.log(`Gross Profit:         Rp${res.grossProfit.toLocaleString()}`)
    console.log(`Expenses (Delivery/Other): Rp${res.totalExpenses.toLocaleString()}`)
    
    console.log(`Items:`)
    res.items.forEach(it => {
      console.log(`  * ${it.product_name || 'Product'} | Qty: ${it.quantity} | SellPrice: ${it.price_per_unit} | COGS: ${it.cogs_per_unit || 'N/A'}`)
    })
  })
}
runAudit()
