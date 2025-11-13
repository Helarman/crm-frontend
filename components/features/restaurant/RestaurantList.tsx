'use client'

import { useRestaurants } from '@/lib/hooks/useRestaurant';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CreateRestaurantForm } from '@/components/features/restaurant/CreateRestaurantForm';
import Link from 'next/link';
import { useAuth } from "@/lib/hooks/useAuth"
import { useLanguageStore } from "@/lib/stores/language-store";
import { Clock, MapPin, Phone, Globe, Store, ChevronDown, ChevronRight, Network, Settings, Calendar } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { WarehouseService } from '@/lib/api/warehouse.service';
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface Restaurant {
  id: string;
  title: string;
  address: string;
  network?: {
    id: string;
    name: string;
    primaryColor?: string;
  };
  // Часы работы
  mondayOpen?: string;
  mondayClose?: string;
  mondayIsWorking?: boolean;
  tuesdayOpen?: string;
  tuesdayClose?: string;
  tuesdayIsWorking?: boolean;
  wednesdayOpen?: string;
  wednesdayClose?: string;
  wednesdayIsWorking?: boolean;
  thursdayOpen?: string;
  thursdayClose?: string;
  thursdayIsWorking?: boolean;
  fridayOpen?: string;
  fridayClose?: string;
  fridayIsWorking?: boolean;
  saturdayOpen?: string;
  saturdayClose?: string;
  saturdayIsWorking?: boolean;
  sundayOpen?: string;
  sundayClose?: string;
  sundayIsWorking?: boolean;
}

interface GroupedRestaurants {
  [networkId: string]: {
    network: {
      id: string;
      name: string;
      primaryColor?: string;
    };
    restaurants: Restaurant[];
  };
}

