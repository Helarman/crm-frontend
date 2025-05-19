// app/restaurants/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Language, useLanguageStore } from '@/lib/stores/language-store';

export default function RestaurantsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { language } = useLanguageStore();

  const translations = {
    ru: {
      title: 'Склады',
      description: 'Выберите ресторан для управления складом',
      createButton: 'Добавить ресторан',
      noRestaurants: 'У вас нет ресторанов',
      loading: 'Загрузка...'
    },
    ka: {
      title: 'ჩემი რესტორნები',
      description: 'აირჩიეთ რესტორნი საწყობის მართვისთვის',
      createButton: 'რესტორნის დამატება',
      noRestaurants: 'არ გაქვთ რესტორნები',
      loading: 'იტვირთება...'
    }
  };

  const t = translations[language as Language];

  const handleRestaurantClick = (restaurantId: string) => {
    router.push(`/restaurants/${restaurantId}/warehouse`);
  };

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
      <div className='mb-6'>
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
          {JSON.stringify(user)}
        </div>
      )}
    </div>
  );
}