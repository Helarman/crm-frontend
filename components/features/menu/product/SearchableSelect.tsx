"use client";

import { useState } from 'react';
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
  className?: string;
}
 const SearchableSelect = ({
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

  return (
    <div className="space-y-2">
      <Button
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
            className="bg-background rounded-lg border shadow-lg w-full max-w-md max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Command className="h-full">
              <CommandInput
                placeholder={searchPlaceholder}
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList className="max-h-[300px] overflow-auto">
                <CommandEmpty className="text-sm px-2 py-1.5">
                  {emptyText}
                </CommandEmpty>
                <CommandGroup>
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

      {multiple && value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(id => {
            const option = options.find(o => o.id === id);
            return option ? (
              <Badge
                key={id}
                variant="secondary"
                className="flex items-center gap-1 text-sm"
              >
                {option.label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onChange(value.filter(v => v !== id));
                  }}
                  className="rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};
export default SearchableSelect;    