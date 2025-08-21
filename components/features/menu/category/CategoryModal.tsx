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
import { Textarea } from '@/components/ui/textarea';
import { CategoryService } from "@/lib/api/category.service"
import { Language } from '@/lib/stores/language-store';
import SearchableSelect  from '@/components/features/menu/product/SearchableSelect'

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  categoryId: string | null | undefined;
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  language: string;
  categories: any[];
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
  fields: {
    title: {
      ru: 'Название',
      ka: 'სათაური',
    },
    description: {
      ru: 'Описание',
      ka: 'აღწერა',
    },
    slug: {
      ru: 'URL-адрес (slug)',
      ka: 'URL-მისამართი (slug)',
    },
    metaTitle: {
      ru: 'Мета-заголовок',
      ka: 'მეტა-სათაური',
    },
    metaDescription: {
      ru: 'Мета-описание',
      ka: 'მეტა-აღწერა',
    },
    metaKeywords: {
      ru: 'Ключевые слова',
      ka: 'საკვანძო სიტყვები',
    },
    parent: {
      ru: 'Родительская категория',
      ka: 'მშობელი კატეგორია',
    },
    order: {
      ru: 'Порядок сортировки',
      ka: 'დალაგების თანმიმდევრობა',
    },
    image: {
      ru: 'Изображение',
      ka: 'სურათი',
    },
    noParent: {
      ru: 'Нет (основная категория)',
      ka: 'არა (მთავარი კატეგორია)',
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

export const CategoryModal = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  categoryId,
  formData,
  onInputChange,
  onSelectChange,
  language,
  categories,
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
  
  const parentOptions = [
    { id: "null", label: translations.fields.noParent[language as Language] },
    ...categories
      .filter(cat => !categoryId || cat.id !== categoryId)
      .map(category => ({
        id: category.id,
        label: category.title
      }))
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {categoryId ? translations.editCategory[language as Language] : translations.addCategory[language as Language]}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Основные поля */}
            <div className="grid grid-cols-12 items-start gap-2">
              <Label htmlFor="title" className="col-span-3 text-left">
                {translations.fields.title[language as Language]}
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={onInputChange}
                className="col-span-9"
                required
              />
            </div>

            {/* SEO поля */}
            <div className="grid grid-cols-12 items-start gap-2">
              <Label htmlFor="metaTitle" className="col-span-3 text-left">
                {translations.fields.metaTitle[language as Language]}
              </Label>
              <Input
                id="metaTitle"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={onInputChange}
                className="col-span-9"
              />
            </div>

            <div className="grid grid-cols-12 items-start">
              <Label htmlFor="metaDescription" className="col-span-3 text-left">
                {translations.fields.metaDescription[language as Language]}
              </Label>
              <Textarea
                id="metaDescription"
                name="metaDescription"
                value={formData.metaDescription}
                onChange={onInputChange}
                className="col-span-9"
                rows={3}
              />
            </div>

            {/* Иерархия и сортировка */}
            <div className="grid grid-cols-12 items-start gap-2">
              <Label htmlFor="parentId" className="col-span-3 text-left">
                {translations.fields.parent[language as Language]}
              </Label>
              <div className="col-span-9">
                <SearchableSelect
                  options={parentOptions}
                  value={formData.parentId ? [formData.parentId] : []}
                  onChange={(values) => onSelectChange('parentId', values[0])}
                  placeholder={translations.fields.noParent[language as Language]}
                  searchPlaceholder={translations.fields.parent[language as Language]}
                  emptyText="No categories found"
                  multiple={false}
                />
              </div>
            </div>

            <div className="grid grid-cols-12 items-start gap-2">
              <Label htmlFor="order" className="col-span-3 text-left">
                {translations.fields.order[language as Language]}
              </Label>
              <Input
                id="order"
                name="order"
                type="number"
                value={formData.order}
                onChange={onInputChange}
                className="col-span-9"
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