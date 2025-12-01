'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguageStore } from '@/lib/stores/language-store'
import DiscountsTable from '@/components/features/loyality/DiscountsTable'
import SurchargesTable from '@/components/features/loyality/SurchargesTable'
import { CustomerDto } from '@/lib/api/customer.service'
import { CustomerService } from '@/lib/api/customer.service'
import { useEffect } from 'react'
import { Tag, TicketPercent, UsersRound } from 'lucide-react'
import CustomerTable from '@/components/features/loyality/CustomerTable'
const LoyaltyPage = () => {
  const { language } = useLanguageStore()
  const [activeTab, setActiveTab] = useState('discounts')
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

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



  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {translations.title[language]}
        </h1>
        <p className="text-muted-foreground">
          {translations.description[language]}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discounts">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Tag className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{translations.discounts[language]}</span>
            </div>
            
          </TabsTrigger>
          <TabsTrigger value="surcharges">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
                <TicketPercent className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{translations.surcharges[language]}</span>
            </div>
            
          </TabsTrigger>
          <TabsTrigger value="customers">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <UsersRound className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{translations.customers[language]}</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discounts" className="space-y-4">
          <Card>
            <CardContent>
              <DiscountsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="surcharges" className="space-y-4">
          <Card>
            <CardContent>
              <SurchargesTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardContent>
              <CustomerTable
              />
              
              {/* Пагинация для клиентов */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  {language === 'ru' ? 'Назад' : 'უკან'}
                </button>
                <button
                  className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
                  onClick={() => setPage(p => p + 1)}
                  disabled={customers.length < limit}
                >
                  {language === 'ru' ? 'Вперед' : 'წინ'}
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default LoyaltyPage