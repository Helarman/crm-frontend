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
  import {CategoryService } from "@/lib/api/category.service"
import { Language } from '@/lib/stores/language-store';

  interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmitSuccess: () => void;
    categoryId: string | null | undefined;
    formData: any
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    language: string;
  }
  
  const translations = {
    addCategory: {
      ru: 'Добавить категорию',
      ka: 'კატეგორიის დამატება',
    },
    editCategory: {
      ru: 'Редактировать категорию',
      ka: 'კატეგორიის რედაქტირება',
    },
    title: {
      ru: 'Название',
      ka: 'სათაური',
    },
    description: {
      ru: 'Описание',
      ka: 'აღწერა',
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
  
  export const CategoryModal = ({
    isOpen,
    onClose,
    onSubmitSuccess,
    categoryId,
    formData,
    onInputChange,
    language,
  }: CategoryModalProps) => {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (categoryId) {
          await CategoryService.update(categoryId, formData);
        } else {
          await CategoryService.create(formData);
        }
        onSubmitSuccess();
      } catch (error) {
        console.error('Error saving category:', error);
      }
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {categoryId ? translations.editCategory[language as Language] : translations.addCategory[language as Language]}
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
                <Label htmlFor="description" className="text-right">
                  {translations.description[language as Language]}
                </Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={onInputChange}
                  className="col-span-3"
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