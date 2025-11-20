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
        if (isMounted) {
          setIsConnected(true)
          setConnectionError(null)
        }
        return
      }
      
      isConnecting = true
      
      try {
        await orderWebSocketService.connect(restaurantId, token)
        if (isMounted) {
          setIsConnected(true)
          setConnectionError(null)
        }
      } catch (error) {
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
        callbacksRef.current.onOrderCreated?.(order)
      } else {
      }
    }

    const handleOrderUpdated = (message: any) => {
      
      let order: OrderResponse | null = null
      
      if (message?.data) {
        order = message.data
      } else if (message?.id) {
        order = message
      }
      
      if (order && order.id) {
        callbacksRef.current.onOrderUpdated?.(order)
      } else {
      }
    }

    const handleOrderStatusUpdated = (message: any) => {
      
      let order: OrderResponse | null = null
      
      if (message?.data) {
        order = message.data
      } else if (message?.id) {
        order = message
      }
      
      if (order && order.id) {
        callbacksRef.current.onOrderStatusUpdated?.(order)
      } else {
      }
    }

    const handleOrderItemUpdated = (message: any) => {
      
      let order: OrderResponse | null = null;
      let itemId: string = '';
      
      if (message?.order && message.itemId) {
        order = message.order;
        itemId = message.itemId;
      } 
      else if (message?.data?.order && message.data.itemId) {
        order = message.data.order;
        itemId = message.data.itemId;
      }
      else if (message?.id) {
        order = message;
      }
      
      if (order && order.id) {
        callbacksRef.current.onOrderItemUpdated?.(order, itemId);
      } else {
      }
    };

    const handleOrderModified = (message: any) => {
      
      let order: OrderResponse | null = null
      
      if (message?.data) {
        order = message.data
      } else if (message?.id) {
        order = message
      }
      
      if (order && order.id) {
        callbacksRef.current.onOrderModified?.(order)
      } else {
      }
    }

    const handleOrderDetailsUpdated = (message: any) => {
      
      let order: OrderResponse | null = null
      
      if (message?.data) {
        order = message.data
      } else if (message?.id) {
        order = message
      }
      
      if (order && order.id) {
        callbacksRef.current.onOrderDetailsUpdated?.(order)
      } else {
      }
    }

    const handleConnected = () => {
      console.log('✅ WebSocket: Connected successfully')
      if (isMounted) {
        setIsConnected(true)
        setConnectionError(null)
      }
      
      if (orderId) {
        orderWebSocketService.subscribeToOrder(orderId)
      }
    }

    const handleDisconnected = () => {
      if (isMounted) {
        setIsConnected(false)
      }
    }

    const handleError = (error: any) => {
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
      
      orderWebSocketService.off('orderCreated', handleOrderCreated)
      orderWebSocketService.off('orderUpdated', handleOrderUpdated)
      orderWebSocketService.off('orderStatusUpdated', handleOrderStatusUpdated)
      orderWebSocketService.off('orderItemUpdated', handleOrderItemUpdated)
      orderWebSocketService.off('orderModified', handleOrderModified)
      orderWebSocketService.off('orderDetailsUpdated', handleOrderDetailsUpdated)
      orderWebSocketService.off('connected', handleConnected)
      orderWebSocketService.off('disconnected', handleDisconnected)
      orderWebSocketService.off('error', handleError)

    }
  }, [restaurantId, orderId, enabled])

  useEffect(() => {
    if (orderId && isConnected) {
      orderWebSocketService.subscribeToOrder(orderId)
    }
  }, [orderId, isConnected])

  return {
    isConnected,
    connectionError,
    disconnect: () => orderWebSocketService.disconnect()
  }
}