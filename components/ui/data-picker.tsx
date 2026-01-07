import React, { useState, useEffect, useRef } from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface DatePickerProps {
  date?: Date;
  setDate?: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  format?: string;
  minDate?: Date;
  maxDate?: Date;
}

const DatePicker: React.FC<DatePickerProps> = ({
  date,
  setDate,
  placeholder = 'Выберите дату',
  disabled = false,
  className = '',
  format = 'dd.MM.yyyy',
  minDate,
  maxDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(date || null);
  const [currentMonth, setCurrentMonth] = useState(date ? new Date(date) : new Date());
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');
  const [yearRange, setYearRange] = useState({ start: 1900, end: 2100 });
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom');
  const [maxCalendarHeight, setMaxCalendarHeight] = useState<number | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (date) {
      setSelectedDate(date);
      setCurrentMonth(date);
    }
  }, [date]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setView('days');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Функция для расчета максимальной высоты календаря
  const calculateMaxHeight = () => {
    if (!inputRef.current) return null;

    const inputRect = inputRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const safeMargin = 20; // Отступ от края экрана

    if (position === 'bottom') {
      const availableSpace = windowHeight - inputRect.bottom - safeMargin;
      return Math.max(100, Math.min(400, availableSpace)); // Минимум 100px, максимум 400px
    } else {
      const availableSpace = inputRect.top - safeMargin;
      return Math.max(100, Math.min(400, availableSpace));
    }
  };

  // Функция для проверки доступного пространства
  const checkAvailableSpace = () => {
    if (!inputRef.current) return 'bottom';

    const inputRect = inputRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;
    const calendarHeight = 400; // Желаемая высота календаря

    // Если внизу недостаточно места, а сверху достаточно - открываем наверх
    if (spaceBelow < calendarHeight && spaceAbove >= calendarHeight) {
      return 'top';
    }
    return 'bottom';
  };

  const handleToggleCalendar = () => {
    if (disabled) return;

    if (!isOpen) {
      // Перед открытием проверяем, где лучше разместить календарь
      const newPosition = checkAvailableSpace();
      setPosition(newPosition);
      
      // Рассчитываем максимальную высоту для календаря
      setTimeout(() => {
        const maxHeight = calculateMaxHeight();
        setMaxCalendarHeight(maxHeight);
      }, 0);
    }

    setIsOpen(!isOpen);
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return format
      .replace('dd', day)
      .replace('MM', month)
      .replace('yyyy', year.toString())
      .replace('yy', year.toString().slice(-2));
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateDisabled = (checkDate: Date): boolean => {
    if (minDate && checkDate < minDate) return true;
    if (maxDate && checkDate > maxDate) return true;
    return false;
  };

  const handleDateSelect = (newDate: Date) => {
    if (isDateDisabled(newDate)) return;

    setSelectedDate(newDate);
    setDate?.(newDate);
    setIsOpen(false);
    setView('days');
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentMonth.getFullYear(), monthIndex, 1);
    setCurrentMonth(newDate);
    setView('days');
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(year, currentMonth.getMonth(), 1);
    setCurrentMonth(newDate);
    setView('months');
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'prev' ? -1 : 1));
    setCurrentMonth(newMonth);
  };

  const navigateYearRange = (direction: 'prev' | 'next') => {
    const range = 12;
    setYearRange(prev => ({
      start: prev.start + (direction === 'prev' ? -range : range),
      end: prev.end + (direction === 'prev' ? -range : range)
    }));
  };

  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={`header-${i}`} className="text-center text-sm font-medium text-gray-500 py-2">
          {weekDays[i]}
        </div>
      );
    }

    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const isSelected = selectedDate &&
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      const isDisabled = isDateDisabled(date);

      const dayClass = `
        h-10 w-10 flex items-center justify-center rounded-md text-sm transition-colors
        ${isSelected
          ? 'bg-blue-600 text-white'
          : isToday
            ? 'bg-blue-100 text-blue-600 font-medium'
            : 'hover:bg-gray-100'
        }
        ${isDisabled
          ? 'text-gray-300 cursor-not-allowed hover:bg-transparent'
          : 'cursor-pointer'
        }
      `;

      days.push(
        <button
          key={`day-${i}`}
          type="button"
          onClick={() => !isDisabled && handleDateSelect(date)}
          disabled={isDisabled}
          className={dayClass}
        >
          {i}
        </button>
      );
    }

    return days;
  };

  const renderMonths = () => {
    const months = [
      'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
      'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
    ];

    return months.map((month, index) => (
      <button
        key={month}
        type="button"
        onClick={() => handleMonthSelect(index)}
        className="h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
      >
        {month}
      </button>
    ));
  };

  const renderYears = () => {
    const years = [];
    for (let year = yearRange.start; year <= yearRange.end; year++) {
      const isSelected = selectedDate && selectedDate.getFullYear() === year;

      years.push(
        <button
          key={year}
          type="button"
          onClick={() => handleYearSelect(year)}
          className={`
            h-12 flex items-center justify-center rounded-lg transition-colors
            ${isSelected
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-100'
            }
          `}
        >
          {year}
        </button>
      );
    }
    return years;
  };

  // При изменении вью или переключении месяцев пересчитываем высоту
  useEffect(() => {
    if (isOpen) {
      const maxHeight = calculateMaxHeight();
      setMaxCalendarHeight(maxHeight);
    }
  }, [isOpen, view, currentMonth, position]);

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      {isOpen && (
        <div
          ref={calendarRef}
          className={`
            absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[280px]
            ${position === 'bottom'
              ? 'top-full mt-1 mb-1'
              : 'bottom-full mb-1'
            }
          `}
          style={{
            maxHeight: maxCalendarHeight ? `${maxCalendarHeight}px` : '400px',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 pt-1 pb-1">
            <div className="flex items-center space-x-2 w-full justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => view === 'days' ? navigateMonth('prev') : navigateYearRange('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView(view === 'days' ? 'months' : view === 'months' ? 'years' : 'days')}
              >
                <span className="text-sm">
                  {view === 'days' && (
                    `${currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`
                  )}
                  {view === 'months' && `${currentMonth.getFullYear()}`}
                  {view === 'years' && `${yearRange.start} - ${yearRange.end}`}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => view === 'days' ? navigateMonth('next') : navigateYearRange('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className={`
            grid gap-1 pb-1
            ${view === 'days' ? 'grid-cols-7' : 'grid-cols-4'}
          `}>
            {view === 'days' && renderDays()}
            {view === 'months' && renderMonths()}
            {view === 'years' && renderYears()}
          </div>

          {selectedDate && (
            <div className="sticky bottom-0 bg-white pt-3 mt-2 border-t border-gray-200 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateSelect(new Date())}
              >
                Сегодня
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedDate(null);
                  setDate?.(null as any);
                }}
              >
                Сбросить
              </Button>
            </div>
          )}
        </div>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={formatDate(selectedDate)}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          onClick={handleToggleCalendar}
          className={`
            w-full px-3 py-2 rounded-md border transition-colors text-sm
            bg-white text-gray-900 placeholder-gray-400
            border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            cursor-pointer focus:outline-none
          `}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default DatePicker;