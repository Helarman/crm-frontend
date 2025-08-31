'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Language, useLanguageStore } from '@/lib/stores/language-store';
import { WarehouseService } from '@/lib/api/warehouse.service';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function RestaurantsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { language } = useLanguageStore();
  const [isCopying, setIsCopying] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sourceRestaurantId, setSourceRestaurantId] = useState('');
  const [targetRestaurantId, setTargetRestaurantId] = useState('');

  const translations = {
    ru: {
      title: 'Склады',
      description: 'Выберите ресторан для управления складом',
      createButton: 'Добавить ресторан',
      noRestaurants: 'У вас нет ресторанов',
      loading: 'Загрузка...',
      copyWarehouse: 'Копировать склад',
      copyWarehouseButton: 'Копировать склад',
      selectSource: 'Выберите источник',
      selectTarget: 'Выберите назначение',
      copySuccess: 'Склад успешно скопирован',
      copyError: 'Ошибка при копировании склада',
      actions: 'Действия',
      copyDialogTitle: 'Копирование склада',
      copyDialogDescription: 'Выберите ресторан-источник и ресторан-назначение для копирования склада',
      cancel: 'Отмена',
      confirmCopy: 'Копировать',
      source: 'Источник',
      target: ' Назначение'
    },
    ka: {
      title: 'ჩემი რესტორნები',
      description: 'აირჩიეთ რესტორნი საწყობის მართვისთვის',
      createButton: 'რესტორნის დამატება',
      noRestaurants: 'არ გაქვთ რესტორნები',
      loading: 'იტვირთება...',
      copyWarehouse: 'საწყობის კოპირება',
      copyWarehouseButton: 'საწყობის კოპირება',
      selectSource: 'აირჩიეთ წყარო',
      selectTarget: 'აირჩიეთ დანიშნულება',
      copySuccess: 'საწყობი წარმატებით დაკოპირდა',
      copyError: 'საწყობის კოპირების შეცდომა',
      actions: 'მოქმედებები',
      copyDialogTitle: 'საწყობის კოპირება',
      copyDialogDescription: 'აირჩიეთ წყაროს და დანიშნულების რესტორნები საწყობის კოპირებისთვის',
      cancel: 'გაუქმება',
      confirmCopy: 'კოპირება',
      source: 'წყარო',
      target: ' მიზანი'
    }
  };

  const t = translations[language as Language];

  const handleRestaurantClick = (restaurantId: string) => {
    router.push(`/restaurants/${restaurantId}/warehouse`);
  };

  const canCopyWarehouse = user?.role && ['SUPERVISOR', 'MANAGER'].includes(user.role);



  if (loading) {
    return (
      <div>
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

  return (
    <div>
      <div className='mb-6 flex justify-between items-center'>
        <h1 className="text-2xl font-bold">{t.title}</h1>
       
      </div>

      {user?.restaurant?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {user.restaurant.map((restaurant: any) => (
            <Card 
              key={restaurant.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleRestaurantClick(restaurant.id)}
            >
              <CardHeader>
                <CardTitle>{restaurant.title}</CardTitle>
                <CardDescription>{restaurant.address}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <p className="text-lg text-muted-foreground">{t.noRestaurants}</p>
        </div>
      )}

    </div>
  );
}