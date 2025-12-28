'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  Loader2, X, Plus, Check, ChevronsUpDown, ArrowLeft, ArrowRight, 
  Save, Image as ImageIcon, Tag, Info, Package, DollarSign, Soup, 
  ShoppingBasket, Search, Globe, ChevronRight, Maximize2, CircleCheck, 
  Minimize2, ListCollapse, Calendar, Clock, Users, Hash, Percent, 
  Target, Filter, Timer, Zap, Gift, TrendingDown, Sparkles, Receipt
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DiscountService } from '@/lib/api/discount.service'
import { RestaurantService } from '@/lib/api/restaurant.service'
import { ProductService } from '@/lib/api/product.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import SearchableSelect from '@/components/features/menu/product/SearchableSelect'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguageStore } from '@/lib/stores/language-store'
import { useAuth } from '@/lib/hooks/useAuth'
import { Dialog, DialogContentExtraWide, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { ru, ka } from 'date-fns/locale'

interface Restaurant {
  id: string
  title: string
}

interface Product {
  id: string
  title: string
  price: number
}

interface DiscountDraft {
  // Основное
  title: string
  description?: string
  isActive: boolean
  
  // Тип скидки
  discountType: 'percentage' | 'fixed' | 'free_delivery' | 'N+1'
  targetType: 'order' | 'products' | 'category'
  value: number
  nPlusOne?: {
    buy: number
    get: number
  }
  
  // Товары
  productIds: string[]
  categoryIds: string[]
  
  // Условия
  minOrderAmount?: number
  maxDiscountAmount?: number
  
  // Ограничения
  restaurantIds: string[]
  deliveryZoneIds: string[]
  startDate?: Date
  endDate?: Date
  startTime?: number
  endTime?: number
  daysOfWeek: number[]
  orderTypes: string[]
  
  // Для кого
  audience: 'all' | 'new' | 'segment' | 'personal'
  customerIds?: string[]
  customerSegmentIds?: string[]
  
  // Лимиты
  maxUses?: number
  isOneTimePerCustomer: boolean
  promocode?: string
  
  // Дополнительно
  canCombine: boolean
  priority: number
  isPublic: boolean
}

type DiscountStep = 'basic' | 'type' | 'target' | 'conditions' | 'restrictions' | 'audience' | 'limits' | 'advanced'

const sections = [
  { 
    id: 'basic', 
    title: { ru: 'Основная информация', ka: 'ძირითადი ინფორმაცია' },
    icon: Info,
    color: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    description: { ru: 'Название, описание, статус', ka: 'სახელი, აღწერა, სტატუსი' }
  },
  { 
    id: 'type', 
    title: { ru: 'Тип скидки', ka: 'ფასდაკლების ტიპი' },
    icon: TrendingDown,
    color: 'bg-gradient-to-br from-purple-500 to-pink-400',
    description: { ru: 'Процентная, фиксированная, N+1', ka: 'პროცენტული, ფიქსირებული, N+1' }
  },
  { 
    id: 'target', 
    title: { ru: 'Что скидываем', ka: 'რას ვფასდაკლებთ' },
    icon: Target,
    color: 'bg-gradient-to-br from-amber-500 to-orange-400',
    description: { ru: 'Весь заказ или отдельные товары', ka: 'მთელი შეკვეთა ან ცალკეული პროდუქტები' }
  },
  { 
    id: 'conditions', 
    title: { ru: 'Условия', ka: 'პირობები' },
    icon: Filter,
    color: 'bg-gradient-to-br from-emerald-500 to-green-400',
    description: { ru: 'Минимальная сумма, время, дни', ka: 'მინიმალური თანხა, დრო, დღეები' }
  },
  { 
    id: 'restrictions', 
    title: { ru: 'Где действует', ka: 'სად მოქმედებს' },
    icon: Globe,
    color: 'bg-gradient-to-br from-red-500 to-rose-400',
    description: { ru: 'Рестораны, зоны доставки', ka: 'რესტორნები, მიტანის ზონები' }
  },
  { 
    id: 'audience', 
    title: { ru: 'Для кого', ka: 'ვისთვის' },
    icon: Users,
    color: 'bg-gradient-to-br from-violet-500 to-purple-400',
    description: { ru: 'Все, новые, сегмент', ka: 'ყველა, ახალი, სეგმენტი' }
  },
  { 
    id: 'limits', 
    title: { ru: 'Лимиты', ka: 'ლიმიტები' },
    icon: Hash,
    color: 'bg-gradient-to-br from-gray-600 to-gray-400',
    description: { ru: 'Количество использований, промокод', ka: 'გამოყენებების რაოდენობა, პრომო კოდი' }
  },
  { 
    id: 'advanced', 
    title: { ru: 'Дополнительно', ka: 'დამატებით' },
    icon: Sparkles,
    color: 'bg-gradient-to-br from-cyan-500 to-blue-400',
    description: { ru: 'Приоритет, совместимость', ka: 'პრიორიტეტი, თავსებადობა' }
  },
]

const daysOfWeek = [
  { id: 1, label: { ru: 'Понедельник', ka: 'ორშაბათი' } },
  { id: 2, label: { ru: 'Вторник', ka: 'სამშაბათი' } },
  { id: 3, label: { ru: 'Среда', ka: 'ოთხშაბათი' } },
  { id: 4, label: { ru: 'Четверг', ka: 'ხუთშაბათი' } },
  { id: 5, label: { ru: 'Пятница', ka: 'პარასკევი' } },
  { id: 6, label: { ru: 'Суббота', ka: 'შაბათი' } },
  { id: 0, label: { ru: 'Воскресенье', ka: 'კვირა' } },
]

const orderTypes = [
  { value: 'DINE_IN', label: { ru: 'В зале', ka: 'დარბაზში' } },
  { value: 'TAKEAWAY', label: { ru: 'На вынос', ka: 'აღებისთვის' } },
  { value: 'DELIVERY', label: { ru: 'Доставка', ka: 'მიტანა' } },
  { value: 'BANQUET', label: { ru: 'Банкет', ka: 'ბანკეტი' } },
]

const DiscountConstructorPage = () => {
  const router = useRouter()
  const { language } = useLanguageStore()
  const { user } = useAuth()
  const locale = language === 'ka' ? ka : ru
  
  const [currentStep, setCurrentStep] = useState<DiscountStep>('basic')
  const [isLoading, setIsLoading] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [deliveryZones, setDeliveryZones] = useState<any[]>([])
  
  const [formData, setFormData] = useState<DiscountDraft>({
    title: '',
    description: '',
    isActive: true,
    discountType: 'percentage',
    targetType: 'order',
    value: 10,
    productIds: [],
    categoryIds: [],
    restaurantIds: [],
    deliveryZoneIds: [],
    daysOfWeek: [],
    orderTypes: [],
    audience: 'all',
    canCombine: false,
    priority: 1,
    isPublic: true,
    isOneTimePerCustomer: false,
  })

  useEffect(() => {
    loadData()
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setCurrentStep(entry.target.id as DiscountStep);
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

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [restaurantsData, productsData, categoriesData] = await Promise.all([
        RestaurantService.getAll(),
        ProductService.getAll(),
        RestaurantService.getAll()
      ])
      
      setRestaurants(restaurantsData)
      setProducts(productsData)
      setCategories(categoriesData)
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка загрузки данных' : 'მონაცემების ჩატვირთვის შეცდომა')
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleInputChange = (field: keyof DiscountDraft, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: keyof DiscountDraft, id: string) => {
    setFormData(prev => {
      const currentArray = (prev[field] as string[]) || []
      return {
        ...prev,
        [field]: currentArray.includes(id)
          ? currentArray.filter(item => item !== id)
          : [...currentArray, id]
      }
    })
  }

  const handleDayToggle = (dayId: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(dayId)
        ? prev.daysOfWeek.filter(id => id !== dayId)
        : [...prev.daysOfWeek, dayId]
    }))
  }

  const validateForm = () => {
    const errors = []
    
    if (!formData.title.trim()) {
      errors.push(language === 'ru' ? 'Название скидки обязательно' : 'ფასდაკლების სახელი სავალდებულოა')
    }
    
    if (formData.value <= 0) {
      errors.push(language === 'ru' ? 'Значение скидки должно быть больше 0' : 'ფასდაკლების მნიშვნელობა უნდა იყოს 0-ზე მეტი')
    }
    
    if (formData.restaurantIds.length === 0) {
      errors.push(language === 'ru' ? 'Выберите хотя бы один ресторан' : 'აირჩიეთ ერთი რესტორნი მაინც')
    }
    
    if (formData.targetType === 'products' && formData.productIds.length === 0) {
      errors.push(language === 'ru' ? 'Выберите хотя бы один товар' : 'აირჩიეთ ერთი პროდუქტი მაინც')
    }
    
    if (errors.length > 0) {
      toast.error(errors.join('\n'))
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      const discountData = {
        title: formData.title,
        description: formData.description,
        type: formData.discountType === 'percentage' ? 'PERCENTAGE' : 
              formData.discountType === 'fixed' ? 'FIXED' : 'PERCENTAGE',
        value: formData.value,
        targetType: formData.targetType === 'order' ? 'ALL' : 'PRODUCT',
        minOrderAmount: formData.minOrderAmount,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        isActive: formData.isActive,
        code: formData.promocode,
        maxUses: formData.maxUses,
        restaurantIds: formData.restaurantIds,
        productIds: formData.productIds,
      }
      
      await DiscountService.create(discountData as any)
      toast.success(language === 'ru' ? 'Скидка создана' : 'ფასდაკლება შექმნილია')
      router.back()
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка сохранения' : 'შენახვის შეცდომა')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = (step: DiscountStep) => {
    switch (step) {
      case 'basic':
        return (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm">
                  {language === 'ru' ? 'Название скидки' : 'ფასდაკლების სახელი'} *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  className="text-sm"
                  placeholder={language === 'ru' ? 'Черная пятница' : 'შავი პარასკევი'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm">
                  {language === 'ru' ? 'Описание (для сотрудников)' : 'აღწერა (თანამშრომლებისთვის)'}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="text-sm min-h-[80px] resize-none"
                  placeholder={language === 'ru' ? 'Описание условий скидки...' : 'ფასდაკლების პირობების აღწერა...'}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="isActive" className="text-sm">
                  {language === 'ru' ? 'Активна сразу' : 'დაუყოვნებლივ აქტიური'}
                </Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
              </div>
            </CardContent>
          </Card>
        )

      case 'type':
        return (
          <Card>
            <CardContent className="pt-6 space-y-6">
              <RadioGroup
                value={formData.discountType}
                onValueChange={(value) => handleInputChange('discountType', value)}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="percentage" id="type-percentage" className="peer sr-only" />
                  <Label
                    htmlFor="type-percentage"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Percent className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">
                      {language === 'ru' ? 'Процентная' : 'პროცენტული'}
                    </span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      {language === 'ru' ? 'Скидка в % от суммы' : 'თანხის % ფასდაკლება'}
                    </span>
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="fixed" id="type-fixed" className="peer sr-only" />
                  <Label
                    htmlFor="type-fixed"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <DollarSign className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">
                      {language === 'ru' ? 'Фиксированная' : 'ფიქსირებული'}
                    </span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      {language === 'ru' ? 'Скидка в рублях' : 'ლარებში ფასდაკლება'}
                    </span>
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="N+1" id="type-nplus" className="peer sr-only" />
                  <Label
                    htmlFor="type-nplus"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Gift className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">N+1</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      {language === 'ru' ? '3 по цене 2' : '3 ფასად 2'}
                    </span>
                  </Label>
                </div>

                <div>
                  <RadioGroupItem value="free_delivery" id="type-delivery" className="peer sr-only" />
                  <Label
                    htmlFor="type-delivery"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Receipt className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">
                      {language === 'ru' ? 'Бесплатная доставка' : 'უფასო მიტანა'}
                    </span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      {language === 'ru' ? 'При заказе от суммы' : 'შეკვეთაზე თანხიდან'}
                    </span>
                  </Label>
                </div>
              </RadioGroup>

              {formData.discountType === 'percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="value" className="text-sm">
                    {language === 'ru' ? 'Размер скидки' : 'ფასდაკლების ზომა'} *
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="value"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.value}
                      onChange={(e) => handleInputChange('value', parseFloat(e.target.value))}
                      className="text-sm"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              )}

              {formData.discountType === 'fixed' && (
                <div className="space-y-2">
                  <Label htmlFor="value" className="text-sm">
                    {language === 'ru' ? 'Сумма скидки' : 'ფასდაკლების თანხა'} *
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="value"
                      type="number"
                      min="1"
                      value={formData.value}
                      onChange={(e) => handleInputChange('value', parseFloat(e.target.value))}
                      className="text-sm"
                    />
                    <span className="text-sm text-muted-foreground">₾</span>
                  </div>
                </div>
              )}

              {formData.discountType === 'N+1' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="n-buy" className="text-sm">
                        {language === 'ru' ? 'Купить' : 'ყიდვა'}
                      </Label>
                      <Input
                        id="n-buy"
                        type="number"
                        min="1"
                        value={formData.nPlusOne?.buy || 3}
                        onChange={(e) => handleInputChange('nPlusOne', {
                          ...formData.nPlusOne,
                          buy: parseInt(e.target.value)
                        })}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="n-get" className="text-sm">
                        {language === 'ru' ? 'Получить' : 'მიღება'}
                      </Label>
                      <Input
                        id="n-get"
                        type="number"
                        min="1"
                        value={formData.nPlusOne?.get || 2}
                        onChange={(e) => handleInputChange('nPlusOne', {
                          ...formData.nPlusOne,
                          get: parseInt(e.target.value)
                        })}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm text-center">
                      {language === 'ru' 
                        ? `Клиент покупает ${formData.nPlusOne?.buy || 3} и получает ${formData.nPlusOne?.get || 2}`
                        : `კლიენტი ყიდულობს ${formData.nPlusOne?.buy || 3} და იღებს ${formData.nPlusOne?.get || 2}`}
                    </p>
                  </div>
                </div>
              )}

              {formData.discountType === 'free_delivery' && (
                <div className="space-y-2">
                  <Label htmlFor="minOrderAmount" className="text-sm">
                    {language === 'ru' ? 'Минимальная сумма заказа' : 'მინიმალური შეკვეთის თანხა'}
                  </Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    min="0"
                    value={formData.minOrderAmount || ''}
                    onChange={(e) => handleInputChange('minOrderAmount', parseFloat(e.target.value))}
                    className="text-sm"
                    placeholder={language === 'ru' ? 'например, 1000' : 'მაგალითად, 1000'}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'target':
        return (
          <Card>
            <CardContent className="pt-6 space-y-6">
              <RadioGroup
                value={formData.targetType}
                onValueChange={(value) => handleInputChange('targetType', value)}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="order" id="target-order" />
                  <Label htmlFor="target-order" className="cursor-pointer">
                    <div className="font-medium">{language === 'ru' ? 'Весь заказ' : 'მთელი შეკვეთა'}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ru' ? 'Скидка применяется ко всему заказу' : 'ფასდაკლება ვრცელდება მთელ შეკვეთაზე'}
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="products" id="target-products" />
                  <Label htmlFor="target-products" className="cursor-pointer">
                    <div className="font-medium">{language === 'ru' ? 'Выбранные товары' : 'არჩეული პროდუქტები'}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ru' ? 'Скидка только на конкретные товары' : 'ფასდაკლება მხოლოდ კონკრეტულ პროდუქტებზე'}
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="category" id="target-category" />
                  <Label htmlFor="target-category" className="cursor-pointer">
                    <div className="font-medium">{language === 'ru' ? 'Категория товаров' : 'პროდუქტების კატეგორია'}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ru' ? 'Скидка на все товары в категории' : 'ფასდაკლება კატეგორიაში ყველა პროდუქტზე'}
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {formData.targetType === 'products' && (
                <div className="space-y-2">
                  <Label className="text-sm">
                    {language === 'ru' ? 'Выберите товары' : 'აირჩიეთ პროდუქტები'} *
                  </Label>
                  <SearchableSelect
                    options={products.map(p => ({ id: p.id, label: p.title }))}
                    value={formData.productIds}
                    onChange={(ids) => handleInputChange('productIds', ids)}
                    placeholder={language === 'ru' ? 'Выберите товары' : 'აირჩიეთ პროდუქტები'}
                    searchPlaceholder={language === 'ru' ? 'Поиск товаров...' : 'პროდუქტების ძებნა...'}
                    emptyText={language === 'ru' ? 'Товары не найдены' : 'პროდუქტები ვერ მოიძებნა'}
                  />
                </div>
              )}

              {formData.targetType === 'category' && (
                <div className="space-y-2">
                  <Label className="text-sm">
                    {language === 'ru' ? 'Выберите категории' : 'აირჩიეთ კატეგორიები'} *
                  </Label>
                  <SearchableSelect
                    options={categories.map(c => ({ id: c.id, label: c.title }))}
                    value={formData.categoryIds}
                    onChange={(ids) => handleInputChange('categoryIds', ids)}
                    placeholder={language === 'ru' ? 'Выберите категории' : 'აირჩიეთ კატეგორიები'}
                    searchPlaceholder={language === 'ru' ? 'Поиск категорий...' : 'კატეგორიების ძებნა...'}
                    emptyText={language === 'ru' ? 'Категории не найдены' : 'კატეგორიები ვერ მოიძებნა'}
                  />
                </div>
              )}

              {formData.targetType === 'order' && (
                <div className="space-y-2">
                  <Label htmlFor="minOrderAmount" className="text-sm">
                    {language === 'ru' ? 'Минимальная сумма заказа' : 'მინიმალური შეკვეთის თანხა'}
                  </Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    min="0"
                    value={formData.minOrderAmount || ''}
                    onChange={(e) => handleInputChange('minOrderAmount', parseFloat(e.target.value))}
                    className="text-sm"
                    placeholder={language === 'ru' ? 'например, 1000' : 'მაგალითად, 1000'}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'conditions':
        return (
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <Label className="text-sm">
                  {language === 'ru' ? 'Дни недели' : 'კვირის დღეები'}
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {daysOfWeek.map(day => (
                    <Button
                      key={day.id}
                      type="button"
                      variant={formData.daysOfWeek.includes(day.id) ? "default" : "outline"}
                      size="sm"
                      className="h-9"
                      onClick={() => handleDayToggle(day.id)}
                    >
                      {day.label[language]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-sm">
                    {language === 'ru' ? 'Время начала' : 'დაწყების დრო'}
                  </Label>
                  <Input
                    id="startTime"
                    type="number"
                    min="0"
                    max="23"
                    value={formData.startTime || ''}
                    onChange={(e) => handleInputChange('startTime', parseInt(e.target.value))}
                    className="text-sm"
                    placeholder="0-23"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-sm">
                    {language === 'ru' ? 'Время окончания' : 'დასრულების დრო'}
                  </Label>
                  <Input
                    id="endTime"
                    type="number"
                    min="0"
                    max="23"
                    value={formData.endTime || ''}
                    onChange={(e) => handleInputChange('endTime', parseInt(e.target.value))}
                    className="text-sm"
                    placeholder="0-23"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm">
                  {language === 'ru' ? 'Типы заказов' : 'შეკვეთების ტიპები'}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {orderTypes.map(type => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={formData.orderTypes.includes(type.value) ? "default" : "outline"}
                      size="sm"
                      className="h-9"
                      onClick={() => handleArrayChange('orderTypes', type.value)}
                    >
                      {type.label[language]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-sm">
                    {language === 'ru' ? 'Дата начала' : 'დაწყების თარიღი'}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.startDate ? (
                          format(formData.startDate, "PPP", { locale })
                        ) : (
                          <span>{language === 'ru' ? 'Выберите дату' : 'აირჩიეთ თარიღი'}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => handleInputChange('startDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-sm">
                    {language === 'ru' ? 'Дата окончания' : 'დასრულების თარიღი'}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.endDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.endDate ? (
                          format(formData.endDate, "PPP", { locale })
                        ) : (
                          <span>{language === 'ru' ? 'Выберите дату' : 'აირჩიეთ თარიღი'}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => handleInputChange('endDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'restrictions':
        return (
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-sm">
                  {language === 'ru' ? 'Рестораны' : 'რესტორნები'} *
                </Label>
                <SearchableSelect
                  options={restaurants.map(r => ({ id: r.id, label: r.title }))}
                  value={formData.restaurantIds}
                  onChange={(ids) => handleInputChange('restaurantIds', ids)}
                  placeholder={language === 'ru' ? 'Выберите рестораны' : 'აირჩიეთ რესტორნები'}
                  searchPlaceholder={language === 'ru' ? 'Поиск ресторанов...' : 'რესტორნების ძებნა...'}
                  emptyText={language === 'ru' ? 'Рестораны не найдены' : 'რესტორნები ვერ მოიძებნა'}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">
                  {language === 'ru' ? 'Зоны доставки' : 'მიტანის ზონები'}
                </Label>
                <SearchableSelect
                  options={deliveryZones.map(z => ({ id: z.id, label: z.title }))}
                  value={formData.deliveryZoneIds}
                  onChange={(ids) => handleInputChange('deliveryZoneIds', ids)}
                  placeholder={language === 'ru' ? 'Выберите зоны доставки' : 'აირჩიეთ მიტანის ზონები'}
                  searchPlaceholder={language === 'ru' ? 'Поиск зон...' : 'ზონების ძებნა...'}
                  emptyText={language === 'ru' ? 'Зоны не найдены' : 'ზონები ვერ მოიძებნა'}
                />
              </div>
            </CardContent>
          </Card>
        )

      case 'audience':
        return (
          <Card>
            <CardContent className="pt-6 space-y-6">
              <RadioGroup
                value={formData.audience}
                onValueChange={(value) => handleInputChange('audience', value)}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="audience-all" />
                  <Label htmlFor="audience-all" className="cursor-pointer">
                    <div className="font-medium">{language === 'ru' ? 'Для всех клиентов' : 'ყველა კლიენტისთვის'}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ru' ? 'Скидка доступна всем' : 'ფასდაკლება ყველასთვის ხელმისაწვდომია'}
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="audience-new" />
                  <Label htmlFor="audience-new" className="cursor-pointer">
                    <div className="font-medium">{language === 'ru' ? 'Только для новых' : 'მხოლოდ ახალი'}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ru' ? 'Только для новых клиентов' : 'მხოლოდ ახალი კლიენტებისთვის'}
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="segment" id="audience-segment" />
                  <Label htmlFor="audience-segment" className="cursor-pointer">
                    <div className="font-medium">{language === 'ru' ? 'Для сегмента' : 'სეგმენტისთვის'}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ru' ? 'Для определенной группы клиентов' : 'კონკრეტული კლიენტების ჯგუფისთვის'}
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="personal" id="audience-personal" />
                  <Label htmlFor="audience-personal" className="cursor-pointer">
                    <div className="font-medium">{language === 'ru' ? 'Персональная' : 'პერსონალური'}</div>
                    <div className="text-sm text-muted-foreground">
                      {language === 'ru' ? 'Только для выбранных клиентов' : 'მხოლოდ არჩეული კლიენტებისთვის'}
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        )

      case 'limits':
        return (
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="promocode" className="text-sm">
                  {language === 'ru' ? 'Промокод' : 'პრომო კოდი'}
                </Label>
                <Input
                  id="promocode"
                  value={formData.promocode || ''}
                  onChange={(e) => handleInputChange('promocode', e.target.value)}
                  className="text-sm"
                  placeholder={language === 'ru' ? 'например, SUMMER25' : 'მაგალითად, SUMMER25'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUses" className="text-sm">
                    {language === 'ru' ? 'Макс. использований' : 'მაქს. გამოყენება'}
                  </Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min="0"
                    value={formData.maxUses || ''}
                    onChange={(e) => handleInputChange('maxUses', parseInt(e.target.value))}
                    className="text-sm"
                    placeholder="0 - без ограничений"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDiscountAmount" className="text-sm">
                    {language === 'ru' ? 'Макс. сумма скидки' : 'ფასდაკლების მაქს. თანხა'}
                  </Label>
                  <Input
                    id="maxDiscountAmount"
                    type="number"
                    min="0"
                    value={formData.maxDiscountAmount || ''}
                    onChange={(e) => handleInputChange('maxDiscountAmount', parseFloat(e.target.value))}
                    className="text-sm"
                    placeholder="₾"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isOneTimePerCustomer" className="text-sm">
                  {language === 'ru' ? 'Один раз на клиента' : 'ერთხელ კლიენტზე'}
                </Label>
                <Switch
                  id="isOneTimePerCustomer"
                  checked={formData.isOneTimePerCustomer}
                  onCheckedChange={(checked) => handleInputChange('isOneTimePerCustomer', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isPublic" className="text-sm">
                  {language === 'ru' ? 'Показывать на сайте' : 'საიტზე ჩვენება'}
                </Label>
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                />
              </div>
            </CardContent>
          </Card>
        )

      case 'advanced':
        return (
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm">
                  {language === 'ru' ? 'Приоритет' : 'პრიორიტეტი'}
                </Label>
                <Select
                  value={formData.priority.toString()}
                  onValueChange={(value) => handleInputChange('priority', parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={language === 'ru' ? 'Выберите приоритет' : 'აირჩიეთ პრიორიტეტი'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{language === 'ru' ? 'Высокий' : 'მაღალი'}</SelectItem>
                    <SelectItem value="2">{language === 'ru' ? 'Средний' : 'საშუალო'}</SelectItem>
                    <SelectItem value="3">{language === 'ru' ? 'Низкий' : 'დაბალი'}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' 
                    ? 'Приоритет применяется при нескольких скидках'
                    : 'პრიორიტეტი გამოიყენება რამდენიმე ფასდაკლებისას'}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="canCombine" className="text-sm">
                  {language === 'ru' ? 'Совмещать с другими скидками' : 'სხვა ფასდაკლებებთან კომბინირება'}
                </Label>
                <Switch
                  id="canCombine"
                  checked={formData.canCombine}
                  onCheckedChange={(checked) => handleInputChange('canCombine', checked)}
                />
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen">
      {/* Навигация */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b supports-backdrop-blur:bg-white/60">
        <div className="py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              {language === 'ru' ? 'Конструктор скидок' : 'ფასდაკლების კონსტრუქტორი'}
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
                    {language === 'ru' ? 'Создать скидку' : 'ფასდაკლების შექმნა'}
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
      <div>
        <div className="py-6">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = currentStep === section.id;
            
            return (
              <div
                key={section.id}
                id={section.id}
                className="pt-8 scroll-mt-30"
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
                    {renderStepContent(section.id as DiscountStep)}
                  </motion.div>
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}

export default DiscountConstructorPage