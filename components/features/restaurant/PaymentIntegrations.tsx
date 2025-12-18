'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { Plus, Settings, Play, Pause, TestTube2, Rocket, CreditCard } from 'lucide-react';
import { PaymentIntegrationService, PaymentIntegration, PaymentProviderType } from '@/lib/api/payment-integration.service';
import { CreatePaymentIntegrationDialog } from './CreatePaymentIntegrationDialog';
import { EditPaymentIntegrationDialog } from './EditPaymentIntegrationDialog';

interface PaymentIntegrationsProps {
  restaurantId: string;
}

export const PROVIDER_CONFIG = {
  [PaymentProviderType.YOOKASSA]: {
    name: 'ЮKassa',
    color: 'bg-purple-100 border-purple-300 text-purple-800',
  },
  [PaymentProviderType.CLOUDPAYMENTS]: {
    name: 'CloudPayments',
    color: 'bg-blue-100 border-blue-300 text-blue-800',
  },
  [PaymentProviderType.SBERBANK]: {
    name: 'Сбербанк',
    color: 'bg-green-100 border-green-300 text-green-800',
  },
  [PaymentProviderType.ALFABANK]: {
    name: 'Альфа-банк',
    color: 'bg-red-100 border-red-300 text-red-800',
  },
  [PaymentProviderType.SBP]: {
    name: 'СБП',
    color: 'bg-orange-100 border-orange-300 text-orange-800',
  },
  [PaymentProviderType.TINKOFF]: {
    name: 'Тинькофф',
    color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  }
};

export function PaymentIntegrations({ restaurantId }: PaymentIntegrationsProps) {
  const [integrations, setIntegrations] = useState<PaymentIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editIntegration, setEditIntegration] = useState<PaymentIntegration | null>(null);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const data = await PaymentIntegrationService.getAll(restaurantId);
      setIntegrations(data);
    } catch (error) {
      console.error('Failed to load integrations:', error);
      toast.error('Не удалось загрузить платежные интеграции');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, [restaurantId]);

  const handleToggleStatus = async (integration: PaymentIntegration) => {
    try {
      const updated = await PaymentIntegrationService.toggleStatus(
        restaurantId,
        integration.id,
        !integration.isActive
      );
      
      setIntegrations(prev => 
        prev.map(item => 
          item.id === integration.id ? updated : item
        )
      );
      
      toast.success(
        updated.isActive 
          ? 'Интеграция активирована' 
          : 'Интеграция деактивирована'
      );
    } catch (error) {
      console.error('Failed to toggle integration:', error);
      toast.error('Не удалось изменить статус интеграции');
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await PaymentIntegrationService.create(restaurantId, data);
      await loadIntegrations();
      setCreateDialogOpen(false);
      toast.success('Платежная интеграция создана');
    } catch (error) {
      console.error('Failed to create integration:', error);
      toast.error('Не удалось создать интеграцию');
      throw error;
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editIntegration) return;
    
    try {
      await PaymentIntegrationService.update(restaurantId, editIntegration.id, data);
      await loadIntegrations();
      setEditIntegration(null);
      toast.success('Платежная интеграция обновлена');
    } catch (error) {
      console.error('Failed to update integration:', error);
      toast.error('Не удалось обновить интеграцию');
      throw error;
    }
  };

  const handleDelete = async (integration: PaymentIntegration) => {
    try {
      await PaymentIntegrationService.delete(restaurantId, integration.id);
      await loadIntegrations();
      toast.success('Платежная интеграция удалена');
    } catch (error) {
      console.error('Failed to delete integration:', error);
      toast.error('Не удалось удалить интеграцию');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок с адаптивным расположением */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Платежные интеграции</h3>
          <p className="text-sm text-muted-foreground">
            Настройте прием платежей через различные платежные системы
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Добавить интеграцию
        </Button>
      </div>

      <div className="grid gap-4">
        {integrations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Нет платежных интеграций</h3>
              <p className="text-muted-foreground mb-4">
                Добавьте первую платежную систему для приема оплат
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить интеграцию
              </Button>
            </CardContent>
          </Card>
        ) : (
          integrations.map(integration => {
            const config = PROVIDER_CONFIG[integration.provider];
            
            return (
              <Card key={integration.id} className={`border-l-4 border-l-${integration.isActive ? 'green' : 'gray'}-500`}>
                <CardHeader className="pb-3">
                  {/* Адаптивная структура карточки */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                    {/* Контент - расположен в столбик */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <CardTitle className="text-base">
                          {config.name}
                        </CardTitle>
                        <span className="text-sm text-muted-foreground sm:border-l sm:border-border sm:pl-2">
                          {integration.name}
                        </span>
                      </div>
                      
                      <CardDescription className="flex flex-wrap gap-2">
                        <Badge variant={integration.isTestMode ? "secondary" : "default"}>
                          {integration.isTestMode ? (
                            <>
                              <TestTube2 className="h-3 w-3 mr-1" />
                              Тестовый
                            </>
                          ) : (
                            <>
                              <Rocket className="h-3 w-3 mr-1" />
                              Боевой
                            </>
                          )}
                        </Badge>
                        <Badge variant={integration.isActive ? "default" : "secondary"}>
                          {integration.isActive ? 'Активна' : 'Неактивна'}
                        </Badge>
                      </CardDescription>
                    </div>

                    {/* Кнопки действий - расположены в строку на мобильных, с отступами */}
                    <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(integration)}
                        className="flex-1 sm:flex-none"
                      >
                        {integration.isActive ? (
                          <Pause className="h-4 w-4 mr-1" />
                        ) : (
                          <Play className="h-4 w-4 mr-1" />
                        )}
                        <span className="sr-only sm:not-sr-only">
                          {integration.isActive ? 'Выключить' : 'Включить'}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditIntegration(integration)}
                        className="flex-1 sm:flex-none"
                      >
                        <Settings className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:ml-1">
                          Настройки
                        </span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })
        )}
      </div>

      <CreatePaymentIntegrationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
        restaurantId={restaurantId}
      />

      <EditPaymentIntegrationDialog
        open={!!editIntegration}
        onOpenChange={(open) => !open && setEditIntegration(null)}
        integration={editIntegration}
        onSubmit={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}