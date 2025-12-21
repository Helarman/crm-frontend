import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, X, Plus, Check, ChevronsUpDown } from 'lucide-react';
import { CategoryService } from '@/lib/api/category.service';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import SearchableSelect from '../product/SearchableSelect';
import { ImageUploader } from '../product/ImageUploader';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  categoryId: string | null;
  language: 'ru' | 'ka';
  networkId: string;
  restaurantId?: string;
  categories: any[];
}

type FormStep = 'basic' | 'details' | 'seo';

const translations = {
  ru: {
    addCategory: 'Добавить категорию',
    editCategory: 'Редактировать категорию',
    save: 'Сохранить',
    cancel: 'Отмена',
    next: 'Далее',
    back: 'Назад',
    fields: {
      title: 'Название *',
      description: 'Описание',
      slug: 'URL-адрес (slug) *',
      metaTitle: 'Мета-заголовок',
      metaDescription: 'Мета-описание',
      metaKeywords: 'Ключевые слова',
      parent: 'Родительская категория',
      order: 'Порядок сортировки (админка)',
      clientOrder: 'Порядок сортировки (клиент)',
      image: 'Изображение',
      noParent: 'Нет (основная категория)',
      restaurants: 'Рестораны',
      selectRestaurants: 'Выберите рестораны',
      searchRestaurants: 'Поиск ресторанов...',
      noRestaurants: 'Рестораны не найдены',
      selectAtLeastOneRestaurant: 'Выберите хотя бы один ресторан',
      published: 'Опубликована',
      autoGenerateOrder: 'Сгенерировать автоматически',
    },
    steps: {
      basic: 'Основная информация',
      details: 'Дополнительные параметры',
      seo: 'SEO настройки'
    },
    errors: {
      titleRequired: 'Название обязательно',
      slugRequired: 'URL-адрес обязателен',
      restaurantsRequired: 'Выберите хотя бы один ресторан',
      invalidSlug: 'URL-адрес может содержать только латинские буквы, цифры и дефисы',
      invalidOrder: 'Порядок должен быть числом не меньше 0'
    }
  },
  ka: {
    addCategory: 'კატეგორიის დამატება',
    editCategory: 'კატეგორიის რედაქტირება',
    save: 'შენახვა',
    cancel: 'გაუქმება',
    next: 'შემდეგი',
    back: 'უკან',
    fields: {
      title: 'სათაური *',
      description: 'აღწერა',
      slug: 'URL-მისამართი (slug) *',
      metaTitle: 'მეტა-სათაური',
      metaDescription: 'მეტა-აღწერა',
      metaKeywords: 'საკვანძო სიტყვები',
      parent: 'მშობელი კატეგორია',
      order: 'დალაგების თანმიმდევრობა (ადმინი)',
      clientOrder: 'დალაგების თანმიმდევრობა (კლიენტი)',
      image: 'სურათი',
      noParent: 'არა (მთავარი კატეგორია)',
      restaurants: 'რესტორნები',
      selectRestaurants: 'აირჩიეთ რესტორნები',
      searchRestaurants: 'რესტორნების ძებნა...',
      noRestaurants: 'რესტორნები არ მოიძებნა',
      selectAtLeastOneRestaurant: 'აირჩიეთ მინიმუმ ერთი რესტორანი',
      published: 'გამოქვეყნებული',
      autoGenerateOrder: 'ავტომატურად გენერირება',
    },
    steps: {
      basic: 'ძირითადი ინფორმაცია',
      details: 'დამატებითი პარამეტრები',
      seo: 'SEO პარამეტრები'
    },
    errors: {
      titleRequired: 'სათაური სავალდებულოა',
      slugRequired: 'URL-მისამართი სავალდებულოა',
      restaurantsRequired: 'აირჩიეთ მინიმუმ ერთი რესტორანი',
      invalidSlug: 'URL-მისამართს შეიძლება ჰქონდეს მხოლოდ ლათინური ასოები, ციფრები და ტირეები',
      invalidOrder: 'რიგი უნდა იყოს რიცხვი არანაკლებ 0'
    }
  }
};

