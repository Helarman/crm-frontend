'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useRestaurants } from '@/lib/hooks/useRestaurant';
import { useState, useEffect } from 'react';
import { ShiftService } from '@/lib/api/shift.service';
import { useShifts } from '@/lib/hooks/useShifts';
import { toast } from 'sonner';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { Restaurant } from '../staff/StaffTable';

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
    addStaff: 'Добавить',
    loadingUsers: 'Загрузка пользователей...',
    noUsers: 'Нет доступных пользователей',
    selectStaff: 'Выберите сотрудников',
    selectedStaff: 'Выбранно',
    startTime: 'Начало смены',
    endTimeOptional: 'Конец смены',
    description: 'Описание',
    cancel: 'Отмена',
    create: 'Создать',
    shiftCreated: 'Смена успешно создана с выбранным персоналом',
    failedCreateShift: 'Ошибка при создании смены',
    failedLoadUsers: 'Ошибка загрузки пользователей ресторана',
  },
  ka: {
    createTitle: 'ახალი ცვლის შექმნა',
    restaurant: 'რესტორანი',
    selectRestaurant: 'აირჩიეთ რესტორანი',
    addStaff: 'პერსონალის',
    loadingUsers: 'მომხმარებლების ჩატვირთვა...',
    noUsers: 'მომხმარებლები არ არის ხელმისაწვდომი',
    selectStaff: 'აირჩიეთ თანამშრომლები',
    selectedStaff: 'არჩეული',
    startTime: 'ცვლის დაწყება',
    endTimeOptional: 'ცვლის დასრულება',
    description: 'აღწერა',
    cancel: 'გაუქმება',
    create: 'შექმნა',
    shiftCreated: 'ცვლა წარმატებით შეიქმნა არჩეული პერსონალით',
    failedCreateShift: 'ცვლის შექმნის შეცდომა',
    failedLoadUsers: 'რესტორანის მომხმარებლების ჩატვირთვის შეცდომა',
  }
};

export function CreateShiftDialog({ open, onOpenChange }: CreateShiftDialogProps) {
  const { language } = useLanguageStore();
  const t = translations[language]

  const { data: restaurants } = useRestaurants();
  const { mutate } = useShifts();
  const [restaurantUsers, setRestaurantUsers] = useState<RestaurantUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<RestaurantUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  const [formData, setFormData] = useState({
    restaurantId: '',
    startTime: '',
    endTime: '',
    description: '',
  });

  useEffect(() => {
    const fetchUsers = async () => {
      if (!formData.restaurantId) return;
      
      setIsLoadingUsers(true);
      try {
        const users = await RestaurantService.getUsers(formData.restaurantId);
        setRestaurantUsers(users);
      } catch (error) {
        toast.error(t.failedLoadUsers);
        console.error(error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [formData.restaurantId]);

  const handleSubmit = async () => {
    try {
      const shift = await ShiftService.createShift({
        restaurantId: formData.restaurantId,
        startTime: new Date(formData.startTime),
        endTime: formData.endTime ? new Date(formData.endTime) : undefined,
        description: formData.description,
      });

      await Promise.all(
        selectedUsers.map(user => 
          ShiftService.addUserToShift(shift.id, { userId: user.id })
      ));
      
      mutate();
      onOpenChange(false);
      setSelectedUsers([]);
      toast.success(t.shiftCreated);
    } catch (error) {
      toast.error(t.failedCreateShift);
      console.error(error);
    }
  };

  const handleUserSelect = (userId: string) => {
    const user = restaurantUsers.find(u => u.id === userId);
    if (user && !selectedUsers.some(u => u.id === userId)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(user => user.id !== userId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.createTitle}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="restaurant" className="text-right">
              {t.restaurant}
            </Label>
            <Select
              value={formData.restaurantId}
              onValueChange={(value) =>
                setFormData({ ...formData, restaurantId: value })
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t.selectRestaurant} />
              </SelectTrigger>
              <SelectContent>
                {restaurants?.map((restaurant: Restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.restaurantId && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="staff" className="text-right">
                  {t.addStaff}
                </Label>
                <Select
                  onValueChange={handleUserSelect}
                  disabled={isLoadingUsers || restaurantUsers.length === 0}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={
                      isLoadingUsers ? t.loadingUsers : 
                      restaurantUsers.length === 0 ? t.noUsers : t.selectStaff
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurantUsers
                      .filter(user => !selectedUsers.some(u => u.id === user.id))
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUsers.length > 0 && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">{t.selectedStaff}</Label>
                  <div className="col-span-3 flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <Badge 
                        key={user.id} 
                        variant="secondary"
                        className="flex items-center gap-1 py-1"
                      >
                        {user.name}
                        <button 
                          type="button"
                          onClick={() => removeSelectedUser(user.id)}
                          className="ml-1 rounded-full hover:bg-gray-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startTime" className="text-right">
              {t.startTime}
            </Label>
            <Input
              id="startTime"
              type="datetime-local"
              className="col-span-3"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endTime" className="text-right">
              {t.endTimeOptional}
            </Label>
            <Input
              id="endTime"
              type="datetime-local"
              className="col-span-3"
              value={formData.endTime}
              onChange={(e) =>
                setFormData({ ...formData, endTime: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              {t.description}
            </Label>
            <Textarea
              id="description"
              className="col-span-3"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            onOpenChange(false);
            setSelectedUsers([]);
          }}>
            {t.cancel}
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.restaurantId || !formData.startTime}
          >
            {t.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}