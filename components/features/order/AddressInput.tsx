'use client'

import { useEffect, useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'
import { Language } from '@/lib/stores/language-store'
import { DeliveryZoneService } from '@/lib/api/delivery-zone.service'
import { toast } from 'sonner'

interface AddressInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  language: Language
  restaurantId: string
  onZoneFound?: (zone: any) => void
  onAddressSelect?: (address: string) => void 
  className?: string
}

export const AddressInput = ({ 
  value, 
  onChange, 
  language, 
  restaurantId,
  onZoneFound,
  onAddressSelect,
  className
}: AddressInputProps) => {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const token = 'e7a8d3897b07bb4631312ee1e8b376424c6667ea'
      const url = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          query: address, 
          count: 1,
          locations: [{ country: "*" }]
        })
      })

      if (!response.ok) throw new Error('Failed to geocode address')

      const data = await response.json()
      
      if (data.suggestions && data.suggestions.length > 0) {
        const suggestion = data.suggestions[0]
        if (suggestion.data.geo_lat && suggestion.data.geo_lon) {
          return {
            lat: parseFloat(suggestion.data.geo_lat),
            lng: parseFloat(suggestion.data.geo_lon)
          }
        }
      }
      return null
    } catch (error) {
      return null
    }
  }

  const findDeliveryZone = async (lat: number, lng: number) => {
    try {
      const zone = await DeliveryZoneService.findZoneForPoint(restaurantId, lat, lng)
      if (zone && onZoneFound) {
        onZoneFound(zone)
      }
      return zone
    } catch (error) {
      return null
    }
  }

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const token = 'e7a8d3897b07bb4631312ee1e8b376424c6667ea'
      const url = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          query: query, 
          count: 5,
          locations: [{ country: "*" }]
        })
      })

      if (!response.ok) throw new Error('Failed to fetch suggestions')

      const data = await response.json()
      setSuggestions(data.suggestions || [])
    } catch (error) {
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    const syntheticEvent = {
      ...e,
      target: { ...e.target, value: newValue }
    }
    onChange(syntheticEvent)
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 300)
  }
  
  const handleSuggestionSelect = async (suggestion: any) => {
    const standardizedAddress = suggestion.value
    
    setInputValue(standardizedAddress)
    
    const syntheticEvent = {
      target: {
        value: standardizedAddress,
        name: 'deliveryAddress'
      }
    } as React.ChangeEvent<HTMLInputElement>
    
    onChange(syntheticEvent)
    
    if (onAddressSelect) {
      onAddressSelect(standardizedAddress)
    }
    
    setSuggestions([])
    
    toast.info(
      language === 'ka' 
        ? 'მისამართის შემოწმება...'
        : 'Проверка адреса...'
    )
    
    const coordinates = await geocodeAddress(standardizedAddress)
    
    if (coordinates && restaurantId) {
      const zone = await findDeliveryZone(coordinates.lat, coordinates.lng)
      if (zone) {
        toast.success(
          language === 'ka' 
            ? `მიტანის ზონა: ${zone.title} (${zone.price} ₽)`
            : `Зона доставки: ${zone.title} (${zone.price} ₽)`
        )
      } else {
        toast.error(
          language === 'ka' 
            ? 'მიტანის ზონა არ მოიძებნა ამ მისამართისთვის'
            : 'Зона доставки не найдена для этого адреса'
        )
      }
    } else {
      toast.error(
        language === 'ka' 
          ? 'მისამართის გეოკოდირება ვერ მოხერხდა'
          : 'Не удалось определить координаты адреса'
      )
    }
  }

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <div className={`relative ${className || ''}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={inputValue}
          onChange={handleAddressChange}
          placeholder={language === 'ka' ? 'შეიყვანეთ მისამართი' : 'Введите адрес'}
          className="pl-10 h-14"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          </div>
        )}
      </div>
      {suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 transition-colors"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="font-medium">{suggestion.value}</div>
              {suggestion.data.city && (
                <div className="text-sm text-gray-600">
                  {suggestion.data.postal_code && `${suggestion.data.postal_code}, `}
                  {suggestion.data.city}
                  {suggestion.data.street && `, ${suggestion.data.street}`}
                  {suggestion.data.house && `, ${suggestion.data.house}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}