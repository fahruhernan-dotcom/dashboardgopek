import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kqbxzokrpcwuxrfjshuf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYnh6b2tycGN3dXhyZmpzaHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzY1NTYsImV4cCI6MjEwMTM1MjU1Nn0.alDDENQKoFQY67tCk7s0CG2dl-OrIa8IHTMwhTHb_1A'

const supabase = createClient(supabaseUrl, supabaseKey)
const tenantId = '00000000-0000-0000-0000-000000000002'

async function checkProducts() {
  const { data, error } = await supabase.from('sembako_products').select('id, product_name, current_stock, avg_buy_price').eq('tenant_id', tenantId)
  if (error) {
    console.error('Error fetching products:', error)
  } else {
    console.log('Current Sembako Products in DB:')
    console.log(data)
  }
}

checkProducts()
