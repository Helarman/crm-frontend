'use client'

import { User, Phone, Mail } from 'lucide-react'
import { CustomerDto } from '@/lib/api/order.service'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/lib/stores/language-store'

export function OrderCustomerInfo({ customer, compact = false }: {
  customer: CustomerDto
  compact?: boolean
}) {
  const { language } = useLanguageStore()

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <h4 className={cn("font-medium flex items-center", compact ? "text-xs gap-1" : "text-sm gap-2")}>
        <User className={compact ? "h-3 w-3" : "h-4 w-4"} />
        {language === 'ru' ? 'Клиент' : 'კლიენტი'}
      </h4>
      
      <div className={compact ? "space-y-0.5 text-xs" : "space-y-1 text-sm"}>
        <div className="font-medium truncate">{customer.name}</div>
        
        <div className="flex items-center text-muted-foreground">
          <Phone className={compact ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"} />
          <span>{customer.phone}</span>
        </div>
        
        {customer.email && (
          <div className="flex items-center text-muted-foreground truncate">
            <Mail className={compact ? "h-3 w-3 mr-1" : "h-4 w-4 mr-2"} />
            <span>{customer.email}</span>
          </div>
        )}
      </div>
    </div>
  )
}