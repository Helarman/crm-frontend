// ... импорты остаются теми же, только добавим Expand
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, X, Plus, Check, ChevronsUpDown, ArrowLeft, ArrowRight, Expand } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductService } from '@/lib/api/product.service';
import { Additive, AdditiveService } from '@/lib/api/additive.service';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { CategoryService } from '@/lib/api/category.service';
import { WorkshopService } from '@/lib/api/workshop.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogContentWide } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { WorkshopIn } from './ProductTable';
import { ImageUploader } from './ImageUploader';
import SearchableSelect from './SearchableSelect';
import IngredientSelect from './IngredientSelect';

interface RestaurantPrice {
  restaurantId: string;
  price: number;
  isStopList: boolean;
}

interface Workshop {
  id: string;
  name: string;
}

interface ProductModalProps {
  isOpen: boolean;
  networkId: string;
  onClose: () => void;
  onSubmitSuccess: () => void;
  productId: string | null;
  language: 'ru' | 'ka';
   workshops: any[]; 
}

type FormStep = 'basic' | 'details' | 'images' | 'additives' | 'ingredients' | 'prices' | 'seo';

const translations = {
  ru: {
    addProduct: 'Добавить продукт',
    editProduct: 'Редактировать продукт',
    save: 'Сохранить',
    cancel: 'Отмена',
    next: 'Далее',
    back: 'Назад',
    expandText: 'Раскрыть',
    minimizeText: 'Свернуть',
    fields: {
      title: 'Название *',
      description: 'Описание',
      ingredients: 'Состав',
      price: 'Базовая цена *',
      category: 'Категория *',
      weight: 'Вес (г)',
      preparationTime: 'Время приготовления (мин)',
      quantity: 'Количество',
      packageQuantity: 'Кол-во в упаковке',
      workshops: 'Цехи',
      selectWorkshops: 'Выберите цехи',
      searchWorkshops: 'Поиск цехов...',
      noWorkshops: 'Цехи не найдены',
      printLabels: 'Печать лейблов',
      publishedOnWebsite: 'Опубликовать на сайте',
      publishedInApp: 'Опубликовать в приложении',
      isStopList: 'В стоп-листе',
      selectRestaurants: 'Выберите рестораны',
      searchRestaurants: 'Поиск ресторанов...',
      noRestaurants: 'Рестораны не найдены',
      selectAtLeastOneRestaurant: 'Выберите хотя бы один ресторан',
      additives: 'Выберите Модификаторы',
      searchAdditives: 'Поиск добавок...',
      noAdditives: 'Модификаторы не найдены',
      productIngredients: 'Ингредиенты продукта',
      addIngredient: 'Добавить ингредиент',
      selectIngredient: 'Выберите ингредиент',
      searchIngredients: 'Поиск ингредиентов...',
      noIngredients: 'Ингредиенты не найдены',
      pageTitle: 'Заголовок страницы',
      metaDescription: 'Мета описание',
      content: 'Контент',
    },
    steps: {
      basic: 'Основная информация',
      details: 'Дополнительные параметры',
      images: 'Изображения',
      additives: 'Модификаторы',
      ingredients: 'Ингредиенты',
      prices: 'Цены в ресторанах',
      seo: 'SEO'
    },
    errors: {
      titleRequired: 'Название продукта обязательно',
      categoryRequired: 'Выберите категорию',
      pricePositive: 'Цена должна быть больше 0',
      restaurantsRequired: 'Выберите хотя бы один ресторан',
      ingredientsInvalid: 'Укажите корректные ингредиенты'
    }
  },
  ka: {
    addProduct: 'პროდუქტის დამატება',
    editProduct: 'პროდუქტის რედაქტირება',
    save: 'შენახვა',
    cancel: 'გაუქმება',
    next: 'შემდეგი',
    back: 'უკან',
    expandText: 'გახსნა',
    minimizeText: 'დახურვა',
    fields: {
      title: 'სახელი *',
      description: 'აღწერა',
      ingredients: 'შემადგენლობა',
      price: 'საბაზისო ფასი *',
      category: 'კატეგორია *',
      weight: 'წონა (გ)',
      preparationTime: 'მომზადების დრო (წთ)',
      quantity: 'რაოდენობა',
      packageQuantity: 'რაოდენობა შეფუთვაში',
      workshops: 'სახელოსნოები',
      selectWorkshops: 'აირჩიეთ სახელოსნოები',
      searchWorkshops: 'სახელოსნოების ძებნა...',
      noWorkshops: 'სახელოსნოები ვერ მოიძებნა',
      printLabels: 'ლეიბლების დაბეჭდვა',
      publishedOnWebsite: 'საიტზე გამოქვეყნება',
      publishedInApp: 'აპლიკაციაში გამოქვეყნება',
      isStopList: 'სტოპ ლისტში',
      selectRestaurants: 'აირჩიეთ რესტორნები',
      searchRestaurants: 'რესტორნების ძებნა...',
      noRestaurants: 'რესტორნები ვერ მოიძებნა',
      selectAtLeastOneRestaurant: 'აირჩიეთ ერთი რესტორნი მაინც',
      additives: 'აირჩიეთ მოდიფიკატორები',
      searchAdditives: 'მოდიფიკატორების ძებნა...',
      noAdditives: 'მოდიფიკატორები ვერ მოიძებნა',
      productIngredients: 'პროდუქტის ინგრედიენტები',
      addIngredient: 'ინგრედიენტის დამატება',
      selectIngredient: 'აირჩიეთ ინგრედიენტი',
      searchIngredients: 'ინგრედიენტების ძებნა...',
      noIngredients: 'ინგრედიენტები ვერ მოიძებნა',
      pageTitle: 'გვერდის სათაური',
      metaDescription: 'მეტა აღწერა',
      content: 'კონტენტი',
    },
    steps: {
      basic: 'ძირითადი ინფორმაცია',
      details: 'დამატებითი პარამეტრები',
      images: 'სურათები',
      additives: 'მოდიფიკატორები',
      ingredients: 'ინგრედიენტები',
      prices: 'რესტორნებში ფასები',
      seo: 'SEO'
    },
    errors: {
      titleRequired: 'პროდუქტის სახელი სავალდებულოა',
      categoryRequired: 'აირჩიეთ კატეგორია',
      pricePositive: 'ფასი უნდა იყოს 0-ზე მეტი',
      restaurantsRequired: 'აირჩიეთ ერთი რესტორნი მაინც',
      ingredientsInvalid: 'მიუთითეთ სწორი ინგრედიენტები'
    }
  }
};

