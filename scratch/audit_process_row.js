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

  console.log('--- RAW DB SALE #1 ---')
  console.log(JSON.stringify(sale, null, 2))

  const processed = processSaleRow(sale, dbReturns, {})
  console.log('--- PROCESSED SALE #1 ---')
  console.log(JSON.stringify(processed, null, 2))
}
runAudit()
