'use client'

import { useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { 
  PlusIcon, 
  SearchIcon,
  UserIcon,
  PhoneIcon,
  StarIcon,
  PercentIcon,
  AwardIcon,
  SettingsIcon,
  HistoryIcon,
  MailIcon,
  CalendarIcon,
  CreditCardIcon,
  QrCodeIcon,
  X,
  DownloadIcon,
  UploadIcon,
  BellIcon,
  EditIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  RefreshCwIcon,
  CopyIcon,
  Trash2Icon,
  EyeIcon,
  HashIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  SaveIcon,
  AlertTriangleIcon
} from 'lucide-react'
import { CustomerService, CustomerDto, PersonalDiscountDto, BonusTransactionDto, NetworkCustomerInfo } from '@/lib/api/customer.service'
import { NetworkService } from '@/lib/api/network.service'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguageStore } from '@/lib/stores/language-store'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { format, subMonths } from 'date-fns'

interface Network {
  id: string
  name: string
  description?: string
}

interface Restaurant {
  id: string
  title: string
  address?: string
  phone?: string
  networkId: string
}

interface Translations {
  [key: string]: {
    [key: string]: string
  }
}

const translations: Translations = {
  ru: {
    title: 'Клиенты',
    selectNetwork: 'Выберите сеть',
    searchCustomer: 'Поиск клиента...',
    phone: 'Телефон',
    name: 'Имя',
    bonusPoints: 'Бонусы',
    personalDiscount: 'Скидка',
    network: 'Сеть',
    status: 'Статус',
    actions: 'Действия',
    active: 'Активен',
    inactive: 'Неактивен',
    all: 'Все',
    noData: 'Нет данных для отображения',
    loadingError: 'Ошибка загрузки клиентов',
    customersCount: 'Клиенты',
    totalBonusPoints: 'Всего бонусов',
    averageDiscount: 'Средняя скидка',
    editDiscounts: 'Настроить скидки',
    viewDetails: 'Подробнее',
    generateCode: 'Генерация кода',
    deleteCustomer: 'Удалить клиента',
    deleteConfirm: 'Вы уверены, что хотите удалить этого клиента?',
    settings: 'Настройки',
    save: 'Сохранить',
    cancel: 'Отмена',
    apply: 'Применить',
    reset: 'Сбросить',
    discount: 'Скидка',
    restaurant: 'Ресторан',
    setDiscount: 'Установить скидку',
    removeDiscount: 'Удалить скидку',
    discountUpdated: 'Скидка обновлена',
    discountRemoved: 'Скидка удалена',
    noDiscounts: 'Нет установленных скидок',
    availableRestaurants: 'Доступные рестораны',
    allRestaurants: 'Все рестораны',
    filterByPhone: 'Фильтр по телефону',
    filterByName: 'Фильтр по имени',
    clearFilters: 'Очистить',
    customerDetails: 'Информация о клиенте',
    loyaltySummary: 'Сводка лояльности',
    transactions: 'Транзакции',
    personalDiscounts: 'Скидки',
    bonusHistory: 'История бонусов',
    shortCode: 'Короткий код',
    generateShortCode: 'Сгенерировать код',
    codeGenerated: 'Код сгенерирован',
    codeCopied: 'Код скопирован',
    expiresAt: 'Действует до',
    copyCode: 'Скопировать код',
    phoneSearch: 'Поиск по телефону',
    searchResults: 'Результаты поиска',
    addToNetwork: 'Добавить в сеть',
    addedToNetwork: 'Клиент добавлен в сеть',
    removeFromNetwork: 'Удалить из сети',
    removedFromNetwork: 'Клиент удален из сети',
    networkCustomers: 'Клиенты сети',
    networkStats: 'Статистика сети',
    manageDiscounts: 'Управление скидками',
    email: 'Email',
    birthday: 'День рождения',
    lastVisit: 'Последний визит',
    registrationDate: 'Дата регистрации',
    totalOrders: 'Всего заказов',
    averageBill: 'Средний чек',
    totalSpent: 'Всего потрачено',
    applyToAll: 'Применить ко всем',
    applyDiscountToAll: 'Применить скидку ко всем ресторанам',
    discountValue: 'Размер скидки',
    confirmApplyAll: 'Подтверждение',
    applyAllDescription: 'Установить скидку {discount}% для всех ресторанов сети?',
    appliedToAll: 'Скидка применена ко всем ресторанам',
    quickActions: 'Быстрые действия',
    refresh: 'Обновить',
    export: 'Экспорт',
    import: 'Импорт',
    bulkEdit: 'Массовое редактирование',
    selectAll: 'Выбрать все',
    selectedCount: 'Выбрано {count}',
    applyBulkDiscount: 'Применить скидку к выбранным',
    sendNotification: 'Отправить уведомление',
    addNote: 'Добавить заметку',
    notes: 'Заметки',
    addNewNote: 'Добавить новую заметку',
    noteAdded: 'Заметка добавлена',
    transactionsHistory: 'История',
    noTransactions: 'Нет транзакций',
    transactionType: 'Тип',
    amount: 'Сумма',
    balance: 'Баланс',
    date: 'Дата',
    description: 'Описание',
    earn: 'Начисление',
    spend: 'Списание',
    adjustment: 'Корректировка',
    expiration: 'Сгорание',
    balanceManagement: 'Бонусы',
    adjustBalance: 'Корректировать баланс',
    addPoints: 'Начислить баллы',
    spendPoints: 'Списать баллы',
    adjustPoints: 'Скорректировать баллы',
    transactionDetails: 'Детали транзакции',
    reason: 'Причина',
    orderId: 'ID заказа',
    currentBalance: 'Текущий баланс',
    newBalance: 'Новый баланс',
    transactionSuccess: 'Транзакция выполнена успешно',
    transactionError: 'Ошибка выполнения транзакции',
    viewAllTransactions: 'Посмотреть все транзакции',
    filterTransactions: 'Фильтр транзакций',
    filterByDate: 'Фильтр по дате',
    filterByType: 'Фильтр по типу',
    allTypes: 'Все типы',
    fromDate: 'С даты',
    toDate: 'По дату',
    clearDateFilter: 'Очистить дату',
    discountInputPlaceholder: 'Введите скидку (0-50%)',
    invalidDiscount: 'Скидка должна быть от 0 до 50%',
    update: 'Обновить',
    delete: 'Удалить',
    confirmDelete: 'Подтвердите удаление',
    confirmDeleteDiscount: 'Вы уверены, что хотите удалить эту скидку?',
    discountDeleted: 'Скидка удалена',
    manualDiscountEdit: 'Ручное редактирование скидки',
    quickDiscounts: 'Быстрые скидки',
    applyQuickDiscount: 'Применить {discount}%',
    bulkOperations: 'Массовые операции',
    sendBulkNotification: 'Отправить уведомление выбранным',
    exportSelected: 'Экспортировать выбранных',
    clearSelection: 'Очистить выбор',
    editCustomerInfo: 'Редактировать информацию',
    customerInfo: 'Информация о клиенте',
    editInfo: 'Редактировать',
    saveChanges: 'Сохранить изменения',
    infoUpdated: 'Информация обновлена',
    firstName: 'Имя',
    lastName: 'Фамилия',
    editContactInfo: 'Контактная информация',
    birthdayPlaceholder: 'Выберите дату',
    invalidDate: 'Некорректная дата',
    notesPlaceholder: 'Введите заметку о клиенте...',
    addTransactionNote: 'Добавить заметку к транзакции',
    searchTransactions: 'Поиск транзакций...',
    loadingTransactions: 'Загрузка транзакций...',
    transactionNotFound: 'Транзакции не найдены',
    details: 'Детали',
    close: 'Закрыть',
    today: 'Сегодня',
    yesterday: 'Вчера',
    last7Days: 'Последние 7 дней',
    last30Days: 'Последние 30 дней',
    thisMonth: 'Текущий месяц',
    lastMonth: 'Прошлый месяц',
    customRange: 'Произвольный диапазон'
  },
  ka: {
    title: 'კლიენტები',
    selectNetwork: 'აირჩიეთ ქსელი',
    searchCustomer: 'მოძებნეთ კლიენტი...',
    phone: 'ტელეფონი',
    name: 'სახელი',
    bonusPoints: 'ბონუსები',
    personalDiscount: 'ფასდაკლება',
    network: 'ქსელი',
    status: 'სტატუსი',
    actions: 'მოქმედებები',
    active: 'აქტიური',
    inactive: 'არააქტიური',
    all: 'ყველა',
    noData: 'მონაცემები არ მოიძებნა',
    loadingError: 'კლიენტების ჩატვირთვის შეცდომა',
    customersCount: 'კლიენტები',
    totalBonusPoints: 'სულ ბონუსები',
    averageDiscount: 'საშუალო ფასდაკლება',
    editDiscounts: 'ფასდაკლებების კონფიგურაცია',
    viewDetails: 'დეტალები',
    generateCode: 'კოდის გენერაცია',
    deleteCustomer: 'კლიენტის წაშლა',
    deleteConfirm: 'დარწმუნებული ხართ, რომ გსურთ ამ კლიენტის წაშლა?',
    settings: 'პარამეტრები',
    save: 'შენახვა',
    cancel: 'გაუქმება',
    apply: 'გამოყენება',
    reset: 'განულება',
    discount: 'ფასდაკლება',
    restaurant: 'რესტორანი',
    setDiscount: 'ფასდაკლების დაყენება',
    removeDiscount: 'ფასდაკლების წაშლა',
    discountUpdated: 'ფასდაკლება განახლდა',
    discountRemoved: 'ფასდაკლება წაიშალა',
    noDiscounts: 'ფასდაკლებები არ არის დაყენებული',
    availableRestaurants: 'ხელმისაწვდომი რესტორნები',
    allRestaurants: 'ყველა რესტორანი',
    filterByPhone: 'ფილტრი ტელეფონის მიხედვით',
    filterByName: 'ფილტრი სახელის მიხედვით',
    clearFilters: 'ფილტრების გასუფთავება',
    customerDetails: 'კლიენტის ინფორმაცია',
    loyaltySummary: 'ლოიალობის ანგარიში',
    transactions: 'ტრანზაქციები',
    personalDiscounts: 'პერსონალური ფასდაკლებები',
    bonusHistory: 'ბონუსების ისტორია',
    shortCode: 'მოკლე კოდი',
    generateShortCode: 'კოდის გენერირება',
    codeGenerated: 'კოდი გენერირებულია',
    codeCopied: 'კოდი დაკოპირდა',
    expiresAt: 'მოქმედებს ვადამდე',
    copyCode: 'კოდის კოპირება',
    phoneSearch: 'ძებნა ტელეფონით',
    searchResults: 'ძიების შედეგები',
    addToNetwork: 'ქსელში დამატება',
    addedToNetwork: 'კლიენტი დაემატა ქსელში',
    removeFromNetwork: 'ქსელიდან წაშლა',
    removedFromNetwork: 'კლიენტი წაიშალა ქსელიდან',
    networkCustomers: 'ქსელის კლიენტები',
    networkStats: 'ქსელის სტატისტიკა',
    manageDiscounts: 'ფასდაკლებების მენეჯმენტი',
    email: 'Email',
    birthday: 'დაბადების დღე',
    lastVisit: 'ბოლო ვიზიტი',
    registrationDate: 'რეგისტრაციის თარიღი',
    totalOrders: 'სულ შეკვეთები',
    averageBill: 'საშუალო ჩეკი',
    totalSpent: 'სულ დახარჯული',
    applyToAll: 'ყველასთვის გამოყენება',
    applyDiscountToAll: 'ფასდაკლების გამოყენება ყველა რესტორანზე',
    discountValue: 'ფასდაკლების ზომა',
    confirmApplyAll: 'დადასტურება',
    applyAllDescription: 'დაყენდეს ფასდაკლება {discount}% ყველა რესტორანზე?',
    appliedToAll: 'ფასდაკლება გამოყენებულია ყველა რესტორანზე',
    quickActions: 'სწრაფი მოქმედებები',
    refresh: 'განახლება',
    export: 'ექსპორტი',
    import: 'იმპორტი',
    bulkEdit: 'მასობრივი რედაქტირება',
    selectAll: 'ყველას არჩევა',
    selectedCount: 'არჩეულია {count}',
    applyBulkDiscount: 'ფასდაკლების გამოყენება არჩეულზე',
    sendNotification: 'შეტყობინების გაგზავნა',
    addNote: 'შენიშვნის დამატება',
    notes: 'შენიშვნები',
    addNewNote: 'ახალი შენიშვნის დამატება',
    noteAdded: 'შენიშვნა დამატებულია',
    transactionsHistory: 'ტრანზაქციების ისტორია',
    noTransactions: 'ტრანზაქციები არ არის',
    transactionType: 'ტიპი',
    amount: 'თანხა',
    balance: 'ბალანსი',
    date: 'თარიღი',
    description: 'აღწერა',
    earn: 'დარიცხვა',
    spend: 'ხარჯვა',
    adjustment: 'კორექტირება',
    expiration: 'ხანძარა',
    balanceManagement: 'ბალანსის მენეჯმენტი',
    adjustBalance: 'ბალანსის კორექტირება',
    addPoints: 'ბალანსის დამატება',
    spendPoints: 'ბალანსის გამოკლება',
    adjustPoints: 'ბალანსის რეგულირება',
    transactionDetails: 'ტრანზაქციის დეტალები',
    reason: 'მიზეზი',
    orderId: 'შეკვეთის ID',
    currentBalance: 'მიმდინარე ბალანსი',
    newBalance: 'ახალი ბალანსი',
    transactionSuccess: 'ტრანზაქცია წარმატებით შესრულდა',
    transactionError: 'ტრანზაქციის შესრულების შეცდომა',
    viewAllTransactions: 'ყველა ტრანზაქციის ნახვა',
    filterTransactions: 'ტრანზაქციების ფილტრი',
    filterByDate: 'თარიღით ფილტრი',
    filterByType: 'ტიპით ფილტრი',
    allTypes: 'ყველა ტიპი',
    fromDate: 'დაწყების თარიღი',
    toDate: 'დასრულების თარიღი',
    clearDateFilter: 'თარიღის გასუფთავება',
    discountInputPlaceholder: 'შეიყვანეთ ფასდაკლება (0-50%)',
    invalidDiscount: 'ფასდაკლება უნდა იყოს 0-დან 50%-მდე',
    update: 'განახლება',
    delete: 'წაშლა',
    confirmDelete: 'წაშლის დადასტურება',
    confirmDeleteDiscount: 'დარწმუნებული ხართ, რომ გსურთ ამ ფასდაკლების წაშლა?',
    discountDeleted: 'ფასდაკლება წაიშალა',
    manualDiscountEdit: 'ფასდაკლების ხელით რედაქტირება',
    quickDiscounts: 'სწრაფი ფასდაკლებები',
    applyQuickDiscount: 'გამოყენება {discount}%',
    bulkOperations: 'მასობრივი ოპერაციები',
    sendBulkNotification: 'არჩეულებზე შეტყობინების გაგზავნა',
    exportSelected: 'არჩეულების ექსპორტი',
    clearSelection: 'არჩევის გასუფთავება',
    editCustomerInfo: 'ინფორმაციის რედაქტირება',
    customerInfo: 'კლიენტის ინფორმაცია',
    editInfo: 'რედაქტირება',
    saveChanges: 'ცვლილებების შენახვა',
    infoUpdated: 'ინფორმაცია განახლდა',
    firstName: 'სახელი',
    lastName: 'გვარი',
    editContactInfo: 'საკონტაქტო ინფორმაცია',
    birthdayPlaceholder: 'აირჩიეთ თარიღი',
    invalidDate: 'არასწორი თარიღი',
    notesPlaceholder: 'შეიყვანეთ შენიშვნა კლიენტზე...',
    addTransactionNote: 'ტრანზაქციის შენიშვნის დამატება',
    searchTransactions: 'ტრანზაქციების ძებნა...',
    loadingTransactions: 'ტრანზაქციების ჩატვირთვა...',
    transactionNotFound: 'ტრანზაქციები ვერ მოიძებნა',
    details: 'დეტალები',
    close: 'დახურვა',
    today: 'დღეს',
    yesterday: 'გუშინ',
    last7Days: 'ბოლო 7 დღე',
    last30Days: 'ბოლო 30 დღე',
    thisMonth: 'მიმდინარე თვე',
    lastMonth: 'წინა თვე',
    customRange: 'მორგებული დიაპაზონი'
  }
}

