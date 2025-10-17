'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Send, 
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  ShoppingBag,
  Utensils,
  MessageSquare,
  Settings,
  Zap,
  Brain,
  Volume2,
  VolumeX,
  Edit,
  Trash2,
  Plus,
  Minus,
  Clock,
  Star,
  X
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { OrderService } from '@/lib/api/order.service'
import { ProductService } from '@/lib/api/product.service'
import { CategoryService } from '@/lib/api/category.service'
import { useLanguageStore } from '@/lib/stores/language-store'

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface Product {
  id: string
  title: string
  price: number
  categoryId: string
  description?: string
  images?: string[]
  additives?: any[]
  restaurantPrices?: Array<{
    restaurantId: string
    price: number
  }>
}

interface ParsedOrderItem {
  product: Product
  quantity: number
  comment?: string
  additives?: string[]
  modifiers?: string[]
}

interface ParsedOrder {
  items: ParsedOrderItem[]
  comment?: string
  numberOfPeople?: number
  tableNumber?: string
  confidence: number
  rawResponse?: any
}

interface AIConfig {
  model: string
  temperature: number
  maxTokens: number
  useAdvancedParsing: boolean
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface AIActionResponse {
  action: 'ADD_ITEMS' | 'UPDATE_ORDER_TYPE' | 'UPDATE_DETAILS' | 'REMOVE_ITEMS' | 'SHOW_ORDER' | 'ANSWER_QUESTION' | 'CLEAR_ORDER'
  itemsToAdd?: Array<{
    productId: string
    productTitle: string
    quantity: number
    comment?: string
  }>
  itemsToRemove?: string[]
  newOrderType?: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'
  updatedDetails?: {
    numberOfPeople?: number
    tableNumber?: string
    comment?: string
  }
  response: string
  confidence: number
}

interface VoiceAssistantSheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  orderId?: string
}

