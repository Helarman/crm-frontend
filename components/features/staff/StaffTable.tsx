import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLanguageStore } from '@/lib/stores/language-store'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { RestaurantService } from '@/lib/api/restaurant.service'
import { UserService } from '@/lib/api/user.service'
import { EditStaffDialog } from './EditStaffDialog'
import { WorkshopService } from "@/lib/api/workshop.service"

export interface Restaurant {
  id: string
  title: string
  shiftCloseTime: any;
}

export interface StaffMember {
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

export enum UserRoles {
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

const ALL_RESTAURANTS_VALUE = "all-restaurants"
const ALL_POSITIONS_VALUE = "all-positions"

const roleTranslations = {
  ru: {
    [UserRoles.NONE]: "Без роли",
    [UserRoles.STOREMAN]: "Кладовщик",
    [UserRoles.COURIER]: "Курьер",
    [UserRoles.COOK]: "Повар",
    [UserRoles.CHEF]: "Шеф-повар",
    [UserRoles.WAITER]: "Официант",
    [UserRoles.CASHIER]: "Кассир",
    [UserRoles.MANAGER]: "Менеджер",
    [UserRoles.SUPERVISOR]: "Супервайзер",
    roleColors: {
      [UserRoles.NONE]: "bg-gray-100 text-gray-800",
      [UserRoles.STOREMAN]: "bg-blue-100 text-blue-800",
      [UserRoles.COURIER]: "bg-green-100 text-green-800",
      [UserRoles.COOK]: "bg-yellow-100 text-yellow-800",
      [UserRoles.CHEF]: "bg-orange-100 text-orange-800",
      [UserRoles.WAITER]: "bg-purple-100 text-purple-800",
      [UserRoles.CASHIER]: "bg-pink-100 text-pink-800",
      [UserRoles.MANAGER]: "bg-red-100 text-red-800",
      [UserRoles.SUPERVISOR]: "bg-indigo-100 text-indigo-800"
    },
    editStaff: "Редактировать сотрудника",
    save: "Сохранить",
    cancel: "Отмена",
    roleUpdated: "Роль успешно обновлена",
    restaurantUpdated: "Рестораны успешно обновлены",
    error: "Ошибка при обновлении"
  },
  ka: {
    [UserRoles.NONE]: "როლის გარეშე",
    [UserRoles.STOREMAN]: "საწყობის მენეჯერი",
    [UserRoles.COURIER]: "კურიერი",
    [UserRoles.COOK]: "მზარეული",
    [UserRoles.CHEF]: "შეფ-მზარეული",
    [UserRoles.WAITER]: "ოფიციანტი",
    [UserRoles.CASHIER]: "კასირი",
    [UserRoles.MANAGER]: "მენეჯერი",
    [UserRoles.SUPERVISOR]: "სუპერვაიზერი",
    roleColors: {
      [UserRoles.NONE]: "bg-gray-100 text-gray-800",
      [UserRoles.STOREMAN]: "bg-blue-100 text-blue-800",
      [UserRoles.COURIER]: "bg-green-100 text-green-800",
      [UserRoles.COOK]: "bg-yellow-100 text-yellow-800",
      [UserRoles.CHEF]: "bg-orange-100 text-orange-800",
      [UserRoles.WAITER]: "bg-purple-100 text-purple-800",
      [UserRoles.CASHIER]: "bg-pink-100 text-pink-800",
      [UserRoles.MANAGER]: "bg-red-100 text-red-800",
      [UserRoles.SUPERVISOR]: "bg-indigo-100 text-indigo-800"
    },
    editStaff: "თანამშრომლის რედაქტირება",
    save: "შენახვა",
    cancel: "გაუქმება",
    roleUpdated: "როლი წარმატებით განახლდა",
    restaurantUpdated: "რესტორანები წარმატებით განახლდა",
    error: "შეცდომა განახლებისას"
  }
}

interface StaffTableProps {
  staff: StaffMember[]
  restaurants: Restaurant[]
  searchTerm: string
  workshops: any
  selectedRestaurant: string
  selectedPosition: string
  onRefresh: () => Promise<void> // Изменили тип на асинхронную функцию
}

export function StaffTable({
  staff,
  restaurants,
  workshops,
  searchTerm,
  selectedRestaurant,
  selectedPosition,
  onRefresh
}: StaffTableProps) {
  const { language } = useLanguageStore()
  const tRoles = roleTranslations[language]
  
  const translations = {
    ru: {
      name: 'Имя',
      email: 'Email',
      restaurant: 'Ресторан',
      position: 'Должность',
      status: 'Статус',
      active: 'Активен',
      inactive: 'Неактивен',
      edit: 'Редактировать',
      noResults: 'Сотрудники не найдены'
    },
    ka: {
      name: 'სახელი',
      email: 'ელ.ფოსტა',
      restaurant: 'რესტორანი',
      position: 'პოზიცია',
      status: 'სტატუსი',
      active: 'აქტიური',
      inactive: 'არააქტიური',
      edit: 'რედაქტირება',
      noResults: 'თანამშრომლები ვერ მოიძებნა'
    }
  }

  const t = translations[language]
  const tDialog = roleTranslations[language]

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)


