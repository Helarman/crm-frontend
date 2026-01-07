'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, X, Plus, Check, ArrowLeft, Save, Info, Tag, Calendar, Building, Package, Percent, ShoppingBasket, Globe, DollarSign, Clock, Hash, Layers, ListCollapse, Shield, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DiscountService, CreateDiscountDto } from '@/lib/api/discount.service'
import { RestaurantService } from '@/lib/api/restaurant.service'
import { ProductService } from '@/lib/api/product.service'
import { NetworkService } from '@/lib/api/network.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NavigationMenu, NavigationMenuList } from '@/components/ui/navigation-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguageStore } from '@/lib/stores/language-store'
import { useAuth } from '@/lib/hooks/useAuth'
import SearchableSelect from '@/components/features/menu/product/SearchableSelect'

import { ru, ka } from 'date-fns/locale'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import DatePicker from '@/components/ui/data-picker'

interface Restaurant {
    id: string
    title: string
}

interface Product {
    id: string
    title: string
}

interface Network {
    id: string
    name: string
    description?: string
    restaurants?: Restaurant[]
}

type DiscountType = "FIXED" | "PERCENTAGE"
type DiscountTargetType = "ALL" | "PRODUCT"

type FormStep = 'basic' | 'settings' | 'restrictions' | 'schedule'

const sections = [
    {
        id: 'basic',
        title: { ru: 'Основная информация', ka: 'ძირითადი ინფორმაცია' },
        icon: Info,
        color: 'bg-gradient-to-br from-blue-500 to-cyan-400',
        description: { ru: 'Название, описание, статус', ka: 'სახელი, აღწერა, სტატუსი' }
    },
    {
        id: 'settings',
        title: { ru: 'Настройки', ka: 'პარამეტრები' },
        icon: Settings,
        color: 'bg-gradient-to-br from-purple-500 to-pink-400',
        description: { ru: 'Тип и размер скидки', ka: 'ფასდაკლების ტიპი და ზომა' }
    },
    {
        id: 'restrictions',
        title: { ru: 'Сфера применения', ka: 'გამოყენების სფერო' },
        icon: Shield,
        color: 'bg-gradient-to-br from-amber-500 to-orange-400',
        description: { ru: 'Где и на что действует', ka: 'სად და რაზე მოქმედებს' }
    },
    {
        id: 'schedule',
        title: { ru: 'Расписание', ka: 'განრიგი' },
        icon: Calendar,
        color: 'bg-gradient-to-br from-emerald-500 to-green-400',
        description: { ru: 'Дата, время, период действия', ka: 'თარიღი, დრო, მოქმედების პერიოდი' }
    },
]

const STORAGE_KEY = 'selected_network_id'

