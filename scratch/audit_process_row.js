import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import { processSaleRow } from '../src/lib/hooks/sembako/sembakoSales.js'

const envText = fs.readFileSync('.env', 'utf-8')
const envConfig = {}
envText.split('\n').forEach(line => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    envConfig[parts[0].trim()] = parts.slice(1).join('=').trim()
  }
})

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY)

async function runRealProcessAudit() {
  const { data: salesCheck } = await supabase.from('sembako_sales').select('tenant_id').limit(1)
  const tenantId = salesCheck[0].tenant_id

  const { data: dbReturns } = await supabase.from('sembako_returns').select('*').eq('tenant_id', tenantId).eq('is_deleted', false)
  const { data: rawSales } = await supabase
    .from('sembako_sales')
    .select('*, sembako_sale_items(*), sembako_payments(*)')
    .eq('tenant_id', tenantId)
    .eq('is_deleted', false)

  const processedSales = rawSales.map(s => processSaleRow(s, dbReturns))

  console.log('--- REAL PROCESSED SALES SUMMARY ---')
  processedSales.forEach((s, idx) => {
    console.log(`Sale #${idx + 1}: ID=${s.id} | Date=${s.transaction_date} | Total=${s.total_amount} | Paid=${s.paid_amount} | Remaining=${s.remaining_amount} | NetProfit=${s.net_profit} | GrossProfit=${s.gross_profit}`)
  })
}
runRealProcessAudit()
