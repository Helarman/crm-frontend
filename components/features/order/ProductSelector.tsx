'use client'

import { JSX, useState } from "react"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Minus, Plus, Trash, Pizza, Utensils, Coffee, Sandwich, IceCream } from 'lucide-react'

// Иконки для категорий
const categoryIcons: Record<string, JSX.Element> = {
  'pizza': <Pizza className="w-6 h-6" />,
  'main': <Utensils className="w-6 h-6" />,
  'drinks': <Coffee className="w-6 h-6" />,
  'snacks': <Sandwich className="w-6 h-6" />,
  'desserts': <IceCream className="w-6 h-6" />,
  'default': <Utensils className="w-6 h-6" />
}

interface ProductSelectorProps {
  products: any[]
  categories: any[]
  additives: any[]
  onItemsChange: (items: any[]) => void
}

export function ProductSelector({ products, categories, additives, onItemsChange }: ProductSelectorProps) {
  const [items, setItems] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedAdditives, setSelectedAdditives] = useState<any[]>([])
  const [comment, setComment] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoryId === selectedCategory)
    : []

  const handleAddItem = () => {
    if (!selectedProduct) return

    const newItem = {
      productId: selectedProduct.id,
      quantity: 1,
      additiveIds: selectedAdditives.map(a => a.id),
      comment: comment || undefined
    }

    const newItems = [...items, newItem]
    setItems(newItems)
    onItemsChange(newItems)
    resetSelection()
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

  const resetSelection = () => {
    setSelectedProduct(null)
    setSelectedAdditives([])
    setComment('')
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return categoryIcons[category?.icon || 'default'] || categoryIcons.default
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Выберите блюда</h2>
      
      {/* Выбор категории */}
      <div className="space-y-2">
        <Label>Категории</Label>
        <div className="flex overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex space-x-3">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border w-32 h-32 flex-shrink-0 transition-colors ${
                  selectedCategory === category.id 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background hover:bg-accent'
                }`}
              >
                <div className="mb-2">
                  {getCategoryIcon(category.id)}
                </div>
                <span className="font-medium text-sm">{category.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Выбор продукта */}
      {selectedCategory && (
        <div className="space-y-2">
          <Label>Продукты</Label>
          <div className="flex overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex space-x-3">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border w-32 h-32 flex-shrink-0 transition-colors ${
                    selectedProduct?.id === product.id 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background hover:bg-accent'
                  }`}
                >
                  <div className="mb-2">
                    {getCategoryIcon(selectedCategory)}
                  </div>
                  <span className="font-medium text-sm">{product.title}</span>
                  <span className="text-sm">{product.price} ₽</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Выбор добавок */}
      {selectedProduct && (
        <div className="space-y-2">
          <Label>Добавки</Label>
          <div className="flex overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex space-x-3">
              {additives.map(additive => (
                <button
                  key={additive.id}
                  onClick={() => {
                    setSelectedAdditives(prev => 
                      prev.some(a => a.id === additive.id)
                        ? prev.filter(a => a.id !== additive.id)
                        : [...prev, additive]
                    )
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border w-32 h-32 flex-shrink-0 transition-colors ${
                    selectedAdditives.some(a => a.id === additive.id)
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background hover:bg-accent'
                  }`}
                >
                  <div className="mb-2">
                    {getCategoryIcon('default')}
                  </div>
                  <span className="font-medium text-sm">{additive.title}</span>
                  <span className="text-sm">+{additive.price} ₽</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Комментарий */}
      {selectedProduct && (
        <div className="space-y-2 px-4">
          <Label>Комментарий</Label>
          <Input 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Особые пожелания"
          />
        </div>
      )}

      {/* Кнопка добавления */}
      {selectedProduct && (
        <div className="px-4">
          <Button 
            onClick={handleAddItem}
            className="w-full"
          >
            Добавить в заказ
          </Button>
        </div>
      )}

      {/* Текущий заказ */}
      <div className="mt-6 space-y-3 px-4">
        <h3 className="font-medium">Текущий заказ</h3>
        {items.length === 0 ? ( <p className="text-muted-foreground">Добавьте продукты в заказ</p> ) : (
          <ul className="space-y-2">
            <>
            {items.map((item, index) => {
              const product = products.find(p => p.id === item.productId)
              const itemAdditives = additives.filter(a => item.additiveIds?.includes(a.id))
              const itemPrice = (product?.price || 0) + 
                itemAdditives.reduce((sum, a) => sum + (a?.price || 0), 0)
              
              return (
                <li key={index} className="p-3 border rounded flex justify-between">
                  <div>
                    <p className="font-medium">
                      {product?.title} × {item.quantity} = {(itemPrice * item.quantity).toFixed(2)} ₽
                    </p>
                    {itemAdditives.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Добавки: {itemAdditives.map(a => a.title).join(', ')}
                      </p>
                    )}
                    {item.comment && (
                      <p className="text-sm text-muted-foreground">
                        Комментарий: {item.comment}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(index, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span>{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(index, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              )
            })
          }  
          </>
          </ul>
        )
        }
      </div>
  </div>
  )
}