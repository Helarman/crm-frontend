  'use client'

import { io, Socket } from 'socket.io-client'
import { OrderResponse } from '@/lib/api/order.service'

export class OrderWebSocketService {
  private socket: Socket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout: NodeJS.Timeout | null = null
  private currentRestaurantId: string | null = null
  private subscribedOrders: Set<string> = new Set()
  private connectionPromise: Promise<void> | null = null

  async connect(restaurantId: string, token?: string): Promise<void> {
    if (this.socket && this.isConnected && this.currentRestaurantId === restaurantId) {
      console.log('WebSocket already connected to this restaurant')
      return
    }

    // Если уже есть попытка подключения, ждем ее
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000'
        
        console.log('Connecting to WebSocket:', `${WS_URL}/orders`)
        
        // Отключаем предыдущее соединение
        if (this.socket) {
          this.socket.disconnect()
          this.socket = null
        }

        this.socket = io(`${WS_URL}/orders`, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
        })

        this.currentRestaurantId = restaurantId
        this.setupEventListeners(resolve, reject)
        
      } catch (error) {
        console.error('WebSocket connection error:', error)
        reject(error)
        this.connectionPromise = null
      }
    })

    return this.connectionPromise
  }

  private setupEventListeners(resolve: () => void, reject: (error: any) => void) {
    if (!this.socket) return

    const connectionTimeout = setTimeout(() => {
      reject(new Error('WebSocket connection timeout'))
    }, 10000)

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully')
      clearTimeout(connectionTimeout)
      this.isConnected = true
      this.reconnectAttempts = 0
      this.emit('connected')
      
      // Подписываемся на обновления ресторана после подключения
      if (this.currentRestaurantId) {
        this.socket?.emit('subscribe:restaurant', this.currentRestaurantId)
        console.log('Subscribed to restaurant:', this.currentRestaurantId)
      }

      // Переподписываемся на заказы после переподключения
      this.subscribedOrders.forEach(orderId => {
        this.subscribeToOrder(orderId)
      })

      resolve()
      this.connectionPromise = null
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason)
      this.isConnected = false
      this.emit('disconnected')
    })

    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error)
      clearTimeout(connectionTimeout)
      this.isConnected = false
      this.emit('error', error)
      reject(error)
      this.connectionPromise = null
    })

    // Основные события заказов
    this.socket.on('order:created', (data: OrderResponse) => {
      console.log('📦 New order created via WebSocket:', data)
      this.emit('orderCreated', data)
    })

    this.socket.on('order:updated', (data: OrderResponse) => {
      console.log('🔄 Order updated via WebSocket:', data)
      this.emit('orderUpdated', data)
    })

    this.socket.on('order:status_updated', (data: OrderResponse) => {
      console.log('📊 Order status updated via WebSocket:', data)
      this.emit('orderStatusUpdated', data)
    })

      // В OrderWebSocketService классе исправьте:
    this.socket.on('order:item_updated', (data: { order: OrderResponse, itemId: string }) => {
      console.log('🍽️ Order item updated via WebSocket:', data);
      // БЫЛО: this.emit('orderItemUpdated', data.order, data.itemId)
      // СТАЛО: передаем объект с order и itemId
      this.emit('orderItemUpdated', {
        order: data.order,
        itemId: data.itemId
      });
    });

    this.socket.on('order:modified', (data: OrderResponse) => {
      console.log('✏️ Order modified via WebSocket:', data)
      this.emit('orderModified', data)
    })

    this.socket.on('order:details_updated', (data: OrderResponse) => {
      console.log('📝 Order details updated via WebSocket:', data)
      this.emit('orderDetailsUpdated', data)
    })

    this.socket.on('subscribed', (data: { room: string }) => {
      console.log('✅ Subscribed to room:', data.room)
    })

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error)
      this.emit('error', error)
    })
  }

  subscribeToOrder(orderId: string) {
    if (this.socket && this.isConnected) {
      console.log('🔔 Subscribing to order:', orderId)
      this.socket.emit('subscribe:order', orderId)
      this.subscribedOrders.add(orderId)
    } else {
      console.warn('Cannot subscribe to order: WebSocket not connected')
      this.subscribedOrders.add(orderId)
    }
  }

  unsubscribeFromOrder(orderId: string) {
    if (this.socket && this.isConnected) {
      console.log('🔕 Unsubscribing from order:', orderId)
      this.socket.emit('unsubscribe:order', orderId)
    }
    this.subscribedOrders.delete(orderId)
  }

  unsubscribeFromRestaurant(restaurantId: string) {
    if (this.socket && this.isConnected) {
      console.log('Unsubscribing from restaurant:', restaurantId)
      this.socket.emit('unsubscribe:restaurant', restaurantId)
    }
  }

  disconnect() {
    console.log('Disconnecting WebSocket...')
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    this.isConnected = false
    this.reconnectAttempts = 0
    this.currentRestaurantId = null
    this.subscribedOrders.clear()
    this.connectionPromise = null
  }

  // Event emitter pattern
  private handlers: Map<string, Function[]> = new Map()

  on(event: string, handler: Function) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, [])
    }
    this.handlers.get(event)!.push(handler)
  }

  off(event: string, handler: Function) {
    const eventHandlers = this.handlers.get(event)
    if (eventHandlers) {
      const index = eventHandlers.indexOf(handler)
      if (index > -1) {
        eventHandlers.splice(index, 1)
      }
    }
  }

  private emit(event: string, ...args: any[]) {
    const eventHandlers = this.handlers.get(event)
    if (eventHandlers) {
      eventHandlers.forEach(handler => {
        try {
          handler(...args)
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${event}:`, error)
        }
      })
    }
  }

  get connected() {
    return this.isConnected
  }
}

// Создаем singleton экземпляр
export const orderWebSocketService = new OrderWebSocketService()