// Константы для ключей localStorage
const STORAGE_KEYS = {
  SELECTED_NETWORK: 'customer-table-selected-network',
  SEARCH_PHONE: 'customer-table-search-phone',
  SEARCH_NAME: 'customer-table-search-name',
  PAGE: 'customer-table-page',
  TRANSACTION_FILTERS: 'customer-table-transaction-filters'
}

// Функции для работы с localStorage
const getStoredValue = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue
  
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error)
    return defaultValue
  }
}

const setStoredValue = <T,>(key: string, value: T): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error)
  }
}

const CustomerTable = () => {
  const { language } = useLanguageStore()
  const t = translations[language]
  const { user } = useAuth()
  
  // Инициализация состояния из localStorage
  const [selectedNetwork, setSelectedNetwork] = useState<string>(() => 
    getStoredValue(STORAGE_KEYS.SELECTED_NETWORK, '')
  )
  const [searchPhone, setSearchPhone] = useState<string>(() => 
    getStoredValue(STORAGE_KEYS.SEARCH_PHONE, '')
  )
  const [searchName, setSearchName] = useState<string>(() => 
    getStoredValue(STORAGE_KEYS.SEARCH_NAME, '')
  )
  const [page, setPage] = useState<number>(() => 
    getStoredValue(STORAGE_KEYS.PAGE, 1)
  )
  const [limit] = useState<number>(10)
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState<boolean>(false)
  const [isApplyAllDialogOpen, setIsApplyAllDialogOpen] = useState<boolean>(false)
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState<boolean>(false)
  const [bulkDiscountValue, setBulkDiscountValue] = useState<number>(10)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | null>(null)
  const [customerDiscounts, setCustomerDiscounts] = useState<PersonalDiscountDto[]>([])
  const [customerTransactions, setCustomerTransactions] = useState<BonusTransactionDto[]>([])
  const [customerBalanceInfo, setCustomerBalanceInfo] = useState<NetworkCustomerInfo | null>(null)
  const [shortCode, setShortCode] = useState<string>('')
  const [isGenerateCodeDialogOpen, setIsGenerateCodeDialogOpen] = useState<boolean>(false)
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set())
  const [globalDiscount, setGlobalDiscount] = useState<number>(0)
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState<boolean>(false)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState<boolean>(false)
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false)
  const [isEditingInfo, setIsEditingInfo] = useState<boolean>(false)
  const [editedCustomer, setEditedCustomer] = useState<Partial<CustomerDto>>({})
  const [balanceAction, setBalanceAction] = useState<'earn' | 'spend' | 'adjust'>('earn')
  const [balanceAmount, setBalanceAmount] = useState<number>(0)
  const [balanceReason, setBalanceReason] = useState<string>('')
  const [transactionOrderId, setTransactionOrderId] = useState<string>('')
  const [transactionDescription, setTransactionDescription] = useState<string>('')
  const [tempDiscountValue, setTempDiscountValue] = useState<{ [key: string]: string }>({})
  const [deleteDiscountConfirm, setDeleteDiscountConfirm] = useState<{ restaurantId: string, discount: number } | null>(null)
  const [transactionFilters, setTransactionFilters] = useState<{
    fromDate?: Date
    toDate?: Date
    type?: string
    search?: string
  }>(() => 
    getStoredValue(STORAGE_KEYS.TRANSACTION_FILTERS, {})
  )

  // Сохранение состояния в localStorage при изменениях
  useEffect(() => {
    setStoredValue(STORAGE_KEYS.SELECTED_NETWORK, selectedNetwork)
  }, [selectedNetwork])

  useEffect(() => {
    setStoredValue(STORAGE_KEYS.SEARCH_PHONE, searchPhone)
  }, [searchPhone])

  useEffect(() => {
    setStoredValue(STORAGE_KEYS.SEARCH_NAME, searchName)
  }, [searchName])

  useEffect(() => {
    setStoredValue(STORAGE_KEYS.PAGE, page)
  }, [page])

  useEffect(() => {
    setStoredValue(STORAGE_KEYS.TRANSACTION_FILTERS, transactionFilters)
  }, [transactionFilters])

  // Получаем доступные сети для пользователя
  const { data: userNetworks, error: networksError } = useSWR(
    user ? `user-networks-${user.id}` : null,
    () => NetworkService.getByUser(user!.id)
  )

  // Получаем клиентов выбранной сети
  const { data: customersData, error: customersError, isLoading: isLoadingCustomers } = useSWR(
    selectedNetwork ? `customers-network-${selectedNetwork}-page-${page}-limit-${limit}` : null,
    () => CustomerService.getAllByNetwork(selectedNetwork, page, limit)
  )

  // Получаем рестораны выбранной сети
  const { data: restaurants, isLoading: isLoadingRestaurants } = useSWR(
    selectedNetwork ? `restaurants-network-${selectedNetwork}` : null,
    () => NetworkService.getRestaurants(selectedNetwork)
  )

  // Поиск клиента по телефону
  const { data: searchResults } = useSWR(
    searchPhone.length >= 4 ? `search-customers-${searchPhone}` : null,
    () => CustomerService.searchByPhone(searchPhone),
    {
      revalidateOnFocus: false
    }
  )

  // Автоматический выбор сети при загрузке
  useEffect(() => {
    if (userNetworks && userNetworks.length > 0) {
      // Если в localStorage есть выбранная сеть, проверяем что она все еще доступна
      if (selectedNetwork) {
        const networkExists = userNetworks.some((n: Network) => n.id === selectedNetwork)
        if (!networkExists) {
          // Если сети больше нет в списке, выбираем первую доступную
          const newNetworkId = userNetworks[0].id
          setSelectedNetwork(newNetworkId)
          setPage(1)
        }
      } else {
        // Если нет сохраненной сети, выбираем первую
        const firstNetworkId = userNetworks[0].id
        setSelectedNetwork(firstNetworkId)
        setPage(1)
      }
    }
  }, [userNetworks, selectedNetwork])

  useEffect(() => {
    if (selectedCustomer && selectedNetwork) {
      loadCustomerDiscounts()
      loadCustomerTransactions()
      loadCustomerBalance()
    }
  }, [selectedCustomer, selectedNetwork])

  const loadCustomerDiscounts = async () => {
    if (!selectedCustomer) return
    
    setIsLoadingDiscounts(true)
    try {
      const discounts = await CustomerService.getPersonalDiscounts(selectedCustomer.id)
      setCustomerDiscounts(discounts)
    } catch (error) {
      console.error('Error loading discounts:', error)
      toast.error(language === 'ru' ? 'Ошибка загрузки скидок' : 'ფასდაკლებების ჩატვირთვის შეცდომა')
    } finally {
      setIsLoadingDiscounts(false)
    }
  }

  const loadCustomerTransactions = async () => {
    if (!selectedCustomer || !selectedNetwork) return
    
    setIsLoadingTransactions(true)
    try {
      const response = await CustomerService.getTransactions(
        selectedCustomer.id,
        selectedNetwork,
        1,
        50
      )
      setCustomerTransactions(response.data)
    } catch (error) {
      console.error('Error loading transactions:', error)
      toast.error(language === 'ru' ? 'Ошибка загрузки транзакций' : 'ტრანზაქციების ჩატვირთვის შეცდომა')
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const loadCustomerBalance = async () => {
    if (!selectedCustomer || !selectedNetwork) return
    
    setIsLoadingBalance(true)
    try {
      const balanceInfo = await CustomerService.getBonusBalance(selectedCustomer.id, selectedNetwork)
      setCustomerBalanceInfo(balanceInfo)
    } catch (error) {
      console.error('Error loading balance:', error)
      toast.error(language === 'ru' ? 'Ошибка загрузки баланса' : 'ბალანსის ჩატვირთვის შეცდომა')
    } finally {
      setIsLoadingBalance(false)
    }
  }

  const handleNetworkChange = (networkId: string) => {
    setSelectedNetwork(networkId)
    setPage(1)
    setSelectedCustomers(new Set())
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleClearFilters = () => {
    setSearchPhone('')
    setSearchName('')
    setSelectedCustomers(new Set())
  }

  const handleEditDiscounts = async (customer: CustomerDto) => {
    setSelectedCustomer(customer)
    setIsDiscountDialogOpen(true)
    setIsEditingInfo(false)
  }

  const handleDiscountInputChange = (restaurantId: string, value: string) => {
    setTempDiscountValue(prev => ({
      ...prev,
      [restaurantId]: value
    }))
  }

  const handleDiscountSave = async (restaurantId: string) => {
    if (!selectedCustomer) return
    
    const value = tempDiscountValue[restaurantId]
    if (!value || isNaN(Number(value))) return
    
    const discount = Math.min(50, Math.max(0, parseInt(value)))
    
    try {
      await CustomerService.setPersonalDiscount(selectedCustomer.id, restaurantId, discount)
      
      setCustomerDiscounts(prev => {
        const existing = prev.find(d => d.restaurantId === restaurantId)
        if (existing) {
          return prev.map(d => 
            d.restaurantId === restaurantId ? { ...d, discount } : d
          )
        } else {
          const restaurant = restaurants?.find(r => r.id === restaurantId)
          return [...prev, {
            id: `temp-${restaurantId}`,
            customerId: selectedCustomer.id,
            restaurantId,
            restaurantName: restaurant?.title,
            discount,
            createdAt: new Date(),
            updatedAt: new Date()
          }]
        }
      })

      setTempDiscountValue(prev => {
        const newValue = { ...prev }
        delete newValue[restaurantId]
        return newValue
      })

      toast.success(t.discountUpdated)
    } catch (error) {
      console.error('Error updating discount:', error)
      toast.error(language === 'ru' ? 'Ошибка обновления скидки' : 'ფასდაკლების განახლების შეცდომა')
    }
  }

  const handleDeleteDiscount = async (restaurantId: string) => {
    if (!selectedCustomer) return
    
    try {
      await CustomerService.setPersonalDiscount(selectedCustomer.id, restaurantId, 0)
      
      setCustomerDiscounts(prev => prev.filter(d => d.restaurantId !== restaurantId))
      setDeleteDiscountConfirm(null)
      toast.success(t.discountDeleted)
    } catch (error) {
      console.error('Error deleting discount:', error)
      toast.error(language === 'ru' ? 'Ошибка удаления скидки' : 'ფასდაკლების წაშლის შეცდომა')
    }
  }

  const handleQuickDiscount = async (restaurantId: string, discount: number) => {
    if (!selectedCustomer) return
    
    try {
      await CustomerService.setPersonalDiscount(selectedCustomer.id, restaurantId, discount)
      
      setCustomerDiscounts(prev => {
        const existing = prev.find(d => d.restaurantId === restaurantId)
        const restaurant = restaurants?.find(r => r.id === restaurantId)
        if (existing) {
          return prev.map(d => 
            d.restaurantId === restaurantId ? { ...d, discount } : d
          )
        } else {
          return [...prev, {
            id: `temp-${restaurantId}`,
            customerId: selectedCustomer.id,
            restaurantId,
            restaurantName: restaurant?.title,
            discount,
            createdAt: new Date(),
            updatedAt: new Date()
          }]
        }
      })

      toast.success(t.discountUpdated)
    } catch (error) {
      console.error('Error applying quick discount:', error)
      toast.error(language === 'ru' ? 'Ошибка применения скидки' : 'ფასდაკლების გამოყენების შეცდომა')
    }
  }

  const handleApplyDiscountToAll = async () => {
    if (!selectedCustomer || !restaurants) return

    try {
      const promises = restaurants.map(restaurant =>
        CustomerService.setPersonalDiscount(selectedCustomer.id, restaurant.id, globalDiscount)
      )
      
      await Promise.all(promises)
      
      const newDiscounts = restaurants.map(restaurant => ({
        id: `temp-${restaurant.id}`,
        customerId: selectedCustomer.id,
        restaurantId: restaurant.id,
        restaurantName: restaurant.title,
        discount: globalDiscount,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
      
      setCustomerDiscounts(newDiscounts)
      setIsApplyAllDialogOpen(false)
      toast.success(t.appliedToAll)
    } catch (error) {
      console.error('Error applying discount to all:', error)
      toast.error(language === 'ru' ? 'Ошибка применения скидки' : 'ფასდაკლების გამოყენების შეცდომა')
    }
  }

  const handleEditCustomerInfo = () => {
    if (!selectedCustomer) return
    setEditedCustomer({
      firstName: selectedCustomer.firstName,
      lastName: selectedCustomer.lastName,
      email: selectedCustomer.email,
      birthday: selectedCustomer.birthday
    })
    setIsEditingInfo(true)
  }

  const handleSaveCustomerInfo = async () => {
    if (!selectedCustomer) return
    
    try {
      // Здесь должен быть вызов API для обновления информации о клиенте
      // await CustomerService.updateCustomer(selectedCustomer.id, editedCustomer)
      
      setSelectedCustomer(prev => prev ? { ...prev, ...editedCustomer } : null)
      setIsEditingInfo(false)
      toast.success(t.infoUpdated)
    } catch (error) {
      console.error('Error updating customer info:', error)
      toast.error(language === 'ru' ? 'Ошибка обновления информации' : 'ინფორმაციის განახლების შეცდომა')
    }
  }

  const handleBalanceAction = async () => {
    if (!selectedCustomer || !selectedNetwork || !balanceAmount) return
    
    try {
      let transaction: BonusTransactionDto
      
      switch (balanceAction) {
        case 'earn':
          transaction = await CustomerService.earnBonusPoints(
            selectedCustomer.id,
            selectedNetwork,
            balanceAmount,
          )
          break
        case 'spend':
          transaction = await CustomerService.spendBonusPoints(
            selectedCustomer.id,
            selectedNetwork,
            balanceAmount,
          )
          break
        case 'adjust':
          if (!balanceReason) {
            toast.error(language === 'ru' ? 'Укажите причину корректировки' : 'მიუთითეთ კორექტირების მიზეზი')
            return
          }
          transaction = await CustomerService.adjustBonusBalance(
            selectedCustomer.id,
            selectedNetwork,
            balanceAmount,
            balanceReason
          )
          break
      }
      
      // Обновляем информацию о балансе и транзакциях
      await Promise.all([
        loadCustomerTransactions(),
        loadCustomerBalance()
      ])
      
      // Обновляем данные клиента в списке
      if (customersData) {
        mutate(`customers-network-${selectedNetwork}-page-${page}-limit-${limit}`)
      }
      
      // Сбрасываем форму
      setBalanceAmount(0)
      setBalanceReason('')
      setTransactionOrderId('')
      setTransactionDescription('')
      setIsBalanceDialogOpen(false)
      
      toast.success(t.transactionSuccess)
    } catch (error) {
      console.error('Error performing balance action:', error)
      toast.error(t.transactionError)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(shortCode)
    toast.success(t.codeCopied)
  }

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(customerId)) {
        newSet.delete(customerId)
      } else {
        newSet.add(customerId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (!customersData?.data) return
    
    if (selectedCustomers.size === customersData.data.length) {
      setSelectedCustomers(new Set())
    } else {
      const allIds = customersData.data.map(c => c.id)
      setSelectedCustomers(new Set(allIds))
    }
  }

  // Функция очистки всех сохраненных фильтров
  const handleClearAllStorage = () => {
    if (window.confirm(language === 'ru' 
      ? 'Очистить все сохраненные фильтры и настройки?' 
      : 'გაასუფთავოთ ყველა შენახული ფილტრი და პარამეტრი?')) {
      
      localStorage.removeItem(STORAGE_KEYS.SELECTED_NETWORK)
      localStorage.removeItem(STORAGE_KEYS.SEARCH_PHONE)
      localStorage.removeItem(STORAGE_KEYS.SEARCH_NAME)
      localStorage.removeItem(STORAGE_KEYS.PAGE)
      localStorage.removeItem(STORAGE_KEYS.TRANSACTION_FILTERS)
      
      setSelectedNetwork('')
      setSearchPhone('')
      setSearchName('')
      setPage(1)
      setTransactionFilters({})
      setSelectedCustomers(new Set())
      
      toast.success(language === 'ru' 
        ? 'Фильтры очищены' 
        : 'ფილტრები გასუფთავდა')
    }
  }

  const formatPhone = (phone: string): string => {
    return CustomerService.formatPhone(phone)
  }

  const formatDate = (date: Date | string): string => {
    return CustomerService.formatDate(date)
  }

  const formatDateTime = (date: Date | string): string => {
    const d = new Date(date)
    return d.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'ka-GE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (customer: CustomerDto): string => {
    if (customer.firstName && customer.lastName) {
      return `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase()
    }
    if (customer.firstName) {
      return customer.firstName[0].toUpperCase()
    }
    return customer.phone.slice(-2)
  }

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'EARN':
        return <TrendingUpIcon className="h-4 w-4 text-green-500" />
      case 'SPEND':
        return <TrendingDownIcon className="h-4 w-4 text-red-500" />
      case 'ADJUSTMENT':
        return <EditIcon className="h-4 w-4 text-blue-500" />
      case 'EXPIRATION':
        return <ClockIcon className="h-4 w-4 text-orange-500" />
      default:
        return <HashIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'EARN': return t.earn
      case 'SPEND': return t.spend
      case 'ADJUSTMENT': return t.adjustment
      case 'EXPIRATION': return t.expiration
      default: return type
    }
  }

  const filteredTransactions = customerTransactions.filter(transaction => {
    if (transactionFilters.type && transaction.type !== transactionFilters.type) return false
    if (transactionFilters.fromDate && new Date(transaction.createdAt) < transactionFilters.fromDate) return false
    if (transactionFilters.toDate) {
      const toDate = new Date(transactionFilters.toDate)
      toDate.setHours(23, 59, 59, 999)
      if (new Date(transaction.createdAt) > toDate) return false
    }
    if (transactionFilters.search) {
      const search = transactionFilters.search.toLowerCase()
      return (
        transaction.description?.toLowerCase().includes(search) ||
        transaction.orderId?.toLowerCase().includes(search) ||
        transaction.reason?.toLowerCase().includes(search)
      )
    }
    return true
  })

  if (networksError || customersError) {
    return <div className="text-red-500">{t.loadingError}</div>
  }

  const filteredCustomers = customersData?.data.filter(customer => {
    const matchesPhone = !searchPhone || customer.phone.includes(searchPhone.replace(/\D/g, ''))
    const matchesName = !searchName || 
      customer.firstName?.toLowerCase().includes(searchName.toLowerCase()) ||
      customer.lastName?.toLowerCase().includes(searchName.toLowerCase())
    return matchesPhone && matchesName
  }) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground">
              {selectedNetwork && userNetworks?.find(n => n.id === selectedNetwork)?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {userNetworks && userNetworks.length > 0 && (
              <Select value={selectedNetwork} onValueChange={handleNetworkChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t.selectNetwork} />
                </SelectTrigger>
                <SelectContent>
                  {userNetworks.map((network: Network) => (
                    <SelectItem key={network.id} value={network.id}>
                      {network.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder={t.phoneSearch}
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
              />
            </form>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={handleClearFilters}>
              {t.clearFilters}
            </Button>
          </div>
        </div>

        {/* Результаты поиска */}
        {searchResults && searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t.searchResults}</CardTitle>
              <CardDescription>
                {language === 'ru' 
                  ? 'Найдено в других сетях' 
                  : 'ნაპოვნია სხვა ქსელებში'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {searchResults.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            {formatPhone(customer.phone)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!customer.networks?.some(n => n.networkId === selectedNetwork) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    toast.success(t.addedToNetwork)
                                  }}
                                >
                                  <PlusIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t.addToNetwork}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditDiscounts(customer)}
                              >
                                <SettingsIcon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t.settings}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Выбранные клиенты */}
        {selectedCustomers.size > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">
                    {t.selectedCount.replace('{count}', selectedCustomers.size.toString())}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => setSelectedCustomers(new Set())}>
                    {t.clearSelection}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {t.bulkOperations}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>{t.bulkOperations}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <BellIcon className="mr-2 h-4 w-4" />
                        {t.sendBulkNotification}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        {t.exportSelected}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.phone}</TableHead>
              <TableHead>{t.lastVisit}</TableHead>
              <TableHead className="text-right">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingCustomers ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <UserIcon className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">{t.noData}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatPhone(customer.phone)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          customer.lastLogin && 
                          new Date(customer.lastLogin).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                      />
                      <span className="text-sm">
                        {customer.lastLogin 
                          ? formatDate(customer.lastLogin)
                          : language === 'ru' ? 'Не было' : 'არ ყოფილა'
                        }
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditDiscounts(customer)}
                            >
                              <SettingsIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t.editDiscounts}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Пагинация */}
      {customersData && customersData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            {language === 'ru' 
              ? `Показано ${(page - 1) * limit + 1}-${Math.min(page * limit, customersData.pagination.total)} из ${customersData.pagination.total}`
              : `ნაჩვენებია ${(page - 1) * limit + 1}-${Math.min(page * limit, customersData.pagination.total)} ${customersData.pagination.total}-დან`}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(customersData.pagination.totalPages, p + 1))}
              disabled={page === customersData.pagination.totalPages}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Диалог настройки скидок и бонусов */}
      <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              {t.manageDiscounts}
            </DialogTitle>
            <DialogDescription>
              {selectedCustomer && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                      </div>
                      <div className="text-xl text-muted-foreground flex items-center gap-2">
                        <PhoneIcon className="h-3 w-3" />
                        {formatPhone(selectedCustomer.phone)}
                        {selectedCustomer.email && (
                          <>
                            <MailIcon className="h-3 w-3 ml-2" />
                            {isEditingInfo ? (
                              <Input
                                value={editedCustomer.email || ''}
                                onChange={(e) => setEditedCustomer(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="Email"
                                className="w-40 h-6"
                                type="email"
                              />
                            ) : (
                              selectedCustomer.email
                            )}
                          </>
                        )}
                      </div>
                      {selectedCustomer.birthday && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {formatDate(selectedCustomer.birthday)}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <StarIcon className="h-3 w-3" />
                    {customerBalanceInfo ? customerBalanceInfo.balance?.toLocaleString() : '...'} {t.bonusPoints}
                  </Badge>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <Tabs defaultValue="discounts" className="w-full">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="discounts">{t.personalDiscounts}</TabsTrigger>
                <TabsTrigger value="bonus">{t.balanceManagement}</TabsTrigger>
                <TabsTrigger value="transactions">{t.transactionsHistory}</TabsTrigger>
              </TabsList>
              
              {/* Вкладка скидок */}
              <TabsContent value="discounts" className="space-y-4">
                <div className="space-y-4">
                  {isLoadingRestaurants || isLoadingDiscounts ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : restaurants && restaurants.length > 0 ? (
                    <>
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{t.availableRestaurants}</h3>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">{t.quickDiscounts}:</div>
                          <div className="flex gap-1">
                            {[5, 10, 15, 20].map((discount) => (
                              <Button
                                key={discount}
                                variant="outline"
                                size="sm"
                                onClick={() => setGlobalDiscount(discount)}
                              >
                                {discount}%
                              </Button>
                            ))}
                          </div>
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            value={globalDiscount}
                            onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                            className="w-20"
                          />
                          <span>%</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsApplyAllDialogOpen(true)}
                            disabled={globalDiscount === 0}
                          >
                            {t.applyToAll}
                          </Button>
                        </div>
                      </div>
                      
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-3">
                          {restaurants.map((restaurant) => {
                            const currentDiscount = customerDiscounts.find(
                              d => d.restaurantId === restaurant.id
                            )?.discount || 0
                            const isEditing = tempDiscountValue[restaurant.id] !== undefined

                            return (
                              <div
                                key={restaurant.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50"
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{restaurant.title}</div>
                                  {restaurant.address && (
                                    <div className="text-sm text-muted-foreground">
                                      {restaurant.address}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  {isEditing ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={tempDiscountValue[restaurant.id] || ''}
                                        onChange={(e) => handleDiscountInputChange(restaurant.id, e.target.value)}
                                        placeholder={t.discountInputPlaceholder}
                                        className="w-24"
                                      />
                                      <span>%</span>
                                      <Button
                                        size="sm"
                                        onClick={() => handleDiscountSave(restaurant.id)}
                                        disabled={!tempDiscountValue[restaurant.id] || 
                                          isNaN(Number(tempDiscountValue[restaurant.id])) ||
                                          Number(tempDiscountValue[restaurant.id]) < 0 ||
                                          Number(tempDiscountValue[restaurant.id]) > 50
                                        }
                                      >
                                        <CheckIcon className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setTempDiscountValue(prev => {
                                            const newValue = { ...prev }
                                            delete newValue[restaurant.id]
                                            return newValue
                                          })
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-2 w-32 justify-end">
                                        <span className={`font-medium ${currentDiscount > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                          {currentDiscount}%
                                        </span>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setTempDiscountValue(prev => ({ ...prev, [restaurant.id]: currentDiscount.toString() }))}
                                          >
                                            <EditIcon className="h-3 w-3" />
                                          </Button>
                                          {currentDiscount > 0 && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => setDeleteDiscountConfirm({ restaurantId: restaurant.id, discount: currentDiscount })}
                                            >
                                              <Trash2Icon className="h-3 w-3" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        {[5, 10, 15].map((discount) => (
                                          <Button
                                            key={discount}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleQuickDiscount(restaurant.id, discount)}
                                            className={currentDiscount === discount ? 'bg-primary text-primary-foreground' : ''}
                                          >
                                            {discount}%
                                          </Button>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {t.noDiscounts}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Вкладка управления балансом */}
              <TabsContent value="bonus" className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{t.currentBalance}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingBalance ? (
                        <Skeleton className="h-10 w-24" />
                      ) : (
                        <>
                          <div className="text-3xl font-bold text-primary">
                            {customerBalanceInfo?.balance?.toLocaleString() || '0'}
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">
                            {language === 'ru' ? 'Бонусные баллы' : 'ბონუსები'}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{t.totalTransactions}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {customerTransactions.length}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        {language === 'ru' ? 'Всего операций' : 'სულ ოპერაციები'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{t.lastTransaction}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-semibold">
                        {customerTransactions.length > 0 
                          ? formatDate(customerTransactions[0].createdAt)
                          : language === 'ru' ? 'Нет транзакций' : 'ტრანზაქციები არ არის'
                        }
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        {language === 'ru' ? 'Последняя операция' : 'ბოლო ოპერაცია'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => {
                      setBalanceAction('earn')
                      setIsBalanceDialogOpen(true)
                    }}>
                      <CardContent className="pt-6 flex flex-col items-center">
                        <TrendingUpIcon className="h-8 w-8 text-green-500 mb-2" />
                        <div className="text-lg font-medium">{t.addPoints}</div>
                        <div className="text-sm text-muted-foreground text-center">
                          {language === 'ru' ? 'Начислить бонусы' : 'ბონუსების დარიცხვა'}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => {
                      setBalanceAction('spend')
                      setIsBalanceDialogOpen(true)
                    }}>
                      <CardContent className="pt-6 flex flex-col items-center">
                        <TrendingDownIcon className="h-8 w-8 text-red-500 mb-2" />
                        <div className="text-lg font-medium">{t.spendPoints}</div>
                        <div className="text-sm text-muted-foreground text-center">
                          {language === 'ru' ? 'Списать бонусы' : 'ბონუსების ჩამოწერა'}
                        </div>
                      </CardContent>
                    </Card>

                    
                  </div>
                </div>
              </TabsContent>

              {/* Вкладка истории транзакций */}
              <TabsContent value="transactions" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{t.transactionsHistory}</h3>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder={t.searchTransactions}
                        value={transactionFilters.search || ''}
                        onChange={(e) => setTransactionFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="w-48"
                      />
                    <Select
                      value={transactionFilters.type || ""}
                      onValueChange={(value) => setTransactionFilters(prev => ({ 
                        ...prev, 
                        type: value === "all" ? undefined : value 
                      }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder={t.filterByType} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.allTypes}</SelectItem>
                        <SelectItem value="EARN">{t.earn}</SelectItem>
                        <SelectItem value="SPEND">{t.spend}</SelectItem>
                        <SelectItem value="ADJUSTMENT">{t.adjustment}</SelectItem>
                        <SelectItem value="EXPIRATION">{t.expiration}</SelectItem>
                      </SelectContent>
                    </Select>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            {t.filterByDate}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <div className="p-3">
                            <div className="space-y-2">
                              <Label>{t.fromDate}</Label>
                              <Input
                                type="date"
                                value={transactionFilters.fromDate?.toISOString().split('T')[0] || ''}
                                onChange={(e) => setTransactionFilters(prev => ({
                                  ...prev,
                                  fromDate: e.target.value ? new Date(e.target.value) : undefined
                                }))}
                              />
                            </div>
                            <div className="space-y-2 mt-3">
                              <Label>{t.toDate}</Label>
                              <Input
                                type="date"
                                value={transactionFilters.toDate?.toISOString().split('T')[0] || ''}
                                onChange={(e) => setTransactionFilters(prev => ({
                                  ...prev,
                                  toDate: e.target.value ? new Date(e.target.value) : undefined
                                }))}
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-3"
                              onClick={() => setTransactionFilters(prev => ({ ...prev, fromDate: undefined, toDate: undefined }))}
                            >
                              {t.clearDateFilter}
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {isLoadingTransactions ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t.transactionNotFound}
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {filteredTransactions.map((transaction) => (
                          <Card key={transaction.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {getTransactionTypeIcon(transaction.type)}
                                  <div>
                                    <div className="font-medium">
                                      {getTransactionTypeText(transaction.type)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {formatDateTime(transaction.createdAt)}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {t.balance}: {transaction.balanceAfter.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              {(transaction.description || transaction.reason || transaction.orderId) && (
                                <div className="mt-3 pt-3 border-t">
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    {transaction.description && (
                                      <div>{transaction.description}</div>
                                    )}
                                    {transaction.reason && (
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium">{t.reason}:</span>
                                        {transaction.reason}
                                      </div>
                                    )}
                                    {transaction.orderId && (
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium">{t.orderId}:</span>
                                        {transaction.orderId}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог применения скидки ко всем */}
      <Dialog open={isApplyAllDialogOpen} onOpenChange={setIsApplyAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.confirmApplyAll}</DialogTitle>
            <DialogDescription>
              {t.applyAllDescription.replace('{discount}', globalDiscount.toString())}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyAllDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleApplyDiscountToAll}>
              {t.apply}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог управления балансом */}
      <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {balanceAction === 'earn' && <TrendingUpIcon className="h-5 w-5 text-green-500" />}
              {balanceAction === 'spend' && <TrendingDownIcon className="h-5 w-5 text-red-500" />}
              {balanceAction === 'adjust' && <EditIcon className="h-5 w-5 text-blue-500" />}
              {balanceAction === 'earn' ? t.addPoints :
               balanceAction === 'spend' ? t.spendPoints :
               t.adjustPoints}
            </DialogTitle>
            <div>
              {selectedCustomer && (
                <div className="text-sm">
                  {t.currentBalance}: <span className="font-semibold">
                    {customerBalanceInfo?.balance?.toLocaleString() || '...'}
                  </span>
                </div>
              )}
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                {balanceAction === 'earn' ? t.addPoints :
                 balanceAction === 'spend' ? t.spendPoints :
                 t.adjustPoints}
              </Label>
              <Input
                id="amount"
                type="number"
                min="1"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(Number(e.target.value))}
                placeholder="0"
              />
            </div>

            {balanceAction === 'adjust' && (
              <div className="space-y-2">
                <Label htmlFor="reason">{t.reason} *</Label>
                <Input
                  id="reason"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  placeholder={language === 'ru' ? 'Причина корректировки' : 'კორექტირების მიზეზი'}
                  required
                />
              </div>
            )}

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsBalanceDialogOpen(false)
              setBalanceAmount(0)
              setBalanceReason('')
              setTransactionOrderId('')
              setTransactionDescription('')
            }}>
              {t.cancel}
            </Button>
            <Button onClick={handleBalanceAction} disabled={!balanceAmount || (balanceAction === 'adjust' && !balanceReason)}>
              {balanceAction === 'earn' ? t.addPoints :
               balanceAction === 'spend' ? t.spendPoints :
               t.adjustPoints}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления скидки */}
      <AlertDialog open={!!deleteDiscountConfirm} onOpenChange={(open) => !open && setDeleteDiscountConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmDeleteDiscount}
              {deleteDiscountConfirm && (
                <div className="mt-2 p-3 bg-muted rounded">
                  <div className="font-medium">{deleteDiscountConfirm.discount}%</div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDiscountConfirm && handleDeleteDiscount(deleteDiscountConfirm.restaurantId)}
              className="bg-red-500 hover:bg-red-600"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CustomerTable