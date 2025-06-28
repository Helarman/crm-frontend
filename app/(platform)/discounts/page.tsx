'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { PlusIcon, PencilIcon, TrashIcon, Check, ChevronsUpDown, CalendarIcon } from 'lucide-react'
import { CreateDiscountDto, DiscountFormState, DiscountResponseDto, DiscountService } from '@/lib/api/discount.service'
import { RestaurantService } from '@/lib/api/restaurant.service'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandDialog,
} from '@/components/ui/command'
import { Calendar } from '@/components/ui/calendar'
import { format, Locale } from 'date-fns'
import { ru, ka } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguageStore } from '@/lib/stores/language-store'
import { toast } from 'sonner'
import { ProductService } from '@/lib/api/product.service'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "BANQUET";
type DiscountType = "FIXED" | "PERCENTAGE";
type DiscountTargetType = "ALL" | "PRODUCT";

interface Product {
  id: string;
  title: string;
}

interface Restaurant {
  id: string;
  title: string;
}

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  ru: {
    title: 'Название',
    type: 'Тип скидки',
    value: 'Размер скидки',
    targetType: 'Применение скидки',
    minOrderAmount: 'Мин. сумма заказа',
    restaurants: 'Рестораны',
    products: 'Продукты',
    status: 'Статус',
    actions: 'Действия',
    fixed: 'Фиксированная сумма',
    percentage: 'Процент',
    all: 'Ко всему меню',
    product: 'По продуктам',
    active: 'Активна',
    inactive: 'Неактивна',
    noData: 'Нет данных для отображения',
    loadingError: 'Ошибка загрузки скидок',
    addDiscount: 'Добавить скидку',
    editDiscount: 'Редактировать скидку',
    deleteConfirm: 'Вы уверены, что хотите удалить эту скидку?',
    discountTitle: 'Управление скидками',
    description: 'Описание',
    startDate: 'Дата начала',
    endDate: 'Дата окончания',
    startTime: 'Время начала',
    endTime: 'Время окончания',
    cancel: 'Отмена',
    save: 'Сохранить',
    add: 'Добавить',
    selectType: 'Выберите тип',
    selectTargetType: 'Выберите применение скидки',
    selectDate: 'Выберите дату',
    selectRestaurants: 'Выберите рестораны',
    selectProducts: 'Выберите продукты',
    selected: 'выбрано',
    code: 'Промокод (если требуется)',
    maxUses: 'Макс. использований',
    currentUses: 'Использовано',
    toggleStatus: 'Активировать/деактивировать',
    activePeriod: 'Период действия',
    activeRestaurants: 'Действует в ресторанах',
    promoCode: 'Промокод',
    usageLimit: 'Лимит',
    searchPlaceholder: 'Поиск...',
    noResults: 'Ничего не найдено',
    requiredField: 'Обязательное поле',
    restaurantsRequired: 'Необходимо выбрать хотя бы один ресторан',
    datesRequired: 'Необходимо указать даты начала и окончания',
    invalidDateRange: 'Дата окончания должна быть после даты начала',
    invalidTimeRange: 'Время окончания должно быть после времени начала'
  },
  ka: {
    title: 'სახელი',
    type: 'ფასდაკლების ტიპი',
    value: 'ფასდაკლების ზომა',
    targetType: 'ფასდაკლების გამოყენება',
    minOrderAmount: 'მინ. შეკვეთის თანხა',
    restaurants: 'რესტორნები',
    products: 'პროდუქტები',
    status: 'სტატუსი',
    actions: 'მოქმედებები',
    fixed: 'ფიქსირებული თანხა',
    percentage: 'პროცენტი',
    all: 'მთელ მენიუზე',
    product: 'პროდუქტების მიხედვით',
    active: 'აქტიური',
    inactive: 'არააქტიური',
    noData: 'მონაცემები არ მოიძებნა',
    loadingError: 'ფასდაკლების ჩატვირთვის შეცდომა',
    addDiscount: 'ფასდაკლების დამატება',
    editDiscount: 'ფასდაკლების რედაქტირება',
    deleteConfirm: 'დარწმუნებული ხართ, რომ გსურთ ამ ფასდაკლების წაშლა?',
    discountTitle: 'ფასდაკლების მენეჯმენტი',
    description: 'აღწერა',
    startDate: 'დაწყების თარიღი',
    endDate: 'დასრულების თარიღი',
    startTime: 'დაწყების დრო',
    endTime: 'დასრულების დრო',
    cancel: 'გაუქმება',
    save: 'შენახვა',
    add: 'დამატება',
    selectType: 'აირჩიეთ ტიპი',
    selectTargetType: 'აირჩიეთ ფასდაკლების გამოყენება',
    selectDate: 'აირჩიეთ თარიღი',
    selectRestaurants: 'აირჩიეთ რესტორნები',
    selectProducts: 'აირჩიეთ პროდუქტები',
    selected: 'არჩეული',
    code: 'პრომო კოდი (საჭიროების შემთხვევაში)',
    maxUses: 'მაქს. გამოყენება',
    currentUses: 'გამოყენებულია',
    toggleStatus: 'გააქტიურება/გამორთვა',
    activePeriod: 'მოქმედების პერიოდი',
    activeRestaurants: 'მოქმედებს რესტორნებში',
    promoCode: 'პრომო კოდი',
    usageLimit: 'ლიმიტი',
    searchPlaceholder: 'ძებნა...',
    noResults: 'ვერ მოიძებნა',
    requiredField: 'სავალდებულო ველი',
    restaurantsRequired: 'მინიმუმ ერთი რესტორანი უნდა აირჩიოთ',
    datesRequired: 'დაწყების და დასრულების თარიღები აუცილებელია',
    invalidDateRange: 'დასრულების თარიღი უნდა იყოს დაწყების თარიღის შემდეგ',
    invalidTimeRange: 'დასრულების დრო უნდა იყოს დაწყების დროის შემდეგ'
  }
};

