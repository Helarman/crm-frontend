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
  import {Additive, AdditiveService } from "@/lib/api/additive.service"
import { Language } from '@/lib/stores/language-store';
  
  interface AdditiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmitSuccess: () => void;
    additiveId: string | null | undefined;
    formData: Additive;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    language: string;
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
  }: AdditiveModalProps) => {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (additiveId) {
          await AdditiveService.update(additiveId, formData);
        } else {
          await AdditiveService.create(formData);
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
              {additiveId ? translations.editAdditive[language as Language] : translations.addAdditive[language as Language]}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
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
              <Button type="submit">{translations.save[language as Language]}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };