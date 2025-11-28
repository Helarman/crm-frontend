'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useLanguageStore } from '@/lib/stores/language-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { NetworkService } from '@/lib/api/network.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, MapPin, Search } from 'lucide-react';
import { ImageUploader } from '../menu/product/ImageUploader';



interface RestaurantFormValues {
  title: string;
  address: string;
  description: string;
  legalInfo: string;
  latitude: string;
  longitude: string;
  networkId: string;
  images: string[];
  useWarehouse: boolean;
  shiftCloseTime: string;
  mondayOpen: string;
  mondayClose: string;
  mondayIsWorking: boolean;
  tuesdayOpen: string;
  tuesdayClose: string;
  tuesdayIsWorking: boolean;
  wednesdayOpen: string;
  wednesdayClose: string;
  wednesdayIsWorking: boolean;
  thursdayOpen: string;
  thursdayClose: string;
  thursdayIsWorking: boolean;
  fridayOpen: string;
  fridayClose: string;
  fridayIsWorking: boolean;
  saturdayOpen: string;
  saturdayClose: string;
  saturdayIsWorking: boolean;
  sundayOpen: string;
  sundayClose: string;
  sundayIsWorking: boolean;
  allowNegativeStock: boolean;
  acceptOrders: boolean;
}

interface EditRestaurantFormProps {
  initialValues: RestaurantFormValues;
  onSubmit: any;
  onCancel: () => void;
}

class DadataService {
  private static readonly API_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs';
  private static readonly TOKEN = process.env.NEXT_PUBLIC_DADATA_API_KEY;

  static async geocodeAddress(query: string): Promise<any> {
    if (!this.TOKEN) {
      console.warn('DADATA API key not found');
      return null;
    }

    try {
      const response = await fetch(`${this.API_URL}/suggest/address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Token ${this.TOKEN}`
        },
        body: JSON.stringify({
          query: query,
          count: 1,
          locations: [{ country: '*' }]
        })
      });

      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      return data.suggestions[0] || null;
    } catch (error) {
      console.error('DADATA geocoding error:', error);
      return null;
    }
  }

  static async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    if (!this.TOKEN) {
      console.warn('DADATA API key not found');
      return null;
    }

    try {
      const response = await fetch(`${this.API_URL}/geolocate/address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Token ${this.TOKEN}`
        },
        body: JSON.stringify({
          lat: lat,
          lon: lng,
          count: 1,
          radius_meters: 50
        })
      });

      if (!response.ok) throw new Error('Reverse geocoding failed');
      
      const data = await response.json();
      return data.suggestions[0]?.value || null;
    } catch (error) {
      console.error('DADATA reverse geocoding error:', error);
      return null;
    }
  }
}

