import * as React from 'react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { CalendarIcon, X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { MobileWheelDatePicker } from '@/components/ui/MobileWheelDatePicker'

export function DatePicker({ id, value, onChange, placeholder, className, allowClear = true }) {
  const isMobile = useIsMobile()
  const dateValue = value ? (value instanceof Date ? value : new Date(value)) : null

  if (isMobile) {
    return (
      <div className="relative w-full">
        <MobileWheelDatePicker 
          value={value} 
          onChange={onChange} 
          placeholder={placeholder || 'PILIH TANGGAL'}
        />
        {value && allowClear && (
          <div
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onChange(null)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full cursor-pointer transition-colors z-10"
          >
            <X size={14} className="text-white/50 hover:text-white" />
          </div>
        )}
      </div>
    )
  }

  return (
    <Popover>
      <div className="relative w-full">
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "h-14 w-full rounded-2xl bg-[#111C24] border-white/5 px-4 flex items-center justify-start gap-3 hover:bg-white/5 hover:border-white/10 transition-all",
              !value && "text-[#4B6478]",
              value && "text-white font-black text-xs uppercase tracking-widest",
              className
            )}
          >
            <CalendarIcon size={18} className={cn("transition-colors", value ? "text-[#021a02]" : "text-[#4B6478]")} />
            <span className="flex-1 text-left">
              {dateValue && !isNaN(dateValue.getTime())
                ? format(dateValue, 'dd MMM yyyy', { locale: idLocale })
                : (placeholder || 'PILIH TANGGAL')}
            </span>
          </Button>
        </PopoverTrigger>
        {value && allowClear && (
          <div
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onChange(null)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full cursor-pointer transition-colors z-10"
          >
            <X size={14} className="text-white/50 hover:text-white" />
          </div>
        )}
      </div>
      <PopoverContent align="start" sideOffset={4} collisionPadding={16} className="w-auto p-0 border-none bg-transparent shadow-none">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, 'yyyy-MM-dd'))
            }
          }}
          locale={idLocale}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
