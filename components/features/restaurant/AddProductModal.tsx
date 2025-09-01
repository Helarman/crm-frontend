import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useCategories } from '@/lib/hooks/useCategories';
import { useProducts } from '@/lib/hooks/useProducts';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { toast } from 'sonner';
import { useLanguageStore } from '@/lib/stores/language-store';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface Product {
  id: string;
  title: string;
  price: number;
  categoryId?: string;
}

interface Category {
  id: string;
  title: string;
  description?: string;
}

interface AddProductModalProps {
  restaurantId: string;
  onSuccess: () => void;
  restaurantProducts?: Product[];
}

export function AddProductModal({
  restaurantId,
  onSuccess,
  restaurantProducts = [],
}: AddProductModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [categorySearch, setCategorySearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [isCategorySelectOpen, setIsCategorySelectOpen] = useState(false);
  const [isProductSelectOpen, setIsProductSelectOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguageStore();

  // Загрузка данных
  const { data: categories = [] } = useCategories();
  const { data: allProducts = [], error: productsError } = useProducts(selectedCategoryId);

  // Переводы
  const translations = {
    ru: {
      title: 'Добавить продукт в меню',
      categoryLabel: 'Категория',
      productLabel: 'Продукт',
      searchPlaceholder: 'Поиск продуктов...',
      categorySearchPlaceholder: 'Поиск категорий...',
      availableCount: (count: number) => `(${count} доступно)`,
      noProducts: 'Нет доступных продуктов',
      noCategories: 'Нет доступных категорий',
      allAdded: 'Все продукты этой категории уже добавлены',
      selectCategory: 'Выберите категорию',
      selectProduct: 'Выберите продукт',
      cancel: 'Отмена',
      add: 'Добавить',
      adding: 'Добавление...',
      success: 'Продукт успешно добавлен',
      error: 'Не удалось добавить продукт',
      selectError: 'Выберите продукт',
      loadError: 'Ошибка загрузки продуктов',
    },
    ka: {
      title: 'მენიუში პროდუქტის დამატება',
      categoryLabel: 'კატეგორია',
      productLabel: 'პროდუქტი',
      searchPlaceholder: 'პროდუქტების ძებნა...',
      categorySearchPlaceholder: 'კატეგორიების ძებნა...',
      availableCount: (count: number) => `(${count} ხელმისაწვდომია)`,
      noProducts: 'პროდუქტები არ არის',
      noCategories: 'კატეგორიები არ არის',
      allAdded: 'ამ კატეგორიის ყველა პროდუქტი უკვე დამატებულია',
      selectCategory: 'აირჩიეთ კატეგორია',
      selectProduct: 'აირჩიეთ პროდუქტი',
      cancel: 'გაუქმება',
      add: 'დამატება',
      adding: 'დამატება...',
      success: 'პროდუქტი წარმატებით დაემატა',
      error: 'პროდუქტის დამატება ვერ მოხერხდა',
      selectError: 'აირჩიეთ პროდუქტი',
      loadError: 'პროდუქტების ჩატვირთვის შეცდომა',
    },
  };

  const t = translations[language];

  const availableProducts = useMemo(() => {
    if (!selectedCategoryId || !Array.isArray(allProducts.products)) return [];
    
    const restaurantProductIds = restaurantProducts.map(p => p.id);
    return allProducts.products.filter((product: Product) => {
      const nameMatches = product.title?.toLowerCase().includes(productSearch.toLowerCase()) ?? false;
      return !restaurantProductIds.includes(product.id) && nameMatches;
    });
  }, [allProducts, restaurantProducts, productSearch, selectedCategoryId]);

  const filteredCategories = useMemo(() => {
    return categories.filter((category : any) => 
      category.title.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const selectedProduct = useMemo(
    () => availableProducts.find((p: Product) => p.id === selectedProductId),
    [availableProducts, selectedProductId]
  );

  const selectedCategory = useMemo(
    () => categories.find((c: any) => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  useEffect(() => {
    if (!open) {
      setSelectedCategoryId('');
      setSelectedProductId('');
      setProductSearch('');
      setCategorySearch('');
    }
  }, [open]);

  const handleAddProduct = async () => {
    if (!selectedProductId) {
      toast.error(t.selectError);
      return;
    }

    setIsLoading(true);
    try {
      await RestaurantService.addProduct(restaurantId, { productId: selectedProductId });
      toast.success(t.success);
      setOpen(false);
      onSuccess();
    } catch (err) {
      toast.error(t.error);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          {language === 'ru' ? 'Добавить' : 'პროდუქტის დამატება'}
        </Button>
      </DialogTrigger>
      <DialogContent className="z-[1000]">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Категория */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t.categoryLabel}
            </label>
            <div className="relative">
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isCategorySelectOpen}
                className="w-full justify-between"
                onClick={() => setIsCategorySelectOpen(true)}
              >
                {selectedCategory ? selectedCategory.title : t.selectCategory}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </div>
          </div>

          {isCategorySelectOpen && (
            <div 
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setIsCategorySelectOpen(false)}
            >
              <div 
                className="bg-background rounded-lg border shadow-lg w-full max-w-md max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <Command>
                  <CommandInput
                    placeholder={t.categorySearchPlaceholder}
                    value={categorySearch}
                    onValueChange={setCategorySearch}
                  />
                  <CommandList>
                    <CommandEmpty>{t.noCategories}</CommandEmpty>
                    <CommandGroup>
                      {filteredCategories.map((category: any) => (
                        <CommandItem
                          key={category.id}
                          value={category.title}
                          onSelect={() => {
                            setSelectedCategoryId(category.id);
                            setSelectedProductId('');
                            setIsCategorySelectOpen(false);
                            setCategorySearch('');
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCategoryId === category.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {category.title}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            </div>
          )}

          {/* Продукт */}
          {selectedCategoryId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">
                  {t.productLabel}
                </label>
                {availableProducts.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {t.availableCount(availableProducts.length)}
                  </span>
                )}
              </div>

              {productsError && (
                <div className="text-red-500 text-sm">
                  {t.loadError}
                </div>
              )}

              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isProductSelectOpen}
                className={cn(
                  "w-full justify-between",
                  !selectedProductId && "text-muted-foreground"
                )}
                disabled={!selectedCategoryId || availableProducts.length === 0 || !!productsError}
                onClick={() => setIsProductSelectOpen(true)}
              >
                {selectedProduct
                  ? `${selectedProduct.title} - ${selectedProduct.price} ₽`
                  : t.selectProduct}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>

              {isProductSelectOpen && (
                <div 
                  className="fixed inset-0 z-[1050] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setIsProductSelectOpen(false)}
                >
                  <div 
                    className="bg-background rounded-lg border shadow-lg w-full max-w-md max-h-[80vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Command>
                      <CommandInput
                        placeholder={t.searchPlaceholder}
                        value={productSearch}
                        onValueChange={setProductSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {productsError
                            ? t.loadError
                            : availableProducts.length === 0
                              ? t.noProducts
                              : t.allAdded}
                        </CommandEmpty>
                        <CommandGroup>
                          {availableProducts.map((product: Product) => (
                            <CommandItem
                              key={product.id}
                              value={`${product.title} ${product.price}`}
                              onSelect={() => {
                                setSelectedProductId(product.id);
                                setIsProductSelectOpen(false);
                                setProductSearch('');
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedProductId === product.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {product.title} - {product.price} ₽
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Кнопки действий */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              onClick={handleAddProduct}
              disabled={isLoading || !selectedProductId || !!productsError}
            >
              {isLoading ? t.adding : t.add}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}