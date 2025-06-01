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
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  RotateCcw,
  CreditCard,
  AlertCircle,
  Clock,
  Utensils,
  Soup,
  Salad,
  Pizza,
  Coffee,
  Dessert,
  List,
  MessageSquare,
  User,
  Table,
  Users,
  Calendar,
  Package,
  PackageCheck,
  PackageX,
  CircleDollarSign,
  Wallet,
  ShoppingBag,
  Home,
  Truck,
  ChevronDown,
  ChevronUp,
  Pause
} from 'lucide-react'

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

  const translations = {
    ru: {
      back: "Назад к списку заказов",
      orderComposition: "Состав заказа",
      addDish: "Добавить блюдо",
      price: "Цена",
      additives: "Добавки",
      comment: "Комментарий",
      total: "Итого",
      paymentStatus: "Статус оплаты",
      paymentMethod: "Способ оплаты",
      payment: "Платеж",
      orderInfo: "Информация о заказе",
      orderNumber: "Номер заказа",
      date: "Дата",
      orderStatus: "Статус заказа",
      table: "Стол",
      persons: "Количество персон",
      orderType: "Тип заказа",
      dineIn: "В заведении",
      takeaway: "Навынос",
      delivery: "Доставка",
      returnItem: "Возврат позиции",
      returnReason: "Причина возврата",
      cancel: "Отмена",
      confirmReturn: "Подтвердить возврат",
      processing: "Обработка...",
      addPosition: "Добавить позицию в заказ",
      editPosition: "Редактирование позиции",
      saveChanges: "Сохранить изменения",
      saving: "Сохранение...",
      confirmPosition: "Подтверждение позиции",
      confirmQuestion: "Вы уверены, что хотите подтвердить эту позицию?",
      confirm: "Подтвердить",
      confirming: "Подтверждение...",
      return: "Вернуть",
      edit: "Редактировать",
      delete: "Удалить",
      created: "Создан",
      confirmed: "Подтверждён",
      preparing: "Готовится",
      ready: "Готов",
      delivering: "Доставляется",
      completed: "Завершён",
      cancelled: "Отменён",
      partiallyDone: "Частично готов",
      paused: "На паузе",
      refunded: "Возвращен",
      pending: "Ожидает оплаты",
      paid: "Оплачен",
      failed: "Ошибка оплаты",
      cash: "Наличные",
      card: "Карта",
      online: "Онлайн",
      orderNotFound: "Заказ не найден",
      loadingError: "Не удалось загрузить заказ",
      unknownError: "Неизвестная ошибка",
      productNotFound: "Продукт не найден",
      productLoadError: "Ошибка при загрузке данных продукта",
      positionUpdated: "Позиция успешно обновлена",
      updateError: "Ошибка при обновлении позиции",
      positionReturned: "Позиция возвращена",
      returnError: "Ошибка при возврате позиции",
      positionConfirmed: "Позиция подтверждена",
      confirmError: "Ошибка при подтверждении позиции",
      positionAdded: "Позиция добавлена в заказ",
      addError: "Ошибка при добавлении позиции",
      paymentUpdateError: "Ошибка при обновлении платежа",
      positionRemoved: "Позиция удалена из заказа",
      removeError: "Ошибка при удалении позиции",
      emptyOrder: "Заказ пуст",
      addFromMenu: "Добавьте позиции из меню",
      expand: "Развернуть",
      collapse: "Свернуть"
    },
    ka: {
      back: "უკან შეკვეთების სიაში",
      orderComposition: "შეკვეთის შემადგენლობა",
      addDish: "კერძის დამატება",
      price: "ფასი",
      additives: "დანამატები",
      comment: "კომენტარი",
      total: "სულ",
      paymentStatus: "გადახდის სტატუსი",
      paymentMethod: "გადახდის მეთოდი",
      payment: "გადახდა",
      orderInfo: "შეკვეთის ინფორმაცია",
      orderNumber: "შეკვეთის ნომერი",
      date: "თარიღი",
      orderStatus: "შეკვეთის სტატუსი",
      table: "მაგიდა",
      persons: "პირების რაოდენობა",
      orderType: "შეკვეთის ტიპი",
      dineIn: "დაწესებულებაში",
      takeaway: "წინასწარ შეკვეთა",
      delivery: "მიტანა",
      returnItem: "პოზიციის დაბრუნება",
      returnReason: "დაბრუნების მიზეზი",
      cancel: "გაუქმება",
      confirmReturn: "დაბრუნების დადასტურება",
      processing: "მუშავდება...",
      addPosition: "პოზიციის დამატება შეკვეთაში",
      editPosition: "პოზიციის რედაქტირება",
      saveChanges: "ცვლილებების შენახვა",
      saving: "ინახება...",
      confirmPosition: "პოზიციის დადასტურება",
      confirmQuestion: "დარწმუნებული ხართ, რომ გსურთ ამ პოზიციის დადასტურება?",
      confirm: "დადასტურება",
      confirming: "დადასტურდება...",
      return: "დაბრუნება",
      edit: "რედაქტირება",
      delete: "წაშლა",
      created: "შექმნილი",
      confirmed: "დადასტურებული",
      preparing: "მზადდება",
      ready: "მზადაა",
      delivering: "იგზავნება",
      completed: "დასრულებული",
      cancelled: "გაუქმებული",
      partiallyDone: "ნაწილობრივ მზადაა",
      paused: "პაუზაზეა",
      refunded: "დაბრუნებული",
      pending: "ელოდება გადახდას",
      paid: "გადახდილი",
      failed: "გადახდის შეცდომა",
      cash: "ნაღდი ფული",
      card: "ბარათი",
      online: "ონლაინ",
      orderNotFound: "შეკვეთა ვერ მოიძებნა",
      loadingError: "შეკვეთის ჩატვირთვა ვერ მოხერხდა",
      unknownError: "უცნობი შეცდომა",
      productNotFound: "პროდუქტი ვერ მოიძებნა",
      productLoadError: "პროდუქტის მონაცემების ჩატვირთვის შეცდომა",
      positionUpdated: "პოზიცია წარმატებით განახლდა",
      updateError: "პოზიციის განახლების შეცდომა",
      positionReturned: "პოზიცია დაბრუნებულია",
      returnError: "პოზიციის დაბრუნების შეცდომა",
      positionConfirmed: "პოზიცია დადასტურებულია",
      confirmError: "პოზიციის დადასტურების შეცდომა",
      positionAdded: "პოზიცია დაემატა შეკვეთაში",
      addError: "პოზიციის დამატების შეცდომა",
      paymentUpdateError: "გადახდის განახლების შეცდომა",
      positionRemoved: "პოზიცია წაიშალა შეკვეთიდან",
      removeError: "პოზიციის წაშლის შეცდომა",
      emptyOrder: "შეკვეთა ცარიელია",
      addFromMenu: "მენიუდან დაამატეთ პოზიციები",
      expand: "გაშლა",
      collapse: "ჩაკეცვა"
    }
  } as const;

  const t = translations[language];

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
  const [isRemoving, setIsRemoving] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

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
      toast.error(t.loadingError)
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
    if (!order) return 0;
    
    const itemsTotal = order.items.reduce((sum, item) => {
      return sum + calculateItemPrice(item);
    }, 0);

    const surchargesTotal = order.surcharges?.reduce((sum, surcharge) => {
      if (surcharge.type === 'FIXED') {
        return sum + surcharge.amount;
      } else {
        return sum + (itemsTotal * surcharge.amount) / 100;
      }
    }, 0) || 0;

    return itemsTotal + surchargesTotal;
  };


  const handleEditItem = async (item: OrderItem) => {
    try {
      const product = products.find(p => p.id === item.product.id);
      
      if (!product) {
        toast.error(t.productNotFound);
        return;
      }

      setEditingItem({
        item,
        product
      });
      setUpdatedComment(item.comment || '');
      setUpdatedAdditives(item.additives.map(a => a.id));
    } catch (err) {
      toast.error(t.productLoadError);
      console.error('Error:', err);
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
      toast.success(t.positionUpdated);
      
    } catch (err) {
      toast.error(t.updateError);
      console.error('Error:', err);
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
      toast.success(t.positionReturned);
      setReturnItemId(null);
      setReturnReason('');
      
    } catch (err) {
      toast.error(t.returnError);
      console.error('Error:', err);
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
      toast.success(t.positionConfirmed);
      setConfirmItemId(null);
      
    } catch (err) {
      toast.error(t.confirmError);
      console.error('Error:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!orderId) return;

    try {
      setIsRemoving(true);
      setItemToRemove(itemId);
      
      await OrderService.removeItemFromOrder(orderId as string, itemId);
      await fetchOrder();
      
      toast.success(t.positionRemoved);
    } catch (err) {
      toast.error(t.removeError);
      console.error('Error:', err);
    } finally {
      setIsRemoving(false);
      setItemToRemove(null);
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

      toast.success(t.positionAdded)
    } catch (err) {
      toast.error(t.addError)
      console.error('Error:', err)
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
      toast.error(t.paymentUpdateError)
      console.error('Error:', err)
    } finally {
      setIsUpdatingPayment(false)
    }
  }

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const getProductIcon = (productTitle: string) => {
    if (productTitle.includes('Салат') || productTitle.includes('სალათი')) return <Salad className="h-4 w-4 text-green-600" />;
    if (productTitle.includes('Суп') || productTitle.includes('წვნიანი')) return <Soup className="h-4 w-4 text-orange-500" />;
    if (productTitle.includes('Пицца') || productTitle.includes('პიცა')) return <Pizza className="h-4 w-4 text-red-500" />;
    if (productTitle.includes('Кофе') || productTitle.includes('ყავა')) return <Coffee className="h-4 w-4 text-amber-800" />;
    if (productTitle.includes('Десерт') || productTitle.includes('დესერტი')) return <Dessert className="h-4 w-4 text-pink-500" />;
    return <Utensils className="h-4 w-4" />;
  };

  const getStatusIcon = (status: OrderItemStatus) => {
    switch (status) {
      case OrderItemStatus.CREATED:
        return <Package className="h-4 w-4" />;
      case OrderItemStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4" />;
      case OrderItemStatus.PARTIALLY_DONE:
        return <PackageCheck className="h-4 w-4" />;
      case OrderItemStatus.PAUSED:
        return <Pause className="h-4 w-4" />;
      case OrderItemStatus.COMPLETED:
        return <Check className="h-4 w-4" />;
      case OrderItemStatus.CANCELLED:
      case OrderItemStatus.REFUNDED:
        return <PackageX className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPaymentMethodIcon = (method: EnumPaymentMethod) => {
    switch (method) {
      case EnumPaymentMethod.CASH:
        return <Wallet className="h-4 w-4" />;
      case EnumPaymentMethod.CARD:
        return <CreditCard className="h-4 w-4" />;
      case EnumPaymentMethod.ONLINE:
        return <CircleDollarSign className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'DINE_IN':
        return <Home className="h-4 w-4" />;
      case 'TAKEAWAY':
        return <ShoppingBag className="h-4 w-4" />;
      case 'DELIVERY':
        return <Truck className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: EnumOrderStatus): string => {
    const statusMap = {
      [EnumOrderStatus.CREATED]: t.created,
      [EnumOrderStatus.CONFIRMED]: t.confirmed,
      [EnumOrderStatus.PREPARING]: t.preparing,
      [EnumOrderStatus.READY]: t.ready,
      [EnumOrderStatus.DELIVERING]: t.delivering,
      [EnumOrderStatus.COMPLETED]: t.completed,
      [EnumOrderStatus.CANCELLED]: t.cancelled
    }
    return statusMap[status] || status
  }

  const getItemStatusText = (status: OrderItemStatus): string => {
    const statusMap = {
      [OrderItemStatus.CREATED]: t.created,
      [OrderItemStatus.IN_PROGRESS]: t.preparing,
      [OrderItemStatus.PARTIALLY_DONE]: t.partiallyDone,
      [OrderItemStatus.PAUSED]: t.paused,
      [OrderItemStatus.COMPLETED]: t.completed,
      [OrderItemStatus.CANCELLED]: t.cancelled,
      [OrderItemStatus.REFUNDED]: t.refunded
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  const getPaymentStatusText = (status: string): string => {
    const statusMap = {
      'PENDING': t.pending,
      'PAID': t.paid,
      'FAILED': t.failed,
      'REFUNDED': t.refunded
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  const getPaymentMethodText = (method: EnumPaymentMethod): string => {
    const methodMap = {
      [EnumPaymentMethod.CASH]: t.cash,
      [EnumPaymentMethod.CARD]: t.card,
      [EnumPaymentMethod.ONLINE]: t.online,
    }
    return methodMap[method] || method
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
      <Card className="space-y-6 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>{t.loadingError}</p>
        </div>
        <Button onClick={() => router.push('/orders')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.back}
        </Button>
      </Card>
    )
  }

  if (!order) {
    return (
      <Card className="space-y-6 p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <PackageX className="h-5 w-5" />
          <p>{t.orderNotFound}</p>
        </div>
        <Button onClick={() => router.push('/orders')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.back}
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
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.back}
        </Button>

        <OrderHeader order={order} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <List className="h-5 w-5" />
                {t.orderComposition}
              </h2>
              {canAddItems && (
                <Button 
                  size="sm" 
                  onClick={() => setAddItemDialogOpen(true)}
                  disabled={isUpdating}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t.addDish}
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {order.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                  <Package className="h-8 w-8 mb-2" />
                  {t.emptyOrder}
                </div>
              ) : (
                order.items.map(item => (
                  <Card key={item.id} className="p-4 overflow-hidden">  
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getProductIcon(item.product.title)}
                          <h3 className="font-medium">
                            {item.product.title} × {item.quantity}
                          </h3>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getStatusIcon(item.status)}
                            {getItemStatusText(item.status)}
                          </Badge>
                        </div>
                        
                        {item.product.restaurantPrices[0] && (
                          <p className="text-sm text-muted-foreground mt-1 flex items-center">
                            <CircleDollarSign className="h-3 w-3 mr-1" />
                            {t.price}: {getProductPrice(item.product)} ₽
                          </p>
                        )}

                          <div className="mt-2 pl-4 border-l-2 border-muted">
                            {item.additives.length > 0 && (
                              <div className="text-sm text-muted-foreground mt-1 flex items-center">
                                <Plus className="h-3 w-3 mr-1" />
                                {t.additives}: {item.additives.map(a => a.title).join(', ')}
                              </div>
                            )}
                            {item.comment && (
                              <div className="text-sm text-muted-foreground mt-1 flex items-center">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {t.comment}: {item.comment}
                              </div>
                            )}
                          </div>
                        
                      </div>

                      <div className="text-right flex flex-col items-end gap-2">
                        <div className="font-medium text-lg">
                          {calculateItemPrice(item)} ₽
                        </div>
                        <div className="flex gap-2">
                          {item.status === 'CREATED' && (
                            <Button 
                              variant="destructive"
                              size="sm" 
                              className="cursor-pointer"
                              onClick={() => setReturnItemId(item.id)}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              {t.return}
                            </Button>
                          )}
                          {item.status === 'REFUNDED' && (
                            <>
                              <Button 
                                variant="outline"
                                size="sm" 
                                className="cursor-pointer"
                                onClick={() => handleEditItem(item)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                {t.edit}
                              </Button>
                              <Button 
                                variant="default"
                                size="sm" 
                                className="cursor-pointer bg-blue-500 hover:bg-blue-600"
                                onClick={() => setConfirmItemId(item.id)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                {t.confirm}
                              </Button>
                              <Button 
                                variant="destructive"
                                size="sm" 
                                className="cursor-pointer"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={isUpdating}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                {t.delete}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
            
               {order.surcharges && order.surcharges.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <div className="text-sm font-medium text-muted-foreground">
                {language === 'ru' ? 'Надбавки' : 'დამატებითი გადასახადები'}
              </div>
              {order.surcharges.map(surcharge => (
                <div key={surcharge.id} className="flex justify-between text-sm">
                  <span>{surcharge.title}</span>
                  <span className="font-medium">
                    {surcharge.type === 'FIXED' 
                      ? `+${surcharge.amount.toFixed(2)} ₽` 
                      : `+${surcharge.amount}%`}
                  </span>
                </div>
              ))}
            </div>
          )}

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="font-medium flex items-center">
                <CircleDollarSign className="h-5 w-5 mr-2" />
                {t.total}:
              </div>
              <div className="text-lg font-bold">{order.totalAmount} ₽</div>
            </div>

            {order.payment && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <div className="font-medium flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    {t.paymentStatus}:
                  </div>
                  <Badge variant={order.payment.status === 'PAID' ? 'default' : 'secondary'} className="flex items-center gap-1">
                    {getPaymentStatusText(order.payment.status)}
                  </Badge>
                </div>
                {order.payment.method && (
                  <div className="flex justify-between items-center">
                    <div className="font-medium flex items-center">
                      {getPaymentMethodIcon(order.payment.method)}
                      <span className="ml-2">{t.paymentMethod}:</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getPaymentMethodIcon(order.payment.method)}
                      {getPaymentMethodText(order.payment.method)}
                    </div>
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
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t.payment}
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
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t.orderInfo}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center">
                    <List className="h-4 w-4 mr-1" />
                    {t.orderNumber}:
                  </span>
                  <span>#{order.number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {t.date}:
                  </span>
                  <span>
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center">
                    <PackageCheck className="h-4 w-4 mr-1" />
                    {t.orderStatus}:
                  </span>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getStatusText(order.status)}
                  </Badge>
                </div>
                {order.tableNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center">
                      <Table className="h-4 w-4 mr-1" />
                      {t.table}:
                    </span>
                    <span>{order.tableNumber}</span>
                  </div>
                )}
                {order.numberOfPeople && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {t.persons}:
                    </span>
                    <span>{order.numberOfPeople}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center">
                    {getOrderTypeIcon(order.type)}
                    <span className="ml-1">{t.orderType}:</span>
                  </span>
                  <span>
                    {order.type === 'DINE_IN' && t.dineIn}
                    {order.type === 'TAKEAWAY' && t.takeaway}
                    {order.type === 'DELIVERY' && t.delivery}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
        
      {/* Диалог возврата позиции */}
      <Dialog open={!!returnItemId} onOpenChange={(open) => !open && setReturnItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              {t.returnItem}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="returnReason" className="mb-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {t.returnReason}
              </Label>
              <Input
                id="returnReason"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder={t.returnReason}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setReturnItemId(null)}
            >
              <X className="h-4 w-4 mr-1" />
              {t.cancel}
            </Button>
            <Button 
              onClick={handleReturnItem}
              disabled={isReturning || !returnReason}
            >
              {isReturning ? (
                <Clock className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              {isReturning ? t.processing : t.confirmReturn}
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
          className="w-[70%] max-w-none h-[80vh] max-h-[80vh]"
          style={{
            width: '70vw',
            maxWidth: 'none',
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t.addPosition}
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

      {/* Диалог редактирования позиции */}
      <Dialog 
        open={!!editingItem} 
        onOpenChange={(open) => !open && setEditingItem(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {t.editPosition}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="itemComment" className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-1" />
                {t.comment}
              </Label>
              <Input
                className="mt-2"
                id="itemComment"
                value={updatedComment}
                onChange={(e) => setUpdatedComment(e.target.value)}
                placeholder={t.comment}
              />
            </div>
            
            {editingItem?.product?.additives && editingItem.product.additives.length > 0 && (
              <div>
                <Label className="flex items-center">
                  <Plus className="h-4 w-4 mr-1" />
                  {t.additives}
                </Label>
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
              <X className="h-4 w-4 mr-1" />
              {t.cancel}
            </Button>
            <Button 
              onClick={handleSaveItemChanges}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Clock className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              {isUpdating ? t.saving : t.saveChanges}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Диалог подтверждения позиции */}
      <Dialog open={!!confirmItemId} onOpenChange={(open) => !open && setConfirmItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              {t.confirmPosition}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {t.confirmQuestion}
          </DialogDescription>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmItemId(null)}
            >
              <X className="h-4 w-4 mr-1" />
              {t.cancel}
            </Button>
            <Button 
              onClick={handleConfirmItem}
              disabled={isConfirming}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isConfirming ? (
                <Clock className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              {isConfirming ? t.confirming : t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AccessCheck>
  )
}