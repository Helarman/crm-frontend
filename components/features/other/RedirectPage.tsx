'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguageStore } from '@/lib/stores/language-store'
import { useEffect, useState } from 'react'

interface RedirectPageProps {
  redirectTo?: string
  redirectSeconds?: number
}

export default function RedirectPage({ 
  redirectTo = '/', 
  redirectSeconds = 5 
}: RedirectPageProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(redirectSeconds)
  const { language } = useLanguageStore()

  const translations = {
    ru: {
      title: 'Вы будете перенаправлены',
      message: (seconds: number) => `Автоматический переход через ${seconds} ${getRussianSecondsWord(seconds)}...`,
      button: 'Перейти сейчас'
    },
    ka: {
      title: 'გადამისამართდებით',
      message: (seconds: number) => `ავტომატური გადამისამართება ${seconds} ${getGeorgianSecondsWord(seconds)}-ში...`,
      button: 'ახლავე გადასვლა'
    }
  }

  // Функции для правильного склонения слов
  function getRussianSecondsWord(seconds: number): string {
    const lastDigit = seconds % 10
    const lastTwoDigits = seconds % 100
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'секунд'
    if (lastDigit === 1) return 'секунду'
    if (lastDigit >= 2 && lastDigit <= 4) return 'секунды'
    return 'секунд'
  }

  function getGeorgianSecondsWord(seconds: number): string {
    return 'წამში' // В грузинском обычно используется одна форма
  }

  const t = translations[language]

  // Обратный отсчет для автоматического редиректа
  useEffect(() => {
    if (countdown <= 0) {
      router.push(redirectTo)
      return
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, redirectTo, router])

  // Принудительная навигация при клике на кнопку
  const handleRedirect = () => {
    router.push(redirectTo)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">
            {t.message(countdown)}
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {language === 'ru' 
              ? `Будет выполнено перенаправление на: ${redirectTo}`
              : `გადამისამართება მოხდება: ${redirectTo}`
            }
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={handleRedirect}
              className="min-w-[180px]"
              variant="default"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.button}
            </Button>
            
            <Button 
              onClick={() => router.back()}
              className="min-w-[180px]"
              variant="outline"
            >
              {language === 'ru' ? 'Вернуться назад' : 'უკან დაბრუნება'}
            </Button>
          </div>
        </div>

        {/* Индикатор прогресса */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-6">
          <div 
            className="bg-primary h-2.5 rounded-full transition-all duration-1000"
            style={{ 
              width: `${((redirectSeconds - countdown) / redirectSeconds) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  )
}