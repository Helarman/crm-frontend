export interface OrderState {
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

export interface OrderItem {
  productId: string
  quantity: number
  additiveIds: string[]
  comment?: string
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
  images?: string[]
  restaurantPrices: {
    restaurantId: string
    price: number
    isStopList: boolean
  }[]
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