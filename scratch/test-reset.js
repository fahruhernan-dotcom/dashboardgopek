import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kqbxzokrpcwuxrfjshuf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYnh6b2tycGN3dXhyZmpzaHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzY1NTYsImV4cCI6MjEwMTM1MjU1Nn0.alDDENQKoFQY67tCk7s0CG2dl-OrIa8IHTMwhTHb_1A'

const supabase = createClient(supabaseUrl, supabaseKey)
const tenantId = '00000000-0000-0000-0000-000000000002'

async function testDelete() {
  console.log('Starting delete test for tenant:', tenantId)

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
    try {
      console.log(`Testing delete from table: ${table}...`)
      const { data, error } = await supabase.from(table).delete().eq('tenant_id', tenantId)
      if (error) {
        console.error(`❌ Error deleting from ${table}:`, error.message, error.details || '')
      } else {
        console.log(`✅ Success deleting from ${table}`)
      }
    } catch (e) {
      console.error(`💥 Exception deleting from ${table}:`, e)
    }
  }
}

testDelete()
