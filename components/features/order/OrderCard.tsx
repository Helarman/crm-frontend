'use client'

import { useState, useRef, useEffect } from 'react'
import { OrderHeader } from './OrderHeader'
import { OrderCustomerInfo } from './OrderCustomerInfo'
import { OrderPaymentStatus } from './OrderPaymentStatus'
import { Card } from '@/components/ui/card'
import { OrderResponse, OrderItemStatus, OrderService } from '@/lib/api/order.service'
import { cn } from '@/lib/utils'
import { Language, useLanguageStore } from '@/lib/stores/language-store'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ChevronDown, Check, Clock, Package, AlertCircle, Tag, Gift, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/useAuth'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { WarehouseService } from '@/lib/api/warehouse.service'
import { motion, AnimatePresence } from 'framer-motion'
import { OrderItem } from '@/lib/types/order'

type OrderItemWithStatus = {
  id: string
  status: string
  product: {
    title: string
    workshops: {
      workshop: {
        name: string
        id: string
      }
      id: string
    }[]
    ingredients: {
      inventoryItemId: string
      quantity: number
    }[]
  }
  quantity: number
  additives: {
    title: string
    price: number
  }[]
  comment?: string
  currentStatus: OrderItemStatus
  assignedTo?: {
    id: string
    name: string
  } | null
  isReordered?: boolean
  isRefund?: boolean
}

type WriteOffItem = {
  id: string
  name: string
  quantity: number
  unit: string
}

interface Ingredient {
  inventoryItemId: string;
  quantity: number;
  inventoryItem?: {
    name: string;
    unit: string;
  };
}

const statusColors = {
  CREATED: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    itemBorder: 'border-amber-200 dark:border-amber-800'
  },
  CONFIRMED: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/60',
    itemBorder: 'border-blue-200 dark:border-blue-800'
  },
  PREPARING: {
    border: 'border-l-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/60',
    itemBorder: 'border-purple-200 dark:border-purple-800'
  },
  READY: {
    border: 'border-l-green-500',
    bg: 'bg-green-50 dark:bg-green-900/60',
    itemBorder: 'border-green-200 dark:border-green-800'
  },
  DELIVERING: {
    border: 'border-l-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-900/60',
    itemBorder: 'border-cyan-200 dark:border-cyan-800'
  },
  COMPLETED: {
    border: 'border-l-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-900/60',
    itemBorder: 'border-gray-200 dark:border-gray-800'
  },
  CANCELLED: {
    border: 'border-l-red-500',
    bg: 'bg-red-50 dark:bg-red-900/60',
    itemBorder: 'border-red-200 dark:border-red-800'
  }
}

const MAX_VISIBLE_ITEMS = 3

const getStatusText = (status: OrderItemStatus, language: string): string => {
  const translations = {
    ru: {
      [OrderItemStatus.CREATED]: 'Создан',
      [OrderItemStatus.IN_PROGRESS]: 'В процессе',
      [OrderItemStatus.PARTIALLY_DONE]: 'Частично готов',
      [OrderItemStatus.PAUSED]: 'На паузе',
      [OrderItemStatus.COMPLETED]: 'Готов',
      [OrderItemStatus.CANCELLED]: 'Отменен',
      [OrderItemStatus.REFUNDED]: 'Возвращен'
    },
    ka: {
      [OrderItemStatus.CREATED]: 'შექმნილი',
      [OrderItemStatus.IN_PROGRESS]: 'მუშავდება',
      [OrderItemStatus.PARTIALLY_DONE]: 'ნაწილობრივ მზადაა',
      [OrderItemStatus.PAUSED]: 'პაუზაზეა',
      [OrderItemStatus.COMPLETED]: 'მზადაა',
      [OrderItemStatus.CANCELLED]: 'გაუქმებული',
      [OrderItemStatus.REFUNDED]: 'დაბრუნებული'
    }
  }
  return translations[language as 'ru' | 'ka'][status] || status
}

type WarningMessage = {
  id: string;
  text: string;
  icon: React.ReactNode;
  color: string;
};

