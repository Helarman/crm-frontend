import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem 
} from '@/components/ui/command';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  X, 
  Plus, 
  ChevronsUpDown, 
  Check, 
  Loader2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductService } from '@/lib/api/product.service';
import { AdditiveService } from '@/lib/api/additive.service';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  productId: string | null;
  formData: {
    title: string;
    description: string;
    ingredients: string;
    price: number;
    images: string[];
    categoryId: string;
  };
  setFormData: (data: {
    title: string;
    description: string;
    ingredients: string;
    price: number;
    images: string[];
    categoryId: string;
  }) => void;
  selectedAdditives: string[];
  setSelectedAdditives: React.Dispatch<React.SetStateAction<string[]>>;
  categories: { id: string; title: string }[];
  additives: { id: string; title: string; price: number }[] | null;
  language: 'ru' | 'ka';
  isLoadingAdditives?: boolean;
}

const translations = {
  editProduct: {
    ru: 'Редактировать продукт',
    ka: 'პროდუქტის რედაქტირება',
  },
  addProduct: {
    ru: 'Добавить продукт',
    ka: 'პროდუქტის დამატება',
  },
  title: {
    ru: 'Название',
    ka: 'სათაური',
  },
  description: {
    ru: 'Описание',
    ka: 'აღწერა',
  },
  ingredients: {
    ru: 'Состав',
    ka: 'შემადგენლობა',
  },
  price: {
    ru: 'Цена',
    ka: 'ფასი',
  },
  category: {
    ru: 'Категория',
    ka: 'კატეგორია',
  },
  image: {
    ru: 'Изображение',
    ka: 'სურათი',
  },
  additives: {
    ru: 'Добавки',
    ka: 'დანამატები',
  },
  save: {
    ru: 'Сохранить',
    ka: 'შენახვა',
  },
  cancel: {
    ru: 'Отмена',
    ka: 'გაუქმება',
  },
  addImage: {
    ru: 'Добавить изображение',
    ka: 'სურათის დამატება',
  },
  searchAdditives: {
    ru: 'Поиск добавок...',
    ka: 'დანამატების ძებნა...',
  },
  noAdditivesFound: {
    ru: 'Добавки не найдены',
    ka: 'დანამატები ვერ მოიძებნა',
  },
  noAdditivesAvailable: {
    ru: 'Нет доступных добавок',
    ka: 'დანამატები არ არის ხელმისაწვდომი',
  },
  loadingAdditives: {
    ru: 'Загрузка добавок...',
    ka: 'დანამატების ჩატვირთვა...',
  },
  selected: {
    ru: 'выбрано',
    ka: 'არჩეული',
  },
  validationError: {
    ru: 'Заполните все обязательные поля',
    ka: 'შეავსეთ ყველა სავალდებულო ველი',
  },
  errorTitle: {
    ru: 'Ошибка',
    ka: 'შეცდომა',
  },
  successTitle: {
    ru: 'Успешно',
    ka: 'წარმატებული',
  },
  productSaved: {
    ru: 'Продукт успешно сохранен',
    ka: 'პროდუქტი წარმატებით შეინახა',
  },
  productUpdated: {
    ru: 'Продукт успешно обновлен',
    ka: 'პროდუქტი წარმატებით განახლდა',
  },
  additivesUpdated: {
    ru: 'Добавки успешно обновлены',
    ka: 'დანამატები წარმატებით განახლდა',
  },
  invalidAdditives: {
    ru: 'Некоторые выбранные добавки не найдены',
    ka: 'არჩეული დანამატები ვერ მოიძებნა',
  },
  requiredField: {
    ru: 'Обязательное поле',
    ka: 'სავალდებულო ველი',
  },
  enterValidPrice: {
    ru: 'Введите корректную цену',
    ka: 'შეიყვანეთ სწორი ფასი',
  },
  addAtLeastOneImage: {
    ru: 'Добавьте хотя бы одно изображение',
    ka: 'დაამატეთ ერთი სურათი მაინც',
  },
  selectCategory: {
    ru: 'Выберите категорию',
    ka: 'აირჩიეთ კატეგორია',
  },
};

