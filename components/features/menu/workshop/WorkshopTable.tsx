import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Users, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Language } from '@/lib/stores/language-store';

interface WorkshopTableProps {
  workshops: any[];
  isLoading: boolean;
  language: string;
  onEdit: (workshop: any) => void;
  onDelete: (id: string) => void;
  onRefreshData: () => void;
}

const translations = {
  name: {
    ru: 'Название',
    ka: 'სახელი',
  },
  restaurants: {
    ru: 'Рестораны',
    ka: 'რესტორანები',
  },
  users: {
    ru: 'Пользователи',
    ka: 'მომხმარებლები',
  },
  actions: {
    ru: 'Действия',
    ka: 'მოქმედებები',
  },
  noWorkshops: {
    ru: 'Цехи не найдены',
    ka: 'სახელოსნოები ვერ მოიძებნა',
  },
  loading: {
    ru: 'Загрузка...',
    ka: 'იტვირთება...',
  },
  edit: {
    ru: 'Редактировать',
    ka: 'რედაქტირება',
  },
  delete: {
    ru: 'Удалить',
    ka: 'წაშლა',
  },
  manageUsers: {
    ru: 'Управление пользователями',
    ka: 'მომხმარებლების მართვა',
  },
  manageRestaurants: {
    ru: 'Управление ресторанами',
    ka: 'რესტორანების მართვა',
  },
  restaurantsCount: {
    ru: 'ресторанов',
    ka: 'რესტორანი',
  },
  usersCount: {
    ru: 'пользователей',
    ka: 'მომხმარებელი',
  }
};

const WorkshopRow = ({ 
  workshop, 
  language, 
  onEdit, 
  onDelete,
  onRefreshData 
}: {
  workshop: any;
  language: string;
  onEdit: (workshop: any) => void;
  onDelete: (id: string) => void;
  onRefreshData: () => void;
}) => {
  const restaurantsCount = workshop.restaurantIds?.length || 0;
  const usersCount = workshop.userIds?.length || 0;

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {workshop.name}
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center">
            {restaurantsCount} 
          </Badge>
        </div>
      </TableCell>
      
      <TableCell className="w-[300px]">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(workshop)}
            title={translations.edit[language as Language]}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(workshop.id)}
            title={translations.delete[language as Language]}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export const WorkshopTable = ({
  workshops,
  isLoading,
  language,
  onEdit,
  onDelete,
  onRefreshData
}: WorkshopTableProps) => {
  return (
    <div className="rounded-md border">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">{translations.name[language as Language]}</TableHead>
            <TableHead className="w-1/4">{translations.restaurants[language as Language]}</TableHead>
            <TableHead className="w-[300px] text-right">{translations.actions[language as Language]}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                {translations.loading[language as Language]}
              </TableCell>
            </TableRow>
          ) : workshops.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                {translations.noWorkshops[language as Language]}
              </TableCell>
            </TableRow>
          ) : (
            workshops.map((workshop) => (
              <WorkshopRow
                key={workshop.id}
                workshop={workshop}
                language={language}
                onEdit={onEdit}
                onDelete={onDelete}
                onRefreshData={onRefreshData}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};