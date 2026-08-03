import * as React from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DateRangePicker({
  value,
  onChange,
  className,
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "h-14 w-full rounded-2xl bg-[#111C24] border-white/5 px-4 flex items-center justify-start gap-3 hover:bg-white/5 hover:border-white/10 transition-all text-white font-black text-xs uppercase tracking-widest",
              !value?.from && "text-[#4B6478]"
            )}
          >
            <CalendarIcon size={18} className={cn("transition-colors", value?.from ? "text-[#021a02]" : "text-[#4B6478]")} />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "dd MMM yyyy", { locale: id })} -{" "}
                  {format(value.to, "dd MMM yyyy", { locale: id })}
                </>
              ) : (
                format(value.from, "dd MMM yyyy", { locale: id })
              )
            ) : (
              <span>PILIH RENTANG TANGGAL</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            locale={id}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
