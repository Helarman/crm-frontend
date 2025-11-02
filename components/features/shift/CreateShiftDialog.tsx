'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useRestaurants } from '@/lib/hooks/useRestaurant';
import { useState, useEffect } from 'react';
import { ShiftService } from '@/lib/api/shift.service';
import { useShifts } from '@/lib/hooks/useShifts';
import { toast } from 'sonner';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { useLanguageStore } from '@/lib/stores/language-store';
import { Restaurant } from '../staff/StaffTable';
import SearchableSelect from '../menu/product/SearchableSelect';
import { RestaurantDto } from '@/lib/api/order.service';

interface CreateShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RestaurantUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

// Локализованные тексты
const translations = {
  ru: {
    createTitle: 'Создать новую смену',
    restaurant: 'Ресторан',
    selectRestaurant: 'Выберите ресторан',
    searchRestaurant: 'Поиск ресторана...',
    noRestaurants: 'Рестораны не найдены',
    staff: 'Сотрудники',
    selectStaff: 'Выберите сотрудников',
    searchStaff: 'Поиск сотрудников...',
    noStaff: 'Сотрудники не найдены',
    cancel: 'Отмена',
    create: 'Создать смену',
    shiftCreated: 'Смена успешно создана',
    failedCreateShift: 'Ошибка при создании смены',
    failedLoadUsers: 'Ошибка загрузки пользователей ресторана',
    shiftInfo: 'Смена будет создана с текущим временем начала и установленным временем закрытия',
    selectedCount: 'выбрано',
  },
  ka: {
    createTitle: 'ახალი ცვლის შექმნა',
    restaurant: 'რესტორანი',
    selectRestaurant: 'აირჩიეთ რესტორანი',
    searchRestaurant: 'რესტორანის ძიება...',
    noRestaurants: 'რესტორანები ვერ მოიძებნა',
    staff: 'თანამშრომლები',
    selectStaff: 'აირჩიეთ თანამშრომლები',
    searchStaff: 'თანამშრომლების ძიება...',
    noStaff: 'თანამშრომლები ვერ მოიძებნა',
    cancel: 'გაუქმება',
    create: 'ცვლის შექმნა',
    shiftCreated: 'ცვლა წარმატებით შეიქმნა',
    failedCreateShift: 'ცვლის შექმნის შეცდომა',
    failedLoadUsers: 'რესტორანის მომხმარებლების ჩატვირთვის შეცდომა',
    shiftInfo: 'ცვლა შეიქმნება მიმდინარე დროში დაწყებით და დაყენებული დახურვის დროთი',
    selectedCount: 'არჩეული',
  }
};

export function CreateShiftDialog({ open, onOpenChange }: CreateShiftDialogProps) {
  const { language } = useLanguageStore();
  const t = translations[language]

  const { data: restaurants } = useRestaurants();
  const { mutate } = useShifts();
  const [restaurantUsers, setRestaurantUsers] = useState<RestaurantUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Преобразуем рестораны в формат для SearchableSelect
  const restaurantOptions = restaurants?.map((restaurant : RestaurantDto) => ({
    id: restaurant.id,
    label: restaurant.title
  })) || [];

  // Преобразуем пользователей в формат для SearchableSelect
  const userOptions = restaurantUsers.map(user => ({
    id: user.id,
    label: `${user.name} (${user.email})`
  }));

  // Сбрасываем состояние при закрытии диалога
  useEffect(() => {
    if (!open) {
      setSelectedRestaurantId('');
      setSelectedUsers([]);
      setRestaurantUsers([]);
    }
  }, [open]);

  // Загружаем пользователей при выборе ресторана
  useEffect(() => {
    const fetchUsers = async () => {
      if (!selectedRestaurantId) {
        setRestaurantUsers([]);
        return;
      }
      
      setIsLoadingUsers(true);
      try {
        const users = await RestaurantService.getUsers(selectedRestaurantId);
        setRestaurantUsers(users);
      } catch (error) {
        toast.error(t.failedLoadUsers);
        console.error(error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [selectedRestaurantId]);

  const handleSubmit = async () => {
    try {
      const now = new Date(); // Текущее время начала
      
      // Получаем информацию о ресторане для времени закрытия
      const restaurant = await RestaurantService.getById(selectedRestaurantId);
      let endTime: Date;

      if (restaurant.shiftCloseTime) {
        const closeTime = new Date(restaurant.shiftCloseTime);
        endTime = new Date(now);
        endTime.setHours(closeTime.getHours());
        endTime.setMinutes(closeTime.getMinutes());
        endTime.setSeconds(0);
        endTime.setMilliseconds(0);

        // Если время закрытия уже прошло сегодня, ставим на завтра
        if (endTime <= now) {
          endTime.setDate(endTime.getDate() + 1);
        }
      } else {
        // Значение по умолчанию - 23:59
        endTime = new Date(now);
        endTime.setHours(23);
        endTime.setMinutes(59);
        endTime.setSeconds(0);
        endTime.setMilliseconds(0);

        // Если уже позже 23:59, ставим на завтра
        if (endTime <= now) {
          endTime.setDate(endTime.getDate() + 1);
        }
      }

      // Создаем смену с автоматическими параметрами
      const shift = await ShiftService.createShift({
        restaurantId: selectedRestaurantId,
        startTime: now,
        endTime: endTime,
        description: 'Смена создана вручную', // Фиксированный комментарий
        status: 'STARTED' // Сразу открываем смену
      });

      // Добавляем выбранных пользователей в смену
      if (selectedUsers.length > 0) {
        await Promise.all(
          selectedUsers.map(userId => 
            ShiftService.addUserToShift(shift.id, { userId })
          )
        );
      }
      
      mutate();
      onOpenChange(false);
      toast.success(t.shiftCreated);
    } catch (error) {
      toast.error(t.failedCreateShift);
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.createTitle}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">

          {/* Выбор ресторана */}
          <div className="space-y-3">
            <Label htmlFor="restaurant" className="text-sm font-medium">
              {t.restaurant} *
            </Label>
            <SearchableSelect
              options={restaurantOptions}
              value={selectedRestaurantId ? [selectedRestaurantId] : []}
              onChange={(value) => setSelectedRestaurantId(value[0] || '')}
              placeholder={t.selectRestaurant}
              searchPlaceholder={t.searchRestaurant}
              emptyText={t.noRestaurants}
              multiple={false}
              disabled={!restaurantOptions.length}
            />
          </div>

          {/* Выбор сотрудников */}
          {selectedRestaurantId && (
            <div className="space-y-3">
              <Label htmlFor="staff" className="text-sm font-medium">
                {t.staff}
              </Label>
              <SearchableSelect
                options={userOptions}
                value={selectedUsers}
                onChange={setSelectedUsers}
                placeholder={t.selectStaff}
                searchPlaceholder={t.searchStaff}
                emptyText={isLoadingUsers ? 'Загрузка...' : t.noStaff}
                multiple={true}
                disabled={isLoadingUsers || !userOptions.length}
              />
              {selectedUsers.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t.selectedCount}: {selectedUsers.length}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!selectedRestaurantId}
          >
            {t.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}