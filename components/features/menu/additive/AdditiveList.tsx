import { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { AdditiveService, Additive } from '@/lib/api/additive.service';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AdditiveTable } from './AdditiveTable';
import { AdditiveModal } from './AdditiveModal';

export const AdditiveList = () => {
  const { language } = useLanguageStore();
  const [additives, setAdditives] = useState<Additive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAdditiveId, setCurrentAdditiveId] = useState<string | null | undefined>(null);
  const [formData, setFormData] = useState<Additive>({
    title: '',
    price: 0,
  });

  const translations = {
    addAdditive: {
      ru: 'Добавить модификатор',
      ka: 'მოდიფიკატორის დამატება',
    },
    title: {
      ru: 'Модификаторы',
      ka: 'მოდიფიკატორები',
    }
  };

  useEffect(() => {
    fetchAdditives();
  }, []);

  const fetchAdditives = async () => {
    setIsLoading(true);
    try {
      const data = await AdditiveService.getAll();
      setAdditives(data);
    } catch (error) {
      console.error('Error fetching additives:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? Number(value) : value,
    }));
  };

  const openAddModal = () => {
    setFormData({ title: '', price: 0 });
    setCurrentAdditiveId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (additive: Additive) => {
    setCurrentAdditiveId(additive.id);
    setFormData({
      title: additive.title,
      price: additive.price,
    });
    setIsModalOpen(true);
  };

  const handleSubmitSuccess = () => {
    fetchAdditives();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await AdditiveService.delete(id);
      fetchAdditives();
    } catch (error) {
      console.error('Error deleting additive:', error);
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
          {translations.addAdditive[language]}
        </Button>
      </div>

      <AdditiveTable
        additives={additives}
        isLoading={isLoading}
        language={language}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      <AdditiveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={handleSubmitSuccess}
        additiveId={currentAdditiveId}
        formData={formData}
        onInputChange={handleInputChange}
        language={language}
      />
    </div>
  );
};