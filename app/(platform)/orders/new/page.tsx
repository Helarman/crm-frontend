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
import { Minus, Plus, Trash, ChevronLeft } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShiftService } from '@/lib/api/shift.service'
import { AccessCheck } from '@/components/AccessCheck'

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
}

export interface Restaurant {
  id: string
  title: string
  titleGe?: string
  categories: Category[]
}

export default function NewOrderPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguageStore()
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [order, setOrder] = useState({
    restaurantId: '',
    items: [] as OrderItem[],
    payment: { method: 'CASH' as any , status: 'PAID' as const },
    type: 'DINE_IN' as const
  })
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingState, setLoadingState] = useState<'initial' | 'loading' | 'success' | 'error'>('initial')
  const [activeShiftId, setActiveShiftId] = useState('')

  // Инициализация ресторана
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

  // Загрузка данных
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

  const total = order.items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId)
    const productPrice = product?.price || 0

    const additivesPrice = (product?.additives || [])
      .filter(a => item.additiveIds.includes(a.id))
      .reduce((sum, a) => sum + a.price, 0)

    return sum + (item.quantity * (productPrice + additivesPrice))
  }, 0)

  const handleSubmit = async () => {
    if (!activeShiftId) {
      toast.error('В ресторане нет активных смен')
      return
    }
    if (order.items.length === 0 || !selectedRestaurant) {
      toast.error(language === 'ka' ? 'დაამატეთ პროდუქტები შეკვეთაში' : 'Добавьте продукты в заказ')
      return
    }

    try {
      const orderData = {
        ...order,
        total,
        shiftId: activeShiftId,
        items: order.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          comment: item.comment || '',
          additiveIds: item.additiveIds
        })),
      }

      await OrderService.create(orderData)
      toast.success(language === 'ka' ? 'შეკვეთა წარმატებით შეიქმნა!' : 'Заказ успешно создан!')
      router.push('/orders')
    } catch (error) {
      console.error('Order creation error:', error)
      toast.error(language === 'ka' ? 'შეკვეთის შექმნის შეცდომა' : 'Ошибка при создании заказа')
    }
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
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{language === 'ka' ? 'ახალი შეკვეთა' : 'Новый заказ'}</h1>

          {user?.restaurant && user.restaurant.length > 1 && (
            <div className="flex items-center gap-2">
              <Select
                value={order.restaurantId}
                onValueChange={handleRestaurantChange}
              >
                <SelectTrigger className="w-[200px]">
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {categories.length > 0 && products.length > 0 ? (
              <ProductSelector
                products={products}
                categories={categories}
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
            <PaymentSelector
              method={order.payment.method}
              onChange={(method) => setOrder(prev => ({
                ...prev,
                payment: { ...prev.payment, method }
              }))}
              language={language}
            />

            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>{language === 'ka' ? 'პროდუქტები:' : 'Товары:'}</span>
                <span>{total.toFixed(2)} ₽</span>
              </div>

              {selectedRestaurant && (
                <div className="pt-2 text-sm text-muted-foreground">
                  {language === 'ka' ? 'რესტორანი:' : 'Ресторан:'} {selectedRestaurant.title}
                </div>
              )}

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

function ProductSelector({
  products,
  categories,
  onItemsChange,
  language
}: {
  products: Product[]
  categories: Category[]
  onItemsChange: (items: OrderItem[]) => void
  language: string
}) {
  const [items, setItems] = useState<OrderItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedAdditives, setSelectedAdditives] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  // Функция для переключения добавок
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

  // Сбрасываем выбор добавок при смене категории
  useEffect(() => {
    setSelectedProduct(null)
    setSelectedAdditives([])
    setComment('')
  }, [selectedCategory])

  // Сбрасываем выбор добавок при смене продукта
  useEffect(() => {
    setSelectedAdditives([])
    setComment('')
  }, [selectedProduct])

  const handleAddItem = () => {
    if (!selectedProduct) return

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

      {/* Выбор категории - УЛУЧШЕННЫЕ КАРТОЧКИ */}
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
                <div className="text-2xl mb-3">🍽️</div>
                <span className="font-semibold text-base text-center">
                  {t(category.title, category.titleGe)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Кнопка назад к категориям - УЛУЧШЕННАЯ */}
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-1 text-base text-primary hover:text-primary/80 font-medium"
          >
            <ChevronLeft className="h-5 w-5" />
            {language === 'ka' ? 'უკან კატეგორიებში' : 'Назад к категориям'}
          </button>

          {/* Выбор продукта - УЛУЧШЕННЫЕ КАРТОЧКИ */}
          <div className="space-y-3">
            <Label className="text-lg">{language === 'ka' ? 'პროდუქტები' : 'Продукты'}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={`p-6 border-2 rounded-xl flex flex-col items-center transition-all hover:scale-[1.02] active:scale-[0.98]
                  ${selectedProduct?.id === product.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                      : 'hover:bg-accent shadow-sm hover:shadow-md'
                    }`}
                >
                  <div className="text-2xl mb-3">🍕</div>
                  <span className="font-semibold text-base text-center">
                    {t(product.title, product.titleGe)}
                  </span>
                  <span className="text-base mt-2 font-bold">{product.price} ₽</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Выбор добавок - УЛУЧШЕННЫЙ */}
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

      {/* Комментарий - УЛУЧШЕННЫЙ */}
      {selectedProduct && (
        <div className="space-y-3">
          <Label className="text-lg">{language === 'ka' ? 'კომენტარი' : 'Комментарий'}</Label>
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={language === 'ka' ? 'განსაკუთრებული სურვილები' : 'Особые пожелания'}
            className="p-4 text-base border-2"
          />
        </div>
      )}

      {/* Кнопка добавления в заказ - УЛУЧШЕННАЯ */}
      {selectedProduct && (
        <Button
          onClick={handleAddItem}
          className="w-full py-6 text-lg font-bold"
        >
          {language === 'ka' ? 'შეკვეთაში დამატება' : 'Добавить в заказ'}
        </Button>
      )}

      {/* Текущий заказ - УЛУЧШЕННЫЙ */}
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