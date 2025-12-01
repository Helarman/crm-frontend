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
  onSave: (role: UserRoles, restaurants: string[], workshops?: string[]) => Promise<void>
  onDelete: (userId: string) => Promise<void>
  isLoading: boolean
  isDeleting: boolean
}

const translations = {
  ru: {
    editStaff: "Редактировать сотрудника",
    name: "Имя",
    email: "Email",
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
      await onSave(
        selectedRole,
        selectedRestaurants,
        isKitchenRole ? selectedWorkshops : undefined
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Сбрасываем все данные при закрытии
      setDeleteConfirm(false)
      // Восстанавливаем исходные значения из staffMember
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
          {/* Name and Email fields would go here */}

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

          {/* Restaurant selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-sm font-medium text-right">{t.restaurants}:</label>
            <div className="col-span-3">
              <SearchableSelect
                options={restaurants.map(r => ({ id: r.id, label: r.title }))}
                value={selectedRestaurants}
                onChange={setSelectedRestaurants}
                placeholder={t.selectRestaurants}
                searchPlaceholder={t.searchRestaurants}
                emptyText={t.noRestaurants}
                multiple={true}
              />
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