export function EditRestaurantForm({ 
  initialValues, 
  onSubmit, 
  onCancel 
}: EditRestaurantFormProps) {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({ 
    lat: initialValues.latitude ? parseFloat(initialValues.latitude) : 55.751244, 
    lng: initialValues.longitude ? parseFloat(initialValues.longitude) : 37.618423 
  });
  const [isUploading, setIsUploading] = useState(false);
  const [networks, setNetworks] = useState<any[]>([]);
  const [isLoadingNetworks, setIsLoadingNetworks] = useState(true);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [manualAddressEdit, setManualAddressEdit] = useState(false);
  const { language } = useLanguageStore();

  const formatTimeForInput = (timeValue: string | Date | null): string => {
    if (!timeValue) return '00:00';
    
    try {
      if (typeof timeValue === 'string' && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeValue)) {
        return timeValue;
      }
      
      const date = new Date(timeValue);
      
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', timeValue);
        return '00:00';
      }
      
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return '00:00';
    }
  };

  const getDefaultValues = () => {
    return {
      ...initialValues,
      images: initialValues.images || [],
      useWarehouse: initialValues.useWarehouse || false,
      allowNegativeStock: initialValues.allowNegativeStock || false,
      acceptOrders: initialValues.acceptOrders || true,
      shiftCloseTime: formatTimeForInput(initialValues.shiftCloseTime),
      mondayOpen: formatTimeForInput(initialValues.mondayOpen),
      mondayClose: formatTimeForInput(initialValues.mondayClose),
      mondayIsWorking: initialValues.mondayIsWorking ?? true,
      tuesdayOpen: formatTimeForInput(initialValues.tuesdayOpen),
      tuesdayClose: formatTimeForInput(initialValues.tuesdayClose),
      tuesdayIsWorking: initialValues.tuesdayIsWorking ?? true,
      wednesdayOpen: formatTimeForInput(initialValues.wednesdayOpen),
      wednesdayClose: formatTimeForInput(initialValues.wednesdayClose),
      wednesdayIsWorking: initialValues.wednesdayIsWorking ?? true,
      thursdayOpen: formatTimeForInput(initialValues.thursdayOpen),
      thursdayClose: formatTimeForInput(initialValues.thursdayClose),
      thursdayIsWorking: initialValues.thursdayIsWorking ?? true,
      fridayOpen: formatTimeForInput(initialValues.fridayOpen),
      fridayClose: formatTimeForInput(initialValues.fridayClose),
      fridayIsWorking: initialValues.fridayIsWorking ?? true,
      saturdayOpen: formatTimeForInput(initialValues.saturdayOpen),
      saturdayClose: formatTimeForInput(initialValues.saturdayClose),
      saturdayIsWorking: initialValues.saturdayIsWorking ?? false,
      sundayOpen: formatTimeForInput(initialValues.sundayOpen),
      sundayClose: formatTimeForInput(initialValues.sundayClose),
      sundayIsWorking: initialValues.sundayIsWorking ?? false,
    };
  };

  const { register, handleSubmit, setValue, formState: { errors, isDirty }, watch } = useForm<RestaurantFormValues>({
    defaultValues: getDefaultValues()
  });

  const translations = {
    ru: {
      title: 'Название *',
      address: 'Адрес *',
      description: 'Описание',
      legalInfo: 'Юридическая информация',
      images: 'Изображения ресторана',
      location: 'Местоположение на карте *',
      currentLocation: 'Текущие координаты',
      selectLocation: 'Пожалуйста, выберите местоположение на карте',
      cancel: 'Отмена',
      save: 'Сохранить изменения',
      saving: 'Сохранение...',
      requiredField: 'Обязательное поле',
      language: 'Язык',
      selectNetwork: 'Выберите сеть *',
      noNetworks: 'Нет доступных сетей',
      useWarehouse: 'Использовать складскую систему',
      useWarehouseDescription: 'Включить управление складом и учет остатков',
      allowNegativeStock: 'Разрешить отрицательный остаток',
      allowNegativeStockDescription: 'Позволить продавать товары при нулевом остатке',
      acceptOrders: 'Принимать заказы',
      acceptOrdersDescription: 'Разрешить клиентам делать заказы из этого ресторана',
      shiftCloseTime: 'Время закрытия смены *',
      shiftCloseTimeDescription: 'Время по умолчанию для автоматического закрытия смен',
      timeFormat: 'Формат: ЧЧ:ММ (24-часовой)',
      invalidTime: 'Неверный формат времени. Используйте ЧЧ:ММ',
      workingHours: 'Часы работы',
      monday: 'Понедельник',
      tuesday: 'Вторник',
      wednesday: 'Среда',
      thursday: 'Четверг',
      friday: 'Пятница',
      saturday: 'Суббота',
      sunday: 'Воскресенье',
      openTime: 'Время открытия',
      closeTime: 'Время закрытия',
      workingDay: 'Рабочий день',
      dayOff: 'Выходной',
      basicInfo: 'Основная информация',
      settings: 'Настройки',
      schedule: 'Расписание работы',
      selectOnMap: 'Выбрать на карте',
      searchAddress: 'Найти адрес',
      map: 'Карта',
      geocoding: 'Поиск координат...',
      selectPointOnMap: 'Выберите точку на карте',
      updateAddress: 'Обновить адрес по карте',
      searchByAddress: 'Найти по адресу',
      searching: 'Поиск...'
    },
    en: {
      title: 'Name *',
      address: 'Address *',
      description: 'Description',
      legalInfo: 'Legal Information',
      images: 'Restaurant Images',
      location: 'Location on map *',
      currentLocation: 'Current coordinates',
      selectLocation: 'Please select location on map',
      cancel: 'Cancel',
      save: 'Save changes',
      saving: 'Saving...',
      requiredField: 'Required field',
      language: 'Language',
      selectNetwork: 'Select network *',
      noNetworks: 'No networks available',
      useWarehouse: 'Use warehouse system',
      useWarehouseDescription: 'Enable warehouse management and stock tracking',
      allowNegativeStock: 'Allow negative stock',
      allowNegativeStockDescription: 'Allow selling products when stock is zero',
      acceptOrders: 'Accept orders',
      acceptOrdersDescription: 'Allow customers to place orders from this restaurant',
      shiftCloseTime: 'Shift Close Time *',
      shiftCloseTimeDescription: 'Default time for automatic shift closing',
      timeFormat: 'Format: HH:MM (24-hour)',
      invalidTime: 'Invalid time format. Use HH:MM',
      workingHours: 'Working Hours',
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
      openTime: 'Open Time',
      closeTime: 'Close Time',
      workingDay: 'Working day',
      dayOff: 'Day off',
      basicInfo: 'Basic Information',
      settings: 'Settings',
      schedule: 'Working Schedule',
      selectOnMap: 'Select on map',
      searchAddress: 'Search address',
      map: 'Map',
      geocoding: 'Searching coordinates...',
      selectPointOnMap: 'Select point on map',
      updateAddress: 'Update address from map',
      searchByAddress: 'Search by address',
      searching: 'Searching...'
    },
    ka: {
      title: 'სახელი *',
      address: 'მისამართი *',
      description: 'აღწერა',
      legalInfo: 'იურიდიული ინფორმაცია',
      images: 'რესტორნის სურათები',
      location: 'მდებარეობა რუკაზე *',
      currentLocation: 'მიმდინარე კოორდინატები',
      selectLocation: 'გთხოვთ აირჩიოთ მდებარეობა რუკაზე',
      cancel: 'გაუქმება',
      save: 'ცვლილებების შენახვა',
      saving: 'ინახება...',
      requiredField: 'სავალდებულო ველი',
      language: 'ენა',
      selectNetwork: 'აირჩიეთ ქსელი *',
      noNetworks: 'ხელმისაწვდომი ქსელი არ არის',
      useWarehouse: 'საწყობის სისტემის გამოყენება',
      useWarehouseDescription: 'ჩართეთ საწყობის მენეჯმენტი და მარაგების თვალყურის დევნება',
      allowNegativeStock: 'ნეგატიური მარაგის ნებართვა',
      allowNegativeStockDescription: 'ნულოვანი მარაგის შემთხვევაში პროდუქტების გაყიდვის ნებართვა',
      acceptOrders: 'შეკვეთების მიღება',
      acceptOrdersDescription: 'მომხმარებლებისთვის ამ რესტორნიდან შეკვეთების განთავსების ნებართვა',
      shiftCloseTime: 'ცვლის დახურვის დრო *',
      shiftCloseTimeDescription: 'ავტომატური ცვლის დახურვის ნაგულისხმევი დრო',
      timeFormat: 'ფორმატი: სს:წწ (24-საათიანი)',
      invalidTime: 'დროის არასწორი ფორმატი. გამოიყენეთ სს:წწ',
      workingHours: 'სამუშაო საათები',
      monday: 'ორშაბათი',
      tuesday: 'სამშაბათი',
      wednesday: 'ოთხშაბათი',
      thursday: 'ხუთშაბათი',
      friday: 'პარასკევი',
      saturday: 'შაბათი',
      sunday: 'კვირა',
      openTime: 'გახსნის დრო',
      closeTime: 'დახურვის დრო',
      workingDay: 'სამუშაო დღე',
      dayOff: 'დასვენების დღე',
      basicInfo: 'ძირითადი ინფორმაცია',
      settings: 'პარამეტრები',
      schedule: 'სამუშაო გრაფიკი',
      selectOnMap: 'აირჩიეთ რუკაზე',
      searchAddress: 'მისამართის ძიება',
      map: 'რუკა',
      geocoding: 'კოორდინატების ძიება...',
      selectPointOnMap: 'აირჩიეთ წერტილი რუკაზე',
      updateAddress: 'განაახლეთ მისამართი რუკიდან',
      searchByAddress: 'ძიება მისამართით',
      searching: 'ძიება...'
    }
  };

  const t = translations[language];

  const useWarehouseValue = watch('useWarehouse');
  const allowNegativeStockValue = watch('allowNegativeStock');
  const acceptOrdersValue = watch('acceptOrders');
  const addressValue = watch('address');
  const imagesValue = watch('images');
  const mondayIsWorking = watch('mondayIsWorking');
  const tuesdayIsWorking = watch('tuesdayIsWorking');
  const wednesdayIsWorking = watch('wednesdayIsWorking');
  const thursdayIsWorking = watch('thursdayIsWorking');
  const fridayIsWorking = watch('fridayIsWorking');
  const saturdayIsWorking = watch('saturdayIsWorking');
  const sundayIsWorking = watch('sundayIsWorking');

  const geocodeAddress = useCallback(async (address: string) => {
    if (!address || address.trim().length < 3) return;
    
    setIsGeocoding(true);
    try {
      const result = await DadataService.geocodeAddress(address);
      if (result && result.data?.geo_lat && result.data?.geo_lon) {
        const lat = parseFloat(result.data.geo_lat);
        const lng = parseFloat(result.data.geo_lon);
        
        setCoordinates({ lat, lng });
        setValue('latitude', lat.toString(), { shouldDirty: true });
        setValue('longitude', lng.toString(), { shouldDirty: true });
        
        if (result.value && !manualAddressEdit) {
          setValue('address', result.value, { shouldDirty: true });
        }
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
    } finally {
      setIsGeocoding(false);
    }
  }, [setValue, manualAddressEdit]);

  const handleSearchAddress = async () => {
    const address = watch('address');
    if (address && address.trim().length > 2) {
      await geocodeAddress(address);
    }
  };

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

    if (initialValues.latitude && initialValues.longitude) {
      setCoordinates({
        lat: parseFloat(initialValues.latitude),
        lng: parseFloat(initialValues.longitude)
      });
    }
  }, [initialValues.latitude, initialValues.longitude]);

  useEffect(() => {
    if (manualAddressEdit) return;

    const timeoutId = setTimeout(() => {
      if (addressValue && addressValue !== initialValues.address) {
        geocodeAddress(addressValue);
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [addressValue, initialValues.address, geocodeAddress, manualAddressEdit]);

  const handleMapClick = async (lat: number, lng: number) => {
    setCoordinates({ lat, lng });
    setValue('latitude', lat.toString(), { shouldDirty: true });
    setValue('longitude', lng.toString(), { shouldDirty: true });

    try {
      const address = await DadataService.reverseGeocode(lat, lng);
      if (address) {
        setValue('address', address, { shouldDirty: true });
        setManualAddressEdit(false);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handleAddressInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualAddressEdit(true);
    setValue('address', e.target.value, { shouldDirty: true });
  };

  const handleWarehouseToggle = (checked: boolean) => {
    setValue('useWarehouse', checked, { shouldDirty: true });
  };

  const handleNegativeStockToggle = (checked: boolean) => {
    setValue('allowNegativeStock', checked, { shouldDirty: true });
  };

  const handleAcceptOrdersToggle = (checked: boolean) => {
    setValue('acceptOrders', checked, { shouldDirty: true });
  };

  const handleWorkingDayToggle = (day: string, checked: boolean) => {
    setValue(`${day}IsWorking` as any, checked, { shouldDirty: true });
  };

  const handleImagesChange = (images: string[]) => {
    setValue('images', images, { shouldDirty: true });
  };

  const validateTime = (time: string) => {
    if (!time) return t.requiredField;
    
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return t.invalidTime;
    }
    
    return true;
  };

  const onSubmitHandler = handleSubmit(async (data) => {
    setIsUploading(true);
    try {
      const formatTimeForApi = (time: string) => {
        if (!time) return null;
        
        const [hours, minutes] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        return date.toISOString();
      };

      await onSubmit({
        ...data,
        latitude: coordinates.lat.toString(),
        longitude: coordinates.lng.toString(),
        networkId: data.networkId,
        useWarehouse: data.useWarehouse,
        allowNegativeStock: data.allowNegativeStock,
        acceptOrders: data.acceptOrders,
        images: data.images || [],
        shiftCloseTime: formatTimeForApi(data.shiftCloseTime),
        mondayOpen: data.mondayIsWorking ? formatTimeForApi(data.mondayOpen) : null,
        mondayClose: data.mondayIsWorking ? formatTimeForApi(data.mondayClose) : null,
        tuesdayOpen: data.tuesdayIsWorking ? formatTimeForApi(data.tuesdayOpen) : null,
        tuesdayClose: data.tuesdayIsWorking ? formatTimeForApi(data.tuesdayClose) : null,
        wednesdayOpen: data.wednesdayIsWorking ? formatTimeForApi(data.wednesdayOpen) : null,
        wednesdayClose: data.wednesdayIsWorking ? formatTimeForApi(data.wednesdayClose) : null,
        thursdayOpen: data.thursdayIsWorking ? formatTimeForApi(data.thursdayOpen) : null,
        thursdayClose: data.thursdayIsWorking ? formatTimeForApi(data.thursdayClose) : null,
        fridayOpen: data.fridayIsWorking ? formatTimeForApi(data.fridayOpen) : null,
        fridayClose: data.fridayIsWorking ? formatTimeForApi(data.fridayClose) : null,
        saturdayOpen: data.saturdayIsWorking ? formatTimeForApi(data.saturdayOpen) : null,
        saturdayClose: data.saturdayIsWorking ? formatTimeForApi(data.saturdayClose) : null,
        sundayOpen: data.sundayIsWorking ? formatTimeForApi(data.sundayOpen) : null,
        sundayClose: data.sundayIsWorking ? formatTimeForApi(data.sundayClose) : null,
      });
    } catch (error) {
      console.error('Error updating restaurant:', error);
    } finally {
      setIsUploading(false);
    }
  });

  const DaySchedule = ({ 
    day, 
    label, 
    isWorking
  }: { 
    day: string;
    label: string;
    isWorking: boolean;
  }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        <Switch
          checked={isWorking}
          onCheckedChange={(checked) => handleWorkingDayToggle(day, checked)}
        />
        <Label className={isWorking ? "font-medium" : "text-muted-foreground"}>
          {label}
        </Label>
      </div>
      {isWorking ? (
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Input
              type="time"
              {...register(`${day}Open` as any, {
                validate: isWorking ? validateTime : undefined
              })}
              disabled={!isWorking}
              className="w-24"
            />
          </div>
          <span>-</span>
          <div className="flex items-center space-x-1">
            <Input
              type="time"
              {...register(`${day}Close` as any, {
                validate: isWorking ? validateTime : undefined
              })}
              disabled={!isWorking}
              className="w-24"
            />
          </div>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">{t.dayOff}</span>
      )}
    </div>
  );

  return (
    <form onSubmit={onSubmitHandler} className="space-y-6">
      {/* Сетевой выбор - вынесен отдельно */}
      <div>
        <Label htmlFor="networkId" className="mb-2">{t.selectNetwork}</Label>
        {isLoadingNetworks ? (
          <div className="h-10 w-full rounded-md border bg-muted animate-pulse" />
        ) : (
          <Select
            onValueChange={(value) => setValue('networkId', value, { shouldDirty: true })}
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
          <p className="text-red-500 text-sm mt-1">{errors.networkId.message}</p>
        )}
      </div>

      {/* Основная информация */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-medium">{t.basicInfo}</h3>
        
        <div>
          <Label htmlFor="title">{t.title}</Label>
          <Input
            id="title"
            {...register('title', { required: t.requiredField })}
            className="mt-1"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">{t.address}</Label>
          <div className="flex space-x-2">
            <Input
              id="address"
              {...register('address', { required: t.requiredField })}
              onChange={handleAddressInput}
              className="flex-1"
              placeholder="Введите адрес"
            />
       
          </div>
          {isGeocoding && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>{t.geocoding}</span>
            </div>
          )}
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
        </div>

        <div>
          <Label htmlFor="description">{t.description}</Label>
          <Textarea
            id="description"
            {...register('description')}
            rows={3}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="legalInfo">{t.legalInfo}</Label>
          <Textarea
            id="legalInfo"
            {...register('legalInfo')}
            rows={3}
            className="mt-1"
          />
        </div>

        {/* Компонент загрузки изображений */}
        <div>
          <Label>{t.images}</Label>
          <div className="mt-2">
            <ImageUploader
              value={imagesValue}
              onChange={handleImagesChange}
              maxFiles={10}
              disabled={isUploading}
              language={language}
            />
          </div>
        </div>
      </div>

      {/* Настройки */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-medium">{t.settings}</h3>
        
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="useWarehouse" className="text-base">
              {t.useWarehouse}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t.useWarehouseDescription}
            </p>
          </div>
          <Switch
            id="useWarehouse"
            checked={useWarehouseValue}
            onCheckedChange={handleWarehouseToggle}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="allowNegativeStock" className="text-base">
              {t.allowNegativeStock}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t.allowNegativeStockDescription}
            </p>
          </div>
          <Switch
            id="allowNegativeStock"
            checked={allowNegativeStockValue}
            onCheckedChange={handleNegativeStockToggle}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="acceptOrders" className="text-base">
              {t.acceptOrders}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t.acceptOrdersDescription}
            </p>
          </div>
          <Switch
            id="acceptOrders"
            checked={acceptOrdersValue}
            onCheckedChange={handleAcceptOrdersToggle}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shiftCloseTime">
            {t.shiftCloseTime}
          </Label>
          <Input
            id="shiftCloseTime"
            type="time"
            {...register('shiftCloseTime', { 
              required: t.requiredField,
              validate: validateTime
            })}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            {t.timeFormat}
          </p>
          {errors.shiftCloseTime && (
            <p className="text-red-500 text-sm mt-1">{errors.shiftCloseTime.message}</p>
          )}
        </div>
      </div>

      {/* Расписание */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-medium">{t.schedule}</h3>
        <div className="space-y-3">
          <DaySchedule 
            day="monday"
            label={t.monday}
            isWorking={mondayIsWorking}
          />
          <DaySchedule 
            day="tuesday"
            label={t.tuesday}
            isWorking={tuesdayIsWorking}
          />
          <DaySchedule 
            day="wednesday"
            label={t.wednesday}
            isWorking={wednesdayIsWorking}
          />
          <DaySchedule 
            day="thursday"
            label={t.thursday}
            isWorking={thursdayIsWorking}
          />
          <DaySchedule 
            day="friday"
            label={t.friday}
            isWorking={fridayIsWorking}
          />
          <DaySchedule 
            day="saturday"
            label={t.saturday}
            isWorking={saturdayIsWorking}
          />
          <DaySchedule 
            day="sunday"
            label={t.sunday}
            isWorking={sundayIsWorking}
          />
        </div>
      </div>

      <input type="hidden" {...register('latitude', { required: true })} />
      <input type="hidden" {...register('longitude', { required: true })} />

      {/* Кнопки действий */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" type="button" onClick={onCancel}>
          {t.cancel}
        </Button>
        <Button 
          type="submit" 
          disabled={isUploading || !isDirty}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {t.saving}
            </>
          ) : (
            t.save
          )}
        </Button>
      </div>
    </form>
  );
}