import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '@/components/ui/table';
  import { Button } from '@/components/ui/button';
  import { Pencil, Trash2 } from 'lucide-react';
  import { Badge } from '@/components/ui/badge';
import { Additive } from '@/lib/api/additive.service';
import { Language } from '@/lib/stores/language-store';
  
  interface AdditiveTableProps {
    additives: Additive[];
    isLoading: boolean;
    language: string;
    onEdit: (additive: Additive) => void;
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
    actions: {
      ru: 'Действия',
      ka: 'მოქმედებები',
    },
    noAdditives: {
      ru: 'Модификаторы не найдены',
      ka: 'მოდიფიკატორები ვერ მოიძებნა',
    },
    loading: {
      ru: 'Загрузка...',
      ka: 'იტვირთება...',
    }
  };
  
  export const AdditiveTable = ({
    additives,
    isLoading,
    language,
    onEdit,
    onDelete,
  }: AdditiveTableProps) => {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{translations.title[language as Language]}</TableHead>
              <TableHead>{translations.price[language as Language]}</TableHead>
              <TableHead className="text-right">{translations.actions[language as Language]}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  {translations.loading[language as Language]}
                </TableCell>
              </TableRow>
            ) : additives.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  {translations.noAdditives[language as Language]}
                </TableCell>
              </TableRow>
            ) : (
              additives.map((additive) => (
                <TableRow key={`additive-${additive.id}`}>
                  <TableCell className="font-medium">{additive.title}</TableCell>
                  
                  <TableCell>
                    <Badge variant="secondary">
                      {additive.price} ₽
                    </Badge>
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