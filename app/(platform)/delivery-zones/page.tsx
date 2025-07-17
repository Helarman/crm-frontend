'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DeliveryZoneService, DeliveryZone, CreateDeliveryZoneDto } from '@/lib/api/delivery-zone.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { useLanguageStore } from '@/lib/stores/language-store';
import { useAuth } from '@/lib/hooks/useAuth';
import { Trash2, Edit } from 'lucide-react';
import { Restaurant } from '@/components/features/staff/StaffTable';

const MapEditor = dynamic(() => import('@/components/features/MapEditor'), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
});

const translations = {
  ru: {
    title: 'Зоны доставки',
    createButton: 'Создать новую зону',
    noZones: 'Зоны доставки не найдены. Создайте первую!',
    selectRestaurant: 'Выберите ресторан',
    allRestaurants: 'Все рестораны',
    tableHeaders: {
      title: 'Название',
      price: 'Стоимость доставки',
      minOrder: 'Мин. заказ',
      restaurant: 'Ресторан',
      actions: 'Действия',
    },
    editButton: 'Редактировать',
    deleteButton: 'Удалить',
    dialog: {
      createTitle: 'Создание зоны доставки',
      editTitle: 'Редактирование зоны доставки',
      labels: {
        title: 'Название',
        price: 'Стоимость доставки',
        minOrder: 'Минимальный заказ',
        restaurant: 'Ресторан',
      },
      cancelButton: 'Отмена',
      saveButton: 'Сохранить',
      createButton: 'Создать',
      updateButton: 'Обновить',
    },
    errors: {
      noPolygon: 'Пожалуйста, нарисуйте зону доставки на карте',
      polygonNotClosed: 'Полигон должен быть замкнут',
      noRestaurant: 'Выберите ресторан',
      createSuccess: 'Зона доставки успешно создана',
      updateSuccess: 'Зона доставки успешно обновлена',
      deleteSuccess: 'Зона доставки успешно удалена',
      loadError: 'Ошибка загрузки зон доставки',
      saveError: 'Ошибка сохранения зоны доставки',
      deleteError: 'Ошибка удаления зоны доставки',
    },
  },
  ka: {
    title: 'მიტანის ზონები',
    createButton: 'ახალი ზონის შექმნა',
    noZones: 'მიტანის ზონები არ მოიძებნა. შექმენით პირველი!',
    selectRestaurant: 'აირჩიეთ რესტორანი',
    allRestaurants: 'ყველა რესტორანი',
    tableHeaders: {
      title: 'სახელი',
      price: 'მიტანის ღირებულება',
      minOrder: 'მინიმალური შეკვეთა',
      restaurant: 'რესტორანი',
      actions: 'მოქმედებები',
    },
    editButton: 'რედაქტირება',
    deleteButton: 'წაშლა',
    dialog: {
      createTitle: 'მიტანის ზონის შექმნა',
      editTitle: 'მიტანის ზონის რედაქტირება',
      labels: {
        title: 'სახელი',
        price: 'მიტანის ღირებულება',
        minOrder: 'მინიმალური შეკვეთა',
        restaurant: 'რესტორანი',
      },
      cancelButton: 'გაუქმება',
      saveButton: 'შენახვა',
      createButton: 'შექმნა',
      updateButton: 'განახლება',
    },
    errors: {
      noPolygon: 'გთხოვთ დახაზოთ მიტანის ზონა რუკაზე',
      polygonNotClosed: 'პოლიგონი უნდა იყოს დახურული',
      noRestaurant: 'აირჩიეთ რესტორანი',
      createSuccess: 'მიტანის ზონა წარმატებით შეიქმნა',
      updateSuccess: 'მიტანის ზონა წარმატებით განახლდა',
      deleteSuccess: 'მიტანის ზონა წარმატებით წაიშალა',
      loadError: 'მიტანის ზონების ჩატვირთვის შეცდომა',
      saveError: 'მიტანის ზონის შენახვის შეცდომა',
      deleteError: 'მიტანის ზონის წაშლის შეცდომა',
    },
  },
};

