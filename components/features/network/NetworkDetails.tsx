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
import { Textarea } from '@/components/ui/textarea'
import { Network, NetworkService } from '@/lib/api/network.service'
import { useLanguageStore } from '@/lib/stores/language-store'

// Схема валидации
const networkSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
})

type NetworkFormValues = z.infer<typeof networkSchema>

// Переводы
const translations = {
  en: {
    name: 'Name',
    description: 'Description',
    primaryColor: 'Primary Color',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Network saved successfully',
    error: 'Error saving network',
    validation: {
      nameRequired: 'Name is required',
      invalidColor: 'Invalid color format (must be #RRGGBB)'
    }
  },
  ru: {
    name: 'Название',
    description: 'Описание',
    primaryColor: 'Основной цвет',
    save: 'Сохранить',
    saving: 'Сохранение...',
    saved: 'Сеть успешно сохранена',
    error: 'Ошибка сохранения сети',
    validation: {
      nameRequired: 'Название обязательно',
      invalidColor: 'Неверный формат цвета (должен быть #RRGGBB)'
    }
  },
  ka: {
    name: 'სახელი',
    description: 'აღწერა',
    primaryColor: 'ძირითადი ფერი',
    save: 'შენახვა',
    saving: 'შენახვა...',
    saved: 'ქსელი წარმატებით შეინახა',
    error: 'შენახვის შეცდომა',
    validation: {
      nameRequired: 'სახელი სავალდებულოა',
      invalidColor: 'არასწორი ფერის ფორმატი (უნდა იყოს #RRGGBB)'
    }
  }
}

interface NetworkDetailsProps {
  network: Network
  onSuccess: () => void
}

export const NetworkDetails = ({ network, onSuccess }: NetworkDetailsProps) => {
  const { language } = useLanguageStore()
  const t = translations[language] || translations.en
  const [isLoading, setIsLoading] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<NetworkFormValues>({
    resolver: zodResolver(networkSchema),
    defaultValues: {
      name: network.name,
      description: network.description || '',
      primaryColor: network.primaryColor || '#3b82f6'
    }
  })

  const primaryColor = watch('primaryColor')

  const onSubmit = async (data: NetworkFormValues) => {
    try {
      setIsLoading(true)
      
      await NetworkService.update(network.id, {
        name: data.name,
        description: data.description,
        primaryColor: data.primaryColor
      })
      
      toast.success(t.saved)
      onSuccess()
    } catch (error) {
      console.error('Error saving network:', error)
      toast.error(t.error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Поле названия */}
        <div className="space-y-2">
          <Label htmlFor="name">{t.name}</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder={t.name}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500">
              {t.validation.nameRequired}
            </p>
          )}
        </div>

        {/* Поле описания */}
        <div className="space-y-2">
          <Label htmlFor="description">{t.description}</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder={t.description}
            rows={3}
          />
        </div>

        {/* Выбор цвета */}
        <div className="space-y-3">
          <Label>{t.primaryColor}</Label>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                className="h-10 w-10 rounded-md border"
                style={{ backgroundColor: primaryColor }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />
              {showColorPicker && (
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
                className={`w-full ${errors.primaryColor ? 'border-red-500' : ''}`}
              />
              {errors.primaryColor && (
                <p className="mt-1 text-sm text-red-500">
                  {t.validation.invalidColor}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Кнопка сохранения */}
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.saving}
              </>
            ) : (
              t.save
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}