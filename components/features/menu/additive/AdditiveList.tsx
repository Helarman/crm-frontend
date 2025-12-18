import { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { AdditiveService, Additive } from '@/lib/api/additive.service';
import { NetworkService } from '@/lib/api/network.service';
import { Button } from '@/components/ui/button';
import { Plus, Layers } from 'lucide-react';
import { AdditiveTable } from './AdditiveTable';
import { AdditiveModal } from './AdditiveModal';
import { AdditiveFilters } from './AdditiveFilters';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const AdditiveList = () => {
  const { language } = useLanguageStore();
  const { user } = useAuth();
  const [additives, setAdditives] = useState<Additive[]>([]);
  const [networks, setNetworks] = useState<any[]>([]);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNetworksLoading, setIsNetworksLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAdditiveId, setCurrentAdditiveId] = useState<string | null | undefined>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Additive>({
    title: '',
    price: 0,
    networkId: '',
  });

  const translations = {
    ru: {
      addAdditive: 'Добавить модификатор',
      title: 'Модификаторы',
      noNetworkSelected: 'Выберите сеть для просмотра модификаторов',
      selectNetwork: 'Выберите сеть',
      selectNetworkDescription: 'Выберите сеть для управления модификаторами',
      noNetworks: 'Нет доступных сетей',
      noNetworksDescription: 'У вас нет доступа к каким-либо сетям ресторанов',
      manageNetworks: 'Управление сетями',
      networkManagement: 'Управление модификаторами сети',
      loading: 'Загрузка...',
      networkRestaurants: (count: number) => `${count} ресторан(ов)`,
      additivesCount: (count: number) => `${count} модификатор(ов)`,
      backToNetworks: 'Сети',
      viewAdditives: 'Просмотр модификаторов',
      allAdditives: 'Все модификаторы'
    },
    ka: {
      addAdditive: 'მოდიფიკატორის დამატება',
      title: 'მოდიფიკატორები',
      noNetworkSelected: 'აირჩიეთ ქსელი მოდიფიკატორების სანახავად',
      selectNetwork: 'აირჩიეთ ქსელი',
      selectNetworkDescription: 'აირჩიეთ ქსელი მოდიფიკატორების მართვისთვის',
      noNetworks: 'წვდომადი ქსელები არ არის',
      noNetworksDescription: 'თქვენ არ გაქვთ წვდომა რესტორნების ქსელებზე',
      manageNetworks: 'ქსელების მართვა',
      networkManagement: 'ქსელის მოდიფიკატორების მართვა',
      loading: 'იტვირთება...',
      networkRestaurants: (count: number) => `${count} რესტორნი`,
      additivesCount: (count: number) => `${count} მოდიფიკატორი`,
      backToNetworks: 'ქსელები',
      viewAdditives: 'მოდიფიკატორების ნახვა',
      allAdditives: 'ყველა მოდიფიკატორი'
    }
  };

  const t = translations[language as 'ru' | 'ka'];

  // Загрузка сетей пользователя
  useEffect(() => {
    const loadNetworks = async () => {
      setIsNetworksLoading(true);
      try {
        if (user?.id) {
          const networksData = await NetworkService.getByUser(user.id);
          setNetworks(networksData);
          
          // Если у пользователя только одна сеть, выбираем ее автоматически
          if (networksData.length === 1) {
            setSelectedNetworkId(networksData[0].id);
            setFormData(prev => ({ ...prev, networkId: networksData[0].id }));
          }
        }
      } catch (error) {
        console.error('Error fetching networks:', error);
        toast.error(language === 'ru' ? 'Ошибка загрузки сетей' : 'ქსელების ჩატვირთვის შეცდომა');
      } finally {
        setIsNetworksLoading(false);
      }
    };
    
    loadNetworks();
  }, [user?.id, language]);

  // Загрузка модификаторов при выборе сети
  useEffect(() => {
    if (selectedNetworkId) {
      fetchAdditives();
    } else {
      setAdditives([]);
    }
  }, [selectedNetworkId]);

  const fetchAdditives = async () => {
    if (!selectedNetworkId) return;
    
    setIsLoading(true);
    try {
      const data = await AdditiveService.getByNetwork(selectedNetworkId);
      setAdditives(data);
    } catch (error) {
      console.error('Error fetching additives:', error);
      setAdditives([]);
      toast.error(language === 'ru' ? 'Ошибка загрузки модификаторов' : 'მოდიფიკატორების ჩატვირთვის შეცდომა');
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    setFormData({ 
      title: '', 
      price: 0, 
      networkId: selectedNetworkId || '' 
    });
    setCurrentAdditiveId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (additive: Additive) => {
    setCurrentAdditiveId(additive.id);
    setFormData({
      title: additive.title,
      price: additive.price,
      networkId: additive.networkId || selectedNetworkId || '',
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
      toast.success(language === 'ru' ? 'Модификатор удален' : 'მოდიფიკატორი წაიშალა');
    } catch (error) {
      console.error('Error deleting additive:', error);
      toast.error(language === 'ru' ? 'Ошибка удаления' : 'წაშლის შეცდომა');
    }
  };

  const handleNetworkSelect = (networkId: string) => {
    setSelectedNetworkId(networkId);
    // Сбрасываем поиск при смене сети
    setSearchTerm('');
  };

  // Фильтрация модификаторов по поиску
  const filteredAdditives = additives.filter(additive =>
    additive.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Если загружаются сети
  if (isNetworksLoading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
              className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
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
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
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
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {t.noNetworks}
          </h3>
          <p className="text-muted-foreground mb-4">
            {t.noNetworksDescription}
          </p>
        </div>
      </div>
    );
  }

  const currentNetwork = networks.find(n => n.id === selectedNetworkId);

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
                  onClick={() => setSelectedNetworkId(null)}
                  className="h-auto p-0 text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Layers className="h-3 w-3" />
                  {t.backToNetworks}
                </Button>
                <span className="text-muted-foreground">/</span>
              </>
            )}
            <h2 className="text-xl font-semibold">
              {currentNetwork?.name}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {t.networkManagement} • {t.additivesCount(additives.length)}
          </p>
        </div>
        
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          {t.addAdditive}
        </Button>
      </div>

      {/* Фильтры */}
      <AdditiveFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        language={language}
      />

      {/* Таблица модификаторов */}
      <AdditiveTable
        additives={filteredAdditives}
        isLoading={isLoading && additives.length === 0}
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
        selectedNetworkId={selectedNetworkId}
      />
    </div>
  );
};