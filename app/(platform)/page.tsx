'use client'

import { AccessCheck } from "@/components/AccessCheck";
import { useAuth } from "@/lib/hooks/useAuth"
import UnauthorizedPage from "./unauthorized/page";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NetworkService, Network } from "@/lib/api/network.service";
import { Building2, DollarSign, CreditCard, Users, ChevronRight, Wallet, BarChart, TrendingUp, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function HomePage() {
  const { user } = useAuth();
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserNetworks();
    }
  }, [user]);

  const loadUserNetworks = async () => {
    try {
      setLoading(true);
      if (user?.id) {
        const data = await NetworkService.getByUser(user.id);
        setNetworks(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки сетей:', error);
      toast.error('Не удалось загрузить сети');
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(balance);
  };

  if (!user) {
    return <UnauthorizedPage/>
  }

  // Если пользователь CONTROL - показываем большие карточки для перехода
  if (user.role === 'CONTROL') {
    return (
      <AccessCheck allowedRoles={['CONTROL']}>
        <div className="container mx-auto p-6 space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Панель управления</h1>
            <p className="text-muted-foreground mt-2">
              Добро пожаловать, {user.name || user.email}!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Карточка для Финансов */}
            <Card className="hover:shadow-lg transition-shadow border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <DollarSign className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Финансы</CardTitle>
                    <CardDescription>
                      Управление финансами всех сетей
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardFooter>
                <Link href="/finances" className="w-full">
                  <Button className="w-full" size="lg">
                    Перейти к финансам
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Карточка для Тарифов */}
            <Card className="hover:shadow-lg transition-shadow border-blue-500/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <CreditCard className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Тарифы</CardTitle>
                    <CardDescription>
                      Управление тарифными планами
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardFooter>
                <Link href="/tariffs" className="w-full">
                  <Button className="w-full" size="lg" variant="outline">
                    Управление тарифами
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>

        </div>
      </AccessCheck>
    );
  }

  return (
    <AccessCheck allowedRoles={['SUPERVISOR']}>
      <div className="container mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Мои сети ресторанов</h1>
          <p className="text-muted-foreground mt-2">
            Добро пожаловать, {user.name || user.email}! Здесь вы можете управлять своими сетями.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : networks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground py-8">
                <Building2 className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p>У вас пока нет сетей ресторанов</p>
                <p className="text-sm">Обратитесь к администратору для создания сети</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {networks.map((network) => (
              <Card key={network.id} className="hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row">
                  {/* Левая часть - информация о сети */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold flex items-center gap-2">
                          {network.name}
                          {network.isBlocked && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                              Заблокирована
                            </span>
                          )}
                        </h3>
                        <p className="text-muted-foreground mt-1">
                          {network.description || 'Описание не указано'}
                        </p>
                      </div>
                      <Link href={`/network/${network.id}`}>
                        <Button variant="outline" size="sm">
                          Подробнее
                          <Eye className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      {/* Баланс */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Баланс</span>
                        </div>
                        <p className={`text-2xl font-bold ${
                          network.balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatBalance(network.balance)}
                        </p>
                      </div>

                      {/* Текущий тариф */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Текущий тариф</span>
                        </div>
                        {network.currentTariff ? (
                          <div>
                            <p className="font-medium">{network.currentTariff.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatBalance(network.currentTariff.price)} / мес
                            </p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">Не назначен</p>
                        )}
                      </div>

                      {/* Статистика */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <BarChart className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Рестораны</span>
                        </div>
                        <p className="text-2xl font-bold">
                          {network._count?.restaurants || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Транзакций: {network._count?.transactions || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Общая статистика для SUPERVISOR */}
        {networks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Общая статистика</CardTitle>
              <CardDescription>
                Сводка по всем вашим сетям
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{networks.length}</p>
                  <p className="text-sm text-muted-foreground">Всего сетей</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {formatBalance(networks.reduce((sum, n) => sum + n.balance, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Общий баланс</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {networks.reduce((sum, n) => sum + (n._count?.restaurants || 0), 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Всего ресторанов</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {networks.filter(n => !n.isBlocked).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Активных сетей</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AccessCheck>
  );
}