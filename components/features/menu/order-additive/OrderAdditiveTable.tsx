import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OrderAdditiveWithRelations } from '@/lib/api/order-additive.service';
import { Language } from '@/lib/stores/language-store';

interface OrderAdditiveTableProps {
  additives: OrderAdditiveWithRelations[];
  isLoading: boolean;
  language: string;
  onEdit: (additive: OrderAdditiveWithRelations) => void;
  onDelete: (id: string) => void;
}

const translations = {
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
  status: {
    ru: 'Статус',
    ka: 'სტატუსი',
  },
  actions: {
    ru: 'Действия',
    ka: 'მოქმედებები',
  },
  noAdditives: {
    ru: 'Модификаторы заказов не найдены',
    ka: 'შეკვეთის მოდიფიკატორები ვერ მოიძებნა',
  },
  loading: {
    ru: 'Загрузка...',
    ka: 'იტვირთება...',
  },
  fixed: {
    ru: 'Фиксированная',
    ka: 'ფიქსირებული',
  },
  perPerson: {
    ru: 'За человека',
    ka: 'კაცზე',
  },
  active: {
    ru: 'Активен',
    ka: 'აქტიური',
  },
  inactive: {
    ru: 'Неактивен',
    ka: 'არააქტიური',
  }
};

export const OrderAdditiveTable = ({
  additives,
  isLoading,
  language,
  onEdit,
  onDelete,
}: OrderAdditiveTableProps) => {
  

  const getTypeText = (type: string) => {
    if (type === 'FIXED') return translations.fixed[language as Language];
    if (type === 'PER_PERSON') return translations.perPerson[language as Language];
    return type;
  };

  const getOrderTypeText = (type: string) => {
    const types: Record<string, { ru: string; ka: string }> = {
      DINE_IN: { ru: 'В зале', ka: 'დარბაზში' },
      TAKEAWAY: { ru: 'С собой', ka: 'თან წასაღები' },
      DELIVERY: { ru: 'Доставка', ka: 'მიწოდება' },
      BANQUET: { ru: 'Банкет', ka: 'ბანკეტი' },
    };
    return types[type]?.[language as Language] || type;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{translations.title[language as Language]}</TableHead>
            <TableHead>{translations.price[language as Language]}</TableHead>
            <TableHead>{translations.type[language as Language]}</TableHead>
            <TableHead>{translations.orderTypes[language as Language]}</TableHead>
            <TableHead>{translations.status[language as Language]}</TableHead>
            <TableHead className="text-right">{translations.actions[language as Language]}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                {translations.loading[language as Language]}
              </TableCell>
            </TableRow>
          ) : additives.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                {translations.noAdditives[language as Language]}
              </TableCell>
            </TableRow>
          ) : (
            additives.map((additive) => (
              <TableRow key={`order-additive-${additive.id}`}>
                <TableCell className="font-medium">{additive.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {additive.price} ₽
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getTypeText(additive.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {additive.orderTypes.map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {getOrderTypeText(type)}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {additive.isActive ? (
                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {translations.active[language as Language]}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <XCircle className="h-3 w-3 mr-1" />
                      {translations.inactive[language as Language]}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(additive)}
                    className="mr-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(additive.id as string)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};