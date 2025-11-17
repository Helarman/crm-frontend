import { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { CategoryService, CategoryDto } from '@/lib/api/category.service';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CategoryTable } from './CategoryTable';
import { CategoryModal } from './CategoryModal';
import { CategoryFilters } from './CategoryFilters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const CategoryList = () => {
  const { language } = useLanguageStore();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null | undefined>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');
  const [formData, setFormData] = useState<Partial<CategoryDto>>({
    title: '',
    description: '',
    slug: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    parentId: undefined,
    order: 0
  });

  const translations = {
    addCategory: {
      ru: 'Добавить категорию',
      ka: 'კატეგორიის დამატება',
    },
    title: {
      ru: 'Категории',
      ka: 'კატეგორიები',
    },
    viewOptions: {
      ru: {
        tree: 'Дерево',
        flat: 'Список'
      },
      ka: {
        tree: 'ხე',
        flat: 'სია'
      }
    }
  };

  const handleRefreshData = () => {
    fetchCategories();
  };

  useEffect(() => {
    fetchCategories();
  }, [viewMode]);

  useEffect(() => {
    filterCategories();
  }, [searchTerm, categories]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = viewMode === 'tree'
        ? await CategoryService.getTree()
        : await CategoryService.getAllFlat();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCategories = () => {
    if (!searchTerm) {
      setFilteredCategories(categories);
      return;
    }

    const search = searchTerm.toLowerCase();
    const filtered = categories.filter(cat =>
      cat.title.toLowerCase().includes(search) ||
      cat.slug?.toLowerCase().includes(search) ||
      cat.description?.toLowerCase().includes(search)
    );

    setFilteredCategories(filtered);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = (parentId?: string) => {
    setFormData({
      title: '',
      description: '',
      slug: '',
      parentId,
      order: 0
    });
    setCurrentCategoryId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: CategoryDto) => {
    setCurrentCategoryId(category.id);
    setFormData({
      title: category.title,
      description: category.description,
      slug: category.slug,
      metaTitle: category.metaTitle,
      metaDescription: category.metaDescription,
      metaKeywords: category.metaKeywords,
      parentId: category.parentId,
      order: category.order,
      image: category.image
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


  const handleMoveUp = async (id: string) => {
    try {
      await CategoryService.moveUp(id);
      fetchCategories();
    } catch (error) {
      console.error('Error moving category up:', error);
    }
  };

  const handleMoveDown = async (id: string) => {
    try {
      await CategoryService.moveDown(id);
      fetchCategories();
    } catch (error) {
      console.error('Error moving category down:', error);
    }
  };

  const handleMoveUpOnClient = async (id: string) => {
    try {
      await CategoryService.moveUpOnClient(id);
      fetchCategories();
    } catch (error) {
      console.error('Error moving category up on client:', error);
    }
  };

  const handleMoveDownOnClient = async (id: string) => {
    try {
      await CategoryService.moveDownOnClient(id);
      fetchCategories();
    } catch (error) {
      console.error('Error moving category down on client:', error);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {translations.title[language]}
        </h2>
        <div className="flex gap-2">
          <Select value={viewMode} onValueChange={setViewMode as any}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tree">{translations.viewOptions[language].tree}</SelectItem>
              <SelectItem value="flat">{translations.viewOptions[language].flat}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => openAddModal()}>
            <Plus className="mr-2 h-4 w-4" />
            {translations.addCategory[language]}
          </Button>
        </div>
      </div>

      <CategoryFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        language={language}
      />

      <CategoryTable
        categories={filteredCategories}
        isLoading={isLoading}
        language={language}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onAddSubcategory={openAddModal}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onMoveUpOnClient={handleMoveUpOnClient}
        onMoveDownOnClient={handleMoveDownOnClient}
        viewMode={viewMode}
        onRefreshData={handleRefreshData}
      />

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={handleSubmitSuccess}
        categoryId={currentCategoryId}
        formData={formData}
        onInputChange={handleInputChange}
        onSelectChange={handleSelectChange}
        language={language}
        categories={categories}
      />
    </div>
  );
};