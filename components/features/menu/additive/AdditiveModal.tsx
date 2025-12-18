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
import { Additive, AdditiveService } from "@/lib/api/additive.service";
import { Language } from '@/lib/stores/language-store';
import { useEffect } from 'react';

interface AdditiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  additiveId: string | null | undefined;
  formData: Additive;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  language: string;
  selectedNetworkId?: string | null; // ID выбранной сети из родительского компонента
}

const translations = {
  addAdditive: {
    ru: 'Добавить модификатор',
    ka: 'მოდიფიკატორის დამატება',
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
  // Автоматически устанавливаем networkId при открытии модалки для создания
  useEffect(() => {
    if (isOpen && !additiveId && selectedNetworkId) {
      // Если создаем новый модификатор, автоматически добавляем networkId в formData
      if (!formData.networkId) {
        // Можно обновить через onInputChange или напрямую из родителя
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Подготавливаем данные для отправки
      const dataToSend = {
        title: formData.title,
        price: formData.price,
        // Для нового модификатора добавляем networkId, для существующего он уже есть
        ...(!additiveId && selectedNetworkId && { networkId: selectedNetworkId }),
      };
      
      if (additiveId) {
        await AdditiveService.update(additiveId, dataToSend);
      } else {
        await AdditiveService.create(dataToSend);
      }
      onSubmitSuccess();
    } catch (error) {
      console.error('Error saving additive:', error);
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
          <div className="grid gap-4 py-4">
            {/* Информация о сети (только для создания нового) */}
            {!additiveId && selectedNetworkId && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-muted-foreground">
                  {translations.network[language as Language]}
                </Label>
                <div className="col-span-3 p-2 bg-muted/50 rounded-md text-sm">
                  {translations.currentNetwork[language as Language]}
                  <input 
                    type="hidden" 
                    name="networkId" 
                    value={selectedNetworkId} 
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                {translations.title[language as Language]}
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={onInputChange}
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
                onChange={onInputChange}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {translations.cancel[language as Language]}
            </Button>
            <Button type="submit">
              {translations.save[language as Language]}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};