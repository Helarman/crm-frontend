import { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { WorkshopService, WorkshopResponse, WorkshopDto } from '@/lib/api/workshop.service';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { WorkshopTable } from './WorkshopTable';
import { WorkshopModal } from './WorkshopModal';

export const WorkshopList = () => {
  const { language } = useLanguageStore();
  const [workshops, setWorkshops] = useState<WorkshopDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWorkshopId, setCurrentWorkshopId] = useState<string | null | undefined>(null);
  const [formData, setFormData] = useState<WorkshopDto>({
    name: '',
  });

  const translations = {
    addWorkshop: {
      ru: 'Добавить цех',
      ka: 'სახელოსნოს დამატება',
    },
    title: {
      ru: 'Цехи',
      ka: 'სახელოსნოები',
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    setIsLoading(true);
    try {
      const data = await WorkshopService.getAll();
      setWorkshops(data);
    } catch (error) {
      console.error('Error fetching workshops:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    setFormData({ name: '' });
    setCurrentWorkshopId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (workshop: WorkshopDto) => {
    setCurrentWorkshopId(workshop.id);
    setFormData({
      name: workshop.name,
    });
    setIsModalOpen(true);
  };

  const handleSubmitSuccess = () => {
    fetchWorkshops();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await WorkshopService.delete(id);
      fetchWorkshops();
    } catch (error) {
      console.error('Error deleting workshop:', error);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {translations.title[language]}
        </h2>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          {translations.addWorkshop[language]}
        </Button>
      </div>

      <WorkshopTable
        workshops={workshops}
        isLoading={isLoading}
        language={language}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      <WorkshopModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={handleSubmitSuccess}
        workshopId={currentWorkshopId}
        formData={formData}
        onInputChange={handleInputChange}
        language={language}
      />
    </div>
  );
};