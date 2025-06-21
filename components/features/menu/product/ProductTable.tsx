import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from "next/link";
import { Language } from '@/lib/stores/language-store';
import { useRouter } from 'next/navigation';
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

interface Restaurant {
  id: string
  title: string
}

interface Workshop {
  id: string
  name: string
}

export interface WorkshopIn{
  id: string
  workshop: Workshop
}

interface ProductTableProps {
  products: any[];
  isLoading: boolean;
  language: string;
  onDelete: (id: string) => void;
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
};

export const ProductTable = ({
  products,
  isLoading,
  language,
  onDelete,
}: ProductTableProps) => {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      onDelete(productToDelete);
    }
    setIsDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  return (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{translations.title[language as Language]}</TableHead>
            <TableHead>{translations.category[language as Language]}</TableHead>
            <TableHead>{translations.workshops[language as Language]}</TableHead>
            <TableHead>{translations.price[language as Language]}</TableHead>
            <TableHead className="text-right">{translations.actions[language as Language]}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length > 0 ? (
            products.map((product) => (
              <TableRow key={`${product.id}`}>
                <TableCell className="font-medium">{product.title}</TableCell>
                
                <TableCell>
                  {product.category ? (
                    <Badge variant="outline">
                      {product.category.title}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {product.workshops?.length > 0 ? (
                      product.workshops.map((workshop: WorkshopIn) => (
                        <Badge 
                          key={`${workshop.workshop.id}`} 
                          variant="outline"
                          className="whitespace-nowrap"
                        >
                          {workshop.workshop.name}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">
                        {translations.noWorkshops[language as Language]}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant="secondary">
                    {product.price} ₽
                  </Badge>
                </TableCell>
                
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/products/${product.id}`)}
                    className="mr-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                {translations.noProducts[language as Language]}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.deleteTitle[language as Language]}</AlertDialogTitle>
            <AlertDialogDescription>
              {translations.deleteConfirmation[language as Language]}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{translations.cancel[language as Language]}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              {translations.confirm[language as Language]}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};