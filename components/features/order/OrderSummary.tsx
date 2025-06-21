'use client'

import { OrderState } from '@/lib/types/order'
import { Product } from '@/lib/types/product'
interface OrderSummaryProps {
  order: OrderState
  products: Product[]
  restaurantId: string
  language: string
}

export const OrderSummary = ({
  order,
  products,
  restaurantId,
  language
}: OrderSummaryProps) => {
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

    return basePrice + fixedSurcharges + percentageSurcharges
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
        
        <div className="flex justify-between border-t pt-2">
          <span className="text-muted-foreground font-bold">
            {language === 'ka' ? 'სულ:' : 'Итого:'}
          </span>
          <span className="font-bold text-lg">
            {calculateTotal().toFixed(2)} ₽
          </span>
        </div>
      </div>
    </div>
  )
}