import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

export function SembakoStatCard({ label, value, icon: Icon, color = 'accent', subLabel }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const colorStyles = {
    accent: {
      bg: '#F8FAFC',
      border: '#E2E8F0',
      title: '#64748B',
      value: '#0F172A',
      sub: '#64748B',
      icon: '#64748B',
    },
    amber: {
      bg: '#FFFBEB',
      border: '#FDE68A',
      title: '#B45309',
      value: '#0F172A',
      sub: '#B45309',
      icon: '#D97706',
    },
    green: {
      bg: '#F0FDF4',
      border: '#BBF7D0',
      title: '#15803D',
      value: '#0F172A',
      sub: '#15803D',
      icon: '#16A34A',
    },
    red: {
      bg: '#FEF2F2',
      border: '#FEE2E2',
      title: '#B91C1C',
      value: '#0F172A',
      sub: '#B91C1C',
      icon: '#EF4444',
    },
  }

  const cs = colorStyles[color] || colorStyles.accent

  return (
    <Card
      className="relative overflow-hidden shadow-sm rounded-[22px] p-5 group transition-all hover:scale-[1.02] border"
      style={{
        background: cs.bg,
        borderColor: cs.border,
      }}
    >
      {Icon && (
        <div className="absolute top-3 right-3 p-2.5 opacity-20 group-hover:opacity-40 transition-opacity" style={{ color: cs.icon }}>
          <Icon size={40} strokeWidth={1.8} />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-start text-left">
        <p
          className={cn(
            'font-black uppercase tracking-[0.18em] mb-1.5',
            isDesktop ? 'text-[11px]' : 'text-[11px]'
          )}
          style={{ color: cs.title }}
        >
          {label}
        </p>
        <h3 className="text-2xl font-black tabular-nums tracking-tight mb-1" style={{ color: cs.value }}>
          {value}
        </h3>
        {subLabel && (
          <p
            className={cn(
              'font-bold uppercase tracking-widest italic',
              isDesktop ? 'text-[10px]' : 'text-[10px]'
            )}
            style={{ color: cs.sub }}
          >
            {subLabel}
          </p>
        )}
      </div>
    </Card>
  )
}

export function SembakoFilterPill({ label, active, onClick }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return (
    <button
      onClick={onClick}
      className={cn(
        'h-10 px-6 rounded-2xl font-black uppercase tracking-widest transition-all border',
        isDesktop ? 'text-[10px]' : 'text-[11px]',
        active
          ? 'bg-[#0F172A] border-[#0F172A] text-white shadow-sm'
          : 'bg-slate-50 text-slate-650 hover:bg-slate-100 border-slate-200 hover:text-slate-900'
      )}
    >
      {label}
    </button>
  )
}

export function SembakoEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  color = 'accent',
}) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const colors = {
    accent: 'text-slate-600 bg-slate-50 border-slate-200 hover:border-slate-300',
    amber: 'text-amber-600 bg-amber-50 border-amber-200 hover:border-amber-300',
    green: 'text-emerald-600 bg-emerald-50 border-emerald-250 hover:border-emerald-350',
    red: 'text-rose-600 bg-rose-50 border-rose-250 hover:border-rose-350',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-12 text-center"
    >
      <div className={cn(
        'w-20 h-20 rounded-[32px] border flex items-center justify-center mb-6 transition-all shadow-sm',
        colors[color]
      )}>
        {Icon ? <Icon size={32} strokeWidth={2} /> : null}
      </div>

      <h3 className="font-display text-lg font-black text-slate-900 uppercase tracking-tight">
        {title}
      </h3>
      <p className="text-slate-500 text-sm font-semibold mt-2 max-w-[260px] leading-relaxed">
        {description}
      </p>

      {actionLabel && (
        <Button
          variant="outline"
          onClick={onAction}
          className={cn(
            'mt-8 h-12 px-6 rounded-2xl border-slate-200 bg-white text-slate-800 font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm',
            isDesktop ? 'text-[11px]' : 'text-[10px]'
          )}
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}

export function SembakoErrorState({
  error,
  onRetry,
  title = "Gagal Memuat Data",
}) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-12 text-center"
    >
      <div className="w-20 h-20 rounded-[32px] border flex items-center justify-center mb-6 text-rose-600/60 bg-rose-50 border-rose-200 shadow-sm">
        <AlertCircle size={32} strokeWidth={2} />
      </div>

      <h3 className="font-display text-lg font-black text-slate-900 uppercase tracking-tight">
        {title}
      </h3>
      <p className="text-rose-600 text-sm font-semibold mt-2 max-w-[320px] leading-relaxed tracking-wide">
        {error?.message || "Koneksi ke server terputus atau data tidak dapat dimuat."}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className={cn(
            'mt-8 h-12 px-6 rounded-2xl border-slate-200 bg-white text-slate-800 font-black uppercase tracking-widest hover:bg-slate-50 shadow-sm',
            isDesktop ? 'text-[11px]' : 'text-[10px]'
          )}
        >
          Coba Lagi
        </Button>
      )}
    </motion.div>
  )
}
