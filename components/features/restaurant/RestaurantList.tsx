'use client'

import { useRestaurants } from '@/lib/hooks/useRestaurant';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CreateRestaurantForm } from '@/components/features/restaurant/CreateRestaurantForm';
import Link from 'next/link';
import { useAuth } from "@/lib/hooks/useAuth"
import { useLanguageStore } from "@/lib/stores/language-store";
import { Clock, MapPin, Phone, Globe, Store } from "lucide-react"
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

export function RestaurantList() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false);
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
      noNetwork: "Не принадлежит сети"
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
      noNetwork: "ქსელს არ ეკუთვნის"
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

  const { data: restaurants, error, isLoading, mutate } = useRestaurants();
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
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
        <Button onClick={() => setIsCreating(true)}>
          {t.addRestaurans}
        </Button>
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

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {restaurants?.map((restaurant: Restaurant) => (
          <Card 
            key={restaurant.id} 
            className={cn(
              "hover:shadow-lg transition-shadow group overflow-hidden",
              restaurant.network?.primaryColor && `border-t-4`
            )}
            style={{
              borderTopColor: restaurant.network?.primaryColor || undefined
            }}
          >
            <CardHeader className="relative">
              <div className="flex justify-between items-start">
                <CardTitle 
                  className="text-lg font-semibold tracking-tight line-clamp-2"
                  style={{
                    color: restaurant.network?.primaryColor || undefined
                  }}
                >
                  {restaurant.title}
                </CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Network Info */}
              <div className="flex items-center gap-2">
                <div 
                  className="p-2 rounded-full"
                  style={{
                    backgroundColor: restaurant.network?.primaryColor ? `${restaurant.network.primaryColor}20` : undefined
                  }}
                >
                  <Store 
                    className="w-4 h-4" 
                    style={{
                      color: restaurant.network?.primaryColor || undefined
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.network}</p>
                  <p className="text-sm font-medium">
                    {restaurant.network?.name || t.noNetwork}
                  </p>
                </div>
              </div>

              {/* Address Info */}
              <div className="flex items-center gap-2">
                <div 
                  className="p-2 rounded-full"
                  style={{
                    backgroundColor: restaurant.network?.primaryColor ? `${restaurant.network.primaryColor}20` : undefined
                  }}
                >
                  <MapPin 
                    className="w-4 h-4" 
                    style={{
                      color: restaurant.network?.primaryColor || undefined
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.address}</p>
                  <a className="text-sm font-medium hover:text-primary transition-colors">
                    {restaurant.address}
                  </a>
                </div>
              </div>

              {/* Phone Info */}
              <div className="flex items-center gap-2">
                <div 
                  className="p-2 rounded-full"
                  style={{
                    backgroundColor: restaurant.network?.primaryColor ? `${restaurant.network.primaryColor}20` : undefined
                  }}
                >
                  <Phone 
                    className="w-4 h-4" 
                    style={{
                      color: restaurant.network?.primaryColor || undefined
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.phone}</p>
                  <a 
                    href={`tel:123`} 
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    +7 123 456-78-90
                  </a>
                </div>
              </div>
            </CardContent>
        
            <CardFooter className="flex justify-end items-center pt-0">
              <div className="flex gap-2">
                <Button 
                  asChild
                  variant="outline" 
                  size="sm"
                  className={cn(
                    "group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors",
                    restaurant.network?.primaryColor && "group-hover:border-primary/30"
                  )}
                  style={{
                    borderColor: restaurant.network?.primaryColor ? `${restaurant.network.primaryColor}30` : undefined,
                    color: restaurant.network?.primaryColor || undefined,
                    backgroundColor: restaurant.network?.primaryColor ? `${restaurant.network.primaryColor}10` : undefined
                  }}
                >
                  <Link href={`/restaurants/${restaurant.id}`}>{t.edit}</Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}