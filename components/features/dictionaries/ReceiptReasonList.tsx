// src/components/features/dictionaries/ReceiptReasonList.tsx
'use client'

import { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { DictionariesService, DictionaryItem } from '@/lib/api/dictionaries.service';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DictionaryTable } from './DictionaryTable';
import { DictionaryModal } from './DictionaryModal';

export const ReceiptReasonList = () => {
  const { language } = useLanguageStore();
  const [items, setItems] = useState<DictionaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    isActive: true,
  });

  const translations = {
    addItem: {
      ru: 'Добавить причину',
      ka: 'მიზეზის დამატება',
    },
    title: {
      ru: 'Причины приходов',
      ka: 'მიღების მიზეზები',
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await DictionariesService.receiptReasons.getAll();
      setItems(data);
    } catch (error) {
      console.error('Error fetching receipt reasons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const openAddModal = () => {
    setFormData({ name: '', isActive: true });
    setCurrentItemId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: DictionaryItem) => {
    setCurrentItemId(item.id);
    setFormData({
      name: item.name,
      isActive: item.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (currentItemId) {
        await DictionariesService.receiptReasons.update(currentItemId, formData);
      } else {
        await DictionariesService.receiptReasons.create(formData);
      }
      fetchItems();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving receipt reason:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await DictionariesService.receiptReasons.delete(id);
      fetchItems();
    } catch (error) {
      console.error('Error deleting receipt reason:', error);
    }
  };

  const handleToggleStatus = async (id: number, isActive: boolean) => {
    try {
      await DictionariesService.receiptReasons.update(id, { isActive });
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, isActive } : item
      ));
    } catch (error) {
      console.error('Error toggling receipt reason status:', error);
      fetchItems();
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {translations.title[language]}
        </h2>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          {translations.addItem[language]}
        </Button>
      </div>

      <DictionaryTable
        items={items}
        isLoading={isLoading}
        language={language}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        type="receipt"
      />

      <DictionaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        itemId={currentItemId}
        formData={formData}
        onInputChange={handleInputChange}
        language={language}
        type="receipt"
      />
    </div>
  );
};