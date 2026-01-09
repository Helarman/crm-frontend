import { useEffect, useState } from 'react'
import { SurchargeService } from '@/lib/api/surcharge.service'
import { OrderType, Surcharge } from '@/lib/types/order'

export const useSurcharges = (orderType: OrderType, restaurantId: string) => {
  const [surcharges, setSurcharges] = useState<Surcharge[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSurcharges = async () => {
      if (!restaurantId) return
      
      setLoading(true)
      setError(null)
      
      try {
        const data = await SurchargeService.getForOrderType({orderType, restaurantId})
        setSurcharges(data.map(s => ({
          id: s.id,
          title: s.title,
          amount: s.amount,
          type: s.type
        })))
      } catch (err) {
        console.error('Failed to load surcharges:', err)
        setError('Failed to load surcharges')
      } finally {
        setLoading(false)
      }
    }

    fetchSurcharges()
  }, [orderType, restaurantId])

  return { surcharges, loading, error }
}