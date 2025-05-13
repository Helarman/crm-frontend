'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OrderService } from '@/lib/api/order.service'
import { ProductService } from '@/lib/api/product.service'
import { CategoryService } from '@/lib/api/category.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PaymentSelector } from '@/components/features/order/PaymentSelector'
import { toast } from 'sonner'
import { useAuth } from "@/lib/hooks/useAuth"
import { useLanguageStore } from '@/lib/stores/language-store'
import { CustomerService } from '@/lib/api/customer.service'
import { 
  Minus, 
  Plus, 
  Trash, 
  ChevronLeft,
  Utensils,
  ShoppingBag,
  Truck,
  GlassWater,
  Store,
  Clock,
  Users,
  MessageSquare,
  MapPin,
  CalendarClock,
  Table,
  Phone,
  Smartphone,
  Globe,
  Tablet
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShiftService } from '@/lib/api/shift.service'
import { AccessCheck } from '@/components/AccessCheck'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface OrderItem {
  productId: string
  quantity: number
  additiveIds: string[]
  comment?: string
}

interface Additive {
  id: string
  title: string
  titleGe?: string
  price: number
}

interface Category {
  id: string
  title: string
  titleGe?: string
  order?: number
}

interface Product {
  id: string
  title: string
  titleGe?: string
  price: number
  categoryId: string
  additives: Additive[]
  description?: string
  descriptionGe?: string
  restaurantPrices: {
    restaurantId: string
    price: number
    isStopList: boolean
  }[]
}

export interface Restaurant {
  id: string
  title: string
  titleGe?: string
  categories: Category[]
}

const ORDER_TYPES = [
  {
    value: 'DINE_IN',
    icon: Utensils,
    titleRu: 'В зале',
    titleGe: 'დარბაზში',
    descriptionRu: 'Клиент будет есть в ресторане',
    descriptionGe: 'კლიენტი რესტორანში ჭამს',
    color: 'bg-blue-100 border-blue-300 hover:bg-blue-50'
  },
  {
    value: 'TAKEAWAY',
    icon: ShoppingBag,
    titleRu: 'С собой',
    titleGe: 'თვითმიტანი',
    descriptionRu: 'Клиент заберет заказ сам',
    descriptionGe: 'კლიენტი თვითონ წაიღებს შეკვეთას',
    color: 'bg-green-100 border-green-300 hover:bg-green-50'
  },
  {
    value: 'DELIVERY',
    icon: Truck,
    titleRu: 'Доставка',
    titleGe: 'მიტანა',
    descriptionRu: 'Доставка курьером',
    descriptionGe: 'კურიერის მიტანა',
    color: 'bg-purple-100 border-purple-300 hover:bg-purple-50'
  },
  {
    value: 'BANQUET',
    icon: GlassWater,
    titleRu: 'Банкет',
    titleGe: 'ბანკეტი',
    descriptionRu: 'Групповое мероприятие',
    descriptionGe: 'ჯგუფური ღონისძიება',
    color: 'bg-amber-100 border-amber-300 hover:bg-amber-50'
  }
]

const SOURCE_TYPES = [
  {
    value: 'PANEL',
    icon: Tablet,
    titleRu: 'Панель',
    titleGe: 'პანელი',
    color: 'bg-gray-100 border-gray-300 hover:bg-gray-50'
  },
  {
    value: 'SITE',
    icon: Globe,
    titleRu: 'Сайт',
    titleGe: 'საიტი',
    color: 'bg-indigo-100 border-indigo-300 hover:bg-indigo-50'
  },
  {
    value: 'MOBILE',
    icon: Smartphone,
    titleRu: 'Мобильное приложение',
    titleGe: 'მობილური აპლიკაცია',
    color: 'bg-teal-100 border-teal-300 hover:bg-teal-50'
  }
]

interface OrderState {
  restaurantId: string
  items: OrderItem[]
  payment: { method: 'CASH' | 'CARD', status: 'PAID' | 'UNPAID' }
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET'
  source: 'PANEL' | 'SITE' | 'MOBILE'
  comment: string
  numberOfPeople: number
  tableNumber: number
  deliveryAddress: string
  deliveryTime: string
  deliveryNotes: string
  customerId: string | null
  customerPhone: string
}

