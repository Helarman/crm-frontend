  'use client'

  import { useParams, useRouter } from 'next/navigation'
  import { useState, useEffect, useCallback, useRef } from 'react'
  import { OrderHeader } from '@/components/features/order/OrderHeader'
  import { Card } from '@/components/ui/card'
  import { Button } from '@/components/ui/button'
  import { Skeleton } from '@/components/ui/skeleton'
  import { useAuth } from '@/lib/hooks/useAuth'
  import { OrderService, OrderResponse, EnumOrderStatus, OrderItemStatus, EnumPaymentMethod } from '@/lib/api/order.service'
  import { toast } from 'sonner'
  import { AccessCheck } from '@/components/AccessCheck'
  import { Badge } from '@/components/ui/badge'
  import { ProductService } from '@/lib/api/product.service'
  import { CategoryService } from '@/lib/api/category.service'
  import { useLanguageStore } from '@/lib/stores/language-store'
  import { Label } from '@/components/ui/label'
  import { Input } from '@/components/ui/input'
  import { Textarea } from '@/components/ui/textarea'
  import {
    ArrowLeft,
    Check,
    X,
    Clock,
    Utensils,
    MessageSquare,
    Package,
    History,
    Edit,
    Plus,
    Minus,
    List,
    Users,
    Table,
    MapPin,
    CheckCircle,
    Loader2,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    RefreshCw,
    Receipt,
    Ban,
    ShoppingBag,
    Tag,
    Play,
    Pause,
    Undo,
    User,
    Printer,
    CookingPot,
    ChefHat,
    Truck,
    Pencil,
    Gift,
    Sparkles,
    LayoutGrid,
    LayoutTemplate,
    Mic,
    Wifi,
    WifiOff,
    Search,
    PackagePlus,
    Filter,
    Store,
    Banknote,
    Home,
    Calendar,
    MessageCircle,
    Grid2x2Check,
    Building,
    Star,
    Smartphone,
    Wallet,
    CreditCard,
    HistoryIcon,
    ShoppingCart,
    PlusSquare,
    Info
  } from 'lucide-react'
  import { Category, OrderItem, OrderState } from '@/lib/types/order'
  import { Product } from '@/lib/types/product'
  import Image from 'next/image'
  import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
  import SearchableSelect from '@/components/features/menu/product/SearchableSelect'
  import { OrderTypeSelector } from '@/components/features/order/OrderTypeSelector'
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from '@/components/ui/alert-dialog'
  import { DiscountResponseDto, DiscountService, OrderType } from '@/lib/api/discount.service'
  import { PaymentDialog } from '@/components/features/order/PaymentDialog'
  import { format } from 'date-fns'
  import { ru, ka } from 'date-fns/locale'
  import PrecheckDialog from '../default/[id]/PrecheckDialog'
  import { CustomerService } from '@/lib/api/customer.service'
  import React from 'react'
  import { ShiftService } from '@/lib/api/shift.service'
  import { useOrderWebSocket } from '@/lib/hooks/useOrderWebSocket'
  import { OrderAdditiveService, OrderAdditiveWithRelations, OrderAdditiveType, EnumOrderType as AdditiveEnumOrderType } from '@/lib/api/order-additive.service'
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
  import { InventoryTransactionType, WarehouseService } from '@/lib/api/warehouse.service'
  import { RestaurantService } from '@/lib/api/restaurant.service'

  // Типы для навигации по категориям
  interface CategoryNavigation {
    currentCategory: Category | null
    parentCategory: Category | null
    breadcrumbs: Category[]
  }

  // Интерфейс для модификатора заказа в компоненте
  interface OrderAdditiveItem {
    id: string;
    title: string;
    price: number;
    type: OrderAdditiveType;
    isActive: boolean;
    orderTypes: AdditiveEnumOrderType[];
    quantity?: number;
    networkId?: string;
    inventoryItem?: any | null;
  }

  // Интерфейс для связи заказа с модификатором
  interface OrderOrderAdditive {
    id: string;
    orderId: string;
    orderAdditiveId: string;
    orderAdditive: OrderAdditiveWithRelations;
    quantity: number;
    price: number;
    createdAt: Date;
    updatedAt: Date;
  }

  export default function WaiterOrderPage() {
    const { id: orderId } = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const { language } = useLanguageStore()

    const translations = {
      ru: {
        back: "Назад к списку заказов",
        calculate: "Рассчитать",
        confirmCalculate: "Вы уверены, что хотите рассчитать заказ?",
        menu: "Меню",
        additives: "Модификаторы",
        comment: "Комментарий",
        total: "Итого",
        paymentStatus: "Статус оплаты",
        paymentMethod: "Способ оплаты",
        orderType: "Тип заказа",
        table: "Стол",
        persons: "Количество",
        confirm: "Готовить",
        complete: "Завершить",
        cancel: "Отменить",
        pending: "Ожидает оплаты",
        paid: "Оплачен",
        failed: "Ошибка оплаты",
        cash: "Наличные",
        card: "Карта",
        online: "Онлайн",
        orderNotFound: "Заказ не найден",
        loadingError: "Не удалось загрузить заказ",
        emptyOrder: "Заказ пуст",
        selectAdditives: "Выберите модификаторы...",
        searchAdditives: "Поиск добавок...",
        noAdditivesFound: "Модификаторы не найдены",
        noProductsFound: "Продукты не найдены",
        saveChanges: "Сохранить изменения",
        saving: "Сохранение...",
        orderHistory: "История заказа",
        noHistory: "История изменений пока пуста",
        confirmComplete: "Вы уверены, что хотите завершить заказ?",
        confirmCancel: "Вы уверены, что хотите отменить заказ?",
        paymentRequired: "Сначала необходимо подтвердить оплату",
        exitConfirmTitle: "Подтверждение выхода",
        exitConfirmMessage: "Заказ еще не подтвержден. Вы уверены, что хотите уйти? Неподтвержденные заказы могут быть потеряны.",
        exitConfirmLeave: "Уйти",
        precheckFormed: "Пречек сформирован",
        formPrecheck: "Сформировать пречек",
        refundItem: "Вернуть блюдо",
        refundReason: "Причина возврата",
        confirmRefund: "Подтвердить возврат",
        reorderedItem: "Дозаказ",
        itemReturned: "Возвращено",
        originalItems: "Основной заказ",
        orderDetails: "Детали заказа",
        maxOrder: "Максимальный заказ",
        maxOrderAmount: "Максимальная сумма заказа: {amount} ₽",
        statusCreated: "Создан",
        statusPreparing: "Готовится",
        statusReady: "Готов",
        statusDelivering: "Доставляется",
        statusCompleted: "Завершен",
        statusCancelled: "Отменен",
        showLogs: "История заказа",
        createdAt: "Создан",
        startedAt: "Начат",
        completedAt: "Завершен",
        pausedAt: "Приостановлен",
        refundedAt: "Возврат",
        surcharges: "Надбавки",
        deliveryAddress: "Адрес доставки",
        deliveryTime: "Время доставки",
        deliveryNotes: "Примечания к доставке",
        reorder: "Дозаказ",
        discount: "Скидка",
        discountCanceled: "Скидка отменена",
        precheck: "Пречек",
        refund: "Возврат",
        mainInfo: "Основная информация",
        callBeforeArrival: "Например: Позвоните перед приездом",
        cookingError: "Например: Ошибка приготовления",
        confirmation: "Подтверждение",
        customerCode: "Код клиента",
        enterCustomerCode: "Введите 4-значный код клиента",
        applyCustomer: "Применить клиента",
        customerApplied: "Клиент применен",
        customerNotFound: "Клиент не найден",
        customerDiscount: "Персональная скидка",
        bonusPoints: "Бонусные баллы",
        useBonusPoints: "Использовать баллы",
        pointsAvailable: "Доступно баллов",
        applyDiscount: "Применить скидку",
        removeCustomer: "Удалить клиента",
        customerInfo: "Информация о клиенте",
        phoneNumber: "Телефон",
        personalDiscount: "Персональная скидка",
        currentBonusPoints: "Текущие баллы",
        usePoints: "Использовать баллы",
        pointsToUse: "Количество баллов",
        maxPointsToUse: "Максимум можно использовать",
        applyPoints: "Применить баллы",
        removePoints: "Сбросить баллы",
        discountApplied: "Скидка применена",
        pointsApplied: "Баллы применены",
        cookedIn: 'Приготовлено за',
        cookingFor: 'Готовится',
        minutes: 'минут',
        minutesForm1: 'минуту',
        minutesForm2: 'минуты',
        minutesForm5: 'минут',
        backToCategories: "Назад к категориям",
        allCategories: "Все категории",
        subcategories: "Подкатегории",
        noSubcategories: "Нет подкатегорий",
        logs: {
          orderCreated: "Заказ создан",
          orderConfirmed: "Заказ подтвержден",
          orderCompleted: "Заказ завершен",
          orderCancelled: "Заказ отменен",
          itemAdded: "Добавлено блюдо",
          itemRemoved: "Удалено блюдо",
          itemRefunded: "Блюдо возвращено",
          orderEdited: "Заказ изменен",
          precheckPrinted: "Пречек распечатан",
          sentToKitchen: "Отправлено на кухню",
          readyForDelivery: "Готово к выдаче",
          deliveryStarted: "Доставка начата",
          reorderItems: "Сделан дозаказ",
          paymentCompleted: "Оплата завершена",
          paymentFailed: "Ошибка оплаты",
          customerApplied: "Клиент применен к заказу",
          customerRemoved: "Клиент удален из заказа",
          discountApplied: "Скидка применена",
          pointsApplied: "Бонусные баллы применены",
          pointsRemoved: "Бонусные баллы сброшены"
        },
        discountCode: "Промокод",
        enterDiscountCode: "Введите промокод",
        applyCode: "Применить код",
        discountRemoved: "Скидка удалена",
        discountError: "Ошибка применения скидки",
        discountNotFound: "Скидка не найдена",
        discountExpired: "Скидка истекла",
        discountMinAmount: "Минимальная сумма заказа для скидки: {amount} ₽",
        activeDiscounts: "Активные скидки",
        selectDiscount: "Выберите скидку",
        noDiscountsAvailable: "Нет доступных скидок",
        discountAmount: "Сумма скидки",
        removeDiscount: "Удалить скидку",
        noDiscounts: "Нет доступных скидок",
        target: "Применяется к",
        unlimited: "Без ограничений",
        promoCode: "Промокод",
        minOrder: "Минимальный заказ",
        period: "Период действия",
        usesLeft: "Осталось использований",
        discounts: {
          title: "Активные скидки",
          noDiscounts: "Нет доступных скидок",
          type: "Тип скидки",
          value: "Значение",
          target: "Применяется к",
          minAmount: "Мин. сумма заказа",
          period: "Период действия",
          promoCode: "Промокод",
          conditions: "Условия",
          allItems: "Все позиции",
          specificItems: "Конкретные позиции",
          minOrder: "Минимальный заказ",
          active: "Активна",
          expired: "Истекла",
          unlimited: "Без ограничений",
          usesLeft: "Осталось использований"
        },
        discountTypes: {
          PERCENTAGE: "Процентная",
          FIXED: "Фиксированная"
        },
        discountTargets: {
          ALL: "На весь заказ",
          RESTAURANT: "На ресторан",
          CATEGORY: "На категорию",
          PRODUCT: "На продукт",
          ORDER_TYPE: "По типу заказа"
        },
        discountStatus: {
          ACTIVE: "Активна",
          INACTIVE: "Неактивна",
          EXPIRED: "Истекла"
        },
        orderAdditives: "Модификаторы заказа",
        orderAdditivesDescription: "Добавьте дополнительные услуги или надбавки к заказу",
        addOrderAdditive: "Добавить",
        selectOrderAdditive: "Выберите модификатор...",
        orderAdditivePrice: "Цена",
        orderAdditiveType: "Тип",
        orderAdditiveTypes: {
          FIXED: "Фиксированная",
          PER_PERSON: "За персону"
        },
        removeOrderAdditive: "Удалить",
        orderAdditiveAdded: "Модификатор добавлен",
        orderAdditiveRemoved: "Модификатор удален",
        orderAdditiveError: "Ошибка при работе с модификатором",
        noOrderAdditives: "Нет доступных модификаторов",
        applyToAll: "Применяется ко всем",
        applyPerPerson: "За каждого человека",
        currentOrderAdditives: "Текущие модификаторы",
        addNewOrderAdditive: "Добавить новый модификатор",
        availableOrderAdditives: "Доступные модификаторы",
        filterByType: "Фильтр по типу",
        allTypes: "Все типы",
        activeOnly: "Только активные",
        connection: {
          connected: "Соединение активно",
          disconnected: "Соединение потеряно",
          reconnecting: "Переподключение...",
          error: "Ошибка соединения"
        }
      }
    } as const;

    const t = translations.ru; // Используем только русский язык

    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showMenu, setShowMenu] = useState(false);
    const [productAdditives, setProductAdditives] = useState<Record<string, string[]>>({});
    const [productComments, setProductComments] = useState<Record<string, string>>({});
    const [showEditForm, setShowEditForm] = useState(false);
    const [editFormData, setEditFormData] = useState({
      type: 'DINE_IN' as OrderType,
      paymentMethod: EnumPaymentMethod.CASH,
      numberOfPeople: 1,
      tableNumber: '',
      comment: '',
      deliveryAddress: '',
      deliveryNotes: '',
      deliveryTime: '',
    });
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showExitConfirmDialog, setShowExitConfirmDialog] = useState(false);
    const [intendedPath, setIntendedPath] = useState<string | null>(null);
    const [showRefundDialog, setShowRefundDialog] = useState(false);
    const [selectedItemForRefund, setSelectedItemForRefund] = useState<OrderItem | null>(null);
    const [refundReason, setRefundReason] = useState('');
    const [logs, setLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [showPrecheckDialog, setShowPrecheckDialog] = useState(false);
    const [pendingAdditions, setPendingAdditions] = useState<Record<string, {
      quantity: number
      additives: string[]
      comment: string
      timer: NodeJS.Timeout | null
    }>>({});
    const [customerCode, setCustomerCode] = useState('');
    const [customerLoading, setCustomerLoading] = useState(false);
    const [pointsToUse, setPointsToUse] = useState(0);
    const [discounts, setDiscounts] = useState<DiscountResponseDto[]>([]);
    const [discountsLoading, setDiscountsLoading] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [promoCodeLoading, setPromoCodeLoading] = useState(false);
    const [promoCodeError, setPromoCodeError] = useState('');
    const [showDiscountOptions, setShowDiscountOptions] = useState(false);
    const [showPartialRefundDialog, setShowPartialRefundDialog] = useState(false);
    const [refundQuantity, setRefundQuantity] = useState(1);
    const [maxRefundQuantity, setMaxRefundQuantity] = useState(0);
    const [viewMode, setViewMode] = useState<'standard' | 'compact'>('standard');
    const [activeShiftId, setActiveShiftId] = useState('')
    const [shiftLoading, setShiftLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Product[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [categoryNavigation, setCategoryNavigation] = useState<CategoryNavigation>({
      currentCategory: null,
      parentCategory: null,
      breadcrumbs: []
    });

    // Новые состояния для модификаторов заказа
    const [orderAdditives, setOrderAdditives] = useState<OrderAdditiveItem[]>([]);
    const [availableOrderAdditives, setAvailableOrderAdditives] = useState<OrderAdditiveItem[]>([]);
    const [selectedOrderAdditive, setSelectedOrderAdditive] = useState<string>('');
    const [orderAdditivesLoading, setOrderAdditivesLoading] = useState(false);
    const [filterOrderAdditiveType, setFilterOrderAdditiveType] = useState<string>('all');
    const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(true);
    const [showOrderAdditives, setShowOrderAdditives] = useState(false);

    const [warehouse, setWarehouse] = useState<any>(null);
    const [restaurantData, setRestaurantData] = useState<any>(null);
    const [isWritingOff, setIsWritingOff] = useState(false);

    const {
      isConnected: isWebSocketConnected,
      connectionError: webSocketError
    } = useOrderWebSocket({
      restaurantId: order?.restaurant?.id,
      orderId: orderId as string,
      onOrderUpdated: (updatedOrder: OrderResponse) => {
        if (updatedOrder && updatedOrder.id === orderId) {
          const mergedOrder = mergeOrderStates(updatedOrder, orderRef.current);
          setOrder(mergedOrder);
        }
      },
      onOrderStatusUpdated: (updatedOrder: OrderResponse) => {
        if (updatedOrder && updatedOrder.id === orderId) {
          const mergedOrder = mergeOrderStates(updatedOrder, orderRef.current);
          setOrder(mergedOrder);
        }
      },
      onOrderItemUpdated: (updatedOrder: OrderResponse, itemId: string) => {
        if (updatedOrder && updatedOrder.id === orderId) {
          const mergedOrder = mergeOrderStates(updatedOrder, orderRef.current);
          setOrder(mergedOrder);
        }
      },
      onOrderModified: (updatedOrder: OrderResponse) => {
        const mergedOrder = mergeOrderStates(updatedOrder, orderRef.current);
        setOrder(mergedOrder);
      },
      onOrderDetailsUpdated: (updatedOrder: OrderResponse) => {
        const mergedOrder = mergeOrderStates(updatedOrder, orderRef.current);
        setOrder(mergedOrder);
      },
      onError: (error: any) => {
      },
      enabled: true
    });

    const isOrderEditable = order && !['DELIVERING', 'COMPLETED', 'CANCELLED', 'CONFIRMED'].includes(order.status);
    const orderRef = useRef<OrderResponse | null>(null);

    const mergeOrderStates = (serverOrder: OrderResponse, localOrder: OrderResponse | null): OrderResponse => {
      if (!localOrder) {
        return serverOrder;
      }

      // Глубокое слияние items с сохранением порядка и локальных данных
      const mergedItems = serverOrder.items?.map(serverItem => {
        const localItem = localOrder.items?.find(item => item.id === serverItem.id);
        return localItem ? { ...serverItem, ...localItem } : serverItem;
      }) || serverOrder.items || [];

      return {
        ...serverOrder,
        attentionFlags: {
          ...serverOrder.attentionFlags,
          ...localOrder.attentionFlags
        },
        items: mergedItems,
        ...(localOrder.customer && { customer: localOrder.customer }),
        ...(localOrder.discountAmount && { discountAmount: localOrder.discountAmount }),
      };
    };

    const searchInputRef = useRef<HTMLInputElement>(null);

    const focusSearchInput = useCallback(() => {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }, []);

    // Загрузка модификаторов заказа
    const fetchOrderAdditives = async () => {
      if (!order || !order.restaurant?.id) return;

      try {
        setOrderAdditivesLoading(true);

        // Получаем доступные модификаторы для сети ресторана
        let additives: OrderAdditiveWithRelations[] = [];

        if (order.restaurant.network?.id) {
          additives = await OrderAdditiveService.getByNetwork(order.restaurant.network.id);
        } else {
          additives = await OrderAdditiveService.getAll();
        }

        // Преобразуем в формат для компонента
        const formattedAdditives: OrderAdditiveItem[] = additives
          .filter(additive => {
            // Фильтрация по типу (если включена)
            const typeFilter = filterOrderAdditiveType === 'all' || additive.type === filterOrderAdditiveType;
            // Фильтрация по активности (если включена)
            const activeFilter = !filterActiveOnly || additive.isActive;
            return typeFilter && activeFilter;
          })
          .map(additive => ({
            id: additive.id || '',
            title: additive.title,
            price: additive.price,
            type: additive.type,
            isActive: additive.isActive || false,
            orderTypes: additive.orderTypes,
            networkId: additive.networkId || undefined,
            inventoryItem: additive.inventoryItem || null
          }));

        setAvailableOrderAdditives(formattedAdditives);

        // Загружаем текущие модификаторы заказа из данных заказа
        if (order.orderAdditives && order.orderAdditives.length > 0) {
          const currentAdditives: OrderAdditiveItem[] = order.orderAdditives
            .filter((item: any) => item.orderAdditive && item.orderAdditive.id)
            .map((item: any) => ({
              id: item.orderAdditive.id,
              title: item.orderAdditive.title,
              price: item.price || item.orderAdditive.price || 0,
              type: item.orderAdditive.type || OrderAdditiveType.FIXED,
              isActive: true,
              orderTypes: item.orderAdditive.orderTypes || [],
              quantity: item.quantity || 1,
              networkId: item.orderAdditive.networkId,
              inventoryItem: item.orderAdditive.inventoryItem || null
            }));

          setOrderAdditives(currentAdditives);
        } else {
          setOrderAdditives([]);
        }

      } catch (error) {
        console.error('Failed to fetch order additives:', error);
        toast.error(t.orderAdditiveError);
      } finally {
        setOrderAdditivesLoading(false);
      }
    };

    const loadWarehouseData = async () => {
      if (!order?.restaurant?.id) return;

      try {
        const warehouseData = await WarehouseService.getRestaurantWarehouse(order.restaurant.id);
        setWarehouse(warehouseData);
      } catch (error) {
        console.error('Failed to load warehouse data:', error);
      }
    };

    const loadRestaurantData = async () => {
      if (!order?.restaurant?.id) return;

      try {
        const restaurant = await RestaurantService.getById(order.restaurant.id);
        setRestaurantData(restaurant);
      } catch (error) {
        console.error('Failed to load restaurant data:', error);
      }
    };

    // Добавление модификатора к заказу
    const handleAddOrderAdditive = async () => {
      if (!selectedOrderAdditive || !order || !isOrderEditable) return;

      try {
        setIsUpdating(true);

        const additiveToAdd = availableOrderAdditives.find(a => a.id === selectedOrderAdditive);
        if (!additiveToAdd) return;

        // Добавляем модификатор к заказу
        await OrderAdditiveService.addToOrder(selectedOrderAdditive, order.id, Number(1));

        // Обновляем список модификаторов
        const updatedAdditive: OrderAdditiveItem = {
          ...additiveToAdd,
          quantity: 1
        };

        setOrderAdditives(prev => [...prev, updatedAdditive]);
        setSelectedOrderAdditive('');

        // Обновляем общую информацию о заказе
        await fetchOrder();

        toast.success(t.orderAdditiveAdded);

        // Создаем лог
        await createOrderLog(`Добавлен модификатор: ${additiveToAdd.title}`);

      } catch (error) {
        console.error('Failed to add order additive:', error);
        toast.error(t.orderAdditiveError);
      } finally {
        setIsUpdating(false);
      }
    };

    // Удаление модификатора из заказа
    const handleRemoveOrderAdditive = async (additiveId: string) => {
      if (!order || !isOrderEditable) return;

      try {
        setIsUpdating(true);

        const additiveToRemove = orderAdditives.find(a => a.id === additiveId);
        if (!additiveToRemove) return;

        // Удаляем модификатор из заказа
        await OrderAdditiveService.removeFromOrder(additiveId, order.id);

        // Обновляем список
        setOrderAdditives(prev => prev.filter(a => a.id !== additiveId));

        // Обновляем общую информацию о заказе
        await fetchOrder();

        toast.success(t.orderAdditiveRemoved);

        // Создаем лог
        await createOrderLog(`Удален модификатор: ${additiveToRemove.title}`);

      } catch (error) {
        console.error('Failed to remove order additive:', error);
        toast.error(t.orderAdditiveError);
      } finally {
        setIsUpdating(false);
      }
    };

    // Обновление количества модификатора
    const handleUpdateOrderAdditiveQuantity = async (additiveId: string, newQuantity: number) => {
      if (!order || !isOrderEditable || newQuantity < 1) return;

      try {
        setIsUpdating(true);

        const additive = orderAdditives.find(a => a.id === additiveId);
        if (!additive) return;

        // Сначала удаляем старый
        await OrderAdditiveService.removeFromOrder(additiveId, order.id);

        // Добавляем с новым количеством
        if (newQuantity > 0) {
          await OrderAdditiveService.addToOrder(additiveId, order.id, newQuantity);

          // Обновляем в состоянии
          setOrderAdditives(prev => prev.map(a =>
            a.id === additiveId ? { ...a, quantity: newQuantity } : a
          ));
        } else {
          // Если количество 0, удаляем
          setOrderAdditives(prev => prev.filter(a => a.id !== additiveId));
        }

        // Обновляем общую информацию о заказу
        await fetchOrder();

      } catch (error) {
        console.error('Failed to update additive quantity:', error);
        toast.error(t.orderAdditiveError);
      } finally {
        setIsUpdating(false);
      }
    };

    // Расчет стоимости модификатора
    const calculateAdditivePrice = (additive: OrderAdditiveItem): number => {
      if (!order) return additive.price;

      switch (additive.type) {
        case OrderAdditiveType.FIXED:
          return additive.price * (additive.quantity || 1);

        case OrderAdditiveType.PER_PERSON:
          const numberOfPeople = parseInt(order.numberOfPeople || '1');
          return additive.price * numberOfPeople * (additive.quantity || 1);

        default:
          return additive.price * (additive.quantity || 1);
      }
    };

    // Общая стоимость всех модификаторов
    const calculateTotalOrderAdditivesPrice = (): number => {
      return orderAdditives.reduce((total, additive) => {
        return total + calculateAdditivePrice(additive);
      }, 0);
    };

    // Фильтрация доступных модификаторов
    const filteredAvailableOrderAdditives = availableOrderAdditives.filter(additive => {
      // Исключаем уже добавленные
      const isAlreadyAdded = orderAdditives.some(a => a.id === additive.id);
      return !isAlreadyAdded;
    });

    const checkAndCreateShift = async (restaurantId: string): Promise<string | null> => {
      try {
        setShiftLoading(true);
        const activeShift = await ShiftService.getActiveShiftsByRestaurant(restaurantId);

        let shiftId: string;

        if (!activeShift) {
          const newShift = await ShiftService.createShift({
            restaurantId: restaurantId,
            status: 'STARTED',
            startTime: new Date(),
          });
          shiftId = newShift.id;
          setActiveShiftId(newShift.id);
        } else {
          shiftId = activeShift.id;
          setActiveShiftId(activeShift.id);
        }

        return shiftId;
      } catch (error) {
        console.error('Shift check error:', error);
        return null;
      } finally {
        setShiftLoading(false);
      }
    };

    const assignOrderToShift = async (orderId: string, shiftId: string) => {
      try {
        await OrderService.assignOrderToShift(orderId, shiftId);
        console.log('Order assigned to shift:', shiftId);
      } catch (error) {
        console.error('Failed to assign order to shift:', error);
      }
    };

    // Функции для работы с категориями
    const handleCategoryClick = (category: Category) => {
      const subcategories = categories.filter(cat =>
        cat.parentId === category.id &&
        hasProductsInCategory(cat.id) // Проверяем, есть ли товары в категории
      );

      if (subcategories.length > 0) {
        // Если есть подкатегории с товарами, переходим к ним
        setCategoryNavigation(prev => ({
          currentCategory: null,
          parentCategory: category,
          breadcrumbs: [...prev.breadcrumbs, category]
        }));
      } else {
        // Если нет подкатегорий, показываем товары этой категории
        setCategoryNavigation(prev => ({
          currentCategory: category,
          parentCategory: prev.parentCategory,
          breadcrumbs: prev.breadcrumbs
        }));
      }
    };

    // Функция проверки наличия товаров в категории (включая подкатегории)
    const hasProductsInCategory = (categoryId: string): boolean => {
      // Проверяем товары непосредственно в категории
      const directProducts = products.filter(product => product.categoryId === categoryId);
      if (directProducts.length > 0) return true;

      // Проверяем подкатегории
      const subcategories = categories.filter(cat => cat.parentId === categoryId);

      // Рекурсивно проверяем каждую подкатегорию
      for (const subcategory of subcategories) {
        if (hasProductsInCategory(subcategory.id)) {
          return true;
        }
      }

      return false;
    };

    // Получаем категории для отображения (только те, в которых есть товары)
    const getDisplayCategories = () => {
      
      let categoriesToDisplay: Category[] = [];

      if (categoryNavigation.parentCategory) {
        // Показываем подкатегории выбранной категории, в которых есть товары
        categoriesToDisplay = categories.filter(cat =>
          cat.parentId === categoryNavigation.parentCategory?.id &&
          hasProductsInCategory(cat.id)
        );
      } else {
        // Показываем корневые категории, в которых есть товары
        categoriesToDisplay = categories.filter(cat =>
          !cat.parentId &&
          hasProductsInCategory(cat.id)
        );
      }
      
      return categoriesToDisplay;
    };

    // Получаем товары для отображения
    const getDisplayProducts = () => {
      if (categoryNavigation.currentCategory) {
        // Показываем товары выбранной категории
        return products.filter(product => product.categoryId === categoryNavigation.currentCategory?.id);
      } else if (categoryNavigation.parentCategory) {
        // Показываем все товары из всех подкатегорий родительской категории
        const getAllSubcategoryIds = (categoryId: string): string[] => {
          const subcategoryIds = categories
            .filter(cat => cat.parentId === categoryId)
            .map(cat => cat.id);

          let allIds = [categoryId]; // Включаем саму категорию

          // Рекурсивно получаем IDs всех вложенных подкатегорий
          for (const subId of subcategoryIds) {
            allIds = [...allIds, ...getAllSubcategoryIds(subId)];
          }

          return allIds;
        };

        const allCategoryIds = getAllSubcategoryIds(categoryNavigation.parentCategory.id);
        return products.filter(product => allCategoryIds.includes(product.categoryId));
      } else {
        // Показываем все товары
        return products;
      }
    };

    const handleBackToCategories = () => {
      if (categoryNavigation.breadcrumbs.length > 0) {
        // Возвращаемся на уровень выше
        const newBreadcrumbs = [...categoryNavigation.breadcrumbs];
        const parentCategory = newBreadcrumbs.pop();

        setCategoryNavigation({
          currentCategory: null,
          parentCategory: newBreadcrumbs.length > 0 ? newBreadcrumbs[newBreadcrumbs.length - 1] : null,
          breadcrumbs: newBreadcrumbs
        });
      } else {
        // Возвращаемся к корневым категориям
        setCategoryNavigation({
          currentCategory: null,
          parentCategory: null,
          breadcrumbs: []
        });
      }
    };

    const handleBackToRoot = () => {
      setCategoryNavigation({
        currentCategory: null,
        parentCategory: null,
        breadcrumbs: []
      });
    };

    const fetchDiscounts = async () => {
      if (!order?.restaurant?.id) return;

      try {
        setDiscountsLoading(true);
        const data = await DiscountService.getByRestaurant(order.restaurant.id);
        setDiscounts(data);
      } catch (error) {
        console.error('Failed to fetch discounts:', error);
        toast.error('Ошибка загрузки скидок');
      } finally {
        setDiscountsLoading(false);
      }
    };

    useEffect(() => {
      if (order?.restaurant?.id) {
        fetchDiscounts();
        fetchOrderAdditives();

        loadRestaurantData();
        loadWarehouseData();
      }
    }, [order?.restaurant?.id, filterOrderAdditiveType, filterActiveOnly]);

    const recalculateDiscount = async () => {
      if (!orderId || !order?.customer) return;

      try {
        const updatedOrder = await OrderService.applyCustomerDiscount(orderId as string);
        setOrder(updatedOrder);
      } catch (error) {
        console.error('Ошибка при пересчете скидки:', error);
      }
    };

    const writeOffOrderAdditives = async (orderAdditives: OrderAdditiveItem[]) => {
      if (!warehouse?.id || !order || !user) return;

      try {
        setIsWritingOff(true);

        const writeOffPromises: Promise<any>[] = [];

        // Проходим по всем модификаторам заказа
        for (const additive of orderAdditives) {
          if (additive.inventoryItem && additive.quantity) {
            // Рассчитываем количество для списания
            let quantityToWriteOff = additive.quantity;

            // Для модификаторов PER_PERSON умножаем на количество персон
            if (additive.type === OrderAdditiveType.PER_PERSON) {
              const numberOfPeople = parseInt(order.numberOfPeople || '1');
              quantityToWriteOff = additive.quantity * numberOfPeople;
            }

            // Создаем транзакцию списания
            writeOffPromises.push(
              WarehouseService.createTransaction({
                inventoryItemId: additive.inventoryItem.id,
                type: InventoryTransactionType.WRITE_OFF,
                warehouseId: warehouse.id,
                quantity: quantityToWriteOff,
                reason: `Модификатор заказа: ${additive.title} (заказ №${order.number})`,
                userId: user.id
              })
            );
          }
        }

        // Выполняем все списания
        if (writeOffPromises.length > 0) {
          await Promise.all(writeOffPromises);
          toast.success('Инвентарные товары модификаторов списаны');
        }

      } catch (error) {
        console.error('Error writing off order additives:', error);
        toast.error('Ошибка списания инвентарных товаров модификаторов');
        throw error; // Пробрасываем ошибку дальше
      } finally {
        setIsWritingOff(false);
      }
    };

    const createOrderLog = async (action: string) => {
      if (!orderId || !user) return;

      try {
        await OrderService.createLog({
          orderId: orderId as string,
          action,
          userId: user.id,
        });

        fetchOrderLogs();
      } catch (err) {
        console.error('Ошибка при создании лога:', err);
      }
    };

    const fetchOrderLogs = async () => {
      if (!orderId) return;

      try {
        setLogsLoading(true);
        const logsData = await OrderService.getOrderLogs(orderId as string);
        setLogs(logsData);
      } catch (err) {
        console.error('Ошибка при получении логов:', err);
      } finally {
        setLogsLoading(false);
      }
    };

    useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (order?.status === 'CREATED') {
          e.preventDefault();
          e.returnValue = t.exitConfirmMessage;
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        Object.values(pendingAdditions).forEach(({ timer }) => {
          if (timer) clearTimeout(timer)
        })
      };
    }, [order?.status, t.exitConfirmMessage, pendingAdditions]);

    const handleUpdateQuantity = async (item: OrderItem, newQuantity: number) => {
      if (!order || !isOrderEditable) return;

      try {
        setIsUpdating(true);
        const updatedOrder = await OrderService.updateOrderItemQuantity(
          order.id,
          item.id,
          newQuantity
        );
        setOrder(updatedOrder);

        await createOrderLog(
          `Изменено количество: ${item.product.title} → ${newQuantity}`
        );

        toast.success('Количество обновлено');
      } catch (error) {
        toast.error('Ошибка обновления');
      } finally {
        setIsUpdating(false);
      }
    };

    const handlePartialRefund = async () => {
      if (!order || !selectedItemForRefund || !refundReason.trim() || refundQuantity <= 0) return;

      try {
        setIsUpdating(true);
        const updatedOrder = await OrderService.partialRefundOrderItem(
          order.id,
          selectedItemForRefund.id,
          refundQuantity,
          refundReason,
          user?.id
        );
        setOrder(updatedOrder);

        await recalculateDiscount();
        await createOrderLog(
          `${t.logs.itemRefunded}: ${selectedItemForRefund.product.title} x ${refundQuantity}`
        );

        toast.success(
          `Возвращено ${refundQuantity} шт.`
        );

        setShowPartialRefundDialog(false);
        setRefundReason('');
        setRefundQuantity(1);
      } catch (error) {
        toast.error(
          'Ошибка при возврате'
        );
      } finally {
        setIsUpdating(false);
      }
    };

    const handleQuantitItemChange = async (item: OrderItem, newQuantity: number) => {
      if (!order || newQuantity < 0 || !isOrderEditable) return;

      // Явная проверка что можно редактировать только CREATED items
      if (item.status !== OrderItemStatus.CREATED) {
        toast.error('Можно изменять только неподтвержденные позиции');
        return;
      }

      try {
        setIsUpdating(true);

        if (newQuantity === 0) {
          await OrderService.removeItemFromOrder(order.id, item.id);
          await createOrderLog(`${t.logs.itemRemoved}: ${item.product.title}`);
        } else {
          await OrderService.updateOrderItemQuantity(
            order.id,
            item.id,
            newQuantity,
            user?.id
          );
          await createOrderLog(
            `Изменено количество: ${item.product.title} → ${newQuantity}`
          );
        }

        const updatedOrder = await OrderService.getById(order.id);
        setOrder(updatedOrder);

      } catch (error) {
        toast.error(
          'Ошибка изменения количества'
        );
      } finally {
        setIsUpdating(false);
      }
    };

    const handleRouteChange = (path: string) => {
      if (order?.status === 'CREATED') {
        setIntendedPath(path);
        setShowExitConfirmDialog(true);
      } else {
        router.push(path);
      }
    };

    const confirmExit = () => {
      setShowExitConfirmDialog(false);
      if (intendedPath) {
        router.push(intendedPath);
      }
    };

    const cancelExit = () => {
      setShowExitConfirmDialog(false);
      setIntendedPath(null);
    };

    const handleConfirmOrder = async () => {
      if (!order) return;

      try {
        setIsUpdating(true);

        const targetStatus = order.scheduledAt ? 'CONFIRMED' : 'PREPARING';

        const updatedOrder = await OrderService.updateStatus(order.id, { status: targetStatus });

        const createdItems = getOrderItems().filter(item => item.status === OrderItemStatus.CREATED);

        if (!order.scheduledAt) {
          await Promise.all(
            createdItems.map(item =>
              OrderService.updateItemStatus(order.id, item.id, { status: OrderItemStatus.IN_PROGRESS })
            )

          );
        }
        const refreshedOrder = await OrderService.getById(order.id);
        setOrder(refreshedOrder);

        await createOrderLog(
          !order.scheduledAt
            ? `Заказ рассчитан`
            : t.logs.orderConfirmed
        );

      } catch (error) {
        toast.error(
          !order.scheduledAt
            ? 'Ошибка расчета заказа'
            : 'Ошибка подтверждения заказа'
        );
      } finally {
        setIsUpdating(false);
      }
    };

    const getCookingTimeText = (minutes: number) => {
      const lastDigit = minutes % 10;
      const lastTwoDigits = minutes % 100;

      if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return `${minutes} ${t.minutesForm5}`;
      }

      if (lastDigit === 1) {
        return `${minutes} ${t.minutesForm1}`;
      }

      if (lastDigit >= 2 && lastDigit <= 4) {
        return `${minutes} ${t.minutesForm2}`;
      }

      return `${minutes} ${t.minutesForm5}`;
    };

    const handleCompleteOrder = () => {
      if (!order) return;

      if (order && order.payment && order.payment.status !== 'PAID' && calculateOrderTotal() > 0) {
        setShowPaymentDialog(true);
        return;
      }
      setShowCompleteDialog(true);
    };

    const confirmCompleteOrder = async () => {
      if (!order) return;
      if (!order.attentionFlags.isPrecheck) return;

      try {
        setIsUpdating(true);

        let currentShiftId = activeShiftId;
        if (!currentShiftId) {
          const shiftId = await checkAndCreateShift(order.restaurant.id);
          if (!shiftId) {
            toast.error('Нет активной смены');
            return;
          }
          currentShiftId = shiftId;
        }

        // Привязываем заказ к смене
        if (currentShiftId) {
          await assignOrderToShift(order.id, currentShiftId);
        }

        // Если ресторан использует склад и есть модификаторы с инвентарными товарами
        if (restaurantData?.useWarehouse && orderAdditives.length > 0) {
          // Фильтруем модификаторы с инвентарными товарами
          const additivesWithInventory = orderAdditives.filter(
            additive => additive.inventoryItem && additive.quantity && additive.quantity > 0
          );

          if (additivesWithInventory.length > 0) {
            await writeOffOrderAdditives(additivesWithInventory);
          }
        }

        const updatedOrder = await OrderService.updateStatus(order.id, { status: 'COMPLETED' });
        setOrder(updatedOrder);

        await createOrderLog(t.logs.orderCompleted);

        toast.success('Заказ завершен');
        setShowCompleteDialog(false);
        setShowPaymentDialog(false);
      } catch (error) {
        console.error('Error completing order:', error);
        toast.error('Ошибка завершения заказа');
      } finally {
        setIsUpdating(false);
      }
    };

    const handleCalculateOrder = async () => {
      if (!order) return;

      try {
        setIsUpdating(true);

        let currentShiftId = activeShiftId;

        if (!currentShiftId) {
          const shiftId = await checkAndCreateShift(order.restaurant.id);
          if (!shiftId) {
            toast.error('Нет активной смены');
            setIsUpdating(false);
            return;
          }
          currentShiftId = shiftId;
        }

        // Убеждаемся, что заказ привязан к смене
        if (currentShiftId) {
          await assignOrderToShift(order.id, currentShiftId);
        }

        // Проверяем оплату
        if (order && order.payment && order.payment.status !== 'PAID' && calculateOrderTotal() > 0) {
          setShowPaymentDialog(true);
          setIsUpdating(false);
          return;
        }

        // Вызываем завершение заказа (расчет)
        setShowCompleteDialog(true);
      } catch (error) {
        console.error('Error during calculate order:', error);
        toast.error('Ошибка расчета заказа');
      } finally {
        setIsUpdating(false);
      }
    };

    // Обновите useEffect для проверки смены
    useEffect(() => {
      if (order?.restaurant?.id && order?.id) {
        checkAndCreateShift(order.restaurant.id);
      }
    }, [order?.restaurant?.id, order?.id]);

    const handleCancelOrder = () => {
      setShowCancelDialog(true);

    };

    const confirmCancelOrder = async () => {
      if (!order) return;
      try {
        setIsUpdating(true);
        const updatedOrder = await OrderService.updateStatus(order.id, { status: 'CANCELLED' });
        setOrder(updatedOrder);

        await createOrderLog(t.logs.orderCancelled);

        toast.success('Заказ отменен');
        setShowCancelDialog(false);
        router.push('/orders')
      } catch (error) {
        toast.error('Ошибка отмены заказа');
      } finally {
        setIsUpdating(false);
      }
    };

    const handleRefundItem = async () => {
      if (!order) return;
      if (!selectedItemForRefund || !refundReason.trim()) return;

      try {
        setIsUpdating(true);
        const updatedOrder = await OrderService.refundItem(
          order.id,
          selectedItemForRefund.id,
          {
            reason: refundReason,
            userId: user?.id
          }
        );
        setOrder(updatedOrder);

        await recalculateDiscount();

        await createOrderLog(`${t.logs.itemRefunded} : ${selectedItemForRefund.product.title} x ${selectedItemForRefund.quantity}`);

        toast.success('Блюдо возвращено');
        setShowRefundDialog(false);
        setRefundReason('');
      } catch (error) {
        toast.error('Ошибка при возврате блюда');
      } finally {
        setIsUpdating(false);
      }
    };

    const handleEditOrderSubmit = async () => {
      if (!orderId || !isOrderEditable) return;

      try {
        setIsUpdating(true);

        await OrderService.updateOrder(orderId as string, {
          type: editFormData.type,
          payment: {
            method: editFormData.paymentMethod,
          },
          numberOfPeople: editFormData.numberOfPeople,
          tableNumber: editFormData.tableNumber,
          comment: editFormData.comment,
          deliveryAddress: editFormData.deliveryAddress,
          deliveryNotes: editFormData.deliveryNotes,
          deliveryTime: editFormData.deliveryTime,
        });

        await fetchOrder();

        await createOrderLog(t.logs.orderEdited);

        toast.success('Заказ обновлен');
        setShowEditForm(false);
      } catch (err) {
        toast.error('Ошибка обновления заказа');
        console.error('Ошибка при обновлении заказа:', err);
      } finally {
        setIsUpdating(false);
      }
    };

    const handleApplyPromoCode = async () => {
      if (!orderId || !promoCode.trim()) return;

      try {
        setPromoCodeLoading(true);
        setPromoCodeError('');

        const discount = await DiscountService.getByPromoCode(promoCode);

        // Проверка минимальной суммы заказа
        if (discount.minOrderAmount && calculateOrderTotal() < discount.minOrderAmount) {
          setPromoCodeError(t.discountMinAmount.replace('{amount}', discount.minOrderAmount.toString()));
          return;
        }

        // ПРОВЕРКА МАКСИМАЛЬНОЙ СУММЫ ЗАКАЗА
        if (discount.maxOrderAmount && calculateOrderTotal() > discount.maxOrderAmount) {
          setPromoCodeError(t.maxOrderAmount.replace('{amount}', discount.maxOrderAmount.toString()));
          return;
        }

        const updatedOrder = await OrderService.applyDiscountToOrder(
          orderId as string,
          discount.id
        );

        setOrder(updatedOrder);
        setPromoCode('');
        await createOrderLog(`${t.logs.discountApplied}: ${discount.title}`);

        toast.success(t.discountApplied);
      } catch (error) {
        console.error('Failed to apply promo code:', error);
        setPromoCodeError(t.discountNotFound);
      } finally {
        setPromoCodeLoading(false);
      }
    };

    const handleRemoveDiscount = async () => {
      if (!orderId) return;

      try {
        setIsUpdating(true);
        const updatedOrder = await OrderService.removeDiscountFromOrder(orderId as string);
        setOrder(updatedOrder);
        await createOrderLog(t.discountRemoved);

        toast.success(t.discountRemoved);
      } catch (error) {
        console.error('Failed to remove discount:', error);
        toast.error(t.discountError);
      } finally {
        setIsUpdating(false);
      }
    };

    const calculateItemPrice = (item: OrderItem) => {
      if (item.isRefund) return 0;

      const restaurantPrice = item.product.restaurantPrices?.find(
        p => p.restaurantId === order?.restaurant?.id
      );
      let basePrice = restaurantPrice?.price ?? item.product.price;

      if (order?.customer?.discountApplied) {
        basePrice = basePrice * (1 - order.customer.personalDiscount / 100);
      }

      const additivesPrice = item.additives.reduce((sum, a) => sum + a.price, 0);

      return (basePrice + additivesPrice) * item.quantity;
    };

    const getProductPrice = (product: Product) => {
      const restaurantPrice = product.restaurantPrices?.find(
        p => p.restaurantId === order?.restaurant?.id
      );
      let price = restaurantPrice?.price ?? product.price;

      if (order?.customer?.discountApplied) {
        price = price * (1 - order.customer.personalDiscount / 100);
      }

      return price;
    };

    const getOrderItems = () => {
      return order?.items || [];
    };

    const getOriginalItems = () => {
      return getOrderItems().filter(item => !item.isRefund);
    };

    const getRefundedItems = () => {
      return getOrderItems().filter(item => item.isRefund);
    };

    const getCreatedItemsCount = () => {
      return getOrderItems().filter(item => item.status === OrderItemStatus.CREATED).length;
    };

    const hasRefundedItems = () => {
      return getOrderItems().some(item => item.isRefund);
    };

    const hasCreatedItems = () => {
      return getOrderItems().some(item => item.status === OrderItemStatus.CREATED);
    };

    const calculateOrderTotal = () => {
      if (!order || !getOrderItems()) return 0;
      const items = getOrderItems();
      const itemsTotal = items.reduce((sum, item) => {
        return sum + calculateItemPrice(item);
      }, 0);

      // Исправление: проверка на существование surcharges
      const surchargesTotal = (order.surcharges || []).reduce((sum, surcharge) => {
        if (surcharge.type === 'FIXED') {
          return sum + surcharge.amount;
        } else {
          return sum + (itemsTotal * surcharge.amount) / 100;
        }
      }, 0) || 0;

      // Добавляем стоимость модификаторов заказа
      const orderAdditivesTotal = calculateTotalOrderAdditivesPrice();

      let total = itemsTotal + surchargesTotal + orderAdditivesTotal;

      if (order.discountAmount && order.discountAmount > 0) {
        total = Math.max(0, total - order.discountAmount);
      }

      if (order.bonusPointsUsed && order.bonusPointsUsed > 0) {
        total = Math.max(0, total - order.bonusPointsUsed);
      }

      return total;
    };

    const handleReorderItem = async (item: OrderItem) => {
      if (!order) return;

      try {
        setIsUpdating(true);

        const updatedOrder = await OrderService.addItemToOrder(
          order.id,
          {
            productId: item.product.id,
            quantity: item.quantity,
            additiveIds: item.additives.map(a => a.id),
            comment: item.comment
          }
        );

        setOrder(updatedOrder);

        await OrderService.setReorderedFlag(order.id, true);

        await createOrderLog(`${t.logs.itemAdded}: ${item.product.title} x ${item.quantity} (${t.reorder})`);

        toast.success('Дозаказ добавлен');
      } catch (error) {
        toast.error('Ошибка при дозаказе');
      } finally {
        setIsUpdating(false);
      }
    };

    const handleQuantityChange = useCallback(async (product: Product, newQuantity: number, additives: string[], comment: string) => {
      if (!orderId || !isOrderEditable || !order || !getOrderItems()) return;

      const key = `${product.id}-${JSON.stringify(additives.sort())}-${comment || ''}`;

      if (pendingAdditions[key]?.timer) {
        clearTimeout(pendingAdditions[key].timer!);
      }

      if (newQuantity === 0) {
        setPendingAdditions(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
        return;
      }

      const timer = setTimeout(async () => {
        try {
          setIsUpdating(true);

          const existingItem = getOrderItems().find(item =>
            item.product.id === product.id &&
            JSON.stringify(item.additives.map(a => a.id).sort()) === JSON.stringify(additives.sort()) &&
            item.comment === comment &&
            item.status === OrderItemStatus.CREATED
          );

          if (existingItem) {
            await OrderService.updateOrderItemQuantity(
              orderId as string,
              existingItem.id,
              newQuantity
            );
          } else {
            await OrderService.addItemToOrder(
              orderId as string,
              {
                productId: product.id,
                quantity: newQuantity,
                additiveIds: additives,
                comment,
              }
            );
          }

          const updatedOrder = await OrderService.getById(orderId as string);
          const orderWithPreservedFlags = {
            ...updatedOrder,
            attentionFlags: updatedOrder.attentionFlags || {} // Добавьте fallback
          };

          setOrder(orderWithPreservedFlags);

          await applyAutoDiscounts(orderWithPreservedFlags);

          await createOrderLog(
            existingItem
              ? `Обновлено количество: ${product.title} → ${newQuantity}`
              : `${t.logs.itemAdded}: ${product.title} x ${newQuantity}`
          );

          setPendingAdditions(prev => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
          });
        } catch (err) {
          toast.error('Ошибка при обновлении заказа');
          console.error('Error:', err);
        } finally {
          setIsUpdating(false);
        }
      }, 1000);

      setPendingAdditions(prev => ({
        ...prev,
        [key]: {
          quantity: newQuantity,
          additives,
          comment,
          timer,
        },
      }));
    }, [orderId, isOrderEditable, order]);

    const getDisplayQuantity = (product: Product, additives: string[], comment: string) => {
      const key = `${product.id}-${JSON.stringify(additives.sort())}-${comment || ''}`

      // Сначала проверяем pending additions
      if (pendingAdditions[key]) {
        return pendingAdditions[key].quantity
      }

      // Затем проверяем существующие items только со статусом CREATED
      const existingItem = order?.items?.find(item =>
        item.product.id === product.id &&
        JSON.stringify(item.additives.map(a => a.id).sort()) === JSON.stringify(additives.sort()) &&
        item.comment === comment &&
        item.status === OrderItemStatus.CREATED
      );

      return existingItem ? existingItem.quantity : 0;
    }

    const handleAdditivesChange = (productId: string, newAdditives: string[]) => {
      setProductAdditives(prev => ({
        ...prev,
        [productId]: newAdditives
      }))
    }

    const handleCommentChange = (productId: string, newComment: string) => {
      setProductComments(prev => ({
        ...prev,
        [productId]: newComment
      }))
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await OrderService.getById(orderId as string);

        setOrder(data);

        setEditFormData(prev => ({
          ...prev,
          type: data.type || 'DINE_IN',
          paymentMethod: data.payment?.method || EnumPaymentMethod.CASH,
          numberOfPeople: Number(data.numberOfPeople) || 1,
          tableNumber: data.tableNumber || '',
          comment: data.comment || '',
          deliveryAddress: data.deliveryAddress || '',
          deliveryNotes: data.deliveryNotes || '',
          deliveryTime: data.deliveryTime || '',
        }));

        if (data.restaurant?.id) {
          const [products, categories] = await Promise.all([
            ProductService.getByRestaurant(data.restaurant.id),
            CategoryService.getAll()
          ]);
          setProducts(products);
          setCategories(categories as any);

          const additives: Record<string, string[]> = {};
          const comments: Record<string, string> = {};

          products.forEach((product: Product) => {
            additives[product.id] = [];
            comments[product.id] = '';
          });

          setProductAdditives(additives);
          setProductComments(comments);
        }

        await fetchOrderLogs();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        toast.error(t.loadingError);
      } finally {
        setLoading(false);
      }
    };

    const handlePrecheck = async () => {
      if (!order) return;

      try {
        setIsUpdating(true);
        await OrderService.setPrecheckFlag(order.id, true);
        await fetchOrder();
        setShowPrecheckDialog(true);
        await createOrderLog(t.logs.precheckPrinted);
      } catch (error) {
        toast.error('Ошибка при формировании пречека');
      } finally {
        setIsUpdating(false);
      }
    };

    const applyAutoDiscounts = async (currentOrder: OrderResponse) => {
      if (!currentOrder || !orderId) return;

      try {
        if (currentOrder.customer) {
          await OrderService.applyCustomerDiscount(orderId as string);
        }

        const activeDiscounts = await DiscountService.getByRestaurant(currentOrder.restaurant.id);
        const orderTotal = calculateOrderTotal();

        const applicableDiscounts = activeDiscounts.filter(discount => {
          const now = new Date();
          const isActive = !discount.endDate || new Date(discount.endDate) > now;
          const meetsMinAmount = !discount.minOrderAmount || orderTotal >= discount.minOrderAmount;
          const meetsMaxAmount = !discount.maxOrderAmount || orderTotal <= discount.maxOrderAmount; // Добавлено

          return isActive && meetsMinAmount && meetsMaxAmount; // Обновлено
        });

        if (applicableDiscounts.length > 0) {
          await OrderService.applyDiscountToOrder(
            orderId as string,
            applicableDiscounts[0].id
          );
        }

        const updatedOrder = await OrderService.getById(orderId as string);
        setOrder(updatedOrder);
      } catch (error) {
        console.error('Ошибка при автоматическом применении скидок:', error);
      }
    };

    const handleApplyCustomer = async () => {
      if (!orderId || !customerCode) return;

      try {
        setCustomerLoading(true);
        const customer = await CustomerService.getByShortCode(customerCode);

        await OrderService.applyCustomerToOrder(
          orderId as string,
          customer.id
        );

        const updatedOrder = await OrderService.getById(orderId as string);
        setOrder(updatedOrder);

        await applyAutoDiscounts(updatedOrder);

        setCustomerCode('');
        toast.success(t.customerApplied);

      } catch (error) {
        toast.error(t.customerNotFound);
      } finally {
        setCustomerLoading(false);
      }
    };

    const handleRemoveCustomer = async () => {
      if (!orderId || !order?.customer) return;

      try {
        setIsUpdating(true);
        const updatedOrder = await OrderService.removeCustomerFromOrder(orderId as string);
        setOrder(updatedOrder);
        setPointsToUse(0);
        await createOrderLog(t.logs.customerRemoved);

        toast.success('Клиент удален из заказа');
      } catch (error) {
        toast.error('Ошибка при удалении клиента');
      } finally {
        setIsUpdating(false);
      }
    };

    const handleApplyDiscount = async () => {
      try {
        setIsUpdating(true);
        const updatedOrder = await OrderService.applyCustomerDiscount(orderId as string);
        setOrder(updatedOrder);
        await createOrderLog(t.logs.discountApplied);
        toast.success(t.discountApplied);
      } catch (error) {
        toast.error('Ошибка при применении скидки');
      } finally {
        setIsUpdating(false);
      }
    };

    const handleApplyPoints = async () => {
      if (!orderId || !order?.customer || pointsToUse <= 0) return;

      try {
        setIsUpdating(true);
        const updatedOrder = await OrderService.applyCustomerPoints(
          orderId as string,
          pointsToUse
        );
        setOrder(updatedOrder);

        await applyAutoDiscounts(updatedOrder);

        await createOrderLog(`${t.logs.pointsApplied}: ${pointsToUse}`);
        toast.success(t.pointsApplied);
      } catch (error) {
        toast.error('Ошибка при применении баллов');
      } finally {
        setIsUpdating(false);
      }
    };

    const handleRemovePoints = async () => {
      if (!orderId || !order?.customer) return;

      try {
        setIsUpdating(true);
        const updatedOrder = await OrderService.removeCustomerPoints(orderId as string);
        setOrder(updatedOrder);
        setPointsToUse(0);
        await createOrderLog(t.logs.pointsRemoved);

        toast.success('Баллы сброшены');
      } catch (error) {
        toast.error('Ошибка при сбросе баллов');
      } finally {
        setIsUpdating(false);
      }
    };

    useEffect(() => {
      if (searchQuery && !isSearching) {
        focusSearchInput();
      }
    }, [searchQuery, isSearching]);

    useEffect(() => {
      if (showMenu) {
        const timer = setTimeout(() => {
          focusSearchInput();
        }, 400);
        return () => clearTimeout(timer);
      }
    }, [showMenu]);

    useEffect(() => {
      if (!orderId) {
        setError('Order ID is missing');
        setLoading(false);
        return;
      }

      fetchOrder();
    }, [orderId]);

    const getStatusBadge = (status: OrderItemStatus) => {
      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
      let text = '';

      switch (status) {
        case OrderItemStatus.CREATED:
          variant = 'secondary';
          text = t.statusCreated;
          break;
        case OrderItemStatus.CONFIRMED:
          variant = 'default';
          text = 'Подтвержден';
          break;
        case OrderItemStatus.IN_PROGRESS:
          variant = 'default';
          text = t.statusPreparing;
          break;
        case OrderItemStatus.COMPLETED:
          variant = 'default';
          text = t.statusReady;
          break;
        case OrderItemStatus.REFUNDED:
          variant = 'destructive';
          text = t.itemReturned;
          break;
        case OrderItemStatus.CANCELLED:
          variant = 'destructive';
          text = t.statusCancelled;
          break;
        default:
          variant = 'outline';
          text = status;
      }

      return <Badge variant={variant} className="text-xs">{text}</Badge>;
    };

    const SearchInput = () => {
      const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);
        focusSearchInput();
      };

      const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (!query.trim()) {
          setSearchResults([]);
          setIsSearching(false);
          return;
        }

        setIsSearching(true);

        // Используем debounce для поиска
        const timeoutId = setTimeout(() => {
          const filtered = products.filter(product =>
            product.title.toLowerCase().includes(query.toLowerCase())
          );

          setSearchResults(filtered);
          setIsSearching(false);
        }, 300);

        return () => clearTimeout(timeoutId);
      };

      return (
        <div >
          <div className="flex">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Поиск продуктов..."
              value={searchQuery}
              onChange={handleInputChange}
              className="pl-10 pr-4 py-3 text-lg h-14"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={handleClearSearch}
                type="button"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {isSearching && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
        </div>
      );
    };

    interface ProductCardProps {
      product: Product;
      additives: string[];
      comment: string;
      quantity: number;
      onAdditivesChange: (additives: string[]) => void;
      onQuantityChange: (quantity: number) => void;
      isOrderEditable: boolean;
      getProductPrice: (product: Product) => number;
    }

    const ProductCard: React.FC<ProductCardProps> = ({
      product,
      additives,
      comment,
      quantity,
      onAdditivesChange,
      onQuantityChange,
      isOrderEditable,
      getProductPrice
    }) => {
      return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col h-full">
          <div className="relative aspect-square">
            {product.images?.[0] ? (
              <Image
                src={product.images[0]}
                alt={product.title}
                width={300}
                height={300}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <Utensils className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="p-4 flex flex-col flex-grow">
            <div className="flex-grow">
              <div className="mb-3">
                <h3 className="font-bold text-lg">
                  {product.title}
                </h3>
                <p className="text-xl font-bold text-green-600">
                  {getProductPrice(product)} ₽
                </p>
              </div>

              {product.additives && product.additives.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-600 mb-2">
                    {t.additives}
                  </div>
                  <SearchableSelect
                    options={product.additives.map(additive => ({
                      id: additive.id,
                      label: `${additive.title} (+${additive.price} ₽)`
                    }))}
                    value={additives}
                    onChange={onAdditivesChange}
                    placeholder={t.selectAdditives}
                    searchPlaceholder={t.searchAdditives}
                    emptyText={t.noAdditivesFound}
                    multiple={true}
                    disabled={!isOrderEditable}
                  />
                </div>
              )}
            </div>

            <div className="mt-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-between gap-3 w-full">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-10 w-10 p-0"
                    onClick={() => {
                      const newQuantity = Math.max(0, quantity - 1)
                      onQuantityChange(newQuantity)
                    }}
                    disabled={quantity === 0 || !isOrderEditable}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <span className="font-bold text-xl w-10 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-10 w-10 p-0"
                    onClick={() => {
                      const newQuantity = quantity + 1
                      onQuantityChange(newQuantity)
                    }}
                    disabled={!isOrderEditable}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                
              </div>
          
            </div>
          </div>
        </div>
      );
    };

    const renderItemActions = (item: OrderItem) => {
      if (!order) return null;

      const canEditQuantity = item.status === OrderItemStatus.CREATED && isOrderEditable;
      const canReorder = [
        OrderItemStatus.COMPLETED,
        OrderItemStatus.IN_PROGRESS,
        OrderItemStatus.CREATED,
      ].includes(item.status) && isOrderEditable && !item.isRefund;

      const canRefund = ['COMPLETED', 'DELIVERING', 'PREPARING', 'READY'].includes(order.status) && !item.isRefund;

      const canRefundItem = [
        OrderItemStatus.COMPLETED,
        OrderItemStatus.IN_PROGRESS
      ].includes(item.status) && isOrderEditable && !item.isRefund;

      return (
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <div className="text-sm">
            {getStatusBadge(item.status)}
          </div>
          <div className="flex items-center flex-col gap-2 justify-between">
            {canEditQuantity && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-8 w-8 p-0"
                  onClick={() => handleQuantitItemChange(item, item.quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-bold w-8 text-center">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-8 w-8 p-0"
                  onClick={() => handleQuantitItemChange(item, item.quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            {canReorder && (
              <div className='flex justify-end text-right'>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-blue-500 hover:text-blue-600 hidden 2xl:flex h-10"
                  onClick={() => handleReorderItem(item)}
                  disabled={isUpdating}
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Дозаказ
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-blue-500 hover:text-blue-600 2xl:hidden flex h-10"
                  onClick={() => handleReorderItem(item)}
                  disabled={isUpdating}
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
              </div>
            )}

            {canRefund && canRefundItem && (
              <div className='flex justify-end text-right'>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-red-500 hover:text-red-600 2xl:flex hidden h-10"
                  onClick={() => {
                    setSelectedItemForRefund(item);
                    setMaxRefundQuantity(item.quantity);
                    setRefundQuantity(1);
                    setShowRefundDialog(true);
                  }}
                  disabled={isUpdating}
                >
                  <Undo className="h-5 w-5 mr-2" />
                  Вернуть
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-red-500 hover:text-red-600 flex 2xl:hidden h-10"
                  onClick={() => {
                    setSelectedItemForRefund(item);
                    setMaxRefundQuantity(item.quantity);
                    setRefundQuantity(1);
                    setShowRefundDialog(true);
                  }}
                  disabled={isUpdating}
                >
                  <Undo className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    };

    const renderCompactItemCard = (item: OrderItem) => {
      const getCookingTime = () => {
        if (!item.timestamps.startedAt) return null;

        const startTime = new Date(item.timestamps.startedAt).getTime();
        let endTime = item.timestamps.completedAt
          ? new Date(item.timestamps.completedAt).getTime()
          : Date.now();

        const cookingTimeMinutes = Math.round((endTime - startTime) / (1000 * 60));

        return cookingTimeMinutes;
      };

      const cookingTime = getCookingTime();
      const canEditQuantity = item.status === OrderItemStatus.CREATED && isOrderEditable;
      const canReorder = [
        OrderItemStatus.COMPLETED,
        OrderItemStatus.IN_PROGRESS,
        OrderItemStatus.CREATED,
      ].includes(item.status) && isOrderEditable && !item.isRefund;

      const canRefund = ['COMPLETED', 'DELIVERING', 'PREPARING'].includes(order?.status || '') && !item.isRefund;
      const canRefundItem = [
        OrderItemStatus.COMPLETED,
        OrderItemStatus.IN_PROGRESS
      ].includes(item.status) && isOrderEditable && !item.isRefund;

      return (
        <div
          key={item.id}
          className={`bg-white rounded-xl p-4 shadow-sm ${item.isReordered ? 'border-l-4 border-blue-500' : ''} ${item.isRefund ? 'bg-red-50' : ''}`}
        >
          <div className="flex items-center gap-4">
            {/* Изображение продукта */}
            <div className="flex-shrink-0 w-20 h-20 relative">
              {item.product.image ? (
                <Image
                  src={item.product.image}
                  alt={item.product.title}
                  width={80}
                  height={80}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Utensils className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Основная информация */}
            <div className="flex-1 min-w-0">
              <div className="flex  flex-col gap-4">
                <div className="flex flex-col min-w-0 justify-between">
                  <div className="flex gap-3 mb-2 justify-between w-full">
                    <h3 className="font-bold text-lg truncate">
                      {item.product.title} 
                    </h3>
                    <p className="text-lg font-bold items-center mb-2 flex">
                      {calculateItemPrice(item)} ₽
                    </p>
                  </div>

              

                  {/* Дополнения и комментарии */}
                  <div className="flex space-y-2">
                    {item.additives.length > 0 && (
                      <div className="text-sm text-gray-600 flex items-start">
                        <Plus className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="truncate">{item.additives.map(a => a.title).join(', ')}</span>
                      </div>
                    )}
                    {item.comment && (
                      <div className="text-sm text-gray-600 flex items-start">
                        <MessageSquare className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="truncate">{item.comment}</span>
                      </div>
                    )}
                    {item.isRefund && item.refundReason && (
                      <div className="text-sm text-red-500 flex items-start">
                        <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="truncate">{item.refundReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Правая часть - элементы управления */}
                <div className="flex items-center gap-4 flex-shrink-0 justify-between">

                  {/* Счетчик количества и кнопки */}
                  <div className="flex items-center gap-4 justify-between w-full">
                    {/* Счетчик количества */}
                    <div className="flex-shrink-0 justify-between">
                      {getStatusBadge(item.status)}
                    </div>
                    {canEditQuantity ? (
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="lg"
                          className="h-10 w-10 p-0"
                          onClick={() => handleQuantitItemChange(item, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-5 w-5" />
                        </Button>
                        <span className="text-2xl font-bold w-10 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="lg"
                          className="h-10 w-10 p-0"
                          onClick={() => handleQuantitItemChange(item, item.quantity + 1)}
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                      )
                      :
                      (<div className="flex items-center gap-3">
                        {item.timestamps.startedAt && cookingTime !== null && (
                          <p className="text-sm text-gray-600 mb-2">
                            {item.timestamps.completedAt
                              ? `${t.cookedIn} ${getCookingTimeText(cookingTime)}`
                              : `${t.cookingFor} ${getCookingTimeText(cookingTime)}`}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Кнопки действий */}
                    <div className="flex items-center gap-3">
                      {/* Дозаказ */}
                      {canReorder && (
                        <Button
                          variant="ghost"
                          size="lg"
                          className="h-11 w-11 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => handleReorderItem(item)}
                          disabled={isUpdating}
                        >
                          <RefreshCw className="h-5 w-5" />
                        </Button>
                      )}

                      {/* Возврат */}
                      {canRefund && canRefundItem && (
                        <Button
                          variant="ghost"
                          size="lg"
                          className="h-11 w-11 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setSelectedItemForRefund(item);
                            setMaxRefundQuantity(item.quantity);
                            setRefundQuantity(1);
                            setShowRefundDialog(true);
                          }}
                          disabled={isUpdating}
                        >
                          <Undo className="h-5 w-5" />
                        </Button>
                      )}

                      {/* Удаление */}
                      {canEditQuantity && (
                        <Button
                          variant="ghost"
                          size="lg"
                          className="h-11 w-11 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleQuantitItemChange(item, 0)}
                          disabled={isUpdating}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };


    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return format(date, 'PPpp', {
        locale: ru
      });
    };

    const renderLogs = () => {
      if (logsLoading) {
        return (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        );
      }

      if (logs.length === 0) {
        return (
          <div className="text-center py-8 text-gray-600">
            {t.noHistory}
          </div>
        );
      }

      return (
        <div className="space-y-4 h-96 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="pb-4 px-2 last:pb-0">
              <div className="flex items-start gap-4">
                <div className="flex-1 flex justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg">{log.action}</div>
                    {log.userName && (
                      <div className="text-lg text-gray-600 flex items-center gap-2 mt-2">
                        <User className="h-4 w-4" />
                        {log.userName}
                      </div>
                    )}
                    {log.details && (
                      <div className="mt-3 text-lg bg-gray-100 p-3 rounded-lg">
                        <pre className="whitespace-pre-wrap break-words">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-lg text-gray-600 w-32 text-center">
                    {formatDate(log.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    };

    const renderDiscountsBlock = () => {
      if (!order?.restaurant?.id) return null;

      return (
        <div className="space-y-6">
          {order.discountAmount > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">{t.discount}:</span>
                <span className="text-xl font-bold text-green-600">
                  -{order.discountAmount.toFixed(2)} ₽
                </span>
              </div>
              <Button
                variant="outline"
                className="w-full h-12 text-lg"
                onClick={handleRemoveDiscount}
                disabled={!isOrderEditable || isUpdating}
              >
                {t.removeDiscount}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-lg font-semibold">{t.enterDiscountCode}</Label>
                <div className="flex items-center gap-3">
                  <Input
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      setPromoCodeError('');
                    }}
                    placeholder={t.enterDiscountCode}
                    disabled={!isOrderEditable || promoCodeLoading}
                    className="h-12 text-lg"
                  />
                  <Button
                    onClick={handleApplyPromoCode}
                    disabled={!isOrderEditable || promoCodeLoading || !promoCode.trim()}
                    className="h-12 px-6"
                  >
                    {promoCodeLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      t.applyCode
                    )}
                  </Button>
                </div>
                {promoCodeError && (
                  <p className="text-lg text-red-500">{promoCodeError}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-lg font-semibold">{t.enterCustomerCode}</Label>
                <div className="flex items-center gap-3">
                  <Input
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value)}
                    placeholder="XXXX"
                    maxLength={4}
                    disabled={!isOrderEditable || customerLoading}
                    className="h-12 text-lg"
                  />
                  <Button
                    onClick={handleApplyCustomer}
                    disabled={!isOrderEditable || customerLoading || customerCode.length !== 4}
                    className="h-12 px-6"
                  >
                    {customerLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      t.applyCustomer
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    // Компонент для отображения модификаторов заказа
    const renderOrderAdditivesBlock = () => {
      if (!order?.restaurant?.id) return null;

      return (
        <div className="space-y-6">
          {/* Фильтры */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select
                value={filterOrderAdditiveType}
                onValueChange={setFilterOrderAdditiveType}
              >
                <SelectTrigger className='w-full h-12 text-lg'>
                  <SelectValue placeholder={t.filterByType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-lg py-3">{t.allTypes}</SelectItem>
                  <SelectItem value={OrderAdditiveType.FIXED} className="text-lg py-3">
                    {t.orderAdditiveTypes.FIXED}
                  </SelectItem>
                  <SelectItem value={OrderAdditiveType.PER_PERSON} className="text-lg py-3">
                    {t.orderAdditiveTypes.PER_PERSON}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Список доступных модификаторов */}
          {orderAdditivesLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredAvailableOrderAdditives.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {filteredAvailableOrderAdditives.map(additive => (
                  <div key={additive.id} className="flex items-center justify-between p-4 border-2 rounded-xl hover:bg-gray-50 transition-all">
                    <div>
                      <p className="font-bold text-lg">{additive.title}</p>
                      <div className="flex items-center gap-6 text-lg text-gray-600 mt-2">
                        <span>
                          {t.orderAdditivePrice}: {additive.price} ₽
                        </span>
                        <span>
                          {t.orderAdditiveType}: {t.orderAdditiveTypes[additive.type] || additive.type}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      onClick={() => {
                        setSelectedOrderAdditive(additive.id);
                        handleAddOrderAdditive();
                      }}
                      disabled={!isOrderEditable || isUpdating}
                      className="h-12 px-6"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      {t.addOrderAdditive}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600 text-lg">
              {t.noOrderAdditives}
            </div>
          )}

          {/* Текущие модификаторы */}
          {orderAdditives.length > 0 && (
            <div className="space-y-6">
              <h4 className="font-bold text-2xl">{t.currentOrderAdditives}</h4>
              <div className="space-y-4">
                {orderAdditives.map(additive => (
                  <div key={additive.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg">{additive.title}</p>
                          <div className="flex items-center gap-6 text-lg text-gray-600 mt-2">
                            <span>
                              {t.orderAdditiveType}: {t.orderAdditiveTypes[additive.type] || additive.type}
                            </span>
                            <span>
                              {t.orderAdditivePrice}: {calculateAdditivePrice(additive)} ₽
                            </span>
                            {additive.type === OrderAdditiveType.PER_PERSON && (
                              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                {t.applyPerPerson}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="lg"
                              className="h-8 w-8 p-0"
                              onClick={() => handleUpdateOrderAdditiveQuantity(
                                additive.id,
                                (additive.quantity || 1) - 1
                              )}
                              disabled={!isOrderEditable || (additive.quantity || 1) <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-bold text-xl w-8 text-center">
                              {additive.quantity || 1}
                            </span>
                            <Button
                              variant="outline"
                              size="lg"
                              className="h-8 w-8 p-0"
                              onClick={() => handleUpdateOrderAdditiveQuantity(
                                additive.id,
                                (additive.quantity || 1) + 1
                              )}
                              disabled={!isOrderEditable}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="lg"
                            className="text-red-500 hover:text-red-600 h-10"
                            onClick={() => handleRemoveOrderAdditive(additive.id)}
                            disabled={!isOrderEditable}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Итоговая стоимость модификаторов */}
          {orderAdditives.length > 0 && (
            <div className="pt-6 border-t">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xl">{t.orderAdditives}:</span>
                <span className="text-2xl font-bold text-green-600">
                  {calculateTotalOrderAdditivesPrice()} ₽
                </span>
              </div>
            </div>
          )}
        </div>
      );
    };

    // Рендер карточек категорий с горизонтальной прокруткой
    const renderCategoryCards = () => {
      const displayCategories = getDisplayCategories();
      const displayProducts = searchQuery ? searchResults : getDisplayProducts();

      return (
        <div className="space-y-6">
          {/* Поиск */}
          <SearchInput />
          
          {/* Показываем результаты поиска */}
          {searchQuery && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">
                  Результаты поиска
                  {searchResults.length > 0 && ` (${searchResults.length})`}
                </h3>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="h-12"
                >
                  Очистить поиск
                </Button>
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-600 text-lg">
                  Продукты не найдены
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {searchResults.map((product) => {
                    const additives = productAdditives[product.id] || []
                    const comment = productComments[product.id] || ''
                    const quantity = getDisplayQuantity(product, additives, comment)

                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        additives={additives}
                        comment={comment}
                        quantity={quantity}
                        onAdditivesChange={(newAdditives) => {
                          handleAdditivesChange(product.id, newAdditives)
                          if (quantity > 0) {
                            handleQuantityChange(product, quantity, newAdditives, comment)
                          }
                        }}
                        onQuantityChange={(newQuantity) =>
                          handleQuantityChange(product, newQuantity, additives, comment)
                        }
                        isOrderEditable={isOrderEditable!}
                        getProductPrice={getProductPrice}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Обычное отображение категорий (только если нет поиска) */}
          {!searchQuery && (
            <>
              {/* Горизонтальная прокрутка категорий */}
              {(displayCategories.length > 0 || categoryNavigation.parentCategory) && (
                  <div className="flex ">
                    <div className="grid grid-flow-col auto-cols-[minmax(200px,1fr)] overflow-x-auto pb-6 scrollbar-hide gap-2 px-2 ">
                      {/* Кнопка назад */}
                      {(categoryNavigation.parentCategory || categoryNavigation.breadcrumbs.length > 0) && (
                        <div
                          onClick={handleBackToCategories}
                          className={`transition-all flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50`}
                        >
                          <div className={`p-3 rounded-full mb-3 bg-gray-100 text-gray-600`}>
                            <ChevronLeft/>
                          </div>
                          <span className="text-xl font-semibold mb-1 text-center"> {t.backToCategories}</span>
                        </div>
                      )}

                      {/* Карточки категорий */}
                      {displayCategories.map((category) => {
                        const productsInCategory = getDisplayProducts().filter(
                          product => product.categoryId === category.id
                        );

                        return (
                          <div
                            onClick={() => handleCategoryClick(category)}
                            key={category.id}
                            className={`flex flex-col items-center between transition-all  p-6 rounded-xl border-2 ${
                              categoryNavigation.currentCategory && category.id === categoryNavigation.currentCategory!.id
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50'
                            }`}
                          >
                            <div className={`p-3 rounded-full mb-3 ${
                              categoryNavigation.currentCategory && category.id === categoryNavigation.currentCategory!.id 
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <Utensils/>
                            </div>
                            <span className="text-xl font-semibold mb-1 text-center">{category.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Сообщение когда нет категорий с товарами */}
              {displayCategories.length === 0 && !categoryNavigation.parentCategory && (
                <div className="text-center py-8 text-gray-600 text-lg">
                  {t.noProductsFound}
                </div>
              )}

              {/* Товары отображаются ТОЛЬКО когда выбрана конкретная категория */}
              {categoryNavigation.currentCategory && displayProducts.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-2xl font-bold mb-6 text-center">
                    {categoryNavigation.currentCategory.title}
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {displayProducts.map((product) => {
                      const additives = productAdditives[product.id] || []
                      const comment = productComments[product.id] || ''
                      const quantity = getDisplayQuantity(product, additives, comment)

                      return (
                        <ProductCard
                          key={product.id}
                          product={product}
                          additives={additives}
                          comment={comment}
                          quantity={quantity}
                          onAdditivesChange={(newAdditives) => {
                            handleAdditivesChange(product.id, newAdditives)
                            if (quantity > 0) {
                              handleQuantityChange(product, quantity, newAdditives, comment)
                            }
                          }}
                          onQuantityChange={(newQuantity) =>
                            handleQuantityChange(product, newQuantity, additives, comment)
                          }
                          isOrderEditable={isOrderEditable!}
                          getProductPrice={getProductPrice}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Сообщение когда выбрана категория но нет товаров */}
              {categoryNavigation.currentCategory && displayProducts.length === 0 && (
                <div className="text-center py-8 text-gray-600 text-lg">
                  {t.noProductsFound}
                </div>
              )}
            </>
          )}
        </div>
      );
    };

    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-[200px]" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-[500px] w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-[200px] w-full" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold">{t.orderNotFound}</h2>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => router.push('/orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.back}
          </Button>
        </div>
      );
    }

    if (!order) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold">{t.orderNotFound}</h2>
          <Button onClick={() => router.push('/orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.back}
          </Button>
        </div>
      );
    }
  const statusTranslations = {
    CREATED: {
      ru: 'Создан',
      ka: 'შექმნილი'
    },
    CONFIRMED: {
      ru: 'Подтвержден',
      ka: 'დადასტურებული'
    },
    PREPARING: {
      ru: 'Готовится',
      ka: 'მზადდება'
    },
    READY: {
      ru: 'Готов',
      ka: 'მზადაა'
    },
    DELIVERING: {
      ru: 'Доставляется',
      ka: 'იტანება'
    },
    COMPLETED: {
      ru: 'Завершен',
      ka: 'დასრულებული'
    },
    CANCELLED: {
      ru: 'Отменен',
      ka: 'გაუქმებული'
    }
  }

    return (
      <AccessCheck allowedRoles={['WAITER', 'MANAGER', 'SUPERVISOR']}>
        <div >
          {/* Шапка с названием ресторана */}
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
            <div className='flex flex-row items-center'>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Заказ {order.number}
              </h1>
              
            </div>
            <div className="flex gap-4 justify-center mt-6 text-center p-3">
                    {order.type === 'DINE_IN' && <div
                      className={`flex flex-col items-center p-3 rounded-lg ${order.tableNumber ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-100'}`}
                      title={order.tableNumber ? `Стол ${order.tableNumber}` : 'Без стола'}
                    >
                      <div className="flex items-center justify-center h-6 w-6">
                        <span className={`font-bold ${order.tableNumber ? 'text-blue-600' : 'text-gray-500'}`}>
                          {order.tableNumber || '—'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold mt-1">Стол</span>
                    </div>
                    }
                    {/* Количество персон */}
                    <div
                      className={`flex flex-col items-center p-3 rounded-lg ${order.numberOfPeople ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-100'}`}
                      title={order.numberOfPeople ? `${order.numberOfPeople} персон` : ''}
                    >
                      <div className="flex items-center justify-center h-6 w-6">
                        <span className={`font-bold ${order.numberOfPeople ? 'text-green-600' : 'text-gray-500'}`}>
                          {order.numberOfPeople || '—'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold mt-1">Персон</span>
                    </div>

                    {/* Статус заказа */}
                    <div
                      className={`flex flex-col items-center p-3 rounded-lg border-2 ${
                          order.status === 'CREATED' ? 'border-amber-200 bg-amber-50' :
                          order.status === 'CONFIRMED' ? 'border-blue-200 bg-blue-50' :
                          order.status === 'PREPARING' ? 'border-purple-200 bg-purple-50' :
                          order.status === 'READY' ? 'border-green-200 bg-green-50' :
                          order.status === 'DELIVERING' ? 'border-cyan-200 bg-cyan-50' :
                          order.status === 'COMPLETED' ? 'border-gray-200 bg-gray-50' :
                          'bg-red-500'
                        }`}
                      title={order.status ? order.status : ''}
                    >
                      {order.status && (
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                          order.status === 'CREATED' ? 'bg-amber-500' :
                          order.status === 'CONFIRMED' ? 'bg-blue-500' :
                          order.status === 'PREPARING' ? 'bg-purple-500' :
                          order.status === 'READY' ? 'bg-green-500' :
                          order.status === 'DELIVERING' ? 'bg-cyan-500' :
                          order.status === 'COMPLETED' ? 'bg-gray-500' :
                          'bg-red-500'
                        }`}>
                          <span className="text-white text-xs font-bold">
                            {order.status.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span className="text-sm font-semibold mt-1">{statusTranslations[order.status]?.[language] || order.status}</span>
                    </div>

                    {/* Время создания */}
                    <div
                      className={`flex flex-col items-center p-3 rounded-lg ${order.createdAt ? 'bg-orange-50 border-2 border-orange-200' : 'bg-gray-100'}`}
                      title={order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : ''}
                    >
                      <Clock className={`h-6 w-6 ${order.createdAt ? 'text-orange-600' : 'text-gray-500'}`} />
                      <span className="text-sm font-semibold mt-1">
                        {order.createdAt ? format(new Date(order.createdAt), 'HH:mm') : '—'}
                      </span>
                    </div>
                  <div
                    className={`flex flex-col items-center p-3 rounded-lg ${order.attentionFlags?.isReordered ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-100'}`}
                    title={order.attentionFlags?.isReordered ? t.reorder : ''}
                  >
                    <ShoppingBag
                      className={`h-6 w-6 ${order.attentionFlags?.isReordered ? 'text-blue-600' : 'text-gray-500'}`}
                    />
                    <span className="text-sm font-semibold mt-1">{t.reorder}</span>
                  </div>

                  <div
                    className={`flex flex-col items-center p-3 rounded-lg ${order.attentionFlags?.hasDiscount ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-100'}`}
                    title={order.attentionFlags?.hasDiscount ? t.discount : ''}
                  >
                    <Tag
                      className={`h-6 w-6 ${order.attentionFlags?.hasDiscount ? 'text-green-600' : 'text-gray-500'}`}
                    />
                    <span className="text-sm font-semibold mt-1">{t.discount}</span>
                  </div>

                  <div
                    className={`flex flex-col items-center p-3 rounded-lg ${order.attentionFlags?.discountCanceled ? 'bg-red-50 border-2 border-red-200' : 'bg-gray-100'}`}
                    title={order.attentionFlags?.discountCanceled ? t.discountCanceled : ''}
                  >
                    <Ban
                      className={`h-6 w-6 ${order.attentionFlags?.discountCanceled ? 'text-red-600' : 'text-gray-500'}`}
                    />
                    <span className="text-sm font-semibold mt-1">{t.discountCanceled}</span>
                  </div>

                  <div
                    className={`flex flex-col items-center p-3 rounded-lg ${order.attentionFlags?.isPrecheck ? 'bg-purple-50 border-2 border-purple-200' : 'bg-gray-100'}`}
                    title={order.attentionFlags?.isPrecheck ? t.precheck : ''}
                  >
                    <Receipt
                      className={`h-6 w-6 ${order.attentionFlags?.isPrecheck ? 'text-purple-600' : 'text-gray-500'}`}
                    />
                    <span className="text-sm font-semibold mt-1">{t.precheck}</span>
                  </div>

                  <div
                    className={`flex flex-col items-center p-3 rounded-lg ${order.attentionFlags?.isRefund ? 'bg-orange-50 border-2 border-orange-200' : 'bg-gray-100'}`}
                    title={order.attentionFlags?.isRefund ? t.refund : ''}
                  >
                    <RefreshCw
                      className={`h-6 w-6 ${order.attentionFlags?.isRefund ? 'text-orange-600' : 'text-gray-500'}`}
                    />
                    <span className="text-sm font-semibold mt-1">{t.refund}</span>
                  </div>
            </div>
          </div>
          {/* Основная сетка */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Левая колонка - Меню */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg sticky top-4 h-[calc(100vh-2rem)] flex flex-col">
                {/* Заголовок меню - sticky */}
                <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 rounded-t-2xl">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Utensils className="h-8 w-8 text-blue-600" />
                    Меню
                  </h2>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="space-y-6">
                    {categories.length > 0 && products.length > 0 ? (
                      renderCategoryCards()
                    ) : (
                      <div className="p-6 border-2 rounded-xl text-center text-lg">
                        {t.noProductsFound}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </div>

            {/* Правая колонка - Информация о заказе */}
<div className="space-y-8 h-[calc(100vh-2rem)] flex flex-col">
  
  {/* Карточка с табами - фиксированной высоты со скроллом */}
  <div className="bg-white rounded-2xl p-6 shadow-lg flex-1 flex flex-col min-h-0">
    <Tabs defaultValue='order' className='w-full flex flex-col flex-1 min-h-0'>
      <TabsList className="w-full flex flex-row gap-2 mb-4 bg-white flex-shrink-0">
        <TabsTrigger value="order" className="w-full text-lg font-semibold flex flex-col items-center justify-center p-4  rounded-lg border-2 border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50 transition-all">
          <ShoppingCart className="w-6 h-6" />
        </TabsTrigger>
        <TabsTrigger value="history" className="w-full text-lg font-semibold flex flex-col items-center justify-center p-4   rounded-lg border-2 border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50 transition-all">
          <History className="w-6 h-6" />
        </TabsTrigger>
        <TabsTrigger value="discount" className="w-full text-lg font-semibold flex flex-col items-center justify-center p-4   rounded-lg border-2 border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50 transition-all">
          <Tag className="w-6 h-6" />
        </TabsTrigger>
        <TabsTrigger value="additives" className="w-full text-lg font-semibold flex flex-col items-center justify-center p-4   rounded-lg border-2 border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50 transition-all">
          <PlusSquare className="w-6 h-6" />
        </TabsTrigger>
        <TabsTrigger value="info" className="w-full text-lg font-semibold flex flex-col items-center justify-center p-4  rounded-lg border-2 border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50 transition-all">
          <Info className="w-6 h-6" />
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="order" className="flex-1 min-h-0 overflow-y-auto space-y-4 overflow-x-hidden">
        {getOrderItems().filter(item => !item.isRefund).map(renderCompactItemCard)}
      </TabsContent>

      <TabsContent value="history" className="flex-1 min-h-0 overflow-y-auto">
        {renderLogs()}
      </TabsContent>

      <TabsContent value="discount" className="flex-1 min-h-0 overflow-y-auto">
        {renderDiscountsBlock()}
      </TabsContent>

      <TabsContent value="additives" className="flex-1 min-h-0 overflow-y-auto">
        {renderOrderAdditivesBlock()}
      </TabsContent>

      <TabsContent value="info" className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-8">
          {/* Тип заказа */}
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              {t.orderType}
            </h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  value: 'DINE_IN',
                  icon: <Utensils className="h-8 w-8" />,
                  label: 'В ресторане',
                },
                {
                  value: 'TAKEAWAY',
                  icon: <ShoppingBag className="h-8 w-8" />,
                  label: 'Самовывоз',
                },
                {
                  value: 'DELIVERY',
                  icon: <Truck className="h-8 w-8" />,
                  label: 'Доставка',
                },
                {
                  value: 'BANQUET',
                  icon: <Calendar className="h-8 w-8" />,
                  label: 'Банкет',
                }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setEditFormData({
                    ...editFormData,
                    type: type.value as OrderType,
                    tableNumber: (type.value === 'TAKEAWAY' || type.value === 'DELIVERY') ? '0' : editFormData.tableNumber
                  })}
                  disabled={!isOrderEditable}
                  className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                    editFormData.type === type.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50'
                  } ${!isOrderEditable ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className={`p-3 rounded-full mb-3 ${
                    editFormData.type === type.value
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {type.icon}
                  </div>
                  <span className="text-sm font-semibold mb-1">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Основная информация */}
          <div>
            <h2 className="text-2xl font-bold mb-6">
              Детали заказа
            </h2>
            
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              {/* Количество людей */}
              <div className="flex-1 min-w-0">
                <div className="space-y-3">
                  <Label className="text-xl font-semibold flex items-center gap-3">
                    <Users className="h-6 w-6 text-gray-600" />
                    {t.persons}
                  </Label>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 w-14 flex-shrink-0 text-2xl"
                      onClick={() => setEditFormData({
                        ...editFormData,
                        numberOfPeople: Math.max(1, editFormData.numberOfPeople - 1)
                      })}
                      disabled={!isOrderEditable}
                    >
                      <Minus className='h-8 w-8'/>
                    </Button>
                    <div className="flex-1 mx-2">
                      <Input
                        type="number"
                        min="1"
                        value={editFormData.numberOfPeople}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          numberOfPeople: parseInt(e.target.value) || 1
                        })}
                        disabled={!isOrderEditable}
                        className="h-14 text-2xl text-center font-bold"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 w-14 flex-shrink-0 text-2xl"
                      onClick={() => setEditFormData({
                        ...editFormData,
                        numberOfPeople: editFormData.numberOfPeople + 1
                      })}
                      disabled={!isOrderEditable}
                    >
                      <Plus className='h-8 w-8'/>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Номер стола (только для DINE_IN) */}
              {editFormData.type === 'DINE_IN' && (
                <div className="flex-1 min-w-0">
                  <div className="space-y-3">
                    <Label className="text-xl font-semibold flex items-center gap-3">
                      <Table className="h-6 w-6 text-gray-600" />
                      {t.table}
                    </Label>
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-14 w-14 flex-shrink-0 text-2xl"
                        onClick={() => setEditFormData({
                          ...editFormData,
                          tableNumber: Math.max(0, parseInt(editFormData.tableNumber) - 1).toString()
                        })}
                        disabled={!isOrderEditable}
                      >
                        <Minus className='h-8 w-8'/>
                      </Button>
                      <div className="flex-1 mx-2">
                        <Input
                          type="number"
                          min="0"
                          value={editFormData.tableNumber}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            tableNumber: (parseInt(e.target.value) || 0).toString()
                          })}
                          disabled={!isOrderEditable}
                          className="h-14 text-2xl text-center font-bold"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-14 w-14 flex-shrink-0 text-2xl"
                        onClick={() => setEditFormData({
                          ...editFormData,
                          tableNumber: (parseInt(editFormData.tableNumber) + 1).toString()
                        })}
                        disabled={!isOrderEditable}
                      >
                        <Plus className='h-8 w-8'/>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Доставка */}
            {editFormData.type === 'DELIVERY' && (
              <div className="space-y-6 mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xl font-semibold flex items-center gap-3">
                      <MapPin className="h-6 w-6 text-orange-600" />
                      {t.deliveryAddress}
                    </Label>
                    <Input
                      value={editFormData.deliveryAddress}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        deliveryAddress: e.target.value
                      })}
                      placeholder={t.deliveryAddress}
                      disabled={!isOrderEditable}
                      className="h-14 text-lg"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xl font-semibold flex items-center gap-3">
                      <Clock className="h-6 w-6 text-orange-600" />
                      {t.deliveryTime}
                    </Label>
                    <Input
                      type="time"
                      value={editFormData.deliveryTime}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        deliveryTime: e.target.value
                      })}
                      disabled={!isOrderEditable}
                      className="h-14 text-lg"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-xl font-semibold flex items-center gap-3">
                    <MessageSquare className="h-6 w-6 text-orange-600" />
                    {t.deliveryNotes}
                  </Label>
                  <Textarea
                    value={editFormData.deliveryNotes}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      deliveryNotes: e.target.value
                    })}
                    placeholder={t.callBeforeArrival}
                    disabled={!isOrderEditable}
                    className="min-h-[100px] text-lg"
                  />
                </div>
              </div>
            )}

            {/* Комментарий */}
            <div className="space-y-3">
              <Label className="text-xl font-semibold flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-gray-600" />
                {t.comment}
              </Label>
              <Textarea
                value={editFormData.comment}
                onChange={(e) => setEditFormData({
                  ...editFormData,
                  comment: e.target.value
                })}
                placeholder={t.comment}
                disabled={!isOrderEditable}
                className="min-h-[100px] text-lg"
              />
            </div>
          </div>

          {/* Кнопки сохранения */}
          {isOrderEditable && (
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                onClick={handleEditOrderSubmit}
                disabled={isUpdating}
                className="h-14 text-lg px-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                {isUpdating ? (
                  <span className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t.saving}
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <Check className="h-5 w-5" />
                    {t.saveChanges}
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  </div>

  {/* Карточка "Итого" - фиксированной высоты */}
  <div className="bg-white rounded-2xl p-6 shadow-lg flex-shrink-0">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <Receipt className="h-6 w-6 text-green-600" />
        <h3 className="text-2xl font-bold">
          {t.total}: {calculateOrderTotal().toFixed(2)} ₽
        </h3>
      </div>
      {((order.surcharges && order.surcharges.length > 0) || order.discountAmount > 0 || calculateTotalOrderAdditivesPrice() > 0) && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="lg" className="h-10 px-3">
              <ChevronDown className="h-5 w-5" />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      )}
    </div>
    
    {((order.surcharges && order.surcharges.length > 0) || order.discountAmount > 0 || calculateTotalOrderAdditivesPrice() > 0) && (
      <CollapsibleContent>
        <div className="pt-4 border-t space-y-3">
          {order.surcharges && order.surcharges.length > 0 && (
            <div className="space-y-2">
              <div className="text-lg font-semibold text-gray-600">{t.surcharges}:</div>
              {order.surcharges.map(surcharge => (
                <div key={surcharge.id} className="flex justify-between text-lg">
                  <span>{surcharge.title}</span>
                  <span className="font-bold text-red-600">
                    {surcharge.type === 'FIXED'
                      ? `+${surcharge.amount.toFixed(2)} ₽`
                      : `+${surcharge.amount}%`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Добавляем стоимость модификаторов в детализацию */}
          {calculateTotalOrderAdditivesPrice() > 0 && (
            <div className="flex justify-between text-lg">
              <span>{t.orderAdditives}:</span>
              <span className="font-bold text-blue-600">
                +{calculateTotalOrderAdditivesPrice().toFixed(2)} ₽
              </span>
            </div>
          )}

          {order.discountAmount > 0 && (
            <div className="flex justify-between text-lg">
              <span>{t.discount}:</span>
              <span className="font-bold text-green-600">
                -{order.discountAmount.toFixed(2)} ₽
              </span>
            </div>
          )}

          {order.bonusPointsUsed > 0 && (
            <div className="flex justify-between text-lg">
              <span>{t.bonusPoints}:</span>
              <span className="font-bold text-green-600">
                - {order.bonusPointsUsed.toFixed(2)} ₽
              </span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    )}
     <div className='space-y-4'>
    {order.status !== 'CANCELLED' && (
      <Button
        disabled={isUpdating}
        onClick={handlePrecheck}
        variant={order.attentionFlags?.isPrecheck ? "default" : "outline"}
        className={`gap-3 w-full h-16 text-2xl font-bold ${order.attentionFlags?.isPrecheck
          ? 'bg-green-100 text-green-800 hover:bg-green-100'
          : ''
          }`}
      >
        {isUpdating ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : order.attentionFlags?.isPrecheck ? (
          <CheckCircle className="h-6 w-6" />
        ) : (
          <Check className="h-6 w-6" />
        )}
        {order.attentionFlags?.isPrecheck ? t.precheckFormed : t.formPrecheck}
      </Button>
    )}

    {getOrderItems().some(item => item.status === OrderItemStatus.CREATED) && (
      <Button
        disabled={isUpdating || getOrderItems().length === 0}
        onClick={handleConfirmOrder}
        variant="default"
        className="bg-emerald-500 hover:bg-emerald-400 text-white gap-3 w-full h-16 text-2xl font-bold shadow-lg hover:shadow-xl transition-shadow"
      >
        {isUpdating ? (
          <Loader2 className="h-6 w-6 mr-1 animate-spin" />
        ) : (
          <Check className="h-6 w-6 mr-1" />
        )}
        {order.scheduledAt ? 'Подтвердить' : t.confirm}
        ({getOrderItems().filter(item => item.status === OrderItemStatus.CREATED).length})
      </Button>
    )}

    {order.status === 'CREATED' && (
      <Button
        disabled={isUpdating}
        onClick={handleCancelOrder}
        variant="default"
        className="bg-red-500 hover:bg-red-400 text-white gap-3 w-full h-16 text-2xl font-bold shadow-lg hover:shadow-xl transition-shadow"
      >
        {isUpdating ? (
          <Loader2 className="h-6 w-6 mr-1 animate-spin" />
        ) : (
          <X className="h-6 w-6 mr-1" />
        )}
        {t.cancel}
      </Button>
    )}

   {(order.status === 'READY' && order.type != 'DELIVERY') && (
  <Button
    disabled={
      isUpdating || 
      shiftLoading || 
      !order.attentionFlags.isPrecheck || 
      // Проверяем, что все блюда в заказе готовы
      getOrderItems().some(item => item.status !== OrderItemStatus.COMPLETED)
    }
    onClick={handleCalculateOrder}
    variant="default"
    className={`gap-3 w-full h-16 text-2xl font-bold shadow-lg hover:shadow-xl transition-shadow ${
      getOrderItems().some(item => item.status !== OrderItemStatus.COMPLETED)
        ? 'hidden'
        : 'bg-emerald-500 hover:bg-emerald-400'
    }`}
  >
    {isUpdating || shiftLoading ? (
      <Loader2 className="h-6 w-6 animate-spin" />
    ) : getOrderItems().some(item => item.status !== OrderItemStatus.COMPLETED) ? (
      <Clock className="h-6 w-6" />
    ) : (
      <CheckCircle className="h-6 w-6" />
    )}
    { t.calculate
    }
  </Button>
)}
  </div>
  </div>

 
</div>
          </div>

          {/* Диалоговые окна */}
          {order.payment && (
            <PaymentDialog
              open={showPaymentDialog}
              onOpenChange={setShowPaymentDialog}
              paymentId={order.payment.id}
              orderId={order.id}
              onPaymentComplete={confirmCompleteOrder}
            />
          )}

          <AlertDialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl">
                  {t.refundItem}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-lg">
                  {selectedItemForRefund?.product.title} ({selectedItemForRefund?.quantity} шт.)
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">
                    Количество для возврата:
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setRefundQuantity(prev => Math.max(1, prev - 1))}
                      disabled={refundQuantity <= 1}
                      className="h-12 w-12"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={maxRefundQuantity}
                      value={refundQuantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setRefundQuantity(Math.max(1, Math.min(maxRefundQuantity, value)));
                      }}
                      className="h-12 text-xl text-center font-bold w-24"
                    />
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setRefundQuantity(prev => Math.min(maxRefundQuantity, prev + 1))}
                      disabled={refundQuantity >= maxRefundQuantity}
                      className="h-12 w-12"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                    <span className="text-lg text-gray-600">
                      / {maxRefundQuantity} шт.
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-lg font-semibold">
                    {t.refundReason}
                  </Label>
                  <Textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder={t.cookingError}
                    className="min-h-[100px] text-lg"
                  />
                </div>
              </div>

              <AlertDialogFooter className="gap-3 sm:gap-0 mt-6">
                {refundQuantity < maxRefundQuantity && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRefundQuantity(maxRefundQuantity);
                    }}
                    className="h-12 text-lg"
                  >
                    Вернуть все
                  </Button>
                )}
                <AlertDialogCancel className="h-12 text-lg">
                  {t.cancel}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={refundQuantity === maxRefundQuantity ? handleRefundItem : handlePartialRefund}
                  disabled={!refundReason.trim() || isUpdating}
                  className="h-12 text-lg"
                >
                  {isUpdating && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {refundQuantity === maxRefundQuantity
                    ? t.confirmRefund
                    : `Вернуть ${refundQuantity} шт.`}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl">
                  {t.confirmation}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-lg">
                  {t.confirmCalculate}

                  {/* Добавить информацию о списании */}
                  {restaurantData?.useWarehouse && orderAdditives.some(a => a.inventoryItem) && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-xl">
                      <p className="text-lg font-semibold text-yellow-800">
                        <AlertCircle className="h-5 w-5 inline mr-2" />
                        Будут списаны инвентарные товары из модификаторов заказа
                      </p>
                    </div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="h-12 text-lg">
                  {t.cancel}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmCompleteOrder}
                  disabled={isUpdating || isWritingOff}
                  className="h-12 text-lg"
                >
                  {(isUpdating || isWritingOff) && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {isWritingOff
                    ? 'Списание...'
                    : t.calculate}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl">
                  {t.confirmation}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-lg">
                  {t.confirmCancel}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="h-12 text-lg">
                  {t.cancel}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmCancelOrder}
                  disabled={isUpdating}
                  className="h-12 text-lg"
                >
                  {isUpdating && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {t.cancel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showExitConfirmDialog} onOpenChange={setShowExitConfirmDialog}>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl">
                  {t.exitConfirmTitle}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-lg">
                  {t.exitConfirmMessage}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={cancelExit} className="h-12 text-lg">
                  {t.cancel}
                </AlertDialogCancel>
                <AlertDialogAction onClick={confirmExit} className="h-12 text-lg">
                  {t.exitConfirmLeave}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        {showPrecheckDialog && order && (
          <PrecheckDialog
            order={order}
            onClose={() => setShowPrecheckDialog(false)}
          />
        )}
      </AccessCheck>
    );
  }