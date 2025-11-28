'use client'

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentProviderType } from '@/lib/api/payment-integration.service';

interface CreatePaymentIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  restaurantId: string;
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

export function CreatePaymentIntegrationDialog({
  open,
  onOpenChange,
  onSubmit,
  restaurantId
}: CreatePaymentIntegrationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    provider: '' as PaymentProviderType,
    isActive: true,
    isTestMode: true,
    // Поля провайдеров
    yookassaShopId: '',
    yookassaSecretKey: '',
    cloudpaymentsPublicId: '',
    cloudpaymentsApiSecret: '',
    sberbankLogin: '',
    sberbankPassword: '',
    sberbankMerchantLogin: '',
    alfabankLogin: '',
    alfabankPassword: '',
    alfabankGatewayMerchantId: '',
    alfabankRestApiUrl: '',
    sbpMerchantId: '',
    sbpSecretKey: '',
    sbpBankName: '',
    sbpQrIssuerId: '',
    tinkoffTerminalKey: '',
    tinkoffPassword: '',
    webhookUrl: '',
    successUrl: '',
    failUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Фильтруем данные - отправляем только нужные поля для выбранного провайдера
      const submitData: any = {
        name: formData.name,
        provider: formData.provider,
        isActive: formData.isActive,
        isTestMode: formData.isTestMode
      };

      // Добавляем поля для выбранного провайдера
      const providerFields = PROVIDER_FIELDS[formData.provider] || [];
      providerFields.forEach(field => {
        if (formData[field.name as keyof typeof formData]) {
          submitData[field.name] = formData[field.name as keyof typeof formData];
        }
      });

      // Добавляем URLы если указаны
      if (formData.webhookUrl) submitData.webhookUrl = formData.webhookUrl;
      if (formData.successUrl) submitData.successUrl = formData.successUrl;
      if (formData.failUrl) submitData.failUrl = formData.failUrl;

      await onSubmit(submitData);
      setFormData({
        name: '',
        provider: '' as PaymentProviderType,
        isActive: true,
        isTestMode: true,
        yookassaShopId: '',
        yookassaSecretKey: '',
        cloudpaymentsPublicId: '',
        cloudpaymentsApiSecret: '',
        sberbankLogin: '',
        sberbankPassword: '',
        sberbankMerchantLogin: '',
        alfabankLogin: '',
        alfabankPassword: '',
        alfabankGatewayMerchantId: '',
        alfabankRestApiUrl: '',
        sbpMerchantId: '',
        sbpSecretKey: '',
        sbpBankName: '',
        sbpQrIssuerId: '',
        tinkoffTerminalKey: '',
        tinkoffPassword: '',
        webhookUrl: '',
        successUrl: '',
        failUrl: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const currentProviderFields = formData.provider ? PROVIDER_FIELDS[formData.provider] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить платежную интеграцию</DialogTitle>
          <DialogDescription>
            Настройте подключение к платежной системе для приема оплат
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full">
              <TabsTrigger value="general">Основное</TabsTrigger>
              <TabsTrigger value="provider">Провайдер</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Название интеграции *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Например: Основная ЮKassa"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">Платежная система *</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value: PaymentProviderType) => handleChange('provider', value)}
                    required
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="Выберите платежную систему" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PaymentProviderType.YOOKASSA}>ЮKassa</SelectItem>
                      <SelectItem value={PaymentProviderType.CLOUDPAYMENTS}>CloudPayments</SelectItem>
                      <SelectItem value={PaymentProviderType.SBERBANK}>Сбербанк</SelectItem>
                      <SelectItem value={PaymentProviderType.ALFABANK}>Альфа-банк</SelectItem>
                      <SelectItem value={PaymentProviderType.SBP}>СБП</SelectItem>
                      <SelectItem value={PaymentProviderType.TINKOFF}>Тинькофф</SelectItem>
                    </SelectContent>
                  </Select>
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
              {formData.provider ? (
                <div className="space-y-4">
                  {currentProviderFields.map(field => (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name}>
                        {field.label} {field.required && '*'}
                      </Label>
                      <Input
                        id={field.name}
                        type={field.type || 'text'}
                        value={formData[field.name as keyof typeof formData] as string}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        required={field.required}
                        placeholder={`Введите ${field.label.toLowerCase()}`}
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
                        value={formData.webhookUrl}
                        onChange={(e) => handleChange('webhookUrl', e.target.value)}
                        placeholder="https://ваш-домен.com/webhooks/payment"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="successUrl">URL успешной оплаты</Label>
                      <Input
                        id="successUrl"
                        type="url"
                        value={formData.successUrl}
                        onChange={(e) => handleChange('successUrl', e.target.value)}
                        placeholder="https://ваш-домен.com/success"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="failUrl">URL неудачной оплаты</Label>
                      <Input
                        id="failUrl"
                        type="url"
                        value={formData.failUrl}
                        onChange={(e) => handleChange('failUrl', e.target.value)}
                        placeholder="https://ваш-домен.com/fail"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Выберите платежную систему в основных настройках
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.provider}>
              {loading ? 'Создание...' : 'Создать интеграцию'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}