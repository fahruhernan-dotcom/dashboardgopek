import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'

const STORAGE_KEY = 'sembako_audit_logs_local'

// Helper to record an audit log entry (persisted locally and synced with DB if available)
export async function recordAuditLog({ action_type, product_name, old_value, new_value, notes, profile, tenant_id }) {
  const logEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    tenant_id: tenant_id || profile?.tenant_id || null,
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
  const tenantId = tenant?.id

  return useQuery({
    queryKey: ['sembako-audit-logs', tenantId],
    queryFn: async () => {
      const logs = []

      // 1. Fetch explicit audit logs from DB table if any
      try {
        let q = supabase
          .from('sembako_audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50)

        if (tenantId) {
          q = q.eq('tenant_id', tenantId)
        }

        const { data: dbLogs } = await q
        if (dbLogs && dbLogs.length > 0) {
          logs.push(...dbLogs)
        }
      } catch {
        /* fail silently */
      }

      // 2. Fetch local storage logs if any
      try {
        const localLogs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
        localLogs.forEach(l => {
          if (!logs.some(existing => existing.id === l.id)) {
            logs.push(l)
          }
        })
      } catch {
        /* ok */
      }

      // 3. Synthesize from DB tables: sembako_stock_batches & sembako_stock_outs
      try {
        let batchQ = supabase
          .from('sembako_stock_batches')
          .select('*, sembako_products(product_name, unit), sembako_suppliers(supplier_name)')
          .order('created_at', { ascending: false })
          .limit(30)

        let outQ = supabase
          .from('sembako_stock_outs')
          .select('*, sembako_products(product_name, unit), sembako_sales(invoice_number)')
          .order('created_at', { ascending: false })
          .limit(30)

        if (tenantId) {
          batchQ = batchQ.eq('tenant_id', tenantId)
          outQ = outQ.eq('tenant_id', tenantId)
        }

        const [{ data: batches }, { data: outs }] = await Promise.all([batchQ, outQ])

        if (batches) {
          batches.forEach(b => {
            const pName = b.sembako_products?.product_name || 'Produk'
            const unit = b.sembako_products?.unit || 'unit'
            const sup = b.sembako_suppliers?.supplier_name ? ` dari ${b.sembako_suppliers.supplier_name}` : ''
            const logId = `batch-${b.id}`
            if (!logs.some(l => l.id === logId)) {
              logs.push({
                id: logId,
                timestamp: b.purchase_date || b.created_at,
                user_name: 'Admin',
                user_role: 'system',
                action_type: 'MASUK',
                product_name: pName,
                old_value: '0',
                new_value: `+${b.qty_masuk} ${unit}`,
                notes: `Stok masuk batch ${b.batch_code || ''}${sup} (@ Rp ${Number(b.buy_price || 0).toLocaleString('id-ID')})`,
              })
            }
          })
        }

        if (outs) {
          outs.forEach(s => {
            const pName = s.sembako_products?.product_name || 'Produk'
            const unit = s.sembako_products?.unit || 'unit'
            const inv = s.sembako_sales?.invoice_number ? ` (Inv: ${s.sembako_sales.invoice_number})` : ''
            const isAdj = s.reason === 'adjustment'
            const logId = `out-${s.id}`
            if (!logs.some(l => l.id === logId)) {
              logs.push({
                id: logId,
                timestamp: s.created_at,
                user_name: 'Kasir / System',
                user_role: 'system',
                action_type: isAdj ? 'ADJUSTMENT' : 'KELUAR',
                product_name: pName,
                old_value: '-',
                new_value: `-${s.qty_keluar} ${unit}`,
                notes: s.notes || (isAdj ? `Penyesuaian stok` : `Penjualan${inv}`),
              })
            }
          })
        }

        // Synthesize returns
        let retQ = supabase
          .from('sembako_returns')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30)

        if (tenantId) {
          retQ = retQ.eq('tenant_id', tenantId)
        }

        const { data: returnsData } = await retQ
        if (returnsData) {
          returnsData.forEach(r => {
            const logId = `retur-${r.id}`
            if (!logs.some(l => l.id === logId)) {
              const isCancelled = r.is_deleted || r.status === 'cancelled'
              logs.push({
                id: logId,
                timestamp: r.created_at || new Date().toISOString(),
                user_name: 'Admin / System',
                user_role: 'system',
                action_type: isCancelled ? 'RETUR_BATAL' : 'RETUR_MASUK',
                product_name: r.product_name || 'Produk',
                old_value: isCancelled ? `${r.quantity} ${r.unit}` : '0',
                new_value: isCancelled ? '0 (Dibatalkan)' : `+${r.quantity} ${r.unit}`,
                notes: `Retur (${r.party_name || '-'}) - ${r.reason || 'Klaim'} @ Rp ${Number(r.total_amount || r.amount || 0).toLocaleString('id-ID')}`,
              })
            }
          })
        }
      } catch (err) {
        console.warn('[useSembakoAuditLogs] db synthesis fallback err:', err)
      }

      // Sort combined logs by timestamp descending
      return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    },
    staleTime: 10000,
  })
}
