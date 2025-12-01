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
  Factory, 
  Square
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

const MenuPage = () => {
  const { language } = useLanguageStore();
  const { user } = useAuth()
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
        ru: 'Модификаторы',
        ka: 'მოდიფიკატორები',
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
        <Tabs defaultValue="menu">
        { user.role === 'COOK' ? '' :
        ( <TabsList className="w-full gap-2 sm:flex-row sm:grid sm:grid-cols-4">
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
          </TabsList>)
        }

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