  const handleEditClick = (member: StaffMember) => {
    setSelectedStaff(member)
    setEditDialogOpen(true)
  }

const handleSaveChanges = async (
  selectedRole: UserRoles, 
  selectedRestaurants: string[],
  selectedWorkshops?: string[]
) => {
  if (!selectedStaff) return
  
  setIsLoading(true)
  
  try {
    // 1. Обновляем роль пользователя
    if (selectedRole !== selectedStaff.position) {
      await UserService.changeUserRole(selectedStaff.id, selectedRole)
      toast.success(tDialog.roleUpdated)
    }

    // 2. Обновляем рестораны пользователя
    const currentRestaurantIds = selectedStaff.restaurant.map(r => r.id)
    const restaurantsToAdd = selectedRestaurants.filter(id => !currentRestaurantIds.includes(id))
    const restaurantsToRemove = currentRestaurantIds.filter(id => !selectedRestaurants.includes(id))

    for (const restaurantId of restaurantsToAdd) {
      await RestaurantService.addUser(restaurantId, { userId: selectedStaff.id })
    }

    for (const restaurantId of restaurantsToRemove) {
      await RestaurantService.removeUser(restaurantId, selectedStaff.id)
    }

    if (restaurantsToAdd.length > 0 || restaurantsToRemove.length > 0) {
      toast.success(tDialog.restaurantUpdated)
    }

    // 3. Обновляем цехи пользователя (только для кухонных ролей)
    if (selectedWorkshops) {
      // Получаем текущие цехи пользователя
      const currentWorkshopIds = selectedStaff.workshops?.map(w => w.workshopId) || []
      
      // Определяем цехи для добавления и удаления
      const workshopsToAdd = selectedWorkshops.filter(id => !currentWorkshopIds.includes(id))
      const workshopsToRemove = currentWorkshopIds.filter(id => !selectedWorkshops.includes(id))

      // Добавляем пользователя в новые цехи
      for (const workshopId of workshopsToAdd) {
        await WorkshopService.addUsers(workshopId, [selectedStaff.id])
      }

      // Удаляем пользователя из старых цехов
      for (const workshopId of workshopsToRemove) {
        await WorkshopService.removeUsers(workshopId, [selectedStaff.id])
      }
    }

    await onRefresh()
    setEditDialogOpen(false)
  } catch (error) {
    toast.error(tDialog.error)
    console.error(error)
  } finally {
    setIsLoading(false)
  }
}

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    
      const matchesRestaurant = 
      selectedRestaurant === ALL_RESTAURANTS_VALUE || 
      member.restaurant.some(r => r.id === selectedRestaurant)
    
    const matchesPosition = 
      selectedPosition === ALL_POSITIONS_VALUE || 
      member.position === selectedPosition
    
    return matchesSearch && matchesRestaurant && matchesPosition
  })

  const handleDelete = async (userId: string) => {
    setIsDeleting(true)
    try {
      await UserService.delete(userId)
      await onRefresh()
    } catch (error) {
      console.log(error)
    }
    setIsDeleting(false)
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.name}</TableHead>
              <TableHead>{t.email}</TableHead>
              <TableHead>{t.restaurant}</TableHead>
              <TableHead>{t.position}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.length > 0 ? (
              filteredStaff.map((member) => (
                <TableRow key={`staff-${member.id}`}> 
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {member.restaurant.map(restaurant => (
                        <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}>
                          <Badge variant="outline">
                            {restaurant.title}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge className={tRoles.roleColors[member.position as UserRoles]}>
                      {tRoles[member.position as UserRoles]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(member)}
                    >
                      {t.edit}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t.noResults}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedStaff && (
        <EditStaffDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          staffMember={selectedStaff}
          restaurants={restaurants}
          onSave={handleSaveChanges}
          onDelete={handleDelete}
          workshops={workshops}
          isLoading={isLoading}
          isDeleting={isDeleting}
        />
      )}
    </>
  )
}