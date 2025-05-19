// app/(dashboard)/warehouse/page.tsx
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionsTable } from '@/components/features/warehouse/TransactionsTable';
import { Refrigerator, Package, ArrowLeftRight } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('items');
  const [locationFilter, setLocationFilter] = useState('all');

  // Формы
  const [newItem, setNewItem] = useState({
    name: '',
    unit: 'kg',
    quantity: 0,
    storageLocationId: 'none',
  });
  const [newLocation, setNewLocation] = useState({
    name: '',
    code: '',
  });

  // Для диалога операций
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'receipt' | 'writeoff'>('receipt');
  const [currentItem, setCurrentItem] = useState<any>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadWarehouseData();
  }, [restaurantId]);

  useEffect(() => {
    if (locationFilter === 'all') {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item => item.storageLocationId === locationFilter));
    }
  }, [items, locationFilter]);

  const loadWarehouseData = async () => {
    try {
      setLoading(true);
      const warehouseData = await WarehouseService.getRestaurantWarehouse(restaurantId);
      setWarehouse(warehouseData);
      setItems(warehouseData.inventoryItems || []);
      setLocations(warehouseData.storageLocations || []);
    } catch (error) {
      console.error('Failed to load warehouse data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      const itemToCreate = {
        ...newItem,
        storageLocationId: newItem.storageLocationId === 'none' ? null : newItem.storageLocationId
      };
      await WarehouseService.createInventoryItem(warehouse.id, newItem);
      await loadWarehouseData();
      setNewItem({
        name: '',
        unit: 'kg',
        quantity: 0,
        storageLocationId: 'none',
      });
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleAddLocation = async () => {
    try {
      await WarehouseService.createStorageLocation(warehouse.id, newLocation);
      await loadWarehouseData();
      setNewLocation({
        name: '',
        code: '',
      });
    } catch (error) {
      console.error('Failed to add location:', error);
    }
  };

  const handleOpenTransactionDialog = (item: any) => {
    setCurrentItem(item);
    setTransactionDialogOpen(true);
    setTransactionType('receipt');
  };

  const handleSubmitTransaction = async () => {
    if (!currentItem || !quantityRef.current) return;

    const quantity = Number(quantityRef.current.value);
    const reason = reasonRef.current?.value || '';

    if (quantity <= 0) {
      alert('Количество должно быть положительным');
      return;
    }

    try {
      if (transactionType === 'receipt') {
        await WarehouseService.receiveInventory(currentItem.id, {
          quantity,
          reason,
        });
      } else {
        if (quantity > currentItem.quantity) {
          alert('Недостаточно товара для списания');
          return;
        }
        await WarehouseService.writeOffInventory(currentItem.id, {
          quantity,
          reason,
        });
      }
      await loadWarehouseData();
      setTransactionDialogOpen(false);
    } catch (error) {
      console.error('Transaction error:', error);
    }
  };

  const loadItemTransactions = async (itemId: string) => {
    try {
      const data = await WarehouseService.getInventoryItemTransactions(itemId);
      setTransactions(data);
      setActiveTab('transactions');
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!warehouse) {
    return <div className="p-4">Warehouse not found</div>;
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
                </div>
                <div>
                  <Label className='mb-1'>{t('code')}</Label>
                  <Input
                    value={newLocation.code}
                    onChange={(e) => setNewLocation({ ...newLocation, code: e.target.value })}
                  />
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
                </div>
                <div>
                  <Label className='mb-1'>{t('unit')}</Label>
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
                </div>
                <div>
                  <Label className='mb-1'>{t('quantity')}</Label>
                  <Input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className='mb-1'>{t('location')}</Label>
                  <Select
                    value={newItem.storageLocationId}
                    onValueChange={(value) => setNewItem({ ...newItem, storageLocationId: value })}
                  >
                    <SelectTrigger >
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
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
                        <div className='text-right'>
                          <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleOpenTransactionDialog(item)}
                            >
                              {t('edit')}
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
                  ))}
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
                    <TableHead>Количество позиций</TableHead>
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

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>{t('transactions')}</CardTitle>
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
            <Label className=' mb-1'>{t('quantity')} ({currentItem?.unit})</Label>
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
            <Label className=' mb-1'>{t('reason')}</Label>
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
    </div>
  );
}