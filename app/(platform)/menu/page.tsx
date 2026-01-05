'use client'

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLanguageStore } from '@/lib/stores/language-store';
import { CategoryList } from "@/components/features/menu/category/CategoryList";
import { AdditiveList } from "@/components/features/menu/additive/AdditiveList";
import { ProductList } from "@/components/features/menu/product/ProductList";
import { OrderAdditiveList } from "@/components/features/menu/order-additive/OrderAdditiveList"; // НОВЫЙ ИМПОРТ
import { AccessCheck } from '@/components/AccessCheck';
import { WorkshopList } from '@/components/features/menu/workshop/WorkshopList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Utensils, 
  PlusCircle, 
  ListTree, 
  Factory, 
  Square,
  Tag 
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

const MenuPage = () => {
  const { language } = useLanguageStore();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const defaultTab = user.role === 'COOK' ? 'menu' : 'menu';
  const activeTab = tabParam || defaultTab;

  // Обработчик изменения таба
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Переводы
  const translations = {
    menu: {
      title: {
        ru: 'Меню',
        ka: 'მენიუ',
      },
    },
    additives: {
      title: {
        ru: 'Модификаторы товаров',
        ka: 'პროდუქტების მოდიფიკატორები',
      },
    },
    orderAdditives: { // НОВЫЙ ПЕРЕВОД
      title: {
        ru: 'Модификаторы заказов',
        ka: 'შეკვეთის მოდიფიკატორები',
      },
    },
    categories: {
      title: {
        ru: 'Категории',
        ka: 'კატეგორიები',
      },
    },
    workshops: {
      title: {
        ru: 'Цехи',
        ka: 'სახელოსნოები',
      },
    },
    pageTitle: {
      ru: 'Управление меню',
      ka: 'მენიუს მართვა',
    }
  };

  return (
    <AccessCheck allowedRoles={['MANAGER', 'SUPERVISOR', 'COOK', 'SHEF']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">
          {translations.pageTitle[language]}
        </h1>
        
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {user.role === 'COOK' ? (
            <TabsList className="w-full">
              <TabsTrigger value="menu" className="flex-1">
                <div className="flex items-center gap-2 justify-center">
                  <Utensils className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{translations.menu.title[language]}</span>
                </div>
              </TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="w-full gap-2 sm:flex-row sm:grid sm:grid-cols-5"> {/* Изменено на 5 колонок */}
              <TabsTrigger value="menu" className="flex-1">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Utensils className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{translations.menu.title[language]}</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="additives" className="flex-1">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <PlusCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{translations.additives.title[language]}</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="order-additives" className="flex-1"> {/* НОВАЯ ВКЛАДКА */}
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Tag className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{translations.orderAdditives.title[language]}</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex-1">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <ListTree className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{translations.categories.title[language]}</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="workshops" className="flex-1">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Square className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{translations.workshops.title[language]}</span>
                </div>
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="menu">
            <Card>
              <ProductList />
            </Card>
          </TabsContent>

          <TabsContent value="additives">
            <Card>
              <AdditiveList />
            </Card>
          </TabsContent>

          <TabsContent value="order-additives"> 
            <Card>
              <OrderAdditiveList />
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CategoryList />
            </Card>
          </TabsContent>

          <TabsContent value="workshops">
            <Card>
              <WorkshopList />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AccessCheck>
  );
};

export default MenuPage;