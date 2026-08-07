const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://kqbxzokrpcwuxrfjshuf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYnh6b2tycGN3dXhyZmpzaHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzY1NTYsImV4cCI6MjEwMTM1MjU1Nn0.alDDENQKoFQY67tCk7s0CG2dl-OrIa8IHTMwhTHb_1A'

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('Querying sembako_expenses...')
  const { data: exp, error: errExp } = await supabase.from('sembako_expenses').select('*')
  if (errExp) console.error('Expenses error:', errExp)
  else console.log('Expenses:', exp)

  console.log('\nQuerying sembako_supplier_payments...')
  const { data: suppPay, error: errSuppPay } = await supabase.from('sembako_supplier_payments').select('*')
  if (errSuppPay) console.error('Supplier payments error:', errSuppPay)
  else console.log('Supplier payments:', suppPay)

  console.log('\nQuerying sembako_stock_batches...')
  const { data: batches, error: errBatches } = await supabase.from('sembako_stock_batches').select('*')
  if (errBatches) console.error('Batches error:', errBatches)
  else console.log('Batches count:', batches?.length)
}

run()
