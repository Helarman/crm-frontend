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
import SearchableSelect from '@/components/features/menu/product/SearchableSelect';
import { Additive, AdditiveService } from "@/lib/api/additive.service";
import { WarehouseService } from "@/lib/api/warehouse.service";
import { Language } from '@/lib/stores/language-store';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AdditiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  additiveId: string | null | undefined;
  formData: Additive;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  language: string;
  selectedNetworkId?: string | null;
}

const translations = {
  addAdditive: {
    ru: 'Добавить модификатор',
    ka: 'მოდიფიკატორის დამატება',
  },
  ingredientQuantity: {
    ru: 'Количество ингредиента',
    ka: 'ინგრედიენტის რაოდენობა',
  },
  editAdditive: {
    ru: 'Редактировать модификатор',
    ka: 'დანამატის რედაქტირება',
  },
  title: {
    ru: 'Название',
    ka: 'სათაური',
  },
  price: {
    ru: 'Цена',
    ka: 'ფასი',
  },
  network: {
    ru: 'Сеть',
    ka: 'ქსელი',
  },
  currentNetwork: {
    ru: 'Текущая сеть',
    ka: 'მიმდინარე ქსელი',
  },
  inventoryItem: {
    ru: 'Ингредиент',
    ka: 'ინგრედიენტი',
  },
  selectInventoryItem: {
    ru: 'Выберите складскую позицию',
    ka: 'აირჩიეთ საწყობის პოზიცია',
  },
  searchInventoryItem: {
    ru: 'Поиск позиций...',
    ka: 'პოზიციების ძებნა...',
  },
  noInventoryItems: {
    ru: 'Позиции не найдены',
    ka: 'პოზიციები ვერ მოიძებნა',
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

export const AdditiveModal = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  additiveId,
  formData,
  onInputChange,
  language,
  selectedNetworkId,
}: AdditiveModalProps) => {
  const [inventoryItems, setInventoryItems] = useState<{ id: string; name: string; unit: string }[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Загружаем складские позиции при открытии модалки
  useEffect(() => {
    if (isOpen && selectedNetworkId) {
      loadInventoryItems();
    }
  }, [isOpen, selectedNetworkId]);

  // Автоматически устанавливаем networkId при открытии модалки для создания
  useEffect(() => {
    if (isOpen && !additiveId && selectedNetworkId) {
      if (!formData.networkId) {
        const event = {
          target: {
            name: 'networkId',
            value: selectedNetworkId
          }
        } as React.ChangeEvent<HTMLInputElement>;
        onInputChange(event);
      }
    }
  }, [isOpen, additiveId, selectedNetworkId, formData.networkId, onInputChange]);

  const loadInventoryItems = async () => {
    if (!selectedNetworkId) return;

    setIsInventoryLoading(true);
    try {
      const items = await WarehouseService.getInventoryItemsByNetwork(selectedNetworkId);

      const formattedItems = items.map((item: any) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        categoryId: item.categoryId,
      }));

      setInventoryItems(formattedItems);
    } catch (error) {
      console.error('Failed to load inventory items', error);
      setInventoryItems([]);
    } finally {
      setIsInventoryLoading(false);
    }
  };

  const handleInventoryItemChange = (selectedIds: string[]) => {
    const selectedId = selectedIds[0] || '';
    const event = {
      target: {
        name: 'inventoryItemId',
        value: selectedId
      }
    } as React.ChangeEvent<HTMLInputElement>;
    onInputChange(event);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Подготавливаем данные для отправки с ingredientQuantity
      const dataToSend = {
        title: formData.title,
        price: formData.price,
        ingredientQuantity: Number(formData.ingredientQuantity) || 0, // Добавляем ingredientQuantity
        inventoryItemId: formData.inventoryItemId || undefined,
        ...(!additiveId && selectedNetworkId && { networkId: selectedNetworkId }),
      };

      if (additiveId) {
        await AdditiveService.update(additiveId, dataToSend);
      } else {
        await AdditiveService.create(dataToSend);
      }
      
      toast.success(
        additiveId 
          ? language === 'ru' ? 'Модификатор обновлен' : 'მოდიფიკატორი განახლდა'
          : language === 'ru' ? 'Модификатор создан' : 'მოდიფიკატორი შეიქმნა'
      );
      
      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving additive:', error);
      toast.error(
        language === 'ru' ? 'Ошибка сохранения модификатора' : 'მოდიფიკატორის შენახვის შეცდომა'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChangeLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Для числовых полей конвертируем значение
    if (name === 'price' || name === 'ingredientQuantity') {
      const event = {
        target: {
          name,
          value: value === '' ? '0' : value
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onInputChange(event);
    } else {
      onInputChange(e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {additiveId ?
              translations.editAdditive[language as Language] :
              translations.addAdditive[language as Language]}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="gap-4 flex flex-col py-4">

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                {translations.title[language as Language]}
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChangeLocal}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                {translations.price[language as Language]}
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChangeLocal}
                className="col-span-3"
                required
              />
            </div>

            {/* Выбор складской позиции */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="inventoryItemId" className="text-left">
                {translations.inventoryItem[language as Language]}
              </Label>
              <div className="col-span-3">
                <SearchableSelect
                  options={inventoryItems.map(item => ({
                    id: item.id,
                    label: `${item.name} (${item.unit})`
                  }))}
                  value={formData.inventoryItemId ? [formData.inventoryItemId] : []}
                  onChange={handleInventoryItemChange}
                  placeholder={translations.selectInventoryItem[language as Language]}
                  searchPlaceholder={translations.searchInventoryItem[language as Language]}
                  emptyText={translations.noInventoryItems[language as Language]}
                  multiple={false}
                  disabled={isInventoryLoading}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ingredientQuantity" className="text-left">
                {translations.ingredientQuantity[language as Language]}
              </Label>
              <div className="col-span-3">
                <Input
                  id="ingredientQuantity"
                  name="ingredientQuantity"
                  type="number"
                  min="0"
                  step="0.001"
                  value={formData.ingredientQuantity}
                  onChange={handleInputChangeLocal}
                  className="col-span-3"
                  required
                  placeholder={language === 'ru' ? 'Например: 0.1' : 'მაგ: 0.1'}
                />
              </div>
            </div>
          </div>
          <DialogFooter className='flex'>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              {translations.cancel[language as Language]}
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? language === 'ru' ? 'Сохранение...' : 'იწერება...'
                : translations.save[language as Language]
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};