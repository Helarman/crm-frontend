import { useState, useEffect, useMemo } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { ProductService } from '@/lib/api/product.service';
import { CategoryService } from '@/lib/api/category.service';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { AdditiveService } from '@/lib/api/additive.service';
import { NetworkService } from '@/lib/api/network.service';
import { Button } from '@/components/ui/button';
import { Plus, Grid3X3, Store, RefreshCw, X, ArrowLeftRight, Archive } from 'lucide-react';
import { ProductFilters } from './ProductFilters';
import { ProductTable } from './ProductTable';
import { ProductTableArchived } from './ProductTableArchive';
import { ProductModal } from './ProductModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import WorkshopService from '@/lib/api/workshop.service';

const STORAGE_KEY = 'selected_network_id';
const ALL_CATEGORIES_VALUE = "all-categories";

export const ProductList = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguageStore();
  
  const [networks, setNetworks] = useState<any[]>([]);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  
  const [products, setProducts] = useState<any[]>([]);
  const [archivedProducts, setArchivedProducts] = useState<any[]>([]); // Добавляем состояние для архивных продуктов
  const [showArchived, setShowArchived] = useState(false); // Флаг для отображения архива
  const [categories, setCategories] = useState<any[]>([]);
  const [additives, setAdditives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchivedLoading, setIsArchivedLoading] = useState(false); // Загрузка архива
  const [isNetworksLoading, setIsNetworksLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES_VALUE);
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const translations = {
    ru: {
      selectNetwork: 'Выберите сеть',
      selectNetworkDescription: 'Выберите сеть для управления продуктами',
      noNetworks: 'Нет доступных сетей',
      noNetworksDescription: 'У вас нет доступа к каким-либо сетям ресторанов',
      manageNetworks: 'Управление сетями',
      networkManagement: 'Управление продуктами сети',
      addProduct: 'Добавить продукт',
      loading: 'Загрузка...',
      changeNetwork: 'Сменить сеть',
      currentNetwork: 'Текущая сеть',
      hideSelector: 'Скрыть выбор сети',
      clearNetworkSelection: 'Очистить выбор сети',
      refresh: 'Обновить',
      productsCount: (count: number) => `${count} продукт(ов)`,
      archivedCount: (count: number) => `${count} архивных продукт(ов)`,
      restaurantsCount: (count: number) => `${count} ресторан(ов)`,
      viewProducts: 'Просмотр продуктов',
      showArchive: 'Архив',
      showActive: 'Активные',
      archiveTitle: 'Архив продуктов',
      restoreProduct: 'Восстановить',
      restoreSuccess: 'Продукт восстановлен',
      restoreError: 'Ошибка восстановления',
      hardDelete: 'Удалить навсегда',
      hardDeleteSuccess: 'Продукт удален навсегда',
      hardDeleteError: 'Ошибка удаления',
      restoreAll: 'Восстановить все',
      restoreSelected: 'Восстановить выбранные',
      hardDeleteSelected: 'Удалить выбранные навсегда',
      archiveNote: 'В архиве отображаются удаленные (неиспользуемые) продукты'
    },
    ka: {
      selectNetwork: 'აირჩიეთ ქსელი',
      selectNetworkDescription: 'აირჩიეთ ქსელი პროდუქტების მართვისთვის',
      noNetworks: 'წვდომადი ქსელები არ არის',
      noNetworksDescription: 'თქვენ არ გაქვთ წვდომა რესტორნების ქსელებზე',
      manageNetworks: 'ქსელების მართვა',
      networkManagement: 'ქსელის პროდუქტების მართვა',
      addProduct: 'პროდუქტის დამატება',
      loading: 'იტვირთება...',
      changeNetwork: 'ქსელის შეცვლა',
      currentNetwork: 'მიმდინარე ქსელი',
      hideSelector: 'ქსელის არჩევის დამალვა',
      clearNetworkSelection: 'ქსელის არჩევის გასუფთავება',
      refresh: 'განახლება',
      productsCount: (count: number) => `${count} პროდუქტი`,
      archivedCount: (count: number) => `${count} არქივირებული პროდუქტი`,
      restaurantsCount: (count: number) => `${count} რესტორნი`,
      viewProducts: 'პროდუქტების ნახვა',
      showArchive: 'არქივი',
      showActive: 'აქტიური',
      archiveTitle: 'პროდუქტების არქივი',
      restoreProduct: 'აღდგენა',
      restoreSuccess: 'პროდუქტი აღდგენილია',
      restoreError: 'აღდგენის შეცდომა',
      hardDelete: 'სამუდამოდ წაშლა',
      hardDeleteSuccess: 'პროდუქტი სამუდამოდ წაიშალა',
      hardDeleteError: 'წაშლის შეცდომა',
      restoreAll: 'ყველას აღდგენა',
      restoreSelected: 'არჩეულის აღდგენა',
      hardDeleteSelected: 'არჩეულის სამუდამოდ წაშლა',
      archiveNote: 'არქივში ნაჩვენებია წაშლილი (არამოხმარებადი) პროდუქტები'
    }
  };

  const t = translations[language as 'ru' | 'ka'];

  // Загрузка сохраненной сети из localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNetworkId = localStorage.getItem(STORAGE_KEY);
      if (savedNetworkId) {
        setSelectedNetworkId(savedNetworkId);
      }
    }
  }, []);

  // Сохранение выбранной сети в localStorage
  useEffect(() => {
    if (selectedNetworkId && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, selectedNetworkId);
    }
  }, [selectedNetworkId]);

  // Загрузка сетей пользователя
  useEffect(() => {
    const loadNetworks = async () => {
      setIsNetworksLoading(true);
      try {
        const networksData = await NetworkService.getByUser(user.id);
        setNetworks(networksData);
        
        // Если есть сохраненная сеть, проверяем доступность
        if (selectedNetworkId) {
          const networkExists = networksData.some(n => n.id === selectedNetworkId);
          if (!networkExists && networksData.length > 0) {
            // Если сохраненной сети нет в доступных, выбираем первую
            setSelectedNetworkId(networksData[0].id);
          }
        } else if (networksData.length === 1) {
          // Если у пользователя только одна сеть, выбираем ее автоматически
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

  const fetchWorkshops = async () => {
    if (!selectedNetworkId) return;
    
    try {
      const workshopsData = await WorkshopService.findByNetworkId(selectedNetworkId);
      setWorkshops(workshopsData || []);
    } catch (error) {
      console.error('Error fetching workshops:', error);
      setWorkshops([]);
    }
  };
  
  // Загрузка данных при выборе сети
  useEffect(() => {
    if (selectedNetworkId) {
      fetchData();
      fetchRestaurants();
      fetchWorkshops();
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
      // Загружаем продукты сети (только активные)
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

  const fetchArchivedProducts = async () => {
    if (!selectedNetworkId) return;
    
    setIsArchivedLoading(true);
    try {
      // Используем новый метод для получения архивных продуктов по сети
      const archivedData = await ProductService.getDeletedByNetwork(selectedNetworkId);
      setArchivedProducts(archivedData || []);
    } catch (error) {
      console.error('Error fetching archived products:', error);
      toast.error(language === 'ru' ? 'Ошибка загрузки архива' : 'არქივის ჩატვირთვის შეცდომა');
      setArchivedProducts([]);
    } finally {
      setIsArchivedLoading(false);
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

  // При переключении в режим архива загружаем архивные продукты
  useEffect(() => {
    if (showArchived && selectedNetworkId) {
      fetchArchivedProducts();
    }
  }, [showArchived, selectedNetworkId]);

  const filteredProductIds = useMemo(() => {
    const currentProducts = showArchived ? archivedProducts : products;
    const filtered = currentProducts.filter(product => {
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
  }, [products, archivedProducts, showArchived, debouncedSearchTerm, selectedCategory, selectedRestaurants, restaurants]);

  const filteredProducts = useMemo(() => {
    const currentProducts = showArchived ? archivedProducts : products;
    return currentProducts.filter(product => {
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
  }, [products, archivedProducts, showArchived, debouncedSearchTerm, selectedCategory, selectedRestaurants, restaurants]);

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

  const handleRestore = async (id: string) => {
    try {
      await ProductService.restoreProducts([id]);
      toast.success(language === 'ru' ? 'Продукт восстановлен' : 'პროდუქტი აღდგენილია');
      fetchArchivedProducts(); // Обновляем список архива
      fetchData(); // Обновляем список активных продуктов
    } catch (error) {
      console.error('Error restoring product:', error);
      toast.error(language === 'ru' ? 'Ошибка восстановления' : 'აღდგენის შეცდომა');
    }
  };

  const handleHardDelete = async (id: string) => {
    try {
      await ProductService.hardDelete(id);
      toast.success(language === 'ru' ? 'Продукт удален навсегда' : 'პროდუქტი სამუდამოდ წაიშალა');
      fetchArchivedProducts(); // Обновляем список архива
    } catch (error) {
      console.error('Error hard deleting product:', error);
      toast.error(language === 'ru' ? 'Ошибка удаления' : 'წაშლის შეცდომა');
    }
  };

  const handleBulkRestore = async (productIds: string[]) => {
    try {
      await ProductService.restoreProducts(productIds);
      toast.success(
        language === 'ru' 
          ? `Восстановлено ${productIds.length} продуктов`
          : `${productIds.length} პროდუქტი აღდგენილია`
      );
      fetchArchivedProducts(); // Обновляем список архива
      fetchData(); // Обновляем список активных продуктов
    } catch (error) {
      console.error('Error restoring products:', error);
      toast.error(language === 'ru' ? 'Ошибка восстановления' : 'აღდგენის შეცდომა');
    }
  };

  const handleBulkHardDelete = async (productIds: string[]) => {
    try {
      // Если у ProductService есть метод для массового удаления навсегда
      if (ProductService.bulkDelete) {
        await ProductService.bulkDelete({ productIds });
      } else {
        // Или удаляем по одному
        for (const id of productIds) {
          await ProductService.hardDelete(id);
        }
      }
      toast.success(
        language === 'ru' 
          ? `Удалено ${productIds.length} продуктов навсегда`
          : `${productIds.length} პროდუქტი სამუდამოდ წაიშალა`
      );
      fetchArchivedProducts(); // Обновляем список архива
    } catch (error) {
      console.error('Error hard deleting products:', error);
      toast.error(language === 'ru' ? 'Ошибка удаления' : 'წაშლის შეცდომა');
    }
  };

  const handleSubmitSuccess = () => {
    fetchData();
    setIsModalOpen(false);
  };

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetworkId(networkId);
    setShowNetworkSelector(false);
    // Сбрасываем фильтры при смене сети
    setSearchTerm('');
    setSelectedCategory(ALL_CATEGORIES_VALUE);
    setSelectedRestaurants([]);
  };

  const handleChangeNetworkClick = () => {
    setShowNetworkSelector(true);
  };

  const handleClearNetwork = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setSelectedNetworkId(null);
    setShowNetworkSelector(true);
  };

  // Получаем текущую сеть
  const currentNetwork = networks.find(n => n.id === selectedNetworkId);

  // Если загружаются сети и нет выбранной сети
  if (isNetworksLoading && !selectedNetworkId) {
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

  // Если показываем селектор сетей или нет выбранной сети
  if (showNetworkSelector || !selectedNetworkId) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold mb-2">
              {t.selectNetwork}
            </h2>
            {selectedNetworkId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNetworkSelector(false)}
                className="h-auto p-0 text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                {t.hideSelector}
              </Button>
            )}
          </div>
          <p className="text-muted-foreground">
            {t.selectNetworkDescription}
          </p>
        </div>
        
        {selectedNetworkId && currentNetwork && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Store className="h-5 w-5" />
                {t.currentNetwork}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{currentNetwork.name}</p>
                  {currentNetwork.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentNetwork.description}
                    </p>
                  )}
                </div>
                <Badge variant="outline">
                  {t.restaurantsCount(currentNetwork.restaurants?.length || 0)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {networks.map((network) => (
            <Card 
              key={network.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                network.id === selectedNetworkId 
                  ? 'border-primary border-2 bg-primary/5' 
                  : ''
              }`}
              onClick={() => handleNetworkSelect(network.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{network.name}</CardTitle>
                  {network.id === selectedNetworkId && (
                    <Badge className="bg-primary text-primary-foreground">
                      {language === 'ru' ? 'Текущая' : 'მიმდინარე'}
                    </Badge>
                  )}
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

        {selectedNetworkId && (
          <div className="mt-6 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={handleClearNetwork}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {t.clearNetworkSelection}
            </Button>
          </div>
        )}
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
            {t.noNetworks}
          </h3>
          <p className="text-muted-foreground mb-4">
            {t.noNetworksDescription}
          </p>
          <Button onClick={() => router.push('/networks')}>
            {t.manageNetworks}
          </Button>
        </div>
      </div>
    );
  }

  // Если выбрана сеть и не показываем селектор
  if (isLoading && !products.length && !showArchived) {
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
            {networks.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleChangeNetworkClick}
                  className="h-auto p-0 text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Store className="h-3 w-3" />
                  {t.changeNetwork}
                </Button>
                <span className="text-muted-foreground">/</span>
              </>
            )}
            <h2 className="text-xl font-semibold">
              {currentNetwork?.name}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {showArchived ? t.archiveTitle : t.networkManagement} • 
              {showArchived 
                ? t.archivedCount(archivedProducts.length)
                : t.productsCount(products.length)
              }
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={showArchived ? fetchArchivedProducts : fetchData}
              className="h-6 w-6 p-0"
              title={t.refresh}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          {showArchived && (
            <p className="text-xs text-muted-foreground mt-1">
              {t.archiveNote}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowArchived(!showArchived)} 
            variant={showArchived ? "default" : "outline"}
          >
            <Archive className="mr-2 h-4 w-4" />
            {showArchived ? t.showActive : t.showArchive}
          </Button>

          {!showArchived && (
            <Button onClick={() => router.push('/products/new')}>
              <Plus className="mr-2 h-4 w-4" />
              {t.addProduct}
            </Button>
          )}
        </div>
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
        isArchivedMode={showArchived}
      />

      {/* Выбор таблицы в зависимости от режима */}
      {showArchived ? (
        <ProductTableArchived
          products={filteredProducts}
          filteredProductIds={filteredProductIds}
          isLoading={isArchivedLoading}
          language={language}
          isArchivedMode={true}
          onRestore={handleRestore}
          onHardDelete={handleHardDelete}
          fetchData={fetchArchivedProducts}
          onBulkRestore={handleBulkRestore}
          onBulkHardDelete={handleBulkHardDelete}
        />
      ) : (
        <ProductTable
          products={filteredProducts}
          filteredProductIds={filteredProductIds}
          isLoading={isLoading}
          language={language}
          onDelete={handleDelete}
          fetchData={fetchData}
          categories={categories}
          workshops={workshops}
          additives={additives}
          networks={networks}
        />
      )}

      {/* Модальное окно создания/редактирования продукта */}
      <ProductModal
        productId={currentProductId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={handleSubmitSuccess}
        language={language}
        networkId={selectedNetworkId || ''}
        workshops={workshops}
      />
    </div>
  );
};