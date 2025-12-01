'use client';

import { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
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
import { debounce } from 'lodash';
import React from 'react';
import { Restaurant } from '@/lib/api/dictionaries.service';

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

const formReducer = (state: CreateDeliveryZoneDto, action: any) => {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_DATA':
      return { ...state, ...action.payload };
    case 'RESET':
      return {
        title: '',
        price: 0,
        minOrder: 0,
        polygon: '',
        restaurantId: action.payload?.defaultRestaurantId,
      };
    default:
      return state;
  }
};

const MemoizedTableRow = React.memo(
  ({ 
    zone, 
    t, 
    getRestaurantName, 
    onEdit, 
    onDelete 
  }: { 
    zone: DeliveryZone;
    t: any;
    getRestaurantName: (id: string) => string;
    onEdit: (zone: DeliveryZone) => void;
    onDelete: (id: string) => void;
  }) => (
    <TableRow>
      <TableCell>{zone.title}</TableCell>
      <TableCell>{zone.price.toFixed(2)}₽</TableCell>
      <TableCell>{zone.minOrder ? `${zone.minOrder.toFixed(2)}₽` : '-'}</TableCell>
      <TableCell>{getRestaurantName(zone.restaurantId)}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(zone)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(zone.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
);

const DeliveryZoneDialogContent = React.memo(
  ({
    formData,
    editingZone,
    isPolygonValid,
    restaurants,
    t,
    onInputChange,
    onRestaurantChange,
    onSave,
    onCancel,
    onPolygonChange,
    onValidationChange,
    defaultRestaurantId,
  }: {
    formData: CreateDeliveryZoneDto;
    editingZone: DeliveryZone | null;
    isPolygonValid: boolean;
    restaurants: Restaurant[];
    t: any;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRestaurantChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
    onPolygonChange: (polygon: string | null) => void;
    onValidationChange: (isValid: boolean) => void;
    defaultRestaurantId?: string;
  }) => {
    const [mapEditorLoaded, setMapEditorLoaded] = useState(false);

    useEffect(() => {
      setMapEditorLoaded(true);
    }, []);

    return (
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
              onChange={onInputChange}
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
              onChange={onInputChange}
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
              onChange={onInputChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="restaurant" className="text-right">
              {t.dialog.labels.restaurant}
            </Label>
            <Select
              value={formData.restaurantId || ''}
              onValueChange={onRestaurantChange}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t.selectRestaurant} />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((rest) => (
                  <SelectItem key={rest.id} value={rest.id}>
                    {rest.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="h-96 w-full rounded-md border">
            {mapEditorLoaded && (
              <MapEditor 
                key={editingZone?.id || 'create'}
                initialPolygon={editingZone?.polygon} 
                onChange={onPolygonChange}
                onValidationChange={onValidationChange}
              />
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t.dialog.cancelButton}
          </Button>
          <Button 
            onClick={onSave}
            disabled={!isPolygonValid || !formData.title || !formData.restaurantId}
          >
            {editingZone ? t.dialog.updateButton : t.dialog.createButton}
          </Button>
        </div>
      </DialogContent>
    );
  }
);

export default function DeliveryZonePage() {
  const { language } = useLanguageStore();
  const t = translations[language];
  const { user } = useAuth();
  const router = useRouter();
  
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [filteredZones, setFilteredZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | undefined>(undefined);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [isPolygonValid, setIsPolygonValid] = useState(false);
  
  const defaultRestaurantId = user?.restaurant?.[0]?.id;
  const [formData, dispatch] = useReducer(formReducer, {
    title: '',
    price: 0,
    minOrder: 0,
    polygon: '',
    restaurantId: defaultRestaurantId,
  });

  const restaurants = user?.restaurant || [];

  const loadZones = useCallback(async () => {
    try {
      setLoading(true);
      if (!restaurants.length) return;
      
      const allZones = await Promise.all(
        restaurants.map((rest : Restaurant) => 
          DeliveryZoneService.findAllByRestaurant(rest.id)
        )
      );
      
      setZones(allZones.flat());
    } catch (error) {
      toast.error(t.errors.loadError);
    } finally {
      setLoading(false);
    }
  }, [restaurants, t]);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  useEffect(() => {
    if (!selectedRestaurantId) {
      setFilteredZones(zones);
    } else {
      setFilteredZones(zones.filter(zone => zone.restaurantId === selectedRestaurantId));
    }
  }, [selectedRestaurantId, zones]);

  const debouncedInputChange = useMemo(
    () => debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const processedValue = name === 'price' || name === 'minOrder' 
        ? parseFloat(value) || 0 
        : value;
      dispatch({ type: 'UPDATE_FIELD', field: name, value: processedValue });
    }, 150),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    debouncedInputChange(e);
  };

  const handleRestaurantChange = (value: string) => {
    dispatch({ type: 'UPDATE_FIELD', field: 'restaurantId', value });
  };

  const handleFilterRestaurantChange = (value: string) => {
    setSelectedRestaurantId(value === "all" ? undefined : value);
  };

  const handleSaveZone = async () => {
    try {
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
    }
  };

  const handleEditZone = (zone: DeliveryZone) => {
    setEditingZone(zone);
    dispatch({
      type: 'SET_DATA',
      payload: {
        title: zone.title,
        price: zone.price,
        minOrder: zone.minOrder || 0,
        polygon: zone.polygon,
        restaurantId: zone.restaurantId,
      }
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
    }
  };

  const resetForm = () => {
    dispatch({ 
      type: 'RESET', 
      payload: { defaultRestaurantId } 
    });
    setEditingZone(null);
  };

  const handlePolygonChange = useCallback((polygon: string | null) => {
    dispatch({ 
      type: 'UPDATE_FIELD', 
      field: 'polygon', 
      value: polygon || '' 
    });
  }, []);

  const getRestaurantName = (restaurantId: string) => {
    return restaurants.find((r : Restaurant) => r.id === restaurantId)?.title || restaurantId;
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
              {restaurants.map((rest : Restaurant) => (
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
            <DeliveryZoneDialogContent
              formData={formData}
              editingZone={editingZone}
              isPolygonValid={isPolygonValid}
              restaurants={restaurants}
              t={t}
              onInputChange={handleInputChange}
              onRestaurantChange={handleRestaurantChange}
              onSave={handleSaveZone}
              onCancel={() => setOpenDialog(false)}
              onPolygonChange={handlePolygonChange}
              onValidationChange={setIsPolygonValid}
              defaultRestaurantId={defaultRestaurantId}
            />
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
          <Button className="mt-4" onClick={() => setOpenDialog(true)}>
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
                <MemoizedTableRow
                  key={zone.id}
                  zone={zone}
                  t={t}
                  getRestaurantName={getRestaurantName}
                  onEdit={handleEditZone}
                  onDelete={handleDeleteZone}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}