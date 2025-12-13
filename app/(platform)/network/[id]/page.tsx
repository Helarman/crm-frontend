'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from "@/lib/hooks/useAuth"
import UnauthorizedPage from "../../unauthorized/page";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  NetworkService, 
  Network, 
  NetworkTransaction, 
  UpdateNetworkDto, 
  UpdateNetworkBalanceDto, 
  NetworkTariff,
  GetNetworkTransactionsParams
} from '@/lib/api/network.service';
import { 
  Building2, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Settings, 
  ChevronLeft, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  Filter,
  Calendar,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { AccessCheck } from '@/components/AccessCheck';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function NetworkPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const networkId = params.id as string;
  
  const [network, setNetwork] = useState<Network | null>(null);
  const [tariffs, setTariffs] = useState<NetworkTariff[]>([]);
  const [deposits, setDeposits] = useState<NetworkTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<NetworkTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [editForm, setEditForm] = useState<UpdateNetworkDto>({});
  const [balanceOperation, setBalanceOperation] = useState<UpdateNetworkBalanceDto>({
    operation: 'DEPOSIT',
    amount: 0,
    reason: '',
    performedById: user?.id
  });

  const [activeTab, setActiveTab] = useState('settings');
  
  // Фильтры для транзакций
  const [transactionFilters, setTransactionFilters] = useState<{
    startDate?: Date;
    endDate?: Date;
    search?: string;
    showFilters: boolean;
  }>({
    showFilters: false
  });
  
  // Состояния для загрузки с фильтрами
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    if (networkId) {
      loadNetworkData();
      loadTransactions(); // Загружаем транзакции отдельно
    }
  }, [networkId]);

  const loadNetworkData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Загружаем данные сети
      const networkData = await NetworkService.getById(networkId);
      setNetwork(networkData);
      
      try {
        const tariffsData = await NetworkService.getAllTariffs();
        setTariffs(tariffsData);
      } catch (secondaryError) {
        console.warn('Ошибка загрузки тарифов:', secondaryError);
      }
      
      setEditForm({
        name: networkData.name,
        description: networkData.description,
        logo: networkData.logo,
        primaryColor: networkData.primaryColor,
        currentTariffId: networkData.currentTariffId
      });
      
    } catch (error) {
      console.error('Ошибка загрузки данных сети:', error);
      setError('Не удалось загрузить данные сети');
      toast.error('Не удалось загрузить данные сети');
    } finally {
      setLoading(false);
    }
  };

