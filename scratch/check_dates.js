import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Read env directly from .env file
const envContent = fs.readFileSync('.env', 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts[1].trim()
  }
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  console.log('--- Checking DB Records ---')
  
  // Get tenant ID from a sample sale or product to make sure we query the right tenant
  const { data: sales } = await supabase.from('sembako_sales').select('tenant_id').limit(1)
  if (!sales || sales.length === 0) {
    console.log('No sales found to determine tenant ID')
    return
  }
  const tenantId = sales[0].tenant_id
  console.log('Detected Tenant ID:', tenantId)

  const { data: expenses } = await supabase.from('sembako_expenses').select('amount, expense_date').eq('tenant_id', tenantId).eq('is_deleted', false)
  console.log(`Expenses (${expenses?.length || 0} rows):`, expenses)

  const { data: payroll } = await supabase.from('sembako_payroll').select('total_pay, period_date').eq('tenant_id', tenantId).eq('is_deleted', false)
  console.log(`Payroll (${payroll?.length || 0} rows):`, payroll)

  const { data: payments } = await supabase.from('sembako_supplier_payments').select('amount, payment_date').eq('tenant_id', tenantId).eq('is_deleted', false)
  console.log(`Supplier Payments (${payments?.length || 0} rows):`, payments)
  
  const now = new Date()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
  console.log('now:', now.toISOString())
  console.log('thirtyDaysAgo:', thirtyDaysAgo.toISOString())
}

check().catch(console.error)
