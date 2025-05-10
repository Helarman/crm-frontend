'use client';

import { cn } from '@/lib/utils';

type ShiftStatus = 'PLANNED' | 'STARTED' | 'COMPLETED';

interface ShiftStatusBadgeProps {
  status: ShiftStatus;
  className?: string;
}

export function ShiftStatusBadge({ status, className }: ShiftStatusBadgeProps) {
  const statusConfig = {
    PLANNED: {
      text: 'Запланирована',
      class: 'bg-blue-100 text-blue-800',
    },
    STARTED: {
      text: 'Начата',
      class: 'bg-green-100 text-green-800',
    },
    COMPLETED: {
      text: 'Завершена',
      class: 'bg-gray-100 text-gray-800',
    },
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusConfig[status].class,
        className
      )}
    >
      {statusConfig[status].text}
    </span>
  );
}