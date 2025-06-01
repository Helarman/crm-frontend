'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { PlusIcon, PencilIcon, TrashIcon, Check, ChevronsUpDown, X, CalendarIcon } from 'lucide-react'
import { CreateDiscountDto, DiscountResponseDto, DiscountService } from '@/lib/api/discount.service'
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
import { format } from 'date-fns'
import { ru, ka } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguageStore } from '@/lib/stores/language-store'
import { toast } from 'sonner'
import { ProductService } from '@/lib/api/product.service'
import { CategoryService } from '@/lib/api/category.service'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "BANQUET";
type DiscountType = "FIXED" | "PERCENTAGE";
type DiscountTargetType = "ALL" | "RESTAURANT" | "CATEGORY" | "PRODUCT" | "ORDER_TYPE";

interface Category {
  id: string;
  title: string;
}

interface Product {
  id: string;
  title: string;
}

interface Restaurant {
  id: string;
  title: string;
}

interface OrderTypeOption {
  value: OrderType;
  label: string;
}

interface TargetTypeOption {
  value: DiscountTargetType;
  label: string;
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
    targetType: 'Область применения',
    minOrderAmount: 'Мин. сумма заказа',
    orderTypes: 'Типы заказов',
    restaurants: 'Рестораны',
    categories: 'Категории',
    products: 'Продукты',
    status: 'Статус',
    actions: 'Действия',
    fixed: 'Фиксированная сумма',
    percentage: 'Процент',
    all: 'Ко всему меню',
    restaurant: 'По ресторанам',
    category: 'По категориям',
    product: 'По продуктам',
    order_type: 'По типу заказа',
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
    cancel: 'Отмена',
    save: 'Сохранить',
    add: 'Добавить',
    selectType: 'Выберите тип',
    selectTargetType: 'Выберите область применения',
    selectDate: 'Выберите дату',
    selectOrderTypes: 'Выберите типы заказов',
    selectRestaurants: 'Выберите рестораны',
    selectCategories: 'Выберите категории',
    selectProducts: 'Выберите продукты',
    dineIn: 'В зале',
    takeaway: 'На вынос',
    delivery: 'Доставка',
    banquet: 'Банкет',
    selected: 'выбрано',
    code: 'Промокод (если требуется)',
    maxUses: 'Макс. использований',
    currentUses: 'Использовано',
    daysOfWeek: 'Дни недели',
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница',
    saturday: 'Суббота',
    sunday: 'Воскресенье',
    toggleStatus: 'Активировать/деактивировать',
    activePeriod: 'Период действия',
    activeRestaurants: 'Действует в ресторанах',
    applicableTo: 'Применяется к',
    promoCode: 'Промокод',
    usageLimit: 'Лимит',
    usePromoCode: 'Использовать промокод',
    timeRestrictions: 'Ограничения по времени',
    applyTo: 'Применить к',
    allRestaurants: 'Все рестораны',
    specificRestaurants: 'Конкретные рестораны',
    searchPlaceholder: 'Поиск...',
    noResults: 'Ничего не найдено'
  },
  ka: {
    title: 'სახელი',
    type: 'ფასდაკლების ტიპი',
    value: 'ფასდაკლების ზომა',
    targetType: 'გამოყენების არეალი',
    minOrderAmount: 'მინ. შეკვეთის თანხა',
    orderTypes: 'შეკვეთის ტიპები',
    restaurants: 'რესტორნები',
    categories: 'კატეგორიები',
    products: 'პროდუქტები',
    status: 'სტატუსი',
    actions: 'მოქმედებები',
    fixed: 'ფიქსირებული თანხა',
    percentage: 'პროცენტი',
    all: 'მთელ მენიუზე',
    restaurant: 'რესტორნების მიხედვით',
    category: 'კატეგორიების მიხედვით',
    product: 'პროდუქტების მიხედვით',
    order_type: 'შეკვეთის ტიპის მიხედვით',
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
    cancel: 'გაუქმება',
    save: 'შენახვა',
    add: 'დამატება',
    selectType: 'აირჩიეთ ტიპი',
    selectTargetType: 'აირჩიეთ გამოყენების არეალი',
    selectDate: 'აირჩიეთ თარიღი',
    selectOrderTypes: 'აირჩიეთ შეკვეთის ტიპები',
    selectRestaurants: 'აირჩიეთ რესტორნები',
    selectCategories: 'აირჩიეთ კატეგორიები',
    selectProducts: 'აირჩიეთ პროდუქტები',
    dineIn: 'დარბაზში',
    takeaway: 'წასაღები',
    delivery: 'მიტანა',
    banquet: 'ბანკეტი',
    selected: 'არჩეული',
    code: 'პრომო კოდი (საჭიროების შემთხვევაში)',
    maxUses: 'მაქს. გამოყენება',
    currentUses: 'გამოყენებულია',
    daysOfWeek: 'კვირის დღეები',
    monday: 'ორშაბათი',
    tuesday: 'სამშაბათი',
    wednesday: 'ოთხშაბათი',
    thursday: 'ხუთშაბათი',
    friday: 'პარასკევი',
    saturday: 'შაბათი',
    sunday: 'კვირა',
    toggleStatus: 'გააქტიურება/გამორთვა',
    activePeriod: 'მოქმედების პერიოდი',
    activeRestaurants: 'მოქმედებს რესტორნებში',
    applicableTo: 'გამოიყენება',
    promoCode: 'პრომო კოდი',
    usageLimit: 'ლიმიტი',
    usePromoCode: 'პრომო კოდის გამოყენება',
    timeRestrictions: 'დროის შეზღუდვები',
    applyTo: 'გამოიყენება',
    allRestaurants: 'ყველა რესტორანი',
    specificRestaurants: 'კონკრეტული რესტორნები',
    searchPlaceholder: 'ძებნა...',
    noResults: 'ვერ მოიძებნა'
  }
};

