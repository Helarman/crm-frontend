import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ChevronUp, ChevronDown, ChevronRight, ChevronsUpDown, ArrowUp, ArrowDown, GripVertical, Check, CheckSquare, Square, Archive, Undo } from 'lucide-react';
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
import { ProductService } from '@/lib/api/product.service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types/product';
import { Category } from '@/lib/types/order';
import { useAuth } from '@/lib/hooks/useAuth';
import Image from 'next/image';

// Удаляем все диалоги и компоненты для массовых операций, так как в архивном режиме они не нужны

interface ProductRowArchivedProps {
  product: Product;
  language: Language;
  onRestore: (id: string) => void;
  onHardDelete: (id: string) => void;
  fetchData: () => void;
  selectedProducts: Set<string>;
  onSelectProduct: (id: string) => void;
}

interface ProductTableArchivedProps {
  products: Product[];
  filteredProductIds: Set<string>;
  isLoading: boolean;
  language: Language;
  onRestore: (id: string) => void;
  onHardDelete: (id: string) => void;
  fetchData: () => void;
  isArchivedMode: boolean;
  onBulkRestore?: (productIds: string[]) => void;
  onBulkHardDelete?: (productIds: string[]) => void;
}

const translations = {
  title: {
    ru: 'Название',
    ka: 'სათაური',
  },
  image: {
    ru: 'Изображение',
    ka: 'გამოსახულება',
  },
  restoreProduct: {
    ru: 'Восстановить',
    ka: 'აღდგენა'
  },
  hardDelete: {
    ru: 'Удалить навсегда',
    ka: 'სამუდამოდ წაშლა'
  },
  bulkRestore: {
    ru: 'Восстановить выбранные',
    ka: 'არჩეულის აღდგენა'
  },
  bulkHardDelete: {
    ru: 'Удалить выбранные навсегда',
    ka: 'არჩეულის სამუდამოდ წაშლა'
  },
  restoreConfirmation: {
    ru: 'Вы уверены, что хотите восстановить этот продукт?',
    ka: 'დარწმუნებული ხართ, რომ გსურთ ამ პროდუქტის აღდგენა?'
  },
  hardDeleteConfirmation: {
    ru: 'Вы уверены, что хотите удалить этот продукт навсегда? Это действие необратимо.',
    ka: 'დარწმუნებული ხართ, რომ გსურთ ამ პროდუქტის სამუდამოდ წაშლა? ეს მოქმედება შეუქცევადია.'
  },
  bulkRestoreConfirmation: {
    ru: (count: number) => `Вы уверены, что хотите восстановить ${count} продукт(ов)?`,
    ka: (count: number) => `დარწმუნებული ხართ, რომ გსურთ ${count} პროდუქტის აღდგენა?`
  },
  bulkHardDeleteConfirmation: {
    ru: (count: number) => `Вы уверены, что хотите удалить ${count} продукт(ов) навсегда? Это действие необратимо.`,
    ka: (count: number) => `დარწმუნებული ხართ, რომ გსურთ ${count} პროდუქტის სამუდამოდ წაშლა? ეს მოქმედება შეუქცევადია.`
  },
  restoreTitle: {
    ru: 'Восстановить продукт',
    ka: 'პროდუქტის აღდგენა'
  },
  hardDeleteTitle: {
    ru: 'Удалить продукт навсегда',
    ka: 'პროდუქტის სამუდამოდ წაშლა'
  },
  cancel: {
    ru: 'Отмена',
    ka: 'გაუქმება'
  },
  confirm: {
    ru: 'Подтвердить',
    ka: 'დადასტურება'
  },
  noProducts: {
    ru: 'Архивные продукты не найдены',
    ka: 'არქივში პროდუქტები ვერ მოიძებნა'
  },
  loading: {
    ru: 'Загрузка...',
    ka: 'იტვირთება...'
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
  bulkOperationSuccess: {
    ru: 'Массовая операция выполнена успешно',
    ka: 'მასობრივი ოპერაცია წარმატებით შესრულდა'
  },
  bulkOperationError: {
    ru: 'Ошибка при выполнении массовой операции',
    ka: 'მასობრივი ოპერაციის შესრულების შეცდომა'
  },
};

const ProductRowArchived = ({
  product,
  language,
  onRestore,
  onHardDelete,
  fetchData,
  selectedProducts,
  onSelectProduct
}: ProductRowArchivedProps) => {
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isHardDeleteDialogOpen, setIsHardDeleteDialogOpen] = useState(false);
  const isSelected = selectedProducts.has(product.id);

  return (
    <>
      <TableRow className={isSelected ? "bg-primary/10" : ""}>
        <TableCell>
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
          <div className="font-medium">{product.title}</div>
          {product.category && (
            <div className="text-xs text-muted-foreground mt-1">
              Категория: {product.category.title}
            </div>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRestoreDialogOpen(true)}
              title={translations.restoreProduct[language]}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHardDeleteDialogOpen(true)}
              title={translations.hardDelete[language]}
              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Диалог восстановления */}
      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.restoreTitle[language]}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.restoreConfirmation[language]}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel[language]}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              onRestore(product.id);
              setIsRestoreDialogOpen(false);
            }} className="bg-green-600 hover:bg-green-700">
              {translations.restoreProduct[language]}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог удаления навсегда */}
      <AlertDialog open={isHardDeleteDialogOpen} onOpenChange={setIsHardDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.hardDeleteTitle[language]}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.hardDeleteConfirmation[language]}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel[language]}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              onHardDelete(product.id);
              setIsHardDeleteDialogOpen(false);
            }} className="bg-destructive hover:bg-destructive/90">
              {translations.hardDelete[language]}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const ProductTableArchived = ({
  products,
  filteredProductIds,
  isLoading,
  language,
  onRestore,
  onHardDelete,
  fetchData,
  isArchivedMode,
  onBulkRestore,
  onBulkHardDelete
}: ProductTableArchivedProps) => {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkRestoreDialogOpen, setBulkRestoreDialogOpen] = useState(false);
  const [bulkHardDeleteDialogOpen, setBulkHardDeleteDialogOpen] = useState(false);

  const filteredProducts = products.filter(product =>
    filteredProductIds.has(product.id)
  );

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

  const handleBulkRestoreConfirm = async () => {
    if (!onBulkRestore) return;
    
    try {
      await onBulkRestore(Array.from(selectedProducts));
      toast.success(translations.bulkOperationSuccess[language]);
      setSelectedProducts(new Set());
      setBulkRestoreDialogOpen(false);
    } catch (error) {
      console.error('Error in bulk restore:', error);
      toast.error(translations.bulkOperationError[language]);
    }
  };

  const handleBulkHardDeleteConfirm = async () => {
    if (!onBulkHardDelete) return;
    
    try {
      await onBulkHardDelete(Array.from(selectedProducts));
      toast.success(translations.bulkOperationSuccess[language]);
      setSelectedProducts(new Set());
      setBulkHardDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error in bulk hard delete:', error);
      toast.error(translations.bulkOperationError[language]);
    }
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkRestoreDialogOpen(true)}
                className="h-8 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
              >
                <Undo className="h-3 w-3 mr-1" />
                {translations.bulkRestore[language]}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkHardDeleteDialogOpen(true)}
                className="h-8 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive/90"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {translations.bulkHardDelete[language]}
              </Button>
              
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
      <AlertDialog open={bulkRestoreDialogOpen} onOpenChange={setBulkRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.bulkRestore[language]}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.bulkRestoreConfirmation[language](selectedProducts.size)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel[language]}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkRestoreConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              {translations.restoreProduct[language]}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkHardDeleteDialogOpen} onOpenChange={setBulkHardDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.bulkHardDelete[language]}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.bulkHardDeleteConfirmation[language](selectedProducts.size)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel[language]}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkHardDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              {translations.hardDelete[language]}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Таблица */}
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
              <TableHead className="w-16"></TableHead>
              <TableHead>{translations.title[language]}</TableHead>
              <TableHead className="text-right w-32">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  {translations.loading[language]}
                </TableCell>
              </TableRow>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <ProductRowArchived
                  key={product.id}
                  product={product}
                  language={language}
                  onRestore={onRestore}
                  onHardDelete={onHardDelete}
                  fetchData={fetchData}
                  selectedProducts={selectedProducts}
                  onSelectProduct={handleSelectProduct}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
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