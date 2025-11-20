import { useState, useEffect, useMemo } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { ProductService } from '@/lib/api/product.service';
import { CategoryService } from '@/lib/api/category.service';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { AdditiveService } from '@/lib/api/additive.service';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ProductFilters } from './ProductFilters';
import { ProductTable, WorkshopIn } from './ProductTable';
import { ProductModal } from './ProductModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const ALL_CATEGORIES_VALUE = "all-categories";

export const ProductList = () => {
  const router = useRouter()
  const { language } = useLanguageStore();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [additives, setAdditives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES_VALUE);
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    fetchData();
    fetchRestaurants();
  }, []);

  // Инициализируем выбранные рестораны после загрузки
  useEffect(() => {
    if (restaurants.length > 0 && selectedRestaurants.length === 0) {
      setSelectedRestaurants(restaurants.map(r => r.id));
    }
  }, [restaurants]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        ProductService.getAll(),
        CategoryService.getAll(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);

      try {
        const additivesData = await AdditiveService.getAll();
        setAdditives(additivesData || []);
      } catch (error) {
        console.error('Error loading additives:', error);
        setAdditives([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const restaurantsData = await RestaurantService.getAll();
      setRestaurants(restaurantsData || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setRestaurants([]);
    }
  };

  const filteredProductIds = useMemo(() => {
    const filtered = products.filter(product => {
      const matchesSearch = product.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesCategory = selectedCategory === ALL_CATEGORIES_VALUE ||
        product.categoryId === selectedCategory;

      // Фильтрация по множественным ресторанам
      const matchesRestaurants = selectedRestaurants.length === 0 || 
        selectedRestaurants.length === restaurants.length ||
        (product.restaurantPrices?.some((restaurantPrice: any) =>
          selectedRestaurants.includes(restaurantPrice.restaurantId)
        ));

      return matchesSearch && matchesCategory && matchesRestaurants;
    });

    return new Set(filtered.map(product => product.id));
  }, [products, debouncedSearchTerm, selectedCategory, selectedRestaurants, restaurants]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesCategory = selectedCategory === ALL_CATEGORIES_VALUE ||
      product.categoryId === selectedCategory;

    // Фильтрация по множественным ресторанам
    const matchesRestaurants = selectedRestaurants.length === 0 || 
      selectedRestaurants.length === restaurants.length ||
      (product.restaurantPrices?.some((restaurantPrice: any) =>
        selectedRestaurants.includes(restaurantPrice.restaurantId)
      ));

    return matchesSearch && matchesCategory && matchesRestaurants;
  });

  const openAddModal = () => {
    setCurrentProductId(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await ProductService.delete(id);
      toast.success(language === 'ru' ? 'Продукт удален' : 'პროდუქტი წაიშალა');
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(language === 'ru' ? 'Ошибка удаления' : 'წაშლის შეცდომა');
    }
  };

  const handleSubmitSuccess = () => {
    fetchData();
    setIsModalOpen(false);
  };

  if (isLoading && !products.length) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {language === 'ru' ? 'Продукты' : 'პროდუქტები'}
        </h2>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          {language === 'ru' ? 'Добавить продукт' : 'პროდუქტის დამატება'}
        </Button>
      </div>
      <ProductFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedRestaurant={selectedRestaurants}
        onRestaurantChange={setSelectedRestaurants}
        categories={categories}
        restaurants={restaurants}
        language={language}
      />

      <ProductTable
        products={products}
        filteredProductIds={filteredProductIds} 
        isLoading={isLoading && products.length > 0}
        language={language}
        onDelete={handleDelete}
        fetchData={fetchData}
      />

      <ProductModal
        productId={currentProductId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={handleSubmitSuccess}
        language={language}
      />
    </div>
  );
};