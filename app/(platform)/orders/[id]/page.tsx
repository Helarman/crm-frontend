'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { OrderHeader } from '@/components/features/order/OrderHeader'
import { OrderCustomerInfo } from '@/components/features/order/OrderCustomerInfo'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/hooks/useAuth'
import { OrderService, OrderResponse, EnumOrderStatus, OrderItemStatus, EnumPaymentMethod } from '@/lib/api/order.service'
import { toast } from 'sonner'
import { AccessCheck } from '@/components/AccessCheck'
import { Badge } from '@/components/ui/badge'
import { ProductService } from '@/lib/api/product.service'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { PaymentService } from '@/lib/api/payment.service'
import { AddProductToOrder, Category, Product} from '@/components/features/order/AddProductToOrder'
import { CategoryService } from '@/lib/api/category.service'
import { useLanguageStore } from '@/lib/stores/language-store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Additive } from '@/lib/api/customer.service'

interface OrderItemProduct {
  id: string
  title: string
  price: number
  restaurantPrices?: {
    price: number
    restaurantId: string
    isStopList: boolean
  }[]
}

interface OrderItemAdditive {
  id: string
  title: string
  price: number
}

interface OrderItem {
  id: string
  product: OrderItemProduct
  additives: OrderItemAdditive[]
  quantity: number
  comment?: string
  status: string
}

