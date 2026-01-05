'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { InventoryCategoryDto, WarehouseService } from '@/lib/api/warehouse.service';
import { NetworkService } from '@/lib/api/network.service';
import { useLanguageStore } from '@/lib/stores/language-store';
import { warehouseTranslations } from './translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Package, Building, Warehouse, Filter, Download, Plus, Edit, Folder, FolderOpen, Tag, ChevronDown, ChevronRight, Boxes, BarChart3, AlertTriangle, Info, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import React from 'react';

interface RestaurantInfo {
  id: string;
  name: string;
  title: string;
  warehouseId: string;
}

export default function NetworkInventoryPage() {
  const params = useParams();
  const { language } = useLanguageStore();
  const t = (key: string) => {
    const translation = warehouseTranslations[key as keyof typeof warehouseTranslations];
    return translation?.[language] || key;
  };

  const networkId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [network, setNetwork] = useState<any>(null);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantInfo[]>([]);
  const [categories, setCategories] = useState<InventoryCategoryDto[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('inventory');
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#6b7280',
    parentId: 'none',
  });
  const [categoryErrors, setCategoryErrors] = useState({
    name: '',
  });

  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editCategoryData, setEditCategoryData] = useState({
    name: '',
    description: '',
    color: '#6b7280',
    parentId: 'none',
  });

  const [newItem, setNewItem] = useState({
    name: '',
    unit: 'kg',
    categoryId: 'none',
    description: '',
    cost: 0,
  });

  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editItemData, setEditItemData] = useState({
    name: '',
    unit: 'kg',
    categoryId: 'none',
    description: '',
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Загрузка данных
  useEffect(() => {
    loadNetworkData();
  }, [networkId]);

  useEffect(() => {
    filterItems();
  }, [inventoryItems, searchTerm, categoryFilter]);

  const loadNetworkData = async () => {
    try {
      setLoading(true);

      // Загружаем инвентарь по сети
      const inventoryData = await WarehouseService.getInventoryItemsByNetwork(networkId);
      setInventoryItems(inventoryData);

      // Загружаем данные сети
      const networkData = await NetworkService.getById(networkId);
      setNetwork(networkData);

      // Загружаем рестораны сети
      const restaurantData = await NetworkService.getRestaurants(networkId);

      // Преобразуем рестораны в нужный формат
      const formattedRestaurants: RestaurantInfo[] = restaurantData.map((rest: any) => ({
        id: rest.id,
        name: rest.name || rest.title,
        title: rest.title,
        warehouseId: rest.warehouseId || ''
      }));

      setRestaurants(formattedRestaurants);

      // Загружаем категории
      const categoriesData = await WarehouseService.getCategoryTreeByNetwork(networkId);
      setCategories(categoriesData);

    } catch (error) {
      console.error('Failed to load network data:', error);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = inventoryItems;

    // Поиск по названию
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Фильтр по категории
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'uncategorized') {
        filtered = filtered.filter(item => !item.categoryId);
      } else {
        filtered = filtered.filter(item => item.categoryId === categoryFilter);
      }
    }

    setFilteredItems(filtered);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getItemQuantityByRestaurant = (item: any, restaurantId: string) => {
    const warehouseItem = item.warehouseItems?.find((wi: any) =>
      wi.warehouse?.restaurantId === restaurantId
    );

    if (!warehouseItem) return '0';

    const quantity = warehouseItem.quantity || 0;
    const reserved = warehouseItem.reserved || 0;
    const available = quantity - reserved;

    return available;
  };

  const getItemCostByRestaurant = (item: any, restaurantId: string) => {
    const warehouseItem = item.warehouseItems?.find((wi: any) =>
      wi.warehouse?.restaurantId === restaurantId
    );

    if (!warehouseItem?.cost) return '-';

    return `${warehouseItem.cost.toFixed(2)}₽`;
  };

  const getItemTotalValueByRestaurant = (item: any, restaurantId: string) => {
    const warehouseItem = item.warehouseItems?.find((wi: any) =>
      wi.warehouse?.restaurantId === restaurantId
    );

    if (!warehouseItem?.cost || !warehouseItem?.quantity) return '-';

    const totalValue = warehouseItem.cost * warehouseItem.quantity;
    return `${totalValue.toFixed(2)}₽`;
  };

  const getTotalNetworkQuantity = (item: any) => {
    return item.warehouseItems?.reduce((sum: number, wi: any) => sum + (wi.quantity || 0), 0) || 0;
  };

  const getTotalNetworkValue = (item: any) => {
    return item.warehouseItems?.reduce((sum: number, wi: any) => {
      if (wi.cost && wi.quantity) {
        return sum + (wi.cost * wi.quantity);
      }
      return sum;
    }, 0) || 0;
  };

  const handleAddItem = async () => {
    if (!newItem.name.trim()) {
      toast.error(t('nameRequired'));
      return;
    }

    try {
      await WarehouseService.createInventoryItem({
        name: newItem.name,
        unit: newItem.unit,
        description: newItem.description,
        categoryId: newItem.categoryId === 'none' ? undefined : newItem.categoryId,
        networkId: networkId,
      });

      await loadNetworkData();

      setNewItem({
        name: '',
        unit: 'kg',
        categoryId: 'none',
        description: '',
        cost: 0,
      });

      toast.success(t('itemAdded'));
    } catch (error: any) {
      console.error('Failed to add item:', error);
      toast.error(error.response?.data?.message || t('addItemError'));
    }
  };

  const handleOpenEditDialog = (item: any) => {
    setEditingItem(item);
    setEditItemData({
      name: item.name,
      unit: item.unit || 'kg',
      categoryId: item.categoryId || 'none',
      description: item.description || '',
    });
    setEditItemDialogOpen(true);
  };

  const handleSaveItemChanges = async () => {
    if (!editingItem) return;

    try {
      await WarehouseService.updateInventoryItem(editingItem.id, {
        name: editItemData.name,
        unit: editItemData.unit,
        description: editItemData.description,
        categoryId: editItemData.categoryId === 'none' ? undefined : editItemData.categoryId,
      });

      await loadNetworkData();
      setEditItemDialogOpen(false);
      toast.success(t('itemUpdated'));
    } catch (error: any) {
      console.error('Failed to update item:', error);
      toast.error(t('updateItemError'));
    }
  };

  const handleOpenDeleteDialog = (item: any) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      await WarehouseService.deleteInventoryItem(itemToDelete.id);
      await loadNetworkData();
      setDeleteDialogOpen(false);
      toast.success(t('itemDeleted'));
    } catch (error: any) {
      console.error('Failed to delete item:', error);
      toast.error(t('deleteItemError'));
    } finally {
      setDeleting(false);
    }
  };
  const validateCategory = () => {
    let isValid = true;
    const newErrors = { name: '' };

    if (!newCategory.name.trim()) {
      newErrors.name = t('nameRequired');
      isValid = false;
    }

    setCategoryErrors(newErrors);
    return isValid;
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      await WarehouseService.updateInventoryCategory(editingCategory.id, {
        name: editCategoryData.name,
        description: editCategoryData.description,
        color: editCategoryData.color,
        parentId: editCategoryData.parentId === 'none' ? undefined : editCategoryData.parentId,
      });

      await loadNetworkData();
      setEditCategoryDialogOpen(false);
      toast.success(t('categoryUpdated'));
    } catch (error: any) {
      console.error('Failed to update category:', error);
      toast.error(error.response?.data?.message || t('updateCategoryError'));
    }
  };


  const handleAddCategory = async () => {
    if (!validateCategory()) return;

    try {
      await WarehouseService.createInventoryCategory({
        name: newCategory.name,
        description: newCategory.description,
        color: newCategory.color,
        parentId: newCategory.parentId === 'none' ? undefined : newCategory.parentId,
        networkId: networkId,
      });

      await loadNetworkData();
      setNewCategory({
        name: '',
        description: '',
        color: '#6b7280',
        parentId: 'none',
      });
      toast.success(t('categoryAdded'));
    } catch (error: any) {
      console.error('Failed to add category:', error);
      toast.error(error.response?.data?.message || t('addCategoryError'));
    }
  };
  const handleDeleteCategory = async (id: string) => {
    if (!confirm(t('confirmDeleteCategory'))) return;

    try {
      await WarehouseService.deleteInventoryCategory(id);
      await loadNetworkData();
      toast.success(t('categoryDeleted'));
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      toast.error(error.response?.data?.message || t('deleteCategoryError'));
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (categoryId === null) return t('uncategorized');
    const category = categories.find(c => c.id === categoryId);
    return category?.name || t('unknownCategory');
  };

  const getCategoryColor = (categoryId: string | null) => {
    if (categoryId === null) return '#6b7280';
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#6b7280';
  };

  const renderCategoryOptions = (categories: InventoryCategoryDto[], level = 0) => {
    return categories.map(category => (
      <React.Fragment key={category.id}>
        <SelectItem value={category.id}>
          {'\u00A0'.repeat(level * 4)}{category.name}
        </SelectItem>
        {category.children && renderCategoryOptions(category.children, level + 1)}
      </React.Fragment>
    ));
  };

  const getCategoryItems = (categoryId: string | null) => {
    return filteredItems.filter(item => {
      if (categoryId === null) {
        return !item.categoryId;
      }
      return item.categoryId === categoryId;
    });
  };

  const renderCategoryTree = (categories: InventoryCategoryDto[], level: number = 0) => {
    return categories.map(category => {
      const categoryItems = getCategoryItems(category.id);
      const hasItems = categoryItems.length > 0;
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.has(category.id);

      // Пропускаем категории, которые не соответствуют фильтру
      if (categoryFilter !== 'all' && categoryFilter !== category.id &&
        !(hasChildren && category.children?.some(child => categoryFilter === child.id))) {
        return null;
      }

      return (
        <Collapsible key={category.id}>
          <CollapsibleTrigger
            className="flex items-center gap-2 p-2 bg-muted rounded-md w-full text-left hover:bg-muted/80 transition-colors"
            style={{ marginLeft: `${level * 16}px` }}
            onClick={() => toggleCategory(category.id)}
          >
            {hasChildren || hasItems ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <div className="w-4" />
            )}
            <span className="font-medium">{category.name}</span>
            <Badge variant="secondary" className="ml-auto">
              {categoryItems.length}
            </Badge>
          </CollapsibleTrigger>

          <CollapsibleContent>
            {/* Items in this category */}
            {hasItems && (
              <div style={{ marginLeft: `${(level + 1) * 16}px` }}>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">{t('name')}</TableHead>
                        <TableHead className="min-w-[80px]">{t('unit')}</TableHead>
                        {restaurants.map(restaurant => (
                          <React.Fragment key={restaurant.id}>
                            <TableHead className="min-w-[100px] text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-medium truncate max-w-[80px]" title={restaurant.title}>
                                  {restaurant.title}
                                </span>
                                <div className="flex gap-4 text-xs">
                                  <span className="text-muted-foreground">{t('quantity')}</span>
                                  <span className="text-muted-foreground">{t('cost')}</span>
                                </div>
                              </div>
                            </TableHead>
                          </React.Fragment>
                        ))}
                        <TableHead className="min-w-[100px] text-center">{t('total')}</TableHead>
                        <TableHead className="min-w-[150px] text-right">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryItems.map((item) => {
                        const totalQuantity = getTotalNetworkQuantity(item);
                        const totalValue = getTotalNetworkValue(item);

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{item.name}</span>
                                {item.description && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                    {item.description}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{item.unit}</TableCell>

                            {restaurants.map(restaurant => (
                              <TableCell key={restaurant.id} className="text-center">
                                <div className="flex flex-col items-center">
                                  <span className="font-medium">
                                    {getItemQuantityByRestaurant(item, restaurant.id)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {getItemCostByRestaurant(item, restaurant.id)}
                                  </span>
                                </div>
                              </TableCell>
                            ))}

                            <TableCell className="text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-semibold">{totalQuantity}</span>
                                <span className="text-xs text-muted-foreground">
                                  {totalValue > 0 ? `${totalValue.toFixed(2)}₽` : '-'}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEditDialog(item)}
                                  title={t('edit')}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDeleteDialog(item)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  title={t('delete')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Child categories */}
            {hasChildren && category.children && (
              <div style={{ marginLeft: `${(level + 1) * 16}px` }}>
                {renderCategoryTree(category.children, level + 1)}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Заголовок и фильтры */}
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
        <div>
          <h1 className="text-2xl font-bold">{network?.name} - Сводка</h1>
          <p className="text-muted-foreground mt-1">
            Сводная инфрмация по складам ресторанов сети
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant='outline'>
                <Plus className="h-4 w-4 mr-2" />
                {t('addCategory')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('addCategory')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className='mb-1'>{t('name')}*</Label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder='Название категории'
                  />
                  {categoryErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{categoryErrors.name}</p>
                  )}
                </div>
                <div>
                  <Label className='mb-1'>{t('description')}</Label>
                  <Input
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder='Описание категории'
                  />
                </div>
                <div>
                  <Label className='mb-1'>{t('color')}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="w-12 h-12 p-1"
                    />
                    <Input
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="flex-1"
                      placeholder="#6b7280"
                    />
                  </div>
                </div>
                <div>
                  <Label className='mb-1'>{t('parentCategory')}</Label>
                  <Select
                    value={newCategory.parentId}
                    onValueChange={(value) => setNewCategory({ ...newCategory, parentId: value })}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder={t('parentCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('noParent')}</SelectItem>
                      {categories
                        .filter(cat => !cat.parentId)
                        .map(category => (
                          <React.Fragment key={category.id}>
                            <SelectItem value={category.id}>
                              {category.name}
                            </SelectItem>
                            {category.children && category.children.map(child => (
                              <SelectItem key={child.id} value={child.id}>
                                {'\u00A0'.repeat(4)}{child.name}
                              </SelectItem>
                            ))}
                          </React.Fragment>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddCategory} className="w-full">
                  {t('addCategory')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                {t('addItem')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('addItem')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className='mb-1'>{t('name')}*</Label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder='Название позиции'
                  />
                </div>
                <div>
                  <Label className='mb-1'>{t('description')}</Label>
                  <Input
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder='Описание позиции'
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className='mb-1'>{t('unit')}*</Label>
                    <Select
                      value={newItem.unit}
                      onValueChange={(value) => setNewItem({ ...newItem, unit: value })}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder={t('selectUnit')} />
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
                    <Label className='mb-1'>{t('filterByCategory')}</Label>
                    <Select
                      value={newItem.categoryId}
                      onValueChange={(value) => setNewItem({ ...newItem, categoryId: value })}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder={t('selectCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('uncategorized')}</SelectItem>
                        {renderCategoryOptions(categories.filter(cat => !cat.parentId))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAddItem} className="w-full">
                  {t('addItem')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>{t('inventory')}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="categories">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              <span>{t('categories')}</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                  {/* Поиск */}
                  <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder='Поиск...'
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Фильтры */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="w-full sm:w-48">
                      <Select
                        value={categoryFilter}
                        onValueChange={setCategoryFilter}
                      >
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder={t('filterByCategory')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('allCategories')}</SelectItem>
                          <SelectItem value="uncategorized">{t('uncategorized')}</SelectItem>
                          {categories
                            .filter(cat => !cat.parentId)
                            .map(category => (
                              <React.Fragment key={category.id}>
                                <SelectItem value={category.id}>
                                  {category.name}
                                </SelectItem>
                                {category.children && category.children.map(child => (
                                  <SelectItem key={child.id} value={child.id}>
                                    {'\u00A0'.repeat(4)}{child.name}
                                  </SelectItem>
                                ))}
                              </React.Fragment>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">

                {/* Uncategorized items */}
                {(categoryFilter === 'all' || categoryFilter === 'uncategorized') && (
                  <Collapsible>
                    <CollapsibleTrigger
                      className="flex items-center gap-2 p-2 bg-muted rounded-md w-full text-left hover:bg-muted/80 transition-colors"
                      onClick={() => toggleCategory('uncategorized')}
                    >
                      {expandedCategories.has('uncategorized') ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="font-medium">{t('uncategorized')}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {getCategoryItems(null).length}
                      </Badge>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      {getCategoryItems(null).length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="min-w-[200px]">{t('name')}</TableHead>
                                <TableHead className="min-w-[80px]">{t('unit')}</TableHead>
                                {restaurants.map(restaurant => (
                                  <React.Fragment key={restaurant.id}>
                                    <TableHead className="min-w-[100px] text-center">
                                      <div className="flex flex-col items-center">
                                        <span className="font-medium truncate max-w-[80px]" title={restaurant.title}>
                                          {restaurant.title}
                                        </span>
                                        {/* Добавляем подзаголовки для количества и стоимости */}
                                        <div className="flex gap-4 text-xs">
                                          <span className="text-muted-foreground">{t('quantity')}</span>
                                          <span className="text-muted-foreground">{t('cost')}</span>
                                        </div>
                                      </div>
                                    </TableHead>
                                  </React.Fragment>
                                ))}
                                {/* Добавляем столбец "Всего" */}
                                <TableHead className="min-w-[100px] text-center">{t('total')}</TableHead>
                                <TableHead className="min-w-[150px] text-right">{t('actions')}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getCategoryItems(null).map((item) => {
                                // Добавляем расчет общих значений
                                const totalQuantity = getTotalNetworkQuantity(item);
                                const totalValue = getTotalNetworkValue(item);

                                return (
                                  <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                      <div className="flex flex-col">
                                        <span>{item.name}</span>
                                        {item.description && (
                                          <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                                            {item.description}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>{item.unit}</TableCell>

                                    {restaurants.map(restaurant => (
                                      <TableCell key={restaurant.id} className="text-center">
                                        {/* Добавляем отображение цены для каждого ресторана */}
                                        <div className="flex flex-col items-center">
                                          <span className="font-medium">
                                            {getItemQuantityByRestaurant(item, restaurant.id)}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {getItemCostByRestaurant(item, restaurant.id)}
                                          </span>
                                        </div>
                                      </TableCell>
                                    ))}

                                    {/* Добавляем столбец "Всего" */}
                                    <TableCell className="text-center">
                                      <div className="flex flex-col items-center">
                                        <span className="font-semibold">{totalQuantity}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {totalValue > 0 ? `${totalValue.toFixed(2)}₽` : '-'}
                                        </span>
                                      </div>
                                    </TableCell>

                                    <TableCell>
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleOpenEditDialog(item)}
                                          title={t('edit')}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleOpenDeleteDialog(item)}
                                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                          title={t('delete')}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          {t('noItemsInCategory')}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Categorized items */}
                {renderCategoryTree(categories.filter(cat => !cat.parentId), 0)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-full">{t('name')}</TableHead>
                      <TableHead className="w-[200px] text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          {t('noCategories')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories
                        .filter(category => !category.parentId)
                        .map(category => {
                          const categoryItems = inventoryItems.filter(item => item.categoryId === category.id);
                          const childCategories = categories.filter(cat => cat.parentId === category.id);

                          return (
                            <React.Fragment key={category.id}>
                              {/* Родительская категория */}
                              <TableRow>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {category.name}
                                  </div>
                                </TableCell>

                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingCategory(category);
                                        setEditCategoryData({
                                          name: category.name,
                                          description: category.description || '',
                                          color: category.color || '#6b7280',
                                          parentId: category.parentId || 'none'
                                        });
                                        setEditCategoryDialogOpen(true);
                                      }}
                                    >
                                      Редактировать
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteCategory(category.id)}
                                    >
                                      Удалить
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>

                              {/* Дочерние категории */}
                              {childCategories.map(childCategory => {
                                const childCategoryItems = inventoryItems.filter(item => item.categoryId === childCategory.id);

                                return (
                                  <TableRow key={childCategory.id} className="bg-muted/50">
                                    <TableCell className="pl-8">
                                      <div className="flex items-center gap-2">
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        {childCategory.name}
                                      </div>
                                    </TableCell>
                                    <TableCell className="pl-8">
                                      <div className="max-w-[180px] truncate">
                                        {childCategory.description || '-'}
                                      </div>
                                    </TableCell>
                                    <TableCell className="pl-8 text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setEditingCategory(childCategory);
                                            setEditCategoryData({
                                              name: childCategory.name,
                                              description: childCategory.description || '',
                                              color: childCategory.color || '#6b7280',
                                              parentId: childCategory.parentId || 'none'
                                            });
                                            setEditCategoryDialogOpen(true);
                                          }}
                                        >
                                          Редактировать
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteCategory(childCategory.id)}
                                        >
                                          Удалить
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </React.Fragment>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Edit Category Dialog */}
          <Dialog open={editCategoryDialogOpen} onOpenChange={setEditCategoryDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('editCategory')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className='mb-1'>{t('name')}*</Label>
                  <Input
                    value={editCategoryData.name}
                    onChange={(e) => setEditCategoryData({ ...editCategoryData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label className='mb-1'>{t('description')}</Label>
                  <Input
                    value={editCategoryData.description}
                    onChange={(e) => setEditCategoryData({ ...editCategoryData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label className='mb-1'>{t('color')}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={editCategoryData.color}
                      onChange={(e) => setEditCategoryData({ ...editCategoryData, color: e.target.value })}
                      className="w-12 h-12 p-1"
                    />
                    <Input
                      value={editCategoryData.color}
                      onChange={(e) => setEditCategoryData({ ...editCategoryData, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className='mb-1'>{t('parentCategory')}</Label>
                  <Select
                    value={editCategoryData.parentId}
                    onValueChange={(value) => setEditCategoryData({ ...editCategoryData, parentId: value })}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder={t('parentCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('noParent')}</SelectItem>
                      {categories
                        .filter(cat => !cat.parentId && cat.id !== editingCategory?.id)
                        .map(category => (
                          <React.Fragment key={category.id}>
                            <SelectItem value={category.id}>
                              {category.name}
                            </SelectItem>
                            {category.children && category.children
                              .filter(child => child.id !== editingCategory?.id)
                              .map(child => (
                                <SelectItem key={child.id} value={child.id}>
                                  {'\u00A0'.repeat(4)}{child.name}
                                </SelectItem>
                              ))
                            }
                          </React.Fragment>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleUpdateCategory}>{t('saveChanges')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

      </Tabs>

      {/* Edit Item Dialog */}
      <Dialog open={editItemDialogOpen} onOpenChange={setEditItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editItem')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className='mb-1'>{t('name')}*</Label>
              <Input
                value={editItemData.name}
                onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value })}
              />
            </div>
            <div>
              <Label className='mb-1'>{t('description')}</Label>
              <Input
                value={editItemData.description}
                onChange={(e) => setEditItemData({ ...editItemData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className='mb-1'>{t('unit')}*</Label>
                <Select
                  value={editItemData.unit}
                  onValueChange={(value) => setEditItemData({ ...editItemData, unit: value })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder={t('selectUnit')} />
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
                <Label className='mb-1'>{t('filterByCategory')}</Label>
                <Select
                  value={editItemData.categoryId}
                  onValueChange={(value) => setEditItemData({ ...editItemData, categoryId: value })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder={t('selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('uncategorized')}</SelectItem>
                    {renderCategoryOptions(categories.filter(cat => !cat.parentId))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSaveItemChanges}>{t('saveChanges')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Item Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {t('deleteItem')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-3">
                <div>
                  <h4 className="font-semibold">{itemToDelete?.name}</h4>
                  <p className="text-sm text-gray-600">
                    {t('unit')}: {itemToDelete?.unit}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700 font-medium">
                {t('deleteNetworkItemWarning')}
              </p>
              <p className="text-xs text-red-600 mt-1">
                {t('deleteNetworkItemDescription')}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteItem}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('confirmDelete')}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}