'use client';

import { ShiftStatusBadge } from './ShiftStatusBadge';
import { format } from 'date-fns';
import { ru, ka } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ShiftActions } from './ShiftActions';
import { useLanguageStore } from '@/lib/stores/language-store';
type ShiftStatus = 'PLANNED' | 'STARTED' | 'COMPLETED'

interface Shift {
  id: string
  status: ShiftStatus
  startTime: string
}

const statusOrder = {
  PLANNED: 1,
  STARTED: 2,
  COMPLETED: 3
};

// Локализация
const translations = {
  ru: {
    restaurant: 'Ресторан',
    status: 'Статус',
    start: 'Начало',
    end: 'Конец',
    staff: 'Персонал',
    orders: 'Заказы',
    noData: 'Нет данных для отображения',
    loadingError: 'Ошибка загрузки смен:'
  },
  ka: {
    restaurant: 'რესტორანი',
    status: 'სტატუსი',
    start: 'დაწყება',
    end: 'დასრულება',
    staff: 'პერსონალი',
    orders: 'შეკვეთები',
    noData: 'მონაცემები არ მოიძებნა',
    loadingError: 'ცვლის ჩატვირთვის შეცდომა:'
  }
};

interface ShiftsTableProps {
  shifts: any[];
  isLoading: boolean;
  error?: Error;
}

export function ShiftsTable({ shifts, isLoading, error }: ShiftsTableProps) {
  const { language } = useLanguageStore();
  const t = translations[language];
  const locale = language === 'ka' ? ka : ru;

  if (error) {
    return <div className="text-red-500">{t.loadingError} {error.message}</div>;
  }

  const sortedShifts = [...shifts].sort((a: Shift, b:Shift) => {
    return statusOrder[a.status] - statusOrder[b.status] || 
           new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.restaurant}</TableHead>
            <TableHead>{t.status}</TableHead>
            <TableHead>{t.start}</TableHead>
            <TableHead>{t.end}</TableHead>
            <TableHead>{t.staff}</TableHead>
            <TableHead>{t.orders}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7}>
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ) : sortedShifts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                {t.noData}
              </TableCell>
            </TableRow>
          ) : (
            sortedShifts.map((shift) => (
              <TableRow key={shift.id}>
                <TableCell>{shift.restaurant?.title || shift.restaurantId}</TableCell>
                <TableCell>
                  <ShiftStatusBadge status={shift.status} />
                </TableCell>
                <TableCell>
                  {format(new Date(shift.startTime), 'PPpp', { locale })}
                </TableCell>
                <TableCell>
                  {shift.endTime
                    ? format(new Date(shift.endTime), 'PPpp', { locale })
                    : '-'}
                </TableCell>
                <TableCell>{shift.users?.length || 0}</TableCell>
                <TableCell>{shift.orders.length}</TableCell>
                <TableCell>
                  <ShiftActions shiftId={shift.id} currentStatus={shift.status} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}