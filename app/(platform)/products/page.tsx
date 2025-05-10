'use client'

import { useState } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { CategoryList } from "@/components/features/menu/category/CategoryList";
import { AdditiveList } from "@/components/features/menu/additive/AdditiveList";
import { ProductList } from "@/components/features/menu/product/ProductList";
import { AccessCheck } from '@/components/AccessCheck';

const MenuPage = () => {
  const { language } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<'menu' | 'additives' | 'categories'>('menu');

  // Переводы
  const translations = {
    menu: {
      title: {
        ru: 'Меню',
        ka: 'მენიუ',
      },
      content: {
        ru: 'Содержимое меню',
        ka: 'მენიუს შიგთავსი',
      },
    },
    additives: {
      title: {
        ru: 'Добавки',
        ka: 'დანამატები',
      },
      content: {
        ru: 'Содержимое добавок',
        ka: 'დანამატების შიგთავსი',
      },
    },
    categories: {
      title: {
        ru: 'Категории',
        ka: 'კატეგორიები',
      },
      content: {
        ru: 'Содержимое категорий',
        ka: 'კატეგორიების შიგთავსი',
      },
    },
  };

  return (
    <AccessCheck allowedRoles={['MANAGER', 'SUPERVISOR']}>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">
          {language === 'ru' ? 'Управление меню' : 'მართვა'}
        </h1>

        <div className="flex border-b mb-4">
          <button
            className={`py-2 px-4 ${activeTab === 'menu' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            {translations.menu.title[language]}
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'additives' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('additives')}
          >
            {translations.additives.title[language]}
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'categories' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            {translations.categories.title[language]}
          </button>
        </div>

        <div className="py-4">
          {activeTab === 'menu' && (
            <div>
              <ProductList />
            </div>
          )}
          {activeTab === 'additives' && (
            <div>
              <AdditiveList />
            </div>
          )}
          {activeTab === 'categories' && (
            <div>
              <CategoryList />
            </div>
          )}
        </div>
      </div>
    </AccessCheck>
  );
};

export default MenuPage;