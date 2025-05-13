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
import { WorkshopResponse, WorkshopDto } from '@/lib/api/workshop.service';
import { Language } from '@/lib/stores/language-store';

interface WorkshopTableProps {
  workshops: WorkshopDto[];
  isLoading: boolean;
  language: string;
  onEdit: (workshop: WorkshopDto) => void;
  onDelete: (id: string) => void;
}

const translations = {
  name: {
    ru: 'Название',
    ka: 'სახელი',
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
  }
};

export const WorkshopTable = ({
  workshops,
  isLoading,
  language,
  onEdit,
  onDelete,
}: WorkshopTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{translations.name[language as Language]}</TableHead>
            <TableHead className="text-right">{translations.actions[language as Language]}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={2} className="h-24 text-center">
                {translations.loading[language as Language]}
              </TableCell>
            </TableRow>
          ) : workshops.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="h-24 text-center">
                {translations.noWorkshops[language as Language]}
              </TableCell>
            </TableRow>
          ) : (
            workshops.map((workshop) => (
              <TableRow key={`workshop-${workshop.id}`}>
                <TableCell className="font-medium">{workshop.name}</TableCell>
                
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(workshop)}
                    className="mr-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(workshop.id as string)}
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