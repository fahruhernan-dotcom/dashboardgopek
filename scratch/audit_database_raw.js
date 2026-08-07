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
  
  const { data: sales } = await supabase.from('sembako_sales').select('*').eq('tenant_id', tenantId).eq('is_deleted', false)
  const { data: payments } = await supabase.from('sembako_payments').select('*').eq('tenant_id', tenantId).eq('is_deleted', false)
  
  console.log('--- RAW SALES ---')
  sales.forEach(s => {
    console.log(`ID: ${s.id} | Date: ${s.transaction_date} | total_amount: ${s.total_amount} | paid_amount: ${s.paid_amount} | remaining_amount: ${s.remaining_amount} | net_profit: ${s.net_profit}`)
  })
  
  console.log('--- RAW PAYMENTS ---')
  payments.forEach(p => {
    console.log(`ID: ${p.id} | SaleID: ${p.sale_id} | Date: ${p.payment_date} | amount: ${p.amount} | method: ${p.payment_method}`)
  })
}
runAudit()
