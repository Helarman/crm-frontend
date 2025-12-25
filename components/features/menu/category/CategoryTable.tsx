import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Language } from '@/lib/stores/language-store';
import { useEffect, useState } from 'react';

// Добавляем импорты для drag-and-drop
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogContentWide,
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
import { CategoryService } from '@/lib/api/category.service';
import { useRouter } from 'next/navigation';

interface CategoryTableProps {
  categories: any[];
  isLoading: boolean;
  language: string;
  onEdit: (category: any) => void;
  onDelete: (id: string) => void;
  onAddSubcategory: (parentId: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onMoveUpOnClient: (id: string) => void;
  onMoveDownOnClient: (id: string) => void;
  viewMode: 'tree' | 'flat';
  onRefreshData: () => void;
}

const translations = {
  title: {
    ru: 'Название',
    ka: 'სათაური',
  },
  order: {
    ru: 'Порядок',
    ka: 'რიგი',
  },
  adminOrder: {
    ru: 'Панель',
    ka: 'რიგი (ადმინი)',
  },
  clientOrder: {
    ru: 'Клиент',
    ka: 'რიგი (საიტი)',
  },
  actions: {
    ru: 'Действия',
    ka: 'მოქმედებები',
  },
  noCategories: {
    ru: 'Категории не найдены',
    ka: 'კატეგორიები ვერ მოიძებნა',
  },
  loading: {
    ru: 'Загрузка...',
    ka: 'იტვირთება...',
  },
  addSubcategory: {
    ru: 'Добавить подкатегорию',
    ka: 'ქვეკატეგორიის დამატება',
  },
  moveUp: {
    ru: 'Поднять',
    ka: 'აწევა',
  },
  moveDown: {
    ru: 'Опустить',
    ka: 'ჩამოწევა',
  },
  manageAdminOrder: {
    ru: 'Порядок в панели',
    ka: 'პანელის რიგი'
  },
  manageClientOrder: {
    ru: 'Порядок на сайте',
    ka: 'საიტის რიგი'
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
  cancel: {
    ru: 'Отмена',
    ka: 'გაუქმება'
  },
  manageAllAdminOrder: {
    ru: 'Порядок общим порядком в панели',
    ka: 'პანელის ზოგადი რიგის მართვა'
  },
  manageAllClientOrder: {
    ru: 'Порядок общим порядком на сайте',
    ka: 'საიტის ზოგადი რიგის მართვა'
  }
};

// Sortable Item Component для категорий
const SortableCategoryItem = ({ 
  category, 
  language, 
  onMoveUp, 
  onMoveDown, 
  isFirst, 
  isLast,
  type
}: { 
  category: any;
  language: string;
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
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const currentOrder = type === 'admin' ? category.order || 0 : category.clientOrder || 0;

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
        <div className="font-medium">{category.title}</div>
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
          ↑
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onMoveDown}
          disabled={isLast}
        >
          ↓
        </Button>
      </div>
    </div>
  );
};

const OrderManagementDialog = ({
  isOpen,
  onClose,
  categories,
  language,
  parentCategoryTitle,
  onSaveOrder,
  type
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  language: string;
  parentCategoryTitle: string;
  onSaveOrder: (reorderedCategories: any[]) => Promise<void>;
  type: 'admin' | 'client';
}) => {
  const [items, setItems] = useState<any[]>(categories);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    setItems(categories);
  }, [categories]);



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
      onClose();
    } catch (error) {
      console.error('Error saving order:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContentWide className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {type === 'admin' ? translations.manageAdminOrder[language as Language] : translations.manageClientOrder[language as Language]} - {parentCategoryTitle}
          </DialogTitle>
          <DialogDescription>
            {translations.dragAndDropHint[language as Language]}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {items.map((category, index) => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
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
            {translations.cancel[language as Language]}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? translations.saving[language as Language] : translations.saveOrder[language as Language]}
          </Button>
        </DialogFooter>
      </DialogContentWide>
    </Dialog>
  );
};

const CategoryRow = ({ 
  category, 
  depth = 0, 
  language, 
  onEdit, 
  onDelete, 
  onAddSubcategory,
  onMoveUp,
  onMoveDown,
  onMoveUpOnClient,
  onMoveDownOnClient,
  isFirst = false,
  isLast = false,
  isClientFirst = false,
  isClientLast = false,
  parentCategory,
  onRefreshData 
}: {
  category: any;
  depth?: number;
  language: string;
  onEdit: (category: any) => void;
  onDelete: (id: string) => void;
  onAddSubcategory: (parentId: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onMoveUpOnClient: (id: string) => void;
  onMoveDownOnClient: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
  isClientFirst?: boolean;
  isClientLast?: boolean;
  parentCategory?: any;
  onRefreshData: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  
  // Состояния для диалогов
  const [adminOrderDialogOpen, setAdminOrderDialogOpen] = useState(false);
  const [clientOrderDialogOpen, setClientOrderDialogOpen] = useState(false);

  const handleSaveAdminOrder = async (reorderedCategories: any[]) => {
    try {
      // Обновляем порядок на сервере, начиная с 1
      for (let i = 0; i < reorderedCategories.length; i++) {
        await CategoryService.updateOrder(reorderedCategories[i].id, i + 1);
      }
      // Обновляем данные
      onRefreshData()
    } catch (error) {
      console.error('Error updating admin order:', error);
      throw error;
    }
  };

  const handleSaveClientOrder = async (reorderedCategories: any[]) => {
    try {
      // Обновляем клиентский порядок на сервере, начиная с 1
      for (let i = 0; i < reorderedCategories.length; i++) {
        await CategoryService.updateClientOrder(reorderedCategories[i].id, i + 1);
      }
     onRefreshData()
    } catch (error) {
      console.error('Error updating client order:', error);
      throw error;
    }
  };
  const router = useRouter()
  return (
    <>
      <TableRow>
        <TableCell className="font-medium flex items-center" style={{ paddingLeft: `${depth * 20 + 12}px` }}>
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-8 p-0 -ml-2 mr-1"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
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
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {/* Бейдж с номером порядка в админке */}
            <Badge variant="outline" className="min-w-8 text-center">
              {category.order || 0}
            </Badge>

          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {/* Бейдж с номером порядка на сайте */}
            <Badge variant="outline" className="min-w-8 text-center">
              {category.clientOrder || 0}
            </Badge>

          </div>
        </TableCell>
        <TableCell className='flex gap-2 jistify-center items-center'>
             {isOpen && hasChildren && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setAdminOrderDialogOpen(true);
                }}
                title={translations.manageAdminOrder[language as Language]}
              >
                <Badge variant="secondary" className="mr-1">A</Badge>
                Порядок
              </Button>
            )}
          {isOpen && hasChildren && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setClientOrderDialogOpen(true);
                }}
                title={translations.manageClientOrder[language as Language]}
              >
                <Badge variant="secondary" className="mr-1">C</Badge>
                Порядок 
              </Button>
            )}</TableCell>
        <TableCell className="w-[250px]">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddSubcategory(category.id)}
              title={translations.addSubcategory[language as Language]}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`categories/${category.id}`)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(category.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Диалоги управления порядком для подкатегорий */}
      {hasChildren && (
        <>
          <OrderManagementDialog
            isOpen={adminOrderDialogOpen}
            onClose={() => setAdminOrderDialogOpen(false)}
            categories={category.children}
            language={language}
            parentCategoryTitle={category.title}
            onSaveOrder={handleSaveAdminOrder}
            type="admin"

          />
          <OrderManagementDialog
            isOpen={clientOrderDialogOpen}
            onClose={() => setClientOrderDialogOpen(false)}
            categories={category.children}
            language={language}
            parentCategoryTitle={category.title}
            onSaveOrder={handleSaveClientOrder}
            type="client"
          />
        </>
      )}

      {hasChildren && isOpen && category.children.map((child: any, index: number, array: any[]) => {
        const sortedByClient = [...array].sort((a, b) => (a.clientOrder || 0) - (b.clientOrder || 0));
        const clientIndex = sortedByClient.findIndex(c => c.id === child.id);
        
        return (
          <CategoryRow
            key={child.id}
            category={child}
            depth={depth + 1}
            language={language}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddSubcategory={onAddSubcategory}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onMoveUpOnClient={onMoveUpOnClient}
            onMoveDownOnClient={onMoveDownOnClient}
            isFirst={index === 0}
            isLast={index === array.length - 1}
            isClientFirst={clientIndex === 0}
            isClientLast={clientIndex === sortedByClient.length - 1}
            parentCategory={category}
            onRefreshData={onRefreshData} 
          />
        );
      })}
    </>
  );
};

