import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, X, Plus, Check, ChevronsUpDown, ArrowLeft, ArrowRight } from 'lucide-react';
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { WorkshopIn } from './ProductTable';
import { ImageUploader } from './ImageUploader';
import { WarehouseItem, WarehouseService } from '@/lib/api/warehouse.service';


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
  onClose: () => void;
  onSubmitSuccess: () => void;
  productId: string | null;
  language: 'ru' | 'ka';
}

type FormStep = 'basic' | 'details' | 'images' | 'additives' | 'ingredients' | 'prices' | 'seo';

export const ProductModal = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  productId,
  language,
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
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
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

  useEffect(() => {
    if (isOpen) {
      loadData();
      loadCategories();
      loadRestaurants();
      loadWorkshops();
      loadInventoryItems();
    }
  }, [isOpen]);

  const loadWorkshops = async () => {
    setIsWorkshopsLoading(true);
    try {
      const data = await WorkshopService.getAll();
      setWorkshops(data);
    } catch (error) {
      console.error('Failed to load workshops', error);
      toast.error(language === 'ru' ? 'Ошибка загрузки цехов' : 'სახელოსნოების ჩატვირთვის შეცდომა');
    } finally {
      setIsWorkshopsLoading(false);
    }
  };

  const loadInventoryItems = async () => {
  setIsInventoryLoading(true);
  try {
    // Получаем список всех позиций склада
    const items = await WarehouseService.getInventoryItems();
    
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

    setInventoryItems(formattedItems);
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
  };

  const loadCategories = async () => {
    setIsCategoriesLoading(true);
    try {
      const data = await CategoryService.getAll();
      setCategories(data);
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

  const validateCurrentStep = () => {
    const errors = [];
    
    if (currentStep === 'basic') {
      if (!formData.title.trim()) {
        errors.push(language === 'ru' ? 'Название продукта обязательно' : 'პროდუქტის სახელი სავალდებულოა');
      }
      if (!formData.categoryId) {
        errors.push(language === 'ru' ? 'Выберите категорию' : 'აირჩიეთ კატეგორია');
      }
      if (formData.price <= 0) {
        errors.push(language === 'ru' ? 'Цена должна быть больше 0' : 'ფასი უნდა იყოს 0-ზე მეტი');
      }
    }
    
    if (currentStep === 'images' && !formData.images.some(img => img.trim())) {
      errors.push(language === 'ru' ? 'Добавьте хотя бы одно изображение' : 'დაამატეთ ერთი სურათი მაინც');
    }
    
    if (currentStep === 'prices' && selectedRestaurants.length === 0) {
      errors.push(language === 'ru' ? 'Выберите хотя бы один ресторан' : 'აირჩიეთ ერთი რესტორნი მაინც');
    }

    if (currentStep === 'ingredients') {
      const hasEmptyIngredients = ingredients.some(
        i => !i.inventoryItemId || i.quantity <= 0
      );
      if (hasEmptyIngredients) {
        errors.push(language === 'ru' 
          ? 'Укажите корректные ингредиенты' 
          : 'მიუთითეთ სწორი ინგრედიენტები');
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
        ingredients: ingredients.filter(i => i.inventoryItemId && i.quantity > 0)
        .map(i => ({
          inventoryItemId: i.inventoryItemId,
          quantity: parseFloat(i.quantity.toString()) // Преобразуем в число
        })),
        images: formData.images.filter(img => img.trim()),
        restaurantPrices: restaurantPrices.filter(rp => 
          selectedRestaurants.includes(rp.restaurantId)
        ),
        additives: selectedAdditives,
        workshopIds: selectedWorkshops,
      };

      if (productId) {
        await ProductService.update(productId, productData);
        toast.success(language === 'ru' ? 'Продукт обновлен' : 'პროდუქტი განახლებულია');
      } else {
        await ProductService.create(productData);
        toast.success(language === 'ru' ? 'Продукт создан' : 'პროდუქტი შექმნილია');
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
         return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm">
                {language === 'ru' ? 'Название' : 'სახელი'} *
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

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">
                {language === 'ru' ? 'Описание' : 'აღწერა'}
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="text-sm min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredients" className="text-sm">
                {language === 'ru' ? 'Состав' : 'შემადგენლობა'}
              </Label>
              <Textarea
                id="ingredients"
                name="ingredients"
                value={formData.ingredients}
                onChange={handleInputChange}
                className="text-sm min-h-[80px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId" className="text-sm">
                {language === 'ru' ? 'Категория' : 'კატეგორია'} *
              </Label>
              {isCategoriesLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Select
                  value={formData.categoryId}
                  onValueChange={value => setFormData({...formData, categoryId: value})}
                >
                  <SelectTrigger className="text-sm w-full">
                    <SelectValue placeholder={language === 'ru' ? 'Выберите категорию' : 'აირჩიეთ კატეგორია'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id} className="text-sm">
                        {category.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm">
                {language === 'ru' ? 'Базовая цена' : 'საბაზისო ფასი'} *
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
                  {language === 'ru' ? 'Вес (г)' : 'წონა (გ)'}
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
                  {language === 'ru' ? 'Время приготовления (мин)' : 'მომზადების დრო (წთ)'}
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
                  {language === 'ru' ? 'Количество' : 'რაოდენობა'}
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
                  {language === 'ru' ? 'Кол-во в упаковке' : 'რაოდენობა შეფუთვაში'}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between text-sm"
                    >
                      {selectedWorkshops.length > 0
                        ? `${selectedWorkshops.length} ${language === 'ru' ? 'выбрано' : 'selected'}`
                        : language === 'ru' ? 'Выберите цехи' : 'აირჩიეთ სახელოსნოები'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[var(--radix-popover-trigger-width)] p-0 min-w-[400px]" 
                    align="start"
                  >
                    <Command className="w-full">
                      <CommandInput 
                        placeholder={language === 'ru' ? 'Поиск цехов...' : 'სახელოსნოების ძებნა...'} 
                        className="text-sm w-full"
                      />
                      <CommandEmpty className="text-sm px-2 py-1.5">
                        {language === 'ru' ? 'Цехи не найдены' : 'სახელოსნოები ვერ მოიძებნა'}
                      </CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-y-auto w-full">
                        <div className="grid gap-2 p-1"> 
                          {workshops.map((workshop) => (
                            <CommandItem
                              key={workshop.id}
                              value={workshop.id}
                              onSelect={() => {
                                setSelectedWorkshops(prev =>
                                  prev.includes(workshop.id)
                                    ? prev.filter(id => id !== workshop.id)
                                    : [...prev, workshop.id]
                                );
                              }}
                              className="text-sm"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedWorkshops.includes(workshop.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {workshop.name}
                            </CommandItem>
                          ))}
                        </div>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedWorkshops.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 w-full">
                    {selectedWorkshops.map(workshopId => {
                      const workshop = workshops.find(w => w.id === workshopId);
                      return workshop ? (
                        <Badge 
                          key={workshopId} 
                          variant="secondary" 
                          className="flex items-center gap-1 text-sm"
                        >
                          {workshop.name}
                          <button
                            type="button"
                            onClick={() => setSelectedWorkshops(prev => prev.filter(id => id !== workshopId))}
                            className="rounded-full p-0.5 hover:bg-muted"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="printLabels" className="text-sm">
                  {language === 'ru' ? 'Печать лейблов' : 'ლეიბლების დაბეჭდვა'}
                </Label>
                <Switch
                  id="printLabels"
                  checked={formData.printLabels}
                  onCheckedChange={checked => handleSwitchChange('printLabels', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="publishedOnWebsite" className="text-sm">
                  {language === 'ru' ? 'Опубликовать на сайте' : 'საიტზე გამოქვეყნება'}
                </Label>
                <Switch
                  id="publishedOnWebsite"
                  checked={formData.publishedOnWebsite}
                  onCheckedChange={checked => handleSwitchChange('publishedOnWebsite', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="publishedInApp" className="text-sm">
                  {language === 'ru' ? 'Опубликовать в приложении' : 'აპლიკაციაში გამოქვეყნება'}
                </Label>
                <Switch
                  id="publishedInApp"
                  checked={formData.publishedInApp}
                  onCheckedChange={checked => handleSwitchChange('publishedInApp', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isStopList" className="text-sm">
                  {language === 'ru' ? 'В стоп-листе' : 'სტოპ ლისტში'}
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
                {language === 'ru' ? 'Выберите рестораны' : 'აირჩიეთ რესტორნები'}
              </Label>
              {isRestaurantsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between text-sm"
                    >
                      {language === 'ru' ? 'Выберите рестораны' : 'აირჩიეთ რესტორნები'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder={language === 'ru' ? 'Поиск ресторанов...' : 'რესტორნების ძებნა...'} 
                        className="text-sm"
                      />
                      <CommandEmpty className="text-sm px-2 py-1.5">
                        {language === 'ru' ? 'Рестораны не найдены' : 'რესტორნები ვერ მოიძებნა'}
                      </CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-y-auto">
                        {restaurants.map(restaurant => (
                          <CommandItem
                            key={restaurant.id}
                            value={restaurant.id}
                            onSelect={() => toggleRestaurant(restaurant.id)}
                            className="text-sm"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedRestaurants.includes(restaurant.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {restaurant.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
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
          <div className="space-y-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between text-sm"
                  onClick={() => !additives.length && loadAdditives()}
                >
                  {language === 'ru' ? 'Выберите добавки' : 'აირჩიეთ დანამატები'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder={language === 'ru' ? 'Поиск добавок...' : 'დანამატების ძებნა...'} 
                    className="text-sm"
                  />
                  <CommandEmpty className="text-sm px-2 py-1.5">
                    {language === 'ru' ? 'Добавки не найдены' : 'დანამატები ვერ მოიძებნა'}
                  </CommandEmpty>
                  <CommandGroup className="max-h-60 overflow-y-auto">
                    {isAdditivesLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : additives.map(additive => (
                      <CommandItem
                        key={additive.id}
                        value={additive.id}
                        onSelect={() => toggleAdditive(additive.id)}
                        className="text-sm"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedAdditives.includes(additive.id)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {additive.title} (+{additive.price}₾)
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {selectedAdditives.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedAdditives.map(additiveId => {
                  const additive = additives.find(a => a.id === additiveId);
                  return additive ? (
                    <Badge 
                      key={additiveId} 
                      variant="secondary" 
                      className="flex items-center gap-1 text-sm"
                    >
                      {additive.title} (+{additive.price}₾)
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
          </div>
        );

      case 'ingredients':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">
                {language === 'ru' ? 'Ингредиенты продукта' : 'პროდუქტის ინგრედიენტები'}
              </Label>
              
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => {
                  const item = inventoryItems.find(i => i.id === ingredient.inventoryItemId);
                  return (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Select
                          value={ingredient.inventoryItemId}
                          onValueChange={(value) => {
                            const newIngredients = [...ingredients];
                            newIngredients[index].inventoryItemId = value;
                            setIngredients(newIngredients);
                          }}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder={language === 'ru' ? 'Выберите ингредиент' : 'აირჩიეთ ინგრედიენტი'} />
                          </SelectTrigger>
                          <SelectContent>
                            {inventoryItems.map(item => (
                              <SelectItem key={item.id} value={item.id} className="text-sm">
                                {item.name} ({item.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="col-span-5">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ingredient.quantity}
                          onChange={(e) => {
                            const newIngredients = [...ingredients];
                            newIngredients[index].quantity = parseFloat(e.target.value) || 0;
                            setIngredients(newIngredients);
                          }}
                          className="text-sm"
                        />
                      </div>
                      
                      <div className="col-span-2 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newIngredients = [...ingredients];
                            newIngredients.splice(index, 1);
                            setIngredients(newIngredients);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="mt-2 text-sm"
                onClick={() => setIngredients([...ingredients, { inventoryItemId: '', quantity: 0 }])}
              >
                <Plus className="mr-2 h-4 w-4" />
                {language === 'ru' ? 'Добавить ингредиент' : 'ინგრედიენტის დამატება'}
              </Button>
            </div>
          </div>
        );

     case 'ingredients':
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm">
          {language === 'ru' ? 'Ингредиенты продукта' : 'პროდუქტის ინგრედიენტები'}
        </Label>
        
        <div className="space-y-3">
          {ingredients.map((ingredient, index) => {
            const [open, setOpen] = useState(false);
            const selectedItem = inventoryItems.find(i => i.id === ingredient.inventoryItemId);
            
            return (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between text-sm"
                      >
                        {selectedItem 
                          ? `${selectedItem.name} (${selectedItem.unit})`
                          : language === 'ru' ? 'Выберите ингредиент' : 'აირჩიეთ ინგრედიენტი'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput 
                          placeholder={language === 'ru' ? 'Поиск ингредиентов...' : 'ინგრედიენტების ძებნა...'} 
                          className="h-9 text-sm"
                        />
                        <CommandEmpty className="text-sm px-2 py-1.5">
                          {language === 'ru' ? 'Ингредиенты не найдены' : 'ინგრედიენტები ვერ მოიძებნა'}
                        </CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                          {inventoryItems.map((item) => (
                            <CommandItem
                              key={item.id}
                              value={`${item.name} ${item.unit}`} // Поиск по name и unit
                              onSelect={() => {
                                const newIngredients = [...ingredients];
                                newIngredients[index].inventoryItemId = item.id;
                                setIngredients(newIngredients);
                                setOpen(false);
                              }}
                              className="text-sm"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  ingredient.inventoryItemId === item.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {item.name} ({item.unit})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="col-span-5">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ingredient.quantity}
                    onChange={(e) => {
                      const newIngredients = [...ingredients];
                      newIngredients[index].quantity = parseFloat(e.target.value) || 0;
                      setIngredients(newIngredients);
                    }}
                    className="text-sm"
                  />
                </div>
                
                <div className="col-span-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newIngredients = [...ingredients];
                      newIngredients.splice(index, 1);
                      setIngredients(newIngredients);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        
        <Button
          type="button"
          variant="outline"
          className="mt-2 text-sm"
          onClick={() => setIngredients([...ingredients, { inventoryItemId: '', quantity: 0 }])}
        >
          <Plus className="mr-2 h-4 w-4" />
          {language === 'ru' ? 'Добавить ингредиент' : 'ინგრედიენტის დამატება'}
        </Button>
      </div>
    </div>
  );
  
      case 'seo':
         return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pageTitle" className="text-sm">
                {language === 'ru' ? 'Заголовок страницы' : 'გვერდის სათაური'}
              </Label>
              <Input
                id="pageTitle"
                name="pageTitle"
                value={formData.pageTitle}
                onChange={handleInputChange}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription" className="text-sm">
                {language === 'ru' ? 'Мета описание' : 'მეტა აღწერა'}
              </Label>
              <Textarea
                id="metaDescription"
                name="metaDescription"
                value={formData.metaDescription}
                onChange={handleInputChange}
                className="text-sm min-h-[80px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm">
                {language === 'ru' ? 'Контент' : 'კონტენტი'}
              </Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className="text-sm min-h-[100px] resize-none"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'basic':
        return language === 'ru' ? 'Основная информация' : 'ძირითადი ინფორმაცია';
      case 'details':
        return language === 'ru' ? 'Дополнительные параметры' : 'დამატებითი პარამეტრები';
      case 'images':
        return language === 'ru' ? 'Изображения' : 'სურათები';
      case 'additives':
        return language === 'ru' ? 'Добавки' : 'დანამატები';
      case 'ingredients':
        return language === 'ru' ? 'Ингредиенты' : 'ინგრედიენტები';
      case 'prices':
        return language === 'ru' ? 'Цены в ресторанах' : 'რესტორნებში ფასები';
      case 'seo':
        return 'SEO';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {productId 
              ? language === 'ru' ? 'Редактировать продукт' : 'პროდუქტის რედაქტირება'
              : language === 'ru' ? 'Добавить продукт' : 'პროდუქტის დამატება'}
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
                    {language === 'ru' ? 'Назад' : 'უკან'}
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
                    {language === 'ru' ? 'Далее' : 'შემდეგი'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="text-sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {language === 'ru' ? 'Сохранение...' : 'შენახვა...'}
                      </>
                    ) : (
                      language === 'ru' ? 'Сохранить' : 'შენახვა'
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