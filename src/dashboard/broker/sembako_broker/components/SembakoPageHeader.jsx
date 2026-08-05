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
    <header className={`px-4 sm:px-6 py-5 ${isDesktop ? 'relative' : 'sticky top-[60px]'} bg-background/95 backdrop-blur-md z-30 space-y-4 border-b border-border/50`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-sans text-2xl sm:text-3xl font-black text-foreground tracking-tight uppercase leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="font-bold text-xs text-muted-foreground uppercase mt-1 tracking-wider">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {onSearchChange && (
            <div className="relative max-w-xs w-full hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9 h-10 w-full bg-card border-border/60 rounded-xl font-medium text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-amber-500/40"
              />
            </div>
          )}
          {actionButton}
        </div>
      </div>

      {onSearchChange && (
        <div className="md:hidden relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-10 w-full bg-card border-border/60 rounded-xl font-medium text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-amber-500/40"
          />
        </div>
      )}

      {filters.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange?.(filter.id)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none',
                activeFilter === filter.id
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/60 hover:border-border'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {isViewOnly && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2 text-amber-400 text-xs font-medium">
          <Eye className="w-4 h-4 shrink-0" />
          <span>
            Mode <strong className="font-bold">View Only</strong> (Hanya bisa melihat data)
          </span>
        </div>
      )}
    </header>
  )
}
