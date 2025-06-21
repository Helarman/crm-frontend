import { OrderItemStatus } from "../api/order.service"
import { Product } from "./product"

export interface OrderState {
  restaurantId: string
  items: OrderItem[]
  payment: { 
    method: 'CASH' | 'CARD' | 'CASH_TO_COURIER' | 'CARD_TO_COURIER'
    status: 'PAID' | 'PENDING'
  }
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
  discounts?: {
    id: string
    title: string
    amount: number
    type: 'FIXED' | 'PERCENTAGE'
  }[]   
}

export interface OrderItem {
  id: string;
  isReordered: boolean;
  isRefund: boolean;
  refundReason: string;
  status: OrderItemStatus;
  product: Product
  productId: string
  quantity: number
  ingredients: any[]
  additiveIds: string[]
  comment?: string
  additives: Additive[]
  timestamps: {
    createdAt: Date;
    startedAt: Date;
    completedAt: Date;
    pausedAt: Date;
    refundedAt: Date;
  }
}

export interface Additive {
  id: string
  title: string
  price: number
}

export interface Category {
  id: string
  title: string
  order?: number
}