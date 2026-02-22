'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, Loader2, Trash2 } from "lucide-react"
import { useLanguageStore } from '@/lib/stores/language-store'
import { toast } from 'sonner'
import SearchableSelect from '../menu/product/SearchableSelect'
import { Restaurant } from '@/lib/types/restaurant'
import { WorkshopResponseDto } from '@/lib/api/workshop.service'

enum UserRoles {
  NONE = "NONE",
  STOREMAN = "STOREMAN",
  COURIER = "COURIER",
  COOK = "COOK",
  CHEF = "CHEF",
  WAITER = "WAITER",
  CASHIER = "CASHIER",
  MANAGER = "MANAGER",
  SUPERVISOR = "SUPERVISOR"
}

interface EditStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staffMember: {
    id: string
    name: string
    email: string
    phone?: string
    restaurant: {
      id: string
      title: string
    }[]
    workshops?: {
      workshopId: string
      name: string
    }[]
    position: string
  }
  restaurants: Restaurant[]
  workshops: WorkshopResponseDto[]
  onSave: (role: UserRoles, restaurants: string[], workshops?: string[], name?: string, email?: string, phone?: string) => Promise<void>
  onDelete: (userId: string) => Promise<void>
  isLoading: boolean
  isDeleting: boolean
}

const translations = {
  ru: {
    editStaff: "Редактировать сотрудника",
    name: "Имя",
    email: "Email",
    phone: "Телефон",
    role: "Роль",
    selectRole: "Выберите роль",
    restaurants: "Рестораны",
    selectRestaurants: "Выберите рестораны",
    searchRestaurants: "Поиск ресторанов...",
    noRestaurants: "Рестораны не найдены",
    workshops: "Цехи",
    selectWorkshops: "Выберите цехи",
    searchWorkshops: "Поиск цехов...",
    noWorkshops: "Цехи не найдены",
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    deleteConfirm: "Подтвердить",
    roleUpdated: "Роль успешно обновлена",
    restaurantUpdated: "Рестораны успешно обновлены",
    userDeleted: "Сотрудник успешно удален",
    error: "Ошибка при обновлении",
    [UserRoles.NONE]: "Без роли",
    [UserRoles.STOREMAN]: "Кладовщик",
    [UserRoles.COURIER]: "Курьер",
    [UserRoles.COOK]: "Повар",
    [UserRoles.CHEF]: "Шеф-повар",
    [UserRoles.WAITER]: "Официант",
    [UserRoles.CASHIER]: "Кассир",
    [UserRoles.MANAGER]: "Менеджер",
    [UserRoles.SUPERVISOR]: "Супервайзер"
  },
  ka: {
    editStaff: "თანამშრომლის რედაქტირება",
    name: "სახელი",
    email: "ელ. ფოსტა",
    phone: "ტელეფონი",
    role: "როლი",
    selectRole: "აირჩიეთ როლი",
    restaurants: "რესტორანები",
    selectRestaurants: "აირჩიეთ რესტორანები",
    searchRestaurants: "რესტორანების ძებნა...",
    noRestaurants: "რესტორანები ვერ მოიძებნა",
    workshops: "სახელოსნოები",
    selectWorkshops: "აირჩიეთ სახელოსნოები",
    searchWorkshops: "სახელოსნოების ძებნა...",
    noWorkshops: "სახელოსნოები ვერ მოიძებნა",
    save: "შენახვა",
    cancel: "გაუქმება",
    delete: "წაშლა",
    deleteConfirm: "Confirm",
    roleUpdated: "როლი წარმატებით განახლდა",
    restaurantUpdated: "რესტორანები წარმატებით განახლდა",
    userDeleted: "თანამშრომელი წარმატებით წაიშალა",
    error: "შეცდომა განახლებისას",
    [UserRoles.NONE]: "როლის გარეშე",
    [UserRoles.STOREMAN]: "საწყობის მენეჯერი",
    [UserRoles.COURIER]: "კურიერი",
    [UserRoles.COOK]: "მზარეული",
    [UserRoles.CHEF]: "შეფ-მზარეული",
    [UserRoles.WAITER]: "ოფიციანტი",
    [UserRoles.CASHIER]: "კასირი",
    [UserRoles.MANAGER]: "მენეჯერი",
    [UserRoles.SUPERVISOR]: "სუპერვაიზერი"
  }
}

