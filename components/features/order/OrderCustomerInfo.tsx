'use client'

import { User, Phone, Mail, MessageCircle } from 'lucide-react'
import { CustomerDto } from '@/lib/api/order.service'
import { cn } from '@/lib/utils'
import { useLanguageStore } from '@/lib/stores/language-store'
import { Button } from "@/components/ui/button"

export function OrderCustomerInfo({ customer, compact = false }: {
  customer: CustomerDto
  compact?: boolean
}) {
  const { language } = useLanguageStore()

  const handleCall = () => {
    window.location.href = `tel:${customer.phone}`
  }

  const handleWhatsApp = () => {
    // Удаляем все нецифровые символы из номера телефона
    const phoneNumber = customer.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phoneNumber}`, '_blank')
  }

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <h4 className={cn("font-medium flex items-center", compact ? "text-xs gap-1" : "text-sm gap-2")}>
        <User className={compact ? "h-3 w-3" : "h-4 w-4"} />
        {language === 'ru' ? 'Клиент' : 'კლიენტი'}
      </h4>
      
      <div className={compact ? "space-y-0.5 text-xs" : "space-y-1 text-sm"}>
       <div className="flex gap-1">
            <Button 
              variant="outline" 
              size={compact ? "sm" : "default"}
              className="p-1 h-auto"
              onClick={handleCall}
              title={language === 'ru' ? 'Позвонить' : 'დარეკვა'}
            >
              {customer.phone}
              <Phone className={compact ? "h-3 w-3" : "h-4 w-4"} />
            </Button>
            <Button 
              variant="outline" 
              size={compact ? "sm" : "default"}
              className="p-1 h-auto bg-green-100 hover:bg-green-200 text-green-800 border-green-200"
              onClick={handleWhatsApp}
              title="WhatsApp"
            >
              <MessageCircle className={compact ? "h-3 w-3" : "h-4 w-4"} />
            </Button>
          </div>

      </div>
    </div>
  )
}