'use client'

import { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { OrderAdditiveService, OrderAdditiveWithRelations, CreateOrderAdditiveDto, UpdateOrderAdditiveDto, EnumOrderType, OrderAdditiveType } from '@/lib/api/order-additive.service';
import { NetworkService } from '@/lib/api/network.service';
import { Button } from '@/components/ui/button';
import { Plus, Store, RefreshCw, X, Filter } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrderAdditiveTable } from './OrderAdditiveTable';
import { OrderAdditiveModal } from './OrderAdditiveModal';
import { OrderAdditiveFilters } from './OrderAdditiveFilters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const STORAGE_KEY = 'selected_order_additive_network_id';

export const OrderAdditiveList = () => {
  const { language } = useLanguageStore();
  const { user } = useAuth();
  const [additives, setAdditives] = useState<OrderAdditiveWithRelations[]>([]);
  const [networks, setNetworks] = useState<any[]>([]);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNetworksLoading, setIsNetworksLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAdditiveId, setCurrentAdditiveId] = useState<string | null | undefined>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{
    orderType?: EnumOrderType;
    isActive?: boolean;
    type?: OrderAdditiveType;
  }>({});
  
  const [formData, setFormData] = useState<CreateOrderAdditiveDto>({
    title: '',
    description: '',
    price: 0,
    type: OrderAdditiveType.FIXED,
    orderTypes: [],
    inventoryItemId: '',
    ingredientQuantity: 1.0,
    networkId: '',
    isActive: true,
  });

  const translations = {
    ru: {
      addOrderAdditive: 'Добавить модификатор заказа',
      title: 'Модификаторы заказов',
      selectNetwork: 'Выберите сеть',
      selectNetworkDescription: 'Выберите сеть для управления модификаторами заказов',
      noNetworks: 'Нет доступных сетей',
      noNetworksDescription: 'У вас нет доступа к каким-либо сетям ресторанов',
      manageNetworks: 'Управление сетями',
      networkManagement: 'Управление модификаторами заказов сети',
      loading: 'Загрузка...',
      changeNetwork: 'Сменить сеть',
      currentNetwork: 'Текущая сеть',
      hideSelector: 'Скрыть выбор сети',
      clearNetworkSelection: 'Очистить выбор сети',
      refresh: 'Обновить',
      networkRestaurants: (count: number) => `${count} ресторан(ов)`,
      additivesCount: (count: number) => `${count} модификатор(ов)`,
      backToNetworks: 'Сети',
      viewAdditives: 'Просмотр модификаторов заказов',
      allOrderTypes: 'Все типы заказов',
      allAdditiveTypes: 'Все типы модификаторов',
      allStatuses: 'Все статусы',
      active: 'Активные',
      inactive: 'Неактивные',
      orderType: 'Тип заказа',
      additiveType: 'Тип модификатора',
      status: 'Статус',
      clearFilters: 'Сбросить фильтры'
    },
    ka: {
      addOrderAdditive: 'შეკვეთის მოდიფიკატორის დამატება',
      title: 'შეკვეთის მოდიფიკატორები',
      selectNetwork: 'აირჩიეთ ქსელი',
      selectNetworkDescription: 'აირჩიეთ ქსელი შეკვეთის მოდიფიკატორების მართვისთვის',
      noNetworks: 'წვდომადი ქსელები არ არის',
      noNetworksDescription: 'თქვენ არ გაქვთ წვდომა რესტორნების ქსელებზე',
      manageNetworks: 'ქსელების მართვა',
      networkManagement: 'ქსელის შეკვეთის მოდიფიკატორების მართვა',
      loading: 'იტვირთება...',
      changeNetwork: 'ქსელის შეცვლა',
      currentNetwork: 'მიმდინარე ქსელი',
      hideSelector: 'ქსელის არჩევის დამალვა',
      clearNetworkSelection: 'ქსელის არჩევის გასუფთავება',
      refresh: 'განახლება',
      networkRestaurants: (count: number) => `${count} რესტორნი`,
      additivesCount: (count: number) => `${count} მოდიფიკატორი`,
      backToNetworks: 'ქსელები',
      viewAdditives: 'შეკვეთის მოდიფიკატორების ნახვა',
      allOrderTypes: 'ყველა შეკვეთის ტიპი',
      allAdditiveTypes: 'ყველა მოდიფიკატორის ტიპი',
      allStatuses: 'ყველა სტატუსი',
      active: 'აქტიური',
      inactive: 'არააქტიური',
      orderType: 'შეკვეთის ტიპი',
      additiveType: 'მოდიფიკატორის ტიპი',
      status: 'სტატუსი',
      clearFilters: 'ფილტრების გასუფთავება'
    }
  };

  const t = translations[language as 'ru' | 'ka'];

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
              setSelectedNetworkId(networksData[0].id);
            }
          } else if (networksData.length === 1) {
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

  // Загрузка модификаторов при выборе сети
  useEffect(() => {
    if (selectedNetworkId) {
      fetchAdditives();
    } else {
      setAdditives([]);
    }
  }, [selectedNetworkId, filters]);

  const fetchAdditives = async () => {
    if (!selectedNetworkId) return;

    setIsLoading(true);
    try {
      const data = await OrderAdditiveService.getByNetwork(
        selectedNetworkId
      );
      // Применяем фильтры на клиенте для простоты
      let filteredData = data;
      
      if (filters.orderType) {
        filteredData = filteredData.filter(additive => 
          additive.orderTypes.includes(filters.orderType!)
        );
      }
      
      if (filters.type) {
        filteredData = filteredData.filter(additive => 
          additive.type === filters.type
        );
      }
      
      if (filters.isActive !== undefined) {
        filteredData = filteredData.filter(additive => 
          additive.isActive === filters.isActive
        );
      }
      
      if (searchTerm) {
        filteredData = filteredData.filter(additive =>
          additive.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          additive.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setAdditives(filteredData);
    } catch (error) {
      console.error('Error fetching order additives:', error);
      setAdditives([]);
      toast.error(language === 'ru' ? 'Ошибка загрузки модификаторов заказов' : 'შეკვეთის მოდიფიკატორების ჩატვირთვის შეცდომა');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (name: keyof CreateOrderAdditiveDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    setFormData({
      title: '',
      description: '',
      price: 0,
      type: OrderAdditiveType.FIXED,
      orderTypes: [],
      inventoryItemId: '',
      ingredientQuantity: 1.0,
      networkId: selectedNetworkId || '',
      isActive: true,
    });
    setCurrentAdditiveId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (additive: OrderAdditiveWithRelations) => {
    setCurrentAdditiveId(additive.id);
    setFormData({
      title: additive.title,
      description: additive.description || '',
      price: additive.price,
      type: additive.type,
      orderTypes: additive.orderTypes,
      inventoryItemId: additive.inventoryItemId || '',
      ingredientQuantity: additive.ingredientQuantity || 1.0,
      networkId: additive.networkId || selectedNetworkId || '',
      isActive: additive.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSubmitSuccess = () => {
    fetchAdditives();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await OrderAdditiveService.delete(id);
      fetchAdditives();
      toast.success(language === 'ru' ? 'Модификатор заказа удален' : 'შეკვეთის მოდიფიკატორი წაიშალა');
    } catch (error) {
      console.error('Error deleting order additive:', error);
      toast.error(language === 'ru' ? 'Ошибка удаления' : 'წაშლის შეცდომა');
    }
  };

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetworkId(networkId);
    setShowNetworkSelector(false);
    setSearchTerm('');
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

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
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
                  {t.networkRestaurants(currentNetwork.restaurants?.length || 0)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {networks.map((network) => (
            <Card
              key={network.id}
              className={`cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50 ${
                network.id === selectedNetworkId
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
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
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
              {t.networkManagement} • {t.additivesCount(additives.length)}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAdditives}
              className="h-6 w-6 p-0"
              title={t.refresh}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" />
            {t.addOrderAdditive}
          </Button>
        </div>
      </div>

      {/* Фильтры */}
      <OrderAdditiveFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        language={language}
      />

      {/* Таблица модификаторов */}
      <OrderAdditiveTable
        additives={additives}
        isLoading={isLoading && additives.length === 0}
        language={language}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      <OrderAdditiveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={handleSubmitSuccess}
        additiveId={currentAdditiveId}
        formData={formData}
        onInputChange={handleInputChange}
        language={language}
        selectedNetworkId={selectedNetworkId}
      />
    </div>
  );
};