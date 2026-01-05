import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import SearchableSelect from '@/components/features/menu/product/SearchableSelect';
import { CreateOrderAdditiveDto, UpdateOrderAdditiveDto, OrderAdditiveService, EnumOrderType, OrderAdditiveType } from "@/lib/api/order-additive.service";
import { WarehouseService } from "@/lib/api/warehouse.service";
import { Language } from '@/lib/stores/language-store';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OrderAdditiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmitSuccess: () => void;
    additiveId: string | null | undefined;
    formData: CreateOrderAdditiveDto;
    onInputChange: (name: keyof CreateOrderAdditiveDto, value: any) => void;
    language: string;
    selectedNetworkId?: string | null;
}

const translations = {
    addOrderAdditive: {
        ru: 'Добавить модификатор заказа',
        ka: 'შეკვეთის მოდიფიკატორის დამატება',
    },
    editOrderAdditive: {
        ru: 'Редактировать модификатор заказа',
        ka: 'შეკვეთის მოდიფიკატორის რედაქტირება',
    },
    title: {
        ru: 'Название',
        ka: 'სათაური',
    },
    description: {
        ru: 'Описание',
        ka: 'აღწერა',
    },
    price: {
        ru: 'Цена',
        ka: 'ფასი',
    },
    type: {
        ru: 'Тип',
        ka: 'ტიპი',
    },
    orderTypes: {
        ru: 'Типы заказов',
        ka: 'შეკვეთების ტიპები',
    },
    selectOrderTypes: {
        ru: 'Выберите типы заказов',
        ka: 'აირჩიეთ შეკვეთების ტიპები',
    },
    searchOrderTypes: {
        ru: 'Поиск типов заказов...',
        ka: 'შეკვეთის ტიპების ძებნა...',
    },
    noOrderTypes: {
        ru: 'Типы заказов не найдены',
        ka: 'შეკვეთის ტიპები ვერ მოიძებნა',
    },
    inventoryItem: {
        ru: 'Ингредиент',
        ka: 'ინგრედიენტი',
    },
    ingredientQuantity: {
        ru: 'Количество ингредиента',
        ka: 'ინგრედიენტის რაოდენობა',
    },
    isActive: {
        ru: 'Активен',
        ka: 'აქტიური',
    },
    selectInventoryItem: {
        ru: 'Выберите складскую позицию',
        ka: 'აირჩიეთ საწყობის პოზიცია',
    },
    searchInventoryItem: {
        ru: 'Поиск позиций...',
        ka: 'პოზიციების ძებნა...',
    },
    noInventoryItems: {
        ru: 'Позиции не найдены',
        ka: 'პოზიციები ვერ მოიძებნა',
    },
    fixed: {
        ru: 'Фиксированная',
        ka: 'ფიქსირებული',
    },
    perPerson: {
        ru: 'За человека',
        ka: 'კაცზე',
    },
    dineIn: {
        ru: 'В зале',
        ka: 'დარბაზში',
    },
    takeaway: {
        ru: 'С собой',
        ka: 'თან წასაღები',
    },
    delivery: {
        ru: 'Доставка',
        ka: 'მიწოდება',
    },
    banquet: {
        ru: 'Банкет',
        ka: 'ბანკეტი',
    },
    save: {
        ru: 'Сохранить',
        ka: 'შენახვა',
    },
    cancel: {
        ru: 'Отмена',
        ka: 'გაუქმება',
    },
    required: {
        ru: 'Обязательное поле',
        ka: 'აუცილებელი ველი',
    },
};

