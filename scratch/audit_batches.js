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

async function runAudit() {
  const { data: salesCheck } = await supabase.from('sembako_sales').select('tenant_id').limit(1)
  const tenantId = salesCheck[0].tenant_id

  const { data: batches } = await supabase
    .from('sembako_stock_batches')
    .select('*, sembako_suppliers(*), sembako_products(*)')
    .eq('tenant_id', tenantId)
    .eq('is_deleted', false)

  console.log('--- ALL STOCK BATCHES ---')
  let totalCostFromAllBatches = 0
  batches.forEach((b, idx) => {
    const cost = Number(b.total_cost) > 0 ? Number(b.total_cost) : (Number(b.qty_masuk || 0) * Number(b.buy_price || 0))
    totalCostFromAllBatches += cost
    console.log(`Batch #${idx+1}: ID=${b.id} | Product=${b.sembako_products?.product_name} | QtyIn=${b.qty_masuk} | QtySisa=${b.qty_sisa} | BuyPrice=${b.buy_price} | TotalCost=${b.total_cost} (Effective: ${cost}) | Supplier=${b.sembako_suppliers?.supplier_name || 'NULL'} (ID: ${b.supplier_id})`)
  })

  console.log(`\nTotal Effective Cost of all batches: Rp${totalCostFromAllBatches.toLocaleString()}`)
}
runAudit()
