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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useLanguageStore } from '@/lib/stores/language-store'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { RestaurantService } from '@/lib/api/restaurant.service'
import { UserService } from '@/lib/api/user.service'
import { EditStaffDialog } from './EditStaffDialog'
import { WorkshopService } from "@/lib/api/workshop.service"
import { useAuth } from "@/lib/hooks/useAuth"
import { Restaurant } from "@/lib/types/restaurant"
import { useRouter } from "next/navigation"

export interface StaffMember {
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
  isBlocked?: boolean 
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
    userUpdated: "Данные сотрудника успешно обновлены",
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
    userUpdated: "თანამშრომლის მონაცემები წარმატებით განახლდა",
    error: "შეცდომა განახლებისას"
  }
}

// Функция для форматирования телефона для отображения
const formatPhoneForDisplay = (phone?: string) => {
  if (!phone) return '-'
  
  // Если телефон уже отформатирован, возвращаем как есть
  if (phone.includes('+') || phone.includes('(') || phone.includes('-')) {
    return phone
  }
  
  // Форматируем чистый номер
  const numbers = phone.replace(/\D/g, '')
  if (numbers.length === 11 && (numbers.startsWith('7') || numbers.startsWith('8'))) {
    const cleaned = numbers.startsWith('8') ? '7' + numbers.slice(1) : numbers
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`
  }
  
  return phone
}

interface StaffTableProps {
  staff: StaffMember[]
  restaurants: Restaurant[]
  searchTerm: string
  workshops: any
  selectedRestaurant: string
  selectedPosition: string
  onRefresh: () => Promise<void>
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
      phone: 'Телефон',
      restaurant: 'Ресторан',
      position: 'Должность',
      status: 'Статус',
      active: 'Активен',
      inactive: 'Неактивен',
      edit: 'Редактировать',
      noResults: 'Сотрудники не найдены',
      block: 'Заблокировать',
      unblock: 'Разблокировать',
      blocked: 'Заблокирован',
      confirmBlockTitle: 'Подтверждение блокировки',
      confirmBlockDescription: 'Вы уверены, что хотите заблокировать этого сотрудника? После блокировки он не сможет войти в систему.',
      confirmUnblockTitle: 'Подтверждение разблокировки',
      confirmUnblockDescription: 'Вы уверены, что хотите разблокировать этого сотрудника? Он снова сможет войти в систему.',
      blockSuccess: 'Сотрудник успешно заблокирован',
      unblockSuccess: 'Сотрудник успешно разблокирован',
      blockError: 'Ошибка при блокировке сотрудника',
      unblockError: 'Ошибка при разблокировке сотрудника',
      confirm: 'Подтвердить',
      cancel: 'Отмена'
    },
    ka: {
      name: 'სახელი',
      email: 'ელ.ფოსტა',
      phone: 'ტელეფონი',
      restaurant: 'რესტორანი',
      position: 'პოზიცია',
      status: 'სტატუსი',
      active: 'აქტიური',
      inactive: 'არააქტიური',
      edit: 'რედაქტირება',
      noResults: 'თანამშრომლები ვერ მოიძებნა',
      block: 'დაბლოკვა',
      unblock: 'განბლოკვა',
      blocked: 'დაბლოკილია',
      confirmBlockTitle: 'დაბლოკვის დადასტურება',
      confirmBlockDescription: 'დარწმუნებული ხართ, რომ გსურთ ამ თანამშრომლის დაბლოკვა? დაბლოკვის შემდეგ ის ვერ შეძლებს სისტემაში შესვლას.',
      confirmUnblockTitle: 'განბლოკვის დადასტურება',
      confirmUnblockDescription: 'დარწმუნებული ხართ, რომ გსურთ ამ თანამშრომლის განბლოკვა? ის კვლავ შეძლებს სისტემაში შესვლას.',
      blockSuccess: 'თანამშრომელი წარმატებით დაბლოკა',
      unblockSuccess: 'თანამშრომელი წარმატებით განბლოკა',
      blockError: 'შეცდომა თანამშრომლის დაბლოკვისას',
      unblockError: 'შეცდომა თანამშრომლის განბლოკვისას',
      confirm: 'დადასტურება',
      cancel: 'გაუქმება'
    }
  }

  const t = translations[language]
  const tDialog = roleTranslations[language]

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBlocking, setIsBlocking] = useState<string | null>(null)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [staffToToggle, setStaffToToggle] = useState<StaffMember | null>(null)
  
  const { user } = useAuth()
  const router = useRouter()

  const handleEditClick = (member: StaffMember) => {
    setSelectedStaff(member)
    setEditDialogOpen(true)
  }

  const handleBlockClick = (member: StaffMember) => {
    setStaffToToggle(member)
    setBlockDialogOpen(true)
  }

  const handleConfirmToggleBlock = async () => {
    if (!staffToToggle) return

    const newBlockStatus = !staffToToggle.isBlocked
    setIsBlocking(staffToToggle.id)
    setBlockDialogOpen(false)
    
    try {
      await UserService.toggleBlock(staffToToggle.id, newBlockStatus)
      
      toast.success(
        language === 'ru'
          ? newBlockStatus ? t.blockSuccess : t.unblockSuccess
          : newBlockStatus ? t.blockSuccess : t.unblockSuccess
      )
      
      await onRefresh()
    } catch (error) {
      console.error(`Failed to toggle block for user:`, error)
      toast.error(
        language === 'ru'
          ? newBlockStatus ? t.blockError : t.unblockError
          : newBlockStatus ? t.blockError : t.unblockError
      )
      router.refresh()
    } finally {
      setIsBlocking(null)
      setStaffToToggle(null)
      router.refresh()
    }
  }

  const handleSaveChanges = async (
    selectedRole: UserRoles, 
    selectedRestaurants: string[],
    selectedWorkshops?: string[],
    name?: string,
    email?: string,
    phone?: string
  ) => {
    if (!selectedStaff) return
    
    setIsLoading(true)
    
    try {
      let hasChanges = false

      // 1. Обновляем основные данные пользователя (имя, email, телефон)
      if (name !== selectedStaff.name || email !== selectedStaff.email || phone !== selectedStaff.phone) {
        await UserService.update(selectedStaff.id, {
          name,
          email,
          phone
        })
        hasChanges = true
      }

      // 2. Обновляем роль пользователя
      if (selectedRole !== selectedStaff.position) {
        await UserService.changeUserRole(selectedStaff.id, selectedRole)
        hasChanges = true
      }

      // 3. Обновляем рестораны пользователя
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
        hasChanges = true
      }

      // 4. Обновляем цехи пользователя (только для кухонных ролей)
      if (selectedWorkshops) {
        const currentWorkshopIds = selectedStaff.workshops?.map(w => w.workshopId) || []
        const workshopsToAdd = selectedWorkshops.filter(id => !currentWorkshopIds.includes(id))
        const workshopsToRemove = currentWorkshopIds.filter(id => !selectedWorkshops.includes(id))

        for (const workshopId of workshopsToAdd) {
          await WorkshopService.addUsers(workshopId, [selectedStaff.id])
        }

        for (const workshopId of workshopsToRemove) {
          await WorkshopService.removeUsers(workshopId, [selectedStaff.id])
        }

        if (workshopsToAdd.length > 0 || workshopsToRemove.length > 0) {
          hasChanges = true
        }
      }

      if (hasChanges) {
        router.refresh()
      }
      
      setEditDialogOpen(false)
      
    } catch (error) {
      toast.error(tDialog.error)
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredStaff = staff
    .filter(member => {
      const matchesSearch = 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.phone && member.phone.includes(searchTerm))
      
      const matchesRestaurant = 
        selectedRestaurant === ALL_RESTAURANTS_VALUE || 
        member.restaurant.some(r => r.id === selectedRestaurant)
      
      const matchesPosition = 
        selectedPosition === ALL_POSITIONS_VALUE || 
        member.position === selectedPosition
      
      return matchesSearch && matchesRestaurant && matchesPosition
    })
    .sort((a, b) => {
      // Сначала идут незаблокированные (false), потом заблокированные (true)
      if (a.isBlocked === b.isBlocked) return 0
      return a.isBlocked ? 1 : -1
    })

  const handleDelete = async (userId: string) => {
    setIsDeleting(true)
    try {
      await UserService.delete(userId)
      toast.success(
        language === 'ru' 
          ? 'Сотрудник успешно удален' 
          : 'თანამშრომელი წარმატებით წაიშალა'
      )
      await onRefresh()
    } catch (error) {
      console.log(error)
      toast.error(
        language === 'ru' 
          ? 'Ошибка при удалении сотрудника' 
          : 'შეცდომა თანამშრომლის წაშლისას'
      )
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
              <TableHead>{t.phone}</TableHead>
              {user?.role === 'SUPERVISOR' && <TableHead>{t.restaurant}</TableHead>}
              <TableHead>{t.position}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.length > 0 ? (
              filteredStaff.map((member) => (
                <TableRow 
                  key={`staff-${member.id}`}
                  className={member.isBlocked ? 'bg-red-50' : ''}
                >
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{formatPhoneForDisplay(member.phone)}</TableCell>
                  
                  {user?.role === 'SUPERVISOR' && (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.restaurant.map(restaurant => (
                          <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}>
                            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                              {restaurant.title}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </TableCell>
                  )}

                  <TableCell>
                    <Badge className={tRoles.roleColors[member.position as UserRoles]}>
                      {tRoles[member.position as UserRoles]}
                    </Badge>
                  </TableCell>

                  {/* Статус блокировки */}
                  <TableCell>
                    {member.isBlocked ? (
                      <Badge variant="destructive">{t.blocked}</Badge>
                    ) : (
                      <Badge variant="success" className="bg-green-100 text-green-800">
                        {t.active}
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Кнопка блокировки/разблокировки */}
                      {user?.role === 'SUPERVISOR' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBlockClick(member)}
                          disabled={isBlocking === member.id}
                          className={member.isBlocked ? 'text-green-600' : 'text-red-600'}
                        >
                          {isBlocking === member.id ? (
                            ''
                          ) : member.isBlocked ? (
                            t.unblock
                          ) : (
                            t.block
                          )}
                        </Button>
                      )}

                      {/* Существующая кнопка редактирования */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(member)}
                      >
                        {t.edit}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={user?.role === 'SUPERVISOR' ? 7 : 6} className="h-24 text-center">
                  {t.noResults}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* AlertDialog для подтверждения блокировки/разблокировки */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {staffToToggle?.isBlocked ? t.confirmUnblockTitle : t.confirmBlockTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {staffToToggle?.isBlocked ? t.confirmUnblockDescription : t.confirmBlockDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmToggleBlock}>
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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