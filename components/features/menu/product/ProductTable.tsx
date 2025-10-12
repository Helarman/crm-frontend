import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, ChevronUp, ChevronDown, ChevronRight, ChevronsUpDown, ArrowUp, ArrowDown, MoveUp, MoveDown } from 'lucide-react';
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

interface Restaurant {
  id: string;
  title: string;
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
  isLoading: boolean;
  language: Language;
  onDelete: (id: string) => void;
  fetchData: () => void;
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
    ru: 'Печать лейблов',
    ka: 'ლეიბლების დაბეჭდვა'
  },
  publishedOnWebsite: {
    ru: 'На сайте',
    ka: 'საიტზე'
  },
  publishedInApp: {
    ru: 'В приложении',
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
  }
};

type SortDirection = 'asc' | 'desc' | null;
type SortField = 'title' | 'price' | 'category' | 'order' | null;
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

const buildCategoryTree = (categories: Category[], products: Product[], language: Language): CategoryNode[] => {
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
        // Если родитель не найден, добавляем в корень
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
        // Если категория продукта не найдена в списке категорий, добавляем в безкатегорийные
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

  // Сортируем корневые узлы
  return rootNodes.sort((a, b) => a.title.localeCompare(b.title));
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
  isFirst,
  isLast
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
  isFirst: boolean;
  isLast: boolean;
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loadingToggles, setLoadingToggles] = useState<Record<string, boolean>>({});
  const [loadingOrder, setLoadingOrder] = useState(false);

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

  const handleMoveUp = async () => {
    if (isFirst) return;
    setLoadingOrder(true);
    try {
      await onMoveUp(product.id);
      toast.success(translations.orderUpdateSuccess[language]);
      fetchData();
    } catch (error) {
      console.error('Error moving product up:', error);
      toast.error(translations.orderUpdateError[language]);
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleMoveDown = async () => {
    if (isLast) return;
    setLoadingOrder(true);
    try {
      await onMoveDown(product.id);
      toast.success(translations.orderUpdateSuccess[language]);
      fetchData();
    } catch (error) {
      console.error('Error moving product down:', error);
      toast.error(translations.orderUpdateError[language]);
    } finally {
      setLoadingOrder(false);
    }
  };

  const printLabelsKey = `${product.id}-togglePrintLabels`;
  const websiteKey = `${product.id}-togglePublishedOnWebsite`;
  const appKey = `${product.id}-togglePublishedInApp`;
  const stopListKey = `${product.id}-toggleStopList`;

  return (
    <>
      <TableRow>
        <TableCell className="font-medium" style={{ paddingLeft: `${depth * 20 + 12}px` }}>
          <div className="flex items-center gap-2">
            {product.title}
            <Badge variant="outline" className="ml-2">
              {product.sortOrder || 0}
            </Badge>
          </div>
        </TableCell>
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
        <TableCell className="text-center">
          <Switch
            checked={product.printLabels}
            onCheckedChange={() => handleToggle(product.id, 'togglePrintLabels')}
            disabled={loadingToggles[printLabelsKey]}
          />
        </TableCell>
        <TableCell className="text-center">
          <Switch
            checked={product.publishedOnWebsite}
            onCheckedChange={() => handleToggle(product.id, 'togglePublishedOnWebsite')}
            disabled={loadingToggles[websiteKey]}
          />
        </TableCell>
        <TableCell className="text-center">
          <Switch
            checked={product.publishedInApp}
            onCheckedChange={() => handleToggle(product.id, 'togglePublishedInApp')}
            disabled={loadingToggles[appKey]}
          />
        </TableCell>
        <TableCell className="text-center">
          <Switch
            checked={product.isStopList}
            onCheckedChange={() => handleToggle(product.id, 'toggleStopList')}
            disabled={loadingToggles[stopListKey]}
          />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center gap-1">
            {/* Кнопки управления порядком */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMoveUp}
              disabled={isFirst || loadingOrder}
              title={translations.moveUp[language]}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMoveDown}
              disabled={isLast || loadingOrder}
              title={translations.moveDown[language]}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>

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
  onMoveDown
}: {
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
}) => {
  const isExpanded = expandedCategories.has(category.id);
  const hasChildren = category.children.length > 0 || category.products.length > 0;
  const isUncategorized = category.id === 'uncategorized';

  return (
    <>
      {(hasChildren || isUncategorized) && (
        <TableRow 
          className={`${depth === 0 ? 'bg-gray-50' : ''} cursor-pointer`}
          onClick={() => hasChildren && toggleCategory(category.id)}
        >
          <TableCell colSpan={8} className="font-medium" style={{ paddingLeft: `${depth * 20 + 12}px` }}>
            <div className="flex items-center">
              {hasChildren && !isUncategorized ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 p-0 -ml-2 mr-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategory(category.id);
                  }}
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
          </TableCell>
        </TableRow>
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
            />
          ))}
          {category.products.map((product, index) => (
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
              isFirst={index === 0}
              isLast={index === category.products.length - 1}
            />
          ))}
        </>
      )}

      {isUncategorized && category.products.map((product, index) => (
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
          isFirst={index === 0}
          isLast={index === category.products.length - 1}
        />
      ))}
    </>
  );
};

export const ProductTable = ({
  products,
  isLoading,
  language,
  onDelete,
  fetchData
}: ProductTableProps) => {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  console.log(products)
  const allCategories: Category[] = [];
  const categoryMap = new Map<string, Category>();
  
 const collectAllCategories = (category: Category | null) => {
    if (!category) return;
    
    if (!categoryMap.has(category.id)) {
      categoryMap.set(category.id, category);
      allCategories.push(category);
      
      // Рекурсивно добавляем родительские категории, если они есть
      if (category.parent) {
        collectAllCategories(category.parent);
      }
    }
  };

  products.forEach(product => {
    if (product.category) {
      collectAllCategories(product.category);
    }
  });

  const categoryTree = buildCategoryTree(allCategories, products, language);

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
        case 'order':
          comparison = (a.sortOrder || 0) - (b.sortOrder || 0);
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
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <button 
                className="flex items-center"
                onClick={() => handleSort('title')}
              >
                {translations.title[language]}
                {getSortIcon('title')}
              </button>
            </TableHead>
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
            <TableHead className="text-center">{translations.printLabels[language]}</TableHead>
            <TableHead className="text-center">{translations.publishedOnWebsite[language]}</TableHead>
            <TableHead className="text-center">{translations.publishedInApp[language]}</TableHead>
            <TableHead className="text-center">{translations.isStopList[language]}</TableHead>
            <TableHead className="text-right">{translations.actions[language]}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
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
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                {translations.noProducts[language]}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};