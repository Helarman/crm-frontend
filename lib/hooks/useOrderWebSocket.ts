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

    const connectWebSocket = async () => {
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
        
        // Если не должны подключаться, но соединение активно - отключаем
        if (isConnected) {
          orderWebSocketService.disconnect()
          setIsConnected(false)
        }
        return
      }

      console.log('✅ WebSocket: Connecting with params:', {
        restaurantId,
        hasToken: !!token,
        orderId
      })
      
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
      }
    }

    // Устанавливаем обработчики событий
    const handleOrderCreated = (order: OrderResponse) => {
      console.log('📦 WebSocket: Order created', order)
      callbacksRef.current.onOrderCreated?.(order)
    }

    const handleOrderUpdated = (order: OrderResponse) => {
      console.log('🔄 WebSocket: Order updated', order)
      callbacksRef.current.onOrderUpdated?.(order)
    }

    const handleOrderStatusUpdated = (order: OrderResponse) => {
      console.log('📊 WebSocket: Order status updated', order)
      callbacksRef.current.onOrderStatusUpdated?.(order)
    }

    const handleOrderItemUpdated = (order: OrderResponse, itemId: string) => {
      console.log('🍽️ WebSocket: Order item updated', order, itemId)
      callbacksRef.current.onOrderItemUpdated?.(order, itemId)
    }

    const handleOrderModified = (order: OrderResponse) => {
      console.log('✏️ WebSocket: Order modified', order)
      callbacksRef.current.onOrderModified?.(order)
    }

    const handleOrderDetailsUpdated = (order: OrderResponse) => {
      console.log('📝 WebSocket: Order details updated', order)
      callbacksRef.current.onOrderDetailsUpdated?.(order)
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

      // Отписываемся от заказа если был подписан
      if (orderId) {
        orderWebSocketService.unsubscribeFromOrder(orderId)
      }

      // Не отключаем WebSocket полностью, так как он может использоваться другими компонентами
      // Просто отписываемся от конкретных событий
    }
  }, [restaurantId, orderId, enabled])

  return {
    isConnected,
    connectionError,
    disconnect: () => orderWebSocketService.disconnect()
  }
}