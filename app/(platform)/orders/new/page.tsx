'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OrderService } from '@/lib/api/order.service'
import { ProductService } from '@/lib/api/product.service'
import { CategoryService } from '@/lib/api/category.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useAuth } from "@/lib/hooks/useAuth"
import { Language, useLanguageStore } from '@/lib/stores/language-store'
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
  SortAscIcon,
  Tablet,
  List,
  ChevronRight,
  ChevronDown,
  Banknote
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
import AddressInput from '@/components/features/order/AddressInput'
import { DeliveryZoneService } from '@/lib/api/delivery-zone.service'
import { SurchargeService, SurchargeResponse } from '@/lib/api/surcharge.service'
import { DiscountService } from '@/lib/api/discount.service'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'

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
  images?: string[]
  restaurantPrices: {
    restaurantId: string
    price: number
    isStopList: boolean
  }[]
}

export interface Restaurant {
  id: string
  title: string
  address?: string
  categories: Category[]
}

interface OrderState {
  restaurantId: string
  items: OrderItem[]
  payment: { method: 'CASH' | 'CARD' | 'CASH_TO_COURIER' | 'CARD_TO_COURIER', status: 'PAID' | 'PENDING' }
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
  deliveryZone?: {
    id: string
    title: string
    price: number
    minOrder?: number
  } | null
  surcharges: {
    id: string
    title: string
    amount: number
    type: 'FIXED' | 'PERCENTAGE'
  }[]
  discounts: {
    id: string
    title: string
    amount: number
    type: 'FIXED' | 'PERCENTAGE'
  }[]
}

const ORDER_TYPES = [
  {
    value: 'DINE_IN',
    titleRu: 'В зале',
    titleGe: 'დარბაზში',
  },
  {
    value: 'TAKEAWAY',
    titleRu: 'С собой',
    titleGe: 'თვითმიტანი',
  },
  {
    value: 'DELIVERY',
    titleRu: 'Доставка',
    titleGe: 'მიტანა',
  },
  {
    value: 'BANQUET',
    titleRu: 'Банкет',
    titleGe: 'ბანკეტი',
  }
]

