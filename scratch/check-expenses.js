const { createClient } = require('@supabase/supabase-client')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lrtmivspxixjeywqgplm.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('Querying sembako_expenses...')
  const { data: exp, error: errExp } = await supabase.from('sembako_expenses').select('*')
  if (errExp) console.error('Expenses error:', errExp)
  else console.log('Expenses:', exp)

  console.log('\nQuerying sembako_payroll...')
  const { data: pay, error: errPay } = await supabase.from('sembako_payroll').select('*')
  if (errPay) console.error('Payroll error:', errPay)
  else console.log('Payroll:', pay)
}

run()
