  'use client'

  import { useState, useEffect } from 'react'
  import { useRouter } from 'next/navigation'
  import { toast } from 'sonner'
  import { Loader2, X, Plus, Check, ChevronsUpDown, ArrowLeft, ArrowRight, Save, Image as ImageIcon, Tag, Info, Package, DollarSign, Soup, ShoppingBasket, Search, Globe, ChevronRight, Maximize2, CircleCheck, Minimize2, ListCollapse, Layers, Boxes, Copy, Trash2, GripVertical } from 'lucide-react'
  import { cn } from '@/lib/utils'
  import { ProductService } from '@/lib/api/product.service'
  import { AdditiveService } from '@/lib/api/additive.service'
  import { RestaurantService } from '@/lib/api/restaurant.service'
  import { CategoryService } from '@/lib/api/category.service'
  import { WorkshopService } from '@/lib/api/workshop.service'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { Badge } from '@/components/ui/badge'
  import { Switch } from '@/components/ui/switch'
  import { Textarea } from '@/components/ui/textarea'
  import { ImageUploader } from '@/components/features/menu/product/ImageUploader'
  import SearchableSelect from '@/components/features/menu/product/SearchableSelect'
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
  import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from '@/components/ui/navigation-menu'
  import { ScrollArea } from '@/components/ui/scroll-area'
  import { motion, AnimatePresence } from 'framer-motion'
  import { useLanguageStore } from '@/lib/stores/language-store'
  import { HtmlTextarea } from '@/components/ui/html-textarea'
  import { Dialog, DialogContent, DialogContentExtraWide, DialogHeader, DialogTitle } from '@/components/ui/dialog'
  import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
  import { Checkbox } from '@/components/ui/checkbox'
  import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
  import { Separator } from '@/components/ui/separator'

  // Типы для комбо
  enum ComboItemType {
    STATIC = 'STATIC',
    CHOICE = 'CHOICE',
    OPTIONAL = 'OPTIONAL'
  }

  interface ComboItemProduct {
    productId: string
    quantity?: number
    additionalPrice?: number
    allowMultiple?: boolean
    maxQuantity?: number
    sortOrder?: number
  }

  interface ComboItem {
    id: string
    type: ComboItemType
    minSelect?: number
    maxSelect?: number
    groupName?: string
    sortOrder: number
    products: ComboItemProduct[]
  }

  interface RestaurantPrice {
    restaurantId: string
    price: number
    isStopList: boolean
  }

  interface Workshop {
    id: string
    name: string
  }

  interface Product {
    id: string
    title: string
    price: number
    images: string[]
    category?: {
      id: string
      title: string
    }
    isCombo?: boolean
  }

  type FormStep = 'basic' | 'items' | 'details' | 'images' | 'additives' | 'prices' | 'seo'

  const sections = [
    { 
      id: 'basic', 
      title: { ru: 'Основная информация', ka: 'ძირითადი ინფორმაცია' },
      icon: Info,
      color: 'bg-gradient-to-br from-blue-500 to-cyan-400',
      description: { ru: 'Название, описание, цена', ka: 'სახელი, აღწერა, ფასი' }
    },
    { 
      id: 'items', 
      title: { ru: 'Элементы комбо', ka: 'კომბოს ელემენტები' },
      icon: Layers,
      color: 'bg-gradient-to-br from-emerald-500 to-green-400',
      description: { ru: 'Настройка состава комбо', ka: 'კომბოს შემადგენლობის კონფიგურაცია' }
    },
    { 
      id: 'details', 
      title: { ru: 'Детали', ka: 'დეტალები' },
      icon: ListCollapse,
      color: 'bg-gradient-to-br from-purple-500 to-pink-400',
      description: { ru: 'Настройки и параметры', ka: 'პარამეტრები' }
    },
    { 
      id: 'images', 
      title: { ru: 'Изображения', ka: 'სურათები' },
      icon: ImageIcon,
      color: 'bg-gradient-to-br from-amber-500 to-orange-400',
      description: { ru: 'Фотографии комбо', ka: 'კომბოს ფოტოები' }
    },
    { 
      id: 'additives', 
      title: { ru: 'Модификаторы', ka: 'მოდიფიკატორები' },
      icon: Plus,
      color: 'bg-gradient-to-br from-violet-500 to-purple-400',
      description: { ru: 'Дополнительные ингредиенты', ka: 'დამატებითი ინგრედიენტები' }
    },
    { 
      id: 'prices', 
      title: { ru: 'Цены', ka: 'ფასები' },
      icon: DollarSign,
      color: 'bg-gradient-to-br from-red-500 to-rose-400',
      description: { ru: 'Цены в ресторанах', ka: 'ფასები რესტორნებში' }
    },
    { 
      id: 'seo', 
      title: { ru: 'SEO', ka: 'SEO' },
      icon: Globe,
      color: 'bg-gradient-to-br from-gray-600 to-gray-400',
      description: { ru: 'Оптимизация для поиска', ka: 'ოპტიმიზაცია ძიებისთვის' }
    },
  ]

  const STORAGE_KEY = 'selected_network_id'

  const ComboCreatePage = () => {
    const { language } = useLanguageStore()
    const router = useRouter()
    const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false)
    const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null)
    const [currentStep, setCurrentStep] = useState<FormStep>('basic')
    const [formData, setFormData] = useState({
      title: '',
      description: '',
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
      networkId: '',
    })

    // Состояние для элементов комбо
    const [comboItems, setComboItems] = useState<ComboItem[]>([
      {
        id: crypto.randomUUID(),
        type: ComboItemType.STATIC,
        minSelect: 1,
        maxSelect: 1,
        groupName: '',
        sortOrder: 0,
        products: []
      }
    ])

    const [selectedAdditives, setSelectedAdditives] = useState<string[]>([])
    const [additives, setAdditives] = useState<{ id: string; title: string; price: number }[]>([])
    const [userRestaurants, setUserRestaurants] = useState<{ id: string; title: string }[]>([])
    const [categories, setCategories] = useState<{ id: string; title: string }[]>([])
    const [workshops, setWorkshops] = useState<Workshop[]>([])
    const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([])
    const [restaurantPrices, setRestaurantPrices] = useState<RestaurantPrice[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isAdditivesLoading, setIsAdditivesLoading] = useState(false)
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(false)
    const [isRestaurantsLoading, setIsRestaurantsLoading] = useState(false)
    const [isWorkshopsLoading, setIsWorkshopsLoading] = useState(false)
    const [selectedWorkshops, setSelectedWorkshops] = useState<string[]>([])
    const [isScrolling, setIsScrolling] = useState(false)
    const [isFullscreenDialogOpen, setIsFullscreenDialogOpen] = useState(false)
    const [fullscreenTextareaValue, setFullscreenTextareaValue] = useState('')
    const [fullscreenTextareaName, setFullscreenTextareaName] = useState('')
    const [fullscreenTextareaLabel, setFullscreenTextareaLabel] = useState('')

    // Состояния для выбора продуктов
    const [availableProducts, setAvailableProducts] = useState<Product[]>([])
    const [isProductsLoading, setIsProductsLoading] = useState(false)
    const [productSearchTerm, setProductSearchTerm] = useState('')
    const [selectedItemForProducts, setSelectedItemForProducts] = useState<string | null>(null)
    const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false)

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

    const cancelFullscreenTextarea = () => {
      setIsFullscreenDialogOpen(false)
    }

    const flattenCategories = (categoriesData: any[]): { id: string; title: string; }[] => {
      let result: { id: string; title: string }[] = []

      categoriesData.forEach(category => {
        result.push({
          id: category.id,
          title: category.title,
        })

        if (category.children && category.children.length > 0) {
          result = result.concat(flattenCategories(category.children))
        }
      })

      return result
    }

    // Загружаем selectedNetworkId из localStorage при монтировании
    useEffect(() => {
      if (typeof window !== 'undefined') {
        const savedNetworkId = localStorage.getItem(STORAGE_KEY)
        if (savedNetworkId) {
          setSelectedNetworkId(savedNetworkId)
          setFormData(prev => ({
            ...prev,
            networkId: savedNetworkId
          }))
        } else {
          toast.error(language === 'ru' 
            ? 'Сначала выберите сеть' 
            : 'ჯერ აირჩიეთ ქსელი')
          router.push('/menu?tab=products')
        }
      }
    }, [router, language])

    // Загружаем данные когда selectedNetworkId установлен
    useEffect(() => {
      if (selectedNetworkId) {
        loadData()
      }
    }, [selectedNetworkId])

    // Загружаем продукты для выбора в комбо
    useEffect(() => {
      if (selectedNetworkId) {
        loadAvailableProducts()
      }
    }, [selectedNetworkId])

    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setCurrentStep(entry.target.id as FormStep)
            }
          })
        },
        {
          root: null,
          rootMargin: '-40% 0px -40% 0px',
          threshold: 0
        }
      )

      sections.forEach(section => {
        const element = document.getElementById(section.id)
        if (element) {
          observer.observe(element)
        }
      })

      return () => {
        observer.disconnect()
      }
    }, [])

    const scrollToSection = (id: string) => {
      setIsScrolling(true)
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        })
      }
      setTimeout(() => setIsScrolling(false), 1000)
    }

    const loadData = async () => {
      if (!selectedNetworkId) {
        toast.error(language === 'ru' 
          ? 'Сеть не выбрана' 
          : 'ქსელი არ არის არჩეული')
        router.push('/menu?tab=products')
        return
      }

      setIsLoading(true)
      try {
        await Promise.all([
          loadCategories(),
          loadRestaurants(),
          loadWorkshops(),
          loadAdditives()
        ])
      } catch (error) {
        console.error('Failed to load data:', error)
        toast.error(language === 'ru' ? 'Ошибка загрузки данных' : 'მონაცემების ჩატვირთვის შეცდომა')
      } finally {
        setIsLoading(false)
      }
    }

    const loadAvailableProducts = async () => {
      if (!selectedNetworkId) return
      
      setIsProductsLoading(true)
      try {
        // Загружаем все продукты сети, исключая комбо
        const products = await ProductService.getByNetwork(selectedNetworkId)
        // Фильтруем только обычные продукты (не комбо)
        const nonComboProducts = products.filter((p: any) => !p.isCombo)
        setAvailableProducts(nonComboProducts)
      } catch (error) {
        console.error('Failed to load products:', error)
        toast.error(language === 'ru' ? 'Ошибка загрузки продуктов' : 'პროდუქტების ჩატვირთვის შეცდომა')
      } finally {
        setIsProductsLoading(false)
      }
    }

    const loadWorkshops = async () => {
      if (!selectedNetworkId) return
      
      setIsWorkshopsLoading(true)
      try {
        const data = await WorkshopService.getByNetworkId(selectedNetworkId)
        setWorkshops(data)
      } catch (error) {
        console.error('Failed to load workshops', error)
        toast.error(language === 'ru' ? 'Ошибка загрузки цехов' : 'სახელოსნოების ჩატვირთვის შეცდომა')
      } finally {
        setIsWorkshopsLoading(false)
      }
    }

    const loadRestaurants = async () => {
      if (!selectedNetworkId) return
      
      setIsRestaurantsLoading(true)
      try {
        const userRestaurantsData = await RestaurantService.getByNetwork(selectedNetworkId)
        setUserRestaurants(userRestaurantsData)
      } catch (error) {
        console.error('Failed to load restaurants', error)
        toast.error(language === 'ru' ? 'Ошибка загрузки ресторанов' : 'რესტორნების ჩატვირთვის შეცდომა')
      } finally {
        setIsRestaurantsLoading(false)
      }
    }

    const loadCategories = async () => {
      setIsCategoriesLoading(true)
      try {
        const data = await CategoryService.getByNetwork(selectedNetworkId as string)
        const flattenedCategories = flattenCategories(data)
        setCategories(flattenedCategories)
      } catch (error) {
        console.error('Failed to load categories', error)
      } finally {
        setIsCategoriesLoading(false)
      }
    }

    const loadAdditives = async () => {
      setIsAdditivesLoading(true)
      try {
        const data = await AdditiveService.getByNetwork(selectedNetworkId as string)
        setAdditives(data as any)
      } catch (error) {
        console.error('Failed to load additives', error)
        toast.error(language === 'ru' ? 'Ошибка загрузки модификаторов' : 'მოდიფიკატორების ჩატვირთვის შეცდომა')
      } finally {
        setIsAdditivesLoading(false)
      }
    }

    const resetForm = () => {
      setFormData({
        title: '',
        description: '',
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
        networkId: selectedNetworkId || '',
      })
      setComboItems([{
        id: crypto.randomUUID(),
        type: ComboItemType.STATIC,
        minSelect: 1,
        maxSelect: 1,
        groupName: '',
        sortOrder: 0,
        products: []
      }])
      setSelectedAdditives([])
      setSelectedRestaurants([])
      setRestaurantPrices([])
      setCurrentStep('basic')
      setSelectedWorkshops([])
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

    const handleRestaurantsChange = (selectedIds: string[]) => {
      const added = selectedIds.filter(id => !selectedRestaurants.includes(id))
      const removed = selectedRestaurants.filter(id => !selectedIds.includes(id))

      setSelectedRestaurants(selectedIds)

      setRestaurantPrices(prev => {
        let updated = prev.filter(rp => !removed.includes(rp.restaurantId))
        
        added.forEach(restaurantId => {
          if (!updated.some(rp => rp.restaurantId === restaurantId)) {
            updated.push({
              restaurantId,
              price: formData.price,
              isStopList: false
            })
          }
        })
        
        return updated
      })
    }

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

  const addComboItem = (type: ComboItemType) => {
    const newItem: ComboItem = {
      id: crypto.randomUUID(),
      type: type,
      minSelect: type === ComboItemType.CHOICE ? 1 : undefined,
      maxSelect: type === ComboItemType.CHOICE ? 1 : undefined,
      groupName: '',
      sortOrder: comboItems.length,
      products: []
    }
    setComboItems([...comboItems, newItem])
  }

    const removeComboItem = (itemId: string) => {
      if (comboItems.length === 1) {
        toast.error(language === 'ru' ? 'Должен быть хотя бы один элемент' : 'უნდა იყოს მინიმუმ ერთი ელემენტი')
        return
      }
      setComboItems(comboItems.filter(item => item.id !== itemId))
    }

    const updateComboItem = (itemId: string, updates: Partial<ComboItem>) => {
      setComboItems(comboItems.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ))
    }

    const addProductToItem = (itemId: string, productId: string) => {
      const item = comboItems.find(i => i.id === itemId)
      if (!item) return

      // Проверяем, не добавлен ли уже этот продукт
      if (item.products.some(p => p.productId === productId)) {
        toast.error(language === 'ru' ? 'Продукт уже добавлен' : 'პროდუქტი უკვე დამატებულია')
        return
      }

      const product = availableProducts.find(p => p.id === productId)
      if (!product) return

      const newProduct: ComboItemProduct = {
        productId,
        quantity: 1,
        additionalPrice: 0,
        allowMultiple: false,
        maxQuantity: undefined,
        sortOrder: item.products.length
      }

      updateComboItem(itemId, {
        products: [...item.products, newProduct]
      })
    }

    const removeProductFromItem = (itemId: string, productId: string) => {
      const item = comboItems.find(i => i.id === itemId)
      if (!item) return

      updateComboItem(itemId, {
        products: item.products.filter(p => p.productId !== productId)
      })
    }

    const updateProductInItem = (itemId: string, productId: string, updates: Partial<ComboItemProduct>) => {
      const item = comboItems.find(i => i.id === itemId)
      if (!item) return

      updateComboItem(itemId, {
        products: item.products.map(p => 
          p.productId === productId ? { ...p, ...updates } : p
        )
      })
    }

    const moveItemUp = (index: number) => {
      if (index === 0) return
      const newItems = [...comboItems]
      ;[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]
      newItems.forEach((item, idx) => { item.sortOrder = idx })
      setComboItems(newItems)
    }

    const moveItemDown = (index: number) => {
      if (index === comboItems.length - 1) return
      const newItems = [...comboItems]
      ;[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]
      newItems.forEach((item, idx) => { item.sortOrder = idx })
      setComboItems(newItems)
    }

    const duplicateItem = (itemId: string) => {
      const item = comboItems.find(i => i.id === itemId)
      if (!item) return

      const newItem: ComboItem = {
        ...item,
        id: crypto.randomUUID(),
        sortOrder: comboItems.length,
        products: item.products.map(p => ({ ...p }))
      }
      setComboItems([...comboItems, newItem])
    }

    const openProductSelector = (itemId: string) => {
      setSelectedItemForProducts(itemId)
      setIsProductSelectorOpen(true)
    }

    // Фильтрация продуктов по поиску
    const filteredProducts = availableProducts.filter(product => 
      product.title.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.category?.title.toLowerCase().includes(productSearchTerm.toLowerCase())
    )

    const getProductDetails = (productId: string) => {
      return availableProducts.find(p => p.id === productId)
    }

    const validateForm = () => {
      const errors = []
      
      if (!formData.title.trim()) {
        errors.push(language === 'ru' ? 'Название комбо обязательно' : 'კომბოს სახელი სავალდებულოა')
      }
      if (!formData.categoryId) {
        errors.push(language === 'ru' ? 'Выберите категорию' : 'აირჩიეთ კატეგორია')
      }
      if (formData.price <= 0) {
        errors.push(language === 'ru' ? 'Цена должна быть больше 0' : 'ფასი უნდა იყოს 0-ზე მეტი')
      }
      
      // Валидация элементов комбо
      for (const item of comboItems) {
        if (item.products.length === 0) {
          errors.push(language === 'ru' 
            ? `Элемент "${item.groupName || 'Без названия'}" не содержит продуктов` 
            : `ელემენტი "${item.groupName || 'უსახელო'}" არ შეიცავს პროდუქტებს`)
        }

        switch (item.type) {
          case ComboItemType.CHOICE:
            if (!item.minSelect || !item.maxSelect) {
              errors.push(language === 'ru' 
                ? `Для элемента выбора "${item.groupName}" укажите min и max выбор` 
                : `არჩევის ელემენტისთვის "${item.groupName}" მიუთითეთ min და max არჩევა`)
            }
            if (item.minSelect && item.maxSelect && item.minSelect > item.maxSelect) {
              errors.push(language === 'ru' 
                ? `minSelect не может быть больше maxSelect в элементе "${item.groupName}"` 
                : `minSelect არ შეიძლება იყოს maxSelect-ზე მეტი ელემენტში "${item.groupName}"`)
            }
            if (item.minSelect && item.products.length < item.minSelect) {
              errors.push(language === 'ru' 
                ? `В элементе выбора "${item.groupName}" должно быть минимум ${item.minSelect} продуктов` 
                : `არჩევის ელემენტში "${item.groupName}" უნდა იყოს მინიმუმ ${item.minSelect} პროდუქტი`)
            }
            break

          case ComboItemType.STATIC:
            // Проверяем, что все статичные продукты имеют количество
            for (const product of item.products) {
              if (!product.quantity || product.quantity < 1) {
                const productDetails = getProductDetails(product.productId)
                errors.push(language === 'ru' 
                  ? `Укажите количество для продукта "${productDetails?.title}"` 
                  : `მიუთითეთ რაოდენობა პროდუქტისთვის "${productDetails?.title}"`)
              }
            }
            break
        }

        // Проверяем настройки для продуктов с allowMultiple
        for (const product of item.products) {
          if (product.allowMultiple && (!product.maxQuantity || product.maxQuantity < 1)) {
            const productDetails = getProductDetails(product.productId)
            errors.push(language === 'ru' 
              ? `Для продукта "${productDetails?.title}" укажите максимальное количество` 
              : `პროდუქტისთვის "${productDetails?.title}" მიუთითეთ მაქსიმალური რაოდენობა`)
          }
        }
      }

      if (!selectedNetworkId) {
        errors.push(language === 'ru' ? 'Сеть не определена' : 'ქსელი არ არის განსაზღვრული')
      }
      if (selectedRestaurants.length === 0) {
        errors.push(language === 'ru' ? 'Выберите хотя бы один ресторан' : 'აირჩიეთ ერთი რესტორნი მაინც')
      }
      
      if (errors.length > 0) {
        toast.error(errors.join('\n'))
        return false
      }
      return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
        
      if (!selectedNetworkId) {
        toast.error(language === 'ru' 
          ? 'Сеть не выбрана. Выберите сеть на странице продуктов' 
          : 'ქსელი არ არის არჩეული. აირჩიეთ ქსელი პროდუქტების გვერდზე')
        router.push('/menu?tab=products')
        return
      }
      
      if (!validateForm()) return

      setIsSaving(true)

      try {
        // Формируем элементы комбо для отправки
        const items = comboItems.map(item => ({
          type: item.type,
          minSelect: item.type === ComboItemType.CHOICE ? item.minSelect : undefined,
          maxSelect: item.type === ComboItemType.CHOICE ? item.maxSelect : undefined,
          groupName: item.groupName || undefined,
          sortOrder: item.sortOrder,
          products: item.products.map(p => ({
            productId: p.productId,
            quantity: p.quantity,
            additionalPrice: p.additionalPrice || 0,
            allowMultiple: p.allowMultiple || false,
            maxQuantity: p.maxQuantity,
            sortOrder: p.sortOrder
          }))
        }))

        const comboData = {
          title: formData.title,
          description: formData.description || '',
          price: formData.price,
          items,
          categoryId: formData.categoryId,
          networkId: selectedNetworkId,
          workshopIds: selectedWorkshops,
          additives: selectedAdditives,
          images: formData.images.filter(img => img.trim()),
        }

        console.log('Sending combo data:', JSON.stringify(comboData, null, 2))

        // Создаем комбо
        const createdCombo = await ProductService.createCombo(comboData)

        toast.success(language === 'ru' ? 'Комбо создано' : 'კომბო შექმნილია')
        router.push(`/menu`)
      } catch (error) {
        console.error('Error creating combo:', error)
        toast.error(language === 'ru' ? 'Ошибка создания комбо' : 'კომბოს შექმნის შეცდომა')
      } finally {
        setIsSaving(false)
      }
    }
  // Диалог выбора типа элемента комбо
  const AddItemDialog = ({ 
    open, 
    onOpenChange, 
    onConfirm 
  }: { 
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (type: ComboItemType) => void
  }) => {
    const { language } = useLanguageStore()
    const [selectedType, setSelectedType] = useState<ComboItemType>(ComboItemType.STATIC)

    const itemTypes = [
      {
        type: ComboItemType.STATIC,
        title: { ru: 'Статичный', ka: 'სტატიკური' },
        description: { 
          ru: 'Один продукт в заданном количестве, всегда входит в комбо', 
          ka: 'ერთი პროდუქტი განსაზღვრული რაოდენობით, ყოველთვის შედის კომბოში' 
        },
        icon: Package,
        color: 'blue'
      },
      {
        type: ComboItemType.CHOICE,
        title: { ru: 'На выбор', ka: 'არჩევანი' },
        description: { 
          ru: 'Гость может выбрать несколько продуктов из списка', 
          ka: 'სტუმარს შეუძლია აირჩიოს რამდენიმე პროდუქტი სიიდან' 
        },
        icon: Layers,
        color: 'amber'
      },
      {
        type: ComboItemType.OPTIONAL,
        title: { ru: 'Опциональный', ka: 'ოფციონალური' },
        description: { 
          ru: 'Гость может добавить продукт за дополнительную плату', 
          ka: 'სტუმარს შეუძლია დაამატოს პროდუქტი დამატებითი საფასურით' 
        },
        icon: Plus,
        color: 'purple'
      }
    ]

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === 'ru' ? 'Выберите тип элемента' : 'აირჩიეთ ელემენტის ტიპი'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            {itemTypes.map((itemType) => {
              const Icon = itemType.icon
              const isSelected = selectedType === itemType.type
              
              return (
                <div
                  key={itemType.type}
                  className={cn(
                    "relative flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                    isSelected 
                      ? `border-${itemType.color}-500 bg-${itemType.color}-50` 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => setSelectedType(itemType.type)}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    `bg-${itemType.color}-100`
                  )}>
                    <Icon className={cn("h-5 w-5", `text-${itemType.color}-600`)} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{itemType.title[language]}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {itemType.description[language]}
                    </p>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    isSelected 
                      ? `border-${itemType.color}-500 bg-${itemType.color}-500` 
                      : "border-gray-300"
                  )}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {language === 'ru' ? 'Отмена' : 'გაუქმება'}
            </Button>
            <Button
              type="button"
              onClick={() => {
                onConfirm(selectedType)
                onOpenChange(false)
              }}
            >
              {language === 'ru' ? 'Добавить' : 'დამატება'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  const renderComboItem = (item: ComboItem, index: number) => {
    const itemTypeLabels = {
      [ComboItemType.STATIC]: { ru: 'Статичный', ka: 'სტატიკური' },
      [ComboItemType.CHOICE]: { ru: 'На выбор', ka: 'არჩევანი' },
      [ComboItemType.OPTIONAL]: { ru: 'Опциональный', ka: 'ოფციონალური' }
    }

    // Цветовые схемы для типов
    const typeColors = {
      [ComboItemType.STATIC]: 'bg-blue-50 text-blue-700 border-blue-200',
      [ComboItemType.CHOICE]: 'bg-amber-50 text-amber-700 border-amber-200',
      [ComboItemType.OPTIONAL]: 'bg-purple-50 text-purple-700 border-purple-200'
    }

    const isStaticOrOptional = item.type === ComboItemType.STATIC || item.type === ComboItemType.OPTIONAL

    return (
      <Card 
        key={item.id} 
        className="relative border hover:shadow-md transition-all duration-200 overflow-hidden"
      >
        {/* Цветная полоса типа */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
          item.type === ComboItemType.STATIC ? 'bg-blue-500' :
          item.type === ComboItemType.CHOICE ? 'bg-amber-500' : 'bg-purple-500'
        }`} />

        <CardHeader className="pb-2 pt-3">
          <div className="flex items-start justify-between pl-2">
            <div className="flex items-start gap-3 flex-1">
            

              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`font-normal ${typeColors[item.type]}`}>
                    {itemTypeLabels[item.type][language]}
                  </Badge>
                  
                 

                  {item.type === ComboItemType.CHOICE && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {item.minSelect || 1}-{item.maxSelect || 1} шт
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Действия */}
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-500 hover:text-gray-700"
                onClick={() => duplicateItem(item.id)}
                title={language === 'ru' ? 'Дублировать' : 'დუბლირება'}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => removeComboItem(item.id)}
                title={language === 'ru' ? 'Удалить' : 'წაშლა'}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-3">
          <div className="space-y-3 pl-9">
            {/* Настройки типа CHOICE */}
            {item.type === ComboItemType.CHOICE && (
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 font-medium">
                  {language === 'ru' ? 'Количество для выбора:' : 'არჩევის რაოდენობა:'}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">от</span>
                    <Input
                      type="number"
                      min="1"
                      value={item.minSelect || 1}
                      onChange={(e) => updateComboItem(item.id, { 
                        minSelect: parseInt(e.target.value) || 1 
                      })}
                      className="w-16 h-7 text-sm"
                    />
                  </div>
                  <span className="text-gray-400">—</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">до</span>
                    <Input
                      type="number"
                      min="1"
                      value={item.maxSelect || 1}
                      onChange={(e) => updateComboItem(item.id, { 
                        maxSelect: parseInt(e.target.value) || 1 
                      })}
                      className="w-16 h-7 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Продукты */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700">
                  {language === 'ru' ? 'Продукты' : 'კომბოში'} 
                  <span className="ml-1 text-xs text-gray-500">({item.products.length})</span>
                  {isStaticOrOptional && (
                    <span className="ml-2 text-xs text-gray-400">
                      {language === 'ru' ? '(макс. 1 продукт)' : '(მაქს. 1 პროდუქტი)'}
                    </span>
                  )}
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openProductSelector(item.id)}
                  className="h-8 text-xs gap-1"
                  disabled={isStaticOrOptional && item.products.length >= 1}
                >
                  <Plus className="h-3 w-3" />
                  {language === 'ru' ? 'Добавить' : 'დამატება'}
                </Button>
              </div>

              {item.products.length === 0 ? (
                <div 
                  onClick={() => !(isStaticOrOptional && item.products.length >= 1) && openProductSelector(item.id)}
                  className={cn(
                    "text-center py-6 border-2 border-dashed rounded-lg transition-colors",
                    isStaticOrOptional && item.products.length >= 1
                      ? "bg-gray-100 border-gray-300 cursor-not-allowed opacity-50"
                      : "bg-gray-50 cursor-pointer hover:border-primary/50 hover:bg-gray-100"
                  )}
                >
                  <Plus className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    {language === 'ru' ? 'Нажмите, чтобы добавить продукты' : 'დააჭირეთ პროდუქტების დასამატებლად'}
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[400px] pr-3">
                  <div className="space-y-2">
                    {item.products.map((product, idx) => {
                      const productDetails = getProductDetails(product.productId)
                      if (!productDetails) return null

                      return (
                        <div 
                          key={product.productId} 
                          className="group relative flex items-start gap-3 p-2 border rounded-lg hover:border-primary/30 transition-colors"
                        >
                          <Avatar className="h-12 w-12 rounded-lg border">
                            <AvatarImage src={productDetails.images?.[0]} />
                            <AvatarFallback className="rounded-lg bg-gray-100">
                              {productDetails.title.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm leading-tight">{productDetails.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {productDetails.price} ₽
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => removeProductFromItem(item.id, product.productId)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            <div className="flex items-center gap-4 mt-2">
                              {item.type !== ComboItemType.STATIC && (
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`allow-multiple-${item.id}-${product.productId}`}
                                    checked={product.allowMultiple || false}
                                    onCheckedChange={(checked) => updateProductInItem(item.id, product.productId, {
                                      allowMultiple: checked as boolean,
                                      maxQuantity: checked ? product.maxQuantity || 1 : undefined
                                    })}
                                  />
                                  <Label htmlFor={`allow-multiple-${item.id}-${product.productId}`} className="text-xs cursor-pointer">
                                    {language === 'ru' ? 'Можно несколько' : 'მრავალჯერადი'}
                                  </Label>
                                </div>
                              )}

                              <div className="flex items-center gap-2 ml-auto">
                                {/* Количество */}
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">×</span>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={product.quantity || 1}
                                    onChange={(e) => updateProductInItem(item.id, product.productId, {
                                      quantity: parseInt(e.target.value) || 1
                                    })}
                                    className="w-16 h-7 text-sm"
                                  />
                                </div>

                                {/* Доп. цена */}
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">+</span>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={product.additionalPrice || 0}
                                    onChange={(e) => updateProductInItem(item.id, product.productId, {
                                      additionalPrice: parseInt(e.target.value) || 0
                                    })}
                                    className="w-20 h-7 text-sm"
                                    placeholder="0 ₽"
                                  />
                                </div>

                                {/* Максимум (если разрешено несколько) */}
                                {product.allowMultiple && item.type !== ComboItemType.STATIC && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500">макс.</span>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={product.maxQuantity || 1}
                                      onChange={(e) => updateProductInItem(item.id, product.productId, {
                                        maxQuantity: parseInt(e.target.value) || 1
                                      })}
                                      className="w-16 h-7 text-sm"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
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
                      {language === 'ru' ? 'Название комбо' : 'კომბოს სახელი'} *
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="text-sm"
                      placeholder={language === 'ru' ? 'Например: Бизнес-ланч' : 'მაგ: ბიზნეს-ლანჩი'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm">
                      {language === 'ru' ? 'Описание комбо' : 'კომბოს აღწერა'}
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="text-sm min-h-[80px] resize-none"
                      placeholder={language === 'ru' ? 'Описание' : 'აღწერეთ კომბოს უპირატესობები'}
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

              
                </div>
              </CardContent>
            </Card>
          )

      case 'items':
    return (
       <Card>
              <CardContent className="pt-6">
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button onClick={() => setIsAddItemDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {language === 'ru' ? 'Добавить элемент' : 'ელემენტის დამატება'}
          </Button>
        </div>

        <div className="space-y-4">
          {comboItems.map((item, index) => renderComboItem(item, index))}
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

                  </div>

                  <div className="space-y-3 pt-2">

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

        case 'additives':
          return (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label className="text-sm">
                    {language === 'ru' ? 'Выберите модификаторы' : 'აირჩიეთ მოდიფიკატორები'}
                  </Label>
                  {isAdditivesLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SearchableSelect
                      options={additives.map(a => ({ id: a.id, label: `${a.title} (+${a.price}₽)` }))}
                      value={selectedAdditives}
                      onChange={setSelectedAdditives}
                      placeholder={language === 'ru' ? 'Выберите модификаторы' : 'აირჩიეთ მოდიფიკატორები'}
                      searchPlaceholder={language === 'ru' ? 'Поиск модификаторов...' : 'მოდიფიკატორების ძებნა...'}
                      emptyText={language === 'ru' ? 'Модификаторы не найдены' : 'მოდიფიკატორები ვერ მოიძებნა'}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )

        // Обновленный раздел 'prices' в функции renderStepContent

case 'prices':
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Базовая цена комбо */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm">
              {language === 'ru' ? 'Базовая цена комбо' : 'კომბოს საბაზო ფასი'} *
            </Label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              value={formData.price}
              onChange={handleInputChange}
              className="text-sm max-w-xs"
            />
          </div>

          {/* Информация о стоимости элементов */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-blue-900">
                {language === 'ru' ? 'Стоимость элементов комбо' : 'კომბოს ელემენტების ღირებულება'}
              </h4>
            </div>
            
            <div className="space-y-2 text-sm">
              {comboItems.map((item, idx) => {
                const productsCount = item.products.length
                const totalItemPrice = item.products.reduce((sum, p) => {
                  const product = getProductDetails(p.productId)
                  return sum + (product?.price || 0) * (p.quantity || 1)
                }, 0)

                return (
                  <div key={item.id} className="flex items-center justify-between py-1 border-b border-blue-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        item.type === ComboItemType.STATIC && "border-blue-300 bg-blue-100/50 text-blue-700",
                        item.type === ComboItemType.CHOICE && "border-amber-300 bg-amber-100/50 text-amber-700",
                        item.type === ComboItemType.OPTIONAL && "border-purple-300 bg-purple-100/50 text-purple-700"
                      )}>
                        {item.type === ComboItemType.STATIC && (language === 'ru' ? 'Статичный' : 'სტატიკური')}
                        {item.type === ComboItemType.CHOICE && (language === 'ru' ? 'На выбор' : 'არჩევანი')}
                        {item.type === ComboItemType.OPTIONAL && (language === 'ru' ? 'Опциональный' : 'ოფციონალური')}
                      </Badge>
                      <span className="text-gray-700">
                        {item.groupName || `${language === 'ru' ? 'Элемент' : 'ელემენტი'} ${idx + 1}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{totalItemPrice} ₽</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({productsCount} {productsCount === 1 
                          ? (language === 'ru' ? 'товар' : 'პროდუქტი') 
                          : (language === 'ru' ? 'товаров' : 'პროდუქტი')})
                      </span>
                    </div>
                  </div>
                )
              })}
              
              <div className="flex items-center justify-between pt-2 mt-2 border-t-2 border-blue-200 font-medium">
                <span className="text-blue-900">
                  {language === 'ru' ? 'Сумма элементов' : 'ელემენტების ჯამი'}
                </span>
                <span className="text-lg font-bold text-blue-900">
                  {comboItems.reduce((sum, item) => {
                    return sum + item.products.reduce((itemSum, p) => {
                      const product = getProductDetails(p.productId)
                      return itemSum + (product?.price || 0) * (p.quantity || 1)
                    }, 0)
                  }, 0)} ₽
                </span>
              </div>

              
            </div>
          </div>

          {/* Выбор ресторанов и цены */}
          <div className="space-y-4 pt-4">
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
                <h4 className="text-sm font-medium text-gray-700">
                  {language === 'ru' ? 'Цены в ресторанах' : 'ფასები რესტორნებში'}
                </h4>
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
                        ? 'Контент страницы комбо' 
                        : 'კომბოს გვერდის კონტენტი'}
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

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
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
                {language === 'ru' ? 'Создание комбо' : 'კომბოს შექმნა'}
              </h1>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => router.back()}
                  disabled={isSaving}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {language === 'ru' ? 'Назад' : 'უკან'}
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {language === 'ru' ? 'Создание...' : 'შექმნა...'}
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      {language === 'ru' ? 'Создать комбо' : 'კომბოს შექმნა'}
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

        {/* Диалог для полноэкранного редактирования */}
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

            <div className="flex-1 flex flex-col px-6 pb-6">
              <HtmlTextarea
                value={fullscreenTextareaValue}
                onChange={setFullscreenTextareaValue}
                placeholder={language === 'ru' ? 'Введите текст...' : 'შეიყვანეთ ტექსტი...'}
                className="flex-1 w-full min-h-0 text-base resize-none"
                language="html"
                showLineNumbers={true}
                style={{
                  height: '100%',
                  maxHeight: 'none'
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

        {/* Диалог для выбора продуктов */}
        <Dialog open={isProductSelectorOpen} onOpenChange={setIsProductSelectorOpen}>
          <DialogContentExtraWide className="max-w-2xl h-[80vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-xl">
                {language === 'ru' ? 'Выберите продукты' : 'აირჩიეთ პროდუქტები'}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 flex flex-col px-6 pb-6 min-h-0">
              {/* Поиск */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder={language === 'ru' ? 'Поиск продуктов...' : 'პროდუქტების ძებნა...'}
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Список продуктов */}
              <ScrollArea className="flex-1 border rounded-md p-4">
                {isProductsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {language === 'ru' 
                      ? 'Нет доступных продуктов' 
                      : 'ხელმისაწვდომი პროდუქტები არ არის'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredProducts.map(product => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          if (selectedItemForProducts) {
                            addProductToItem(selectedItemForProducts, product.id)
                            setIsProductSelectorOpen(false)
                            setProductSearchTerm('')
                          }
                        }}
                      >
                        <Avatar className="h-10 w-10 rounded-lg">
                          <AvatarImage src={product.images?.[0]} />
                          <AvatarFallback className="rounded-lg">
                            {product.title.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.title}</p>
                          <p className="text-sm text-gray-500">
                            {product.category?.title || 'Без категории'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{product.price} ₽</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="flex items-center justify-end gap-2 p-6 pt-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsProductSelectorOpen(false)
                  setProductSearchTerm('')
                }}
              >
                {language === 'ru' ? 'Закрыть' : 'დახურვა'}
              </Button>
            </div>
          </DialogContentExtraWide>
        </Dialog>

        <AddItemDialog
          open={isAddItemDialogOpen}
          onOpenChange={setIsAddItemDialogOpen}
          onConfirm={addComboItem}
        />
      </div>
    )
  }

  export default ComboCreatePage