export const OrderAdditiveModal = ({
    isOpen,
    onClose,
    onSubmitSuccess,
    additiveId,
    formData,
    onInputChange,
    language,
    selectedNetworkId,
}: OrderAdditiveModalProps) => {
    const [inventoryItems, setInventoryItems] = useState<{ id: string; name: string; unit: string }[]>([]);
    const [isInventoryLoading, setIsInventoryLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Опции для типов заказов
    const orderTypeOptions = [
        { id: EnumOrderType.DINE_IN, label: translations.dineIn[language as Language] },
        { id: EnumOrderType.TAKEAWAY, label: translations.takeaway[language as Language] },
        { id: EnumOrderType.DELIVERY, label: translations.delivery[language as Language] },
        { id: EnumOrderType.BANQUET, label: translations.banquet[language as Language] },
    ];

    // Опции для типов модификаторов
    const typeOptions = [
        { value: OrderAdditiveType.FIXED, label: translations.fixed[language as Language] },
        { value: OrderAdditiveType.PER_PERSON, label: translations.perPerson[language as Language] },
    ];

    // Загружаем складские позиции
    useEffect(() => {
        if (isOpen && selectedNetworkId) {
            loadInventoryItems();
        }
    }, [isOpen, selectedNetworkId]);

    // Автоматически устанавливаем networkId
    useEffect(() => {
        if (isOpen && !additiveId && selectedNetworkId) {
            if (!formData.networkId) {
                onInputChange('networkId', selectedNetworkId);
            }
        }
    }, [isOpen, additiveId, selectedNetworkId, formData.networkId]);

    const loadInventoryItems = async () => {
        if (!selectedNetworkId) return;

        setIsInventoryLoading(true);
        try {
            const items = await WarehouseService.getInventoryItemsByNetwork(selectedNetworkId);
            const formattedItems = items.map((item: any) => ({
                id: item.id,
                name: item.name,
                unit: item.unit,
            }));
            setInventoryItems(formattedItems);
        } catch (error) {
            console.error('Failed to load inventory items', error);
            setInventoryItems([]);
        } finally {
            setIsInventoryLoading(false);
        }
    };

    const handleInventoryItemChange = (selectedIds: string[]) => {
        const selectedId = selectedIds[0] || '';
        onInputChange('inventoryItemId', selectedId);
    };

    const handleOrderTypesChange = (selectedIds: string[]) => {
        onInputChange('orderTypes', selectedIds);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Валидация
        if (!formData.title.trim()) {
            toast.error(language === 'ru' ? 'Введите название' : 'შეიყვანეთ სახელი');
            return;
        }

        if (formData.price <= 0) {
            toast.error(language === 'ru' ? 'Цена должна быть больше 0' : 'ფასი უნდა იყოს 0-ზე მეტი');
            return;
        }

        if (formData.orderTypes.length === 0) {
            toast.error(language === 'ru' ? 'Выберите хотя бы один тип заказа' : 'აირჩიეთ ერთი შეკვეთის ტიპი მაინც');
            return;
        }

        setIsSubmitting(true);

        try {
            if (additiveId) {
                const updateDto: UpdateOrderAdditiveDto = {
                    title: formData.title,
                    description: formData.description,
                    price: formData.price,
                    type: formData.type,
                    orderTypes: formData.orderTypes,
                    inventoryItemId: formData.inventoryItemId || null,
                    ingredientQuantity: formData.ingredientQuantity,
                    isActive: formData.isActive,
                };
                await OrderAdditiveService.update(additiveId, updateDto);
            } else {
                const createDto: CreateOrderAdditiveDto = {
                    title: formData.title,
                    description: formData.description,
                    price: formData.price,
                    type: formData.type,
                    orderTypes: formData.orderTypes,
                    inventoryItemId: formData.inventoryItemId,
                    ingredientQuantity: formData.ingredientQuantity,
                    networkId: selectedNetworkId || '',
                    isActive: formData.isActive,
                };
                await OrderAdditiveService.create(createDto);
            }

            toast.success(
                additiveId
                    ? language === 'ru' ? 'Модификатор заказа обновлен' : 'შეკვეთის მოდიფიკატორი განახლდა'
                    : language === 'ru' ? 'Модификатор заказа создан' : 'შეკვეთის მოდიფიკატორი შეიქმნა'
            );

            onSubmitSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving order additive:', error);
            toast.error(
                language === 'ru' ? 'Ошибка сохранения модификатора заказа' : 'შეკვეთის მოდიფიკატორის შენახვის შეცდომა'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChangeLocal = (name: keyof CreateOrderAdditiveDto, value: any) => {
        // Для числовых полей конвертируем значение
        if (name === 'price' || name === 'ingredientQuantity') {
            onInputChange(name, value === '' ? 0 : Number(value));
        } else {
            onInputChange(name, value);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {additiveId
                            ? translations.editOrderAdditive[language as Language]
                            : translations.addOrderAdditive[language as Language]}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="gap-4 flex flex-col py-4">
                        {/* Название */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-left">
                                {translations.title[language as Language]}
                            </Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => handleInputChangeLocal('title', e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>

                        {/* Цена */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-left">
                                {translations.price[language as Language]}
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                min="1"
                                value={formData.price}
                                onChange={(e) => handleInputChangeLocal('price', e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>

                        {/* Тип модификатора */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-left">
                                {translations.type[language as Language]}
                            </Label>
                            <div className="col-span-3">
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => onInputChange('type', value as OrderAdditiveType)}
                                >
                                    <SelectTrigger className='w-full'>
                                        <SelectValue placeholder={translations.type[language as Language]} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {typeOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Типы заказов (мультиселект) */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="orderTypes" className="text-left">
                                {translations.orderTypes[language as Language]}
                            </Label>
                            <div className="col-span-3">
                                <SearchableSelect
                                    options={orderTypeOptions}
                                    value={formData.orderTypes || []}
                                    onChange={handleOrderTypesChange}
                                    placeholder={translations.selectOrderTypes[language as Language]}
                                    searchPlaceholder={translations.searchOrderTypes[language as Language]}
                                    emptyText={translations.noOrderTypes[language as Language]}
                                    multiple={true}
                                />
                            </div>
                        </div>

                        {/* Ингредиент */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="inventoryItemId" className="text-left">
                                {translations.inventoryItem[language as Language]}
                            </Label>
                            <div className="col-span-3">
                                <SearchableSelect
                                    options={inventoryItems.map(item => ({
                                        id: item.id,
                                        label: `${item.name} (${item.unit})`
                                    }))}
                                    value={formData.inventoryItemId ? [formData.inventoryItemId] : []}
                                    onChange={handleInventoryItemChange}
                                    placeholder={translations.selectInventoryItem[language as Language]}
                                    searchPlaceholder={translations.searchInventoryItem[language as Language]}
                                    emptyText={translations.noInventoryItems[language as Language]}
                                    multiple={false}
                                    disabled={isInventoryLoading}
                                />
                            </div>
                        </div>

                        {/* Количество ингредиента */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="ingredientQuantity" className="text-left">
                                {translations.ingredientQuantity[language as Language]}
                            </Label>
                            <Input
                                id="ingredientQuantity"
                                type="number"
                                step="0.001"
                                min="0"
                                value={formData.ingredientQuantity}
                                onChange={(e) => handleInputChangeLocal('ingredientQuantity', e.target.value)}
                                className="col-span-3"
                                placeholder="1.0"
                            />
                        </div>
                        {/* Активность */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="isActive" className="text-left">
                                {translations.isActive[language as Language]}
                            </Label>
                            <div className="col-span-3 flex items-center">
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => onInputChange('isActive', checked)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            {translations.cancel[language as Language]}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? language === 'ru' ? 'Сохранение...' : 'იწერება...'
                                : translations.save[language as Language]
                            }
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};