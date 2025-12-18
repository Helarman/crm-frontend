import { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { WorkshopService, WorkshopResponseDto, CreateWorkshopDto, UpdateWorkshopDto } from '@/lib/api/workshop.service';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { WorkshopTable } from './WorkshopTable';
import { WorkshopModal } from './WorkshopModal';
import { WorkshopFilters } from './WorkshopFilters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/hooks/useAuth';
import { Restaurant } from '@/lib/types/restaurant';

export const WorkshopList = () => {
  const { language } = useLanguageStore();
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<WorkshopResponseDto[]>([]);
  const [filteredWorkshops, setFilteredWorkshops] = useState<WorkshopResponseDto[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(
    user.role === 'SUPERVISOR' ? 'all' : user.restaurant[0].id
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWorkshopId, setCurrentWorkshopId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<CreateWorkshopDto>>({
    name: '',
    restaurantIds: [],
    userIds: []
  });

  const translations = {
    addWorkshop: {
      ru: 'Добавить цех',
      ka: 'სახელოსნოს დამატება',
    },
    title: {
      ru: 'Цехи',
      ka: 'სახელოსნოები',
    },
    filterByRestaurant: {
      ru: 'Фильтр по ресторану',
      ka: 'ფილტრი რესტორანის მიხედვით'
    },
    allRestaurants: {
      ru: 'Все рестораны',
      ka: 'ყველა რესტორანი'
    }
  };

  // Получаем рестораны пользователя
  const userRestaurants = user?.restaurant || [];

  const handleRefreshData = () => {
    fetchWorkshops();
  };

  useEffect(() => {
    fetchWorkshops();
  }, [selectedRestaurant]);

  useEffect(() => {
    filterWorkshops();
  }, [searchTerm, workshops]);

const fetchWorkshops = async () => {
  setIsLoading(true);
  try {
    let data;
    if (selectedRestaurant === 'all') {
      data = await WorkshopService.findAll();
    } else {
      data = await WorkshopService.findByRestaurantId(selectedRestaurant);
    }
    setWorkshops(data);
  } catch (error) {
    console.error('Error fetching workshops:', error);
  } finally {
    setIsLoading(false);
  }
};

const handleDelete = async (id: string) => {
  try {
    await WorkshopService.delete(id);
    fetchWorkshops();
  } catch (error) {
    console.error('Error deleting workshop:', error);
  }
};

  const filterWorkshops = () => {
    if (!searchTerm) {
      setFilteredWorkshops(workshops);
      return;
    }

    const search = searchTerm.toLowerCase();
    const filtered = workshops.filter(workshop =>
      workshop.name.toLowerCase().includes(search)
    );

    setFilteredWorkshops(filtered);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    // Если выбран конкретный ресторан, добавляем его в restaurantIds по умолчанию
    const defaultRestaurantIds = selectedRestaurant !== 'all' ? [selectedRestaurant] : [];
    
    setFormData({
      name: '',
      restaurantIds: defaultRestaurantIds,
      userIds: []
    });
    setCurrentWorkshopId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (workshop: WorkshopResponseDto) => {
    setCurrentWorkshopId(workshop.id);
    setFormData({
      name: workshop.name,
      restaurantIds: workshop.restaurantIds,
      userIds: workshop.userIds
    });
    setIsModalOpen(true);
  };

  const handleSubmitSuccess = () => {
    fetchWorkshops();
    setIsModalOpen(false);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {translations.title[language]}
        </h2>
        <div className="flex gap-2">
          {/* Фильтр по ресторану - показываем только если у пользователя есть рестораны */}
          {userRestaurants.length > 0 && (
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={translations.filterByRestaurant[language]} />
              </SelectTrigger>
              <SelectContent>
                {user.role === 'SUPERVISOR' && (
                  <SelectItem value="all">
                    {translations.allRestaurants[language]}
                  </SelectItem>
                )}
                {userRestaurants.map((restaurant: Restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" />
            {translations.addWorkshop[language]}
          </Button>
        </div>
      </div>

      <WorkshopFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        language={language}
      />

      <WorkshopTable
        workshops={filteredWorkshops}
        isLoading={isLoading}
        language={language}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onRefreshData={handleRefreshData}
      />

      <WorkshopModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={handleSubmitSuccess}
        workshopId={currentWorkshopId}
        formData={formData}
        onInputChange={handleInputChange}
        onSelectChange={handleSelectChange}
        language={language}
        restaurants={userRestaurants}
      />
    </div>
  );
};