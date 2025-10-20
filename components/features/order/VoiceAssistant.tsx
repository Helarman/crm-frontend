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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  X,
  ChefHat,
  Wine,
  Coffee,
  Dessert,
  Pizza
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { OrderService } from '@/lib/api/order.service'
import { ProductService } from '@/lib/api/product.service'
import { CategoryService } from '@/lib/api/category.service'
import { useLanguageStore } from '@/lib/stores/language-store'

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
  tags?: string[]
  isAvailable?: boolean
}

interface Category {
  id: string
  title: string
  description?: string
  icon?: string
  order: number
}

interface ParsedOrderItem {
  product: Product
  quantity: number
  comment?: string
  additives?: string[]
  modifiers?: string[]
  totalPrice: number
}

interface ParsedOrder {
  items: ParsedOrderItem[]
  comment?: string
  numberOfPeople?: number
  tableNumber?: string
  confidence: number
  rawResponse?: any
  totalAmount: number
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
  type?: 'order_update' | 'info' | 'error' | 'suggestion'
}

interface AIActionResponse {
  action: 'ADD_ITEMS' | 'UPDATE_ORDER_TYPE' | 'UPDATE_DETAILS' | 'REMOVE_ITEMS' | 'SHOW_ORDER' | 'ANSWER_QUESTION' | 'CLEAR_ORDER' | 'MODIFY_QUANTITY' | 'SHOW_MENU'
  itemsToAdd?: Array<{
    productId: string
    productTitle: string
    quantity: number
    comment?: string
    modifiers?: string[]
  }>
  itemsToRemove?: string[]
  itemsToModify?: Array<{
    productId: string
    quantity: number
  }>
  newOrderType?: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'
  updatedDetails?: {
    numberOfPeople?: number
    tableNumber?: string
    comment?: string
  }
  response: string
  confidence: number
  suggestions?: string[]
}

interface VoiceAssistantSheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  orderId?: string
}

// Прокси эндпоинты для OpenAI API
const OPENAI_PROXY_ENDPOINTS = [
  'https://api.openai.com/v1',
  'https://api.openai-proxy.org/v1',
  'https://chatgpt-api.shn.hk/v1',
]

// Категории и их иконки
const CATEGORY_ICONS: { [key: string]: any } = {
  'main': Utensils,
  'drinks': Wine,
  'desserts': Dessert,
  'coffee': Coffee,
  'pizza': Pizza,
  'default': ChefHat
}

// Типы для аудио записи
interface AudioRecorder {
  start: () => Promise<void>
  stop: () => Promise<Blob>
  isRecording: boolean
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
  const [categories, setCategories] = useState<Category[]>([])
  const [manualInput, setManualInput] = useState('')
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [activeTab, setActiveTab] = useState('assistant')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number>(0)
  
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN')
  const [additionalInfo, setAdditionalInfo] = useState({
    numberOfPeople: 1,
    tableNumber: '',
    comment: ''
  })

