import React, { useState, useEffect, useRef } from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight, Clock, Calendar, Plus, Minus } from 'lucide-react';

export interface DateTimePickerProps {
  date?: Date;
  setDate?: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  minDate?: Date;
  maxDate?: Date;
  showSeconds?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  date,
  setDate,
  placeholder = 'Выберите дату и время',
  disabled = false,
  className = '',
  dateFormat = 'dd.MM.yyyy',
  timeFormat = '24h',
  minDate,
  maxDate,
  showSeconds = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(date || null);
  const [currentMonth, setCurrentMonth] = useState(date ? new Date(date) : new Date());
  const [view, setView] = useState<'days' | 'months' | 'years' | 'time'>('days');
  const [yearRange, setYearRange] = useState({ start: 1900, end: 2100 });
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom');
  const [maxCalendarHeight, setMaxCalendarHeight] = useState<number | null>(null);
  const [timeInput, setTimeInput] = useState({
    hours: date ? date.getHours().toString().padStart(2, '0') : '00',
    minutes: date ? date.getMinutes().toString().padStart(2, '0') : '00',
    seconds: date ? date.getSeconds().toString().padStart(2, '0') : '00',
    ampm: date ? (date.getHours() >= 12 ? 'PM' : 'AM') : 'AM'
  });

  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const hoursInputRef = useRef<HTMLInputElement>(null);
  const minutesInputRef = useRef<HTMLInputElement>(null);
  const secondsInputRef = useRef<HTMLInputElement>(null);

  const time = {
    hours: parseInt(timeInput.hours) || 0,
    minutes: parseInt(timeInput.minutes) || 0,
    seconds: parseInt(timeInput.seconds) || 0,
    ampm: timeInput.ampm
  };

