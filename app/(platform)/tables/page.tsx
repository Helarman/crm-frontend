// app/tables/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Network, NetworkService } from '@/lib/api/network.service';
import { Restaurant } from '@/lib/api/dictionaries.service';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Language, useLanguageStore } from '@/lib/stores/language-store';
import {
  Store,
  Table as TableIcon,
  Building,
  Table as TableSet,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const STORAGE_KEY = 'selected_table_network_id';

interface NetworkWithRestaurants extends Network {
  restaurants: Restaurant[];
}

export default function TablesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguageStore();

  const [networks, setNetworks] = useState<NetworkWithRestaurants[]>([]);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);

  const translations = {
    ru: {
      title: 'Столы',
      description: 'Управление столами ресторанов',
      selectNetwork: 'Выберите сеть',
      selectNetworkDescription: 'Выберите сеть для управления столами',
      noNetworks: 'Нет доступных сетей',
      noNetworksDescription: 'У вас нет доступа к каким-либо сетям ресторанов',
      loading: 'Загрузка...',
      changeNetwork: 'Сменить сеть',
      currentNetwork: 'Текущая сеть',
      hideSelector: 'Скрыть выбор сети',
      clearNetworkSelection: 'Очистить выбор сети',
      refresh: 'Обновить',
      restaurantsCount: (count: number) => `${count} ресторан(ов)`,
      viewTables: 'Просмотр столов',
      manageNetworks: 'Управление сетями',
      backToNetworks: 'Вернуться к выбору сети',
      networkOverview: 'Обзор сети',
      goToTables: 'Перейти к столам',
      allRestaurants: 'Все рестораны',
      selectNetworkFirst: 'Сначала выберите сеть',
      noRestaurants: 'Нет ресторанов в этой сети',
      viewRestaurantTables: 'Перейти к столам ресторана',
      tableManagement: 'Управление столами'
    },
    ka: {
      title: 'მაგიდები',
      description: 'რესტორნების მაგიდების მართვა',
      selectNetwork: 'აირჩიეთ ქსელი',
      selectNetworkDescription: 'აირჩიეთ ქსელი მაგიდების მართვისთვის',
      noNetworks: 'წვდომადი ქსელები არ არის',
      noNetworksDescription: 'თქვენ არ გაქვთ წვდომა რესტორნების ქსელებზე',
      loading: 'იტვირთება...',
      changeNetwork: 'ქსელის შეცვლა',
      currentNetwork: 'მიმდინარე ქსელი',
      hideSelector: 'ქსელის არჩევის დამალვა',
      clearNetworkSelection: 'ქსელის არჩევის გასუფთავება',
      refresh: 'განახლება',
      restaurantsCount: (count: number) => `${count} რესტორნი`,
      viewTables: 'მაგიდების ნახვა',
      manageNetworks: 'ქსელების მართვა',
      backToNetworks: 'ქსელების არჩევას დაბრუნება',
      networkOverview: 'ქსელის მიმოხილვა',
      goToTables: 'მაგიდებზე გადასვლა',
      allRestaurants: 'ყველა რესტორნი',
      selectNetworkFirst: 'ჯერ აირჩიეთ ქსელი',
      noRestaurants: 'ამ ქსელში რესტორნები არ არის',
      viewRestaurantTables: 'რესტორნის მაგიდებზე გადასვლა',
      tableManagement: 'მაგიდების მართვა'
    }
  };

  const t = translations[language as Language];

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
      if (!user?.id || authLoading) return;

      setLoading(true);
      try {
        const networksData = await NetworkService.getByUser(user.id);

        // Загружаем рестораны для каждой сети
        const networksWithRestaurants = await Promise.all(
          networksData.map(async (network) => {
            try {
              const restaurants = await NetworkService.getRestaurants(network.id);
              return {
                ...network,
                restaurants: restaurants || []
              };
            } catch (error) {
              console.error(`Failed to load restaurants for network ${network.id}:`, error);
              return {
                ...network,
                restaurants: []
              };
            }
          })
        );

        setNetworks(networksWithRestaurants);

        // Если есть сохраненная сеть, проверяем доступность
        if (selectedNetworkId) {
          const networkExists = networksWithRestaurants.some(n => n.id === selectedNetworkId);
          if (!networkExists && networksWithRestaurants.length > 0) {
            // Если сохраненной сети нет в доступных, выбираем первую
            setSelectedNetworkId(networksWithRestaurants[0].id);
            localStorage.setItem(STORAGE_KEY, networksWithRestaurants[0].id);
          }
        } else if (networksWithRestaurants.length === 1) {
          // Если у пользователя только одна сеть, выбираем ее автоматически
          setSelectedNetworkId(networksWithRestaurants[0].id);
          localStorage.setItem(STORAGE_KEY, networksWithRestaurants[0].id);
        }
      } catch (error) {
        console.error('Failed to load networks:', error);
        toast.error(language === 'ru' ? 'Ошибка загрузки сетей' : 'ქსელების ჩატვირთვის შეცდომა');
      } finally {
        setLoading(false);
      }
    };

    loadNetworks();
  }, [user?.id, authLoading, language, selectedNetworkId]);

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetworkId(networkId);
    setShowNetworkSelector(false);
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

  const handleRestaurantClick = (restaurantId: string) => {
    router.push(`/tables/${restaurantId}`);
  };

  // Получаем текущую сеть
  const currentNetwork = networks.find(n => n.id === selectedNetworkId);

  // Если загружаются сети и нет выбранной сети
  if (authLoading || (loading && !selectedNetworkId)) {
    return (
      <div className="p-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[400px]" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[180px] w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Если показываем селектор сетей или нет выбранной сети
  if (showNetworkSelector || !selectedNetworkId) {
    return (
      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">{t.title}</h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>

        {networks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Store className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">{t.noNetworks}</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {t.noNetworksDescription}
            </p>
            <Button onClick={() => router.push('/networks')}>
              {t.manageNetworks}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t.selectNetwork}</h2>
              {selectedNetworkId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearNetwork}
                >
                  {t.clearNetworkSelection}
                </Button>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">{t.selectNetworkDescription}</p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {networks.map((network) => (
                <Card
                  key={network.id}
                  className={`cursor-pointer hover:shadow-lg transition-shadow ${
                    network.id === selectedNetworkId
                      ? 'border-primary border-2 bg-primary/5'
                      : ''
                  }`}
                  onClick={() => handleNetworkSelect(network.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        {network.name}
                      </CardTitle>
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
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {network.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Если выбрана сеть и не показываем селектор
  return (
    <div className="p-4 space-y-6">
      {/* Шапка с информацией о сети */}
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
            <h1 className="text-2xl font-bold">
              {currentNetwork?.name}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t.tableManagement} • {t.restaurantsCount(currentNetwork?.restaurants.length || 0)}
          </p>
        </div>
      </div>

      {/* Список ресторанов */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{t.allRestaurants}</h2>
          <p className="text-sm text-muted-foreground">
            {t.restaurantsCount(currentNetwork?.restaurants.length || 0)}
          </p>
        </div>
        
        {currentNetwork?.restaurants.length === 0 ? (
          <div className="text-center py-8">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t.noRestaurants}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentNetwork?.restaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleRestaurantClick(restaurant.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{restaurant.title}</span>
                    <TableIcon className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>{restaurant.address}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {language === 'ru' ? 'Перейти к столам' : 'მაგიდებზე გადასვლა'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}