  const [aiConfig, setAiConfig] = useState<AIConfig>({
    model: 'gpt-3.5-turbo',
    temperature: 0.1,
    maxTokens: 1000,
    useAdvancedParsing: true
  })

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [audioFeedback, setAudioFeedback] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)

  const [isButtonPressed, setIsButtonPressed] = useState(false)
  const releaseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isAutoSendRef = useRef(false)

  const getRestaurantId = (): string => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('selectedRestaurantId') || ''
  }

  const translations = {
    ru: {
      title: "Ассистент",
      subtitle: "Голосовое управление заказами",
      listening: "Слушаю...",
      startListening: "Нажмите и говорите",
      stopListening: "Отпустите чтобы отправить",
      processing: "Анализирую заказ...",
      sendToAI: "Отправить",
      createOrder: "Создать заказ",
      creatingOrder: "Создание заказа...",
      orderCreated: "Заказ успешно создан",
      manualInput: "Или введите заказ текстом:",
      placeholder: "Например: 'Два борща, один шашлык из баранины, три компота'",
      speakNow: "Говорите сейчас...",
      recognizedText: "Распознанный текст:",
      parsedOrder: "Текущий заказ:",
      noItems: "Заказ пуст",
      items: "Позиции",
      quantity: "Кол-во",
      product: "Блюдо",
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
      clear: "Очистить заказ",
      goBack: "Назад к заказу",
      confidence: "Уверенность ИИ",
      settings: "Настройки",
      aiModel: "Модель ИИ",
      temperature: "Температура",
      maxTokens: "Макс. токенов",
      advancedParsing: "Расширенный парсинг",
      audioFeedback: "Голосовые ответы",
      conversation: "Диалог",
      aiResponse: "Ответ ИИ",
      speakResponse: "Озвучить ответ",
      stopSpeech: "Остановить речь",
      confirmAndCreate: "Подтвердить заказ",
      viewOrder: "Просмотреть заказ",
      continueEditing: "Продолжить редактирование",
      noRestaurantSelected: "Ресторан не выбран",
      pressAndHold: "Нажмите и удерживайте для записи",
      recording: "Запись... Отпустите чтобы отправить",
      assistant: "Ассистент",
      menu: "Меню",
      order: "Заказ",
      categories: "Категории",
      all: "Все",
      search: "Поиск блюд...",
      addToOrder: "Добавить в заказ",
      remove: "Удалить",
      modify: "Изменить",
      suggestions: "Популярные команды",
      quickActions: "Быстрые действия",
      showMenu: "Показать меню",
      showOrder: "Показать заказ",
      addItem: "Добавить блюдо",
      removeItem: "Удалить блюдо",
      changeQuantity: "Изменить количество",
      clearOrder: "Очистить заказ",
      setTable: "Установить стол",
      setPeople: "Установить количество персон",
      orderSummary: "Сводка заказа",
      itemsCount: "позиций",
      peopleCount: "персон",
      table: "Стол",
      type: "Тип",
      emptyOrder: "Заказ пуст. Добавьте блюда голосом или из меню.",
      popularDishes: "Популярные блюда",
      recommended: "Рекомендуем попробовать",
      recordingAudio: "Запись аудио...",
      processingAudio: "Обработка аудио...",
      audioError: "Ошибка записи аудио"
    },
    ka: {
      title: "მიმტანის ასისტენტი",
      subtitle: "შეკვეთების ხმოვანი მართვა",
      listening: "მოვუსმინოთ...",
      startListening: "დააჭირეთ და თქვით",
      stopListening: "გაათავისუფლეთ რომ გაგზავნოთ",
      processing: "შეკვეთას ვაანალიზებ...",
      sendToAI: "გაგზავნა",
      createOrder: "შეკვეთის შექმნა",
      creatingOrder: "შეკვეთა იქმნება...",
      orderCreated: "შეკვეთა წარმატებით შეიქმნა",
      manualInput: "ან შეიყვანეთ შეკვეთა ტექსტურად:",
      placeholder: "მაგალითად: 'ორი ბორში, ერთი ბარანინის შაშლიკი, სამი კომპოტი'",
      speakNow: "ისაუბრეთ ახლა...",
      recognizedText: "ამოცნობილი ტექსტი:",
      parsedOrder: "მიმდინარე შეკვეთა:",
      noItems: "შეკვეთა ცარიელია",
      items: "პოზიციები",
      quantity: "რაოდ.",
      product: "კერძი",
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
      clear: "შეკვეთის გასუფთავება",
      goBack: "უკან შეკვეთაზე",
      confidence: "AI-ის ნდობა",
      settings: "პარამეტრები",
      aiModel: "AI მოდელი",
      temperature: "ტემპერატურა",
      maxTokens: "მაქს. ტოკენები",
      advancedParsing: "გაფართოებული პარსინგი",
      audioFeedback: "ხმოვანი პასუხები",
      conversation: "დიალოგი",
      aiResponse: "AI-ის პასუხი",
      speakResponse: "პასუხის გახმოვანება",
      stopSpeech: "საუბრის შეჩერება",
      confirmAndCreate: "შეკვეთის დადასტურება",
      viewOrder: "შეკვეთის ნახვა",
      continueEditing: "რედაქტირების გაგრძელება",
      noRestaurantSelected: "რესტორანი არ არის არჩეული",
      pressAndHold: "დააჭირეთ და დაიჭირეთ ჩასაწერად",
      recording: "ჩაწერა... გაათავისუფლეთ რომ გაგზავნოთ",
      assistant: "ასისტენტი",
      menu: "მენიუ",
      order: "შეკვეთა",
      categories: "კატეგორიები",
      all: "ყველა",
      search: "ძებნა კერძებში...",
      addToOrder: "შეკვეთაში დამატება",
      remove: "წაშლა",
      modify: "შეცვლა",
      suggestions: "პოპულარული ბრძანებები",
      quickActions: "სწრაფი მოქმედებები",
      showMenu: "მენიუს ნახვა",
      showOrder: "შეკვეთის ნახვა",
      addItem: "კერძის დამატება",
      removeItem: "კერძის წაშლა",
      changeQuantity: "რაოდენობის შეცვლა",
      clearOrder: "შეკვეთის გასუფთავება",
      setTable: "სტოლის მითითება",
      setPeople: "პირების რაოდენობის მითითება",
      orderSummary: "შეკვეთის მიმოხილვა",
      itemsCount: "პოზიცია",
      peopleCount: "პირი",
      table: "სტოლი",
      type: "ტიპი",
      emptyOrder: "შეკვეთა ცარიელია. დაამატეთ კერძები ხმოვნად ან მენიუდან.",
      popularDishes: "პოპულარული კერძები",
      recommended: "გირჩევთ სცადოთ",
      recordingAudio: "აუდიოს ჩაწერა...",
      processingAudio: "აუდიოს დამუშავება...",
      audioError: "აუდიო ჩაწერის შეცდომა"
    }
  } as const

  const t = translations[language]

  // Инициализация и загрузка данных
  useEffect(() => {
    if (open) {
      loadRestaurantAndProducts()
      initializeConversation()
    }

    return () => {
      cleanupAudio()
    }
  }, [open, language])

  // Инициализация аудио анализатора
  const initializeAudioAnalyzer = async (stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)
      
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      const updateAudioLevel = () => {
        if (!analyserRef.current || !isRecording) return
        
        analyserRef.current.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const average = sum / bufferLength
        setAudioLevel(Math.min(average / 128, 1))
        
        animationRef.current = requestAnimationFrame(updateAudioLevel)
      }
      
      updateAudioLevel()
    } catch (error) {
      console.error('Error initializing audio analyzer:', error)
    }
  }

  // Запись аудио с использованием MediaRecorder API
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        } 
      })
      
      audioChunksRef.current = []
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processAudioWithWhisper(audioBlob)
        
        // Останавливаем все треки
        stream.getTracks().forEach(track => track.stop())
        
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
        
        setAudioLevel(0)
      }
      
      mediaRecorderRef.current.start(1000) // Собираем данные каждую секунду
      setIsRecording(true)
      await initializeAudioAnalyzer(stream)
      
    } catch (error) {
      console.error('Error starting audio recording:', error)
      toast.error(t.audioError)
      setIsRecording(false)
    }
  }

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Обработка аудио через Whisper API
  const processAudioWithWhisper = async (audioBlob: Blob) => {
    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'recording.webm')
      formData.append('model', 'whisper-1')
      formData.append('language', language === 'ru' ? 'ru' : 'ka')
      
      // Пробуем разные прокси эндпоинты
      let lastError: any = null
      
      for (const endpoint of OPENAI_PROXY_ENDPOINTS) {
        try {
          console.log(`Trying Whisper endpoint: ${endpoint}`)
          
          const response = await fetch(`${endpoint}/audio/transcriptions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
            },
            body: formData,
          })
          
          if (response.ok) {
            const result = await response.json()
            const transcribedText = result.text.trim()
            
            console.log('Whisper transcription:', transcribedText)
            
            if (transcribedText) {
              setTranscript(transcribedText)
              await processOrderWithAI(transcribedText)
            } else {
              toast.error(language === 'ru' ? 'Не удалось распознать речь' : 'მეტყველების ამოცნობა ვერ მოხერხდა')
            }
            
            return
          } else {
            console.warn(`Whisper endpoint ${endpoint} failed: ${response.status}`)
            lastError = new Error(`HTTP ${response.status}`)
          }
        } catch (error) {
          console.warn(`Whisper endpoint ${endpoint} error:`, error)
          lastError = error
          continue
        }
      }
      
      // Fallback на наш API route
      const fallbackResponse = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      })
      
      if (fallbackResponse.ok) {
        const result = await fallbackResponse.json()
        const transcribedText = result.text.trim()
        
        if (transcribedText) {
          setTranscript(transcribedText)
          await processOrderWithAI(transcribedText)
        }
      } else {
        throw lastError || new Error('All Whisper endpoints failed')
      }
      
    } catch (error) {
      console.error('Error processing audio with Whisper:', error)
      toast.error(language === 'ru' ? 'Ошибка обработки аудио' : 'აუდიოს დამუშავების შეცდომა')
    } finally {
      setIsProcessing(false)
    }
  }

  const cleanupAudio = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    if (speechSynthesisRef.current) {
      speechSynthesis.cancel()
    }
    
    if (releaseTimerRef.current) {
      clearTimeout(releaseTimerRef.current)
    }
  }

  const initializeConversation = () => {
    const systemMessage: ConversationMessage = {
      role: 'system',
      content: `Ты - профессиональный помощник официанта в ресторане. Твоя задача - помогать клиентам формировать заказы.`,
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

      setProducts(productsData)
      setCategories(categoriesData as any)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error(t.errorNoProducts)
    }
  }

  // Управление голосовым вводом
  const handleMouseDown = async () => {
    console.log('Starting audio recording')
    setIsButtonPressed(true)
    isAutoSendRef.current = true
    
    try {
      await startAudioRecording()
    } catch (error) {
      console.error('Error starting recording:', error)
      setIsButtonPressed(false)
    }
  }

  const handleMouseUp = () => {
    console.log('Stopping audio recording')
    setIsButtonPressed(false)
    
    if (releaseTimerRef.current) {
      clearTimeout(releaseTimerRef.current)
    }
    
    if (isRecording) {
      stopAudioRecording()
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

  const handleManualSend = () => {
    if (!transcript.trim()) {
      toast.error(language === 'ru' ? 'Введите текст заказа' : 'შეიყვანეთ შეკვეთის ტექსტი')
      return
    }
    
    isAutoSendRef.current = false
    processOrderWithAI(transcript)
  }

  // Обработка AI запросов с использованием прокси
  const callOpenAI = async (prompt: string): Promise<any> => {
    const userRestaurantId = getRestaurantId()
    
    const requestBody = {
      model: aiConfig.model,
      messages: [
        {
          role: "system",
          content: getSystemPrompt()
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: aiConfig.temperature,
      max_tokens: aiConfig.maxTokens,
      response_format: { type: "json_object" }
    }

    let lastError: any = null

    for (const endpoint of OPENAI_PROXY_ENDPOINTS) {
      try {
        console.log(`Trying proxy endpoint: ${endpoint}`)
        
        const response = await fetch(`${endpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          },
          body: JSON.stringify(requestBody),
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`Success with endpoint: ${endpoint}`)
          return data
        } else {
          console.warn(`Endpoint ${endpoint} failed with status: ${response.status}`)
          lastError = new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        console.warn(`Endpoint ${endpoint} error:`, error)
        lastError = error
        continue
      }
    }

    // Fallback to API route
    try {
      console.log('Trying fallback API route')
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
            price: getProductPrice(p),
            category: categories.find(c => c.id === p.categoryId)?.title || 'Other',
            tags: p.tags || []
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

      if (response.ok) {
        return response.json()
      }
    } catch (error) {
      console.error('Fallback API route also failed:', error)
    }

    throw lastError || new Error('All AI endpoints failed')
  }

  const getSystemPrompt = () => {
    const userRestaurantId = getRestaurantId();
    
    const menuInfo = products.map(p => {
      const category = categories.find(c => c.id === p.categoryId);
      const price = getProductPrice(p);
      return `${p.title} (ID: ${p.id}, Категория: ${category?.title || 'Other'}, Цена: ${price}₽)`;
    }).join('\n');

    const currentOrderInfo = order ? order.items.map(item => 
      `${item.quantity}x ${item.product.title} (ID: ${item.product.id}) - ${item.totalPrice}₽`
    ).join('\n') : 'пуст';

    return `Ты - AI ассистент для ресторана. Твоя задача - ОЧЕНЬ ТОЧНО и ПРЕДСКАЗУЕМО обрабатывать заказы.

# КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
1. НИКОГДА не изменяй заказ без явной команды пользователя
2. НИКОГДА не очищай заказ без команды "очистить заказ" или "clear order"
3. НИКОГДА не изменяй тип заказа без явного указания пользователя
4. Всегда подтверждай изменения перед применением
5. При любой неопределенности - УТОЧНЯЙ у пользователя

# ОБРАБОТКА КОЛИЧЕСТВ:
- "два борща" → quantity: 2
- "борщ" → quantity: 1 (по умолчанию)
- "борщ и два шашлыка" → два товара: борщ (1), шашлык (2)
- "три порции борща" → quantity: 3
- "борщ, шашлык, салат" → три товара, quantity: 1 для каждого

# ДОСТУПНЫЕ ДЕЙСТВИЯ (используй ТОЛЬКО эти действия):

## ADD_ITEMS - добавить товары в заказ
Используй когда пользователь говорит:
- "Добавь [блюдо]"
- "Хочу [блюдо]" 
- "Принеси [блюдо]"
- "Давай [блюдо]"
- Просто перечисляет блюда: "борщ, шашлык, салат"
- Указывает количество: "два борща, один шашлык"

## REMOVE_ITEMS - удалить товары из заказа
Используй ТОЛЬКО когда пользователь явно говорит:
- "Удали [блюдо]"
- "Убери [блюдо]"
- "Отмени [блюдо]"

## MODIFY_QUANTITY - изменить количество
Используй когда пользователь говорит:
- "Измени количество [блюдо] на [число]"
- "Сделай [блюдо] [число] штук"
- "Увеличь [блюдо] до [число]"
- "Уменьши [блюдо] до [число]"

## UPDATE_DETAILS - изменить детали заказа
Используй для:
- Количества персон ("Нас 4 человека")
- Номера стола ("Стол номер 5")
- Комментария ("Без лука")

## SHOW_ORDER - показать текущий заказ
Используй когда пользователь говорит:
- "Покажи заказ"
- "Что в заказе"
- "Сводка заказа"

## CLEAR_ORDER - очистить весь заказ
ИСПОЛЬЗУЙ ТОЛЬКО ПРИ ЯВНОЙ КОМАНДЕ:
- "Очистить заказ"
- "Удалить всё"
- "Начать заново"

## ANSWER_QUESTION - ответить на вопрос
Используй для любых вопросов о меню, ресторане и т.д.

# ФОРМАТ ОТВЕТА (ВСЕГДА JSON):

{
  "action": "ADD_ITEMS" | "REMOVE_ITEMS" | "MODIFY_QUANTITY" | "UPDATE_DETAILS" | "SHOW_ORDER" | "CLEAR_ORDER" | "ANSWER_QUESTION",
  
  // ТОЛЬКО для ADD_ITEMS
  "itemsToAdd": [
    {
      "productId": "string (ОБЯЗАТЕЛЬНО точный ID продукта)",
      "productTitle": "string (оригинальное название)",
      "quantity": number (1, 2, 3 и т.д.),
      "comment": "string (опционально)"
    }
  ],
  
  // ТОЛЬКО для REMOVE_ITEMS  
  "itemsToRemove": ["productId1", "productId2"],
  
  // ТОЛЬКО для MODIFY_QUANTITY
  "itemsToModify": [
    {
      "productId": "string",
      "quantity": number
    }
  ],
  
  // ТОЛЬКО для UPDATE_DETAILS
  "updatedDetails": {
    "numberOfPeople": number,
    "tableNumber": "string", 
    "comment": "string"
  },
  
  "response": "string (естественный ответ пользователю)",
  "confidence": number (0.1-1.0, реальная уверенность),
  "suggestions": ["string"] (релевантные предложения)
}

# КОНТЕКСТ:
Меню (${products.length} товаров):
${menuInfo}

Текущий заказ:
${currentOrderInfo}

Тип заказа: ${getOrderTypeText(orderType, 'ru')}
Количество персон: ${additionalInfo.numberOfPeople}
Стол: ${additionalInfo.tableNumber || 'не указан'}

ВСЕГДА отвечай в формате JSON! Будь максимально точен и предсказуем!`;
  };

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
      timestamp: new Date(),
      type: 'order_update'
    }
    
    setConversation(prev => [...prev, userMessage])

    try {
      const aiResponse = await callOpenAI(text)
      const parsedData: AIActionResponse = JSON.parse(aiResponse.choices[0].message.content)
      
      console.log('AI Response:', parsedData)
      
      await handleAIAction(parsedData, text)
      
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: parsedData.response,
        timestamp: new Date(),
        type: parsedData.action === 'SHOW_ORDER' ? 'info' : 'order_update'
      }
      
      // Добавляем предложения если есть
      if (parsedData.suggestions && parsedData.suggestions.length > 0) {
        assistantMessage.content += `\n\n${language === 'ru' ? '💡 Предлагаю:' : '💡 გირჩევთ:'}\n${parsedData.suggestions.map(s => `• ${s}`).join('\n')}`
      }
      
      setConversation(prev => [...prev, assistantMessage])

      if (audioFeedback) {
        speakResponseWithOpenAI(parsedData.response)
      }

    } catch (error) {
      console.error('Error processing order with AI:', error)
      handleAIError(error)
    } finally {
      setIsProcessing(false)
      setTranscript('')
    }
  }

  // Генерация речи через OpenAI TTS
  const speakResponseWithOpenAI = async (text: string) => {
    if (!audioFeedback) return
    
    try {
      const speechText = text.length > 500 ? text.substring(0, 500) + '...' : text
      
      // Пробуем разные прокси эндпоинты для TTS
      let lastError: any = null
      
      for (const endpoint of OPENAI_PROXY_ENDPOINTS) {
        try {
          const response = await fetch(`${endpoint}/audio/speech`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'tts-1',
              input: speechText,
              voice: language === 'ru' ? 'alloy' : 'nova',
              response_format: 'mp3'
            })
          })
          
          if (response.ok) {
            const audioBlob = await response.blob()
            const audioUrl = URL.createObjectURL(audioBlob)
            const audio = new Audio(audioUrl)
            
            audio.onplay = () => setIsSpeaking(true)
            audio.onended = () => {
              setIsSpeaking(false)
              URL.revokeObjectURL(audioUrl)
            }
            audio.onerror = () => {
              setIsSpeaking(false)
              URL.revokeObjectURL(audioUrl)
            }
            
            await audio.play()
            return
          } else {
            console.warn(`TTS endpoint ${endpoint} failed: ${response.status}`)
            lastError = new Error(`HTTP ${response.status}`)
          }
        } catch (error) {
          console.warn(`TTS endpoint ${endpoint} error:`, error)
          lastError = error
          continue
        }
      }
      
      // Fallback на стандартный SpeechSynthesis
      speakResponse(speechText)
      
    } catch (error) {
      console.error('Error with OpenAI TTS:', error)
      // Fallback на стандартный SpeechSynthesis
      speakResponse(text)
    }
  }

  // Стандартный SpeechSynthesis как fallback
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

  const handleAIAction = async (parsedData: AIActionResponse, userText: string) => {
    console.log('Handling AI action:', parsedData.action, parsedData)
    
    let updatedOrder = order ? { ...order } : { items: [], confidence: 0.7, totalAmount: 0 }
    let shouldUpdateOrderType = false
    let newOrderType = orderType
    let shouldUpdateOrder = false

    try {
      switch (parsedData.action) {
        case 'ADD_ITEMS':
          if (parsedData.itemsToAdd && parsedData.itemsToAdd.length > 0) {
            console.log('Adding items:', parsedData.itemsToAdd);
            
            let addedItems: string[] = [];
            
            for (const item of parsedData.itemsToAdd) {
              const product = findProductByIdOrTitle(item.productId, item.productTitle);
              
              if (product) {
                console.log(`Found product: ${product.title} (ID: ${product.id})`);
                
                const existingItemIndex = updatedOrder.items.findIndex(
                  existingItem => existingItem.product.id === product.id
                );
                
                if (existingItemIndex >= 0) {
                  updatedOrder.items[existingItemIndex].quantity += item.quantity || 1;
                  updatedOrder.items[existingItemIndex].totalPrice = 
                    updatedOrder.items[existingItemIndex].quantity * getProductPrice(product);
                  addedItems.push(`${product.title} (теперь ${updatedOrder.items[existingItemIndex].quantity} шт)`);
                } else {
                  const newItem: ParsedOrderItem = {
                    product,
                    quantity: item.quantity || 1,
                    comment: item.comment,
                    totalPrice: (item.quantity || 1) * getProductPrice(product)
                  };
                  updatedOrder.items.push(newItem);
                  addedItems.push(`${product.title} (${item.quantity || 1} шт)`);
                }
              } else {
                console.warn(`Product not found: ID=${item.productId}, Title=${item.productTitle}`);
              }
            }
            
            updatedOrder.confidence = Math.max(updatedOrder.confidence, parsedData.confidence);
            shouldUpdateOrder = true;
            
            if (addedItems.length > 0) {
              const infoMessage: ConversationMessage = {
                role: 'assistant',
                content: `✅ Добавлено: ${addedItems.join(', ')}`,
                timestamp: new Date(),
                type: 'order_update'
              };
              setConversation(prev => [...prev, infoMessage]);
            }
          }
          break;

        case 'REMOVE_ITEMS':
          if (parsedData.itemsToRemove && parsedData.itemsToRemove.length > 0) {
            console.log('Removing items:', parsedData.itemsToRemove)
            updatedOrder.items = updatedOrder.items.filter(item => 
              !parsedData.itemsToRemove!.includes(item.product.id)
            )
            shouldUpdateOrder = true
          }
          break

        case 'MODIFY_QUANTITY':
          if (parsedData.itemsToModify && parsedData.itemsToModify.length > 0) {
            console.log('Modifying quantities:', parsedData.itemsToModify)
            for (const modification of parsedData.itemsToModify) {
              const itemIndex = updatedOrder.items.findIndex(
                item => item.product.id === modification.productId
              )
              if (itemIndex >= 0) {
                updatedOrder.items[itemIndex].quantity = modification.quantity
                updatedOrder.items[itemIndex].totalPrice = 
                  modification.quantity * getProductPrice(updatedOrder.items[itemIndex].product)
              }
            }
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

        case 'SHOW_MENU':
          console.log('Showing menu')
          setActiveTab('menu')
          break

        case 'ANSWER_QUESTION':
          console.log('Answering question')
          break
      }

      if (shouldUpdateOrder) {
        updatedOrder.totalAmount = updatedOrder.items.reduce((sum, item) => sum + item.totalPrice, 0)
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

  const getProductPrice = (product: Product): number => {
    const userRestaurantId = getRestaurantId()
    return product.restaurantPrices?.find(rp => rp.restaurantId === userRestaurantId)?.price || product.price
  }

  const findProductByIdOrTitle = (productId: string, productTitle: string): Product | null => {
    console.log(`Поиск продукта: ID="${productId}", Название="${productTitle}"`);
    
    if (productId) {
      const byId = products.find(p => p.id === productId);
      if (byId) {
        console.log(`Найден по ID: ${byId.title}`);
        return byId;
      }
    }
    
    const normalizedTitle = productTitle
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.,!?;:]$/, '');

    console.log(`Нормализованное название: "${normalizedTitle}"`);

    const exactMatch = products.find(p => 
      p.title.toLowerCase().trim() === normalizedTitle
    );
    if (exactMatch) {
      console.log(`Найден по точному названию: ${exactMatch.title}`);
      return exactMatch;
    }
    
    const containsMatch = products.find(p => {
      const productName = p.title.toLowerCase();
      return normalizedTitle.includes(productName) || 
             productName.includes(normalizedTitle) ||
             productName.startsWith(normalizedTitle) ||
             normalizedTitle.startsWith(productName);
    });
    if (containsMatch) {
      console.log(`Найден по вхождению: ${containsMatch.title}`);
      return containsMatch;
    }
    
    const searchWords = normalizedTitle.split(/\s+/).filter(w => w.length > 2);
    if (searchWords.length > 0) {
      const wordMatch = products.find(p => {
        const productWords = p.title.toLowerCase().split(/\s+/);
        return searchWords.every(searchWord => 
          productWords.some(productWord => 
            productWord.startsWith(searchWord) ||
            searchWord.startsWith(productWord) ||
            calculateSimilarity(productWord, searchWord) > 0.8
          )
        );
      });
      
      if (wordMatch) {
        console.log(`Найден по ключевым словам: ${wordMatch.title}`);
        return wordMatch;
      }
    }
    
    console.log(`Продукт не найден: "${productTitle}"`);
    return null;
  };

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
    const errorMessage: ConversationMessage = {
      role: 'assistant',
      content: language === 'ru' 
        ? 'Извините, произошла ошибка при обработке заказа. Пожалуйста, попробуйте еще раз или опишите заказ более подробно.'
        : 'ბოდიში, მოხდა შეცდომა შეკვეთის დამუშავებისას. გთხოვთ, სცადოთ ხელახლა ან აღწეროთ შეკვეთა უფრო დეტალურად.',
      timestamp: new Date(),
      type: 'error'
    }
    setConversation(prev => [...prev, errorMessage])
    
    toast.error(t.errorProcessing)
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

  // Ручное управление заказом
  const addProductToOrder = (product: Product) => {
    const price = getProductPrice(product)
    
    setOrder(prev => {
      const currentOrder = prev || { items: [], confidence: 1, totalAmount: 0 }
      const existingItemIndex = currentOrder.items.findIndex(item => item.product.id === product.id)
      
      let newItems: ParsedOrderItem[]
      if (existingItemIndex >= 0) {
        newItems = [...currentOrder.items]
        newItems[existingItemIndex].quantity += 1
        newItems[existingItemIndex].totalPrice = newItems[existingItemIndex].quantity * price
      } else {
        newItems = [...currentOrder.items, {
          product,
          quantity: 1,
          totalPrice: price
        }]
      }
      
      const totalAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0)
      
      return {
        ...currentOrder,
        items: newItems,
        totalAmount,
        confidence: 1
      }
    })

    const message: ConversationMessage = {
      role: 'assistant',
      content: language === 'ru' 
        ? `✅ Добавлено: ${product.title}`
        : `✅ დაემატა: ${product.title}`,
      timestamp: new Date(),
      type: 'order_update'
    }
    setConversation(prev => [...prev, message])
  }

  const removeProductFromOrder = (productId: string) => {
    setOrder(prev => {
      if (!prev) return prev
      
      const newItems = prev.items.filter(item => item.product.id !== productId)
      const totalAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0)
      
      return {
        ...prev,
        items: newItems,
        totalAmount
      }
    })
  }

  const updateProductQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeProductFromOrder(productId)
      return
    }

    setOrder(prev => {
      if (!prev) return prev
      
      const newItems = prev.items.map(item => {
        if (item.product.id === productId) {
          const price = getProductPrice(item.product)
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * price
          }
        }
        return item
      })
      
      const totalAmount = newItems.reduce((sum, item) => sum + item.totalPrice, 0)
      
      return {
        ...prev,
        items: newItems,
        totalAmount
      }
    })
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
        speakResponseWithOpenAI(language === 'ru' ? 'Заказ успешно создан' : 'შეკვეთა წარმატებით შეიქმნა')
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

  const getCategoryIcon = (categoryTitle: string) => {
    const categoryKey = categoryTitle.toLowerCase()
    for (const [key, Icon] of Object.entries(CATEGORY_ICONS)) {
      if (categoryKey.includes(key)) {
        return Icon
      }
    }
    return CATEGORY_ICONS.default
  }

  const popularCommands = language === 'ru' ? [
    "Добавить борщ",
    "Показать заказ", 
    "Удалить шашлык",
    "Изменить количество",
    "Очистить заказ",
    "Стол номер 5",
    "Нас 4 человека",
    "Показать меню"
  ] : [
    "დაამატე ბორში",
    "აჩვენე შეკვეთა",
    "წაშალე შაშლიკი", 
    "შეცვალე რაოდენობა",
    "გაასუფთავე შეკვეთა",
    "სტოლი ნომერი 5",
    "ჩვენ 4 კაცი ვართ",
    "აჩვენე მენიუ"
  ]

  const quickActions = [
    { 
      label: t.showMenu, 
      command: "show menu",
      icon: Utensils 
    },
    { 
      label: t.showOrder, 
      command: "show order",
      icon: ShoppingBag 
    },
    { 
      label: t.clearOrder, 
      command: "clear order",
      icon: Trash2 
    },
    { 
      label: t.setTable, 
      command: "table 1",
      icon: User 
    }
  ]

  // Визуализатор аудио уровня
  const AudioVisualizer = () => {
    const bars = 5
    return (
      <div className="flex items-end gap-1 h-8">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-100 ${
              audioLevel > i / bars 
                ? 'bg-green-500' 
                : 'bg-gray-300'
            }`}
            style={{
              height: `${Math.max(8, audioLevel * 32 * (i + 1) / bars)}px`
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-4xl h-full flex flex-col p-0 overflow-hidden"
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 px-6">
            <TabsTrigger value="assistant" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t.assistant}
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              {t.menu}
            </TabsTrigger>
            <TabsTrigger value="order" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              {t.order}
              {order && order.items.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {order.items.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Ассистент */}
          <TabsContent value="assistant" className="flex-1 flex flex-col min-h-0 p-0">
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
                      : message.type === 'error'
                      ? 'bg-red-100 border border-red-200 text-red-800 rounded-bl-none'
                      : message.type === 'info'
                      ? 'bg-green-100 border border-green-200 text-green-800 rounded-bl-none'
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
              
              {isRecording && (
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <AudioVisualizer />
                    </div>
                    <span className="font-medium">{t.recordingAudio}</span>
                  </div>
                </div>
              )}

              {isProcessing && !isRecording && (
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

              {/* Быстрые команды */}
              {showSuggestions && conversation.length <= 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <Zap className="h-4 w-4" />
                    {t.quickActions}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="h-auto py-2 flex flex-col items-center gap-1 text-xs"
                        onClick={() => processOrderWithAI(action.command)}
                      >
                        <action.icon className="h-4 w-4" />
                        {action.label}
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <MessageSquare className="h-4 w-4" />
                    {t.suggestions}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularCommands.map((command, index) => (
                      <Badge 
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => processOrderWithAI(command)}
                      >
                        {command}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t dark:border-gray-700 p-4 space-y-4">
              <div className="space-y-3">
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={t.placeholder}
                  className="min-h-[80px] text-base resize-none"
                  disabled={isRecording}
                />
              </div>
              
              <div className="flex gap-3">
                <div className="flex-1 flex gap-3">
                  <Button
                    onClick={handleManualSend}
                    disabled={!transcript.trim() || isProcessing || isRecording}
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

                <Button
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  variant={isRecording ? "destructive" : "default"}
                  className={`h-12 px-6 flex items-center gap-3 transition-all duration-200 ${
                    isButtonPressed ? 'scale-95' : 'scale-100'
                  }`}
                  size="lg"
                  disabled={isProcessing}
                >
                  {isRecording ? (
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
          </TabsContent>

          {/* Меню */}
          <TabsContent value="menu" className="flex-1 overflow-y-auto p-0">
            <div className="p-4 border-b">
              <Input
                placeholder={t.search}
                className="w-full"
              />
            </div>
            
            <div className="p-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="default" className="cursor-pointer">
                  {t.all}
                </Badge>
                {categories.map(category => {
                  const Icon = getCategoryIcon(category.title)
                  return (
                    <Badge key={category.id} variant="outline" className="cursor-pointer flex items-center gap-1">
                      <Icon className="h-3 w-3" />
                      {category.title}
                    </Badge>
                  )
                })}
              </div>

              <div className="grid gap-4">
                {products.map(product => (
                  <Card key={product.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{product.title}</h3>
                        {product.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="font-bold text-green-600">
                            {getProductPrice(product)} ₽
                          </span>
                          {product.tags && product.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        onClick={() => addProductToOrder(product)}
                        size="sm"
                        className="ml-4"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Заказ */}
          <TabsContent value="order" className="flex-1 overflow-y-auto p-0">
            <div className="p-4">
              {order && order.items.length > 0 ? (
                <div className="space-y-4">
                  {/* Сводка заказа */}
                  <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">{t.itemsCount}</div>
                        <div className="font-semibold">{order.items.length}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">{t.peopleCount}</div>
                        <div className="font-semibold">{additionalInfo.numberOfPeople}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">{t.table}</div>
                        <div className="font-semibold">{additionalInfo.tableNumber || '-'}</div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">{t.type}</div>
                        <div className="font-semibold">{getOrderTypeText(orderType)}</div>
                      </div>
                    </div>
                  </Card>

                  {/* Позиции заказа */}
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold">{item.product.title}</h4>
                              {item.comment && (
                                <Badge variant="outline" className="text-xs">
                                  {item.comment}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateProductQuantity(item.product.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-medium w-8 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateProductQuantity(item.product.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="font-bold text-green-600">
                                {item.totalPrice}₽
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeProductFromOrder(item.product.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Итого */}
                  <Card className="p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">{t.total}:</span>
                      <span className="font-bold text-2xl text-green-600">
                        {order.totalAmount}₽
                      </span>
                    </div>
                  </Card>

                  <Button
                    onClick={createOrder}
                    disabled={isCreatingOrder}
                    className="w-full h-12 bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {isCreatingOrder ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {t.confirmAndCreate}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    {t.emptyOrder}
                  </h3>
                  <Button
                    onClick={() => setActiveTab('assistant')}
                    variant="outline"
                    className="mt-4"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    {language === 'ru' ? 'Начать говорить' : 'დაიწყეთ საუბარი'}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

// API Route для транскрипции аудио
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const model = formData.get('model') as string
    const language = formData.get('language') as string

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Конвертируем файл в нужный формат если необходимо
    const audioBlob = new Blob([await file.arrayBuffer()], { type: file.type })

    const openaiFormData = new FormData()
    openaiFormData.append('file', audioBlob, 'audio.webm')
    openaiFormData.append('model', model || 'whisper-1')
    if (language) {
      openaiFormData.append('language', language)
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openaiFormData,
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const result = await response.json()
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Transcription error:', error)
    return new Response(JSON.stringify({ error: 'Transcription failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Компонент с кнопкой для открытия ассистента
export function VoiceAssistantButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
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