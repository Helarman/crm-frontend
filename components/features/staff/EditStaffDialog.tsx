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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, X, Loader2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Restaurant } from "./StaffTable"
import { useLanguageStore } from '@/lib/stores/language-store'
import { WorkshopDto, WorkshopService } from '@/lib/api/workshop.service'
import { toast } from 'sonner'

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
  workshops: WorkshopDto[]
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
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    deleteConfirm: "Подвердить",
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
  const [restaurantsOpen, setRestaurantsOpen] = useState(false)
  const [workshopsOpen, setWorkshopsOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const allRoles = Object.values(UserRoles)
  const isKitchenRole = selectedRole === UserRoles.COOK || selectedRole === UserRoles.CHEF

  const toggleRestaurant = (restaurantId: string) => {
    setSelectedRestaurants(prev =>
      prev.includes(restaurantId)
        ? prev.filter(id => id !== restaurantId)
        : [...prev, restaurantId]
    )
    setRestaurantsOpen(false)
  }

  const toggleWorkshop = (workshopId: string) => {
    setSelectedWorkshops(prev =>
      prev.includes(workshopId)
        ? prev.filter(id => id !== workshopId)
        : [...prev, workshopId]
    )
    setWorkshopsOpen(false)
  }

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
    // 1. Сохраняем основную информацию о сотруднике
    await onSave(
      selectedRole,
      selectedRestaurants,
      isKitchenRole ? selectedWorkshops : undefined
    );

    // 2. Обновляем привязку к цехам
    if (isKitchenRole) {
      // Получаем текущие цехи сотрудника
      const currentWorkshops = staffMember.workshops?.map(w => w.workshopId) || [];
      
      // Определяем цехи для добавления и удаления
      const workshopsToAdd = selectedWorkshops.filter(
        id => !currentWorkshops.includes(id)
      );
      const workshopsToRemove = currentWorkshops.filter(
        id => !selectedWorkshops.includes(id)
      );

      // Добавляем пользователя в новые цехи
      if (workshopsToAdd.length > 0) {
        await Promise.all(
          workshopsToAdd.map(workshopId => 
            WorkshopService.addUsers(workshopId, [staffMember.id])
          )
        );
      }

      // Удаляем пользователя из старых цехов
      if (workshopsToRemove.length > 0) {
        await Promise.all(
          workshopsToRemove.map(workshopId => 
            WorkshopService.removeUsers(workshopId, [staffMember.id])
          )
        );
      }
    }

    toast.success(
      language === 'ru'
        ? 'Данные сотрудника успешно обновлены'
        : 'თანამშრომლის მონაცემები წარმატებით განახლდა'
    );
  } catch (error) {
    console.error('Failed to update staff member:', error);
    toast.error(
      language === 'ru'
        ? 'Ошибка при обновлении данных сотрудника'
        : 'შეცდომა თანამშრომლის მონაცემების განახლებისას'
    );
  }
};

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        setDeleteConfirm(false)
        setWorkshopsOpen(false)
        setRestaurantsOpen(false)
      }
      onOpenChange(open)
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{t.editStaff}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* ... (оставляем поля name и email без изменений) ... */}

          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-sm font-medium text-right">{t.role}:</label>
            <div className="col-span-3">
              <Select
                value={selectedRole}
                onValueChange={(value) => {
                  setSelectedRole(value as UserRoles)
                  // Сбрасываем цехи при смене роли, если это не кухонная роль
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

          {/* Поле выбора ресторанов */}
          <div className="grid grid-cols-4 items-center gap-4">
            <label className="text-sm font-medium text-right">{t.restaurants}:</label>
            <div className="col-span-3 space-y-2">
              <Popover open={restaurantsOpen} onOpenChange={setRestaurantsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={restaurantsOpen}
                    className="w-full justify-between"
                  >
                    {t.selectRestaurants}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder={t.searchRestaurants} />
                    <CommandEmpty>{t.noRestaurants}</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                      {restaurants.map((restaurant) => (
                        <CommandItem
                          key={restaurant.id}
                          value={restaurant.id}
                          onSelect={() => toggleRestaurant(restaurant.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedRestaurants.includes(restaurant.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {restaurant.title}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedRestaurants.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRestaurants.map(restaurantId => {
                    const restaurant = restaurants.find(r => r.id === restaurantId)
                    return (
                      <Badge
                        key={restaurantId}
                        variant="outline"
                        className="px-3 py-1 text-sm"
                      >
                        {restaurant?.title}
                        <button
                          onClick={() => toggleRestaurant(restaurantId)}
                          className="ml-2 rounded-full p-0.5 hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Поле выбора цехов (только для кухонных ролей) */}
          {isKitchenRole && (
            <div className="grid grid-cols-4 items-center gap-4">
              {}
              <label className="text-sm font-medium text-right">
                {language === 'ru' ? 'Цехи' : 'სახელოსნოები'}:
              </label>
              <div className="col-span-3 space-y-2">
                <Popover open={workshopsOpen} onOpenChange={setWorkshopsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={workshopsOpen}
                      className="w-full justify-between"
                    >
                      {language === 'ru' ? 'Выберите цехи' : 'აირჩიეთ სახელოსნოები'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder={language === 'ru' ? 'Поиск цехов...' : 'სახელოსნოების ძებნა...'} />
                      <CommandEmpty>
                        {language === 'ru' ? 'Цехи не найдены' : 'სახელოსნოები ვერ მოიძებნა'}
                      </CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {workshops.map((workshop) => (
                          <CommandItem
                            key={workshop.id}
                            value={workshop.id}
                            onSelect={() => toggleWorkshop(workshop.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedWorkshops.includes(workshop.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {workshop.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                  
                {selectedWorkshops.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedWorkshops.map(workshopId => {
                      const workshop = workshops.find(w => w.id === workshopId)
                      return (
                        <Badge
                          key={workshopId}
                          variant="outline"
                          className="px-3 py-1 text-sm"
                        >
                          {workshop?.name}
                          <button
                            onClick={() => toggleWorkshop(workshopId)}
                            className="ml-2 rounded-full p-0.5 hover:bg-muted"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                )}
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
              onClick={() => {
                setDeleteConfirm(false)
                onOpenChange(false)
              }}
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