export const ProductModal = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  productId,
  language,
  networkId,
  workshops 
}: ProductModalProps) => {
  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: '',
    price: 0,
    images: [''],
    categoryId: '',
    weight: undefined as number | undefined,
    preparationTime: undefined as number | undefined,
    packageQuantity: undefined as number | undefined,
    quantity: 0,
    printLabels: false,
    publishedOnWebsite: false,
    publishedInApp: false,
    isStopList: false,
    pageTitle: '',
    metaDescription: '',
    content: '',
    
  });

  const [selectedAdditives, setSelectedAdditives] = useState<string[]>([]);
  const [additives, setAdditives] = useState<{ id: string; title: string; price: number }[]>([]);
  const [restaurants, setRestaurants] = useState<{ id: string; title: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; title: string }[]>([]);
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);
  const [restaurantPrices, setRestaurantPrices] = useState<RestaurantPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdditivesLoading, setIsAdditivesLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isRestaurantsLoading, setIsRestaurantsLoading] = useState(false);
  const [isWorkshopsLoading, setIsWorkshopsLoading] = useState(false);
  const [selectedWorkshops, setSelectedWorkshops] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<{inventoryItemId: string, quantity: number}[]>([]);
  const [inventoryItems, setInventoryItems] = useState<{id: string, name: string, unit: string}[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  
  // Состояния для расширяемых textarea
  const [expandedTextarea, setExpandedTextarea] = useState<string | null>(null);
  const [expandedContent, setExpandedContent] = useState<string>('');

  const t = translations[language];

  useEffect(() => {
    if (isOpen) {
      loadData();
      loadCategories();
      loadRestaurants();
      loadInventoryItems();
    }
  }, [isOpen]);

  

  const loadInventoryItems = async () => {
    setIsInventoryLoading(true);
    try {
      // Получаем список всех позиций склада
      /*const items = await WarehouseService.getInventoryItems();
      
      // Преобразуем данные в нужный формат
      const formattedItems = items.map((item: WarehouseItem) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        ...(item.storageLocation && { 
          storageLocation: {
            id: item.storageLocation.id,
            name: item.storageLocation.name
          }
        }),
        ...(item.product && {
          product: {
            id: item.product.id,
            title: item.product.title
          }
        })
      }));

      setInventoryItems(formattedItems);*/
      throw Error()
    } catch (error) {
      console.error('Failed to load inventory items', error);
      toast.error(language === 'ru' 
        ? 'Ошибка загрузки ингредиентов' 
        : 'ინგრედიენტების ჩატვირთვის შეცდომა');
    } finally {
      setIsInventoryLoading(false);
    }
  };

  const loadData = async () => {
    if (!productId) {
      resetForm();
      return;
    }
    
    setIsLoading(true);
    loadAdditives();
    try {
      const [product, productAdditives, prices, productIngredients] = await Promise.all([
        ProductService.getById(productId),
        AdditiveService.getByProduct(productId),
        ProductService.getRestaurantPrices(productId),
        ProductService.getIngredients(productId),
      ]);

      setFormData({
        title: product.title,
        description: product.description,
        ingredients: product.ingredients,
        price: product.price,
        images: product.images.length ? product.images : [''],
        categoryId: product.categoryId,
        weight: product.weight,
        preparationTime: product.preparationTime,
        packageQuantity: product.packageQuantity,
        quantity: product.quantity || 0,
        printLabels: product.printLabels,
        publishedOnWebsite: product.publishedOnWebsite,
        publishedInApp: product.publishedInApp,
        isStopList: product.isStopList,
        pageTitle: product.pageTitle || '',
        metaDescription: product.metaDescription || '',
        content: product.content || '',
      });

      setSelectedAdditives(productAdditives.map((a: Additive) => a.id));
      setRestaurantPrices(prices);
      setSelectedRestaurants(prices.map((p: RestaurantPrice) => p.restaurantId));
      setSelectedWorkshops(product.workshops?.map((w: WorkshopIn) => w.workshop.id) || []);
      setIngredients(productIngredients || []);
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка загрузки данных' : 'მონაცემების ჩატვირთვის შეცდომა');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      ingredients: '',
      price: 0,
      images: [''],
      categoryId: '',
      weight: undefined,
      preparationTime: undefined,
      packageQuantity: undefined,
      quantity: 0,
      printLabels: false,
      publishedOnWebsite: false,
      publishedInApp: false,
      isStopList: false,
      pageTitle: '',
      metaDescription: '',
      content: '',
    });
    setSelectedAdditives([]);
    setSelectedRestaurants([]);
    setRestaurantPrices([]);
    setCurrentStep('basic');
    setSelectedWorkshops([]);
    setIngredients([]);
    setExpandedTextarea(null);
    setExpandedContent('');
  };

  const loadCategories = async () => {
    setIsCategoriesLoading(true);
    try {
      const data = await CategoryService.getAll();
      setCategories(data as any);
    } catch (error) {
      console.error('Failed to load categories', error);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const loadRestaurants = async () => {
    setIsRestaurantsLoading(true);
    try {
      const data = await RestaurantService.getAll();
      setRestaurants(data);
    } catch (error) {
      console.error('Failed to load restaurants', error);
    } finally {
      setIsRestaurantsLoading(false);
    }
  };

  const loadAdditives = async () => {
    setIsAdditivesLoading(true);
    try {
      const data = await AdditiveService.getAll();
      setAdditives(data);
    } catch (error) {
      console.error('Failed to load additives', error);
    } finally {
      setIsAdditivesLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['price', 'weight', 'preparationTime', 'packageQuantity', 'quantity'].includes(name) 
        ? Number(value) 
        : value,
    });
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
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
    setSelectedAdditives(prev =>
      prev.includes(additiveId)
        ? prev.filter(id => id !== additiveId)
        : [...prev, additiveId]
    );
  };

  const toggleRestaurant = (restaurantId: string) => {
    setSelectedRestaurants(prev => {
      const newSelection = prev.includes(restaurantId)
        ? prev.filter(id => id !== restaurantId)
        : [...prev, restaurantId];
      
      if (!newSelection.includes(restaurantId)) {
        setRestaurantPrices(prevPrices => 
          prevPrices.filter(rp => rp.restaurantId !== restaurantId)
        );
      }
      
      return newSelection;
    });
  };

  const handleRestaurantPriceChange = (restaurantId: string, field: 'price' | 'isStopList', value: any) => {
    setRestaurantPrices(prev => {
      const existing = prev.find(rp => rp.restaurantId === restaurantId);
      if (existing) {
        return prev.map(rp => 
          rp.restaurantId === restaurantId 
            ? { ...rp, [field]: field === 'price' ? Number(value) : value }
            : rp
        );
      } else {
        return [
          ...prev, 
          {
            restaurantId,
            price: field === 'price' ? Number(value) : formData.price,
            isStopList: field === 'isStopList' ? value : false
          }
        ];
      }
    });
  };

  // Функция для открытия расширяемого textarea
  const openExpandedTextarea = (fieldName: string, content: string) => {
    setExpandedTextarea(fieldName);
    setExpandedContent(content);
  };

  // Функция для сохранения контента из расширяемого textarea
  const saveExpandedContent = () => {
    if (expandedTextarea) {
      setFormData(prev => ({
        ...prev,
        [expandedTextarea]: expandedContent
      }));
    }
    setExpandedTextarea(null);
  };

  const validateCurrentStep = () => {
    const errors = [];
    
    if (currentStep === 'basic') {
      if (!formData.title.trim()) {
        errors.push(t.errors.titleRequired);
      }
      if (!formData.categoryId) {
        errors.push(t.errors.categoryRequired);
      }
      if (formData.price <= 0) {
        errors.push(t.errors.pricePositive);
      }
    }
    
    if (currentStep === 'prices' && selectedRestaurants.length === 0) {
      errors.push(t.errors.restaurantsRequired);
    }

    if (currentStep === 'ingredients') {
      const hasEmptyIngredients = ingredients.some(
        i => !i.inventoryItemId || i.quantity <= 0
      );
      if (hasEmptyIngredients) {
        errors.push(t.errors.ingredientsInvalid);
      }
    }
    
    if (errors.length > 0) {
      toast.error(errors.join('\n'));
      return false;
    }
    return true;
  };

  const goToNextStep = () => {
    if (!validateCurrentStep()) return;
    
    const steps: FormStep[] = ['basic', 'details', 'images', 'additives', 'ingredients', 'prices', 'seo'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const goToPrevStep = () => {
    const steps: FormStep[] = ['basic', 'details', 'images', 'additives', 'ingredients', 'prices', 'seo'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setIsLoading(true);

    try {
      const productData = {
        ...formData,
        networkId,
        ingredients: ingredients.filter(i => i.inventoryItemId && i.quantity > 0)
          .map(i => ({
            inventoryItemId: i.inventoryItemId,
            quantity: parseFloat(i.quantity.toString())
          })),
        images: formData.images.filter(img => img.trim()),
        restaurantPrices: restaurantPrices.filter(rp => 
          selectedRestaurants.includes(rp.restaurantId)
        ),
        additives: selectedAdditives,
        workshopIds: selectedWorkshops,
      };

      let productIdToUse = productId;
      
      // Create or update the product
      if (productId) {
        await ProductService.update(productId, productData);
        toast.success(language === 'ru' ? 'Продукт обновлен' : 'პროდუქტი განახლებულია');
      } else {
        const createdProduct = await ProductService.create(productData);
        productIdToUse = createdProduct.id;
        toast.success(language === 'ru' ? 'Продукт создан' : 'პროდუქტი შექმნილია');
      }

      // Add product to selected restaurants
      if (productIdToUse) {
        await Promise.all(
          selectedRestaurants.map(restaurantId => 
            RestaurantService.addProduct(restaurantId, { productId: productIdToUse as string })
              .catch(error => {
                console.error(`Failed to add product to restaurant ${restaurantId}:`, error);
                toast.error(
                  language === 'ru' 
                    ? `Ошибка добавления продукта в ресторан ${restaurantId}`
                    : `პროდუქტის რესტორნში დამატების შეცდომა ${restaurantId}`
                );
              })
          )
        );
      }

      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(language === 'ru' ? 'Ошибка сохранения' : 'შენახვის შეცდომა');
    } finally {
      setIsLoading(false);
    }
  };

  const getRestaurantPrice = (restaurantId: string) => {
    return restaurantPrices.find(rp => rp.restaurantId === restaurantId) || {
      restaurantId,
      price: formData.price,
      isStopList: false
    };
  };

  // Функция для рендера поля с возможностью раскрытия
  const renderExpandableField = (fieldName: string, label: string, value: string, placeholder?: string) => {
    const fieldTranslations = {
      description: {
        ru: 'Описание продукта',
        ka: 'პროდუქტის აღწერა'
      },
      ingredients: {
        ru: 'Состав продукта',
        ka: 'პროდუქტის შემადგენლობა'
      },
      metaDescription: {
        ru: 'Мета-описание для поисковых систем',
        ka: 'ძებნის სისტემებისთვის მეტა-აღწერა'
      },
      content: {
        ru: 'Подробное описание продукта',
        ka: 'პროდუქტის დეტალური აღწერა'
      }
    };

    const fieldLabel = fieldTranslations[fieldName as keyof typeof fieldTranslations]?.[language] || label;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={fieldName} className="text-sm">
            {label}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => openExpandedTextarea(fieldName, value)}
            className="h-8 px-2"
          >
            <Expand className="h-4 w-4 mr-1" />
            <span className="text-xs">{t.expandText}</span>
          </Button>
        </div>
        <Textarea
          id={fieldName}
          name={fieldName}
          value={value}
          onChange={handleInputChange}
          className="text-sm min-h-[80px] resize-none"
          placeholder={placeholder}
        />
      </div>
    );
  };

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
                onChange={handleInputChange}
                required
                className="text-sm"
              />
            </div>

            {renderExpandableField(
              'description', 
              t.fields.description, 
              formData.description,
              language === 'ru' ? 'Опишите ваш продукт' : 'აღწერეთ თქვენი პროდუქტი'
            )}

            {renderExpandableField(
              'ingredients',
              t.fields.ingredients,
              formData.ingredients,
              language === 'ru' ? 'Укажите состав продукта' : 'მიუთითეთ პროდუქტის შემადგენლობა'
            )}

            <div className="space-y-2">
              <Label htmlFor="categoryId" className="text-sm">
                {t.fields.category}
              </Label>
              {isCategoriesLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SearchableSelect
                  options={categories.map(c => ({ id: c.id, label: c.title }))}
                  value={formData.categoryId ? [formData.categoryId] : []}
                  onChange={([id]) => setFormData({...formData, categoryId: id || ''})}
                  placeholder={t.fields.category}
                  searchPlaceholder={t.fields.category}
                  emptyText={language === 'ru' ? 'Категории не найдены' : 'კატეგორიები ვერ მოიძებნა'}
                  multiple={false}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm">
                {t.fields.price}
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm">
                  {t.fields.weight}
                </Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  min="0"
                  value={formData.weight || ''}
                  onChange={handleInputChange}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preparationTime" className="text-sm">
                  {t.fields.preparationTime}
                </Label>
                <Input
                  id="preparationTime"
                  name="preparationTime"
                  type="number"
                  min="0"
                  value={formData.preparationTime || ''}
                  onChange={handleInputChange}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm">
                  {t.fields.quantity}
                </Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="packageQuantity" className="text-sm">
                  {t.fields.packageQuantity}
                </Label>
                <Input
                  id="packageQuantity"
                  name="packageQuantity"
                  type="number"
                  min="0"
                  value={formData.packageQuantity || ''}
                  onChange={handleInputChange}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label className="text-sm">
                  {t.fields.workshops}
                </Label>
                {isWorkshopsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SearchableSelect
                    options={workshops.map(w => ({ id: w.id, label: w.name }))}
                    value={selectedWorkshops}
                    onChange={setSelectedWorkshops}
                    placeholder={t.fields.selectWorkshops}
                    searchPlaceholder={t.fields.searchWorkshops}
                    emptyText={t.fields.noWorkshops}
                  />
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="printLabels" className="text-sm">
                  {t.fields.printLabels}
                </Label>
                <Switch
                  id="printLabels"
                  checked={formData.printLabels}
                  onCheckedChange={checked => handleSwitchChange('printLabels', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="publishedOnWebsite" className="text-sm">
                  {t.fields.publishedOnWebsite}
                </Label>
                <Switch
                  id="publishedOnWebsite"
                  checked={formData.publishedOnWebsite}
                  onCheckedChange={checked => handleSwitchChange('publishedOnWebsite', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="publishedInApp" className="text-sm">
                  {t.fields.publishedInApp}
                </Label>
                <Switch
                  id="publishedInApp"
                  checked={formData.publishedInApp}
                  onCheckedChange={checked => handleSwitchChange('publishedInApp', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isStopList" className="text-sm">
                  {t.fields.isStopList}
                </Label>
                <Switch
                  id="isStopList"
                  checked={formData.isStopList}
                  onCheckedChange={checked => handleSwitchChange('isStopList', checked)}
                />
              </div>
            </div>
          </div>
        );

      case 'images':
        return (
          <div className="space-y-4">
            <ImageUploader
              value={formData.images.filter(img => img.trim())}
              onChange={(images) => setFormData({...formData, images})}
              maxFiles={5}
              language={language}
            />
          </div>
        );
      
      case 'prices':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">
                {t.fields.selectRestaurants}
              </Label>
              {isRestaurantsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SearchableSelect
                  options={restaurants.map(r => ({ id: r.id, label: r.title }))}
                  value={selectedRestaurants}
                  onChange={setSelectedRestaurants}
                  placeholder={t.fields.selectRestaurants}
                  searchPlaceholder={t.fields.searchRestaurants}
                  emptyText={t.fields.noRestaurants}
                />
              )}
            </div>

            {selectedRestaurants.length > 0 && (
              <div className="space-y-3">
                {selectedRestaurants.map(restaurantId => {
                  const restaurant = restaurants.find(r => r.id === restaurantId);
                  const priceInfo = getRestaurantPrice(restaurantId);
                  return (
                    <div key={restaurantId} className="grid grid-cols-3 gap-4 items-center">
                      
                      <Label className="text-sm">{restaurant?.title}</Label>
                      
                      <Input
                        type="number"
                        min="0"
                        value={priceInfo.price}
                        onChange={e => handleRestaurantPriceChange(
                          restaurantId, 
                          'price', 
                          e.target.value
                        )}
                        className="text-sm"
                      />
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={priceInfo.isStopList}
                          onCheckedChange={checked => handleRestaurantPriceChange(
                            restaurantId, 
                            'isStopList', 
                            checked
                          )}
                        />
                        <Label className="text-sm">
                          {language === 'ru' ? 'Стоп-лист' : 'სტოპ ლისტი'}
                        </Label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      
      case 'additives':
        return (
          <div className="space-y-2">
            <Label className="text-sm">
              {t.fields.additives}
            </Label>
            {isAdditivesLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SearchableSelect
                options={additives.map(a => ({ id: a.id, label: `${a.title} (+${a.price}₽)` }))}
                value={selectedAdditives}
                onChange={setSelectedAdditives}
                placeholder={t.fields.additives}
                searchPlaceholder={t.fields.searchAdditives}
                emptyText={t.fields.noAdditives}
              />
            )}
          </div>
        );

      case 'ingredients':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">
                {t.fields.productIngredients}
              </Label>
              
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <IngredientSelect
                    key={index}
                    value={ingredient}
                    onChange={(newValue) => {
                      const newIngredients = [...ingredients];
                      newIngredients[index] = newValue;
                      setIngredients(newIngredients);
                    }}
                    onRemove={() => {
                      const newIngredients = [...ingredients];
                      newIngredients.splice(index, 1);
                      setIngredients(newIngredients);
                    }}
                    inventoryItems={inventoryItems}
                    language={language}
                  />
                ))}
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="mt-2 text-sm"
                onClick={() => setIngredients([...ingredients, { inventoryItemId: '', quantity: 0 }])}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t.fields.addIngredient}
              </Button>
            </div>
          </div>
        );

      case 'seo':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pageTitle" className="text-sm">
                {t.fields.pageTitle}
              </Label>
              <Input
                id="pageTitle"
                name="pageTitle"
                value={formData.pageTitle}
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
            
            {renderExpandableField(
              'metaDescription',
              t.fields.metaDescription,
              formData.metaDescription,
              language === 'ru' 
                ? 'Мета-описание для поисковых систем. Оптимальная длина: 150-160 символов.'
                : 'ძებნის სისტემებისთვის მეტა-აღწერა. ოპტიმალური სიგრძე: 150-160 სიმბოლო.'
            )}
            
            {renderExpandableField(
              'content',
              t.fields.content,
              formData.content,
              language === 'ru' 
                ? 'Подробное описание продукта для страницы'
                : 'გვერდისთვის პროდუქტის დეტალური აღწერა'
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    return t.steps[currentStep];
  };

  return (
    <>
      {/* Основная модалка */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {productId ? t.editProduct : t.addProduct}
            </DialogTitle>
            <div className="text-sm text-muted-foreground">{getStepTitle()}</div>
          </DialogHeader>
          
          {isLoading ? (
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
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t.back}
                    </Button>
                  ) : (
                    <div />
                  )}
                  
                  {currentStep !== 'seo' ? (
                    <Button 
                      type="button"
                      onClick={goToNextStep}
                      disabled={isLoading}
                      className="text-sm"
                    >
                      {t.next}
                      <ArrowRight className="ml-2 h-4 w-4" />
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

      {/* Модалка для расширенного редактирования textarea */}
      <Dialog open={!!expandedTextarea} onOpenChange={(open) => !open && setExpandedTextarea(null)}>
        <DialogContentWide className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {expandedTextarea === 'description' && t.fields.description}
              {expandedTextarea === 'ingredients' && t.fields.ingredients}
              {expandedTextarea === 'metaDescription' && t.fields.metaDescription}
              {expandedTextarea === 'content' && t.fields.content}
            </DialogTitle>
          </DialogHeader>
          
          <Textarea
            value={expandedContent}
            onChange={(e) => setExpandedContent(e.target.value)}
            className="min-h-[80vh] resize-none text-sm"
            placeholder={
              expandedTextarea === 'description' 
                ? (language === 'ru' 
                    ? 'Введите описание продукта' 
                    : 'შეიყვანეთ პროდუქტის დეტალური აღწერა')
                : expandedTextarea === 'ingredients'
                ? (language === 'ru' 
                    ? 'Введите состав продукта' 
                    : 'შეიყვანეთ პროდუქტის სრული შემადგენლობა')
                : expandedTextarea === 'metaDescription'
                ? (language === 'ru' 
                    ? 'Введите мета-описание.' 
                    : 'შეიყვანეთ მეტა-აღწერა')
                : (language === 'ru' 
                    ? 'Введите контент для страницы продукта' 
                    : 'შეიყვანეთ  კონტენტი პროდუქტის გვერდისთვის')
            }
          />
          
          <DialogFooter>
            <Button 
              onClick={saveExpandedContent}
              className="mt-4"
            >
              {language === 'ru' ? 'Сохранить' : 'შენახვა'}
            </Button>
          </DialogFooter>
        </DialogContentWide>
      </Dialog>
    </>
  );
};