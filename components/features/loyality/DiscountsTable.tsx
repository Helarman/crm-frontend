'use client'

import { useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { PlusIcon, PencilIcon, TrashIcon, Check, ChevronsUpDown, CalendarIcon, Store, RefreshCw, X, Layers } from 'lucide-react'
import { CreateDiscountDto, DiscountFormState, DiscountResponseDto, DiscountService } from '@/lib/api/discount.service'
import { RestaurantService } from '@/lib/api/restaurant.service'
import { NetworkService } from '@/lib/api/network.service'
import { ProductService } from '@/lib/api/product.service'
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
} from '@/components/ui/command'
import { Calendar } from '@/components/ui/calendar'
import { format, Locale } from 'date-fns'
import { ru, ka } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguageStore } from '@/lib/stores/language-store'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'

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

interface Network {
  id: string;
  name: string;
  description?: string;
  restaurants?: Restaurant[];
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
    invalidTimeRange: 'Время окончания должно быть после времени начала',
    selectNetwork: 'Выберите сеть',
    selectNetworkDescription: 'Выберите сеть для управления скидками',
    noNetworks: 'Нет доступных сетей',
    noNetworksDescription: 'У вас нет доступа к каким-либо сетям ресторанов',
    networkManagement: 'Управление скидками сети',
    loading: 'Загрузка...',
    changeNetwork: 'Сменить сеть',
    currentNetwork: 'Текущая сеть',
    hideSelector: 'Скрыть выбор сети',
    clearNetworkSelection: 'Очистить выбор сети',
    refresh: 'Обновить',
    networkRestaurants: `ресторан(ов)`,
    discountsCount: `скидка(ок)`,
    backToNetworks: 'Сети',
    viewDiscounts: 'Просмотр скидок',
    manageNetworks: 'Управление сетями'
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
    invalidTimeRange: 'დასრულების დრო უნდა იყოს დაწყების დროის შემდეგ',
    selectNetwork: 'აირჩიეთ ქსელი',
    selectNetworkDescription: 'აირჩიეთ ქსელი ფასდაკლების მართვისთვის',
    noNetworks: 'წვდომადი ქსელები არ არის',
    noNetworksDescription: 'თქვენ არ გაქვთ წვდომა რესტორნების ქსელებზე',
    networkManagement: 'ქსელის ფასდაკლებების მართვა',
    loading: 'იტვირთება...',
    changeNetwork: 'ქსელის შეცვლა',
    currentNetwork: 'მიმდინარე ქსელი',
    hideSelector: 'ქსელის არჩევის დამალვა',
    clearNetworkSelection: 'ქსელის არჩევის გასუფთავება',
    refresh: 'განახლება',
    networkRestaurants: `რესტორნი`,
    discountsCount: `ფასდაკლება`,
    backToNetworks: 'ქსელები',
    viewDiscounts: 'ფასდაკლების ნახვა',
    manageNetworks: 'ქსელების მართვა'
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
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={error ? "destructive" : "outline"}
            className={cn("w-full justify-start text-left font-normal", error && "border-red-500")}
            type="button"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPPp', { locale }) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <div className="p-3">
            <Calendar
              mode="single"
              selected={date || undefined}
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
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500">{error}</p>}
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

