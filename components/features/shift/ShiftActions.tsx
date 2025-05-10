'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ShiftService } from '@/lib/api/shift.service';
import { toast } from 'sonner';

interface ShiftActionsProps {
  shiftId: string;
  currentStatus: 'PLANNED' | 'STARTED' | 'COMPLETED';
}

export function ShiftActions({ shiftId, currentStatus }: ShiftActionsProps) {
  const router = useRouter();

  const handleStatusChange = async (newStatus: 'STARTED' | 'COMPLETED') => {
    try {
      await ShiftService.updateShiftStatus(shiftId, { status: newStatus });
      toast.success(
        newStatus === 'STARTED' 
          ? 'Смена успешно начата' 
          : 'Смена успешно завершена'
      );
    } catch (error) {
      toast.error(
        newStatus === 'STARTED' 
          ? 'Ошибка при начале смены' 
          : 'Ошибка при завершении смены'
      );
    }
    router.push(`/shifts/${shiftId}`);
  };

  return (
    <div className="flex gap-2 justify-end">
      {currentStatus === 'PLANNED' && (
        <Button 
          className="w-32" 
          variant="default"
          size="sm"
          onClick={() => handleStatusChange('STARTED')}
        >
          Начать
        </Button>
      )}
      
      {currentStatus === 'STARTED' && (
        <Button 
          className="w-32"
          variant="destructive"
          size="sm"
          onClick={() => handleStatusChange('COMPLETED')}
        >
          Завершить
        </Button>
      )}

      <Button  
        className="w-32"
        variant="outline"
        size="sm"
        onClick={() => router.push(`/shifts/${shiftId}`)}
      >
        Детали
      </Button>
    </div>
  );
}