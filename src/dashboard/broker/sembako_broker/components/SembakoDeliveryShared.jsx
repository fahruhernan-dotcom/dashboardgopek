import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Truck, Package, CheckCircle2, Check, User, MapPin, MessageCircle,
  Clock, FileText, Pencil, AlertTriangle, Save,
} from 'lucide-react'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { DatePicker } from '@/components/ui/DatePicker'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useCreateSembakoDelivery,
  useStartSembakoDelivery,
  useArriveSembakoDelivery,
  useCompleteSembakoDelivery,
  useUpdateSembakoDeliveryTimestamps,
} from '@/lib/hooks/useSembakoData'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { formatIDR } from '@/lib/format'
import {
  C, sInput, sLabel, sBtn, fmtDate, CustomSelect,
} from '@/dashboard/broker/sembako_broker/components/sembakoSaleUtils'

// ── Timeline (4 langkah tanpa Muat) ──────────────────────────────────────────
export function SembakoTimeline({ delivery, status: statusProp }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const status = statusProp || delivery?.status || 'pending'

  const steps = [
    { key: 'created_at',   label: 'Disiapkan',  icon: Package },
    { key: 'departed_at',  label: 'Berangkat',  icon: Truck },
    { key: 'arrived_at',   label: 'Tiba',       icon: MapPin },
    { key: 'completed_at', label: 'Selesai',    icon: CheckCircle2 },
  ]

  const statusIdxMap = { pending: 0, on_route: 1, arrived: 2, delivered: 3 }
  const activeIdx = statusIdxMap[status] ?? 0

  const trackRef = useRef(null)
  const [truckLeft, setTruckLeft] = useState(-6)
  const [isMoving, setIsMoving] = useState(false)

  useEffect(() => {
    const updatePosition = () => {
      const trackWidth = trackRef.current?.offsetWidth ?? 0
      const truckWidth = 54
      const positions = {
        pending:   -6,
        on_route:  trackWidth / 3 - truckWidth / 2 + 12,
        arrived:   trackWidth * 2 / 3 - truckWidth / 2 + 12,
        delivered: trackWidth - truckWidth / 2 + 6,
      }
      setTruckLeft(positions[status] ?? -6)
      setIsMoving(true)
      const t = setTimeout(() => setIsMoving(false), 500)
      return () => clearTimeout(t)
    }
    const timer = setTimeout(updatePosition, 100)
    window.addEventListener('resize', updatePosition)
    return () => { clearTimeout(timer); window.removeEventListener('resize', updatePosition) }
  }, [status])

  function getTime(key) {
    if (!key || !delivery) return null
    const val = delivery[key]
    if (!val) return null
    try { return format(parseISO(val), 'HH:mm') } catch { return null }
  }

  return (
    <div className="relative pt-6">
      <style>{`
        .smb-truck-bounce { animation: smbTruckBounce 0.5s ease; }
        @keyframes smbTruckBounce {
          0%, 100% { transform: translateY(0); }
          35%  { transform: translateY(-1px); }
          70%  { transform: translateY(0.5px); }
        }
        .smb-puff {
          position: absolute; top: 8px; right: 8px;
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(200,230,210,0.5); opacity: 0;
          animation: smbFloatUp infinite;
        }
        @keyframes smbFloatUp {
          0%   { opacity: 0; transform: translate(0,0) scale(0.4); }
          15%  { opacity: 0.7; }
          60%  { opacity: 0.3; }
          100% { opacity: 0; transform: translate(6px,-30px) scale(2); }
        }
      `}</style>

      <div className="absolute top-[34px] left-[10%] right-[10%] z-20">
        <div style={{
          position: 'absolute', top: '-34px', left: `${truckLeft}px`,
          width: '54px', height: '54px',
          transition: 'left 0.9s cubic-bezier(0.34, 1.3, 0.64, 1)', pointerEvents: 'none',
        }}>
          <div className={isMoving ? 'smb-truck-bounce' : ''}>
            <svg width="54" height="54" viewBox="0 0 128 128" style={{ transform: 'scaleX(-1)', display: 'block' }}>
              <path d="M57.99 53.73s-.53-1.53-1.68-2.06c-1.14-.53-3.05-.61-3.05-.61l-3.2 37.85l2.6 18.68s.76 2.21 2.75 2.29c1.98.08 18.47 0 19.92 0c1.45 0 1.91-1.91 1.98-2.75c.08-.84.05-2.25.05-2.25l7.04-.03s.41 3-.27 4.89c-.59 1.64-1.12 2.95-1.11 3.51c.01.8 1.07 1.6 2.29 1.53c1.22-.08 3.05-1.68 4.27-2.67c1.22-.99 20.78-.76 20.78-.76s.94 1.74 1.99 2.79c.63.63 1.65.94 2.57.94c.92 0 2.06-1.22 1.83-2.06c-.23-.84-1.27-2.77-1.45-4.65c-.08-.85.02-3.22.44-3.61c.1-.09 1.62-.04 3.04-.19c2.42-.25 4.84-3.38 5.14-5.82c.31-2.44.08-10.15.08-10.15L57.99 53.73z" fill="#0ea5e9"/>
              <path d="M52.02 96.11h72.03s.17 2.02-.18 3.32a5.612 5.612 0 0 1-.93 1.91l-70.51-.01l-.41-5.22z" fill="#0369a1"/>
              <path d="M26.75 92.84L11.5 97.56l-7.62-2.63s.27-14.34.36-15.79c.09-1.45.45-2.72 1.82-3.63c1.36-.91 5.17-3.18 5.17-3.18s11.71-18.79 12.71-20.15c1-1.36 2.23-3.02 5.14-3.29s20.87-.05 22.5.04c1.63.09 2.85.83 2.85 4.37s-.09 30.56-.18 31.92c-.09 1.36-6.9 6.35-6.9 6.35l-20.6 1.27z" fill="#38bdf8"/>
              <path d="M48.95 110.03s1.46.04 2.47-.1s2.53-1.15 2.6-3.54c.04-1.42.23-21.17.23-21.17l-27.2.06l-8.8 9.63l-14.37.02s-.06 5.65-.02 7.16c.04 1.52 7.86 4.83 7.86 4.83l37.23 3.11z" fill="#0284c7"/>
              <path d="M3.86 102.09h16.38s3.51-7 13.6-6.88c14.82.18 15.12 14.81 15.12 14.81h-38.6c-2.17 0-5.27-.72-6.06-3.46c-.67-2.3-.44-4.47-.44-4.47z" fill="#0ea5e9"/>
              <path d="M13.89 76.26s0-1.63-1.07-1.69s-2.25.61-3.32 1.52c-1.13.96-1.69 1.83-1.91 2.59c-.34 1.13-.06 2.14 1.69 2.19c2.14.07 36.12-.15 37.69-.28c1.97-.17 3.15-1.01 3.09-2.48c-.05-1.41-1.07-1.86-5.29-1.91s-30.88.06-30.88.06z" fill="#e0f2fe"/>
              <path d="M4.2 81.03s10.21-.32 10.43-.07c.31.37.37 5.19.26 5.92c-.11.73-1.07 1.24-2.25 1.29s-8.61.17-8.61.17l.17-7.31z" fill="#bae6fd"/>
              <path d="M46.24 74.51c1.58 0 2.14-1.8 2.14-3.04V55.78c0-1.24-.79-1.91-3.26-2.03c-2.48-.11-13.78.02-15.02.06c-1.91.06-3.21.9-4.95 3.32c-1.13 1.57-8.1 13.11-8.66 14.06c-.56.96-1.24 3.49 1.69 3.54c3.03.06 28.06-.22 28.06-.22z" fill="#0369a1"/>
              <path d="M19.63 71.87h25.2c.51 0 .96-.56.96-1.24s.04-11.3.06-11.93c.06-1.74-1.24-2.14-2.36-2.08c-1.13.06-12.51.02-13.18.05c-1.29.06-2.57 1.79-3.69 3.5c-1.35 2.07-6.99 11.7-6.99 11.7z" fill="#7dd3fc"/>
              <path d="M20.02 73.73c.11 2.53 4.16 4.61 5.18 4.67c1.01.06 1.63-1.91 1.74-4.56S25.99 69 25.14 69c-.84 0-5.21 2.59-5.12 4.73z" fill="#0ea5e9"/>
              <path d="M20.9 111.62c.08 5 4.06 12.19 12.72 12.24c8.66.05 13.16-6.59 12.88-13.4c-.28-6.92-5.65-11.81-13.38-11.59c-7.23.22-12.33 5.84-12.22 12.75z" fill="#0c4a6e"/>
              <path d="M27.09 111.33c.04 2.63 2.13 6.43 6.69 6.46s6.76-3.27 6.62-6.86c-.15-3.65-3.06-6.37-6.88-6.31c-3.8.05-6.48 3.06-6.43 6.71z" fill="#7dd3fc"/>
              <path d="M86.9 111.62c.08 5 4.06 12.19 12.72 12.24c8.66.05 13.16-6.59 12.88-13.4c-.28-6.92-5.65-11.81-13.38-11.59c-7.23.22-12.33 5.84-12.22 12.75z" fill="#0c4a6e"/>
              <path d="M93.09 111.33c.04 2.63 2.13 6.43 6.69 6.46c4.55.03 6.76-3.27 6.62-6.86c-.15-3.65-3.06-6.37-6.88-6.31c-3.8.05-6.48 3.06-6.43 6.71z" fill="#7dd3fc"/>
              <path d="M56.87 28.62c0-2.62 1.15-3.67 3.25-3.56c2.1.1 59.65-.21 61.53-.21s2.62 1.99 2.62 3.14c0 1.15-.36 59.49-.28 60.62c.07 1.13-.24 2.7-2.23 2.91s-61.01.1-62.27 0s-2.83-1.15-2.83-2.62c0-1.48.21-58.92.21-60.28z" fill="#0369a1"/>
              <path d="M62.11 30.92c0 1.36-.42 52.31-.42 53.57c0 1.26.63 2.73 2.31 2.73c1.68 0 53.25.1 54.3 0c1.05-.1 1.68-.73 1.78-2.41c.1-1.68.1-52.83.1-54.51c0-1.68-1.68-1.78-3.46-1.78s-52.2.1-52.94.21c-.73.09-1.67.83-1.67 2.19z" fill="#38bdf8"/>
              <path d="M74.45 89c-.06-18.45-.19-61.48.02-62.65l1.48.27l1.49.18c-.14 1.65-.07 38.09.01 62.19l-3 .01z" fill="#0ea5e9"/>
              <path fill="#0ea5e9" d="M89.75 26.52h3V89.1h-3z"/>
              <path fill="#0ea5e9" d="M104.89 26.57h3v62.27h-3z"/>
              <circle cx="8" cy="78" r="3.5" fill="#FEF08A" opacity="0.8"/>
              <circle cx="8" cy="78" r="7" fill="#FEF08A" opacity="0.12"/>
            </svg>
          </div>
          <div className="smb-puff" style={{ animationDelay: '0s',   animationDuration: '1.8s' }} />
          <div className="smb-puff" style={{ animationDelay: '0.6s', animationDuration: '2.2s' }} />
          <div className="smb-puff" style={{ animationDelay: '1.2s', animationDuration: '1.6s' }} />
        </div>
      </div>

      <div
        ref={trackRef}
        className="absolute top-[34px] left-[10%] right-[10%] h-[2px] bg-white/10 rounded-full overflow-hidden"
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(Math.max(0, activeIdx) / 3) * 100}%` }}
          className="h-full bg-blue-500"
        />
      </div>

      <div className="relative flex justify-between">
        {steps.map((step, idx) => {
          const isDone  = idx <= activeIdx
          const isCurrent = idx === activeIdx
          const time = getTime(step.key)
          return (
            <div key={idx} className="flex flex-col items-center gap-2 relative z-10 w-1/4">
              <div className={cn(
                'w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center bg-[#111C24]',
                isDone
                  ? 'border-blue-500 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                  : idx === activeIdx + 1
                  ? 'border-blue-500/50'
                  : 'border-white/10'
              )}>
                {isDone && <Check size={isDesktop ? 8 : 10} strokeWidth={4} className="text-[#111C24]" />}
                {isCurrent && status === 'on_route' && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
                  </span>
                )}
              </div>
              <div className="text-center space-y-0.5">
                <p className={cn(
                  'font-black uppercase tracking-widest',
                  isDesktop ? 'text-[8px]' : 'text-[9px]',
                  isCurrent && status !== 'pending' ? 'text-white' : isDone ? 'text-blue-400' : 'text-[#64748B]'
                )}>{step.label}</p>
                <p className={cn('font-bold tabular-nums', isDesktop ? 'text-[8px]' : 'text-[9px]', time ? 'text-[#94A3B8]' : 'text-[#64748B]')}>
                  {time || '--:--'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── buildWA ───────────────────────────────────────────────────────────────────
function buildWA(delivery) {
  const sale = delivery.sembako_sales
  const items = sale?.sembako_sale_items || []
  const customer = sale?.sembako_customers?.customer_name || sale?.customer_name || 'Umum'
  const driver = delivery.sembako_employees?.full_name || delivery.driver_name || '—'
  const vehicle = [delivery.vehicle_type, delivery.vehicle_plate].filter(Boolean).join(' ') || '—'
  const itemLines = items.length
    ? items.map(i => `- ${i.product_name} (${i.quantity} ${i.unit || 'pcs'})`).join('\n')
    : '—'
  return encodeURIComponent(
    `*SURAT JALAN*\n────────────────\nTanggal  : ${fmtDate(delivery.delivery_date)}\nTujuan   : ${customer}\nSopir    : ${driver}\nKendaraan: ${vehicle}\n────────────────\n*Muatan:*\n${itemLines}\n────────────────\nTerima kasih! 🚚`
  )
}

// ── EditTimestampSheet ────────────────────────────────────────────────────────
function EditTimestampSheet({ delivery, open, onClose }) {
  const updateTs = useUpdateSembakoDeliveryTimestamps()

  const toLocalDT = (isoStr) => {
    if (!isoStr) return ''
    try {
      // convert UTC ISO → local datetime-local value
      const d = new Date(isoStr)
      const pad = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    } catch { return '' }
  }

  const [departedAt, setDepartedAt] = useState(() => toLocalDT(delivery?.departed_at) || new Date().toISOString().slice(0, 16))
  const [arrivedAt,  setArrivedAt]  = useState(() => toLocalDT(delivery?.arrived_at)  || new Date().toISOString().slice(0, 16))
  const [completedAt, setCompletedAt] = useState(() => toLocalDT(delivery?.completed_at) || new Date().toISOString().slice(0, 16))

  useEffect(() => {
    if (open) {
      const todayDT = new Date().toISOString().slice(0, 16)
      setDepartedAt(toLocalDT(delivery?.departed_at) || todayDT)
      setArrivedAt(toLocalDT(delivery?.arrived_at)   || todayDT)
      setCompletedAt(toLocalDT(delivery?.completed_at) || todayDT)
    }
  }, [open, delivery])

  async function handleSave() {
    try {
      await updateTs.mutateAsync({
        id: delivery.id,
        departed_at:  departedAt  ? new Date(departedAt).toISOString()  : null,
        arrived_at:   arrivedAt   ? new Date(arrivedAt).toISOString()   : null,
        completed_at: completedAt ? new Date(completedAt).toISOString() : null,
      })
      onClose()
    } catch { /* handled by hook */ }
  }

  if (!delivery) return null
  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-0 overflow-hidden"
        style={{ background: '#0C1319', borderTop: '1px solid rgba(255,255,255,0.06)', maxHeight: '80vh' }}
      >
        <SheetHeader className="px-6 pt-5 pb-3 border-b border-white/5">
          <SheetTitle className="text-white font-black text-base uppercase tracking-tight flex items-center gap-2">
            <Pencil size={15} className="text-amber-400" /> Edit Waktu Pengiriman
          </SheetTitle>
          <SheetDescription className="text-[#94A3B8] text-[11px] font-bold">
            Koreksi waktu jika dicatat secara manual setelah kejadian.
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center gap-1.5">
              <Truck size={10} /> Waktu Berangkat
            </label>
            <input
              type="datetime-local"
              value={departedAt}
              onChange={e => setDepartedAt(e.target.value)}
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm font-bold px-3 py-2.5 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center gap-1.5">
              <MapPin size={10} /> Waktu Tiba
            </label>
            <input
              type="datetime-local"
              value={arrivedAt}
              onChange={e => setArrivedAt(e.target.value)}
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm font-bold px-3 py-2.5 focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 size={10} /> Waktu Selesai
            </label>
            <input
              type="datetime-local"
              value={completedAt}
              onChange={e => setCompletedAt(e.target.value)}
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm font-bold px-3 py-2.5 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={updateTs.isPending}
            className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest rounded-xl gap-2 text-[11px] mt-2"
          >
            <Save size={14} /> {updateTs.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── SembakoDeliveryDetailSheet ────────────────────────────────────────────────
export function SembakoDeliveryDetailSheet({ delivery, onClose }) {
  const startDelivery    = useStartSembakoDelivery()
  const arriveDelivery   = useArriveSembakoDelivery()
  const completeDelivery = useCompleteSembakoDelivery()
  const [showConfirm, setShowConfirm]     = useState(false)
  const [showEditTime, setShowEditTime]   = useState(false)

  if (!delivery) return null

  const sale     = delivery.sembako_sales
  const emp      = delivery.sembako_employees
  const items    = sale?.sembako_sale_items || []
  const customer = sale?.sembako_customers?.customer_name || sale?.customer_name || delivery.delivery_area || 'Umum'

  const statusMeta = {
    pending:   { label: 'Disiapkan',   bg: 'rgba(255,255,255,0.06)', color: '#94A3B8' },
    on_route:  { label: 'Di Jalan',    bg: 'rgba(59,130,246,0.12)',  color: '#60A5FA' },
    arrived:   { label: 'Tiba',        bg: 'rgba(245,158,11,0.12)',  color: '#FBBF24' },
    delivered: { label: 'Terkirim',    bg: 'rgba(16, 185, 129, 0.1)',  color: '#34D399' },
  }
  const meta = statusMeta[delivery.status] || statusMeta.pending

  function fmt(ts) {
    if (!ts) return null
    try { return format(parseISO(ts), 'HH:mm') } catch { return null }
  }

  function getDuration() {
    if (!delivery.departed_at || !delivery.arrived_at) return null
    try {
      const diff = differenceInMinutes(parseISO(delivery.arrived_at), parseISO(delivery.departed_at))
      const h = Math.floor(diff / 60), m = diff % 60
      return `${h > 0 ? `${h}j ` : ''}${m}m`
    } catch { return null }
  }

  // Cek apakah ada timestamp yang kosong (delivery "skip" step)
  const missingTimestamps = delivery.status === 'delivered' &&
    (!delivery.departed_at || !delivery.arrived_at || !delivery.completed_at)

  async function handleStart()    { try { await startDelivery.mutateAsync(delivery.id);    onClose() } catch { /* mutation errors surfaced by react-query */ } }
  async function handleArrive()   { try { await arriveDelivery.mutateAsync(delivery.id);   onClose() } catch { /* mutation errors surfaced by react-query */ } }
  async function handleComplete() {
    // Guard: jangan selesaikan jika step before belum dilewati
    if (!delivery.departed_at || !delivery.arrived_at) {
      // Show hint rather than silently blocking — open the edit sheet instead
      setShowEditTime(true)
      setShowConfirm(false)
      return
    }
    try { await completeDelivery.mutateAsync(delivery.id); setShowConfirm(false); onClose() } catch { /* mutation errors surfaced by react-query */ }
  }

  const duration = getDuration()

  return (
    <>
      <Sheet open={!!delivery} onOpenChange={v => !v && onClose()}>
        <SheetContent
          side="right"
          className="flex flex-col p-0 overflow-hidden"
          style={{ background: '#0C1319', borderLeft: '1px solid rgba(255,255,255,0.06)', width: '100%', maxWidth: '480px' }}
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/5 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-white font-black text-xl uppercase tracking-tight">Detail Pengiriman</SheetTitle>
                <SheetDescription className="sr-only">Rincian pengiriman sembako</SheetDescription>
                <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mt-1">{fmtDate(delivery.delivery_date)}</p>
              </div>
              <span
                className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest"
                style={{ background: meta.bg, color: meta.color }}
              >
                {meta.label}
              </span>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Rute */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Dari</p>
                <p className="text-sm font-black text-white">Gudang Utama</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-1">Ke Customer</p>
                <p className="text-sm font-black text-white">{customer}</p>
              </div>
            </div>

            {/* Kendaraan & Sopir */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#111C24] border border-white/5 p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-[#94A3B8] mb-1">
                  <Truck size={11} /><span className="text-[9px] font-black uppercase tracking-widest">Kendaraan</span>
                </div>
                <p className="text-sm font-black text-white uppercase">{delivery.vehicle_type || '—'}</p>
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase">{delivery.vehicle_plate || '—'}</p>
              </div>
              <div className="rounded-2xl bg-[#111C24] border border-white/5 p-4 space-y-1">
                <div className="flex items-center gap-1.5 text-[#94A3B8] mb-1">
                  <User size={11} /><span className="text-[9px] font-black uppercase tracking-widest">Sopir</span>
                </div>
                <p className="text-sm font-black text-white uppercase">{emp?.full_name || delivery.driver_name || '—'}</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl bg-[#111C24] border border-white/5 p-4">
              <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-4">Timeline Logistik</p>
              <SembakoTimeline delivery={delivery} />
            </div>

            {/* Durasi Perjalanan */}
            {duration && (
              <div className="rounded-2xl bg-blue-500/5 border border-blue-500/10 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#94A3B8]">
                  <Clock size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Lama Perjalanan</span>
                </div>
                <span className="text-sm font-black text-blue-400">{duration}</span>
              </div>
            )}

            {/* Muatan */}
            {items.length > 0 && (
              <div>
                <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-2">Muatan ({items.length} produk)</p>
                <div className="rounded-2xl bg-[#111C24] border border-white/5 overflow-hidden">
                  {items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3" style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Package size={12} className="text-[#94A3B8] shrink-0" />
                        <span className="text-[12px] font-bold text-white truncate">{it.product_name}</span>
                      </div>
                      <span className="text-[11px] font-black text-[#94A3B8] shrink-0 ml-2">{it.quantity} {it.unit || 'pcs'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invoice */}
            {sale && (
              <div className="rounded-2xl bg-white/[0.02] border border-white/5 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest">Invoice</p>
                  <p className="text-[12px] font-black text-white mt-0.5">{sale.invoice_number}</p>
                </div>
                <p className="text-sm font-black" style={{ color: C.accent }}>{formatIDR(sale.total_amount)}</p>
              </div>
            )}

            {/* Catatan */}
            {delivery.notes && (
              <div>
                <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-2">Catatan</p>
                <p className="text-[12px] font-bold text-[#94A3B8] italic bg-white/[0.02] rounded-2xl px-4 py-3 border border-white/5">
                  "{delivery.notes}"
                </p>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="px-6 py-5 border-t border-white/5 space-y-2 flex-shrink-0" style={{ background: '#0C1319' }}>
            {delivery.status === 'pending' && (
              <Button
                onClick={handleStart}
                disabled={startDelivery.isPending}
                className="w-full h-12 text-blue-400 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 font-black uppercase tracking-widest rounded-xl gap-2 text-[11px]"
              >
                <Truck size={15} /> Mulai Perjalanan
              </Button>
            )}
            {delivery.status === 'on_route' && (
              <Button
                onClick={handleArrive}
                disabled={arriveDelivery.isPending}
                className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest rounded-xl gap-2 text-[11px]"
              >
                <MapPin size={15} /> Catat Kedatangan
              </Button>
            )}
            {delivery.status === 'arrived' && (
              <Button
                onClick={() => setShowConfirm(true)}
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest rounded-xl gap-2 text-[11px]"
              >
                <CheckCircle2 size={15} /> Selesaikan Pengiriman
              </Button>
            )}
            {delivery.status === 'delivered' && (
              <div className="space-y-2">
                {/* Warning: ada timestamp yang kosong */}
                {missingTimestamps && (
                  <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
                    <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-300/80 leading-relaxed">
                      Beberapa waktu tidak tercatat. Tekan <span className="font-black text-amber-300">Edit Waktu</span> untuk mengisi secara manual.
                    </p>
                  </div>
                )}
                <Button
                  variant="ghost"
                  disabled
                  className="w-full h-10 opacity-40 text-[#94A3B8] font-black uppercase tracking-widest text-[10px]"
                >
                  <CheckCircle2 size={13} className="mr-1.5" /> Terkirim
                </Button>
              </div>
            )}
            {delivery.status === 'delivered' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://wa.me/?text=${buildWA(delivery)}`, '_blank')}
                  className="w-full h-10 border-green-500/20 bg-green-500/5 hover:bg-green-500/10 text-green-400 font-black uppercase tracking-widest gap-2 rounded-xl text-[10px]"
                >
                  <MessageCircle size={13} /> Bagikan Surat Jalan
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="h-10 border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-[#94A3B8] font-black uppercase tracking-widest gap-2 rounded-xl text-[10px]"
                  >
                    <FileText size={13} /> Cetak Surat Jalan
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 font-black uppercase tracking-widest gap-2 rounded-xl text-[10px]"
                    onClick={() => setShowEditTime(true)}
                  >
                    <Pencil size={13} /> Edit Waktu
                  </Button>
                </div>
              </>
            )}
            {delivery.status !== 'pending' && delivery.status !== 'delivered' && (
              <Button
                variant="outline"
                onClick={() => window.open(`https://wa.me/?text=${buildWA(delivery)}`, '_blank')}
                className="w-full h-10 border-green-500/20 bg-green-500/5 hover:bg-green-500/10 text-green-400 font-black uppercase tracking-widest gap-2 rounded-xl text-[10px]"
              >
                <MessageCircle size={13} /> Bagikan Surat Jalan
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Timestamp Recovery Sheet */}
      <EditTimestampSheet
        delivery={delivery}
        open={showEditTime}
        onClose={() => setShowEditTime(false)}
      />

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-[#0C1319] border border-white/10 rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10">
                <CheckCircle2 size={20} className="text-emerald-400" />
              </div>
              <AlertDialogTitle className="text-white font-black text-base uppercase tracking-wide">
                Selesaikan Pengiriman?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 space-y-2 text-[11px]">
                  <div className="flex justify-between pb-2 border-b border-white/5">
                    <span className="text-[#94A3B8] font-black uppercase tracking-widest">Ringkasan</span>
                    <Truck size={13} className="text-emerald-500/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-y-2">
                    <span className="text-[#94A3B8] font-bold uppercase">Tujuan</span>
                    <span className="text-white font-black text-right truncate">{customer}</span>
                    <span className="text-[#94A3B8] font-bold uppercase">Sopir</span>
                    <span className="text-white font-black text-right truncate">{emp?.full_name || delivery.driver_name || '—'}</span>
                    {fmt(delivery.departed_at) && <>
                      <span className="text-[#94A3B8] font-bold uppercase">Berangkat</span>
                      <span className="text-white font-black text-right">{fmt(delivery.departed_at)}</span>
                    </>}
                    {fmt(delivery.arrived_at) && <>
                      <span className="text-[#94A3B8] font-bold uppercase">Tiba</span>
                      <span className="text-white font-black text-right">{fmt(delivery.arrived_at)}</span>
                    </>}
                    {duration && <>
                      <span className="text-[#94A3B8] font-bold uppercase">Lama Jalan</span>
                      <span className="text-blue-400 font-black text-right">{duration}</span>
                    </>}
                    {items.length > 0 && <>
                      <span className="text-[#94A3B8] font-bold uppercase">Muatan</span>
                      <span className="text-white font-black text-right">{items.length} jenis produk</span>
                    </>}
                  </div>
                </div>
                <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider">
                  Status pengiriman akan berubah menjadi Terkirim.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2">
            <AlertDialogCancel className="flex-1 h-11 bg-white/5 border-white/10 text-white font-black uppercase text-xs tracking-wider">
              Cek Lagi
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleComplete}
              className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 font-black uppercase text-xs tracking-wider text-white border-0"
            >
              Ya, Selesaikan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ── TambahTripSheet ───────────────────────────────────────────────────────────
const BLANK_FORM = {
  sale_id: null,
  employee_id: null,
  vehicle_type: '',
  vehicle_plate: '',
  delivery_area: '',
  delivery_date: new Date().toISOString().slice(0, 10),
  delivery_cost: 0,
  notes: '',
}

export function TambahTripSheet({ open, onClose, prefillSale, salesPending, employees, customers }) {
  const createDelivery = useCreateSembakoDelivery()
  const isLinkedMode = !!prefillSale
  const [destinationMode, setDestinationMode] = useState('customer')
  const [linkSale, setLinkSale] = useState(false)
  const [form, setForm] = useState(BLANK_FORM)

  React.useEffect(() => {
    if (open) {
      if (prefillSale) {
        const customer = prefillSale.sembako_customers || {}
        setForm({
          ...BLANK_FORM,
          sale_id: prefillSale.id,
          delivery_area: customer.address || '',
          delivery_date: new Date().toISOString().slice(0, 10),
        })
      } else {
        setForm(BLANK_FORM)
        setLinkSale(false)
        setDestinationMode('customer')
      }
    }
  }, [open, prefillSale])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const employeeOptions = [
    { value: '', label: '— Tanpa sopir / ambil sendiri —' },
    ...(employees || []).filter(e => e.status === 'aktif' && !e.is_deleted).map(e => ({
      value: e.id, label: `${e.full_name} (${e.role})`,
    })),
  ]
  const saleOptions = (salesPending || []).map(s => ({
    value: s.id,
    label: `${s.invoice_number} — ${s.sembako_customers?.customer_name || s.customer_name || 'Umum'}`,
  }))
  const customerOptions = [
    { value: '', label: '— Pilih customer —' },
    ...(customers || []).map(c => ({ value: c.id, label: `${c.customer_name} (${c.address || '-'})` })),
  ]

  const vehicleOptions = [
    { value: 'L300', label: 'L300 (Pick Up)' },
    { value: 'Traga', label: 'Traga (Pick Up)' },
    { value: 'Grand Max', label: 'Grand Max (Pick Up)' },
    { value: 'CDE', label: 'Engkel (CDE)' },
    { value: 'CDD', label: 'Double (CDD)' },
    { value: 'Motor', label: 'Motor' },
    { value: 'Lainnya', label: 'Lainnya / Manual' },
  ]

  const [isManualVehicle, setIsManualVehicle] = useState(false)

  async function handleSubmit() {
    const payload = {
      sale_id: isLinkedMode
        ? prefillSale.id
        : (linkSale && form.sale_id ? form.sale_id : null),
      employee_id:    form.employee_id || null,
      vehicle_type:   form.vehicle_type || null,
      vehicle_plate:  form.vehicle_plate || null,
      delivery_area:  form.delivery_area || null,
      delivery_date:  form.delivery_date,
      delivery_cost:  form.delivery_cost || 0,
      notes:          form.notes || null,
      status: 'pending',
    }
    try {
      await createDelivery.mutateAsync(payload)
      onClose()
    } catch { /* handled by hook */ }
  }

  const linkedCustomer = prefillSale?.sembako_customers || {}
  const linkedItems    = prefillSale?.sembako_sale_items || []

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="right"
        style={{
          background: C.bg, borderLeft: `1px solid ${C.border}`,
          maxWidth: '420px', width: '100%', padding: '24px', overflowY: 'auto',
        }}
      >
        <SheetHeader>
          <SheetTitle style={{ color: C.text, fontWeight: 900, fontSize: '18px' }}>
            {isLinkedMode ? 'Buat Pengiriman' : 'Tambah Trip'}
          </SheetTitle>
          <SheetDescription className="sr-only">Form pengiriman sembako</SheetDescription>
        </SheetHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px', paddingBottom: '80px' }}>

          {isLinkedMode && (
            <>
              <div style={{ background: 'rgba(234,88,12,0.06)', borderRadius: '12px', padding: '12px', border: `1px solid ${C.border}` }}>
                <p style={sLabel}>Invoice Terkait</p>
                <p style={{ fontSize: '14px', fontWeight: 800, color: C.accent, margin: 0 }}>
                  {prefillSale.invoice_number}
                </p>
                <p style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>
                  {prefillSale.sembako_customers?.customer_name || prefillSale.customer_name}
                </p>
              </div>

              {linkedItems.length > 0 && (
                <div>
                  <p style={sLabel}>Produk yang Dikirim</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {linkedItems.map((item, i) => (
                      <p key={i} style={{ fontSize: '12px', color: C.text, margin: 0 }}>
                        • {item.product_name} — {item.quantity} {item.unit}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p style={sLabel}>Tujuan Pengiriman</p>
                <input
                  style={sInput}
                  value={form.delivery_area}
                  onChange={e => set('delivery_area', e.target.value)}
                  placeholder={linkedCustomer.address || 'Alamat tujuan...'}
                />
              </div>
            </>
          )}

          {!isLinkedMode && (
            <>
              <div>
                <p style={sLabel}>Tujuan Pengiriman</p>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  {['customer', 'manual'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => { setDestinationMode(mode); set('delivery_area', '') }}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                        cursor: 'pointer', border: 'none',
                        background: destinationMode === mode ? C.accent : 'rgba(255,255,255,0.05)',
                        color: destinationMode === mode ? '#fff' : C.muted,
                        transition: 'all 0.2s',
                      }}
                    >
                      {mode === 'customer' ? 'Dari Customer' : 'Input Manual'}
                    </button>
                  ))}
                </div>
                {destinationMode === 'customer' ? (
                  <CustomSelect
                    value={customers.find(c => c.address === form.delivery_area)?.id || ''}
                    onChange={id => {
                      const c = customers.find(x => x.id === id)
                      set('delivery_area', c?.address || '')
                    }}
                    options={customerOptions}
                    placeholder="Pilih customer..."
                  />
                ) : (
                  <input
                    style={sInput}
                    value={form.delivery_area}
                    onChange={e => set('delivery_area', e.target.value)}
                    placeholder="Masukkan alamat tujuan..."
                  />
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <p style={{ ...sLabel, margin: 0 }}>Linked ke Invoice?</p>
                  <button
                    onClick={() => { setLinkSale(v => !v); set('sale_id', null) }}
                    style={{
                      width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
                      background: linkSale ? C.accent : 'rgba(255,255,255,0.1)',
                      position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: '3px',
                      left: linkSale ? '20px' : '3px',
                      width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
                {linkSale && (
                  <CustomSelect
                    value={form.sale_id || ''}
                    onChange={val => set('sale_id', val || null)}
                    options={[{ value: '', label: '— Tanpa invoice —' }, ...saleOptions]}
                    placeholder="Pilih invoice..."
                  />
                )}
              </div>
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <p style={sLabel}>Jenis Kendaraan</p>
              {!isManualVehicle ? (
                <CustomSelect
                  value={form.vehicle_type}
                  onChange={val => {
                    if (val === 'Lainnya') {
                      setIsManualVehicle(true)
                      set('vehicle_type', '')
                    } else {
                      set('vehicle_type', val)
                    }
                  }}
                  options={vehicleOptions}
                  placeholder="Pilih..."
                />
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    style={sInput}
                    value={form.vehicle_type}
                    onChange={e => set('vehicle_type', e.target.value)}
                    placeholder="Ketik jenis..."
                    autoFocus
                  />
                  <button 
                    onClick={() => setIsManualVehicle(false)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.accent, fontSize: '10px', fontWeight: 900, cursor: 'pointer' }}
                  >
                    BATAL
                  </button>
                </div>
              )}
            </div>
            <div>
              <p style={sLabel}>Plat Nomor</p>
              <input
                value={form.vehicle_plate}
                onChange={e => set('vehicle_plate', e.target.value)}
                placeholder="mis. B 1234 CD"
                style={{ ...sInput, textTransform: 'uppercase' }}
              />
            </div>
          </div>

          <div>
            <p style={sLabel}>Sopir / Kurir</p>
            <CustomSelect
              value={form.employee_id || ''}
              onChange={val => set('employee_id', val || null)}
              options={employeeOptions}
              placeholder="— Tanpa sopir —"
            />
          </div>

          <div>
            <p style={sLabel}>Tanggal Berangkat</p>
            <DatePicker
              value={form.delivery_date}
              onChange={val => set('delivery_date', val)}
              placeholder="Pilih tanggal"
            />
          </div>

          <div>
            <p style={sLabel}>Biaya Pengiriman (opsional)</p>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: '13px', pointerEvents: 'none' }}>Rp</span>
              <input
                type="number"
                style={{ ...sInput, paddingLeft: '32px' }}
                value={form.delivery_cost || ''}
                onChange={e => set('delivery_cost', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <p style={sLabel}>Catatan (opsional)</p>
            <textarea
              rows={2}
              style={{ ...sInput, resize: 'vertical', minHeight: '72px' }}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Instruksi khusus, dll..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={createDelivery.isPending || !form.delivery_date}
            style={{
              ...sBtn(true), width: '100%', padding: '14px', fontSize: '14px',
              opacity: (createDelivery.isPending || !form.delivery_date) ? 0.6 : 1,
            }}
          >
            {createDelivery.isPending ? 'Menyimpan...' : 'Simpan Trip'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