const loadTransactions = async (filters?: GetNetworkTransactionsParams) => {
  if (!networkId) return;
  
  try {
    setLoadingTransactions(true);
    
    // Параметры для загрузки транзакций
    const params: GetNetworkTransactionsParams = {
      ...filters,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit: 50,
    };
    
    // Если есть фильтры по дате, применяем их
    if (transactionFilters.startDate) {
      params.startDate = format(transactionFilters.startDate, 'yyyy-MM-dd');
    }
    if (transactionFilters.endDate) {
      params.endDate = format(transactionFilters.endDate, 'yyyy-MM-dd');
    }
    
    if (transactionFilters.search) {
      params.search = transactionFilters.search;
    }
    
    const response = await NetworkService.getNetworkTransactions(networkId, params);
    
    // Проверяем, что response существует и содержит transactions
    const allTransactions = response?.transactions || [];
    
    // Разделяем на депозиты и списания
    setDeposits(allTransactions.filter(t => t.type === 'DEPOSIT'));
    setWithdrawals(allTransactions.filter(t => t.type === 'WITHDRAWAL'));
    
  } catch (error) {
    console.error('Ошибка загрузки транзакций:', error);
    toast.error('Не удалось загрузить историю транзакций');
    
    // Сбрасываем транзакции в случае ошибки
    setDeposits([]);
    setWithdrawals([]);
  } finally {
    setLoadingTransactions(false);
  }
};

  // Проверка прав доступа
  const hasAccess = () => {
    if (!user) return false;
    if (!network) return true; // Пока не загрузили сеть, считаем что есть доступ
    
    // CONTROL всегда имеет доступ
    if (user.role === 'CONTROL') return true;
    
    // Владелец сети имеет доступ
    if (user.id === network.ownerId) return true;
    
    // Другие роли не имеют доступа
    return false;
  };

  const handleUpdateNetwork = async () => {
    if (!network) return;
    
    try {
      setSaving(true);
      const updatedNetwork = await NetworkService.update(network.id, editForm);
      setNetwork(updatedNetwork);
      toast.success('Настройки сети обновлены');
    } catch (error) {
      console.error('Ошибка обновления сети:', error);
      toast.error('Не удалось обновить настройки');
    } finally {
      setSaving(false);
    }
  };

  const handleBalanceOperation = async () => {
    if (!network) return;
    
    try {
      await NetworkService.updateBalance(network.id, {
        ...balanceOperation,
        performedById: user?.id
      });
      
      toast.success(
        `Баланс успешно ${
          balanceOperation.operation === 'DEPOSIT' ? 'пополнен' : 'изменен'
        }`
      );
      
      loadNetworkData();
      loadTransactions(); // Обновляем список транзакций
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

  const handleChangeTariff = async (tariffId: string) => {
    if (!network) return;
    
    try {
      await NetworkService.assignTariffToNetwork(network.id, tariffId);
      toast.success('Тариф успешно изменен');
      loadNetworkData();
    } catch (error) {
      toast.error('Ошибка изменения тарифа');
    }
  };

  const handleRemoveTariff = async () => {
    if (!network) return;
    
    try {
      await NetworkService.removeTariffFromNetwork(network.id);
      toast.success('Тариф успешно удален');
      loadNetworkData();
    } catch (error) {
      toast.error('Ошибка удаления тарифа');
    }
  };

  const handleApplyFilters = () => {
    loadTransactions();
    setTransactionFilters(prev => ({ ...prev, showFilters: false }));
  };

  const handleResetFilters = () => {
    setTransactionFilters({
      startDate: undefined,
      endDate: undefined,
      search: '',
      showFilters: false
    });
    loadTransactions();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilterSummary = () => {
    const parts = [];
    
    if (transactionFilters.startDate) {
      parts.push(`с ${format(transactionFilters.startDate, 'dd.MM.yyyy')}`);
    }
    
    if (transactionFilters.endDate) {
      parts.push(`по ${format(transactionFilters.endDate, 'dd.MM.yyyy')}`);
    }
    
    if (transactionFilters.search) {
      parts.push(`поиск: "${transactionFilters.search}"`);
    }
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  // Показываем загрузку при инициализации auth
  if (authLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Если пользователь не авторизован
  if (!user) {
    return <UnauthorizedPage />;
  }

  // Если есть ошибка загрузки
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <AlertCircle className="mx-auto h-12 w-12 mb-4 text-red-500" />
              <p className="text-lg font-medium">{error}</p>
              <p className="text-sm mt-2">Проверьте ID сети или попробуйте позже</p>
              <Button className="mt-4" onClick={() => router.push('/')}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                На главную
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Если загрузка данных
  if (!network) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Проверяем доступ после загрузки данных
  if (!hasAccess()) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <AlertCircle className="mx-auto h-12 w-12 mb-4 text-red-500" />
              <p className="text-lg font-medium">Доступ запрещен</p>
              <p className="text-sm mt-2">У вас нет прав для просмотра этой страницы</p>
              <Button className="mt-4" onClick={() => router.push('/')}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                На главную
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AccessCheck allowedRoles={['CONTROL', 'SUPERVISOR']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Шапка с навигацией */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {network.name}
                {network.isBlocked && (
                  <Badge variant="destructive">Заблокирована</Badge>
                )}
              </h1>
              <p className="text-muted-foreground">
                Управление сетью ресторанов
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user.role === 'CONTROL' && (
              <Link href="/finance">
                <Button variant="outline">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Все финансы
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Основная информация и баланс */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>
                Данные о сети и её владельце
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Владелец</Label>
                  <p className="font-medium">{network.owner?.name || network.owner?.email || 'Не указан'}</p>
                </div>
                  <div>
                  <Label className="text-sm text-muted-foreground">Рестораны</Label>
                  <p className="font-medium">{network._count?.restaurants || 0}</p>
                </div>

                 
                <div>
                  <Label className="text-sm text-muted-foreground">Описание</Label>
                  <p>{network.description || 'Описание не указано'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Дата создания</Label>
                    <p>{new Date(network.createdAt).toLocaleDateString('ru-RU')}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Последнее обновление</Label>
                    <p>{new Date(network.updatedAt).toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Финансы</CardTitle>
              <CardDescription>Текущее состояние</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Текущий баланс</Label>
                  <div className={`text-3xl font-bold flex items-center ${
                    network.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPrice(network.balance)}
                    {network.balance >= 0 ? (
                      <ArrowUpRight className="h-6 w-6 ml-2" />
                    ) : (
                      <ArrowDownRight className="h-6 w-6 ml-2" />
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Текущий тариф</Label>
                  {network.currentTariff ? (
                    <div className="flex items-center justify-between mt-1">
                      <div>
                        <p className="font-medium">{network.currentTariff.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(network.currentTariff.price)} / мес
                        </p>
                      </div>
                      <Badge variant="outline">Активен</Badge>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Не назначен</p>
                  )}
                </div>

                {user.role === 'CONTROL' && <div className="pt-2">
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setBalanceOperation({
                            operation: 'DEPOSIT',
                            amount: 0,
                            reason: '',
                            performedById: user?.id
                          })}
                        >
                          <ArrowUpRight className="h-4 w-4 mr-2" />
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
                          className="flex-1"
                          onClick={() => setBalanceOperation({
                            operation: 'WITHDRAWAL',
                            amount: 0,
                            reason: '',
                            performedById: user?.id
                          })}
                        >
                          <ArrowDownRight className="h-4 w-4 mr-2" />
                          Списать
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Списание с баланса</DialogTitle>
                          <DialogDescription>
                            Списать средства с баланса сети "{network.name}"
                            <br />
                            Текущий баланс: {formatPrice(network.balance)}
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
                </div>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Основные вкладки */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Настройки
            </TabsTrigger>
            <TabsTrigger value="deposits">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Пополнения
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
              <ArrowDownRight className="h-4 w-4 mr-2" />
              Списания
            </TabsTrigger>
          </TabsList>

          {/* Вкладка настроек */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основные настройки</CardTitle>
                <CardDescription>Информация о сети</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Название сети</Label>
                  <Input
                    id="name"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows={3}
                  />
                </div>
                
              </CardContent>
              <CardFooter>
                <Button onClick={handleUpdateNetwork} disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Управление тарифом</CardTitle>
                <CardDescription>Назначьте тариф для этой сети</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Выберите тариф</Label>
                    <Select
                      value={editForm.currentTariffId || ''}
                      onValueChange={(value) => handleChangeTariff(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тариф" />
                      </SelectTrigger>
                      <SelectContent>
                        {tariffs.map(tariff => (
                          <SelectItem key={tariff.id} value={tariff.id}>
                            {tariff.name} - {formatPrice(tariff.price)} / мес
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {network.currentTariff && (
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Текущий тариф: {network.currentTariff.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Цена: {formatPrice(network.currentTariff.price)} / {network.currentTariff.period === 'month' ? 'месяц' : network.currentTariff.period === 'quarter' ? 'квартал' : 'год'}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveTariff}
                        >
                          Убрать тариф
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* Вкладка пополнений */}
          <TabsContent value="deposits">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>История пополнений</CardTitle>
                    <CardDescription>
                      {getFilterSummary() ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span>Фильтры: {getFilterSummary()}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                            className="h-6 px-2"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        'Все операции пополнения баланса'
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Popover open={transactionFilters.showFilters} onOpenChange={(open) => 
                      setTransactionFilters(prev => ({ ...prev, showFilters: open }))
                    }>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Фильтры
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="end">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Фильтры по дате</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                <Label className="text-xs">С даты</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !transactionFilters.startDate && "text-muted-foreground"
                                      )}
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {transactionFilters.startDate ? (
                                        format(transactionFilters.startDate, "dd.MM.yyyy")
                                      ) : (
                                        <span>Выберите дату</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <CalendarComponent
                                      mode="single"
                                      selected={transactionFilters.startDate}
                                      onSelect={(date) =>
                                        setTransactionFilters(prev => ({ ...prev, startDate: date || undefined }))
                                      }
                                      initialFocus
                                      locale={ru}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">По дату</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !transactionFilters.endDate && "text-muted-foreground"
                                      )}
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {transactionFilters.endDate ? (
                                        format(transactionFilters.endDate, "dd.MM.yyyy")
                                      ) : (
                                        <span>Выберите дату</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <CalendarComponent
                                      mode="single"
                                      selected={transactionFilters.endDate}
                                      onSelect={(date) =>
                                        setTransactionFilters(prev => ({ ...prev, endDate: date || undefined }))
                                      }
                                      initialFocus
                                      locale={ru}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs">Поиск по описанию</Label>
                            <Input
                              placeholder="Введите текст для поиска"
                              value={transactionFilters.search || ''}
                              onChange={(e) => setTransactionFilters(prev => ({ 
                                ...prev, 
                                search: e.target.value 
                              }))}
                            />
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                setTransactionFilters(prev => ({ 
                                  ...prev, 
                                  startDate: undefined,
                                  endDate: undefined,
                                  search: ''
                                }));
                              }}
                            >
                              Сбросить
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={handleApplyFilters}
                            >
                              Применить
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingTransactions ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : deposits.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <ArrowUpRight className="mx-auto h-12 w-12 mb-4 opacity-20" />
                    <p>Нет операций пополнения</p>
                    <p className="text-sm">Здесь будут отображаться все пополнения баланса</p>
                    {getFilterSummary() && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={handleResetFilters}
                      >
                        Сбросить фильтры
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deposits.map((transaction) => (
                      <Card key={transaction.id} className="border-green-500/20 bg-green-500/5">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <ArrowUpRight className="h-4 w-4 text-green-500" />
                                <span className="font-medium">Пополнение баланса</span>
                                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                                  +{formatPrice(transaction.amount)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {transaction.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {formatDate(transaction.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">Баланс после:</p>
                              <p className="text-lg font-bold text-green-600">
                                {formatPrice(transaction.balanceAfter)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Всего записей: {deposits.length}
                </div>
                <Button
                  variant="outline"
                  onClick={() => loadTransactions()}
                  disabled={loadingTransactions}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingTransactions ? 'animate-spin' : ''}`} />
                  Обновить
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Вкладка списаний */}
          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>История списаний</CardTitle>
                    <CardDescription>
                      {getFilterSummary() ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span>Фильтры: {getFilterSummary()}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                            className="h-6 px-2"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        'Все операции списания с баланса'
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Popover open={transactionFilters.showFilters} onOpenChange={(open) => 
                      setTransactionFilters(prev => ({ ...prev, showFilters: open }))
                    }>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Фильтры
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="end">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Фильтры по дате</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                <Label className="text-xs">С даты</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !transactionFilters.startDate && "text-muted-foreground"
                                      )}
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {transactionFilters.startDate ? (
                                        format(transactionFilters.startDate, "dd.MM.yyyy")
                                      ) : (
                                        <span>Выберите дату</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <CalendarComponent
                                      mode="single"
                                      selected={transactionFilters.startDate}
                                      onSelect={(date) =>
                                        setTransactionFilters(prev => ({ ...prev, startDate: date || undefined }))
                                      }
                                      initialFocus
                                      locale={ru}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">По дату</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !transactionFilters.endDate && "text-muted-foreground"
                                      )}
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {transactionFilters.endDate ? (
                                        format(transactionFilters.endDate, "dd.MM.yyyy")
                                      ) : (
                                        <span>Выберите дату</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <CalendarComponent
                                      mode="single"
                                      selected={transactionFilters.endDate}
                                      onSelect={(date) =>
                                        setTransactionFilters(prev => ({ ...prev, endDate: date || undefined }))
                                      }
                                      initialFocus
                                      locale={ru}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs">Поиск по описанию</Label>
                            <Input
                              placeholder="Введите текст для поиска"
                              value={transactionFilters.search || ''}
                              onChange={(e) => setTransactionFilters(prev => ({ 
                                ...prev, 
                                search: e.target.value 
                              }))}
                            />
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                setTransactionFilters(prev => ({ 
                                  ...prev, 
                                  startDate: undefined,
                                  endDate: undefined,
                                  search: ''
                                }));
                              }}
                            >
                              Сбросить
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={handleApplyFilters}
                            >
                              Применить
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingTransactions ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : withdrawals.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <ArrowDownRight className="mx-auto h-12 w-12 mb-4 opacity-20" />
                    <p>Нет операций списания</p>
                    <p className="text-sm">Здесь будут отображаться все списания с баланса</p>
                    {getFilterSummary() && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={handleResetFilters}
                      >
                        Сбросить фильтры
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {withdrawals.map((transaction) => (
                      <Card key={transaction.id} className="border-red-500/20 bg-red-500/5">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <ArrowDownRight className="h-4 w-4 text-red-500" />
                                <span className="font-medium">Списание с баланса</span>
                                <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
                                  -{formatPrice(transaction.amount)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {transaction.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {formatDate(transaction.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">Баланс после:</p>
                              <p className="text-lg font-bold text-red-600">
                                {formatPrice(transaction.balanceAfter)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Всего записей: {withdrawals.length}
                </div>
                <Button
                  variant="outline"
                  onClick={() => loadTransactions()}
                  disabled={loadingTransactions}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingTransactions ? 'animate-spin' : ''}`} />
                  Обновить
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AccessCheck>
  );
}