'use client'

import { useEffect, useState } from 'react'
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
}

export const AddressInput = ({ 
  value, 
  onChange, 
  language, 
  restaurantId,
  onZoneFound,
  onAddressSelect
}: AddressInputProps) => {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)

  // Синхронизируем inputValue с value из пропсов, 
  // но если есть выбранный адрес, используем его
  useEffect(() => {
    if (selectedAddress) {
      setInputValue(selectedAddress)
    } else {
      setInputValue(value)
    }
  }, [value, selectedAddress])

  // Функция для геокодирования адреса
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
      console.error('Geocoding error:', error)
      return null
    }
  }

  // Функция для поиска зоны доставки
  const findDeliveryZone = async (lat: number, lng: number) => {
    try {
      const zone = await DeliveryZoneService.findZoneForPoint(restaurantId, lat, lng)
      console.log('Found delivery zone:', zone)
      if (zone && onZoneFound) {
        onZoneFound(zone)
      }
    } catch (error) {
      console.error('Error finding delivery zone:', error)
    }
  }

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    console.log('📝 Address changed manually:', newValue)
    
    // Если есть выбранный адрес и мы начинаем печатать заново, сбрасываем его
    if (selectedAddress) {
      setSelectedAddress(null)
    }
    
    setInputValue(newValue)
    onChange(e)
    
    if (newValue.length < 3) {
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
          query: newValue, 
          count: 5,
          locations: [{ country: "*" }]
        })
      })

      if (!response.ok) throw new Error('Failed to fetch suggestions')

      const data = await response.json()
      console.log('Suggestions received:', data.suggestions)
      setSuggestions(data.suggestions || [])
    } catch (error) {
      console.error('Address suggestion error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSuggestionSelect = async (suggestion: any) => {
    const address = suggestion.value
    console.log('Suggestion selected:', address)
    
    // Сохраняем выбранный адрес
    setSelectedAddress(address)
    
    // Очищаем список подсказок
    setSuggestions([])
    
    // Обновляем локальное состояние
    setInputValue(address)
    
    // Вызываем onAddressSelect (он сам обновит order.deliveryAddress)
    if (onAddressSelect) {
      console.log('Calling onAddressSelect with:', address)
      onAddressSelect(address)
    }

    // Геокодирование и поиск зоны доставки
    const coordinates = await geocodeAddress(address)
    console.log('Geocoded coordinates:', coordinates)
    
    if (coordinates && restaurantId) {
      await findDeliveryZone(coordinates.lat, coordinates.lng)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={inputValue}
          onChange={handleAddressChange}
          placeholder={language === 'ka' ? 'შეიყვანეთ მისამართი' : 'Введите адрес'}
          className="pl-10 h-14"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="font-medium">{suggestion.value}</div>
              {suggestion.data.city && (
                <div className="text-sm text-gray-600">
                  {suggestion.data.city}
                  {suggestion.data.street && `, ${suggestion.data.street}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}