'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { InventoryItemDto, InventoryTransactionType, WarehouseService, InventoryCategoryDto } from '@/lib/api/warehouse.service';
import { useLanguageStore } from '@/lib/stores/language-store';
import { transactionsTranslations, warehouseTranslations } from './translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionsTable } from '@/components/features/warehouse/TransactionsTable';
import { Refrigerator, Package, ArrowLeftRight, CalendarDays, ChefHat, List, Plus, Edit, Folder, FolderOpen, Tag, ChevronDown, ChevronRight, Boxes, Warehouse, BarChart3, AlertTriangle, Info, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import SearchableSelect from '@/components/features/menu/product/SearchableSelect';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import React from 'react';
import { useDictionaries } from '@/lib/hooks/useDictionaries';
import { useAuth } from '@/lib/hooks/useAuth';
import { RestaurantService } from '@/lib/api/restaurant.service';

export default function WarehousePage() {
  const params = useParams();
  const { language } = useLanguageStore();
  const t = (key: string) => {
    const transactionsTranslation = transactionsTranslations[key as keyof typeof transactionsTranslations];
    const warehouseTranslation = warehouseTranslations[key as keyof typeof warehouseTranslations];

    return transactionsTranslation?.[language] ||
      warehouseTranslation?.[language] ||
      key;
  };

  const restaurantId = params.id as string;

  const [warehouse, setWarehouse] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [premixes, setPremixes] = useState<any[]>([]);
  const [categories, setCategories] = useState<InventoryCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');
  const [locationFilter, setLocationFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [allCategories, setAllCategories] = useState<InventoryCategoryDto[]>([]);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [dateFilterOpen, setDateFilterOpen] = useState(false);

  const [newItem, setNewItem] = useState({
    name: '',
    unit: 'kg',
    quantity: 0,
    storageLocationId: 'none',
    categoryId: 'none',
    cost: 0,
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

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#6b7280',
    parentId: 'none',
  });
  const [categoryErrors, setCategoryErrors] = useState({
    name: '',
  });

  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'receipt' | 'writeoff'>('receipt');
  const [currentItem, setCurrentItem] = useState<any>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLInputElement>(null);

  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editItemData, setEditItemData] = useState({
    name: '',
    unit: 'kg',
    storageLocationId: 'none',
    categoryId: 'none',
  });
  const [editItemErrors, setEditItemErrors] = useState({
    name: '',
  });

  const [newPremix, setNewPremix] = useState({
    name: '',
    description: '',
    unit: 'kg',
    yield: 1,
    warehouseId: '',
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
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editCategoryData, setEditCategoryData] = useState({
    name: '',
    description: '',
    color: '#6b7280',
    parentId: 'none',
  });

  const { writeOffReasons, receiptReasons, loading: dictionariesLoading, error: dictionariesError } = useDictionaries(restaurantId);
  const [selectedReason, setSelectedReason] = useState('');

  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [editingCostItem, setEditingCostItem] = useState<any>(null);
  const [newCost, setNewCost] = useState(0);
  const [inventoryValue, setInventoryValue] = useState<{
    totalValue: number;
    itemsCount: number;
    averageCost: number;
  } | null>(null);

  const [deleteItemDialogOpen, setDeleteItemDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [editWarehouseDialogOpen, setEditWarehouseDialogOpen] = useState(false);
  const [warehouseName, setWarehouseName] = useState(warehouse?.name || '');
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    checkUserRole();
  }, []);
  const { user } = useAuth()
  const checkUserRole = async () => {
    try {

      const userRole = user.role;
      // Предполагаем, что админы и супервайзеры имеют соответствующие роли
      setIsAdmin(['admin', 'supervisor', 'ADMIN', 'SUPERVISOR'].includes(userRole));
    } catch (error) {
      console.error('Failed to check user role:', error);
      setIsAdmin(false);
    }
  };

  const loadRestaurantData = async () => {
    try {
      const restaurantData = await RestaurantService.getById(restaurantId);
      setRestaurant(restaurantData);
      return restaurantData;
    } catch (error) {
      console.error('Failed to load restaurant data:', error);
      return null;
    }
  };


  // Функция для обновления названия склада
  const handleUpdateWarehouseName = async () => {
    if (!warehouseName.trim()) {
      toast.error(t('nameRequired'));
      return;
    }

    try {
      await WarehouseService.updateWarehouse(warehouse.id, {
        name: warehouseName
      });

      await loadWarehouseData();
      setEditWarehouseDialogOpen(false);
      toast.success(t('warehouseNameUpdated'));
    } catch (error: any) {
      console.error('Failed to update warehouse name:', error);
      toast.error(error.response?.data?.message || t('updateWarehouseError'));
    }
  };
  const handleUpdateCost = async () => {
    if (!editingCostItem || newCost < 0) return;

    try {
      await WarehouseService.updateItemCost(
        editingCostItem.id,
        newCost
      );
      await loadWarehouseData();
      setCostDialogOpen(false);
      toast.success(t('costUpdated'));
    } catch (error: any) {
      console.error('Failed to update cost:', error);
      toast.error(error.response?.data?.message || t('updateCostError'));
    }
  };

  const handleOpenCostDialog = (item: any) => {
    setEditingCostItem(item);
    setNewCost(item.cost || 0);
    setCostDialogOpen(true);
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

      await loadWarehouseData();
      setEditCategoryDialogOpen(false);
      toast.success(t('categoryUpdated'));
    } catch (error: any) {
      console.error('Failed to update category:', error);
      toast.error(error.response?.data?.message || t('updateCategoryError'));
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await WarehouseService.deleteInventoryCategory(id);
      await loadWarehouseData();
      toast.success(t('categoryDeleted'));
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      toast.error(error.response?.data?.message || t('deleteCategoryError'));
    }
  };

  useEffect(() => {
    loadWarehouseData();
  }, [restaurantId]);

  useEffect(() => {
    if (warehouse?.id) {
      setNewPremix(prev => ({ ...prev, warehouseId: warehouse.id }));
    }
  }, [warehouse]);

  useEffect(() => {
    filterItems();
  }, [items, locationFilter, categoryFilter]);

  const loadWarehouseData = async () => {
    try {
      setLoading(true);

      // Загружаем данные ресторана
      const restaurantData = await loadRestaurantData();
      if (!restaurantData) return;

      const warehouseData = await WarehouseService.getRestaurantWarehouse(restaurantId);
      const items = await WarehouseService.getWarehouseItems(warehouseData.id);
      const locations = await WarehouseService.listStorageLocations(warehouseData.id);

      // Получаем категории по сети
      const categoriesData = restaurantData.networkId
        ? await WarehouseService.getCategoryTreeByNetwork(restaurantData.networkId)
        : await WarehouseService.getCategoryTree();

      // Получаем все категории по сети
      const allCategoriesData = restaurantData.networkId
        ? await WarehouseService.getInventoryCategoriesByNetwork(restaurantData.networkId)
        : await WarehouseService.getAllInventoryCategories();

      setWarehouse(warehouseData);
      setItems(items || []);
      setLocations(locations || []);
      setCategories(categoriesData || []);
      setAllCategories(allCategoriesData || []);

      // Получаем премиксы по сети
      const premixesData = restaurantData.networkId
        ? await WarehouseService.getPremixesByNetwork(restaurantData.networkId)
        : await WarehouseService.listWarehousePremixes(warehouseData.id);

      setPremixes(premixesData);
    } catch (error) {
      console.error('Failed to load warehouse data:', error);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items.filter(item => !item.premixId && item.inventoryItem?.isActive !== false);

    if (locationFilter !== 'all') {
      filtered = filtered.filter(item => item.storageLocationId === locationFilter);
    }

    if (categoryFilter !== 'all') {
      if (categoryFilter === 'uncategorized') {
        filtered = filtered.filter(item => !item.inventoryItem?.categoryId);
      } else {
        filtered = filtered.filter(item => item.inventoryItem?.categoryId === categoryFilter);
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

  const calculatePremixCost = (premix: any): number => {
    if (!premix?.ingredients || !items.length) return 0;

    let totalCost = 0;

    premix.ingredients.forEach((ingredient: any) => {
      const inventoryItem = items.find(item =>
        item.inventoryItem?.id === ingredient.inventoryItemId ||
        item.id === ingredient.inventoryItemId
      );

      if (inventoryItem?.cost && ingredient.quantity) {
        totalCost += inventoryItem.cost * ingredient.quantity;
      }
    });

    return totalCost;
  };

  const calculatePremixCostPerUnit = (premix: any): number => {
    const totalCost = calculatePremixCost(premix);
    return premix?.yield ? totalCost / premix.yield : 0;
  };
  const getCategoryItems = (categoryId: string | null) => {
    return filteredItems.filter(item => {
      if (categoryId === null) {
        return !item.inventoryItem?.categoryId;
      }
      return item.inventoryItem?.categoryId === categoryId;
    });
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

  const getParentCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = allCategories.find(c => c.id === categoryId);
    return category?.parentId ? allCategories.find(c => c.id === category.parentId)?.name : null;
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

  const handleAddItem = async () => {
    if (!validateItem() || !restaurant?.networkId) return;

    try {
      const inventoryItem = await WarehouseService.createInventoryItem({
        name: newItem.name,
        unit: newItem.unit,
        description: '',
        categoryId: newItem.categoryId === 'none' ? undefined : newItem.categoryId,
        networkId: restaurant.networkId, // Добавляем networkId
        addToWarehouseId: warehouse.id, // Добавляем склад для автоматического создания warehouseItem
        initialQuantity: newItem.quantity,
      });

      await loadWarehouseData();

      setNewItem({
        name: '',
        unit: 'kg',
        quantity: 0,
        storageLocationId: 'none',
        categoryId: 'none',
        cost: 0,
      });

      toast.success(t('itemAdded'));
    } catch (error: any) {
      console.error('Failed to add item:', error);
      toast.error(error.response?.data?.message || t('addItemError'));
    }
  };

  const handleAddLocation = async () => {
    if (!validateLocation() || !restaurant?.networkId) return;

    try {
      await WarehouseService.createStorageLocation(warehouse.id, {
        ...newLocation,
        networkId: restaurant.networkId, 
      });
      await loadWarehouseData();
      setNewLocation({ name: '', code: '' });
      toast.success(t('locationAdded'));
    } catch (error: any) {
      console.error('Failed to add location:', error);
      toast.error(error.response?.data?.message || t('addLocationError'));
    }
  };

  const handleAddCategory = async () => {
    if (!validateCategory() || !restaurant?.networkId) return;

    try {
      await WarehouseService.createInventoryCategory({
        name: newCategory.name,
        description: newCategory.description,
        color: newCategory.color,
        parentId: newCategory.parentId === 'none' ? undefined : newCategory.parentId,
        networkId: restaurant.networkId, // Добавляем networkId
      });

      await loadWarehouseData();
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

  const handleBulkUpdateCategory = async (itemIds: string[], categoryId: string | null) => {
    try {
      await WarehouseService.bulkUpdateItemsCategory(itemIds, categoryId);
      await loadWarehouseData();
      toast.success(t('bulkUpdateSuccess'));
    } catch (error: any) {
      console.error('Failed to bulk update category:', error);
      toast.error(t('bulkUpdateError'));
    }
  };

  const handleOpenTransactionDialog = (item: any) => {
    setCurrentItem(item);
    setTransactionDialogOpen(true);
    setTransactionType('receipt');
  };

  const handleOpenEditDialog = (item: any) => {
    setEditingItem(item);
    setEditItemData({
      name: item.inventoryItem?.name || item.name,
      unit: item.inventoryItem?.unit || item.unit,
      storageLocationId: item.storageLocationId || 'none',
      categoryId: item.inventoryItem?.categoryId || 'none',
    });
    setEditItemDialogOpen(true);
  };

  const handleSaveItemChanges = async () => {
    if (!validateEditItem() || !editingItem) return;

    try {
      await WarehouseService.updateInventoryItem(
        editingItem.inventoryItem?.id || editingItem.id,
        {
          name: editItemData.name,
          unit: editItemData.unit,
          categoryId: editItemData.categoryId === 'none' ? undefined : editItemData.categoryId,
        }
      );

      await WarehouseService.updateWarehouseItem(editingItem.id, {
        storageLocationId: editItemData.storageLocationId === 'none' ? undefined : editItemData.storageLocationId
      });

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

  const handleSubmitTransaction = async () => {
    if (!currentItem || !quantityRef.current || !warehouse?.id) return;

    const quantity = Number(quantityRef.current.value);
    const unitCost = unitCostRef.current ? Number(unitCostRef.current.value) : undefined;
    const reason = reasonRef.current?.value || '';

    if (quantity <= 0) {
      toast.error(t('quantityPositive'));
      return;
    }

    if (transactionType === 'receipt' && unitCost === undefined) {
      toast.error(t('unitCostRequired'));
      return;
    }

    if (transactionType === 'writeoff' && !selectedReason) {
      toast.error(t('reasonRequired'));
      return;
    }

    try {
      const transactionTypeEnum = transactionType === 'receipt' ? 'RECEIPT' : 'WRITE_OFF';

      await WarehouseService.createTransaction({
        inventoryItemId: currentItem.inventoryItem?.id || currentItem.id,
        type: transactionTypeEnum as InventoryTransactionType,
        warehouseId: warehouse.id,
        quantity: quantity,
        unitCost: unitCost,
        reason: selectedReason,
      });

      if (transactionType === 'receipt') {
        toast.success(t('receiptSuccess'));
      } else {
        toast.success(t('writeOffSuccess'));
      }

      await loadWarehouseData();
      setTransactionDialogOpen(false);
    } catch (error: any) {
      console.error('Transaction error:', error);
      toast.error(error.response?.data?.message || t('transactionError'));
    }
  };

  const loadPremixDetails = async (premixId: string) => {
    try {
      const details = await WarehouseService.getPremixWithWarehouseDetails(
        premixId,
        warehouse.id
      );
      setSelectedPremix(details);
      setPremixIngredients(details.ingredients || []);
    } catch (error) {
      console.error('Failed to load premix details:', error);
      toast.error(t('loadError'));
    }
  };

  const loadPremixTransactions = async (premixId: string) => {
    try {
      const data = await WarehouseService.getPremixTransactions(
        premixId,
        warehouse.id
      );
      setTransactions(data);
      setActiveTab('transactions');
    } catch (error) {
      console.error('Failed to load premix transactions:', error);
      toast.error(t('loadTransactionsError'));
    }
  };
  const unitCostRef = useRef<HTMLInputElement>(null);


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

  const handleAddPremix = async () => {
    if (!validatePremix() || !restaurant?.networkId) return;

    try {
      const ingredients = premixIngredients.map(ing => ({
        inventoryItemId: ing.inventoryItem?.id || ing.inventoryItemId,
        quantity: ing.quantity
      }));

      const dto = {
        name: newPremix.name,
        description: newPremix.description,
        unit: newPremix.unit,
        yield: newPremix.yield,
        ingredients,
        networkId: restaurant.networkId, // Добавляем networkId
      };

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

    const item = items.find(i => i.inventoryItem?.id === newIngredient.inventoryItemId || i.id === newIngredient.inventoryItemId);
    if (!item) return;

    setPremixIngredients([
      ...premixIngredients,
      {
        inventoryItem: item.inventoryItem || item,
        inventoryItemId: item.inventoryItem?.id || item.id,
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

  const handleOpenDeleteDialog = (item: any) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      await WarehouseService.deleteInventoryItem(
        itemToDelete.inventoryItem?.id || itemToDelete.id
      );

      await loadWarehouseData();
      setDeleteDialogOpen(false);
      toast.success(t('itemDeleted'));
    } catch (error: any) {
      console.error('Failed to delete item:', error);
      let errorMessage = t('deleteItemError');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

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
      let errorMessage = t('preparePremixError');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast.error(errorMessage);
    }
  };

  const loadWarehouseTransactions = async () => {
    if (!warehouse?.id) return;

    try {
      const data = await WarehouseService.getWarehouseTransactions(
        warehouse.id,
        {
          startDate: dateRange?.from,
          endDate: dateRange?.to,
          type: undefined,
        }
      );
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load warehouse transactions:', error);
      toast.error(t('loadTransactionsError'));
    }
  };

  const loadWarehouseTransactionsByDate = async () => {
    if (!dateRange?.from || !dateRange?.to || !warehouse?.id) return;

    try {
      const data = await WarehouseService.getWarehouseTransactions(
        warehouse.id,
        {
          startDate: dateRange.from,
          endDate: dateRange.to,
          type: undefined,
        }
      );

      setTransactions(data);
      setActiveTab('transactions');
    } catch (error) {
      console.error('Failed to load transactions by date:', error);
      toast.error(t('loadTransactionsError'));
    }
  };

  const loadItemTransactions = async (itemId: string) => {
    try {
      const data = await WarehouseService.getItemTransactions(itemId);
      const filteredTransactions = data.filter(
        transaction => transaction.warehouseItem?.warehouseId === warehouse?.id
      );
      setTransactions(filteredTransactions);
      setActiveTab('transactions');
    } catch (error) {
      console.error('Failed to load transactions:', error);
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
      await WarehouseService.updatePremix(editingPremix.id, {
        name: editPremixData.name,
        description: editPremixData.description,
        unit: editPremixData.unit,
        yield: editPremixData.yield,
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
        const existingIng = currentIngredients.find((i: any) => i.inventoryItemId === ingredientId);

        if (existingIng) {
          await WarehouseService.updatePremixIngredient(
            editingPremix.id,
            ingredientId,
            ing.quantity
          );
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

  const parentCategories = categories.filter(cat => !cat.parentId);
  const childCategories = categories.filter(cat => cat.parentId);

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
            className="flex items-center gap-2 p-2 bg-muted rounded-md w-full text-left"
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
              <div className="w-4" /> // Placeholder for alignment
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('name')}</TableHead>
                      <TableHead>{t('quantity')}</TableHead>
                      <TableHead>{t('unit')}</TableHead>
                      <TableHead>{t('cost')}</TableHead>
                      <TableHead>{t('totalValue')}</TableHead>
                      <TableHead>{t('location')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead className="text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.inventoryItem?.name || item.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.inventoryItem?.unit || item.unit}</TableCell>
                        <TableCell>
                          {item.cost ? `${item.cost.toFixed(2)}₽` : t('notSet')}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenCostDialog(item)}
                            className="ml-2"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TableCell>
                        <TableCell>
                          {item.cost && item.quantity ? `${(item.cost * item.quantity).toFixed(2)}₽` : t('notSet')}
                        </TableCell>
                        <TableCell>
                          {item.storageLocationId
                            ? locations.find(l => l.id === item.storageLocationId)?.name
                            : t('noLocation')}
                        </TableCell>
                        <TableCell>
                          {item.inventoryItem?.isActive !== false ? (
                            <span className="text-green-600">{t('active')}</span>
                          ) : (
                            <span className="text-red-600">{t('inactive')}</span>
                          )}
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
                              onClick={() => loadItemTransactions(item.inventoryItem?.id || item.id)}
                            >
                              {t('transactions')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDeleteDialog(item)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              {t('delete')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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

  return (
    <div className="p-4 space-y-6">
      {/* Шапка с названием и кнопками */}
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{warehouse.name}</h1>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setWarehouseName(warehouse.name);
                setEditWarehouseDialogOpen(true);
              }}
              className="h-8 w-8 p-0"
              title={t('editWarehouseName')}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Контейнер для кнопок - адаптивный */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Dialog>

            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">{t('addLocation')}</Button>
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
              <Button variant="outline" className="w-full sm:w-auto">{t('addCategory')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('addCategory')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className='mb-1'>{t('name')}</Label>
                  <Input
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
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
                      {renderCategoryOptions(categories.filter(cat => !cat.parentId))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddCategory}>{t('addCategory')}</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">{t('addItem')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
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
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div>
                  <Label className='mb-1'>{t('cost')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.cost || ''}
                    onChange={(e) => setNewItem({ ...newItem, cost: Number(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className='mb-1'>{t('location')}</Label>
                    <Select
                      value={newItem.storageLocationId}
                      onValueChange={(value) => setNewItem({ ...newItem, storageLocationId: value })}
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
                  <div>
                    <Label className='mb-1'>{t('filterByCategory')}</Label>
                    <Select
                      value={newItem.categoryId}
                      onValueChange={(value) => setNewItem({ ...newItem, categoryId: value })}
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder={t('filterByCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t('uncategorized')}</SelectItem>
                        {renderCategoryOptions(categories)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleAddItem}>{t('addItem')}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full flex-col gap-2 sm:flex-row sm:grid sm:grid-cols-5">
          <TabsTrigger value="inventory" className="flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Package className="h-4 w-4 flex-shrink-0" />
              <span className="truncate text-xs sm:text-sm">{t('inventory')}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Folder className="h-4 w-4 flex-shrink-0" />
              <span className="truncate text-xs sm:text-sm">{t('categories')}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Refrigerator className="h-4 w-4 flex-shrink-0" />
              <span className="truncate text-xs sm:text-sm">{t('locations')}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="premixes" className="flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <ChefHat className="h-4 w-4 flex-shrink-0" />
              <span className="truncate text-xs sm:text-sm">{t('premixes')}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <ArrowLeftRight className="h-4 w-4 flex-shrink-0" />
              <span className="truncate text-xs sm:text-sm">{t('transactions')}</span>
            </div>
          </TabsTrigger>
        </TabsList>


        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <CardTitle>{t('inventory')}</CardTitle>
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                  <div className="w-full sm:w-48">
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
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      className="flex items-center gap-2 p-2 bg-muted rounded-md w-full text-left"
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
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('name')}</TableHead>
                              <TableHead>{t('quantity')}</TableHead>
                              <TableHead>{t('unit')}</TableHead>
                              <TableHead>{t('location')}</TableHead>
                              <TableHead>{t('status')}</TableHead>
                              <TableHead className="text-right">{t('actions')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getCategoryItems(null).map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.inventoryItem?.name || item.name}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.inventoryItem?.unit || item.unit}</TableCell>
                                <TableCell>
                                  {item.storageLocationId
                                    ? locations.find(l => l.id === item.storageLocationId)?.name
                                    : t('noLocation')}
                                </TableCell>
                                <TableCell>
                                  {item.inventoryItem?.isActive !== false ? (
                                    <span className="text-green-600">{t('active')}</span>
                                  ) : (
                                    <span className="text-red-600">{t('inactive')}</span>
                                  )}
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
                                      onClick={() => loadItemTransactions(item.inventoryItem?.id || item.id)}
                                    >
                                      {t('transactions')}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenDeleteDialog(item)}
                                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                    >
                                      {t('delete')}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          {t('noItemsInCategory')}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Recursive category rendering */}
                {renderCategoryTree(categories, 0)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('categories')}</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>{t('addCategory')}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    {/* Диалог добавления категории */}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-full">{t('name')}</TableHead>
                      <TableHead className="w-[150px] text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center">
                          {t('noCategories')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories
                        .filter(category => !category.parentId)
                        .map(category => (
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
                                        color: category.color || '#ffffff',
                                        parentId: category.parentId || 'none'
                                      });
                                      setEditCategoryDialogOpen(true);
                                    }}
                                  >
                                    {t('edit')}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCategory(category.id)}
                                  >
                                    {t('delete')}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {category.children && category.children.map(childCategory => (
                              <TableRow key={childCategory.id}>
                                <TableCell className="pl-8">
                                  <div className="flex items-center gap-2">
                                    {childCategory.name}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingCategory(childCategory);
                                        setEditCategoryData({
                                          name: childCategory.name,
                                          description: childCategory.description || '',
                                          color: childCategory.color || '#ffffff',
                                          parentId: childCategory.parentId || 'none'
                                        });
                                        setEditCategoryDialogOpen(true);
                                      }}
                                    >
                                      {t('edit')}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteCategory(childCategory.id)}
                                    >
                                      {t('delete')}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Edit Category Dialog */}
          <Dialog open={editCategoryDialogOpen} onOpenChange={setEditCategoryDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('editCategory')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className='mb-1'>{t('name')}</Label>
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
                                      <TableCell>{ingredient.inventoryItem?.name || items.find(i => i.id === ingredient.inventoryItemId)?.inventoryItem?.name} </TableCell>
                                      <TableCell>{ingredient.quantity} {ingredient.inventoryItem?.unit || items.find(i => i.id === ingredient.inventoryItemId)?.inventoryItem?.unit}</TableCell>
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
                                  id: item.inventoryItem?.id || item.id,
                                  label: `${item.inventoryItem?.name || item.name} (${item.inventoryItem?.unit || item.unit})`
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
                    <TableHead>{t('cost')}</TableHead>
                    <TableHead>{t('ingredients')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {premixes.map((premix) => {
                    const premixInventoryItem = items.find(item =>
                      item.inventoryItem?.premixId === premix.id
                    );

                    const premixWarehouseItem = items.find(item =>
                      item.premixId === premix.id
                    );

                    const premixItem = premixInventoryItem || premixWarehouseItem;

                    const ingredientsCount = premix.ingredients?.length;
                    const totalCost = calculatePremixCost(premix);
                    const costPerUnit = calculatePremixCostPerUnit(premix);

                    return (
                      <TableRow key={premix.id}>
                        <TableCell className="font-medium">{premix.name}</TableCell>

                        <TableCell>
                          {Math.max(premixItem?.quantity)}
                        </TableCell>

                        <TableCell>{premix.unit}</TableCell>
                        <TableCell>{premix.yield}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{costPerUnit.toFixed(2)}₽/{premix.unit}</span>
                          </div>
                        </TableCell>
                        <TableCell>{ingredientsCount}</TableCell>
                        <TableCell>{ingredientsCount}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                loadPremixDetails(premix.id);
                                setSelectedPremix(premix);
                                setPrepareDialogOpen(true);
                              }}
                              title={t('prepare')}
                            >
                              {t('prepare')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditPremixDialog(premix)}
                              title={t('edit')}
                            >
                              {t('edit')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                loadPremixTransactions(premix.id);
                              }}
                              title={t('transactions')}
                            >
                              {t('transactions')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <CardTitle>{t('transactions')}</CardTitle>
                <div className="flex flex-wrap gap-4 items-center">
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
                    <PopoverContent className="w-auto p-0" align="start">
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

                  <Select
                    value={'all'}
                    onValueChange={(value) => {
                      // Фильтрация по типу
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={t('filterByType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allTypes')}</SelectItem>
                      <SelectItem value="RECEIPT">{t('receipt')}</SelectItem>
                      <SelectItem value="WRITE_OFF">{t('writeOff')}</SelectItem>
                      <SelectItem value="CORRECTION">{t('correction')}</SelectItem>
                      <SelectItem value="TRANSFER">{t('transfer')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={loadWarehouseTransactions}
                    variant="outline"
                    size="sm"
                  >
                    {t('applyFilters')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TransactionsTable
                transactions={transactions}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={transactionDialogOpen} onOpenChange={(open) => {
        setTransactionDialogOpen(open);
        if (!open) {
          setSelectedReason(''); // Сбрасываем при закрытии
        }
      }}>
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
                onClick={() => {
                  setTransactionType('receipt');
                  setSelectedReason('');
                }}
              >
                {t('receipt')}
              </Button>
              <Button
                variant={transactionType === 'writeoff' ? 'default' : 'outline'}
                onClick={() => {
                  setTransactionType('writeoff');
                  setSelectedReason('');
                }}
              >
                {t('writeOff')}
              </Button>
            </div>

            <div>
              <Label className='mb-1'>{t('quantity')} ({currentItem?.inventoryItem?.unit || currentItem?.unit})</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                ref={quantityRef}
              />
              {transactionType === 'writeoff' && currentItem && (
                <p className="text-sm text-muted-foreground">
                  {t('available')}: {currentItem.quantity} {currentItem.inventoryItem?.unit || currentItem.unit}
                </p>
              )}
            </div>

            {transactionType === 'receipt' && (
              <div>
                <Label className='mb-1'>{t('unitCost')} (₽)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                  ref={unitCostRef}
                />
              </div>
            )}

            <div>
              <Label className='mb-1'>{t('reason')}</Label>
              {dictionariesLoading ? (
                <div className="text-sm text-muted-foreground">{t('loadingReasons')}</div>
              ) : dictionariesError ? (
                <div className="text-sm text-red-500">{t('loadReasonsError')}</div>
              ) : (
                <SearchableSelect
                  options={
                    transactionType === 'receipt'
                      ? receiptReasons
                        .filter(reason => reason.isActive)
                        .map(reason => ({
                          id: reason.id,
                          label: reason.name
                        }))
                      : writeOffReasons
                        .filter(reason => reason.isActive)
                        .map(reason => ({
                          id: reason.id,
                          label: reason.name
                        }))
                  }
                  value={selectedReason ? [selectedReason] : []}
                  onChange={(ids) => setSelectedReason(ids[0] || '')}
                  placeholder={t('selectReason')}
                  searchPlaceholder={t('searchReason')}
                  emptyText={t('noReasonsFound')}
                  multiple={false}
                  className="w-full"
                />
              )}
            </div>

            <Button
              onClick={handleSubmitTransaction}
              disabled={transactionType === 'writeoff' && !selectedReason}
            >
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
            <div>
              <Label className='mb-1'>{t('filterByCategory')}</Label>
              <Select
                value={editItemData.categoryId}
                onValueChange={(value) => setEditItemData({ ...editItemData, categoryId: value })}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder={t('filterByCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('uncategorized')}</SelectItem>
                  {renderCategoryOptions(categories)}
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
                            <TableCell>{ingredient.inventoryItem?.name || items.find(i => i.id === ingredient.inventoryItemId)?.inventoryItem?.name}</TableCell>
                            <TableCell>{ingredient.quantity} {ingredient.inventoryItem?.unit || items.find(i => i.id === ingredient.inventoryItemId)?.inventoryItem?.unit}</TableCell>
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
                        id: item.inventoryItem?.id || item.id,
                        label: `${item.inventoryItem?.name || item.name} (${item.inventoryItem?.unit || item.unit})`
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

      <Dialog open={prepareDialogOpen} onOpenChange={setPrepareDialogOpen}>
        <DialogContent className='w-full p-2'>
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

            {/* Блок с расчетом стоимости */}
            {selectedPremix && (
              <div className="p-3 bg-muted rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{t('cost')}:</span>
                  <span className="font-bold text-lg">
                    {(calculatePremixCostPerUnit(selectedPremix) * prepareQuantity).toFixed(2)}₽
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {calculatePremixCostPerUnit(selectedPremix).toFixed(2)}₽/{selectedPremix.unit} × {prepareQuantity}
                </div>
              </div>
            )}
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
                        const availableItem = items.find(i =>
                          i.inventoryItem?.id === ingredient.inventoryItemId || i.id === ingredient.inventoryItemId
                        );
                        const available = availableItem?.quantity || 0;
                        const isEnough = available >= required;

                        return (
                          <TableRow key={index} className={!isEnough ? 'bg-red-50' : ''}>
                            <TableCell>{ingredient.inventoryItem?.name || availableItem?.inventoryItem?.name}</TableCell>
                            <TableCell>
                              {required.toFixed(2)} {ingredient.inventoryItem?.unit || availableItem?.inventoryItem?.unit}
                            </TableCell>
                            <TableCell>
                              {available.toFixed(2)} {ingredient.inventoryItem?.unit || availableItem?.inventoryItem?.unit}
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
                        <TableCell>{ingredient.inventoryItem?.name}</TableCell>
                        <TableCell>{ingredient.quantity}</TableCell>
                        <TableCell>{ingredient.inventoryItem?.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setPrepareDialogOpen(true)}>
                {t('prepare')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editWarehouseDialogOpen} onOpenChange={setEditWarehouseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editWarehouseName')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className='mb-1'>{t('warehouseName')}</Label>
              <Input
                value={warehouseName}
                onChange={(e) => setWarehouseName(e.target.value)}
                placeholder={t('enterWarehouseName')}
              />
            </div>
            <Button onClick={handleUpdateWarehouseName}>
              {t('saveChanges')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={costDialogOpen} onOpenChange={setCostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('updateCost')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className='mb-1'>{t('item')}</Label>
              <p className="font-medium">{editingCostItem?.inventoryItem?.name || editingCostItem?.name}</p>
            </div>
            <div>
              <Label className='mb-1'>{t('unitCost')} (₽)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newCost}
                onChange={(e) => setNewCost(Number(e.target.value))}
              />
            </div>
            <div>
              <Label className='mb-1'>{t('currentQuantity')}</Label>
              <p>{editingCostItem?.quantity} {editingCostItem?.inventoryItem?.unit || editingCostItem?.unit}</p>
            </div>
            <div>
              <Label className='mb-1'>{t('totalValue')}</Label>
              <p>{(newCost * (editingCostItem?.quantity || 0)).toFixed(2)}₽</p>
            </div>
            <Button onClick={handleUpdateCost}>{t('updateCost')}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {t('deleteItem')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Информация об удаляемом элементе */}
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: itemToDelete?.inventoryItem?.categoryId
                      ? getCategoryColor(itemToDelete.inventoryItem.categoryId)
                      : '#6b7280'
                  }}
                />
                <div>
                  <h4 className="font-semibold">
                    {itemToDelete?.inventoryItem?.name || itemToDelete?.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {t('quantity')}: {itemToDelete?.quantity} {itemToDelete?.inventoryItem?.unit || itemToDelete?.unit}
                    {itemToDelete?.cost && ` • ${t('cost')}: ${itemToDelete.cost}₽`}
                  </p>
                </div>
              </div>
            </div>

            {/* Предупреждение об использовании в блюдах */}
            {itemToDelete?.inventoryItem?.ingredients && itemToDelete.inventoryItem.ingredients.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <h4 className="font-medium text-amber-800">
                    {t('itemUsedInProducts')}
                  </h4>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {itemToDelete.inventoryItem.ingredients.map((ingredient: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        {ingredient.product?.images?.[0] && (
                          <img
                            src={ingredient.product.images[0]}
                            alt={ingredient.product.title}
                            className="w-6 h-6 object-cover rounded"
                          />
                        )}
                        <span className="text-sm font-medium">{ingredient.product?.title}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {ingredient.quantity} {itemToDelete?.inventoryItem?.unit}
                      </Badge>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-amber-700 mt-2">
                  {t('deleteWarningUsedItem')}
                </p>
              </div>
            )}

            {/* Предупреждение если есть остатки на складе */}
            {itemToDelete?.quantity > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-700">
                    {t('deleteWarningWithStock')}
                  </p>
                </div>
              </div>
            )}

            {/* Финальное подтверждение */}
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700 font-medium">
                {t('deleteFinalConfirmation')}
              </p>
            </div>
          </div>

          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}