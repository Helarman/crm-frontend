'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, X, Plus, Check, ChevronsUpDown, ArrowLeft, ArrowRight, Save, Image as ImageIcon, Tag, Globe, Layers, Hash, Building, Menu, Eye, EyeOff, FolderOpen, Link, Search, ChevronRight, Expand, Maximize2, Minimize2, CircleCheck, ListCollapse, Info, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CategoryService } from '@/lib/api/category.service'
import { RestaurantService } from '@/lib/api/restaurant.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogContentExtraWide
} from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguageStore } from '@/lib/stores/language-store'
import { useAuth } from '@/lib/hooks/useAuth'
import SearchableSelect from '@/components/features/menu/product/SearchableSelect'
import { Restaurant } from '@/lib/types/restaurant'
import { HtmlTextarea } from '@/components/ui/html-textarea'

type FormStep = 'basic' | 'details' | 'seo' | 'restaurants'

const sections = [
  { 
    id: 'basic', 
    title: { ru: 'Основная информация', ka: 'ძირითადი ინფორმაცია' },
    icon: Info,
    color: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    description: { ru: 'Название, описание, URL', ka: 'სახელი, აღწერა, URL' }
  },
  { 
    id: 'details', 
    title: { ru: 'Детали', ka: 'დეტალები' },
    icon: ListCollapse,
    color: 'bg-gradient-to-br from-purple-500 to-pink-400',
    description: { ru: 'Порядок, родительская категория', ka: 'რიგი, სურათი, მშობელი კატეგორია' }
  },
  { 
    id: 'restaurants', 
    title: { ru: 'Рестораны', ka: 'რესტორნები' },
    icon: Store,
    color: 'bg-gradient-to-br from-emerald-500 to-green-400',
    description: { ru: 'Привязка к ресторанам', ka: 'რესტორნებთან დაკავშირება' }
  },
  { 
    id: 'seo', 
    title: { ru: 'SEO', ka: 'SEO' },
    icon: Globe,
    color: 'bg-gradient-to-br from-gray-600 to-gray-400',
    description: { ru: 'Оптимизация для поиска', ka: 'ოპტიმიზაცია ძიებისთვის' }
  },
];

const STORAGE_KEY = 'selected_network_id'

