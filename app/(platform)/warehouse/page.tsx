// app/warehouses/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Network, NetworkService } from '@/lib/api/network.service';
import { Restaurant } from '@/lib/api/dictionaries.service';
import { WarehouseService } from '@/lib/api/warehouse.service';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Language, useLanguageStore } from '@/lib/stores/language-store';
import {
  Store,
  Package,
  Building,
  ChevronRight,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Warehouse as WarehouseIcon,
  ArrowRight,
  Grid3X3,
  X,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

const STORAGE_KEY = 'selected_warehouse_network_id';

interface NetworkWithRestaurants extends Network {
  restaurants: Restaurant[];
}

interface WarehouseSummary {
  networkId: string;
  networkName: string;
  totalRestaurants: number;
  totalInventoryItems: number;
  totalInventoryValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  itemDetails: Array<{
    id: string;
    name: string;
    unit: string;
    totalQuantity: number;
    restaurantsWithItem: number;
    status: 'normal' | 'low' | 'out';
  }>;
}

export default function WarehousesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguageStore();

  const [networks, setNetworks] = useState<NetworkWithRestaurants[]>([]);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [warehouseSummary, setWarehouseSummary] = useState<WarehouseSummary | null>(null);

  const translations = {
    ru: {
      title: 'Склады',
      description: 'Управление складами ресторанов',
      selectNetwork: 'Выберите сеть',
      selectNetworkDescription: 'Выберите сеть для управления складами',
      noNetworks: 'Нет доступных сетей',
      noNetworksDescription: 'У вас нет доступа к каким-либо сетям ресторанов',
      loading: 'Загрузка...',
      changeNetwork: 'Сменить сеть',
      currentNetwork: 'Текущая сеть',
      hideSelector: 'Скрыть выбор сети',
      clearNetworkSelection: 'Очистить выбор сети',
      refresh: 'Обновить',
      restaurantsCount: (count: number) => `${count} ресторан(ов)`,
      itemsCount: (count: number) => `${count} позиций`,
      viewProducts: 'Просмотр складов',
      manageNetworks: 'Управление сетями',
      backToNetworks: 'Вернуться к выбору сети',
      networkOverview: 'Обзор сети',
      goToWarehouse: 'Перейти на склад',
      allRestaurants: 'Все рестораны',
      loadingSummary: 'Загрузка сводки...',
      selectNetworkFirst: 'Сначала выберите сеть',
      summaryTitle: 'Сводка по складам сети',
      totalValue: 'Общая стоимость',
      totalItems: 'Всего позиций',
      lowStock: 'Мало остатков',
      outOfStock: 'Нет в наличии',
      itemName: 'Название',
      totalQuantity: 'Общее количество',
      availability: 'Доступность',
      coverage: 'Покрытие',
      status: 'Статус',
      normal: 'Норма',
      low: 'Мало',
      out: 'Нет',
      withItem: 'С этой позицией',
      restaurantDetails: 'Детали по ресторанам',
      viewRestaurantWarehouse: 'Перейти на склад ресторана',
      noItemsInNetwork: 'Нет инвентарных позиций в сети'
    },
    ka: {
      title: 'საწყობები',
      description: 'რესტორნების საწყობების მართვა',
      selectNetwork: 'აირჩიეთ ქსელი',
      selectNetworkDescription: 'აირჩიეთ ქსელი საწყობების მართვისთვის',
      noNetworks: 'წვდომადი ქსელები არ არის',
      noNetworksDescription: 'თქვენ არ გაქვთ წვდომა რესტორნების ქსელებზე',
      loading: 'იტვირთება...',
      changeNetwork: 'ქსელის შეცვლა',
      currentNetwork: 'მიმდინარე ქსელი',
      hideSelector: 'ქსელის არჩევის დამალვა',
      clearNetworkSelection: 'ქსელის არჩევის გასუფთავება',
      refresh: 'განახლება',
      restaurantsCount: (count: number) => `${count} რესტორნი`,
      itemsCount: (count: number) => `${count} პოზიცია`,
      viewProducts: 'საწყობების ნახვა',
      manageNetworks: 'ქსელების მართვა',
      backToNetworks: 'ქსელების არჩევას დაბრუნება',
      networkOverview: 'ქსელის მიმოხილვა',
      goToWarehouse: 'საწყობში გადასვლა',
      allRestaurants: 'ყველა რესტორნი',
      loadingSummary: 'შეჯამების ჩატვირთვა...',
      selectNetworkFirst: 'ჯერ აირჩიეთ ქსელი',
      summaryTitle: 'ქსელის საწყობების შეჯამება',
      totalValue: 'მთლიანი ღირებულება',
      totalItems: 'სულ პოზიცია',
      lowStock: 'მცირე ნაშთი',
      outOfStock: 'არ არის მარაგში',
      itemName: 'სახელი',
      totalQuantity: 'მთლიანი რაოდენობა',
      availability: 'ხელმისაწვდომობა',
      coverage: 'დაფარვა',
      status: 'სტატუსი',
      normal: 'ნორმა',
      low: 'მცირე',
      out: 'არა',
      withItem: 'ამ პოზიციით',
      restaurantDetails: 'რესტორნების დეტალები',
      viewRestaurantWarehouse: 'რესტორნის საწყობში გადასვლა',
      noItemsInNetwork: 'ქსელში ინვენტარის პოზიციები არ არის'
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

  // Загрузка сводки по складам выбранной сети
  useEffect(() => {
    const loadWarehouseSummary = async () => {
      if (!selectedNetworkId) {
        setWarehouseSummary(null);
        return;
      }

      setLoadingSummary(true);
      try {
        const selectedNetwork = networks.find(n => n.id === selectedNetworkId);
        if (!selectedNetwork) return;

        // Загружаем все инвентарные позиции сети
        const inventoryItems = await WarehouseService.getInventoryItemsByNetwork(selectedNetworkId);

        let totalValue = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        const itemDetails = [];

        // Для каждой инвентарной позиции собираем данные по ресторанам
        for (const item of inventoryItems) {
          let itemTotalQuantity = 0;
          let restaurantsWithItem = 0;

          // Проверяем наличие в каждом ресторане сети
          for (const restaurant of selectedNetwork.restaurants) {
            try {
              const warehouse = await WarehouseService.getRestaurantWarehouse(restaurant.id);
              const items = await WarehouseService.getWarehouseItems(warehouse.id);

              const warehouseItem = items.find(i =>
                i.inventoryItemId === item.id || i.id === item.id
              );

              if (warehouseItem) {
                const quantity = warehouseItem.quantity || 0;
                itemTotalQuantity += quantity;
                restaurantsWithItem++;

                // Добавляем к общей стоимости
                if (warehouseItem.cost && quantity) {
                  totalValue += warehouseItem.cost * quantity;
                }
              }
            } catch (error) {
              continue;
            }
          }

          // Определяем статус позиции
          let status: 'normal' | 'low' | 'out' = 'normal';
          if (itemTotalQuantity === 0) {
            status = 'out';
            outOfStockCount++;
          } else if (itemTotalQuantity / selectedNetwork.restaurants.length < 10) {
            status = 'low';
            lowStockCount++;
          }

          itemDetails.push({
            id: item.id,
            name: item.name,
            unit: item.unit,
            totalQuantity: itemTotalQuantity,
            restaurantsWithItem,
            status
          });
        }

        setWarehouseSummary({
          networkId: selectedNetworkId,
          networkName: selectedNetwork.name,
          totalRestaurants: selectedNetwork.restaurants.length,
          totalInventoryItems: inventoryItems.length,
          totalInventoryValue: totalValue,
          lowStockItems: lowStockCount,
          outOfStockItems: outOfStockCount,
          itemDetails: itemDetails.sort((a, b) => b.totalQuantity - a.totalQuantity) // Сортируем по количеству
        });
      } catch (error) {
        console.error('Failed to load warehouse summary:', error);
        toast.error(language === 'ru' ? 'Ошибка загрузки сводки' : 'შეჯამების ჩატვირთვის შეცდომა');
        setWarehouseSummary(null);
      } finally {
        setLoadingSummary(false);
      }
    };

    loadWarehouseSummary();
  }, [selectedNetworkId, networks]);

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
    router.push(`/warehouses/${restaurantId}`);
  };

  const refreshSummary = () => {
    if (selectedNetworkId) {
      // Перезагружаем сводку
      const loadWarehouseSummary = async () => {
        setLoadingSummary(true);
        try {
          const selectedNetwork = networks.find(n => n.id === selectedNetworkId);
          if (!selectedNetwork) return;

          // Повторяем логику загрузки сводки...
          const inventoryItems = await WarehouseService.getInventoryItemsByNetwork(selectedNetworkId);

          let totalValue = 0;
          let lowStockCount = 0;
          let outOfStockCount = 0;
          const itemDetails = [];

          for (const item of inventoryItems) {
            let itemTotalQuantity = 0;
            let restaurantsWithItem = 0;

            for (const restaurant of selectedNetwork.restaurants) {
              try {
                const warehouse = await WarehouseService.getRestaurantWarehouse(restaurant.id);
                const items = await WarehouseService.getWarehouseItems(warehouse.id);

                const warehouseItem = items.find(i =>
                  i.inventoryItemId === item.id || i.id === item.id
                );

                if (warehouseItem) {
                  const quantity = warehouseItem.quantity || 0;
                  itemTotalQuantity += quantity;
                  restaurantsWithItem++;

                  if (warehouseItem.cost && quantity) {
                    totalValue += warehouseItem.cost * quantity;
                  }
                }
              } catch (error) {
                continue;
              }
            }

            let status: 'normal' | 'low' | 'out' = 'normal';
            if (itemTotalQuantity === 0) {
              status = 'out';
              outOfStockCount++;
            } else if (itemTotalQuantity / selectedNetwork.restaurants.length < 10) {
              status = 'low';
              lowStockCount++;
            }

            itemDetails.push({
              id: item.id,
              name: item.name,
              unit: item.unit,
              totalQuantity: itemTotalQuantity,
              restaurantsWithItem,
              status
            });
          }

          setWarehouseSummary({
            networkId: selectedNetworkId,
            networkName: selectedNetwork.name,
            totalRestaurants: selectedNetwork.restaurants.length,
            totalInventoryItems: inventoryItems.length,
            totalInventoryValue: totalValue,
            lowStockItems: lowStockCount,
            outOfStockItems: outOfStockCount,
            itemDetails: itemDetails.sort((a, b) => b.totalQuantity - a.totalQuantity)
          });

          toast.success(language === 'ru' ? 'Сводка обновлена' : 'შეჯამება განახლდა');
        } catch (error) {
          console.error('Failed to refresh summary:', error);
          toast.error(language === 'ru' ? 'Ошибка обновления' : 'განახლების შეცდომა');
        } finally {
          setLoadingSummary(false);
        }
      };

      loadWarehouseSummary();
    }
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {networks.map((network) => (
                <Card
                  key={network.id}
                  className={`cursor-pointer hover:shadow-lg transition-shadow ${network.id === selectedNetworkId
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
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {t.networkOverview} • {t.restaurantsCount(currentNetwork?.restaurants.length || 0)}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshSummary}
              className="h-6 w-6 p-0"
              title={t.refresh}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
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
            <p className="text-muted-foreground">Нет ресторанов в этой сети</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentNetwork?.restaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/restaurants/${restaurant.id}/warehouse`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{restaurant.title}</span>
                    <WarehouseIcon className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>{restaurant.address}</CardDescription>
                </CardHeader>
              </Card>
            ))}
             <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/warehouse/${selectedNetworkId}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Сводная таблица</span>
                    <WarehouseIcon className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>Все позиции сети</CardDescription>
                </CardHeader>
              </Card>
          </div>
        )}
      </div>
    </div>











































































































































































  );
}