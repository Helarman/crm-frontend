'use client'

import { useState, useEffect } from 'react'
import { format, Locale } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarIcon, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const DatePickerWithTime = ({
  date,
  onChange,
  placeholder = "Выберите дату и время",
  locale = ru,
  error,
  showClearButton = true,
}: {
  date: Date | undefined | null;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  locale?: Locale;
  error?: string;
  showClearButton?: boolean;
}) => {
  const [timeValue, setTimeValue] = useState(
    date ? format(date, 'HH:mm') : '00:00'
  );
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (date) {
      setTimeValue(format(date, 'HH:mm'));
    }
  }, [date]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange(undefined);
      return;
    }

    const [hours, minutes] = timeValue.split(':').map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours, minutes);
    onChange(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    setTimeValue(time);

    if (date) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes);
      onChange(newDate);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setTimeValue('00:00');
  };

  const handleNow = () => {
    const now = new Date();
    setTimeValue(format(now, 'HH:mm'));
    onChange(now);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={error ? "destructive" : "outline"}
              className={cn(
                "w-full h-12 justify-start text-left font-normal transition-all duration-200",
                "hover:border-primary/70 hover:shadow-sm",
                error 
                  ? "border-red-500 focus:ring-2 focus:ring-red-500/20" 
                  : "border-input focus:ring-2 focus:ring-primary/20",
                "group",
                !date && "text-muted-foreground"
              )}
              type="button"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <div className={cn(
                    "p-1.5 rounded-md mr-3 transition-colors",
                    error 
                      ? "bg-red-500/10 text-red-600" 
                      : "bg-primary/10 text-primary"
                  )}>
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">
                    {date ? format(date, 'PPP HH:mm', { locale }) : placeholder}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {date && (
                    <div className="flex items-center px-2 py-1 rounded-md bg-primary/5 text-primary text-sm">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(date, 'HH:mm')}
                    </div>
                  )}
                  {showClearButton && date && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      onClick={handleClear}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0 rounded-xl shadow-lg border"
            align="start"
          >
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Выберите дату
                </h3>
                <Calendar
                  mode="single"
                  selected={date || undefined}
                  onSelect={handleDateSelect}
                  initialFocus
                  className="rounded-md"
                  locale={locale}
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: cn(
                      "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
                      "[&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md"
                    ),
                    day: cn(
                      "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                      "hover:bg-accent hover:text-accent-foreground"
                    ),
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside: "day-outside text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                />
              </div>
              
              <div className="space-y-3 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    Выберите время
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={timeValue}
                      onChange={handleTimeChange}
                      className="h-10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleNow}
                      className="h-10 whitespace-nowrap"
                    >
                      Сейчас
                    </Button>
                  </div>
                </div>

                {date && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Выбрано:</span>
                      <span className="font-semibold">
                        {format(date, 'PPP HH:mm', { locale })}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsOpen(false)}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => setIsOpen(false)}
                  >
                    Применить
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
      </div>
      
      {error && (
        <div className="flex items-center gap-1.5 text-sm text-red-500 animate-in fade-in slide-in-from-top-1">
          <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
          {error}
        </div>
      )}
    </div>
  );
};