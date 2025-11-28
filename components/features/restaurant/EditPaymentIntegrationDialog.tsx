'use client'

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PaymentIntegration, PaymentProviderType } from '@/lib/api/payment-integration.service';
import { PROVIDER_CONFIG } from './PaymentIntegrations';

interface EditPaymentIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: PaymentIntegration | null;
  onSubmit: (data: any) => Promise<void>;
  onDelete: (integration: PaymentIntegration) => Promise<void>;
}

const PROVIDER_FIELDS = {
  [PaymentProviderType.YOOKASSA]: [
    { name: 'yookassaShopId', label: 'ID магазина', required: true },
    { name: 'yookassaSecretKey', label: 'Секретный ключ', required: true, type: 'password' }
  ],
  [PaymentProviderType.CLOUDPAYMENTS]: [
    { name: 'cloudpaymentsPublicId', label: 'Публичный ID', required: true },
    { name: 'cloudpaymentsApiSecret', label: 'API секрет', required: true, type: 'password' }
  ],
  [PaymentProviderType.SBERBANK]: [
    { name: 'sberbankLogin', label: 'Логин', required: true },
    { name: 'sberbankPassword', label: 'Пароль', required: true, type: 'password' },
    { name: 'sberbankMerchantLogin', label: 'Мерчант логин', required: false }
  ],
  [PaymentProviderType.ALFABANK]: [
    { name: 'alfabankLogin', label: 'Логин', required: true },
    { name: 'alfabankPassword', label: 'Пароль', required: true, type: 'password' },
    { name: 'alfabankGatewayMerchantId', label: 'ID мерчанта', required: false },
    { name: 'alfabankRestApiUrl', label: 'URL API', required: false }
  ],
  [PaymentProviderType.SBP]: [
    { name: 'sbpMerchantId', label: 'ID мерчанта', required: true },
    { name: 'sbpSecretKey', label: 'Секретный ключ', required: true, type: 'password' },
    { name: 'sbpBankName', label: 'Банк', required: false },
    { name: 'sbpQrIssuerId', label: 'ID эмитента QR', required: false }
  ],
  [PaymentProviderType.TINKOFF]: [
    { name: 'tinkoffTerminalKey', label: 'Терминальный ключ', required: true },
    { name: 'tinkoffPassword', label: 'Пароль', required: true, type: 'password' }
  ]
};
export function EditPaymentIntegrationDialog({
  open,
  onOpenChange,
  integration,
  onSubmit,
  onDelete
}: EditPaymentIntegrationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (integration) {
      setFormData(integration);
    }
  }, [integration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!integration) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDelete = async () => {
    if (!integration) return;
    await onDelete(integration);
    setDeleteDialogOpen(false);
  };

  if (!integration) return null;

  const config = PROVIDER_CONFIG[integration.provider];
  const currentProviderFields = PROVIDER_FIELDS[integration.provider] || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}>
                <div className="w-4 h-4 bg-current rounded" />
              </div>
              Редактировать {config.name}
            </DialogTitle>
            <DialogDescription>
              Измените настройки платежной интеграции
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">Основное</TabsTrigger>
                <TabsTrigger value="provider">Провайдер</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Название интеграции</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between space-y-0 rounded-md border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Активная интеграция</Label>
                      <div className="text-sm text-muted-foreground">
                        Интеграция будет доступна для приема платежей
                      </div>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleChange('isActive', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between space-y-0 rounded-md border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Тестовый режим</Label>
                      <div className="text-sm text-muted-foreground">
                        Использовать тестовую среду платежной системы
                      </div>
                    </div>
                    <Switch
                      checked={formData.isTestMode}
                      onCheckedChange={(checked) => handleChange('isTestMode', checked)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="provider" className="space-y-4">
                <div className="space-y-4">
                  {currentProviderFields.map((field ) => (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name}>
                        {field.label} {field.required && '*'}
                      </Label>
                      <Input
                        id={field.name}
                        type={field.type || 'text'}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        required={field.required}
                        placeholder={field.type === 'password' ? '••••••••' : ''}
                      />
                    </div>
                  ))}

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Дополнительные настройки</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="webhookUrl">URL для вебхуков</Label>
                      <Input
                        id="webhookUrl"
                        type="url"
                        value={formData.webhookUrl || ''}
                        onChange={(e) => handleChange('webhookUrl', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="successUrl">URL успешной оплаты</Label>
                      <Input
                        id="successUrl"
                        type="url"
                        value={formData.successUrl || ''}
                        onChange={(e) => handleChange('successUrl', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="failUrl">URL неудачной оплаты</Label>
                      <Input
                        id="failUrl"
                        type="url"
                        value={formData.failUrl || ''}
                        onChange={(e) => handleChange('failUrl', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Удалить интеграцию
              </Button>

              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить интеграцию?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Интеграция будет полностью удалена из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}