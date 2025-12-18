'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  DeliveryZoneService, 
  DeliveryZone, 
  CreateDeliveryZoneDto,
  DEFAULT_ZONE_COLORS
} from '@/lib/api/delivery-zone.service';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useLanguageStore } from '@/lib/stores/language-store';
import { Trash2, Edit, GripVertical, Eye, EyeOff } from 'lucide-react';
import { HexColorPicker } from "react-colorful";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { YandexMapEditor } from '../YandexMapEditor';

const translations = {
  ru: {
    title: 'Зоны доставки',
    createButton: 'Создать новую зону',
    noZones: 'Зоны доставки не найдены. Создайте первую!',
    tableHeaders: {
      title: 'Название',
      price: 'Стоимость доставки',
      minOrder: 'Мин. заказ',
      color: 'Цвет',
      priority: 'Приоритет',
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
        color: 'Цвет зоны',
        priority: 'Приоритет',
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
      orderUpdateSuccess: 'Порядок зон обновлен',
      orderUpdateError: 'Ошибка изменения порядка',
    },
    map: {
      viewAllZones: 'Зоны',
      createZone: 'Создание зоны',
      editZone: 'Редактирование зоны',
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
      color: 'ფერი',
      priority: 'პრიორიტეტი',
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
        color: 'ზონის ფერი',
        priority: 'პრიორიტეტი',
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
      orderUpdateSuccess: 'ზონების რიგი განახლდა',
      orderUpdateError: 'რიგის შეცვლის შეცდომა',
    },
    map: {
      viewAllZones: 'ყველა ზონის ნახვა',
      createZone: 'ზონის შექმნა',
      editZone: 'ზონის რედაქტირება',
    },
    priority: {
      high: 'მაღალი',
      medium: 'საშუალო',
      low: 'დაბალი',
    }
  },
};

// Sortable Item Component
const SortableZoneItem = ({ 
  zone, 
  t, 
  onEdit, 
  onDelete 
}: { 
  zone: DeliveryZone;
  t: any;
  onEdit: (zone: DeliveryZone) => void;
  onDelete: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: zone.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <div {...attributes} {...listeners} className="cursor-grab inline-flex mr-2">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        {zone.title}
      </TableCell>
      <TableCell>{zone.price.toFixed(2)}₽</TableCell>
      <TableCell>{zone.minOrder ? `${zone.minOrder.toFixed(2)}₽` : '-'}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded border"
            style={{ backgroundColor: zone.color }}
          />
          <span className="text-sm">{zone.color}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={zone.priority >= 7 ? "destructive" : zone.priority >= 3 ? "default" : "secondary"}>
          {zone.priority}
        </Badge>
      </TableCell>
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
  );
};

