import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { toast } from 'sonner'
import { useAuth } from './useAuth'

const STORAGE_KEY = 'sembako_audit_logs_local'

// Helper to record an audit log entry (persisted locally and synced with DB if available)
export async function recordAuditLog({ action_type, product_name, old_value, new_value, notes, profile }) {
  const logEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    user_name: profile?.full_name || profile?.email || 'User System',
    user_role: profile?.role || 'admin',
    action_type, // 'stock_adj', 'stock_in', 'sale_created', 'sale_voided', 'return_created'
    product_name: product_name || '-',
    old_value: old_value ?? '-',
    new_value: new_value ?? '-',
    notes: notes || '',
  }

  // 1. Store in localStorage for client-side audit history
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const updated = [logEntry, ...existing].slice(0, 100) // Keep last 100 logs
    localStorage.getItem(STORAGE_KEY)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.warn('[recordAuditLog] localStorage failed', e)
  }

  // 2. Try inserting into Supabase audit logs table if present
  try {
    await supabase.from('sembako_audit_logs').insert([logEntry])
  } catch {
    /* table may not exist yet; fail silently */
  }

  return logEntry
}

export function useSembakoAuditLogs() {
  const { tenant } = useAuth()
  
  return useQuery({
    queryKey: ['sembako-audit-logs', tenant?.id],
    queryFn: async () => {
      // Fetch from localStorage
      const localLogs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      
      try {
        const { data: dbLogs } = await supabase
          .from('sembako_audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50)
        
        if (dbLogs && dbLogs.length > 0) {
          return dbLogs
        }
      } catch {
        /* fallback to localLogs */
      }

      return localLogs
    },
    staleTime: 30000,
  })
}