const CategoryCreatePage = () => {
  const { language } = useLanguageStore()
  const router = useRouter()
  const { user } = useAuth()
  
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<FormStep>('basic')
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
  })

  const [restaurants, setRestaurants] = useState<{ id: string; title: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; title: string }[]>([])
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRestaurantsLoading, setIsRestaurantsLoading] = useState(false)
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  
  // Состояния для полноэкранного редактора
  const [isFullscreenDialogOpen, setIsFullscreenDialogOpen] = useState(false)
  const [fullscreenTextareaValue, setFullscreenTextareaValue] = useState('')
  const [fullscreenTextareaName, setFullscreenTextareaName] = useState('')
  const [fullscreenTextareaLabel, setFullscreenTextareaLabel] = useState('')
  const [fullscreenTextareaLanguage, setFullscreenTextareaLanguage] = useState<'html' | 'text'>('text')

  // Загружаем selectedNetworkId из localStorage при монтировании
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNetworkId = localStorage.getItem(STORAGE_KEY)
      if (savedNetworkId) {
        setSelectedNetworkId(savedNetworkId)
      } else {
        // Если сеть не выбрана, перенаправляем на страницу категорий
        toast.error(language === 'ru' 
          ? 'Сначала выберите сеть' 
          : 'ჯერ აირჩიეთ ქსელი')
        router.push('/categories')
      }
    }
  }, [router, language])

  // Загружаем данные когда selectedNetworkId установлен
  useEffect(() => {
    if (selectedNetworkId) {
      loadData()
    }
  }, [selectedNetworkId])

  useEffect(() => {
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

  const loadRestaurants = async () => {
    if (!selectedNetworkId) return
    
    setIsRestaurantsLoading(true)
    try {
      const userRestaurantsData = await RestaurantService.getByNetwork(selectedNetworkId)
      setRestaurants(userRestaurantsData)
    } catch (error) {
      console.error('Failed to load restaurants', error)
      toast.error(language === 'ru' ? 'Ошибка загрузки ресторанов' : 'რესტორნების ჩატვირთვის შეცდომა')
    } finally {
      setIsRestaurantsLoading(false)
    }
  }

  const loadData = async () => {
    if (!selectedNetworkId) {
      toast.error(language === 'ru' 
        ? 'Сеть не выбрана' 
        : 'ქსელი არ არის არჩეული')
      router.push('/categories')
      return
    }

    setIsLoading(true)
    try {
      await Promise.all([
        loadCategories(),
        loadRestaurants()
      ])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error(language === 'ru' ? 'Ошибка загрузки данных' : 'მონაცემების ჩატვირთვის შეცდომა')
    } finally {
      setIsLoading(false)
    }
  }

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
    })
    setSelectedRestaurants([])
    setCurrentStep('basic')
  }

  const loadCategories = async () => {
    if (!selectedNetworkId) return
    
    setIsCategoriesLoading(true)
    try {
      const data = await CategoryService.getByNetwork(selectedNetworkId)
      setCategories(data as any)
    } catch (error) {
      console.error('Failed to load categories', error)
    } finally {
      setIsCategoriesLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = parseInt(value, 10) || 0
    setFormData({
      ...formData,
      [name]: numValue,
    })
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      title,
      slug: !prev.slug ? generateSlug(title) : prev.slug
    }));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Функция для открытия полноэкранного редактора
  const openFullscreenTextarea = (name: string, value: string, label: string, languageType: 'html' | 'text' = 'text') => {
    setFullscreenTextareaName(name)
    setFullscreenTextareaValue(value)
    setFullscreenTextareaLabel(label)
    setFullscreenTextareaLanguage(languageType)
    setIsFullscreenDialogOpen(true)
  }

  // Функция для сохранения изменений из полноэкранного редактора
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

  const validateForm = () => {
    const errors = []
    
    if (!formData.title.trim()) {
      errors.push(language === 'ru' ? 'Название категории обязательно' : 'კატეგორიის სახელი სავალდებულოა')
    }
    if (!formData.slug.trim()) {
      errors.push(language === 'ru' ? 'URL-адрес обязателен' : 'URL-მისამართი სავალდებულოა')
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.push(language === 'ru' ? 'URL-адрес может содержать только латинские буквы, цифры и дефисы' : 'URL-მისამართს შეიძლება ჰქონდეს მხოლოდ ლათინური ასოები, ციფრები და ტირეები')
    }
    if (selectedRestaurants.length === 0) {
      errors.push(language === 'ru' ? 'Выберите хотя бы один ресторан' : 'აირჩიეთ ერთი რესტორნი მაინც')
    }
    if (formData.order < 0) {
      errors.push(language === 'ru' ? 'Порядок должен быть числом не меньше 0' : 'რიგი უნდა იყოს რიცხვი არანაკლებ 0')
    }
    if (formData.clientOrder < 0) {
      errors.push(language === 'ru' ? 'Порядок для клиентов должен быть числом не меньше 0' : 'კლიენტებისთვის რიგი უნდა იყოს რიცხვი არანაკლებ 0')
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

    if (!selectedNetworkId) {
      toast.error(language === 'ru' 
        ? 'Сеть не выбрана. Выберите сеть на странице категорий' 
        : 'ქსელი არ არის არჩეული. აირჩიეთ ქსელი კატეგორიების გვერდზე')
      router.push('/categories')
      return
    }

    setIsLoading(true)
    try {
      const categoryData = {
        ...formData,
        networkId: selectedNetworkId,
        restaurantIds: selectedRestaurants,
        parentId: formData.parentId === 'null' ? null : formData.parentId,
      }

      const createdCategory = await CategoryService.create(categoryData)
      toast.success(language === 'ru' ? 'Категория создана' : 'კატეგორია შექმნილია')
      router.push(`/menu/categories/${createdCategory.id}/edit`)
    } catch (error: any) {
      console.error('Error saving category:', error)
      
      if (error.response?.status === 409) {
        toast.error(language === 'ru' 
          ? 'Категория с таким URL-адресом уже существует' 
          : 'კატეგორია ამ URL-მისამართით უკვე არსებობს')
      } else if (error.response?.status === 400) {
        toast.error(language === 'ru' 
          ? 'Неверные данные категории' 
          : 'კატეგორიის არასწორი მონაცემები')
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error(language === 'ru' ? 'Ошибка сохранения' : 'შენახვის შეცდომა')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Компонент Textarea с кнопкой развернуть
  const EnhancedTextarea = ({ 
    id, 
    name, 
    value, 
    onChange, 
    label, 
    placeholder, 
    className = '',
    rows = 3,
    required = false,
    languageType = 'text' as 'html' | 'text'
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
    languageType?: 'html' | 'text';
  }) => {
    if (languageType === 'html') {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={id} className="text-sm">
              {label} {required && '*'}
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => openFullscreenTextarea(name, value, label, 'html')}
            >
              <Maximize2 className="h-3 w-3" />
              {language === 'ru' ? 'Развернуть' : 'გაფართოება'}
            </Button>
          </div>
          <HtmlTextarea
            id={id}
            value={value}
            onChange={(val: any) => {
              const event = {
                target: { name, value: val }
              } as React.ChangeEvent<HTMLTextAreaElement>;
              onChange(event);
            }}
            className={`min-h-24 font-mono text-sm ${className}`}
            placeholder={placeholder}
            language="html"
            showLineNumbers={true}
          />
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-sm">
            {label} {required && '*'}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => openFullscreenTextarea(name, value, label, 'text')}
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
                    onChange={handleTitleChange}
                    required
                    className="text-sm"
                    placeholder={language === 'ru' ? 'Например: Пицца' : 'მაგ: პიცა'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm">
                    {language === 'ru' ? 'URL-адрес (slug)' : 'URL-მისამართი (slug)'} *
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

                <EnhancedTextarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  label={language === 'ru' ? 'Описание' : 'აღწერა'}
                  placeholder={language === 'ru' ? 'Краткое описание категории' : 'კატეგორიის მოკლე აღწერა'}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )

      case 'details':
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="parentId" className="text-sm">
                    {language === 'ru' ? 'Родительская категория' : 'მშობელი კატეგორია'}
                  </Label>
                  {isCategoriesLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <SearchableSelect
                      options={[
                        { id: 'null', label: language === 'ru' ? 'Нет (основная категория)' : 'არა (მთავარი კატეგორია)' },
                        ...categories.map(category => ({
                          id: category.id,
                          label: category.title
                        }))
                      ]}
                      value={formData.parentId ? [formData.parentId] : ['null']}
                      onChange={([id]) => setFormData({...formData, parentId: id === 'null' ? null : id})}
                      placeholder={language === 'ru' ? 'Выберите категорию' : 'აირჩიეთ კატეგორია'}
                      searchPlaceholder={language === 'ru' ? 'Поиск категорий...' : 'კატეგორიების ძებნა...'}
                      emptyText={language === 'ru' ? 'Категории не найдены' : 'კატეგორიები ვერ მოიძებნა'}
                      multiple={false}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="order" className="text-sm">
                      {language === 'ru' ? 'Порядок сортировки (админка)' : 'დალაგების თანმიმდევრობა (ადმინი)'}
                    </Label>
                    <Input
                      id="order"
                      name="order"
                      type="number"
                      min="0"
                      value={formData.order}
                      onChange={handleNumberInputChange}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientOrder" className="text-sm">
                      {language === 'ru' ? 'Порядок сортировки (клиент)' : 'დალაგების თანმიმდევრობა (კლიენტი)'}
                    </Label>
                    <Input
                      id="clientOrder"
                      name="clientOrder"
                      type="number"
                      min="0"
                      value={formData.clientOrder}
                      onChange={handleNumberInputChange}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image" className="text-sm">
                    {language === 'ru' ? 'Изображение (URL)' : 'სურათი (URL)'}
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
                  <div className="space-y-2">
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
            </CardContent>
          </Card>
        )

      case 'restaurants':
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">
                    {language === 'ru' ? 'Рестораны' : 'რესტორნები'} *
                  </Label>
                  {isRestaurantsLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <SearchableSelect
                      options={restaurants.map(r => ({ id: r.id, label: r.title }))}
                      value={selectedRestaurants}
                      onChange={setSelectedRestaurants}
                      placeholder={language === 'ru' ? 'Выберите рестораны' : 'აირჩიეთ რესტორნები'}
                      searchPlaceholder={language === 'ru' ? 'Поиск ресторанов...' : 'რესტორნების ძებნა...'}
                      emptyText={language === 'ru' ? 'Рестораны не найдены' : 'რესტორნები ვერ მოიძებნა'}
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' 
                      ? 'Выберите хотя бы один ресторан'
                      : 'აირჩიეთ მინიმუმ ერთი რესტორანი'}
                  </p>
                </div>

                {selectedRestaurants.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">
                      {language === 'ru' ? 'Выбранные рестораны' : 'არჩეული რესტორნები'}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedRestaurants.map(restaurantId => {
                        const restaurant = restaurants.find(r => r.id === restaurantId)
                        return restaurant ? (
                          <Badge key={restaurantId} variant="secondary" className="gap-1">
                            <Building className="h-3 w-3" />
                            {restaurant.title}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
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
                  <Label htmlFor="metaTitle" className="text-sm">
                    {language === 'ru' ? 'Мета-заголовок' : 'მეტა-სათაური'}
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
                
                <EnhancedTextarea
                  id="metaDescription"
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  label={language === 'ru' ? 'Мета-описание' : 'მეტა-აღწერა'}
                  placeholder={language === 'ru' 
                    ? 'Мета-описание для поисковых систем' 
                    : 'ძებნის სისტემებისთვის მეტა-აღწერა'}
                  rows={3}
                  languageType="html"
                />
                
                <EnhancedTextarea
                  id="metaKeywords"
                  name="metaKeywords"
                  value={formData.metaKeywords}
                  onChange={handleInputChange}
                  label={language === 'ru' ? 'Мета-ключевые слова' : 'მეტა-გასაღები სიტყვები'}
                  placeholder={language === 'ru' 
                    ? 'Ключевые слова через запятую' 
                    : 'გასაღები სიტყვები მძიმით გამოყოფილი'}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  if (!selectedNetworkId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Навигация */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b supports-backdrop-blur:bg-white/60">
        <div className="py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              {language === 'ru' ? 'Создание категории' : 'კატეგორიის შექმნა'}
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
                    {language === 'ru' ? 'Создание...' : 'შექმნა...'}
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {language === 'ru' ? 'Создать категорию' : 'კატეგორიის შექმნა'}
                  </>
                )}
              </Button>
            </div>
          </div>
          
           <div className="mt-4 hidden md:flex">
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
                    {renderStepContent(section.id as FormStep)}
                  </motion.div>
                </AnimatePresence>
                
              </div>
            );
          })}
        </div>
      </div>

      {/* Диалог полноэкранного редактора */}
      <Dialog open={isFullscreenDialogOpen} onOpenChange={setIsFullscreenDialogOpen}>
        <DialogContentExtraWide className="max-w-4xl h-[90vh] p-0 grid grid-rows-[auto_1fr_auto]">
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
          
          {/* Grid row с min-height: 0 для правильного сжатия */}
          <div className="px-6 min-h-0">
            {fullscreenTextareaLanguage === 'html' ? (
              <HtmlTextarea
                value={fullscreenTextareaValue}
                onChange={setFullscreenTextareaValue}
                placeholder={language === 'ru' ? 'Введите текст...' : 'შეიყვანეთ ტექსტი...'}
                className="h-full w-full text-base"
                language="html"
                showLineNumbers={true}
              />
            ) : (
              <Textarea
                value={fullscreenTextareaValue}
                onChange={(e) => setFullscreenTextareaValue(e.target.value)}
                className="h-full w-full text-base resize-none"
                placeholder={language === 'ru' ? 'Введите текст...' : 'შეიყვანეთ ტექსტი...'}
              />
            )}
          </div>
          
          <div className="flex items-center justify-end gap-2 p-6 pt-4">
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

export default CategoryCreatePage