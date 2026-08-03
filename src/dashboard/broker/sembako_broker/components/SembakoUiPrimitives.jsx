import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'

export function SembakoStatCard({ label, value, icon: Icon, color = 'accent', subLabel }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const colorClasses = {
    accent: 'from-[#EA580C]/20 to-[#EA580C]/5 text-[#EA580C] border-[#EA580C]/10',
    amber: 'from-[#F59E0B]/20 to-[#F59E0B]/5 text-[#F59E0B] border-[#F59E0B]/10',
    green: 'from-[#021a02]/20 to-[#021a02]/5 text-[#021a02] border-[#021a02]/10',
    red: 'from-[#EF4444]/20 to-[#EF4444]/5 text-[#EF4444] border-[#EF4444]/10',
  }

  return (
    <Card className={cn(
      'relative overflow-hidden bg-gradient-to-br border shadow-2xl rounded-[28px] p-6 group transition-all hover:scale-[1.02]',
      colorClasses[color]
    )}>
      {Icon && (
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Icon size={48} strokeWidth={1.5} />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-start text-left">
        <p className={cn(
          'font-black uppercase tracking-[0.2em] opacity-60 mb-1',
          isDesktop ? 'text-[10px]' : 'text-[11px]'
        )}>
          {label}
        </p>
        <h3 className="text-2xl font-black tabular-nums tracking-tight text-[#FEF3C7]">
          {value}
        </h3>
        {subLabel && (
          <p className={cn(
            'font-bold mt-1 opacity-50 uppercase tracking-widest italic text-[#92400E]',
            isDesktop ? 'text-[9px]' : 'text-[10px]'
          )}>
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
          : 'bg-[#1C1208] text-[#92400E] hover:bg-[#231A0E] hover:text-[#FEF3C7] border border-[#EA580C]/10'
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
      <p className="text-[#92400E] text-sm font-bold mt-2 max-w-[260px] leading-relaxed uppercase tracking-wide italic">
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