  useEffect(() => {
    if (date) {
      setSelectedDate(date);
      setCurrentMonth(date);
      setTimeInput({
        hours: date.getHours().toString().padStart(2, '0'),
        minutes: date.getMinutes().toString().padStart(2, '0'),
        seconds: date.getSeconds().toString().padStart(2, '0'),
        ampm: date.getHours() >= 12 ? 'PM' : 'AM'
      });
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

  useEffect(() => {
    if (view === 'time' && hoursInputRef.current) {
      setTimeout(() => {
        hoursInputRef.current?.focus();
        hoursInputRef.current?.select();
      }, 10);
    }
  }, [view]);

  const calculateMaxHeight = () => {
    if (!inputRef.current) return null;
    const inputRect = inputRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const safeMargin = 20;

    if (position === 'bottom') {
      const availableSpace = windowHeight - inputRect.bottom - safeMargin;
      return Math.max(100, Math.min(450, availableSpace));
    } else {
      const availableSpace = inputRect.top - safeMargin;
      return Math.max(100, Math.min(450, availableSpace));
    }
  };

  const checkAvailableSpace = () => {
    if (!inputRef.current) return 'bottom';
    const inputRect = inputRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - inputRect.bottom;
    const spaceAbove = inputRect.top;
    const calendarHeight = 450;

    if (spaceBelow < calendarHeight && spaceAbove >= calendarHeight) {
      return 'top';
    }
    return 'bottom';
  };

  const handleToggleCalendar = () => {
    if (disabled) return;

    if (!isOpen) {
      const newPosition = checkAvailableSpace();
      setPosition(newPosition);
      setTimeout(() => {
        setMaxCalendarHeight(calculateMaxHeight());
      }, 0);
    }

    setIsOpen(!isOpen);
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    let timeStr = '';
    if (timeFormat === '12h') {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      timeStr = `${hours.toString().padStart(2, '0')}:${minutes}${showSeconds ? `:${seconds}` : ''} ${ampm}`;
    } else {
      timeStr = `${hours.toString().padStart(2, '0')}:${minutes}${showSeconds ? `:${seconds}` : ''}`;
    }

    const dateStr = dateFormat
      .replace('dd', day)
      .replace('MM', month)
      .replace('yyyy', year.toString())
      .replace('yy', year.toString().slice(-2));

    return `${dateStr} ${timeStr}`;
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateTimeDisabled = (checkDate: Date): boolean => {
    if (minDate && checkDate < minDate) return true;
    if (maxDate && checkDate > maxDate) return true;
    return false;
  };

  const createDateTime = (datePart: Date): Date => {
    let hours = time.hours;
    
    if (timeFormat === '12h') {
      if (time.ampm === 'PM' && hours !== 12) {
        hours += 12;
      } else if (time.ampm === 'AM' && hours === 12) {
        hours = 0;
      }
    }
    
    return new Date(
      datePart.getFullYear(),
      datePart.getMonth(),
      datePart.getDate(),
      hours,
      time.minutes,
      time.seconds
    );
  };

  const handleDateTimeSelect = () => {
    if (!selectedDate) return;
    
    const newDateTime = createDateTime(selectedDate);
    
    if (isDateTimeDisabled(newDateTime)) return;

    setDate?.(newDateTime);
    setSelectedDate(newDateTime);
    setIsOpen(false);
    setView('days');
  };

  const handleDateSelect = (newDate: Date) => {
    const dateWithTime = createDateTime(newDate);
    
    if (isDateTimeDisabled(dateWithTime)) return;

    setSelectedDate(newDate);
    setView('time');
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

  const handleTimeInputChange = (type: 'hours' | 'minutes' | 'seconds', value: string) => {
    let numValue = parseInt(value) || 0;
    let max = type === 'hours' ? (timeFormat === '12h' ? 12 : 23) : 59;
    
    if (numValue > max) {
      numValue = max;
    } else if (numValue < 0) {
      numValue = 0;
    }
    
    setTimeInput(prev => ({
      ...prev,
      [type]: numValue.toString().padStart(2, '0')
    }));
  };

  const handleTimeInputBlur = (type: 'hours' | 'minutes' | 'seconds') => {
    let numValue = parseInt(timeInput[type]) || 0;
    
    if (type === 'hours') {
      const max = timeFormat === '12h' ? 12 : 23;
      numValue = Math.max(0, Math.min(max, numValue));
      setTimeInput(prev => ({
        ...prev,
        [type]: numValue.toString().padStart(2, '0')
      }));
    } else if (type === 'minutes' || type === 'seconds') {
      numValue = Math.max(0, Math.min(59, numValue));
      setTimeInput(prev => ({
        ...prev,
        [type]: numValue.toString().padStart(2, '0')
      }));
    }
  };

  const incrementTime = (type: 'hours' | 'minutes' | 'seconds') => {
    setTimeInput(prev => {
      let numValue = parseInt(prev[type]) || 0;
      const max = type === 'hours' ? (timeFormat === '12h' ? 12 : 23) : 59;
      
      if (numValue >= max) {
        numValue = 0;
      } else {
        numValue += 1;
      }
      
      return {
        ...prev,
        [type]: numValue.toString().padStart(2, '0')
      };
    });
  };

  const decrementTime = (type: 'hours' | 'minutes' | 'seconds') => {
    setTimeInput(prev => {
      let numValue = parseInt(prev[type]) || 0;
      const max = type === 'hours' ? (timeFormat === '12h' ? 12 : 23) : 59;
      
      if (numValue <= 0) {
        numValue = max;
      } else {
        numValue -= 1;
      }
      
      return {
        ...prev,
        [type]: numValue.toString().padStart(2, '0')
      };
    });
  };

  const toggleAMPM = () => {
    setTimeInput(prev => ({
      ...prev,
      ampm: prev.ampm === 'AM' ? 'PM' : 'AM'
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
      const dateWithTime = createDateTime(date);
      
      const isSelected = selectedDate &&
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      const isDisabled = isDateTimeDisabled(dateWithTime);

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

  const renderTimePicker = () => {
    return (
      <div className="space-y-6">

        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-500 text-center">Часы</div>
          <div className="flex items-center justify-center w-full">
            <Button
              variant="outline"
              size="lg"
              className="h-14 w-14 flex-shrink-0"
              onClick={() => decrementTime('hours')}
            >
              <Minus className="h-6 w-6" />
            </Button>
            
            <div className="flex-1 mx-2">
              <input
                ref={hoursInputRef}
                type="number"
                min="0"
                max={timeFormat === '12h' ? '12' : '23'}
                value={parseInt(timeInput.hours) || 0}
                onChange={(e) => handleTimeInputChange('hours', e.target.value)}
                onBlur={() => handleTimeInputBlur('hours')}
                className="h-14 text-2xl text-center font-bold w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
            
            <Button
              variant="outline"
              size="lg"
              className="h-14 w-14 flex-shrink-0"
              onClick={() => incrementTime('hours')}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>

          <div className="text-sm font-medium text-gray-500 text-center">Минуты</div>
          <div className="flex items-center justify-center w-full">
            <Button
              variant="outline"
              size="lg"
              className="h-14 w-14 flex-shrink-0"
              onClick={() => decrementTime('minutes')}
            >
              <Minus className="h-6 w-6" />
            </Button>
            
            <div className="flex-1 mx-2">
              <input
                ref={minutesInputRef}
                type="number"
                min="0"
                max="59"
                value={parseInt(timeInput.minutes) || 0}
                onChange={(e) => handleTimeInputChange('minutes', e.target.value)}
                onBlur={() => handleTimeInputBlur('minutes')}
                className="h-14 text-2xl text-center font-bold w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
            
            <Button
              variant="outline"
              size="lg"
              className="h-14 w-14 flex-shrink-0"
              onClick={() => incrementTime('minutes')}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>

          {showSeconds && (
            <>
              <div className="text-sm font-medium text-gray-500 text-center">Секунды</div>
              <div className="flex items-center justify-center w-full">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 w-14 flex-shrink-0"
                  onClick={() => decrementTime('seconds')}
                >
                  <Minus className="h-6 w-6" />
                </Button>
                
                <div className="flex-1 mx-2">
                  <input
                    ref={secondsInputRef}
                    type="number"
                    min="0"
                    max="59"
                    value={parseInt(timeInput.seconds) || 0}
                    onChange={(e) => handleTimeInputChange('seconds', e.target.value)}
                    onBlur={() => handleTimeInputBlur('seconds')}
                    className="h-14 text-2xl text-center font-bold w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 w-14 flex-shrink-0"
                  onClick={() => incrementTime('seconds')}
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
            </>
          )}

          {timeFormat === '12h' && (
            <>
              <div className="text-sm font-medium text-gray-500 text-center">AM/PM</div>
              <div className="flex items-center justify-center w-full">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 h-14"
                  onClick={toggleAMPM}
                >
                  <span className="text-xl font-bold">
                    {timeInput.ampm}
                  </span>
                </Button>
              </div>
            </>
          )}
        </div>

      </div>
    );
  };

  useEffect(() => {
    if (isOpen) {
      const maxHeight = calculateMaxHeight();
      setMaxCalendarHeight(maxHeight);
    }
  }, [isOpen, view, currentMonth, position]);

  const handleViewChange = () => {
    if (view === 'days') setView('months');
    else if (view === 'months') setView('years');
    else if (view === 'years') setView('time');
    else setView('days');
  };

  const quickToggleView = (targetView: 'days' | 'time') => {
    setView(targetView);
  };

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      {isOpen && (
        <div
          ref={calendarRef}
          className={`
            absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[320px]
            ${position === 'bottom'
              ? 'top-full mt-1 mb-1'
              : 'bottom-full mb-1'
            }
          `}
          style={{
            maxHeight: maxCalendarHeight ? `${maxCalendarHeight}px` : '450px',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          {/* Панель быстрого переключения */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => quickToggleView('days')}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2
                  ${view === 'days' || view === 'months' || view === 'years'
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-gray-200'
                  }
                `}
              >
                <Calendar className="w-4 h-4" />
                Дата
              </button>
              <button
                type="button"
                onClick={() => quickToggleView('time')}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2
                  ${view === 'time'
                    ? 'bg-white shadow-sm'
                    : 'hover:bg-gray-200'
                  }
                `}
              >
                <Clock className="w-4 h-4" />
                Время
              </button>
            </div>
          </div>

          {/* Навигация */}
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 pt-1 pb-1">
            <div className="flex items-center space-x-2 w-full justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (view === 'days') navigateMonth('prev');
                  else if (view === 'years') navigateYearRange('prev');
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewChange}
              >
                <span className="text-sm flex items-center gap-2">
                  {view === 'days' && (
                    `${currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`
                  )}
                  {view === 'months' && `${currentMonth.getFullYear()}`}
                  {view === 'years' && `${yearRange.start} - ${yearRange.end}`}
                  {view === 'time' && (
                    <>
                      <Clock className="w-4 h-4" />
                      Настройка времени
                    </>
                  )}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (view === 'days') navigateMonth('next');
                  else if (view === 'years') navigateYearRange('next');
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Контент */}
          <div className={`
            pb-1
            ${view === 'days' ? 'grid grid-cols-7 gap-1' : 
              view === 'months' || view === 'years' ? 'grid grid-cols-4 gap-1' : ''}
          `}>
            {view === 'days' && renderDays()}
            {view === 'months' && renderMonths()}
            {view === 'years' && renderYears()}
            {view === 'time' && renderTimePicker()}
          </div>

          {/* Кнопки действий */}
          <div className="sticky bottom-0 bg-white pt-3 mt-2 border-t border-gray-200 grid grid-cols-1 gap-2">
            {false && <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                setSelectedDate(now);
                setCurrentMonth(now);
                setTimeInput({
                  hours: now.getHours().toString().padStart(2, '0'),
                  minutes: now.getMinutes().toString().padStart(2, '0'),
                  seconds: now.getSeconds().toString().padStart(2, '0'),
                  ampm: now.getHours() >= 12 ? 'PM' : 'AM'
                });
              }}
            >
              Сейчас
            </Button>}
            <Button
              size="sm"
              onClick={handleDateTimeSelect}
            >
              Применить
            </Button>
          </div>
        </div>
      )}
      
      {/* Поле ввода */}
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
            w-full px-3 py-2 pr-10 rounded-md border transition-colors text-sm
            bg-white text-gray-900 placeholder-gray-400
            border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            cursor-pointer focus:outline-none
          `}
        />
        <button
          type="button"
          onClick={handleToggleCalendar}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DateTimePicker;