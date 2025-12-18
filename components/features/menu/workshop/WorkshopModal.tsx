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

interface WorkshopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  workshopId: string | null;
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string | string[]) => void;
  language: string;
  restaurants: any[];
}

const translations = {
  addWorkshop: {
    ru: 'Добавить цех',
    ka: 'სახელოსნოს დამატება',
  },
  editWorkshop: {
    ru: 'Редактировать цех',
    ka: 'სახელოსნოს რედაქტირება',
  },
  fields: {
    name: {
      ru: 'Название цеха',
      ka: 'სახელოსნოს სახელი',
    },
    restaurants: {
      ru: 'Рестораны',
      ka: 'რესტორანები',
    },
    users: {
      ru: 'Пользователи',
      ka: 'მომხმარებლები',
    },
    selectRestaurants: {
      ru: 'Выберите рестораны',
      ka: 'აირჩიეთ რესტორანები',
    },
    noRestaurants: {
      ru: 'Рестораны не найдены',
      ka: 'რესტორანები არ მოიძებნა',
    },
    selectAtLeastOneRestaurant: {
      ru: 'Выберите хотя бы один ресторан',
      ka: 'აირჩიეთ მინიმუმ ერთი რესტორანი',
    }
  },
  save: {
    ru: 'Сохранить',
    ka: 'შენახვა',
  },
  cancel: {
    ru: 'Отмена',
    ka: 'გაუქმება',
  },
};

export const WorkshopModal = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  workshopId,
  formData,
  onInputChange,
  onSelectChange,
  language,
  restaurants,
}: WorkshopModalProps) => {
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!formData.restaurantIds || formData.restaurantIds.length === 0) {
    toast.warning(translations.fields.selectAtLeastOneRestaurant[language as Language]);
    return;
  }

  if (!formData.name?.trim()) {
    toast.warning('Название цеха обязательно');
    return;
  }

  try {
    const submitData = {
      name: formData.name,
      restaurantIds: formData.restaurantIds,
    };

    if (workshopId) {
      await WorkshopService.update(workshopId, submitData);
    } else {
      await WorkshopService.create(submitData);
    }
    onSubmitSuccess();
  } catch (error) {
    console.error('Error saving workshop:', error);
    toast.error('Ошибка при сохранении цеха');
  }
};

  const restaurantOptions = restaurants.map(restaurant => ({
    id: restaurant.id,
    label: restaurant.title
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] min-h-[50vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {workshopId ? translations.editWorkshop[language as Language] : translations.addWorkshop[language as Language]}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Основные поля */}
            <div className="grid grid-cols-12 items-start gap-2">
              <Label htmlFor="name" className="col-span-3 text-left">
                {translations.fields.name[language as Language]}
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={onInputChange}
                className="col-span-9"
                required
              />
            </div>

            {/* Рестораны - ОБЯЗАТЕЛЬНОЕ поле */}
            {restaurants.length > 0 && (
              <div className="grid grid-cols-12 items-start gap-2">
                <Label className="col-span-3 text-left">
                  {translations.fields.restaurants[language as Language]}
                </Label>
                <div className="col-span-9">
                  <SearchableSelect
                    options={restaurantOptions}
                    value={formData.restaurantIds || []}
                    onChange={(values) => onSelectChange('restaurantIds', values)}
                    placeholder={translations.fields.selectRestaurants[language as Language]}
                    searchPlaceholder={translations.fields.restaurants[language as Language]}
                    emptyText={translations.fields.noRestaurants[language as Language]}
                    multiple={true}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {translations.fields.selectAtLeastOneRestaurant[language as Language]}
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {translations.cancel[language as Language]}
            </Button>
            <Button type="submit">{translations.save[language as Language]}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};