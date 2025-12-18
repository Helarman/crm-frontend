'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { PlusIcon, PencilIcon, TrashIcon, Check, ChevronsUpDown, X } from 'lucide-react'
import { SurchargeDto, SurchargeResponse, SurchargeService } from '@/lib/api/surcharge.service'
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
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguageStore } from '@/lib/stores/language-store'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "BANQUET";

interface Restaurant {
  id: string;
  title: string;
}

interface OrderTypeOption {
  value: OrderType;
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
    type: 'Тип',
    amount: 'Сумма',
    orderTypes: 'Типы заказов',
    restaurants: 'Рестораны',
    status: 'Статус',
    actions: 'Действия',
    fixed: 'Фиксированная',
    percentage: 'Процентная',
    active: 'Активна',
    inactive: 'Неактивна',
    all: 'Все',
    noData: 'Нет данных для отображения',
    loadingError: 'Ошибка загрузки надбавок',
    addSurcharge: 'Добавить надбавку',
    editSurcharge: 'Редактировать надбавку',
    deleteConfirm: 'Вы уверены, что хотите удалить эту надбавку?',
    surchargeTitle: 'Управление надбавками',
    description: 'Описание',
    startDate: 'Дата начала',
    endDate: 'Дата окончания',
    cancel: 'Отмена',
    save: 'Сохранить',
    add: 'Добавить',
    selectType: 'Выберите тип',
    selectDate: 'Выберите дату',
    selectOrderTypes: 'Выберите типы заказов',
    selectRestaurants: 'Выберите рестораны',
    dineIn: 'В зале',
    takeaway: 'На вынос',
    delivery: 'Доставка',
    banquet: 'Банкет',
    selected: 'выбрано',
    toggleStatus: 'Активировать/деактивировать'
  },
  ka: {
    title: 'სახელი',
    type: 'ტიპი',
    amount: 'თანხა',
    orderTypes: 'შეკვეთის ტიპები',
    restaurants: 'რესტორნები',
    status: 'სტატუსი',
    actions: 'მოქმედებები',
    fixed: 'ფიქსირებული',
    percentage: 'პროცენტული',
    active: 'აქტიური',
    inactive: 'არააქტიური',
    all: 'ყველა',
    noData: 'მონაცემები არ მოიძებნა',
    loadingError: 'მოდიფიკატორების ჩატვირთვის შეცდომა',
    addSurcharge: 'დაამატეთ დანამატი',
    editSurcharge: 'რედაქტირება დანამატი',
    deleteConfirm: 'დარწმუნებული ხართ, რომ გსურთ ამ დანამატის წაშლა?',
    surchargeTitle: 'მოდიფიკატორების მართვა',
    description: 'აღწერა',
    startDate: 'დაწყების თარიღი',
    endDate: 'დამთავრების თარიღი',
    cancel: 'გაუქმება',
    save: 'შენახვა',
    add: 'დამატება',
    selectType: 'აირჩიეთ ტიპი',
    selectDate: 'აირჩიეთ თარიღი',
    selectOrderTypes: 'აირჩიეთ შეკვეთის ტიპები',
    selectRestaurants: 'აირჩიეთ რესტორნები',
    dineIn: 'დარბაზში',
    takeaway: 'წასაღები',
    delivery: 'მიტანა',
    banquet: 'ბანკეტი',
    selected: 'selected',
    toggleStatus: 'გააქტიურება/გამორთვა'
  }
};