export const CategoryTable = ({
  categories,
  isLoading,
  language,
  onEdit,
  onDelete,
  onAddSubcategory,
  onMoveUp,
  onMoveDown,
  onMoveUpOnClient,
  onMoveDownOnClient,
  viewMode,
  onRefreshData
}: CategoryTableProps) => {
  // Состояния для диалогов общего порядка
  const [allAdminOrderDialogOpen, setAllAdminOrderDialogOpen] = useState(false);
  const [allClientOrderDialogOpen, setAllClientOrderDialogOpen] = useState(false);

  const handleSaveAllAdminOrder = async (reorderedCategories: any[]) => {
    try {
      // Обновляем порядок на сервере для всех категорий
      for (let i = 0; i < reorderedCategories.length; i++) {
        await CategoryService.updateOrder(reorderedCategories[i].id, i + 1);
      }
      onRefreshData()
    } catch (error) {
      console.error('Error updating all admin order:', error);
      throw error;
    }
  };

  const handleSaveAllClientOrder = async (reorderedCategories: any[]) => {
    try {
      // Обновляем клиентский порядок на сервере для всех категорий
      for (let i = 0; i < reorderedCategories.length; i++) {
        await CategoryService.updateClientOrder(reorderedCategories[i].id, i + 1);
      }
      onRefreshData()
    } catch (error) {
      console.error('Error updating all client order:', error);
      throw error;
    }
  };


  return (
    <div className="rounded-md border">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-full">{translations.title[language as Language]}</TableHead>
            <TableHead>
                <span>{translations.adminOrder[language as Language]}</span>
            </TableHead>
            <TableHead>
                <span>{translations.clientOrder[language as Language]}</span>
            </TableHead>
            <TableHead className='gap-2 justify-center items-center flex'>
              <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllAdminOrderDialogOpen(true)}
                  title={translations.manageAllAdminOrder[language as Language]}
                >
                  <Badge variant="secondary" className="mr-1">A</Badge>
                  Порядок
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAllClientOrderDialogOpen(true)}
                  title={translations.manageAllClientOrder[language as Language]}
                >
                  <Badge variant="secondary" className="mr-1">C</Badge>
                  Порядок
                </Button>
            </TableHead>
            <TableHead className="w-[250px] text-right">{translations.actions[language as Language]}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                {translations.loading[language as Language]}
              </TableCell>
            </TableRow>
          ) : categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                {translations.noCategories[language as Language]}
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category, index, array) => {
              const sortedByClient = [...array].sort((a, b) => (a.clientOrder || 0) - (b.clientOrder || 0));
              const clientIndex = sortedByClient.findIndex(c => c.id === category.id);
              
              return (
                <CategoryRow
                  key={category.id}
                  category={category}
                  language={language}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddSubcategory={onAddSubcategory}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  onMoveUpOnClient={onMoveUpOnClient}
                  onMoveDownOnClient={onMoveDownOnClient}
                  isFirst={index === 0}
                  isLast={index === array.length - 1}
                  isClientFirst={clientIndex === 0}
                  isClientLast={clientIndex === sortedByClient.length - 1}
                  onRefreshData={onRefreshData} 
                />
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Диалоги управления общим порядком */}
      <OrderManagementDialog
        isOpen={allAdminOrderDialogOpen}
        onClose={() => setAllAdminOrderDialogOpen(false)}
        categories={categories}
        language={language}
        parentCategoryTitle="Все категории"
        onSaveOrder={handleSaveAllAdminOrder}
        type="admin"
      />
      <OrderManagementDialog
        isOpen={allClientOrderDialogOpen}
        onClose={() => setAllClientOrderDialogOpen(false)}
        categories={categories}
        language={language}
        parentCategoryTitle="Все категории"
        onSaveOrder={handleSaveAllClientOrder}
        type="client"
      />
    </div>
  );
};