"use client";

import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


interface SearchableSelectProps {
  options: { id: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

const SearchableSelect = ({
  disabled,
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  multiple = true,
  className,
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (id: string) => {
    if (multiple) {
      onChange(
        value.includes(id)
          ? value.filter(v => v !== id)
          : [...value, id]
      );
    } else {
      onChange([id]);
      setOpen(false);
      setSearchValue('');
    }
  };

  const handleSelectAll = () => {
    const allIds = filteredOptions.map(option => option.id);
    const currentIds = new Set(value);
    const allSelected = allIds.every(id => currentIds.has(id));
    
    if (allSelected) {
      // Убрать все отфильтрованные элементы
      onChange(value.filter(id => !allIds.includes(id)));
    } else {
      // Добавить все отфильтрованные элементы
      const newValue = [...new Set([...value, ...allIds])];
      onChange(newValue);
    }
  };

  const handleClearAll = () => {
    if (searchValue) {
      // Очистить только отфильтрованные элементы
      const filteredIds = filteredOptions.map(option => option.id);
      onChange(value.filter(id => !filteredIds.includes(id)));
    } else {
      // Очистить все
      onChange([]);
    }
  };

  const getSelectedFilteredCount = () => {
    const filteredIds = filteredOptions.map(option => option.id);
    return value.filter(id => filteredIds.includes(id)).length;
  };

  const getAllFilteredSelected = () => {
    const filteredIds = filteredOptions.map(option => option.id);
    return filteredIds.length > 0 && filteredIds.every(id => value.includes(id));
  };

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  return (
    <div className="space-y-2">
      <Button
        disabled={disabled}
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn("w-full justify-between text-sm", className)}
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        {value.length > 0
          ? multiple
            ? `${value.length} выбрано`
            : options.find(o => o.id === value[0])?.label
          : placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div 
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
        >
          <div 
            className="bg-background rounded-lg border shadow-lg w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <Command className="flex flex-col h-full">
              <CommandInput
                ref={inputRef}
                placeholder={searchPlaceholder}
                value={searchValue}
                onValueChange={setSearchValue}
                autoFocus
              />
              
              {/* Кнопки управления */}
              {multiple && filteredOptions.length > 0 && (
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <div className="text-sm text-muted-foreground">
                    {searchValue 
                      ? `Найдено: ${filteredOptions.length}, выбрано: ${getSelectedFilteredCount()}`
                      : `Всего: ${options.length}, выбрано: ${value.length}`
                    }
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="h-7 text-xs"
                    >
                      {searchValue ? "Снять с найденных" : "Сбросить все"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-7 text-xs"
                    >
                      {getAllFilteredSelected() 
                        ? "Снять все" 
                        : searchValue 
                          ? "Выбрать найденные" 
                          : "Выбрать все"
                      }
                    </Button>
                  </div>
                </div>
              )}

              {/* Убрал className у CommandList и добавил flex-1 */}
              <CommandList className="flex-1 overflow-auto">
                <CommandEmpty className="text-sm px-2 py-1.5">
                  {emptyText}
                </CommandEmpty>
                <CommandGroup className="overflow-y-auto">
                  {filteredOptions.map(option => (
                    <CommandItem
                      key={option.id}
                      value={option.label}
                      onSelect={() => handleSelect(option.id)}
                      className="text-sm"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(option.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </div>
      )}

    </div>
  );
};

export default SearchableSelect;