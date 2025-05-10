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

const ALL_CATEGORIES_VALUE = "all-categories";
const ALL_RESTAURANTS_VALUE = "all-restaurants";

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedRestaurant: string;
  onRestaurantChange: (value: string) => void;
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
  },
  ka: {
    searchPlaceholder: 'ძებნა სახელით',
    filterByCategory: 'ფილტრი კატეგორიის მიხედვით',
    filterByRestaurant: 'ფილტრი რესტორანის მიხედვით',
    allCategories: 'ყველა კატეგორია',
    allRestaurants: 'ყველა რესტორანი',
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

  const selectedCategoryName = selectedCategory === ALL_CATEGORIES_VALUE 
    ? t.allCategories 
    : categories.find(c => c.id === selectedCategory)?.title || selectedCategory;

  const selectedRestaurantName = selectedRestaurant === ALL_RESTAURANTS_VALUE 
    ? t.allRestaurants 
    : restaurants.find(r => r.id === selectedRestaurant)?.title || selectedRestaurant;

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

        <Select value={selectedRestaurant} onValueChange={onRestaurantChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t.filterByRestaurant} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_RESTAURANTS_VALUE}>
              {t.allRestaurants}
            </SelectItem>
            {restaurants.map((restaurant) => (
              <SelectItem key={restaurant.id} value={restaurant.id}>
                {restaurant.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        {selectedRestaurant !== ALL_RESTAURANTS_VALUE && (
          <Badge variant="outline" className="px-3 py-1">
            {t.filterByRestaurant}: {selectedRestaurantName}
            <button 
              onClick={() => onRestaurantChange(ALL_RESTAURANTS_VALUE)}
              className="ml-2 rounded-full p-0.5 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>
    </>
  );
}