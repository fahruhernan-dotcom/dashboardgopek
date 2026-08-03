// CollectionReminders.jsx — Overdue collection warnings
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Clock, ChevronRight } from 'lucide-react'
import { formatIDR } from '@/lib/format'
import { C } from '../sembakoSaleUtils'

export function CollectionReminders({ sales, navigate, brokerBase, maxItems = 5, isMobile }) {
  const reminders = useMemo(() => {
    const now = new Date()
    return sales
      .filter(s => s.payment_status !== 'lunas' && s.due_date && !s.is_deleted)
      .map(s => {
        const due = new Date(s.due_date)
        const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
        return { ...s, daysDiff: diff }
      })
      .filter(s => s.daysDiff <= 3) // Today, overdue, or next 3 days
      .sort((a, b) => a.daysDiff - b.daysDiff)
  }, [sales])

  const visibleReminders = useMemo(() => reminders.slice(0, maxItems), [reminders, maxItems])

  if (reminders.length === 0) return null

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(239,68,68,0.04)',
        border: `1px solid rgba(239,68,68,0.15)`,
        borderRadius: '16px',
        padding: '14px',
        marginBottom: isMobile ? '12px' : '24px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} color="#EF4444" />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#EF4444', letterSpacing: '0.1em' }}>PENAGIHAN JATUH TEMPO</span>
          <span style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '5px' }}>{reminders.length}</span>
        </div>
        {isMobile && reminders.length > maxItems && (
          <button
            onClick={() => navigate(`${brokerBase}/penjualan`)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.accent, fontSize: '11px', fontWeight: 700, padding: 0 }}
          >
            Lihat semua
          </button>
        )}
      </div>
      <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '8px' } : { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
        {visibleReminders.map(s => (
          <div key={s.id} style={{ background: C.card, borderRadius: '12px', padding: '12px', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
               <p style={{ fontSize: '13px', fontWeight: 800, color: C.text }}>{s.sembako_customers?.customer_name || s.customer_name}</p>
               <p style={{ fontSize: '11px', color: s.daysDiff < 0 ? '#EF4444' : '#F59E0B', fontWeight: 700 }}>
                 {s.daysDiff < 0 ? `Telat ${Math.abs(s.daysDiff)} hari` : s.daysDiff === 0 ? 'Jatuh tempo HARI INI' : `H-${s.daysDiff} Jatuh tempo`}
               </p>
             </div>
             <div style={{ textAlign: 'right' }}>
               <p style={{ fontSize: '14px', fontWeight: 900, color: C.text }}>{formatIDR(s.remaining_amount)}</p>
               <button 
                onClick={() => navigate(`${brokerBase}/penjualan?saleId=${s.id}`)}
                style={{ fontSize: '10px', color: C.accent, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Detail <ChevronRight size={10} style={{ display: 'inline', verticalAlign: 'middle', marginTop: '-2px' }} />
               </button>
             </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
