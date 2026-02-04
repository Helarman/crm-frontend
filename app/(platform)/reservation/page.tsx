// app/reservation/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { NetworkService } from '@/lib/api/network.service';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Language, useLanguageStore } from '@/lib/stores/language-store';
import {
  Calendar,
  Settings,
  Building,
  Store,
  ChevronRight,
  CalendarDays,
  Sliders,
  MapPin,
  Users
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Restaurant } from '@/lib/api/dictionaries.service';

const STORAGE_KEY = 'selected_reservation_restaurant_id';

interface RestaurantWithNetwork extends Restaurant {
  networkName: string;
}

export default function ReservationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguageStore();

  const [restaurants, setRestaurants] = useState<RestaurantWithNetwork[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRestaurantSelector, setShowRestaurantSelector] = useState(false);

  const translations = {
    ru: {
      title: 'Бронирование',
      description: 'Управление бронированием столов в ресторанах',
      selectRestaurant: 'Выберите ресторан',
      selectRestaurantDescription: 'Выберите ресторан для управления бронированием',
      noRestaurants: 'Нет доступных ресторанов',
      noRestaurantsDescription: 'У вас нет доступа к каким-либо ресторанам',
      loading: 'Загрузка...',
      changeRestaurant: 'Сменить ресторан',
      currentRestaurant: 'Текущий ресторан',
      hideSelector: 'Скрыть выбор ресторана',
      clearRestaurantSelection: 'Очистить выбор ресторана',
      manageReservations: 'Управление бронированием',
      reservationSettings: 'Настройки бронирования',
      goToManagement: 'Перейти к управлению',
      goToSettings: 'Перейти к настройкам',
      viewAllRestaurants: 'Посмотреть все рестораны',
      selectRestaurantFirst: 'Сначала выберите ресторан',
      managementDescription: 'Просмотр, создание и редактирование бронирований',
      settingsDescription: 'Настройка правил и параметров бронирования',
      network: 'Сеть',
      address: 'Адрес',
      phone: 'Телефон',
      reservationsToday: 'Бронирований сегодня',
      activeTables: 'Активных столов',
      overview: 'Обзор',
      actions: 'Действия',
      backToRestaurants: 'Вернуться к выбору ресторана',
      selectAnother: 'Выбрать другой ресторан'
    },
    ka: {
      title: 'დაჯავშნა',
      description: 'რესტორნების მაგიდების დაჯავშნის მართვა',
      selectRestaurant: 'აირჩიეთ რესტორანი',
      selectRestaurantDescription: 'აირჩიეთ რესტორანი დაჯავშნის მართვისთვის',
      noRestaurants: 'წვდომადი რესტორნები არ არის',
      noRestaurantsDescription: 'თქვენ არ გაქვთ წვდომა რესტორნებზე',
      loading: 'იტვირთება...',
      changeRestaurant: 'რესტორანის შეცვლა',
      currentRestaurant: 'მიმდინარე რესტორანი',
      hideSelector: 'რესტორანის არჩევის დამალვა',
      clearRestaurantSelection: 'რესტორანის არჩევის გასუფთავება',
      manageReservations: 'დაჯავშნის მართვა',
      reservationSettings: 'დაჯავშნის პარამეტრები',
      goToManagement: 'მართვაზე გადასვლა',
      goToSettings: 'პარამეტრებზე გადასვლა',
      viewAllRestaurants: 'ყველა რესტორანის ნახვა',
      selectRestaurantFirst: 'ჯერ აირჩიეთ რესტორანი',
      managementDescription: 'დაჯავშნების ნახვა, შექმნა და რედაქტირება',
      settingsDescription: 'დაჯავშნის წესების და პარამეტრების კონფიგურაცია',
      network: 'ქსელი',
      address: 'მისამართი',
      phone: 'ტელეფონი',
      reservationsToday: 'დღევანდელი დაჯავშნები',
      activeTables: 'აქტიური მაგიდები',
      overview: 'მიმოხილვა',
      actions: 'მოქმედებები',
      backToRestaurants: 'რესტორნების არჩევას დაბრუნება',
      selectAnother: 'სხვა რესტორანის არჩევა'
    }
  };

  const t = translations[language as Language];

  // Загрузка сохраненного ресторана из localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRestaurantId = localStorage.getItem(STORAGE_KEY);
      if (savedRestaurantId) {
        setSelectedRestaurantId(savedRestaurantId);
      }
    }
  }, []);

  // Сохранение выбранного ресторана в localStorage
  useEffect(() => {
    if (selectedRestaurantId && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, selectedRestaurantId);
    }
  }, [selectedRestaurantId]);

  // Загрузка ресторанов пользователя
  useEffect(() => {
    const loadRestaurants = async () => {
      if (!user?.id || authLoading) return;

      setLoading(true);
      try {
        // Получаем сети пользователя
        const networks = await NetworkService.getByUser(user.id);
        
        // Для каждой сети получаем рестораны
        const allRestaurants: RestaurantWithNetwork[] = [];
        
        for (const network of networks) {
          try {
            const restaurants = await NetworkService.getRestaurants(network.id);
            
            // Добавляем информацию о сети к каждому ресторану
            const restaurantsWithNetwork = (restaurants || []).map(restaurant => ({
              ...restaurant,
              networkName: network.name
            }));
            
            allRestaurants.push(...restaurantsWithNetwork);
          } catch (error) {
            console.error(`Failed to load restaurants for network ${network.id}:`, error);
          }
        }

        setRestaurants(allRestaurants);

        // Если есть сохраненный ресторан, проверяем доступность
        if (selectedRestaurantId) {
          const restaurantExists = allRestaurants.some(r => r.id === selectedRestaurantId);
          if (!restaurantExists && allRestaurants.length > 0) {
            // Если сохраненного ресторана нет в доступных, выбираем первый
            setSelectedRestaurantId(allRestaurants[0].id);
            localStorage.setItem(STORAGE_KEY, allRestaurants[0].id);
          }
        } else if (allRestaurants.length === 1) {
          // Если у пользователя только один ресторан, выбираем его автоматически
          setSelectedRestaurantId(allRestaurants[0].id);
          localStorage.setItem(STORAGE_KEY, allRestaurants[0].id);
        }
      } catch (error) {
        console.error('Failed to load restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, [user?.id, authLoading, selectedRestaurantId]);

  const handleRestaurantSelect = (restaurantId: string) => {
    setSelectedRestaurantId(restaurantId);
    setShowRestaurantSelector(false);
  };

  const handleChangeRestaurantClick = () => {
    setShowRestaurantSelector(true);
  };

  const handleClearRestaurant = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setSelectedRestaurantId(null);
    setShowRestaurantSelector(true);
  };

  const handleGoToManagement = () => {
    if (selectedRestaurantId) {
      router.push(`/reservation/management/${selectedRestaurantId}`);
    }
  };

  const handleGoToSettings = () => {
    if (selectedRestaurantId) {
      router.push(`/reservation/settings/${selectedRestaurantId}`);
    }
  };

  // Получаем текущий ресторан
  const currentRestaurant = restaurants.find(r => r.id === selectedRestaurantId);

  // Если загружаются рестораны и нет выбранного ресторана
  if (authLoading || (loading && !selectedRestaurantId)) {
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

  // Если показываем селектор ресторанов или нет выбранного ресторана
  if (showRestaurantSelector || !selectedRestaurantId) {
    return (
      <div className="p-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">{t.title}</h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>

        {restaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Building className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">{t.noRestaurants}</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {t.noRestaurantsDescription}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{t.selectRestaurant}</h2>
              {selectedRestaurantId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearRestaurant}
                >
                  {t.clearRestaurantSelection}
                </Button>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">{t.selectRestaurantDescription}</p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((restaurant) => (
                <Card
                  key={restaurant.id}
                  className={`cursor-pointer hover:shadow-lg transition-shadow ${
                    restaurant.id === selectedRestaurantId
                      ? 'border-primary border-2 bg-primary/5'
                      : ''
                  }`}
                  onClick={() => handleRestaurantSelect(restaurant.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        {restaurant.title}
                      </CardTitle>
                      {restaurant.id === selectedRestaurantId && (
                        <Badge className="bg-primary text-primary-foreground">
                          {language === 'ru' ? 'Текущий' : 'მიმდინარე'}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {restaurant.networkName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground line-clamp-1">
                          {restaurant.address}
                        </span>
                      </div>
                     
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

  // Если выбран ресторан и не показываем селектор
  return (
    <div className="p-4 space-y-6">
      {/* Шапка с информацией о ресторане */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {restaurants.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleChangeRestaurantClick}
                  className="h-auto p-0 text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {currentRestaurant?.networkName}
                </Button>
                <span className="text-muted-foreground">/</span>
              </>
            )}
            <h1 className="text-2xl font-bold">
              {currentRestaurant?.title}
            </h1>
          </div>
          
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleChangeRestaurantClick}
          >
            {t.selectAnother}
          </Button>
        </div>
      </div>

      {/* Быстрые ссылки */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleGoToManagement}
          className="flex-1 h-auto py-6 px-8 justify-start gap-4"
          variant="outline"
          size="lg"
        >
          <div className="flex flex-col items-start">
            <span className="text-lg font-semibold">{t.manageReservations}</span>
            <span className="text-sm text-muted-foreground text-left">
              {t.managementDescription}
            </span>
          </div>
          <Calendar className="ml-auto h-6 w-6" />
        </Button>

        <Button
          onClick={handleGoToSettings}
          className="flex-1 h-auto py-6 px-8 justify-start gap-4"
          size="lg"
          variant="outline"
        >
          <div className="flex flex-col items-start">
            <span className="text-lg font-semibold">{t.reservationSettings}</span>
            <span className="text-sm text-muted-foreground text-left">
              {t.settingsDescription}
            </span>
          </div>
          <Sliders className="ml-auto h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}