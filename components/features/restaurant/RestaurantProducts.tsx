import { useRestaurantProducts } from '@/lib/hooks/useRestaurant';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { useCategories } from '@/lib/hooks/useCategories'; // Хук для категорий с SWR
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useLanguageStore } from '@/lib/stores/language-store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AddProductModal } from './AddProductModal';
import { Edit, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  title: string;
  price: number;
}

export function RestaurantProducts({ restaurantId }: { restaurantId: string }) {
  const router = useRouter()
  const { data: restaurantProducts = [], mutate: mutateProducts } = useRestaurantProducts(restaurantId);
  const { data: categories } = useCategories();
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguageStore();
  const [newProductId, setNewProductId] = useState('');
  
  const translations = {
    ru: {
      title: "Меню ресторана",
      idPlaceholder: "ID продукта",
      addButton: "Добавить",
      addIdButton: "Добавить по ID",
      adding: "Добавление...",
      addSuccess: "Продукт успешно добавлен",
      addError: "Не удалось добавить продукт",
      emptyIdError: "Введите ID продукта",
      removeSuccess: "Продукт удалён из меню",
      removeError: "Не удалось удалить продукт",
      name: "Название",
      price: "Цена",
      category: "Категория",
      actions: "Действия",
      uncategorized: "Без категории",
      remove: "Удалить"
    },
    ka: {
      title: "რესტორანის მენიუ",
      idPlaceholder: "პროდუქტის ID",
      addButton: "დამატება",
      addIdButton: "დაამატეთ ID-ით",
      adding: "დამატება...",
      addSuccess: "პროდუქტი წარმატებით დაემატა",
      addError: "პროდუქტის დამატება ვერ მოხერხდა",
      emptyIdError: "შეიყვანეთ პროდუქტის ID",
      removeSuccess: "პროდუქტი წაიშალა მენიუდან",
      removeError: "პროდუქტის წაშლა ვერ მოხერხდა",
      name: "სახელი",
      price: "ფასი",
      category: "კატეგორია",
      actions: "მოქმედებები",
      uncategorized: "კატეგორიის გარეშე",
      remove: "წაშლა"
    }
  } as const;

  const t = translations[language];

  // Группировка продуктов по категориям
  const productsByCategory = restaurantProducts?.reduce(
    (acc: Record<string, typeof restaurantProducts>, product: any) => {
      const categoryId = product.categoryId || 'uncategorized';
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(product);
      return acc;
    }, 
    {} as Record<string, typeof restaurantProducts>
  );
  // Создаем массив категорий с uncategorized в конце
  const sortedCategories = [
    ...(categories || []),
    { id: 'uncategorized', title: t.uncategorized, description: '' }
  ];

  const handleAddProduct = async () => {
    if (!newProductId.trim()) {
      toast.error(t.emptyIdError);
      return;
    }

    setIsLoading(true);
    try {
      await RestaurantService.addProduct(restaurantId, { productId: newProductId });
      mutateProducts();
      setNewProductId('');
      toast.success(t.addSuccess);
    } catch (err) {
      console.error('Failed to add product', err);
      toast.error(t.addError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    try {
      await RestaurantService.removeProduct(restaurantId, productId);
      mutateProducts();
      toast.success(t.removeSuccess);
    } catch (err) {
      console.error('Failed to remove product', err);
      toast.error(t.removeError);
    }
  };

  // Функция для генерации цвета badge на основе ID категории
  const getCategoryColor = (categoryId: string) => {
    const colors = [
      'bg-green-100 text-green-800',
      'bg-blue-100 text-blue-800',
      'bg-pink-100 text-pink-800',
      'bg-purple-100 text-purple-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800'
    ];
    const index = categoryId.charCodeAt(0) % colors.length;
    return colors[index];
  };
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t.title}</h2>
      
      
      <Accordion type="multiple" defaultValue={sortedCategories.map(c => c.id) as any} className="space-y-4">
        {sortedCategories.map((category) => {
          const categoryProducts = productsByCategory?.[category.id!] || [];
          if (categoryProducts.length === 0) return null;
          
          return (
            <AccordionItem key={category.id} value={category.id!} className="border rounded-lg">
              <AccordionTrigger className="px-2 py-3 hover:no-underline">
                <div className="flex items-center space-x-2">
                  {category.title}
                  <span className="text-sm text-gray-500">
                    ({categoryProducts.length})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.name}</TableHead>
                        <TableHead>{t.price}</TableHead>
                        <TableHead className="text-right">{t.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {categoryProducts.map((product: Product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.title}
                        </TableCell>
                        <TableCell>
                          {product.price}₽
                        </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/products/${product.id}`)}
                            >
                              <Pencil/>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}