const SurchargesTable = () => {
  const { language } = useLanguageStore();
  const t = translations[language];

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingSurcharge, setEditingSurcharge] = useState<SurchargeResponse | null>(null);
  const [formData, setFormData] = useState<Partial<SurchargeDto>>({
    title: '',
    description: '',
    type: 'FIXED',
    amount: 0,
    orderTypes: [],
    isActive: true,
    restaurantIds: []
  });

  const [openOrderTypesDialog, setOpenOrderTypesDialog] = useState<boolean>(false);
  const [openRestaurantsDialog, setOpenRestaurantsDialog] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>('');

  const { data: surcharges, error: surchargesError, isLoading } = useSWR<SurchargeResponse[]>('surcharges', () => SurchargeService.getAll());
  const { data: restaurants, error: restaurantsError } = useSWR<Restaurant[]>('restaurants', () => RestaurantService.getAll());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'amount' ? Number(value) : value 
    }));
  };

  const handleSelectChange = (name: string, value: any): void => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSelection = (currentItems: string[], itemId: string): string[] => {
    return currentItems.includes(itemId)
      ? currentItems.filter(id => id !== itemId)
      : [...currentItems, itemId];
  };

  const handleEdit = (surcharge: SurchargeResponse): void => {
    setEditingSurcharge(surcharge);
    setFormData({
      title: surcharge.title,
      description: surcharge.description || '',
      type: surcharge.type,
      amount: surcharge.amount,
      orderTypes: surcharge.orderTypes,
      isActive: surcharge.isActive,
      restaurantIds: surcharge.restaurants?.map(r => r.restaurant.id) || [],
      startDate: surcharge.startDate || undefined,
      endDate: surcharge.endDate || undefined
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    try {
      if (editingSurcharge) {
        await SurchargeService.update(editingSurcharge.id, formData as SurchargeDto);
        toast.success(language === 'ru' ? 'Надбавка успешно обновлена' : 'დანამატი წარმატებით განახლდა');
      } else {
        await SurchargeService.create(formData as SurchargeDto);
        toast.success(language === 'ru' ? 'Надбавка успешно создана' : 'დანამატი წარმატებით შეიქმნა');
      }
      
      mutate('surcharges');
      setIsDialogOpen(false);
      setEditingSurcharge(null);
      setFormData({
        title: '',
        description: '',
        type: 'FIXED',
        amount: 0,
        orderTypes: [],
        isActive: true,
        restaurantIds: []
      });
    } catch (error) {
      console.error('Error saving surcharge:', error);
      toast.error(language === 'ru' ? 'Ошибка при сохранении надбавки' : 'დანამატის შენახვის შეცდომა');
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await SurchargeService.delete(id);
      mutate('surcharges');
      toast.success(language === 'ru' ? 'Надбавка успешно удалена' : 'დანამატი წარმატებით წაიშალა');
    } catch (error) {
      console.error('Error deleting surcharge:', error);
      toast.error(language === 'ru' ? 'Ошибка при удалении надбавки' : 'დანამატის წაშლის შეცდომა');
    }
  };

  const toggleStatus = async (id: string, isActive: boolean): Promise<void> => {
    try {
      await SurchargeService.toggleStatus(id, !isActive);
      mutate('surcharges');
      toast.success(
        language === 'ru' 
          ? `Надбавка ${!isActive ? 'активирована' : 'деактивирована'}` 
          : `დანამატი ${!isActive ? 'გააქტიურდა' : 'გათიშულია'}`
      );
    } catch (error) {
      console.error('Error toggling surcharge status:', error);
      toast.error(language === 'ru' ? 'Ошибка изменения статуса' : 'სტატუსის შეცვლის შეცდომა');
    }
  };

  if (surchargesError || restaurantsError) {
    return <div className="text-red-500">{t.loadingError}</div>;
  }

  const orderTypeOptions: OrderTypeOption[] = [
    { value: 'DINE_IN', label: t.dineIn },
    { value: 'TAKEAWAY', label: t.takeaway },
    { value: 'DELIVERY', label: t.delivery },
    { value: 'BANQUET', label: t.banquet },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t.surchargeTitle}</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSurcharge(null)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              {t.addSurcharge}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingSurcharge ? t.editSurcharge : t.addSurcharge}
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
                    onValueChange={(value: 'FIXED' | 'PERCENTAGE') => handleSelectChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.selectType} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">{t.fixed}</SelectItem>
                      <SelectItem value="PERCENTAGE">{t.percentage}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="mb-2" htmlFor="amount">
                  {t.amount} ({formData.type === 'FIXED' ? '₽' : '%'})
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label className="mb-2">{t.orderTypes}</Label>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenOrderTypesDialog(true);
                  }}
                  type="button"
                >
                  {formData.orderTypes?.length
                    ? `${formData.orderTypes.length} ${t.selected}`
                    : t.selectOrderTypes}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                
                {openOrderTypesDialog && (
                  <div 
                    className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setOpenOrderTypesDialog(false)}
                  >
                    <div 
                      className="bg-background rounded-lg border shadow-lg w-full max-w-md max-h-[80vh] overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Command shouldFilter={false} className="h-full">
                        <CommandInput 
                          placeholder={t.selectOrderTypes}
                          onValueChange={(value: string) => setSearchValue(value)}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {language === 'ru' ? 'Типы заказов не найдены' : 'შეკვეთის ტიპები ვერ მოიძებნა'}
                          </CommandEmpty>
                          <CommandGroup className="max-h-[300px] overflow-y-auto">
                            {orderTypeOptions
                              .filter(option => 
                                option.label.toLowerCase().includes(searchValue.toLowerCase())
                              )
                              .map((option) => (
                                <CommandItem
                                  key={option.value}
                                  value={option.value}
                                  onSelect={() => {
                                    const newOrderTypes = toggleSelection(
                                      formData.orderTypes || [], 
                                      option.value
                                    );
                                    handleSelectChange('orderTypes', newOrderTypes);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.orderTypes?.includes(option.value)
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

                {formData.orderTypes && formData.orderTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.orderTypes.map(type => {
                      const label = orderTypeOptions.find(o => o.value === type)?.label;
                      return (
                        <Badge 
                          key={type} 
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {label}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              const newOrderTypes = formData.orderTypes?.filter(t => t !== type) || [];
                              handleSelectChange('orderTypes', newOrderTypes);
                            }}
                            className="rounded-full p-0.5 hover:bg-muted"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <Label className="mb-2">{t.restaurants}</Label>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenRestaurantsDialog(true);
                  }}
                  type="button"
                >
                  {formData.restaurantIds?.length
                    ? `${formData.restaurantIds.length} ${t.selected}`
                    : t.selectRestaurants}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                
                {openRestaurantsDialog && (
                  <div 
                    className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setOpenRestaurantsDialog(false)}
                  >
                    <div 
                      className="bg-background rounded-lg border shadow-lg w-full max-w-md max-h-[80vh] overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Command shouldFilter={false} className="h-full">
                        <CommandInput 
                          placeholder={t.selectRestaurants}
                          onValueChange={(value: string) => setSearchValue(value)}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {language === 'ru' ? 'Рестораны не найдены' : 'რესტორნები ვერ მოიძებნა'}
                          </CommandEmpty>
                          <CommandGroup className="max-h-[300px] overflow-y-auto">
                            {restaurants
                              ?.filter(restaurant => 
                                restaurant.title.toLowerCase().includes(searchValue.toLowerCase())
                              )
                              .map((restaurant) => (
                                <CommandItem
                                  key={restaurant.id}
                                  value={restaurant.id}
                                  onSelect={() => {
                                    const newRestaurantIds = toggleSelection(
                                      formData.restaurantIds || [], 
                                      restaurant.id
                                    );
                                    handleSelectChange('restaurantIds', newRestaurantIds);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.restaurantIds?.includes(restaurant.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {restaurant.title}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </div>
                  </div>
                )}

                {formData.restaurantIds && formData.restaurantIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.restaurantIds.map(id => {
                      const restaurant = restaurants?.find(r => r.id === id);
                      return restaurant ? (
                        <Badge 
                          key={id} 
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {restaurant.title}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              const newRestaurantIds = formData.restaurantIds?.filter(r => r !== id) || [];
                              handleSelectChange('restaurantIds', newRestaurantIds);
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
                  {editingSurcharge ? t.save : t.add}
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
              <TableHead>{t.amount}</TableHead>
              <TableHead>{t.orderTypes}</TableHead>
              <TableHead>{t.restaurants}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead>{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ) : surcharges?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  {t.noData}
                </TableCell>
              </TableRow>
            ) : (
              surcharges?.map((surcharge) => (
                <TableRow key={surcharge.id}>
                  <TableCell>
                    <div className="font-medium">{surcharge.title}</div>
                    {surcharge.description && (
                      <div className="text-sm text-muted-foreground">{surcharge.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {surcharge.type === 'FIXED' ? t.fixed : t.percentage}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {surcharge.type === 'FIXED'
                      ? `${surcharge.amount} ₽`
                      : `${surcharge.amount}%`}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {surcharge.orderTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type === 'DINE_IN' && t.dineIn}
                          {type === 'TAKEAWAY' && t.takeaway}
                          {type === 'DELIVERY' && t.delivery}
                          {type === 'BANQUET' && t.banquet}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {surcharge.restaurants?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {surcharge.restaurants.slice(0, 2).map((r) => (
                          <Badge key={r.restaurant.id} variant="secondary" className="text-xs">
                            {r.restaurant.title}
                          </Badge>
                        ))}
                        {surcharge.restaurants.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{surcharge.restaurants.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">{t.all}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div 
                        className={`w-3 h-3 rounded-full ${surcharge.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                      />
                      <span className="text-sm">
                        {surcharge.isActive ? t.active : t.inactive}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(surcharge)}
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
                                ? 'Это действие нельзя отменить. Надбавка будет удалена безвозвратно.' 
                                : 'ამ მოქმედების გაუქმება შეუძლებელია. დანამატი სამუდამოდ წაიშლება.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t.cancel}
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(surcharge.id)}
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

export default SurchargesTable;