export default function NewOrderPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguageStore()
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [order, setOrder] = useState<OrderState>({
    restaurantId: '',
    items: [],
    payment: { method: 'CASH', status: 'PAID' },
    type: 'DINE_IN',
    source: 'PANEL',
    comment: '',
    numberOfPeople: 1,
    tableNumber: 0,
    deliveryAddress: '',
    deliveryTime: '',
    deliveryNotes: '',
    customerId: null,
    customerPhone: ''
  })
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingState, setLoadingState] = useState<'initial' | 'loading' | 'success' | 'error'>('initial')
  const [activeShiftId, setActiveShiftId] = useState('')
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledTime, setScheduledTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"))

  useEffect(() => {
    if (!user) return

    if (!user.restaurant || user.restaurant.length === 0) {
      setLoadingState('error')
      toast.error(language === 'ka' ? 'რესტორანი არ მოიძებნა' : 'Ресторан не найден')
      return
    }

    const firstRestaurant = user.restaurant[0]
    setSelectedRestaurant(firstRestaurant)
    setOrder(prev => ({ ...prev, restaurantId: firstRestaurant.id }))
    setLoadingState('loading')
  }, [user, language])

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedRestaurant?.id || loadingState !== 'loading') return

      try {
        const [productsData, categoriesData, activeShift] = await Promise.all([
          ProductService.getByRestaurant(selectedRestaurant.id),
          CategoryService.getAll(),
          ShiftService.getActiveShiftsByRestaurant(selectedRestaurant.id)
        ])

        if (!productsData || !categoriesData) {
          throw new Error('Empty data received')
        }

        setProducts(productsData)
        setCategories(categoriesData)
        setActiveShiftId(activeShift && activeShift.id)
        setLoadingState('success')
      } catch (error) {
        console.error('Failed to load data:', error)
        setLoadingState('error')
        toast.error(language === 'ka' ? 'მონაცემების ჩატვირთვის შეცდომა' : 'Ошибка загрузки данных')
      }
    }

    const timer = setTimeout(() => {
      if (loadingState === 'loading') {
        setLoadingState('error')
        toast.error(language === 'ka' ? 'დატვირთვა გაგრძელდა ძალიან დიდი ხნის განმავლობაში' : 'Загрузка заняла слишком много времени')
      }
    }, 10000)

    fetchData()

    return () => clearTimeout(timer)
  }, [selectedRestaurant, language, loadingState])

  const handleRestaurantChange = async (value: string) => {
    const restaurant = user?.restaurant?.find((r: Restaurant) => r.id === value)
    if (!restaurant) return

    setSelectedRestaurant(restaurant)
    setOrder(prev => ({
      ...prev,
      restaurantId: restaurant.id,
      items: []
    }))
    setProducts([])
    setCategories([])
    setLoadingState('loading')
  }

  const calculateTotal = () => {
    return order.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)
      if (!product) return sum

      const restaurantPrice = product.restaurantPrices?.find(
        p => p.restaurantId === order.restaurantId
      )
      const productPrice = restaurantPrice?.price ?? product.price

      const additivesPrice = (product?.additives || [])
        .filter(a => item.additiveIds.includes(a.id))
        .reduce((sum, a) => sum + a.price, 0)

      return sum + (item.quantity * (productPrice + additivesPrice))
    }, 0)
  }

  const handleSubmit = async () => {
    if (!activeShiftId) {
      toast.error(language === 'ka' ? 'არ არის აქტიური ცვლა' : 'Нет активной смены')
      return
    }
    if (order.items.length === 0 || !selectedRestaurant) {
      toast.error(language === 'ka' ? 'დაამატეთ პროდუქტები შეკვეთაში' : 'Добавьте продукты в заказ')
      return
    }

    if ((order.type === 'DINE_IN' || order.type === 'BANQUET') && !order.tableNumber) {
      toast.error(language === 'ka' ? 'შეიყვანეთ სტოლის ნომერი' : 'Введите номер стола')
      return
    }

    if (order.type === 'DELIVERY' && !order.deliveryAddress) {
      toast.error(language === 'ka' ? 'შეიყვანეთ მისამართი' : 'Введите адрес доставки')
      return
    }

    if (isScheduled && !scheduledTime) {
      toast.error(language === 'ka' ? 'შეიყვანეთ დაგეგმილი დრო' : 'Введите запланированное время')
      return
    }

    try {
      const orderData = {
        ...order,
        total: calculateTotal(),
        shiftId: activeShiftId,
        items: order.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          comment: item.comment || '',
          additiveIds: item.additiveIds
        })),
        deliveryNotes: order.type === 'DELIVERY' 
          ? `${order.comment || ''}\n${order.deliveryNotes || ''}`.trim()
          : undefined,
        scheduledAt: isScheduled ? scheduledTime : undefined
      }

      await OrderService.create(orderData)
      toast.success(language === 'ka' ? 'შეკვეთა წარმატებით შეიქმნა!' : 'Заказ успешно создан!')
      router.push('/orders')
    } catch (error) {
      console.error('Order creation error:', error)
      toast.error(language === 'ka' ? 'შეკვეთის შექმნის შეცდომა' : 'Ошибка при создании заказа')
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    let formattedValue = ''

    if (!value) {
      setOrder(prev => ({ ...prev, customerPhone: '' }))
      return
    }

    if (value.length > 0) {
      formattedValue += '+7 ('
    }
    if (value.length > 1) {
      formattedValue += value.substring(1, 4)
    }
    if (value.length > 4) {
      formattedValue += ') ' + value.substring(4, 7)
    }
    if (value.length > 7) {
      formattedValue += '-' + value.substring(7, 9)
    }
    if (value.length > 9) {
      formattedValue += '-' + value.substring(9, 11)
    }

    setOrder(prev => ({ ...prev, customerPhone: formattedValue }))
  }

  const handleFindCustomer = async () => {
    if (!order.customerPhone) {
      toast.error(language === 'ka' ? 'შეიყვანეთ ტელეფონის ნომერი' : 'Введите номер телефона')
      return
    }

    try {
      const phoneNumber = order.customerPhone.replace(/\D/g, '')
      const customer = await CustomerService.getCustomerByPhone(phoneNumber)
      
      setOrder(prev => ({
        ...prev,
        customerId: customer.id,
      }))
      
      toast.success(language === 'ka' 
        ? 'კლიენტი წარმატებით მოიძებნა' 
        : 'Клиент успешно найден')
    } catch (error) {
      console.error('Customer search error:', error)
      setOrder(prev => ({ ...prev, customerId: null }))
      toast.error(language === 'ka' 
        ? 'კლიენტი არ მოიძებნა' 
        : 'Клиент не найден')
    }
  }

  const t = (text: string | undefined, textGe: string | undefined) => {
    return language === 'ka' && textGe ? textGe : text || ''
  }

  if (!user) {
    return (
      <div className="container py-6 flex justify-center items-center h-64">
        <p>{language === 'ka' ? 'ავტორიზაცია ხდება...' : 'Авторизация...'}</p>
      </div>
    )
  }

  if (loadingState === 'error') {
    return (
      <div className="container py-6 flex justify-center items-center h-64">
        <p className="text-destructive">
          {language === 'ka' ? 'დაფიქსირდა შეცდომა' : 'Произошла ошибка'}
        </p>
      </div>
    )
  }

  if (loadingState === 'loading') {
    return (
      <div className="container py-6 flex justify-center items-center h-64">
        <p>{language === 'ka' ? 'იტვირთება...' : 'Загрузка...'}</p>
      </div>
    )
  }

  return (
    <AccessCheck allowedRoles={['WAITER', 'CASHIER', 'MANAGER', 'SUPERVISOR']}>
      <div className="container py-6 space-y-6">
        <h1 className="text-2xl font-bold">{language === 'ka' ? 'ახალი შეკვეთა' : 'Новый заказ'}</h1>
        
        {/* Order Type Selection */}
        <div className="mb-8 space-y-3">
          <Label className="text-lg flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            {language === 'ka' ? 'შეკვეთის ტიპი' : 'Тип заказа'}
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ORDER_TYPES.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.value}
                  onClick={() => setOrder(prev => ({ ...prev, type: type.value as any }))}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center transition-all hover:scale-[1.02] active:scale-[0.98]
                  ${order.type === type.value
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                      : 'hover:bg-accent shadow-sm hover:shadow-md'
                    }`}
                  title={language === 'ka' ? type.descriptionGe : type.descriptionRu}
                >
                  <Icon className="h-8 w-8 mb-2" />
                  <span className="font-semibold">
                    {language === 'ka' ? type.titleGe : type.titleRu}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Restaurant Selection */}
        {user?.restaurant && user.restaurant.length > 1 && (
          <div className="mb-6 space-y-2">
            <Label className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              {language === 'ka' ? 'რესტორანი' : 'Ресторан'}
            </Label>
            <Select
              value={order.restaurantId}
              onValueChange={handleRestaurantChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={language === 'ka' ? 'აირჩიეთ რესტორანი' : 'Выберите ресторан'} />
              </SelectTrigger>
              <SelectContent>
                {user.restaurant.map((restaurant: Restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Customer Phone */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            {language === 'ka' ? 'ტელეფონის ნომერი' : 'Номер телефона'}
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="+7 (___) ___-__-__"
              value={order.customerPhone}
              onChange={handlePhoneChange}
              maxLength={18}
            />
            <Button 
              onClick={handleFindCustomer}
              variant="secondary"
            >
              {language === 'ka' ? 'ძებნა' : 'Найти'}
            </Button>
          </div>
          {order.customerId ? (
            <p className="text-sm text-green-600">
              {language === 'ka' ? 'კლიენტი ნაპოვნია' : 'Клиент найден'}
            </p>
          ) : order.customerPhone ? (
            <p className="text-sm text-yellow-600">
              {language === 'ka' ? 'კლიენტი არ არის ნაპოვნი' : 'Клиент не найден'}
            </p>
          ) : null}
        </div>

        {/* General Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {language === 'ka' ? 'მომხმარებლების რაოდენობა' : 'Количество посетителей'}
              </Label>
              <Input
                type="number"
                min="1"
                value={order.numberOfPeople}
                onChange={(e) => setOrder(prev => ({
                  ...prev,
                  numberOfPeople: parseInt(e.target.value) || 1
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                {language === 'ka' ? 'სტოლის ნომერი' : 'Номер стола'}
              </Label>
              <Input
                disabled={order.type === 'TAKEAWAY' || order.type === 'DELIVERY'}
                type="number"
                min="0"
                value={order.tableNumber}
                onChange={(e) => setOrder(prev => ({
                  ...prev,
                  tableNumber: parseInt(e.target.value) || 0
                }))}
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {language === 'ka' ? 'კომენტარი' : 'Комментарий'}
            </Label>
            <Textarea 
              className="h-full min-h-[120px]" 
              style={{ height: 'calc(2 * (2.5rem + 1px) + 1rem)' }}
              value={order.comment}
              onChange={(e) => setOrder(prev => ({
                ...prev,
                comment: e.target.value
              }))}
              placeholder={language === 'ka' ? 'დამატებითი ინფორმაცია' : 'Дополнительная информация'}
            />
          </div>
        </div>

        {/* Delivery Fields */}
        {order.type === 'DELIVERY' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {language === 'ka' ? 'მისამართი' : 'Адрес доставки'}
              </Label>
              <Input
                value={order.deliveryAddress}
                onChange={(e) => setOrder(prev => ({
                  ...prev,
                  deliveryAddress: e.target.value
                }))}
                placeholder={language === 'ka' ? 'ქუჩა, სახლი, ბინა' : 'Улица, дом, квартира'}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {language === 'ka' ? 'დრო მიტანისთვის' : 'Время доставки'}
              </Label>
              <Input
                type="time"
                value={order.deliveryTime}
                onChange={(e) => setOrder(prev => ({
                  ...prev,
                  deliveryTime: e.target.value
                }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {language === 'ka' ? 'დამატებითი ინსტრუქციები' : 'Дополнительные инструкции'}
              </Label>
              <Textarea
                value={order.deliveryNotes}
                onChange={(e) => setOrder(prev => ({
                  ...prev,
                  deliveryNotes: e.target.value
                }))}
                placeholder={language === 'ka' ? 'მაგ. დარეკეთ შესვლამდე' : 'Например: Позвоните перед приездом'}
              />
            </div>
          </div>
        )}

        {/* Scheduled Order */}
        <div className="mb-6 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="scheduled-order"
                checked={isScheduled}
                onCheckedChange={(checked) => setIsScheduled(!!checked)}
              />
              <Label htmlFor="scheduled-order" className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {language === 'ka' ? 'დაგეგმილი შეკვეთა' : 'Отложенный заказ'}
              </Label>
            </div>
            <div className="w-64">
              <Input
                type="datetime-local"
                disabled={!isScheduled}
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              />
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {categories.length > 0 && products.length > 0 ? (
              <ProductSelector
                products={products}
                categories={categories}
                restaurantId={order.restaurantId}
                onItemsChange={(items) => setOrder(prev => ({ ...prev, items }))}
                language={language}
              />
            ) : (
              <div className="p-4 border rounded-lg text-center">
                {language === 'ka' ? 'პროდუქტები არ მოიძებნა' : 'Продукты не найдены'}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="p-4 border rounded-lg space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {language === 'ka' ? 'გადახდა' : 'Оплата'}
              </h3>
              <PaymentSelector
                method={order.payment.method}
                onChange={(method) => setOrder(prev => ({
                  ...prev,
                  payment: { ...prev.payment, method }
                }))}
                language={language}
              />
            </div>

            <div className="p-4 border rounded-lg space-y-4">
              <h3 className="text-lg font-bold">
                {language === 'ka' ? 'შეკვეთის დეტალები' : 'Детали заказа'}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {language === 'ka' ? 'პროდუქტები:' : 'Товары:'}
                  </span>
                  <span className="font-medium">{calculateTotal().toFixed(2)} ₽</span>
                </div>
                
                {selectedRestaurant && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === 'ka' ? 'რესტორანი:' : 'Ресторан:'}
                    </span>
                    <span className="font-medium">{selectedRestaurant.title}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {language === 'ka' ? 'ტიპი:' : 'Тип:'}
                  </span>
                  <span className="font-medium">
                    {ORDER_TYPES.find(t => t.value === order.type)?.[language === 'ka' ? 'titleGe' : 'titleRu']}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {language === 'ka' ? 'წყარო:' : 'Источник:'}
                  </span>
                  <span className="font-medium">
                    {SOURCE_TYPES.find(t => t.value === order.source)?.[language === 'ka' ? 'titleGe' : 'titleRu']}
                  </span>
                </div>

                {isScheduled && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === 'ka' ? 'დაგეგმილი დრო:' : 'Запланировано на:'}
                    </span>
                    <span className="font-medium">
                      {format(new Date(scheduledTime), "dd.MM.yyyy HH:mm")}
                    </span>
                  </div>
                )}
              </div>

              <Button
                className="w-full mt-4"
                onClick={handleSubmit}
                disabled={order.items.length === 0 || !selectedRestaurant}
              >
                {language === 'ka' ? 'შეკვეთის მომზადება' : 'Подготовить заказ'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AccessCheck>
  )
}
interface ProductSelectorProps {
  products: Product[]
  categories: Category[]
  restaurantId: string
  onItemsChange: (items: OrderItem[]) => void
  language: string
}

function ProductSelector({
  products,
  categories,
  restaurantId,
  onItemsChange,
  language
}: ProductSelectorProps) {
  const [items, setItems] = useState<OrderItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedAdditives, setSelectedAdditives] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  const toggleAdditive = (additiveId: string) => {
    setSelectedAdditives(prev =>
      prev.includes(additiveId)
        ? prev.filter(id => id !== additiveId)
        : [...prev, additiveId]
    )
  }

  const t = (text: string | undefined, textGe: string | undefined) => {
    return language === 'ka' && textGe ? textGe : text || ''
  }

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoryId === selectedCategory.id)
    : products

  useEffect(() => {
    setSelectedProduct(null)
    setSelectedAdditives([])
    setComment('')
  }, [selectedCategory])

  useEffect(() => {
    setSelectedAdditives([])
    setComment('')
  }, [selectedProduct])

  const handleAddItem = () => {
    if (!selectedProduct) return

    // Проверяем, не в стоп-листе ли продукт в этом ресторане
    const isStopList = selectedProduct.restaurantPrices?.find(
      p => p.restaurantId === restaurantId
    )?.isStopList

    if (isStopList) {
      toast.error(language === 'ka' 
        ? 'ეს პროდუქტი ამჟამად არ არის ხელმისაწვდომი' 
        : 'Этот продукт временно недоступен')
      return
    }

    const newItem: OrderItem = {
      productId: selectedProduct.id,
      quantity: 1,
      additiveIds: selectedAdditives,
      comment: comment || undefined
    }

    const newItems = [...items, newItem]
    setItems(newItems)
    onItemsChange(newItems)
    setSelectedProduct(null)
    setSelectedAdditives([])
    setComment('')
  }

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return

    const newItems = [...items]
    newItems[index].quantity = newQuantity
    setItems(newItems)
    onItemsChange(newItems)
  }

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
    onItemsChange(newItems)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{language === 'ka' ? 'აირჩიეთ კერძები' : 'Выберите блюда'}</h2>

      {!selectedCategory ? (
        <div className="space-y-3">
          <Label className="text-lg">{language === 'ka' ? 'კატეგორიები' : 'Категории'}</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category)}
                className="p-6 border-2 rounded-xl flex flex-col items-center hover:bg-accent transition-all 
                hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
              >
                <Store className="h-8 w-8 mb-3" />
                <span className="font-semibold text-base text-center">
                  {t(category.title, category.titleGe)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-1 text-base text-primary hover:text-primary/80 font-medium"
          >
            <ChevronLeft className="h-5 w-5" />
            {language === 'ka' ? 'უკან კატეგორიებში' : 'Назад к категориям'}
          </button>

          <div className="space-y-3">
            <Label className="text-lg">{language === 'ka' ? 'პროდუქტები' : 'Продукты'}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => {
                const restaurantPrice = product.restaurantPrices?.find(
                  p => p.restaurantId === restaurantId
                )
                const displayPrice = restaurantPrice?.price
                const isStopList = restaurantPrice?.isStopList ?? false

                return (
                  <button
                    key={product.id}
                    onClick={() => !isStopList && setSelectedProduct(product)}
                    className={`p-6 border-2 rounded-xl flex flex-col items-center transition-all hover:scale-[1.02] active:scale-[0.98]
                    ${selectedProduct?.id === product.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                        : 'hover:bg-accent shadow-sm hover:shadow-md'
                      }`}
                  >
                    <Utensils className="h-8 w-8 mb-3" />
                    <span className="font-semibold text-base text-center">
                      {t(product.title, product.titleGe)}
                    </span>
                    <span className="text-base mt-2 font-bold">{displayPrice} ₽</span>
                  </button> 
                )
              }
            )}
            </div>
          </div>
        </>
      )}

      {selectedProduct && selectedProduct.additives.length > 0 && (
        <div className="space-y-3">
          <Label className="text-lg">{language === 'ka' ? 'დამატებები' : 'Добавки'}</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {selectedProduct.additives.map(additive => (
              <button
                key={additive.id}
                onClick={() => toggleAdditive(additive.id)}
                className={`p-4 border-2 rounded-lg flex justify-between items-center transition-all
                ${selectedAdditives.includes(additive.id)
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                    : 'hover:bg-accent shadow-sm hover:shadow-md'
                  }`}
              >
                <span className="font-medium">{t(additive.title, additive.titleGe)}</span>
                <span className="font-bold">+{additive.price} ₽</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="space-y-3">
          <Label className="text-lg">{language === 'ka' ? 'კომენტარი' : 'Комментарий'}</Label>
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={language === 'ka' ? 'განსაკუთრებული სურვილები' : 'Особые пожелания'}
          />
        </div>
      )}

      {selectedProduct && (
        <Button
          onClick={handleAddItem}
          className="w-full py-6 text-lg font-bold"
        >
          {language === 'ka' ? 'შეკვეთაში დამატება' : 'Добавить в заказ'}
        </Button>
      )}

      <div className="mt-8 space-y-4">
        <h3 className="text-xl font-bold">{language === 'ka' ? 'მიმდინარე შეკვეთა' : 'Текущий заказ'}</h3>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-lg">
            {language === 'ka' ? 'დაამატეთ პროდუქტები შეკვეთაში' : 'Добавьте продукты в заказ'}
          </p>
        ) : (
          <ul className="space-y-4">
            {items.map((item, index) => {
              const product = products.find(p => p.id === item.productId)
              const itemAdditives = product?.additives.filter(a =>
                item.additiveIds.includes(a.id)
              )
              const itemPrice = (product?.price || 0) +
                (itemAdditives?.reduce((sum, a) => sum + a.price, 0) || 0)

              return (
                <li key={index} className="p-4 border-2 rounded-lg flex justify-between items-center shadow-sm">
                  <div className="space-y-1">
                    <p className="text-lg font-bold">
                      {t(product?.title, product?.titleGe)} × {item.quantity} = {(itemPrice * item.quantity).toFixed(2)} ₽
                    </p>
                    {itemAdditives && itemAdditives.length > 0 && (
                      <p className="text-base text-muted-foreground">
                        {language === 'ka' ? 'დამატებები:' : 'Добавки:'} {itemAdditives.map(a => t(a.title, a.titleGe)).join(', ')}
                      </p>
                    )}
                    {item.comment && (
                      <p className="text-base text-muted-foreground">
                        {language === 'ka' ? 'კომენტარი:' : 'Комментарий:'} {item.comment}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-10 w-10 p-0"
                      onClick={() => handleQuantityChange(index, item.quantity - 1)}
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <span className="text-lg w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-10 w-10 p-0"
                      onClick={() => handleQuantityChange(index, item.quantity + 1)}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="h-10 w-10 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash className="h-5 w-5" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