  const t = translations[useLanguageStore.getState().language];

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={error ? "destructive" : "outline"}
            className={cn("w-full justify-between", error && "border-red-500")}
            role="combobox"
            aria-expanded={open}
          >
            {value.length > 0
              ? multiple
                ? `${value.length} ${t.selected}`
                : options.find(opt => opt.id === value[0])?.label || placeholder
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command shouldFilter={false}>
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
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

const STORAGE_KEY = 'selected_network_id';

const DiscountsTable: React.FC = () => {
  const { language } = useLanguageStore();
  const { user } = useAuth();
  const t = translations[language];
  const locale = language === 'ka' ? ka : ru;

  // Состояние для выбора сети
  const [networks, setNetworks] = useState<Network[]>([]);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [isNetworksLoading, setIsNetworksLoading] = useState(true);

  // Существующие состояния
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
    startDate: undefined,
    endDate: undefined,
    startTime: 0,
    endTime: 0
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Загрузка сохраненной сети из localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNetworkId = localStorage.getItem(STORAGE_KEY);
      if (savedNetworkId) {
        setSelectedNetworkId(savedNetworkId);
      }
    }
  }, []);

  // Сохранение выбранной сети в localStorage
  useEffect(() => {
    if (selectedNetworkId && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, selectedNetworkId);
    }
  }, [selectedNetworkId]);

  // Загрузка сетей пользователя
  useEffect(() => {
    const loadNetworks = async () => {
      setIsNetworksLoading(true);
      try {
        if (user?.id) {
          const networksData = await NetworkService.getByUser(user.id);
          setNetworks(networksData);

          // Если есть сохраненная сеть, проверяем доступность
          if (selectedNetworkId) {
            const networkExists = networksData.some(n => n.id === selectedNetworkId);
            if (!networkExists && networksData.length > 0) {
              // Если сохраненной сети нет в доступных, выбираем первую
              setSelectedNetworkId(networksData[0].id);
            }
          } else if (networksData.length === 1) {
            // Если у пользователя только одна сеть, выбираем ее автоматически
            setSelectedNetworkId(networksData[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching networks:', error);
        toast.error(language === 'ru' ? 'Ошибка загрузки сетей' : 'ქსელების ჩატვირთვის შეცდომა');
      } finally {
        setIsNetworksLoading(false);
      }
    };

    loadNetworks();
  }, [user?.id, language]);
  const router = useRouter()
  // Загрузка скидок при выборе сети
  const { data: discounts, error: discountsError, isLoading: discountsLoading, mutate } = useSWR<DiscountResponseDto[]>(
    selectedNetworkId ? `discounts-network-${selectedNetworkId}` : null,
    () => selectedNetworkId ? DiscountService.getByNetwork(selectedNetworkId) : []
  );

  const { data: restaurants, error: restaurantsError } = useSWR<Restaurant[]>(
    selectedNetworkId ? `restaurants-network-${selectedNetworkId}` : null,
    () => selectedNetworkId ? RestaurantService.getByNetwork(selectedNetworkId) : []
  );

  const { data: products } = useSWR<Product[]>(
    selectedNetworkId ? `products-network-${selectedNetworkId}` : null,
    () => selectedNetworkId ? ProductService.getByNetwork(selectedNetworkId) : []
  );

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
    setFormData((prev: any) => ({
      ...prev,
      [name]: name === 'value' || name === 'minOrderAmount' || name === 'maxUses' || name === 'startTime' || name === 'endTime'
        ? Number(value)
        : value
    }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name: string, value: any): void => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));

    if (name === 'targetType') {
      setFormData((prev: any) => ({
        ...prev,
        productIds: []
      }));
    }
  };

  const handleDateChange = (name: string, date: Date | undefined): void => {
    setFormData((prev: any) => ({ ...prev, [name]: date }));
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

    if (!validateForm()) return;

    const restaurantIds = Array.isArray(formData.restaurantIds)
      ? formData.restaurantIds.filter(Boolean)
      : [];

    const productIds = formData.targetType === 'PRODUCT' && Array.isArray(formData.productIds)
      ? formData.productIds.filter(Boolean)
      : undefined;

    const requestData: CreateDiscountDto = {
      ...formData,
      networkId: selectedNetworkId as string,
      restaurantIds: restaurantIds.length > 0 ? restaurantIds : undefined,
      productIds,
      startDate: formData.startDate,
      endDate: formData.endDate,
    };

    try {
      if (editingDiscount) {
        await DiscountService.update(editingDiscount.id, requestData);
        toast.success(language === 'ru' ? 'Скидка успешно обновлена' : 'ფასდაკლება წარმატებით განახლდა');
      } else {
        await DiscountService.create(requestData);
        toast.success(language === 'ru' ? 'Скидка успешно создана' : 'ფასდაკლება წარმატებით შეიქმნა');
      }

      mutate();
      setIsDialogOpen(false);
      setEditingDiscount(null);
      resetForm();
    } catch (error) {
      console.error("Ошибка при сохранении:", error);
      toast.error(language === 'ru' ? 'Не удалось сохранить скидку' : 'ფასდაკლების შენახვა ვერ მოხერხდა');
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
      mutate();
      toast.success(language === 'ru' ? 'Скидка успешно удалена' : 'ფასდაკლება წარმატებით წაიშალა');
    } catch (error) {
      console.error('Error deleting discount:', error);
      toast.error(language === 'ru' ? 'Ошибка при удалении скидки' : 'ფასდაკლების წაშლის შეცდომა');
    }
  };

  const toggleStatus = async (id: string, isActive: boolean): Promise<void> => {
    try {
      await DiscountService.update(id, { isActive: !isActive });
      mutate();
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

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetworkId(networkId);
    setShowNetworkSelector(false);
    setFormData(prev => ({ ...prev, networkId }));
  };

  const handleChangeNetworkClick = () => {
    setShowNetworkSelector(true);
  };

  const handleClearNetwork = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setSelectedNetworkId(null);
    setShowNetworkSelector(true);
  };

  const refreshData = () => {
    mutate();
  };

  // Получаем текущую сеть
  const currentNetwork = networks.find(n => n.id === selectedNetworkId);

  // Если загружаются сети и нет выбранной сети
  if (isNetworksLoading && !selectedNetworkId) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Если показываем селектор сетей или нет выбранной сети
  if (showNetworkSelector || !selectedNetworkId) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold mb-2">
              {t.selectNetwork}
            </h2>
            {selectedNetworkId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNetworkSelector(false)}
                className="h-auto p-0 text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                {t.hideSelector}
              </Button>
            )}
          </div>
          <p className="text-muted-foreground">
            {t.selectNetworkDescription}
          </p>
        </div>

        {selectedNetworkId && currentNetwork && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Store className="h-5 w-5" />
                {t.currentNetwork}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{currentNetwork.name}</p>
                  {currentNetwork.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentNetwork.description}
                    </p>
                  )}
                </div>
                <Badge variant="outline">
                  {currentNetwork.restaurants?.length} {t.networkRestaurants}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {networks.map((network) => (
            <Card
              key={network.id}
              className={`cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50 ${network.id === selectedNetworkId
                ? 'border-primary border-2 bg-primary/5'
                : ''
                }`}
              onClick={() => handleNetworkSelect(network.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{network.name}</CardTitle>
                  {network.id === selectedNetworkId && (
                    <Badge className="bg-primary text-primary-foreground">
                      {language === 'ru' ? 'Текущая' : 'მიმდინარე'}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {language === 'ru' ? 'Сеть ресторанов' : 'რესტორნების ქსელი'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {language === 'ru' ? 'Рестораны:' : 'რესტორნები:'}
                    </span>
                    <Badge variant="outline">
                      {network.restaurants?.length || 0}
                    </Badge>
                  </div>
                  {network.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                      {network.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {networks.length === 0 && (
          <div className="text-center py-12">
            <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t.noNetworks}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t.noNetworksDescription}
            </p>
          </div>
        )}

        {selectedNetworkId && (
          <div className="mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleClearNetwork}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {t.clearNetworkSelection}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Основной интерфейс со скидками
  return (
    <div className="p-4 space-y-4">
      {/* Хлебные крошки и информация о сети */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {networks.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleChangeNetworkClick}
                  className="h-auto p-0 text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Store className="h-3 w-3" />
                  {t.changeNetwork}
                </Button>
                <span className="text-muted-foreground">/</span>
              </>
            )}
            <h2 className="text-xl font-semibold">
              {currentNetwork?.name}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {t.networkManagement} • {discounts?.length} {t.discountsCount}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshData}
              className="h-6 w-6 p-0"
              title={t.refresh}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <Button onClick={() => router.push('/discounts/new')}>
          <PlusIcon className="mr-2 h-4 w-4" />
          {t.addDiscount}
        </Button>
      </div>

      {/* Таблица скидок */}
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
            {discountsLoading ? (
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
                        onClick={() => router.push(`/discounts/${discount.id}`)}
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