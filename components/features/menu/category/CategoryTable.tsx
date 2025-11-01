// CategoryTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Language } from '@/lib/stores/language-store';
import { useState } from 'react';

interface CategoryTableProps {
  categories: any[];
  isLoading: boolean;
  language: string;
  onEdit: (category: any) => void;
  onDelete: (id: string) => void;
  onAddSubcategory: (parentId: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onMoveUpOnClient: (id: string) => void;
  onMoveDownOnClient: (id: string) => void;
  viewMode: 'tree' | 'flat';
}

const translations = {
  title: {
    ru: 'Название',
    ka: 'სათაური',
  },
  order: {
    ru: 'Порядок',
    ka: 'რიგი',
  },
  adminOrder: {
    ru: 'Панель',
    ka: 'რიგი (ადმინი)',
  },
  clientOrder: {
    ru: 'Клиент',
    ka: 'რიგი (საიტი)',
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
  addSubcategory: {
    ru: 'Добавить подкатегорию',
    ka: 'ქვეკატეგორიის დამატება',
  },
  moveUp: {
    ru: 'Поднять',
    ka: 'აწევა',
  },
  moveDown: {
    ru: 'Опустить',
    ka: 'ჩამოწევა',
  }
};

const CategoryRow = ({ 
  category, 
  depth = 0, 
  language, 
  onEdit, 
  onDelete, 
  onAddSubcategory,
  onMoveUp,
  onMoveDown,
  onMoveUpOnClient,
  onMoveDownOnClient,
  isFirst = false,
  isLast = false,
  isClientFirst = false,
  isClientLast = false
}: {
  category: any;
  depth?: number;
  language: string;
  onEdit: (category: any) => void;
  onDelete: (id: string) => void;
  onAddSubcategory: (parentId: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onMoveUpOnClient: (id: string) => void;
  onMoveDownOnClient: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
  isClientFirst?: boolean;
  isClientLast?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <>
      <TableRow>
        <TableCell className="font-medium flex items-center" style={{ paddingLeft: `${depth * 20 + 12}px` }}>
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-8 p-0 -ml-2 mr-1"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle</span>
            </Button>
          ) : (
            <span className="inline-block w-8" />
          )}
          {category.title}
          <div className="flex gap-1 ml-2">
            <Badge variant="outline" title="Панель">
              A: {category.order || 0}
            </Badge>
            <Badge variant="outline" title="Клиент">
              C: {category.clientOrder || 0}
            </Badge>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveUp(category.id)}
              disabled={isFirst}
              title={translations.moveUp[language as Language]}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveDown(category.id)}
              disabled={isLast}
              title={translations.moveDown[language as Language]}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveUpOnClient(category.id)}
              disabled={isClientFirst}
              title={translations.moveUp[language as Language]}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveDownOnClient(category.id)}
              disabled={isClientLast}
              title={translations.moveDown[language as Language]}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
        <TableCell className="w-[200px]">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddSubcategory(category.id)}
              title={translations.addSubcategory[language as Language]}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(category)}
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
          </div>
        </TableCell>
      </TableRow>

      {hasChildren && isOpen && category.children.map((child: any, index: number, array: any[]) => {
        const sortedByClient = [...array].sort((a, b) => (a.clientOrder || 0) - (b.clientOrder || 0));
        const clientIndex = sortedByClient.findIndex(c => c.id === child.id);
        
        return (
          <CategoryRow
            key={child.id}
            category={child}
            depth={depth + 1}
            language={language}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddSubcategory={onAddSubcategory}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onMoveUpOnClient={onMoveUpOnClient}
            onMoveDownOnClient={onMoveDownOnClient}
            isFirst={index === 0}
            isLast={index === array.length - 1}
            isClientFirst={clientIndex === 0}
            isClientLast={clientIndex === sortedByClient.length - 1}
          />
        );
      })}
    </>
  );
};

export const CategoryTable = ({
  categories,
  isLoading,
  language,
  onEdit,
  onDelete,
  onAddSubcategory,
  onMoveUp,
  onMoveDown,
  onMoveUpOnClient,
  onMoveDownOnClient,
  viewMode,
}: CategoryTableProps) => {
  return (
    <div className="rounded-md border">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-full">{translations.title[language as Language]}</TableHead>
            <TableHead>{translations.adminOrder[language as Language]}</TableHead>
            <TableHead>{translations.clientOrder[language as Language]}</TableHead>
            <TableHead className="w-[200px] text-right">{translations.actions[language as Language]}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                {translations.loading[language as Language]}
              </TableCell>
            </TableRow>
          ) : categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                {translations.noCategories[language as Language]}
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category, index, array) => {
              const sortedByClient = [...array].sort((a, b) => (a.clientOrder || 0) - (b.clientOrder || 0));
              const clientIndex = sortedByClient.findIndex(c => c.id === category.id);
              
              return (
                <CategoryRow
                  key={category.id}
                  category={category}
                  language={language}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddSubcategory={onAddSubcategory}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  onMoveUpOnClient={onMoveUpOnClient}
                  onMoveDownOnClient={onMoveDownOnClient}
                  isFirst={index === 0}
                  isLast={index === array.length - 1}
                  isClientFirst={clientIndex === 0}
                  isClientLast={clientIndex === sortedByClient.length - 1}
                />
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};