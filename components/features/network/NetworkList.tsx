'use client'

import { useNetworks } from '@/lib/hooks/useNetworks';
import { NetworkService } from '@/lib/api/network.service';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CreateNetworkForm } from './CreateNetworkForm'
import Link from 'next/link';
import { useLanguageStore } from "@/lib/stores/language-store";
import { Users, Globe, MapPin, Settings, Store, MessageSquareText, User } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { TenantService } from '@/lib/api/tenant.service';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from '@/lib/hooks/useAuth';

interface Network {
  id: string;
  name: string;
  primaryColor?: string;
  description?: string;
  restaurants?: { id: string }[];
}

export function NetworkList() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false);
  const { language } = useLanguageStore();
  const { user } = useAuth()

  const translations = {
    ru: {
      networks: "Сети ресторанов",
      addNetwork: "Добавить сеть",
      description: "Описание",
      restaurantsCount: "Количество ресторанов",
      manage: "Управление",
      noDescription: "Нет описания",
      owner: "Владелец"
    },
    ka: {
      networks: "რესტორნების ქსელი",
      addNetwork: "ქსელის დამატება",
      description: "აღწერა",
      restaurantsCount: "რესტორნების რაოდენობა",
      manage: "მართვა",
      noDescription: "აღწერა არ არის",
      owner: "Владелец"
    }
  } as const;

  const t = translations[language];

  const handleCreate = async (values: any) => {
    try {
      await NetworkService.create(values);
      mutate();
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create network', err);
    }
  };

  const { networks = [], error, isLoading, mutate } = useNetworks();

  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{t.networks}</h2>
          <Button onClick={() => setIsCreating(true)}>
            {t.addNetwork}
          </Button>
        </div>
        <div className="text-red-500">Error loading networks: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t.networks}</h2>
        <Button onClick={() => setIsCreating(true)}>
          {t.addNetwork}
        </Button>
      </div>

      {isCreating && (
        <div className="border p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">{t.addNetwork}</h3>
          <CreateNetworkForm 
            onSubmit={handleCreate} 
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {networks.map((network) => (
          <Card 
            key={network.id} 
            className={cn(
              "hover:shadow-lg transition-shadow group overflow-hidden",
              network.primaryColor && `border-t-4`
            )}
            style={{
              borderTopColor: network.primaryColor || undefined
            }}
          >
            <CardHeader className="relative">
              <div className="flex justify-between items-start">
                <CardTitle 
                  className="text-lg font-semibold tracking-tight line-clamp-2"
                  style={{
                    color: network.primaryColor || undefined
                  }}
                >
                  {network.name}
                </CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div 
                  className="p-2 rounded-full"
                  style={{
                    backgroundColor: network.primaryColor ? `${network.primaryColor}20` : undefined
                  }}
                >
                  <MessageSquareText 
                    className="w-4 h-4" 
                    style={{
                      color: network.primaryColor || undefined
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                  <p className="text-sm font-medium">
                    {network.description || t.noDescription}
                  </p>
                </div>
              </div>
                  
                <div className="flex items-center gap-2">
                <div 
                  className="p-2 rounded-full"
                  style={{
                    backgroundColor: network.primaryColor ? `${network.primaryColor}20` : undefined
                  }}
                >
                  <User 
                    className="w-4 h-4" 
                    style={{
                      color: network.primaryColor || undefined
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.owner}</p>
                  <p className="text-sm font-medium">
                    {network.owner.name || undefined}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div 
                  className="p-2 rounded-full"
                  style={{
                    backgroundColor: network.primaryColor ? `${network.primaryColor}20` : undefined
                  }}
                >
                  <Store 
                    className="w-4 h-4" 
                    style={{
                      color: network.primaryColor || undefined
                    }}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.restaurantsCount}</p>
                  <p className="text-sm font-medium">
                    {network.restaurants?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
        
            <CardFooter className="flex justify-end items-center pt-0">
              <div className="flex gap-2">
                <Button 
                  asChild
                  variant="outline" 
                  size="sm"
                  className={cn(
                    "group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors",
                    network.primaryColor && "group-hover:border-primary/30"
                  )}
                  style={{
                    borderColor: network.primaryColor ? `${network.primaryColor}30` : undefined,
                    color: network.primaryColor || undefined,
                    backgroundColor: network.primaryColor ? `${network.primaryColor}10` : undefined
                  }}
                >
                  <Link href={`/networks/${network.id}`}>{t.manage}</Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}