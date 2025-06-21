'use client'

import { CalendarIcon, X } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useLanguageStore } from '@/lib/stores/language-store'

interface DateRangePickerProps {
  className?: string
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
}

const translations = {
  pickDateRange: {
    ru: 'Выберите диапазон дат',
    ka: 'აირჩიეთ თარიღების დიაპაზონი'
  },
  clear: {
    ru: 'Очистить',
    ka: 'გასუფთავება'
  }
}

export function DateRangePicker({
  className,
  dateRange,
  onDateRangeChange
}: DateRangePickerProps) {
  const { language } = useLanguageStore()
  const t = (key: keyof typeof translations) => translations[key][language]

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDateRangeChange(undefined)
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !dateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'dd.MM.yyyy')} -{' '}
                  {format(dateRange.to, 'dd.MM.yyyy')}
                </>
              ) : (
                format(dateRange.from, 'dd.MM.yyyy')
              )
            ) : (
              <span>{t('pickDateRange')}</span>
            )}
            {dateRange && (
              <X
                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={1}
          />
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={handleClear}
            >
              {t('clear')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}