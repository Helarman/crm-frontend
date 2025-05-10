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

interface ProductTableProps {
  products: any[];
  isLoading: boolean;
  language: string;
  onEdit: (product: any) => void;
  onDelete: (id: string) => void;
  onHover: (product: any) => void;
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
  actions: {
    ru: 'Действия',
    ka: 'მოქმედებები',
  },
  noProducts: {
    ru: 'Продукты не найдены',
    ka: 'პროდუქტები ვერ მოიძებნა',
  },
};

export const ProductTable = ({
  products,
  isLoading,
  language,
  onEdit,
  onDelete,
  onHover,
}: ProductTableProps) => {
  return (
    <div className="rounded-md border mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{translations.title[language  as Language]}</TableHead>
            <TableHead>{translations.category[language  as Language]}</TableHead>
            <TableHead>{translations.restaurants[language as Language]}</TableHead>
            <TableHead>{translations.price[language as Language]}</TableHead>
            <TableHead className="text-right">{translations.actions[language as Language]}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length > 0 ? (
            products.map((product) => (
              <TableRow 
                key={`product-${product.id}`}
                onMouseEnter={() => onHover(product)}
                onMouseLeave={() => onHover(null)}
              >
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
                    {product.restaurants?.length > 0 ? (
                      product.restaurants.map((restaurant: Restaurant) => (
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
              <TableCell colSpan={5} className="h-24 text-center">
                {translations.noProducts[language as Language]}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};