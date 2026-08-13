import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kqbxzokrpcwuxrfjshuf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYnh6b2tycGN3dXhyZmpzaHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NzY1NTYsImV4cCI6MjEwMTM1MjU1Nn0.alDDENQKoFQY67tCk7s0CG2dl-OrIa8IHTMwhTHb_1A'

const client = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  const email = 'muhilham4141@gmail.com'
  const password = 'admin123'

  console.log('1. Testing signInWithPassword for', email)
  const { data: signInData, error: signInErr } = await client.auth.signInWithPassword({
    email, password
  })

  if (signInErr) {
    console.log('Sign in failed:', signInErr.message)
    console.log('2. Attempting signUp...')
    const { data: signUpData, error: signUpErr } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: 'Muh Ilham' }
      }
    })
    console.log('SignUp result:', { user: signUpData?.user?.id, error: signUpErr?.message })
  } else {
    console.log('Sign in SUCCESS! User ID:', signInData.user.id)
  }

  // Check profile
  const { data: profiles, error: profErr } = await client
    .from('profiles')
    .select('*, tenants(*)')
    .eq('email', email)

  console.log('Profiles for email:', { profiles, profErr })
}

testAuth()
