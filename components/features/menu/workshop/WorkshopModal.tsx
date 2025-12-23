import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WorkshopService } from "@/lib/api/workshop.service";
import { Language } from '@/lib/stores/language-store';
import SearchableSelect from '../product/SearchableSelect';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

interface WorkshopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  workshopId: string | null;
  language: string;
  networkId: string;
  restaurants: any[];
}

const translations = {
  ru: {
    addWorkshop: 'Добавить цех',
    editWorkshop: 'Редактировать цех',
    fields: {
      name: 'Название цеха',
      network: 'Сеть',
      restaurants: 'Рестораны',
      selectRestaurants: 'Выберите рестораны',
      noRestaurants: 'Рестораны не найдены',
      selectAtLeastOneRestaurant: 'Выберите хотя бы один ресторан',
      networkReadOnly: 'Сеть нельзя изменить'
    },
    save: 'Сохранить',
    cancel: 'Отмена',
    creating: 'Создание...',
    updating: 'Обновление...'
  },
  ka: {
    addWorkshop: 'სახელოსნოს დამატება',
    editWorkshop: 'სახელოსნოს რედაქტირება',
    fields: {
      name: 'სახელოსნოს სახელი',
      network: 'ქსელი',
      restaurants: 'რესტორანები',
      selectRestaurants: 'აირჩიეთ რესტორანები',
      noRestaurants: 'რესტორანები არ მოიძებნა',
      selectAtLeastOneRestaurant: 'აირჩიეთ მინიმუმ ერთი რესტორანი',
      networkReadOnly: 'ქსელის შეცვლა შეუძლებელია'
    },
    save: 'შენახვა',
    cancel: 'გაუქმება',
    creating: 'ქმნიან...',
    updating: 'განახლება...'
  }
};

export const WorkshopModal = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  workshopId,
  language,
  networkId,
  restaurants,
}: WorkshopModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    networkId: networkId,
    restaurantIds: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);

  const t = translations[language as 'ru' | 'ka'];

  // Загрузка данных цеха при редактировании
  useEffect(() => {
    if (workshopId && isOpen) {
      fetchWorkshopData();
    } else {
      resetForm();
    }
  }, [workshopId, isOpen, networkId]);

  const fetchWorkshopData = async () => {
    try {
      const workshop = await WorkshopService.findOne(workshopId!);
      setFormData({
        name: workshop.name,
        networkId: workshop.networkId || networkId,
        restaurantIds: workshop.restaurantIds || []
      });
    } catch (error) {
      console.error('Error fetching workshop:', error);
      toast.error(language === 'ru' ? 'Ошибка загрузки цеха' : 'სახელოსნოს ჩატვირთვის შეცდომა');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      networkId: networkId,
      restaurantIds: []
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast.warning(language === 'ru' ? 'Название цеха обязательно' : 'სახელოსნოს სახელი სავალდებულოა');
      return;
    }

    if (!formData.restaurantIds || formData.restaurantIds.length === 0) {
      toast.warning(t.fields.selectAtLeastOneRestaurant);
      return;
    }

    setIsLoading(true);
    try {
      const submitData = {
        name: formData.name.trim(),
        networkId: formData.networkId,
        restaurantIds: formData.restaurantIds,
      };

      if (workshopId) {
        await WorkshopService.update(workshopId, submitData);
        toast.success(language === 'ru' ? 'Цех обновлен' : 'სახელოსნო განახლდა');
      } else {
        await WorkshopService.create(submitData);
        toast.success(language === 'ru' ? 'Цех создан' : 'სახელოსნო შეიქმნა');
      }
      
      onSubmitSuccess();
    } catch (error: any) {
      console.error('Error saving workshop:', error);
      toast.error(
        language === 'ru' ? 'Ошибка при сохранении цеха' : 'სახელოსნოს შენახვის შეცდომა'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const restaurantOptions = restaurants.map(restaurant => ({
    id: restaurant.id,
    label: restaurant.title
  }));

  // Фильтруем опции по выбранным значениям (для сохранения порядка выбора)
  const selectedRestaurants = restaurantOptions.filter(option => 
    formData.restaurantIds.includes(option.id)
  );

  const unselectedRestaurants = restaurantOptions.filter(option => 
    !formData.restaurantIds.includes(option.id)
  );

  const sortedRestaurantOptions = [...selectedRestaurants, ...unselectedRestaurants];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] min-h-[50vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {workshopId ? t.editWorkshop : t.addWorkshop}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Название цеха */}
            <div className="grid grid-cols-12 items-start gap-2">
              <Label htmlFor="name" className="col-span-3 text-left">
                {t.fields.name}
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-9"
                required
                disabled={isLoading}
              />
            </div>


            {/* Рестораны сети */}
            {restaurants.length > 0 && (
              <div className="grid grid-cols-12 items-start gap-2">
                <Label className="col-span-3 text-left">
                  {t.fields.restaurants}
                </Label>
                <div className="col-span-9">
                  <SearchableSelect
                    options={sortedRestaurantOptions}
                    value={formData.restaurantIds}
                    onChange={(values) => handleSelectChange('restaurantIds', values)}
                    placeholder={t.fields.selectRestaurants}
                    searchPlaceholder={t.fields.restaurants}
                    emptyText={t.fields.noRestaurants}
                    multiple={true}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.fields.selectAtLeastOneRestaurant}
                  </p>
                </div>
              </div>
            )}

            {/* Если нет ресторанов в сети */}
            {restaurants.length === 0 && (
              <div className="grid grid-cols-12 items-start gap-2">
                <Label className="col-span-3 text-left">
                  {t.fields.restaurants}
                </Label>
                <div className="col-span-9">
                  <p className="text-sm text-muted-foreground">
                    {language === 'ru' 
                      ? 'В этой сети нет ресторанов. Сначала добавьте рестораны в сеть.' 
                      : 'ამ ქსელში რესტორანები არ არის. ჯერ დაამატეთ რესტორანები ქსელში.'}
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              {t.cancel}
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || restaurants.length === 0}
            >
              {isLoading 
                ? (workshopId ? t.updating : t.creating)
                : t.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};