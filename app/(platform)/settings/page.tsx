'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguageStore } from '@/lib/stores/language-store'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { language } = useLanguageStore()


  return (
    <div className="flex items-center justify-center  bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <AlertTriangle className="h-16 w-16 text-yellow-400" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Недоступно</h1>
          <p className="text-muted-foreground">В разработке</p>
        </div>

        <Button 
          onClick={() => router.push('/')}
          className="mt-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться на главную
        </Button>
      </div>
    </div>
  )
}