const PAYMENT_METHODS = [
  {
    value: 'CASH',
    titleRu: 'Наличные',
    titleGe: 'ნაღდი',
  },
  {
    value: 'CARD',
    titleRu: 'Карта',
    titleGe: 'ბარათი',
  },
  {
    value: 'CASH_TO_COURIER',
    titleRu: 'Наличные курьеру',
    titleGe: 'ნაღდი კურიერს',
  },
  {
    value: 'CARD_TO_COURIER',
    titleRu: 'Карта курьеру',
    titleGe: 'ბარათი კურიერს',
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

const OrderTypeSelector = ({
  value,
  onChange,
  language
}: {
  value: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET'
  onChange: (value: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET') => void
  language: Language
}) => {
  const t = (text: string | undefined, textGe: string | undefined) => {
    return language === 'ka' && textGe ? textGe : text || ''
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={language === 'ka' ? 'აირჩიეთ ტიპი' : 'Выберите тип'} />
      </SelectTrigger>
      <SelectContent>
        {ORDER_TYPES.map(type => (
          <SelectItem key={type.value} value={type.value}>
            {t(type.titleRu, type.titleGe)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const PaymentSelector = ({
  method,
  onChange,
  orderType,
  language
}: {
  method: 'CASH' | 'CARD' | 'CASH_TO_COURIER' | 'CARD_TO_COURIER'
  onChange: (method: 'CASH' | 'CARD' | 'CASH_TO_COURIER' | 'CARD_TO_COURIER') => void
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET'
  language: Language
}) => {
  const t = (text: string | undefined, textGe: string | undefined) => {
    return language === 'ka' && textGe ? textGe : text || ''
  }

  // Filter payment methods based on order type
  const availableMethods = PAYMENT_METHODS.filter(method => {
    if (orderType === 'DELIVERY') {
      return true // All methods available for delivery
    }
    return method.value === 'CASH' || method.value === 'CARD'
  })

  return (
    
    <Select value={method} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={language === 'ka' ? 'აირჩიეთ გადახდა' : 'Выберите оплату'} />
      </SelectTrigger>
      <SelectContent>
        {availableMethods.map(method => (
          <SelectItem key={method.value} value={method.value}>
            {t(method.titleRu, method.titleGe)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const SurchargeSelector = ({
  orderType,
  restaurantId,
  selectedSurcharges,
  onSelect,
  language
}: {
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET'
  restaurantId: string
  selectedSurcharges: { id: string; title: string; amount: number; type: 'FIXED' | 'PERCENTAGE' }[]
  onSelect: (surcharges: { id: string; title: string; amount: number; type: 'FIXED' | 'PERCENTAGE' }[]) => void
  language: string
}) => {
  const [availableSurcharges, setAvailableSurcharges] = useState<SurchargeResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSurcharges = async () => {
      setLoading(true)
      try {
        const surcharges = await SurchargeService.getForOrderType(
          orderType,
          restaurantId
        )
        setAvailableSurcharges(surcharges)
      } catch (error) {
        console.error('Failed to load surcharges:', error)
      } finally {
        setLoading(false)
      }
    }

    if (restaurantId) {
      fetchSurcharges()
    }
  }, [orderType, restaurantId])

  const toggleSurcharge = (surcharge: SurchargeResponse) => {
    const isSelected = selectedSurcharges.some(s => s.id === surcharge.id)
    if (isSelected) {
      onSelect(selectedSurcharges.filter(s => s.id !== surcharge.id))
    } else {
      onSelect([
        ...selectedSurcharges,
        {
          id: surcharge.id,
          title: surcharge.title,
          amount: surcharge.amount,
          type: surcharge.type
        }
      ])
    }
  }

  return (
    <div className="space-y-3">
      <Label className="text-lg">
        {language === 'ka' ? 'დამატებითი გადასახადები' : 'Дополнительные сборы'}
      </Label>
      
      {loading ? (
        <p>{language === 'ka' ? 'იტვირთება...' : 'Загрузка...'}</p>
      ) : availableSurcharges.length === 0 ? (
        <p className="text-muted-foreground">
          {language === 'ka' ? 'არ არის ხელმისაწვდომი დამატებითი გადასახადები' : 'Нет доступных дополнительных сборов'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableSurcharges.map(surcharge => {
            const isSelected = selectedSurcharges.some(s => s.id === surcharge.id)
            const title = surcharge.title
            
            return (
              <button
                key={surcharge.id}
                onClick={() => toggleSurcharge(surcharge)}
                className={`p-4 border-2 rounded-lg flex justify-between items-center transition-all
                  ${isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                    : 'hover:bg-accent shadow-sm hover:shadow-md'
                  }`}
              >
                <span className="font-medium">{title}</span>
                <span className="font-bold">
                  {surcharge.type === 'FIXED' 
                    ? `+${surcharge.amount} ₽`
                    : `+${surcharge.amount}%`}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const PromoCodeInput = ({
  orderType,
  restaurantId,
  onApply,
  language
}: {
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET'
  restaurantId: string
  onApply: (discount: {
    id: string
    title: string
    amount: number
    type: 'FIXED' | 'PERCENTAGE'
  }) => void
  language: string
}) => {
  const [promoCode, setPromoCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleApply = async () => {
    if (!promoCode) {
      setError(language === 'ka' ? 'შეიყვანეთ პრომო კოდი' : 'Введите промокод')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const discount = await DiscountService.getByCode(promoCode)
      
      if (!discount.orderTypes.includes(orderType)) {
        throw new Error(language === 'ka' 
          ? 'ეს ფასდაკლება არ არის ხელმისაწვდომი ამ ტიპის შეკვეთისთვის' 
          : 'Эта скидка недоступна для данного типа заказа')
      }

      if (discount.targetType === 'RESTAURANT' && 
          !discount.restaurants?.some(r => r.restaurant.id === restaurantId)) {
        throw new Error(language === 'ka' 
          ? 'ეს ფასდაკლება არ არის ხელმისაწვდომი ამ რესტორანისთვის' 
          : 'Эта скидка недоступна для данного ресторана')
      }

      onApply({
        id: discount.id,
        title: discount.title,
        amount: discount.value,
        type: discount.type === 'PERCENTAGE' ? 'PERCENTAGE' : 'FIXED'
      })
      
      setPromoCode('')
    } catch (error) {
      console.error('Failed to apply promo code:', error)
      setError(language === 'ka' 
        ? 'პრომო კოდის გამოყენების შეცდომა' 
        : 'Ошибка применения промокода')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-lg">{language === 'ka' ? 'პრომო კოდი' : 'Промокод'}</Label>
      <div className="flex gap-2">
        <Input
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          placeholder={language === 'ka' ? 'შეიყვანეთ პრომო კოდი' : 'Введите промокод'}
          disabled={loading}
        />
        <Button onClick={handleApply} disabled={loading}>
          {loading 
            ? language === 'ka' ? 'მიმდინარეობს...' : 'Применение...'
            : language === 'ka' ? 'გამოყენება' : 'Применить'}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

const OrderSummary = ({
  order,
  products,
  restaurantId,
  language
}: {
  order: OrderState
  products: Product[]
  restaurantId: string
  language: string
}) => {
  const calculateBasePrice = () => {
    const itemsTotal = order.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)
      if (!product) return sum

      const restaurantPrice = product.restaurantPrices?.find(
        p => p.restaurantId === restaurantId
      )
      const productPrice = restaurantPrice?.price ?? product.price

      const additivesPrice = (product?.additives || [])
        .filter(a => item.additiveIds.includes(a.id))
        .reduce((sum, a) => sum + a.price, 0)

      return sum + (item.quantity * (productPrice + additivesPrice))
    }, 0)

    const deliveryCost = order.type === 'DELIVERY' && order.deliveryZone && order.deliveryZone.price 
      ? order.deliveryZone.price 
      : 0

    return itemsTotal + deliveryCost
  }

  const calculateTotal = () => {
    const basePrice = calculateBasePrice()
    
    const fixedSurcharges = order.surcharges
      .filter(s => s.type === 'FIXED')
      .reduce((sum, s) => sum + s.amount, 0)

    const percentageSurcharges = order.surcharges
      .filter(s => s.type === 'PERCENTAGE')
      .reduce((sum, s) => sum + (basePrice * (s.amount / 100)), 0)

    const discountAmount = order.discounts.reduce((sum, discount) => {
      if (discount.type === 'FIXED') {
        return sum + discount.amount
      } else {
        return sum + (basePrice * (discount.amount / 100))
      }
    }, 0)

    return basePrice + fixedSurcharges + percentageSurcharges - discountAmount
  }

  const t = (text: string | undefined, textGe: string | undefined) => {
    return language === 'ka' && textGe ? textGe : text || ''
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-bold">
        {language === 'ka' ? 'შეკვეთის დეტალები' : 'Детали заказа'}
      </h3>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {language === 'ka' ? 'პროდუქტები:' : 'Товары:'}
          </span>
          <span className="font-medium">{calculateBasePrice().toFixed(2)} ₽</span>
        </div>
        
        {order.type === 'DELIVERY' && order.deliveryZone && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {language === 'ka' ? 'მიტანის ღირებულება:' : 'Стоимость доставки:'}
            </span>
            <span className="font-medium">{order.deliveryZone.price.toFixed(2)} ₽</span>
          </div>
        )}
        
        {order.surcharges.length > 0 && (
          <>
            {order.surcharges.map(surcharge => (
              <div key={surcharge.id} className="flex justify-between">
                <span className="text-muted-foreground">
                  {surcharge.title}:
                </span>
                <span className="font-medium">
                  {surcharge.type === 'FIXED'
                    ? `+${surcharge.amount.toFixed(2)} ₽`
                    : `+${surcharge.amount}%`} 
                </span>
              </div>
            ))}
          </>
        )}

        {order.discounts.length > 0 && (
          <div className="space-y-2 pt-2">
            <Label className="text-sm">
              {language === 'ka' ? 'გამოყენებული ფასდაკლებები' : 'Примененные скидки'}
            </Label>
            <div className="space-y-2">
              {order.discounts.map(discount => (
                <div key={discount.id} className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                  <span className="text-sm">{discount.title}</span>
                  <span className="text-sm font-bold text-green-600">
                    -{discount.type === 'FIXED' 
                      ? `${discount.amount} ₽`
                      : `${discount.amount}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-between border-t pt-2">
          <span className="text-muted-foreground font-bold">
            {language === 'ka' ? 'სულ:' : 'Итого:'}
          </span>
          <div className="text-right">
            {order.discounts.length > 0 && (
              <p className="text-sm text-muted-foreground line-through">
                {(calculateBasePrice() + (order.type === 'DELIVERY' && order.deliveryZone ? order.deliveryZone.price : 0)).toFixed(2)} ₽
              </p>
            )}
            <span className="font-bold text-lg">
              {calculateTotal().toFixed(2)} ₽
            </span>
            {order.discounts.length > 0 && (
              <p className="text-sm text-green-600">
                {language === 'ka' ? 'დაზოგვა:' : 'Скидка:'} {(
                  calculateBasePrice() - calculateTotal()
                ).toFixed(2)} ₽
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const ProductCard = ({
  product,
  restaurantId,
  onAddToOrder,
  language,
  categoryName
}: {
  product: Product
  restaurantId: string
  onAddToOrder: (item: OrderItem) => void
  language: Language
  categoryName: string
}) => {
  const [quantity, setQuantity] = useState(1)
  const [isAdditivesOpen, setIsAdditivesOpen] = useState(false)
  const [selectedAdditives, setSelectedAdditives] = useState<string[]>([])

  const t = (textRu: string | undefined, textKa: string | undefined) => {
    if (language === 'ka' && textKa) return textKa
    return textRu || ''
  }

  const translations = {
    modifiers: {
      ru: 'Модификаторы',
      ka: 'მოდიფიკატორები'
    },
    total: {
      ru: 'Итого',
      ka: 'ჯამი'
    },
    perUnit: {
      ru: 'за единицу',
      ka: 'ერთეულზე'
    },
    addToOrder: {
      ru: 'Добавить в заказ',
      ka: 'შეკვეთაში დამატება'
    },
    unavailable: {
      ru: 'Этот продукт временно недоступен',
      ka: 'ეს პროდუქტი დროებით недоступა'
    }
  }

  const restaurantPrice = product.restaurantPrices?.find(
    p => p.restaurantId === restaurantId
  )
  const displayPrice = restaurantPrice?.price ?? product.price
  const isStopList = restaurantPrice?.isStopList ?? false

  const toggleAdditive = (additiveId: string) => {
    setSelectedAdditives(prev =>
      prev.includes(additiveId)
        ? prev.filter(id => id !== additiveId)
        : [...prev, additiveId]
    )
  }

  const handleAddToOrder = () => {
    if (isStopList) {
      toast.error(translations.unavailable[language])
      return
    }

    const newItem: OrderItem = {
      productId: product.id,
      quantity,
      additiveIds: selectedAdditives,
      comment: ''
    }

    onAddToOrder(newItem)
    setQuantity(1)
    setSelectedAdditives([])
    setIsAdditivesOpen(false)
  }

  const totalPrice = (displayPrice + selectedAdditives.reduce((sum, id) => {
    const additive = product.additives.find(a => a.id === id)
    return sum + (additive?.price || 0)
  }, 0)) * quantity

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="relative aspect-square">
        {product.images?.[0] ? (
          <img 
            src={product.images[0]} 
            alt={t(product.title, product.titleGe)} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Utensils className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-grow">
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-1 flex-col">
            <h3 className="font-bold text-sm">
              {t(product.title, product.titleGe)}
            </h3>
            <span className="text-xs text-muted-foreground">{categoryName}</span>
          </div>

          {product.additives.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs justify-between mb-2"
              onClick={() => setIsAdditivesOpen(!isAdditivesOpen)}
            >
              <span>{translations.modifiers[language]}</span>
              <List className="h-4 w-4" />
            </Button>
          )}

          {isAdditivesOpen && product.additives.length > 0 && (
            <div className="mb-3 space-y-2">
              {product.additives.map(additive => (
                <div
                  key={additive.id}
                  className={`flex justify-between items-center p-2 text-xs border rounded cursor-pointer ${
                    selectedAdditives.includes(additive.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => toggleAdditive(additive.id)}
                >
                  <span>{t(additive.title, additive.titleGe)}</span>
                  <span>+{additive.price} ₽</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-medium w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-bold">
              {translations.total[language]}: {totalPrice.toFixed(2)} ₽
            </span>
          </div>

          <div className="text-xs text-muted-foreground mb-2">
            {displayPrice} ₽ {translations.perUnit[language]}
          </div>

          <Button
            className="w-full"
            size="sm"
            onClick={handleAddToOrder}
            disabled={isStopList}
          >
            {translations.addToOrder[language]}
          </Button>
        </div>
      </div>
    </div>
  )
}

const OrderInfoStep = ({
  order,
  setOrder,
  user,
  language,
  onNextStep
}: {
  order: OrderState
  setOrder: (order: OrderState) => void
  user: any
  language: string
  onNextStep: () => void
}) => {
  const [isCheckingDeliveryZone, setIsCheckingDeliveryZone] = useState(false)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledTime, setScheduledTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"))

  const t = (text: string | undefined, textGe: string | undefined) => {
    return language === 'ka' && textGe ? textGe : text || ''
  }

  const handleRestaurantChange = (value: string) => {
    const restaurant = user?.restaurant?.find((r: Restaurant) => r.id === value)
    if (!restaurant) return

    setOrder({
      ...order,
      restaurantId: restaurant.id,
      items: [],
      deliveryZone: null,
      surcharges: [],
      discounts: []
    })
  }

  const checkDeliveryZone = async () => {
    if (!order.deliveryAddress) {
      toast.error(language === 'ka' 
        ? 'შეიყვანეთ მისამართი' 
        : 'Введите адрес доставки')
      return
    }
    setIsCheckingDeliveryZone(true)
    try {
      const token = 'e7a8d3897b07bb4631312ee1e8b376424c6667ea'
      const url = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          query: order.deliveryAddress, 
          count: 1,
          locations: [{ country: "*" }]
        })
      })

      if (!response.ok) throw new Error('Failed to geocode address')

      const data = await response.json()
      const firstSuggestion = data.suggestions?.[0]
      if (!firstSuggestion) throw new Error('Address not found')

      const { geo_lat: lat, geo_lon: lng } = firstSuggestion.data
      if (!lat || !lng) throw new Error('Coordinates not found')

      const deliveryZone = await DeliveryZoneService.findZoneForPoint(
        order.restaurantId,
        parseFloat(lat),
        parseFloat(lng)
      )

      if (!deliveryZone) {
        toast.error(language === 'ka' 
          ? 'მისამართი არ არის მიტანის ზონაში' 
          : 'Адрес не входит в зону доставки')
        setOrder({ ...order, deliveryZone: null })
        return
      }

      setOrder({
        ...order,
        deliveryZone: {
          id: deliveryZone.id,
          title: deliveryZone.title,
          price: deliveryZone.price,
          minOrder: deliveryZone.minOrder
        }
      })

      toast.success(language === 'ka' 
        ? `მიტანის ღირებულება: ${deliveryZone.price} ₽` 
        : `Стоимость доставки: ${deliveryZone.price} ₽`)
    } catch (error) {
      console.error('Delivery zone check error:', error)
      toast.error(language === 'ka' 
        ? 'მიტანის ზონის განსაზღვრის შეცდომა' 
        : 'Ошибка определения зоны доставки')
    } finally {
      setIsCheckingDeliveryZone(false)
    }
  }

  const validateStep = () => {
    if ((order.type === 'DINE_IN' || order.type === 'BANQUET') && !order.tableNumber) {
      toast.error(language === 'ka' ? 'შეიყვანეთ სტოლის ნომერი' : 'Введите номер стола')
      return false
    }

    if (order.type === 'DELIVERY') {
      if (!order.deliveryAddress) {
        toast.error(language === 'ka' ? 'შეიყვანეთ მისამართი' : 'Введите адрес доставки')
        return false
      }
      if (!order.deliveryZone) {
        toast.error(language === 'ka' 
          ? 'გთხოვთ დაადასტუროთ მიტანის მისამართი' 
          : 'Пожалуйста, подтвердите адрес доставки')
        return false
      }
    }

    if (isScheduled && !scheduledTime) {
      toast.error(language === 'ka' 
        ? 'შეიყვანეთ დაგეგმილი დრო' 
        : 'Введите запланированное время')
      return false
    }

    return true
  }

  return (
    <div className="space-y-6 ">
      <h1 className="text-2xl font-bold">{language === 'ka' ? 'ახალი შეკვეთა' : 'Новый заказ'}</h1>
      
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Utensils className="h-4 w-4" />
          {language === 'ka' ? 'შეკვეთის ტიპი' : 'Тип заказа'}
        </Label>
        <OrderTypeSelector
          value={order.type}
          onChange={(type) => setOrder({ 
            ...order, 
            type, 
            deliveryZone: null, 
            surcharges: [],
            discounts: [],
            payment: type === 'DELIVERY' 
              ? { method: 'CASH_TO_COURIER', status: 'PENDING' }
              : { method: 'CASH', status: 'PENDING' }
          })}
          language={language as Language}
        />
      </div>

   
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Banknote className="h-4 w-4" />
          {language === 'ka' ? 'გადახდის მეთოდი' : 'Способ оплаты'}
        </Label>

        <PaymentSelector
          method={order.payment.method}
          onChange={(method) => setOrder({
            ...order,
            payment: { ...order.payment, method }
          })}
          orderType={order.type}
          language={language as Language}
        />
      </div>

   

      {/* Restaurant Selection */}
      {user?.restaurant && user.restaurant.length > 1 && (
        <div className="mb-6 space-y-2">
          <Label className="flex items-center gap-2">
            <Store className="h-4 w-4" />
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
            onChange={(e) => setOrder({ 
              ...order, 
              customerPhone: e.target.value, 
              customerId: null 
            })}
            maxLength={18}
          />
          <Button 
            onClick={async () => {
              if (!order.customerPhone) {
                toast.error(language === 'ka' 
                  ? 'შეიყვანეთ ტელეფონის ნომერი' 
                  : 'Введите номер телефона')
                return
              }
              try {
                const phoneNumber = order.customerPhone.replace(/\D/g, '')
                const customer = await CustomerService.getCustomerByPhone(phoneNumber)
                setOrder({
                  ...order,
                  customerId: customer.id,
                })
                toast.success(language === 'ka' 
                  ? 'კლიენტი წარმატებით მოიძებნა' 
                  : 'Клиент успешно найден')
              } catch (error) {
                console.error('Customer search error:', error)
                setOrder({ ...order, customerId: null })
                toast.error(language === 'ka' 
                  ? 'კლიენტი არ მოიძებნა' 
                  : 'Клиент не найден')
              }
            }}
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

      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              {language === 'ka' ? 'მომხმარებლების რაოდენობა' : 'Количество посетителей'}
            </Label>
            <Input
              type="number"
              min="1"
              value={order.numberOfPeople}
              onChange={(e) => setOrder({
                ...order,
                numberOfPeople: parseInt(e.target.value) || 1
              })}
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm flex items-center gap-2">
              <Table className="h-4 w-4" />
              {language === 'ka' ? 'სტოლის ნომერი' : 'Номер стола'}
            </Label>
            <Input
              disabled={order.type === 'TAKEAWAY' || order.type === 'DELIVERY'}
              type="number"
              min="0"
              value={order.tableNumber}
              onChange={(e) => setOrder({
                ...order,
                tableNumber: parseInt(e.target.value) || 0
              })}
            />
          </div>
        </div>

  <div className="space-y-2">
    <Label className="text-sm flex items-center gap-2">
      <MessageSquare className="h-4 w-4" />
      {language === 'ka' ? 'კომენტარი' : 'Комментарий'}
    </Label>
    <Textarea 
      className="h-full min-h-[120px]" 
      style={{ height: 'calc(2 * (2.5rem + 1px) + 1rem)' }}
      value={order.comment}
      onChange={(e) => setOrder({
        ...order,
        comment: e.target.value
      })}
      placeholder={language === 'ka' ? 'დამატებითი ინფორმაცია' : 'Дополнительная информация'}
    />
  </div>
</div>

       {order.type === 'DELIVERY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <Label className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {language === 'ka' ? 'მისამართი' : 'Адрес доставки'}
            </Label>
            <div className="flex w-full">
              <div className='w-full mr-4'>
              <AddressInput
                value={order.deliveryAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrder({
                  ...order,
                  deliveryAddress: e.target.value,
                  deliveryZone: null
                })}
                language={language as Language}
              />
              </div>
              <Button
                onClick={checkDeliveryZone}
                disabled={!order.deliveryAddress || isCheckingDeliveryZone}
                variant="secondary"
                className="whitespace-nowrap"
              >
                {isCheckingDeliveryZone 
                  ? language === 'ka' ? 'იტვირთება...' : 'Загрузка...'
                  : language === 'ka' ? 'ღირებულების შემოწმება' : 'Проверить стоимость'}
              </Button>
            </div>
            {order.deliveryZone && (
              <p className="text-sm text-green-600">
                {language === 'ka' 
                  ? `მიტანის ზონა: ${order.deliveryZone.title}, ღირებულება: ${order.deliveryZone.price} ₽`
                  : `Зона доставки: ${order.deliveryZone.title}, стоимость: ${order.deliveryZone.price} ₽`}
              </p>
            )}
          </div>
          <div className="space-y-1 ">
            <Label className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {language === 'ka' ? 'დრო მიტანისთვის' : 'Время доставки'}
            </Label>
            <Input
              type="time"
              value={order.deliveryTime}
              onChange={(e) => setOrder({
                ...order,
                deliveryTime: e.target.value
              })}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {language === 'ka' ? 'დამატებითი ინსტრუქციები' : 'Дополнительные инструкции'}
            </Label>
            <Textarea
              value={order.deliveryNotes}
              onChange={(e) => setOrder({
                ...order,
                deliveryNotes: e.target.value
              })}
              placeholder={language === 'ka' ? 'მაგ. დარეკეთ შესვლამდე' : 'Например: Позвоните перед приездом'}
            />
          </div>
        </div>
      )}

      <div className="mb-6 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="scheduled-order"
              checked={isScheduled}
              onCheckedChange={(checked) => setIsScheduled(!!checked)}
            />
            <Label htmlFor="scheduled-order" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
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

      <div className="flex justify-end">
        <Button 
          onClick={() => {
            if (validateStep()) {
              onNextStep()
            }
          }}
          size="lg"
          className="text-lg"
        >
          {language === 'ka' ? 'პროდუქტების არჩევა' : 'Далее'} 
        </Button>
      </div>
    </div>
  )
}

const ProductSelectionStep = ({
  order,
  setOrder,
  products,
  categories,
  selectedRestaurant,
  language,
  onSubmit,
  onPrevStep
}: {
  order: OrderState
  setOrder: (order: OrderState) => void
  products: Product[]
  categories: Category[]
  selectedRestaurant: Restaurant | null
  language: string
  onSubmit: () => void
  onPrevStep: () => void
}) => {
  const t = (text: string | undefined, textGe: string | undefined) => {
    return language === 'ka' && textGe ? textGe : text || ''
  }

  const handleAddItem = (newItem: OrderItem) => {
    const existingItemIndex = order.items.findIndex(
      item => item.productId === newItem.productId && 
             JSON.stringify(item.additiveIds) === JSON.stringify(newItem.additiveIds) &&
             item.comment === newItem.comment
    )

    if (existingItemIndex >= 0) {
      const updatedItems = [...order.items]
      updatedItems[existingItemIndex].quantity += newItem.quantity
      setOrder({ ...order, items: updatedItems })
    } else {
      setOrder({ ...order, items: [...order.items, newItem] })
    }
  }

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return

    const newItems = [...order.items]
    newItems[index].quantity = newQuantity
    setOrder({ ...order, items: newItems })
  }

  const handleRemoveItem = (index: number) => {
    const newItems = order.items.filter((_, i) => i !== index)
    setOrder({ ...order, items: newItems })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{language === 'ka' ? 'პროდუქტების არჩევა' : 'Выбор продуктов'}</h1>
        <Button 
          variant="outline" 
          onClick={onPrevStep}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-5 w-5" />
          {language === 'ka' ? 'უკან' : 'Назад'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Products Selection and Order Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products Selection */}
          <div className="space-y-6">
            {categories.length > 0 && products.length > 0 ? (
              <Tabs defaultValue={categories[0].id} className="w-full">
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center z-10">
                    <button 
                      onClick={() => {
                        const container = document.getElementById('scrollContainer');
                        if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
                      }}
                      className="p-2"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>
                  </div>

                  <TabsList 
                    id="scrollContainer"
                    className="flex w-full overflow-x-auto overflow-y-hidden scrollbar-hide whitespace-nowrap py-8 gap-4 px-8 scroll-smooth"
                  >
                    {categories.map(category => (
                      <TabsTrigger 
                        key={category.id} 
                        value={category.id}
                        className="flex-shrink-0 px-6 py-6 text-lg font-medium rounded-lg data-[state=active]:bg-gray-800 data-[state=active]:text-white"
                      >
                        {t(category.title, category.titleGe)}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <div className="absolute right-0 top-0 bottom-0 flex items-center z-10">
                    <button 
                      onClick={() => {
                        const container = document.getElementById('scrollContainer');
                        if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
                      }}
                      className="p-2"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-800" />
                    </button>
                  </div>
                </div>
                            
                {categories.map(category => {
                  const categoryProducts = products.filter(p => p.categoryId === category.id)
                  return (
                    <TabsContent key={category.id} value={category.id} className="mt-4">
                      {categoryProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {categoryProducts.map(product => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              restaurantId={order.restaurantId}
                              onAddToOrder={handleAddItem}
                              language={language as Language} 
                              categoryName={category.title}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          {language === 'ka' ? 'პროდუქტები არ მოიძებნა' : 'Продукты не найдены'}
                        </p>
                      )}
                    </TabsContent>
                  )
                })}
              </Tabs>
            ) : (
              <div className="p-4 border rounded-lg text-center">
                {language === 'ka' ? 'პროდუქტები არ მოიძებნა' : 'Продукты не найдены'}
              </div>
            )}
          </div>

          {/* Selected Order Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">{language === 'ka' ? 'არჩეული პროდუქტები' : 'Выбранные продукты'}</h3>
            {order.items.length === 0 ? (
              <div className="p-4 border rounded-lg text-center">
                <p className="text-muted-foreground">
                  {language === 'ka' ? 'დაამატეთ პროდუქტები შეკვეთაში' : 'Добавьте продукты в заказ'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {order.items.map((item, index) => {
                  const product = products.find(p => p.id === item.productId)
                  const itemAdditives = product?.additives.filter(a =>
                    item.additiveIds.includes(a.id)
                  )
                  const itemPrice = (product?.price || 0) +
                    (itemAdditives?.reduce((sum, a) => sum + a.price, 0) || 0)

                  return (
                    <div key={index} className="p-4 border rounded-lg shadow-sm bg-white">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <h4 className="font-bold line-clamp-1">
                            {t(product?.title, product?.titleGe)}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {itemPrice.toFixed(2)} ₽ × {item.quantity} = {(itemPrice * item.quantity).toFixed(2)} ₽
                          </p>
                          {itemAdditives && itemAdditives.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {itemAdditives.map(a => t(a.title, a.titleGe)).join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleQuantityChange(index, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleQuantityChange(index, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Collapsible Order Information */}
          <Collapsible>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
                <span className="font-medium">
                  {language === 'ka' ? 'შეკვეთის დეტალები' : 'Детали заказа'}
                </span>
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 border rounded-lg mt-2 space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm">
                    {language === 'ka' ? 'ტელეფონის ნომერი' : 'Номер телефона'}
                  </Label>
                  <Input
                    value={order.customerPhone}
                    onChange={(e) => setOrder({ ...order, customerPhone: e.target.value })}
                    placeholder="+7 (___) ___-__-__"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm">
                    {language === 'ka' ? 'მომხმარებლების რაოდენობა' : 'Количество посетителей'}
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={order.numberOfPeople}
                    onChange={(e) => setOrder({
                      ...order,
                      numberOfPeople: parseInt(e.target.value) || 1
                    })}
                  />
                </div>

                {order.type === 'DINE_IN' && (
                  <div className="space-y-1">
                    <Label className="text-sm">
                      {language === 'ka' ? 'სტოლის ნომერი' : 'Номер стола'}
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={order.tableNumber}
                      onChange={(e) => setOrder({
                        ...order,
                        tableNumber: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                )}

                {order.type === 'DELIVERY' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-sm">
                        {language === 'ka' ? 'მისამართი' : 'Адрес доставки'}
                      </Label>
                      <Input
                        value={order.deliveryAddress}
                        onChange={(e) => setOrder({ 
                          ...order, 
                          deliveryAddress: e.target.value,
                          deliveryZone: null
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">
                        {language === 'ka' ? 'დრო მიტანისთვის' : 'Время доставки'}
                      </Label>
                      <Input
                        type="time"
                        value={order.deliveryTime}
                        onChange={(e) => setOrder({ ...order, deliveryTime: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <Label className="text-sm">
                    {language === 'ka' ? 'კომენტარი' : 'Комментарий'}
                  </Label>
                  <Textarea
                    value={order.comment}
                    onChange={(e) => setOrder({ ...order, comment: e.target.value })}
                    rows={3}
                    placeholder={language === 'ka' 
                      ? 'დამატებითი ინფორმაცია' 
                      : 'Дополнительная информация'}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-6">
          <OrderSummary 
            order={order} 
            products={products} 
            restaurantId={order.restaurantId}
            language={language}
          />

         

          {/* Surcharges */}
          <SurchargeSelector
            orderType={order.type}
            restaurantId={order.restaurantId}
            selectedSurcharges={order.surcharges}
            onSelect={(surcharges) => setOrder({ ...order, surcharges })}
            language={language}
          />

          {/* Promo Codes */}
          <PromoCodeInput
            orderType={order.type}
            restaurantId={order.restaurantId}
            onApply={(discount) => setOrder({
              ...order,
              discounts: [...order.discounts, discount]
            })}
            language={language}
          />

          {/* Submit Button */}
          <Button
            className="w-full py-6 text-lg font-bold"
            onClick={onSubmit}
            disabled={order.items.length === 0}
          >
            {language === 'ka' ? 'შეკვეთის დასრულება' : 'Завершить заказ'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function NewOrderPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguageStore()
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [order, setOrder] = useState<OrderState>({
    restaurantId: '',
    items: [],
    payment: { method: 'CASH', status: 'PENDING' },
    type: 'DINE_IN',
    source: 'PANEL',
    comment: '',
    numberOfPeople: 1,
    tableNumber: 0,
    deliveryAddress: '',
    deliveryTime: '',
    deliveryNotes: '',
    customerId: null,
    customerPhone: '',
    deliveryZone: null,
    surcharges: [],
    discounts: []
  })
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingState, setLoadingState] = useState<'initial' | 'loading' | 'success' | 'error'>('initial')
  const [activeShiftId, setActiveShiftId] = useState('')
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [isCreatingShift, setIsCreatingShift] = useState(false)
  const [currentStep, setCurrentStep] = useState<'info' | 'products'>('info')

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
        
        if (!activeShift) {
          setIsCreatingShift(true)
          const newShift = await ShiftService.createShift({
            restaurantId: selectedRestaurant.id,
            status: 'STARTED',
            startTime: new Date(),
          })
          setActiveShiftId(newShift.id)
          toast.success(language === 'ka' ? 'ახალი ცვლა გაიხსნა' : 'Новая смена открыта')
        } else {
          setActiveShiftId(activeShift.id)
        }
        
        setLoadingState('success')
      } catch (error) {
        console.error('Failed to load data:', error)
        setLoadingState('error')
        toast.error(language === 'ka' ? 'მონაცემების ჩატვირთვის შეცდომა' : 'Ошибка загрузки данных')
      } finally {
        setIsCreatingShift(false)
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
  }, [selectedRestaurant, language, loadingState, user?.id])

  const handleSubmit = async () => {
    for (const discount of order.discounts) {
      const discountDetails = await DiscountService.getById(discount.id)
      if (discountDetails.minOrderAmount && calculateBasePrice() < discountDetails.minOrderAmount) {
        toast.error(language === 'ka' 
          ? `მინიმალური შეკვეთის თანხა ამ ფასდაკლებისთვის: ${discountDetails.minOrderAmount} ₽`
          : `Минимальная сумма заказа для этой скидки: ${discountDetails.minOrderAmount} ₽`)
        return
      }
    }

    if (!activeShiftId) {
      toast.error(language === 'ka' ? 'არ არის აქტიური ცვლა' : 'Нет активной смены')
      return
    }
    if (order.items.length === 0 || !selectedRestaurant) {
      toast.error(language === 'ka' ? 'დაამატეთ პროდუქტები შეკვეთაში' : 'Добавьте продукты в заказ')
      return
    }

    try {
      let customerId = order.customerId
      if (!customerId && order.customerPhone) {
        setIsCreatingCustomer(true)
        const phoneNumber = order.customerPhone.replace(/\D/g, '')
        const newCustomer = await CustomerService.createCustomer({
          phone: phoneNumber,
        })
        customerId = newCustomer.id
        setOrder(prev => ({ ...prev, customerId }))
      }

      const orderData = {
        ...order,
        customerId,
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
        surcharges: order.surcharges.map(s => ({
          surchargeId: s.id,
          amount: s.amount,
          description: s.title
        })),
        discounts: order.discounts.map(d => ({
          discountId: d.id,
          amount: d.amount,
          description: d.title
        }))
      }

      await OrderService.create(orderData)
      toast.success(language === 'ka' ? 'შეკვეთა წარმატებით შეიქმნა!' : 'Заказ успешно создан!')
      router.push('/orders')
    } catch (error) {
      console.error('Order creation error:', error)
      toast.error(language === 'ka' ? 'შეკვეთის შექმნის შეცდომა' : 'Ошибка при создании заказа')
    } finally {
      setIsCreatingCustomer(false)
    }
  }

  const calculateBasePrice = () => {
    const itemsTotal = order.items.reduce((sum, item) => {
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

    const deliveryCost = order.type === 'DELIVERY' && order.deliveryZone && order.deliveryZone.price 
      ? order.deliveryZone.price 
      : 0

    return itemsTotal + deliveryCost
  }

  const calculateTotal = () => {
    const basePrice = calculateBasePrice()
    
    const fixedSurcharges = order.surcharges
      .filter(s => s.type === 'FIXED')
      .reduce((sum, s) => sum + s.amount, 0)

    const percentageSurcharges = order.surcharges
      .filter(s => s.type === 'PERCENTAGE')
      .reduce((sum, s) => sum + (basePrice * (s.amount / 100)), 0)

    const discountAmount = order.discounts.reduce((sum, discount) => {
      if (discount.type === 'FIXED') {
        return sum + discount.amount
      } else {
        return sum + (basePrice * (discount.amount / 100))
      }
    }, 0)

    return basePrice + fixedSurcharges + percentageSurcharges - discountAmount
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
      <div className=" py-6">
        {currentStep === 'info' ? (
          <OrderInfoStep
            order={order}
            setOrder={setOrder}
            user={user}
            language={language}
            onNextStep={() => setCurrentStep('products')}
          />
        ) : (
          <ProductSelectionStep
            order={order}
            setOrder={setOrder}
            products={products}
            categories={categories}
            selectedRestaurant={selectedRestaurant}
            language={language}
            onSubmit={handleSubmit}
            onPrevStep={() => setCurrentStep('info')}
          />
        )}
      </div>
    </AccessCheck>
  )
}