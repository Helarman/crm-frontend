import { useState, useEffect } from 'react';
import { DictionariesService, DictionaryItem, CreateDictionaryDto, UpdateDictionaryDto } from '@/lib/api/dictionaries.service';

export const useDictionaries = (restaurantId?: string) => {
  const [writeOffReasons, setWriteOffReasons] = useState<DictionaryItem[]>([]);
  const [receiptReasons, setReceiptReasons] = useState<DictionaryItem[]>([]);
  const [movementReasons, setMovementReasons] = useState<DictionaryItem[]>([]);
  const [incomeReasons, setIncomeReasons] = useState<DictionaryItem[]>([]);
  const [expenseReasons, setExpenseReasons] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllReasons = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        writeOffData,
        receiptData,
        movementData,
        incomeData,
        expenseData
      ] = await Promise.all([
        DictionariesService.writeOffReasons.getAll(restaurantId),
        DictionariesService.receiptReasons.getAll(restaurantId),
        DictionariesService.movementReasons.getAll(restaurantId),
        DictionariesService.incomeReasons.getAll(restaurantId),
        DictionariesService.expenseReasons.getAll(restaurantId),
      ]);

      setWriteOffReasons(writeOffData);
      setReceiptReasons(receiptData);
      setMovementReasons(movementData);
      setIncomeReasons(incomeData);
      setExpenseReasons(expenseData);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки справочников');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllReasons();
  }, [restaurantId]);

  const refresh = () => {
    loadAllReasons();
  };

  return {
    writeOffReasons,
    receiptReasons,
    movementReasons,
    incomeReasons,
    expenseReasons,
    loading,
    error,
    refresh,
  };
};

export const useDictionaryCRUD = (type: keyof typeof DictionariesService) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createItem = async (dto: CreateDictionaryDto) => {
    setLoading(true);
    setError(null);
    try {
      const service = DictionariesService[type] as any;
      const result = await service.create(dto);
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || `Ошибка создания записи`);
      setLoading(false);
      throw err;
    }
  };

  const updateItem = async (id: string, dto: UpdateDictionaryDto) => {
    setLoading(true);
    setError(null);
    try {
      const service = DictionariesService[type] as any;
      const result = await service.update(id, dto);
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || `Ошибка обновления записи`);
      setLoading(false);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const service = DictionariesService[type] as any;
      const result = await service.delete(id);
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || `Ошибка удаления записи`);
      setLoading(false);
      throw err;
    }
  };

  return {
    createItem,
    updateItem,
    deleteItem,
    loading,
    error,
  };
};