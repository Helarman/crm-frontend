'use client'

import { NetworkService } from '@/lib/api/network.service';
import { TenantService } from '@/lib/api/tenant.service';
import { useLanguageStore } from '@/lib/stores/language-store';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building, Network, Users, Utensils } from 'lucide-react';
import { NetworkDetails } from '@/components/features/network/NetworkDetails';
import { toast } from 'sonner';
import { TenantDetails } from '@/components/features/network/TenandDetails';
import { RestaurantsDetails } from '@/components/features/network/RestaurantsDetails';

const translations = {
  en: {
    loading: 'Loading...',
    networkNotFound: 'Network not found',
    networkTab: 'Network',
    tenantsTab: 'Tenants',
    restaurantsTab: 'Restaurants',
    noRestaurants: 'No restaurants available',
  },
  ru: { 
    loading: 'Загрузка...',
    networkNotFound: 'Сеть не найдена',
    networkTab: 'Сеть',
    tenantsTab: 'Тенанты',
    restaurantsTab: 'Рестораны',
    noRestaurants: 'Нет доступных ресторанов',
  },
  ka: { 
    loading: 'იტვირთება...',
    networkNotFound: 'ქსელი არ მოიძებნა',
    networkTab: 'ქსელი',
    tenantsTab: 'იჯარადარებული',
    restaurantsTab: 'რესტორნები',
    noRestaurants: 'რესტორნები არ არის ხელმისაწვდომი',
  }
};

export default function EditNetworkPage() {
  const { language } = useLanguageStore();
  const params = useParams();
  const networkId = params.id as string;

  const [network, setNetwork] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('network');

  const t = translations[language]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [networkData, tenantsData] = await Promise.all([
          NetworkService.getById(networkId),
          TenantService.getAll().catch(() => [])
        ]);
        
        setNetwork(networkData || null);
        setTenants(tenantsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setTenants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [networkId]);

  if (loading) {
    return <div className="p-4">{t.loading}</div>;
  }

  if (!network) {
    return <div className="p-4">{t.networkNotFound}</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{network.name}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="network">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              {t.networkTab}
            </div>
          </TabsTrigger>
          <TabsTrigger value="tenants">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t.tenantsTab}
            </div>
          </TabsTrigger>
          <TabsTrigger value="restaurants">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              {t.restaurantsTab}
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="network">
          <Card>
            <CardContent>
                <NetworkDetails network={network} onSuccess={() => {}}/>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenants">
          <Card>
            <CardContent>
             <TenantDetails network={network} onSuccess={() => {}}/>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restaurants">
          <Card>
            <CardContent>
              <RestaurantsDetails 
                restaurants={network.restaurants || []}
                color={network.primaryColor}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}