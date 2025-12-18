import { useState, useEffect, useMemo } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { ProductService } from '@/lib/api/product.service';
import { CategoryService } from '@/lib/api/category.service';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { AdditiveService } from '@/lib/api/additive.service';
import { NetworkService } from '@/lib/api/network.service';
import { Button } from '@/components/ui/button';
import { Plus, Grid3X3, Store } from 'lucide-react';
import { ProductFilters } from './ProductFilters';
import { ProductTable } from './ProductTable';
import { ProductModal } from './ProductModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ALL_CATEGORIES_VALUE = "all-categories";

export const ProductList = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguageStore();
  
  const [networks, setNetworks] = useState<any[]>([]);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [additives, setAdditives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNetworksLoading, setIsNetworksLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES_VALUE);
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Загрузка сетей пользователя
  useEffect(() => {
    const loadNetworks = async () => {
      setIsNetworksLoading(true);
      try {
        const networksData = await NetworkService.getByUser(user.id);
        setNetworks(networksData);
        
        // Если у пользователя только одна сеть, выбираем ее автоматически
        if (networksData.length === 1) {
          setSelectedNetworkId(networksData[0].id);
        }
      } catch (error) {
        console.error('Error fetching networks:', error);
        toast.error(language === 'ru' ? 'Ошибка загрузки сетей' : 'ქსელების ჩატვირთვის შეცდომა');
      } finally {
        setIsNetworksLoading(false);
      }
    };
    
    if (user?.id) {
      loadNetworks();
    }
  }, [user?.id, language]);

  // Загрузка данных при выборе сети
  useEffect(() => {
    if (selectedNetworkId) {
      fetchData();
      fetchRestaurants();
    }
  }, [selectedNetworkId]);

  // Инициализируем выбранные рестораны после загрузки
  useEffect(() => {
    if (restaurants.length > 0 && selectedRestaurants.length === 0) {
      setSelectedRestaurants(restaurants.map(r => r.id));
    }
  }, [restaurants]);

  const fetchData = async () => {
    if (!selectedNetworkId) return;
    
    setIsLoading(true);
    try {
      // Загружаем продукты сети
      const productsData = await ProductService.getByNetwork(selectedNetworkId);
      
      // Загружаем категории сети
      const categoriesData = await CategoryService.getByNetwork(selectedNetworkId);
      
      setProducts(productsData);
      setCategories(categoriesData);

      try {
        // Загружаем модификаторы сети
        const additivesData = await AdditiveService.getByNetwork(selectedNetworkId);
        setAdditives(additivesData || []);
      } catch (error) {
        console.error('Error loading additives:', error);
        setAdditives([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(language === 'ru' ? 'Ошибка загрузки данных' : 'მონაცემების ჩატვირთვის შეცდომა');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    if (!selectedNetworkId) return;
    
    try {
      const restaurantsData = await RestaurantService.getAll();
      // Фильтруем рестораны по выбранной сети
      const networkRestaurants = restaurantsData.filter(
        (restaurant: any) => restaurant.networkId === selectedNetworkId
      );
      setRestaurants(networkRestaurants || []);
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

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetworkId(networkId);
    // Сбрасываем фильтры при смене сети
    setSearchTerm('');
    setSelectedCategory(ALL_CATEGORIES_VALUE);
    setSelectedRestaurants([]);
  };

  // Если загружаются сети
  if (isNetworksLoading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Если у пользователя несколько сетей и ни одна не выбрана
  if (networks.length > 1 && !selectedNetworkId) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">
            {language === 'ru' ? 'Выберите сеть' : 'აირჩიეთ ქსელი'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ru' 
              ? 'Выберите сеть для управления продуктами' 
              : 'აირჩიეთ ქსელი პროდუქტების მართვისთვის'}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {networks.map((network) => (
            <Card 
              key={network.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleNetworkSelect(network.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{network.name}</CardTitle>
                
                </div>
                <CardDescription>
                  {language === 'ru' ? 'Сеть ресторанов' : 'რესტორნების ქსელი'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {language === 'ru' ? 'Рестораны:' : 'რესტორნები:'}
                    </span>
                    <Badge variant="outline">
                      {network.restaurants?.length || 0}
                    </Badge>
                  </div>
                  {network.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {network.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Если нет сетей
  if (networks.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <Grid3X3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {language === 'ru' ? 'Нет доступных сетей' : 'წვდომადი ქსელები არ არის'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {language === 'ru' 
              ? 'У вас нет доступа к каким-либо сетям ресторанов' 
              : 'თქვენ არ გაქვთ წვდომა რესტორნების ქსელებზე'}
          </p>
          <Button onClick={() => router.push('/networks')}>
            {language === 'ru' ? 'Управление сетями' : 'ქსელების მართვა'}
          </Button>
        </div>
      </div>
    );
  }

  // Если выбрана сеть, показываем продукты
  const currentNetwork = networks.find(n => n.id === selectedNetworkId);

  if (isLoading && !products.length) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
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
      {/* Хлебные крошки и информация о сети */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNetworkId(null)}
              className="h-auto p-0 text-muted-foreground hover:text-foreground"
            >
              {language === 'ru' ? 'Сети' : 'ქსელები'}
            </Button>
            <span className="text-muted-foreground">/</span>
            <h2 className="text-xl font-semibold">
              {currentNetwork?.name}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {language === 'ru' 
              ? `Управление продуктами сети • ${restaurants.length} ресторан(ов)`
              : `ქსელის პროდუქტების მართვა • ${restaurants.length} რესტორნი`}
          </p>
        </div>
        
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          {language === 'ru' ? 'Добавить продукт' : 'პროდუქტის დამატება'}
        </Button>
      </div>

      {/* Фильтры */}
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

      {/* Таблица продуктов */}
      <ProductTable
        products={filteredProducts}
        filteredProductIds={filteredProductIds}
        isLoading={isLoading && products.length > 0}
        language={language}
        onDelete={handleDelete}
        fetchData={fetchData}
      />

      {/* Модальное окно создания/редактирования продукта */}
      <ProductModal
        productId={currentProductId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={handleSubmitSuccess}
        language={language}
        networkId={selectedNetworkId || ''}
      />
    </div>
  );
};