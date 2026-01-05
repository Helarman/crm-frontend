import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Language } from '@/lib/stores/language-store';
import { Search, Filter, X } from 'lucide-react';
import { EnumOrderType, OrderAdditiveType } from '@/lib/api/order-additive.service';

interface OrderAdditiveFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: {
    orderType?: EnumOrderType;
    isActive?: boolean;
    type?: OrderAdditiveType;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
  language: string;
}

const translations = {
  ru: {
    searchPlaceholder: 'Поиск по названию или описанию',
    orderType: 'Тип заказа',
    additiveType: 'Тип модификатора',
    status: 'Статус',
    allOrderTypes: 'Все типы заказов',
    allAdditiveTypes: 'Все типы модификаторов',
    allStatuses: 'Все статусы',
    active: 'Активные',
    inactive: 'Неактивные',
    clearFilters: 'Сбросить фильтры',
    dineIn: 'В зале',
    takeaway: 'С собой',
    delivery: 'Доставка',
    banquet: 'Банкет',
    fixed: 'Фиксированная',
    perPerson: 'За человека',
    filters: 'Фильтры'
  },
  ka: {
    searchPlaceholder: 'ძებნა სახელით ან აღწერით',
    orderType: 'შეკვეთის ტიპი',
    additiveType: 'მოდიფიკატორის ტიპი',
    status: 'სტატუსი',
    allOrderTypes: 'ყველა შეკვეთის ტიპი',
    allAdditiveTypes: 'ყველა მოდიფიკატორის ტიპი',
    allStatuses: 'ყველა სტატუსი',
    active: 'აქტიური',
    inactive: 'არააქტიური',
    clearFilters: 'ფილტრების გასუფთავება',
    dineIn: 'დარბაზში',
    takeaway: 'თან წასაღები',
    delivery: 'მიწოდება',
    banquet: 'ბანკეტი',
    fixed: 'ფიქსირებული',
    perPerson: 'კაცზე',
    filters: 'ფილტრები'
  }
};

export function OrderAdditiveFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
  language
}: OrderAdditiveFiltersProps) {
  const t = translations[language as Language];
  
  const hasActiveFilters = !!filters.orderType || filters.isActive !== undefined || !!filters.type;

  const orderTypeOptions = [
    { value: 'all', label: t.allOrderTypes },
    { value: EnumOrderType.DINE_IN, label: t.dineIn },
    { value: EnumOrderType.TAKEAWAY, label: t.takeaway },
    { value: EnumOrderType.DELIVERY, label: t.delivery },
    { value: EnumOrderType.BANQUET, label: t.banquet },
  ];

  const additiveTypeOptions = [
    { value: 'all', label: t.allAdditiveTypes },
    { value: OrderAdditiveType.FIXED, label: t.fixed },
    { value: OrderAdditiveType.PER_PERSON, label: t.perPerson },
  ];

  const statusOptions = [
    { value: 'all', label: t.allStatuses },
    { value: 'true', label: t.active },
    { value: 'false', label: t.inactive },
  ];

  // Функции для обработки значений
  const handleOrderTypeChange = (value: string) => {
    const newValue = value === 'all' ? undefined : value as EnumOrderType;
    onFilterChange({ ...filters, orderType: newValue });
  };

  const handleAdditiveTypeChange = (value: string) => {
    const newValue = value === 'all' ? undefined : value as OrderAdditiveType;
    onFilterChange({ ...filters, type: newValue });
  };

  const handleStatusChange = (value: string) => {
    let newValue: boolean | undefined;
    if (value === 'all') {
      newValue = undefined;
    } else if (value === 'true') {
      newValue = true;
    } else {
      newValue = false;
    }
    onFilterChange({ ...filters, isActive: newValue });
  };

  // Функции для получения текущих значений
  const getCurrentOrderTypeValue = () => {
    return filters.orderType || 'all';
  };

  const getCurrentAdditiveTypeValue = () => {
    return filters.type || 'all';
  };

  const getCurrentStatusValue = () => {
    if (filters.isActive === undefined) return 'all';
    return filters.isActive ? 'true' : 'false';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Поиск */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              className="pl-9"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Фильтры */}
        <div className="flex flex-col md:flex-row gap-2">
          <div className="space-y-1">
            <Select
              value={getCurrentOrderTypeValue()}
              onValueChange={handleOrderTypeChange}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t.orderType} />
              </SelectTrigger>
              <SelectContent>
                {orderTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Select
              value={getCurrentAdditiveTypeValue()}
              onValueChange={handleAdditiveTypeChange}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t.additiveType} />
              </SelectTrigger>
              <SelectContent>
                {additiveTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Select
              value={getCurrentStatusValue()}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t.status} />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && false && (
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={onClearFilters}
                className="h-10"
              >
                <X className="h-4 w-4 mr-2" />
                {t.clearFilters}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}