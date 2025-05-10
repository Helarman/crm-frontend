'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguageStore } from '@/lib/stores/language-store'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { language } = useLanguageStore()

  const translations = {
    ru: {
      title: 'Доступ запрещён',
      message: 'У вас нет прав для просмотра этой страницы.',
      button: 'Вернуться на главную'
    },
    ka: {
      title: 'წვდომა აკრძალულია',
      message: 'ამ გვერდის ნახვის უფლება არ გაქვთ.',
      button: 'მთავარ გვერდზე დაბრუნება'
    }
  }

  const t = translations[language]

  return (
    <div className="flex items-center justify-center  bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <AlertTriangle className="h-16 w-16 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">{t.message}</p>
        </div>

        <Button 
          onClick={() => router.push('/')}
          className="mt-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.button}
        </Button>
      </div>
    </div>
  )
}