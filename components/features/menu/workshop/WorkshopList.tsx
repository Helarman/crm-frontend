import { useState, useEffect, useMemo } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { WorkshopService, WorkshopResponseDto, CreateWorkshopDto, UpdateWorkshopDto } from '@/lib/api/workshop.service';
import { Button } from '@/components/ui/button';
import { Plus, Store, RefreshCw, X } from 'lucide-react';
import { WorkshopTable } from './WorkshopTable';
import { WorkshopModal } from './WorkshopModal';
import { WorkshopFilters } from './WorkshopFilters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/hooks/useAuth';
import { Restaurant } from '@/lib/types/restaurant';
import { NetworkService } from '@/lib/api/network.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'selected_workshop_network_id';

export const WorkshopList = () => {
  const router = useRouter();
  const { language } = useLanguageStore();
  const { user } = useAuth();
  
  const [networks, setNetworks] = useState<any[]>([]);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  
  const [workshops, setWorkshops] = useState<WorkshopResponseDto[]>([]);
  const [filteredWorkshops, setFilteredWorkshops] = useState<WorkshopResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNetworksLoading, setIsNetworksLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWorkshopId, setCurrentWorkshopId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all');

  const translations = {
    ru: {
      title: 'Цехи',
      selectNetwork: 'Выберите сеть',
      selectNetworkDescription: 'Выберите сеть для управления цехами',
      noNetworks: 'Нет доступных сетей',
      noNetworksDescription: 'У вас нет доступа к каким-либо сетям ресторанов',
      manageNetworks: 'Управление сетями',
      networkManagement: 'Управление цехами сети',
      addWorkshop: 'Добавить цех',
      loading: 'Загрузка...',
      filterByRestaurant: 'Фильтр по ресторану',
      allRestaurants: 'Все рестораны',
      workshopsCount: (count: number) => `${count} цехов`,
      restaurantsCount: (count: number) => `${count} ресторан(ов)`,
      changeNetwork: 'Сменить сеть',
      currentNetwork: 'Текущая сеть',
      hideSelector: 'Скрыть выбор сети',
      clearNetworkSelection: 'Очистить выбор сети',
      refresh: 'Обновить',
      network: 'Сеть',
      workshopsInNetwork: 'Цехи в сети',
      viewRestaurants: 'Просмотр ресторанов'
    },
    ka: {
      title: 'სახელოსნოები',
      selectNetwork: 'აირჩიეთ ქსელი',
      selectNetworkDescription: 'აირჩიეთ ქსელი სახელოსნოების მართვისთვის',
      noNetworks: 'წვდომადი ქსელები არ არის',
      noNetworksDescription: 'თქვენ არ გაქვთ წვდომა რესტორნების ქსელებზე',
      manageNetworks: 'ქსელების მართვა',
      networkManagement: 'ქსელის სახელოსნოების მართვა',
      addWorkshop: 'სახელოსნოს დამატება',
      loading: 'იტვირთება...',
      filterByRestaurant: 'ფილტრი რესტორანის მიხედვით',
      allRestaurants: 'ყველა რესტორნი',
      workshopsCount: (count: number) => `${count} სახელოსნო`,
      restaurantsCount: (count: number) => `${count} რესტორნი`,
      changeNetwork: 'ქსელის შეცვლა',
      currentNetwork: 'მიმდინარე ქსელი',
      hideSelector: 'ქსელის არჩევის დამალვა',
      clearNetworkSelection: 'ქსელის არჩევის გასუფთავება',
      refresh: 'განახლება',
      network: 'ქსელი',
      workshopsInNetwork: 'სახელოსნოები ქსელში',
      viewRestaurants: 'რესტორანების ნახვა'
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
      } catch (error) {
        console.error('Error fetching networks:', error);
        toast.error(language === 'ru' ? 'Ошибка загрузки сетей' : 'ქსელების ჩატვირთვის შეცდომა');
      } finally {
        setIsNetworksLoading(false);
      }
    };
    
    if (user?.id) {
      loadNetworks();
    }
  }, [user?.id, language]);

  // Загрузка данных при выборе сети
  useEffect(() => {
    if (selectedNetworkId) {
      fetchWorkshops();
      fetchRestaurants();
    }
  }, [selectedNetworkId, selectedRestaurant]);

  // Фильтрация цехов
  useEffect(() => {
    filterWorkshops();
  }, [searchTerm, workshops]);

  const fetchRestaurants = async () => {
    if (!selectedNetworkId) return;
    
    try {
      const restaurantsData = await NetworkService.getRestaurants(selectedNetworkId);
      setRestaurants(restaurantsData || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setRestaurants([]);
    }
  };

  const fetchWorkshops = async () => {
    if (!selectedNetworkId) return;
    
    setIsLoading(true);
    try {
      let data;
      
      if (selectedRestaurant === 'all') {
        data = await WorkshopService.findByNetworkId(selectedNetworkId);
      } else {
        data = await WorkshopService.findByRestaurantId(selectedRestaurant);
      }
      
      setWorkshops(data);
    } catch (error) {
      console.error('Error fetching workshops:', error);
      toast.error(language === 'ru' ? 'Ошибка загрузки цехов' : 'სახელოსნოების ჩატვირთვის შეცდომა');
    } finally {
      setIsLoading(false);
    }
  };

  const filterWorkshops = () => {
    if (!searchTerm) {
      setFilteredWorkshops(workshops);
      return;
    }

    const search = searchTerm.toLowerCase();
    const filtered = workshops.filter(workshop =>
      workshop.name.toLowerCase().includes(search) ||
      (workshop.network?.name?.toLowerCase() || '').includes(search)
    );

    setFilteredWorkshops(filtered);
  };

  const handleDelete = async (id: string) => {
    try {
      await WorkshopService.delete(id);
      toast.success(language === 'ru' ? 'Цех удален' : 'სახელოსნო წაიშალა');
      fetchWorkshops();
    } catch (error) {
      console.error('Error deleting workshop:', error);
      toast.error(language === 'ru' ? 'Ошибка удаления' : 'წაშლის შეცდომა');
    }
  };

  const handleRefreshData = () => {
    fetchWorkshops();
  };

  const openAddModal = () => {
    setCurrentWorkshopId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (workshop: WorkshopResponseDto) => {
    setCurrentWorkshopId(workshop.id);
    setIsModalOpen(true);
  };

  const handleSubmitSuccess = () => {
    fetchWorkshops();
    setIsModalOpen(false);
  };

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetworkId(networkId);
    setShowNetworkSelector(false);
    setSearchTerm('');
    setSelectedRestaurant('all');
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
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
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
                <div className="flex gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {t.workshopsCount(workshops.length)}
                  </Badge>
                  <Badge variant="outline">
                    {t.restaurantsCount(currentNetwork.restaurants?.length || 0)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {networks.map((network) => (
            <Card 
              key={network.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
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
                    <span className="text-muted-foreground flex items-center gap-1">
                      {language === 'ru' ? 'Цехи:' : 'სახელოსნოები:'}
                    </span>
                    <Badge variant="outline">
                      {/* Количество цехов можно подгрузить отдельно */}
                      {0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {language === 'ru' ? 'Рестораны:' : 'რესტორნები:'}
                    </span>
                    <Badge variant="outline">
                      {network.restaurants?.length || 0}
                    </Badge>
                  </div>
                  {network.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
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
          <Button onClick={() => router.push('/networks')}>
            {t.manageNetworks}
          </Button>
        </div>
      </div>
    );
  }

  // Если выбрана сеть и не показываем селектор
  if (isLoading && !workshops.length) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
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
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {currentNetwork?.name}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              {t.workshopsInNetwork} • {t.workshopsCount(workshops.length)}
              {selectedRestaurant !== 'all' && (
                <>
                  • {t.filterByRestaurant}: {restaurants.find(r => r.id === selectedRestaurant)?.title}
                </>
              )}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshData}
              className="h-6 w-6 p-0"
              title={t.refresh}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          {networks.length > 1 && (
            <Button 
              variant="outline" 
              onClick={handleChangeNetworkClick}
              size="sm"
              className="mb-2 sm:mb-0"
            >
              <Store className="h-3 w-3 mr-1" />
              {t.changeNetwork}
            </Button>
          )}
          <Button onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" />
            {t.addWorkshop}
          </Button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1">
          <WorkshopFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            language={language}
          />
        </div>
        
        <div>
          {restaurants.length > 0 && (
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t.filterByRestaurant} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t.allRestaurants}
                </SelectItem>
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Информация о количестве */}
      <div className="text-sm text-muted-foreground">
        {t.workshopsCount(workshops.length)}
        {searchTerm && (
          <span className="ml-2">
            • {language === 'ru' ? 'Найдено:' : 'ნაპოვნია:'} {filteredWorkshops.length}
          </span>
        )}
      </div>

      {/* Таблица цехов */}
      <WorkshopTable
        workshops={filteredWorkshops}
        isLoading={isLoading && workshops.length > 0}
        language={language}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onRefreshData={handleRefreshData}
      />

      {/* Модальное окно создания/редактирования цеха */}
      <WorkshopModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={handleSubmitSuccess}
        workshopId={currentWorkshopId}
        language={language}
        networkId={selectedNetworkId!}
        restaurants={restaurants}
      />
    </div>
  );
};