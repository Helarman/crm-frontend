import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from "next/link";
import { Language } from '@/lib/stores/language-store';

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
  onEdit: (product: any) => void;
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
};

export const ProductTable = ({
  products,
  isLoading,
  language,
  onEdit,
  onDelete,
}: ProductTableProps) => {
  return (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{translations.title[language as Language]}</TableHead>
            <TableHead>{translations.category[language as Language]}</TableHead>
            <TableHead>{translations.workshops[language as Language]}</TableHead>
            {/*<TableHead>{translations.restaurants[language as Language]}</TableHead>*/}
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
                
                {/* Ячейка с цехами */}
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
                
                {/*<TableCell>
                  {JSON.stringify(product)}
                  <div className="flex flex-wrap gap-1">
                    {product.restaurants?.length > 0 ? (
                      product.restaurant.map((restaurant: Restaurant) => (
                        <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}>
                          <Badge variant="outline">
                            {restaurant.title}
                          </Badge>
                        </Link>
                      ))
                    ) : (
                      <Badge variant="outline">
                        {language === 'ru' ? 'Нет ресторанов' : 'რესტორანები არ არის'}
                      </Badge>
                    )}
                  </div>
                </TableCell>*/}
                
                <TableCell>
                  <Badge variant="secondary">
                    {product.price} ₽
                  </Badge>
                </TableCell>
                
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(product)}
                    className="mr-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(product.id)}
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
    </div>
  );
};