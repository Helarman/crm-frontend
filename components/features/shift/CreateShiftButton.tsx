'use client';

import { Button } from '@/components/ui/button';
import { CreateShiftDialog } from './CreateShiftDialog'
import { useState } from 'react';

export function CreateShiftButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Создать смену</Button>
      <CreateShiftDialog open={open} onOpenChange={setOpen} />
    </>
  );
}