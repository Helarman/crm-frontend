'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'
import { Language } from '@/lib/stores/language-store'
import { DeliveryZoneService } from '@/lib/api/delivery-zone.service'

interface AddressInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  language: Language
  restaurantId: string
  onZoneFound?: (zone: any) => void
}

export const AddressInput = ({ 
  value, 
  onChange, 
  language, 
  restaurantId,
  onZoneFound 
}: AddressInputProps) => {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
      if (zone && onZoneFound) {
        onZoneFound(zone)
      }
    } catch (error) {
      console.error('Error finding delivery zone:', error)
    }
  }

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e)
    const newAddress = e.target.value
    
    if (newAddress.length < 3) {
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
          query: newAddress, 
          count: 5,
          locations: [{ country: "*" }]
        })
      })

      if (!response.ok) throw new Error('Failed to fetch suggestions')

      const data = await response.json()
      setSuggestions(data.suggestions || [])
    } catch (error) {
      console.error('Address suggestion error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionSelect = async (suggestion: any) => {
    const address = suggestion.value
    onChange({ target: { value: address } } as React.ChangeEvent<HTMLInputElement>)
    setSuggestions([])

    // Геокодируем выбранный адрес и ищем зону
    const coordinates = await geocodeAddress(address)
    if (coordinates && restaurantId) {
      await findDeliveryZone(coordinates.lat, coordinates.lng)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={handleAddressChange}
          placeholder={language === 'ka' ? 'შეიყვანეთ მისამართი' : 'Введите адрес'}
          className="pl-10 h-14"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              {suggestion.value}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}