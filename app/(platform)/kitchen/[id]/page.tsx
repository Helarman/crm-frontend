'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { OrderHeader } from '@/components/features/order/OrderHeader'
import { OrderCustomerInfo } from '@/components/features/order/OrderCustomerInfo'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/hooks/useAuth'
import { OrderService, OrderItemStatus, OrderResponse, EnumOrderStatus } from '@/lib/api/order.service'
import { toast } from 'sonner'
import { AccessCheck } from '@/components/AccessCheck'

type OrderItemWithStatus = {
  id: string
  product: {
    title: string
  }
  quantity: number
  additives: {
    title: string
  }[]
  comment?: string
  currentStatus: OrderItemStatus
  assignedTo?: {
    id: string
    name: string
  } | null
}


export default function KitchenOrderPage() {
  const { id: orderId } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<OrderItemWithStatus[]>([])
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (!orderId) {
      setError('Order ID is missing')
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        setLoading(true)
        const data = await OrderService.getById(orderId as string)
        setOrder(data)
        
        // Преобразуем items к нужному формату
        setItems(data.items.map(item => ({
          id: item.id,
          product: {
            title: item.product.title || 'Без названия'
          },
          quantity: item.quantity,
          additives: item.additives.map(add => ({
            title: add.name || 'Добавка'
          })),
          comment: item.comment,
          currentStatus: item.status || 'CREATED',
          assignedTo: item.chef ? {
            id: item.chef.id,
            name: item.chef.name || 'Повар'
          } : null
        })))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        toast.error('Не удалось загрузить заказ')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  const getStatusText = (status: OrderItemStatus): string => {
    const statusMap = {
      [OrderItemStatus.CREATED]: 'Создан',
      [OrderItemStatus.IN_PROGRESS]: 'В процессе',
      [OrderItemStatus.PARTIALLY_DONE]: 'Частично готов',
      [OrderItemStatus.PAUSED]: 'На паузе',
      [OrderItemStatus.COMPLETED]: 'Готов',
      [OrderItemStatus.CANCELLED]: 'Отменен'
    };
    return statusMap[status] || status;
  };
  
  const handleStatusChange = async (itemId: string, newStatus: OrderItemStatus) => {
    if (!orderId || !user?.id || isUpdating) return;
  
    try {
      setIsUpdating(true);
      
      // Оптимистичное обновление UI
      const updatedItems = items.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              currentStatus: newStatus,
              assignedTo: newStatus === 'IN_PROGRESS' ? { id: user.id, name: user.name } : null
            } 
          : item
      );
      setItems(updatedItems);
  
      // Отправка запроса
      await OrderService.updateItemStatus(
        orderId as string,
        itemId,
        { 
          status: newStatus,
          userId: newStatus === 'IN_PROGRESS' ? user.id : undefined
        }
      );
  
      toast.success(`Статус обновлён: ${getStatusText(newStatus)}`);
    } catch (err) {
      // Откат при ошибке
      setItems(items);
      toast.error('Ошибка обновления статуса');
      console.error('Ошибка:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!orderId || isUpdating) return
    try {
      setIsUpdating(true)
      await OrderService.updateStatus(orderId as string, {status: EnumOrderStatus.READY} )
      toast.success('Заказ успешно завершен')
      router.push('/kitchen')
    } catch (err) {
      toast.error('Не удалось завершить заказ')
      console.error('Failed to complete order:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const isAllItemsCOMPLETED = items.every(i => i.currentStatus === 'COMPLETED')

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="container mx-auto p-6 text-center">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => router.push('/kitchen')} className="mt-4">
          Назад к списку заказов
        </Button>
      </Card>
    )
  }

  if (!order) {
    return (
      <Card className="container mx-auto p-6 text-center">
        <p className="text-muted-foreground">Заказ не найден</p>
        <Button onClick={() => router.push('/kitchen')} className="mt-4">
          Назад к списку заказов
        </Button>
      </Card>
    )
  }

  return (
    <AccessCheck allowedRoles={['COOK', 'CHEF', 'MANAGER', 'SUPERVISOR']}>
      <div className="container mx-auto p-4 space-y-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/kitchen')}
          className="mb-4"
        >
          ← Назад к списку заказов
        </Button>

        <OrderHeader order={order} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 p-4 space-y-4">
            <h2 className="text-lg font-semibold">Состав заказа</h2>
            
            <div className="space-y-4">
              {items.map(item => (
                <Card key={item.id} className="p-4">  
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {item.product.title} × {item.quantity}
                      </h3>
                      {item.additives.length > 0 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Добавки: {item.additives.map(a => a.title).join(', ')}
                        </div>
                      )}
                      {item.comment && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Комментарий: {item.comment}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {item.currentStatus === 'IN_PROGRESS' && item.assignedTo?.name && (
                        <span className="text-sm text-muted-foreground text-right">
                          Готовит: {item.assignedTo.name}
                        </span>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={item.currentStatus === 'IN_PROGRESS' ? 'default' : 'outline'}
                          disabled={item.currentStatus === 'IN_PROGRESS' || isUpdating}
                          onClick={() => handleStatusChange(item.id, 'IN_PROGRESS'as OrderItemStatus)}
                        >
                          В работу
                        </Button>
                        <Button
                          size="sm"
                          variant={item.currentStatus === 'COMPLETED' ? 'default' : 'outline'}
                          disabled={item.currentStatus === 'COMPLETED' || isUpdating}
                          onClick={() => handleStatusChange(item.id, 'COMPLETED' as OrderItemStatus)}
                        >
                          Готово
                        </Button>
                        <Button
                          size="sm"
                          variant={item.currentStatus === 'CANCELLED' ? 'default' : 'outline'}
                          disabled={item.currentStatus === 'CANCELLED' || isUpdating}
                          onClick={() => handleStatusChange(item.id, 'CANCELLED' as OrderItemStatus)}
                        >
                          Отменить
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            {order.customer && (
              <Card className="p-4">
                <OrderCustomerInfo customer={order.customer} />
              </Card>
            )}

            <Card className="p-4">
              <h3 className="font-medium mb-2">Информация о заказе</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Номер заказа:</span>
                  <span>{order.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Дата:</span>
                  <span>
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Статус заказа:</span>
                  <span className="capitalize">
                    {order.status.toLowerCase()}
                  </span>
                </div>
              </div>
            </Card>

            <Button 
              className="w-full"
              onClick={handleCompleteOrder}
              disabled={!isAllItemsCOMPLETED || order.status === 'READY' || isUpdating}
            >
              Завершить весь заказ
            </Button>
          </div>
        </div>
      </div>
      </AccessCheck>
  )
}