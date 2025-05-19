'use client'

import { useState } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { CategoryList } from "@/components/features/menu/category/CategoryList";
import { AdditiveList } from "@/components/features/menu/additive/AdditiveList";
import { ProductList } from "@/components/features/menu/product/ProductList";
import { AccessCheck } from '@/components/AccessCheck';
import { WorkshopList } from '@/components/features/menu/workshop/WorkshopList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Utensils, 
  PlusCircle, 
  ListTree, 
  Factory 
} from 'lucide-react';

const MenuPage = () => {
  const { language } = useLanguageStore();

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
        ru: 'Добавки',
        ka: 'დანამატები',
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
    <AccessCheck allowedRoles={['MANAGER', 'SUPERVISOR']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">
          {translations.pageTitle[language]}
        </h1>

        <Tabs defaultValue="menu">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="menu">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                {translations.menu.title[language]}
              </div>
            </TabsTrigger>
            <TabsTrigger value="additives">
              <div className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                {translations.additives.title[language]}
              </div>
            </TabsTrigger>
            <TabsTrigger value="categories">
              <div className="flex items-center gap-2">
                <ListTree className="h-4 w-4" />
                {translations.categories.title[language]}
              </div>
            </TabsTrigger>
            <TabsTrigger value="workshops">
              <div className="flex items-center gap-2">
                <Factory className="h-4 w-4" />
                {translations.workshops.title[language]}
              </div>
            </TabsTrigger>
          </TabsList>

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