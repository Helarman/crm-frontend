'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateShiftDialog } from './CreateShiftDialog';
import { useLanguageStore } from '@/lib/stores/language-store';

interface CreateShiftButtonProps {
  onShiftCreated?: () => void; // Добавляем callback
}

export function CreateShiftButton({ onShiftCreated }: CreateShiftButtonProps) {
  const [open, setOpen] = useState(false);
  const { language } = useLanguageStore();

  const translations = {
    ru: 'Создать смену',
    ka: 'ცვლის შექმნა'
  };

  const handleShiftCreated = () => {
    setOpen(false);
    onShiftCreated?.(); 
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        {translations[language]}
      </Button>
      <CreateShiftDialog 
        open={open} 
        onOpenChange={setOpen}
        onShiftCreated={handleShiftCreated} // Передаем в диалог
      />
    </>
  );
}