'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { WarehouseService } from '@/lib/api/warehouse.service';
import { useLanguageStore } from '@/lib/stores/language-store';
import { warehouseTranslations } from './translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionsTable } from '@/components/features/warehouse/TransactionsTable';
import { Refrigerator, Package, ArrowLeftRight, CalendarDays, ChefHat, List, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import SearchableSelect from '@/components/features/menu/product/SearchableSelect';

export default function WarehousePage() {
  const params = useParams();
  const { language } = useLanguageStore();
  const t = (key: keyof typeof warehouseTranslations) => warehouseTranslations[key][language];

  const restaurantId = params.id as string;

  const [warehouse, setWarehouse] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [premixes, setPremixes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items');
  const [locationFilter, setLocationFilter] = useState('all');

  // Для фильтрации транзакций по дате
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [dateFilterOpen, setDateFilterOpen] = useState(false);

  // Формы и ошибки
  const [newItem, setNewItem] = useState({
    name: '',
    unit: 'kg',
    quantity: 0,
    storageLocationId: 'none',
  });
  const [itemErrors, setItemErrors] = useState({
    name: '',
    quantity: '',
  });

  const [newLocation, setNewLocation] = useState({
    name: '',
    code: '',
  });
  const [locationErrors, setLocationErrors] = useState({
    name: '',
    code: '',
  });

  // Для диалога операций
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'receipt' | 'writeoff'>('receipt');
  const [currentItem, setCurrentItem] = useState<any>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLInputElement>(null);

  // Для диалога редактирования
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editItemData, setEditItemData] = useState({
    name: '',
    unit: 'kg',
    storageLocationId: 'none',
  });
  const [editItemErrors, setEditItemErrors] = useState({
    name: '',
  });

  // Для работы с заготовками
  const [newPremix, setNewPremix] = useState({
    name: '',
    description: '',
    unit: 'kg',
    yield: 1,
    warehouseId: warehouse?.id || '',
  });
  const [premixErrors, setPremixErrors] = useState({
    name: '',
    unit: '',
  });
  const [selectedPremix, setSelectedPremix] = useState<any>(null);
  const [premixIngredients, setPremixIngredients] = useState<any[]>([]);
  const [newIngredient, setNewIngredient] = useState({
    inventoryItemId: '',
    quantity: 0,
  });
  const [prepareQuantity, setPrepareQuantity] = useState(1);
  const [prepareDialogOpen, setPrepareDialogOpen] = useState(false);
  const [editPremixDialogOpen, setEditPremixDialogOpen] = useState(false);
  const [editingPremix, setEditingPremix] = useState<any>(null);
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


  useEffect(() => {
    loadWarehouseData();
  }, [restaurantId]);

  useEffect(() => {
    if (warehouse?.id) {
      setNewPremix(prev => ({ ...prev, warehouseId: warehouse.id }));
    }
  }, [warehouse]);

  useEffect(() => {
    if (locationFilter === 'all') {
      setFilteredItems(items.filter(item => item.premixId === null));
    } else {
      setFilteredItems(items.filter(item =>
        item.storageLocationId === locationFilter && item.premixId === null
      ));
    }
  }, [items, locationFilter]);

  const loadWarehouseData = async () => {
    try {
      setLoading(true);
      const warehouseData = await WarehouseService.getRestaurantWarehouse(restaurantId);
      setWarehouse(warehouseData);
      setItems(warehouseData.inventoryItems || []);
      setLocations(warehouseData.storageLocations || []);

      // Загружаем заготовки для этого склада
      const premixesData = await WarehouseService.listPremixes(warehouseData.id);
      setPremixes(premixesData);
    } catch (error) {
      console.error('Failed to load warehouse data:', error);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const loadPremixDetails = async (premixId: string) => {
    try {
      const details = await WarehouseService.getPremixDetails(premixId);
      setSelectedPremix(details);
      setPremixIngredients(details.ingredients || []);
    } catch (error) {
      console.error('Failed to load premix details:', error);
      toast.error(t('loadError'));
    }
  };

  const validateItem = () => {
    let isValid = true;
    const newErrors = { name: '', quantity: '' };

    if (!newItem.name.trim()) {
      newErrors.name = t('nameRequired');
      isValid = false;
    }

    if (newItem.quantity < 0) {
      newErrors.quantity = t('quantityPositive');
      isValid = false;
    }

    setItemErrors(newErrors);
    return isValid;
  };

  const validateLocation = () => {
    let isValid = true;
    const newErrors = { name: '', code: '' };

    if (!newLocation.name.trim()) {
      newErrors.name = t('nameRequired');
      isValid = false;
    }

    if (!newLocation.code.trim()) {
      newErrors.code = t('codeRequired');
      isValid = false;
    }

    setLocationErrors(newErrors);
    return isValid;
  };

  const validatePremix = () => {
    let isValid = true;
    const newErrors = { name: '', unit: '' };

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

  const validateEditItem = () => {
    let isValid = true;
    const newErrors = { name: '' };

    if (!editItemData.name.trim()) {
      newErrors.name = t('nameRequired');
      isValid = false;
    }

    setEditItemErrors(newErrors);
    return isValid;
  };

  const handleAddItem = async () => {
    if (!validateItem()) return;

    try {
      const itemToCreate = {
        ...newItem,
        storageLocationId: newItem.storageLocationId === 'none' ? null : newItem.storageLocationId
      };

      await WarehouseService.createInventoryItem(warehouse.id, itemToCreate);
      await loadWarehouseData();

      setNewItem({
        name: '',
        unit: 'kg',
        quantity: 0,
        storageLocationId: 'none',
      });

      toast.success(t('itemAdded'));
    } catch (error: any) {
      console.error('Failed to add item:', error);

      let errorMessage = t('addItemError');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    }
  };

  const handleAddLocation = async () => {
    if (!validateLocation()) return;

    try {
      await WarehouseService.createStorageLocation(warehouse.id, newLocation);
      await loadWarehouseData();

      setNewLocation({
        name: '',
        code: '',
      });

      toast.success(t('locationAdded'));
    } catch (error: any) {
      console.error('Failed to add location:', error);

      let errorMessage = t('addLocationError');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    }
  };

  const handleAddPremix = async () => {
    if (!validatePremix()) return;

    try {
      const ingredients = premixIngredients.map(ing => ({
        inventoryItemId: ing.inventoryItem?.id || ing.inventoryItemId,
        quantity: ing.quantity
      }));

      const dto = {
        ...newPremix,
        ingredients,
        warehouseId: warehouse.id
      };

      console.log('Sending premix data:', dto);

      await WarehouseService.createPremix(dto);
      await loadWarehouseData();

      setNewPremix({
        name: '',
        description: '',
        unit: 'kg',
        yield: 1,
        warehouseId: warehouse.id,
      });
      setPremixIngredients([]);

      toast.success(t('premixAdded'));
    } catch (error: any) {
      console.error('Failed to add premix:', error);
      toast.error(error.response?.data?.message || t('addPremixError'));
    }
  };

  const handleAddIngredient = () => {
    if (!newIngredient.inventoryItemId || newIngredient.quantity <= 0) {
      toast.error(t('fillAllFields'));
      return;
    }

    const item = items.find(i => i.id === newIngredient.inventoryItemId);
    if (!item) return;

    setPremixIngredients([
      ...premixIngredients,
      {
        inventoryItem: item,
        inventoryItemId: item.id,
        quantity: newIngredient.quantity
      }
    ]);

    setNewIngredient({
      inventoryItemId: '',
      quantity: 0,
    });
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = [...premixIngredients];
    newIngredients.splice(index, 1);
    setPremixIngredients(newIngredients);
  };

  const handleOpenTransactionDialog = (item: any) => {
    setCurrentItem(item);
    setTransactionDialogOpen(true);
    setTransactionType('receipt');
  };

  const handleOpenEditDialog = (item: any) => {
    setEditingItem(item);
    setEditItemData({
      name: item.name,
      unit: item.unit,
      storageLocationId: item.storageLocationId || 'none',
    });
    setEditItemDialogOpen(true);
  };

  const handleSaveItemChanges = async () => {
    if (!validateEditItem() || !editingItem) return;

    try {
      const updatedItem = {
        name: editItemData.name,
        unit: editItemData.unit,
        storageLocationId: editItemData.storageLocationId === 'none' ? null : editItemData.storageLocationId
      };

      await WarehouseService.updateInventoryItem(editingItem.id, updatedItem);
      await loadWarehouseData();

      setEditItemDialogOpen(false);
      toast.success(t('itemUpdated'));
    } catch (error: any) {
      console.error('Failed to update item:', error);

      let errorMessage = t('updateItemError');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    }
  };

  const handleSubmitTransaction = async () => {
    if (!currentItem || !quantityRef.current) return;

    const quantity = Number(quantityRef.current.value);
    const reason = reasonRef.current?.value || '';

    if (quantity <= 0) {
      toast.error(t('quantityPositive'));
      return;
    }

    try {
      if (transactionType === 'receipt') {
        await WarehouseService.receiveInventory(currentItem.id, {
          quantity,
          reason,
        });
        toast.success(t('receiptSuccess'));
      } else {
        if (quantity > currentItem.quantity) {
          toast.error(t('insufficientQuantity'));
          return;
        }
        await WarehouseService.writeOffInventory(currentItem.id, {
          quantity,
          reason,
        });
        toast.success(t('writeOffSuccess'));
      }
      await loadWarehouseData();
      setTransactionDialogOpen(false);
    } catch (error: any) {
      console.error('Transaction error:', error);

      let errorMessage = t('transactionError');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    }
  };

  const handlePreparePremix = async () => {
    console.log(selectedPremix)
    if (!selectedPremix || prepareQuantity <= 0) {
      toast.error(t('invalidQuantity'));
      return;
    }

    try {
      await WarehouseService.preparePremix(selectedPremix.id, {
        quantity: prepareQuantity
      });
      toast.success(t('premixPrepared'));
      await loadWarehouseData();
      setPrepareDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to prepare premix:', error);

      let errorMessage = t('preparePremixError');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    }
  };

  const loadItemTransactions = async (itemId: string) => {
    try {
      const data = await WarehouseService.getInventoryItemTransactions(itemId);
      setTransactions(data);
      setActiveTab('transactions');
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error(t('loadTransactionsError'));
    }
  };

  const loadPremixTransactions = async (premixId: string) => {
    try {
      const data = await WarehouseService.getPremixTransactions(premixId);
      setTransactions(data);
      setActiveTab('transactions');
    } catch (error) {
      console.error('Failed to load premix transactions:', error);
      toast.error(t('loadTransactionsError'));
    }
  };

  const loadWarehouseTransactionsByDate = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    try {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');

      const data = await WarehouseService.getWarehouseTransactionsByPeriod(
        restaurantId,
        startDate,
        endDate
      );

      setTransactions(data);
      setActiveTab('transactions');
    } catch (error) {
      console.error('Failed to load transactions by date:', error);
      toast.error(t('loadTransactionsError'));
    }
  };

  const handleOpenEditPremixDialog = (premix: any) => {
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

  const validateEditPremix = () => {
    let isValid = true;
    const newErrors = { name: '', unit: '' };

    if (!editPremixData.name.trim()) {
      newErrors.name = t('nameRequired');
      isValid = false;
    }

    if (!editPremixData.unit) {
      newErrors.unit = t('unitRequired');
      isValid = false;
    }

    setEditPremixErrors(newErrors);
    return isValid;
  };

  const handleSavePremixChanges = async () => {
    if (!validateEditPremix() || !editingPremix) return;

    try {
      const updateData = {
        ...editPremixData,
        ingredients: premixIngredients.map(ing => ({
          inventoryItemId: ing.inventoryItem?.id || ing.inventoryItemId,
          quantity: ing.quantity
        })),
      };

      await WarehouseService.updatePremix(editingPremix.id, {
        name: updateData.name,
        description: updateData.description,
        unit: updateData.unit,
        yield: updateData.yield,
      });

      const currentDetails = await WarehouseService.getPremixDetails(editingPremix.id);
      const currentIngredients = currentDetails.ingredients || [];

      for (const currentIng of currentIngredients) {
        if (!premixIngredients.some(ing =>
          (ing.inventoryItem?.id || ing.inventoryItemId) === currentIng.inventoryItemId
        )) {
          await WarehouseService.removePremixIngredient(editingPremix.id, currentIng.inventoryItemId);
        }
      }

      for (const ing of premixIngredients) {
        const ingredientId = ing.inventoryItem?.id || ing.inventoryItemId;
        const existingIng = currentIngredients.find(i => i.inventoryItemId === ingredientId);

        if (existingIng) {
          await WarehouseService.updatePremixIngredient(editingPremix.id, ingredientId, {
            quantity: ing.quantity
          });
        } else {
          await WarehouseService.addPremixIngredient(editingPremix.id, {
            inventoryItemId: ingredientId,
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

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setDateFilterOpen(false);
      loadWarehouseTransactionsByDate();
    }
  };

  if (loading) {
    return <div className="p-4">{t('loading')}</div>;
  }

  if (!warehouse) {
    return <div className="p-4">{t('warehouseNotFound')}</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{warehouse.name}</h1>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">{t('addLocation')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('addLocation')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className='mb-1'>{t('name')}</Label>
                  <Input
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  />
                  {locationErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{locationErrors.name}</p>
                  )}
                </div>
                <div>
                  <Label className='mb-1'>{t('code')}</Label>
                  <Input
                    value={newLocation.code}
                    onChange={(e) => setNewLocation({ ...newLocation, code: e.target.value })}
                  />
                  {locationErrors.code && (
                    <p className="text-sm text-red-500 mt-1">{locationErrors.code}</p>
                  )}
                </div>
                <Button onClick={handleAddLocation}>{t('addLocation')}</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button>{t('addItem')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('addItem')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className='mb-1'>{t('name')}</Label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                  {itemErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{itemErrors.name}</p>
                  )}
                </div>
                <div>
                  <Label className='mb-1'>{t('unit')}</Label>
                  <Select
                    value={newItem.unit}
                    onValueChange={(value) => setNewItem({ ...newItem, unit: value })}
                  >
                    <SelectTrigger className='w-full'>
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
                  <Label className='mb-1'>{t('quantity')}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                  />
                  {itemErrors.quantity && (
                    <p className="text-sm text-red-500 mt-1">{itemErrors.quantity}</p>
                  )}
                </div>
                <div>
                  <Label className='mb-1'>{t('location')}</Label>
                  <Select
                    value={newItem.storageLocationId}
                    onValueChange={(value) => setNewItem({ ...newItem, storageLocationId: value })}
                  >
                    <SelectTrigger className='w-full' >
                      <SelectValue placeholder={t('filterByLocation')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('noLocation')}</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} ({location.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddItem}>{t('addItem')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('inventory')}</CardTitle>
                <div className="w-48">
                  <Select
                    value={locationFilter}
                    onValueChange={setLocationFilter}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder={t('filterByLocation')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allLocations')}</SelectItem>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name} ({location.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
                  {filteredItems.map((item) =>
                  (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.quantity}
                        </div>
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        {item.storageLocationId
                          ? locations.find(l => l.id === item.storageLocationId)?.name
                          : t('noLocation')}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditDialog(item)}
                          >
                            {t('edit')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenTransactionDialog(item)}
                          >
                            {t('adjustQuantity')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadItemTransactions(item.id)}
                          >
                            {t('transactions')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>{t('locations')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('code')}</TableHead>
                    <TableHead>{t('itemCount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell>{location.name}</TableCell>
                      <TableCell>{location.code}</TableCell>
                      <TableCell>
                        {items.filter(i => i.storageLocationId === location.id).length}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                    <Button>{t('addPremix')}</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{t('addPremix')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className='mb-1'>{t('name')}</Label>
                        <Input
                          value={newPremix.name}
                          onChange={(e) => setNewPremix({ ...newPremix, name: e.target.value })}
                        />
                        {premixErrors.name && (
                          <p className="text-sm text-red-500 mt-1">{premixErrors.name}</p>
                        )}
                      </div>
                      <div>
                        <Label className='mb-1'>{t('description')}</Label>
                        <Input
                          value={newPremix.description}
                          onChange={(e) => setNewPremix({ ...newPremix, description: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className='mb-1'>{t('unit')}</Label>
                          <Select
                            value={newPremix.unit}
                            onValueChange={(value) => setNewPremix({ ...newPremix, unit: value })}
                          >
                            <SelectTrigger className='w-full'>
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
                          <Label className='mb-1'>{t('yield')}</Label>
                          <Input
                            type="number"
                            min="0.1"
                            defaultValue={0}
                            step="0.1"
                            value={newPremix.yield}
                            onChange={(e) => setNewPremix({ ...newPremix, yield: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className='mb-1'>{t('ingredients')}</Label>
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
                                  {premixIngredients.map((ingredient, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{ingredient.inventoryItem.name} </TableCell>
                                      <TableCell>{ingredient.quantity} {ingredient.inventoryItem.unit}</TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveIngredient(index)}
                                        >
                                          {t('remove')}
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('quantity')}</TableHead>
                    <TableHead>{t('unit')}</TableHead>
                    <TableHead>{t('yield')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {premixes.map((premix) => (
                    <TableRow key={premix.id}>
                      <TableCell>{premix.name}</TableCell>
                      <TableCell>
                        {premix.inventoryItem?.quantity || 0}
                      </TableCell>
                      <TableCell>{premix.unit}</TableCell>
                      <TableCell>{premix.yield}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              loadPremixDetails(premix.id);
                              setSelectedPremix(premix.id);
                              setPrepareDialogOpen(true);
                            }}
                          >
                            {t('prepare')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditPremixDialog(premix)}
                          >
                            {t('edit')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (premix.inventoryItem?.id) {
                                loadItemTransactions(premix.inventoryItem.id);
                              }
                            }}
                          >
                            {t('transactions')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('transactions')}</CardTitle>
                <Popover open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex gap-2">
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
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                    <div className="p-2 border-t flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (dateRange?.from && dateRange?.to) {
                            loadWarehouseTransactionsByDate();
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
            </CardHeader>
            <CardContent>
              <TransactionsTable transactions={transactions} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transactionType === 'receipt' ? t('receiptTitle') : t('writeOffTitle')}
            </DialogTitle>
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
              <Label className='mb-1'>{t('quantity')} ({currentItem?.unit})</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                ref={quantityRef}
              />
              {transactionType === 'writeoff' && currentItem && (
                <p className="text-sm text-muted-foreground">
                  {t('available')}: {currentItem.quantity} {currentItem.unit}
                </p>
              )}
            </div>

            <div>
              <Label className='mb-1'>{t('reason')}</Label>
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

      <Dialog open={editItemDialogOpen} onOpenChange={setEditItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editItem')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className='mb-1'>{t('name')}</Label>
              <Input
                value={editItemData.name}
                onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value })}
              />
              {editItemErrors.name && (
                <p className="text-sm text-red-500 mt-1">{editItemErrors.name}</p>
              )}
            </div>
            <div>
              <Label className='mb-1'>{t('unit')}</Label>
              <Select
                value={editItemData.unit}
                onValueChange={(value) => setEditItemData({ ...editItemData, unit: value })}
              >
                <SelectTrigger className='w-full'>
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
              <Label className='mb-1'>{t('location')}</Label>
              <Select
                value={editItemData.storageLocationId}
                onValueChange={(value) => setEditItemData({ ...editItemData, storageLocationId: value })}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder={t('filterByLocation')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('noLocation')}</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} ({location.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveItemChanges}>{t('saveChanges')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editPremixDialogOpen} onOpenChange={setEditPremixDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editPremix')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className='mb-1'>{t('name')}</Label>
              <Input
                value={editPremixData.name}
                onChange={(e) => setEditPremixData({ ...editPremixData, name: e.target.value })}
              />
              {editPremixErrors.name && (
                <p className="text-sm text-red-500 mt-1">{editPremixErrors.name}</p>
              )}
            </div>
            <div>
              <Label className='mb-1'>{t('description')}</Label>
              <Input
                value={editPremixData.description}
                onChange={(e) => setEditPremixData({ ...editPremixData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className='mb-1'>{t('unit')}</Label>
                <Select
                  value={editPremixData.unit}
                  onValueChange={(value) => setEditPremixData({ ...editPremixData, unit: value })}
                >
                  <SelectTrigger className='w-full'>
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
                <Label className='mb-1'>{t('yield')}</Label>
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
              <Label className='mb-1'>{t('ingredients')}</Label>
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
                        {premixIngredients.map((ingredient, index) => (
                          <TableRow key={index}>
                            <TableCell>{ingredient.inventoryItem?.name || items.find(i => i.id === ingredient.inventoryItemId)?.name}</TableCell>
                            <TableCell>{ingredient.quantity} {ingredient.inventoryItem?.unit || items.find(i => i.id === ingredient.inventoryItemId)?.unit}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveIngredient(index)}
                              >
                                {t('remove')}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
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
                      placeholder={t('selectIngredient') as string}
                      searchPlaceholder={t('searchIngredient') as string}
                      emptyText={t('noIngredientsFound') as string}
                      multiple={false}
                    />
                  </div>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder={t('quantity') as string}
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

      <Dialog open={prepareDialogOpen} onOpenChange={setPrepareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('preparePremix')}: {selectedPremix?.name}</DialogTitle>
            <DialogDescription>
              {t('preparePremixDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className='mb-1'>{t('quantity')} ({selectedPremix?.unit})</Label>
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
                <Label className='mb-1'>{t('requiredIngredients')}</Label>
                <div className="border rounded-md p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('name')}</TableHead>
                        <TableHead>{t('required')}</TableHead>
                        <TableHead>{t('available')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPremix.ingredients.map((ingredient: any, index: number) => {
                        const required = (ingredient.quantity * prepareQuantity) / selectedPremix.yield;
                        const available = items.find(i => i.id === ingredient.inventoryItem.id)?.quantity || 0;
                        const isEnough = available >= required;

                        return (
                          <TableRow key={index} className={!isEnough ? 'bg-red-50' : ''}>
                            <TableCell>{ingredient.inventoryItem.name}</TableCell>
                            <TableCell>
                              {required.toFixed(2)} {ingredient.inventoryItem.unit}
                            </TableCell>
                            <TableCell>
                              {available.toFixed(2)} {ingredient.inventoryItem.unit}
                              {!isEnough && (
                                <span className="text-red-500 ml-2">({t('insufficient')})</span>
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
            <Button onClick={handlePreparePremix} disabled={prepareQuantity <= 0}>
              {t('prepare')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPremix?.name}</DialogTitle>
            <DialogDescription>
              {selectedPremix?.description || t('noDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className='mb-1'>{t('unit')}</Label>
                <p>{selectedPremix?.unit}</p>
              </div>
              <div>
                <Label className='mb-1'>{t('yield')}</Label>
                <p>{selectedPremix?.yield}</p>
              </div>
            </div>
            <div>
              <Label className='mb-1'>{t('ingredients')}</Label>
              <div className="border rounded-md p-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('name')}</TableHead>
                      <TableHead>{t('quantity')}</TableHead>
                      <TableHead>{t('unit')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPremix?.ingredients?.map((ingredient: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{ingredient.inventoryItem.name}</TableCell>
                        <TableCell>{ingredient.quantity}</TableCell>
                        <TableCell>{ingredient.inventoryItem.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}