export function VoiceAssistantSheet({ 
  open = false, 
  onOpenChange,
  orderId 
}: VoiceAssistantSheetProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { language } = useLanguageStore()
  
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [order, setOrder] = useState<ParsedOrder | null>(null)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [manualInput, setManualInput] = useState('')
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN')
  const [additionalInfo, setAdditionalInfo] = useState({
    numberOfPeople: 1,
    tableNumber: '',
    comment: ''
  })

  const [aiConfig, setAiConfig] = useState<AIConfig>({
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
    useAdvancedParsing: true
  })

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [audioFeedback, setAudioFeedback] = useState(true)

  // Добавляем состояние для отслеживания таймера отпускания
  const [isButtonPressed, setIsButtonPressed] = useState(false)
  const releaseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isAutoSendRef = useRef(false)
  const finalTranscriptRef = useRef('')

  const getRestaurantId = (): string => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('selectedRestaurantId') || ''
  }

  const translations = {
    ru: {
      title: "Голосовой ассистент",
      subtitle: "Нажмите и удерживайте кнопку для записи голоса",
      listening: "Слушаю...",
      startListening: "Нажмите и говорите",
      stopListening: "Отпустите чтобы отправить",
      processing: "Обработка ИИ...",
      sendToAI: "Отправить",
      createOrder: "Создать заказ",
      creatingOrder: "Создание заказа...",
      orderCreated: "Заказ успешно создан",
      manualInput: "Или введите заказ текстом:",
      placeholder: "Например: 'Два борща, один шашлык из баранины'",
      speakNow: "Говорите сейчас...",
      recognizedText: "Распознанный текст:",
      parsedOrder: "Распознанный заказ:",
      noItems: "Нет товаров в заказе",
      items: "Позиции",
      quantity: "Количество",
      product: "Товар",
      price: "Цена",
      total: "Итого",
      additionalInfo: "Дополнительная информация",
      numberOfPeople: "Количество персон",
      tableNumber: "Номер стола",
      comment: "Комментарий к заказу",
      orderType: "Тип заказа",
      dineIn: "В ресторане",
      takeaway: "С собой",
      delivery: "Доставка",
      errorNoRestaurant: "Не удалось определить ресторан",
      errorNoProducts: "Не удалось загрузить меню",
      errorProcessing: "Ошибка при обработке запроса",
      errorCreatingOrder: "Ошибка при создании заказа",
      clear: "Очистить",
      goBack: "Назад к заказу",
      confidence: "Уверенность ИИ",
      settings: "Настройки",
      aiModel: "Модель ИИ",
      temperature: "Температура",
      maxTokens: "Макс. токенов",
      advancedParsing: "Расширенный парсинг",
      audioFeedback: "Голос",
      conversation: "Диалог",
      aiResponse: "Ответ ИИ",
      speakResponse: "Озвучить ответ",
      stopSpeech: "Остановить речь",
      confirmAndCreate: "Подтвердить заказ",
      viewOrder: "Просмотреть заказ",
      continueEditing: "Продолжить редактирование",
      noRestaurantSelected: "Ресторан не выбран. Пожалуйста, выберите ресторан сначала.",
      pressAndHold: "Нажмите и удерживайте для записи",
      recording: "Запись... Отпустите чтобы отправить"
    },
    ka: {
      title: "ხმოვანი ასისტენტი",
      subtitle: "დააჭირეთ და დაიჭირეთ ღილაკი ხმის ჩასაწერად",
      listening: "მოვუსმინოთ...",
      startListening: "დააჭირეთ და თქვით",
      stopListening: "გაათავისუფლეთ რომ გაგზავნოთ",
      processing: "AI-ის მუშავდება...",
      sendToAI: "გაგზავნა დასამუშავებლად",
      createOrder: "შეკვეთის შექმნა",
      creatingOrder: "შეკვეთა იქმნება...",
      orderCreated: "შეკვეთა წარმატებით შეიქმნა",
      manualInput: "ან შეიყვანეთ შეკვეთა ტექსტურად:",
      placeholder: "მაგალითად: 'ორი ბორში, ერთი ოლივიეს სალათი და სამი კომპოტი'",
      speakNow: "ისაუბრეთ ახლა...",
      recognizedText: "ამოცნობილი ტექსტი:",
      parsedOrder: "ამოცნობილი შეკვეთა:",
      noItems: "შეკვეთაში ნივთები არ არის",
      items: "პოზიციები",
      quantity: "რაოდენობა",
      product: "პროდუქტი",
      price: "ფასი",
      total: "სულ",
      additionalInfo: "დამატებითი ინფორმაცია",
      numberOfPeople: "პირების რაოდენობა",
      tableNumber: "სტოლის ნომერი",
      comment: "კომენტარი შეკვეთაზე",
      orderType: "შეკვეთის ტიპი",
      dineIn: "რესტორნში",
      takeaway: "წინასწარ",
      delivery: "მიწოდება",
      errorNoRestaurant: "რესტორანის განსაზღვრა ვერ მოხერხდა",
      errorNoProducts: "მენიუს ჩატვირთვა ვერ მოხერხდა",
      errorProcessing: "მოთხოვნის დამუშავების შეცდომა",
      errorCreatingOrder: "შეკვეთის შექმნის შეცდომა",
      clear: "გასუფთავება",
      goBack: "უკან შეკვეთაზე",
      confidence: "AI-ის ნდობა",
      settings: "AI-ის პარამეტრები",
      aiModel: "AI მოდელი",
      temperature: "ტემპერატურა",
      maxTokens: "მაქს. ტოკენები",
      advancedParsing: "გაფართოებული პარსინგი",
      audioFeedback: "ხმოვანი უკუკავშირი",
      conversation: "დიალოგი AI-სთან",
      aiResponse: "AI-ის პასუხი",
      speakResponse: "პასუხის გახმოვანება",
      stopSpeech: "საუბრის შეჩერება",
      confirmAndCreate: "შეკვეთის დადასტურება",
      viewOrder: "შეკვეთის ნახვა",
      continueEditing: "რედაქტირების გაგრძელება",
      noRestaurantSelected: "რესტორანი არ არის არჩეული. გთხოვთ, ჯერ აირჩიოთ რესტორანი.",
      pressAndHold: "დააჭირეთ და დაიჭირეთ ჩასაწერად",
      recording: "ჩაწერა... გაათავისუფლეთ რომ გაგზავნოთ"
    }
  } as const

  const t = translations[language]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

