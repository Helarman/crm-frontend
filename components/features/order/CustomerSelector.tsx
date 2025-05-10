'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {Button} from '@/components/ui/button'

interface CustomerSelectorProps {
  onSelect: (customerId: string) => void
}

export function CustomerSelector({ onSelect }: CustomerSelectorProps) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')

  const handleSelect = () => {
    // В реальном приложении здесь бы был поиск/создание клиента
    const customerId = `customer-${Date.now()}`
    onSelect(customerId)
  }

  return (
    <div className="p-4 border rounded-lg space-y-2">
      <h2 className="text-lg font-semibold">Клиент</h2>
      
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Телефон</Label>
          <Input 
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (___) ___-__-__"
          />
        </div>

        <div className="space-y-1">
          <Label>Имя</Label>
          <Input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Иван Иванов"
          />
        </div>

        <Button 
          className="w-full"
          onClick={handleSelect}
          disabled={!phone}
        >
          {phone ? 'Сохранить клиента' : 'Введите телефон'}
        </Button>
      </div>
    </div>
  )
}