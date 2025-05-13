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
import { WorkshopService, WorkshopResponse, WorkshopDto } from "@/lib/api/workshop.service";
import { Language } from '@/lib/stores/language-store';

interface WorkshopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  workshopId: string | null | undefined;
  formData: WorkshopDto;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  language: string;
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
  name: {
    ru: 'Название',
    ka: 'სახელი',
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
  language,
}: WorkshopModalProps) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (workshopId) {
        await WorkshopService.update(workshopId, formData);
      } else {
        await WorkshopService.create(formData);
      }
      onSubmitSuccess();
    } catch (error) {
      console.error('Error saving workshop:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {workshopId ? translations.editWorkshop[language as Language] : translations.addWorkshop[language as Language]}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {translations.name[language as Language]}
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
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
            <Button type="submit">{translations.save[language as Language]}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};