import { Input } from '@/components/ui/input';
import { Language } from '@/lib/stores/language-store';
import { Search } from 'lucide-react';

interface CategoryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  language: string;
}

const translations = {
  ru: {
    searchPlaceholder: 'Поиск по названию или slug',
  },
  ka: {
    searchPlaceholder: 'ძებნა სახელით ან slug-ით',
  }
};

export function CategoryFilters({
  searchTerm,
  onSearchChange,
  language
}: CategoryFiltersProps) {
  const t = translations[language as Language];

  return (
    <div className="mb-4 flex gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.searchPlaceholder}
          className="pl-9"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}