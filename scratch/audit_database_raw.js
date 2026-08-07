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

async function runRawAudit() {
  const { data: salesCheck } = await supabase.from('sembako_sales').select('tenant_id').limit(1)
  const tenantId = salesCheck[0].tenant_id

  const { data: sales } = await supabase
    .from('sembako_sales')
    .select('*, sembako_sale_items(*)')
    .eq('tenant_id', tenantId)
    .eq('is_deleted', false)

  sales.forEach((s, idx) => {
    console.log(`\n--- SALE #${idx + 1} ---`)
    console.log(`ID: ${s.id}`)
    console.log(`Invoice: ${s.invoice_number}`)
    console.log(`Total Amount: ${s.total_amount}`)
    console.log(`Paid Amount: ${s.paid_amount}`)
    console.log(`Net Profit (DB): ${s.net_profit}`)
    console.log(`Total COGS (DB): ${s.total_cogs}`)
    console.log(`Delivery Cost: ${s.delivery_cost}`)
    console.log(`Other Cost: ${s.other_cost}`)
    console.log('Items:')
    s.sembako_sale_items.forEach((item, itemIdx) => {
      console.log(`  Item #${itemIdx + 1}: ${item.product_name} | Qty: ${item.quantity} | Sell Price: ${item.sell_price || item.unit_price || item.price_per_unit} | COGS/unit: ${item.cogs_per_unit}`)
    })
  })
}
runRawAudit()
