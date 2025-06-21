'use client'

import { useState } from 'react'
import { OrderItem, OrderState } from '@/lib/types/order'
import { Product } from '@/lib/types/product'
import { Category } from '@/lib/types/category'
import { Restaurant } from '@/lib/types/restaurant'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
  Trash,
  List,
  Tablet,
  Globe,
  Smartphone
} from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrderSummary } from './OrderSummary'
import { SurchargeSelector } from './SurchargeSelector'
import { ProductCard } from './ProductCard'

interface ProductSelectionStepProps {
  order: OrderState
  setOrder: (order: OrderState) => void
  products: Product[]
  categories: Category[]
  selectedRestaurant: Restaurant | null
  language: string
  onSubmit: () => void
  onPrevStep: () => void
}

export const ProductSelectionStep = ({
  order,
  setOrder,
  products,
  categories,
  selectedRestaurant,
  language,
  onSubmit,
  onPrevStep
}: ProductSelectionStepProps) => {
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
        <div className="lg:col-span-2 space-y-6">
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
                              language={language as any} 
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

        <div className="space-y-6">
          <OrderSummary 
            order={order} 
            products={products} 
            restaurantId={order.restaurantId}
            language={language}
          />

          <SurchargeSelector
            orderType={order.type}
            restaurantId={order.restaurantId}
            selectedSurcharges={order.surcharges}
            onSelect={(surcharges) => setOrder({ ...order, surcharges })}
            language={language}
          />

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