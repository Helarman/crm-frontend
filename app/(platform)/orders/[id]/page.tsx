  'use client'

  import { useParams, useRouter } from 'next/navigation'
  import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  MobileSheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
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
    Info,
    WandSparkles,
    ArrowRight
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
  import PrecheckDialog from './PrecheckDialog'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
  DialogContentExtraWide,
} from "@/components/ui/dialog"
import { motion, useAnimationControls } from 'framer-motion'
import { TablesService, TableStatus } from '@/lib/api/tables.service'

 interface ComboSelection {
  comboId: string;
  selections: {
    [comboItemId: string]: {
      selectedProducts: Array<{
        productId: string;
        quantity: number;
      }>;
    };
  };
}

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
        back: "Назад",
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
        persons: "Персоны",
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
        precheckFormed: "Пречек",
        formPrecheck: "Пречек",
        refundItem: "Вернуть блюдо",
        refundReason: "Комментарий",
        confirmRefund: "Подтвердить",
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
        applyCustomer: "Применить",
        customerApplied: "Клиент применен",
        customerNotFound: "Клиент не найден",
        customerDiscount: "Персональная скидка",
        bonusPoints: "Бонусные баллы",
        useBonusPoints: "Использовать баллы",
        pointsAvailable: "Доступно баллов",
        applyDiscount: "Применить",
        removeCustomer: "Удалить клиента",
        customerInfo: "Информация о клиенте",
        phoneNumber: "Телефон",
        personalDiscount: "Персональная скидка",
        currentBonusPoints: "Текущие баллы",
        usePoints: "Использовать баллы",
        pointsToUse: "Количество баллов",
        maxPointsToUse: "Максимум можно использовать",
        applyPoints: "Применить",
        removePoints: "Сбросить баллы",
        discountApplied: "Скидка применена",
        pointsApplied: "Баллы применены",
        cookedIn: 'Приготовлено за',
        cookingFor: 'Готовится',
        minutes: 'минут',
        minutesForm1: 'минуту',
        minutesForm2: 'минуты',
        minutesForm5: 'минут',
        backToCategories: "Назад",
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
        applyCode: "Применить",
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
          FIXED: "Фикс",
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

    const [activeMenuTab, setActiveMenuTab] = useState<'menu' | 'order'>('menu');
    const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
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
        parentComboId?: string
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
    const [activeTab, setActiveTab] = useState<any>('order');
    const [isRightColCollapsed, setIsRightColCollapsed] = useState(false)
    const [selectedItemForHistory, setSelectedItemForHistory] = useState<OrderItem | null>(null);
    const [showItemHistoryDialog, setShowItemHistoryDialog] = useState(false);
    const [showComboRefundDialog, setShowComboRefundDialog] = useState(false);
    const [selectedComboItems, setSelectedComboItems] = useState<Array<{
      item: OrderItem;
      quantity: number;
      selected: boolean;
    }>>([]);
    const [orderItemsScrollRef, setOrderItemsScrollRef] = useState<HTMLDivElement | null>(null);
    const [showScrollDown, setShowScrollDown] = useState(false);
const [refundReasonType, setRefundReasonType] = useState<'chef_error' | 'waiter_error' | 'long_wait' | 'other' | ''>('');
const [refundMode, setRefundMode] = useState<'refund' | 'replace'>('refund');

const refundReasons = [
  { value: 'chef_error', label: 'Ошибка повара' },
  { value: 'waiter_error', label: 'Ошибка официанта' },
  { value: 'long_wait', label: 'Долго ждать' },
  { value: 'other', label: 'Другое' }
];

    const checkScrollPosition = useCallback(() => {
  if (orderItemsScrollRef) {
    const { scrollTop, scrollHeight, clientHeight } = orderItemsScrollRef;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollDown(!isNearBottom);
  }
}, [orderItemsScrollRef]);

// Добавьте функцию для прокрутки вниз
const scrollToBottom = useCallback(() => {
  if (orderItemsScrollRef) {
    orderItemsScrollRef.scrollTo({
      top: orderItemsScrollRef.scrollHeight,
      behavior: 'smooth'
    });
  }
}, [orderItemsScrollRef]);


useEffect(() => {
  if (orderItemsScrollRef) {
    // Небольшая задержка для обновления DOM
    setTimeout(() => {
      checkScrollPosition();
    }, 100);
  }
}, [order?.items, orderItemsScrollRef, checkScrollPosition]);


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
      const releaseTable = async (tableId: string, reason: string) => {
        try {
          // Обновляем статус стола на "Свободен" и убираем привязку к заказу
          await TablesService.updateTableStatus(
            tableId,
            TableStatus.AVAILABLE,
            undefined // Сбрасываем orderId
          );

          // Создаем лог об освобождении стола
          await createOrderLog(`Стол освобожден: ${reason}`);
          
          console.log(`Стол ${tableId} освобожден: ${reason}`);
        } catch (error) {
          console.error('Ошибка при освобождении стола:', error);
          // Не прерываем основную операцию, только логируем ошибку
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

    const prepareComboItemsForRefund = (comboItem: OrderItem) => {
      const childItems = getOrderItems().filter(
        child => child.parentOrderItemId === comboItem.id && !child.isRefund
      );
      
      const itemsForRefund = childItems.map(item => ({
        item,
        quantity: item.quantity,
        selected: false
      }));
      
      setSelectedComboItems(itemsForRefund);
      setSelectedItemForRefund(comboItem);
    };

    const handleComboItemsRefund = async () => {
  if (!order || !selectedItemForRefund ) return;

  const selectedItems = selectedComboItems.filter(item => item.selected);
  
  if (selectedItems.length === 0) {
    toast.error('Выберите хотя бы одно блюдо для возврата');
    return;
  }

  try {
    setIsUpdating(true);
    const reasonTypeText = refundReasons.find(r => r.value === refundReasonType)?.label || '';
    const fullRefundReason = refundReason ? `${reasonTypeText}: ${refundReason}` : reasonTypeText;

    // Возвращаем каждое выбранное блюдо
    for (const { item, quantity } of selectedItems) {
      await OrderService.partialRefundOrderItem(
        order.id,
        item.id,
        quantity,
         fullRefundReason,
        user?.id
      );
    }

    // Проверяем, остались ли непогашенные элементы в комбо
    const remainingItems = getOrderItems().filter(
      child => 
        child.parentOrderItemId === selectedItemForRefund.id && 
        !child.isRefund
    );

    // Если все элементы возвращены, помечаем родительское комбо как частично возвращенное
    if (remainingItems.length === 0) {
      // Можно добавить специальный флаг для родительского комбо
      await createOrderLog(`Все блюда из комбо "${selectedItemForRefund.product.title}" возвращены`);
    }

    await recalculateDiscount();
    await createOrderLog(
      `Возвращено ${selectedItems.length} блюд из комбо: ${selectedItemForRefund.product.title}`
    );

    toast.success(`Возвращено ${selectedItems.length} блюд из комбо`);

    setShowComboRefundDialog(false);
    setRefundReason('');
    setSelectedComboItems([]);

    // Обновляем заказ
    const updatedOrder = await OrderService.getById(order.id);
    setOrder(updatedOrder);

  } catch (error) {
    console.error('Error refunding combo items:', error);
    toast.error('Ошибка при возврате блюд из комбо');
  } finally {
    setIsUpdating(false);
  }
};

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
  const hasCreatedItems = getOrderItems().some(
    item => item.status === OrderItemStatus.CREATED
  );

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasCreatedItems) {
      e.preventDefault();
      e.returnValue = t.exitConfirmMessage;
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    Object.values(pendingAdditions).forEach(({ timer }) => {
      if (timer) clearTimeout(timer);
    });
  };
}, [order?.items, t.exitConfirmMessage]);
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
      if (!order || !selectedItemForRefund || refundQuantity <= 0) return;

      try {
        setIsUpdating(true);
        const reasonTypeText = refundReasons.find(r => r.value === refundReasonType)?.label || '';
        const fullRefundReason = refundReason ? `${reasonTypeText}: ${refundReason}` : reasonTypeText;

        const updatedOrder = await OrderService.partialRefundOrderItem(
          order.id,
          selectedItemForRefund.id,
          refundQuantity,
          fullRefundReason,
          user?.id
        );
        setOrder(updatedOrder);

        await recalculateDiscount();
        await createOrderLog(
          `${t.logs.itemRefunded}: ${selectedItemForRefund.product.title} x ${refundQuantity} (${fullRefundReason})`
        );

        toast.success(
          `Возвращено ${refundQuantity} шт.`
        );

        setShowPartialRefundDialog(false);
        setRefundReason('');
        setRefundReasonType('');
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
      // Сначала собираем все ID элементов для удаления
      const itemsToDelete: string[] = [];
      
      // Добавляем сам элемент
      itemsToDelete.push(item.id);
      
      // Проверяем, является ли элемент родительским комбо
      const childItems = getOrderItems().filter(
        childItem => childItem.parentOrderItemId === item.id
      );
      
      // Добавляем все дочерние элементы
      childItems.forEach(childItem => {
        itemsToDelete.push(childItem.id);
      });
      
      // Также проверяем старую логику с parentComboId
      if (item.parentComboId) {
        const childItemsByCombo = getOrderItems().filter(
          childItem => childItem.parentComboId === item.parentComboId &&
                      childItem.parentOrderItemId === item.id
        );
        
        childItemsByCombo.forEach(childItem => {
          if (!itemsToDelete.includes(childItem.id)) {
            itemsToDelete.push(childItem.id);
          }
        });
      }
      
      // Удаляем элементы в обратном порядке (сначала дочерние, потом родительские)
      // Сортируем так, чтобы дочерние элементы (с parentOrderItemId) удалялись первыми
      const sortedItemsToDelete = [...itemsToDelete].sort((a, b) => {
        const aIsChild = getOrderItems().find(i => i.id === a)?.parentOrderItemId ? 1 : 0;
        const bIsChild = getOrderItems().find(i => i.id === b)?.parentOrderItemId ? 1 : 0;
        return bIsChild - aIsChild; // Дочерние первыми
      });
      
      // Удаляем элементы по одному с обработкой ошибок
      let successCount = 0;
      for (const itemId of sortedItemsToDelete) {
        try {
          await OrderService.removeItemFromOrder(order.id, itemId);
          successCount++;
        } catch (err) {
          console.error(`Ошибка при удалении элемента ${itemId}:`, err);
        }
      }
      
      if (successCount > 0) {
        await createOrderLog(`${t.logs.itemRemoved}: ${item.product.title} и связанные элементы`);
      }
      
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

    // Получаем обновленный заказ
    const updatedOrder = await OrderService.getById(order.id);
    setOrder(updatedOrder);

  } catch (error) {
    console.error('Ошибка в handleQuantitItemChange:', error);
  } finally {
    setIsUpdating(false);
  }
};

   const handleRouteChange = (path: string) => {
  const hasCreatedItems = getOrderItems().some(
    item => item.status === OrderItemStatus.CREATED
  );

  if (hasCreatedItems) {
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
    
    if (restaurantData?.useWarehouse && orderAdditives.length > 0) {
      // Фильтруем модификаторы с инвентарными товарами
      const additivesWithInventory = orderAdditives.filter(
        additive => additive.inventoryItem && additive.quantity && additive.quantity > 0
      );  

      if (additivesWithInventory.length > 0) {
        await writeOffOrderAdditives(additivesWithInventory);
      }
    }

    // Освобождаем стол перед завершением заказа
    if (order.tableId && restaurantData.useReservation) {
      await releaseTable(order.tableId, 'Заказ завершен');
    }

    const updatedOrder = await OrderService.updateStatus(order.id, { status: 'COMPLETED' });
    setOrder(updatedOrder);

    await createOrderLog(t.logs.orderCompleted);

    toast.success('Заказ завершен');
    setShowCompleteDialog(false);
    setShowPaymentDialog(false);

    router.push('/orders');
  } catch (error) {
    console.error('Error completing order:', error);
    toast.error('Ошибка завершения заказа');
  } finally {
    setIsUpdating(false);
  }
};
const updateTableStatusBasedOnOrder = async () => {
  if (!order?.tableId || !restaurantData.useReservation) return;

  try {
    let newTableStatus = TableStatus.AVAILABLE;
    let reason = '';

    switch (order.status) {
      case 'PREPARING':
        newTableStatus = TableStatus.OCCUPIED;
        reason = 'Заказ готовится';
        break;
      case 'READY':
        newTableStatus = TableStatus.OCCUPIED;
        reason = 'Заказ готов';
        break;
      case 'DELIVERING':
        newTableStatus = TableStatus.OCCUPIED;
        reason = 'Заказ доставляется';
        break;
      case 'COMPLETED':
        newTableStatus = TableStatus.AVAILABLE;
        reason = 'Заказ завершен';
        break;
      case 'CANCELLED':
        newTableStatus = TableStatus.AVAILABLE;
        reason = 'Заказ отменен';
        break;
      default:
        return;
    }

    await TablesService.updateTableStatus(order.tableId, newTableStatus, order.id);
    await createOrderLog(`Статус стола изменен: ${reason}`);
  } catch (error) {
    console.error('Ошибка обновления статуса стола:', error);
  }
};

