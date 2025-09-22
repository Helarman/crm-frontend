'use client'

import { useState } from 'react';
import { useLanguageStore } from '@/lib/stores/language-store';
import { AccessCheck } from '@/components/AccessCheck';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { 
  FileText, 
  Package, 
  Truck,
  Archive
} from 'lucide-react';
import { WriteOffReasonList } from '@/components/features/dictionaries/WriteOffReasonList';
import { ReceiptReasonList } from '@/components/features/dictionaries/ReceiptReasonList';
import { MovementReasonList } from '@/components/features/dictionaries/MovementReasonList';

const DictionariesPage = () => {
  const { language } = useLanguageStore();

  const translations = {
    pageTitle: {
      ru: 'Справочники склада',
      ka: 'საწყობის დირექტორიები',
    },
    writeOffReasons: {
      title: {
        ru: 'Причины списания',
        ka: 'ჩამოწერის მიზეზები',
      },
    },
    receiptReasons: {
      title: {
        ru: 'Причины приходов',
        ka: 'მიღების მიზეზები',
      },
    },
    movementReasons: {
      title: {
        ru: 'Причины перемещений',
        ka: 'გადაადგილების მიზეზები',
      },
    },
  };

  return (
    <AccessCheck allowedRoles={['MANAGER', 'SUPERVISOR']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">
          {translations.pageTitle[language]}
        </h1>

        <Tabs defaultValue="write-off">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="write-off">
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                {translations.writeOffReasons.title[language]}
              </div>
            </TabsTrigger>
            <TabsTrigger value="receipt">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                {translations.receiptReasons.title[language]}
              </div>
            </TabsTrigger>
            <TabsTrigger value="movement">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                {translations.movementReasons.title[language]}
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="write-off">
            <Card>
              <WriteOffReasonList />
            </Card>
          </TabsContent>

          <TabsContent value="receipt">
            <Card>
              <ReceiptReasonList />
            </Card>
          </TabsContent>

          <TabsContent value="movement">
            <Card>
              <MovementReasonList />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AccessCheck>
  );
};

export default DictionariesPage;