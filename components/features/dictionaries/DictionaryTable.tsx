// src/components/features/dictionaries/DictionaryTable.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2 } from 'lucide-react';
import { DictionaryItem } from '@/lib/api/dictionaries.service';
import { Language } from '@/lib/stores/language-store';

interface DictionaryTableProps {
  items: DictionaryItem[];
  isLoading: boolean;
  language: string;
  onEdit: (item: DictionaryItem) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, isActive: boolean) => void;
  type: 'write-off' | 'receipt' | 'movement';
}

const translations = {
  name: {
    ru: 'Название',
    ka: 'სახელი',
  },
  status: {
    ru: 'Статус',
    ka: 'სტატუსი',
  },
  actions: {
    ru: 'Действия',
    ka: 'მოქმედებები',
  },
  active: {
    ru: 'Активен',
    ka: 'აქტიური',
  },
  inactive: {
    ru: 'Неактивен',
    ka: 'არააქტიური',
  },
  noItems: {
    ru: 'Элементы не найдены',
    ka: 'ელემენტები ვერ მოიძებნა',
  },
  loading: {
    ru: 'Загрузка...',
    ka: 'იტვირთება...',
  }
};

export const DictionaryTable = ({
  items,
  isLoading,
  language,
  onEdit,
  onDelete,
  onToggleStatus,
  type,
}: DictionaryTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{translations.name[language as Language]}</TableHead>
            <TableHead>{translations.status[language as Language]}</TableHead>
            <TableHead className="text-right">{translations.actions[language as Language]}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                {translations.loading[language as Language]}
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                {translations.noItems[language as Language]}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={`${type}-${item.id}`}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                 <Switch
                      checked={item.isActive}
                      onCheckedChange={(checked) => onToggleStatus(item.id, checked)}
                    />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(item)}
                    className="mr-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(item.id)}
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