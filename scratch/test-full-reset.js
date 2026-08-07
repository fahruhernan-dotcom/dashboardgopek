import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kqbxzokrpcwuxrfjshuf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYnh6b2tycGN3dXhyZmpzaHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzY1NTYsImV4cCI6MjEwMTM1MjU1Nn0.alDDENQKoFQY67tCk7s0CG2dl-OrIa8IHTMwhTHb_1A'

const supabase = createClient(supabaseUrl, supabaseKey)
const tenantId = '00000000-0000-0000-0000-000000000002'

async function performReset() {
  console.log('Running test database reset for tenant:', tenantId)

  try {
    // 1. Clear transaction tables
    const tables = [
      'sembako_deliveries',
      'sembako_payroll',
      'sembako_payments',
      'sembako_expenses',
      'sembako_sales',
      'sembako_stock_out',
      'sembako_returns',
      'sembako_supplier_payments',
      'sembako_stock_batches',
      'sembako_audit_logs'
    ]

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('tenant_id', tenantId)
      if (error) {
        console.error(`Error deleting from ${table}:`, error.message)
      } else {
        console.log(`Deleted from ${table}`)
      }
    }

    // 2. Reset product stocks and avg buy prices to 0
    console.log('Updating sembako_products current_stock and avg_buy_price to 0...')
    const { error: errProdReset } = await supabase.from('sembako_products')
      .update({ current_stock: 0, avg_buy_price: 0 })
      .eq('tenant_id', tenantId)

    if (errProdReset) {
      console.error('Error updating products:', errProdReset.message)
    } else {
      console.log('Updated all products to 0 stock and 0 avg buy price successfully.')
    }

    // 3. Print products to verify
    const { data: prods, error: errFetch } = await supabase.from('sembako_products')
      .select('id, product_name, current_stock, avg_buy_price')
      .eq('tenant_id', tenantId)
    
    if (errFetch) {
      console.error('Error fetching products:', errFetch)
    } else {
      console.log('Final Products in DB after reset:')
      console.log(prods)
    }

  } catch (e) {
    console.error('Exception occurred:', e)
  }
}

performReset()
