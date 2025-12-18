import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface WorkshopFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  language: string;
}


export const WorkshopFilters = ({
  searchTerm,
  onSearchChange,
  language,
}: WorkshopFiltersProps) => {
  return (
    <div className="mb-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={language == 'ka' ? 'ძებნა სახელოსნოს სახელით...' : 'Поиск по названию цеха...'}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
    </div>
  );
};