export function OrderCard({ order, variant = 'default', onStatusChange, className }: {
  order: OrderResponse
  variant?: 'default' | 'kitchen' | 'delivery'
  onStatusChange?: (updatedOrder: OrderResponse) => void
  className?: string
}) {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguageStore()
  const [showAllItems, setShowAllItems] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [writeOffDialogOpen, setWriteOffDialogOpen] = useState(false)
  const [currentItemId, setCurrentItemId] = useState<string | null>(null)
  const [writeOffItems, setWriteOffItems] = useState<WriteOffItem[]>([])
  const [isWritingOff, setIsWritingOff] = useState(false)
  const [items, setItems] = useState<OrderItemWithStatus[]>([])
  const [currentWarningIndex, setCurrentWarningIndex] = useState(0)

  const orderId = order.id;

  // Get user's workshop IDs
  const userWorkshopIds = user?.workshops?.map((workshop: any) => workshop.workshopId) || [];

  const filteredItems = order.items.filter(item => {
    if (item.status === OrderItemStatus.REFUNDED) return false;
    if (item.status === OrderItemStatus.CREATED) return false;
    if (item.status === OrderItemStatus.COMPLETED) return false;

    if (userWorkshopIds.length === 0) return true;
    
    const itemWorkshopIds = item.product.workshops?.map((w: any) => w.workshop.id) || [];
    
    return itemWorkshopIds.some((id: string) => userWorkshopIds.includes(id));
  });

  const otherItems = order.items.filter(item => !filteredItems.includes(item));

  const translations = {
    ru: {
      back: "Назад к списку заказов",
      orderComposition: "Состав заказа",
      noDishes: "Нет блюд для приготовления",
      additives: "Добавки",
      comment: "Комментарий",
      orderInfo: "Информация о заказе",
      orderNumber: "Номер заказа",
      date: "Дата",
      orderStatus: "Статус заказа",
      startCooking: "В работу",
      partiallyDone: "Частично готово",
      pause: "Пауза",
      ready: "Готово",
      writeOffTitle: "Списание ингредиентов",
      writeOffText: "Будут списаны следующие ингредиенты:",
      cancel: "Отмена",
      confirmWriteOff: "Подтвердить списание",
      writingOff: "Списание...",
      statusUpdated: "Статус обновлён",
      writeOffSuccess: "Ингредиенты списаны, статус обновлён",
      writeOffError: "Ошибка при списании ингредиентов",
      statusUpdateError: "Ошибка обновления статуса",
      loadError: "Не удалось загрузить заказ",
      unknownError: "Неизвестная ошибка",
      orderNotFound: "Заказ не найден",
      ingredientsError: "Не удалось получить информацию об ингредиентах",
      created: "Создан",
      inProgress: "В процессе",
      partiallyDoneStatus: "Частично готов",
      paused: "На паузе",
      completed: "Готов",
      cancelled: "Отменен",
      refunded: "Возвращен",
      assignedTo: "Ответственный",
      you: "Вы",
      currentStatus: "Текущий статус",
      loading: "Загрузка..",
      deliveryAddress: "Адрес доставки",
      openInMap: "Открыть в картах",
      otherDishes: "Другие блюда",
      responsibleWorkshop: "Ответственный цех",
      reorderInKitchen: "Дозаказ на кухне",
      reorderNotConfirmed: "Дозаказ не подтвержден",
      wasRefund: "Был возврат",
      discountCanceled: "Была отмена скидки",
      discount: "Скидка",
      bonusPoints: "Бонусные баллы",
      surcharges: "Надбавки",
      total: "Итого",
      itemsTotal: "Сумма блюд",
      refundedItems: "Возвращенные блюда"
    },
    ka: {
      back: "უკან შეკვეთების სიაში",
      orderComposition: "შეკვეთის შემადგენლობა",
      noDishes: "მომზადებისთვის კერძები არ არის",
      additives: "დანამატები",
      comment: "კომენტარი",
      orderInfo: "შეკვეთის ინფორმაცია",
      orderNumber: "შეკვეთის ნომერი",
      date: "თარიღი",
      orderStatus: "შეკვეთის სტატუსი",
      startCooking: "სამუშაოდ",
      partiallyDone: "ნაწილობრივ მზადაა",
      pause: "პაუზა",
      ready: "მზადაა",
      writeOffTitle: "ინგრედიენტების ჩამოწერა",
      writeOffText: "შემდეგი ინგრედიენტები ჩაიწერება:",
      cancel: "გაუქმება",
      confirmWriteOff: "ჩამოწერის დადასტურება",
      writingOff: "იწერება...",
      statusUpdated: "სტატუსი განახლდა",
      writeOffSuccess: "ინგრედიენტები ჩაიწერა, სტატუსი განახლდა",
      writeOffError: "ინგრედიენტების ჩამოწერის შეცდომა",
      statusUpdateError: "სტატუსის განახლების შეცდომა",
      loadError: "შეკვეთის ჩატვირთვა ვერ მოხერხდა",
      unknownError: "უცნობი შეცდომა",
      orderNotFound: "შეკვეთა ვერ მოიძებნა",
      ingredientsError: "ინგრედიენტების მონაცემების მიღება ვერ მოხერხდა",
      created: "შექმნილი",
      inProgress: "მუშავდება",
      partiallyDoneStatus: "ნაწილობრივ მზადაა",
      paused: "პაუზაზეა",
      completed: "მზადაა",
      cancelled: "გაუქმებული",
      refunded: "დაბრუნებული",
      assignedTo: "პასუხისმგებელი",
      you: "თქვენ",
      currentStatus: "მიმდინარე სტატუსი",
      loading: "იტვირთება..",
      deliveryAddress: "მიტანის მისამართი",
      openInMap: "გახსნა რუკაზე",
      otherDishes: "სხვა კერძები",
      responsibleWorkshop: "პასუხისმგებელი სახელოსნო",
      reorderInKitchen: "რეორდერი სამზარეულოში",
      reorderNotConfirmed: "რეორდერი არ არის დადასტურებული",
      wasRefund: "იყო დაბრუნება",
      discountCanceled: "ფასდაკლების გაუქმება",
      discount: "ფასდაკლება",
      bonusPoints: "ბონუს ქულები",
      surcharges: "დანამატები",
      total: "სულ",
      itemsTotal: "კერძების ჯამი",
      refundedItems: "დაბრუნებული კერძები"
    }
  } as const;

  const t = translations[language as Language];

  const currentStatusStyle = statusColors[order.status] || statusColors.CREATED

  // Calculate order totals
  const calculateItemsTotal = () => {
    return order.items.reduce((sum, item) => {
      if (item.isRefund) return sum;
      
      const itemPrice = item.product.price;
      const additivesPrice = item.additives.reduce((addSum, additive) => addSum + additive.price, 0);
      return sum + (itemPrice + additivesPrice) * item.quantity;
    }, 0);
  };

  const calculateRefundedTotal = () => {
    return order.items.reduce((sum, item) => {
      if (!item.isRefund) return sum;
      
      const itemPrice = item.product.price;
      const additivesPrice = item.additives.reduce((addSum, additive) => addSum + additive.price, 0);
      return sum + (itemPrice + additivesPrice) * item.quantity;
    }, 0);
  };

  const calculateSurchargesTotal = () => {
    if (!order.surcharges) return 0;
    
    const itemsTotal = calculateItemsTotal();
    return order.surcharges.reduce((sum, surcharge) => {
      if (surcharge.type === 'FIXED') {
        return sum + surcharge.amount;
      } else {
        return sum + (itemsTotal * surcharge.amount) / 100;
      }
    }, 0);
  };

  const calculateFinalTotal = () => {
    const itemsTotal = calculateItemsTotal();
    const surchargesTotal = calculateSurchargesTotal();
    const discountAmount = order.discountAmount || 0;
    const bonusPointsUsed = order.bonusPointsUsed || 0;
    
    return itemsTotal + surchargesTotal - discountAmount - bonusPointsUsed;
  };

  const getWarningMessages = (): WarningMessage[] => {
    const warnings: WarningMessage[] = [];
    
    if (order.attentionFlags?.isReordered) {
      if (order.status === 'PREPARING') {
        warnings.push({
          id: 'reordered-preparing',
          text: t.reorderInKitchen,
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200'
        });
      } else if (order.status === 'CREATED') {
        warnings.push({
          id: 'reordered-created',
          text: t.reorderNotConfirmed,
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200'
        });
      }
    }

    if (order.attentionFlags?.isRefund) {
      warnings.push({
        id: 'refund',
        text: t.wasRefund,
        icon: <AlertCircle className="h-4 w-4" />,
        color: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
      });
    }

    if (order.attentionFlags?.discountCanceled) {
      warnings.push({
        id: 'discount-canceled',
        text: t.discountCanceled,
        icon: <AlertCircle className="h-4 w-4" />,
        color: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200'
      });
    }

    return warnings;
  };

  const warnings = getWarningMessages();

  useEffect(() => {
    if (warnings.length > 1) {
      const interval = setInterval(() => {
        setCurrentWarningIndex((prev) => (prev + 1) % warnings.length);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [warnings.length]);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(showAllItems 
        ? contentRef.current.scrollHeight 
        : Math.min(contentRef.current.scrollHeight, MAX_VISIBLE_ITEMS * 64)
      )
    }
  }, [showAllItems, order.items])

  useEffect(() => {
    if (order) {
      setItems(order.items.map(item => ({
        id: item.id,
        status: item.status,
        product: {
          title: item.product.title || 'Без названия',
          workshops: item.product.workshops,
          ingredients: item.product.ingredients || []
        },
        quantity: item.quantity,
        additives: item.additives.map(add => ({
          title: add.title,
          price: add.price
        })),
        comment: item.comment,
        currentStatus: item.status || 'CREATED',
        assignedTo: null,
        isReordered: item.isReordered,
        isRefund: item.isRefund
      })))
    }
  }, [order])

  const handleCardClick = () => {
    const routePath = `/orders/${order.id}`
    if(variant === 'default'){ 
      router.push(routePath)
    } 
  }
  
  const createOrderLog = async (action: string) => {
    if (!orderId || !user) return;
    
    try {
      await OrderService.createLog({
        orderId: orderId as string,
        action,
        userId: user.id,
      });
      
    } catch (err) {
      console.error('Ошибка при создании лога:', err);
    }
  };

  const handleItemClick = async (itemId: string) => {
    try {
      const item = order.items.find(i => i.id === itemId)
      if (!item) return

      const ingredientsToWriteOff = await Promise.all(
        item.product.ingredients.map(async (ingredient: Ingredient) => {
          try {
            return {
              id: ingredient.inventoryItemId,
              name: ingredient.inventoryItem?.name || t.unknownError,
              quantity: ingredient.quantity * item.quantity,
              unit: ingredient.inventoryItem?.unit || 'ც.'
            }
          } catch (error) {
            console.error(`Error processing ingredient ${ingredient.inventoryItemId}:`, error)
            return null
          }
        })
      )

      const validIngredients = ingredientsToWriteOff.filter(Boolean) as WriteOffItem[]
      
      if (validIngredients.length === 0) {
        toast.warning(t.ingredientsError)
        return
      }

      setWriteOffItems(validIngredients)
      setCurrentItemId(itemId)
      setWriteOffDialogOpen(true)
    } catch (error) {
      console.error('Error preparing write-off:', error)
      toast.error(t.writeOffError)
    }
  }

  const handleConfirmWriteOff = async () => {
    if (!currentItemId) return

    setIsWritingOff(true)
    try {
      await Promise.all(
        writeOffItems.map(item => 
          WarehouseService.writeOffInventory(item.id, {
            quantity: item.quantity,
            reason: `Списание при приготовлении заказа #${order?.number}`
          })
        )
      )

      const preparedItem = items.find(item => item.id === currentItemId);
      
      if (preparedItem && user) {
        await createOrderLog(
          language === 'ru' 
            ? `Блюдо приготовлено: ${preparedItem.product.title} × ${preparedItem.quantity}` 
            : `კერძი მზადაა: ${preparedItem.product.title} × ${preparedItem.quantity}`
        );
      }

      const updatedOrder = await handleStatusChange(currentItemId, OrderItemStatus.COMPLETED)

      toast.success(t.writeOffSuccess)
      setWriteOffDialogOpen(false)
      return updatedOrder
    } catch (error) {
      console.error('Error writing off inventory:', error)
      toast.error(t.writeOffError)
      throw error
    } finally {
      setIsWritingOff(false)
    }
  }

  const handleStatusChange = async (itemId: string, newStatus: OrderItemStatus) => {
    if (!orderId || !user?.id || isUpdating) return;

    const originalItems = [...items];

    try {
      setIsUpdating(true);
      
      const updatedItems = items.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              currentStatus: newStatus,
              status: newStatus,
              assignedTo: newStatus === 'IN_PROGRESS' ? { id: user.id, name: user.name } : item.assignedTo
            } 
          : item
      );
      setItems(updatedItems);

      const updatedOrder = await OrderService.updateItemStatus(
        orderId,
        itemId,
        { 
          status: newStatus,
          userId: newStatus === 'IN_PROGRESS' ? user.id : undefined
        }
      );

      const fullOrder = await OrderService.getById(orderId);
      const itemsToCheck = fullOrder.items?.length > 0 ? fullOrder.items : updatedItems;
      const allItemsCompleted = itemsToCheck.every(item => 
        ['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(item.status)
      );

      if (allItemsCompleted && fullOrder.status !== 'COMPLETED') {
        const finalUpdatedOrder = await OrderService.updateStatus(
          orderId,
          { status: 'READY' }
        );
        
        if (onStatusChange) onStatusChange(finalUpdatedOrder);
        
        toast.success(language === 'ru' 
          ? 'Все блюда готовы! Заказ завершен.' 
          : 'ყველა კერძი მზადაა! შეკვეთა დასრულებულია.');
        return finalUpdatedOrder;
      }

      if (onStatusChange) onStatusChange(fullOrder);
      toast.success(t.statusUpdated);
      return fullOrder;

    } catch (err) {
      setItems(originalItems);
      toast.error(t.statusUpdateError);
      console.error('Status update error:', err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div>
      <Card 
        className={cn(
          "flex flex-col h-full relative overflow-hidden",
          "border-l-4 cursor-pointer transition-all hover:shadow-md",
          currentStatusStyle.border,
          currentStatusStyle.bg,
          className
        )}
        onClick={handleCardClick}
      >
        <div className="absolute top-0 left-0 w-full h-1" />
         
        <div className="flex flex-col flex-grow pt-1">
          <OrderHeader order={order} compact={variant === 'kitchen'} />
          
          {/* Warning messages block */}
          {warnings.length > 0 && variant === 'default' && (
            <div className="px-3 pt-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={warnings[currentWarningIndex]?.id || 'no-warnings'}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md text-sm font-medium",
                    warnings[currentWarningIndex]?.color
                  )}
                >
                  {warnings[currentWarningIndex]?.icon}
                  <span>{warnings[currentWarningIndex]?.text}</span>
                  
                  {warnings.length > 1 && (
                    <div className="ml-auto flex gap-1">
                      {warnings.map((_, index) => (
                        <div
                          key={index}
                          className={`h-2 w-2 rounded-full ${index === currentWarningIndex ? 'bg-current opacity-100' : 'bg-current opacity-30'}`}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
      
          <div className="p-3 space-y-3">
            <div>
              {isUpdating ? (
                <div>
                  {t.loading}
                </div>
              ) : (
                variant === 'kitchen' ? (
                  <div>
                    {filteredItems.length > 0 ? (
                      filteredItems.map(item => (
                        <div 
                          key={item.id} 
                          className={cn(
                            "mb-2 last:mb-0 p-2 rounded-lg border border-dashed cursor-pointer py-7 transition-colors hover:bg-opacity-90 border-2",
                            item.status === OrderItemStatus.COMPLETED ? "opacity-70" : "" , 
                            item.isReordered ? 'border-red-500 ' : 'border-black'
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.status !== OrderItemStatus.COMPLETED) {
                              handleItemClick(item.id);
                            }
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                {item.product.title} × {item.quantity}
                              </div>
                              {item.additives.length > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {language === 'ru' ? 'Добавки:' : 'დანამატები:'} {item.additives.map(a => a.title).join(', ')}
                                </div>
                              )}
                              {item.comment && (
                                <div className="text-xs text-muted-foreground">
                                  {language === 'ru' ? 'Коммент:' : 'კომენტარი:'} {item.comment}
                                </div>
                              )}
                            </div>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                            >
                              {getStatusText(item.status, language)}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-4">
                        {t.noDishes}
                      </div>
                    )}

                    {otherItems.length > 0 && (
                      <div className="mt-4">
                        <details className="group">
                          <summary className="flex items-center justify-between cursor-pointer list-none text-sm text-muted-foreground">
                            <span>
                              {t.otherDishes} ({otherItems.length})
                            </span>
                            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                          </summary>
                          <div className="mt-2 space-y-2">
                            {otherItems.map(item => (
                              <div 
                                key={item.id} 
                                className={cn(
                                  "p-2 rounded-lg border border-dashed border-gray-300 py-4 opacity-70",
                                  item.status === OrderItemStatus.COMPLETED ? "opacity-50" : ""
                                )}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium flex items-center gap-1">
                                      {item.product.title} × {item.quantity}
                                    </div>
                                    {item.additives.length > 0 && (
                                      <div className="text-xs text-muted-foreground">
                                        {language === 'ru' ? 'Добавки:' : 'დანამატები:'} {item.additives.map(a => a.title).join(', ')}
                                      </div>
                                    )}
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {getStatusText(item.status, language)}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {t.responsibleWorkshop}: {item.product.workshops?.[0]?.workshop.name || (language === 'ru' ? 'Не указан' : 'არ არის მითითებული')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                ) : (
                  // Default variant - show detailed order info
                  <div className="space-y-4">
                    {/* Order items */}
                    <div className="space-y-2">
                      {order.items.filter(i => !i.isRefund).map(item => (
                        <div key={item.id} className="flex justify-between items-start p-2 bg-muted/10 rounded">
                          <div>
                            <div className="font-medium">
                              {item.quantity} × {item.product.title}
                            </div>
                            {item.additives.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {t.additives}: {item.additives.map(a => a.title).join(', ')}
                              </div>
                            )}
                            {item.comment && (
                              <div className="text-xs text-muted-foreground">
                                {t.comment}: {item.comment}
                              </div>
                            )}
                          </div>
                          <div className="font-medium">
                            {((item.product.price + item.additives.reduce((sum, a) => sum + a.price, 0)) * item.quantity).toFixed(2)} ₽
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Refunded items */}
                    {order.items.some(i => i.isRefund) && (
                      <div className="border-t pt-2">
                        <div className="text-sm font-medium text-red-500 dark:text-red-400 mb-1">
                          {t.refundedItems}
                        </div>
                        <div className="space-y-1">
                          {order.items.filter(i => i.isRefund).map(item => (
                            <div key={item.id} className="flex justify-between items-start p-2 bg-red-50 dark:bg-red-900/10 rounded">
                              <div>
                                <div className="font-medium line-through">
                                  {item.quantity} × {item.product.title}
                                </div>
                                {item.additives.length > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    {t.additives}: {item.additives.map(a => a.title).join(', ')}
                                  </div>
                                )}
                              </div>
                              <div className="font-medium line-through">
                                -{((item.product.price + item.additives.reduce((sum, a) => sum + a.price, 0)) * item.quantity).toFixed(2)} ₽
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order summary */}
                    <div className="border-t pt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">{t.itemsTotal}:</span>
                        <span className="text-sm font-medium">{calculateItemsTotal().toFixed(2)} ₽</span>
                      </div>

                      {order.surcharges && order.surcharges.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm">{t.surcharges}:</span>
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            +{calculateSurchargesTotal().toFixed(2)} ₽
                          </span>
                        </div>
                      )}
                      {(order.discountAmount !== undefined && order.discountAmount !== null && order.discountAmount > 0) && (
                        <div className="flex justify-between">
                          <span className="text-sm flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {t.discount}:
                          </span>
                          <span className={cn(
                            "text-sm font-medium",
                            order.discountAmount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                          )}>
                            {order.discountAmount > 0 ? `-${order.discountAmount.toFixed(2)}` : '0.00'} ₽
                          </span>
                        </div>
                      )}

                      {order.bonusPointsUsed != 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm flex items-center gap-1">
                            <Gift className="h-3 w-3" />
                            {t.bonusPoints}:
                          </span>
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            -{order.bonusPointsUsed.toFixed(2)} ₽
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">{t.total}:</span>
                        <span className="font-bold">
                          {calculateFinalTotal().toFixed(2)} ₽
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
            
            {variant === 'default' && (order.scheduledAt || order.customer) ? (
              <div className='border-t pt-2'>
                {(user?.role === 'SUPERVISOR' || user?.role === 'MANAGER') && order.customer && variant === 'default' && (
                  <OrderCustomerInfo customer={order.customer} compact />
                )}
                {order.scheduledAt &&
                  <Badge 
                    variant="outline"
                    className="flex items-center gap-1 px-2 py-1 rounded-md border text-sm font-medium"
                  >
                    {language === 'ru' ? 'Отложено до' : 'გადაიდო'}
                    <span className="text-sm">
                      {format(new Date(order.scheduledAt), 'HH:mm')}
                    </span>
                  </Badge>
                }
              </div>
            ) : null}
            
            {variant === 'default' && order.payment && (
              <OrderPaymentStatus payment={order.payment} order={order} compact />
            )}
          </div>
        </div>
      </Card>

      <Dialog open={writeOffDialogOpen} onOpenChange={setWriteOffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t.writeOffTitle}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              {t.writeOffText}
            </p>
            <ul className="space-y-2">
              {writeOffItems.map((item, index) => (
                <li key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>{item.name}</span>
                  <span className="font-medium">
                    {item.quantity} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setWriteOffDialogOpen(false)} 
              disabled={isWritingOff}
            >
              {t.cancel}
            </Button>
            <Button 
              onClick={handleConfirmWriteOff} 
              disabled={isWritingOff}
            >
              {isWritingOff ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  {t.writingOff}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t.confirmWriteOff}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}