export default function WaiterOrderPage() {
  const { id: orderId } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguageStore()
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<EnumPaymentMethod>(EnumPaymentMethod.CASH)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)
  const [returnItemId, setReturnItemId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [isReturning, setIsReturning] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    item: OrderItem | null;
    product: Product | null;
  } | null>(null);
  const [updatedComment, setUpdatedComment] = useState('');
  const [updatedAdditives, setUpdatedAdditives] = useState<string[]>([]);
  const [confirmItemId, setConfirmItemId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const data = await OrderService.getById(orderId as string)
      setOrder(data)
      
      if (data.payment?.method) {
        setPaymentMethod(data.payment.method)
      }
      
      if (data.restaurant?.id) {
        const [products, categories] = await Promise.all([
          ProductService.getByRestaurant(data.restaurant.id),
          CategoryService.getAll()
        ])
        setProducts(products)
        setCategories(categories)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
      toast.error('Не удалось загрузить заказ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!orderId) {
      setError('Order ID is missing')
      setLoading(false)
      return
    }

    fetchOrder()
  }, [orderId])

  const getStatusText = (status: EnumOrderStatus): string => {
    const statusMap = {
      [EnumOrderStatus.CREATED]: 'Создан',
      [EnumOrderStatus.CONFIRMED]: 'Подтверждён',
      [EnumOrderStatus.PREPARING]: 'Готовится',
      [EnumOrderStatus.READY]: 'Готов',
      [EnumOrderStatus.DELIVERING]: 'Доставляется',
      [EnumOrderStatus.COMPLETED]: 'Завершён',
      [EnumOrderStatus.CANCELLED]: 'Отменён'
    }
    return statusMap[status] || status
  }

  const getItemStatusText = (status: OrderItemStatus): string => {
    const statusMap = {
      [OrderItemStatus.CREATED]: 'Создан',
      [OrderItemStatus.IN_PROGRESS]: 'Готовится',
      [OrderItemStatus.PARTIALLY_DONE]: 'Частично готов',
      [OrderItemStatus.PAUSED]: 'На паузе',
      [OrderItemStatus.COMPLETED]: 'Завершён',
      [OrderItemStatus.CANCELLED]: 'Отменён',
      [OrderItemStatus.REFUNDED]: 'Возвращен'
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  const getPaymentStatusText = (status: string): string => {
    const statusMap = {
      'PENDING': 'Ожидает оплаты',
      'PAID': 'Оплачен',
      'FAILED': 'Ошибка оплаты',
      'REFUNDED': 'Возвращён'
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  const getPaymentMethodText = (method: EnumPaymentMethod): string => {
    const methodMap = {
      [EnumPaymentMethod.CASH]: 'Наличные',
      [EnumPaymentMethod.CARD]: 'Карта',
      [EnumPaymentMethod.ONLINE]: 'Онлайн',
    }
    return methodMap[method] || method
  }

  const getProductPrice = (product: OrderItemProduct) => {
    const restaurantPrice = product.restaurantPrices?.find(
      p => p.restaurantId === order?.restaurant?.id
    )
    return restaurantPrice?.price ?? product.price
  }

  const calculateItemPrice = (item: OrderItem) => {
    const restaurantPrice = item.product.restaurantPrices?.find(
      p => p.restaurantId === order?.restaurant?.id
    )
    const basePrice = restaurantPrice?.price ?? item.product.price
    const additivesPrice = item.additives.reduce((sum, a) => sum + a.price, 0)
    return (basePrice + additivesPrice) * item.quantity
  }

  const calculateOrderTotal = () => {
    if (!order) return 0
    
    return order.items.reduce((sum, item) => {
      return sum + calculateItemPrice(item)
    }, 0)
  }

  const handleEditItem = async (item: OrderItem) => {
    try {
      const product = products.find(p => p.id === item.product.id);
      
      if (!product) {
        toast.error('Продукт не найден');
        return;
      }

      setEditingItem({
        item,
        product
      });
      setUpdatedComment(item.comment || '');
      setUpdatedAdditives(item.additives.map(a => a.id));
    } catch (err) {
      toast.error('Ошибка при загрузке данных продукта');
      console.error('Ошибка:', err);
    }
  };

  const handleSaveItemChanges = async () => {
    if (!editingItem?.item?.id || !orderId) return;

    try {
      setIsUpdating(true);
      
      await OrderService.updateOrderItem(
        orderId as string,
        editingItem.item.id,
        {
          comment: updatedComment,
          additiveIds: updatedAdditives
        }
      );
      
      await fetchOrder();
      setEditingItem(null);
      toast.success('Позиция успешно обновлена');
      
    } catch (err) {
      toast.error('Ошибка при обновлении позиции');
      console.error('Ошибка:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReturnItem = async () => {
    if (!returnItemId || !orderId) return;

    try {
      setIsReturning(true);
      
      await OrderService.updateItemStatus(orderId as string, returnItemId, {
        status: 'REFUNDED',
        description: returnReason
      });

      await fetchOrder();
      toast.success('Позиция возвращена');
      setReturnItemId(null);
      setReturnReason('');
      
    } catch (err) {
      toast.error('Ошибка при возврате позиции');
      console.error('Ошибка:', err);
    } finally {
      setIsReturning(false);
    }
  };

  const handleConfirmItem = async () => {
    if (!confirmItemId || !orderId) return;

    try {
      setIsConfirming(true);
      
      await OrderService.updateItemStatus(orderId as string, confirmItemId, {
        status: 'CREATED',
        description: returnReason
      });

      await fetchOrder();
      toast.success('Позиция подтверждена');
      setConfirmItemId(null);
      
    } catch (err) {
      toast.error('Ошибка при подтверждении позиции');
      console.error('Ошибка:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  const closeAddItemDialog = () => {
    setAddItemDialogOpen(false)
  }

  const handleAddItem = async (newItem: {
    productId: string
    quantity: number
    additiveIds: string[]
    comment?: string
  }) => {
    if (!orderId || !order) return

    try {
      setIsUpdating(true)
      
      await OrderService.addItemToOrder(
        orderId as string,
        newItem
      )
      
      await fetchOrder();
      closeAddItemDialog()

      if (order.payment?.status === 'PENDING') {
        await updatePaymentAmount(calculateOrderTotal())
      }

      toast.success('Позиция добавлена в заказ')
    } catch (err) {
      toast.error('Ошибка при добавлении позиции')
      console.error('Ошибка:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const updatePaymentAmount = async (newAmount: number) => {
    if (!order?.payment?.id) return
    
    try {
      setIsUpdatingPayment(true)
      await PaymentService.updateAmount(order.payment.id, newAmount)
      
      await fetchOrder();
      
    } catch (err) {
      toast.error('Ошибка при обновлении платежа')
      console.error('Ошибка:', err)
    } finally {
      setIsUpdatingPayment(false)
    }
  }

  const canAddItems = order?.payment?.status === 'PENDING'
  const isAdmin = user?.role === 'MANAGER' || user?.role === 'SUPERVISOR'

  if (loading) {
    return (
      <div className="space-y-6">
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
      <Card className="space-y-6">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => router.push('/orders')} className="mt-4">
          Назад к списку заказов
        </Button>
      </Card>
    )
  }

  if (!order) {
    return (
      <Card className="space-y-6">
        <p className="text-muted-foreground">Заказ не найден</p>
        <Button onClick={() => router.push('/orders')} className="mt-4">
          Назад к списку заказов
        </Button>
      </Card>
    )
  }

  return (
    <AccessCheck allowedRoles={['WAITER', 'MANAGER', 'SUPERVISOR']}>
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/orders')}
          className="mb-4"
        >
          ← Назад к списку заказов
        </Button>

        <OrderHeader order={order} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Состав заказа</h2>
              {canAddItems && (
                <Button 
                  size="sm" 
                  onClick={() => setAddItemDialogOpen(true)}
                  disabled={isUpdating}
                >
                  Добавить блюдо
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {order.items.map(item => (
                <Card key={item.id} className="p-4">  
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {item.product.title} × {item.quantity}
                        </h3>
                        <Badge variant="outline">
                          {getItemStatusText(item.status)}
                        </Badge>
                      </div>
                      
                      {item.product.restaurantPrices[0] && (
                        <p className="text-sm text-muted-foreground">
                          Цена: {getProductPrice(item.product)} ₽
                        </p>
                      )}
                      
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

                    <div className="text-right flex">
                      {item.status === 'CREATED' && (
                        <Button 
                          variant="destructive"
                          size="sm" 
                          className="mr-2 cursor-pointer"
                          onClick={() => setReturnItemId(item.id)}
                        >
                          Вернуть
                        </Button>
                      )}
                      {item.status === 'REFUNDED' && (
                        <>
                          <Button 
                            variant="outline"
                            size="sm" 
                            className="mr-2 cursor-pointer"
                            onClick={() => handleEditItem(item)}
                          >
                            Редактировать
                          </Button>
                          <Button 
                            variant="default"
                            size="sm" 
                            className="mr-2 cursor-pointer bg-blue-500 hover:bg-blue-600"
                            onClick={() => setConfirmItemId(item.id)}
                          >
                            Подтвердить
                        </Button>
                        </>
                      )}
                      <div className="font-medium items-center">
                        {calculateItemPrice(item)} ₽
                      </div>
                      
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="font-medium">Итого:</div>
              <div className="text-lg font-bold">{calculateOrderTotal()} ₽</div>
            </div>

            {order.payment && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <div className="font-medium">Статус оплаты:</div>
                  <Badge variant={order.payment.status === 'PAID' ? 'default' : 'secondary'}>
                    {getPaymentStatusText(order.payment.status)}
                  </Badge>
                </div>
                {order.payment.method && (
                  <div className="flex justify-between items-center">
                    <div className="font-medium">Способ оплаты:</div>
                    <div>{getPaymentMethodText(order.payment.method)}</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-4 justify-end">
              {order.status === EnumOrderStatus.READY && order.payment?.status === 'PENDING' && (
                 <Button 
                  className="bg-emerald-600 hover:bg-emerald-800"
                  onClick={() => router.push(`/payments/${order.payment?.id}`)}
                  disabled={isProcessingPayment}
                >
                  Платеж
                </Button>
              )}
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
                  <Badge variant="outline">
                    {getStatusText(order.status)}
                  </Badge>
                </div>
                {order.tableNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Стол:</span>
                    <span>{order.tableNumber}</span>
                  </div>
                )}
                {order.numberOfPeople && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Количество персон:</span>
                    <span>{order.numberOfPeople}</span>
                  </div>
                )}
                {order.type === 'DINE_IN' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Тип заказа:</span>
                    <span>В заведении</span>
                  </div>
                )}
                {order.type === 'TAKEAWAY' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Тип заказа:</span>
                    <span>Навынос</span>
                  </div>
                )}
                {order.type === 'DELIVERY' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Тип заказа:</span>
                    <span>Доставка</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
        
      {/* Диалог возврата позиции */}
        <Dialog open={!!returnItemId} onOpenChange={(open) => !open && setReturnItemId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Возврат позиции</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="returnReason" className='mb-2'>Причина возврата</Label>
                <Input
                  id="returnReason"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Укажите причину возврата"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setReturnItemId(null)}
              >
                Отмена
              </Button>
              <Button 
                onClick={handleReturnItem}
                disabled={isReturning || !returnReason}
              >
                {isReturning ? 'Обработка...' : 'Подтвердить возврат'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Диалог добавления позиции */}
       <Dialog 
          open={addItemDialogOpen} 
          onOpenChange={setAddItemDialogOpen}
        >
            <DialogContent 
              className="w-[70%] max-w-none h-[80vh] max-h-[80vh] "
              style={{
                width: '70vw',
                maxWidth: 'none',
              }}
            >
            <DialogHeader>
              <DialogTitle>
                {language === 'ka' ? 'პროდუქტის დამატება შეკვეთაში' : 'Добавить позицию в заказ'}
              </DialogTitle>
            </DialogHeader>
            {order?.restaurant && (
              <AddProductToOrder
                products={products}
                categories={categories}
                restaurantId={order.restaurant.id}
                onAddItem={handleAddItem}
                onClose={closeAddItemDialog}
                language={language}
              />
            )}
          </DialogContent>
        </Dialog>

       <Dialog 
          open={!!editingItem} 
          onOpenChange={(open) => !open && setEditingItem(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Редактирование позиции</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="itemComment">Комментарий</Label>
                <Input
                  className=' mt-2'
                  id="itemComment"
                  value={updatedComment}
                  onChange={(e) => setUpdatedComment(e.target.value)}
                  placeholder="Введите комментарий"
                />
              </div>
              
              {editingItem?.product?.additives && editingItem.product.additives.length > 0 && (
                <div>
                  <Label>Добавки</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {editingItem.product.additives.map(additive => (
                      <button
                        key={additive.id}
                        onClick={() => {
                          setUpdatedAdditives(prev =>
                            prev.includes(additive.id)
                              ? prev.filter(id => id !== additive.id)
                              : [...prev, additive.id]
                          );
                        }}
                        className={`p-2 border rounded-md text-sm flex justify-between items-center
                          ${updatedAdditives.includes(additive.id)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'hover:bg-accent dark:hover:bg-gray-800 dark:border-gray-700'
                          }`}
                      >
                        <span>{additive.title}</span>
                        <span className="font-bold ml-2">+{additive.price} ₽</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditingItem(null)}
              >
                Отмена
              </Button>
              <Button 
                onClick={handleSaveItemChanges}
                disabled={isUpdating}
              >
                {isUpdating ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={!!confirmItemId} onOpenChange={(open) => !open && setConfirmItemId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Подтверждение позиции</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Вы уверены, что хотите подтвердить эту позицию?
            </DialogDescription>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setConfirmItemId(null)}
              >
                Отмена
              </Button>
              <Button 
                onClick={handleConfirmItem}
                disabled={isConfirming}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isConfirming ? 'Подтверждение...' : 'Подтвердить'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </AccessCheck>
  )
}