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
      bg: 'linear-gradient(135deg, rgba(234,88,12,0.18), rgba(234,88,12,0.04))',
      border: 'rgba(234,88,12,0.3)',
      title: '#FB923C',
      value: '#FFFFFF',
      sub: '#FED7AA',
      icon: '#EA580C',
    },
    amber: {
      bg: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.04))',
      border: 'rgba(245,158,11,0.3)',
      title: '#FBBF24',
      value: '#FFFFFF',
      sub: '#FDE68A',
      icon: '#F59E0B',
    },
    green: {
      bg: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.04))',
      border: 'rgba(16,185,129,0.3)',
      title: '#34D399',
      value: '#FFFFFF',
      sub: '#A7F3D0',
      icon: '#10B981',
    },
    red: {
      bg: 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.04))',
      border: 'rgba(239,68,68,0.3)',
      title: '#F87171',
      value: '#FFFFFF',
      sub: '#FCA5A5',
      icon: '#EF4444',
    },
  }

  const cs = colorStyles[color] || colorStyles.accent

  return (
    <Card
      className="relative overflow-hidden shadow-xl rounded-[22px] p-5 group transition-all hover:scale-[1.02]"
      style={{
        background: cs.bg,
        borderColor: cs.border,
      }}
    >
      {Icon && (
        <div className="absolute top-3 right-3 p-2.5 opacity-30 group-hover:opacity-60 transition-opacity" style={{ color: cs.icon }}>
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
        <h3 className="text-2xl font-black tabular-nums tracking-tight text-white mb-1">
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
        'h-10 px-6 rounded-2xl font-black uppercase tracking-widest transition-all',
        isDesktop ? 'text-[10px]' : 'text-[11px]',
        active
          ? 'bg-[#EA580C] text-white shadow-lg shadow-orange-950/20'
          : 'bg-[#1C1208] text-[#FDE68A]/80 hover:bg-[#231A0E] hover:text-white border border-[#EA580C]/20'
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
    accent: 'text-[#EA580C]/30 bg-[#EA580C]/5 border-[#EA580C]/10 hover:border-[#EA580C]/20',
    amber: 'text-[#F59E0B]/30 bg-[#F59E0B]/5 border-[#F59E0B]/10 hover:border-[#F59E0B]/20',
    green: 'text-[#021a02]/30 bg-[#021a02]/5 border-[#021a02]/10 hover:border-[#021a02]/20',
    red: 'text-[#EF4444]/30 bg-[#EF4444]/5 border-[#EF4444]/10 hover:border-[#EF4444]/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-12 text-center"
    >
      <div className={cn(
        'w-20 h-20 rounded-[32px] border flex items-center justify-center mb-6 transition-all',
        colors[color]
      )}>
        {Icon ? <Icon size={32} strokeWidth={2} /> : null}
      </div>

      <h3 className="font-display text-lg font-black text-[#FEF3C7] uppercase tracking-tight">
        {title}
      </h3>
      <p className="text-[#FDE68A]/80 text-sm font-bold mt-2 max-w-[260px] leading-relaxed uppercase tracking-wide italic">
        {description}
      </p>

      {actionLabel && (
        <Button
          variant="outline"
          onClick={onAction}
          className={cn(
            'mt-8 h-12 px-6 rounded-2xl border-[#EA580C]/10 bg-[#1C1208] text-[#FEF3C7] font-black uppercase tracking-widest hover:bg-[#231A0E]',
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
      <div className="w-20 h-20 rounded-[32px] border flex items-center justify-center mb-6 text-[#EF4444]/60 bg-[#EF4444]/5 border-[#EF4444]/20">
        <AlertCircle size={32} strokeWidth={2} />
      </div>

      <h3 className="font-display text-lg font-black text-[#FEF3C7] uppercase tracking-tight">
        {title}
      </h3>
      <p className="text-[#EF4444]/80 text-sm font-bold mt-2 max-w-[320px] leading-relaxed tracking-wide">
        {error?.message || "Koneksi ke server terputus atau data tidak dapat dimuat."}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className={cn(
            'mt-8 h-12 px-6 rounded-2xl border-[#EF4444]/20 bg-[#1C1208] text-[#FEF3C7] font-black uppercase tracking-widest hover:bg-[#EF4444]/10',
            isDesktop ? 'text-[11px]' : 'text-[10px]'
          )}
        >
          Coba Lagi
        </Button>
      )}
    </motion.div>
  )
}