const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  multiple = true
}: {
  options: { id: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  multiple?: boolean;
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
    <>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={() => setOpen(true)}
      >
        {value.length > 0 
          ? multiple 
            ? `${value.length} ${translations[useLanguageStore.getState().language].selected}`
            : options.find(opt => opt.id === value[0])?.label || placeholder
          : placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

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
    </>
  );
};

const DiscountsTable = () => {
  const { language } = useLanguageStore();
  const t = translations[language];
  const locale = language === 'ka' ? ka : ru;

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountResponseDto | null>(null);
  const [formData, setFormData] = useState<Partial<CreateDiscountDto>>({
    title: '',
    description: '',
    type: 'FIXED',
    value: 0,
    targetType: 'ALL',
    minOrderAmount: 0,
    orderTypes: [],
    restaurants: [],
    categories: [],
    products: [],
    isActive: true,
    code: '',
    maxUses: 0,
    daysOfWeek: [],
    startDate: undefined,
    endDate: undefined,
  });

  const { data: discounts, error: discountsError, isLoading } = useSWR<DiscountResponseDto[]>('discounts', () => DiscountService.getAll());
  const { data: restaurants, error: restaurantsError } = useSWR<Restaurant[]>('restaurants', () => RestaurantService.getAll());
  const { data: categories } = useSWR<Category[]>('categories', () => CategoryService.getAll());
  const { data: products } = useSWR<Product[]>('products', () => ProductService.getAll());

  const orderTypeOptions: OrderTypeOption[] = [
    { value: 'DINE_IN', label: t.dineIn },
    { value: 'TAKEAWAY', label: t.takeaway },
    { value: 'DELIVERY', label: t.delivery },
    { value: 'BANQUET', label: t.banquet },
  ];

  const targetTypeOptions: TargetTypeOption[] = [
    { value: 'ALL', label: t.all },
    { value: 'RESTAURANT', label: t.restaurant },
    { value: 'CATEGORY', label: t.category },
    { value: 'PRODUCT', label: t.product },
    { value: 'ORDER_TYPE', label: t.order_type },
  ];

  const daysOfWeekOptions = [
    { value: 0, label: t.monday },
    { value: 1, label: t.tuesday },
    { value: 2, label: t.wednesday },
    { value: 3, label: t.thursday },
    { value: 4, label: t.friday },
    { value: 5, label: t.saturday },
    { value: 6, label: t.sunday },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev : any) => ({ 
      ...prev, 
      [name]: name === 'value' || name === 'minOrderAmount' || name === 'maxUses' 
        ? Number(value) 
        : value 
    }));
  };

  const handleSelectChange = (name: string, value: any): void => {
    setFormData((prev : any) => ({ ...prev, [name]: value }));
    
    if (name === 'targetType') {
      setFormData((prev : any) => ({
        ...prev,
        restaurants: [],
        categories: [],
        products: [],
        orderTypes: []
      }));
    }
  };

  const handleDateChange = (name: string, date: Date | undefined): void => {
    setFormData((prev : any) => ({ ...prev, [name]: date }));
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
      orderTypes: discount.orderTypes,
      restaurants: discount.restaurants?.map(r => ({ restaurantId: r.restaurant.id })) || [],
      categories: discount.categories?.map(c => ({ categoryId: c.category.id })) || [],
      products: discount.products?.map(p => ({ productId: p.product.id })) || [],
      isActive: discount.isActive,
      code: discount.code || '',
      maxUses: discount.maxUses || 0,
      daysOfWeek: discount.daysOfWeek || [],
      startDate: discount.startDate ? new Date(discount.startDate) : undefined,
      endDate: discount.endDate ? new Date(discount.endDate) : undefined,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    try {
      const dataToSend = {
        ...formData,
        code: formData.code
      };

      if (editingDiscount) {
        await DiscountService.update(editingDiscount.id, dataToSend);
        toast.success(language === 'ru' ? 'Скидка успешно обновлена' : 'ფასდაკლება წარმატებით განახლდა');
      } else {
        await DiscountService.create(dataToSend as CreateDiscountDto);
        toast.success(language === 'ru' ? 'Скидка успешно создана' : 'ფასდაკლება წარმატებით შეიქმნა');
      }
      
      mutate('discounts');
      setIsDialogOpen(false);
      setEditingDiscount(null);
      resetForm();
    } catch (error) {
      console.error('Error saving discount:', error);
      toast.error(language === 'ru' ? 'Ошибка при сохранении скидки' : 'ფასდაკლების შენახვის შეცდომა');
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
      orderTypes: [],
      restaurants: [],
      categories: [],
      products: [],
      isActive: true,
      code: '',
      maxUses: 0,
      daysOfWeek: [],
      startDate: undefined,
      endDate: undefined,
    });
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
                  />
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

              {formData.targetType === 'RESTAURANT' && (
                <div>
                  <Label className="mb-2">{t.restaurants}</Label>
                  <SearchableSelect
                    options={restaurants?.map(r => ({ id: r.id, label: r.title })) || []}
                    value={formData.restaurants?.map(( r : any ) => r.restaurantId) || []}
                    onChange={(ids) => {
                      handleSelectChange('restaurants', ids.map(id => ({ restaurantId: id })));
                    }}
                    placeholder={t.selectRestaurants}
                    searchPlaceholder={t.searchPlaceholder}
                    emptyText={t.noResults}
                  />
                </div>
              )}

              {formData.targetType === 'CATEGORY' && (
                <div>
                  <Label className="mb-2">{t.categories}</Label>
                  <SearchableSelect
                    options={categories?.map(c => ({ id: c.id, label: c.title })) || []}
                    value={formData.categories?.map(( c : any ) => c.categoryId) || []}
                    onChange={(ids) => {
                      handleSelectChange('categories', ids.map(id => ({ categoryId: id })));
                    }}
                    placeholder={t.selectCategories}
                    searchPlaceholder={t.searchPlaceholder}
                    emptyText={t.noResults}
                  />
                </div>
              )}

              {formData.targetType === 'PRODUCT' && (
                <div>
                  <Label className="mb-2">{t.products}</Label>
                  <SearchableSelect
                    options={products?.map(p => ({ id: p.id, label: p.title })) || []}
                    value={formData.products?.map(( p : any ) => p.productId) || []}
                    onChange={(ids) => {
                      handleSelectChange('products', ids.map(id => ({ productId: id })));
                    }}
                    placeholder={t.selectProducts}
                    searchPlaceholder={t.searchPlaceholder}
                    emptyText={t.noResults}
                  />
                </div>
              )}

              {formData.targetType === 'ORDER_TYPE' && (
                <div>
                  <Label className="mb-2">{t.orderTypes}</Label>
                  <SearchableSelect
                    options={orderTypeOptions.map(ot => ({ 
                      id: ot.value, 
                      label: ot.label 
                    }))}
                    value={formData.orderTypes || []}
                    onChange={(values) => {
                      handleSelectChange('orderTypes', values);
                    }}
                    placeholder={t.selectOrderTypes}
                    searchPlaceholder={t.searchPlaceholder}
                    emptyText={t.noResults}
                  />
                </div>
              )}

              <div className="space-y-4">
                <Label>{t.timeRestrictions}</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2">{t.startDate}</Label>
                    <div className="relative">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate
                          ? format(formData.startDate, 'PPP', { locale })
                          : <span>{t.selectDate}</span>}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2">{t.endDate}</Label>
                    <div className="relative">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate
                          ? format(formData.endDate, 'PPP', { locale })
                          : <span>{t.selectDate}</span>}
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-2">{t.daysOfWeek}</Label>
                  <SearchableSelect
                    options={daysOfWeekOptions.map(d => ({ 
                      id: d.value.toString(), 
                      label: d.label 
                    }))}
                    value={formData.daysOfWeek?.map((d : any) => d.toString()) || []}
                    onChange={(values) => {
                      handleSelectChange('daysOfWeek', values.map(v => parseInt(v)));
                    }}
                    placeholder={t.daysOfWeek}
                    searchPlaceholder={t.searchPlaceholder}
                    emptyText={t.noResults}
                  />
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
              <TableHead>{t.status}</TableHead>
              <TableHead>{t.usageLimit}</TableHead>
              <TableHead>{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ) : discounts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
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
                        {discount.targetType === 'RESTAURANT' && t.restaurant}
                        {discount.targetType === 'CATEGORY' && t.category}
                        {discount.targetType === 'PRODUCT' && t.product}
                        {discount.targetType === 'ORDER_TYPE' && t.order_type}
                      </Badge>
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
                      {discount.daysOfWeek?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {discount.daysOfWeek.map(day => (
                            <Badge key={day} variant="secondary" className="text-xs">
                              {daysOfWeekOptions.find(d => d.value === day)?.label}
                            </Badge>
                          ))}
                        </div>
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