export function RestaurantList() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false);
  const [expandedNetworks, setExpandedNetworks] = useState<Set<string>>(new Set());
  const { language } = useLanguageStore();

  const translations = {
    ru: {
      restaurants: "Рестораны",
      warehouse: "Склад",
      addRestaurans: "Добавить ресторан",
      open: "Открыто",
      closed: "Закрыто",
      edit: "Редактировать",
      openingHours: "Часы работы",
      address: "Адрес",
      phone: "Телефон",
      network: "Сеть",
      noNetwork: "Не принадлежит сети",
      noNetworkGroup: "Рестораны без сети",
      manageNetworks: "Управление сетью",
      allNetworks: "Все сети",
      today: "Сегодня",
      workingHours: "Время работы",
      closedToday: "Закрыто сегодня",
      weekSchedule: "Режим работы",
      monday: "ПН",
      tuesday: "ВТ",
      wednesday: "СР",
      thursday: "ЧТ",
      friday: "ПТ",
      saturday: "СБ",
      sunday: "ВС",
      dayOff: "Выходной"
    },
    ka: {
      restaurants: "რესტორნები",
      warehouse: "საწყობი",
      addRestaurans: "რესტორნის დამატება",
      open: "გახსენით",
      closed: "დახურული",
      edit: "რედაქტირება",
      openingHours: 'გახსნის საათები',
      address: "მისამართი",
      phone: "ტელეფონი",
      network: "ქსელი",
      noNetwork: "ქსელს არ ეკუთვნის",
      noNetworkGroup: "ქსელის გარეშე რესტორნები",
      manageNetworks: "ქსელების მართვა",
      allNetworks: "ყველა ქსელი",
      today: "დღეს",
      workingHours: "სამუშაო საათები",
      closedToday: "დღეს დახურულია",
      weekSchedule: "კვირის განრიგი",
      monday: "ორშ",
      tuesday: "სამ",
      wednesday: "ოთხ",
      thursday: "ხუთ",
      friday: "პარ",
      saturday: "შაბ",
      sunday: "კვი",
      dayOff: "დასვენება"
    }
  } as const;

  const t = translations[language];

  const handleCreate = async (values: any) => {
    try {
      const createdRestaurant = await RestaurantService.create(values);
      
      if (createdRestaurant?.id) {
        await WarehouseService.createWarehouse({
          restaurantId: createdRestaurant.id,
          name: `${values.title} - ${t.warehouse}`,
        });
      }
      mutate();
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create restaurant', err);
    }
  };

  const toggleNetwork = (networkId: string) => {
    setExpandedNetworks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(networkId)) {
        newSet.delete(networkId);
      } else {
        newSet.add(networkId);
      }
      return newSet;
    });
  };

  // Функция для получения текущего дня недели
  const getCurrentDay = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  // Функция для форматирования времени
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleTimeString(language === 'ru' ? 'ru-RU' : 'ka-GE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Функция для получения статуса работы на сегодня
  const getTodayStatus = (restaurant: Restaurant) => {
    const today = getCurrentDay();
    const isWorking = restaurant[`${today}IsWorking` as keyof Restaurant] as boolean;
    
    if (!isWorking) {
      return { isOpen: false, text: t.closedToday };
    }

    const openTime = restaurant[`${today}Open` as keyof Restaurant] as string;
    const closeTime = restaurant[`${today}Close` as keyof Restaurant] as string;
    
    if (!openTime || !closeTime) {
      return { isOpen: false, text: t.closedToday };
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const openDate = new Date(openTime);
    const openMinutes = openDate.getHours() * 60 + openDate.getMinutes();
    
    const closeDate = new Date(closeTime);
    const closeMinutes = closeDate.getHours() * 60 + closeDate.getMinutes();

    const isOpen = currentTime >= openMinutes && currentTime <= closeMinutes;
    
    return {
      isOpen,
      text: `${formatTime(openTime)} - ${formatTime(closeTime)}`
    };
  };

  // Функция для получения расписания на неделю
  const getWeekSchedule = (restaurant: Restaurant) => {
    const days = [
      { key: 'monday', label: t.monday },
      { key: 'tuesday', label: t.tuesday },
      { key: 'wednesday', label: t.wednesday },
      { key: 'thursday', label: t.thursday },
      { key: 'friday', label: t.friday },
      { key: 'saturday', label: t.saturday },
      { key: 'sunday', label: t.sunday }
    ];

    return days.map(day => {
      const isWorking = restaurant[`${day.key}IsWorking` as keyof Restaurant] as boolean;
      const openTime = restaurant[`${day.key}Open` as keyof Restaurant] as string;
      const closeTime = restaurant[`${day.key}Close` as keyof Restaurant] as string;
      
      return {
        ...day,
        isWorking,
        schedule: isWorking ? `${formatTime(openTime)} - ${formatTime(closeTime)}` : t.dayOff
      };
    });
  };

  const { data: restaurants, error, isLoading, mutate } = useRestaurants();

  // Группируем рестораны по сетям
  const groupedRestaurants: GroupedRestaurants = restaurants?.reduce((acc: GroupedRestaurants, restaurant: Restaurant) => {
    const networkId = restaurant.network?.id || 'no-network';
    const networkName = restaurant.network?.name || t.noNetworkGroup;
    
    if (!acc[networkId]) {
      acc[networkId] = {
        network: restaurant.network || {
          id: 'no-network',
          name: t.noNetworkGroup
        },
        restaurants: []
      };
    }
    
    acc[networkId].restaurants.push(restaurant);
    return acc;
  }, {}) || {};

  // Сортируем сети по названию
  const sortedNetworks = Object.values(groupedRestaurants).sort((a, b) => 
    a.network.name.localeCompare(b.network.name)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="w-full">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{t.restaurants}</h2>
          <Button onClick={() => setIsCreating(true)}>
            {t.addRestaurans}
          </Button>
        </div>
        <div className="text-red-500">Error loading restaurants: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t.restaurants}</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            asChild
            className="flex items-center gap-2"
          >
            <Link href="/networks">
              <Network className="w-4 h-4" />
              {t.manageNetworks}
            </Link>
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            {t.addRestaurans}
          </Button>
        </div>
      </div>

      {isCreating && (
        <div className="border p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">{t.addRestaurans}</h3>
          <CreateRestaurantForm 
            onSubmit={handleCreate} 
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      <div className="space-y-6">
        {/* Кнопка для всех сетей */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{t.allNetworks}</h3>
        </div>

        {sortedNetworks.map(({ network, restaurants: networkRestaurants }) => {
          const isExpanded = expandedNetworks.has(network.id);
          
          return (
            <Collapsible
              key={network.id}
              open={isExpanded}
              onOpenChange={() => toggleNetwork(network.id)}
              className="space-y-4"
            >
              {/* Заголовок группы */}
              <CollapsibleTrigger asChild>
                <div 
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
                    isExpanded && "shadow-sm"
                  )}
                  style={{
                    borderColor: network.primaryColor ? `${network.primaryColor}40` : undefined,
                    backgroundColor: network.primaryColor ? `${network.primaryColor}08` : undefined
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: network.primaryColor ? `${network.primaryColor}20` : undefined
                      }}
                    >
                      <Store 
                        className="w-5 h-5" 
                        style={{
                          color: network.primaryColor || undefined
                        }}
                      />
                    </div>
                    <div className="text-left">
                      <h3 
                        className="text-xl font-bold"
                        style={{
                          color: network.primaryColor || undefined
                        }}
                      >
                        {network.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {networkRestaurants.length} {t.restaurants.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {network.id !== 'no-network' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2"
                      >
                        <Link href={`/networks/${network.id}`}>
                          <Settings className="w-4 h-4" />
                          {t.manageNetworks}
                        </Link>
                      </Button>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>

              {/* Контент группы */}
              <CollapsibleContent className="space-y-4">
                {networkRestaurants.map((restaurant: Restaurant) => {
                  const todayStatus = getTodayStatus(restaurant);
                  const weekSchedule = getWeekSchedule(restaurant);
                  
                  return (
                    <Card 
                      key={restaurant.id} 
                      className={cn(
                        "w-full hover:shadow-lg transition-shadow group overflow-hidden border-l-4",
                        network.primaryColor && `border-l-4`
                      )}
                      style={{
                        borderLeftColor: network.primaryColor || undefined
                      }}
                    > 
                    
                      <div className="flex">
                        {/* Основной контент */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <CardTitle 
                                className="text-xl font-semibold tracking-tight"
                                style={{
                                  color: network.primaryColor || undefined
                                }}
                              >
                                {restaurant.title}
                              </CardTitle>
                              {/* Статус работы сегодня */}
                              <Badge 
                                variant={todayStatus.isOpen ? "default" : "secondary"}
                                className={cn(
                                  todayStatus.isOpen 
                                    ? "bg-green-100 text-green-800 hover:bg-green-100 border border-green-200"
                                    : "bg-red-100 text-red-800 hover:bg-red-100 border border-red-200"
                                )}
                              >
                                {todayStatus.isOpen ? t.open : t.closed}
                              </Badge>
                            </div>
                            <Button 
                              asChild
                              variant="outline" 
                              size="sm"
                              className={cn(
                                "group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors",
                                network.primaryColor && "group-hover:border-primary/30"
                              )}
                              style={{
                                borderColor: network.primaryColor ? `${network.primaryColor}30` : undefined,
                                color: network.primaryColor || undefined,
                                backgroundColor: network.primaryColor ? `${network.primaryColor}10` : undefined
                              }}
                            >
                              <Link href={`/restaurants/${restaurant.id}`}>{t.edit}</Link>
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            {/* Address Info */}
                            <div className="flex items-start gap-3">
                              <div 
                                className="p-2 rounded-full mt-0.5 flex-shrink-0"
                                style={{
                                  backgroundColor: network.primaryColor ? `${network.primaryColor}20` : undefined
                                }}
                              >
                                <MapPin 
                                  className="w-4 h-4" 
                                  style={{
                                    color: network.primaryColor || undefined
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-muted-foreground mb-1">{t.address}</p>
                                <p className="text-sm font-medium break-words">
                                  {restaurant.address}
                                </p>
                              </div>
                            </div>

                            {/* Phone Info */}
                            <div className="flex items-start gap-3">
                              <div 
                                className="p-2 rounded-full mt-0.5 flex-shrink-0"
                                style={{
                                  backgroundColor: network.primaryColor ? `${network.primaryColor}20` : undefined
                                }}
                              >
                                <Phone 
                                  className="w-4 h-4" 
                                  style={{
                                    color: network.primaryColor || undefined
                                  }}
                                />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">{t.phone}</p>
                                <a 
                                  href={`tel:123`} 
                                  className="text-sm font-medium hover:text-primary transition-colors"
                                >
                                  +7 123 456-78-90
                                </a>
                              </div>
                            </div>

                            {/* Network Info */}
                            <div className="flex items-start gap-3">
                              <div 
                                className="p-2 rounded-full mt-0.5 flex-shrink-0"
                                style={{
                                  backgroundColor: network.primaryColor ? `${network.primaryColor}20` : undefined
                                }}
                              >
                                <Globe 
                                  className="w-4 h-4" 
                                  style={{
                                    color: network.primaryColor || undefined
                                  }}
                                />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">{t.network}</p>
                                <p className="text-sm font-medium">
                                  {network.name}
                                </p>
                              </div>
                            </div>

                            {/* Today's Hours */}
                            <div className="flex items-start gap-3">
                              <div 
                                className="p-2 rounded-full mt-0.5 flex-shrink-0"
                                style={{
                                  backgroundColor: network.primaryColor ? `${network.primaryColor}20` : undefined
                                }}
                              >
                                <Clock 
                                  className="w-4 h-4" 
                                  style={{
                                    color: network.primaryColor || undefined
                                  }}
                                />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  {t.today}
                                </p>
                                <p className={cn(
                                  "text-sm font-medium",
                                  todayStatus.isOpen ? "text-green-600" : "text-red-600"
                                )}>
                                  {todayStatus.text}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Week Schedule */}
                          <div className="border-t pt-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <p className="text-sm font-medium text-muted-foreground">
                                {t.weekSchedule}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
                              {weekSchedule.map((day) => (
                                <div 
                                  key={day.key}
                                  className={cn(
                                    "text-center p-2 rounded-lg border text-xs",
                                    day.isWorking 
                                      ? "bg-green-50 border-green-200" 
                                      : "bg-gray-50 border-gray-200"
                                  )}
                                >
                                  <div className={cn(
                                    "font-medium mb-1",
                                    day.isWorking ? "text-green-800" : "text-gray-500"
                                  )}>
                                    {day.label}
                                  </div>
                                  <div className={cn(
                                    "text-xs",
                                    day.isWorking ? "text-green-600" : "text-gray-400"
                                  )}>
                                    {day.schedule}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}