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

async function runReturnsAudit() {
  const { data: salesCheck } = await supabase.from('sembako_sales').select('tenant_id').limit(1)
  const tenantId = salesCheck[0].tenant_id

  const { data: returns } = await supabase
    .from('sembako_returns')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_deleted', false)

  console.log('--- RETURNS ---')
  console.log(returns)
}
runReturnsAudit()
