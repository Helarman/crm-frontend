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
  Search
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

// Типы для навигации по категориям
interface CategoryNavigation {
  currentCategory: Category | null
  parentCategory: Category | null
  breadcrumbs: Category[]
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
      persons: "Количество персон",
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
      connection: {
        connected: "Соединение активно",
        disconnected: "Соединение потеряно",
        reconnecting: "Переподключение...",
        error: "Ошибка соединения"
      }
    },
    ka: {
      back: "უკან შეკვეთების სიაში",
      calculate: "გაანგარიშება",
      confirmCalculate: "დარწმუნებული ხართ, რომ გსურთ შეკვეთის გაანგარიშება?",
      menu: "მენიუ",
      additives: "დანამატები",
      comment: "კომენტარი",
      total: "სულ",
      paymentStatus: "გადახდის სტატუსი",
      paymentMethod: "გადახდის მეთოდი",
      orderType: "შეკვეთის ტიპი",
      table: "მაგიდა",
      persons: "პირების რაოდენობა",
      confirm: "დადასტურება",
      complete: "დასრულება",
      cancel: "გაუქმება",
      pending: "ელოდება გადახდას",
      paid: "გადახდილი",
      failed: "გადახდის შეცდომა",
      cash: "ნაღდი ფული",
      card: "ბარათი",
      online: "ონლაინ",
      orderNotFound: "შეკვეთა ვერ მოიძებნა",
      loadingError: "შეკვეთის ჩატვირთვა ვერ მოხერხდა",
      emptyOrder: "შეკვეთა ცარიელია",
      selectAdditives: "აირჩიეთ დანამატები...",
      searchAdditives: "დანამატების ძებნა...",
      noAdditivesFound: "დანამატები არ მოიძებნა",
      noProductsFound: "პროდუქტები ვერ მოიძებნა",
      saveChanges: "ცვლილებების შენახვა",
      saving: "ინახება...",
      orderHistory: "შეკვეთის ისტორია",
      noHistory: "ისტორია ცარიელია",
      confirmComplete: "დარწმუნებული ხართ, რომ გსურთ შეკვეთის დასრულება?",
      confirmCancel: "დარწმუნებული ხართ, რომ გსურთ შეკვეთის გაუქმება?",
      paymentRequired: "ჯერ გადახდა უნდა დაადასტუროთ",
      exitConfirmTitle: "გასვლის დადასტურება",
      exitConfirmMessage: "შეკვეთა ჯერ არ არის დადასტურებული. დარწმუნებული ხართ, რომ გსურთ გასვლა? დაუდასტურებელი შეკვეთები შეიძლება დაიკარგოს.",
      exitConfirmLeave: "გასვლა",
      precheckFormed: "პრეჩეკი ჩამოყალიბებულია",
      formPrecheck: "პრეჩეკის ფორმირება",
      refundItem: "კერძის დაბრუნება",
      refundReason: "დაბრუნების მიზეზი",
      confirmRefund: "დაბრუნების დადასტურება",
      reorderedItem: "დამატებითი შეკვეთა",
      itemReturned: "დაბრუნებულია",
      originalItems: "მთავარი შეკვეთა",
      orderDetails: "შეკვეთის დეტალები",
      statusCreated: "შექმნილია",
      statusPreparing: "მზადდება",
      statusReady: "მზადაა",
      statusDelivering: "იტანება",
      statusCompleted: "დასრულებულია",
      statusCancelled: "გაუქმებულია",
      showLogs: "შეკვეთის ისტორია",
      createdAt: "შექმნილია",
      startedAt: "დაწყებულია",
      completedAt: "დასრულებულია",
      pausedAt: "დაპაუზებულია",
      refundedAt: "დაბრუნებულია",
      surcharges: "დანამატები",
      deliveryAddress: "მიწოდების მისამართი",
      deliveryTime: "მიწოდების დრო",
      deliveryNotes: "მიწოდების შენიშვნები",
      reorder: "დამატებითი შეკვეთა",
      discount: "ფასდაკლება",
      discountCanceled: "ფასდაკლება გაუქმებულია",
      precheck: "პრეჩეკი",
      refund: "დაბრუნება",
      mainInfo: "ძირითადი ინფორმაცია",
      callBeforeArrival: "მაგალითად: დარეკეთ ჩამოსვლამდე",
      cookingError: "მაგალითად: მომზადების შეცდომა",
      confirmation: "დადასტურება",
      customerCode: "კლიენტის კოდი",
      enterCustomerCode: "შეიყვანეთ კლიენტის 4-ნიშნა კოდი",
      applyCustomer: "კლიენტის გამოყენება",
      customerApplied: "კლიენტი გამოყენებულია",
      customerNotFound: "კლიენტი ვერ მოიძებნა",
      customerDiscount: "პერსონალური ფასდაკლება",
      bonusPoints: "ბონუს ქულები",
      useBonusPoints: "ბონუს ქულების გამოყენება",
      pointsAvailable: "ხელმისაწვდომი ქულები",
      applyDiscount: "ფასდაკლების გამოყენება",
      removeCustomer: "კლიენტის წაშლა",
      customerInfo: "კლიენტის ინფორმაცია",
      phoneNumber: "ტელეფონი",
      personalDiscount: "პერსონალური ფასდაკლება",
      currentBonusPoints: "მიმდინარე ქულები",
      usePoints: "ქულების გამოყენება",
      pointsToUse: "გამოსაყენებელი ქულების რაოდენობა",
      maxPointsToUse: "მაქსიმუმ გამოსაყენებელი ქულები",
      applyPoints: "ქულების გამოყენება",
      removePoints: "ქულების გაუქმება",
      discountApplied: "ფასდაკლება გამოყენებულია",
      pointsApplied: "ქულები გამოყენებულია",
      cookedIn: 'მომზადდა',
      cookingFor: 'მზადდება',
      minutes: 'წუთში',
      minutesForm1: 'წუთი',
      minutesForm2: 'წუთი',
      minutesForm5: 'წუთი',
      backToCategories: "უკან კატეგორიებში",
      allCategories: "ყველა კატეგორია",
      subcategories: "ქვეკატეგორიები",
      noSubcategories: "ქვეკატეგორიები არ არის",
      logs: {
        orderCreated: "შეკვეთა შექმნილია",
        orderConfirmed: "შეკვეთა დადასტურებულია",
        orderCompleted: "შეკვეთა დასრულებულია",
        orderCancelled: "შეკვეთა გაუქმებულია",
        itemAdded: "კერძი დამატებული",
        itemRemoved: "კერძი წაშლილია",
        itemRefunded: "კერძი დაბრუნებულია",
        orderEdited: "შეკვეთა შეცვლილია",
        precheckPrinted: "პრეჩეკი დაბეჭდილია",
        sentToKitchen: "კულინარიაზე გაგზავნილია",
        readyForDelivery: "მზადაა გაცემისთვის",
        deliveryStarted: "მიწოდება დაწყებულია",
        reorderItems: "დამატებითი შეკვეთა გაკეთებულია",
        paymentCompleted: "გადახდა დასრულებულია",
        paymentFailed: "გადახდის შეცდომა",
        customerApplied: "კლიენტი გამოყენებულია შეკვეთაზე",
        customerRemoved: "კლიენტი წაშლილია შეკვეთიდან",
        discountApplied: "ფასდაკლება გამოყენებულია",
        pointsApplied: "ბონუს ქულები გამოყენებულია",
        pointsRemoved: "ბონუს ქულები გაუქმებულია"
      },
      discountCode: "პრომო კოდი",
      enterDiscountCode: "შეიყვანეთ პრომო კოდი",
      applyCode: "კოდის გამოყენება",
      discountRemoved: "ფასდაკლება წაშლილია",
      discountError: "ფასდაკლების გამოყენების შეცდომა",
      discountNotFound: "ფასდაკლება ვერ მოიძებნა",
      discountExpired: "ფასდაკლება ვადაგასულია",
      discountMinAmount: "ფასდაკლების მინიმალური ოდენობა: {amount} ₽",
      activeDiscounts: "აქტიური ფასდაკლებები",
      selectDiscount: "აირჩიეთ ფასდაკლება",
      noDiscountsAvailable: "ფასდაკლებები არ არის ხელმისაწვდომი",
      discountAmount: "ფასდაკლების ოდენობა",
      removeDiscount: "ფასდაკლების წაშლა",
      noDiscounts: "ფასდაკლებები არ არის",
      target: "გამოიყენება",
      period: "მოქმედების პერიოდი",
      unlimited: "შეუზღუდავი",
      promoCode: "პრომო კოდი",
      minOrder: "მინიმალური შეკვეთა",
      usesLeft: "დარჩენილი გამოყენება",
      discounts: {
        title: "აქტიური ფასდაკლებები",
        noDiscounts: "ფასდაკლებები არ არის",
        type: "ფასდაკლების ტიპი",
        value: "მნიშვნელობა",
        target: "გამოიყენება",
        minAmount: "მინ. შეკვეთის ოდენობა",
        period: "მოქმედების პერიოდი",
        promoCode: "პრომო კოდი",
        conditions: "პირობები",
        allItems: "ყველა პოზიცია",
        specificItems: "კონკრეტული პოზიციები",
        minOrder: "მინიმალური შეკვეთა",
        active: "აქტიური",
        expired: "ვადაგასული",
        unlimited: "შეუზღუდავი",
        usesLeft: "დარჩენილი გამოყენება"
      },
      discountTypes: {
        PERCENTAGE: "პროცენტული",
        FIXED: "ფიქსირებული"
      },
      discountTargets: {
        ALL: "მთელ შეკვეთაზე",
        RESTAURANT: "რესტორნზე",
        CATEGORY: "კატეგორიაზე",
        PRODUCT: "პროდუქტზე",
        ORDER_TYPE: "შეკვეთის ტიპის მიხედვით"
      },
      discountStatus: {
        ACTIVE: "აქტიური",
        INACTIVE: "არააქტიური",
        EXPIRED: "ვადაგასული"
      },
      connection: {
        connected: "კავშირი აქტიურია",
        disconnected: "კავშირი დაკარგულია",
        reconnecting: "ხელახლა დაკავშირება...",
        error: "კავშირის შეცდომა"
      }
    }
  } as const;

  const t = translations[language]; 
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

  const {
    isConnected: isWebSocketConnected,
    connectionError: webSocketError
  } = useOrderWebSocket({
    restaurantId: order?.restaurant?.id,
    orderId: orderId as string,
    onOrderUpdated: (updatedOrder: OrderResponse) => {
      console.log('🔄 WebSocket: Order updated received', updatedOrder);
      if (updatedOrder && updatedOrder.id === orderId) {
        const mergedOrder = mergeOrderStates(updatedOrder, orderRef.current);
        setOrder(mergedOrder);
        // Уберите toast чтобы не мешал при частых обновлениях
        console.log('Order updated via WebSocket');
      }
    },
    onOrderStatusUpdated: (updatedOrder: OrderResponse) => {
      console.log('📊 WebSocket: Order status updated received', updatedOrder);
      if (updatedOrder && updatedOrder.id === orderId) {
        const mergedOrder = mergeOrderStates(updatedOrder, orderRef.current);
        setOrder(mergedOrder);
        console.log('Order status updated via WebSocket');
      }
    },
    onOrderItemUpdated: (updatedOrder: OrderResponse, itemId: string) => {
      console.log('🍽️ WebSocket: Order item updated received', updatedOrder, itemId);
      if (updatedOrder && updatedOrder.id === orderId) {
        const mergedOrder = mergeOrderStates(updatedOrder, orderRef.current);
        setOrder(mergedOrder);
        console.log('Order item updated via WebSocket');
      }
    },
    onOrderModified: (updatedOrder: OrderResponse) => {
      console.log('✏️ WebSocket: Order modified received', updatedOrder);
      const mergedOrder = mergeOrderStates(updatedOrder, orderRef.current);
      setOrder(mergedOrder);
      console.log('Order modified via WebSocket');
    },
    onOrderDetailsUpdated: (updatedOrder: OrderResponse) => {
      console.log('📝 WebSocket: Order details updated received', updatedOrder);
      const mergedOrder = mergeOrderStates(updatedOrder, orderRef.current);
      setOrder(mergedOrder);
      console.log('Order details updated via WebSocket');
    },
    onError: (error: any) => {
      console.error('❌ WebSocket error:', error);
    },
    enabled: true
  });

  const isOrderEditable = order && !['DELIVERING', 'COMPLETED', 'CANCELLED'].includes(order.status);
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
      toast.error(language === 'ru'
        ? 'Ошибка загрузки скидок'
        : 'ფასდაკლებების ჩატვირთვის შეცდომა');
    } finally {
      setDiscountsLoading(false);
    }
  };

  useEffect(() => {
    if (order?.restaurant?.id) {
      fetchDiscounts();
    }
  }, [order?.restaurant?.id]);

  const recalculateDiscount = async () => {
    if (!orderId || !order?.customer) return;

    try {
      const updatedOrder = await OrderService.applyCustomerDiscount(orderId as string);
      setOrder(updatedOrder);
    } catch (error) {
      console.error('Ошибка при пересчете скидки:', error);
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
        `${language === 'ru' ? 'Изменено количество' : 'რაოდენობა შეიცვალა'}: ${item.product.title} → ${newQuantity}`
      );

      toast.success(language === 'ru' ? 'Количество обновлено' : 'რაოდენობა განახლდა');
    } catch (error) {
      toast.error(language === 'ru' ? 'Ошибка обновления' : 'განახლების შეცდომა');
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
        language === 'ru'
          ? `Возвращено ${refundQuantity} шт.`
          : `დაბრუნებულია ${refundQuantity} ცალი`
      );

      setShowPartialRefundDialog(false);
      setRefundReason('');
      setRefundQuantity(1);
    } catch (error) {
      toast.error(
        language === 'ru'
          ? 'Ошибка при возврате'
          : 'დაბრუნების შეცდომა'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuantitItemChange = async (item: OrderItem, newQuantity: number) => {
    if (!order || newQuantity < 0) return;

    try {
      setIsUpdating(true);

      if (newQuantity === 0) {
        await OrderService.removeItemFromOrder(order.id, item.id);
      } else {
        await OrderService.updateOrderItemQuantity(
          order.id,
          item.id,
          newQuantity,
          user?.id
        );
      }

      const updatedOrder = await OrderService.getById(order.id);
      setOrder(updatedOrder);

      await createOrderLog(
        newQuantity === 0
          ? `${t.logs.itemRemoved}: ${item.product.title}`
          : `${language === 'ru' ? 'Изменено количество' : 'რაოდენობა შეიცვალა'}: ${item.product.title} → ${newQuantity}`
      );

    } catch (error) {
      toast.error(
        language === 'ru'
          ? 'Ошибка изменения количества'
          : 'რაოდენობის შეცვლის შეცდომა'
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

      const updatedOrder = await OrderService.updateStatus(order.id, { status: 'PREPARING' });

       const createdItems = getOrderItems().filter(item => item.status === OrderItemStatus.CREATED);
    
      await Promise.all(
        createdItems.map(item =>
          OrderService.updateItemStatus(order.id, item.id, { status: OrderItemStatus.IN_PROGRESS })
        )
      );

      const refreshedOrder = await OrderService.getById(order.id);
      setOrder(refreshedOrder);

      await createOrderLog(t.logs.orderConfirmed);

      toast.success(language === 'ru' ? 'Заказ подтвержден' : 'შეკვეთა დადასტურებულია');
    } catch (error) {
      toast.error(language === 'ru'
        ? 'Ошибка подтверждения заказа'
        : 'შეკვეთის დადასტურების შეცდომა');
    } finally {
      setIsUpdating(false);
    }
  };

  const getCookingTimeText = (minutes: number, language: 'ru' | 'ka') => {
    if (language === 'ru') {
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
    } else {
      return `${minutes} ${t.minutes}`;
    }
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
    
    try {
      setIsUpdating(true);
      
      let currentShiftId = activeShiftId;
      if (!currentShiftId) {
        const shiftId = await checkAndCreateShift(order.restaurant.id);
        if (!shiftId) {
          toast.error(language === 'ka' ? 'არ არის აქტიური ცვლა' : 'Нет активной смены');
          return;
        }
        currentShiftId = shiftId;
      }

      // Привязываем заказ к смене
      if (currentShiftId) {
        await assignOrderToShift(order.id, currentShiftId);
      }
      
      const updatedOrder = await OrderService.updateStatus(order.id, { status: 'COMPLETED' });
      setOrder(updatedOrder);

      await createOrderLog(t.logs.orderCompleted);

      toast.success(language === 'ru' ? 'Заказ завершен' : 'შეკვეთა დასრულებულია');
      setShowCompleteDialog(false);
      setShowPaymentDialog(false);
    } catch (error) {
      toast.error(language === 'ru'
        ? 'Ошибка завершения заказа'
        : 'შეკვეთის დასრულების შეცდომა');
    } finally {
      setIsUpdating(false);
    }
  };  

  const handleCalculateOrder = async () => {
    if (!order) return;

    try {
      setIsUpdating(true);
      
      // Проверяем и создаем смену перед расчетом
      let currentShiftId = activeShiftId;
      
      if (!currentShiftId) {
        const shiftId = await checkAndCreateShift(order.restaurant.id);
        if (!shiftId) {
          toast.error(language === 'ka' ? 'არ არის აქტიური ცვლა' : 'Нет активной смены');
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
      toast.error(language === 'ka' ? 'შეკვეთის გაანგარიშების შეცდომა' : 'Ошибка расчета заказа');
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

      toast.success(language === 'ru' ? 'Заказ отменен' : 'შეკვეთა გაუქმებულია');
      setShowCancelDialog(false);
    } catch (error) {
      toast.error(language === 'ru'
        ? 'Ошибка отмены заказа'
        : 'შეკვეთის გაუქმების შეცდომა');
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

      toast.success(language === 'ru' ? 'Блюдо возвращено' : 'კერძი დაბრუნებულია');
      setShowRefundDialog(false);
      setRefundReason('');
    } catch (error) {
      toast.error(language === 'ru'
        ? 'Ошибка при возврате блюда'
        : 'კერძის დაბრუნების შეცდომა');
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

      toast.success(language === 'ru' ? 'Заказ обновлен' : 'შეკვეთა განახლდა');
      setShowEditForm(false);
    } catch (err) {
      toast.error(language === 'ru'
        ? 'Ошибка обновления заказа'
        : 'შეკვეთის განახლების შეცდომა');
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

      if (discount.minOrderAmount && calculateOrderTotal() < discount.minOrderAmount) {
        setPromoCodeError(t.discountMinAmount.replace('{amount}', discount.minOrderAmount.toString()));
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

  let total = itemsTotal + surchargesTotal;

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

      toast.success(
        language === 'ru'
          ? 'Дозаказ добавлен'
          : 'დამატებითი შეკვეთა დაემატა'
      );
    } catch (error) {
      toast.error(
        language === 'ru'
          ? 'Ошибка при дозаказе'
          : 'დამატებითი შეკვეთის შეცდომა'
      );
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
          ? `${language === 'ru' ? 'Обновлено количество' : 'რაოდენობა განახლდა'}: ${product.title} → ${newQuantity}`
          : `${t.logs.itemAdded}: ${product.title} x ${newQuantity}`
      );

      setPendingAdditions(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    } catch (err) {
      toast.error(language === 'ru' ? 'Ошибка при обновлении заказа' : 'შეკვეთის განახლების შეცდომა');
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
}, [orderId, isOrderEditable, language, order]);

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
      toast.error(language === 'ru'
        ? 'Ошибка при формировании пречека'
        : 'პრეჩეკის ფორმირების შეცდომა');
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
      const applicableDiscounts = activeDiscounts.filter(discount => {
        const now = new Date();
        const isActive = !discount.endDate || new Date(discount.endDate) > now;
        const meetsMinAmount = !discount.minOrderAmount ||
          calculateOrderTotal() >= discount.minOrderAmount;
        return isActive && meetsMinAmount;
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
      const customer = await CustomerService.getCustomerByShortCode(customerCode);

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

      toast.success(language === 'ru' ? 'Клиент удален из заказа' : 'კლიენტი წაშლილია შეკვეთიდან');
    } catch (error) {
      toast.error(language === 'ru'
        ? 'Ошибка при удалении клиента'
        : 'კლიენტის წაშლის შეცდომა');
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
      toast.error(language === 'ru'
        ? 'Ошибка при применении скидки'
        : 'ფასდაკლების გამოყენების შეცდომა');
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
      toast.error(language === 'ru'
        ? 'Ошибка при применении баллов'
        : 'ქულების გამოყენების შეცდომა');
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

      toast.success(language === 'ru' ? 'Баллы сброшены' : 'ქულები გაუქმებულია');
    } catch (error) {
      toast.error(language === 'ru'
        ? 'Ошибка при сбросе баллов'
        : 'ქულების გაუქმების შეცდომა');
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
    <div className="mb-6">
      <div className="relative">
        <Input
          ref={searchInputRef}
          type="text"
          placeholder={language === 'ru' ? "Поиск продуктов..." : "პროდუქტების ძებნა..."}
          value={searchQuery}
          onChange={handleInputChange}
          className="pl-10 pr-4 py-2 text-base"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
  t: any;
  language: 'ru' | 'ka';
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
  t,
  language
}) => {
  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden border hover:shadow-md transition-shadow flex flex-col h-full">
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
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Utensils className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <div className="mb-2">
            <h3 className="font-semibold text-lg">
              {product.title}
            </h3>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {getProductPrice(product)} ₽
            </p>
          </div>

          {product.additives && product.additives.length > 0 && (
            <div className="mb-3">
              <div className="text-sm font-medium text-muted-foreground mb-1">
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  const newQuantity = Math.max(0, quantity - 1)
                  onQuantityChange(newQuantity)
                }}
                disabled={quantity === 0 || !isOrderEditable}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-medium w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  const newQuantity = quantity + 1
                  onQuantityChange(newQuantity)
                }}
                disabled={!isOrderEditable}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-lg font-bold">
              {getProductPrice(product) * quantity} ₽
            </span>
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

    const canRefund = ['COMPLETED', 'DELIVERING', 'PREPARING'].includes(order.status) && !item.isRefund;

    const canRefundItem = [
      OrderItemStatus.COMPLETED,
      OrderItemStatus.IN_PROGRESS
    ].includes(item.status) && isOrderEditable && !item.isRefund;

    return (
      <div className="mt-3 flex items-center justify-between border-t pt-3">
        <div className="text-sm">
          {getStatusBadge(item.status)}
        </div>
        <div className="flex items-center flex-col gap-2">
          {canEditQuantity && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleQuantitItemChange(item, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-sm font-medium w-6 text-center">
                {item.quantity}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleQuantitItemChange(item, item.quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
          {canReorder && (
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-500 hover:text-blue-600"
              onClick={() => handleReorderItem(item)}
              disabled={isUpdating}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              {language === 'ru' ? 'Дозаказ' : 'დამატებითი შეკვეთა'}
            </Button>
          )}

          {canRefund && canRefundItem && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600"
              onClick={() => {
                setSelectedItemForRefund(item);
                setMaxRefundQuantity(item.quantity);
                setRefundQuantity(1);
                setShowRefundDialog(true);
              }}
              disabled={isUpdating}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              {language === 'ru' ? 'Вернуть' : 'დაბრუნება'}
            </Button>
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
      <Card
        key={item.id}
        className={`p-3 ${item.isReordered ? 'border-l-4 border-blue-500 dark:border-blue-400' : ''} ${item.isRefund ? 'bg-red-50 dark:bg-red-900/20' : 'bg-card'}`}
      >
        <div className="flex items-center gap-3">
          {/* Изображение продукта */}
          <div className="flex-shrink-0 w-16 h-16 relative">
            {item.product.image ? (
              <Image
                src={item.product.image}
                alt={item.product.title}
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded-md"
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                <Utensils className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Основная информация */}
          <div className="flex-1 min-w-0 items-center">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-sm truncate">
                    {item.product.title}
                  </h3>
                  {item.isReordered && (
                    <Badge variant="secondary" className="text-xs">
                      {t.reorderedItem}
                    </Badge>
                  )}
                </div>

                <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">
                  {calculateItemPrice(item)} ₽
                </p>

                {item.timestamps.startedAt && cookingTime !== null && (
                  <p className="text-xs text-muted-foreground mb-1">
                    {item.timestamps.completedAt
                      ? `${t.cookedIn} ${getCookingTimeText(cookingTime, language)}`
                      : `${t.cookingFor} ${getCookingTimeText(cookingTime, language)}`}
                  </p>
                )}

                {/* Дополнения и комментарии */}
                <div className="space-y-1">
                  {item.additives.length > 0 && (
                    <div className="text-xs text-muted-foreground flex items-start">
                      <Plus className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                      <span className="truncate">{item.additives.map(a => a.title).join(', ')}</span>
                    </div>
                  )}
                  {item.comment && (
                    <div className="text-xs text-muted-foreground flex items-start">
                      <MessageSquare className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                      <span className="truncate">{item.comment}</span>
                    </div>
                  )}
                  {item.isRefund && item.refundReason && (
                    <div className="text-xs text-red-500 dark:text-red-400 flex items-start">
                      <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                      <span className="truncate">{item.refundReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Правая часть - элементы управления */}
              <div className="flex items-center gap-3 flex-shrink-0 ">

                {/* Счетчик количества и кнопки */}
                <div className="flex items-center gap-3">
                  {/* Счетчик количества */}
                  <div className="flex-shrink-0">
                    {getStatusBadge(item.status)}
                  </div>
                  {canEditQuantity && (
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
                      <span className="text-lg font-semibold w-8 text-center">
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
                  )}

                  {/* Кнопки действий */}
                  <div className="flex items-center gap-2">
                    {/* Дозаказ */}
                    {canReorder && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleReorderItem(item)}
                        disabled={isUpdating}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Возврат */}
                    {canRefund && canRefundItem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setSelectedItemForRefund(item);
                          setMaxRefundQuantity(item.quantity);
                          setRefundQuantity(1);
                          setShowRefundDialog(true);
                        }}
                        disabled={isUpdating}
                      >
                        <Undo className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Удаление */}
                    {canEditQuantity && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleQuantitItemChange(item, 0)}
                        disabled={isUpdating}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderItemCard = (item: OrderItem) => {
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

    return (
      <Card
        key={item.id}
        className={`p-4 ${item.isReordered ? 'border-l-4 border-blue-500 dark:border-blue-400' : ''} ${item.isRefund ? 'bg-red-50 dark:bg-red-900/20' : 'bg-card'}`}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">
                {item.quantity} × {item.product.title}
              </h3>
              {item.isReordered && (
                <Badge variant="secondary" className="text-xs">
                  {t.reorderedItem}
                </Badge>
              )}
            </div>

            {item.product.restaurantPrices[0] && (
              <p className="text-sm text-muted-foreground mt-1">
                {getProductPrice(item.product)} ₽ × {item.quantity}шт. = {calculateItemPrice(item)} ₽
              </p>
            )}

            {item.timestamps.startedAt && cookingTime !== null && (
              <p className="text-sm text-muted-foreground mt-1">
                {item.timestamps.completedAt
                  ? `${t.cookedIn} ${getCookingTimeText(cookingTime, language)}`
                  : `${t.cookingFor} ${getCookingTimeText(cookingTime, language)}`}
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
              {item.isRefund && item.refundReason && (
                <div className="text-sm text-red-500 dark:text-red-400 mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {language === 'ru' ? 'Причина' : 'მიზეზი'}: {item.refundReason}
                </div>
              )}
            </div>
          </div>
        </div>

        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer">{t.showLogs}</summary>
          <div className="mt-2 space-y-1">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-2" />
              {t.createdAt}: {new Date(item.timestamps.createdAt).toLocaleString()}
            </div>

            {item.timestamps.startedAt && (
              <div className="flex  flex-col">
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

        {renderItemActions(item)}
      </Card>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'PPpp', {
      locale: language === 'ru' ? ru : ka
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
        <div className="text-center py-8 text-muted-foreground">
          {t.noHistory}
        </div>
      );
    }

    return (
      <div className="space-y-4 h-96 overflow-y-auto">
        {logs.map((log) => (
          <div key={log.id} className="pb-4 px-2 last:pb-0">
            <div className="flex items-start gap-3">
              <div className="flex-1 flex justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{log.action}</div>
                  {log.userName && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <User className="h-3 w-3" />
                      {log.userName}
                    </div>
                  )}
                  {log.details && (
                    <div className="mt-2 text-sm bg-muted/50 p-2 rounded">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-sm text-muted-foreground w-32 text-center">
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
    const t = translations[language];

    return (
      <Card className="p-0">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <div className="p-4 hover:bg-muted/50 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">{t.discount}</h3>
                </div>
                <ChevronDown className="h-5 w-5" />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 border-t space-y-4">
              {order.discountAmount > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t.discount}:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      -{order.discountAmount.toFixed(2)} ₽
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleRemoveDiscount}
                    disabled={!isOrderEditable || isUpdating}
                  >
                    {t.removeDiscount}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">{t.enterDiscountCode}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value);
                          setPromoCodeError('');
                        }}
                        placeholder={t.enterDiscountCode}
                        disabled={!isOrderEditable || promoCodeLoading}
                      />
                      <Button
                        onClick={handleApplyPromoCode}
                        disabled={!isOrderEditable || promoCodeLoading || !promoCode.trim()}
                      >
                        {promoCodeLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t.applyCode
                        )}
                      </Button>
                    </div>
                    {promoCodeError && (
                      <p className="text-sm text-red-500 dark:text-red-400">{promoCodeError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">{t.enterCustomerCode}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={customerCode}
                        onChange={(e) => setCustomerCode(e.target.value)}
                        placeholder="XXXX"
                        maxLength={4}
                        disabled={!isOrderEditable || customerLoading}
                      />
                      <Button
                        onClick={handleApplyCustomer}
                        disabled={!isOrderEditable || customerLoading || customerCode.length !== 4}
                      >
                        {customerLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t.applyCustomer
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  // Рендер карточек категорий с горизонтальной прокруткой
const renderCategoryCards = () => {
  const displayCategories = getDisplayCategories();
  const displayProducts = searchQuery ? searchResults : getDisplayProducts();

  return (
    <div className="space-y-4">
      {/* Поиск */}
      <SearchInput />

      {/* Показываем результаты поиска */}
      {searchQuery && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {language === 'ru' ? 'Результаты поиска' : 'ძებნის შედეგები'} 
              {searchResults.length > 0 && ` (${searchResults.length})`}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              {language === 'ru' ? 'Очистить поиск' : 'ძებნის გასუფთავება'}
            </Button>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'ru' ? 'Продукты не найдены' : 'პროდუქტები ვერ მოიძებნა'}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                    t={t}
                    language={language}
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
          {/* Заголовок раздела */}
          <div className="mb-4 text-center">
            <h3 className="text-lg font-semibold">
              {categoryNavigation.parentCategory
                ? categoryNavigation.parentCategory.title
                : categoryNavigation.currentCategory
                  ? categoryNavigation.currentCategory.title
                  : t.allCategories
              }
            </h3>
          </div>

          {/* Горизонтальная прокрутка категорий */}
          {(displayCategories.length > 0 || categoryNavigation.parentCategory) && (
            <div className="relative">
              <div className="flex overflow-x-auto pb-4 scrollbar-hide gap-4 px-2">
                {/* Кнопка назад */}
                {(categoryNavigation.parentCategory || categoryNavigation.breadcrumbs.length > 0) && (
                  <Card
                    className="flex-shrink-0 w-64 h-32 cursor-pointer hover:shadow-lg transition-shadow duration-200 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30"
                    onClick={handleBackToCategories}
                  >
                    <div className="p-4 h-full flex flex-col justify-between">
                      <div className="text-center">
                        <h4 className="font-semibold text-lg text-blue-600 dark:text-blue-400">
                          {t.backToCategories}
                        </h4>
                      </div>
                      <div className="flex justify-center">
                        <ChevronLeft className="h-4 w-4 text-blue-400" />
                      </div>
                    </div>
                  </Card>
                )}

                {/* Карточки категорий */}
                {displayCategories.map((category) => {
                  const productsInCategory = getDisplayProducts().filter(
                    product => product.categoryId === category.id
                  );
                  
                  return (
                    <Card
                      key={category.id}
                      className="flex-shrink-0 w-64 h-32 cursor-pointer hover:shadow-lg transition-shadow duration-200"
                      onClick={() => handleCategoryClick(category)}
                    >
                      <div className="p-4 h-full flex flex-col justify-between">
                        <div className="text-center">
                          <h4 className="font-semibold text-lg mb-2">{category.title}</h4>
                        </div>
                        <div className="flex justify-center">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Сообщение когда нет категорий с товарами */}
          {displayCategories.length === 0 && !categoryNavigation.parentCategory && (
            <div className="text-center py-8 text-muted-foreground">
              {t.noProductsFound}
            </div>
          )}

          {/* Товары отображаются ТОЛЬКО когда выбрана конкретная категория */}
          {categoryNavigation.currentCategory && displayProducts.length > 0 && (
            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-4 text-center">
                {categoryNavigation.currentCategory.title}
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                      t={t}
                      language={language}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Сообщение когда выбрана категория но нет товаров */}
          {categoryNavigation.currentCategory && displayProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
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
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.push('/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t.back}
        </Button>\
        
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

  return (
    <AccessCheck allowedRoles={['WAITER', 'MANAGER', 'SUPERVISOR']}>
      <div className="space-y-6">
        {/* WebSocket Connection Status 
        <div className={`flex items-center justify-center p-2 rounded-lg text-sm font-medium ${
          isWebSocketConnected 
            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {isWebSocketConnected ? (
              <>
                <Wifi className="h-4 w-4" />
                <span>{t.connection.connected}</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                <span>{t.connection.disconnected}</span>
                {webSocketError && (
                  <span className="text-xs opacity-75">({webSocketError})</span>
                )}
              </>
            )}
          </div>
        </div>*/}

        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => handleRouteChange('/orders')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </Button><Button
      variant="outline"
      size="sm"
      onClick={focusSearchInput}
      className="text-xs"
    >
      🔍 Фокус
    </Button>

          <div className="flex items-center gap-3">

            <div className="relative flex bg-muted/50 rounded-xl p-1 border">
              <div
                className={`absolute top-1 bottom-1 w-1/2 bg-background rounded-lg shadow-sm transition-transform duration-200 ${viewMode === 'standard' ? 'translate-x-0' : 'translate-x-full'
                  }`}
              />

              <button
                onClick={() => setViewMode('standard')}
                className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'standard'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <LayoutTemplate className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {language === 'ru' ? 'Стандарт' : 'სტანდარტი'}
                </span>
              </button>

              <button
                onClick={() => setViewMode('compact')}
                className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'compact'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {language === 'ru' ? 'Компакт' : 'კომპაქტური'}
                </span>
              </button>
            </div>
          </div>
        </div>
        <OrderHeader order={order} />

        <Card className="p-0">
          <Collapsible 
            open={showMenu} 
            onOpenChange={(open) => {
              setShowMenu(open);
              if (open) {
                // Автофокус при открытии меню
                setTimeout(() => {
                  if (searchInputRef.current) {
                    searchInputRef.current.focus();
                  }
                }, 100);
              }
            }}
          >
            <CollapsibleTrigger asChild>
              <div className="p-4 hover:bg-muted/50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <List className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">{t.menu}</h2>
                  </div>
                  {showMenu ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 border-t">
                {categories.length > 0 && products.length > 0 ? (
                  renderCategoryCards()
                ) : (
                  <div className="p-4 border rounded-lg text-center">
                    {t.noProductsFound}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Остальная часть компонента остается без изменений */}
        <Card className="p-0">
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <div className="p-4 hover:bg-muted/50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">{t.orderDetails}</h2>
                  </div>
                  <ChevronDown className="h-5 w-5" />
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 border-t">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {order?.items?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                        <Package className="h-8 w-8 mb-2" />
                        {t.emptyOrder}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <ShoppingBag className="h-5 w-5" />
                          {t.originalItems}
                        </h3>

                        {/* Стандартный вид */}
                        {viewMode === 'standard' ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {getOrderItems().filter(item => !item.isRefund).map(renderItemCard)}
                          </div>
                        ) : (
                          /* Компактный вид */
                          <div className="space-y-2">
                            {getOrderItems().filter(item => !item.isRefund).map(renderCompactItemCard)}
                          </div>
                        )}

                        {getOrderItems().some(item => item.isRefund) && (
                          <div className="space-y-4 border-t pt-6">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <Ban className="h-5 w-5" />
                              {t.itemReturned}
                            </h3>

                            {viewMode === 'standard' ? (
                              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {getOrderItems().filter(item => item.isRefund).map(renderItemCard)}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {getOrderItems().filter(item => item.isRefund).map(renderCompactItemCard)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-4 justify-center">
                      <div
                        className={`flex flex-col items-center p-3 rounded-lg ${order.attentionFlags?.isReordered ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-muted'}`}
                        title={order.attentionFlags?.isReordered ? t.reorder : ''}
                      >
                        <ShoppingBag
                          className={`h-5 w-5 ${order.attentionFlags?.isReordered ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}
                        />
                        <span className="text-xs mt-1">{t.reorder}</span>
                      </div>

                      <div
                        className={`flex flex-col items-center p-3 rounded-lg ${order.attentionFlags?.hasDiscount ? 'bg-green-50 dark:bg-green-900/30' : 'bg-muted'}`}
                        title={order.attentionFlags?.hasDiscount ? t.discount : ''}
                      >
                        <Tag
                          className={`h-5 w-5 ${order.attentionFlags?.hasDiscount ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}
                        />
                        <span className="text-xs mt-1">{t.discount}</span>
                      </div>

                      <div
                        className={`flex flex-col items-center p-3 rounded-lg ${order.attentionFlags?.discountCanceled ? 'bg-red-50 dark:bg-red-900/30' : 'bg-muted'}`}
                        title={order.attentionFlags?.discountCanceled ? t.discountCanceled : ''}
                      >
                        <Ban
                          className={`h-5 w-5 ${order.attentionFlags?.discountCanceled ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}
                        />
                        <span className="text-xs mt-1">{t.discountCanceled}</span>
                      </div>

                      <div
                        className={`flex flex-col items-center p-3 rounded-lg ${order.attentionFlags?.isPrecheck ? 'bg-purple-50 dark:bg-purple-900/30' : 'bg-muted'}`}
                        title={order.attentionFlags?.isPrecheck ? t.precheck : ''}
                      >
                        <Receipt
                          className={`h-5 w-5 ${order.attentionFlags?.isPrecheck ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`}
                        />
                        <span className="text-xs mt-1">{t.precheck}</span>
                      </div>

                      <div
                        className={`flex flex-col items-center p-3 rounded-lg ${order.attentionFlags?.isRefund ? 'bg-orange-50 dark:bg-orange-900/30' : 'bg-muted'}`}
                        title={order.attentionFlags?.isRefund ? t.refund : ''}
                      >
                        <RefreshCw
                          className={`h-5 w-5 ${order.attentionFlags?.isRefund ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}
                        />
                        <span className="text-xs mt-1">{t.refund}</span>
                      </div>
                    </div>

                    <Card className="p-0">
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <div className="p-4 hover:bg-muted/50 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <History className="h-5 w-5" />
                                <h3 className="text-lg font-semibold">{t.orderHistory}</h3>
                              </div>
                              <ChevronDown className="h-5 w-5" />
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-4 border-t">
                            {renderLogs()}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>

                    {renderDiscountsBlock()}

                    <Card className="p-0">
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Receipt className="h-5 w-5" />
                            <h3 className="text-lg font-semibold">
                              {t.total}: {calculateOrderTotal().toFixed(2)} ₽
                            </h3>
                          </div>
                         {((order.surcharges && order.surcharges.length > 0) || order.discountAmount > 0) && (
  <Collapsible>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="sm" className="h-8 px-2">
        <ChevronDown className="h-4 w-4" />
      </Button>
    </CollapsibleTrigger>
  </Collapsible>
)}
                        </div>
                      </div>
                        {((order.surcharges && order.surcharges.length > 0) || order.discountAmount > 0) && (
                          <CollapsibleContent>
                            <div className="p-4 border-t space-y-2">
                              {order.surcharges && order.surcharges.length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-sm font-medium text-muted-foreground">{t.surcharges}:</div>
                                  {order.surcharges.map(surcharge => (
                                    <div key={surcharge.id} className="flex justify-between text-sm">
                                      <span>{surcharge.title}</span>
                                      <span className="font-medium text-red-600">
                                        {surcharge.type === 'FIXED'
                                          ? `+${surcharge.amount.toFixed(2)} ₽`
                                          : `+${surcharge.amount}%`}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                            {order.discountAmount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span>{t.discount}:</span>
                                <span className="font-medium text-green-600 dark:text-green-400">
                                  -{order.discountAmount.toFixed(2)} ₽
                                </span>
                              </div>
                            )}

                            {order.bonusPointsUsed > 0 && (
                              <div className="flex justify-between text-sm">
                                <span>{t.bonusPoints}:</span>
                                <span className="font-medium text-green-600 dark:text-green-400">
                                  - {order.bonusPointsUsed.toFixed(2)} ₽
                                </span>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      )}
                    </Card>

                    <div className="flex flex-col gap-4 pt-4">
                      {order.status !== 'CANCELLED' && (
                        <Button
                          disabled={isUpdating}
                          onClick={handlePrecheck}
                          variant={order.attentionFlags?.isPrecheck ? "default" : "outline"}
                          className={`gap-2 w-full text-lg h-14 ${order.attentionFlags?.isPrecheck
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/30'
                              : ''
                            }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : order.attentionFlags?.isPrecheck ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          {order.attentionFlags?.isPrecheck ? t.precheckFormed : t.formPrecheck}
                        </Button>
                      )}
                      {getOrderItems().some(item => item.status === OrderItemStatus.CREATED) && (
                            <Button
                              disabled={isUpdating || getOrderItems().length === 0}
                              onClick={handleConfirmOrder}
                              variant="secondary"
                              className="bg-emerald-500 hover:bg-emerald-400 text-white gap-2 w-full text-lg h-14"
                            >
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 mr-1" />
                              )}
                              {t.confirm} ({getOrderItems().filter(item => item.status === OrderItemStatus.CREATED).length})
                            </Button>
                          )}
                      {order.status === 'CREATED' && (
                        <>
                          

                          <Button
                            disabled={isUpdating}
                            onClick={handleCancelOrder}
                            variant="secondary"
                            className="bg-red-300 hover:bg-red-200 text-white gap-2 w-full text-lg h-14"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <X className="h-4 w-4 mr-1" />
                            )}
                            {t.cancel}
                          </Button>
                        </>
                      )}

                     {(order.status === 'READY' || order.status === 'DELIVERING') && (
                      <Button
                          disabled={isUpdating || shiftLoading}
                          onClick={handleCalculateOrder}
                          variant="secondary"
                          className="bg-emerald-500 hover:bg-emerald-400 text-white gap-2 w-full text-lg h-14"
                        >
                          {isUpdating || shiftLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          {t.calculate}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        <Card className="p-0">
          <Collapsible open={showEditForm} onOpenChange={setShowEditForm}>
            <CollapsibleTrigger asChild>
              <div className="p-4 hover:bg-muted/50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Edit className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">{t.mainInfo}</h2>
                  </div>
                  {showEditForm ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 border-t space-y-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    {t.orderType}
                  </Label>
                  <OrderTypeSelector
                    value={editFormData.type as OrderType}
                    onChange={(type) => setEditFormData({ ...editFormData, type })}
                    language={language}
                    disabled={!isOrderEditable}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t.persons}
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={editFormData.numberOfPeople}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        numberOfPeople: parseInt(e.target.value) || 1
                      })}
                      disabled={!isOrderEditable}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm flex items-center gap-2">
                      <Table className="h-4 w-4" />
                      {t.table}
                    </Label>
                    <Input
                      disabled={!isOrderEditable || (editFormData.type === 'TAKEAWAY' || editFormData.type === 'DELIVERY')}
                      type="number"
                      min="0"
                      value={editFormData.tableNumber}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        tableNumber: (parseInt(e.target.value).toString())
                      })}
                    />
                  </div>
                </div>

                {editFormData.type === 'DELIVERY' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
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
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4" />
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
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-sm flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
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
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
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
                  />
                </div>

                {isOrderEditable && (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowEditForm(false)}
                    >
                      {t.cancel}
                    </Button>
                    <Button
                      onClick={handleEditOrderSubmit}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      {isUpdating ? t.saving : t.saveChanges}
                    </Button>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

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
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t.refundItem}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedItemForRefund?.product.title} ({selectedItemForRefund?.quantity} шт.)
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">
                  {language === 'ru' ? 'Количество для возврата:' : 'დასაბრუნებელი რაოდენობა:'}
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRefundQuantity(prev => Math.max(1, prev - 1))}
                    disabled={refundQuantity <= 1}
                  >
                    <Minus className="h-3 w-3" />
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
                    className="w-20 text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRefundQuantity(prev => Math.min(maxRefundQuantity, prev + 1))}
                    disabled={refundQuantity >= maxRefundQuantity}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    / {maxRefundQuantity} шт.
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">
                  {t.refundReason}
                </Label>
                <Textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder={t.cookingError}
                />
              </div>
            </div>

            <AlertDialogFooter className="gap-2 sm:gap-0">
              {refundQuantity < maxRefundQuantity && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setRefundQuantity(maxRefundQuantity);
                  }}
                >
                  {language === 'ru' ? 'Вернуть все' : 'ყველას დაბრუნება'}
                </Button>
              )}
              <AlertDialogCancel>
                {t.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={refundQuantity === maxRefundQuantity ? handleRefundItem : handlePartialRefund}
                disabled={!refundReason.trim() || isUpdating}
              >
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {refundQuantity === maxRefundQuantity
                  ? t.confirmRefund
                  : language === 'ru'
                    ? `Вернуть ${refundQuantity} шт.`
                    : `დაბრუნება ${refundQuantity} ცალი`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

       <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.confirmation}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmCalculate} 
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCompleteOrder} 
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.calculate} 
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t.confirmation}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t.confirmCancel}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmCancelOrder}
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.cancel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showExitConfirmDialog} onOpenChange={setShowExitConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t.exitConfirmTitle}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t.exitConfirmMessage}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelExit}>
                {t.cancel}
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmExit}>
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


