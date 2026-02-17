//@ts-nocheck
'use client'

import { useState, useEffect, JSX, useCallback } from 'react'
import { OrderState } from '@/lib/types/order'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { AddressInput } from './AddressInput'
import {
  Utensils,
  Home,
  Truck,
  Calendar,
  Banknote,
  Store,
  Phone,
  Users,
  Table as TableIcon,
  MessageCircle,
  MapPin,
  Clock,
  ShoppingBag,
  ChevronRight,
  User,
  CreditCard,
  Wallet,
  Smartphone,
  Package,
  Pointer,
  Grid2x2Check,
  Plus,
  Minus,
  Building,
  MapPin as MapPinIcon,
  Star,
  Check,
  Eye,
  CheckCircle,
  X,
  Loader2,
  Search
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { useSurcharges } from '@/lib/hooks/useSurcharges'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogContentExtraWide,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import DateTimePicker from '@/components/ui/data-picker-with-time'
import {
  TableDto,
  TableStatus,
  TablesService
} from '@/lib/api/tables.service'
import {
  CreateReservationDto,
  ReservationStatus,
  ReservationsService
} from '@/lib/api/reservation.service'

interface OrderInfoStepProps {
  order: OrderState
  setOrder: (order: OrderState) => void
  user: any
  language: string
  onSubmit: () => void
  loading: boolean
  onRestaurantChange: (restaurantId: string) => void
  restaurantStatus?: { 
    isOpen: boolean; 
    message: string;
    nextOpenTime?: string;
  } | null
  restaurantUsesReservation?: boolean
}

export const OrderInfoStep = ({
  order,
  setOrder,
  user,
  language,
  onSubmit,
  loading,
  onRestaurantChange,
  restaurantStatus,
  restaurantUsesReservation = false
}: OrderInfoStepProps) => {
  const [scheduledTime, setScheduledTime] = useState<Date>(order.scheduledAt ? new Date(order.scheduledAt) : new Date())
  const [isRestaurantDialogOpen, setIsRestaurantDialogOpen] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null)
  const [showTableSelection, setShowTableSelection] = useState(false)
  const [tables, setTables] = useState<TableDto[]>([])
  const [allTables, setAllTables] = useState<TableDto[]>([])
  const [availableTables, setAvailableTables] = useState<TableDto[]>([])
  const [halls, setHalls] = useState<any[]>([])
  const [currentHall, setCurrentHall] = useState<any>(null)
  const [selectedTable, setSelectedTable] = useState<TableDto | null>(null)
  const [isLoadingTables, setIsLoadingTables] = useState(false)
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [deliverAsSoonAsPossible, setDeliverAsSoonAsPossible] = useState(true)
  const { surcharges: availableSurcharges } = useSurcharges(order.type, order.restaurantId)

  const t = (text: string | undefined, textGe: string | undefined) => {
    return language === 'ka' && textGe ? textGe : text || ''
  }

  useEffect(() => {
    if (availableSurcharges.length > 0) {
      const autoAppliedSurcharges = availableSurcharges.filter(s =>
        !order.surcharges.some(os => os.id === s.id))

      if (autoAppliedSurcharges.length > 0) {
        setOrder({
          ...order,
          surcharges: [...order.surcharges, ...autoAppliedSurcharges]
        })
      }
    }
  }, [availableSurcharges, order.type, order.restaurantId])

  useEffect(() => {
    if (user?.restaurant) {
      const currentRestaurant = user.restaurant.find((r: any) => r.id === order.restaurantId)
      setSelectedRestaurant(currentRestaurant || user.restaurant[0])
    }
  }, [order.restaurantId, user?.restaurant])

  const handleRestaurantChange = (value: string) => {
    const restaurant = user?.restaurant?.find((r: any) => r.id === value)
    if (!restaurant) return

    setSelectedRestaurant(restaurant)
    onRestaurantChange(value)
    
    setOrder({
      ...order,
      restaurantId: restaurant.id,
      items: [],
      deliveryZone: null,
      surcharges: [],
      tableNumber: 0,
      tableId: undefined
    })
    
    setSelectedTable(null)
    setAllTables([])
    setAvailableTables([])
  }

  const handleSelectRestaurant = (restaurant: any) => {
    setSelectedRestaurant(restaurant)
    handleRestaurantChange(restaurant.id)
    setIsRestaurantDialogOpen(false)
  }

  const handleScheduledChange = (checked: boolean) => {
    setOrder({
      ...order,
      isScheduled: checked,
      scheduledAt: checked ? scheduledTime.toISOString() : undefined
    })
  }

  const handleScheduledTimeChange = (date: Date | null) => {
    if (date) {
      const now = new Date()
      // Убедимся, что выбранная дата не в прошлом
      if (date < now) {
        toast.error(language === 'ka' ? 'შეარჩიეთ მომავალი დრო' : 'Выберите будущее время')
        return
      }
      
      setScheduledTime(date)
      setOrder({
        ...order,
        scheduledAt: date.toISOString()
      })
    }
  }

  // Загрузка всех столов ресторана
  const loadAllTables = useCallback(async () => {
    if (!order.restaurantId) {
      setAllTables([])
      setAvailableTables([])
      return []
    }
    
    setIsLoadingTables(true)
    try {
      const tablesResponse = await TablesService.getTables({
        restaurantId: order.restaurantId,
        includeInactive: false
      })
      
      const allTablesData = tablesResponse.data || []
      const availableTablesData = allTablesData.filter(table => 
        table.status === TableStatus.AVAILABLE
      ).sort((a, b) => {
        // Сортировка по номеру стола (извлекаем числа из названия)
        const aNum = parseInt(a.name.replace(/\D/g, '')) || 0
        const bNum = parseInt(b.name.replace(/\D/g, '')) || 0
        return aNum - bNum
      })
      
      setAllTables(allTablesData)
      setAvailableTables(availableTablesData)
      
      // Если выбранный стол больше не доступен - сбрасываем его
      if (selectedTable) {
        const currentTable = allTablesData.find(t => t.id === selectedTable.id)
        if (!currentTable || currentTable.status !== TableStatus.AVAILABLE) {
          clearTableSelection()
        }
      }
      
      return availableTablesData
    } catch (error) {
      console.error('Ошибка загрузки столов:', error)
      toast.error(language === 'ka' ? 'შეცდომა სტოლების ჩატვირთვისას' : 'Ошибка загрузки столов')
      setAllTables([])
      setAvailableTables([])
      return []
    } finally {
      setIsLoadingTables(false)
    }
  }, [order.restaurantId, selectedTable, language])

  // Загрузка столов при открытии диалога выбора
  const loadTablesAndHalls = useCallback(async () => {
    if (!order.restaurantId) return
    
    setIsLoadingTables(true)
    try {
      // Загружаем залы ресторана
      const hallsData = await TablesService.getHallsByRestaurant(order.restaurantId, false)
      setHalls(hallsData)
      
      if (hallsData.length > 0) {
        setCurrentHall(hallsData[0])
        
        // Загружаем столы для первого зала
        const tablesResponse = await TablesService.getTables({
          restaurantId: order.restaurantId,
          hallId: hallsData[0].id,
          includeInactive: false
        })
        
        const tablesData = tablesResponse.data || []
        setTables(tablesData.filter(table => 
          table.status === TableStatus.AVAILABLE
        ))
      }
    } catch (error) {
      console.error('Ошибка загрузки столов:', error)
      toast.error(language === 'ka' ? 'შეცდომა სტოლების ჩატვირთვისას' : 'Ошибка загрузки столов')
    } finally {
      setIsLoadingTables(false)
    }
  }, [order.restaurantId, language])

  // Открытие диалога выбора стола
  const handleOpenTableSelection = async () => {
    if(selectedTable) {
      confirmTableSelection()
      return
    }
    setShowTableSelection(true)
    await loadTablesAndHalls()
  }

  // Выбор стола
  const handleTableSelect = useCallback((table: TableDto) => {
    // Проверяем, доступен ли стол
    if (table.status !== TableStatus.AVAILABLE) {
      toast.error(
        language === 'ka' 
          ? `სტოლი "${table.name}" დაკავებულია` 
          : `Стол "${table.name}" занят`
      )
      return
    }

    setSelectedTable(table)
    setSelectedTableIds([table.id])
    
    const tableNumber = parseInt(table.name.replace(/\D/g, '')) || 0
    
    setOrder({
      ...order,
      tableNumber: tableNumber,
      tableId: table.id,
      numberOfPeople: Math.min(order.numberOfPeople, table.seats)
    })
    
  }, [order, language])

  // Изменение количества людей с проверкой вместимости стола
  const handleNumberOfPeopleChange = (value: number) => {
    if (selectedTable && value > selectedTable.seats) {
      toast.error(
        language === 'ka' 
          ? `მაქსიმალური რაოდენობა: ${selectedTable.seats} ადამიანი` 
          : `Максимальное количество: ${selectedTable.seats} человек`
      )
      return
    }
    
    setOrder({
      ...order,
      numberOfPeople: Math.max(1, value)
    })
  }

  const confirmTableSelection = () => {
    if (selectedTable) {
      setShowTableSelection(false)
      toast.success(
        language === 'ka' 
          ? `სტოლი "${selectedTable.name}" შერჩეულია` 
          : `Стол "${selectedTable.name}" выбран`
      )
    }
  }

  // Сброс выбора стола
  const clearTableSelection = () => {
    setSelectedTable(null)
    setSelectedTableIds([])
    setOrder({
      ...order,
      tableNumber: 0,
      tableId: undefined
    })
  }

  // Изменение зала
  const handleHallChange = async (hallId: string) => {
    const hall = halls.find(h => h.id === hallId)
    if (!hall) return
    
    setCurrentHall(hall)
    setIsLoadingTables(true)
    
    try {
      const tablesResponse = await TablesService.getTables({
        restaurantId: order.restaurantId,
        hallId: hall.id,
        includeInactive: false
      })
      
      const tablesData = tablesResponse.data || []
      setTables(tablesData.filter(table => 
        table.status === TableStatus.AVAILABLE
      ))
      setSelectedTable(null)
      setSelectedTableIds([])
    } catch (error) {
      console.error('Ошибка загрузки столов зала:', error)
      toast.error(language === 'ka' ? 'შეცდომა სტოლების ჩატვირთვისას' : 'Ошибка загрузки столов зала')
    } finally {
      setIsLoadingTables(false)
    }
  }

  // Найти следующий доступный стол
  const findNextAvailableTable = useCallback((currentTableId?: string) => {
    if (availableTables.length === 0) return null
    
    if (!currentTableId) {
      // Если нет текущего стола - возвращаем первый доступный
      return availableTables[0]
    }
    
    const currentIndex = availableTables.findIndex(t => t.id === currentTableId)
    if (currentIndex === -1) {
      // Если текущий стол не найден в доступных - возвращаем первый
      return availableTables[0]
    }
    
    // Ищем следующий доступный стол
    if (currentIndex < availableTables.length - 1) {
      return availableTables[currentIndex + 1]
    }
    
    // Если это последний стол - возвращаем первый
    return availableTables[0]
  }, [availableTables])

  // Найти предыдущий доступный стол
  const findPreviousAvailableTable = useCallback((currentTableId?: string) => {
    if (availableTables.length === 0) return null
    
    if (!currentTableId) {
      // Если нет текущего стола - возвращаем последний доступный
      return availableTables[availableTables.length - 1]
    }
    
    const currentIndex = availableTables.findIndex(t => t.id === currentTableId)
    if (currentIndex === -1) {
      // Если текущий стол не найден в доступных - возвращаем последний
      return availableTables[availableTables.length - 1]
    }
    
    // Ищем предыдущий доступный стол
    if (currentIndex > 0) {
      return availableTables[currentIndex - 1]
    }
    
    // Если это первый стол - возвращаем последний
    return availableTables[availableTables.length - 1]
  }, [availableTables])

  // Обработчик для кнопки "+" (следующий стол)
  const handleNextTable = async () => {
    // Если не в режиме бронирования - используем старую логику
    if (!restaurantUsesReservation) {
      setOrder({
        ...order,
        tableNumber: order.tableNumber + 1,
        tableId: undefined
      })
      return
    }
    
    // Режим с бронированием - работаем только с доступными столами
    if (!order.restaurantId) {
      toast.error(language === 'ka' ? 'რესტორანი არ არის შერჩეული' : 'Ресторан не выбран')
      return
    }
    
    // Если еще не загружены столы - загружаем
    if (availableTables.length === 0) {
      const loadedTables = await loadAllTables()
      if (loadedTables.length === 0) {
        toast.error(
          language === 'ka' 
            ? 'თავისუფალი სტოლი არ არის' 
            : 'Нет свободных столов'
        )
        return
      }
    }
    
    let nextTable: TableDto | null = null
    
    if (selectedTable) {
      // Если есть выбранный стол - ищем следующий доступный
      nextTable = findNextAvailableTable(selectedTable.id)
    } else if (order.tableNumber > 0 && !order.tableId) {
      // Если введен номер вручную - пытаемся найти стол с этим номером
      const tableWithNumber = availableTables.find(table => {
        const tableNum = parseInt(table.name.replace(/\D/g, '')) || 0
        return tableNum === order.tableNumber
      })
      
      if (tableWithNumber) {
        nextTable = findNextAvailableTable(tableWithNumber.id)
      } else {
        // Если стол с таким номером не найден - берем первый доступный
        nextTable = findNextAvailableTable()
      }
    } else {
      // Если ничего не выбрано - берем первый доступный стол
      nextTable = findNextAvailableTable()
    }
    
    if (nextTable) {
      handleTableSelect(nextTable)
    } else {
      toast.error(
        language === 'ka' 
          ? 'თავისუფალი სტოლი არ არის' 
          : 'Нет свободных столов'
      )
    }
  }

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    
    let number = cleaned;
    if (cleaned.startsWith('8')) {
      number = '7' + cleaned.slice(1);
    } else if (!cleaned.startsWith('7') && cleaned.length > 0) {
      number = '7' + cleaned;
    }
    if (number.length <= 1) return '+7';
    if (number.length <= 4) return `+7 (${number.slice(1, 4)}`;
    if (number.length <= 7) return `+7 (${number.slice(1, 4)}) ${number.slice(4, 7)}`;
    if (number.length <= 9) return `+7 (${number.slice(1, 4)}) ${number.slice(4, 7)}-${number.slice(7, 9)}`;
    return `+7 (${number.slice(1, 4)}) ${number.slice(4, 7)}-${number.slice(7, 9)}-${number.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setOrder({
      ...order,
      phone: formatted
    });
  };

  // Функция для валидации телефона (опционально)
  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 11; // +7 XXX XXX XX XX = 11 цифр
  };

  // Обработчик для кнопки "-" (предыдущий стол)
  const handlePreviousTable = async () => {
    // Если не в режиме бронирования - используем старую логику
    if (!restaurantUsesReservation) {
      const newTableNumber = Math.max(0, order.tableNumber - 1)
      setOrder({
        ...order,
        tableNumber: newTableNumber,
        tableId: undefined
      })
      return
    }
    
    // Режим с бронированием - работаем только с доступными столами
    if (!order.restaurantId) {
      toast.error(language === 'ka' ? 'რესტორანი არ არის შერჩეული' : 'Ресторан не выбран')
      return
    }
    
    // Если еще не загружены столы - загружаем
    if (availableTables.length === 0) {
      const loadedTables = await loadAllTables()
      if (loadedTables.length === 0) {
        toast.error(
          language === 'ka' 
            ? 'თავისუფალი სტოლი არ არის' 
            : 'Нет свободных столов'
        )
        return
      }
    }
    
    let prevTable: TableDto | null = null
    
    if (selectedTable) {
      // Если есть выбранный стол - ищем предыдущий доступный
      prevTable = findPreviousAvailableTable(selectedTable.id)
    } else if (order.tableNumber > 0 && !order.tableId) {
      // Если введен номер вручную - пытаемся найти стол с этим номером
      const tableWithNumber = availableTables.find(table => {
        const tableNum = parseInt(table.name.replace(/\D/g, '')) || 0
        return tableNum === order.tableNumber
      })
      
      if (tableWithNumber) {
        prevTable = findPreviousAvailableTable(tableWithNumber.id)
      } else {
        // Если стол с таким номером не найден - берем последний доступный
        prevTable = findPreviousAvailableTable()
      }
    } else {
      // Если ничего не выбрано - берем последний доступный стол
      prevTable = findPreviousAvailableTable()
    }
    
    if (prevTable) {
      handleTableSelect(prevTable)
    } else {
      toast.error(
        language === 'ka' 
          ? 'თავისუფალი სტოლი არ არის' 
          : 'Нет свободных столов'
      )
    }
  }

  // Очистка выбора стола (для режима с бронированием)
  const handleClearTable = () => {
    if (!restaurantUsesReservation) {
      setOrder({
        ...order,
        tableNumber: 0,
        tableId: undefined
      })
      return
    }
    
    clearTableSelection()
  }

  // Загрузка столов при изменении ресторана
  useEffect(() => {
    if (order.restaurantId && restaurantUsesReservation && order.type === 'DINE_IN') {
      loadAllTables()
    }
  }, [order.restaurantId, restaurantUsesReservation, order.type, loadAllTables])

  // Фильтрация столов по поисковому запросу
  const filteredTables = tables.filter(table => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    return (
      table.name.toLowerCase().includes(searchLower) ||
      table.hall?.title?.toLowerCase().includes(searchLower) ||
      table.seats.toString().includes(searchQuery)
    )
  })

  // Основная функция создания заказа с привязкой стола
  const handleCreateOrderWithTable = async () => {
    // Проверка обязательных полей
    if (!order.restaurantId) {
      toast.error(language === 'ka' ? 'რესტორანი არ არის შერჩეული' : 'Ресторан не выбран')
      return
    }

    if (order.type === 'DINE_IN') {
      // Для заказов в ресторане проверяем наличие стола
      if (!selectedTable && !order.tableId && order.tableNumber === 0) {
        toast.error(language === 'ka' ? 'აირჩიეთ სტოლი' : 'Выберите стол')
        return
      }
    }

    if (order.type === 'DELIVERY' && !order.deliveryAddress) {
      toast.error(language === 'ka' ? 'მიუთითეთ მისამართი' : 'Укажите адрес доставки')
      return
    }

    setIsCreatingOrder(true)

    try {
      // Для заказов в ресторане с системой бронирования
      if (order.type === 'DINE_IN' && restaurantUsesReservation) {
        
        if (!selectedTable) {
          toast.error(language === 'ka' ? 'სტოლი არ არის შერჩეული' : 'Стол не выбран')
          setIsCreatingOrder(false)
          return
        }

        // Проверяем, доступен ли стол
        if (selectedTable.status !== TableStatus.AVAILABLE) {
          toast.error(
            language === 'ka' 
              ? `სტოლი "${selectedTable.name}" აღარ არის თავისუფალი` 
              : `Стол "${selectedTable.name}" больше не доступен`
          )
          setIsCreatingOrder(false)
          await loadAllTables() // Перезагружаем доступные столы
          return
        }


        try {
          // Обновляем статус стола на "Забронирован"
          await TablesService.updateTableStatus(
            selectedTable.id,
            TableStatus.RESERVED,
          )

          // Создаем заказ с привязанным бронированием
          const orderWithReservation = {
            ...order,
            tableId: selectedTable.id,
            tableNumber: parseInt(selectedTable.name.replace(/\D/g, '')) || 0
          }

          setOrder(orderWithReservation)
          
          // Вызываем оригинальную функцию создания заказа
          await onSubmit()
          
          // Уведомление об успешном создании
          toast.success(
            language === 'ka' 
              ? `შეკვეთა შექმნილია, სტოლი "${selectedTable.name}" დაჯავშნულია` 
              : `Заказ создан, стол "${selectedTable.name}" забронирован`
          )

        } catch (error: any) {
          console.error('Ошибка при создании бронирования:', error)
          
          if (error.response?.status === 409) {
            // Стол уже забронирован
            toast.error(
              language === 'ka' 
                ? `სტოლი "${selectedTable.name}" უკვე დაჯავშნულია` 
                : `Стол "${selectedTable.name}" уже забронирован`
            )
            await loadAllTables() // Перезагружаем доступные столы
          } else {
            toast.error(
              language === 'ka' 
                ? 'შეცდომა სტოლის დაჯავშნისას' 
                : 'Ошибка при бронировании стола'
            )
          }
          throw error
        }

      } else if (order.type === 'DINE_IN' && !restaurantUsesReservation) {
        // Для ресторанов без системы бронирования
        if (selectedTable) {
          // Обновляем статус стола на "Занят"
          try {
            await TablesService.updateTableStatus(
              selectedTable.id,
              TableStatus.OCCUPIED,
              order.id // Если у заказа уже есть ID
            )
            
            const orderWithTable = {
              ...order,
              tableId: selectedTable.id,
              tableNumber: parseInt(selectedTable.name.replace(/\D/g, '')) || 0
            }
            
            setOrder(orderWithTable)
          } catch (error) {
            console.error('Ошибка обновления статуса стола:', error)
            toast.error(
              language === 'ka' 
                ? 'შეცდომა სტოლის განახლებისას' 
                : 'Ошибка обновления стола'
            )
          }
        }
        
        // Создаем заказ
        await onSubmit()
        
        if (selectedTable) {
          toast.success(
            language === 'ka' 
              ? `შეკვეთა შექმნილია, სტოლი "${selectedTable.name}" დაკავებულია` 
              : `Заказ создан, стол "${selectedTable.name}" занят`
          )
        }

      } else {
        // Для доставки и самовывоза
        await onSubmit()
      }

    } catch (error) {
      console.error('Ошибка создания заказа:', error)
      // Ошибка уже обработана в блоках выше
    } finally {
      setIsCreatingOrder(false)
    }
  }

  // Функция для привязки стола к существующему заказу
  const assignTableToExistingOrder = async (orderId: string, tableId: string) => {
    try {
      const assignDto = {
        tableId: tableId,
        assignToOrder: true
      }

      const result = await TablesService.assignTableToOrder(orderId, assignDto)
      
      // Обновляем статус стола
      await TablesService.updateTableStatus(tableId, TableStatus.OCCUPIED, orderId)
      
      toast.success(
        language === 'ka' 
          ? 'სტოლი წარმატებით მიეთითა შეკვეთას' 
          : 'Стол успешно привязан к заказу'
      )
      
      return result
    } catch (error) {
      console.error('Ошибка привязки стола:', error)
      toast.error(
        language === 'ka' 
          ? 'შეცდომა სტოლის მითითებისას' 
          : 'Ошибка при привязке стола'
      )
      throw error
    }
  }

  // Функция для создания резервации для отложенного заказа
  const createScheduledReservation = async (orderData: OrderState) => {
    if (!orderData.tableId || !selectedTable) {
      throw new Error('Table not selected')
    }

    
    await TablesService.updateTableStatus(
      selectedTable.id,
      TableStatus.RESERVED,
    )
  }

  // Валидация заказа перед созданием
  const validateOrder = (): boolean => {
    if (!order.restaurantId) {
      toast.error(language === 'ka' ? 'რესტორანი არ არის შერჩეული' : 'Ресторан не выбран')
      return false
    }

    if (order.type === 'DINE_IN') {
      // Для ресторанов с системой бронирования нужен выбранный стол
      if (restaurantUsesReservation && !selectedTable) {
        toast.error(language === 'ka' ? 'აირჩიეთ სტოლი' : 'Выберите стол')
        return false
      }
      
      // Проверяем вместимость стола
      if (selectedTable && order.numberOfPeople > selectedTable.seats) {
        toast.error(
          language === 'ka' 
            ? `სტოლი "${selectedTable.name}" იტევს მაქსიმუმ ${selectedTable.seats} ადამიანს` 
            : `Стол "${selectedTable.name}" вмещает максимум ${selectedTable.seats} человек`
        )
        return false
      }
    }

    if (order.type === 'DELIVERY') {
      if (!order.deliveryAddress) {
        toast.error(language === 'ka' ? 'მიუთითეთ მისამართი' : 'Укажите адрес доставки')
        return false
      }
      
      if (order.deliveryZone && order.deliveryZone.minOrder && order.deliveryZone.minOrder > 0) {
        // Проверка минимального заказа будет выполнена на сервере
        console.log('Минимальный заказ для зоны:', order.deliveryZone.minOrder)
      }
    }

    if (order.isScheduled && order.scheduledAt) {
      const scheduledDate = new Date(order.scheduledAt)
      const now = new Date()
      
      if (scheduledDate < now) {
        toast.error(language === 'ka' ? 'შეარჩიეთ მომავალი დრო' : 'Выберите будущее время')
        return false
      }
    }

    return true
  }

  const orderTypes = [
    {
      value: 'DINE_IN',
      icon: <Utensils className="h-8 w-8" />,
      label: language === 'ka' ? 'რესტორანში' : 'В ресторане',
      desc: language === 'ka' ? 'მაგიდაზე' : 'За столом'
    },
    {
      value: 'TAKEAWAY',
      icon: <ShoppingBag className="h-8 w-8" />,
      label: language === 'ka' ? 'თვითწოდება' : 'Самовывоз',
      desc: language === 'ka' ? 'რესტორანიდან' : 'Из ресторана'
    },
    {
      value: 'DELIVERY',
      icon: <Truck className="h-8 w-8" />,
      label: language === 'ka' ? 'მიტანა' : 'Доставка',
      desc: language === 'ka' ? 'მისამართზე' : 'На адрес'
    },
    {
      value: 'BANQUET',
      icon: <Calendar className="h-8 w-8" />,
      label: language === 'ka' ? 'ბანკეტი' : 'Банкет',
      desc: language === 'ka' ? 'დაჯავშნული' : 'Предзаказ'
    }
  ]

  type PaymentMethodType = "CASH" | "CARD" | "CASH_TO_COURIER" | "CARD_TO_COURIER";
  const paymentMethods: Array<{
    value: PaymentMethodType;
    label: string;
    icon: JSX.Element;
    desc: string;
  }> = [
    { 
      value: 'CASH', 
      label: language === 'ka' ? 'ნაღდი' : 'Наличные',  
      icon: <Wallet className="h-6 w-6" />,
      desc: language === 'ka' ? 'რესტორანში' : 'В ресторане'
    },
    { 
      value: 'CARD', 
      label: language === 'ka' ? 'ბარათით' : 'Картой', 
      icon: <CreditCard className="h-6 w-6" />,
      desc: language === 'ka' ? 'რესტორანში' : 'В ресторане'
    },
    { 
      value: 'CASH_TO_COURIER', 
      label: language === 'ka' ? 'კურიერს' : 'Наличными', 
      icon: <Wallet className="h-6 w-6" />,
      desc: language === 'ka' ? 'კურიერს' : 'Курьеру'
    },
    { 
      value: 'CARD_TO_COURIER', 
      label: language === 'ka' ? 'კურიერს' : 'Картой', 
      icon: <CreditCard className="h-6 w-6" />,
      desc: language === 'ka' ? 'კურიერს' : 'Курьеру'
    },
  ]

  // Диалог выбора ресторана
  const RestaurantDialog = () => (
    <Dialog open={isRestaurantDialogOpen} onOpenChange={setIsRestaurantDialogOpen}>
      <DialogContentExtraWide className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {language === 'ka' ? 'აირჩიეთ რესტორანი' : 'Выберите ресторан'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {user?.restaurant?.map((restaurant: any) => (
            <div
              key={restaurant.id}
              className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all hover:shadow-lg ${
                selectedRestaurant?.id === restaurant.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => handleSelectRestaurant(restaurant)}
            > 
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-bold text-gray-900">
                      {restaurant.title}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContentExtraWide>
    </Dialog>
  )

  // Диалог выбора стола
  const TableSelectionDialog = () => (
    <Dialog open={showTableSelection} onOpenChange={setShowTableSelection}>
      <DialogContentExtraWide className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {language === 'ka' ? 'აირჩიეთ სტოლი' : 'Выберите стол'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ka' 
              ? 'დააწკაპუნეთ სტოლზე შესარჩევად' 
              : 'Нажмите на стол для выбора'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Поиск и фильтры */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder={language === 'ka' ? 'ძიება სტოლის მიხედვით...' : 'Поиск по столам...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
            </div>
            
            {/* Выбор зала */}
            {halls.length > 1 && (
              <div className="space-y-3">
                <Label className="text-lg font-semibold">
                  {language === 'ka' ? 'აირჩიეთ დარბაზი' : 'Выберите зал'}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {halls.map(hall => (
                    <Button
                      key={hall.id}
                      variant={currentHall?.id === hall.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleHallChange(hall.id)}
                    >
                      {hall.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Индикатор загрузки */}
          {isLoadingTables ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <span className="ml-3 text-lg">
                {language === 'ka' ? 'სტოლების ჩატვირთვა...' : 'Загрузка столов...'}
              </span>
            </div>
          ) : (
            <>
              {/* Отображение столов */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredTables.map(table => {
                  const isSelected = selectedTableIds.includes(table.id)
                  const isAvailable = table.status === TableStatus.AVAILABLE
                  const isOccupied = table.status === TableStatus.OCCUPIED
                  const isReserved = table.status === TableStatus.RESERVED
                  
                  return (
                    <div
                      key={table.id}
                      className={`relative rounded-lg border-2 p-4 transition-all ${
                        isAvailable
                          ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md'
                          : 'cursor-not-allowed'
                      } ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : isAvailable
                          ? 'border-green-200 hover:border-green-400 hover:bg-green-50'
                          : isOccupied
                          ? 'border-red-200 bg-red-50 opacity-70'
                          : isReserved
                          ? 'border-yellow-200 bg-yellow-50 opacity-70'
                          : 'border-gray-200 bg-gray-50 opacity-50'
                      }`}
                      onClick={() => isAvailable && handleTableSelect(table)}
                      title={
                        !isAvailable 
                          ? language === 'ka'
                            ? `სტოლი "${table.name}" დაკავებულია`
                            : `Стол "${table.name}" занят`
                          : `${table.name} - ${table.seats} ${language === 'ka' ? 'ადამიანი' : 'человек'}`
                      }
                    >
                      {/* Индикатор статуса */}
                      <div className="absolute top-2 right-2">
                        <div className={`w-3 h-3 rounded-full ${
                          isAvailable ? 'bg-green-500' :
                          isOccupied ? 'bg-red-500' :
                          isReserved ? 'bg-yellow-500' : 'bg-gray-400'
                        }`} />
                      </div>

                      {/* Информация о столе */}
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-1">{table.name}</div>
                        <div className="text-sm text-gray-600 mb-2">
                          {table.seats} {language === 'ka' ? 'ადამიანი' : 'чел.'}
                        </div>
                        
                        {/* Зал */}
                        {table.hall && (
                          <div className="text-xs text-gray-500 mb-2">
                            {table.hall.title}
                          </div>
                        )}
                        
                        {/* Статус */}
                        <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                          isAvailable ? 'bg-green-100 text-green-800' :
                          isOccupied ? 'bg-red-100 text-red-800' :
                          isReserved ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {language === 'ka'
                            ? isAvailable ? 'თავისუფალი' :
                              isOccupied ? 'დაკავებული' :
                              isReserved ? 'დაჯავშნული' : 'არ არის ხელმისაწვდომი'
                            : isAvailable ? 'Свободен' :
                              isOccupied ? 'Занят' :
                              isReserved ? 'Забронирован' : 'Недоступен'
                          }
                        </div>

                        {/* Кнопка выбора */}
                        {isSelected && (
                          <div className="mt-2">
                            <CheckCircle className="h-5 w-5 text-blue-500 mx-auto" />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                {filteredTables.length === 0 && !isLoadingTables && (
                  <div className="col-span-full text-center py-10">
                    <Grid2x2Check className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600">
                      {language === 'ka' ? 'სტოლი არ მოიძებნა' : 'Столы не найдены'}
                    </h3>
                    <p className="text-gray-500 mt-2">
                      {language === 'ka' 
                        ? 'შეცვალეთ ძიების პარამეტრები ან სხვა დარბაზი'
                        : 'Измените параметры поиска или выберите другой зал'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-6">
          {selectedTable && (
            <div className="flex-1">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">
                      {language === 'ka' ? 'შერჩეული სტოლი:' : 'Выбранный стол:'}
                    </span>
                    <span className="ml-2 font-bold text-lg">{selectedTable.name}</span>
                    <span className="ml-2 text-gray-600">
                      ({selectedTable.seats} {language === 'ka' ? 'ადამიანი' : 'чел.'})
                    </span>
                    {selectedTable.hall && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({selectedTable.hall.title})
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearTableSelection}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          <Button
            onClick={confirmTableSelection}
            disabled={!selectedTable}
          >
            {language === 'ka' ? 'დადასტურება' : 'Подтвердить'}
          </Button>
        </DialogFooter>
      </DialogContentExtraWide>
    </Dialog>
  )

  return (
    <div>
      {/* Шапка */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 '>
        <div className='flex flex-row items-center'>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {language === 'ka' ? 'ახალი შეკვეთა' : 'Новый заказ в ресторане '}
          </h1>
          
          {selectedRestaurant && (
            <Dialog open={isRestaurantDialogOpen} onOpenChange={setIsRestaurantDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-3xl md:text-4xl font-bold text-blue-600 hover:text-blue-700 hover:bg-white px-3 py-6 h-auto"
                >
                  {selectedRestaurant.title}
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
        </div>

        {false && user?.restaurant && user.restaurant.length > 1 && (
          <div className="hidden md:flex items-center gap-4">
            <Store className="h-6 w-6 text-gray-600" />
            <Select
              value={order.restaurantId}
              onValueChange={handleRestaurantChange}
            >
              <SelectTrigger className="w-64 h-12 text-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {user.restaurant.map((restaurant: any) => (
                  <SelectItem key={restaurant.id} value={restaurant.id} className="text-lg py-3">
                    {restaurant.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Статус ресторана */}
      {restaurantStatus && !restaurantStatus.isOpen && (
        <div className="bg-amber-100 border-2 border-amber-300 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-amber-800 font-semibold text-xl">
                {restaurantStatus.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {order.isScheduled && selectedRestaurant && restaurantStatus && !restaurantStatus.isOpen && (
        <div className="bg-blue-100 border-2 border-blue-300 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-blue-800 font-semibold text-xl">
                {language === 'ka' ? 'შეკვეთა დაგეგმილია' : 'Отложенный заказ'}. 
                {language === 'ka' 
                  ? ' შეკვეთა შეიქმნება რესტორანის სამუშაო საათებში'
                  : ' Заказ будет создан в рабочее время ресторана'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Левая колонка - Основная информация */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-8">
            {/* Тип заказа */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Utensils className="h-8 w-8 text-blue-600" />
                {language === 'ka' ? 'შეკვეთის ტიპი' : 'Тип заказа'}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {orderTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      const newOrder = {
                        ...order,
                        type: type.value as any,
                        deliveryZone: null,
                        surcharges: [],
                        tableNumber: 0,
                        tableId: undefined,
                        payment: type.value === 'DELIVERY'
                          ? { method: 'CASH_TO_COURIER', status: 'PENDING' }
                          : { method: 'CASH', status: 'PENDING' }
                      }
                      
                      // Если не DINE_IN, сбрасываем выбранный стол
                      if (type.value !== 'DINE_IN') {
                        setSelectedTable(null)
                        setSelectedTableIds([])
                        setAllTables([])
                        setAvailableTables([])
                      }
                      
                      setOrder(newOrder) 
                    }}
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                      order.type === type.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <div className={`p-3 rounded-full mb-3 ${
                      order.type === type.value
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {type.icon}
                    </div>
                    <span className="text-xl font-semibold mb-1">{type.label}</span>
                    <span className="text-gray-600">{type.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Способ оплаты (для доставки) */}
            {order.type === 'DELIVERY' && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Banknote className="h-8 w-8 text-green-600" />
                  {language === 'ka' ? 'გადახდის მეთოდი' : 'Способ оплаты'}
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setOrder({
                        ...order,
                        payment: { ...order.payment, method: method.value }
                      })}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                        order.payment.method === method.value
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white hover:border-green-400 hover:bg-green-50'
                      }`}
                    >
                      <div className={`p-2 rounded-full mb-2 ${
                        order.payment.method === method.value
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {method.icon}
                      </div>
                      <span className="text-lg font-semibold mb-1">{method.label}</span>
                      <span className="text-gray-600">{method.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Детали заказа */}
            <div className="bg-white rounded-2xl p-6 shadow-lg w-full flex flex-col">
              <h2 className="text-2xl font-bold mb-6">
                {language === 'ka' ? 'დეტალები' : 'Детали заказа'}
              </h2>
              
              <div className="flex flex-col md:flex-row gap-6 mb-6 w-full">
                {/* Телефон */}
                {order.type !== 'DINE_IN' && (
  <div className="space-y-3 w-full">
    <Label className="text-xl font-semibold flex items-center gap-3">
      <Phone className="h-6 w-6 text-gray-600" />
      {language === 'ka' ? 'ტელეფონი' : 'Телефон'}
    </Label>
    <Input
      type="tel"
      placeholder="+7 (999) 999-99-99"
      value={order.phone || ''}
      onChange={handlePhoneChange}
      className="h-14 text-lg font-mono"
      maxLength={18} 
    />
  </div>
)}

                {/* Количество людей и номер стола */}
                <div className="flex flex-col md:flex-row gap-4 w-full">
                  {/* Количество людей */}
                  <div className="flex-1 min-w-0">
                    <div className="space-y-3 w-full">
                      <Label className="text-xl font-semibold flex items-center gap-3">
                        <Users className="h-6 w-6 text-gray-600" />
                        {language === 'ka' ? 'ადამიანები' : 'Люди'}
                      </Label>
                      <div className="flex items-center w-full">
                        <Button
                          variant="outline"
                          size="lg"
                          className="h-14 w-14 flex-shrink-0 text-2xl"
                          onClick={() => handleNumberOfPeopleChange(order.numberOfPeople - 1)}
                        >
                          <Minus className='h-8 w-8'/>
                        </Button>
                        <div className="flex-1 mx-2">
                          <Input
                            type="number"
                            min="1"
                            max={selectedTable?.seats || 100}
                            value={order.numberOfPeople}
                            onChange={(e) => handleNumberOfPeopleChange(parseInt(e.target.value) || 1)}
                            className="h-14 text-2xl text-center font-bold w-full"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="lg"
                          className="h-14 w-14 flex-shrink-0 text-2xl"
                          onClick={() => handleNumberOfPeopleChange(order.numberOfPeople + 1)}
                        >
                          <Plus className='h-8 w-8'/>
                        </Button>
                      </div>
                      {selectedTable && (
                        <p className="text-sm text-gray-600 mt-1">
                          {language === 'ka' 
                            ? `მაქსიმუმ ${selectedTable.seats} ადამიანი` 
                            : `Максимум ${selectedTable.seats} человек`}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Номер стола (только для DINE_IN) */}
                  {order.type === 'DINE_IN' && (
                    <div className="flex-1 min-w-0">
                      <div className="space-y-3 w-full">
                        <Label className="text-xl font-semibold flex items-center gap-3">
                          <TableIcon className="h-6 w-6 text-gray-600" />
                          {language === 'ka' ? 'სტოლი' : 'Стол'}
                        </Label>
                        <div className="flex items-center w-full">
                          <Button
                            variant="outline"
                            size="lg"
                            className="h-14 w-14 flex-shrink-0 text-2xl"
                            onClick={restaurantUsesReservation ? handlePreviousTable : () => {
                              const newTableNumber = Math.max(1, order.tableNumber - 1)
                              setOrder({
                                ...order,
                                tableNumber: newTableNumber,
                                tableId: undefined
                              })
                              setSelectedTable(null)
                            }}
                            title={restaurantUsesReservation 
                              ? language === 'ka' 
                                ? 'წინა თავისუფალი სტოლი' 
                                : 'Предыдущий свободный стол'
                              : language === 'ka'
                                ? 'წინა ნომერი'
                                : 'Предыдущий номер'
                            }
                          >
                            <Minus className='h-8 w-8'/>
                          </Button>
                          
                          <div className="flex-1 mx-2">
                            <Input
                              type="number"
                              min="1"
                              value={order.tableNumber || ''}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0
                                const newValue = Math.max(1, value)
                                setOrder({
                                  ...order,
                                  tableNumber: newValue,
                                  tableId: undefined
                                })
                                setSelectedTable(null)
                                setSelectedTableIds([])
                                
                                // В режиме с бронированием пытаемся найти стол с таким номером
                                if (restaurantUsesReservation && newValue > 0 && availableTables.length > 0) {
                                  const tableWithNumber = availableTables.find(table => {
                                    const tableNum = parseInt(table.name.replace(/\D/g, '')) || 0
                                    return tableNum === newValue && table.status === TableStatus.AVAILABLE
                                  })
                                  
                                  if (tableWithNumber) {
                                    handleTableSelect(tableWithNumber)
                                  }
                                }
                              }}
                              className="h-14 text-2xl text-center font-bold w-full"
                              placeholder={language === 'ka' ? '№' : '№'}
                            />
                          </div>
                          
                          <Button
                            variant="outline"
                            size="lg"
                            className="h-14 w-14 flex-shrink-0 text-2xl"
                            onClick={restaurantUsesReservation ? handleNextTable : () => {
                              const newTableNumber = order.tableNumber + 1
                              setOrder({
                                ...order,
                                tableNumber: newTableNumber,
                                tableId: undefined
                              })
                              setSelectedTable(null)
                            }}
                            title={restaurantUsesReservation 
                              ? language === 'ka' 
                                ? 'შემდეგი თავისუფალი სტოლი' 
                                : 'Следующий свободный стол'
                              : language === 'ka'
                                ? 'შემდეგი ნომერი'
                                : 'Следующий номер'
                            }
                          >
                            <Plus className='h-8 w-8'/>
                          </Button>
                          
                          {/* Кнопка выбора из списка доступных столов */}
                          <Button
                            variant={selectedTable ? "default" : "outline"}
                            size="lg"
                            title={language === 'ka' ? 'აირჩიეთ სტოლი' : 'Выбрать стол'}
                            className={`h-14 w-14 flex-shrink-0 text-3xl ml-2 ${
                              selectedTable ? 'bg-green-600 hover:bg-green-700' : ''
                            }`}
                            onClick={handleOpenTableSelection}
                          >
                            {selectedTable ? <Check className='h-8 w-8'/> : <Grid2x2Check className='h-8 w-8'/>}
                          </Button>
                          
                          {/* Кнопка очистки (только если что-то выбрано) */}
                          {(selectedTable || (order.tableNumber > 0 && !selectedTable)) && (
                            <Button
                              variant="ghost"
                              size="lg"
                              title={language === 'ka' ? 'გასუფთავება' : 'Очистить'}
                              className="h-14 w-14 flex-shrink-0 text-2xl ml-1"
                              onClick={restaurantUsesReservation ? clearTableSelection : () => {
                                setOrder({
                                  ...order,
                                  tableNumber: 0,
                                  tableId: undefined
                                })
                                setSelectedTable(null)
                              }}
                            >
                              <X className='h-8 w-8'/>
                            </Button>
                          )}
                        </div>
                        
                        {/* Отображение выбранного стола */}
                        {selectedTable && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-green-700">{selectedTable.name}</span>
                                <span className="ml-2 text-gray-600">
                                  ({selectedTable.seats} {language === 'ka' ? 'ადამიანი' : 'чел.'})
                                </span>
                                {selectedTable.hall && (
                                  <Badge variant="secondary" className="ml-2 text-sm">
                                    {selectedTable.hall.title}
                                  </Badge>
                                )}
                              </div>
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                {language === 'ka' ? 'თავისუფალი' : 'Свободен'}
                              </Badge>
                            </div>
                          </div>
                        )}
                        
                        {/* Отображение ручного ввода номера */}
                        {order.tableNumber > 0 && !selectedTable && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-blue-700">
                                  {language === 'ka' ? 'სტოლი' : 'Стол'} №{order.tableNumber}
                                </span>
                                <span className="ml-2 text-sm text-gray-600">
                                  {restaurantUsesReservation
                                    ? `(${language === 'ka' ? 'სტოლი არ არის ნაპოვნი თავისუფალებში' : 'Стол не найден среди свободных'})`
                                    : `(${language === 'ka' ? 'მითითებულია ნომერი' : 'Указан номер'})`
                                  }
                                </span>
                              </div>
                              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                {restaurantUsesReservation
                                  ? language === 'ka' ? 'არ არის თავისუფალი' : 'Не свободен'
                                  : language === 'ka' ? 'მითითებულია' : 'Указан'
                                }
                              </Badge>
                            </div>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Комментарий */}
              <div className="space-y-3">
                <Label className="text-xl font-semibold flex items-center gap-3">
                  <MessageCircle className="h-6 w-6 text-gray-600" />
                  {language === 'ka' ? 'კომენტარი' : 'Комментарий'}
                </Label>
                <Textarea
                  value={order.comment || ''}
                  onChange={(e) => setOrder({
                    ...order,
                    comment: e.target.value
                  })}
                  className="min-h-[100px] text-lg"
                  placeholder={language === 'ka' ? 'დამატებითი ინფორმაცია...' : 'Дополнительная информация...'}
                />
              </div>
            </div>

            {/* Доставка */}
           {order.type === 'DELIVERY' && (
  <div className="bg-white rounded-2xl p-6 shadow-lg">
    {/* Заголовок */}
    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
      <Truck className="h-8 w-8 text-orange-600" />
      {language === 'ka' ? 'მიტანის ინფორმაცია' : 'Информация о доставке'}
    </h2>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Левая колонка: Адрес и зона доставки */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-600" />
            {language === 'ka' ? 'მისამართი' : 'Адрес доставки'}
          </Label>
          <AddressInput
            value={order.deliveryAddress}
            onChange={(e: any) => setOrder({
              ...order,
              deliveryAddress: e.target.value,
              deliveryZone: null
            })}
            language={language as any}
            restaurantId={order.restaurantId}
            onZoneFound={(zone) => {
              setOrder({
                ...order,
                deliveryZone: zone
              })
            }}
            className="w-full"
          />
        </div>

        {order.deliveryZone && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-lg font-semibold text-green-800">
                  {order.deliveryZone.title}
                </span>
                {order.deliveryZone.minOrder && order.deliveryZone.minOrder > 0 && (
                  <p className="text-sm text-green-600">
                    {language === 'ka' ? 'მინიმალური შეკვეთა' : 'Мин. заказ'}: 
                    <span className="font-medium ml-1">{order.deliveryZone.minOrder} ₽</span>
                  </p>
                )}
              </div>
              <Badge variant="secondary" className="text-base px-4 py-1.5 bg-white shadow-sm">
                {order.deliveryZone.price} ₽
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Правая колонка: Время доставки */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold flex items-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-orange-600" />
          {language === 'ka' ? 'მიტანის დრო' : 'Время доставки'}
        </Label>
        
        <div className="space-y-3">
          {/* Карточка "Как можно скорее" */}
          <div 
            className={`
              flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer 
              transition-all duration-200
              ${deliverAsSoonAsPossible 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/30'
              }
            `}
            onClick={() => {
              setDeliverAsSoonAsPossible(!deliverAsSoonAsPossible)
              if (!deliverAsSoonAsPossible) {
                setOrder({
                  ...order,
                  deliveryTime: undefined
                })
              }
            }}
          >
            <span className="font-medium">
              {language === 'ka' ? 'რაც შეიძლება მალე' : 'Как можно скорее'}
            </span>
            <div className={`
              w-6 h-6 rounded-md border-2 flex items-center justify-center
              ${deliverAsSoonAsPossible 
                ? 'bg-orange-500 border-orange-500' 
                : 'border-gray-300 bg-white'
              }
            `}>
              {deliverAsSoonAsPossible && (
                <Check className="h-4 w-4 text-white" />
              )}
            </div>
          </div>

          {/* Выбор конкретного времени */}
         {!deliverAsSoonAsPossible && (
  <div className="p-4 border-2 border-gray-200 rounded-xl space-y-2">
    <p className="text-sm text-gray-600 mb-2">
      {language === 'ka' ? 'აირჩიეთ მიტანის დრო' : 'Выберите время доставки'}
    </p>
    <Input
      type="time"
      value={order.deliveryTime ? 
        new Date(order.deliveryTime).toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }) : ''}
      onChange={(e) => {
        const timeString = e.target.value;
        if (timeString) {
          const [hours, minutes] = timeString.split(':');
          const dateTime = new Date();
          dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          if (dateTime < new Date()) {
            dateTime.setDate(dateTime.getDate() + 1);
          }
          
          setOrder({
            ...order,
            deliveryTime: dateTime.toISOString()
          });
        } else {
          setOrder({
            ...order,
            deliveryTime: undefined
          });
        }
      }}
      className="h-12 text-lg w-full"
    />
  </div>
)}
        </div>
      </div>
    </div>
  </div>
)}
          </div>
        </div>

        {/* Правая колонка - Действия и информация */}
        <div className="space-y-8">
          {/* Отложенный заказ */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div 
              className="flex justify-between items-center gap-3 cursor-pointer"
              onClick={() => !(order.type === 'BANQUET') && handleScheduledChange(!order.isScheduled )}
            >
              <div className='flex items-center gap-2 mb-2'>
                <Clock className="h-6 w-6 text-blue-600" />
                
                <h3 className="text-xl font-bold">
                  {language === 'ka' ? 'დაგეგმილი შეკვეთა' : 'Отложенный заказ'}
                </h3>
              </div>
          
              <Checkbox
                id="scheduled-order"
                checked={order.type === 'BANQUET' ? true : (order.isScheduled || false)}
                onCheckedChange={handleScheduledChange}
                disabled={order.type === 'BANQUET'}
                className="h-6 w-6"
              />
            </div>
            
            {order.isScheduled && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    {language === 'ka' ? 'დაგეგმვის დრო' : 'Время отложенного заказа'}
                  </Label>
                  <DateTimePicker
                    date={scheduledTime}
                    setDate={handleScheduledTimeChange}
                    placeholder={language === 'ka' ? 'აირჩიეთ თარიღი და დრო' : 'Выберите дату и время'}
                    className="w-full"
                    dateFormat="dd.MM.yyyy"
                    timeFormat="24h"
                    showSeconds={false}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Сводка заказа */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-2xl font-bold mb-6">
              {language === 'ka' ? 'შეკვეთის შეჯამება' : 'Сводка заказа'}
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg text-gray-600">{language === 'ka' ? 'ტიპი' : 'Тип'}</span>
                <span className="text-xl font-semibold">
                  {orderTypes.find(t => t.value === order.type)?.label}
                </span>
              </div>
              
              {order.type === 'DELIVERY' && order.deliveryZone && (
                <div className="flex justify-between items-center">
                  <span className="text-lg text-gray-600">{language === 'ka' ? 'მიტანა' : 'Доставка'}</span>
                  <span className="text-xl font-semibold text-green-600">
                    {order.deliveryZone.price} ₽
                  </span>
                </div>
              )}
              
              {order.type === 'DELIVERY' && (
                <div className="flex justify-between items-center">
                  <span className="text-lg text-gray-600">{language === 'ka' ? 'გადახდა' : 'Оплата'}</span>
                  <span className="text-xl font-semibold">
                    {paymentMethods.find(p => p.value === order.payment.method)?.label} ({paymentMethods.find(p => p.value === order.payment.method)?.desc})
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-lg text-gray-600">{language === 'ka' ? 'ადამიანები' : 'Люди'}</span>
                <span className="text-xl font-semibold">{order.numberOfPeople}</span>
              </div>
              
              {order.type === 'DINE_IN' && (order.tableNumber > 0 || selectedTable) && (
                <div className="flex justify-between items-center">
                  <span className="text-lg text-gray-600">{language === 'ka' ? 'სტოლი' : 'Стол'}</span>
                  <span className="text-xl font-semibold">
                    {selectedTable?.name || order.tableNumber}
                    {selectedTable && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({selectedTable.seats} {language === 'ka' ? 'ად.' : 'чел.'})
                        {selectedTable.hall && (
                          <span className="ml-1">
                            ({selectedTable.hall.title})
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {order.isScheduled && (
                <div className="flex justify-between items-center">
                  <span className="text-lg text-gray-600">{language === 'ka' ? 'დაგეგმილი დრო' : 'Время заказа'}</span>
                  <span className="text-xl font-semibold">
                    {scheduledTime ? format(scheduledTime, 'dd.MM.yyyy HH:mm') : '-'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Кнопка создания */}
          <Button
            onClick={handleCreateOrderWithTable}
            className="w-full h-16 text-2xl font-bold shadow-lg hover:shadow-xl transition-shadow"
            disabled={
              isCreatingOrder || 
              loading || 
              (order.type === 'DINE_IN' && restaurantUsesReservation && !selectedTable)
            }
          >
            {isCreatingOrder ? (
              <span className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                {language === 'ka' ? 'შექმნა...' : 'Создание...'}
              </span>
            ) : (
              <span className="flex items-center gap-3">
                {language === 'ka' ? 'შეკვეთის შექმნა' : 'Создать заказ'}
              </span>
            )}
          </Button>

          {/* Информация о привязке стола */}
          {order.type === 'DINE_IN' && restaurantUsesReservation && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
              <div className="flex items-start gap-3">
                <TableIcon className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <p className="text-blue-800 font-semibold">
                    {language === 'ka' 
                      ? 'შეკვეთის შექმნისას სტოლი ავტომატურად დაჯავშნული იქნება'
                      : 'При создании заказа стол будет автоматически забронирован'}
                  </p>
                  <p className="text-blue-600 text-sm mt-1">
                    {language === 'ka'
                      ? 'სტოლის სტატუსი შეიცვლება "დაჯავშნულზე"'
                      : 'Статус стола изменится на "Забронирован"'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <RestaurantDialog />
      <TableSelectionDialog />
    </div>
  )
}