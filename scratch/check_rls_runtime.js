import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kqbxzokrpcwuxrfjshuf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYnh6b2tycGN3dXhyZmpzaHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzY1NTYsImV4cCI6MjEwMTM1MjU1Nn0.alDDENQKoFQY67tCk7s0CG2dl-OrIa8IHTMwhTHb_1A'

async function checkRuntimeRLS() {
  console.log('=== CHECKING ANONYMOUS ACCESS (NO JWT) ===')
  const clientAnon = createClient(supabaseUrl, supabaseAnonKey)

  const tables = [
    'sembako_products', 'sembako_customers', 'sembako_sales',
    'sembako_stock_batches', 'sembako_returns', 'sembako_expenses', 'sembako_payments'
  ]

  for (const table of tables) {
    const { data, error } = await clientAnon.from(table).select('*')
    console.log(`Table [${table}] Anon Select:`, {
      rowCount: data ? data.length : 0,
      error: error ? error.message : null
    })
  }

  console.log('\n=== CHECKING AUTHENTICATED ACCESS (dev@sembako.id) ===')
  const clientAuth = createClient(supabaseUrl, supabaseAnonKey)
  const { data: authData, error: authErr } = await clientAuth.auth.signInWithPassword({
    email: 'dev@sembako.id',
    password: 'dev123'
  })

  if (authErr) {
    console.log('Auth login error:', authErr.message)
    return
  }

  console.log('Auth login success. User ID:', authData.user.id)

  for (const table of tables) {
    const { data, error } = await clientAuth.from(table).select('*')
    console.log(`Table [${table}] Auth Select:`, {
      rowCount: data ? data.length : 0,
      error: error ? error.message : null
    })
  }
}

checkRuntimeRLS()
