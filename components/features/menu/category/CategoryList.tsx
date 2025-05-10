import { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { CategoryService, CategoryDto } from '@/lib/api/category.service';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CategoryTable } from './CategoryTable';
import { CategoryModal } from './CategoryModal';

export const CategoryList = () => {
  const { language } = useLanguageStore();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null | undefined>(null);
  const [formData, setFormData] = useState<CategoryDto>({
    title: '',
    description: '',
  });

  const translations = {
    addCategory: {
      ru: 'Добавить категорию',
      ka: 'კატეგორიის დამატება',
    },
    title: {
      ru: 'Категории',
      ka: 'კატეგორიები',
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await CategoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
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
    setFormData({ title: '', description: '' });
    setCurrentCategoryId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: CategoryDto) => {
    setCurrentCategoryId(category.id);
    setFormData({
      title: category.title,
      description: category.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitSuccess = () => {
    fetchCategories();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await CategoryService.delete(id);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
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
          {translations.addCategory[language]}
        </Button>
      </div>

      <CategoryTable
        categories={categories}
        isLoading={isLoading}
        language={language}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={handleSubmitSuccess}
        categoryId={currentCategoryId}
        formData={formData}
        onInputChange={handleInputChange}
        language={language}
      />
    </div>
  );
};