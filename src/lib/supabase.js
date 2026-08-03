import { createClient } from '@supabase/supabase-js'
import { supabaseAuthStorage } from './supabaseStorage'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // Bypass Web Locks API — browser ini tidak follow LockManager spec
      lock: (_name, _acquireTimeout, fn) => fn(),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: supabaseAuthStorage,
    },
  }
)