export const ProductModal = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  productId,
  formData,
  setFormData,
  selectedAdditives,
  setSelectedAdditives,
  categories,
  additives,
  language,
  isLoadingAdditives = false,
}: ProductModalProps) => {
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'price' ? Number(value) : value,
    });
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({
      ...formData,
      images: newImages,
    });
  };

  const addImageField = () => {
    setFormData({
      ...formData,
      images: [...formData.images, ''],
    });
  };

  const removeImageField = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      images: newImages,
    });
  };

  const toggleAdditive = (additiveId: string) => {
    setSelectedAdditives((prev: string[]) =>
      prev.includes(additiveId)
        ? prev.filter(id => id !== additiveId)
        : [...prev, additiveId]
    );
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error(`${translations.title[language]}: ${translations.requiredField[language]}`);
      return false;
    }
    if (!formData.description.trim()) {
      toast.error(`${translations.description[language]}: ${translations.requiredField[language]}`);
      return false;
    }
    if (!formData.ingredients.trim()) {
      toast.error(`${translations.ingredients[language]}: ${translations.requiredField[language]}`);
      return false;
    }
    if (isNaN(formData.price) || formData.price <= 0) {
      toast.error(translations.enterValidPrice[language]);
      return false;
    }
    if (!formData.images.some(img => img.trim())) {
      toast.error(translations.addAtLeastOneImage[language]);
      return false;
    }
    if (!formData.categoryId) {
      toast.error(translations.selectCategory[language]);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
  
    setIsSubmitting(true);
    
    try {
      // 1. Подготовка данных продукта
      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        ingredients: formData.ingredients.trim(),
        price: Number(formData.price),
        images: formData.images.filter(img => img.trim()),
        categoryId: formData.categoryId,
      };
  
      // 2. Сохранение продукта
      let savedProductId = productId;
      if (!productId) {
        const createdProduct = await ProductService.create(productData);
        savedProductId = createdProduct.id;
        toast.success(translations.productSaved[language]);
      } else {
        await ProductService.update(productId, productData);
        toast.success(translations.productUpdated[language]);
      }
      
      
      // 3. Обновление добавок (только если есть сохранённый ID продукта)
      if (savedProductId ) {
        try {
          const updatedAdditives = await AdditiveService.updateProductAdditives(
            savedProductId, 
          selectedAdditives)
          console.log('Updated additives:', updatedAdditives);
          // Обработка успешного обновления
        } catch (error) {
          console.error('Update failed:', error);
          // Обработка ошибки
        }
      }
      
      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error('Product save error:', {
        error
      });
      
      toast.error(
        (language === 'ru' 
          ? 'Ошибка сохранения продукта' 
          : 'პროდუქტის შენახვის შეცდომა')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
    
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {productId ? translations.editProduct[language] : translations.addProduct[language]}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Название */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                {translations.title[language]} *
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder={translations.title[language]}
              />
            </div>
            
            {/* Описание */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                {translations.description[language]} *
              </Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder={translations.description[language]}
              />
            </div>
            
            {/* Состав */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ingredients" className="text-right">
                {translations.ingredients[language]} *
              </Label>
              <Input
                id="ingredients"
                name="ingredients"
                value={formData.ingredients}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder={translations.ingredients[language]}
              />
            </div>
            
            {/* Цена */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                {translations.price[language]} *
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="1"
                value={formData.price}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder={translations.price[language]}
              />
            </div>
            
            {/* Категория */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoryId" className="text-right">
                {translations.category[language]} *
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({...formData, categoryId: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={translations.selectCategory[language]} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Изображения */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                {translations.image[language]} *
              </Label>
              <div className="col-span-3 space-y-2">
                {formData.images.map((image, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={image}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      placeholder={`${translations.image[language]} URL`}
                      required={index === 0}
                    />
                    {formData.images.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeImageField(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addImageField}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {translations.addImage[language]}
                </Button>
              </div>
            </div>
            
            {/* Добавки */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                {translations.additives[language]}
              </Label>
              <div className="col-span-3">
                {isLoadingAdditives ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>{translations.loadingAdditives[language]}</span>
                  </div>
                ) : additives === null ? null : additives.length > 0 ? (
                  <>
                    <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isComboboxOpen}
                          className="w-full justify-between"
                        >
                          {selectedAdditives.length > 0
                            ? `${selectedAdditives.length} ${translations.selected[language]}`
                            : translations.additives[language]}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput 
                            placeholder={translations.searchAdditives[language]} 
                          />
                          <CommandEmpty>
                            {translations.noAdditivesFound[language]}
                          </CommandEmpty>
                          <CommandGroup className="max-h-60 overflow-y-auto">
                            {additives.map((additive) => (
                              <CommandItem
                                key={additive.id}
                                value={additive.id}
                                onSelect={() => toggleAdditive(additive.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedAdditives.includes(additive.id)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {additive.title} (+{additive.price}₽)
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {selectedAdditives.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedAdditives.map(additiveId => {
                          const additive = additives.find(a => a.id === additiveId);
                          return additive ? (
                            <Badge 
                              key={additiveId} 
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {additive.title} (+{additive.price}₽)
                              <button
                                type="button"
                                onClick={() => toggleAdditive(additiveId)}
                                className="rounded-full p-0.5 hover:bg-muted"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground py-2">
                    {translations.noAdditivesAvailable[language]}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              {translations.cancel[language]}
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {translations.save[language]}
                </>
              ) : (
                translations.save[language]
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};