export const CategoryModal = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  categoryId,
  networkId,
  restaurantId,
  language,
  categories,
}: CategoryModalProps) => {
  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    slug: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    parentId: null as string | null,
    order: 0,
    clientOrder: 0,
    image: '',
    restaurantIds: [] as string[],
  });

  const [restaurants, setRestaurants] = useState<{ id: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestaurantsLoading, setIsRestaurantsLoading] = useState(false);
  const [availableParentCategories, setAvailableParentCategories] = useState<{ id: string; label: string }[]>([]);
  const [isAutoGenerateOrder, setIsAutoGenerateOrder] = useState(false);
  const [isAutoGenerateClientOrder, setIsAutoGenerateClientOrder] = useState(false);

  const t = translations[language];

  // Инициализация данных при открытии модалки
  useEffect(() => {
    if (isOpen) {
      loadData();
      loadRestaurants();
      prepareParentCategories();
    }
  }, [isOpen, categoryId, networkId, restaurantId, categories]);

  // Подготовка списка родительских категорий
  const prepareParentCategories = () => {
    // Исключаем текущую категорию и ее подкатегории из списка возможных родителей
    const excludeIds = categoryId ? getCategoryAndChildrenIds(categoryId, categories) : [];
    
    const options = [
      { id: "null", label: t.fields.noParent },
      ...categories
        .filter(cat => !excludeIds.includes(cat.id) && cat.networkId === networkId)
        .map(category => ({
          id: category.id,
          label: category.title
        }))
    ];
    
    setAvailableParentCategories(options);
  };

  // Рекурсивное получение ID категории и всех ее потомков
  const getCategoryAndChildrenIds = (categoryId: string, categoriesList: any[]): string[] => {
    const result: string[] = [categoryId];
    
    const findChildren = (parentId: string, list: any[]) => {
      list.forEach(cat => {
        if (cat.parentId === parentId) {
          result.push(cat.id);
          findChildren(cat.id, list);
        }
      });
    };
    
    findChildren(categoryId, categoriesList);
    return result;
  };

  // Загрузка ресторанов сети
  const loadRestaurants = async () => {
    setIsRestaurantsLoading(true);
    try {
      const restaurantsData = await RestaurantService.getAll();
      // Фильтруем рестораны по сети
      const networkRestaurants = restaurantsData.filter(
        (restaurant: any) => restaurant.networkId === networkId
      );
      setRestaurants(networkRestaurants);
      
      // Если передан конкретный ресторан, устанавливаем его по умолчанию
      if (restaurantId && !categoryId) {
        setFormData(prev => ({
          ...prev,
          restaurantIds: [restaurantId]
        }));
      }
    } catch (error) {
      console.error('Failed to load restaurants', error);
      toast.error(language === 'ru' ? 'Ошибка загрузки ресторанов' : 'რესტორნების ჩატვირთვის შეცდომა');
    } finally {
      setIsRestaurantsLoading(false);
    }
  };

  // Загрузка данных категории для редактирования
  const loadData = async () => {
    if (!categoryId) {
      resetForm();
      return;
    }
    
    setIsLoading(true);
    try {
      const category = await CategoryService.getById(categoryId);
      setFormData({
        title: category.title || '',
        description: category.description || '',
        slug: category.slug || '',
        metaTitle: category.metaTitle || '',
        metaDescription: category.metaDescription || '',
        metaKeywords: category.metaKeywords || '',
        parentId: category.parentId || null,
        order: category.order || 0,
        clientOrder: category.clientOrder || 0,
        image: category.image || '',
        restaurantIds: category.restaurantIds || category.restaurants?.map((r: any) => r.id) || [],
      });
    } catch (error) {
      console.error('Failed to load category', error);
      toast.error(language === 'ru' ? 'Ошибка загрузки категории' : 'კატეგორიის ჩატვირთვის შეცდომა');
    } finally {
      setIsLoading(false);
    }
  };

  // Сброс формы
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      slug: '',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      parentId: null,
      order: 0,
      clientOrder: 0,
      image: '',
      restaurantIds: restaurantId ? [restaurantId] : [],
    });
    setCurrentStep('basic');
    setIsAutoGenerateOrder(false);
    setIsAutoGenerateClientOrder(false);
  };

  // Обработчики изменения полей
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10) || 0;
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Генерация slug из названия
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Удаляем специальные символы
      .replace(/[\s_]+/g, '-') // Заменяем пробелы и подчеркивания на дефисы
      .replace(/^-+|-+$/g, ''); // Удаляем дефисы в начале и конце
  };

  // Автогенерация slug при изменении названия
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      title,
      // Генерируем slug только если поле slug пустое или было сгенерировано автоматически
      slug: !prev.slug || prev.slug === generateSlug(prev.title) ? generateSlug(title) : prev.slug
    }));
  };

  // Обработчик выбора родительской категории
  const handleParentChange = (values: string[]) => {
    const parentId = values[0] === 'null' ? null : values[0];
    setFormData(prev => ({ ...prev, parentId }));
  };

  // Валидация текущего шага
  const validateCurrentStep = () => {
    const errors = [];
    
    if (currentStep === 'basic') {
      if (!formData.title.trim()) {
        errors.push(t.errors.titleRequired);
      }
      if (!formData.slug.trim()) {
        errors.push(t.errors.slugRequired);
      } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
        errors.push(t.errors.invalidSlug);
      }
      if (formData.restaurantIds.length === 0) {
        errors.push(t.errors.restaurantsRequired);
      }
    }
    
    if (currentStep === 'details') {
      if (formData.order < 0) {
        errors.push(t.errors.invalidOrder);
      }
      if (formData.clientOrder < 0) {
        errors.push(t.errors.invalidOrder);
      }
    }
    
    if (errors.length > 0) {
      toast.error(errors.join('\n'));
      return false;
    }
    return true;
  };

  // Навигация по шагам
  const goToNextStep = () => {
    if (!validateCurrentStep()) return;
    
    const steps: FormStep[] = ['basic', 'details', 'seo'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goToPrevStep = () => {
    const steps: FormStep[] = ['basic', 'details', 'seo'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // Автоматическая генерация order
  const handleAutoGenerateOrder = () => {
    if (!categoryId) {
      // Для новой категории - просто сбросить на 0, сервер сам вычислит
      setFormData(prev => ({ ...prev, order: 0 }));
    }
    setIsAutoGenerateOrder(true);
  };

  // Автоматическая генерация clientOrder
  const handleAutoGenerateClientOrder = () => {
    if (!categoryId) {
      // Для новой категории - просто сбросить на 0, сервер сам вычислит
      setFormData(prev => ({ ...prev, clientOrder: 0 }));
    }
    setIsAutoGenerateClientOrder(true);
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateCurrentStep()) return;

  setIsLoading(true);
  try {
    const categoryData = {
      ...formData,
      // Преобразуем 'null' строку в null
      parentId: formData.parentId === 'null' ? null : formData.parentId,
      restaurantIds: formData.restaurantIds,
      networkId,
      // Если выбрана автоматическая генерация, передаем undefined
      order: isAutoGenerateOrder ? undefined : formData.order,
      clientOrder: isAutoGenerateClientOrder ? undefined : formData.clientOrder,
    };

    if (categoryId) {
      await CategoryService.update(categoryId, categoryData);
      toast.success(language === 'ru' ? 'Категория обновлена' : 'კატეგორია განახლებულია');
    } else {
      await CategoryService.create(categoryData);
      toast.success(language === 'ru' ? 'Категория создана' : 'კატეგორია შექმნილია');
    }

    onSubmitSuccess();
    onClose();
  } catch (error: any) {
    console.error('Error saving category:', error);
    
    // Более конкретные сообщения об ошибках
    if (error.response?.status === 409) {
      toast.error(language === 'ru' 
        ? 'Категория с таким URL-адресом уже существует' 
        : 'კატეგორია ამ URL-მისამართით უკვე არსებობს');
    } else if (error.response?.status === 400) {
      toast.error(language === 'ru' 
        ? 'Неверные данные категории' 
        : 'კატეგორიის არასწორი მონაცემები');
    } else if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error(language === 'ru' ? 'Ошибка сохранения' : 'შენახვის შეცდომა');
    }
  } finally {
    setIsLoading(false);
  }
};

  // Рендер содержимого шага
  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm">
                {t.fields.title}
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleTitleChange}
                required
                className="text-sm"
                placeholder={language === 'ru' ? 'Например: Пицца' : 'მაგ: პიცა'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-sm">
                {t.fields.slug}
              </Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                required
                className="text-sm"
                placeholder={language === 'ru' ? 'pizza' : 'pizza'}
              />
              <p className="text-xs text-muted-foreground">
                {language === 'ru' 
                  ? 'Только латинские буквы, цифры и дефисы. Пример: pizza, drinks, desserts'
                  : 'მხოლოდ ლათინური ასოები, ციფრები და ტირეები. მაგალითად: pizza, drinks, desserts'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">
                {t.fields.description}
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="text-sm min-h-[80px] resize-none"
                placeholder={language === 'ru' ? 'Краткое описание категории' : 'კატეგორიის მოკლე აღწერა'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentId" className="text-sm">
                {t.fields.parent}
              </Label>
              {isLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <SearchableSelect
                  options={availableParentCategories}
                  value={formData.parentId ? [formData.parentId] : ['null']}
                  onChange={handleParentChange}
                  placeholder={t.fields.noParent}
                  searchPlaceholder={t.fields.parent}
                  emptyText={language === 'ru' ? 'Категории не найдены' : 'კატეგორიები ვერ მოიძებნა'}
                  multiple={false}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm">
                {t.fields.restaurants} *
              </Label>
              {isRestaurantsLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <SearchableSelect
                  options={restaurants.map(r => ({ id: r.id, label: r.title }))}
                  value={formData.restaurantIds}
                  onChange={(values) => setFormData(prev => ({ ...prev, restaurantIds: values }))}
                  placeholder={t.fields.selectRestaurants}
                  searchPlaceholder={t.fields.searchRestaurants}
                  emptyText={t.fields.noRestaurants}
                />
              )}
              <p className="text-xs text-muted-foreground">
                {t.fields.selectAtLeastOneRestaurant}
              </p>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order" className="text-sm">
                  {t.fields.order}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="order"
                    name="order"
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={handleNumberInputChange}
                    className="text-sm"
                    disabled={isAutoGenerateOrder}
                  />
                  {!isAutoGenerateOrder && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAutoGenerateOrder}
                      className="whitespace-nowrap"
                    >
                      {t.fields.autoGenerateOrder}
                    </Button>
                  )}
                </div>
                {isAutoGenerateOrder && (
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' 
                      ? 'Порядок будет автоматически установлен сервером'
                      : 'რიგი ავტომატურად დაყენდება სერვერის მიერ'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientOrder" className="text-sm">
                  {t.fields.clientOrder}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="clientOrder"
                    name="clientOrder"
                    type="number"
                    min="0"
                    value={formData.clientOrder}
                    onChange={handleNumberInputChange}
                    className="text-sm"
                    disabled={isAutoGenerateClientOrder}
                  />
                  {!isAutoGenerateClientOrder && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAutoGenerateClientOrder}
                      className="whitespace-nowrap"
                    >
                      {t.fields.autoGenerateOrder}
                    </Button>
                  )}
                </div>
                {isAutoGenerateClientOrder && (
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' 
                      ? 'Порядок для клиентов будет автоматически установлен сервером'
                      : 'კლიენტებისთვის რიგი ავტომატურად დაყენდება სერვერის მიერ'}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-sm">
                {t.fields.image}
              </Label>
              <Input
                id="image"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                className="text-sm"
                placeholder={language === 'ru' ? 'URL изображения' : 'სურათის URL'}
              />
            </div>

            {formData.image && (
              <div className="space-y-2 pt-2">
                <Label className="text-sm">
                  {language === 'ru' ? 'Предпросмотр изображения' : 'სურათის წინასწარი ნახვა'}
                </Label>
                <div className="relative h-48 w-full overflow-hidden rounded-lg border">
                  <img 
                    src={formData.image} 
                    alt={formData.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'seo':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle" className="text-sm">
                {t.fields.metaTitle}
              </Label>
              <Input
                id="metaTitle"
                name="metaTitle"
                value={formData.metaTitle}
                onChange={handleInputChange}
                className="text-sm"
                placeholder={language === 'ru' ? 'Мета-заголовок для SEO' : 'SEO-სთვის მეტა-სათაური'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription" className="text-sm">
                {t.fields.metaDescription}
              </Label>
              <Textarea
                id="metaDescription"
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleInputChange}
                className="text-sm min-h-[80px] resize-none"
                placeholder={language === 'ru' 
                  ? 'Мета-описание для поисковых систем (до 160 символов)' 
                  : 'ძებნის სისტემებისთვის მეტა-აღწერა (160 სიმბოლომდე)'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaKeywords" className="text-sm">
                {t.fields.metaKeywords}
              </Label>
              <Input
                id="metaKeywords"
                name="metaKeywords"
                value={formData.metaKeywords}
                onChange={handleInputChange}
                className="text-sm"
                placeholder={language === 'ru' ? 'пицца, итальянская кухня, доставка' : 'pizza, italian, delivery'}
              />
              <p className="text-xs text-muted-foreground">
                {language === 'ru' 
                  ? 'Ключевые слова через запятую'
                  : 'საკვანძო სიტყვები მძიმით გამოყოფილი'}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Получение заголовка текущего шага
  const getStepTitle = () => {
    switch (currentStep) {
      case 'basic': return t.steps.basic;
      case 'details': return t.steps.details;
      case 'seo': return t.steps.seo;
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
      }
      onClose();
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {categoryId ? t.editCategory : t.addCategory}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">{getStepTitle()}</div>
        </DialogHeader>
        
        {isLoading && categoryId ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderStepContent()}

            <DialogFooter>
              <div className="flex justify-between w-full">
                {currentStep !== 'basic' ? (
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={goToPrevStep}
                    disabled={isLoading}
                    className="text-sm"
                  >
                    {t.back}
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => {
                      resetForm();
                      onClose();
                    }}
                    disabled={isLoading}
                    className="text-sm"
                  >
                    {t.cancel}
                  </Button>
                )}
                
                {currentStep !== 'seo' ? (
                  <Button 
                    type="button"
                    onClick={goToNextStep}
                    disabled={isLoading}
                    className="text-sm"
                  >
                    {t.next}
                  </Button>
                ) : (
                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="text-sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {language === 'ru' ? 'Сохранение...' : 'შენახვა...'}
                      </>
                    ) : (
                      t.save
                    )}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};