export default function DeliveryZonePage() {
  const { language } = useLanguageStore();
  const t = translations[language];
  const { user } = useAuth();
  
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [filteredZones, setFilteredZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | undefined>(undefined);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [isPolygonValid, setIsPolygonValid] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState<CreateDeliveryZoneDto>({
    title: '',
    price: 0,
    minOrder: 0,
    polygon: '',
    restaurantId: undefined,
  });

  // Загрузка зон доставки
  useEffect(() => {
    async function loadZones() {
      try {
        setLoading(true);
        if (!user?.restaurant?.length) return;
        
        // Устанавливаем первый ресторан по умолчанию для формы
        const defaultRestaurantId = user.restaurant[0].id;
        setFormData(prev => ({ ...prev, restaurantId: defaultRestaurantId }));
        
        // Загружаем зоны для всех ресторанов пользователя
        const allZones = await Promise.all(
          user.restaurant.map((rest: Restaurant) => 
            DeliveryZoneService.findAllByRestaurant(rest.id)
          )
        );
        
        const flattenedZones = allZones.flat();
        setZones(flattenedZones);
      } catch (error) {
        toast.error(t.errors.loadError);
        console.error('Failed to load delivery zones:', error);
      } finally {
        setLoading(false);
      }
    }

    loadZones();
  }, [t, user]);

  // Фильтрация зон по выбранному ресторану
  useEffect(() => {
    if (!selectedRestaurantId) {
      setFilteredZones(zones);
    } else {
      setFilteredZones(zones.filter(zone => zone.restaurantId === selectedRestaurantId));
    }
  }, [selectedRestaurantId, zones]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'minOrder' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleRestaurantChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      restaurantId: value,
    }));
  };

  const handleFilterRestaurantChange = (value: string) => {
    setSelectedRestaurantId(value === "all" ? undefined : value);
  };

  const handleSaveZone = async () => {
    try {
      // Валидация
      if (!formData.polygon) {
        toast.error(t.errors.noPolygon);
        return;
      }

      if (!isPolygonValid) {
        toast.error(t.errors.polygonNotClosed);
        return;
      }

      if (!formData.restaurantId) {
        toast.error(t.errors.noRestaurant);
        return;
      }

      let savedZone: DeliveryZone;
      if (editingZone) {
        savedZone = await DeliveryZoneService.update(editingZone.id, formData);
        setZones(zones.map(z => z.id === savedZone.id ? savedZone : z));
        toast.success(t.errors.updateSuccess);
      } else {
        savedZone = await DeliveryZoneService.create(formData);
        setZones([...zones, savedZone]);
        toast.success(t.errors.createSuccess);
      }

      setOpenDialog(false);
      resetForm();
    } catch (error) {
      toast.error(t.errors.saveError);
      console.error('Failed to save delivery zone:', error);
    }
  };

  const handleEditZone = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setFormData({
      title: zone.title,
      price: zone.price,
      minOrder: zone.minOrder || 0,
      polygon: zone.polygon,
      restaurantId: zone.restaurantId,
    });
    setOpenDialog(true);
  };

  const handleDeleteZone = async (id: string) => {
    try {
      await DeliveryZoneService.remove(id);
      setZones(zones.filter(z => z.id !== id));
      toast.success(t.errors.deleteSuccess);
    } catch (error) {
      toast.error(t.errors.deleteError);
      console.error('Failed to delete delivery zone:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      price: 0,
      minOrder: 0,
      polygon: '',
      restaurantId: user?.restaurant?.[0]?.id || undefined,
    });
    setEditingZone(null);
  };

  const handlePolygonChange = useCallback((polygon: string | null) => {
    setFormData(prev => ({
      ...prev,
      polygon: polygon || '',
    }));
  }, []);

  const getRestaurantName = (restaurantId: string) => {
    return user?.restaurant?.find((r : Restaurant) => r.id === restaurantId)?.title || restaurantId;
  }; 

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
          <Select 
            value={selectedRestaurantId || "all"}
            onValueChange={handleFilterRestaurantChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={t.selectRestaurant} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allRestaurants}</SelectItem>
              {user?.restaurant?.map((rest: Restaurant) => (
                <SelectItem key={rest.id} value={rest.id}>
                  {rest.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={openDialog} onOpenChange={(open) => {
            if (!open) resetForm();
            setOpenDialog(open);
          }}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                {t.createButton}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  {editingZone ? t.dialog.editTitle : t.dialog.createTitle}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    {t.dialog.labels.title}
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    {t.dialog.labels.price}
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="minOrder" className="text-right">
                    {t.dialog.labels.minOrder}
                  </Label>
                  <Input
                    id="minOrder"
                    name="minOrder"
                    type="number"
                    value={formData.minOrder}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="restaurant" className="text-right">
                    {t.dialog.labels.restaurant}
                  </Label>
                  <Select
                    value={formData.restaurantId}
                    onValueChange={handleRestaurantChange}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t.selectRestaurant} />
                    </SelectTrigger>
                    <SelectContent>
                      {user?.restaurant?.map((rest: Restaurant) => (
                        <SelectItem key={rest.id} value={rest.id}>
                          {rest.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="h-96 w-full rounded-md border">
                  <MapEditor 
                    key={editingZone?.id || 'create'}
                    initialPolygon={editingZone?.polygon} 
                    onChange={handlePolygonChange}
                    onValidationChange={setIsPolygonValid}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  {t.dialog.cancelButton}
                </Button>
                <Button 
                  onClick={handleSaveZone}
                  disabled={!isPolygonValid || !formData.title || !formData.restaurantId}
                >
                  {editingZone ? t.dialog.updateButton : t.dialog.createButton}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      ) : filteredZones.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p>{t.noZones}</p>
          <Button 
            className="mt-4" 
            onClick={() => setOpenDialog(true)}
          >
            {t.createButton}
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead>{t.tableHeaders.title}</TableHead>
                <TableHead>{t.tableHeaders.price}</TableHead>
                <TableHead>{t.tableHeaders.minOrder}</TableHead>
                <TableHead>{t.tableHeaders.restaurant}</TableHead>
                <TableHead className="text-right">{t.tableHeaders.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredZones.map(zone => (
                <TableRow key={zone.id}>
                  <TableCell>{zone.title}</TableCell>
                  <TableCell>{zone.price.toFixed(2)}₽</TableCell>
                  <TableCell>
                    {zone.minOrder ? `${zone.minOrder.toFixed(2)}₽` : '-'}
                  </TableCell>
                  <TableCell>{getRestaurantName(zone.restaurantId)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditZone(zone)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteZone(zone.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}