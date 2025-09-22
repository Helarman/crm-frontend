import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Language } from '@/lib/stores/language-store';

interface DictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  itemId: number | null;
  formData: {
    name: string;
    isActive: boolean;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  language: string;
  type: 'write_off' | 'receipt' | 'movement';
}

const translations = {
  addTitle: {
    write_off: {
      ru: 'Добавить причину списания',
      ka: 'ჩამოწერის მიზეზის დამატება',
    },
    receipt: {
      ru: 'Добавить причину прихода',
      ka: 'მიღების მიზეზის დამატება',
    },
    movement: {
      ru: 'Добавить причину перемещения',
      ka: 'გადაადგილების მიზეზის დამატება',
    },
  },
  editTitle: {
    write_off: {
      ru: 'Редактировать причину списания',
      ka: 'ჩამოწერის მიზეზის რედაქტირება',
    },
    receipt: {
      ru: 'Редактировать причину прихода',
      ka: 'მიღების მიზეზის რედაქტირება',
    },
    movement: {
      ru: 'Редактировать причину перемещения',
      ka: 'გადაადგილების მიზეზის რედაქტირება',
    },
  },
  name: {
    ru: 'Название',
    ka: 'სახელი',
  },
  isActive: {
    ru: 'Активен',
    ka: 'აქტიური',
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

export const DictionaryModal = ({
  isOpen,
  onClose,
  onSubmit,
  itemId,
  formData,
  onInputChange,
  language,
  type,
}: DictionaryModalProps) => {
  const title = itemId 
    ? translations.editTitle[type][language as Language] 
    : translations.addTitle[type][language as Language];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className='mb-2' htmlFor="name">{translations.name[language as Language]}</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              placeholder={translations.name[language as Language]}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              {translations.cancel[language as Language]}
            </Button>
            <Button onClick={onSubmit}>
              {translations.save[language as Language]}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};