// Функция для форматирования российского телефона
const formatPhoneNumber = (value: string) => {
  // Удаляем все нецифровые символы
  const numbers = value.replace(/\D/g, '')
  
  // Если номер пустой, возвращаем +7
  if (!numbers) return '+7'
  
  // Для российских номеров первая цифра должна быть 7
  let formatted = '+7'
  
  // Пропускаем первую цифру если это 7 или 8
  let restNumbers = numbers
  if (numbers.startsWith('7') || numbers.startsWith('8')) {
    restNumbers = numbers.slice(1)
  }
  
  // Форматируем: +7 (XXX) XXX-XX-XX
  if (restNumbers.length > 0) {
    formatted += ' (' + restNumbers.slice(0, 3)
  }
  
  if (restNumbers.length > 3) {
    formatted += ') ' + restNumbers.slice(3, 6)
  }
  
  if (restNumbers.length > 6) {
    formatted += '-' + restNumbers.slice(6, 8)
  }
  
  if (restNumbers.length > 8) {
    formatted += '-' + restNumbers.slice(8, 10)
  }
  
  return formatted
}

// Функция для очистки телефона от форматирования
const cleanPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  // Убеждаемся что номер начинается с 7
  if (numbers.startsWith('8')) {
    return '7' + numbers.slice(1)
  }
  if (numbers.startsWith('7')) {
    return numbers
  }
  return '7' + numbers
}

