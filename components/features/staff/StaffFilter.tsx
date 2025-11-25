import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { UserRoles } from "./StaffTable"
import { useLanguageStore } from '@/lib/stores/language-store';

const ALL_RESTAURANTS_VALUE = "all-restaurants"
const ALL_POSITIONS_VALUE = "all-positions"

// Role translations with colors
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
    }
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
    }
  }
}

interface Restaurant {
  id: string;
  title: string;
}

interface StaffFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedRestaurant: string
  onRestaurantChange: (value: string) => void
  selectedPosition: string
  onPositionChange: (value: UserRoles | typeof ALL_POSITIONS_VALUE) => void
  restaurants: Restaurant[]
  isRestaurantLocked?: boolean
  
}

export function StaffFilter({
  searchTerm,
  onSearchChange,
  selectedRestaurant,
  onRestaurantChange,
  selectedPosition,
  onPositionChange,
  restaurants,
  isRestaurantLocked = false
}: StaffFiltersProps) {
  const { language } = useLanguageStore();

  const translations = {
    ru: {
      searchPlaceholder: 'Поиск по имени или email',
      filterByRestaurant: 'Фильтр по ресторану',
      filterByPosition: 'Фильтр по должности',
      allRestaurants: 'Все рестораны',
      allPositions: 'Все должности',
    },
    ka: {
      searchPlaceholder: 'ძებნა სახელით ან ელ.ფოსტით',
      filterByRestaurant: 'ფილტრი რესტორანის მიხედვით',
      filterByPosition: 'ფილტრი პოზიციის მიხედვით',
      allRestaurants: 'ყველა რესტორანი',
      allPositions: 'ყველა პოზიცია',
    }
  }

  const t = translations[language]
  const tRoles = roleTranslations[language]

  const allRoles = Object.values(UserRoles)

  const selectedRestaurantName = selectedRestaurant === ALL_RESTAURANTS_VALUE 
    ? t.allRestaurants 
    : restaurants.find(r => r.id === selectedRestaurant)?.title || selectedRestaurant

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.searchPlaceholder}
            className="pl-9"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {!isRestaurantLocked && 
        <Select value={selectedRestaurant} onValueChange={onRestaurantChange}  disabled={isRestaurantLocked}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t.filterByRestaurant} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_RESTAURANTS_VALUE}>
              {t.allRestaurants}
            </SelectItem>
            {restaurants.map((restaurant) => (
              <SelectItem 
                key={restaurant.id} 
                value={restaurant.id}
              >
                {restaurant.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
          }
        <Select 
          value={selectedPosition} 
          onValueChange={(value) => onPositionChange(value as UserRoles | typeof ALL_POSITIONS_VALUE)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t.filterByPosition} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_POSITIONS_VALUE}>
              {t.allPositions}
            </SelectItem>
            {allRoles.map((role) => (
              <SelectItem 
                key={`role-${role}`}
                value={role}
              >
                {tRoles[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

       <div className="flex flex-wrap gap-2 mt-2">
        {!isRestaurantLocked && selectedRestaurant !== ALL_RESTAURANTS_VALUE && (
          <Badge variant="outline" className="px-3 py-1">
            {t.filterByRestaurant}: {selectedRestaurantName}
            <button 
              onClick={() => onRestaurantChange(ALL_RESTAURANTS_VALUE)}
              className="ml-2 rounded-full p-0.5 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {selectedPosition !== ALL_POSITIONS_VALUE && (
          <Badge 
            className={`px-3 py-1 ${tRoles.roleColors[selectedPosition as UserRoles]}`}
          >
            {t.filterByPosition}: {tRoles[selectedPosition as UserRoles]}
            <button 
              onClick={() => onPositionChange(ALL_POSITIONS_VALUE)}
              className="ml-2 rounded-full p-0.5 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>
    </>
  )
}