const DiscountEditPage = () => {
    const { language } = useLanguageStore()
    const router = useRouter()
    const params = useParams()
    const { user } = useAuth()
    const locale = language === 'ka' ? ka : ru

    const discountId = params?.id as string

    const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null)
    const [currentStep, setCurrentStep] = useState<FormStep>('basic')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isScrolling, setIsScrolling] = useState(false)

    // Данные формы
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'FIXED' as DiscountType,
        value: 0,
        targetType: 'ALL' as DiscountTargetType,
        minOrderAmount: 0,
        maxOrderAmount: 0,
        restaurantIds: [] as string[],
        productIds: [] as string[],
        isActive: true,
        code: '',
        maxUses: 0,
        startDate: undefined as Date | undefined,
        endDate: undefined as Date | undefined,
        startTime: 0,
        endTime: 0,
        networkId: '',
    })

    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    // Загруженные данные
    const [networks, setNetworks] = useState<Network[]>([])
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [isNetworksLoading, setIsNetworksLoading] = useState(true)
    const [isRestaurantsLoading, setIsRestaurantsLoading] = useState(false)
    const [isProductsLoading, setIsProductsLoading] = useState(false)

    // Intersection Observer для отслеживания секций
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
                // Если сеть не выбрана, перенаправляем на страницу скидок
                toast.error(language === 'ru'
                    ? 'Сначала выберите сеть'
                    : 'ჯერ აირჩიეთ ქსელი')
                router.push('/menu?tab=discounts')
            }
        }
    }, [router, language])

    // Загружаем данные скидки при монтировании
    useEffect(() => {
        if (discountId) {
            loadDiscountData()
        }
    }, [discountId])

    // Загружаем дополнительные данные когда selectedNetworkId установлен
    useEffect(() => {
        if (selectedNetworkId) {
            loadAdditionalData()
        }
    }, [selectedNetworkId])

    const loadDiscountData = async () => {
        if (!discountId) return

        setIsLoading(true)
        try {
            // Загружаем данные скидки
            const discountData = await DiscountService.getById(discountId)
            
            // Устанавливаем данные формы из загруженной скидки
            setFormData({
                title: discountData.title,
                description: discountData.description || '',
                type: discountData.type,
                value: discountData.value,
                targetType: discountData.targetType,
                minOrderAmount: discountData.minOrderAmount || 0,
                maxOrderAmount: 0,
                restaurantIds: discountData.restaurants?.map(r => r.restaurant.id) || [],
                productIds: discountData.products?.map(p => p.product.id) || [],
                isActive: discountData.isActive,
                code: discountData.code || '',
                maxUses: discountData.maxUses || 0,
                startDate: discountData.startDate ? new Date(discountData.startDate) : undefined,
                endDate: discountData.endDate ? new Date(discountData.endDate) : undefined,
                startTime: discountData.startTime || 0,
                endTime: discountData.endTime || 0,
                networkId: '',
            })

            // Загружаем сети для определения networkId
            await loadNetworks(discountData)

        } catch (error) {
            console.error('Failed to load discount data:', error)
            toast.error(language === 'ru' ? 'Ошибка загрузки данных скидки' : 'ფასდაკლების მონაცემების ჩატვირთვის შეცდომა')
            router.push('/menu?tab=discounts')
        } finally {
            setIsLoading(false)
        }
    }

    const loadNetworks = async (discountData?: any) => {
        if (!user?.id) return

        setIsNetworksLoading(true)
        try {
            const networksData = await NetworkService.getByUser(user.id)
            setNetworks(networksData)

            // Если есть данные скидки, ищем соответствующую сеть
            if (discountData && discountData.restaurants?.length > 0) {
                // Получаем ID ресторанов из скидки
                const discountRestaurantIds = discountData.restaurants.map((r: any) => r.restaurant.id)
                
                // Ищем сеть, которая содержит эти рестораны
                const matchingNetwork = networksData.find(network => 
                    network.restaurants?.some(restaurant => 
                        discountRestaurantIds.includes(restaurant.id)
                    )
                )

                if (matchingNetwork) {
                    setSelectedNetworkId(matchingNetwork.id)
                    setFormData(prev => ({ 
                        ...prev, 
                        networkId: matchingNetwork.id 
                    }))
                    localStorage.setItem(STORAGE_KEY, matchingNetwork.id)
                    return
                }
            }

            // Если не нашли сеть по ресторанам, пробуем стандартную логику
            const savedNetworkId = localStorage.getItem(STORAGE_KEY)
            if (savedNetworkId) {
                const networkExists = networksData.some(n => n.id === savedNetworkId)
                if (networkExists) {
                    setSelectedNetworkId(savedNetworkId)
                    setFormData(prev => ({ ...prev, networkId: savedNetworkId }))
                } else if (networksData.length > 0) {
                    // Если сохраненной сети нет в доступных, выбираем первую
                    setSelectedNetworkId(networksData[0].id)
                    setFormData(prev => ({ ...prev, networkId: networksData[0].id }))
                    localStorage.setItem(STORAGE_KEY, networksData[0].id)
                }
            } else if (networksData.length === 1) {
                // Если у пользователя только одна сеть, выбираем ее автоматически
                setSelectedNetworkId(networksData[0].id)
                setFormData(prev => ({ ...prev, networkId: networksData[0].id }))
                localStorage.setItem(STORAGE_KEY, networksData[0].id)
            } else {
                // Если сетей несколько и не выбрана, просим выбрать
                toast.error(language === 'ru'
                    ? 'Сначала выберите сеть'
                    : 'ჯერ აირჩიეთ ქსელი')
                router.push('/menu?tab=discounts')
            }
        } catch (error) {
            console.error('Error fetching networks:', error)
            toast.error(language === 'ru' ? 'Ошибка загрузки сетей' : 'ქსელების ჩატვირთვის შეცდომა')
        } finally {
            setIsNetworksLoading(false)
        }
    }

    const loadAdditionalData = async () => {
        if (!selectedNetworkId) return

        setIsLoading(true)
        try {
            await Promise.all([
                loadRestaurants(),
                loadProducts()
            ])
        } catch (error) {
            console.error('Failed to load additional data:', error)
            toast.error(language === 'ru' ? 'Ошибка загрузки данных' : 'მონაცემების ჩატვირთვის შეცდომა')
        } finally {
            setIsLoading(false)
        }
    }

    const loadRestaurants = async () => {
        if (!selectedNetworkId) return

        setIsRestaurantsLoading(true)
        try {
            const restaurantsData = await RestaurantService.getByNetwork(selectedNetworkId)
            setRestaurants(restaurantsData)
        } catch (error) {
            console.error('Failed to load restaurants', error)
            toast.error(language === 'ru' ? 'Ошибка загрузки ресторанов' : 'რესტორნების ჩატვირთვის შეცდომა')
        } finally {
            setIsRestaurantsLoading(false)
        }
    }

    const loadProducts = async () => {
        if (!selectedNetworkId) return

        setIsProductsLoading(true)
        try {
            const productsData = await ProductService.getByNetwork(selectedNetworkId)
            setProducts(productsData)
        } catch (error) {
            console.error('Failed to load products', error)
            toast.error(language === 'ru' ? 'Ошибка загрузки продуктов' : 'პროდუქტების ჩატვირთვის შეცდომა')
        } finally {
            setIsProductsLoading(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: ['value', 'minOrderAmount', 'maxUses', 'startTime', 'endTime'].includes(name)
                ? Number(value)
                : value,
        })
        setFormErrors(prev => ({ ...prev, [name]: '' }))
    }

    const handleSelectChange = (name: string, value: any) => {
        setFormData({
            ...formData,
            [name]: value,
        })
        setFormErrors(prev => ({ ...prev, [name]: '' }))

        if (name === 'targetType') {
            setFormData(prev => ({
                ...prev,
                productIds: []
            }))
        }
    }

    const handleDateChange = (name: string, date: Date | undefined) => {
        setFormData({
            ...formData,
            [name]: date,
        })
        setFormErrors(prev => ({ ...prev, [name]: '' }))
    }

    const validateForm = () => {
        const errors: Record<string, string> = {}

        if (!formData.title.trim()) {
            errors.title = language === 'ru' ? 'Название обязательно' : 'სახელი სავალდებულოა'
        }

        if (!formData.startDate) {
            errors.startDate = language === 'ru' ? 'Дата начала обязательна' : 'დაწყების თარიღი სავალდებულოა'
        }

        if (!formData.endDate) {
            errors.endDate = language === 'ru' ? 'Дата окончания обязательна' : 'დასრულების თარიღი სავალდებულოა'
        }

        if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
            errors.endDate = language === 'ru'
                ? 'Дата окончания должна быть после даты начала'
                : 'დასრულების თარიღი უნდა იყოს დაწყების თარიღის შემდეგ'
        }

        if (formData.startTime !== undefined && formData.endTime !== undefined && formData.startTime >= formData.endTime) {
            errors.endTime = language === 'ru'
                ? 'Время окончания должно быть после времени начала'
                : 'დასრულების დრო უნდა იყოს დაწყების დროის შემდეგ'
        }

        if (!formData.restaurantIds || formData.restaurantIds.length === 0) {
            errors.restaurantIds = language === 'ru'
                ? 'Необходимо выбрать хотя бы один ресторан'
                : 'მინიმუმ ერთი რესტორნი უნდა აირჩიოთ'
        }

        if (formData.targetType === 'PRODUCT' && (!formData.productIds || formData.productIds.length === 0)) {
            errors.productIds = language === 'ru'
                ? 'Необходимо выбрать продукты'
                : 'პროდუქტები უნდა აირჩიოთ'
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedNetworkId) {
            toast.error(language === 'ru'
                ? 'Сеть не выбрана. Выберите сеть на странице скидок'
                : 'ქსელი არ არის არჩეული. აირჩიეთ ქსელი ფასდაკლების გვერდზე')
            router.push('/menu?tab=discounts')
            return
        }

        if (!validateForm()) return

        setIsSaving(true)

        try {
            const requestData: CreateDiscountDto = {
                ...formData,
                networkId: selectedNetworkId,
                restaurantIds: formData.restaurantIds.length > 0 ? formData.restaurantIds : undefined,
                productIds: formData.targetType === 'PRODUCT' && formData.productIds.length > 0 ? formData.productIds : undefined,
                startDate: formData.startDate,
                endDate: formData.endDate,
            }

            await DiscountService.update(discountId, requestData)

            toast.success(language === 'ru' ? 'Скидка обновлена' : 'ფასდაკლება განახლებულია')
            router.push(`/menu?tab=discounts`)
        } catch (error) {
            console.error('Error updating discount:', error)
            toast.error(language === 'ru' ? 'Ошибка обновления скидки' : 'ფასდაკლების განახლების შეცდომა')
        } finally {
            setIsSaving(false)
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
                                    {formErrors.title && (
                                        <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
                                    )}
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
                                    <Label htmlFor="code" className="text-sm">
                                        {language === 'ru' ? 'Промокод' : 'პრომო კოდი'}
                                    </Label>
                                    <Input
                                        id="code"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        className="text-sm"
                                        placeholder={language === 'ru' ? 'Необязательно' : 'არასავალდებულო'}
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <Label htmlFor="isActive" className="text-sm">
                                        {language === 'ru' ? 'Активная' : 'აქტიური'}
                                    </Label>
                                    <Switch
                                        id="isActive"
                                        checked={formData.isActive}
                                        onCheckedChange={checked => handleSelectChange('isActive', checked)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )

            case 'settings':
                return (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type" className="text-sm">
                                            {language === 'ru' ? 'Тип скидки' : 'ფასდაკლების ტიპი'} *
                                        </Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(value: DiscountType) => handleSelectChange('type', value)}
                                        >
                                            <SelectTrigger className="text-sm w-full">
                                                <SelectValue placeholder={language === 'ru' ? 'Выберите тип' : 'აირჩიეთ ტიპი'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="FIXED">
                                                    {language === 'ru' ? 'Фиксированная сумма' : 'ფიქსირებული თანხა'}
                                                </SelectItem>
                                                <SelectItem value="PERCENTAGE">
                                                    {language === 'ru' ? 'Процент' : 'პროცენტი'}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="value" className="text-sm">
                                            {language === 'ru' ? 'Размер скидки' : 'ფასდაკლების ზომა'} *
                                            {formData.type === 'FIXED' && ` (₽)`}
                                            {formData.type === 'PERCENTAGE' && ` (%)`}
                                        </Label>
                                        <Input
                                            id="value"
                                            name="value"
                                            type="number"
                                            min="0"
                                            step={formData.type === 'PERCENTAGE' ? '0.1' : '1'}
                                            value={formData.value}
                                            onChange={handleInputChange}
                                            className="text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="minOrderAmount" className="text-sm">
                                            {language === 'ru' ? 'Минимальная сумма заказа' : 'მინიმალური შეკვეთის თანხა'} (₽)
                                        </Label>
                                        <Input
                                            id="minOrderAmount"
                                            name="minOrderAmount"
                                            type="number"
                                            min="0"
                                            value={formData.minOrderAmount}
                                            onChange={handleInputChange}
                                            className="text-sm"
                                            placeholder="0 - без ограничения"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="minOrderAmount" className="text-sm">
                                            {language === 'ru' ? 'Максимальная сумма заказа' : 'მინიმალური შეკვეთის თანხა'} (₽)
                                        </Label>
                                        <Input
                                            id="maxOrderAmount"
                                            name="maxOrderAmount"
                                            type="number"
                                            min="0"
                                            value={formData.maxOrderAmount}
                                            onChange={handleInputChange}
                                            className="text-sm"
                                            placeholder="0 - без ограничения"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="maxUses" className="text-sm">
                                        {language === 'ru' ? 'Максимальное количество использований' : 'მაქსიმალური გამოყენების რაოდენობა'}
                                    </Label>
                                    <Input
                                        id="maxUses"
                                        name="maxUses"
                                        type="number"
                                        min="0"
                                        value={formData.maxUses}
                                        onChange={handleInputChange}
                                        className="text-sm"
                                        placeholder="0 - без ограничения"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )

            case 'restrictions':
                return (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="targetType" className="text-sm">
                                        {language === 'ru' ? 'Применение скидки' : 'ფასდაკლების გამოყენება'} *
                                    </Label>
                                    <Select
                                        value={formData.targetType}
                                        onValueChange={(value: DiscountTargetType) => handleSelectChange('targetType', value)}
                                    >
                                        <SelectTrigger className="text-sm">
                                            <SelectValue placeholder={language === 'ru' ? 'Выберите применение' : 'აირჩიეთ გამოყენება'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">
                                                {language === 'ru' ? 'Ко всему меню' : 'მთელ მენიუზე'}
                                            </SelectItem>
                                            <SelectItem value="PRODUCT">
                                                {language === 'ru' ? 'По продуктам' : 'პროდუქტების მიხედვით'}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm">
                                        {language === 'ru' ? 'Рестораны' : 'რესტორნები'} *
                                    </Label>
                                    {isRestaurantsLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <SearchableSelect
                                            options={restaurants.map(r => ({ id: r.id, label: r.title }))}
                                            value={formData.restaurantIds}
                                            onChange={(ids) => handleSelectChange('restaurantIds', ids)}
                                            placeholder={language === 'ru' ? 'Выберите рестораны' : 'აირჩიეთ რესტორნები'}
                                            searchPlaceholder={language === 'ru' ? 'Поиск ресторанов...' : 'რესტორნების ძებნა...'}
                                            emptyText={language === 'ru' ? 'Рестораны не найдены' : 'რესტორნები ვერ მოიძებნა'}
                                        />
                                    )}
                                    {formErrors.restaurantIds && (
                                        <p className="mt-1 text-sm text-red-500">{formErrors.restaurantIds}</p>
                                    )}
                                </div>

                                {formData.targetType === 'PRODUCT' && (
                                    <div className="space-y-2">
                                        <Label className="text-sm">
                                            {language === 'ru' ? 'Продукты' : 'პროდუქტები'} *
                                        </Label>
                                        {isProductsLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <SearchableSelect
                                                options={products.map(p => ({ id: p.id, label: p.title }))}
                                                value={formData.productIds}
                                                onChange={(ids) => handleSelectChange('productIds', ids)}
                                                placeholder={language === 'ru' ? 'Выберите продукты' : 'აირჩიეთ პროდუქტები'}
                                                searchPlaceholder={language === 'ru' ? 'Поиск продуктов...' : 'პროდუქტების ძებნა...'}
                                                emptyText={language === 'ru' ? 'Продукты не найдены' : 'პროდუქტები ვერ მოიძებნა'}
                                            />
                                        )}
                                        {formErrors.productIds && (
                                            <p className="mt-1 text-sm text-red-500">{formErrors.productIds}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )

            case 'schedule':
                return (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate" className="text-sm">
                                            {language === 'ru' ? 'Дата начала' : 'დაწყების თარიღი'} *
                                        </Label>
                                        <DatePicker
                                            date={formData.startDate}
                                            setDate={(date) => handleDateChange('startDate', date)}
                                            className="w-full"
                                            placeholder={language === 'ru' ? 'Выберите дату' : 'აირჩიეთ თარიღი'}
                                            minDate={new Date()}
                                        />
                                        {formErrors.startDate && (
                                            <p className="mt-1 text-sm text-red-500">{formErrors.startDate}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="endDate" className="text-sm">
                                            {language === 'ru' ? 'Дата окончания' : 'დასრულების თარიღი'} *
                                        </Label>
                                        <DatePicker
                                            date={formData.endDate}
                                            setDate={(date) => handleDateChange('endDate', date)}
                                            className="w-full"
                                            placeholder={language === 'ru' ? 'Выберите дату' : 'აირჩიეთ თარიღი'}
                                            minDate={formData.startDate || new Date()}
                                        />
                                        {formErrors.endDate && (
                                            <p className="mt-1 text-sm text-red-500">{formErrors.endDate}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startTime" className="text-sm">
                                            {language === 'ru' ? 'Время начала' : 'დაწყების დრო'} (0-23)
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="startTime"
                                                name="startTime"
                                                type="number"
                                                min="0"
                                                max="23"
                                                value={formData.startTime}
                                                onChange={handleInputChange}
                                                className="text-sm"
                                                placeholder="0-23"
                                            />
                                        </div>
                                        {formErrors.startTime && (
                                            <p className="mt-1 text-sm text-red-500">{formErrors.startTime}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="endTime" className="text-sm">
                                            {language === 'ru' ? 'Время окончания' : 'დასრულების დრო'} (0-23)
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="endTime"
                                                name="endTime"
                                                type="number"
                                                min="0"
                                                max="23"
                                                value={formData.endTime}
                                                onChange={handleInputChange}
                                                className="text-sm"
                                                placeholder="0-23"
                                            />
                                        </div>
                                        {formErrors.endTime && (
                                            <p className="mt-1 text-sm text-red-500">{formErrors.endTime}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )

            default:
                return null
        }
    }

    if (isLoading || isNetworksLoading) {
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

    const currentNetwork = networks.find(n => n.id === selectedNetworkId)

    return (
        <div className="min-h-screen">
            {/* Навигация */}
            <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b supports-backdrop-blur:bg-white/60">
                <div className="py-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">
                                {language === 'ru' ? 'Редактирование скидки' : 'ფასდაკლების რედაქტირება'}
                            </h1>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/menu?tab=discounts')}
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
                                        {language === 'ru' ? 'Сохранение...' : 'შენახვა...'}
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {language === 'ru' ? 'Сохранить изменения' : 'ცვლილებების შენახვა'}
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
                                        <Button
                                            key={section.id}
                                            variant="ghost"
                                            onClick={() => scrollToSection(section.id)}
                                            className={`relative gap-2 transition-all duration-300 ${currentStep === section.id
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
        </div>
    )
}

export default DiscountEditPage