const DatePickerWithTime = ({
  date,
  onChange,
  placeholder,
  locale,
  error
}: {
  date: Date | undefined | null;
  onChange: (date: Date | undefined) => void;
  placeholder: string;
  locale: Locale;
  error?: string;
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [timeValue, setTimeValue] = useState(
    date ? format(date, 'HH:mm') : '00:00'
  );

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

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

  return (
    <div className="relative">
      <Button
        variant={error ? "destructive" : "outline"}
        className={cn("w-full justify-start text-left font-normal", error && "border-red-500")}
        type="button"
        onClick={() => setShowCalendar(!showCalendar)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, 'PPPp', { locale }) : <span>{placeholder}</span>}
      </Button>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {showCalendar && (
        <div className="absolute z-50 mt-1 bg-white border rounded-md shadow-lg p-2">
          <Calendar
            mode="single"
            selected={date  || undefined}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="mt-2 p-2 border-t">
            <Label>Time</Label>
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="mt-1"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  multiple = true,
  error
}: {
  options: { id: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  multiple?: boolean;
  error?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (id: string) => {
    if (multiple) {
      onChange(
        value.includes(id)
          ? value.filter(item => item !== id)
          : [...value, id]
      );
    } else {
      onChange([id]);
      setOpen(false);
    }
  };

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant={error ? "destructive" : "outline"}
        className={cn("w-full justify-between", error && "border-red-500")}
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {value.length > 0 
          ? multiple 
            ? `${value.length} ${translations[useLanguageStore.getState().language].selected}`
            : options.find(opt => opt.id === value[0])?.label || placeholder
          : placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder={searchPlaceholder} 
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <CommandList>
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-y-auto">
            {filteredOptions.map((option) => (
              <CommandItem
                type="button"
                key={option.id}
                value={option.label}
                onSelect={() => handleSelect(option.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.includes(option.id) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
};

const DiscountsTable = () => {
  const { language } = useLanguageStore();
  const t = translations[language];
  const locale = language === 'ka' ? ka : ru;

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountResponseDto | null>(null);
  const [formData, setFormData] = useState<Partial<DiscountFormState>>({
    title: '',
    description: '',
    type: 'FIXED',
    value: 0,
    targetType: 'ALL',
    minOrderAmount: 0,
    restaurantIds: [],
    productIds: [],
    isActive: true,
    code: '',
    maxUses: 0,
     startDate: null,  
  endDate: null,   
  startTime: 0,   
  endTime: 0      
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: discounts, error: discountsError, isLoading } = useSWR<DiscountResponseDto[]>('discounts', () => DiscountService.getAll());
  const { data: restaurants, error: restaurantsError } = useSWR<Restaurant[]>('restaurants', () => RestaurantService.getAll());
  const { data: products } = useSWR<Product[]>('products', () => ProductService.getAll());

  const targetTypeOptions = [
    { value: 'ALL', label: t.all },
    { value: 'PRODUCT', label: t.product },
  ];

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.title) {
      errors.title = t.requiredField;
    }
    
    if (!formData.startDate) {
      errors.startDate = t.requiredField;
    }
    
    if (!formData.endDate) {
      errors.endDate = t.requiredField;
    }
    
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      errors.endDate = t.invalidDateRange;
    }
    
    if (formData.startTime !== undefined && formData.endTime !== undefined && formData.startTime >= formData.endTime) {
      errors.endTime = t.invalidTimeRange;
    }
    
    if (!formData.restaurantIds || formData.restaurantIds.length === 0) {
      errors.restaurantIds = t.restaurantsRequired;
    }
    
    if (formData.targetType === 'PRODUCT' && (!formData.productIds || formData.productIds.length === 0)) {
      errors.productIds = t.requiredField;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev : any) => ({ 
      ...prev, 
      [name]: name === 'value' || name === 'minOrderAmount' || name === 'maxUses' || name === 'startTime' || name === 'endTime'
        ? Number(value) 
        : value 
    }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name: string, value: any): void => {
    setFormData((prev : any) => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    
    if (name === 'targetType') {
      setFormData((prev : any) => ({
        ...prev,
        productIds: []
      }));
    }
  };

  const handleDateChange = (name: string, date: Date | undefined): void => {
    setFormData((prev : any) => ({ ...prev, [name]: date }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleEdit = (discount: DiscountResponseDto): void => {
    setEditingDiscount(discount);
    setFormData({
      title: discount.title,
      description: discount.description || '',
      type: discount.type,
      value: discount.value,
      targetType: discount.targetType,
      minOrderAmount: discount.minOrderAmount || 0,
      restaurantIds: discount.restaurants?.map(r => r.restaurant.id) || [],
      productIds: discount.products?.map(p => p.product.id) || [],
      isActive: discount.isActive,
      code: discount.code || '',
      maxUses: discount.maxUses || 0,
      startDate: discount.startDate ? new Date(discount.startDate) : undefined,
      endDate: discount.endDate ? new Date(discount.endDate) : undefined,
      startTime: discount.startTime,
      endTime: discount.endTime
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Проверяем, что restaurantIds и productIds — это массивы
  const restaurantIds = Array.isArray(formData.restaurantIds) 
    ? formData.restaurantIds.filter(Boolean) // Удаляем пустые значения
    : [];

  const productIds = formData.targetType === 'PRODUCT' && Array.isArray(formData.productIds)
    ? formData.productIds.filter(Boolean)
    : undefined;

  const requestData: CreateDiscountDto = {
    ...formData,
    restaurantIds: restaurantIds.length > 0 ? restaurantIds : undefined, // Если пусто — отправляем undefined
    productIds,
    startDate: formData.startDate, // Преобразуем Date в строку
    endDate: formData.endDate,
  };

  try {
    if (editingDiscount) {
      await DiscountService.update(editingDiscount.id, requestData);
    } else {
      await DiscountService.create(requestData);
    }
    // ... остальная логика
  } catch (error) {
    console.error("Ошибка при сохранении:", error);
    toast.error("Не удалось сохранить скидку");
  }
};
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'FIXED',
      value: 0,
      targetType: 'ALL',
      minOrderAmount: 0,
      restaurantIds: [],
      productIds: [],
      isActive: true,
      code: '',
      maxUses: 0,
      startDate: undefined,
      endDate: undefined,
      startTime: undefined,
      endTime: undefined
    });
    setFormErrors({});
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await DiscountService.delete(id);
      mutate('discounts');
      toast.success(language === 'ru' ? 'Скидка успешно удалена' : 'ფასდაკლება წარმატებით წაიშალა');
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast.error(language === 'ru' ? 'Ошибка при удалении скидки' : 'ფასდაკლების წაშლის შეცდომა');
    }
  };

  const toggleStatus = async (id: string, isActive: boolean): Promise<void> => {
    try {
      await DiscountService.update(id, { isActive: !isActive });
      mutate('discounts');
      toast.success(
        language === 'ru' 
          ? `Скидка ${!isActive ? 'активирована' : 'деактивирована'}` 
          : `ფასდაკლება ${!isActive ? 'გააქტიურდა' : 'გათიშულია'}`
      );
    } catch (error) {
      console.error('Error toggling discount status:', error);
      toast.error(language === 'ru' ? 'Ошибка изменения статуса' : 'სტატუსის შეცვლის შეცდომა');
    }
  };

  if (discountsError || restaurantsError) {
    return <div className="text-red-500">{t.loadingError}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t.discountTitle}</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingDiscount(null);
              resetForm();
            }}>
              <PlusIcon className="mr-2 h-4 w-4" />
              {t.addDiscount}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingDiscount ? t.editDiscount : t.addDiscount}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2" htmlFor="title">{t.title}</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className={formErrors.title ? 'border-red-500' : ''}
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-2" htmlFor="type">{t.type}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: DiscountType) => handleSelectChange('type', value)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder={t.selectType} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">{t.fixed}</SelectItem>
                      <SelectItem value="PERCENTAGE">{t.percentage}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2" htmlFor="value">
                    {t.value} ({formData.type === 'FIXED' ? '₽' : '%'})
                  </Label>
                  <Input
                    id="value"
                    name="value"
                    type="number"
                    value={formData.value}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </div>
                <div>
                  <Label className="mb-2" htmlFor="targetType">{t.targetType}</Label>
                  <Select
                    value={formData.targetType}
                    onValueChange={(value: DiscountTargetType) => handleSelectChange('targetType', value)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder={t.selectTargetType} />
                    </SelectTrigger>
                    <SelectContent>
                      {targetTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="mb-2">{t.restaurants}</Label>
                <SearchableSelect
                  options={restaurants?.map(r => ({ id: r.id, label: r.title })) || []}
                  value={formData.restaurantIds || []}
                  onChange={(ids) => {
                    handleSelectChange('restaurantIds', ids);
                  }}
                  placeholder={t.selectRestaurants}
                  searchPlaceholder={t.searchPlaceholder}
                  emptyText={t.noResults}
                  error={formErrors.restaurantIds}
                />
              </div>

              {formData.targetType === 'PRODUCT' && (
                <div>
                  <Label className="mb-2">{t.products}</Label>
                  <SearchableSelect
                    options={products?.map(p => ({ id: p.id, label: p.title })) || []}
                    value={formData.productIds || []}
                    onChange={(ids) => {
                      handleSelectChange('productIds', ids);
                    }}
                    placeholder={t.selectProducts}
                    searchPlaceholder={t.searchPlaceholder}
                    emptyText={t.noResults}
                    error={formErrors.productIds}
                  />
                </div>
              )}

              <div className="space-y-4">
                <Label>{t.activePeriod}</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2">{t.startDate}</Label>
                    <DatePickerWithTime
                      date={formData.startDate}
                      onChange={(date) => handleDateChange('startDate', date)}
                      placeholder={t.selectDate}
                      locale={locale}
                      error={formErrors.startDate}
                    />
                  </div>
                  <div>
                    <Label className="mb-2">{t.endDate}</Label>
                    <DatePickerWithTime
                      date={formData.endDate}
                      onChange={(date) => handleDateChange('endDate', date)}
                      placeholder={t.selectDate}
                      locale={locale}
                      error={formErrors.endDate}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2" htmlFor="startTime">{t.startTime}</Label>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="number"
                      min="0"
                      max="23"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      placeholder="0-23"
                    />
                    {formErrors.startTime && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.startTime}</p>
                    )}
                  </div>
                  <div>
                    <Label className="mb-2" htmlFor="endTime">{t.endTime}</Label>
                    <Input
                      id="endTime"
                      name="endTime"
                      type="number"
                      min="0"
                      max="23"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      placeholder="0-23"
                    />
                    {formErrors.endTime && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.endTime}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2" htmlFor="code">{t.code}</Label>
                    <Input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder={t.code}
                    />
                  </div>
                  <div>
                    <Label className="mb-2" htmlFor="maxUses">{t.maxUses}</Label>
                    <Input
                      id="maxUses"
                      name="maxUses"
                      type="number"
                      value={formData.maxUses}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="0 - без ограничений"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="mb-2" htmlFor="minOrderAmount">{t.minOrderAmount}</Label>
                <Input
                  id="minOrderAmount"
                  name="minOrderAmount"
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div>
                <Label className="mb-2" htmlFor="description">{t.description}</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t.cancel}
                </Button>
                <Button type="submit">
                  {editingDiscount ? t.save : t.add}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.title}</TableHead>
              <TableHead>{t.type}</TableHead>
              <TableHead>{t.value}</TableHead>
              <TableHead>{t.targetType}</TableHead>
              <TableHead>{t.activePeriod}</TableHead>
              <TableHead>{t.activeRestaurants}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead>{t.usageLimit}</TableHead>
              <TableHead>{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ) : discounts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  {t.noData}
                </TableCell>
              </TableRow>
            ) : (
              discounts?.map((discount) => (
                <TableRow key={discount.id}>
                  <TableCell>
                    <div className="font-medium">{discount.title}</div>
                    {discount.description && (
                      <div className="text-sm text-muted-foreground">{discount.description}</div>
                    )}
                    {discount.code && (
                      <div className="text-sm mt-1">
                        <Badge variant="outline" className="text-xs">
                          {t.promoCode}: {discount.code}
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {discount.type === 'FIXED' ? t.fixed : t.percentage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {discount.type === 'FIXED'
                      ? `${discount.value} ₽`
                      : `${discount.value}%`}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline">
                        {discount.targetType === 'ALL' && t.all}
                        {discount.targetType === 'PRODUCT' && t.product}
                      </Badge>
                      {discount.targetType === 'PRODUCT' && discount.products?.length && (
                        <div className="text-xs text-muted-foreground">
                          {discount.products.length} {t.products}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="text-sm">
                        {discount.startDate 
                          ? format(new Date(discount.startDate), 'PP', { locale }) 
                          : '-'}
                        {' → '}
                        {discount.endDate 
                          ? format(new Date(discount.endDate), 'PP', { locale }) 
                          : '-'}
                      </div>
                      {discount.startTime !== undefined && discount.endTime !== undefined && (
                        <div className="text-xs text-muted-foreground">
                          {discount.startTime}:00 - {discount.endTime}:00
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {discount.restaurants?.slice(0, 3).map(restaurant => (
                        <Badge key={restaurant.restaurant.id} variant="outline" className="text-xs">
                          {restaurant.restaurant.title}
                        </Badge>
                      ))}
                      {discount.restaurants && discount.restaurants.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{discount.restaurants.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`status-${discount.id}`}
                        checked={discount.isActive}
                        onCheckedChange={() => toggleStatus(discount.id, discount.isActive)}
                      />
                      <Label htmlFor={`status-${discount.id}`}>
                        {discount.isActive ? t.active : t.inactive}
                      </Label>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(discount.maxUses || discount.currentUses) && (
                      <div className="text-xs text-muted-foreground">
                        {discount.currentUses || 0}/{discount.maxUses || '∞'}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(discount)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <TrashIcon className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t.deleteConfirm}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {language === 'ru' 
                                ? 'Это действие нельзя отменить. Скидка будет удалена безвозвратно.' 
                                : 'ამ მოქმედების გაუქმება შეუძლებელია. ფასდაკლება სამუდამოდ წაიშლება.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t.cancel}
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(discount.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {language === 'ru' ? 'Удалить' : 'წაშლა'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DiscountsTable;