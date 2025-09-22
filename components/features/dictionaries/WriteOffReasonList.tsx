// src/components/features/dictionaries/WriteOffReasonList.tsx
'use client'

import { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { DictionariesService, DictionaryItem } from '@/lib/api/dictionaries.service';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DictionaryTable } from './DictionaryTable';
import { DictionaryModal } from './DictionaryModal';

export const WriteOffReasonList = () => {
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
      ru: 'Причины списания',
      ka: 'ჩამოწერის მიზეზები',
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await DictionariesService.writeOffReasons.getAll();
      setItems(data);
    } catch (error) {
      console.error('Error fetching write-off reasons:', error);
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
        await DictionariesService.writeOffReasons.update(currentItemId, formData);
      } else {
        await DictionariesService.writeOffReasons.create(formData);
      }
      fetchItems();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving write-off reason:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await DictionariesService.writeOffReasons.delete(id);
      fetchItems();
    } catch (error) {
      console.error('Error deleting write-off reason:', error);
    }
  };

  const handleToggleStatus = async (id: number, isActive: boolean) => {
    try {
      await DictionariesService.writeOffReasons.update(id, { isActive });
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, isActive } : item
      ));
    } catch (error) {
      console.error('Error toggling write-off reason status:', error);
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
        type="write-off"
      />

      <DictionaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        itemId={currentItemId}
        formData={formData}
        onInputChange={handleInputChange}
        language={language}
        type="write_off"
      />
    </div>
  );
};