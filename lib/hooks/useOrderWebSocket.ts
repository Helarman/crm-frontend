'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { orderWebSocketService } from '../api/order-websocket.service'
import { OrderResponse } from '@/lib/api/order.service'
import { useAuth } from './useAuth'

interface UseOrderWebSocketProps {
  restaurantId?: string
  orderId?: string
  onOrderCreated?: (order: OrderResponse) => void
  onOrderUpdated?: (order: OrderResponse) => void
  onOrderStatusUpdated?: (order: OrderResponse) => void
  onOrderItemUpdated?: (order: OrderResponse, itemId: string) => void
  onOrderModified?: (order: OrderResponse) => void
  onOrderDetailsUpdated?: (order: OrderResponse) => void
  onError?: (error: any) => void
  enabled?: boolean
}

// Функция для получения токена из куки
function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'accessToken') {
      return decodeURIComponent(value)
    }
  }
  return null
}

export function useOrderWebSocket({
  restaurantId,
  orderId,
  onOrderCreated,
  onOrderUpdated,
  onOrderStatusUpdated,
  onOrderItemUpdated,
  onOrderModified,
  onOrderDetailsUpdated,
  onError,
  enabled = true
}: UseOrderWebSocketProps) {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  
  // Используем ref для колбэков, чтобы избежать ререндеров
  const callbacksRef = useRef({
    onOrderCreated,
    onOrderUpdated,
    onOrderStatusUpdated,
    onOrderItemUpdated,
    onOrderModified,
    onOrderDetailsUpdated,
    onError
  })

  // Обновляем ref при изменении колбэков
  useEffect(() => {
    callbacksRef.current = {
      onOrderCreated,
      onOrderUpdated,
      onOrderStatusUpdated,
      onOrderItemUpdated,
      onOrderModified,
      onOrderDetailsUpdated,
      onError
    }
  }, [
    onOrderCreated,
    onOrderUpdated,
    onOrderStatusUpdated,
    onOrderItemUpdated,
    onOrderModified,
    onOrderDetailsUpdated,
    onError
  ])

  // Подключение к WebSocket
  useEffect(() => {
    let isMounted = true
    let isConnecting = false

    const connectWebSocket = async () => {
      if (isConnecting) {
        console.log('🔄 WebSocket: Already connecting, skipping...')
        return
      }

      // Получаем токен из куки
      const token = getTokenFromCookie()
      
      // Проверяем условия для подключения
      const shouldConnect = enabled && restaurantId && token
      
      if (!shouldConnect) {
        console.log('❌ WebSocket: Not connecting - missing requirements:', {
          enabled,
          restaurantId,
          hasToken: !!token
        })
        return
      }

      // Если уже подключены к тому же ресторану, не переподключаемся
      if (orderWebSocketService.connected && orderWebSocketService['currentRestaurantId'] === restaurantId) {
        console.log('✅ WebSocket: Already connected to this restaurant')
        if (isMounted) {
          setIsConnected(true)
          setConnectionError(null)
        }
        return
      }

      console.log('✅ WebSocket: Connecting with params:', {
        restaurantId,
        hasToken: !!token,
        orderId
      })
      
      isConnecting = true
      
      try {
        await orderWebSocketService.connect(restaurantId, token)
        if (isMounted) {
          setIsConnected(true)
          setConnectionError(null)
        }
      } catch (error) {
        console.error('WebSocket connection failed:', error)
        if (isMounted) {
          setIsConnected(false)
          setConnectionError(error instanceof Error ? error.message : 'Connection failed')
          callbacksRef.current.onError?.(error)
        }
      } finally {
        isConnecting = false
      }
    }

    // Устанавливаем обработчики событий
    const handleOrderCreated = (message: any) => {
      console.log('📦 WebSocket: Order created message', message)
      
      let order: OrderResponse | null = null
      
      if (message?.data) {
        order = message.data
      } else if (message?.id) {
        order = message
      }
      
      if (order && order.id) {
        console.log('📦 WebSocket: Order created extracted', order)
        callbacksRef.current.onOrderCreated?.(order)
      } else {
        console.warn('❌ Could not extract order from orderCreated message:', message)
      }
    }

    const handleOrderUpdated = (message: any) => {
      console.log('🔄 WebSocket: Order updated message', message)
      
      let order: OrderResponse | null = null
      
      if (message?.data) {
        order = message.data
      } else if (message?.id) {
        order = message
      }
      
      if (order && order.id) {
        console.log('🔄 WebSocket: Order updated extracted', order)
        callbacksRef.current.onOrderUpdated?.(order)
      } else {
        console.warn('❌ Could not extract order from orderUpdated message:', message)
      }
    }

    const handleOrderStatusUpdated = (message: any) => {
      console.log('📊 WebSocket: Order status updated message', message)
      
      let order: OrderResponse | null = null
      
      if (message?.data) {
        order = message.data
      } else if (message?.id) {
        order = message
      }
      
      if (order && order.id) {
        console.log('📊 WebSocket: Order status updated extracted', order)
        callbacksRef.current.onOrderStatusUpdated?.(order)
      } else {
        console.warn('❌ Could not extract order from orderStatusUpdated message:', message)
      }
    }

    const handleOrderItemUpdated = (message: any) => {
      console.log('🍽️ WebSocket: Order item updated message', message);
      
      let order: OrderResponse | null = null;
      let itemId: string = '';
      
      // Теперь message должен быть объектом { order: OrderResponse, itemId: string }
      if (message?.order && message.itemId) {
        order = message.order;
        itemId = message.itemId;
      } 
      // Структура: { data: { order: OrderResponse, itemId: string } }
      else if (message?.data?.order && message.data.itemId) {
        order = message.data.order;
        itemId = message.data.itemId;
      }
      // Структура: OrderResponse (прямой заказ) - fallback
      else if (message?.id) {
        order = message;
      }
      
      if (order && order.id) {
        console.log('🍽️ WebSocket: Order item updated extracted', { order, itemId });
        callbacksRef.current.onOrderItemUpdated?.(order, itemId);
      } else {
        console.warn('❌ Could not extract order from orderItemUpdated message:', message);
      }
    };

    const handleOrderModified = (message: any) => {
      console.log('✏️ WebSocket: Order modified message', message)
      
      let order: OrderResponse | null = null
      
      if (message?.data) {
        order = message.data
      } else if (message?.id) {
        order = message
      }
      
      if (order && order.id) {
        console.log('✏️ WebSocket: Order modified extracted', order)
        callbacksRef.current.onOrderModified?.(order)
      } else {
        console.warn('❌ Could not extract order from orderModified message:', message)
      }
    }

    const handleOrderDetailsUpdated = (message: any) => {
      console.log('📝 WebSocket: Order details updated message', message)
      
      let order: OrderResponse | null = null
      
      if (message?.data) {
        order = message.data
      } else if (message?.id) {
        order = message
      }
      
      if (order && order.id) {
        console.log('📝 WebSocket: Order details updated extracted', order)
        callbacksRef.current.onOrderDetailsUpdated?.(order)
      } else {
        console.warn('❌ Could not extract order from orderDetailsUpdated message:', message)
      }
    }

    const handleConnected = () => {
      console.log('✅ WebSocket: Connected successfully')
      if (isMounted) {
        setIsConnected(true)
        setConnectionError(null)
      }
      
      // Подписываемся на конкретный заказ если указан orderId
      if (orderId) {
        orderWebSocketService.subscribeToOrder(orderId)
      }
    }

    const handleDisconnected = () => {
      console.log('❌ WebSocket: Disconnected')
      if (isMounted) {
        setIsConnected(false)
      }
    }

    const handleError = (error: any) => {
      console.error('❌ WebSocket error:', error)
      if (isMounted) {
        setConnectionError(error instanceof Error ? error.message : 'WebSocket error')
      }
      callbacksRef.current.onError?.(error)
    }

    // Подписываемся на события
    orderWebSocketService.on('orderCreated', handleOrderCreated)
    orderWebSocketService.on('orderUpdated', handleOrderUpdated)
    orderWebSocketService.on('orderStatusUpdated', handleOrderStatusUpdated)
    orderWebSocketService.on('orderItemUpdated', handleOrderItemUpdated)
    orderWebSocketService.on('orderModified', handleOrderModified)
    orderWebSocketService.on('orderDetailsUpdated', handleOrderDetailsUpdated)
    orderWebSocketService.on('connected', handleConnected)
    orderWebSocketService.on('disconnected', handleDisconnected)
    orderWebSocketService.on('error', handleError)

    // Запускаем подключение
    connectWebSocket()

    return () => {
      isMounted = false
      console.log('🧹 WebSocket: Cleaning up connection')
      
      // Отписываемся от событий
      orderWebSocketService.off('orderCreated', handleOrderCreated)
      orderWebSocketService.off('orderUpdated', handleOrderUpdated)
      orderWebSocketService.off('orderStatusUpdated', handleOrderStatusUpdated)
      orderWebSocketService.off('orderItemUpdated', handleOrderItemUpdated)
      orderWebSocketService.off('orderModified', handleOrderModified)
      orderWebSocketService.off('orderDetailsUpdated', handleOrderDetailsUpdated)
      orderWebSocketService.off('connected', handleConnected)
      orderWebSocketService.off('disconnected', handleDisconnected)
      orderWebSocketService.off('error', handleError)

      // НЕ отписываемся от заказа и НЕ отключаем WebSocket полностью
      // чтобы соединение могло использоваться другими компонентами
    }
  }, [restaurantId, orderId, enabled])

  // Эффект для подписки на заказ при изменении orderId
  useEffect(() => {
    if (orderId && isConnected) {
      console.log('🔔 Subscribing to order after connection:', orderId)
      orderWebSocketService.subscribeToOrder(orderId)
    }
  }, [orderId, isConnected])

  return {
    isConnected,
    connectionError,
    disconnect: () => orderWebSocketService.disconnect()
  }
}