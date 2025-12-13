'use client';

import { useState, useEffect } from 'react';
import { AccessCheck } from "@/components/AccessCheck";
import { useAuth } from "@/lib/hooks/useAuth"
import UnauthorizedPage from "../unauthorized/page";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { NetworkService, NetworkTariff, CreateNetworkTariffDto, UpdateNetworkTariffDto } from '@/lib/api/network.service';
import { Plus, Edit, Trash2, Check, X, Calendar, Users, Network as NetworkIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function TariffsPage() {
  const { user } = useAuth()
  const [tariffs, setTariffs] = useState<NetworkTariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  
  // Форма для создания/редактирования
  const [formData, setFormData] = useState<CreateNetworkTariffDto>({
    name: '',
    price: 0,
    period: 'month',
    features: '',
    isActive: true
  });

  useEffect(() => {
    loadTariffs();
  }, []);

  const loadTariffs = async () => {
    try {
      setLoading(true);
      // Теперь получаем ВСЕ тарифы, а не только для конкретной сети
      const data = await NetworkService.getAllTariffs();
      setTariffs(data);
    } catch (error) {
      console.error('Ошибка загрузки тарифов:', error);
      toast.error('Не удалось загрузить тарифы');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setCreating(true);
      // Теперь создаем общий тариф, не привязанный к сети
      const newTariff = await NetworkService.createTariff(formData);
      setTariffs([...tariffs, newTariff]);
      toast.success('Тариф успешно создан');
      resetForm();
    } catch (error) {
      console.error('Ошибка создания тарифа:', error);
      toast.error('Не удалось создать тариф');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (tariffId: string) => {
    try {
      const dto: UpdateNetworkTariffDto = {
        name: formData.name,
        price: formData.price,
        period: formData.period,
        features: formData.features,
        isActive: formData.isActive
      };
      
      const updatedTariff = await NetworkService.updateTariff(tariffId, dto);
      setTariffs(tariffs.map(t => t.id === tariffId ? updatedTariff : t));
      toast.success('Тариф успешно обновлен');
      resetForm();
      setEditing(null);
    } catch (error) {
      console.error('Ошибка обновления тарифа:', error);
      toast.error('Не удалось обновить тариф');
    }
  };

  const handleDelete = async (tariffId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот тариф?')) return;
    
    try {
      await NetworkService.deleteTariff(tariffId);
      setTariffs(tariffs.filter(t => t.id !== tariffId));
      toast.success('Тариф успешно удален');
    } catch (error) {
      console.error('Ошибка удаления тарифа:', error);
      toast.error('Не удалось удалить тариф');
    }
  };

  const handleToggleStatus = async (tariff: NetworkTariff) => {
    try {
      const dto: UpdateNetworkTariffDto = {
        isActive: !tariff.isActive
      };
      
      const updatedTariff = await NetworkService.updateTariff(tariff.id, dto);
      setTariffs(tariffs.map(t => t.id === tariff.id ? updatedTariff : t));
      toast.success(`Тариф ${updatedTariff.isActive ? 'активирован' : 'деактивирован'}`);
    } catch (error) {
      console.error('Ошибка изменения статуса тарифа:', error);
      toast.error('Не удалось изменить статус тарифа');
    }
  };


  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      period: 'month',
      features: '',
      isActive: true
    });
  };

  const startEdit = (tariff: NetworkTariff) => {
    setEditing(tariff.id);
    setFormData({
      name: tariff.name,
      price: tariff.price,
      period: tariff.period,
      features: tariff.features || '',
      isActive: tariff.isActive
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    resetForm();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      month: 'месяц',
      quarter: 'квартал',
      year: 'год'
    };
    return labels[period] || period;
  };

  if (!user) {
    return <UnauthorizedPage/>
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Загрузка тарифов...</div>
      </div>
    );
  }

  return (
    <AccessCheck allowedRoles={['CONTROL']}>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Тарифы</h1>
          </div>
          
         { /*<Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Создать тариф
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать новый тариф</DialogTitle>
                <DialogDescription>
                  Тариф будет доступен для назначения всем сетям
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Название тарифа</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Например: Базовый, Премиум"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Цена</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="period">Период</Label>
                    <select
                      id="period"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.period}
                      onChange={(e) => setFormData({...formData, period: e.target.value as any})}
                    >
                      <option value="month">Месяц</option>
                      <option value="quarter">Квартал</option>
                      <option value="year">Год</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="features">Возможности (каждая с новой строки)</Label>
                  <textarea
                    id="features"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.features}
                    onChange={(e) => setFormData({...formData, features: e.target.value})}
                    placeholder="Доступ к аналитике&#10;Техническая поддержка&#10;Неограниченные рестораны"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Активный тариф
                  </Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !formData.name || formData.price <= 0}
                >
                  {creating ? 'Создание...' : 'Создать тариф'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>*/}
        </div>

        {/* Статистика */}
        {tariffs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Всего тарифов</p>
                    <p className="text-2xl font-bold">{tariffs.length}</p>
                  </div>
                  <NetworkIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Активных тарифов</p>
                    <p className="text-2xl font-bold">
                      {tariffs.filter(t => t.isActive).length}
                    </p>
                  </div>
                  <Check className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Средняя цена</p>
                    <p className="text-2xl font-bold">
                      {formatPrice(
                        tariffs.reduce((acc, t) => acc + t.price, 0) / tariffs.length || 0
                      )}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Список тарифов */}
        <div className="space-y-4">
          {tariffs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 mb-4 opacity-20" />
                  <p>Тарифы не найдены</p>
                  <p className="text-sm">Создайте первый тариф для использования сетями</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            tariffs.map((tariff) => (
              <Card key={tariff.id} className="w-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">
                          {editing === tariff.id ? (
                            <Input
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="w-64"
                            />
                          ) : (
                            tariff.name
                          )}
                        </CardTitle>
                        <Badge variant={tariff.isActive ? "default" : "secondary"}>
                          {tariff.isActive ? 'Активен' : 'Неактивен'}
                        </Badge>
                        {tariff._count?.networks && tariff._count.networks > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {tariff._count.networks} сетей
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        {editing === tariff.id ? (
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                                className="w-32"
                                min="0"
                              />
                              <span className="text-sm text-muted-foreground">руб./</span>
                              <select
                                value={formData.period}
                                onChange={(e) => setFormData({...formData, period: e.target.value as any})}
                                className="flex h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="month">месяц</option>
                                <option value="quarter">квартал</option>
                                <option value="year">год</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <span className="text-lg font-semibold">
                            {formatPrice(tariff.price)} / {getPeriodLabel(tariff.period)}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {editing === tariff.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(tariff.id)}
                            disabled={!formData.name || formData.price <= 0}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                     
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(tariff)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(tariff)}
                          >
                            {tariff.isActive ? 'Деактивировать' : 'Активировать'}
                          </Button>
                         
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
           
                
              
              </Card>
            ))
          )}
        </div>
      </div>
    </AccessCheck>
  );
}
