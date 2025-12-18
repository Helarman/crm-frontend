'use client'

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useLanguageStore } from '@/lib/stores/language-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NetworkService } from '@/lib/api/network.service';

const MapWithNoSSR = dynamic(
  () => import('@/components/ui/map').then((mod) => mod.Map),
  { ssr: false }
);

interface RestaurantFormValues {
  title: string;
  address: string;
  description: string;
  legalInfo: string;
  latitude: string;
  longitude: string;
  networkId: string;
  images?: string[];
}

export function CreateRestaurantForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (values: RestaurantFormValues) => void;
  onCancel: () => void;
}) {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [networks, setNetworks] = useState<any[]>([]);
  const [isLoadingNetworks, setIsLoadingNetworks] = useState(true);
  const { language } = useLanguageStore();

  const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm<RestaurantFormValues>({
    defaultValues: {
      title: '',
      address: '',
      description: '',
      legalInfo: '',
      latitude: '',
      longitude: '',
      networkId: ''
    }
  });

  const translations = {
    ru: {
      title: 'Название *',
      address: 'Адрес *',
      description: 'Описание',
      legalInfo: 'Юридическая информация',
      location: 'Выберите местоположение на карте *',
      selectedLocation: 'Выбрано',
      selectLocationError: 'Пожалуйста, выберите местоположение на карте',
      cancel: 'Отмена',
      create: 'Создать',
      uploading: 'Загрузка...',
      requiredField: 'Обязательное поле',
      language: 'Язык',
      selectNetwork: 'Выберите сеть *',
      noNetworks: 'Нет доступных сетей'
    },
    en: {
      title: 'Name *',
      address: 'Address *',
      description: 'Description',
      legalInfo: 'Legal Information',
      location: 'Select location on map *',
      selectedLocation: 'Selected',
      selectLocationError: 'Please select location on map',
      cancel: 'Cancel',
      create: 'Create',
      uploading: 'Uploading...',
      requiredField: 'Required field',
      language: 'Language',
      selectNetwork: 'Select network *',
      noNetworks: 'No networks available'
    },
    ka: {
      title: 'სახელი *',
      address: 'მისამართი *',
      description: 'აღწერა',
      legalInfo: 'იურიდიული ინფორმაცია',
      location: 'აირჩიეთ მდებარეობა რუკაზე *',
      selectedLocation: 'არჩეული',
      selectLocationError: 'გთხოვთ აირჩიოთ მდებარეობა რუკაზე',
      cancel: 'გაუქმება',
      create: 'შექმნა',
      uploading: 'იტვირთება...',
      requiredField: 'სავალდებულო ველი',
      language: 'ენა',
      selectNetwork: 'აირჩიეთ ქსელი *',
      noNetworks: 'ხელმისაწვდომი ქსელი არ არის'
    }
  };

  const t = translations[language];

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await NetworkService.getAll();
        setNetworks(data);
      } catch (error) {
        console.error('Error fetching networks:', error);
      } finally {
        setIsLoadingNetworks(false);
      }
    };

    fetchNetworks();
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    setCoordinates({ lat, lng });
    setValue('latitude', lat.toString());
    setValue('longitude', lng.toString());
  };

  const onSubmitHandler = handleSubmit(async (data) => {
    try {
      setIsUploading(true);
      await onSubmit({
        ...data,
        images: [
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg'
        ],
        latitude: coordinates?.lat.toString() as string,
        longitude: coordinates?.lng.toString() as string,
        networkId: data.networkId
      });
    } catch (error) {
      console.error('Error creating restaurant:', error);
    } finally {
      setIsUploading(false);
    }
  });

  return (
    <form onSubmit={onSubmitHandler} className="space-y-4">
      <div>
        <Label htmlFor="networkId" className="mb-4">{t.selectNetwork}</Label>
        {isLoadingNetworks ? (
          <div className="h-10 w-full rounded-md border bg-muted animate-pulse" />
        ) : (
          <Select
            onValueChange={(value) => setValue('networkId', value)}
            value={watch('networkId')}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder={t.selectNetwork} />
            </SelectTrigger>
            <SelectContent>
              {networks.length > 0 ? (
                networks.map((network) => (
                  <SelectItem key={network.id} value={network.id}>
                    {network.name}
                  </SelectItem>
                ))
              ) : (
                <div className="text-sm text-muted-foreground p-2">
                  {t.noNetworks}
                </div>
              )}
            </SelectContent>
          </Select>
        )}
        {errors.networkId && (
          <p className="text-red-500 text-sm">{errors.networkId.message}</p>
        )}
      </div>

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
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="legalInfo" className="mb-4">{t.legalInfo}</Label>
        <Textarea
          id="legalInfo"
          {...register('legalInfo')}
          rows={4}
        />
      </div>

      <div>
        <Label className="mb-4">{t.location}</Label>
        <div className="h-[400px] w-full rounded-md overflow-hidden border">
          <MapWithNoSSR 
            onMapClick={handleMapClick} 
            initialCenter={coordinates}
          />
        </div>
        {coordinates ? (
          <p className="text-sm mt-2">
            {t.selectedLocation}: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
          </p>
        ) : (
          <p className="text-sm text-red-500 mt-2">{t.selectLocationError}</p>
        )}
        <input type="hidden" {...register('latitude', { required: true })} />
        <input type="hidden" {...register('longitude', { required: true })} />
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>
          {t.cancel}
        </Button>
        <Button 
          type="submit" 
          disabled={isUploading || !watch('networkId') || !coordinates}
        >
          {isUploading ? t.uploading : t.create}
        </Button>
      </div>
    </form>
  );
}