'use client'

import { AccessCheck } from "@/components/AccessCheck";
import { useAuth } from "@/lib/hooks/useAuth"
import { Language, useLanguageStore } from "@/lib/stores/language-store";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Restaurant } from "@/lib/types/restaurant";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import UnauthorizedPage from "./unauthorized/page";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Warehouse, 
  Utensils, 
  ShoppingCart, 
  ChefHat,
  Store 
} from "lucide-react";

const RESTAURANT_STORAGE_KEY = 'selectedRestaurantId';

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth();
  const { language } = useLanguageStore();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');

  const translations = {
    ru: {
      hello: "Добро пожаловать",
      myRestaurants: "Мои рестораны",
      address: "Адрес",
      noRestaurants: "Нет ресторанов",
      orders: "Заказы",
      kitchen: "Кухня",
      warehouse: "Склад",
      actions: "Действия",
      phone: "Телефон",
      status: "Статус",
      quickAccess: "Быстрый доступ"
    },
    ka: {
      hello: "მოგესალმებით",
      myRestaurants: "ჩემი რესტორნები",
      address: "მისამართი",
      noRestaurants: "რესტორნები არ არის",
      orders: "შეკვეთები",
      kitchen: "სამზარეულო",
      warehouse: "საწყობი",
      actions: "მოქმედებები",
      phone: "ტელეფონი",
      status: "სტატუსი",
      quickAccess: "სწრაფი წვდომა"
    }
  } as const;

  const t = translations[language as Language];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  // Сохранение выбранного ресторана в localStorage
  useEffect(() => {
    if (selectedRestaurantId) {
      localStorage.setItem(RESTAURANT_STORAGE_KEY, selectedRestaurantId);
    }
  }, [selectedRestaurantId])

  // Инициализация выбранного ресторана
  useEffect(() => {
    if (user?.restaurant?.length > 0) {
      const savedRestaurantId = localStorage.getItem(RESTAURANT_STORAGE_KEY);
      const defaultRestaurantId = user.restaurant[0].id;

      const isValidSavedRestaurant = savedRestaurantId &&
        user.restaurant.some((r: Restaurant) => r.id === savedRestaurantId);

      const newRestaurantId = isValidSavedRestaurant ? savedRestaurantId : defaultRestaurantId;

      setSelectedRestaurantId(newRestaurantId);

      if (!isValidSavedRestaurant || savedRestaurantId !== newRestaurantId) {
        localStorage.setItem(RESTAURANT_STORAGE_KEY, newRestaurantId);
      }
    }
  }, [user])

  const handleRestaurantAction = (restaurantId: string, path: string) => {
    setSelectedRestaurantId(restaurantId);
    setTimeout(() => {
      router.push(path);
    }, 100);
  }



  if (!user) {
    return <UnauthorizedPage/>
  }

  return (
    <AccessCheck allowedRoles={['NONE', 'STOREMAN', 'COURIER', 'COOK', 'CHEF', 'WAITER', 'CASHIER', 'MANAGER', 'SUPERVISOR']}>
      <div className="container mx-auto p-6 space-y-8">
        {/* Профиль пользователя */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                <AvatarImage src={user?.picture} />
                <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-800">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-3">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{user?.name}</h1>
                  <p className="text-muted-foreground text-lg">{user?.email}</p>
                </div>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {user.role === 'SUPERVISOR' ? 'Супервайзер' : user?.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

            {user.restaurant && user.restaurant.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Название</TableHead>
                      <TableHead className="font-semibold">{t.address}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.restaurant.map((restaurant: Restaurant) => (
                      <TableRow 
                        key={restaurant.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleRestaurantAction(restaurant.id, `/restaurants/${restaurant.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{restaurant.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {restaurant.address}
                        </TableCell>
                       
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestaurantAction(restaurant.id, '/orders');
                              }}
                              className="flex items-center gap-2"
                            >
                              <ShoppingCart className="h-4 w-4" />
                              {t.orders}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestaurantAction(restaurant.id, '/kitchen');
                              }}
                              className="flex items-center gap-2"
                            >
                              <ChefHat className="h-4 w-4" />
                              {t.kitchen}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestaurantAction(restaurant.id, `/restaurants/${restaurant.id}/warehouse`);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Warehouse className="h-4 w-4" />
                              {t.warehouse}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">{t.noRestaurants}</p>
              </div>
            )}
      </div>
    </AccessCheck>
  );
}