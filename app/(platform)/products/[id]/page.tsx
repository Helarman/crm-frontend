'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, X, Plus, Check, ChevronsUpDown, ArrowLeft, ArrowRight, Save, Image as ImageIcon, Tag,Info, Package, DollarSign, Soup, ShoppingBasket, Search, Globe, ChevronRight, Maximize2, CircleCheck, Minimize2, ListCollapse } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductService } from '@/lib/api/product.service'
import { Additive, AdditiveService } from '@/lib/api/additive.service'
import { RestaurantService } from '@/lib/api/restaurant.service'
import { CategoryService } from '@/lib/api/category.service'
import { WorkshopService } from '@/lib/api/workshop.service'
import { WarehouseService } from '@/lib/api/warehouse.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ImageUploader } from '@/components/features/menu/product/ImageUploader'
import SearchableSelect from '@/components/features/menu/product/SearchableSelect'
import IngredientSelect from '@/components/features/menu/product/IngredientSelect'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguageStore } from '@/lib/stores/language-store'
import { useAuth } from '@/lib/hooks/useAuth'
import { Restaurant } from '@/lib/types/restaurant'
import { HtmlTextarea } from '@/components/ui/html-textarea'
import { Dialog, DialogContentExtraWide, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface RestaurantPrice {
  restaurantId: string
  price: number
  isStopList: boolean
}

interface Workshop {
  id: string
  name: string
}

type FormStep = 'basic' | 'details' | 'images' | 'additives' | 'ingredients' | 'prices' | 'seo'

const sections = [
  { 
    id: 'basic', 
    title: { ru: 'Основная информация', ka: 'ძირითადი ინფორმაცია' },
    icon: Info,
    color: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    description: { ru: 'Название, описание, цена', ka: 'სახელი, აღწერა, ფასი' }
  },
  { 
    id: 'details', 
    title: { ru: 'Детали', ka: 'დეტალები' },
    icon: ListCollapse,
    color: 'bg-gradient-to-br from-purple-500 to-pink-400',
    description: { ru: 'Вес, время приготовления, настройки', ka: 'წონა, მომზადების დრო, პარამეტრები' }
  },
  { 
    id: 'images', 
    title: { ru: 'Изображения', ka: 'სურათები' },
    icon: ImageIcon,
    color: 'bg-gradient-to-br from-amber-500 to-orange-400',
    description: { ru: 'Фотографии продукта', ka: 'პროდუქტის ფოტოები' }
  },
  { 
    id: 'additives', 
    title: { ru: 'Модификаторы', ka: 'მოდიფიკატორები' },
    icon: Plus,
    color: 'bg-gradient-to-br from-emerald-500 to-green-400',
    description: { ru: 'Дополнительные ингредиенты', ka: 'დამატებითი ინგრედიენტები' }
  },
  { 
    id: 'ingredients', 
    title: { ru: 'Ингредиенты', ka: 'ინგრედიენტები' },
    icon: Package,
    color: 'bg-gradient-to-br from-red-500 to-rose-400',
    description: { ru: 'Состав и компоненты', ka: 'შემადგენლობა და კომპონენტები' }
  },
  { 
    id: 'prices', 
    title: { ru: 'Цены', ka: 'ფასები' },
    icon: DollarSign,
    color: 'bg-gradient-to-br from-violet-500 to-purple-400',
    description: { ru: 'Цены в ресторанах', ka: 'ფასები რესტორნებში' }
  },
  { 
    id: 'seo', 
    title: { ru: 'SEO', ka: 'SEO' },
    icon: Globe,
    color: 'bg-gradient-to-br from-gray-600 to-gray-400',
    description: { ru: 'Оптимизация для поиска', ka: 'ოპტიმიზაცია ძიებისთვის' }
  },
];

const ProductEditPage = () => {
  const params = useParams()
  const productId = params.id
  const { language } = useLanguageStore()
  const router = useRouter()
  const { user } = useAuth()
  
  const [currentStep, setCurrentStep] = useState<FormStep>('basic')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    composition: '',
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
  })

  const [selectedAdditives, setSelectedAdditives] = useState<string[]>([])
  const [additives, setAdditives] = useState<{ id: string; title: string; price: number }[]>([])
  const [userRestaurants, setUserRestaurants] = useState<{ id: string; title: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; title: string }[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([])
  const [restaurantPrices, setRestaurantPrices] = useState<RestaurantPrice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdditivesLoading, setIsAdditivesLoading] = useState(false)
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false)
  const [isRestaurantsLoading, setIsRestaurantsLoading] = useState(false)
  const [isWorkshopsLoading, setIsWorkshopsLoading] = useState(false)
  const [selectedWorkshops, setSelectedWorkshops] = useState<string[]>([])
  const [ingredients, setIngredients] = useState<{inventoryItemId: string, quantity: number}[]>([])
  const [inventoryItems, setInventoryItems] = useState<{id: string, name: string, unit: string}[]>([])
  const [isInventoryLoading, setIsInventoryLoading] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
 const [isFullscreenDialogOpen, setIsFullscreenDialogOpen] = useState(false)
  const [fullscreenTextareaValue, setFullscreenTextareaValue] = useState('')
  const [fullscreenTextareaName, setFullscreenTextareaName] = useState('')
  const [fullscreenTextareaLabel, setFullscreenTextareaLabel] = useState('')
  
   const openFullscreenTextarea = (name: string, value: string, label: string) => {
    setFullscreenTextareaName(name)
    setFullscreenTextareaValue(value)
    setFullscreenTextareaLabel(label)
    setIsFullscreenDialogOpen(true)
  }

   const saveFullscreenTextarea = () => {
    setFormData(prev => ({
      ...prev,
      [fullscreenTextareaName]: fullscreenTextareaValue
    }))
    setIsFullscreenDialogOpen(false)
  }

  // Функция для отмены изменений в полноэкранном редакторе
  const cancelFullscreenTextarea = () => {
    setIsFullscreenDialogOpen(false)
  }

   const EnhancedTextarea = ({ 
    id, 
    name, 
    value, 
    onChange, 
    label, 
    placeholder, 
    className = '',
    rows = 3,
    required = false
  }: {
    id: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    label: string;
    placeholder: string;
    className?: string;
    rows?: number;
    required?: boolean;
  }) => {
    return (
      <div className="space-y-2 h-full">
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-sm">
            {label} {required && '*'}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => openFullscreenTextarea(name, value, label)}
          >
            <Maximize2 className="h-3 w-3" />
            {language === 'ru' ? 'Развернуть' : 'გაფართოება'}
          </Button>
        </div>
        <div className="relative">
          <Textarea
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            className={`text-sm resize-none ${className}`}
            placeholder={placeholder}
            rows={rows}
            required={required}
          />
        </div>
      </div>
    )
  }
  useEffect(() => {
    loadData()
    loadCategories()
    loadWorkshops()
    loadInventoryItems()
    loadAdditives()
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setCurrentStep(entry.target.id as FormStep);
          }
        });
      },
      {
        root: null,
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0
      }
    );

    sections.forEach(section => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [])

  const scrollToSection = (id: string) => {
    setIsScrolling(true);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    setTimeout(() => setIsScrolling(false), 1000);
  };

  const loadWorkshops = async () => {
    setIsWorkshopsLoading(true)
    try {
      const product = await ProductService.getById(productId as string)
      const data = await WorkshopService.getByNetworkId(product.networkId)
      setWorkshops(data)
    } catch (error) {
      console.error('Failed to load workshops', error)
      toast.error(language === 'ru' ? 'Ошибка загрузки цехов' : 'სახელოსნოების ჩატვირთვის შეცდომა')
    } finally {
      setIsWorkshopsLoading(false)
    }
  }

  const loadInventoryItems = async () => {
    setIsInventoryLoading(true);
    try {
      const items = await WarehouseService.getAllInventoryItems();
      
      const formattedItems = items.map((item: any) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        categoryId: item.categoryId,
      }));
      
      setInventoryItems(formattedItems);
    } catch (error) {
      console.error('Failed to load inventory items', error);
      toast.error(language === 'ru' 
        ? 'Ошибка загрузки ингредиентов' 
        : 'ინგრედიენტების ჩატვირთვის შეცდომა');
      setInventoryItems([]);
    } finally {
      setIsInventoryLoading(false);
    }
  }

  const loadData = async () => {
    if (!productId) {
      resetForm()
      return
    }
    
    setIsLoading(true)
    try {
      const [product, productAdditives, prices, productIngredients] = await Promise.all([
        ProductService.getById(productId as string),
        AdditiveService.getByProduct(productId as string),
        ProductService.getRestaurantPrices(productId as string),
        ProductService.getIngredients(productId as string),
      ])
       const networkId = product.networkId

        if (networkId) {
          const userRestaurantsData = await RestaurantService.getRestaurantsByUserAndNetwork(user.id, networkId)
          setUserRestaurants(userRestaurantsData)
        }

      setFormData({
        title: product.title,
        description: product.description,
        composition: product.composition,
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
      })

      setSelectedAdditives(productAdditives.map((a: Additive) => a.id))
      setRestaurantPrices(prices)
      
      const userRestaurantIds = user?.restaurants?.map((r : Restaurant) => r.id) || []
      const filteredSelectedRestaurants = prices
        .map((p: RestaurantPrice) => p.restaurantId)
        .filter((id: string) => userRestaurantIds.includes(id))
      
      setSelectedRestaurants(filteredSelectedRestaurants)
      setSelectedWorkshops(product.workshops?.map((w: any) => w.workshop.id) || [])
      setIngredients(productIngredients || [])
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка загрузки данных' : 'მონაცემების ჩატვირთვის შეცდომა')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      composition: '',
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
    })
    setSelectedAdditives([])
    setSelectedRestaurants([])
    setRestaurantPrices([])
    setCurrentStep('basic')
    setSelectedWorkshops([])
    setIngredients([])
  }

  const loadCategories = async () => {
    setIsCategoriesLoading(true)
    try {
      const data = await CategoryService.getAll()
      setCategories(data as any)
    } catch (error) {
      console.error('Failed to load categories', error)
    } finally {
      setIsCategoriesLoading(false)
    }
  }

  const loadAdditives = async () => {
    setIsAdditivesLoading(true)
    try {
      const data = await AdditiveService.getAll()
      setAdditives(data)
    } catch (error) {
      console.error('Failed to load additives', error)
    } finally {
      setIsAdditivesLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: ['price', 'weight', 'preparationTime', 'packageQuantity', 'quantity'].includes(name) 
        ? Number(value) 
        : value,
    })
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    })
  }

  const handleImageChange = (images: string[]) => {
    setFormData({
      ...formData,
      images,
    })
  }

  const toggleAdditive = (additiveId: string) => {
    setSelectedAdditives(prev =>
      prev.includes(additiveId)
        ? prev.filter(id => id !== additiveId)
        : [...prev, additiveId]
    )
  }

  const handleRestaurantsChange = (selectedIds: string[]) => {
    const added = selectedIds.filter(id => !selectedRestaurants.includes(id));
    const removed = selectedRestaurants.filter(id => !selectedIds.includes(id));

    setSelectedRestaurants(selectedIds);

    setRestaurantPrices(prev => {
      let updated = prev.filter(rp => !removed.includes(rp.restaurantId));
      
      added.forEach(restaurantId => {
        if (!updated.some(rp => rp.restaurantId === restaurantId)) {
          updated.push({
            restaurantId,
            price: formData.price,
            isStopList: false
          });
        }
      });
      
      return updated;
    });
  };

  const handleRestaurantPriceChange = (restaurantId: string, field: 'price' | 'isStopList', value: any) => {
    setRestaurantPrices(prev => {
      const existing = prev.find(rp => rp.restaurantId === restaurantId)
      if (existing) {
        return prev.map(rp => 
          rp.restaurantId === restaurantId 
            ? { ...rp, [field]: field === 'price' ? Number(value) : value }
            : rp
        )
      } else {
        return [
          ...prev, 
          {
            restaurantId,
            price: field === 'price' ? Number(value) : formData.price,
            isStopList: field === 'isStopList' ? value : false
          }
        ]
      }
    })
  }

  const getRestaurantPrice = (restaurantId: string) => {
    return restaurantPrices.find(rp => rp.restaurantId === restaurantId) || {
      restaurantId,
      price: formData.price,
      isStopList: false
    }
  }

  const validateForm = () => {
    const errors = []
    
    if (!formData.title.trim()) {
      errors.push(language === 'ru' ? 'Название продукта обязательно' : 'პროდუქტის სახელი სავალდებულოა')
    }
    if (!formData.categoryId) {
      errors.push(language === 'ru' ? 'Выберите категорию' : 'აირჩიეთ კატეგორია')
    }
    if (formData.price <= 0) {
      errors.push(language === 'ru' ? 'Цена должна быть больше 0' : 'ფასი უნდა იყოს 0-ზე მეტი')
    }
    if (selectedRestaurants.length === 0) {
      errors.push(language === 'ru' ? 'Выберите хотя бы один ресторан' : 'აირჩიეთ ერთი რესტორნი მაინც')
    }
    const hasEmptyIngredients = ingredients.some(
      i => !i.inventoryItemId || i.quantity <= 0
    )
    if (hasEmptyIngredients) {
      errors.push(language === 'ru' 
        ? 'Укажите корректные ингредиенты' 
        : 'მიუთითეთ სწორი ინგრედიენტები')
    }
    
    if (errors.length > 0) {
      toast.error(errors.join('\n'))
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const productData = {
        ...formData,
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
      }

      const updatedProduct = await ProductService.update(productId as string, productData)

      await Promise.all(
        selectedRestaurants.map(restaurantId => 
          RestaurantService.addProduct(restaurantId, { productId: productId as string })
            .catch(error => {
              console.error(`Failed to add product to restaurant ${restaurantId}:`, error)
            })
        )
      )

      toast.success(language === 'ru' ? 'Продукт обновлен' : 'პროდუქტი განახლებულია')
      router.back()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error(language === 'ru' ? 'Ошибка сохранения' : 'შენახვის შეცდომა')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = (step: FormStep) => {
    switch (step) {
      case 'basic':
        return (
          <Card>
            <CardContent className="pt-6">
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
                  <Label htmlFor="composition" className="text-sm"> 
                    {language === 'ru' ? 'Состав' : 'შემადგენლობა'}
                  </Label>
                  <Textarea
                    id="composition"
                    name="composition" 
                    value={formData.composition}
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
                    <SearchableSelect
                      options={categories.map(c => ({ id: c.id, label: c.title }))}
                      value={formData.categoryId ? [formData.categoryId] : []}
                      onChange={([id]) => setFormData({...formData, categoryId: id || ''})}
                      placeholder={language === 'ru' ? 'Выберите категорию' : 'აირჩიეთ კატეგორია'}
                      searchPlaceholder={language === 'ru' ? 'Поиск категорий...' : 'კატეგორიების ძებნა...'}
                      emptyText={language === 'ru' ? 'Категории не найдены' : 'კატეგორიები ვერ მოიძებნა'}
                      multiple={false}
                    />
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
            </CardContent>
          </Card>
        )

      case 'details':
        return (
          <Card>
            <CardContent className="pt-6">
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
                    <Label className="text-sm">
                      {language === 'ru' ? 'Цехи' : 'სახელოსნოები'}
                    </Label>
                    {isWorkshopsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SearchableSelect
                        options={workshops.map(w => ({ id: w.id, label: w.name }))}
                        value={selectedWorkshops}
                        onChange={setSelectedWorkshops}
                        placeholder={language === 'ru' ? 'Выберите цехи' : 'აირჩიეთ სახელოსნოები'}
                        searchPlaceholder={language === 'ru' ? 'Поиск цехов...' : 'სახელოსნოების ძებნა...'}
                        emptyText={language === 'ru' ? 'Цехи не найдены' : 'სახელოსნოები ვერ მოიძებნა'}
                      />
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
            </CardContent>
          </Card>
        )

      case 'images':
        return (
          <Card>
            <CardContent className="pt-6">
              <ImageUploader
                value={formData.images.filter(img => img.trim())}
                onChange={handleImageChange}
                maxFiles={5}
                language={language}
              />
            </CardContent>
          </Card>
        )
      
      case 'prices':
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">
                    {language === 'ru' ? 'Выберите рестораны' : 'აირჩიეთ რესტორნები'}
                  </Label>
                  {isRestaurantsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SearchableSelect
                      options={userRestaurants.map(r => ({ id: r.id, label: r.title }))}
                      value={selectedRestaurants}
                      onChange={handleRestaurantsChange}
                      placeholder={language === 'ru' ? 'Выберите рестораны' : 'აირჩიეთ რესტორნები'}
                      searchPlaceholder={language === 'ru' ? 'Поиск ресторанов...' : 'რესტორნების ძებნა...'}
                      emptyText={language === 'ru' ? 'Рестораны не найдены' : 'რესტორნები ვერ მოიძებნა'}
                    />
                  )}
                </div>
                {selectedRestaurants.length > 0 && (
                  <div className="space-y-3">
                    {selectedRestaurants.map(restaurantId => {
                      const restaurant = userRestaurants.find(r => r.id === restaurantId)
                      if (!restaurant) return null
                      
                      const priceInfo = getRestaurantPrice(restaurantId)
                      return (
                        <div key={restaurantId} className="grid grid-cols-3 gap-4 items-center">
                          <Label className="text-sm">{restaurant.title}</Label>
                          
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
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      
      case 'additives':
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label className="text-sm">
                  {language === 'ru' ? 'Выберите Модификаторы' : 'აირჩიეთ მოდიფიკატორები'}
                </Label>
                {isAdditivesLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SearchableSelect
                    options={additives.map(a => ({ id: a.id, label: `${a.title} (+${a.price}₽)` }))}
                    value={selectedAdditives}
                    onChange={setSelectedAdditives}
                    placeholder={language === 'ru' ? 'Выберите Модификаторы' : 'აირჩიეთ მოდიფიკატორები'}
                    searchPlaceholder={language === 'ru' ? 'Поиск добавок...' : 'მოდიფიკატორების ძებნა...'}
                    emptyText={language === 'ru' ? 'Модификаторы не найдены' : 'მოდიფიკატორები ვერ მოიძებნა'}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'ingredients':
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">
                    {language === 'ru' ? 'Ингредиенты продукта' : 'პროდუქტის ინგრედიენტები'}
                  </Label>
                  <div className="space-y-3">
                    {ingredients.map((ingredient, index) => (
                      <IngredientSelect
                        key={index}
                        value={ingredient}
                        onChange={(newValue) => {
                          const newIngredients = [...ingredients]
                          newIngredients[index] = newValue
                          setIngredients(newIngredients)
                        }}
                        onRemove={() => {
                          const newIngredients = [...ingredients]
                          newIngredients.splice(index, 1)
                          setIngredients(newIngredients)
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
                    {language === 'ru' ? 'Добавить ингредиент' : 'ინგრედიენტის დამატება'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )

       case 'seo':
    return (
      <Card>
        <CardContent className="pt-6">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="metaDescription" className="text-sm">
                  {language === 'ru' ? 'Мета описание' : 'მეტა აღწერა'}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => openFullscreenTextarea('metaDescription', formData.metaDescription, language === 'ru' ? 'Мета описание' : 'მეტა აღწერა')}
                >
                  <Maximize2 className="h-3 w-3" />
                  {language === 'ru' ? 'Развернуть' : 'გაფართოება'}
                </Button>
              </div>
              <HtmlTextarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(value: any) => setFormData({...formData, metaDescription: value})}
                placeholder={language === 'ru' 
                  ? 'Мета описание для поисковых систем' 
                  : 'ძებნის სისტემებისთვის მეტა-აღწერა'}
                className="min-h-24 font-mono text-sm"
                language="html"
                showLineNumbers={true}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content" className="text-sm">
                  {language === 'ru' ? 'Контент' : 'კონტენტი'}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => openFullscreenTextarea('content', formData.content, language === 'ru' ? 'Контент' : 'კონტენტი')}
                >
                  <Maximize2 className="h-3 w-3" />
                  {language === 'ru' ? 'Развернуть' : 'გაფართოება'}
                </Button>
              </div>
              <HtmlTextarea
                id="content"
                value={formData.content}
                onChange={(value: any) => setFormData({...formData, content: value})}
                placeholder={language === 'ru' 
                  ? 'Контент страницы продукта' 
                  : 'პროდუქტის გვერდის კონტენტი'}
                className="min-h-32 font-mono text-sm"
                language="html"
                showLineNumbers={true}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen ">
      {/* Навигация */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b supports-backdrop-blur:bg-white/60">
        <div className=" py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              {language === 'ru' ? 'Редактирование продукта' : 'პროდუქტის რედაქტირება'}
            </h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {language === 'ru' ? 'Назад' : 'უკან'}
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {language === 'ru' ? 'Сохранение...' : 'შენახვა...'}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {language === 'ru' ? 'Сохранить' : 'შენახვა'}
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="mt-4">
            <NavigationMenu>
              <NavigationMenuList>
                {sections.map(section => {
                  const Icon = section.icon;
                  return (
                    <NavigationMenuItem key={section.id}>
                      <Button
                        variant="ghost"
                        onClick={() => scrollToSection(section.id)}
                        className={`relative gap-2 transition-all duration-300 ${
                          currentStep === section.id 
                            ? "text-gray-900 bg-gray-100" 
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {section.title[language]}
                        {currentStep === section.id && (
                          <motion.div
                            layoutId="activeSection"
                            className="absolute inset-0 bg-gray-100 rounded-md -z-10"
                            initial={false}
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </Button>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      </nav>


      {/* Основной контент */}
      <div >
        <div className="py-6">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = currentStep === section.id;
            
            return (
              <div
                key={section.id}
                id={section.id}
                className=" pt-8 scroll-mt-30"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-lg ${section.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{section.title[language]}</h2>
                    <p className="text-gray-600">{section.description[language]}</p>
                  </div>
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderStepContent(section.id as FormStep)}
                  </motion.div>
                </AnimatePresence>
                
              </div>
            );
          })}
        </div>
      </div>
<Dialog open={isFullscreenDialogOpen} onOpenChange={setIsFullscreenDialogOpen}>
  <DialogContentExtraWide className="max-w-4xl h-[90vh] flex flex-col p-0">
    <DialogHeader className="p-6 pb-4">
      <DialogTitle className="text-xl flex items-center justify-between">
        <span>
          {language === 'ru' ? 'Редактирование' : 'რედაქტირება'}: {fullscreenTextareaLabel}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1"
          onClick={cancelFullscreenTextarea}
        >
          <Minimize2 className="h-4 w-4" />
          {language === 'ru' ? 'Свернуть' : 'ჩაკეცვა'}
        </Button>
      </DialogTitle>
    </DialogHeader>
    
    {/* Контейнер с flex-1 для заполнения доступного пространства */}
    <div className="flex-1 flex flex-col px-6 pb-6">
      <HtmlTextarea
        value={fullscreenTextareaValue}
        onChange={setFullscreenTextareaValue}
        placeholder={language === 'ru' ? 'Введите текст...' : 'შეიყვანეთ ტექსტი...'}
        className="flex-1 w-full min-h-0 text-base resize-none" // flex-1 и min-h-0 важны
        language="html"
        showLineNumbers={true}
        style={{
          height: '100%',
          maxHeight: 'none' // Убираем любые ограничения по высоте
        }}
      />
    </div>
    
    <div className="flex items-center justify-end gap-2 p-6 pt-0">
      <Button
        type="button"
        variant="outline"
        onClick={cancelFullscreenTextarea}
      >
        {language === 'ru' ? 'Отмена' : 'გაუქმება'}
      </Button>
      <Button
        type="button"
        onClick={saveFullscreenTextarea}
      >
        <CircleCheck className="mr-2 h-4 w-4" />
        {language === 'ru' ? 'Подтвердить' : 'შენახვა'}
      </Button>
    </div>
  </DialogContentExtraWide>
</Dialog>
      
    </div>
  )
}

export default ProductEditPage