'use client'

import { useRestaurant } from '@/lib/hooks/useRestaurant';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { Button } from '@/components/ui/button';
import  RestaurantUsers  from '@/components/features/restaurant/RestaurantUsers';
import { RestaurantProducts } from '@/components/features/restaurant/RestaurantProducts';
import { useState } from 'react';
import { EditRestaurantForm } from '@/components/features/restaurant/EditRestaurantForm';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/lib/stores/language-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building,
  Users,
  MapPin,
  BookOpen,
  Palette,
  CreditCard,
  Warehouse,
  Map,
  Factory
} from 'lucide-react';
import { RestaurantDeliveryZones } from './RestaurantDeliveryZones';
import { RestaurantDirectories } from './RestaurantDirectories';
import { PaymentIntegrations } from './PaymentIntegrations';
import { TenantDetails } from '../network/TenandDetails';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  description?: string;
}

export function RestaurantDetails({ restaurantId }: { restaurantId: string }) {
  const router = useRouter();
  const { language } = useLanguageStore();

  // Получаем данные ресторана, состояние загрузки и ошибки
  const { data: restaurant, error, isLoading, mutate } = useRestaurant(restaurantId);

   const translations = {
    main: {
      title: {
        ru: 'Основные',
        ka: 'მთავარი',
      },
    },
    staff: {
      title: {
        ru: 'Персонал',
        ka: 'პერსონალი',
      },
    },
    workshops: {
      title: {
        ru: 'Цехи',
        ka: 'სახელოსნოები',
      },
    },
    deliveryZones: {
      title: {
        ru: 'Зоны доставки',
        ka: 'მიწოდების ზონები',
      },
    },
    directories: {
      title: {
        ru: 'Справочники',
        ka: 'საცნობაროები',
      },
    },
    interface: {
      title: {
        ru: 'Интерфейс',
        ka: 'ინტერფეისი',
      },
    },
    payment: {
      title: {
        ru: 'Оплата',
        ka: 'გადახდა',
      },
    },
    warehouse: {
      title: {
        ru: 'Склад',
        ka: 'საწყობი',
      },
    },
    pageTitle: {
      ru: 'Управление рестораном',
      ka: 'რესტორნის მართვა',
    }
  };

  // Обработчик обновления данных ресторана
  const handleUpdate = async (values: Restaurant) => {
    try {
      await RestaurantService.update(restaurantId, values);
      await mutate(); // Обновляем данные
      toast.success('Данные ресторана успешно обновлены');
    } catch (err) {
      console.error('Ошибка при обновлении ресторана', err);
      toast.error('Не удалось обновить данные ресторана');
    }
  };

  // Состояние загрузки
  if (isLoading) return <LoadingSpinner className="mx-auto mt-8" />;

  // Обработка ошибок
  if (error) return <div className="text-red-500 text-center mt-8">Ошибка загрузки данных</div>;

  // Если ресторан не найден
  if (!restaurant) return <div className="text-center mt-8">Ресторан не найден</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {restaurant.title}
        </h1>

        <Button
          onClick={() => router.push(`/restaurants/${restaurant.id}/warehouse`)}
          className="flex items-center gap-2"
        >
          <Warehouse className="h-4 w-4" />
          {translations.warehouse.title[language]}
        </Button>
      </div>

      <Tabs defaultValue="main">
        <TabsList className="flex w-full flex-col gap-2 sm:flex-row sm:grid sm:grid-cols-6">
          <TabsTrigger value="main" className="flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Building className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{translations.main.title[language]}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{translations.staff.title[language]}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="delivery-zones" className="flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{translations.deliveryZones.title[language]}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="directories" className="flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <BookOpen className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{translations.directories.title[language]}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="interface" className="flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Palette className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{translations.interface.title[language]}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <CreditCard className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{translations.payment.title[language]}</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main">
          <Card>
            <CardHeader>
              <CardTitle>{translations.main.title[language]}</CardTitle>
            </CardHeader>
            <CardContent>
              <EditRestaurantForm
                initialValues={restaurant}
                onSubmit={handleUpdate}
                onCancel={() => { }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardContent>
              <RestaurantUsers />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="delivery-zones">
          {true ? <RestaurantDeliveryZones
            restaurantId={restaurantId}
            restaurantName={restaurant.title}
          />: <div className="text-center py-8 text-muted-foreground">
                <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Настройки зон доставки будут добавлены позже</p>
              </div>}

        </TabsContent>

        <TabsContent value="directories">
          <Card>
            <CardHeader>
              <CardTitle>{translations.directories.title[language]}</CardTitle>
            </CardHeader>
            <CardContent>
              <RestaurantDirectories
                restaurantId={restaurantId}
                restaurantName={restaurant.title}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interface">
          <Card>
            <CardHeader>
              <CardTitle>{translations.interface.title[language]}</CardTitle>
            </CardHeader>
            <CardContent>
              <TenantDetails network={restaurant.network} onSuccess={() => handleUpdate}/>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>{translations.payment.title[language]}</CardTitle>
            </CardHeader>
            <CardContent>
               <PaymentIntegrations restaurantId={restaurantId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}