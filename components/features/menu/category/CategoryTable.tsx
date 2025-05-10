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
import { Language } from '@/lib/stores/language-store';
  
  interface CategoryTableProps {
    categories: any[];
    isLoading: boolean;
    language: string;
    onEdit: (category: any) => void;
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
    actions: {
      ru: 'Действия',
      ka: 'მოქმედებები',
    },
    noCategories: {
      ru: 'Категории не найдены',
      ka: 'კატეგორიები ვერ მოიძებნა',
    },
    loading: {
      ru: 'Загрузка...',
      ka: 'იტვირთება...',
    },
    noDescription: {
      ru: 'Нет описания',
      ka: 'აღწერა არ არის',
    }
  };
  
  export const CategoryTable = ({
    categories,
    isLoading,
    language,
    onEdit,
    onDelete,
  }: CategoryTableProps) => {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{translations.title[language  as Language]}</TableHead>
              <TableHead>{translations.description[language as Language]}</TableHead>
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
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  {translations.noCategories[language as Language]}
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={`category-${category.id}`}>
                  <TableCell className="font-medium">{category.title}</TableCell>
                  
                  <TableCell>
                    {category.description ? (
                      category.description
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        {translations.noDescription[language as Language]}
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(category)}
                      className="mr-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(category.id)}
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