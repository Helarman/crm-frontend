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

interface Restaurant {
  id: string;
  title: string;
}

interface Workshop {
  id: string;
  name: string;
}

export default function UsersPage() {
  const ALL_RESTAURANTS_VALUE = "all-restaurants"
  const ALL_POSITIONS_VALUE = "all-positions"

  const { language } = useLanguageStore()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([]) // Добавляем состояние для цехов
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Состояния фильтров
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState(ALL_RESTAURANTS_VALUE)
  const [selectedPosition, setSelectedPosition] = useState<UserRoles | typeof ALL_POSITIONS_VALUE>(ALL_POSITIONS_VALUE)

  // Загрузка данных персонала, ресторанов и цехов
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        const [usersData, restaurantsData, workshopsData] = await Promise.all([
          UserService.getAll(),
          RestaurantService.getAll(),
          WorkshopService.getAll() // Загружаем цехи
        ])

        // Форматируем данные сотрудников
        const formattedStaff = usersData.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          restaurant: user.restaurant,
          workshops: user.workshops || [], // Добавляем цехи сотрудника
          position: user.role as UserRoles,
        }))
        setStaff(formattedStaff)

        setRestaurants(restaurantsData)
        setWorkshops(workshopsData) // Сохраняем цехи в состояние

      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const translations = {
    ru: {
      title: 'Управление персоналом',
      addStaff: 'Добавить сотрудника',
      errorLoading: 'Ошибка загрузки данных',
      loading: 'Загрузка...'
    },
    ka: {
      title: 'პერსონალის მართვა',
      addStaff: 'დაამატეთ თანამშრომელი',
      errorLoading: 'მონაცემების ჩატვირთვის შეცდომა',
      loading: 'იტვირთება...'
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
      
      const formattedStaff = freshUsers.map((user: any) => ({
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

  return (
    <AccessCheck allowedRoles={[ 'SUPERVISOR']}>
      <div className="space-y-6">\
        <PageHeader
          title={t.title}
          buttonText={t.addStaff}
          onButtonClick={() => { setIsCreateDialogOpen(true) }}
          icon={<Plus className="h-4 w-4 mr-2" />}
        />

        <StaffFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedRestaurant={selectedRestaurant}
          onRestaurantChange={setSelectedRestaurant}
          selectedPosition={selectedPosition}
          onPositionChange={setSelectedPosition}
          restaurants={restaurants}
        />

        <StaffTable
          workshops={workshops}
          staff={staff}
          restaurants={restaurants as any}
          searchTerm={searchTerm}
          selectedRestaurant={selectedRestaurant}
          selectedPosition={selectedPosition}
          onRefresh={handleRefresh}
        />
      </div>
    </AccessCheck>
  )
}