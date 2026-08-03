// AgendaSection.jsx — calendar heatmap + event list
import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, CalendarX, Wallet, Truck } from 'lucide-react'
import {
  startOfWeek, startOfMonth, endOfMonth, subMonths, addMonths, addDays,
  format, isSameDay, eachDayOfInterval, isSameMonth,
} from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { formatIDR } from '@/lib/format'
import { C } from '../sembakoSaleUtils'

// ── Calendar Heatmap ───────────────────────────────────────────────────────────
function CalendarHeatmap({ currentMonth, selectedDate, setSelectedDate, piutangDates, deliveryDates }) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd   = endOfMonth(currentMonth)
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: addDays(monthEnd, (7 - ((monthEnd.getDay() || 7) - 1)) % 7) })
  const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '9px', fontWeight: 800, color: C.muted, padding: '2px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {days.map((day, i) => {
          const dStr = format(day, 'yyyy-MM-dd')
          const inMonth   = isSameMonth(day, currentMonth)
          const isSelected = isSameDay(day, selectedDate)
          const isToday    = isSameDay(day, new Date())
          const hasPiutang  = piutangDates.has(dStr)
          const hasDelivery = deliveryDates.has(dStr)
          return (
            <button key={i} onClick={() => setSelectedDate(day)} style={{
              aspectRatio: '1', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: isSelected ? C.accent : isToday ? 'rgba(234,88,12,0.15)' : 'transparent',
              color: isSelected ? '#fff' : inMonth ? C.text : C.muted,
              fontSize: '11px', fontWeight: isSelected || isToday ? 800 : 400,
              opacity: inMonth ? 1 : 0.3,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '2px', padding: '2px',
            }}>
              <span>{format(day, 'd')}</span>
              {inMonth && (hasPiutang || hasDelivery) && !isSelected && (
                <div style={{ display: 'flex', gap: '2px' }}>
                  {hasPiutang  && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#EF4444' }} />}
                  {hasDelivery && <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.amber }} />}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Agenda Section ─────────────────────────────────────────────────────────────
export function AgendaSection({ sales, deliveries, selectedDate, setSelectedDate, currentMonth, setCurrentMonth, agendaFilter, setAgendaFilter, isMobile }) {
  const [showCalendar, setShowCalendar] = useState(!isMobile)

  const piutangEvents = useMemo(() =>
    sales.filter(s => s.payment_status !== 'lunas' && s.due_date)
      .map(s => ({ ...s, type: 'Piutang', date: s.due_date, icon: Wallet, color: '#EF4444' })),
    [sales]
  )
  const deliveryEvents = useMemo(() =>
    deliveries.filter(d => d.status !== 'delivered')
      .map(d => ({ ...d, type: 'Pengiriman', date: d.created_at?.slice(0, 10), icon: Truck, color: C.amber })),
    [deliveries]
  )

  const piutangDates  = useMemo(() => new Set(piutangEvents.map(e => e.date)),  [piutangEvents])
  const deliveryDates = useMemo(() => new Set(deliveryEvents.map(e => e.date)), [deliveryEvents])

  const filteredEvents = useMemo(() => {
    const all = [...piutangEvents, ...deliveryEvents]
    let list = all.filter(e => e.date && isSameDay(new Date(e.date), selectedDate))
    if (agendaFilter !== 'Semua') list = list.filter(e => e.type === agendaFilter)
    return list
  }, [piutangEvents, deliveryEvents, selectedDate, agendaFilter])

  const mStr = format(currentMonth, 'yyyy-MM')
  const monthPiutang = piutangEvents.filter(e => e.date?.startsWith(mStr)).reduce((s, e) => s + (e.remaining_amount || 0), 0)

  return (
    <div style={{ background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: C.accent, letterSpacing: '0.1em' }}>AGENDA</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: '4px' }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: '11px', fontWeight: 700, color: C.text, minWidth: '80px', textAlign: 'center' }}>
            {format(currentMonth, 'MMM yyyy', { locale: idLocale })}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: '4px' }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {isMobile && (
        <button onClick={() => setShowCalendar(!showCalendar)} style={{
          width: '100%', height: '38px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
          fontSize: '11px', fontWeight: 700, color: C.text,
          marginBottom: '12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          WebkitTapHighlightColor: 'transparent',
        }}>
          {showCalendar ? 'Sembunyikan Kalender' : 'Tampilkan Kalender'}
        </button>
      )}

      {showCalendar && (
        <div style={{ marginBottom: '12px' }}>
          <CalendarHeatmap
            currentMonth={currentMonth} selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            piutangDates={piutangDates} deliveryDates={deliveryDates}
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', margin: '12px 0' }}>
        <div style={{ background: C.input, borderRadius: '10px', padding: '8px 10px' }}>
          <p style={{ fontSize: '9px', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em', marginBottom: '2px' }}>PIUTANG BULAN INI</p>
          <p style={{ fontSize: '13px', fontWeight: 800, color: '#EF4444' }}>{formatIDR(monthPiutang)}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {['Semua', 'Piutang'].map(tab => (
          <button key={tab} onClick={() => setAgendaFilter(tab)} style={{
            padding: '4px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '10px', fontWeight: 800,
            background: agendaFilter === tab ? C.accent : 'rgba(255,255,255,0.04)',
            color: agendaFilter === tab ? '#fff' : C.muted,
            transition: 'all 0.15s',
          }}>{tab}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CalendarX size={24} color="#94A3B8" style={{ margin: '0 auto 6px', opacity: 0.4 }} />
            <p style={{ fontSize: '12px', color: '#94A3B8' }}>Tidak ada agenda</p>
          </div>
        ) : (
          filteredEvents.map((e, i) => {
            const EventIcon = e.icon
            const name = e.type === 'Piutang'
              ? (e.sembako_customers?.customer_name || e.customer_name || '-')
              : (e.sembako_sales?.sembako_customers?.customer_name || e.sembako_sales?.customer_name || '-')
            const subText = e.type === 'Piutang'
              ? formatIDR(e.remaining_amount || 0)
              : `${e.status || 'pending'}`
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: C.input, borderRadius: '10px', padding: '8px 10px',
              }}>
                <div style={{ width: 28, height: 28, borderRadius: '8px', background: `${e.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <EventIcon size={13} color={e.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                  <p style={{ fontSize: '10px', color: e.color, fontWeight: 600 }}>{e.type} · {subText}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
