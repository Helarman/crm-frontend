'use client'


import { AccessCheck } from "@/components/AccessCheck";
import { useAuth } from "@/lib/hooks/useAuth"
import { Language, useLanguageStore } from "@/lib/stores/language-store";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Restaurant } from "./orders/new/page";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import UnauthorizedPage from "./unauthorized/page";

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth();
  const { language } = useLanguageStore();


  const translations = {
    ru: {
      hello: "Добро пожаловать"
    },
    ka: {
      hello: "მოგესალმებით"
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
  if (!user) {
    return <UnauthorizedPage/>
  }
  return (
    <AccessCheck allowedRoles={['NONE', 'STOREMAN', 'COURIER', 'COOK', 'CHEF', 'WAITER', 'CASHIER', 'MANAGER', 'SUPERVISOR']}>
      <div>
        <div className="flex flex-col gap-8">
          <Card>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.picture} />
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">{user?.name}</h1>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <Badge variant="outline">
                    {user.role === 'SUPERVISOR' ? 'Супервайзер' : user?.role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Рестораны */}
          <Card>
            <CardHeader>
              <CardTitle>Мои рестораны</CardTitle>
            </CardHeader>
            <CardContent>
              {user.restaurant && user.restaurant.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {user.restaurant.map((restaurant : Restaurant) => (
                    <Card key={restaurant.id} onClick={() => router.push(`/restaurants/${restaurant.id}`)} className="cursor-pointer">
                      <CardHeader>
                        <CardTitle>{restaurant.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Адрес</p>
                            <p>{restaurant.address}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Нет ресторанов</p>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
    </AccessCheck>
  );
}