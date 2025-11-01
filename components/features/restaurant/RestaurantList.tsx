'use client'

import { useRestaurants } from '@/lib/hooks/useRestaurant';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CreateRestaurantForm } from '@/components/features/restaurant/CreateRestaurantForm';
import Link from 'next/link';
import { useAuth } from "@/lib/hooks/useAuth"
import { useLanguageStore } from "@/lib/stores/language-store";
import { Clock, MapPin, Phone, Globe, Store, ChevronDown, ChevronRight, Network, Settings } from "lucide-react"
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

interface Restaurant {
  id: string;
  title: string;
  address: string;
  network?: {
    id: string;
    name: string;
    primaryColor?: string;
  };
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
      allNetworks: "Все сети"
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
      allNetworks: "ყველა ქსელი"
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
                {networkRestaurants.map((restaurant: Restaurant) => (
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
                          <CardTitle 
                            className="text-xl font-semibold tracking-tight"
                            style={{
                              color: network.primaryColor || undefined
                            }}
                          >
                            {restaurant.title}
                          </CardTitle>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}