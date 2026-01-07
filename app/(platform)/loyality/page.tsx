'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguageStore } from '@/lib/stores/language-store'
import DiscountsTable from '@/components/features/loyality/DiscountsTable'
import SurchargesTable from '@/components/features/loyality/SurchargesTable'
import CustomerTable from '@/components/features/loyality/CustomerTable'
import { Tag, TicketPercent, UsersRound } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AccessCheck } from '@/components/AccessCheck'
import { useAuth } from '@/lib/hooks/useAuth' // Добавим для проверки роли, если нужно

const LoyaltyPage = () => {
  const { language } = useLanguageStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth() // Добавим, если нужно ограничить доступ по ролям

  // Получаем активную вкладку из URL или устанавливаем по умолчанию
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam || 'discounts')

  // Обновляем URL при изменении вкладки
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (activeTab) {
      params.set('tab', activeTab)
    } else {
      params.delete('tab')
    }

    router.push(`?${params.toString()}`, { scroll: false })
  }, [activeTab, router, searchParams])

  const translations = {
    discounts: {
      ru: 'Скидки',
      ka: 'ფასდაკლებები'
    },
    surcharges: {
      ru: 'Надбавки',
      ka: 'დანამატები'
    },
    customers: {
      ru: 'Клиенты',
      ka: 'კლიენტები'
    },
    title: {
      ru: 'Программа лояльности',
      ka: 'ლოიალურობის პროგრამა'
    },
    description: {
      ru: 'Управление скидками, надбавками и клиентами',
      ka: 'ფასდაკლებების, დანამატების და კლიენტების მართვა'
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <AccessCheck allowedRoles={['MANAGER', 'SUPERVISOR']}>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {translations.title[language]}
          </h1>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* Обновленный TabsList с такими же стилями как в MenuPage */}
          <TabsList className="w-full gap-2 sm:flex-row sm:grid sm:grid-cols-3">
            <TabsTrigger value="discounts" className="flex-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <Tag className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{translations.discounts[language]}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="surcharges" className="flex-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <TicketPercent className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{translations.surcharges[language]}</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <UsersRound className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{translations.customers[language]}</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discounts" className="space-y-4">
            <Card>
              <DiscountsTable />
            </Card>
          </TabsContent>

          <TabsContent value="surcharges" className="space-y-4">
            <Card>
              <SurchargesTable />
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CustomerTable />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AccessCheck>
  )
}

export default LoyaltyPage