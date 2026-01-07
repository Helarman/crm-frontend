'use client'

import { useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { PlusIcon, PencilIcon, TrashIcon, Check, ChevronsUpDown, X, Layers, Store, RefreshCw } from 'lucide-react'
import { SurchargeDto, SurchargeResponse, SurchargeService } from '@/lib/api/surcharge.service'
import { RestaurantService } from '@/lib/api/restaurant.service'
import { NetworkService } from '@/lib/api/network.service'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/hooks/useAuth'

type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "BANQUET";

interface Restaurant {
  id: string;
  title: string;
}

interface Network {
  id: string;
  name: string;
  description?: string;
  restaurants?: any[];
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
    toggleStatus: 'Активировать/деактивировать',
    selectNetwork: 'Выберите сеть',
    selectNetworkDescription: 'Выберите сеть для управления надбавками',
    noNetworks: 'Нет доступных сетей',
    noNetworksDescription: 'У вас нет доступа к каким-либо сетям ресторанов',
    manageNetworks: 'Управление сетями',
    networkManagement: 'Управление надбавками сети',
    loading: 'Загрузка...',
    changeNetwork: 'Сменить сеть',
    currentNetwork: 'Текущая сеть',
    hideSelector: 'Скрыть выбор сети',
    clearNetworkSelection: 'Очистить выбор сети',
    refresh: 'Обновить',
    networkRestaurants: `ресторан(ов)`,
    surchargesCount: `надбавок`,
    backToNetworks: 'Сети',
    viewSurcharges: 'Просмотр надбавок',
    surchargeManagement: 'Управление надбавками',
    network: 'Сеть',
    selectStartDate: 'Выберите дату начала',
    selectEndDate: 'Выберите дату окончания',
    isActive: 'Активна',
    noRestaurants: 'Нет ресторанов',
    allRestaurants: 'Все рестораны',
    edit: 'Редактировать',
    delete: 'Удалить',
    confirm: 'Подтвердить',
    search: 'Поиск',
    noResults: 'Результатов не найдено',
    close: 'Закрыть',
    yes: 'Да',
    no: 'Нет',
    apply: 'Применить',
    clear: 'Очистить',
    saveChanges: 'Сохранить изменения',
    required: 'Обязательное поле',
    optional: 'Необязательно',
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
    toggleStatus: 'გააქტიურება/გამორთვა',
    selectNetwork: 'აირჩიეთ ქსელი',
    selectNetworkDescription: 'აირჩიეთ ქსელი დანამატების მართვისთვის',
    noNetworks: 'წვდომადი ქსელები არ არის',
    noNetworksDescription: 'თქვენ არ გაქვთ წვდომა რესტორნების ქსელებზე',
    manageNetworks: 'ქსელების მართვა',
    networkManagement: 'ქსელის დანამატების მართვა',
    loading: 'იტვირთება...',
    changeNetwork: 'ქსელის შეცვლა',
    currentNetwork: 'მიმდინარე ქსელი',
    hideSelector: 'ქსელის არჩევის დამალვა',
    clearNetworkSelection: 'ქსელის არჩევის გასუფთავება',
    refresh: 'განახლება',
    networkRestaurants: `რესტორნი`,
    surchargesCount: `დანამატი`,
    backToNetworks: 'ქსელები',
    viewSurcharges: 'დანამატების ნახვა',
    surchargeManagement: 'დანამატების მართვა',
    network: 'ქსელი',
    selectStartDate: 'აირჩიეთ დაწყების თარიღი',
    selectEndDate: 'აირჩიეთ დამთავრების თარიღი',
    isActive: 'აქტიურია',
    noRestaurants: 'რესტორნები არ არის',
    allRestaurants: 'ყველა რესტორანი',
    edit: 'რედაქტირება',
    delete: 'წაშლა',
    confirm: 'დადასტურება',
    search: 'ძებნა',
    noResults: 'შედეგები ვერ მოიძებნა',
    close: 'დახურვა',
    yes: 'დიახ',
    no: 'არა',
    apply: 'გამოყენება',
    clear: 'გასუფთავება',
    saveChanges: 'ცვლილებების შენახვა',
    required: 'სავალდებულო ველი',
    optional: 'არასავალდებულო',
  }
};

const STORAGE_KEY = 'selected_network_id';

const SurchargesTable = () => {
  const { language } = useLanguageStore();
  const { user } = useAuth();
  const t = translations[language];

  const [showNetworkSelector, setShowNetworkSelector] = useState<boolean>(false);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [isNetworksLoading, setIsNetworksLoading] = useState<boolean>(true);

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
            const networkExists = networksData.some((n: Network) => n.id === selectedNetworkId);
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

  // Загрузка надбавок при выборе сети
  const { data: surcharges, error: surchargesError, isLoading: isLoadingSurcharges } = useSWR<SurchargeResponse[]>(
    selectedNetworkId ? `surcharges-network-${selectedNetworkId}` : null,
    () => SurchargeService.getByNetwork(selectedNetworkId!)
  );

  const { data: restaurants, error: restaurantsError } = useSWR<Restaurant[]>(
    selectedNetworkId ? `restaurants-network-${selectedNetworkId}` : null,
    () => RestaurantService.getByNetwork(selectedNetworkId!)
  );

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
        await SurchargeService.create({
          ...formData as SurchargeDto,
          networkId: selectedNetworkId!
        });
        toast.success(language === 'ru' ? 'Надбавка успешно создана' : 'დანამატი წარმატებით შეიქმნა');
      }

      mutate(selectedNetworkId ? `surcharges-network-${selectedNetworkId}` : null);
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
      mutate(selectedNetworkId ? `surcharges-network-${selectedNetworkId}` : null);
      toast.success(language === 'ru' ? 'Надбавка успешно удалена' : 'დანამატი წარმატებით წაიშალა');
    } catch (error) {
      console.error('Error deleting surcharge:', error);
      toast.error(language === 'ru' ? 'Ошибка при удалении надбавки' : 'დანამატის წაშლის შეცდომა');
    }
  };

  const toggleStatus = async (id: string, isActive: boolean): Promise<void> => {
    try {
      await SurchargeService.toggleStatus(id, !isActive);
      mutate(selectedNetworkId ? `surcharges-network-${selectedNetworkId}` : null);
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

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetworkId(networkId);
    setShowNetworkSelector(false);
  };

  const handleClearNetwork = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setSelectedNetworkId(null);
    setShowNetworkSelector(true);
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

  // Если нет сетей
  if (networks.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {t.noNetworks}
          </h3>
          <p className="text-muted-foreground mb-4">
            {t.noNetworksDescription}
          </p>
        </div>
      </div>
    );
  }

  if (surchargesError || restaurantsError) {
    return <div className="text-red-500">{t.loadingError}</div>;
  }

  const orderTypeOptions: OrderTypeOption[] = [
    { value: 'DINE_IN', label: t.dineIn },
    { value: 'TAKEAWAY', label: t.takeaway },
    { value: 'DELIVERY', label: t.delivery },
    { value: 'BANQUET', label: t.banquet },
  ];

  const fetchSurcharges = () => {
    mutate(selectedNetworkId ? `surcharges-network-${selectedNetworkId}` : null);
  };

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
                  onClick={() => setShowNetworkSelector(true)}
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
              {t.surchargeManagement} • {surcharges?.length} {t.surchargesCount}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchSurcharges}
              className="h-6 w-6 p-0"
              title={t.refresh}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>

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

      {/* Таблица надбавок */}
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
            {isLoadingSurcharges ? (
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