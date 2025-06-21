'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { SurchargeResponse, SurchargeService } from '@/lib/api/surcharge.service'
import { toast } from 'sonner'

interface SurchargeSelectorProps {
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'BANQUET'
  restaurantId: string
  selectedSurcharges: { id: string; title: string; amount: number; type: 'FIXED' | 'PERCENTAGE' }[]
  onSelect: (surcharges: { id: string; title: string; amount: number; type: 'FIXED' | 'PERCENTAGE' }[]) => void
  language: string
}

export const SurchargeSelector = ({
  orderType,
  restaurantId,
  selectedSurcharges,
  onSelect,
  language
}: SurchargeSelectorProps) => {
  const [availableSurcharges, setAvailableSurcharges] = useState<SurchargeResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSurcharges = async () => {
      setLoading(true)
      try {
        const surcharges = await SurchargeService.getForOrderType(
          orderType,
          restaurantId
        )
        setAvailableSurcharges(surcharges)
      } catch (error) {
        console.error('Failed to load surcharges:', error)
      } finally {
        setLoading(false)
      }
    }

    if (restaurantId) {
      fetchSurcharges()
    }
  }, [orderType, restaurantId])

  const toggleSurcharge = (surcharge: SurchargeResponse) => {
    const isSelected = selectedSurcharges.some(s => s.id === surcharge.id)
    if (isSelected) {
      onSelect(selectedSurcharges.filter(s => s.id !== surcharge.id))
    } else {
      onSelect([
        ...selectedSurcharges,
        {
          id: surcharge.id,
          title: surcharge.title,
          amount: surcharge.amount,
          type: surcharge.type
        }
      ])
    }
  }

  return (
    <div className="space-y-3">
      <Label className="text-lg">
        {language === 'ka' ? 'დამატებითი გადასახადები' : 'Дополнительные сборы'}
      </Label>
      
      {loading ? (
        <p>{language === 'ka' ? 'იტვირთება...' : 'Загрузка...'}</p>
      ) : availableSurcharges.length === 0 ? (
        <p className="text-muted-foreground">
          {language === 'ka' ? 'არ არის ხელმისაწვდომი დამატებითი გადასახადები' : 'Нет доступных дополнительных сборов'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableSurcharges.map(surcharge => {
            const isSelected = selectedSurcharges.some(s => s.id === surcharge.id)
            const title = surcharge.title
            
            return (
              <button
                key={surcharge.id}
                onClick={() => toggleSurcharge(surcharge)}
                className={`p-4 border-2 rounded-lg flex justify-between items-center transition-all
                  ${isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                    : 'hover:bg-accent shadow-sm hover:shadow-md'
                  }`}
              >
                <span className="font-medium">{title}</span>
                <span className="font-bold">
                  {surcharge.type === 'FIXED' 
                    ? `+${surcharge.amount} ₽`
                    : `+${surcharge.amount}%`}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}