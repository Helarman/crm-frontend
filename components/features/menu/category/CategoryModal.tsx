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
import SearchableSelect from '../product/SearchableSelect';
import { toast } from 'sonner';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  categoryId: string | null | undefined;
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string | string[]) => void;
  language: string;
  categories: any[];
  restaurants: any[];
  // Убрали selectedRestaurant из пропсов
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
    },
    restaurants: {
      ru: 'Рестораны',
      ka: 'რესტორანები',
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
  restaurants,
}: CategoryModalProps) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация: минимум 1 ресторан должен быть выбран
    if (!formData.restaurantIds || formData.restaurantIds.length === 0) {
      toast.warning(translations.fields.selectAtLeastOneRestaurant[language as Language]);
      return;
    }

    try {
      const submitData = {
        ...formData,
        // restaurantIds берется напрямую из formData - независимо от фильтра
        restaurantIds: formData.restaurantIds
      };

      if (categoryId) {
        await CategoryService.update(categoryId, submitData);
      } else {
        await CategoryService.create(submitData);
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

  const restaurantOptions = restaurants.map(restaurant => ({
    id: restaurant.id,
    label: restaurant.title
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto max-w-2xl">
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

            <div className="grid grid-cols-12 items-start gap-2">
              <Label htmlFor="slug" className="col-span-3 text-left">
                {translations.fields.slug[language as Language]}
              </Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={onInputChange}
                className="col-span-9"
                required
              />
            </div>

            <div className="grid grid-cols-12 items-start gap-2">
              <Label htmlFor="description" className="col-span-3 text-left">
                {translations.fields.description[language as Language]}
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={onInputChange}
                className="col-span-9"
                rows={3}
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

            {/* Рестораны - ОБЯЗАТЕЛЬНОЕ поле */}
            {restaurants.length > 0 && (
              <div className="grid grid-cols-12 items-start gap-2">
                <Label className="col-span-3 text-left">
                  {translations.fields.restaurants[language as Language]} *
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