// Вызываем при изменении статуса заказа
useEffect(() => {
  if (order?.tableId && restaurantData.useReservation) {
    updateTableStatusBasedOnOrder();
  }
}, [order?.status, order?.tableId, restaurantData?.useReservation]);


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
console.log(order)
    // Проверяем оплату
    if (order && order.payment && order.payment.status !== 'PAID' && calculateOrderTotal() > 0) {
      
      setShowPaymentDialog(true);
      setIsUpdating(false);
      return;
    }

    // Проверяем наличие пречека
    if (!order.attentionFlags.isPrecheck) {
      toast.error('Сначала необходимо сформировать пречек');
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
        if (order.tableId && restaurantData.useReservation) {
          await releaseTable(order.tableId, 'Заказ отменен');
        }


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
const handleReplaceItem = async () => {
  if (!order || !selectedItemForRefund || refundQuantity <= 0) return;

  try {
    setIsUpdating(true);
    const reasonTypeText = refundReasons.find(r => r.value === refundReasonType)?.label || '';
    const fullRefundReason = refundReason ? `${reasonTypeText}: ${refundReason}` : reasonTypeText;

    // Сначала возвращаем текущее блюдо
    const updatedOrder = await OrderService.partialRefundOrderItem(
      order.id,
      selectedItemForRefund.id,
      refundQuantity,
      fullRefundReason,
      user?.id
    );

    // Затем добавляем новое блюдо (замена)
    // Для замены создаем новый orderItem с ценой 0
    await OrderService.addItemToOrder(
      order.id,
      {
        productId: selectedItemForRefund.product.id,
        quantity: refundQuantity,
        additiveIds: selectedItemForRefund.additives.map(a => a.id),
        comment: `ЗАМЕНА: ${fullRefundReason || 'Без причины'}`,
        price: 0 // Цена 0 для замены
      }
    );

    // Обновляем заказ
    const refreshedOrder = await OrderService.getById(order.id);
    setOrder(refreshedOrder);

    await recalculateDiscount();
    await createOrderLog(
      `Замена: ${selectedItemForRefund.product.title} x ${refundQuantity} → добавлено новое блюдо (${fullRefundReason})`
    );

    toast.success(`Замена выполнена: ${refundQuantity} шт.`);

    // Закрываем диалог и сбрасываем состояния
    setShowRefundDialog(false);
    setRefundReason('');
    setRefundReasonType('');
    setRefundQuantity(1);
    setRefundMode('refund');

  } catch (error) {
    console.error('Error replacing item:', error);
    toast.error('Ошибка при замене блюда');
  } finally {
    setIsUpdating(false);
  }
};

    const handleRefundItem = async () => {
      if (!order) return;
      if (!selectedItemForRefund ) return;
      try {
        setIsUpdating(true);

        const reasonTypeText = refundReasons.find(r => r.value === refundReasonType)?.label || '';
        const fullRefundReason = refundReason ? `${reasonTypeText}: ${refundReason}` : reasonTypeText;

        const updatedOrder = await OrderService.refundItem(
          order.id,
          selectedItemForRefund.id,
          {
            reason: fullRefundReason,
            userId: user?.id
          }
        );
        setOrder(updatedOrder);

        await recalculateDiscount();

        await createOrderLog(`${t.logs.itemRefunded} : ${selectedItemForRefund.product.title} x ${selectedItemForRefund.quantity} (${fullRefundReason})`);

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
    type OrderTypes = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET';
    const getOrderType = (type: OrderTypes): string => {
    const translations: Record<OrderTypes, string> = {
      'DINE_IN': 'В ресторане',
      'TAKEAWAY': 'На вынос',
      'DELIVERY': 'Доставка',
      'BANQUET': 'Банкет'
    };
    
    return translations[type] || type;
  }


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
const pendingComboSelectionRef = useRef<ComboSelection | null>(null);

// Состояние для хранения выбранных опций комбо
const [pendingComboSelection, setPendingComboSelection] = useState<ComboSelection | null>(null);

// Map для быстрого доступа к comboItems по ID
const comboItemsMapRef = useRef<Record<string, ComboItem>>({});

// Обновляем map при загрузке комбо
useEffect(() => {
  if (products.length > 0) {
    const map: Record<string, ComboItem> = {};
    products.forEach(product => {
      if ((product as any).comboItems) {
        (product as any).comboItems.forEach((item: ComboItem) => {
          map[item.id] = item;
        });
      }
    });
    comboItemsMapRef.current = map;
  }
}, [products]);
const calculateComboTotalPrice = (product: Product, comboSelection: ComboSelection, comboItems: any[]): number => {
  let total = product.price; // Базовая цена комбо

  // Проходим по всем выбранным опциям
  Object.entries(comboSelection.selections).forEach(([comboItemId, selection]) => {
    // Находим соответствующий comboItem в product
    const comboItem = (product as any).comboItems?.find((item: any) => item.id === comboItemId);
    if (!comboItem) return;

    // Для каждого выбранного продукта в этой группе
    selection.selectedProducts.forEach(selected => {
      // Находим информацию о продукте в comboItem
      const comboProduct = comboItem.products?.find((p: any) => p.productId === selected.productId);
      if (comboProduct) {
        // Добавляем дополнительную стоимость за каждый выбранный продукт
        total += comboProduct.additionalPrice * selected.quantity;
      }
    });
  });

  return total;
};

const handleQuantityChange = useCallback(async (product: Product, newQuantity: number, additives: string[], comment: string, parentComboId?: string) => {

  if (!orderId || !isOrderEditable || !order || !getOrderItems()) return;

  // Защита от отрицательных значений
  if (newQuantity < 0) return;
  
  const key = `${product.id}-${JSON.stringify(additives.sort())}-${comment || ''}-${parentComboId || ''}`;

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
      item.parentComboId === parentComboId &&
      item.status === OrderItemStatus.CREATED
    );

    if (existingItem) {
      await OrderService.updateOrderItemQuantity(
        orderId as string,
        existingItem.id,
        newQuantity
      );
    } else {
      // Проверяем, является ли продукт комбо
      if (product.isCombo && pendingComboSelectionRef.current) {
        const comboSelection = pendingComboSelectionRef.current;
        const comboGroupId = `combo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Рассчитываем итоговую цену комбо
        const comboTotalPrice = calculateComboTotalPrice(product, comboSelection, (product as any).comboItems);
        
        // Создаем родительское комбо с рассчитанной ценой
        const mainOrderItem = await OrderService.addItemToOrder(
          orderId as string,
          {
            productId: product.id,
            quantity: newQuantity,
            additiveIds: [],
            comment: comboGroupId,
            price: comboTotalPrice // Передаем рассчитанную цену
          }
        );
        
        console.log('Родительский элемент создан с ценой:', comboTotalPrice, 'и comment:', comboGroupId);
        
        // Ждем немного, чтобы элемент точно появился в заказе
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Получаем актуальный заказ
        const currentOrder = await OrderService.getById(orderId as string);
        
        // Ищем родительский элемент по comment (не по ID!)
        const parentItem = currentOrder.items.find(item => 
          item.comment === comboGroupId && 
          item.product.id === product.id
        );
        
        if (!parentItem) {
          throw new Error('Родительский элемент не найден по comment');
        }
        
        console.log('Найден родительский элемент с реальным ID:', parentItem.id);
        
        // Используем найденный ID для дочерних элементов
        const childPromises = [];
        
        for (const [comboItemId, selection] of Object.entries(comboSelection.selections)) {
          for (const selectedProduct of selection.selectedProducts) {
            console.log('Добавление дочернего элемента с parentOrderItemId:', parentItem.id);
            
            childPromises.push(
              OrderService.addItemToOrder(
                orderId as string,
                {
                  productId: selectedProduct.productId,
                  quantity: selectedProduct.quantity * newQuantity,
                  additiveIds: [],
                  parentComboId: product.id,
                  parentOrderItemId: parentItem.id, // Используем ID из заказа
                  comment: comboGroupId,
                  price: 0 // Цена 0 для дочерних элементов
                }
              )
            );
          }
        }
        
        await Promise.all(childPromises);
        
        // Обновляем заказ
        const finalUpdatedOrder = await OrderService.getById(orderId as string);
        setOrder(finalUpdatedOrder);
        
        setPendingComboSelection(null);
        pendingComboSelectionRef.current = null;

      } else {
        // Обычный продукт
        await OrderService.addItemToOrder(
          orderId as string,
          {
            productId: product.id,
            quantity: newQuantity,
            additiveIds: additives,
            comment,
            parentComboId
          }
        );
        
        const finalUpdatedOrder = await OrderService.getById(orderId as string);
        setOrder(finalUpdatedOrder);
      }
    }

    await applyAutoDiscounts(order);
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
    console.error('Ошибка при обновлении заказа:', err);
    toast.error('Ошибка при обновлении заказа');
  } finally {
    scrollToBottom()

    setIsUpdating(false);
  }
}, 1000);

  setPendingAdditions(prev => ({
    ...prev,
    [key]: {
      quantity: newQuantity,
      additives,
      comment,
      parentComboId,
      timer,
    },
  }));
}, [orderId, isOrderEditable, order, getOrderItems]);

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

const getOrderHeader = () => {
  if (!order) return '';
  
  switch (order.type) {
    case 'DINE_IN':
      return `Стол ${order.tableNumber || '—'}`;
       case 'BANQUET':
      return `Стол ${order.tableNumber || '—'}`;
    default:
      return `Заказ ${order.number}`;
  }
};

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

      return <Badge variant={variant} className="text-xs w-1/2 2xl:w-1/4">{text}</Badge>;
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
parentComboId?: string
       comboItems?: ComboItem[];
        onComboSelect?: (selection: ComboSelection) => void
    }

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  additives,
  comment,
  quantity,
  onAdditivesChange,
  onQuantityChange,
  isOrderEditable,
  getProductPrice,
  comboItems,
  onComboSelect,
  parentComboId 
}) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showComboDialog, setShowComboDialog] = useState(false);
  const [pendingComboSelection, setPendingComboSelection] = useState<ComboSelection | null>(null);

  // Проверка переполнения текста
  useEffect(() => {
    const checkOverflow = () => {
      if (titleRef.current) {
        const element = titleRef.current;
        setIsOverflowing(element.scrollWidth > element.clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [product.title]);

  // Используем useRef для отслеживания монтирования
  const isMounted = useRef(false);
  
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleComboConfirm = (selection: ComboSelection) => {
    if (!isMounted.current) return;
    
    console.log('Combo selection saved:', selection);
    
    // Сохраняем выбранные опции
    if (onComboSelect) {
      onComboSelect(selection);
    }
    
    // После выбора комбо, увеличиваем количество
    onQuantityChange(quantity + 1);
  };

  const handleAddToOrder = () => {
    if (!isOrderEditable) return;
    
    if (product.isCombo && comboItems && comboItems.length > 0) {
      console.log('Opening combo dialog for:', product.title);
      setShowComboDialog(true);
    } else {
      onQuantityChange(quantity + 1);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (isMounted.current) {
      setShowComboDialog(open);
    }
  };

  // Мемоизируем пропсы для диалога, чтобы избежать лишних ререндеров
  const dialogProps = useMemo(() => ({
    open: showComboDialog,
    onOpenChange: handleDialogOpenChange,
    combo: product,
    comboItems: comboItems || [],
    onConfirm: handleComboConfirm,
    isOrderEditable
  }), [showComboDialog, product, comboItems, isOrderEditable]);

  return (
    <>
      <div className="group bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 hover:border-green-100 transition-all duration-200 flex flex-col h-full">
        {/* Изображение */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              width={280}
              height={280}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Utensils className="h-12 w-12 text-gray-300" />
            </div>
          )}
          
          {/* Бейдж с количеством */}
          {quantity > 0 && (
            <div className="absolute top-3 right-3 bg-green-500 text-white text-lg font-bold rounded-xl px-3 py-1.5 shadow-lg">
              {quantity} шт
            </div>
          )}
          
          <div className="absolute bottom-3 right-3 border-1 border-green-500 text-green-500 text-lg font-bold rounded-xl px-3 py-1.5 shadow-lg">
            {getProductPrice(product)} ₽
          </div>
          
          {/* Кнопка добавок (только для обычных продуктов) */}
          {!product.isCombo && product.additives && product.additives.length > 0 && (
            <div className="absolute top-3 left-3">
              <AdditivesDialog
                product={product}
                selectedAdditives={additives}
                onAdditivesChange={onAdditivesChange}
                disabled={!isOrderEditable}
              />
            </div>
          )}
        </div>
        
        {/* Контент */}
        <div className="p-4 flex flex-col flex-grow">
          <div className="mb-3 flex flex-col gap-2">
            <h3 
              ref={titleRef}
              className="text-xl font-bold text-gray-800 leading-tight break-words"
              title={isOverflowing ? product.title : undefined}
            >
              {product.title}
            </h3>
          </div>

          <div className="mt-auto pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="default"
                className="flex-1 h-11 text-base font-medium"
                onClick={() => {
                  const newQuantity = Math.max(0, quantity - 1);
                  onQuantityChange(newQuantity);
                }}
                disabled={quantity === 0 || !isOrderEditable}
              >
                <Minus className="h-5 w-5 mr-1" />
              </Button>

              <Button
                variant="outline"
                size="default"
                className="flex-1 h-11 text-base font-medium"
                onClick={handleAddToOrder}
                disabled={!isOrderEditable}
              >
                <Plus className="h-5 w-5 mr-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Диалог выбора комбо - рендерим только если есть comboItems */}
      {product.isCombo && comboItems && comboItems.length > 0 && (
        <ComboSelectionDialog {...dialogProps} />
      )}
    </>
  );
};


const ItemHistoryDialog = ({ item, open, onOpenChange }: { 
  item: OrderItem; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) => {
  const { language } = useLanguageStore();
    const t = translations[language as keyof typeof translations];

  const formatDate = (dateString?: any) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return format(date, 'PPpp', {
      locale: language === 'ru' ? ru : ka
    });
  };

  const getStatusText = (status: OrderItemStatus) => {
    const statusMap = {
      [OrderItemStatus.CREATED]: t.statusCreated,
      [OrderItemStatus.CONFIRMED]: language === 'ru' ? 'Подтвержден' : 'დადასტურებული',
      [OrderItemStatus.IN_PROGRESS]: t.statusPreparing,
      [OrderItemStatus.COMPLETED]: t.statusReady,
      [OrderItemStatus.REFUNDED]: t.itemReturned,
      [OrderItemStatus.CANCELLED]: t.statusCancelled,
      [OrderItemStatus.PARTIALLY_DONE]: 'Частично готов', 
      [OrderItemStatus.PAUSED]: 'Приостановлен', 
    };
    return statusMap[status] || status;
  };
  if (!item){
    return;
  
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <History className="h-5 w-5" />
            История блюда: {item.product.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Основная информация */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">{language === 'ru' ? 'Статус' : 'სტატუსი'}:</span>
              <Badge variant={
                item.status === OrderItemStatus.COMPLETED ? 'default' :
                item.status === OrderItemStatus.REFUNDED ? 'destructive' :
                item.status === OrderItemStatus.CREATED ? 'secondary' : 'outline'
              }>
                {getStatusText(item.status)}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">{language === 'ru' ? 'Количество' : 'რაოდენობა'}:</span>
              <span>{item.quantity} шт.</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">{language === 'ru' ? 'Цена' : 'ფასი'}:</span>
              <span className="font-bold text-green-600">
                {calculateItemPrice(item)} ₽
              </span>
            </div>
          </div>

          {/* Таймлайн событий */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{language === 'ru' ? 'Хронология' : 'ქრონოლოგია'}</h3>
            
            {/* Создание */}
            {item.timestamps?.createdAt && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{language === 'ru' ? 'Создан' : 'შექმნილია'}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(item.timestamps.createdAt)}</p>
                </div>
              </div>
            )}

            {/* Начало приготовления */}
            {item.timestamps?.startedAt && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Play className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{language === 'ru' ? 'Начато приготовление' : 'დაიწყო მომზადება'}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(item.timestamps.startedAt)}</p>
                  {item.startedBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.startedBy.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Завершение */}
            {item.timestamps?.completedAt && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{language === 'ru' ? 'Готово' : 'მზადაა'}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(item.timestamps.completedAt)}</p>
                  {item.completedBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.completedBy.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Приостановка */}
            {item.timestamps?.pausedAt && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Pause className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{language === 'ru' ? 'Приостановлено' : 'შეჩერებულია'}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(item.timestamps.pausedAt)}</p>
                  {item.pausedBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.pausedBy.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Возврат */}
            {item.timestamps?.refundedAt && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Undo className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{language === 'ru' ? 'Возврат' : 'დაბრუნება'}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(item.timestamps.refundedAt)}</p>
                  {item.refundedBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.refundedBy.name}
                    </p>
                  )}
                  {item.refundReason && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      {language === 'ru' ? 'Причина' : 'მიზეზი'}: {item.refundReason}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Дополнительная информация */}
          {(item.additives?.length > 0 || item.comment) && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-3">{language === 'ru' ? 'Дополнительно' : 'დამატებით'}</h3>
              
              {item.additives?.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {language === 'ru' ? 'Модификаторы' : 'დანამატები'}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.additives.map(additive => (
                      <Badge key={additive.id} variant="outline" className="text-xs">
                        {additive.title} (+{additive.price} ₽)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {item.comment && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {language === 'ru' ? 'Комментарий' : 'კომენტარი'}:
                  </p>
                  <p className="text-sm bg-muted/50 p-2 rounded">{item.comment}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === 'ru' ? 'Закрыть' : 'დახურვა'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
        OrderItemStatus.IN_PROGRESS, 
      ].includes(item.status) && isOrderEditable && !item.isRefund;

      return (
        <div className="mt-3 flex items-center justify-between border-t pt-3">
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
              (() => {
                const isBeforeKitchen = order?.status === 'CREATED';
                
                const isAfterKitchenButBeforePrecheck = 
                  order?.status === 'PREPARING' && 
                  item.status === OrderItemStatus.COMPLETED;
                
                const canKitchenStaffReturn = 
                  isAfterKitchenButBeforePrecheck && 
                  ['WAITER', 'CASHIER','MANAGER', 'SUPERVISOR'].includes(user.role);
                
                const isAfterPrecheck = order?.attentionFlags?.isPrecheck;
                const canManagerReturn = 
                  isAfterPrecheck && 
                  ['MANAGER', 'SUPERVISOR'].includes(user.role);
                
                const shouldShow = 
                  isBeforeKitchen || 
                  canKitchenStaffReturn || 
                  canManagerReturn;
                
                return shouldShow && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 2xl:h-11 2xl:w-11 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setSelectedItemForRefund(item);
                      setMaxRefundQuantity(item.quantity);
                      setRefundQuantity(1);
                      setShowRefundDialog(true);
                    }}
                    disabled={isUpdating}
                    title='Возврат'
                  >
                    <Undo className="h-4 w-4 2xl:h-5 2xl:w-5" />
                  </Button>
                );
              })()
            )}
          </div>
        </div>
      );
    };
const ItemCard = ({ item }: { item: OrderItem }) => {
  const [isComboExpanded, setIsComboExpanded] = useState(false);

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
  
  // Определяем, является ли элемент родительским комбо
  const isParentCombo = item.isComboParent || false;
  const isChildItem = !!item.parentOrderItemId;
  const canEditQuantity = item.status === OrderItemStatus.CREATED && isOrderEditable && !isParentCombo;
  
  // Находим дочерние элементы для родительского комбо
  const childItems = isParentCombo 
    ? getOrderItems().filter(childItem => childItem.parentOrderItemId === item.id && !childItem.isRefund)
    : [];
    
  const refundedChildItems = isParentCombo
    ? getOrderItems().filter(childItem => childItem.parentOrderItemId === item.id && childItem.isRefund)
    : [];
  
  const hasChildren = childItems.length > 0;
  const hasRefundedChildren = refundedChildItems.length > 0;
  
  // Подсчет общего количества блюд в комбо
  const totalComboItems = childItems.length + refundedChildItems.length;
  const activeComboItems = childItems.length;
  
  // Если это дочерний элемент комбо (не возвращенный), скрываем его
  if (isChildItem && !item.isRefund) {
    return null;
  }

  return (
    <Card
      key={item.id}
      className={`p-4 ${item.isReordered ? 'border-l-4 border-blue-500 dark:border-blue-400' : ''} ${
        item.isRefund ? 'bg-red-50 dark:bg-red-900/20' : 'bg-card'
      } ${isParentCombo ? 'border-2 border-purple-200 bg-purple-50/30' : ''}`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Кнопка сворачивания для комбо */}
            {isParentCombo && hasChildren && (
              <button
                onClick={() => setIsComboExpanded(!isComboExpanded)}
                className="flex-shrink-0 p-1 hover:bg-purple-100 rounded-md transition-colors flex items-center"
                title={isComboExpanded ? "Свернуть состав" : "Развернуть состав"}
              >
                {isComboExpanded ? (
                  <ChevronDown className="h-4 w-4 text-purple-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-purple-600" />
                )}
                {item.product.title}
              </button>
            )}
            {!isParentCombo && <h3 className="font-medium">
              {item.product.title}
            </h3>}
            {item.isReordered && (
              <Badge variant="secondary" className="text-xs">
                {t.reorderedItem}
              </Badge>
            )}
          </div>

          {/* Количество и цена */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm font-bold text-green-600">
              {calculateItemPrice(item)} ₽
            </p>
          </div>

          {item.product.restaurantPrices[0] && !canEditQuantity && !isParentCombo && (
            <p className="text-xs text-muted-foreground mt-1">
              {getProductPrice(item.product)} ₽ × {item.quantity}шт.
            </p>
          )}

          {item.timestamps.startedAt && cookingTime !== null && (
            <p className="text-xs text-muted-foreground mt-1">
              {item.timestamps.completedAt
                ? `${t.cookedIn} ${getCookingTimeText(cookingTime)}`
                : `${t.cookingFor} ${getCookingTimeText(cookingTime)}`}
            </p>
          )}

          <div className="mt-2 pl-4 border-l-2 border-muted">
            {item.additives.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <Plus className="h-3 w-3 mr-1" />
                {t.additives}: {item.additives.map(a => a.title).join(', ')}
              </div>
            )}
            {item.comment && !item.comment.startsWith('combo-') && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <MessageSquare className="h-3 w-3 mr-1" />
                {t.comment}: {item.comment}
              </div>
            )}
            {item.isRefund && item.refundReason && (
              <div className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {language === 'ru' ? 'Причина' : 'მიზეზი'}: {item.refundReason}
              </div>
            )}
          </div>
          
          {/* Дочерние элементы комбо - с анимацией сворачивания */}
          {hasChildren && (
            <div 
              className={`mt-3 pl-4 border-l-2 border-purple-200 space-y-2 overflow-hidden transition-all duration-300 ${
                isComboExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <p className="text-xs font-semibold text-purple-600 mb-1">В составе комбо:</p>
              {childItems.map(childItem => (
                <div key={childItem.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-700">{childItem.product.title}</span>
                  </div>
                  <span className="text-gray-500 text-xs">x{childItem.quantity}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Возвращенные дочерние элементы комбо - всегда видны */}
          {hasRefundedChildren && (
            <div className="mt-3 pl-4 border-l-2 border-red-200 space-y-2">
              <p className="text-xs font-semibold text-red-500 mb-1">Возвращенные блюда:</p>
              {refundedChildItems.map(childItem => (
                <div key={childItem.id} className="flex items-center justify-between text-sm opacity-70">
                  <div className="flex items-center gap-2">
                    <Undo className="h-3 w-3 text-red-500" />
                    <span className="text-gray-700 line-through">{childItem.product.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 text-xs">x{childItem.quantity}</span>
                    {childItem.refundReason && (
                      <span className="text-xs text-red-400" title={childItem.refundReason}>
                        ({childItem.refundReason})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <details className="text-sm text-muted-foreground mt-3">
        <summary className="cursor-pointer">{t.showLogs}</summary>
        <div className="mt-2 space-y-1">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-2" />
            {t.createdAt}: {new Date(item.timestamps.createdAt).toLocaleString()}
          </div>

          {item.timestamps.startedAt && (
            <div className="flex flex-col">
              <span className='flex items-center'>
                <Play className="h-3 w-3 mr-2" />
                {t.startedAt}: {new Date(item.timestamps.startedAt).toLocaleString()}
              </span>
              <span className='text-xs ml-5'>
                ({item.startedBy && item.startedBy.name})
              </span>
            </div>
          )}

          {item.timestamps.completedAt && (
            <div className="flex items-center">
              <Check className="h-3 w-3 mr-2" />
              {t.completedAt}: {new Date(item.timestamps.completedAt).toLocaleString()}
              {item.completedBy && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({language === 'ru' ? 'завершил' : 'დაასრულა'}: {item.completedBy.name})
                </span>
              )}
            </div>
          )}

          {item.timestamps.pausedAt && (
            <div className="flex items-center">
              <Pause className="h-3 w-3 mr-2" />
              {t.pausedAt}: {new Date(item.timestamps.pausedAt).toLocaleString()}
              {item.pausedBy && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({language === 'ru' ? 'приостановил' : 'შეაჩერა'}: {item.pausedBy.name})
                </span>
              )}
            </div>
          )}

          {item.timestamps.refundedAt && (
            <div className="flex items-center text-red-500 dark:text-red-400">
              <Undo className="h-3 w-3 mr-2" />
              {t.refundedAt}: {new Date(item.timestamps.refundedAt).toLocaleString()}
              {item.refundedBy && (
                <span className="ml-2 text-xs text-red-400">
                  ({language === 'ru' ? 'вернул' : 'დაბრუნება'}: {item.refundedBy.name})
                </span>
              )}
            </div>
          )}
        </div>
      </details>

      {/* Кнопки действий - outline как в compact */}
      <div className="mt-3 flex items-center justify-end gap-2 border-t pt-3">
         {canEditQuantity ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleQuantitItemChange(item, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-bold w-8 text-center">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleQuantitItemChange(item, item.quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <span className="text-sm font-medium text-gray-600">
                {item.quantity} шт.
              </span>
            )}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-600 hover:bg-gray-50"
          onClick={() => {
            setSelectedItemForHistory(item);
            setShowItemHistoryDialog(true);
          }}
          title="История"
        >
          <History className="h-4 w-4" />
        </Button>

        {/* Повтор (дозаказ) - не показываем для комбо */}
        {[
          OrderItemStatus.COMPLETED,
          OrderItemStatus.IN_PROGRESS,
          OrderItemStatus.CREATED,
        ].includes(item.status) && isOrderEditable && !item.isRefund && !isParentCombo && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
            onClick={() => handleReorderItem(item)}
            disabled={isUpdating}
            title="Повторить"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}

        {/* Возврат - показываем для комбо через отдельный диалог */}
        {['COMPLETED', 'DELIVERING', 'PREPARING', 'READY'].includes(order?.status || '') && !item.isRefund && (
          (() => {
            const isBeforeKitchen = order?.status === 'CREATED';
            
            const isAfterKitchenButBeforePrecheck = 
              order?.status === 'PREPARING' && 
              item.status === OrderItemStatus.COMPLETED;
            
            const canKitchenStaffReturn = 
              isAfterKitchenButBeforePrecheck && 
              ['WAITER', 'CASHIER','MANAGER', 'SUPERVISOR'].includes(user.role);
            
            const isAfterPrecheck = order?.attentionFlags?.isPrecheck;
            const canManagerReturn = 
              isAfterPrecheck && 
              ['MANAGER', 'SUPERVISOR'].includes(user.role);
            
            const shouldShow = 
              isBeforeKitchen || 
              canKitchenStaffReturn || 
              canManagerReturn;
            
            return shouldShow && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (isParentCombo && hasChildren) {
                    // Открываем диалог выбора блюд для возврата из комбо
                    prepareComboItemsForRefund(item);
                    setShowComboRefundDialog(true);
                  } else {
                    setSelectedItemForRefund(item);
                    setMaxRefundQuantity(item.quantity);
                    setRefundQuantity(1);
                    setShowRefundDialog(true);
                  }
                }}
                disabled={isUpdating || (!canManagerReturn && !isParentCombo)}
                title={isParentCombo ? 'Вернуть блюда из комбо' : 'Возврат'}
              >
                <Undo className="h-4 w-4" />
              </Button>
            );
          })()
        )}

        {/* Удаление - для CREATED позиций, включая комбо */}
        {item.status === OrderItemStatus.CREATED && isOrderEditable && !item.isRefund && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => handleQuantitItemChange(item, 0)}
            disabled={isUpdating}
            title="Удалить"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};


const CompactItemCard = ({ item }: { item: OrderItem }) => {
  const [isComboExpanded, setIsComboExpanded] = useState(false);

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

  const canRefund = ['COMPLETED', 'DELIVERING', 'PREPARING', 'READY'].includes(order?.status || '') && !item.isRefund;
  const canRefundItem = [
    OrderItemStatus.COMPLETED, OrderItemStatus.IN_PROGRESS,
  ].includes(item.status) && isOrderEditable && !item.isRefund;
  
  const isCooking = item.status === OrderItemStatus.IN_PROGRESS && item.timestamps.startedAt && !item.timestamps.completedAt;

  const isParentCombo = item.isComboParent || false;
  const isChildItem = !!item.parentOrderItemId;

  // Находим все дочерние элементы для этого родительского комбо (по parentOrderItemId)
  const childItems = isParentCombo 
    ? getOrderItems().filter(childItem => childItem.parentOrderItemId === item.id && !childItem.isRefund)
    : [];

  const refundedChildItems = isParentCombo
    ? getOrderItems().filter(childItem => childItem.parentOrderItemId === item.id && childItem.isRefund)
    : [];

  const hasChildren = childItems.length > 0;
  const hasRefundedChildren = refundedChildItems.length > 0;
  const allChildrenRefunded = isParentCombo && 
    childItems.length === 0 && 
    hasRefundedChildren;

  // Подсчет общего количества блюд в комбо (включая возвращенные)
  const totalComboItems = childItems.length + refundedChildItems.length;
  const activeComboItems = childItems.length;

  // ИЗМЕНЕНИЕ: Показываем дочерние элементы только если они возвращены
  // Игнорируем обычные дочерние элементы (не возвращенные)
  if (isChildItem && !item.isRefund) {
    return null;
  }

  return (
    <div
      key={item.id}
      className={`bg-white rounded-xl p-3 2xl:p-4 shadow-sm transition-all duration-300 relative
        ${item.isReordered ? 'border-l-4 border-blue-500' : ''} 
        ${item.isRefund ? 'border-l-4 border-red-500' : ''}
        ${isCooking ? 'shimmer-border' : 'border border-transparent'}
        ${isParentCombo ? 'border-2 border-purple-200 bg-purple-50/30' : ''}
        ${allChildrenRefunded ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-start gap-3 2xl:gap-4">
        {/* Изображение продукта */}
        <div className="flex-shrink-0 w-12 h-12 2xl:w-16 2xl:h-16 relative bg-gray-100 rounded-lg overflow-hidden">
          {item.product.images?.[0] ? (
            <img
              src={item.product.images[0]}
              alt={item.product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Utensils className="h-5 w-5 2xl:h-8 2xl:w-8 text-gray-400" />
            </div>
          )}
          {isParentCombo && (
            <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs px-1 rounded-bl-lg">
              Комбо
            </div>
          )}
        </div>

        {/* Основная информация */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            {/* Заголовок и цена */}
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {isParentCombo && hasChildren && (
                    <button
                      onClick={() => setIsComboExpanded(!isComboExpanded)}
                      className="flex-shrink-0 p-1 hover:bg-purple-100 rounded-md transition-colors flex"
                      title={isComboExpanded ? "Свернуть состав" : "Развернуть состав"}
                    >
                      {isComboExpanded ? (
                        <ChevronDown className="h-4 w-4 2xl:h-5 2xl:w-5 text-purple-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 2xl:h-5 2xl:w-5 text-purple-600" />
                      )}
                      <h3 className="font-bold text-sm 2xl:text-md xl:text-md truncate">
                    {item.product.title}
                  </h3>
                    </button>
                  )}
                   {!isParentCombo && <h3 className="font-bold text-sm 2xl:text-md xl:text-md truncate">
                    {item.product.title}
                  </h3>}
                </div>
                {!canEditQuantity && (
                  <span className="text-xs text-gray-500">x {item.quantity}</span>
                )}
              </div>
              <p className="text-md 2xl:text-lg font-bold whitespace-nowrap ml-2">
                {calculateItemPrice(item)} ₽
              </p>
            </div>

            {/* Дополнения и комментарии */}
            <div className="space-y-1 2xl:space-y-2">
              {item.additives.length > 0 && (
                <div className="text-xs 2xl:text-sm text-gray-600 flex items-start">
                  <Plus className="h-3 w-3 2xl:h-4 2xl:w-4 mr-1 2xl:mr-2 mt-0.5 flex-shrink-0" />
                  <span className="truncate">{item.additives.map(a => a.title).join(', ')}</span>
                </div>
              )}
              {item.comment && !item.comment.startsWith('combo-') && (
                <div className="text-xs 2xl:text-sm text-gray-600 flex items-start">
                  <MessageSquare className="h-3 w-3 2xl:h-4 2xl:w-4 mr-1 2xl:mr-2 mt-0.5 flex-shrink-0" />
                  <span className="truncate">{item.comment}</span>
                </div>
              )}
              {item.isRefund && item.refundReason && (
                <div className="text-xs 2xl:text-sm text-red-500 flex items-start">
                  <AlertCircle className="h-3 w-3 2xl:h-4 2xl:w-4 mr-1 2xl:mr-2 mt-0.5 flex-shrink-0" />
                  <span className="truncate">{item.refundReason}</span>
                </div>
              )}
            </div>

            {/* Дочерние элементы комбо (обычные, не возвращенные) - с анимацией сворачивания */}
            {hasChildren && (
              <div 
                className={`mt-3 pl-3 border-l-2 border-purple-200 space-y-2 overflow-hidden transition-all duration-300 ${
                  isComboExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {childItems.map(childItem => (
                  <div key={childItem.id} className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                      <Package className="h-3 w-3 text-gray-500" />
                    </div>
                    <span className="text-gray-700 flex-1">{childItem.product.title}</span>
                    <span className="text-gray-500 text-xs">x{childItem.quantity}</span>
                    {canRefund && canRefundItem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setSelectedItemForRefund(childItem);
                          setMaxRefundQuantity(childItem.quantity);
                          setRefundQuantity(1);
                          setShowRefundDialog(true);
                        }}
                        disabled={isUpdating}
                        title="Вернуть это блюдо"
                      >
                        <Undo className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Дочерние элементы комбо (возвращенные) - всегда видны, не сворачиваются */}
            {hasRefundedChildren && (
              <div className="mt-3 pl-3 border-l-2 border-red-200 space-y-2">
                <p className="text-xs font-semibold text-red-500 mb-1">Возвращенные блюда:</p>
                {refundedChildItems.map(childItem => (
                  <div key={childItem.id} className="flex items-center gap-2 text-sm opacity-70">
                    <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
                      <Undo className="h-3 w-3 text-red-500" />
                    </div>
                    <span className="text-gray-700 flex-1 line-through">{childItem.product.title}</span>
                    <span className="text-red-500 text-xs">x{childItem.quantity}</span>
                    {childItem.refundReason && (
                      <span className="text-xs text-red-400 truncate max-w-[100px]" title={childItem.refundReason}>
                        ({childItem.refundReason})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Статус и элементы управления */}
            <div className="flex items-center justify-between gap-2 mt-3 ">
              {/* Время приготовления или счетчик */}
              <div className="flex min-w-0">
                {canEditQuantity && !isParentCombo ? (
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 2xl:h-11 2xl:w-11 p-0"
                      onClick={() => handleQuantitItemChange(item, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4 2xl:h-5 2xl:w-5" />
                    </Button>
                    <span className="text-lg 2xl:text-xl font-bold w-6 2xl:w-10 text-center">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 2xl:h-11 2xl:w-11 p-0"
                      onClick={() => handleQuantitItemChange(item, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4 2xl:h-5 2xl:w-5" />
                    </Button>
                  </div>
                ) : (
                  item.timestamps.startedAt && cookingTime !== null && (
                    <p className="text-xs 2xl:text-sm text-gray-600 text-right whitespace-nowrap">
                      {item.timestamps.completedAt
                        ? `${t.cookedIn} ${getCookingTimeText(cookingTime)}`
                        : `${t.cookingFor} ${getCookingTimeText(cookingTime)}`}
                    </p>
                  )
                )}
              </div>

              {/* Кнопки действий */}
              <div className="flex items-center gap-1 2xl:gap-3 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 2xl:h-11 2xl:w-11 p-0 text-gray-500 hover:text-gray-600 hover:bg-gray-50"
                  onClick={() => {
                    setSelectedItemForHistory(item);
                    setShowItemHistoryDialog(true);
                  }}
                >
                  <History className="h-4 w-4 2xl:h-5 2xl:w-5" />
                </Button>

                {canReorder && !isParentCombo && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 2xl:h-11 2xl:w-11 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => handleReorderItem(item)}
                    disabled={isUpdating}
                    title="Повторить"
                  >
                    <RefreshCw className="h-4 w-4 2xl:h-5 2xl:w-5" />
                  </Button>
                )}

   
            {!item.isRefund && !isParentCombo && (
  (() => {
    // Возврат для блюд в статусе CREATED (можно вернуть до отправки на кухню)
    const isBeforeKitchen = order?.status === 'CREATED' && 
                            item.status === OrderItemStatus.CREATED;
    
    // Возврат для блюд в статусе IN_PROGRESS (готовится) или COMPLETED (готов)
    // для заказа в статусе PREPARING (до пречека)
    const isDuringCooking = 
      order?.status === 'PREPARING' && 
      !order?.attentionFlags?.isPrecheck &&
      (item.status === OrderItemStatus.IN_PROGRESS || 
       item.status === OrderItemStatus.COMPLETED);
    
    // Возврат для блюд в статусе COMPLETED после пречека (только менеджеры)
    const isAfterPrecheck = 
      order?.attentionFlags?.isPrecheck && 
      item.status === OrderItemStatus.COMPLETED &&
      ['MANAGER', 'SUPERVISOR'].includes(user.role);
    
    // Обычные официанты могут возвращать:
    // 1. Блюда до отправки на кухню (CREATED)
    // 2. Блюда во время готовки (IN_PROGRESS) до пречека
    const canWaiterReturn = (isBeforeKitchen || isDuringCooking) && 
                            ['WAITER', 'CASHIER', 'MANAGER', 'SUPERVISOR'].includes(user.role);
    
    // Менеджеры могут возвращать в любых случаях
    const canManagerReturn = isAfterPrecheck;
    
    const shouldShow = canWaiterReturn || canManagerReturn;
    
    return shouldShow && (
      <Button
        variant="outline"
        size="sm"
        className="h-9 w-9 2xl:h-11 2xl:w-11 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={() => {
          if (isParentCombo && hasChildren) {
            setSelectedItemForRefund(item);
            setShowComboRefundDialog(true);
          } else {
            setSelectedItemForRefund(item);
            setMaxRefundQuantity(item.quantity);
            setRefundQuantity(1);
            setShowRefundDialog(true);
          }
        }}
        disabled={isUpdating}
        title="Возврат"
      >
        <Undo className="h-4 w-4 2xl:h-5 2xl:w-5" />
      </Button>
    );
  })()
)}

                {/* Удаление - только для CREATED позиций */}
                {canEditQuantity && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 2xl:h-11 2xl:w-11 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleQuantitItemChange(item, 0)}
                    disabled={isUpdating}
                    title="Удалить"
                  >
                    <X className="h-4 w-4 2xl:h-5 2xl:w-5" />
                  </Button>
                )}
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

  const sortedLogs = [...logs].sort((a, b) => {
  const dateA = new Date(a.createdAt).getTime();
  const dateB = new Date(b.createdAt).getTime();
  return dateA - dateB; // от старых к новым
});

  return (
    <div>
      {sortedLogs.map((log) => (
        log.userName && <div key={log.id} className="mb-4 pb-2 px-2 last:pb-0 border-b-1">
          <div className="flex items-start">
            <div className="flex-1 flex justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="ext-center">
                  {log.userName}, {formatDate(log.createdAt)}
                </div>
                <div className="font-bold text-lg">{log.action}</div>
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
              <div className="space-y-3 ">
                <Label className="text-lg font-semibold">{t.enterDiscountCode}</Label>
                <div className="flex items-center gap-3 flex-col 2xl:flex-row">
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
                    className="h-12 px-6 w-full 2xl:w-1/5"
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
                <div className="flex items-center gap-3 flex-col 2xl:flex-row">
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
                    className="h-12 px-6 w-full 2xl:w-1/5"
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-full sm:flex-1">
          <Select
            value={filterOrderAdditiveType}
            onValueChange={setFilterOrderAdditiveType}
          >
            <SelectTrigger className='w-full h-12 text-base sm:text-lg'>
              <SelectValue placeholder={t.filterByType} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-base sm:text-lg py-3">{t.allTypes}</SelectItem>
              <SelectItem value={OrderAdditiveType.FIXED} className="text-base sm:text-lg py-3">
                {t.orderAdditiveTypes.FIXED}
              </SelectItem>
              <SelectItem value={OrderAdditiveType.PER_PERSON} className="text-base sm:text-lg py-3">
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
             <div 
  key={additive.id} 
  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border border-gray-200 rounded-xl hover:bg-gray-50/50 transition-all duration-200 hover:shadow-sm gap-3 sm:gap-4"
>
  {/* Левая часть - контент */}
  <div className="w-full sm:w-auto sm:flex-1">
    <p className="font-semibold text-gray-900 text-base sm:text-lg mb-2 sm:mb-3">
      {additive.title}
    </p>
    
    <div className="flex flex-wrap items-center gap-2">
      {/* Бейдж с ценой */}
      <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
        <span className="text-emerald-700 font-medium text-sm">
          {additive.price} ₽
        </span>
      </div>
      
      {/* Бейдж с типом */}
      <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
        <span className="text-blue-700 font-medium text-sm">
          {t.orderAdditiveTypes[additive.type] || additive.type}
        </span>
      </div>
    </div>
  </div>
  
  {/* Правая часть - кнопка */}
  <div className="w-full sm:w-auto self-stretch sm:self-center">
    <Button
      size="lg"
      variant="outline"
      onClick={() => {
        setSelectedOrderAdditive(additive.id);
        handleAddOrderAdditive();
      }}
      disabled={!isOrderEditable || isUpdating}
      className="h-12 w-full sm:w-12 sm:h-12 p-0 sm:p-0 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors"
      title={t.addOrderAdditive}
    >
      {/* На мобильных показываем текст, на десктопе только иконку */}
      <div className="flex items-center justify-center sm:justify-center w-full">
        <Plus className="h-5 w-5" />
        <span className="ml-2 sm:hidden">
          {t.addOrderAdditive}
        </span>
      </div>
    </Button>
  </div>
</div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-600 text-base sm:text-lg">
          {t.noOrderAdditives}
        </div>
      )}

      {/* Текущие модификаторы */}
      {orderAdditives.length > 0 && (
        <div className="space-y-6">
          <h4 className="font-bold text-xl sm:text-2xl">{t.currentOrderAdditives}</h4>
          <div className="space-y-4">
            
            {orderAdditives.map(additive => (
             <div 
  key={additive.id} 
  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border border-gray-200 rounded-xl hover:bg-gray-50/50 transition-all duration-200 hover:shadow-sm gap-3 sm:gap-4"
>
  {/* Левая часть - контент */}
  <div className="w-full sm:w-auto sm:flex-1">
    <p className="font-semibold text-gray-900 text-base sm:text-lg mb-2 sm:mb-3">
      {additive.title}
    </p>
    
    <div className="flex flex-wrap items-center gap-2">
      {/* Бейдж с ценой */}
      <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
        <span className="text-emerald-700 font-medium text-sm">
          {calculateAdditivePrice(additive)} ₽
        </span>
      </div>
      
      {/* Бейдж с типом */}
      <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
        <span className="text-blue-700 font-medium text-sm">
          {t.orderAdditiveTypes[additive.type] || additive.type}
        </span>
      </div>

      {/* Бейдж "на человека" */}
      {additive.type === OrderAdditiveType.PER_PERSON && (
        <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
          <span className="text-indigo-700 font-medium text-sm">
            {t.applyPerPerson}
          </span>
        </div>
      )}
    </div>
  </div>
  
  {/* Правая часть - управление количеством */}
  <div className="w-full sm:w-auto self-stretch sm:self-center">
    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full">
      {/* Управление количеством */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="lg"
          className="h-10 w-10 p-0 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors"
          onClick={() => handleUpdateOrderAdditiveQuantity(
            additive.id,
            (additive.quantity || 1) - 1
          )}
          disabled={!isOrderEditable || (additive.quantity || 1) <= 1}
          title="+"
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <div className="w-10 flex items-center justify-center">
          <span className="font-bold text-lg text-gray-900">
            {additive.quantity || 1}
          </span>
        </div>
        
        <Button
          variant="outline"
          size="lg"
          className="h-10 w-10 p-0 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors"
          onClick={() => handleUpdateOrderAdditiveQuantity(
            additive.id,
            (additive.quantity || 1) + 1
          )}
          disabled={!isOrderEditable}
          title="-"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Кнопка удаления */}
         <Button
          variant="outline"
          size="lg"
          className="h-10 w-10 p-0 border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
        
          onClick={() => handleRemoveOrderAdditive(additive.id)}
        disabled={!isOrderEditable}
          title="-"
        >
          <X className="h-4 w-4" />
        </Button>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <span className="font-bold text-lg sm:text-xl">{t.orderAdditives}:</span>
            <span className="text-xl sm:text-2xl font-bold text-green-600">
              {calculateTotalOrderAdditivesPrice()} ₽
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const renderCategoryCards = () => {
  const displayCategories = getDisplayCategories();
  const displayProducts = searchQuery ? searchResults : getDisplayProducts();

  return (
    <div className="space-y-6">
      {/* Поиск */}
      <SearchInput />
      
      {/* Показываем результаты поиска */}
      {searchQuery && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">
              Результаты поиска
              {searchResults.length > 0 && ` (${searchResults.length})`}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="h-8 text-sm"
            >
              Очистить
            </Button>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">
              Продукты не найдены
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {searchResults.map((product) => {
                const additives = productAdditives[product.id] || []
                const comment = productComments[product.id] || ''
                const quantity = getDisplayQuantity(product, additives, comment)
                const comboItems = (product as any).comboItems || [];

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
                    comboItems={comboItems}
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
          {/* Кнопка "Назад" - всегда показываем когда есть родительская категория */}
          {(categoryNavigation.parentCategory || categoryNavigation.breadcrumbs.length > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-6">
              <button
                onClick={handleBackToRoot}
                className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl border-2 border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Все категории</span>
              </button>
            </div>
          )}

          {/* Отображаем категории в виде сетки, если есть категории для показа */}
          {displayCategories.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {displayCategories.map((category) => {
                // Проверяем, является ли эта категория текущей (отображаются её товары)
                const isSelected = categoryNavigation.currentCategory?.id === category.id;
                // Или проверяем, является ли эта категория родительской (показываем подкатегории)
                const isParent = categoryNavigation.parentCategory?.id === category.id;
                
                return (
                  <button
                    onClick={() => handleCategoryClick(category)}
                    key={category.id}
                    className={`
                      flex items-center justify-center px-4 py-3 text-sm font-medium rounded-xl border-2 transition-all
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : isParent
                          ? 'border-purple-300 bg-purple-50 text-purple-700'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">{category.title}</span>
                 
                    {isParent && (
                      <ChevronRight className="h-4 w-4 ml-2 text-purple-500" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Сообщение когда нет категорий с товарами */}
          {displayCategories.length === 0 && !categoryNavigation.parentCategory && (
            <div className="text-center py-8 text-gray-500 text-sm">
              {t.noProductsFound}
            </div>
          )}

          {/* Товары отображаются когда выбрана конкретная категория или есть родительская категория */}
          {(categoryNavigation.currentCategory || categoryNavigation.parentCategory) && displayProducts.length > 0 && (
            <div className="mt-4">
              {categoryNavigation.currentCategory && (
                <h4 className="text-base font-semibold mb-3 text-gray-700 flex items-center gap-2">
                  <span>{categoryNavigation.currentCategory.title}</span>
                  
                </h4>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {displayProducts.map((product) => {
                  const additives = productAdditives[product.id] || []
                  const comment = productComments[product.id] || ''
                  const quantity = getDisplayQuantity(product, additives, comment)
                  const comboItems = (product as any).comboItems || [];

                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      additives={additives}
                      comment={comment}
                      quantity={quantity}
                      onAdditivesChange={(newAdditives) => {
                        handleAdditivesChange(product.id, newAdditives);
                        if (quantity > 0) {
                          handleQuantityChange(product, quantity, newAdditives, comment);
                        }
                      }}
                      onQuantityChange={(newQuantity) =>
                        handleQuantityChange(product, newQuantity, additives, comment)
                      }
                      isOrderEditable={isOrderEditable!}
                      getProductPrice={getProductPrice}
                      comboItems={comboItems}
                      onComboSelect={(selection) => {
                        setPendingComboSelection(selection);
                        pendingComboSelectionRef.current = selection;
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Сообщение когда выбрана категория но нет товаров */}
          {(categoryNavigation.currentCategory || categoryNavigation.parentCategory) && displayProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
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
            <Button onClick={() => handleRouteChange('/orders')} variant="outline">
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
          <Button onClick={() => handleRouteChange('/orders')} variant="outline">
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

  // Обновленная функция renderTotalWithButtons
const renderTotalWithButtons = () => {
  // Даже если правая колонка свернута, показываем кнопки в компактном виде
  if (isRightColCollapsed) {
    return (
      <div className="bg-white rounded-xl shadow-md p-3 flex items-center justify-between gap-2">
        <div className="text-sm font-medium">
          Итого: <span className="font-bold text-green-600">{calculateOrderTotal().toFixed(0)} ₽</span>
        </div>
        <div className="flex items-center gap-2">
          {order.status !== 'CANCELLED' && (
            <Button
              size="sm"
              disabled={isUpdating}
              onClick={handlePrecheck}
              variant={order.attentionFlags?.isPrecheck ? "default" : "outline"}
              className={`px-3 py-1 h-9 text-xs ${order.attentionFlags?.isPrecheck ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}`}
            >
              {isUpdating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : order.attentionFlags?.isPrecheck ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              {order.attentionFlags?.isPrecheck ? t.precheckFormed : t.formPrecheck}
            </Button>
          )}

          {getOrderItems().some(item => item.status === OrderItemStatus.CREATED) && (
            <Button
              size="sm"
              disabled={isUpdating || getOrderItems().length === 0}
              onClick={handleConfirmOrder}
              className="bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1 h-9 text-xs"
            >
              {isUpdating ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Check className="h-3 w-3 mr-1" />
              )}
              {order.scheduledAt ? 'Подтв.' : t.confirm}
            </Button>
          )}

          {order.status === 'CREATED' && (
            <Button
              size="sm"
              disabled={isUpdating}
              onClick={handleCancelOrder}
              className="bg-red-500 hover:bg-red-400 text-white px-3 py-1 h-9 text-xs"
            >
              {isUpdating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </Button>
          )}

          {(order.status === 'READY' && order.type != 'DELIVERY') && (
            <Button
              size="sm"
              disabled={
                isUpdating || 
                shiftLoading || 
                !order.attentionFlags.isPrecheck || 
                getOrderItems().some(item => 
                  item.status !== OrderItemStatus.COMPLETED && 
                  item.status !== OrderItemStatus.REFUNDED
                )
              }
              onClick={handleCalculateOrder}
              className={`px-3 py-1 h-9 text-xs ${
                getOrderItems().some(item => 
                  item.status !== OrderItemStatus.COMPLETED && 
                  item.status !== OrderItemStatus.REFUNDED
                )
                  ? 'hidden'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-white'
              }`}
            >
              {(isUpdating || shiftLoading) ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : getOrderItems().some(item => 
                  item.status !== OrderItemStatus.COMPLETED && 
                  item.status !== OrderItemStatus.REFUNDED
                ) ? (
                <Clock className="h-3 w-3" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
              <div className="bg-white rounded-2xl  shadow-lg flex-shrink-0">
  <div className="flex-col items-center justify-between mb-4">
    {(!((order.surcharges && order.surcharges.length > 0) || order.discountAmount > 0 || calculateTotalOrderAdditivesPrice() > 0)) && <div className="flex items-center gap-3">
      <Receipt className="h-6 w-6 text-green-600" />
      <h3 className="text-2xl font-bold">
        {t.total}: {calculateOrderTotal().toFixed(2)} ₽
      </h3>
    </div>
  }
    {((order.surcharges && order.surcharges.length > 0) || order.discountAmount > 0 || calculateTotalOrderAdditivesPrice() > 0) && (
      <Collapsible>
        <CollapsibleTrigger asChild>
          {/* Обернули заголовок в триггер */}
          <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center gap-3 flex-1">
              <Receipt className="h-6 w-6 text-green-600" />
              <h3 className="text-2xl font-bold">
                {t.total}: {calculateOrderTotal().toFixed(2)} ₽
              </h3>
            </div>
            <Button variant="ghost" size="lg" className="h-10 px-3">
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
        </CollapsibleTrigger>
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
      </Collapsible>
    )}
  </div>
  
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
          getOrderItems().some(item => 
            item.status !== OrderItemStatus.COMPLETED && 
            item.status !== OrderItemStatus.REFUNDED
          )
        }
        onClick={handleCalculateOrder}
        variant="default"
        className={`gap-3 w-full h-16 text-2xl font-bold shadow-lg hover:shadow-xl transition-shadow ${
          getOrderItems().some(item => 
            item.status !== OrderItemStatus.COMPLETED && 
            item.status !== OrderItemStatus.REFUNDED
          )
            ? 'hidden'
            : 'bg-emerald-500 hover:bg-emerald-400'
        }`}
      >
        {isUpdating || shiftLoading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : getOrderItems().some(item => 
            item.status !== OrderItemStatus.COMPLETED && 
            item.status !== OrderItemStatus.REFUNDED
          ) ? (
          <Clock className="h-6 w-6" />
        ) : (
          <CheckCircle className="h-6 w-6" />
        )}
        { t.calculate }
      </Button>
    )}
  </div>
</div>
  );
};

    
    return (
      <AccessCheck allowedRoles={['WAITER', 'MANAGER', 'SUPERVISOR', 'CASHIER']}>
        <div className='absolute top-0'>
          {/* Основная сетка */}
         <div className={`grid ${isRightColCollapsed ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1 lg:grid-cols-3' }  gap-8 h-[100vh] mt-0 pt-0 `}>
            {/* Левая колонка - Меню */}
            <div className={isRightColCollapsed ? 'lg:col-span-11' : 'lg:col-span-2'}>
              <div className="bg-white rounded-2xl shadow-lg sticky h-[100vh] flex flex-col">
                {/* Заголовок меню - sticky */}
                <div className="sticky top-0 z-10 bg-white border-b  pb-4  flex flex-col md:flex-row pt-4 md:pt-0 items-center justify-between">
                  <div className='flex flex-col  justify-center items-start gap-2'>
                <div className="flex-col justify-start items-center gap-1 ml-2">
                  <Button 
                    variant="outline" 
                    className="rounded-lg px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all w-full"
                    onClick={() => handleRouteChange('/orders')}
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="ml-2">Назад</span>
                  </Button>
                  
                  <div className="relative flex ml-4">
                    <button
                      className={`px-5 py-2 text-base font-medium transition-all relative ${
                        activeMenuTab === 'menu' 
                          ? 'text-blue-600' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => setActiveMenuTab('menu')}
                    >
                      <div className="flex items-center gap-2">
                        <Utensils className="h-5 w-5" />
                        <span>Меню</span>
                      </div>
                      {activeMenuTab === 'menu' && (
                        <motion.div 
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>
                    
                    <button
                      className={`px-5 py-2 text-base font-medium transition-all relative ${
                        activeMenuTab === 'order' 
                          ? 'text-blue-600' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      onClick={() => setActiveMenuTab('order')}
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        <span>Заказ</span>
                      </div>
                      {activeMenuTab === 'order' && (
                        <motion.div 
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>
                  </div>
                </div>
                    
                  </div>
                  <div className="flex gap-2 justify-cente text-center p-2 sm:p-3">
                  {order.type === 'DINE_IN' && (
                    <div
                      className={`flex flex-col items-center p-1 sm:p-2 2xl:p-3 rounded-lg ${order.tableNumber ? 'bg-blue-50 border-1 2xl:border-2 border-blue-200' : 'bg-gray-100'}`}
                      title={order.tableNumber ? `Стол ${order.tableNumber}` : 'Без стола'}
                    >
                      <div className="flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6">
                        <span className={`font-bold ${order.tableNumber ? 'text-blue-600' : 'text-gray-500'} text-sm sm:text-base`}>
                          {order.tableNumber || '—'}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold mt-1 hidden 2xl:block">Стол</span>
                    </div>
                  )}
                  
                  {/* Количество персон */}
                  <div
                    className={`flex flex-col items-center p-1 sm:p-2 2xl:p-3 rounded-lg ${order.numberOfPeople ? 'bg-green-50 border-1 2xl:border-2 border-green-200' : 'bg-gray-100'}`}
                    title={order.numberOfPeople ? `${order.numberOfPeople} персон` : ''}
                  >
                    <div className="flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6">
                      <span className={`font-bold ${order.numberOfPeople ? 'text-green-600' : 'text-gray-500'} text-sm sm:text-base`}>
                        {order.numberOfPeople || '—'}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold mt-1 hidden 2xl:block">Персон</span>
                  </div>

                  {/* Статус заказа */}
                  <div
                    className={`flex flex-col items-center p-1 sm:p-2 2xl:p-3 rounded-lg border-1 2xl:border-2 ${
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
                      <div className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center ${
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
                    <span className="text-xs sm:text-sm font-semibold mt-1 hidden 2xl:block">{statusTranslations[order.status]?.[language] || order.status}</span>
                  </div>

                  {/* Время создания */}
                  <div
                    className={`flex flex-col items-center p-1 sm:p-2 2xl:p-3 rounded-lg ${order.createdAt ? 'bg-orange-50 border-1 2xl:border-2 border-orange-200' : 'bg-gray-100'}`}
                    title={order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : ''}
                  >
                    <Clock className={`h-5 w-5 sm:h-6 sm:w-6 ${order.createdAt ? 'text-orange-600' : 'text-gray-500'}`} />
                    <span className="text-xs sm:text-sm font-semibold mt-1 hidden 2xl:block">
                      {order.createdAt ? format(new Date(order.createdAt), 'HH:mm') : '—'}
                    </span>
                  </div>
                  
                  <div
                    className={`flex flex-col items-center p-1 sm:p-2 2xl:p-3 rounded-lg ${order.attentionFlags?.isReordered ? 'bg-blue-50 border-1 2xl:border-2 border-blue-200' : 'bg-gray-100'}`}
                    title={order.attentionFlags?.isReordered ? t.reorder : ''}
                  >
                    <ShoppingBag
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${order.attentionFlags?.isReordered ? 'text-blue-600' : 'text-gray-500'}`}
                    />
                    <span className="text-xs sm:text-sm font-semibold mt-1 hidden 2xl:block">{t.reorder}</span>
                  </div>

                  <div
                    className={`flex flex-col items-center p-1 sm:p-2 2xl:p-3 rounded-lg ${order.attentionFlags?.hasDiscount ? 'bg-green-50 border-1 2xl:border-2 border-green-200' : 'bg-gray-100'}`}
                    title={order.attentionFlags?.hasDiscount ? t.discount : ''}
                  >
                    <Tag
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${order.attentionFlags?.hasDiscount ? 'text-green-600' : 'text-gray-500'}`}
                    />
                    <span className="text-xs sm:text-sm font-semibold mt-1 hidden 2xl:block">{t.discount}</span>
                  </div>

                  <div
                    className={`flex flex-col items-center p-1 sm:p-2 2xl:p-3 rounded-lg ${order.attentionFlags?.discountCanceled ? 'bg-red-50 border-1 2xl:border-2 border-red-200' : 'bg-gray-100'}`}
                    title={order.attentionFlags?.discountCanceled ? t.discountCanceled : ''}
                  >
                    <Ban
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${order.attentionFlags?.discountCanceled ? 'text-red-600' : 'text-gray-500'}`}
                    />
                    <span className="text-xs sm:text-sm font-semibold mt-1 hidden 2xl:block">{t.discountCanceled}</span>
                  </div>

                  <div
                    className={`flex flex-col items-center p-1 sm:p-2 2xl:p-3 rounded-lg ${order.attentionFlags?.isPrecheck ? 'bg-purple-50 border-1 2xl:border-2 border-purple-200' : 'bg-gray-100'}`}
                    title={order.attentionFlags?.isPrecheck ? t.precheck : ''}
                  >
                    <Receipt
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${order.attentionFlags?.isPrecheck ? 'text-purple-600' : 'text-gray-500'}`}
                    />
                    <span className="text-xs sm:text-sm font-semibold mt-1 hidden 2xl:block">{t.precheck}</span>
                  </div>

                  <div
                    className={`flex flex-col items-center p-1 sm:p-2 2xl:p-3 rounded-lg ${order.attentionFlags?.isRefund ? 'bg-orange-50 border-1 2xl:border-2 border-orange-200' : 'bg-gray-100'}`}
                    title={order.attentionFlags?.isRefund ? t.refund : ''}
                  >
                    <RefreshCw
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${order.attentionFlags?.isRefund ? 'text-orange-600' : 'text-gray-500'}`}
                    />
                    <span className="text-xs sm:text-sm font-semibold mt-1 hidden 2xl:block">{t.refund}</span>
                  </div>
                </div>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6 py-4 w-full">
  {activeMenuTab === 'menu' ? (
    <div className="space-y-6">
      {categories.length > 0 && products.length > 0 ? (
        renderCategoryCards()
      ) : (
        <div className="p-6 border-2 rounded-xl text-center text-lg">
          {t.noProductsFound}
        </div>
      )}
    </div>
  ) : (
    <div className="space-y-4 ">
      
      {order?.items?.length === 0 ? (
  <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
    <Package className="h-8 w-8 mb-2" />
    {t.emptyOrder}
  </div>
) : (
<div className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
    {getOrderItems()
      .filter(item => !item.isRefund)
      .map(item => <ItemCard key={item.id} item={item} />)}
  </div>

  {getOrderItems().some(item => item.isRefund) && (
    <div className="space-y-4 border-t pt-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Ban className="h-5 w-5" />
        {t.itemReturned}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-4">
        {getOrderItems()
          .filter(item => item.isRefund)
          .map(item => <ItemCard key={item.id} item={item} />)}
      </div>
    </div>
  )}
</div>
)}
    </div>
  )}
</div>
              </div>
              </div>

            {/* Правая колонка - Информация о заказе */}
          <div className={`h-[100vh] hidden lg:flex lg:flex-col w-full `}>
  {/* Карточка с табами - фиксированной высоты со скроллом */}
  <div className="bg-white rounded-2xl pb-4 shadow-lg flex-1 flex flex-col min-h-0  justify-between px-6 ">
    {!isRightColCollapsed && <h1 className={`text-xl md:text-2xl font-bold text-gray-900 py-4  ${isRightColCollapsed ? 'text-center': 'text-left'}`}>
  {getOrderHeader()}
</h1>
} 
    {/* Кастомная реализация табов */}
    <div className={`w-full flex flex-col flex-1 min-h-0 ${isRightColCollapsed ? 'pt-4 justify-center' : ''}`}>
      {/* Навигация табов */}
   <div className={`grid ${isRightColCollapsed ? 'grid-cols-1' : 'grid-cols-4 sm:grid-cols-6'} gap-2 mb-4 bg-white`}>
  <button 
    className={`aspect-square text-lg font-semibold flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all`}
    onClick={() => {setIsRightColCollapsed(!isRightColCollapsed); setActiveTab(isRightColCollapsed ? 'order' : null)}}
  >
    {!isRightColCollapsed ? <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> : <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"/>}
  </button>
  
  {[
    { id: 'order', icon: ShoppingCart, label: 'Заказ' },
    { id: 'history', icon: History, label: 'История' },
    { id: 'discount', icon: Tag, label: 'Скидки' },
    { id: 'additives', icon: PlusSquare, label: 'Добавки' },
    { id: 'info', icon: Info, label: 'Инфо' },
  ].map((tab) => (
    <button
      key={tab.id}
      onClick={() => {setActiveTab(tab.id); setIsRightColCollapsed(false) }}
      className={`aspect-square text-lg font-semibold flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all ${
        activeTab === tab.id
          ? 'border-blue-600 bg-blue-50 text-blue-700'
          : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 text-gray-700'
      }`}
    >
      <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
    </button>
  ))}
          { isRightColCollapsed &&  <button
              disabled={isUpdating}
              onClick={handlePrecheck}
              className={`aspect-square text-lg font-semibold flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all ${
                order.attentionFlags?.isPrecheck
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white hover:border-green-400 hover:bg-green-50'
              }`}
              title={order.attentionFlags?.isPrecheck ? t.precheckFormed : t.formPrecheck}
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 animate-spin" />
              ) : order.attentionFlags?.isPrecheck ? (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              ) : (
                <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              )}
            </button>
  }
            {/* 2. Рассчитать/Подтвердить */}
            {getOrderItems().some(item => item.status === OrderItemStatus.CREATED) &&  isRightColCollapsed && (
              <button
                disabled={isUpdating || getOrderItems().length === 0}
                onClick={handleConfirmOrder}
                className="aspect-square text-lg font-semibold flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all bg-emerald-500 hover:bg-emerald-400 text-white"
                title={order.scheduledAt ? 'Подтвердить' : t.confirm}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                )}
              </button>
            )}

            {/* 3. Отменить (только для статуса CREATED) */}
            {order.status === 'CREATED' && isRightColCollapsed && (
              <button
                disabled={isUpdating}
                onClick={handleCancelOrder}
                className="aspect-square text-lg font-semibold flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all bg-red-500 hover:bg-red-400 text-white"
                title={t.cancel}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 animate-spin" />
                ) : (
                  <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                )}
              </button>
            )}

            {/* 4. Рассчитать (для статуса READY) */}
            {(order.status === 'READY' && order.type !== 'DELIVERY') && isRightColCollapsed &&  (
              <button
                disabled={
                  isUpdating || 
                  shiftLoading || 
                  !order.attentionFlags.isPrecheck || 
                  getOrderItems().some(item => item.status !== OrderItemStatus.COMPLETED)
                }
                onClick={handleCalculateOrder}
                className={`aspect-square text-lg font-semibold flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 rounded-lg border-2 transition-all ${
                  getOrderItems().some(item => item.status !== OrderItemStatus.COMPLETED)
                    ? 'hidden'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                }`}
                title={t.calculate}
              >
                {(isUpdating || shiftLoading) ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 animate-spin" />
                ) : getOrderItems().some(item => item.status !== OrderItemStatus.COMPLETED) ? (
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                ) : (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                )}
              </button>
            )}

            {/* 5. Итого */}
           
</div>
      
      {/* Контент табов */}
      {!isRightColCollapsed &&
      <div className="flex-1 min-h-0">
        {/* Таб "Заказ" */}
 {activeTab === 'order' && (
  <div className="h-full relative">
    {/* Кастомный скролл контейнер */}
    <div 
      ref={setOrderItemsScrollRef}
      onScroll={checkScrollPosition}
      className="h-full overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9'
      }}
    >
      {/* Сначала обычные элементы (не комбо и не дочерние) */}
      {getOrderItems()
        .filter(item => 
          item.status !== OrderItemStatus.IN_PROGRESS && 
          !item.parentComboId // Исключаем дочерние элементы комбо
        )
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.timestamps?.createdAt).getTime();
          const dateB = new Date(b.createdAt || b.timestamps?.createdAt).getTime();
          return dateA - dateB;
        })
        .map(item => <CompactItemCard key={item.id} item={item} />)}
      
      {/* Затем готовящиеся позиции (IN_PROGRESS) в конце */}
      {getOrderItems()
        .filter(item => 
          item.status === OrderItemStatus.IN_PROGRESS && 
          !item.parentComboId // Исключаем дочерние элементы комбо
        )
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.timestamps?.createdAt).getTime();
          const dateB = new Date(b.createdAt || b.timestamps?.createdAt).getTime();
          return dateA - dateB;
        })
        .map(item => <CompactItemCard key={item.id} item={item} />)}
         {renderTotalWithButtons()}
    </div>
    
    
  </div>
)}
                
        {/* Таб "История" */}
        {activeTab === 'history' && (
          <div className="h-full overflow-y-auto">
            {renderLogs()}
          </div>
        )}
        
        {/* Таб "Скидки" */}
        {activeTab === 'discount' && (
          <div className="h-full overflow-y-auto">
            {renderDiscountsBlock()}
          </div>
        )}
        
        {/* Таб "Добавки" */}
        {activeTab === 'additives' && (
          <div className="h-full overflow-y-auto">
            {renderOrderAdditivesBlock()}
          </div>
        )}
        
        {/* Таб "Инфо" */}
        {activeTab === 'info' && (
          <div className="space-y-8">
          {/* Тип заказа */}
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
             {getOrderType(editFormData.type)}
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
                  className={`flex flex-col items-center justify-center  rounded-xl border-2  ${
                    editFormData.type === type.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50'
                  } ${!isOrderEditable ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className={`p-3 rounded-full items-center ${
                    editFormData.type === type.value
                      ? ' text-blue-600'
                      : ' text-gray-600'
                  }`}>
                    {type.icon}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Основная информация */}
          <div>
            <h2 className="text-2xl font-bold mb-6">
              Детали заказа
            </h2>
            
            <div className="flex flex-col 2xl:flex-row gap-6 mb-6">
              {editFormData.type === 'DINE_IN' && false && (
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
              
            </div>

                      {order.customerName}
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
        )}
      </div>
      }
    </div>
     { isRightColCollapsed && <div className=" text-lg font-semibold flex flex-col items-center justify-center ">
      Итого:
              <span className="text-lg font-bold ">
                <p>{calculateOrderTotal().toFixed(0)}₽</p>
              </span>
            </div>
  }
  </div>
  
</div>

<div className="fixed bottom-20 right-6 z-50 lg:hidden ">
        <Button
          onClick={() => setIsMobileSheetOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
          size="icon"
        >
          <ShoppingCart className="h-6 w-6" />
        </Button>
      </div>

      <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
        <MobileSheetContent className=" p-0" >
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center justify-between">
              <span>{getOrderHeader()}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileSheetOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Табы для мобильной версии */}
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'order', icon: ShoppingCart, label: 'Заказ' },
                { id: 'history', icon: History, label: 'История' },
                { id: 'discount', icon: Tag, label: 'Скидки' },
                { id: 'additives', icon: PlusSquare, label: 'Добавки' },
                { id: 'info', icon: Info, label: 'Инфо' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                </button>
              ))}
            </div>

            {/* Контент табов */}
            <div className="min-h-[300px]">
              {/* Таб "Заказ" */}
              {activeTab === 'order' && (
                <div className="space-y-4">
                  {getOrderItems()
                    .filter(item => item.status !== OrderItemStatus.IN_PROGRESS && !item.parentComboId)
                    .sort((a, b) => {
                      const dateA = new Date(a.createdAt || a.timestamps?.createdAt).getTime();
                      const dateB = new Date(b.createdAt || b.timestamps?.createdAt).getTime();
                      return dateA - dateB;
                    })
                    .map(item => <CompactItemCard key={item.id} item={item} />)}
                  
                  {getOrderItems()
                    .filter(item => item.status === OrderItemStatus.IN_PROGRESS && !item.parentComboId)
                    .sort((a, b) => {
                      const dateA = new Date(a.createdAt || a.timestamps?.createdAt).getTime();
                      const dateB = new Date(b.createdAt || b.timestamps?.createdAt).getTime();
                      return dateA - dateB;
                    })
                    .map(item => <CompactItemCard key={item.id} item={item} />)}
                  
                  {/* Компактная версия итоговой суммы и кнопок для мобилки */}
                  <div className="bg-white rounded-xl shadow-md p-3 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Итого:</span>
                      <span className="font-bold text-green-600 text-lg">{calculateOrderTotal().toFixed(0)} ₽</span>
                    </div>
                    
                    <div className="flex items-center gap-2 justify-end">
                      {order.status !== 'CANCELLED' && (
                        <Button
                          size="sm"
                          disabled={isUpdating}
                          onClick={handlePrecheck}
                          variant={order.attentionFlags?.isPrecheck ? "default" : "outline"}
                          className="flex-1 h-9 text-xs"
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : order.attentionFlags?.isPrecheck ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          {order.attentionFlags?.isPrecheck ? t.precheckFormed : t.formPrecheck}
                        </Button>
                      )}

                      {getOrderItems().some(item => item.status === OrderItemStatus.CREATED) && (
                        <Button
                          size="sm"
                          disabled={isUpdating || getOrderItems().length === 0}
                          onClick={handleConfirmOrder}
                          className="bg-emerald-500 hover:bg-emerald-400 text-white flex-1 h-9 text-xs"
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          {order.scheduledAt ? 'Подтв.' : t.confirm}({getOrderItems().filter(item => item.status === OrderItemStatus.CREATED).length})
                        </Button>
                      )}

                      {order.status === 'CREATED' && (
                        <Button
                          size="sm"
                          disabled={isUpdating}
                          onClick={handleCancelOrder}
                          className="bg-red-500 hover:bg-red-400 text-white flex-1 h-9 text-xs"
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </Button>
                      )}

                      {(order.status === 'READY' && order.type !== 'DELIVERY') && (
                        <Button
                          size="sm"
                          disabled={
                            isUpdating || 
                            shiftLoading || 
                            !order.attentionFlags.isPrecheck || 
                            getOrderItems().some(item => 
                              item.status !== OrderItemStatus.COMPLETED && 
                              item.status !== OrderItemStatus.REFUNDED
                            )
                          }
                          onClick={handleCalculateOrder}
                          className={`flex-1 h-9 text-xs ${
                            getOrderItems().some(item => 
                              item.status !== OrderItemStatus.COMPLETED && 
                              item.status !== OrderItemStatus.REFUNDED
                            )
                              ? 'hidden'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                          }`}
                        >
                          {(isUpdating || shiftLoading) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : getOrderItems().some(item => 
                              item.status !== OrderItemStatus.COMPLETED && 
                              item.status !== OrderItemStatus.REFUNDED
                            ) ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Таб "История" */}
              {activeTab === 'history' && (
                <div className="max-h-[60vh] overflow-y-auto">
                  {renderLogs()}
                </div>
              )}
              
              {/* Таб "Скидки" */}
              {activeTab === 'discount' && (
                <div className="max-h-[60vh] overflow-y-auto">
                  {renderDiscountsBlock()}
                </div>
              )}
              
              {/* Таб "Добавки" */}
              {activeTab === 'additives' && (
                <div className="max-h-[60vh] overflow-y-auto">
                  {renderOrderAdditivesBlock()}
                </div>
              )}
              
              {/* Таб "Инфо" */}
              {activeTab === 'info' && (
                <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                  {/* Тип заказа */}
                  <div>
                    <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                      {getOrderType(editFormData.type)}
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'DINE_IN', icon: <Utensils className="h-6 w-6" />, label: 'В ресторане' },
                        { value: 'TAKEAWAY', icon: <ShoppingBag className="h-6 w-6" />, label: 'Самовывоз' },
                        { value: 'DELIVERY', icon: <Truck className="h-6 w-6" />, label: 'Доставка' },
                        { value: 'BANQUET', icon: <Calendar className="h-6 w-6" />, label: 'Банкет' }
                      ].map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setEditFormData({
                            ...editFormData,
                            type: type.value as OrderType,
                            tableNumber: (type.value === 'TAKEAWAY' || type.value === 'DELIVERY') ? '0' : editFormData.tableNumber
                          })}
                          disabled={!isOrderEditable}
                          className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 ${
                            editFormData.type === type.value
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white'
                          } ${!isOrderEditable ? 'opacity-60' : ''}`}
                        >
                          {type.icon}
                          <span className="text-xs mt-1">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Количество людей */}
                  <div>
                    <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4" />
                      {t.persons}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10"
                        onClick={() => setEditFormData({
                          ...editFormData,
                          numberOfPeople: Math.max(1, editFormData.numberOfPeople - 1)
                        })}
                        disabled={!isOrderEditable}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={editFormData.numberOfPeople}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          numberOfPeople: parseInt(e.target.value) || 1
                        })}
                        disabled={!isOrderEditable}
                        className="h-10 text-center font-bold flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10"
                        onClick={() => setEditFormData({
                          ...editFormData,
                          numberOfPeople: editFormData.numberOfPeople + 1
                        })}
                        disabled={!isOrderEditable}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Комментарий */}
                  <div>
                    <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4" />
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
                      className="min-h-[80px] text-sm"
                    />
                  </div>

                  {/* Кнопка сохранения */}
                  {isOrderEditable && (
                    <Button
                      onClick={handleEditOrderSubmit}
                      disabled={isUpdating}
                      className="w-full h-10 text-sm"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      {t.saveChanges}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </MobileSheetContent>
      </Sheet>
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
          
        <AlertDialog open={showRefundDialog} onOpenChange={(open) => {
  setShowRefundDialog(open);
  if (!open) {
    // Сбрасываем режим при закрытии
    setRefundMode('refund');
    setRefundReasonType('');
    setRefundReason('');
  }
}}>
  <AlertDialogContent className="max-w-md">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-2xl">
        {refundMode === 'refund' ? t.refundItem : 'Замена блюда'}
      </AlertDialogTitle>
      <AlertDialogDescription className="text-lg">
        {selectedItemForRefund?.product.title} ({refundQuantity} шт.)
      </AlertDialogDescription>
    </AlertDialogHeader>

    <div className="space-y-6">
      {/* Переключатель режимов */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setRefundMode('refund')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            refundMode === 'refund'
              ? 'bg-white text-red-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Возврат
        </button>
        <button
          onClick={() => setRefundMode('replace')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            refundMode === 'replace'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Замена
        </button>
      </div>

      {/* Количество для возврата */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold">
          Количество:
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

      {/* Причина возврата/замены */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold">
          Причина {refundMode === 'refund' ? 'возврата' : 'замены'}
        </Label>
        <Select 
          value={refundReasonType} 
          onValueChange={(value) => setRefundReasonType(value as any)}
        >
          <SelectTrigger className="h-12 text-lg w-full">
            <SelectValue placeholder="Выберите причину" />
          </SelectTrigger>
          <SelectContent>
            {refundReasons.map(reason => (
              <SelectItem key={reason.value} value={reason.value} className="text-lg py-2">
                {reason.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Комментарий */}
      <div className="space-y-3">
        <Label className="text-lg font-semibold">
          Дополнительный комментарий
        </Label>
        <Textarea
          value={refundReason}
          onChange={(e) => setRefundReason(e.target.value)}
          placeholder={refundMode === 'refund' ? t.cookingError : "Например: Подать другое блюдо"}
          className="min-h-[100px] text-lg"
        />
      </div>

     
    </div>

    <AlertDialogFooter className="gap-3 mt-6">
      {refundQuantity < maxRefundQuantity && (
        <Button
          variant="outline"
          onClick={() => {
            setRefundQuantity(maxRefundQuantity);
          }}
          className="h-12 text-lg"
        >
          {refundMode === 'refund' ? 'Вернуть все' : 'Заменить все'}
        </Button>
      )}
      <AlertDialogCancel className="h-12 text-lg">
        {t.cancel}
      </AlertDialogCancel>
      <AlertDialogAction
        onClick={refundMode === 'refund' 
          ? (refundQuantity === maxRefundQuantity ? handleRefundItem : handlePartialRefund)
          : handleReplaceItem
        }
        disabled={!refundReasonType.trim() || isUpdating}
        className={`h-12 text-lg ${refundMode === 'replace' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
      >
        {isUpdating && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {refundMode === 'refund' 
          ? (refundQuantity === maxRefundQuantity ? t.confirmRefund : `Вернуть ${refundQuantity} шт.`)
          : `Подтвердить`
        }
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
        {t.calculate}
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

        <ItemHistoryDialog
            item={selectedItemForHistory!}
            open={showItemHistoryDialog}
            onOpenChange={setShowItemHistoryDialog}
          />
      </AccessCheck>
    );
  }


  interface AdditivesDialogProps {
  product: Product;
  selectedAdditives: string[];
  onAdditivesChange: (additives: string[]) => void;
  disabled?: boolean;
}

const AdditivesDialog: React.FC<AdditivesDialogProps> = ({
  product,
  selectedAdditives,
  onAdditivesChange,
  disabled
}) => {
  const [open, setOpen] = useState(false);
  const [localSelected, setLocalSelected] = useState<string[]>(selectedAdditives);

  const handleAdditiveToggle = (additiveId: string) => {
    setLocalSelected(prev => {
      if (prev.includes(additiveId)) {
        return prev.filter(id => id !== additiveId);
      } else {
        return [...prev, additiveId];
      }
    });
  };

  const handleSave = () => {
    onAdditivesChange(localSelected);
    setOpen(false);
  };

  const handleCancel = () => {
    setLocalSelected(selectedAdditives);
    setOpen(false);
  };

  if (!product.additives || product.additives.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button 
      variant="outline" 
      size="sm"
      className="absolute top-2 left-2 text-md font-bold rounded-lg h-8 w-8 flex items-center justify-center bg-white/90 backdrop-blur-sm"
      disabled={disabled}
    >
      <WandSparkles className="h-4 w-4" />
    </Button>
  </DialogTrigger>
  
  <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
    <DialogHeader className="shrink-0">
      <DialogTitle className="text-xl flex items-center gap-2">
        Добавки для {product.title}
      </DialogTitle>
    </DialogHeader>
    
    <div className="flex-1 overflow-y-auto py-4">
      <div className="space-y-4">
        {product.additives.map(additive => {
          const isSelected = localSelected.includes(additive.id);
          const price = additive.price;
          
          return (
            <div
              key={additive.id}
              className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleAdditiveToggle(additive.id)}
            >
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-semid">{additive.title}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">+{price} ₽</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>


    
    <DialogFooter className="shrink-0 gap-2 pt-4 border-t">
      <DialogClose asChild>
        <Button variant="outline" onClick={handleCancel}>
          Отмена
        </Button>
      </DialogClose>
      <Button onClick={handleSave}>
        Сохранить
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
  );
};




// Типы для комбо
interface ComboItem {
  id: string;
  type: 'STATIC' | 'CHOICE' | 'OPTIONAL';
  minSelect: number;
  maxSelect: number;
  groupName: string | null;
  sortOrder: number;
  products: ComboProduct[];
}

interface ComboProduct {
  id: string;
  comboItemId: string;
  productId: string;
  quantity: number;
  additionalPrice: number;
  allowMultiple: boolean;
  maxQuantity: number | null;
  sortOrder: number;
  product: Product;
}

interface ComboSelection {
  parentOrderItemId?: string; 
  comboId: string;
  selections: {
    [comboItemId: string]: {
      selectedProducts: Array<{
        productId: string;
        quantity: number;
      }>;
    };
  };
}

interface ComboSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  combo: Product;
  comboItems: ComboItem[];
  onConfirm: (selection: ComboSelection) => void;
  isOrderEditable: boolean;
}

const ComboSelectionDialog: React.FC<ComboSelectionDialogProps> = ({
  open,
  onOpenChange,
  combo,
  comboItems,
  onConfirm,
  isOrderEditable
}) => {
  // Используем useState для хранения выбранных опций
  const [selections, setSelections] = useState<ComboSelection['selections']>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  // Добавляем ref для хранения предыдущего выбора
  const previousSelectionRef = useRef<ComboSelection['selections'] | null>(null);

  // Сортируем элементы комбо
  const sortedItems = useMemo(() => 
    [...comboItems].sort((a, b) => a.sortOrder - b.sortOrder),
    [comboItems]
  );

  // Получаем текущий шаг
  const currentItem = sortedItems[currentStep];
  const isLastStep = currentStep === sortedItems.length - 1;

  // Проверяем, валиден ли текущий шаг
  const isCurrentStepValid = useMemo(() => {
    if (!currentItem) return false;
    
    // Для STATIC всегда валиден
    if (currentItem.type === 'STATIC') return true;
    
    // Для OPTIONAL всегда валиден (опционально)
    if (currentItem.type === 'OPTIONAL') return true;
    
    // Для CHOICE проверяем минимальное количество
    const selection = selections[currentItem.id];
    const count = selection?.selectedProducts.length || 0;
    return count >= currentItem.minSelect;
  }, [currentItem, selections]);

  // Инициализация при открытии
  useEffect(() => {
    if (open) {
      // Сначала пробуем восстановить предыдущий выбор
      if (previousSelectionRef.current && Object.keys(previousSelectionRef.current).length > 0) {
        // Проверяем, что предыдущий выбор все еще валиден (все группы существуют)
        const isValidPreviousSelection = Object.keys(previousSelectionRef.current).every(
          itemId => comboItems.some(item => item.id === itemId)
        );
        
        if (isValidPreviousSelection) {
          setSelections(previousSelectionRef.current);
          setValidationErrors({});
          setCurrentStep(0);
          setCompletedSteps(new Set());
          return;
        }
      }
      
      // Если нет предыдущего выбора или он невалиден, создаем начальный
      const initialSelections: ComboSelection['selections'] = {};
      
      comboItems.forEach(item => {
        if (item.type === 'STATIC') {
          // Для статических групп выбираем все продукты с указанным количеством
          initialSelections[item.id] = {
            selectedProducts: item.products.map(p => ({
              productId: p.productId,
              quantity: p.quantity
            }))
          };
        } else {
          // Для групп выбора (CHOICE и OPTIONAL) начинаем с пустого массива
          initialSelections[item.id] = {
            selectedProducts: []
          };
        }
      });
      
      setSelections(initialSelections);
      setValidationErrors({});
      setCurrentStep(0);
      setCompletedSteps(new Set());
    }
  }, [open, comboItems]);

  const handleProductSelect = (comboItemId: string, productId: string) => {
    const item = comboItems.find(i => i.id === comboItemId);
    if (!item || item.type === 'STATIC') return;

    const currentSelections = selections[comboItemId]?.selectedProducts || [];
    const selectedProductIds = currentSelections.map(sp => sp.productId);
    
    let newSelectedProducts = [...currentSelections];

    if (selectedProductIds.includes(productId)) {
      // Убираем продукт, если он уже выбран
      newSelectedProducts = newSelectedProducts.filter(sp => sp.productId !== productId);
    } else {
      // Проверяем лимит выбора ТОЛЬКО для CHOICE (не для OPTIONAL)
      if (item.type === 'CHOICE' && newSelectedProducts.length >= item.maxSelect) {
        setValidationErrors(prev => ({
          ...prev,
          [comboItemId]: `Можно выбрать не более ${item.maxSelect} позиций`
        }));
        
        // Сбрасываем ошибку через 3 секунды
        setTimeout(() => {
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[comboItemId];
            return newErrors;
          });
        }, 3000);
        
        return;
      }
      
      const comboProduct = item.products.find(p => p.productId === productId);
      if (comboProduct) {
        newSelectedProducts.push({
          productId,
          quantity: comboProduct.quantity || 1
        });
      }
    }

    // Очищаем ошибку валидации для этой группы, если она была
    if (validationErrors[comboItemId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[comboItemId];
        return newErrors;
      });
    }

    setSelections(prev => ({
      ...prev,
      [comboItemId]: {
        selectedProducts: newSelectedProducts
      }
    }));
  };

  const goToNextStep = () => {
    if (!isCurrentStepValid) return;
    
    // Отмечаем текущий шаг как завершенный
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    
    // Переходим к следующему шагу
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    // Проверяем, можно ли перейти к этому шагу (все предыдущие шаги должны быть завершены)
    let canNavigate = true;
    for (let i = 0; i < step; i++) {
      const item = sortedItems[i];
      if (item.type === 'CHOICE') {
        const selection = selections[item.id];
        const count = selection?.selectedProducts.length || 0;
        if (count < item.minSelect) {
          canNavigate = false;
          break;
        }
      }
    }
    
    if (canNavigate) {
      setCurrentStep(step);
    }
  };

  const validateSelections = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    comboItems.forEach(item => {
      // Валидация ТОЛЬКО для CHOICE (не для OPTIONAL)
      if (item.type !== 'CHOICE') return;

      const selection = selections[item.id];
      const count = selection?.selectedProducts.length || 0;

      if (count < item.minSelect) {
        errors[item.id] = `Выберите минимум ${item.minSelect} ${getPluralForm(item.minSelect)}`;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const getPluralForm = (count: number): string => {
    if (count === 1) return 'позицию';
    if (count >= 2 && count <= 4) return 'позиции';
    return 'позиций';
  };

  const handleConfirm = () => {
    if (!validateSelections()) return;

    console.log('Combo selection confirmed:', {
      comboId: combo.id,
      selections
    });

    // Сохраняем текущий выбор в ref перед подтверждением
    previousSelectionRef.current = selections;

    onConfirm({
      comboId: combo.id,
      selections
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    // При отмене сбрасываем состояние
    setSelections({});
    previousSelectionRef.current = null;
    setCurrentStep(0);
    setCompletedSteps(new Set());
    onOpenChange(false);
  };

  const calculateTotalPrice = (): number => {
    let total = combo.price;

    Object.entries(selections).forEach(([itemId, selection]) => {
      const item = comboItems.find(i => i.id === itemId);
      if (!item) return;

      selection.selectedProducts.forEach(selected => {
        const product = item.products.find(p => p.productId === selected.productId);
        if (product) {
          total += product.additionalPrice * selected.quantity;
        }
      });
    });

    return total;
  };

  const calculateItemTotal = (item: ComboItem): number => {
    const selection = selections[item.id];
    if (!selection) return 0;

    return selection.selectedProducts.reduce((sum, selected) => {
      const product = item.products.find(p => p.productId === selected.productId);
      if (product) {
        return sum + (product.additionalPrice * selected.quantity);
      }
      return sum;
    }, 0);
  };

  // Если диалог закрыт, не рендерим содержимое
  if (!open) return null;

  // Если нет элементов, показываем сообщение
  if (sortedItems.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ошибка</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-gray-600">
              Нет доступных элементов для выбора
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleCancel}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const selection = selections[currentItem.id];
  const selectedCount = selection?.selectedProducts.length || 0;
  const error = validationErrors[currentItem.id];
  const itemTotal = calculateItemTotal(currentItem);

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleCancel();
      } else {
        onOpenChange(true);
      }
    }}>
      <DialogContentExtraWide 
        className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl flex items-center gap-3">
            Выберите состав комбо: {combo.title}
          </DialogTitle>
        </DialogHeader>

        {/* Шаги навигации */}
     <div className="px-6 py-4 ">
  {/* Прогресс-бар */}
  <div >
    <div className="flex justify-between text-sm text-gray-500 mb-2">
      <span>Шаг {currentStep + 1} из {sortedItems.length}</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div 
        className="h-full bg-green-500 transition-all duration-300 ease-out rounded-full"
        style={{ width: `${((currentStep + 1) / sortedItems.length) * 100}%` }}
      />
    </div>
  </div>
  
 
</div>

        {/* Контент текущего шага */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">
                  {currentItem.groupName || (
                    currentItem.type === 'STATIC' ? 'В составе комбо' :
                    currentItem.type === 'CHOICE' ? 'На выбор' :
                    'Дополнительно'
                  )}
                </h3>
                {currentItem.type !== 'STATIC' && (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-500">
                      {currentItem.type === 'CHOICE' 
                        ? `Выберите от ${currentItem.minSelect} до ${currentItem.maxSelect} позиций`
                        : 'Можно добавить по желанию (необязательно)'
                      }
                    </p>
                    {selectedCount > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Выбрано: {selectedCount}
                      </Badge>
                    )}
                    {itemTotal > 0 && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        +{itemTotal} ₽
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentItem.products
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((comboProduct) => {
                  const product = comboProduct.product;
                  const isSelected = selection?.selectedProducts.some(
                    sp => sp.productId === comboProduct.productId
                  );
                  
                  // Проверяем доступность выбора
                  let isDisabled = false;
                  let disabledReason = '';
                  
                  if (currentItem.type === 'STATIC') {
                    isDisabled = true;
                  } else if (currentItem.type === 'CHOICE') {
                    if (!isSelected && selectedCount >= currentItem.maxSelect) {
                      isDisabled = true;
                      disabledReason = `Максимум ${currentItem.maxSelect} позиций`;
                    }
                  }
                  // Для OPTIONAL нет ограничений на максимальное количество

                  return (
                    <div
                      key={comboProduct.id}
                      className={`
                        relative rounded-xl border-2 transition-all cursor-pointer
                        ${currentItem.type === 'STATIC' ? 'border-green-200 bg-green-50/50 cursor-default' : ''}
                        ${isSelected ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 hover:border-green-300 hover:shadow-sm'}
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      onClick={() => !isDisabled && currentItem.type !== 'STATIC' && handleProductSelect(currentItem.id, comboProduct.productId)}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-5 w-5 text-green-500" />
                        </div>
                      )}
                      
                      {isDisabled && disabledReason && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 text-xs">
                            {disabledReason}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="p-4">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                            {product.images?.[0] ? (
                              <img 
                                src={product.images[0]} 
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Utensils className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-lg mb-1">
                              {product.title}
                            </h4>
                            
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {product.description || 'Без описания'}
                            </p>
                            
                            <div className="flex items-center justify-start">
                              {comboProduct.additionalPrice > 0 && (
                                <span className="font-bold text-green-600">
                                  +{comboProduct.additionalPrice} ₽
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Футер с навигацией */}
        <DialogFooter className="p-6 pt-4 ">
          <div className="flex items-center justify-between w-full">
            <div className="text-lg">
              <span className="text-gray-600">Итого за комбо:</span>
              <span className="font-bold text-2xl text-green-600 ml-3">
                {calculateTotalPrice()} ₽
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handleCancel}
                className="h-12 px-6 text-lg"
              >
                Отмена
              </Button>
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={goToPreviousStep}
                  className="h-12 px-6 text-lg"
                >
                  ← Назад
                </Button>
              )}
              {!isLastStep ? (
                <Button
                  size="lg"
                  onClick={goToNextStep}
                  disabled={!isCurrentStepValid}
                  className="h-12 px-6 text-lg"
                >
                  Далее →
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleConfirm}
                  disabled={!isOrderEditable || !isCurrentStepValid || Object.keys(validationErrors).length > 0}
                  className="h-12 px-6 text-lg"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Подтвердить выбор
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContentExtraWide>
    </Dialog>
  );
};


