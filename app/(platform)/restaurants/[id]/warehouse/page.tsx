'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { WarehouseService } from '@/lib/api/warehouse.service';
import { useLanguageStore } from '@/lib/stores/language-store';
import { TranslationKey, warehouseTranslations } from './translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionsTable } from '@/components/features/warehouse/TransactionsTable';
import { Refrigerator, Package, ArrowLeftRight, CalendarDays, ChefHat, List, Plus, Trash2, Edit, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import SearchableSelect from '@/components/features/menu/product/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

// Типы для данных
interface InventoryItemWithRelations extends InventoryItem {
  warehouseItems: WarehouseItem[];
  ingredients: any[];
  premixIgredients: any[];
}

interface PremixWithRelations extends Premix {
  ingredients: {
    inventoryItemId: string;
    quantity: number;
    inventoryItem: InventoryItem;
  }[];
  inventoryItem?: InventoryItem;
}

interface WarehouseWithRelations {
  id: string;
  name: string;
  description: string | null;
  restaurantId: string;
  storageLocations: StorageLocation[];
  warehouseItems: (WarehouseItem & {
    inventoryItem: InventoryItem;
    storageLocation: StorageLocation | null;
  })[];
}

export default function WarehousePage() {
  const params = useParams();
  const { language } = useLanguageStore();
  const t = (key: TranslationKey) => {
    const translation = warehouseTranslations[key];
    return translation?.[language as 'ru' | 'en'] || translation?.ru || key;
  };
  const restaurantId = params.id as string;

  // Состояния для данных
  const [warehouse, setWarehouse] = useState<WarehouseWithRelations | null>(null);
  const [items, setItems] = useState<InventoryItemWithRelations[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItemWithRelations[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [premixes, setPremixes] = useState<PremixWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items');
  const [locationFilter, setLocationFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Фильтрация по дате
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [dateFilterOpen, setDateFilterOpen] = useState(false);

  // Формы
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    unit: 'kg',
    cost: 0,
  });
  const [itemErrors, setItemErrors] = useState({
    name: '',
    unit: '',
  });

  const [newLocation, setNewLocation] = useState({
    name: '',
    code: '',
    description: '',
  });
  const [locationErrors, setLocationErrors] = useState({
    name: '',
  });

  // Диалоги транзакций
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'receipt' | 'writeoff'>('receipt');
  const [currentItem, setCurrentItem] = useState<InventoryItemWithRelations | null>(null);
  const [currentWarehouseItem, setCurrentWarehouseItem] = useState<WarehouseItem | null>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLInputElement>(null);

  // Редактирование
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemWithRelations | null>(null);
  const [editItemData, setEditItemData] = useState({
    name: '',
    description: '',
    unit: 'kg',
    cost: 0,
  });
  const [editItemErrors, setEditItemErrors] = useState({
    name: '',
  });

  // Управление складскими позициями
  const [warehouseItemDialogOpen, setWarehouseItemDialogOpen] = useState(false);
  const [warehouseItemData, setWarehouseItemData] = useState({
    warehouseId: '',
    inventoryItemId: '',
    storageLocationId: '',
    quantity: 0,
    minQuantity: 0,
  });

  // Премиксы
  const [newPremix, setNewPremix] = useState({
    name: '',
    description: '',
    unit: 'kg',
    yield: 1,
  });
  const [premixErrors, setPremixErrors] = useState({
    name: '',
    unit: '',
  });
  const [selectedPremix, setSelectedPremix] = useState<PremixWithRelations | null>(null);
  const [premixIngredients, setPremixIngredients] = useState<any[]>([]);
  const [newIngredient, setNewIngredient] = useState({
    inventoryItemId: '',
    quantity: 0,
  });
  const [prepareQuantity, setPrepareQuantity] = useState(1);
  const [prepareDialogOpen, setPrepareDialogOpen] = useState(false);
  const [editPremixDialogOpen, setEditPremixDialogOpen] = useState(false);
  const [editingPremix, setEditingPremix] = useState<PremixWithRelations | null>(null);
  const [editPremixData, setEditPremixData] = useState({
    name: '',
    description: '',
    unit: 'kg',
    yield: 1,
  });
  const [editPremixErrors, setEditPremixErrors] = useState({
    name: '',
    unit: '',
  });

  // Загрузка данных
  useEffect(() => {
    loadWarehouseData();
  }, [restaurantId]);

  useEffect(() => {
    if (warehouse?.id) {
      setWarehouseItemData(prev => ({ ...prev, warehouseId: warehouse.id }));
    }
  }, [warehouse]);

  useEffect(() => {
    let filtered = items;
    
    if (locationFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.warehouseItems.some(wi => wi.storageLocationId === locationFilter)
      );
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredItems(filtered);
  }, [items, locationFilter, searchTerm]);

  const loadWarehouseData = async () => {
    try {
      setLoading(true);
      const warehouseData = await WarehouseService.getRestaurantWarehouse(restaurantId);
      setWarehouse(warehouseData);

      const inventoryItems = await WarehouseService.listInventoryItems();
      setItems(inventoryItems || []);

      const storageLocations = await WarehouseService.listStorageLocations(warehouseData.id);
      setLocations(storageLocations || []);

      const premixesData = await WarehouseService.listPremixes();
      setPremixes(premixesData || []);
    } catch (error) {
      console.error('Failed to load warehouse data:', error);
      toast.error(t('loadError'));
      setItems([]);
      setLocations([]);
      setPremixes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPremixDetails = async (premixId: string) => {
    try {
      const details = await WarehouseService.getPremix(premixId);
      setSelectedPremix(details);
      setPremixIngredients(details.ingredients || []);
    } catch (error) {
      console.error('Failed to load premix details:', error);
      toast.error(t('loadError'));
    }
  };

  // Валидация форм
  const validateItem = () => {
    const newErrors = { name: '', unit: '' };
    let isValid = true;

    if (!newItem.name.trim()) {
      newErrors.name = t('nameRequired');
      isValid = false;
    }

    if (!newItem.unit) {
      newErrors.unit = t('unitRequired');
      isValid = false;
    }

    setItemErrors(newErrors);
    return isValid;
  };

  const validateLocation = () => {
    const newErrors = { name: '' };
    let isValid = true;

    if (!newLocation.name.trim()) {
      newErrors.name = t('nameRequired');
      isValid = false;
    }

    setLocationErrors(newErrors);
    return isValid;
  };

  const validatePremix = () => {
    const newErrors = { name: '', unit: '' };
    let isValid = true;

    if (!newPremix.name.trim()) {
      newErrors.name = t('nameRequired');
      isValid = false;
    }

    if (!newPremix.unit) {
      newErrors.unit = t('unitRequired');
      isValid = false;
    }

    setPremixErrors(newErrors);
    return isValid;
  };

  // Обработчики для добавления данных
  const handleAddItem = async () => {
    if (!validateItem()) return;

    try {
      await WarehouseService.createInventoryItem({
        name: newItem.name,
        description: newItem.description,
        unit: newItem.unit,
        cost: newItem.cost,
      });
      
      await loadWarehouseData();
      setNewItem({ name: '', description: '', unit: 'kg', cost: 0 });
      toast.success(t('itemAdded'));
    } catch (error: any) {
      console.error('Failed to add item:', error);
      toast.error(error.response?.data?.message || t('addItemError'));
    }
  };

  const handleAddLocation = async () => {
    if (!validateLocation()) return;

    try {
      await WarehouseService.createStorageLocation(warehouse!.id, newLocation);
      await loadWarehouseData();
      setNewLocation({ name: '', code: '', description: '' });
      toast.success(t('locationAdded'));
    } catch (error: any) {
      console.error('Failed to add location:', error);
      toast.error(error.response?.data?.message || t('addLocationError'));
    }
  };

  const handleAddPremix = async () => {
    if (!validatePremix()) return;

    try {
      const dto = {
        ...newPremix,
        ingredients: premixIngredients.map(ing => ({
          inventoryItemId: ing.inventoryItemId,
          quantity: ing.quantity
        })),
      };

      await WarehouseService.createPremix(dto);
      await loadWarehouseData();

      setNewPremix({ name: '', description: '', unit: 'kg', yield: 1 });
      setPremixIngredients([]);
      toast.success(t('premixAdded'));
    } catch (error: any) {
      console.error('Failed to add premix:', error);
      toast.error(error.response?.data?.message || t('addPremixError'));
    }
  };

  // Управление ингредиентами премиксов
  const handleAddIngredient = () => {
    if (!newIngredient.inventoryItemId || newIngredient.quantity <= 0) {
      toast.error(t('fillAllFields'));
      return;
    }

    setPremixIngredients([
      ...premixIngredients,
      {
        inventoryItemId: newIngredient.inventoryItemId,
        quantity: newIngredient.quantity
      }
    ]);

    setNewIngredient({ inventoryItemId: '', quantity: 0 });
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = [...premixIngredients];
    newIngredients.splice(index, 1);
    setPremixIngredients(newIngredients);
  };

  // Транзакции
  const handleOpenTransactionDialog = (item: InventoryItemWithRelations, warehouseItem: WarehouseItem) => {
    setCurrentItem(item);
    setCurrentWarehouseItem(warehouseItem);
    setTransactionDialogOpen(true);
    setTransactionType('receipt');
  };

  const handleSubmitTransaction = async () => {
    if (!currentItem || !currentWarehouseItem || !quantityRef.current) return;

    const quantity = Number(quantityRef.current.value);
    const reason = reasonRef.current?.value || '';

    if (quantity <= 0) {
      toast.error(t('quantityPositive'));
      return;
    }

    try {
      await WarehouseService.createTransaction({
        inventoryItemId: currentItem.id,
        type: transactionType === 'receipt' ? 'RECEIPT' : 'WRITE_OFF',
        warehouseId: warehouse!.id,
        quantity,
        reason,
      });

      await loadWarehouseData();
      setTransactionDialogOpen(false);
      toast.success(transactionType === 'receipt' ? t('receiptSuccess') : t('writeOffSuccess'));
    } catch (error: any) {
      console.error('Transaction error:', error);
      toast.error(error.response?.data?.message || t('transactionError'));
    }
  };

  // Редактирование
  const handleOpenEditDialog = (item: InventoryItemWithRelations) => {
    setEditingItem(item);
    setEditItemData({
      name: item.name,
      description: item.description || '',
      unit: item.unit,
      cost: item.cost || 0,
    });
    setEditItemDialogOpen(true);
  };

  const handleSaveItemChanges = async () => {
    if (!validateEditItem() || !editingItem) return;

    try {
      await WarehouseService.updateInventoryItem(editingItem.id, editItemData);
      await loadWarehouseData();
      setEditItemDialogOpen(false);
      toast.success(t('itemUpdated'));
    } catch (error: any) {
      console.error('Failed to update item:', error);
      toast.error(error.response?.data?.message || t('updateItemError'));
    }
  };

  // Управление складскими позициями
  const handleOpenWarehouseItemDialog = (item: InventoryItemWithRelations) => {
    setCurrentItem(item);
    setWarehouseItemData({
      warehouseId: warehouse!.id,
      inventoryItemId: item.id,
      storageLocationId: '',
      quantity: 0,
      minQuantity: 0,
    });
    setWarehouseItemDialogOpen(true);
  };

  const handleAddWarehouseItem = async () => {
    try {
      await WarehouseService.createWarehouseItem({
        ...warehouseItemData,
        storageLocationId: warehouseItemData.storageLocationId || undefined,
      });
      await loadWarehouseData();
      setWarehouseItemDialogOpen(false);
      toast.success(t('itemAddedToWarehouse'));
    } catch (error: any) {
      console.error('Failed to add warehouse item:', error);
      toast.error(error.response?.data?.message || t('addItemError'));
    }
  };

  // Премиксы
  const handlePreparePremix = async () => {
    if (!selectedPremix || prepareQuantity <= 0) {
      toast.error(t('invalidQuantity'));
      return;
    }

    try {
      await WarehouseService.preparePremix(selectedPremix.id, prepareQuantity);
      toast.success(t('premixPrepared'));
      await loadWarehouseData();
      setPrepareDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to prepare premix:', error);
      toast.error(error.response?.data?.message || t('preparePremixError'));
    }
  };

  const handleOpenEditPremixDialog = (premix: PremixWithRelations) => {
    setEditingPremix(premix);
    setEditPremixData({
      name: premix.name,
      description: premix.description || '',
      unit: premix.unit,
      yield: premix.yield,
    });
    setPremixIngredients(premix.ingredients || []);
    setEditPremixDialogOpen(true);
  };

  const handleSavePremixChanges = async () => {
    if (!validateEditPremix() || !editingPremix) return;

    try {
      // Обновляем базовую информацию
      await WarehouseService.updatePremix(editingPremix.id, editPremixData);

      // Обновляем ингредиенты
      const currentIngredients = editingPremix.ingredients || [];
      
      // Удаляем удаленные ингредиенты
      for (const currentIng of currentIngredients) {
        if (!premixIngredients.some(ing => 
          ing.inventoryItemId === currentIng.inventoryItemId
        )) {
          await WarehouseService.removePremixIngredient(
            editingPremix.id, 
            currentIng.inventoryItemId
          );
        }
      }

      // Добавляем или обновляем ингредиенты
      for (const ing of premixIngredients) {
        const existingIng = currentIngredients.find(
          (i: any) => i.inventoryItemId === ing.inventoryItemId
        );

        if (existingIng) {
          await WarehouseService.updatePremixIngredient(
            editingPremix.id, 
            ing.inventoryItemId, 
            ing.quantity
          );
        } else {
          await WarehouseService.addPremixIngredient(editingPremix.id, {
            inventoryItemId: ing.inventoryItemId,
            quantity: ing.quantity
          });
        }
      }

      await loadWarehouseData();
      setEditPremixDialogOpen(false);
      toast.success(t('premixUpdated'));
    } catch (error: any) {
      console.error('Failed to update premix:', error);
      toast.error(error.response?.data?.message || t('updatePremixError'));
    }
  };

  // Загрузка транзакций
  const loadItemTransactions = async (itemId: string) => {
    try {
      const data = await WarehouseService.getItemTransactions(itemId);
      setTransactions(data);
      setActiveTab('transactions');
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error(t('loadTransactionsError'));
    }
  };

  const loadWarehouseTransactions = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    try {
      const data = await WarehouseService.getWarehouseTransactions(warehouse!.id, {
        startDate: dateRange.from,
        endDate: dateRange.to,
      });
      setTransactions(data);
      setActiveTab('transactions');
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error(t('loadTransactionsError'));
    }
  };

  // Фильтрация по дате
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setDateFilterOpen(false);
      loadWarehouseTransactions();
    }
  };

  // Загрузка скелетона
  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!warehouse) {
    return <div className="p-4">{t('warehouseNotFound')}</div>;
  }

  return (
    <div className="p-4 space-y-6">
      {/* Заголовок и кнопки действий */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{warehouse.name}</h1>
          {warehouse.description && (
            <p className="text-sm text-muted-foreground">{warehouse.description}</p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Refrigerator className="h-4 w-4" />
                {t('addLocation')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('addLocation')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t('name')}*</Label>
                  <Input
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  />
                  {locationErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{locationErrors.name}</p>
                  )}
                </div>
                <div>
                  <Label>{t('code')}</Label>
                  <Input
                    value={newLocation.code}
                    onChange={(e) => setNewLocation({ ...newLocation, code: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t('description')}</Label>
                  <Textarea
                    value={newLocation.description}
                    onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddLocation}>{t('addLocation')}</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t('addItem')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('addItem')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t('name')}*</Label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                  {itemErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{itemErrors.name}</p>
                  )}
                </div>
                <div>
                  <Label>{t('description')}</Label>
                  <Textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t('unit')}*</Label>
                  <Select
                    value={newItem.unit}
                    onValueChange={(value) => setNewItem({ ...newItem, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('unit')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="l">l</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="pcs">pcs</SelectItem>
                    </SelectContent>
                  </Select>
                  {itemErrors.unit && (
                    <p className="text-sm text-red-500 mt-1">{itemErrors.unit}</p>
                  )}
                </div>
                <div>
                  <Label>{t('cost')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.cost}
                    onChange={(e) => setNewItem({ ...newItem, cost: Number(e.target.value) })}
                  />
                </div>
                <Button onClick={handleAddItem}>{t('addItem')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Табы для навигации */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {t('inventory')}
            </div>
          </TabsTrigger>
          <TabsTrigger value="locations">
            <div className="flex items-center gap-2">
              <Refrigerator className="h-4 w-4" />
              {t('locations')}
            </div>
          </TabsTrigger>
          <TabsTrigger value="premixes">
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              {t('premixes')}
            </div>
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              {t('transactions')}
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Контент табов */}
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <CardTitle>{t('inventory')}</CardTitle>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                  <Input
                    placeholder={t('searchItems')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-64"
                  />
                  <Select
                    value={locationFilter}
                    onValueChange={setLocationFilter}
                  >
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder={t('filterByLocation')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allLocations')}</SelectItem>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} {location.code && `(${location.code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('noItemsFound')}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('name')}</TableHead>
                        <TableHead>{t('quantity')}</TableHead>
                        <TableHead>{t('unit')}</TableHead>
                        <TableHead>{t('location')}</TableHead>
                        <TableHead className="text-right">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => {
                        const warehouseItem = item.warehouseItems.find(wi => wi.warehouseId === warehouse.id);
                        const quantity = warehouseItem?.quantity || 0;
                        const minQuantity = warehouseItem?.minQuantity || 0;
                        const location = warehouseItem?.storageLocationId 
                          ? locations.find(l => l.id === warehouseItem.storageLocationId)
                          : null;

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {item.name}
                                {quantity <= minQuantity && minQuantity > 0 && (
                                  <Badge variant="destructive">{t('lowStock')}</Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {quantity.toFixed(2)}
                                {minQuantity > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    / {minQuantity.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>
                              {location ? (
                                <div className="flex items-center gap-2">
                                  {location.name}
                                  {location.code && (
                                    <Badge variant="outline">{location.code}</Badge>
                                  )}
                                </div>
                              ) : (
                                t('noLocation')
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEditDialog(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {warehouseItem ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenTransactionDialog(item, warehouseItem)}
                                  >
                                    <ArrowLeftRight className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenWarehouseItemDialog(item)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => loadItemTransactions(item.id)}
                                >
                                  <List className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>{t('locations')}</CardTitle>
            </CardHeader>
            <CardContent>
              {locations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('noLocationsFound')}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('name')}</TableHead>
                        <TableHead>{t('code')}</TableHead>
                        <TableHead>{t('description')}</TableHead>
                        <TableHead>{t('itemCount')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locations.map((location) => (
                        <TableRow key={location.id}>
                          <TableCell className="font-medium">{location.name}</TableCell>
                          <TableCell>{location.code || '-'}</TableCell>
                          <TableCell>
                            {location.description ? (
                              <p className="line-clamp-2">{location.description}</p>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {items.filter(i => 
                              i.warehouseItems.some(wi => wi.storageLocationId === location.id)
                            ).length}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="premixes">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('premixes')}</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      {t('addPremix')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{t('addPremix')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>{t('name')}*</Label>
                        <Input
                          value={newPremix.name}
                          onChange={(e) => setNewPremix({ ...newPremix, name: e.target.value })}
                        />
                        {premixErrors.name && (
                          <p className="text-sm text-red-500 mt-1">{premixErrors.name}</p>
                        )}
                      </div>
                      <div>
                        <Label>{t('description')}</Label>
                        <Textarea
                          value={newPremix.description}
                          onChange={(e) => setNewPremix({ ...newPremix, description: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{t('unit')}*</Label>
                          <Select
                            value={newPremix.unit}
                            onValueChange={(value) => setNewPremix({ ...newPremix, unit: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('unit')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="l">l</SelectItem>
                              <SelectItem value="ml">ml</SelectItem>
                              <SelectItem value="pcs">pcs</SelectItem>
                            </SelectContent>
                          </Select>
                          {premixErrors.unit && (
                            <p className="text-sm text-red-500 mt-1">{premixErrors.unit}</p>
                          )}
                        </div>
                        <div>
                          <Label>{t('yield')}</Label>
                          <Input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={newPremix.yield}
                            onChange={(e) => setNewPremix({ ...newPremix, yield: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>{t('ingredients')}</Label>
                        <div className="space-y-2">
                          {premixIngredients.length > 0 && (
                            <div className="border rounded-md p-2">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>{t('name')}</TableHead>
                                    <TableHead>{t('quantity')}</TableHead>
                                    <TableHead>{t('actions')}</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {premixIngredients.map((ingredient, index) => {
                                    const item = items.find(i => i.id === ingredient.inventoryItemId);
                                    return (
                                      <TableRow key={index}>
                                        <TableCell>{item?.name || ingredient.inventoryItemId}</TableCell>
                                        <TableCell>{ingredient.quantity} {item?.unit || ''}</TableCell>
                                        <TableCell>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveIngredient(index)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <SearchableSelect
                                options={items.map(item => ({
                                  id: item.id,
                                  label: `${item.name} (${item.unit})`
                                }))}
                                value={newIngredient.inventoryItemId ? [newIngredient.inventoryItemId] : []}
                                onChange={(ids) => setNewIngredient({
                                  ...newIngredient,
                                  inventoryItemId: ids[0] || ''
                                })}
                                placeholder={t('selectIngredient')}
                                searchPlaceholder={t('searchIngredient')}
                                emptyText={t('noIngredientsFound')}
                                multiple={false}
                              />
                            </div>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              placeholder={t('quantity')}
                              value={newIngredient.quantity}
                              onChange={(e) => setNewIngredient({
                                ...newIngredient,
                                quantity: Number(e.target.value)
                              })}
                              className="w-32"
                            />
                            <Button onClick={handleAddIngredient}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Button onClick={handleAddPremix}>{t('addPremix')}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {premixes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('noPremixesFound')}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('name')}</TableHead>
                        <TableHead>{t('description')}</TableHead>
                        <TableHead>{t('unit')}</TableHead>
                        <TableHead>{t('yield')}</TableHead>
                        <TableHead>{t('ingredients')}</TableHead>
                        <TableHead className="text-right">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {premixes.map((premix) => (
                        <TableRow key={premix.id}>
                          <TableCell className="font-medium">{premix.name}</TableCell>
                          <TableCell>
                            {premix.description ? (
                              <p className="line-clamp-2">{premix.description}</p>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>{premix.unit}</TableCell>
                          <TableCell>{premix.yield}</TableCell>
                          <TableCell>
                            {premix.ingredients.length} {t('ingredients')}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  loadPremixDetails(premix.id);
                                  setPrepareDialogOpen(true);
                                }}
                              >
                                <ChefHat className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditPremixDialog(premix)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => loadItemTransactions(premix.id)}
                              >
                                <List className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <CardTitle>{t('transactions')}</CardTitle>
                <div className="flex gap-2">
                  <Popover open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, 'LLL dd, y')} -{' '}
                              {format(dateRange.to, 'LLL dd, y')}
                            </>
                          ) : (
                            format(dateRange.from, 'LLL dd, y')
                          )
                        ) : (
                          <span>{t('selectDateRange')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleDateRangeChange}
                        numberOfMonths={2}
                      />
                      <div className="p-2 border-t flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => {
                            if (dateRange?.from && dateRange?.to) {
                              loadWarehouseTransactions();
                              setDateFilterOpen(false);
                            }
                          }}
                          disabled={!dateRange?.from || !dateRange?.to}
                        >
                          {t('apply')}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TransactionsTable transactions={transactions} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Диалог транзакций */}
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transactionType === 'receipt' ? t('receiptTitle') : t('writeOffTitle')}
            </DialogTitle>
            <DialogDescription>
              {currentItem?.name} ({currentItem?.unit})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={transactionType === 'receipt' ? 'default' : 'outline'}
                onClick={() => setTransactionType('receipt')}
              >
                {t('receipt')}
              </Button>
              <Button
                variant={transactionType === 'writeoff' ? 'default' : 'outline'}
                onClick={() => setTransactionType('writeoff')}
              >
                {t('writeOff')}
              </Button>
            </div>

            <div>
              <Label>{t('quantity')} ({currentItem?.unit})*</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                ref={quantityRef}
              />
              {transactionType === 'writeoff' && currentWarehouseItem && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t('available')}: {currentWarehouseItem.quantity.toFixed(2)} {currentItem?.unit}
                </p>
              )}
            </div>

            <div>
              <Label>{t('reason')}</Label>
              <Input
                placeholder={t('reasonPlaceholder')}
                ref={reasonRef}
              />
            </div>

            <Button onClick={handleSubmitTransaction}>
              {transactionType === 'receipt' ? t('confirmReceipt') : t('confirmWriteOff')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования товара */}
      <Dialog open={editItemDialogOpen} onOpenChange={setEditItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editItem')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('name')}*</Label>
              <Input
                value={editItemData.name}
                onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value })}
              />
              {editItemErrors.name && (
                <p className="text-sm text-red-500 mt-1">{editItemErrors.name}</p>
              )}
            </div>
            <div>
              <Label>{t('description')}</Label>
              <Textarea
                value={editItemData.description}
                onChange={(e) => setEditItemData({ ...editItemData, description: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('unit')}</Label>
              <Select
                value={editItemData.unit}
                onValueChange={(value) => setEditItemData({ ...editItemData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('unit')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="l">l</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="pcs">pcs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('cost')}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editItemData.cost}
                onChange={(e) => setEditItemData({ ...editItemData, cost: Number(e.target.value) })}
              />
            </div>
            <Button onClick={handleSaveItemChanges}>{t('saveChanges')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог добавления на склад */}
      <Dialog open={warehouseItemDialogOpen} onOpenChange={setWarehouseItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('addToWarehouse')}: {currentItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('location')}</Label>
              <Select
                value={warehouseItemData.storageLocationId}
                onValueChange={(value) => setWarehouseItemData({ ...warehouseItemData, storageLocationId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectLocation')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('noLocation')}</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} {location.code && `(${location.code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('quantity')}*</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={warehouseItemData.quantity}
                onChange={(e) => setWarehouseItemData({ ...warehouseItemData, quantity: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>{t('minQuantity')}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={warehouseItemData.minQuantity}
                onChange={(e) => setWarehouseItemData({ ...warehouseItemData, minQuantity: Number(e.target.value) })}
              />
            </div>
            <Button onClick={handleAddWarehouseItem}>{t('addToWarehouse')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования премикса */}
      <Dialog open={editPremixDialogOpen} onOpenChange={setEditPremixDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editPremix')}</DialogTitle>
            <DialogDescription>
              {editingPremix?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('name')}*</Label>
              <Input
                value={editPremixData.name}
                onChange={(e) => setEditPremixData({ ...editPremixData, name: e.target.value })}
              />
              {editPremixErrors.name && (
                <p className="text-sm text-red-500 mt-1">{editPremixErrors.name}</p>
              )}
            </div>
            <div>
              <Label>{t('description')}</Label>
              <Textarea
                value={editPremixData.description}
                onChange={(e) => setEditPremixData({ ...editPremixData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('unit')}*</Label>
                <Select
                  value={editPremixData.unit}
                  onValueChange={(value) => setEditPremixData({ ...editPremixData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('unit')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="l">l</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="pcs">pcs</SelectItem>
                  </SelectContent>
                </Select>
                {editPremixErrors.unit && (
                  <p className="text-sm text-red-500 mt-1">{editPremixErrors.unit}</p>
                )}
              </div>
              <div>
                <Label>{t('yield')}</Label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={editPremixData.yield}
                  onChange={(e) => setEditPremixData({ ...editPremixData, yield: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>{t('ingredients')}</Label>
              <div className="space-y-2">
                {premixIngredients.length > 0 && (
                  <div className="border rounded-md p-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('name')}</TableHead>
                          <TableHead>{t('quantity')}</TableHead>
                          <TableHead>{t('actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {premixIngredients.map((ingredient, index) => {
                          const item = items.find(i => i.id === ingredient.inventoryItemId);
                          return (
                            <TableRow key={index}>
                              <TableCell>{item?.name || ingredient.inventoryItemId}</TableCell>
                              <TableCell>{ingredient.quantity} {item?.unit || ''}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveIngredient(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={items.map(item => ({
                        id: item.id,
                        label: `${item.name} (${item.unit})`
                      }))}
                      value={newIngredient.inventoryItemId ? [newIngredient.inventoryItemId] : []}
                      onChange={(ids) => setNewIngredient({
                        ...newIngredient,
                        inventoryItemId: ids[0] || ''
                      })}
                      placeholder={t('selectIngredient')}
                      searchPlaceholder={t('searchIngredient')}
                      emptyText={t('noIngredientsFound')}
                      multiple={false}
                    />
                  </div>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder={t('quantity')}
                    value={newIngredient.quantity}
                    onChange={(e) => setNewIngredient({
                      ...newIngredient,
                      quantity: Number(e.target.value)
                    })}
                    className="w-32"
                  />
                  <Button onClick={handleAddIngredient}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <Button onClick={handleSavePremixChanges}>{t('saveChanges')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог приготовления премикса */}
      <Dialog open={prepareDialogOpen} onOpenChange={setPrepareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('preparePremix')}: {selectedPremix?.name}
            </DialogTitle>
            <DialogDescription>
              {t('preparePremixDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('quantity')} ({selectedPremix?.unit})*</Label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={prepareQuantity}
                onChange={(e) => setPrepareQuantity(Number(e.target.value))}
              />
            </div>
            {selectedPremix?.ingredients && (
              <div>
                <Label>{t('requiredIngredients')}</Label>
                <div className="border rounded-md p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('name')}</TableHead>
                        <TableHead>{t('required')}</TableHead>
                        <TableHead>{t('available')}</TableHead>
                        <TableHead>{t('status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPremix.ingredients.map((ingredient: any, index: number) => {
                        const required = (ingredient.quantity * prepareQuantity) / selectedPremix.yield;
                        const item = items.find(i => i.id === ingredient.inventoryItemId);
                        const warehouseItem = item?.warehouseItems.find(wi => wi.warehouseId === warehouse.id);
                        const available = warehouseItem?.quantity || 0;
                        const isEnough = available >= required;

                        return (
                          <TableRow key={index} className={!isEnough ? 'bg-red-50' : ''}>
                            <TableCell>{item?.name || ingredient.inventoryItemId}</TableCell>
                            <TableCell>
                              {required.toFixed(2)} {item?.unit || ''}
                            </TableCell>
                            <TableCell>
                              {available.toFixed(2)} {item?.unit || ''}
                            </TableCell>
                            <TableCell>
                              {isEnough ? (
                                <Badge variant="outline" className="gap-1">
                                  <Check className="h-3 w-3" />
                                  {t('enough')}
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1">
                                  <Trash2 className="h-3 w-3" />
                                  {t('insufficient')}
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              onClick={handlePreparePremix} 
              disabled={
                prepareQuantity <= 0 || 
                selectedPremix?.ingredients.some((ingredient: any) => {
                  const required = (ingredient.quantity * prepareQuantity) / selectedPremix.yield;
                  const item = items.find(i => i.id === ingredient.inventoryItemId);
                  const warehouseItem = item?.warehouseItems.find(wi => wi.warehouseId === warehouse.id);
                  const available = warehouseItem?.quantity || 0;
                  return available < required;
                })
              }
            >
              {t('prepare')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}