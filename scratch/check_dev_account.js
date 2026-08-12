import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kqbxzokrpcwuxrfjshuf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYnh6b2tycGN3dXhyZmpzaHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzY1NTYsImV4cCI6MjEwMTM1MjU1Nn0.alDDENQKoFQY67tCk7s0CG2dl-OrIa8IHTMwhTHb_1A'

const client = createClient(supabaseUrl, supabaseAnonKey)

async function checkDevProfile() {
  const { data, error } = await client.from('profiles').select('email, role, app_role, tenant_id').eq('email', 'fahruhernansakti@gmail.com')
  console.log('Dev Profile:', { data, error })
}

checkDevProfile()
