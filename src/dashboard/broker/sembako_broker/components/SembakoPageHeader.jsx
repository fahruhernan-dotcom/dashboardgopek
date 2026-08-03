import React from 'react'
import { Search, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function SembakoPageHeader({
  title,
  subtitle,
  isDesktop,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Cari data...',
  filters = [],
  activeFilter,
  onFilterChange,
  actionButton,
  isViewOnly = false,
}) {
  return (
    <header className={`px-5 pb-4 ${isDesktop ? 'pt-8' : 'pt-4'} ${isDesktop ? 'relative' : 'sticky top-[64px]'} bg-[#06090F]/85 backdrop-blur-md z-30 space-y-4 border-b border-[#EA580C]/10`}>
      <div className="flex justify-between items-center gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-black text-[#FEF3C7] tracking-tight uppercase leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className={cn(
              'font-black text-[#92400E] uppercase mt-1 tracking-[0.18em]',
              isDesktop ? 'text-[10px]' : 'text-[11px]'
            )}>
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          {onSearchChange && (
            <div className="relative max-w-xs w-full hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#92400E]" />
              <Input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9 h-10 w-full bg-[#1C1208] border-[#EA580C]/10 rounded-xl font-bold text-xs text-[#FEF3C7] placeholder:text-[#92400E] focus-visible:ring-1 focus-visible:ring-[#EA580C]/40"
              />
            </div>
          )}
          {actionButton}
        </div>
      </div>

      {onSearchChange && (
        <div className="md:hidden relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#92400E]" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-10 w-full bg-[#1C1208] border-[#EA580C]/10 rounded-xl font-bold text-xs text-[#FEF3C7] placeholder:text-[#92400E] focus-visible:ring-1 focus-visible:ring-[#EA580C]/40"
          />
        </div>
      )}

      {filters.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange?.(filter.id)}
              className={cn(
                'px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap',
                activeFilter === filter.id
                  ? 'bg-[#EA580C] text-white shadow-lg shadow-orange-950/20'
                  : 'bg-[#1C1208] text-[#92400E] hover:text-[#FEF3C7] border border-[#EA580C]/10'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {isViewOnly && (
        <div className="bg-[#1C1208] border border-[#EA580C]/10 rounded-xl px-4 py-2 flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#92400E]" />
          <span className="text-[#92400E] text-xs">
            Kamu dalam mode <strong className="text-[#FDE68A]">View Only</strong> dan hanya bisa melihat data
          </span>
        </div>
      )}
    </header>
  )
}