// Color Picker Component
const ColorPickerField = ({ 
  value, 
  onChange,
  label 
}: { 
  value: string;
  onChange: (color: string) => void;
  label: string;
}) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div 
          className="w-12 h-12 rounded border cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => setShowPicker(!showPicker)}
        />
        <Input 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
          placeholder="#000000"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPicker(!showPicker)}
        >
          {showPicker ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      
      {showPicker && (
        <div className="space-y-2">
          <HexColorPicker color={value} onChange={onChange} />
          <div className="flex flex-wrap gap-1">
            {DEFAULT_ZONE_COLORS.map(color => (
              <div
                key={color}
                className="w-6 h-6 rounded cursor-pointer border"
                style={{ backgroundColor: color }}
                onClick={() => onChange(color)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Delivery Zone Form Dialog
const DeliveryZoneDialog = ({
  open,
  onOpenChange,
  editingZone,
  setEditingZone,
  zones,
  t,
  onSave,
  onCancel
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingZone: DeliveryZone | null;
  zones: DeliveryZone[];
  setEditingZone: (zone: DeliveryZone | null) => void; 
  t: any;
  onSave: (data: CreateDeliveryZoneDto) => Promise<void>;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<CreateDeliveryZoneDto>({
    title: '',
    price: 0,
    minOrder: 0,
    polygon: '',
    color: DEFAULT_ZONE_COLORS[0],
    priority: 0,
  });
  const [isPolygonValid, setIsPolygonValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Функция для получения зон, которые нужно отобразить на карте
  const getZonesToDisplay = useMemo(() => {
    if (editingZone) {
      // При редактировании показываем все зоны КРОМЕ редактируемой
      return zones.filter(z => z.id !== editingZone.id);
    } else {
      // При создании новой зоны показываем все существующие зоны
      return zones;
    }
  }, [zones, editingZone]);

  useEffect(() => {
    if (editingZone) {
      setFormData({
        title: editingZone.title,
        price: editingZone.price,
        minOrder: editingZone.minOrder || 0,
        polygon: editingZone.polygon,
        color: editingZone.color,
        priority: editingZone.priority,
      });
      setIsPolygonValid(true);
    } else {
      setFormData({
        title: '',
        price: 0,
        minOrder: 0,
        polygon: '',
        color: DEFAULT_ZONE_COLORS[0],
        priority: zones.length,
      });
      setIsPolygonValid(false);
    }
  }, [editingZone, zones.length]);

  const handleSave = async () => {
    if (!formData.polygon) {
      toast.error(t.errors.noPolygon);
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Введите название зоны');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      price: 0,
      minOrder: 0,
      polygon: '',
      color: DEFAULT_ZONE_COLORS[0],
      priority: zones.length,
    });
    setIsPolygonValid(false);
    setEditingZone(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {editingZone ? t.dialog.editTitle : t.dialog.createTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t.dialog.labels.title} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Введите название зоны"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">{t.dialog.labels.price} *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minOrder">{t.dialog.labels.minOrder}</Label>
              <Input
                id="minOrder"
                type="number"
                min="0"
                step="0.01"
                value={formData.minOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, minOrder: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">{t.dialog.labels.priority}</Label>
              <Input
                id="priority"
                type="number"
                min="0"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-gray-500">
                Чем выше число, тем выше приоритет (0-10)
              </p>
            </div>
          </div>

          <ColorPickerField
            value={formData.color!}
            onChange={(color) => setFormData(prev => ({ ...prev, color }))}
            label={t.dialog.labels.color}
          />

          <div className="space-y-2">
            <Label>
              {editingZone ? t.map.editZone : t.map.createZone} *
            </Label>
            <div className="text-sm text-gray-500 mb-2">
              {editingZone 
                ? 'Перетаскивайте точки для изменения зоны' 
                : 'Нарисуйте новую зону доставки на карте'
              }
            </div>
            <YandexMapEditor
              zones={getZonesToDisplay}
              initialPolygon={editingZone?.polygon}
              onChange={(polygon) => setFormData(prev => ({ ...prev, polygon: polygon || '' }))}
              onValidationChange={setIsPolygonValid}
              interactive={true}
              height={300}
            />
            {!isPolygonValid && (
              <p className="text-sm text-red-500">
                {t.errors.noPolygon}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            {t.dialog.cancelButton}
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!isPolygonValid || !formData.title.trim() || isLoading}
          >
            {isLoading ? 'Сохранение...' : (editingZone ? t.dialog.updateButton : t.dialog.createButton)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
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
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadZones = useCallback(async () => {
    try {
      setLoading(true);
      const zonesData = await DeliveryZoneService.findAllByRestaurant(restaurantId);
      console.log('zones', zonesData)
      const sortedZones = zonesData.sort((a, b) => b.priority - a.priority);
      setZones(sortedZones);
    } catch (error) {
      toast.error(t.errors.loadError);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, t]);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  const handleSaveZone = async (formData: CreateDeliveryZoneDto) => {
    try {
      const dataToSave = {
        ...formData,
        restaurantId,
      };

      if (editingZone) {
        await DeliveryZoneService.update(editingZone.id, dataToSave);
        toast.success(t.errors.updateSuccess);
      } else {
        await DeliveryZoneService.create(dataToSave);
        toast.success(t.errors.createSuccess);
      }

      // Перезагружаем данные после успешного сохранения
      await loadZones();
      
      setOpenDialog(false);
      setEditingZone(null);
    } catch (error) {
      toast.error(t.errors.saveError);
      throw error;
    }
  };

  const handleEditZone = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setOpenDialog(true);
  };

  const handleDeleteZone = async (id: string) => {
    try {
      await DeliveryZoneService.remove(id);
      toast.success(t.errors.deleteSuccess);
      // Перезагружаем данные после успешного удаления
      await loadZones();
    } catch (error) {
      toast.error(t.errors.deleteError);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = zones.findIndex(zone => zone.id === active.id);
      const newIndex = zones.findIndex(zone => zone.id === over.id);

      const reorderedZones = arrayMove(zones, oldIndex, newIndex);
      
      // Обновляем приоритеты на основе позиции (выше в списке = выше приоритет)
      const updatedZones = reorderedZones.map((zone, index) => ({
        ...zone,
        priority: reorderedZones.length - index
      }));

      setZones(updatedZones);

      try {
        const zoneIds = updatedZones.map(zone => zone.id);
        await DeliveryZoneService.reorderPriorities(restaurantId, zoneIds);
        toast.success(t.errors.orderUpdateSuccess);
        // Перезагружаем данные после успешного изменения порядка
        await loadZones();
      } catch (error) {
        // Откатываем изменения при ошибке
        setZones(zones);
        toast.error(t.errors.orderUpdateError);
      }
    }
  };

  const resetForm = () => {
    setEditingZone(null);
    setOpenDialog(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <p>Загрузка...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <CardTitle className="text-xl">{t.title}</CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="flex-1 sm:flex-none"
              >
                {t.map.viewAllZones}
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex-1 sm:flex-none"
              >
                Список
              </Button>
            </div>
            
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  onClick={() => setEditingZone(null)}
                  className="w-full sm:w-auto"
                >
                  {t.createButton}
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {viewMode === 'map' ? (
          // Режим просмотра карты
          <div className="space-y-4">
            <YandexMapEditor
              zones={zones}
              interactive={false}
              center={[55.753960, 37.620393]}
              zoom={10}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {zones.map(zone => (
                <Card key={zone.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: zone.color }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{zone.title}</h4>
                      <p className="text-sm text-gray-600">
                        Доставка: {zone.price}₽ • Мин: {zone.minOrder || 0}₽
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditZone(zone)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          // Режим списка с Drag & Drop
          <div className="space-y-4">
            {zones.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <p>{t.noZones}</p>
                <Button className="mt-4" size="sm" onClick={() => setOpenDialog(true)}>
                  {t.createButton}
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <Table>
                    <TableHeader className="bg-gray-100">
                      <TableRow>
                        <TableHead>{t.tableHeaders.title}</TableHead>
                        <TableHead>{t.tableHeaders.price}</TableHead>
                        <TableHead>{t.tableHeaders.minOrder}</TableHead>
                        <TableHead>{t.tableHeaders.color}</TableHead>
                        <TableHead>{t.tableHeaders.priority}</TableHead>
                        <TableHead className="text-right">{t.tableHeaders.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <SortableContext items={zones.map(z => z.id)} strategy={verticalListSortingStrategy}>
                        {zones.map(zone => (
                          <SortableZoneItem
                            key={zone.id}
                            zone={zone}
                            t={t}
                            onEdit={handleEditZone}
                            onDelete={handleDeleteZone}
                          />
                        ))}
                      </SortableContext>
                    </TableBody>
                  </Table>
                </DndContext>
              </div>
            )}
          </div>
        )}
        <DeliveryZoneDialog
          open={openDialog}
          onOpenChange={(open) => {
            setOpenDialog(open);
            if (!open) {
              setEditingZone(null);
            }
          }}
          editingZone={editingZone}
          zones={zones}
          t={t}
          onSave={handleSaveZone}
          setEditingZone={setEditingZone}
          onCancel={resetForm}
        />
      </CardContent>
    </Card>
  );
}