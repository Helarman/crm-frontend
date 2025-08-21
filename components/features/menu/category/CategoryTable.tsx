import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Language } from '@/lib/stores/language-store';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface CategoryTableProps {
  categories: any[];
  isLoading: boolean;
  language: string;
  onEdit: (category: any) => void;
  onDelete: (id: string) => void;
  onAddSubcategory: (parentId: string) => void;
  viewMode: 'tree' | 'flat';
}

const translations = {
  title: {
    ru: 'Название',
    ka: 'სათაური',
  },
  slug: {
    ru: 'URL',
    ka: 'URL',
  },
  parent: {
    ru: 'Родитель',
    ka: 'მშობელი',
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
  }
};

const CategoryRow = ({ 
  category, 
  depth = 0, 
  language, 
  onEdit, 
  onDelete, 
  onAddSubcategory 
}: {
  category: any;
  depth?: number;
  language: string;
  onEdit: (category: any) => void;
  onDelete: (id: string) => void;
  onAddSubcategory: (parentId: string) => void;
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
        </TableCell>
        <TableCell className="w-[150px]">
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

      {hasChildren && isOpen && category.children.map((child: any) => (
        <CategoryRow
          key={child.id}
          category={child}
          depth={depth + 1}
          language={language}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubcategory={onAddSubcategory}
        />
      ))}
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
  viewMode,
}: CategoryTableProps) => {
  return (
    <div className="rounded-md border">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-full">{translations.title[language as Language]}</TableHead>
            <TableHead className="w-[150px] text-right">{translations.actions[language as Language]}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={2} className="h-24 text-center">
                {translations.loading[language as Language]}
              </TableCell>
            </TableRow>
          ) : categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="h-24 text-center">
                {translations.noCategories[language as Language]}
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                language={language}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddSubcategory={onAddSubcategory}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};