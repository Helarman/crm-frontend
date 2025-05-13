import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock } from 'lucide-react'
import { useState } from 'react'

export const TimePicker = ({
  value,
  onChange,
  label,
  language,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  language: 'ru' | 'ka'
}) => {
  const [time, setTime] = useState(value || '12:00')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTime(newTime)
    onChange(newTime)
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type="time"
          value={time}
          onChange={handleChange}
          className="pr-10"
        />
        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  )
}