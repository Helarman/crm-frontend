import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ChevronUp, ChevronDown, ChevronRight, ChevronsUpDown, ArrowUp, ArrowDown, GripVertical, Check, CheckSquare, Square } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Language } from '@/lib/stores/language-store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { ProductService } from '@/lib/api/product.service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types/product';
import { Category } from '@/lib/types/order';
import { useAuth } from '@/lib/hooks/useAuth';

import {
  Dialog,
  DialogContent,
  DialogContentWide,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MultiSelect from '@/components/ui/multi-select';
import Image from 'next/image'
import SearchableSelect from './SearchableSelect';

interface CategoryRowProps {
  category: CategoryNode;
  depth?: number;
  language: Language;
  onDelete: (id: string) => void;
  fetchData: () => void;
  router: any;
  expandedCategories: Set<string>;
  toggleCategory: (id: string) => void;
  onMoveUp: (productId: string, categoryId: string) => void;
  onMoveDown: (productId: string, categoryId: string) => void;
  onClientMoveUp: (productId: string, categoryId: string) => void;
  onClientMoveDown: (productId: string, categoryId: string) => void;
  selectedProducts: Set<string>;
  onSelectProduct: (id: string) => void;
  onSelectAllInCategory: (categoryId: string) => void;
}

interface Restaurant {
  id: string;
  title: string;
}

interface RestaurantPrice {
  id: string;
  productId: string;
  restaurantId: string;
  price: number;
  isStopList: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Workshop {
  id: string;
  name: string;
}

export interface WorkshopIn {
  id: string;
  workshop: Workshop;
}

interface ProductTableProps {
  products: Product[];
  filteredProductIds: Set<string>;
  isLoading: boolean;
  language: Language;
  onDelete: (id: string) => void;
  fetchData: () => void;
  categories: Category[];
  workshops: Workshop[];
  additives: any[];
  networks: any[];
}

const translations = {
  title: {
    ru: 'Название',
    ka: 'სათაური',
  },
  price: {
    ru: 'Цена',
    ka: 'ფასი',
  },
  category: {
    ru: 'Категория',
    ka: 'კატეგორია',
  },
  restaurants: {
    ru: 'Рестораны',
    ka: 'რესტორნები',
  },
  workshops: {
    ru: 'Цехи',
    ka: 'სახელოსნოები',
  },
  actions: {
    ru: 'Действия',
    ka: 'მოქმედებები',
  },
  order: {
    ru: 'Порядок',
    ka: 'რიგი',
  },
  moveUp: {
    ru: 'Поднять',
    ka: 'აწევა',
  },
  moveDown: {
    ru: 'Опустить',
    ka: 'ჩამოწევა',
  },
  noProducts: {
    ru: 'Продукты не найдены',
    ka: 'პროდუქტები ვერ მოიძებნა',
  },
  noWorkshops: {
    ru: 'Нет цехов',
    ka: 'სახელოსნოები არ არის',
  },
  deleteConfirmation: {
    ru: 'Вы уверены, что хотите удалить этот продукт?',
    ka: 'დარწმუნებული ხართ, რომ გსურთ ამ პროდუქტის წაშლა?',
  },
  deleteTitle: {
    ru: 'Удалить продукт',
    ka: 'პროდუქტის წაშლა',
  },
  cancel: {
    ru: 'Отмена',
    ka: 'გაუქმება',
  },
  confirm: {
    ru: 'Удалить',
    ka: 'წაშლა',
  },
  printLabels: {
    ru: 'Лейблы',
    ka: 'ლეიბლების დაბეჭდვა'
  },
  publishedOnWebsite: {
    ru: 'Сайт',
    ka: 'საიტზე'
  },
  publishedInApp: {
    ru: 'Приложение',
    ka: 'აპლიკაციაში'
  },
  isStopList: {
    ru: 'Стоп-лист',
    ka: 'სტოპ ლისტი'
  },
  updateError: {
    ru: 'Ошибка обновления',
    ka: 'განახლების შეცდომა'
  },
  updateSuccess: {
    ru: 'Настройки обновлены',
    ka: 'პარამეტრები განახლდა'
  },
  orderUpdateSuccess: {
    ru: 'Порядок обновлен',
    ka: 'რიგი განახლდა'
  },
  orderUpdateError: {
    ru: 'Ошибка изменения порядка',
    ka: 'რიგის შეცვლის შეცდომა'
  },
  loading: {
    ru: 'Загрузка...',
    ka: 'იტვირთება...'
  },
  uncategorized: {
    ru: 'Без категории',
    ka: 'კატეგორიის გარეშე'
  },
  manageAdminOrder: {
    ru: 'Порядок',
    ka: 'პანელის რიგი'
  },
  manageClientOrder: {
    ru: 'Порядок',
    ka: 'საიტის რიგი'
  },
  clientOrderUpdateError: {
    ru: 'Ошибка изменения порядка на сайте',
    ka: 'საიტის რიგის შეცვლის შეცდომა'
  },
  orderSaved: {
    ru: 'Порядок сохранен',
    ka: 'რიგი შენახულია'
  },
  dragAndDropHint: {
    ru: 'Перетаскивайте элементы или используйте кнопки для изменения порядка',
    ka: 'გადაათრიეთ ელემენტები ან გამოიყენეთ ღილაკები რიგის შესაცვლელად'
  },
  saveOrder: {
    ru: 'Сохранить порядок',
    ka: 'რიგის შენახვა'
  },
  saving: {
    ru: 'Сохранение...',
    ka: 'ინახება...'
  },
  // Новые переводы для массовых операций
  selectAll: {
    ru: 'Выбрать все',
    ka: 'ყველას მონიშვნა'
  },
  clearSelection: {
    ru: 'Очистить выбор',
    ka: 'არჩევის გასუფთავება'
  },
  selectedCount: {
    ru: (count: number) => `Выбрано: ${count}`,
    ka: (count: number) => `არჩეული: ${count}`
  },
  bulkOperations: {
    ru: 'Массовые операции',
    ka: 'მასობრივი ოპერაციები'
  },
  bulkDelete: {
    ru: 'Удалить выбранное',
    ka: 'არჩეულის წაშლა'
  },
  bulkMoveToCategory: {
    ru: 'Переместить в категорию',
    ka: 'კატეგორიაში გადატანა'
  },
  bulkAssignWorkshops: {
    ru: 'Назначить цехи',
    ka: 'სახელოსნოების მინიჭება'
  },
  bulkAssignAdditives: {
    ru: 'Назначить модификаторы',
    ka: 'მოდიფიკატორების მინიჭება'
  },
  bulkTogglePrintLabels: {
    ru: 'Вкл/Выкл печать этикеток',
    ka: 'ეტიკეტების დაბეჭდვა ჩართ/გამორთ'
  },
  bulkTogglePublishedWebsite: {
    ru: 'Вкл/Выкл на сайте',
    ka: 'საიტზე ჩართ/გამორთ'
  },
  bulkTogglePublishedApp: {
    ru: 'Вкл/Выкл в приложении',
    ka: 'აპლიკაციაში ჩართ/გამორთ'
  },
  bulkToggleStopList: {
    ru: 'Вкл/Выкл стоп-лист',
    ka: 'სტოპ-ლისტში ჩართ/გამორთ'
  },
  bulkRestore: {
    ru: 'Восстановить',
    ka: 'აღდგენა'
  },
  selectAllInCategory: {
    ru: 'Выбрать все в категории',
    ka: 'კატეგორიაში ყველას მონიშვნა'
  },
  bulkOperationSuccess: {
    ru: 'Массовая операция выполнена успешно',
    ka: 'მასობრივი ოპერაცია წარმატებით შესრულდა'
  },
  bulkOperationError: {
    ru: 'Ошибка при выполнении массовой операции',
    ka: 'მასობრივი ოპერაციის შესრულების შეცდომა'
  },
  selectCategory: {
    ru: 'Выберите категорию',
    ka: 'აირჩიეთ კატეგორია'
  },
  selectWorkshops: {
    ru: 'Выберите цехи',
    ka: 'აირჩიეთ სახელოსნოები'
  },
  selectAdditives: {
    ru: 'Выберите модификаторы',
    ka: 'აირჩიეთ მოდიფიკატორები'
  },
  enable: {
    ru: 'Включить',
    ka: 'ჩართვა'
  },
  disable: {
    ru: 'Выключить',
    ka: 'გამორთვა'
  },
  apply: {
    ru: 'Применить',
    ka: 'გამოყენება'
  }
};

type SortDirection = 'asc' | 'desc' | null;
type SortField = 'title' | 'price' | 'category' | 'adminOrder' | 'clientOrder' | null;
type ToggleMethods =
  | "togglePrintLabels"
  | "togglePublishedOnWebsite"
  | "togglePublishedInApp"
  | "toggleStopList";

interface CategoryNode {
  id: string;
  title: string;
  children: CategoryNode[];
  products: Product[];
  parentId: string | null;
}

// Sortable Item Component
const SortableProductItem = ({ 
  product, 
  language, 
  onMoveUp, 
  onMoveDown, 
  isFirst, 
  isLast,
  type
}: { 
  product: Product;
  language: Language;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  type: 'admin' | 'client';
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const currentOrder = type === 'admin' ? product.sortOrder || 0 : product.clientSortOrder || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 border rounded-lg bg-white mb-2"
    >
      <div {...attributes} {...listeners} className="cursor-grab flex items-center">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      <div className="flex-1">
        <div className="font-medium">{product.title}</div>
        <div className="text-sm text-gray-500">
          Текущая позиция: {currentOrder}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onMoveUp}
          disabled={isFirst}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onMoveDown}
          disabled={isLast}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Order Management Dialog Component
const OrderManagementDialog = ({
  isOpen,
  onClose,
  products,
  language,
  categoryTitle,
  onSaveOrder,
  type
}: {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  language: Language;
  categoryTitle: string;
  onSaveOrder: (reorderedProducts: Product[]) => Promise<void>;
  type: 'admin' | 'client';
}) => {
  const [items, setItems] = useState<Product[]>(products);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      setItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setItems(items => {
      const newItems = [...items];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      return newItems;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    setItems(items => {
      const newItems = [...items];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      return newItems;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveOrder(items);
      toast.success(translations.orderSaved[language]);
      onClose();
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error(type === 'admin' ? translations.orderUpdateError[language] : translations.clientOrderUpdateError[language]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContentWide className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {type === 'admin' ? 'Управление порядком в панели' : 'Управление порядком на сайте'} - {categoryTitle}
          </DialogTitle>
          <DialogDescription>
            {translations.dragAndDropHint[language]}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items.map(p => p.id)} strategy={verticalListSortingStrategy}>
              {items.map((product, index) => (
                <SortableProductItem
                  key={product.id}
                  product={product}
                  language={language}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                  isFirst={index === 0}
                  isLast={index === items.length - 1}
                  type={type}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {translations.cancel[language]}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? translations.saving[language] : translations.saveOrder[language]}
          </Button>
        </DialogFooter>
      </DialogContentWide>
    </Dialog>
  );
};

// Диалог для массового перемещения в категорию
const BulkMoveToCategoryDialog = ({
  isOpen,
  onClose,
  categories = [],
  language,
  onApply,
  selectedCount
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  language: Language;
  onApply: (categoryId?: string) => Promise<void>;
  selectedCount: number;
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(selectedCategoryId || undefined);
      onClose();
      setSelectedCategoryId('');
    } catch (error) {
      console.error('Error applying bulk move:', error);
    } finally {
      setIsApplying(false);
    }
  };

  // Подготовка опций для SearchableSelect
  const categoryOptions = [
    { id: '', label: translations.uncategorized[language] },
    ...categories.map(category => ({
      id: category.id,
      label: category.title
    }))
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{translations.bulkMoveToCategory[language]}</DialogTitle>
          <DialogDescription>
            {translations.selectedCount[language](selectedCount)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{translations.selectCategory[language]}</Label>
            <SearchableSelect
              options={categoryOptions}
              value={selectedCategoryId ? [selectedCategoryId] : []}
              onChange={(value) => setSelectedCategoryId(value[0] || '')}
              placeholder={translations.uncategorized[language]}
              searchPlaceholder={language === 'ru' ? 'Поиск категории...' : 'კატეგორიის ძებნა...'}
              emptyText={language === 'ru' ? 'Категории не найдены' : 'კატეგორიები ვერ მოიძებნა'}
              multiple={false}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {translations.cancel[language]}
          </Button>
          <Button onClick={handleApply} disabled={isApplying || !selectedCategoryId}>
            {isApplying ? translations.saving[language] : translations.apply[language]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Диалог для массового назначения цехов
const BulkAssignWorkshopsDialog = ({
  isOpen,
  onClose,
  workshops = [],
  language,
  onApply,
  selectedCount
}: {
  isOpen: boolean;
  onClose: () => void;
  workshops: Workshop[];
  language: Language;
  onApply: (workshopIds: string[]) => Promise<void>;
  selectedCount: number;
}) => {
  const [selectedWorkshopIds, setSelectedWorkshopIds] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(selectedWorkshopIds);
      onClose();
      setSelectedWorkshopIds([]);
    } catch (error) {
      console.error('Error applying bulk assign workshops:', error);
    } finally {
      setIsApplying(false);
    }
  };

  // Подготовка опций для SearchableSelect
  const workshopOptions = workshops.map(workshop => ({
    id: workshop.id,
    label: workshop.name
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{translations.bulkAssignWorkshops[language]}</DialogTitle>
          <DialogDescription>
            {translations.selectedCount[language](selectedCount)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{translations.selectWorkshops[language]}</Label>
            <SearchableSelect
              options={workshopOptions}
              value={selectedWorkshopIds}
              onChange={setSelectedWorkshopIds}
              placeholder={language === 'ru' ? 'Выберите цехи...' : 'აირჩიეთ სახელოსნოები...'}
              searchPlaceholder={language === 'ru' ? 'Поиск цехов...' : 'სახელოსნოების ძებნა...'}
              emptyText={language === 'ru' ? 'Цехи не найдены' : 'სახელოსნოები ვერ მოიძებნა'}
              multiple={true}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {translations.cancel[language]}
          </Button>
          <Button onClick={handleApply} disabled={isApplying || selectedWorkshopIds.length === 0}>
            {isApplying ? translations.saving[language] : translations.apply[language]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Диалог для массового назначения модификаторов
const BulkAssignAdditivesDialog = ({
  isOpen,
  onClose,
  additives = [],
  language,
  onApply,
  selectedCount
}: {
  isOpen: boolean;
  onClose: () => void;
  additives: any[];
  language: Language;
  onApply: (additiveIds?: string[]) => Promise<void>;
  selectedCount: number;
}) => {
  const [selectedAdditiveIds, setSelectedAdditiveIds] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(selectedAdditiveIds.length > 0 ? selectedAdditiveIds : undefined);
      onClose();
      setSelectedAdditiveIds([]);
    } catch (error) {
      console.error('Error applying bulk assign additives:', error);
    } finally {
      setIsApplying(false);
    }
  };

  // Подготовка опций для SearchableSelect
  const additiveOptions = additives.map(additive => ({
    id: additive.id,
    label: additive.title
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{translations.bulkAssignAdditives[language]}</DialogTitle>
          <DialogDescription>
            {translations.selectedCount[language](selectedCount)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{translations.selectAdditives[language]}</Label>
            <SearchableSelect
              options={additiveOptions}
              value={selectedAdditiveIds}
              onChange={setSelectedAdditiveIds}
              placeholder={language === 'ru' ? 'Выберите модификаторы...' : 'აირჩიეთ მოდიფიკატორები...'}
              searchPlaceholder={language === 'ru' ? 'Поиск модификаторов...' : 'მოდიფიკატორების ძებნა...'}
              emptyText={language === 'ru' ? 'Модификаторы не найдены' : 'მოდიფიკატორები ვერ მოიძებნა'}
              multiple={true}
            />
            <p className="text-xs text-muted-foreground">
              {language === 'ru' 
                ? 'Оставьте пустым, чтобы очистить все модификаторы у выбранных продуктов'
                : 'დატოვეთ ცარიელი, რომ გაასუფთავოთ მოდიფიკატორები არჩეული პროდუქტებიდან'
              }
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {translations.cancel[language]}
          </Button>
          <Button onClick={handleApply} disabled={isApplying}>
            {isApplying ? translations.saving[language] : translations.apply[language]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Диалог для массового переключения свойств
const BulkToggleDialog = ({
  isOpen,
  onClose,
  language,
  onApply,
  selectedCount,
  title,
  enableText,
  disableText
}: {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onApply: (enable: boolean) => Promise<void>;
  selectedCount: number;
  title: string;
  enableText: string;
  disableText: string;
}) => {
  const [enable, setEnable] = useState<boolean>(true);
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(enable);
      onClose();
    } catch (error) {
      console.error('Error applying bulk toggle:', error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {translations.selectedCount[language](selectedCount)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="enable"
                  checked={enable === true}
                  onChange={() => setEnable(true)}
                  className="h-4 w-4"
                />
                <label htmlFor="enable" className="cursor-pointer">
                  {enableText}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="disable"
                  checked={enable === false}
                  onChange={() => setEnable(false)}
                  className="h-4 w-4"
                />
                <label htmlFor="disable" className="cursor-pointer">
                  {disableText}
                </label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {translations.cancel[language]}
          </Button>
          <Button onClick={handleApply} disabled={isApplying}>
            {isApplying ? translations.saving[language] : translations.apply[language]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const buildCategoryTree = (
  categories: Category[],
  products: Product[],
  language: Language
): CategoryNode[] => {
  const categoryMap = new Map<string, CategoryNode>();

  // Создаем узел для продуктов без категории
  const uncategorizedNode: CategoryNode = {
    id: 'uncategorized',
    title: translations.uncategorized[language],
    children: [],
    products: [],
    parentId: null
  };
  categoryMap.set('uncategorized', uncategorizedNode);

  // Сначала создаем все узлы категорий
  categories.forEach(category => {
    categoryMap.set(category.id, {
      id: category.id,
      title: category.title,
      children: [],
      products: [],
      parentId: category.parentId || null
    });
  });

  // Затем строим иерархию
  const rootNodes: CategoryNode[] = [];
  categoryMap.forEach(category => {
    if (category.parentId && category.id !== 'uncategorized') {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        parent.children.push(category);
      } else {
        rootNodes.push(category);
      }
    } else if (category.id !== 'uncategorized') {
      rootNodes.push(category);
    }
  });

  // Распределяем продукты по категориям
  products.forEach(product => {
    if (product.category?.id) {
      const category = categoryMap.get(product.category.id);
      if (category) {
        category.products.push(product);
      } else {
        uncategorizedNode.products.push(product);
      }
    } else {
      uncategorizedNode.products.push(product);
    }
  });

  // Сортируем продукты по порядку внутри каждой категории
  categoryMap.forEach(category => {
    category.products.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  });

  // Добавляем узел без категорий только если там есть продукты
  if (uncategorizedNode.products.length > 0) {
    rootNodes.push(uncategorizedNode);
  }

  // Функция для рекурсивного удаления пустых категорий
  const removeEmptyCategories = (nodes: CategoryNode[]): CategoryNode[] => {
    return nodes
      .map(node => {
        // Рекурсивно обрабатываем детей
        const filteredChildren = removeEmptyCategories(node.children);

        // Если у категории есть продукты ИЛИ есть непустые дочерние категории, оставляем её
        if (node.products.length > 0 || filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren
          };
        }
        return null;
      })
      .filter((node): node is CategoryNode => node !== null);
  };

  // Удаляем пустые категории и сортируем
  return removeEmptyCategories(rootNodes).sort((a, b) => a.title.localeCompare(b.title));
};

const ProductRow = ({
  product,
  depth = 0,
  language,
  onDelete,
  fetchData,
  router,
  categoryId,
  onMoveUp,
  onMoveDown,
  onClientMoveUp,
  onClientMoveDown,
  isFirst,
  isLast,
  isClientFirst,
  isClientLast,
  selectedProducts,
  onSelectProduct
}: {
  product: Product;
  depth?: number;
  language: Language;
  onDelete: (id: string) => void;
  fetchData: () => void;
  router: any;
  categoryId: string;
  onMoveUp: (productId: string) => void;
  onMoveDown: (productId: string) => void;
  onClientMoveUp: (productId: string) => void;
  onClientMoveDown: (productId: string) => void;
  isFirst: boolean;
  isLast: boolean;
  isClientFirst: boolean;
  isClientLast: boolean;
  selectedProducts: Set<string>;
  onSelectProduct: (id: string) => void;
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loadingToggles, setLoadingToggles] = useState<Record<string, boolean>>({});
  const [loadingAdminOrder, setLoadingAdminOrder] = useState(false);
  const [loadingClientOrder, setLoadingClientOrder] = useState(false);
  const { user } = useAuth()
  const isSelected = selectedProducts.has(product.id);

  const handleMoveUp = async () => {
    if (isFirst) return;
    setLoadingAdminOrder(true);
    try {
      await onMoveUp(product.id);
      fetchData();
    } catch (error) {
      console.error('Error moving product up:', error);
      toast.error('Ошибка изменения порядка в админке');
    } finally {
      setLoadingAdminOrder(false);
    }
  };

  const handleMoveDown = async () => {
    if (isLast) return;
    setLoadingAdminOrder(true);
    try {
      await onMoveDown(product.id);
      fetchData();
    } catch (error) {
      console.error('Error moving product down:', error);
      toast.error('Ошибка изменения порядка в админке');
    } finally {
      setLoadingAdminOrder(false);
    }
  };

  const handleClientMoveUp = async () => {
    if (isClientFirst) return;
    setLoadingClientOrder(true);
    try {
      await onClientMoveUp(product.id);
      fetchData();
    } catch (error) {
      console.error('Error moving product up on client:', error);
      toast.error('Ошибка изменения порядка на сайте');
    } finally {
      setLoadingClientOrder(false);
    }
  };

  const handleClientMoveDown = async () => {
    if (isClientLast) return;
    setLoadingClientOrder(true);
    try {
      await onClientMoveDown(product.id);
      fetchData();
    } catch (error) {
      console.error('Error moving product down on client:', error);
      toast.error('Ошибка изменения порядка на сайте');
    } finally {
      setLoadingClientOrder(false);
    }
  };
  
  const handleToggle = async (productId: string, serviceMethod: ToggleMethods) => {
    const toggleKey = `${productId}-${serviceMethod}`;
    setLoadingToggles(prev => ({ ...prev, [toggleKey]: true }));

    try {
      await ProductService[serviceMethod](productId);
      toast.success(translations.updateSuccess[language]);
    } catch (error) {
      console.error(`Error updating ${serviceMethod}:`, error);
      toast.error(translations.updateError[language]);
    } finally {
      setLoadingToggles(prev => ({ ...prev, [toggleKey]: false }));
      fetchData();
    }
  };

  return (
    <>
      <TableRow className={isSelected ? "bg-primary/10" : ""}>
        <TableCell style={{ paddingLeft: `${depth * 20 + 12}px` }}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectProduct(product.id)}
              className="focus:outline-none"
            >
              {isSelected ? (
                <CheckSquare className="h-4 w-4 text-primary" />
              ) : (
                <Square className="h-4 w-4 text-gray-400" />
              )}
            </button>
            
          </div>
        
        </TableCell>
        <TableCell>
         {product.images && product.images.length > 0?
           <Image
              src={product.images[0]}
              width={25}
              height={25}
              alt="Product"
              className='rounded-sm'
            />
            :
            <div className='w-[25px] h-[25px] bg-gray-200 rounded-sm'></div>
          }
        </TableCell>
        <TableCell>
          <span className="font-medium">{product.title}</span>
        </TableCell>
        { user.role === 'COOK' ? '' :
            (<>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {product.workshops?.length > 0 ? (
              product.workshops.map((workshop: WorkshopIn) => (
                <Badge
                  key={workshop.workshop.id}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  {workshop.workshop.name}
                </Badge>
              ))
            ) : (
              <Badge variant="outline">
                {translations.noWorkshops[language]}
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="secondary">
            {product.price} ₽
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant="outline">
            {product.sortOrder}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant="outline">
            {product.clientSortOrder}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          <Switch
            checked={product.printLabels}
            onCheckedChange={() => handleToggle(product.id, 'togglePrintLabels')}
            disabled={loadingToggles[`${product.id}-togglePrintLabels`]}
          />
        </TableCell>
        <TableCell className="text-center">
          <Switch
            checked={product.publishedOnWebsite}
            onCheckedChange={() => handleToggle(product.id, 'togglePublishedOnWebsite')}
            disabled={loadingToggles[`${product.id}-togglePublishedOnWebsite`]}
          />
        </TableCell>
        <TableCell className="text-center">
          <Switch
            checked={product.publishedInApp}
            onCheckedChange={() => handleToggle(product.id, 'togglePublishedInApp')}
            disabled={loadingToggles[`${product.id}-togglePublishedInApp`]}
          />
        </TableCell></>)}
        <TableCell className="text-center">
          <Switch
            checked={product.isStopList}
            onCheckedChange={() => handleToggle(product.id, 'toggleStopList')}
            disabled={loadingToggles[`${product.id}-toggleStopList`]}
          />
        </TableCell>
        { user.role === 'COOK' ? '' :
        <TableCell className="text-right">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/products/${product.id}`)}
              title={language === 'ru' ? 'Редактировать' : 'რედაქტირება'}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              title={language === 'ru' ? 'Удалить' : 'წაშლა'}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
        }
      </TableRow>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.deleteTitle[language]}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.deleteConfirmation[language]}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel[language]}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              onDelete(product.id);
              setIsDeleteDialogOpen(false);
            }}>
              {translations.confirm[language]}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const CategoryRow = ({
  category,
  depth = 0,
  language,
  onDelete,
  fetchData,
  router,
  expandedCategories,
  toggleCategory,
  onMoveUp,
  onMoveDown,
  onClientMoveUp,
  onClientMoveDown,
  selectedProducts,
  onSelectProduct,
  onSelectAllInCategory
}: CategoryRowProps) => {
  const isExpanded = expandedCategories.has(category.id);
  const hasChildren = category.children.length > 0 || category.products.length > 0;
  const isUncategorized = category.id === 'uncategorized';
  
  // Состояния для диалогов
  const [adminOrderDialogOpen, setAdminOrderDialogOpen] = useState(false);
  const [clientOrderDialogOpen, setClientOrderDialogOpen] = useState(false);

  const handleSaveAdminOrder = async (reorderedProducts: Product[]) => {
    try {
       for (let i = 0; i < reorderedProducts.length; i++) {
        await ProductService.updateProductOrder(reorderedProducts[i].id, i + 1, category.id);
      }
      fetchData(); 
    } catch (error) {
      console.error('Error updating admin order:', error);
      throw error;
    }
  };

  const handleSaveClientOrder = async (reorderedProducts: Product[]) => {
    try {
      for (let i = 0; i < reorderedProducts.length; i++) {
        await ProductService.updateClientProductOrder(reorderedProducts[i].id, i + 1, category.id);
      }
      fetchData(); // Обновляем данные
    } catch (error) {
      console.error('Error updating client order:', error);
      throw error;
    }
  };

  // Определяем, выбраны ли все продукты в категории
  const allProductsInCategorySelected = category.products.every(
    product => selectedProducts.has(product.id)
  );
  const someProductsInCategorySelected = category.products.some(
    product => selectedProducts.has(product.id)
  );

  const handleSelectAllInCategory = () => {
    onSelectAllInCategory(category.id);
  };

  return (
    <>
      {(hasChildren || isUncategorized) && (
        <TableRow className={`${depth === 0 ? 'bg-gray-50' : ''}`}>
          <TableCell colSpan={10} className="font-medium" style={{ paddingLeft: `${depth * 20 + 12}px` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={handleSelectAllInCategory}
                  className="focus:outline-none mr-2"
                  title={translations.selectAllInCategory[language]}
                >
                  {allProductsInCategorySelected ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : someProductsInCategorySelected ? (
                    <CheckSquare className="h-4 w-4 text-primary/50" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                {hasChildren && !isUncategorized ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 p-0 -ml-2 mr-1"
                    onClick={() => toggleCategory(category.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle</span>
                  </Button>
                ) : (
                  <span className="inline-block w-8" />
                )}
                {category.title}
                {!isUncategorized && (
                  <Badge variant="secondary" className="ml-2">
                    {category.products.length}
                  </Badge>
                )}
              </div>
              
              {/* Кнопки управления порядком для категории */}
              {isExpanded && category.products.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAdminOrderDialogOpen(true);
                    }}
                  >
                    <Badge variant="outline" className="mr-1">A</Badge>
                    {translations.manageAdminOrder[language]}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setClientOrderDialogOpen(true);
                    }}
                  >
                    <Badge variant="outline" className="mr-1">C</Badge>
                    {translations.manageClientOrder[language]}
                  </Button>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}

      {/* Диалоги управления порядком */}
      {category.products.length > 0 && (
        <>
          <OrderManagementDialog
            isOpen={adminOrderDialogOpen}
            onClose={() => setAdminOrderDialogOpen(false)}
            products={category.products}
            language={language}
            categoryTitle={category.title}
            onSaveOrder={handleSaveAdminOrder}
            type="admin"
          />
          <OrderManagementDialog
            isOpen={clientOrderDialogOpen}
            onClose={() => setClientOrderDialogOpen(false)}
            products={category.products}
            language={language}
            categoryTitle={category.title}
            onSaveOrder={handleSaveClientOrder}
            type="client"
          />
        </>
      )}

      {isExpanded && !isUncategorized && (
        <>
          {category.children.map(childCategory => (
            <CategoryRow
              key={childCategory.id}
              category={childCategory}
              depth={depth + 1}
              language={language}
              onDelete={onDelete}
              fetchData={fetchData}
              router={router}
              expandedCategories={expandedCategories}
              toggleCategory={toggleCategory}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onClientMoveUp={onClientMoveUp}
              onClientMoveDown={onClientMoveDown}
              selectedProducts={selectedProducts}
              onSelectProduct={onSelectProduct}
              onSelectAllInCategory={onSelectAllInCategory}
            />
          ))}
          {category.products.map((product, index) => {
            // Определяем позиции для клиентской сортировки
            const sortedByClientOrder = [...category.products].sort((a, b) =>
              (a.clientSortOrder || 0) - (b.clientSortOrder || 0)
            );
            const clientIndex = sortedByClientOrder.findIndex(p => p.id === product.id);
            const isClientFirst = clientIndex === 0;
            const isClientLast = clientIndex === sortedByClientOrder.length - 1;

            return (
              <ProductRow
                key={product.id}
                product={product}
                depth={depth + 1}
                language={language}
                onDelete={onDelete}
                fetchData={fetchData}
                router={router}
                categoryId={category.id}
                onMoveUp={() => onMoveUp(product.id, category.id)}
                onMoveDown={() => onMoveDown(product.id, category.id)}
                onClientMoveUp={() => onClientMoveUp(product.id, category.id)}
                onClientMoveDown={() => onClientMoveDown(product.id, category.id)}
                isFirst={index === 0}
                isLast={index === category.products.length - 1}
                isClientFirst={isClientFirst}
                isClientLast={isClientLast}
                selectedProducts={selectedProducts}
                onSelectProduct={onSelectProduct}
              />
            );
          })}
        </>
      )}

      {isUncategorized && category.products.map((product, index) => {
        // Для uncategorized также определяем позиции клиентской сортировки
        const sortedByClientOrder = [...category.products].sort((a, b) =>
          (a.clientSortOrder || 0) - (b.clientSortOrder || 0)
        );
        const clientIndex = sortedByClientOrder.findIndex(p => p.id === product.id);
        const isClientFirst = clientIndex === 0;
        const isClientLast = clientIndex === sortedByClientOrder.length - 1;

        return (
          <ProductRow
            key={product.id}
            product={product}
            depth={depth + 1}
            language={language}
            onDelete={onDelete}
            fetchData={fetchData}
            router={router}
            categoryId={category.id}
            onMoveUp={() => onMoveUp(product.id, category.id)}
            onMoveDown={() => onMoveDown(product.id, category.id)}
            onClientMoveUp={() => onClientMoveUp(product.id, category.id)}
            onClientMoveDown={() => onClientMoveDown(product.id, category.id)}
            isFirst={index === 0}
            isLast={index === category.products.length - 1}
            isClientFirst={isClientFirst}
            isClientLast={isClientLast}
            selectedProducts={selectedProducts}
            onSelectProduct={onSelectProduct}
          />
        );
      })}
    </>
  );
};

export const ProductTable = ({
  products,
  isLoading,
  filteredProductIds,
  language,
  onDelete,
  fetchData,
  categories,
  workshops,
  additives,
  networks
}: ProductTableProps) => {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const { user } = useAuth()

  // Состояния для диалогов массовых операций
  const [bulkMoveDialogOpen, setBulkMoveDialogOpen] = useState(false);
  const [bulkWorkshopsDialogOpen, setBulkWorkshopsDialogOpen] = useState(false);
  const [bulkAdditivesDialogOpen, setBulkAdditivesDialogOpen] = useState(false);
  const [bulkPrintLabelsDialogOpen, setBulkPrintLabelsDialogOpen] = useState(false);
  const [bulkWebsiteDialogOpen, setBulkWebsiteDialogOpen] = useState(false);
  const [bulkAppDialogOpen, setBulkAppDialogOpen] = useState(false);
  const [bulkStopListDialogOpen, setBulkStopListDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // ФИЛЬТРАЦИЯ: используем filteredProductIds для фильтрации продуктов
  const filteredProducts = products.filter(product =>
    filteredProductIds.has(product.id)
  );

  const allCategories: Category[] = [];
  const categoryMap = new Map<string, Category>();

  const collectAllCategories = (category: Category | null) => {
    if (!category) return;

    if (!categoryMap.has(category.id)) {
      categoryMap.set(category.id, category);
      allCategories.push(category);

      if (category.parent) {
        collectAllCategories(category.parent);
      }
    }
  };

  // Используем ОТФИЛЬТРОВАННЫЕ продукты для построения категорий
  filteredProducts.forEach(product => {
    if (product.category) {
      collectAllCategories(product.category);
    }
  });

  const categoryTree = buildCategoryTree(allCategories, filteredProducts, language);

  const handleClientMoveUp = async (productId: string, categoryId: string) => {
    try {
      await ProductService.moveProductUpOnClient(productId, categoryId);
    } catch (error) {
      console.error('Error moving product up on client:', error);
      throw error;
    }
  };

  const handleClientMoveDown = async (productId: string, categoryId: string) => {
    try {
      await ProductService.moveProductDownOnClient(productId, categoryId);
    } catch (error) {
      console.error('Error moving product down on client:', error);
      throw error;
    }
  };

  const handleMoveUp = async (productId: string, categoryId: string) => {
    try {
      await ProductService.moveProductUp(productId, categoryId);
    } catch (error) {
      console.error('Error moving product up:', error);
      throw error;
    }
  };

  const handleMoveDown = async (productId: string, categoryId: string) => {
    try {
      await ProductService.moveProductDown(productId, categoryId);
    } catch (error) {
      console.error('Error moving product down:', error);
      throw error;
    }
  };

  // Обработчики для массовых операций
  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleSelectAllInCategory = (categoryId: string) => {
    // Находим все продукты в категории и её подкатегориях
    const getAllProductsInCategory = (catId: string): string[] => {
      const cat = categoryTree.find(c => c.id === catId);
      if (!cat) return [];

      let productIds = cat.products.map(p => p.id);
      
      // Рекурсивно получаем продукты из дочерних категорий
      const getProductsFromChildren = (children: CategoryNode[]): string[] => {
        let ids: string[] = [];
        children.forEach(child => {
          ids = [...ids, ...child.products.map(p => p.id)];
          ids = [...ids, ...getProductsFromChildren(child.children)];
        });
        return ids;
      };

      productIds = [...productIds, ...getProductsFromChildren(cat.children)];
      return productIds;
    };

    const categoryProductIds = getAllProductsInCategory(categoryId);
    const allSelected = categoryProductIds.every(id => selectedProducts.has(id));

    const newSelected = new Set(selectedProducts);
    if (allSelected) {
      // Если все выбраны - снимаем выделение
      categoryProductIds.forEach(id => newSelected.delete(id));
    } else {
      // Если не все выбраны - выделяем все
      categoryProductIds.forEach(id => newSelected.add(id));
    }
    setSelectedProducts(newSelected);
  };

  // Обработчики массовых операций
  const handleBulkMoveToCategory = async (categoryId?: string) => {
    try {
      await ProductService.bulkUpdateCategory({
        productIds: Array.from(selectedProducts),
        categoryId
      });
      toast.success(translations.bulkOperationSuccess[language]);
      fetchData();
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Error in bulk move to category:', error);
      toast.error(translations.bulkOperationError[language]);
    }
  };

  const handleBulkAssignWorkshops = async (workshopIds: string[]) => {
    try {
      await ProductService.bulkAssignWorkshops({
        productIds: Array.from(selectedProducts),
        workshopIds
      });
      toast.success(translations.bulkOperationSuccess[language]);
      fetchData();
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Error in bulk assign workshops:', error);
      toast.error(translations.bulkOperationError[language]);
    }
  };

  const handleBulkAssignAdditives = async (additiveIds?: string[]) => {
    try {
      await ProductService.bulkAssignAdditives({
        productIds: Array.from(selectedProducts),
        additiveIds
      });
      toast.success(translations.bulkOperationSuccess[language]);
      fetchData();
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Error in bulk assign additives:', error);
      toast.error(translations.bulkOperationError[language]);
    }
  };

  const handleBulkTogglePrintLabels = async (enable: boolean) => {
    try {
      await ProductService.bulkTogglePrintLabels({
        productIds: Array.from(selectedProducts),
        enable
      });
      toast.success(translations.bulkOperationSuccess[language]);
      fetchData();
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Error in bulk toggle print labels:', error);
      toast.error(translations.bulkOperationError[language]);
    }
  };

  const handleBulkTogglePublishedWebsite = async (enable: boolean) => {
    try {
      await ProductService.bulkTogglePublishedWebsite({
        productIds: Array.from(selectedProducts),
        enable
      });
      toast.success(translations.bulkOperationSuccess[language]);
      fetchData();
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Error in bulk toggle published website:', error);
      toast.error(translations.bulkOperationError[language]);
    }
  };

  const handleBulkTogglePublishedApp = async (enable: boolean) => {
    try {
      await ProductService.bulkTogglePublishedApp({
        productIds: Array.from(selectedProducts),
        enable
      });
      toast.success(translations.bulkOperationSuccess[language]);
      fetchData();
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Error in bulk toggle published app:', error);
      toast.error(translations.bulkOperationError[language]);
    }
  };

  const handleBulkToggleStopList = async (enable: boolean) => {
    try {
      await ProductService.bulkToggleStopList({
        productIds: Array.from(selectedProducts),
        enable
      });
      toast.success(translations.bulkOperationSuccess[language]);
      fetchData();
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Error in bulk toggle stop list:', error);
      toast.error(translations.bulkOperationError[language]);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await ProductService.bulkDelete({
        productIds: Array.from(selectedProducts)
      });
      toast.success(translations.bulkOperationSuccess[language]);
      fetchData();
      setSelectedProducts(new Set());
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error(translations.bulkOperationError[language]);
    }
  };

  const sortedCategoryTree = [...categoryTree].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;
    switch (sortField) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'category':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'adminOrder':
        // Сортировка по максимальному порядку в категории (для админки)
        const aMaxOrder = Math.max(...a.products.map(p => p.sortOrder || 0));
        const bMaxOrder = Math.max(...b.products.map(p => p.sortOrder || 0));
        comparison = aMaxOrder - bMaxOrder;
        break;
      case 'clientOrder':
        // Сортировка по порядку для клиентского сайта
        const aClientOrder = Math.max(...a.products.map(p => p.clientSortOrder || 0));
        const bClientOrder = Math.max(...b.products.map(p => p.clientSortOrder || 0));
        comparison = aClientOrder - bClientOrder;
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  sortedCategoryTree.forEach(category => {
    category.products.sort((a, b) => {
      if (!sortField) return 0;

      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'adminOrder':
          comparison = (a.sortOrder || 0) - (b.sortOrder || 0);
          break;
        case 'clientOrder':
          comparison = (a.clientSortOrder || 0) - (b.clientSortOrder || 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    category.children.sort((a, b) => a.title.localeCompare(b.title));
  });

  const toggleCategory = (categoryId: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(categoryId)) {
      newSet.delete(categoryId);
    } else {
      newSet.add(categoryId);
    }
    setExpandedCategories(newSet);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => {
        if (prev === 'asc') return 'desc';
        if (prev === 'desc') return null;
        return 'asc';
      });
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />;
    if (sortDirection === 'asc') return <ChevronUp className="ml-1 h-4 w-4" />;
    if (sortDirection === 'desc') return <ChevronDown className="ml-1 h-4 w-4" />;
    return <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />;
  };

  return (
    <>
      {/* Панель массовых операций */}
      {selectedProducts.size > 0 && (
        <div className="bg-primary/10 p-3 rounded-lg mb-4 border border-primary/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {translations.selectedCount[language](selectedProducts.size)}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-8 px-2 text-sm"
              >
                {selectedProducts.size === filteredProducts.length ? (
                  <>
                    <Square className="h-3 w-3 mr-1" />
                    {translations.clearSelection[language]}
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3 w-3 mr-1" />
                    {translations.selectAll[language]}
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <CheckSquare className="h-3 w-3 mr-1" />
                    {translations.bulkOperations[language]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setBulkMoveDialogOpen(true)}>
                    {translations.bulkMoveToCategory[language]}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkWorkshopsDialogOpen(true)}>
                    {translations.bulkAssignWorkshops[language]}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkAdditivesDialogOpen(true)}>
                    {translations.bulkAssignAdditives[language]}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setBulkPrintLabelsDialogOpen(true)}>
                    {translations.bulkTogglePrintLabels[language]}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkWebsiteDialogOpen(true)}>
                    {translations.bulkTogglePublishedWebsite[language]}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkAppDialogOpen(true)}>
                    {translations.bulkTogglePublishedApp[language]}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setBulkStopListDialogOpen(true)}>
                    {translations.bulkToggleStopList[language]}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setBulkDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    {translations.bulkDelete[language]}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProducts(new Set())}
                className="h-8"
              >
                {translations.clearSelection[language]}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Диалоги массовых операций */}
      <BulkMoveToCategoryDialog
        isOpen={bulkMoveDialogOpen}
        onClose={() => setBulkMoveDialogOpen(false)}
        categories={categories}
        language={language}
        onApply={handleBulkMoveToCategory}
        selectedCount={selectedProducts.size}
      />

      <BulkAssignWorkshopsDialog
        isOpen={bulkWorkshopsDialogOpen}
        onClose={() => setBulkWorkshopsDialogOpen(false)}
        workshops={workshops}
        language={language}
        onApply={handleBulkAssignWorkshops}
        selectedCount={selectedProducts.size}
      />

      <BulkAssignAdditivesDialog
        isOpen={bulkAdditivesDialogOpen}
        onClose={() => setBulkAdditivesDialogOpen(false)}
        additives={additives}
        language={language}
        onApply={handleBulkAssignAdditives}
        selectedCount={selectedProducts.size}
      />

      <BulkToggleDialog
        isOpen={bulkPrintLabelsDialogOpen}
        onClose={() => setBulkPrintLabelsDialogOpen(false)}
        language={language}
        onApply={handleBulkTogglePrintLabels}
        selectedCount={selectedProducts.size}
        title={translations.bulkTogglePrintLabels[language]}
        enableText={translations.enable[language]}
        disableText={translations.disable[language]}
      />

      <BulkToggleDialog
        isOpen={bulkWebsiteDialogOpen}
        onClose={() => setBulkWebsiteDialogOpen(false)}
        language={language}
        onApply={handleBulkTogglePublishedWebsite}
        selectedCount={selectedProducts.size}
        title={translations.bulkTogglePublishedWebsite[language]}
        enableText={translations.enable[language]}
        disableText={translations.disable[language]}
      />

      <BulkToggleDialog
        isOpen={bulkAppDialogOpen}
        onClose={() => setBulkAppDialogOpen(false)}
        language={language}
        onApply={handleBulkTogglePublishedApp}
        selectedCount={selectedProducts.size}
        title={translations.bulkTogglePublishedApp[language]}
        enableText={translations.enable[language]}
        disableText={translations.disable[language]}
      />

      <BulkToggleDialog
        isOpen={bulkStopListDialogOpen}
        onClose={() => setBulkStopListDialogOpen(false)}
        language={language}
        onApply={handleBulkToggleStopList}
        selectedCount={selectedProducts.size}
        title={translations.bulkToggleStopList[language]}
        enableText={translations.enable[language]}
        disableText={translations.disable[language]}
      />

      {/* Диалог подтверждения массового удаления */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.bulkDelete[language]}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ru' 
                ? `Вы уверены, что хотите удалить ${selectedProducts.size} продукт(ов)?` 
                : `დარწმუნებული ხართ, რომ გსურთ ${selectedProducts.size} პროდუქტის წაშლა?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel[language]}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>
              {translations.confirm[language]}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="rounded-md border mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <button
                  onClick={handleSelectAll}
                  className="focus:outline-none"
                  title={selectedProducts.size === filteredProducts.length ? 
                    translations.clearSelection[language] : 
                    translations.selectAll[language]
                  }
                >
                  {selectedProducts.size === filteredProducts.length ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </TableHead>
              <TableHead></TableHead>
              <TableHead>
                <button
                  className="flex items-center"
                  onClick={() => handleSort('title')}
                >
                  {translations.title[language]}
                  {getSortIcon('title')}
                </button>
              </TableHead>
              { user.role === 'COOK' ? '' :
              (<>
              <TableHead>{translations.workshops[language]}</TableHead>
              <TableHead>
                <button
                  className="flex items-center"
                  onClick={() => handleSort('price')}
                >
                  {translations.price[language]}
                  {getSortIcon('price')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center"
                  onClick={() => handleSort('adminOrder')}
                >
                  Панель
                  {getSortIcon('adminOrder')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center"
                  onClick={() => handleSort('clientOrder')}
                >
                  Клиент
                  {getSortIcon('clientOrder')}
                </button>
              </TableHead>
              <TableHead className="text-center">{translations.printLabels[language]}</TableHead>
              <TableHead className="text-center">{translations.publishedOnWebsite[language]}</TableHead>
              <TableHead className="text-center">{translations.publishedInApp[language]}</TableHead></>)}
              <TableHead className="text-center">{translations.isStopList[language]}</TableHead>
               { user.role === 'COOK' ? '' :
              (<TableHead className="text-right">{translations.actions[language]}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center">
                  {translations.loading[language]}
                </TableCell>
              </TableRow>
            ) : sortedCategoryTree.length > 0 ? (
              sortedCategoryTree.map(category => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  language={language}
                  onDelete={onDelete}
                  fetchData={fetchData}
                  router={router}
                  expandedCategories={expandedCategories}
                  toggleCategory={toggleCategory}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onClientMoveUp={handleClientMoveUp}
                  onClientMoveDown={handleClientMoveDown}
                  selectedProducts={selectedProducts}
                  onSelectProduct={handleSelectProduct}
                  onSelectAllInCategory={handleSelectAllInCategory}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center">
                  {translations.noProducts[language]}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};