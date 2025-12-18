'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Minus, Plus, Trash, List } from 'lucide-react'
import { Utensils } from 'lucide-react'
import { toast } from 'sonner'
import { OrderItem } from '@/lib/types/order'
import { Product } from '@/lib/types/product'
import { Language } from '@/lib/stores/language-store'

interface NewItem {
    productId: string,
    quantity: number,
    additiveIds: any,
    comment: string
}
interface ProductCardProps {
  product: Product
  restaurantId: string
  onAddToOrder: (item: OrderItem) => void
  language: Language
  categoryName: string
}

export const ProductCard = ({
  product,
  restaurantId,
  onAddToOrder,
  language,
  categoryName
}: ProductCardProps) => {
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

    const newItem: NewItem = {
      productId: product.id,
      quantity,
      additiveIds: selectedAdditives,
      comment: ''
    }

    onAddToOrder(newItem as OrderItem)
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