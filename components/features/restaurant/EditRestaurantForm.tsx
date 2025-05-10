import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguageStore } from '@/lib/stores/language-store';


const MapWithNoSSR = dynamic(
  () => import('@/components/ui/map').then((mod) => mod.Map),
  { ssr: false }
);

interface RestaurantFormValues {
  title: string;
  address: string;
  description: string;
  latitude: string;
  longitude: string;
  images?: string[];
}

interface EditRestaurantFormProps {
  initialValues: RestaurantFormValues;
  onSubmit: any;
  onCancel: () => void;
}

export function EditRestaurantForm({ 
  initialValues, 
  onSubmit, 
  onCancel 
}: EditRestaurantFormProps) {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({ lat: 55.751244, lng: 37.618423 });
  const [isUploading, setIsUploading] = useState(false);
  const { language, setLanguage } = useLanguageStore();

  const { register, handleSubmit, setValue, formState: { errors, isDirty } } = useForm<RestaurantFormValues>({
    defaultValues: initialValues
  });

  const translations = {
    ru: {
      title: 'Название *',
      address: 'Адрес *',
      description: 'Описание',
      location: 'Местоположение на карте *',
      currentLocation: 'Текущие координаты',
      selectLocation: 'Пожалуйста, выберите местоположение на карте',
      cancel: 'Отмена',
      save: 'Сохранить изменения',
      saving: 'Сохранение...',
      requiredField: 'Обязательное поле',
      language: 'Язык'
    },
    en: {
      title: 'Name *',
      address: 'Address *',
      description: 'Description',
      location: 'Location on map *',
      currentLocation: 'Current coordinates',
      selectLocation: 'Please select location on map',
      cancel: 'Cancel',
      save: 'Save changes',
      saving: 'Saving...',
      requiredField: 'Required field',
      language: 'Language'
    },
    ka: {
      title: 'სახელი *',
      address: 'მისამართი *',
      description: 'აღწერა',
      location: 'მდებარეობა რუკაზე *',
      currentLocation: 'მიმდინარე კოორდინატები',
      selectLocation: 'გთხოვთ აირჩიოთ მდებარეობა რუკაზე',
      cancel: 'გაუქმება',
      save: 'ცვლილებების შენახვა',
      saving: 'ინახება...',
      requiredField: 'სავალდებულო ველი',
      language: 'ენა'
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (initialValues.latitude && initialValues.longitude) {
      setCoordinates({
        lat: parseFloat(initialValues.latitude),
        lng: parseFloat(initialValues.longitude)
      });
    }
  }, [initialValues.latitude, initialValues.longitude]);

  const handleMapClick = (lat: number, lng: number) => {
    setCoordinates({ lat, lng });
    setValue('latitude', lat.toString(), { shouldDirty: true });
    setValue('longitude', lng.toString(), { shouldDirty: true });
  };

  const onSubmitHandler = handleSubmit(async (data) => {
    setIsUploading(true);
    try {
      await onSubmit({
        ...data,
        latitude: coordinates?.lat.toString() || initialValues.latitude,
        longitude: coordinates?.lng.toString() || initialValues.longitude,
        images: initialValues.images || []
      });
    } catch (error) {
      console.error('Ошибка при обновлении ресторана:', error);
    } finally {
      setIsUploading(false);
    }
  });

  return (
    <form onSubmit={onSubmitHandler} className="space-y-4">
      {/* Form Fields */}
      <div>
        <Label htmlFor="title" className="mb-4">{t.title}</Label>
        <Input
          id="title"
          {...register('title', { required: t.requiredField })}
        />
        {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="address" className="mb-4">{t.address}</Label>
        <Input
          id="address"
          {...register('address', { required: t.requiredField })}
        />
        {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
      </div>

      <div>
        <Label htmlFor="description" className="mb-4">{t.description}</Label>
        <Textarea
          id="description"
          {...register('description')}
          rows={7}
        />
      </div>

      <div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="map">
            <AccordionTrigger>
              <Label>{t.location}</Label>
            </AccordionTrigger>
            <AccordionContent>
              <div className="h-[400px] w-full rounded-md overflow-hidden border mt-2">
                <MapWithNoSSR 
                  onMapClick={handleMapClick} 
                  initialCenter={coordinates}
                />
              </div>
              {coordinates ? (
                <p className="text-sm mt-2">
                  {t.currentLocation}: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </p>
              ) : (
                <p className="text-sm text-red-500 mt-2">{t.selectLocation}</p>
              )}
              <input type="hidden" {...register('latitude', { required: true })} />
              <input type="hidden" {...register('longitude', { required: true })} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          {t.cancel}
        </Button>
        <Button 
          type="submit" 
          disabled={isUploading || !isDirty}
        >
          {isUploading ? t.saving : t.save}
        </Button>
      </div>
    </form>
  );
}