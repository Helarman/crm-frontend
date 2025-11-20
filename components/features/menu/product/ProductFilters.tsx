import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Language } from '@/lib/stores/language-store';
import { useAuth } from '@/lib/hooks/useAuth';
import { Restaurant } from '@/lib/types/restaurant';

import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const ALL_CATEGORIES_VALUE = "all-categories";
const ALL_RESTAURANTS_VALUE = "all-restaurants";

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedRestaurant: string[];
  onRestaurantChange: (value: string[]) => void;
  categories: any[];
  restaurants: any[];
  language: string;
}

const translations = {
  ru: {
    searchPlaceholder: 'Поиск по названию',
    filterByCategory: 'Фильтр по категории',
    filterByRestaurant: 'Фильтр по ресторану',
    allCategories: 'Все категории',
    allRestaurants: 'Все рестораны',
    selectRestaurants: 'Выберите рестораны',
    searchRestaurants: 'Поиск ресторанов...',
    noRestaurants: 'Рестораны не найдены',
  },
  ka: {
    searchPlaceholder: 'ძებნა სახელით',
    filterByCategory: 'ფილტრი კატეგორიის მიხედვით',
    filterByRestaurant: 'ფილტრი რესტორანის მიხედვით',
    allCategories: 'ყველა კატეგორია',
    allRestaurants: 'ყველა რესტორანი',
    selectRestaurants: 'აირჩიეთ რესტორანები',
    searchRestaurants: 'რესტორანების ძებნა...',
    noRestaurants: 'რესტორანები არ მოიძებნა',
  }
};

export function ProductFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedRestaurant,
  onRestaurantChange,
  categories,
  restaurants,
  language
}: ProductFiltersProps) {
  const t = translations[language as Language];
  const { user } = useAuth();
  
  // Фильтруем рестораны в зависимости от роли пользователя
  const filteredRestaurants = user?.role === 'SUPERVISOR' 
    ? restaurants 
    : restaurants.filter(restaurant => 
        user?.restaurant?.some((userRest : Restaurant) => userRest.id === restaurant.id)
      );

  // Преобразуем рестораны в формат для SearchableSelect
  const restaurantOptions = filteredRestaurants.map(restaurant => ({
    id: restaurant.id,
    label: restaurant.title
  }));

  const selectedCategoryName = selectedCategory === ALL_CATEGORIES_VALUE 
    ? t.allCategories 
    : categories.find(c => c.id === selectedCategory)?.title || selectedCategory;

  // Функция для получения названий выбранных ресторанов
  const getSelectedRestaurantNames = () => {
    if (selectedRestaurant.length === 0) return t.allRestaurants;
    if (selectedRestaurant.length === filteredRestaurants.length) return t.allRestaurants;
    
    return selectedRestaurant.map(id => 
      filteredRestaurants.find(r => r.id === id)?.title || id
    ).join(', ');
  };

  // Обработчик изменения выбора ресторанов
  const handleRestaurantChange = (newValue: string[]) => {
    // Гарантируем, что всегда выбран минимум один ресторан
    if (newValue.length === 0) {
      // Если пытаются удалить все, оставляем первый доступный ресторан
      newValue = [filteredRestaurants[0]?.id].filter(Boolean);
    }
    onRestaurantChange(newValue);
  };

  // Функция для удаления одного ресторана из выбора
  const handleRemoveRestaurant = (restaurantId: string) => {  
    if (selectedRestaurant.length > 1) {
      handleRestaurantChange(selectedRestaurant.filter(id => id !== restaurantId));
    }
  };

  // Функция для сброса всех фильтров ресторанов
  const handleResetRestaurants = () => {
    handleRestaurantChange(filteredRestaurants.map(r => r.id));
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.searchPlaceholder}
            className="pl-9"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t.filterByCategory} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES_VALUE}>
              {t.allCategories}
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="w-[200px]">
          <SearchableSelect
            options={restaurantOptions}
            value={selectedRestaurant}
            onChange={handleRestaurantChange}
            placeholder={t.selectRestaurants}
            searchPlaceholder={t.searchRestaurants}
            emptyText={t.noRestaurants}
            multiple={true}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {selectedCategory !== ALL_CATEGORIES_VALUE && (
          <Badge variant="outline" className="px-3 py-1">
            {t.filterByCategory}: {selectedCategoryName}
            <button 
              onClick={() => onCategoryChange(ALL_CATEGORIES_VALUE)}
              className="ml-2 rounded-full p-0.5 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        
        {/* Бейджи для выбранных ресторанов */}
        {selectedRestaurant.length > 0 && (
          <div className='flex gap-2 flex-wrap w-full'>
            {selectedRestaurant.map(restaurantId => {
              const restaurant = filteredRestaurants.find(r => r.id === restaurantId);
              return restaurant ? (
                
                <Button 
                  key={restaurantId} 

                  variant="outline" 
                  className="px-1 py-1"
                   onClick={() => handleRemoveRestaurant(restaurantId)}
                >
                  {restaurant.title}
                  {selectedRestaurant.length > 1 && (
                    <button 
                     
                      className="rounded-full  hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Button>
              ) : null;
            })}
            <Badge 
              variant="secondary" 
              className="px-3 py-1 cursor-pointer hover:bg-muted"
              onClick={handleResetRestaurants}
            >
              Сбросить
              <X className="h-3 w-3 ml-2" />
            </Badge>
          </div>
        )}
        
       
      </div>
    </>
  );
}

interface SearchableSelectProps {
  options: { id: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void ;
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

  useEffect(() => {
    if (open && inputRef.current) {
      // Небольшая задержка для гарантии, что модальное окно полностью отрендерилось
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
            className="bg-background rounded-lg border shadow-lg w-full max-w-md max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Command className="h-full">
              <CommandInput
                ref={inputRef}
                placeholder={searchPlaceholder}
                value={searchValue}
                onValueChange={setSearchValue}
                autoFocus
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
    </div>
  );
};

export default SearchableSelect;