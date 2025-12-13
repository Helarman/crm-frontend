'use client';

import { useState, useEffect } from 'react';
import { useAuth } from "@/lib/hooks/useAuth";
import UnauthorizedPage from "../unauthorized/page";
import { AccessCheck } from "@/components/AccessCheck";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NetworkService, Network, NetworkTariff, CreateNetworkTariffDto, UpdateNetworkTariffDto, UpdateNetworkBalanceDto } from '@/lib/api/network.service';
import { Search, Plus, Edit, Trash2, Check, X, Calendar, DollarSign, TrendingUp, Users, Building2, Filter, ChevronRight, Wallet, CreditCard, ArrowUpRight, ArrowDownRight, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function FinancePage() {
  const { user } = useAuth()
  const [networks, setNetworks] = useState<Network[]>([]);
  const [tariffs, setTariffs] = useState<NetworkTariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  
  // Фильтры
  const [balanceFilter, setBalanceFilter] = useState<string>('all');
  const [tariffFilter, setTariffFilter] = useState<string>('all');
  
  // Операции с балансом
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [balanceOperation, setBalanceOperation] = useState<UpdateNetworkBalanceDto>({
    operation: 'DEPOSIT',
    amount: 0,
    reason: '',
    performedById: user?.id
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [networksData, tariffsData] = await Promise.all([
        NetworkService.getAll(),
        NetworkService.getAllTariffs()
      ]);
      setNetworks(networksData);
      setTariffs(tariffsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      toast.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация сетей
  const filteredNetworks = networks.filter(network => {
    // Поиск по названию
    if (searchTerm && !network.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Фильтр по тарифу
    if (tariffFilter !== 'all' && network.currentTariffId !== tariffFilter) {
      return false;
    }
    
    // Фильтр по балансу
    if (balanceFilter !== 'all') {
      switch (balanceFilter) {
        case 'positive':
          if (network.balance <= 0) return false;
          break;
        case 'negative':
          if (network.balance >= 0) return false;
          break;
        case 'zero':
          if (network.balance !== 0) return false;
          break;
        case 'high':
          if (network.balance < 10000) return false; // Пример порога
          break;
      }
    }
    
    // Фильтр по статусу блокировки
    if (selectedTab === 'blocked' && !network.isBlocked) return false;
    if (selectedTab === 'active' && network.isBlocked) return false;
    
    return true;
  });

  // Статистика
  const stats = {
    totalNetworks: networks.length,
    activeNetworks: networks.filter(n => !n.isBlocked).length,
    blockedNetworks: networks.filter(n => n.isBlocked).length,
    totalBalance: networks.reduce((sum, n) => sum + n.balance, 0),
    averageBalance: networks.length > 0 
      ? networks.reduce((sum, n) => sum + n.balance, 0) / networks.length 
      : 0,
    networksWithTariff: networks.filter(n => n.currentTariffId).length
  };

  // Операции с балансом
  const handleBalanceOperation = async () => {
    if (!selectedNetwork) return;
    
    try {
      await NetworkService.updateBalance(selectedNetwork.id, {
        ...balanceOperation,
        performedById: user?.id
      });
      
      toast.success(
        `Баланс сети "${selectedNetwork.name}" успешно ${
          balanceOperation.operation === 'DEPOSIT' ? 'пополнен' : 'изменен'
        }`
      );
      
      // Обновляем список сетей
      loadData();
      setSelectedNetwork(null);
      setBalanceOperation({
        operation: 'DEPOSIT',
        amount: 0,
        reason: '',
        performedById: user?.id
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка операции с балансом');
    }
  };

  // Изменение тарифа
  const handleChangeTariff = async (networkId: string, tariffId: string) => {
    try {
      await NetworkService.assignTariffToNetwork(networkId, tariffId);
      toast.success('Тариф успешно изменен');
      loadData();
    } catch (error) {
      toast.error('Ошибка изменения тарифа');
    }
  };

  // Удаление тарифа
  const handleRemoveTariff = async (networkId: string) => {
    try {
      await NetworkService.removeTariffFromNetwork(networkId);
      toast.success('Тариф успешно удален');
      loadData();
    } catch (error) {
      toast.error('Ошибка удаления тарифа');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatBalance = (balance: number) => {
    return formatPrice(balance);
  };

  if (!user) {
    return <UnauthorizedPage />;
  }

  return (
    <AccessCheck allowedRoles={['CONTROL']}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Заголовок */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Финансы
            </h1>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Всего сетей</p>
                  <p className="text-2xl font-bold">{stats.totalNetworks}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Общий баланс сетей</p>
                  <p className="text-2xl font-bold">{formatBalance(stats.totalBalance)}</p>
                </div>
                <Wallet className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">С тарифом</p>
                  <p className="text-2xl font-bold">{stats.networksWithTariff}</p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Активные</p>
                  <p className="text-2xl font-bold">{stats.activeNetworks}</p>
                </div>
                <Users className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Фильтры и поиск */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию сети..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={tariffFilter} onValueChange={setTariffFilter}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder="Все тарифы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все тарифы</SelectItem>
                  {tariffs.map(tariff => (
                    <SelectItem key={tariff.id} value={tariff.id}>
                      {tariff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder="Все балансы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все балансы</SelectItem>
                  <SelectItem value="positive">Положительный</SelectItem>
                  <SelectItem value="negative">Отрицательный</SelectItem>
                  <SelectItem value="zero">Нулевой</SelectItem>
                </SelectContent>
              </Select>
                
                
              <Select value={selectedTab} onValueChange={setSelectedTab}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder="Все" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="blocked">Заблокированы</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Список сетей */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredNetworks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground py-8">
                <Building2 className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p>Сети не найдены</p>
                <p className="text-sm">Измените параметры поиска или фильтры</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNetworks.map((network) => (
              <Card key={network.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {network.name}
                        {network.isBlocked && (
                          <Badge variant="destructive">Заблокирована</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Building2 className="h-3 w-3" />
                        {network._count?.restaurants || 0} ресторанов
                      </CardDescription>
                    </div>
                    <Link href={`/network/${network.id}`}>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-3">
                  <div className="space-y-4">
                    {/* Баланс */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Баланс</p>
                      <div className={`text-2xl font-bold flex items-center ${
                        network.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatBalance(network.balance)}
                        {network.balance >= 0 ? (
                          <ArrowUpRight className="h-5 w-5 ml-1" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 ml-1" />
                        )}
                      </div>
                    </div>

                    {/* Текущий тариф */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Текущий тариф</p>
                      {network.currentTariff ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{network.currentTariff.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(network.currentTariff.price)} / мес
                            </p>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                Изменить
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Изменить тариф для сети "{network.name}"</DialogTitle>
                                <DialogDescription>
                                  Выберите новый тариф для этой сети
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4 py-4">
                                {tariffs.map(tariff => (
                                  <Card 
                                    key={tariff.id}
                                    className={`cursor-pointer hover:border-primary transition-colors ${
                                      network.currentTariffId === tariff.id 
                                        ? 'border-primary bg-primary/5' 
                                        : ''
                                    }`}
                                    onClick={() => handleChangeTariff(network.id, tariff.id)}
                                  >
                                    <CardContent className="pt-4">
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="font-medium">{tariff.name}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {formatPrice(tariff.price)} / {tariff.period === 'month' ? 'месяц' : tariff.period === 'quarter' ? 'квартал' : 'год'}
                                          </p>
                                        </div>
                                        {network.currentTariffId === tariff.id && (
                                          <Check className="h-5 w-5 text-primary" />
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                                
                                <Button 
                                  variant="outline" 
                                  className="w-full"
                                  onClick={() => handleRemoveTariff(network.id)}
                                >
                                  Убрать тариф
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-muted-foreground italic">Не назначен</p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                Назначить
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Назначить тариф для сети "{network.name}"</DialogTitle>
                                <DialogDescription>
                                  Выберите тариф для этой сети
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4 py-4">
                                {tariffs.map(tariff => (
                                  <Card 
                                    key={tariff.id}
                                    className="cursor-pointer hover:border-primary transition-colors"
                                    onClick={() => handleChangeTariff(network.id, tariff.id)}
                                  >
                                    <CardContent className="pt-4">
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="font-medium">{tariff.name}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {formatPrice(tariff.price)} / {tariff.period === 'month' ? 'месяц' : tariff.period === 'quarter' ? 'квартал' : 'год'}
                                          </p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>

                    {/* Операции с балансом */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Операции с балансом</p>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedNetwork(network);
                                setBalanceOperation({
                                  operation: 'DEPOSIT',
                                  amount: 0,
                                  reason: '',
                                  performedById: user?.id
                                });
                              }}
                            >
                              <ArrowUpRight className="h-4 w-4 mr-1" />
                              Пополнить
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Пополнение баланса</DialogTitle>
                              <DialogDescription>
                                Пополнить баланс сети "{network.name}"
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="amount">Сумма пополнения</Label>
                                <Input
                                  id="amount"
                                  type="number"
                                  value={balanceOperation.amount}
                                  onChange={(e) => setBalanceOperation({
                                    ...balanceOperation,
                                    amount: parseFloat(e.target.value) || 0
                                  })}
                                  placeholder="Введите сумму"
                                  min="0"
                                />
                              </div>
                              
                              <div className="grid gap-2">
                                <Label htmlFor="reason">Причина</Label>
                                <Input
                                  id="reason"
                                  value={balanceOperation.reason}
                                  onChange={(e) => setBalanceOperation({
                                    ...balanceOperation,
                                    reason: e.target.value
                                  })}
                                  placeholder="Оплата услуг"
                                />
                              </div>
                              
                              <Button 
                                onClick={handleBalanceOperation}
                                disabled={balanceOperation.amount <= 0}
                              >
                                Пополнить на {formatPrice(balanceOperation.amount)}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedNetwork(network);
                                setBalanceOperation({
                                  operation: 'WITHDRAWAL',
                                  amount: 0,
                                  reason: '',
                                  performedById: user?.id
                                });
                              }}
                            >
                              <ArrowDownRight className="h-4 w-4 mr-1" />
                              Списать
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Списание с баланса</DialogTitle>
                              <DialogDescription>
                                Списать средства с баланса сети "{network.name}"
                                <br />
                                Текущий баланс: {formatBalance(network.balance)}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="amount">Сумма списания</Label>
                                <Input
                                  id="amount"
                                  type="number"
                                  value={balanceOperation.amount}
                                  onChange={(e) => setBalanceOperation({
                                    ...balanceOperation,
                                    amount: parseFloat(e.target.value) || 0
                                  })}
                                  placeholder="Введите сумму"
                                  min="0"
                                  max={network.balance}
                                />
                              </div>
                              
                              <div className="grid gap-2">
                                <Label htmlFor="reason">Причина</Label>
                                <Input
                                  id="reason"
                                  value={balanceOperation.reason}
                                  onChange={(e) => setBalanceOperation({
                                    ...balanceOperation,
                                    reason: e.target.value
                                  })}
                                  placeholder="Оплата услуг"
                                />
                              </div>
                              
                              <Button 
                                onClick={handleBalanceOperation}
                                disabled={balanceOperation.amount <= 0 || balanceOperation.amount > network.balance}
                                variant="destructive"
                              >
                                Списать {formatPrice(balanceOperation.amount)}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="text-sm text-muted-foreground border-t pt-3">
                  <div className="flex justify-between w-full">
                    <div className="flex items-center gap-4">
                      <span>Владелец: {network.owner?.name || 'Не указан'}</span>
                    </div>
                    <Link href={`/network/${network.id}`}>
                      <Button size="sm" variant="ghost">
                        Подробнее
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Диалог для операций с балансом (общий) */}
        <Dialog open={!!selectedNetwork && balanceOperation.operation === 'DEPOSIT'} 
                onOpenChange={(open) => !open && setSelectedNetwork(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Пополнение баланса</DialogTitle>
              <DialogDescription>
                Пополнить баланс сети "{selectedNetwork?.name}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Сумма пополнения</Label>
                <Input
                  id="amount"
                  type="number"
                  value={balanceOperation.amount}
                  onChange={(e) => setBalanceOperation({
                    ...balanceOperation,
                    amount: parseFloat(e.target.value) || 0
                  })}
                  placeholder="Введите сумму"
                  min="0"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="reason">Причина</Label>
                <Input
                  id="reason"
                  value={balanceOperation.reason}
                  onChange={(e) => setBalanceOperation({
                    ...balanceOperation,
                    reason: e.target.value
                  })}
                  placeholder="Оплата услуг"
                />
              </div>
              
              <Button 
                onClick={handleBalanceOperation}
                disabled={balanceOperation.amount <= 0}
              >
                Пополнить на {formatPrice(balanceOperation.amount)}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedNetwork && balanceOperation.operation === 'WITHDRAWAL'} 
                onOpenChange={(open) => !open && setSelectedNetwork(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Списание с баланса</DialogTitle>
              <DialogDescription>
                Списать средства с баланса сети "{selectedNetwork?.name}"
                <br />
                Текущий баланс: {selectedNetwork ? formatBalance(selectedNetwork.balance) : '0 ₽'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Сумма списания</Label>
                <Input
                  id="amount"
                  type="number"
                  value={balanceOperation.amount}
                  onChange={(e) => setBalanceOperation({
                    ...balanceOperation,
                    amount: parseFloat(e.target.value) || 0
                  })}
                  placeholder="Введите сумму"
                  min="0"
                  max={selectedNetwork?.balance}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="reason">Причина</Label>
                <Input
                  id="reason"
                  value={balanceOperation.reason}
                  onChange={(e) => setBalanceOperation({
                    ...balanceOperation,
                    reason: e.target.value
                  })}
                  placeholder="Оплата услуг"
                />
              </div>
              
              <Button 
                onClick={handleBalanceOperation}
                disabled={balanceOperation.amount <= 0 || (selectedNetwork && balanceOperation.amount > selectedNetwork.balance) as any}
                variant="destructive"
              >
                Списать {formatPrice(balanceOperation.amount)}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AccessCheck>
  );
}