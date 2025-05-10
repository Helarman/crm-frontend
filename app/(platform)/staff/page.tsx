'use client'

import { useLanguageStore } from "@/lib/stores/language-store"
import { PageHeader } from "@/components/features/pageHeader"
import { Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { UserService } from "@/lib/api/user.service"
import { RestaurantService } from "@/lib/api/restaurant.service"
import { StaffTable } from "@/components/features/staff/StaffTable"
import { StaffFilter } from "@/components/features/staff/StaffFilter"
import { UserRoles, StaffMember } from "@/components/features/staff/StaffTable"
import { CreateStaffDialog } from "@/components/features/staff/CreateStaffDialog";
import { AccessCheck } from "@/components/AccessCheck"

interface Restaurant {
  id: string;
  title: string;
}

export default function StaffManagementPage() {
  const ALL_RESTAURANTS_VALUE = "all-restaurants"
  const ALL_POSITIONS_VALUE = "all-positions"

  const { language } = useLanguageStore()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Состояния фильтров
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState(ALL_RESTAURANTS_VALUE)
  const [selectedPosition, setSelectedPosition] = useState<UserRoles | typeof ALL_POSITIONS_VALUE>(ALL_POSITIONS_VALUE)

  // Загрузка данных персонала и ресторанов
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Загружаем сотрудников
        const usersData = await UserService.getAll()
        const formattedStaff = usersData.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          restaurant: user.restaurant,
          position: user.role as UserRoles,
        }))
        setStaff(formattedStaff)

        const restaurantsData = await RestaurantService.getAll()
        setRestaurants(restaurantsData)

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
    const freshData = await UserService.getAll()
    const formattedStaff = freshData.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      restaurant: user.restaurant,
      position: user.role as UserRoles,
    }))
    setStaff(formattedStaff)
  }

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  if (loading) {
    return <div className="flex justify-center items-center h-64">{t.loading}</div>
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">{t.errorLoading}</div>
  }

  return (
    <AccessCheck allowedRoles={['MANAGER', 'SUPERVISOR']}>
      <div className="space-y-6">
        <PageHeader
          title={t.title}
          buttonText={t.addStaff}
          onButtonClick={() => { setIsCreateDialogOpen(true) }}
          icon={<Plus className="h-4 w-4 mr-2" />}
        />
        <CreateStaffDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={handleRefresh} />

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
          staff={staff}
          restaurants={restaurants}
          searchTerm={searchTerm}
          selectedRestaurant={selectedRestaurant}
          selectedPosition={selectedPosition}
          onRefresh={handleRefresh}
        />
      </div>
    </AccessCheck>
  )
}