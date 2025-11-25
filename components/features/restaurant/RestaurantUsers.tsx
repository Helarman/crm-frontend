'use client'

import { useLanguageStore } from "@/lib/stores/language-store"
import { PageHeader } from "@/components/features/pageHeader"
import { Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { UserService } from "@/lib/api/user.service"
import { RestaurantService } from "@/lib/api/restaurant.service"
import { WorkshopService } from "@/lib/api/workshop.service"
import { StaffTable } from "@/components/features/staff/StaffTable"
import { StaffFilter } from "@/components/features/staff/StaffFilter"
import { UserRoles, StaffMember } from "@/components/features/staff/StaffTable"
import { CreateStaffDialog } from "@/components/features/staff/CreateStaffDialog"
import { AccessCheck } from "@/components/AccessCheck"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Restaurant {
  id: string;
  title: string;
}

interface Workshop {
  id: string;
  name: string;
}

export default function RestaurantUsers() {
  const ALL_RESTAURANTS_VALUE = "all-restaurants"
  const ALL_POSITIONS_VALUE = "all-positions"

  const { language } = useLanguageStore()
  const params = useParams()
  const restaurantId = params.id as string

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null)
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPosition, setSelectedPosition] = useState<UserRoles | typeof ALL_POSITIONS_VALUE>(ALL_POSITIONS_VALUE)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        const [restaurantData, workshopsData, usersData] = await Promise.all([
          RestaurantService.getById(restaurantId),
          WorkshopService.getAll(),
          UserService.getAll()
        ])

        // Устанавливаем текущий ресторан
        setCurrentRestaurant(restaurantData)
        setWorkshops(workshopsData)

        // Фильтруем пользователей только для текущего ресторана
        const restaurantUsers = usersData.filter((user: any) => 
          user.restaurant?.some((r: any) => r.id === restaurantId)
        )

        // Форматируем данные сотрудников
        const formattedStaff = restaurantUsers.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          restaurant: user.restaurant,
          workshops: user.workshops || [],
          position: user.role as UserRoles,
        }))
        setStaff(formattedStaff)

      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    if (restaurantId) {
      loadData()
    }
  }, [restaurantId])

  const translations = {
    ru: {
      title: 'Персонал ресторана',
      subtitle: (restaurantName: string) => `Управление персоналом для ${restaurantName}`,
      addStaff: 'Добавить сотрудника',
      errorLoading: 'Ошибка загрузки данных',
      loading: 'Загрузка...',
      allPositions: 'Все должности'
    },
    ka: {
      title: 'რესტორანის პერსონალი',
      subtitle: (restaurantName: string) => `${restaurantName}-ის პერსონალის მართვა`,
      addStaff: 'დაამატეთ თანამშრომელი',
      errorLoading: 'მონაცემების ჩატვირთვის შეცდომა',
      loading: 'იტვირთება...',
      allPositions: 'ყველა პოზიცია'
    }
  }

  const t = translations[language]

  const handleRefresh = async () => {
    try {
      setLoading(true)
      const [freshUsers, freshWorkshops] = await Promise.all([
        UserService.getAll(),
        WorkshopService.getAll()
      ])
      
      const restaurantUsers = freshUsers.filter((user: any) => 
        user.restaurant?.some((r: any) => r.id === restaurantId)
      )

      const formattedStaff = restaurantUsers.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        restaurant: user.restaurant,
        workshops: user.workshops || [],
        position: user.role as UserRoles,
      }))
      
      setStaff(formattedStaff)
      setWorkshops(freshWorkshops)
    } catch (err) {
      console.error('Failed to refresh data:', err)
      setError('Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  if (loading) {
    return <div className="flex justify-center items-center h-64">{t.loading}</div>
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">{t.errorLoading}</div>
  }

  if (!currentRestaurant) {
    return <div className="flex justify-center items-center h-64">Ресторан не найден</div>
  }

  return (
    <AccessCheck allowedRoles={['SUPERVISOR', 'MANAGER']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <p className=" font-semibold tracking-tight">Персонал</p>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Новый персонал
            </Button>
        </div>
            
        <CreateStaffDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={handleRefresh}
          defaultRestaurantId={restaurantId}       
        />

        <StaffFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedRestaurant={restaurantId} 
          onRestaurantChange={() => {}}
          selectedPosition={selectedPosition}
          onPositionChange={setSelectedPosition}
          restaurants={currentRestaurant ? [currentRestaurant] : []}
          isRestaurantLocked={true} 
        />

        <StaffTable
          workshops={workshops}
          staff={staff}
          restaurants={currentRestaurant ? [currentRestaurant] : []}
          searchTerm={searchTerm}
          selectedRestaurant={restaurantId} 
          selectedPosition={selectedPosition}
          onRefresh={handleRefresh}
        />
      </div>
    </AccessCheck>
  )
}