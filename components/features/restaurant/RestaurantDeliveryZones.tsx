'use client';

import { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
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
import { Trash2, Edit } from 'lucide-react';
import { Restaurant } from '@/components/features/staff/StaffTable';
import { debounce } from 'lodash';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MapEditor = dynamic(() => import('@/components/features/MapEditor'), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
});

const translations = {
  ru: {
    title: 'Зоны доставки',
    createButton: 'Создать новую зону',
    noZones: 'Зоны доставки не найдены. Создайте первую!',
    tableHeaders: {
      title: 'Название',
      price: 'Стоимость доставки',
      minOrder: 'Мин. заказ',
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
      },
      cancelButton: 'Отмена',
      saveButton: 'Сохранить',
      createButton: 'Создать',
      updateButton: 'Обновить',
    },
    errors: {
      noPolygon: 'Пожалуйста, нарисуйте зону доставки на карте',
      polygonNotClosed: 'Полигон должен быть замкнут',
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
    tableHeaders: {
      title: 'სახელი',
      price: 'მიტანის ღირებულება',
      minOrder: 'მინიმალური შეკვეთა',
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
      },
      cancelButton: 'გაუქმება',
      saveButton: 'შენახვა',
      createButton: 'შექმნა',
      updateButton: 'განახლება',
    },
    errors: {
      noPolygon: 'გთხოვთ დახაზოთ მიტანის ზონა რუკაზე',
      polygonNotClosed: 'პოლიგონი უნდა იყოს დახურული',
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
        restaurantId: action.payload?.restaurantId,
      };
    default:
      return state;
  }
};

const MemoizedTableRow = React.memo(
  ({ 
    zone, 
    t, 
    onEdit, 
    onDelete 
  }: { 
    zone: DeliveryZone;
    t: any;
    onEdit: (zone: DeliveryZone) => void;
    onDelete: (id: string) => void;
  }) => (
    <TableRow>
      <TableCell>{zone.title}</TableCell>
      <TableCell>{zone.price.toFixed(2)}₽</TableCell>
      <TableCell>{zone.minOrder ? `${zone.minOrder.toFixed(2)}₽` : '-'}</TableCell>
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
    t,
    onInputChange,
    onSave,
    onCancel,
    onPolygonChange,
    onValidationChange,
  }: {
    formData: CreateDeliveryZoneDto;
    editingZone: DeliveryZone | null;
    isPolygonValid: boolean;
    t: any;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSave: () => void;
    onCancel: () => void;
    onPolygonChange: (polygon: string | null) => void;
    onValidationChange: (isValid: boolean) => void;
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
            disabled={!isPolygonValid || !formData.title}
          >
            {editingZone ? t.dialog.updateButton : t.dialog.createButton}
          </Button>
        </div>
      </DialogContent>
    );
  }
);

interface RestaurantDeliveryZonesProps {
  restaurantId: string;
  restaurantName: string;
}

export function RestaurantDeliveryZones({ restaurantId, restaurantName }: RestaurantDeliveryZonesProps) {
  const { language } = useLanguageStore();
  const t = translations[language];
  
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [isPolygonValid, setIsPolygonValid] = useState(false);
  
  const [formData, dispatch] = useReducer(formReducer, {
    title: '',
    price: 0,
    minOrder: 0,
    polygon: '',
    restaurantId: restaurantId,
  });

  const loadZones = useCallback(async () => {
    try {
      setLoading(true);
      const zonesData = await DeliveryZoneService.findAllByRestaurant(restaurantId);
      setZones(zonesData);
    } catch (error) {
      toast.error(t.errors.loadError);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, t]);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

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
      payload: { restaurantId } 
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{t.title}</span>
          <Dialog open={openDialog} onOpenChange={(open) => {
            if (!open) resetForm();
            setOpenDialog(open);
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                {t.createButton}
              </Button>
            </DialogTrigger>
            <DeliveryZoneDialogContent
              formData={formData}
              editingZone={editingZone}
              isPolygonValid={isPolygonValid}
              t={t}
              onInputChange={handleInputChange}
              onSave={handleSaveZone}
              onCancel={() => setOpenDialog(false)}
              onPolygonChange={handlePolygonChange}
              onValidationChange={setIsPolygonValid}
            />
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <p>Loading...</p>
          </div>
        ) : zones.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <p>{t.noZones}</p>
            <Button className="mt-4" size="sm" onClick={() => setOpenDialog(true)}>
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
                  <TableHead className="text-right">{t.tableHeaders.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map(zone => (
                  <MemoizedTableRow
                    key={zone.id}
                    zone={zone}
                    t={t}
                    onEdit={handleEditZone}
                    onDelete={handleDeleteZone}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}