useEffect(() => {
    if (open) {
      if (typeof window !== 'undefined') {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        
        if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition()
          if( !recognitionRef.current) return;
          recognitionRef.current.continuous = true
          recognitionRef.current.interimResults = true
          recognitionRef.current.lang = language === 'ru' ? 'ru-RU' : 'ka-GE'

          if (recognitionRef.current) {
            recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
              let interimTranscript = ''
              let finalTranscript = ''

              for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                  finalTranscript += transcript + ' '
                } else {
                  interimTranscript += transcript
                }
              }

              if (finalTranscript) {
                setTranscript(prev => prev + finalTranscript)
                finalTranscriptRef.current += finalTranscript
              }
            }

            recognitionRef.current.onerror = (event: any) => {
              console.error('Speech recognition error:', event.error)
              setIsListening(false)
              setIsButtonPressed(false)
              isAutoSendRef.current = false
              toast.error(language === 'ru' ? 'Ошибка распознавания речи' : 'ხმოვანი ამოცნობის შეცდომა')
            }

            recognitionRef.current.onend = () => {
              console.log('Speech recognition ended, final transcript:', finalTranscriptRef.current)
              setIsListening(false)
              setIsButtonPressed(false)
              
              // Автоматическая отправка при окончании распознавания
              if (finalTranscriptRef.current.trim() && isAutoSendRef.current) {
                console.log('Auto-sending transcript:', finalTranscriptRef.current)
                setTranscript(finalTranscriptRef.current)
                setTimeout(() => {
                  processOrderWithAI(finalTranscriptRef.current)
                  isAutoSendRef.current = false
                }, 100)
              }
            }
          }
        } else {
          toast.error(language === 'ru' 
            ? 'Браузер не поддерживает распознавание речи' 
            : 'ბრაუზერი არ უჭერს მხარს ხმოვან ამოცნობას')
        }
      }

      loadRestaurantAndProducts()
      initializeConversation()
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (speechSynthesisRef.current) {
        speechSynthesis.cancel()
      }
      if (releaseTimerRef.current) {
        clearTimeout(releaseTimerRef.current)
      }
    }
  }, [open, language])

  const initializeConversation = () => {
    const systemMessage: ConversationMessage = {
      role: 'system',
      content: language === 'ru' 
        ? 'Ты - помощник официанта в ресторане. Помоги клиенту сформировать заказ. Будь вежливым и полезным. Когда добавляешь товары в заказ, сообщи об этом клиенту. Также можешь предлагать дополнительные товары или изменения типа заказа.'
        : 'შენ ხარ მიმტანის თანაშემწე რესტორნში. დაეხმარე კლიენტს შეკვეთის ფორმირებაში. იყავი მორიგი და გამოსადეგი. როცა პროდუქტებს შეკვეთაში დაამატებ, აცნობე ამის შესახებ კლიენტს. ასევე შ�იძლია შესთავაზო დამატებითი პროდუქტები ან შეკვეთის ტიპის ცვლილება.',
      timestamp: new Date()
    }
    setConversation([systemMessage])
  }

  const loadRestaurantAndProducts = async () => {
    try {
      const userRestaurantId = getRestaurantId()
      
      if (!userRestaurantId) {
        toast.error(t.noRestaurantSelected)
        return
      }

      const [productsData, categoriesData] = await Promise.all([
        ProductService.getByRestaurant(userRestaurantId),
        CategoryService.getAll()
      ])

      console.log('Loaded products:', productsData)
      console.log('Loaded categories:', categoriesData)

      setProducts(productsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error(t.errorNoProducts)
    }
  }

  // Функции для работы с кнопкой push-to-talk
  const handleMouseDown = () => {
    console.log('Mouse down - starting recording')
    setIsButtonPressed(true)
    isAutoSendRef.current = true
    finalTranscriptRef.current = '' // Сбрасываем финальный транскрипт
    startListening()
    
    // Таймер для автоматического отключения через 30 секунд (на всякий случай)
    releaseTimerRef.current = setTimeout(() => {
      if (isListening) {
        console.log('Auto-stop after 30 seconds')
        handleMouseUp()
      }
    }, 30000)
  }

  const handleMouseUp = () => {
    console.log('Mouse up - stopping recording')
    setIsButtonPressed(false)
    if (releaseTimerRef.current) {
      clearTimeout(releaseTimerRef.current)
    }
    
    if (isListening) {
      stopListeningAndProcess()
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    handleMouseDown()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    handleMouseUp()
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      finalTranscriptRef.current = ''
      recognitionRef.current.start()
      setIsListening(true)
      console.log('Speech recognition started')
    }
  }

  const stopListeningAndProcess = () => {
    if (recognitionRef.current && isListening) {
      console.log('Stopping speech recognition')
      recognitionRef.current.stop()
      setIsListening(false)
      
      // Не отправляем сразу - ждем события onend
    }
  }

  // Обработчик ручной отправки (через кнопку "Отправить")
  const handleManualSend = () => {
    if (!transcript.trim()) {
      toast.error(language === 'ru' ? 'Введите текст заказа' : 'შეიყვანეთ შეკვეთის ტექსტი')
      return
    }
    
    isAutoSendRef.current = false
    processOrderWithAI(transcript)
  }

  const callOpenAI = async (prompt: string): Promise<any> => {
    const userRestaurantId = getRestaurantId()
    
    const response = await fetch('/api/ai/process-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        products: products.map(p => ({
          id: p.id,
          title: p.title,
          price: p.restaurantPrices?.find(rp => rp.restaurantId === userRestaurantId)?.price || p.price,
          category: categories.find(c => c.id === p.categoryId)?.title || 'Other'
        })),
        currentOrder: order ? {
          items: order.items.map(item => ({
            productId: item.product.id,
            productTitle: item.product.title,
            quantity: item.quantity,
            comment: item.comment
          })),
          orderType,
          numberOfPeople: additionalInfo.numberOfPeople,
          tableNumber: additionalInfo.tableNumber,
          comment: additionalInfo.comment
        } : null,
        config: aiConfig,
        language
      })
    })

    if (!response.ok) {
      throw new Error('OpenAI API request failed')
    }

    return response.json()
  }

  const processOrderWithAI = async (text: string) => {
    if (!text.trim()) {
      console.log('Empty text, skipping processing')
      return
    }

    console.log('Processing with AI:', text)
    setIsProcessing(true)
    
    const userMessage: ConversationMessage = {
      role: 'user',
      content: text,
      timestamp: new Date()
    }
    
    setConversation(prev => [...prev, userMessage])

    try {
      const prompt = language === 'ru' 
        ? `Ты - умный помощник официанта в ресторане. Анализируй запросы клиентов и помогай формировать заказы.

КОНТЕКСТ:
- Доступные продукты: ${products.map(p => `${p.title} (ID: ${p.id})`).join(', ')}
- Текущий тип заказа: ${getOrderTypeText(orderType, 'ru')}
- Текущий заказ: ${order ? order.items.map(item => `${item.quantity}x ${item.product.title}`).join(', ') : 'пуст'}
- Количество персон: ${additionalInfo.numberOfPeople}
- Стол: ${additionalInfo.tableNumber || 'не указан'}
- Комментарий: ${additionalInfo.comment || 'нет'}

ЗАПРОС ПОЛЬЗОВАТЕЛЯ: "${text}"

ИНСТРУКЦИИ:
1. НИКОГДА не очищай заказ полностью без явной команды "очистить заказ"
2. При смене типа заказа сохраняй все текущие позиции
3. Для поиска продуктов используй ID или точные названия из списка доступных
4. Если продукт не найден, сообщи об этом пользователю
5. Поддерживай естественный диалог, уточняй детали если нужно
6. При смене типа заказа используй действие UPDATE_ORDER_TYPE

ДОСТУПНЫЕ ТИПЫ ЗАКАЗА:
- DINE_IN - питание в ресторане (требуется номер стола)
- TAKEAWAY - самовывоз
- DELIVERY - доставка

ПРИМЕРЫ КОМАНД ДЛЯ СМЕНЫ ТИПА ЗАКАЗА:
- "Хочу забрать заказ с собой" → TAKEAWAY
- "Сделайте доставку" → DELIVERY  
- "Буду есть в ресторане" → DINE_IN
- "Измени на самовывоз" → TAKEAWAY

ДОСТУПНЫЕ ДЕЙСТВИЯ:
- ADD_ITEMS - добавить товары в существующий заказ
- UPDATE_ORDER_TYPE - изменить тип заказа без очистки
- UPDATE_DETAILS - изменить детали (количество персон, стол, комментарий)
- REMOVE_ITEMS - удалить конкретные товары
- SHOW_ORDER - показать текущий заказ
- ANSWER_QUESTION - ответить на вопрос
- CLEAR_ORDER - очистить заказ (ТОЛЬКО по явной команде)

ФОРМАТ ОТВЕТА:
{
  "action": "ADD_ITEMS" | "UPDATE_ORDER_TYPE" | "UPDATE_DETAILS" | "REMOVE_ITEMS" | "SHOW_ORDER" | "ANSWER_QUESTION" | "CLEAR_ORDER",
  "itemsToAdd": [
    {
      "productId": "string (обязательно)",
      "productTitle": "string (для проверки)",
      "quantity": number,
      "comment": "string"
    }
  ],
  "itemsToRemove": ["productId1", "productId2"],
  "newOrderType": "DINE_IN" | "TAKEAWAY" | "DELIVERY",
  "updatedDetails": {
    "numberOfPeople": number,
    "tableNumber": "string", 
    "comment": "string"
  },
  "response": "string (естественный ответ пользователю на русском)",
  "confidence": number
}`

      : `შენ ხარ მიმტანის ჭკვიანი თანაშემწე რესტორნში. ანალიზიერ კლიენტების მოთხოვნები და დაეხმარე მათ შეკვეთების ფორმირებაში.

კონტექსტი:
- ხელმისაწვდომი პროდუქტები: ${products.map(p => `${p.title} (ID: ${p.id})`).join(', ')}
- მიმდინარე შეკვეთის ტიპი: ${getOrderTypeText(orderType, 'ka')}
- მიმდინარე შეკვეთა: ${order ? order.items.map(item => `${item.quantity}x ${item.product.title}`).join(', ') : 'ცარიელი'}
- პირების რაოდენობა: ${additionalInfo.numberOfPeople}
- სტოლი: ${additionalInfo.tableNumber || 'არ არის მითითებული'}
- კომენტარი: ${additionalInfo.comment || 'არა'}

მომხმარებლის მოთხოვნა: "${text}"

ინსტრუქციები:
1. არასოდეს გაასუფთაო შეკვეთა სრულად უშუალო ბრძანების გარეშე "გასუფთავება"
2. შეკვეთის ტიპის შეცვლისას შეინახე ყველა მიმდინარე პოზიცია
3. პროდუქტების მოსაძებნად გამოიყენე ID ან ზუსტი სახელები ხელმისაწვდომი სიიდან
4. თუ პროდუქტი არ მოიძებნა, აცნობე ამის შესახებ მომხმარებელს
5. დაიცავ ბუნებრივ დიალოგს, დააზუსტე დეტალები თუ საჭიროა
6. შეკვეთის ტიპის შეცვლისას გამოიყენე მოქმედება UPDATE_ORDER_TYPE

ხელმისაწვდომი შეკვეთის ტიპები:
- DINE_IN - ჭამა რესტორნში (საჭიროა სტოლის ნომერი)
- TAKEAWAY - თვითშეკვეთა
- DELIVERY - მიწოდება

შეკვეთის ტიპის შეცვლის მაგალითები:
- "წინასწარ აღება მინდა" → TAKEAWAY
- "მიწოდება გააკეთეთ" → DELIVERY  
- "რესტორნში ვჭამ" → DINE_IN
- "შეცვალე თვითშეკვეთაზე" → TAKEAWAY

ხელმისაწვდომი მოქმედებები:
- ADD_ITEMS - დაამატე პროდუქტები არსებულ შეკვეთაში
- UPDATE_ORDER_TYPE - შეცვალე შეკვეთის ტიპი გასუფთავების გარეშე
- UPDATE_DETAILS - შეცვალე დეტალები (პირების რაოდენობა, სტოლი, კომენტარი)
- REMOVE_ITEMS - წაშალე კონკრეტული პროდუქტები
- SHOW_ORDER - აჩვენე მიმდინარე შეკვეთა
- ANSWER_QUESTION - უპასუხე კითხვას
- CLEAR_ORDER - გაასუფთავე შეკვეთა (მხოლოდ უშუალო ბრძანებით)

პასუხის ფორმატი:
{
  "action": "ADD_ITEMS" | "UPDATE_ORDER_TYPE" | "UPDATE_DETAILS" | "REMOVE_ITEMS" | "SHOW_ORDER" | "ANSWER_QUESTION" | "CLEAR_ORDER",
  "itemsToAdd": [
    {
      "productId": "string (აუცილებელი)",
      "productTitle": "string (შესამოწმებლად)",
      "quantity": number,
      "comment": "string"
    }
  ],
  "itemsToRemove": ["productId1", "productId2"],
  "newOrderType": "DINE_IN" | "TAKEAWAY" | "DELIVERY",
  "updatedDetails": {
    "numberOfPeople": number,
    "tableNumber": "string",
    "comment": "string"
  },
  "response": "string (ბუნებრივი პასუხი მომხმარებელს ქართულად)",
  "confidence": number
}`

      const aiResponse = await callOpenAI(prompt)
      const parsedData: AIActionResponse = JSON.parse(aiResponse.content)
      
      console.log('AI Response:', parsedData)
      
      await handleAIAction(parsedData, text)
      
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: parsedData.response,
        timestamp: new Date()
      }
      
      let enhancedContent = parsedData.response
      if (parsedData.action === 'UPDATE_ORDER_TYPE' && parsedData.newOrderType) {
        const orderTypeChangeText = language === 'ru' 
          ? `\n\n---\n*✅ Тип заказа изменен на: ${getOrderTypeText(parsedData.newOrderType, 'ru')}*`
          : `\n\n---\n*✅ შეკვეთის ტიპი შეიცვალა: ${getOrderTypeText(parsedData.newOrderType, 'ka')}*`
        enhancedContent += orderTypeChangeText
      }
      
      assistantMessage.content = enhancedContent
      setConversation(prev => [...prev, assistantMessage])

      if (audioFeedback) {
        speakResponse(parsedData.response)
      }

    } catch (error) {
      console.error('Error processing order with AI:', error)
      handleAIError(error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAIAction = async (parsedData: AIActionResponse, userText: string) => {
    console.log('Handling AI action:', parsedData.action, parsedData)
    
    let updatedOrder = order ? { ...order } : { items: [], confidence: 0.7 }
    let shouldUpdateOrderType = false
    let newOrderType = orderType
    let shouldUpdateOrder = false

    try {
      switch (parsedData.action) {
        case 'ADD_ITEMS':
          if (parsedData.itemsToAdd && parsedData.itemsToAdd.length > 0) {
            console.log('Adding items:', parsedData.itemsToAdd)
            
            const newItems: ParsedOrderItem[] = []
            
            for (const item of parsedData.itemsToAdd) {
              const product = findProductByIdOrTitle(item.productId, item.productTitle)
              
              if (product) {
                console.log(`Found product: ${product.title} (ID: ${product.id})`)
                
                // Проверяем, есть ли уже такой товар в заказе
                const existingItemIndex = updatedOrder.items.findIndex(
                  existingItem => existingItem.product.id === product.id
                )
                
                if (existingItemIndex >= 0) {
                  // Увеличиваем количество существующего товара
                  updatedOrder.items[existingItemIndex].quantity += item.quantity || 1
                  console.log(`Increased quantity for existing item: ${updatedOrder.items[existingItemIndex].product.title} -> ${updatedOrder.items[existingItemIndex].quantity}`)
                } else {
                  // Добавляем новый товар
                  const newItem: ParsedOrderItem = {
                    product,
                    quantity: item.quantity || 1,
                    comment: item.comment
                  }
                  newItems.push(newItem)
                  console.log(`Added new item: ${newItem.product.title} x ${newItem.quantity}`)
                }
              } else {
                console.warn(`Product not found: ID=${item.productId}, Title=${item.productTitle}`)
              }
            }
            
            // Добавляем новые товары к существующим
            if (newItems.length > 0) {
              updatedOrder.items = [...updatedOrder.items, ...newItems]
            }
            
            updatedOrder.confidence = Math.max(updatedOrder.confidence, parsedData.confidence)
            shouldUpdateOrder = true
            
            console.log('Final order items:', updatedOrder.items)
          } else {
            console.log('No items to add')
          }
          break

        case 'REMOVE_ITEMS':
          if (parsedData.itemsToRemove && parsedData.itemsToRemove.length > 0) {
            console.log('Removing items:', parsedData.itemsToRemove)
            updatedOrder.items = updatedOrder.items.filter(item => 
              !parsedData.itemsToRemove!.includes(item.product.id)
            )
            shouldUpdateOrder = true
          }
          break

        case 'CLEAR_ORDER':
          console.log('Clearing order')
          updatedOrder.items = []
          shouldUpdateOrder = true
          break

        case 'UPDATE_ORDER_TYPE':
          if (parsedData.newOrderType) {
            console.log('Updating order type to:', parsedData.newOrderType)
            newOrderType = parsedData.newOrderType
            shouldUpdateOrderType = true
          }
          break

        case 'UPDATE_DETAILS':
          if (parsedData.updatedDetails) {
            console.log('Updating details:', parsedData.updatedDetails)
            const details = parsedData.updatedDetails
            setAdditionalInfo(prev => ({
              numberOfPeople: details.numberOfPeople !== undefined ? details.numberOfPeople : prev.numberOfPeople,
              tableNumber: details.tableNumber !== undefined ? details.tableNumber : prev.tableNumber,
              comment: details.comment !== undefined ? details.comment : prev.comment
            }))
          }
          break

        case 'SHOW_ORDER':
          console.log('Showing current order')
          break

        case 'ANSWER_QUESTION':
          console.log('Answering question')
          break
      }

      // Обновляем состояние заказа только если были изменения
      if (shouldUpdateOrder) {
        console.log('Updating order state:', updatedOrder)
        setOrder(updatedOrder)
      }
      
      if (shouldUpdateOrderType) {
        console.log('Updating order type state:', newOrderType)
        setOrderType(newOrderType)
      }

    } catch (error) {
      console.error('Error in handleAIAction:', error)
    }
  }

  const findProductByIdOrTitle = (productId: string, productTitle: string): Product | null => {
    console.log(`Searching for product: ID=${productId}, Title=${productTitle}`)
    
    // Сначала ищем по точному ID
    let product = findProductByTitle(productTitle)
    
    
    
    console.log(`Search result:`, product ? `Found: ${product.title}` : 'Not found')
    return product || null
  }

  const findProductByTitle = (productTitle: string): Product | null => {
    if (!productTitle) return null
    
    const searchTerm = productTitle.toLowerCase().trim()
    console.log(`Searching by title: "${searchTerm}"`)
    
    // Точное совпадение
    let product = products.find(p => 
      p.title.toLowerCase() === searchTerm
    )
    
    // Частичное совпадение
    if (!product) {
      product = products.find(p => 
        p.title.toLowerCase().includes(searchTerm) ||
        searchTerm.includes(p.title.toLowerCase())
      )
    }
    
    // Похожесть строк
    if (!product) {
      product = products.find(p => {
        const productWords = p.title.toLowerCase().split(/\s+/)
        const searchWords = searchTerm.split(/\s+/)
        
        return searchWords.some(searchWord => 
          productWords.some(productWord => 
            productWord.startsWith(searchWord) ||
            searchWord.startsWith(productWord) ||
            calculateSimilarity(productWord, searchWord) > 0.7
          )
        )
      })
    }
    
    return product || null
  }

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    return (longer.length - editDistance(longer, shorter)) / parseFloat(longer.length.toString())
  }

  const editDistance = (s1: string, s2: string): number => {
    s1 = s1.toLowerCase()
    s2 = s2.toLowerCase()
    
    const costs = new Array()
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) costs[j] = j
        else {
          if (j > 0) {
            let newValue = costs[j - 1]
            if (s1.charAt(i - 1) !== s2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
            costs[j - 1] = lastValue
            lastValue = newValue
          }
        }
      }
      if (i > 0) costs[s2.length] = lastValue
    }
    return costs[s2.length]
  }

  const handleAIError = (error: any) => {
    try {
      const parsedOrder = parseOrderText(transcript)
      if (parsedOrder.items.length > 0) {
        setOrder(prev => ({
          items: [...(prev?.items || []), ...parsedOrder.items],
          confidence: Math.max(prev?.confidence || 0, parsedOrder.confidence)
        }))
      }
    } catch (fallbackError) {
      console.error('Fallback parser also failed:', fallbackError)
    }
    
    const errorMessage: ConversationMessage = {
      role: 'assistant',
      content: language === 'ru' 
        ? 'Извините, произошла ошибка при обработке заказа. Пожалуйста, попробуйте еще раз или опишите заказ более подробно.'
        : 'ბოდიში, მოხდა შეცდომა შეკვეთის დამუშავებისას. გთხოვთ, სცადოთ ხელახლა ან აღწეროთ შეკვეთა უფრო დეტალურად.',
      timestamp: new Date()
    }
    setConversation(prev => [...prev, errorMessage])
    
    toast.error(t.errorProcessing)
  }

  const parseOrderText = (text: string): ParsedOrder => {
    const items: ParsedOrderItem[] = []
    const lines = text.split(/[.,]/).filter(line => line.trim())
    
    for (const line of lines) {
      const words = line.trim().toLowerCase().split(/\s+/)
      
      const quantityWords = ['один', 'одна', 'одно', 'два', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять']
      const quantityMap: { [key: string]: number } = {
        'один': 1, 'одна': 1, 'одно': 1, 'ერთი': 1,
        'два': 2, 'две': 2, 'ორი': 2,
        'три': 3, 'სამი': 3, 'четыре': 4, 'ოთხი': 4,
        'пять': 5, 'ხუთი': 5, 'шесть': 6, 'ექვსი': 6,
        'семь': 7, 'შვიდი': 7, 'восемь': 8, 'რვა': 8,
        'девять': 9, 'ცხრა': 9, 'десять': 10, 'ათი': 10
      }

      let quantity = 1
      let productName = ''
      let comment = ''

      for (let i = 0; i < words.length; i++) {
        const word = words[i]
        
        if (quantityWords.includes(word)) {
          quantity = quantityMap[word]
          continue
        }
        
        if (!isNaN(parseInt(word))) {
          quantity = parseInt(word)
          continue
        }

        if (!productName) {
          productName = word
        } else {
          productName += ' ' + word
        }
      }

      if (productName.trim()) {
        const product = findProductByTitle(productName.trim())
        if (product) {
          items.push({
            product,
            quantity,
            comment: comment || undefined
          })
        }
      }
    }

    return { items, confidence: 0.7 }
  }

  const getOrderTypeText = (type: string, lang: string = language) => {
    const types = {
      ru: {
        DINE_IN: 'в ресторане',
        TAKEAWAY: 'с собой', 
        DELIVERY: 'доставка'
      },
      ka: {
        DINE_IN: 'რესტორნში',
        TAKEAWAY: 'წინასწარ',
        DELIVERY: 'მიწოდება'
      }
    }
    return types[lang as keyof typeof types][type as keyof typeof types.ru] || type
  }

  const speakResponse = (text: string) => {
    if (!audioFeedback) return
    
    const speechText = text.length > 500 ? text.substring(0, 500) + '...' : text
    
    speechSynthesisRef.current = new SpeechSynthesisUtterance(speechText)
    speechSynthesisRef.current.lang = language === 'ru' ? 'ru-RU' : 'ka-GE'
    speechSynthesisRef.current.rate = 0.8
    speechSynthesisRef.current.pitch = 1
    
    speechSynthesisRef.current.onstart = () => setIsSpeaking(true)
    speechSynthesisRef.current.onend = () => setIsSpeaking(false)
    speechSynthesisRef.current.onerror = () => setIsSpeaking(false)
    
    speechSynthesis.speak(speechSynthesisRef.current)
  }

  const stopSpeech = () => {
    speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const createOrder = async () => {
    if (!order || order.items.length === 0) {
      toast.error(language === 'ru' ? 'Нет товаров для заказа' : 'შეკვეთისთვის ნივთები არ არის')
      return
    }

    const userRestaurantId = getRestaurantId()
    
    if (!userRestaurantId) {
      toast.error(t.noRestaurantSelected)
      return
    }

    setIsCreatingOrder(true)
    try {
      const orderData = {
        restaurantId: userRestaurantId,
        type: orderType,
        numberOfPeople: additionalInfo.numberOfPeople,
        tableNumber: orderType === 'DINE_IN' ? additionalInfo.tableNumber : undefined,
        comment: additionalInfo.comment,
        items: order.items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          comment: item.comment
        }))
      }

      const createdOrder = orderId 
        ? await OrderService.updateOrder(orderId, orderData)
        : await OrderService.create(orderData)
      
      toast.success(t.orderCreated)
      
      if (audioFeedback) {
        speakResponse(language === 'ru' ? 'Заказ успешно создан' : 'შეკვეთა წარმატებით შეიქმნა')
      }
      
      if (onOpenChange) {
        onOpenChange(false)
      }
      
      router.push(`/orders/${createdOrder.id}`)
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error(t.errorCreatingOrder)
    } finally {
      setIsCreatingOrder(false)
    }
  }

  const clearAll = () => {
    setTranscript('')
    setManualInput('')
    setOrder(null)
    setAdditionalInfo({
      numberOfPeople: 1,
      tableNumber: '',
      comment: ''
    })
    setOrderType('DINE_IN')
    initializeConversation()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-2xl h-full flex flex-col p-0 overflow-hidden"
      >
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-purple-500" />
              <div>
                <SheetTitle className="text-xl">{t.title}</SheetTitle>
                <SheetDescription className="text-sm mt-1">
                  {t.subtitle}
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAudioFeedback(!audioFeedback)}
                className="flex items-center gap-2"
              >
                {audioFeedback ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                {t.audioFeedback}
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversation.filter(msg => msg.role !== 'system').map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-br-none' 
                    : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {message.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        AI
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-2 opacity-80">
                        {message.role === 'user' 
                          ? (language === 'ru' ? 'Вы' : 'თქვენ') 
                          : 'AI Assistant'}
                      </div>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {language === 'ru' ? 'В' : 'თ'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isListening && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg p-4 mb-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="font-medium">{t.recording}</span>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-none">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      AI
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{t.processing}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Отладочная информация - можно удалить после тестирования */}
            {/*process.env.NODE_ENV === 'development' && (
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">Отладочная информация:</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div>Товаров в базе: {products.length}</div>
                  <div>Товаров в заказе: {order?.items.length || 0}</div>
                  <div>Транскрипт: {transcript}</div>
                  {order && order.items.length > 0 && (
                    <div>
                      <div>Текущий заказ:</div>
                      {order.items.map((item, index) => (
                        <div key={index}>
                          - {item.quantity}x {item.product.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )*/}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t dark:border-gray-700 p-4 space-y-4">
            <div className="space-y-3">
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={t.placeholder}
                className="min-h-[80px] text-base resize-none"
                disabled={isListening}
              />
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1 flex gap-3">
                <Button
                  onClick={handleManualSend}
                  disabled={!transcript.trim() || isProcessing || isListening}
                  className="flex-1 h-12 text-base"
                  size="lg"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {isProcessing ? t.processing : t.sendToAI}
                </Button>

                {order && order.items.length > 0 && (
                  <Button
                    onClick={createOrder}
                    disabled={isCreatingOrder}
                    className="h-12 px-6 bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {isCreatingOrder ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {t.confirmAndCreate}
                  </Button>
                )}
              </div>

              {/* Измененная кнопка микрофона с push-to-talk функционалом */}
              <Button
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                variant={isListening ? "destructive" : "default"}
                className={`h-12 px-6 flex items-center gap-3 transition-all duration-200 ${
                  isButtonPressed ? 'scale-95' : 'scale-100'
                }`}
                size="lg"
                disabled={isProcessing}
              >
                {isListening ? (
                  <>
                    <div className="relative">
                      <Mic className="h-4 w-4" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                    <span className="hidden sm:inline">{t.stopListening}</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.startListening}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Компонент с кнопкой для открытия ассистента
export function VoiceAssistantButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Brain className="h-6 w-6" />
      </Button>
      
      <VoiceAssistantSheet 
        open={isOpen} 
        onOpenChange={setIsOpen}
      />
    </>
  )
}

// Хук для использования ассистента в любом компоненте
export function useVoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false)

  const openAssistant = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeAssistant = useCallback(() => {
    setIsOpen(false)
  }, [])

  const Assistant = useCallback(({ orderId }: { orderId?: string }) => (
    <VoiceAssistantSheet 
      open={isOpen} 
      onOpenChange={setIsOpen}
      orderId={orderId}
    />
  ), [isOpen])

  return {
    isOpen,
    openAssistant,
    closeAssistant,
    Assistant
  }
}