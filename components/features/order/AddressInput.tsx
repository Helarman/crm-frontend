'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'
import { Language } from '@/lib/stores/language-store'

interface AddressInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  language: Language
}

export const AddressInput = ({ value, onChange, language }: AddressInputProps) => {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e)
    if (e.target.value.length < 3) {
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
          query: e.target.value, 
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

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={handleAddressChange}
          placeholder={language === 'ka' ? 'შეიყვანეთ მისამართი' : 'Введите адрес'}
          className="pl-10"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onChange({ target: { value: suggestion.value } } as React.ChangeEvent<HTMLInputElement>)
                setSuggestions([])
              }}
            >
              {suggestion.value}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}