import { useState, useEffect, useMemo } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { CategoryService } from '@/lib/api/category.service';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { NetworkService } from '@/lib/api/network.service';
import { Button } from '@/components/ui/button';
import { Plus, Grid3X3, Store, Layers } from 'lucide-react';
import { CategoryFilters } from './CategoryFilters';
import { CategoryTable } from './CategoryTable';
import { CategoryModal } from './CategoryModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const CategoryList = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguageStore();
  
  const [networks, setNetworks] = useState<any[]>([]);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNetworksLoading, setIsNetworksLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all');
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const translations = {
    ru: {
      title: 'Категории',
      selectNetwork: 'Выберите сеть',
      selectNetworkDescription: 'Выберите сеть для управления категориями',
      noNetworks: 'Нет доступных сетей',
      noNetworksDescription: 'У вас нет доступа к каким-либо сетям ресторанов',
      manageNetworks: 'Управление сетями',
      networkManagement: 'Управление категориями сети',
      addCategory: 'Добавить категорию',
      loading: 'Загрузка...',
      viewOptions: {
        tree: 'Дерево',
        flat: 'Список'
      },
      filterByRestaurant: 'Фильтр по ресторану',
      allRestaurants: 'Все рестораны',
      restaurantsCount: (count: number) => `${count} ресторан(ов)`
    },
    ka: {
      title: 'კატეგორიები',
      selectNetwork: 'აირჩიეთ ქსელი',
      selectNetworkDescription: 'აირჩიეთ ქსელი კატეგორიების მართვისთვის',
      noNetworks: 'წვდომადი ქსელები არ არის',
      noNetworksDescription: 'თქვენ არ გაქვთ წვდომა რესტორნების ქსელებზე',
      manageNetworks: 'ქსელების მართვა',
      networkManagement: 'ქსელის კატეგორიების მართვა',
      addCategory: 'კატეგორიის დამატება',
      loading: 'იტვირთება...',
      viewOptions: {
        tree: 'ხე',
        flat: 'სია'
      },
      filterByRestaurant: 'ფილტრი რესტორანის მიხედვით',
      allRestaurants: 'ყველა რესტორანი',
      restaurantsCount: (count: number) => `${count} რესტორნი`
    }
  };

  const t = translations[language as 'ru' | 'ka'];

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
  }, [selectedNetworkId, viewMode, selectedRestaurant]);

  const fetchData = async () => {
    if (!selectedNetworkId) return;
    
    setIsLoading(true);
    try {
      let categoriesData;
      
      if (selectedRestaurant === 'all') {
        categoriesData = await CategoryService.getByNetwork(selectedNetworkId);
      } else {
        categoriesData = await CategoryService.getByRestaurant(selectedRestaurant);
      }

      // Преобразуем в плоский список или дерево в зависимости от режима просмотра
      if (viewMode === 'tree') {
        // Для режима дерева нужна иерархическая структура
        if (selectedRestaurant === 'all') {
          categoriesData = await CategoryService.getTreeByNetwork(selectedNetworkId);
        } else {
          categoriesData = await CategoryService.getTreeByRestaurant(selectedRestaurant);
        }
      } else {
        // Для плоского режима
        if (selectedRestaurant === 'all') {
          const tree = await CategoryService.getTreeByNetwork(selectedNetworkId);
          categoriesData = flattenCategories(tree);
        } else {
          const tree = await CategoryService.getTreeByRestaurant(selectedRestaurant);
          categoriesData = flattenCategories(tree);
        }
      }
      
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error(language === 'ru' ? 'Ошибка загрузки категорий' : 'კატეგორიების ჩატვირთვის შეცდომა');
    } finally {
      setIsLoading(false);
    }
  };

  const flattenCategories = (categories: any[]): any[] => {
    return categories.flatMap(category => [
      { ...category, children: undefined },
      ...flattenCategories(category.children || [])
    ]);
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

  // Фильтрация категорий по поисковому запросу
  const filteredCategories = useMemo(() => {
    if (!debouncedSearchTerm) return categories;
    
    const search = debouncedSearchTerm.toLowerCase();
    return categories.filter(category =>
      category.title.toLowerCase().includes(search) ||
      category.description?.toLowerCase().includes(search) ||
      category.slug?.toLowerCase().includes(search)
    );
  }, [categories, debouncedSearchTerm]);

  const openAddModal = (parentId?: string) => {
    setCurrentCategoryId(null);
    // Можно добавить логику для установки parentId
    setIsModalOpen(true);
  };

  const openEditModal = (category: any) => {
    setCurrentCategoryId(category.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await CategoryService.delete(id);
      toast.success(language === 'ru' ? 'Категория удалена' : 'კატეგორია წაიშალა');
      fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
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
    setSelectedRestaurant('all');
  };

  const handleRefreshData = () => {
    fetchData();
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
            {t.selectNetwork}
          </h2>
          <p className="text-muted-foreground">
            {t.selectNetworkDescription}
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

  // Если выбрана сеть, показываем категории
  const currentNetwork = networks.find(n => n.id === selectedNetworkId);

  if (isLoading && !categories.length) {
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
            {t.networkManagement} • {t.restaurantsCount(restaurants.length)}
          </p>
        </div>
        
        <Button onClick={() => openAddModal()}>
          <Plus className="mr-2 h-4 w-4" />
          {t.addCategory}
        </Button>
      </div>

      {/* Фильтры и настройки отображения */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1">
          <CategoryFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            language={language}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={viewMode} onValueChange={setViewMode as any}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tree">{t.viewOptions.tree}</SelectItem>
              <SelectItem value="flat">{t.viewOptions.flat}</SelectItem>
            </SelectContent>
          </Select>

          {restaurants.length > 0 && (
            <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t.filterByRestaurant} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t.allRestaurants}
                </SelectItem>
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.id} value={restaurant.id}>
                    {restaurant.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Таблица категорий */}
      <CategoryTable
        categories={filteredCategories}
        isLoading={isLoading && categories.length > 0}
        language={language}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onAddSubcategory={openAddModal}
        onMoveUp={async (id: string) => {
          try {
            await CategoryService.moveUp(id);
            fetchData();
          } catch (error) {
            console.error('Error moving category up:', error);
          }
        }}
        onMoveDown={async (id: string) => {
          try {
            await CategoryService.moveDown(id);
            fetchData();
          } catch (error) {
            console.error('Error moving category down:', error);
          }
        }}
        onMoveUpOnClient={async (id: string) => {
          try {
            await CategoryService.moveUpOnClient(id);
            fetchData();
          } catch (error) {
            console.error('Error moving category up on client:', error);
          }
        }}
        onMoveDownOnClient={async (id: string) => {
          try {
            await CategoryService.moveDownOnClient(id);
            fetchData();
          } catch (error) {
            console.error('Error moving category down on client:', error);
          }
        }}
        viewMode={viewMode}
        onRefreshData={handleRefreshData}
      />

      {/* Модальное окно создания/редактирования категории */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={handleSubmitSuccess}
        categoryId={currentCategoryId}
        language={language}
        networkId={selectedNetworkId || ''}
        restaurantId={selectedRestaurant !== 'all' ? selectedRestaurant : undefined}
        categories={categories}
      />
    </div>
  );
};