'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { HexColorPicker } from 'react-colorful'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tenant, TenantService, TenantType } from '@/lib/api/tenant.service'
import { useLanguageStore } from '@/lib/stores/language-store'

// Схема валидации
const tenantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.nativeEnum(TenantType),
  domain: z.string().optional(),
  subdomain: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
})

type TenantFormValues = z.infer<typeof tenantSchema>

// Переводы
const translations = {
  en: {
    name: 'Name',
    type: 'Type',
    domain: 'Domain',
    subdomain: 'Subdomain',
    primaryColor: 'Primary Color',
    secondaryColor: 'Secondary Color',
    accentColor: 'Accent Color',
    create: 'Create Tenant',
    update: 'Update Tenant',
    saving: 'Saving...',
    saved: 'Tenant saved successfully',
    error: 'Error saving tenant',
    validation: {
      nameRequired: 'Name is required',
      invalidColor: 'Invalid color format (must be #RRGGBB)'
    },
    tenantTypes: {
      API: 'API',
      ECOMMERCE: 'E-Commerce'
    }
  },
  ru: {
    name: 'Название',
    type: 'Тип',
    domain: 'Домен',
    subdomain: 'Поддомен',
    primaryColor: 'Основной цвет',
    secondaryColor: 'Вторичный цвет',
    accentColor: 'Акцентный цвет',
    create: 'Создать тенант',
    update: 'Обновить тенант',
    saving: 'Сохранение...',
    saved: 'Тенант успешно сохранен',
    error: 'Ошибка сохранения тенанта',
    validation: {
      nameRequired: 'Название обязательно',
      invalidColor: 'Неверный формат цвета (должен быть #RRGGBB)'
    },
    tenantTypes: {
      API: 'API',
      ECOMMERCE: 'Интернет-магазин'
    }
  },
  ka: {
    name: 'სახელი',
    type: 'ტიპი',
    domain: 'დომენი',
    subdomain: 'ქვედომენი',
    primaryColor: 'ძირითადი ფერი',
    secondaryColor: 'მეორადი ფერი',
    accentColor: 'აქცენტის ფერი',
    create: 'იჯარადარის შექმნა',
    update: 'იჯარადარის განახლება',
    saving: 'შენახვა...',
    saved: 'იჯარადარი წარმატებით შეინახა',
    error: 'შენახვის შეცდომა',
    validation: {
      nameRequired: 'სახელი სავალდებულოა',
      invalidColor: 'არასწორი ფერის ფორმატი (უნდა იყოს #RRGGBB)'
    },
    tenantTypes: {
      API: 'API',
      ECOMMERCE: 'ინტერნეტ მაღაზია'
    }
  }
}

interface TenantDetailsProps {
  network: {
    id: string
    name: string
    tenant?: Tenant | null
  }
  onSuccess: () => void
}

export const TenantDetails = ({ network, onSuccess }: TenantDetailsProps) => {
  const { language } = useLanguageStore()
  const t = translations[language] || translations.en
  const [isLoading, setIsLoading] = useState(false)
  const [showPrimaryPicker, setShowPrimaryPicker] = useState(false)
  const [showSecondaryPicker, setShowSecondaryPicker] = useState(false)
  const [showAccentPicker, setShowAccentPicker] = useState(false)

  const isEditMode = !!network.tenant

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: network.name, // Автоматически используем название сети
      type: network.tenant?.type || TenantType.API,
      domain: network.tenant?.domain || '',
      subdomain: network.tenant?.subdomain || '',
      primaryColor: network.tenant?.primaryColor || '#4f46e5',
      secondaryColor: network.tenant?.secondaryColor || '#1e293b',
      accentColor: network.tenant?.accentColor || '#f43f5e'
    }
  })

  const primaryColor = watch('primaryColor')
  const secondaryColor = watch('secondaryColor')
  const accentColor = watch('accentColor')
  const onSubmit = async (data: TenantFormValues) => {
    try {
      setIsLoading(true)
      
      if (isEditMode && network.tenant) {
        await TenantService.update(network.tenant.id, data)
      } else {
        const createdTenant = await TenantService.create({
          ...data,
          name: network.name,
          networkId: network.id 
        })

      }
      
      toast.success(t.saved)
      onSuccess()
    } catch (error) {
      console.error('Error saving tenant:', error)
      toast.error(t.error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Поле типа */}
        <div className="space-y-2">
          <Label htmlFor="type">{t.type}</Label>
          <Select
            onValueChange={(value) => setValue('type', value as TenantType)}
            defaultValue={watch('type')}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder={t.type} />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TenantType).map((type) => (
                <SelectItem key={type} value={type}>
                  {t.tenantTypes[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Поле домена */}
        <div className="space-y-2">
          <Label htmlFor="domain">{t.domain}</Label>
          <Input
            id="domain"
            {...register('domain')}
            placeholder={t.domain}
          />
        </div>

        {/* Цвета */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Основной цвет */}
          <div className="space-y-3">
            <Label>{t.primaryColor}</Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  className="h-10 w-10 rounded-md border"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => setShowPrimaryPicker(!showPrimaryPicker)}
                />
                {showPrimaryPicker && (
                  <div className="absolute z-10 mt-2">
                    <HexColorPicker
                      color={primaryColor}
                      onChange={(color) => setValue('primaryColor', color)}
                    />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Input
                  {...register('primaryColor')}
                  className={errors.primaryColor ? 'border-red-500' : ''}
                />
              </div>
            </div>
          </div>

          {/* Вторичный цвет */}
          <div className="space-y-3">
            <Label>{t.secondaryColor}</Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  className="h-10 w-10 rounded-md border"
                  style={{ backgroundColor: secondaryColor }}
                  onClick={() => setShowSecondaryPicker(!showSecondaryPicker)}
                />
                {showSecondaryPicker && (
                  <div className="absolute z-10 mt-2">
                    <HexColorPicker
                      color={secondaryColor}
                      onChange={(color) => setValue('secondaryColor', color)}
                    />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Input
                  {...register('secondaryColor')}
                  className={errors.secondaryColor ? 'border-red-500' : ''}
                />
              </div>
            </div>
          </div>

          {/* Акцентный цвет */}
          <div className="space-y-3">
            <Label>{t.accentColor}</Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  type="button"
                  className="h-10 w-10 rounded-md border"
                  style={{ backgroundColor: accentColor }}
                  onClick={() => setShowAccentPicker(!showAccentPicker)}
                />
                {showAccentPicker && (
                  <div className="absolute z-10 mt-2">
                    <HexColorPicker
                      color={accentColor}
                      onChange={(color) => setValue('accentColor', color)}
                    />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Input
                  {...register('accentColor')}
                  className={errors.accentColor ? 'border-red-500' : ''}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Валидационные сообщения */}
        {(errors.primaryColor || errors.secondaryColor || errors.accentColor) && (
          <p className="text-sm text-red-500">
            {t.validation.invalidColor}
          </p>
        )}

        {/* Кнопка сохранения */}
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.saving}
              </>
            ) : (
              isEditMode ? t.update : t.create
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}