'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  Minus, 
  Plus, 
  ChevronLeft,
  Utensils,
  Store,
  X
} from 'lucide-react'

interface ProductSelectorProps {
  products: Product[]
  categories: Category[]
  restaurantId: string
  onAddItem: (item: {
    productId: string
    quantity: number
    additiveIds: string[]
    comment?: string
  }) => Promise<void>
  language: string
  onClose?: () => void
}

interface OrderItem {
  productId: string
  quantity: number
  additiveIds: string[]
  comment?: string
}

export interface Additive {
  id: string
  title: string
  titleGe?: string
  price: number
}

export interface Category {
  id: string
  title: string
  titleGe?: string
  order?: number
}

export interface Product {
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

export function AddProductToOrder({
  products,
  categories,
  restaurantId,
  onAddItem,
  language,
  onClose
}: ProductSelectorProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedAdditives, setSelectedAdditives] = useState<Additive[]>([])
  const [comment, setComment] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleAdditive = (additive: Additive) => {
    setSelectedAdditives(prev =>
      prev.some(a => a.id === additive.id)
        ? prev.filter(a => a.id !== additive.id)
        : [...prev, additive]
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
    setQuantity(1)
  }, [selectedCategory])

  useEffect(() => {
    setSelectedAdditives([])
    setComment('')
    setQuantity(1)
  }, [selectedProduct])

  const calculateItemPrice = (product: Product, additives: Additive[], qty: number) => {
    const restaurantPrice = product.restaurantPrices?.find(
      p => p.restaurantId === restaurantId
    )
    const basePrice = restaurantPrice?.price ?? product.price
    const additivesPrice = additives.reduce((sum, a) => sum + a.price, 0)
    
    return (basePrice + additivesPrice) * qty
  }

  const handleAddToOrder = async () => {
    if (!selectedProduct) return

    const isStopList = selectedProduct.restaurantPrices?.find(
      p => p.restaurantId === restaurantId
    )?.isStopList

    if (isStopList) {
      toast.error(t(
        'Этот продукт временно недоступен', 
        'ეს პროდუქტი ამჟამად არ არის ხელმისაწვდომი'
      ))
      return
    }

    setIsSubmitting(true)

    try {
      const newItem: OrderItem = {
        productId: selectedProduct.id,
        quantity,
        additiveIds: selectedAdditives.map(a => a.id),
        comment: comment.trim() || undefined
      }

      await onAddItem(newItem)
      
      setSelectedProduct(null)
      setSelectedAdditives([])
      setComment('')
      setQuantity(1)
      
      if (onClose) {
        onClose()
      }
      
      toast.success(t(
        'Товар добавлен в заказ', 
        'პროდუქტი დაემატა შეკვეთას'
      ))
      
    } catch (error) {
      console.error('Failed to add item:', error)
      toast.error(t(
        'Не удалось добавить товар', 
        'პროდუქტის დამატება ვერ მოხერხდა'
      ))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col ">
      <div className="flex-1 overflow-y-auto p-4 ">
        {!selectedCategory ? (
          <div className="space-y-4">
            <div className="px-2">
              <Label className="text-lg">
                {t('Выберите категорию', 'აირჩიეთ კატეგორია')}
              </Label>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 items-start">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category)}
                  className="p-3 border rounded-lg flex flex-col items-center hover:bg-accent transition-all 
                  shadow-sm hover:shadow-md h-full min-h-[140px] justify-start
                  dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <Store className="h-8 w-8 mb-2" />
                  <span className="font-medium text-base text-center line-clamp-2">
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
              className="flex items-center gap-2 text-sm text-muted-foreground mb-4 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('Все категории', 'ყველა კატეგორია')}
            </button>

            <div className="space-y-4">
              <div className="px-2">
                <Label className="text-lg">
                  {t('Выберите продукт', 'აირჩიეთ პროდუქტი')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('Категория:', 'კატეგორია:')} {t(selectedCategory.title, selectedCategory.titleGe)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 items-start">
                {filteredProducts.map(product => {
                  const restaurantPrice = product.restaurantPrices?.find(
                    p => p.restaurantId === restaurantId
                  )
                  const isStopList = restaurantPrice?.isStopList ?? false
      
                  return (
                    <button
                      key={product.id}
                      onClick={() => !isStopList && setSelectedProduct(product)}
                      className={`p-3 border rounded-lg flex flex-col items-center h-full min-h-[140px] justify-between
                      transition-all shadow-sm hover:shadow-md
                      ${selectedProduct?.id === product.id
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                          : 'hover:bg-accent dark:hover:bg-gray-800 dark:border-gray-700'
                        }
                      ${isStopList ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isStopList}
                    >
                      <div className="flex flex-col items-center w-full">
                        <Utensils className="h-8 w-8 mb-2" />
                        <span className="font-medium text-base text-center line-clamp-2">
                          {t(product.title, product.titleGe)}
                        </span>
                      </div>
                      <div className="w-full mt-2">
                        <span className="text-base font-bold block text-center">
                          {restaurantPrice?.price ?? product.price} ₽
                        </span>
                        {isStopList && (
                          <span className="text-xs text-red-500 dark:text-red-400 block text-center">
                            {t('Нет в наличии', 'არ არის ხელმისაწვდომი')}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {selectedProduct && (
          <div className="mt-6 space-y-4">
            <div className="border-t pt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 p-2 rounded-md">
                  <Utensils className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {t(selectedProduct.title, selectedProduct.titleGe)}
                  </h3>
                  <p className="text-base font-bold text-primary">
                    {calculateItemPrice(selectedProduct, selectedAdditives, 1)} ₽
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-base">
                    {t('Количество', 'რაოდენობა')}
                  </Label>
                  <div className="flex items-center gap-3 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 p-0"
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      disabled={isSubmitting}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-20 text-center h-10"
                      disabled={isSubmitting}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 p-0"
                      onClick={() => setQuantity(prev => prev + 1)}
                      disabled={isSubmitting}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {selectedProduct.additives.length > 0 && (
                  <div>
                    <Label className="text-base">
                      {t('Добавки', 'დამატებები')}
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                      {selectedProduct.additives.map(additive => (
                        <button
                          key={additive.id}
                          onClick={() => !isSubmitting && toggleAdditive(additive)}
                          className={`p-2 border rounded-md flex justify-between items-center text-sm
                          ${selectedAdditives.some(a => a.id === additive.id)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'hover:bg-accent dark:hover:bg-gray-800 dark:border-gray-700'
                            }
                          ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={isSubmitting}
                        >
                          <span>{t(additive.title, additive.titleGe)}</span>
                          <span className="font-bold ml-2">+{additive.price} ₽</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-base">
                    {t('Комментарий', 'კომენტარი')}
                  </Label>
                  <Input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t('Особые пожелания', 'განსაკუთრებული სურვილები')}
                    disabled={isSubmitting}
                    className="mt-1 h-10"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-background border-t pt-3 pb-2">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium">
                  {t('Итого:', 'სულ:')}
                </span>
                <span className="text-xl font-bold">
                  {calculateItemPrice(selectedProduct, selectedAdditives, quantity)} ₽
                </span>
              </div>
              
              <Button
                onClick={handleAddToOrder}
                className="w-full py-5 text-base font-bold"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? t('Добавление...', 'დამატება...') 
                  : t('Добавить в заказ', 'შეკვეთაში დამატება')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}