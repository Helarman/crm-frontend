import { useState, useEffect } from 'react';
import { DictionariesService } from '@/lib/api/dictionaries.service';

export const useDictionaries = () => {
  const [writeOffReasons, setWriteOffReasons] = useState<string[]>([]);
  const [receiptReasons, setReceiptReasons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDictionaries = async () => {
    try {
      setLoading(true);
      const [writeOffData, receiptData] = await Promise.all([
        DictionariesService.writeOffReasons.getAll(),
        DictionariesService.receiptReasons.getAll()
      ]);

      // Получаем только названия активных причин
      setWriteOffReasons(writeOffData
        .filter(item => item.isActive)
        .map(item => item.name)
      );
      
      setReceiptReasons(receiptData
        .filter(item => item.isActive)
        .map(item => item.name)
      );
    } catch (err) {
      console.error('Failed to load dictionaries:', err);
      setError('Failed to load dictionaries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDictionaries();
  }, []);

  return {
    writeOffReasons,
    receiptReasons,
    loading,
    error,
    refetch: loadDictionaries
  };
};