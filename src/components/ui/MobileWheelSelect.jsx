import React, { useState, useEffect, useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './sheet'
import { Button } from './button'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEM_HEIGHT = 40
const VISIBLE_ITEMS = 5
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS // 200px

function WheelColumn({ items, value, onChange }) {
  const scrollRef = useRef(null)
  const isProgrammaticScroll = useRef(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    const index = items.findIndex(item => item.value === value)
    if (scrollRef.current && index !== -1) {
      isProgrammaticScroll.current = true
      scrollRef.current.scrollTop = index * ITEM_HEIGHT
      setTimeout(() => { isProgrammaticScroll.current = false }, 100)
    }
  }, [value, items])

  const handleScroll = (e) => {
    if (isProgrammaticScroll.current) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    debounceRef.current = setTimeout(() => {
      const y = e.target.scrollTop
      const index = Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM_HEIGHT)))
      
      if (items[index] && items[index].value !== value) {
        onChange(items[index].value)
      }
    }, 150)
  }

  return (
    <div className="flex-1 relative overflow-hidden touch-none" style={{ height: CONTAINER_HEIGHT, touchAction: 'none' }}>
      {/* Highlight Box */}
      <div 
        className="absolute w-full left-0 right-0 pointer-events-none bg-white/[0.03] border-y border-white/[0.08] z-0"
        style={{ top: '50%', transform: 'translateY(-50%)', height: ITEM_HEIGHT }}
      />
      
      {/* Scrollable Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto no-scrollbar snap-y snap-mandatory relative z-10"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Top Padding */}
        <div style={{ height: (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2 }} className="snap-align-none" />
        
        {items.map((item) => (
          <div 
            key={item.value} 
            className={cn(
              "flex items-center justify-center snap-center transition-all duration-200 px-4 text-center line-clamp-1",
              item.value === value 
                ? "text-[17px] text-white font-semibold tracking-wide" 
                : "text-[15px] text-slate-500 font-medium opacity-50"
            )}
            style={{ height: ITEM_HEIGHT }}
          >
            {item.label}
          </div>
        ))}

        {/* Bottom Padding */}
        <div style={{ height: (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2 }} className="snap-align-none" />
      </div>
    </div>
  )
}

export function MobileWheelSelect({ 
  value, 
  onChange, 
  options = [],
  placeholder = "Pilih Opsi",
  triggerClassName
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempValue, setTempValue] = useState(value || (options[0] ? options[0].value : ''))

  // Reset temp value when opened
  useEffect(() => {
    if (isOpen) {
      setTempValue(value || (options[0] ? options[0].value : ''))
    }
  }, [isOpen, value, options])

  const handleConfirm = () => {
    onChange(tempValue)
    setIsOpen(false)
  }

  const selectedOption = options.find(o => o.value === value)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-14 w-full rounded-2xl bg-[#111C24] border-white/5 px-4 flex items-center justify-between hover:bg-white/5 hover:border-white/10 transition-all",
            !value && "text-[#4B6478]",
            value && "text-slate-100 font-medium",
            triggerClassName
          )}
        >
          <span className="flex-1 text-left truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={18} className="text-[#4B6478] opacity-50" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="bg-[#111C24] border-t border-white/10 px-0 pb-6 pt-4 rounded-t-3xl">
        <SheetHeader className="px-6 mb-4">
          <SheetTitle className="text-left text-lg text-white font-bold">{placeholder}</SheetTitle>
        </SheetHeader>
        
        <div className="flex px-4 items-center justify-center relative select-none">
          {/* Fading Overlays */}
          <div className="absolute inset-x-0 top-0 h-[60px] bg-gradient-to-b from-[#111C24] via-[#111C24]/80 to-transparent z-20 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-[60px] bg-gradient-to-t from-[#111C24] via-[#111C24]/80 to-transparent z-20 pointer-events-none" />
          
          <WheelColumn items={options} value={tempValue} onChange={setTempValue} />
        </div>

        <div className="px-6 mt-8">
          <Button 
            onClick={handleConfirm}
            className="w-full h-14 bg-white hover:bg-slate-100 text-[#111C24] rounded-2xl font-bold text-[15px] shadow-lg shadow-white/5"
          >
            Pilih
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