export function EditStaffDialog({
  open,
  onOpenChange,
  staffMember,
  restaurants,
  workshops,
  onSave,
  onDelete,
  isLoading,
  isDeleting,
}: EditStaffDialogProps) {
  const { language } = useLanguageStore()
  const t = translations[language]

  const [name, setName] = useState(staffMember.name)
  const [email, setEmail] = useState(staffMember.email)
  const [phone, setPhone] = useState(() => {
    return staffMember.phone ? formatPhoneNumber(staffMember.phone) : '+7'
  })
  const [selectedRole, setSelectedRole] = useState<UserRoles>(staffMember.position as UserRoles)
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>(
    staffMember.restaurant.map(r => r.id)
  )
  const [selectedWorkshops, setSelectedWorkshops] = useState<string[]>(
    staffMember.workshops?.map(w => w.workshopId) || []
  )
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const allRoles = Object.values(UserRoles)
  const isKitchenRole = selectedRole === UserRoles.COOK || selectedRole === UserRoles.CHEF

  // Сброс данных при изменении staffMember или открытии/закрытии диалога
  useEffect(() => {
    if (open && staffMember) {
      setName(staffMember.name)
      setEmail(staffMember.email)
      setPhone(staffMember.phone ? formatPhoneNumber(staffMember.phone) : '+7')
      setSelectedRole(staffMember.position as UserRoles)
      setSelectedRestaurants(staffMember.restaurant.map(r => r.id))
      setSelectedWorkshops(staffMember.workshops?.map(w => w.workshopId) || [])
      setDeleteConfirm(false)
    }
  }, [open, staffMember])

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true)
      return
    }
    
    await onDelete(staffMember.id)
    setDeleteConfirm(false)
    onOpenChange(false)
  }

  const handleSave = async () => {
    try {
        let cleanPhone: string | undefined = undefined
        
        if (phone && phone !== '+7' && phone !== '+7 () -' && phone !== '+7 (___) ___-__-__') {
          const cleaned = cleanPhoneNumber(phone)
          if (cleaned && cleaned.length > 1) {
            cleanPhone = cleaned
          }
        }
      await onSave(
        selectedRole,
        selectedRestaurants,
        isKitchenRole ? selectedWorkshops : undefined,
        name,
        email,
        cleanPhone
      )
      
      toast.success(
        language === 'ru'
          ? 'Данные сотрудника успешно обновлены'
          : 'თანამშრომლის მონაცემები წარმატებით განახლდა'
      )
    } catch (error) {
      console.error('Failed to update staff member:', error)
      toast.error(
        language === 'ru'
          ? 'Ошибка при обновлении данных сотрудника'
          : 'შეცდომა თანამშრომლის მონაცემების განახლებისას'
      )
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const cursorPosition = input.selectionStart || 0
    const rawValue = e.target.value
    
    // Если поле пустое или удалили все символы, оставляем +7
    if (!rawValue || rawValue === '+') {
      setPhone('+7')
      setTimeout(() => {
        input.setSelectionRange(2, 2)
      }, 0)
      return
    }
    
    // Форматируем введенное значение
    const formatted = formatPhoneNumber(rawValue)
    
    // Вычисляем новую позицию курсора
    const oldLength = phone.length
    const newLength = formatted.length
    const newPosition = cursorPosition + (newLength - oldLength)
    
    setPhone(formatted)
    
    // Восстанавливаем позицию курсора после обновления состояния
    setTimeout(() => {
      // Корректируем позицию, чтобы не попасть на служебные символы
      let adjustedPosition = newPosition
      const serviceChars = [' ', '(', ')', '-']
      if (adjustedPosition < formatted.length && serviceChars.includes(formatted[adjustedPosition])) {
        adjustedPosition++
      }
      input.setSelectionRange(adjustedPosition, adjustedPosition)
    }, 0)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Сбрасываем все данные при закрытии
      setDeleteConfirm(false)
      // Восстанавливаем исходные значения из staffMember
      setName(staffMember.name)
      setEmail(staffMember.email)
      setPhone(staffMember.phone ? formatPhoneNumber(staffMember.phone) : '+7')
      setSelectedRole(staffMember.position as UserRoles)
      setSelectedRestaurants(staffMember.restaurant.map(r => r.id))
      setSelectedWorkshops(staffMember.workshops?.map(w => w.workshopId) || [])
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{t.editStaff}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Name field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-sm font-medium text-right">{t.name}:</label>
            <div className="col-span-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.name}
                className="w-full"
              />
            </div>
          </div>
          {/* Email field */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-sm font-medium text-right">{t.email}:</label>
            <div className="col-span-3">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.email}
                className="w-full"
              />
            </div>
          </div>

          {/* Phone field with Russian format */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-sm font-medium text-right">{t.phone}:</label>
            <div className="col-span-3">
              <Input
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+7 (999) 999-99-99"
                className="w-full"
                type="tel"
              />
            </div>
          </div>

          {/* Role selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-sm font-medium text-right">{t.role}:</label>
            <div className="col-span-3">
              <Select
                value={selectedRole}
                onValueChange={(value) => {
                  setSelectedRole(value as UserRoles)
                  if (value !== UserRoles.COOK && value !== UserRoles.CHEF) {
                    setSelectedWorkshops([])
                  }
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t.selectRole} />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((role) => (
                    <SelectItem 
                      key={role} 
                      value={role}
                      className="text-sm"
                    >
                      {t[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Workshop selection (only for kitchen roles) */}
          {isKitchenRole && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm font-medium text-right">{t.workshops}:</label>
              <div className="col-span-3">
                <SearchableSelect
                  options={workshops.map(w => ({ id: w.id, label: w.name }))}
                  value={selectedWorkshops}
                  onChange={setSelectedWorkshops}
                  placeholder={t.selectWorkshops}
                  searchPlaceholder={t.searchWorkshops}
                  emptyText={t.noWorkshops}
                  multiple={true}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || isLoading}
            className="px-4"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {deleteConfirm ? t.deleteConfirm : t.delete}
              </>
            )}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading || isDeleting}
              className="px-4"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                isLoading || 
                isDeleting || 
                selectedRestaurants.length === 0 ||
                (isKitchenRole && selectedWorkshops.length === 0)
              }
              className="px-4"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t.save
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}