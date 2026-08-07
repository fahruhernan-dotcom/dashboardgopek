import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Manual .env parsing
const envText = fs.readFileSync('.env', 'utf-8')
const envConfig = {}
envText.split('\n').forEach(line => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    const key = parts[0].trim()
    const value = parts.slice(1).join('=').trim()
    envConfig[key] = value
  }
})

const supabaseUrl = envConfig.VITE_SUPABASE_URL
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkColumn(col) {
  const { error } = await supabase
    .from('sembako_payroll')
    .select(col)
    .limit(1)
  
  if (error) {
    console.log(`Column "${col}": MISSING (${error.message})`)
    return false
  } else {
    console.log(`Column "${col}": EXISTS`)
    return true
  }
}

async function checkAll() {
  const cols = [
    'id', 'tenant_id', 'employee_id', 'period_type', 'period_date',
    'work_days', 'trip_count', 'sales_amount', 'base_salary',
    'base_amount', 'commission_amount', 'bonus', 'deductions',
    'deduction', 'total_pay', 'payment_status', 'paid_at', 'notes',
    'is_deleted', 'created_at', 'updated_at'
  ]
  
  console.log('Testing columns of sembako_payroll table:')
  for (const col of cols) {
    await checkColumn(col)
  }
}

checkAll()
