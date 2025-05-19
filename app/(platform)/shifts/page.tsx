'use client';

import { ShiftsTable } from '@/components/features/shift/ShiftsTable';
import { ShiftsFilters } from '@/components/features/shift/ShiftsFilters';
import { CreateShiftButton } from '@/components/features/shift/CreateShiftButton';
import { useShifts } from '@/lib/hooks/useShifts';
import { useState } from 'react';
import { AccessCheck } from '@/components/AccessCheck';

export default function ShiftsPage() {
  const [filters, setFilters] = useState({});
  const { data, error, isLoading } = useShifts(filters);

  return (
    <AccessCheck allowedRoles={['MANAGER', 'SUPERVISOR']}>
      <div >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Управление сменами</h1>
          <CreateShiftButton />
        </div>
        <ShiftsFilters onFilterChange={setFilters} />
        <ShiftsTable
          shifts={data?.data || []}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </AccessCheck>
  );
}