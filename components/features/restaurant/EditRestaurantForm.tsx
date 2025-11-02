import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguageStore } from '@/lib/stores/language-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
  useWarehouse: boolean;
  shiftCloseTime: string;
  // Часы работы
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
  const [networks, setNetworks] = useState<any[]>([]);
  const [isLoadingNetworks, setIsLoadingNetworks] = useState(true);
  const { language } = useLanguageStore();

  const { register, handleSubmit, setValue, formState: { errors, isDirty }, watch } = useForm<RestaurantFormValues>({
    defaultValues: {
      ...initialValues,
      useWarehouse: initialValues.useWarehouse || false,
      shiftCloseTime: initialValues.shiftCloseTime || '23:59',
      // Часы работы по умолчанию
      mondayOpen: initialValues.mondayOpen || '09:00',
      mondayClose: initialValues.mondayClose || '18:00',
      mondayIsWorking: initialValues.mondayIsWorking ?? true,
      tuesdayOpen: initialValues.tuesdayOpen || '09:00',
      tuesdayClose: initialValues.tuesdayClose || '18:00',
      tuesdayIsWorking: initialValues.tuesdayIsWorking ?? true,
      wednesdayOpen: initialValues.wednesdayOpen || '09:00',
      wednesdayClose: initialValues.wednesdayClose || '18:00',
      wednesdayIsWorking: initialValues.wednesdayIsWorking ?? true,
      thursdayOpen: initialValues.thursdayOpen || '09:00',
      thursdayClose: initialValues.thursdayClose || '18:00',
      thursdayIsWorking: initialValues.thursdayIsWorking ?? true,
      fridayOpen: initialValues.fridayOpen || '09:00',
      fridayClose: initialValues.fridayClose || '18:00',
      fridayIsWorking: initialValues.fridayIsWorking ?? true,
      saturdayOpen: initialValues.saturdayOpen || '10:00',
      saturdayClose: initialValues.saturdayClose || '16:00',
      saturdayIsWorking: initialValues.saturdayIsWorking ?? false,
      sundayOpen: initialValues.sundayOpen || '10:00',
      sundayClose: initialValues.sundayClose || '16:00',
      sundayIsWorking: initialValues.sundayIsWorking ?? false,
    }
  });

  const translations = {
    ru: {
      title: 'Название *',
      address: 'Адрес *',
      description: 'Описание',
      legalInfo: 'Юридическая информация',
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
      schedule: 'Расписание работы'
    },
    en: {
      title: 'Name *',
      address: 'Address *',
      description: 'Description',
      legalInfo: 'Legal Information',
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
      schedule: 'Working Schedule'
    },
    ka: {
      title: 'სახელი *',
      address: 'მისამართი *',
      description: 'აღწერა',
      legalInfo: 'იურიდიული ინფორმაცია',
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
      schedule: 'სამუშაო გრაფიკი'
    }
  };

  const t = translations[language];

  // Следим за значениями
  const useWarehouseValue = watch('useWarehouse');
  const shiftCloseTimeValue = watch('shiftCloseTime');

  // Следим за рабочими днями
  const mondayIsWorking = watch('mondayIsWorking');
  const tuesdayIsWorking = watch('tuesdayIsWorking');
  const wednesdayIsWorking = watch('wednesdayIsWorking');
  const thursdayIsWorking = watch('thursdayIsWorking');
  const fridayIsWorking = watch('fridayIsWorking');
  const saturdayIsWorking = watch('saturdayIsWorking');
  const sundayIsWorking = watch('sundayIsWorking');

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

  const handleMapClick = (lat: number, lng: number) => {
    setCoordinates({ lat, lng });
    setValue('latitude', lat.toString(), { shouldDirty: true });
    setValue('longitude', lng.toString(), { shouldDirty: true });
  };

  const handleWarehouseToggle = (checked: boolean) => {
    setValue('useWarehouse', checked, { shouldDirty: true });
  };

  const handleWorkingDayToggle = (day: string, checked: boolean) => {
    setValue(`${day}IsWorking` as any, checked, { shouldDirty: true });
  };

  // Валидация времени
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
      // Преобразуем время в формат для API
      const formatTimeForApi = (time: string) => {
        const [hours, minutes] = time.split(':');
        return new Date(`1970-01-01T${hours.padStart(2, '0')}:${minutes}:00.000Z`).toISOString();
      };

      await onSubmit({
        ...data,
        latitude: coordinates?.lat.toString(),
        longitude: coordinates?.lng.toString(),
        networkId: data.networkId,
        useWarehouse: data.useWarehouse,
        shiftCloseTime: formatTimeForApi(data.shiftCloseTime),
        // Преобразуем время работы
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

  // Компонент для дня недели
  const DaySchedule = ({ 
    day, 
    label, 
    isWorking, 
    openTime, 
    closeTime 
  }: { 
    day: string;
    label: string;
    isWorking: boolean;
    openTime: string;
    closeTime: string;
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
              {...register(`${day}Open` as any)}
              disabled={!isWorking}
              className="w-24"
            />
          </div>
          <span>-</span>
          <div className="flex items-center space-x-1">
            <Input
              type="time"
              {...register(`${day}Close` as any)}
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
      {/* Network Selection */}
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
          <p className="text-red-500 text-sm">{errors.networkId.message}</p>
        )}
      </div>

      {/* Основная информация */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t.basicInfo}</h3>
        
        <div>
          <Label htmlFor="title">{t.title}</Label>
          <Input
            id="title"
            {...register('title', { required: t.requiredField })}
          />
          {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
        </div>

        <div>
          <Label htmlFor="address">{t.address}</Label>
          <Input
            id="address"
            {...register('address', { required: t.requiredField })}
          />
          {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
        </div>

        <div>
          <Label htmlFor="description">{t.description}</Label>
          <Textarea
            id="description"
            {...register('description')}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="legalInfo">{t.legalInfo}</Label>
          <Textarea
            id="legalInfo"
            {...register('legalInfo')}
            rows={3}
          />
        </div>
      </div>

      {/* Настройки */}
      <div className="space-y-4">
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
            <p className="text-red-500 text-sm">{errors.shiftCloseTime.message}</p>
          )}
        </div>
      </div>

      {/* Часы работы */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t.schedule}</h3>
        <div className="space-y-3">
          <DaySchedule 
            day="monday"
            label={t.monday}
            isWorking={mondayIsWorking}
            openTime={watch('mondayOpen')}
            closeTime={watch('mondayClose')}
          />
          <DaySchedule 
            day="tuesday"
            label={t.tuesday}
            isWorking={tuesdayIsWorking}
            openTime={watch('tuesdayOpen')}
            closeTime={watch('tuesdayClose')}
          />
          <DaySchedule 
            day="wednesday"
            label={t.wednesday}
            isWorking={wednesdayIsWorking}
            openTime={watch('wednesdayOpen')}
            closeTime={watch('wednesdayClose')}
          />
          <DaySchedule 
            day="thursday"
            label={t.thursday}
            isWorking={thursdayIsWorking}
            openTime={watch('thursdayOpen')}
            closeTime={watch('thursdayClose')}
          />
          <DaySchedule 
            day="friday"
            label={t.friday}
            isWorking={fridayIsWorking}
            openTime={watch('fridayOpen')}
            closeTime={watch('fridayClose')}
          />
          <DaySchedule 
            day="saturday"
            label={t.saturday}
            isWorking={saturdayIsWorking}
            openTime={watch('saturdayOpen')}
            closeTime={watch('saturdayClose')}
          />
          <DaySchedule 
            day="sunday"
            label={t.sunday}
            isWorking={sundayIsWorking}
            openTime={watch('sundayOpen')}
            closeTime={watch('sundayClose')}
          />
        </div>
      </div>

      {/* Карта */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t.location}</h3>
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

      <div className="flex justify-end space-x-2 pt-4">
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