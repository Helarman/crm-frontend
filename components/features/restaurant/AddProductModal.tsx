import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent  } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command"
import { Input } from '@/components/ui/input';
import { useCategories } from '@/lib/hooks/useCategories';
import { useProducts } from '@/lib/hooks/useProducts';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { toast } from 'sonner';
import { useLanguageStore } from '@/lib/stores/language-store';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from "@/lib/utils";

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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
      availableCount: (count: number) => `(${count} доступно)`,
      noProducts: 'Нет доступных продуктов',
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
      availableCount: (count: number) => `(${count} ხელმისაწვდომია)`,
      noProducts: 'პროდუქტები არ არის',
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
    return allProducts.products.filter((product : Product) => {
      const nameMatches = product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      return !restaurantProductIds.includes(product.id) && nameMatches;
    });
  }, [allProducts, restaurantProducts, searchTerm, selectedCategoryId]);

  const selectedProduct = useMemo(
    () => availableProducts.find((p : Product) => p.id === selectedProductId),
    [availableProducts, selectedProductId]
  );


  useEffect(() => {
    if (!open) {
      setSelectedCategoryId('');
      setSelectedProductId('');
      setSearchTerm('');
    }
  }, [open]);

  const handleSelect = (productId : string) =>{
    setSelectedProductId(productId)
    setIsPopoverOpen(false)
  }
  
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
          <div>
            <label className="block text-sm font-medium mb-1">
              {t.categoryLabel}
            </label>
            <div className="relative">
              <select
                className="w-full p-2 border rounded appearance-auto bg-white"
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setSelectedProductId('');
                }}
              >
                <option value="">{t.selectCategory}</option>
                {categories.map((category: Category) => (
                  <option key={category.id} value={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Выбор продукта */}
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

              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                        "w-full justify-between",
                        !selectedProductId && "text-muted-foreground"
                    )}
                    disabled={!selectedCategoryId || availableProducts.length === 0 || !!productsError}
                    >
                    {selectedProduct
                        ? `${selectedProduct.title} - ${selectedProduct.price} ₽`
                        : t.selectProduct}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[1060]">
                    <Command onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                        setIsPopoverOpen(false);
                        }
                    }}>
                        <CommandInput
                            placeholder={t.searchPlaceholder}
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                        />
                        <CommandEmpty>
                            {productsError
                            ? t.loadError
                            : allProducts.length === 0
                                ? t.noProducts
                                : t.allAdded}
                        </CommandEmpty>
                        <CommandGroup>
                            {availableProducts.map((product: Product) => (
                            <CommandItem
                                value={`${product.title} ${product.price}`}
                                key={product.id}
                                onSelect={() => {
                                handleSelect(product.id); // Обновляем только ID
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
                    </Command>
                </PopoverContent>
                </Popover>
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