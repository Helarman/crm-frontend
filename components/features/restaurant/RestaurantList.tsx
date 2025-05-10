'use client'

import { useRestaurants } from '@/lib/hooks/useRestaurant';
import { RestaurantService } from '@/lib/api/restaurant.service';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CreateRestaurantForm } from '@/components/features/restaurant/CreateRestaurantForm';
import Link from 'next/link';
import { useAuth } from "@/lib/hooks/useAuth"
import { useLanguageStore } from "@/lib/stores/language-store";
import { Clock, MapPin, Phone, Globe } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {useRouter} from "next/navigation"

interface Restaurant{
  title: string;
  address: string;
  id: string;
}
export function RestaurantList() {
  
  const router = useRouter()

  const [isCreating, setIsCreating] = useState(false);
 
  const handleCreate = async (values: any) => {
    try {
      await RestaurantService.create(values);
      mutate();
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create restaurant', err);
    }
  };

  /*const handleDelete = async (id: string) => {
    try {
      await RestaurantService.delete(id);
      mutate();
    } catch (err) {
      console.error('Failed to delete restaurant', err);
    }
  };*/

 ;
 const { language } = useLanguageStore();

 const { data: restaurants, error, isLoading, mutate } = useRestaurants();
 if (isLoading) return <div>Loading...</div>;
 if (error) return <div>
   Error loading restaurants</div>


  const translations = {
    ru: {
      restaurants: "Рестораны",
      addRestaurans: "Добавить ресторан",
      open: "Открыто",
      closed: "Закрыто",
      edit: "Редактировать",
      openingHours: "Часы работы",
      address: "Адрес",
      phone: "Телефон"
    },
    ka: {
      restaurants: "რესტორნები",
      addRestaurans: "რესტორნის დამატება",
      open: "გახსენით",
      closed: "დახურული",
      edit: "რედაქტირება",
      openingHours: 'გახსნის საათები',
      address: "მისამართი",
      phone: "ტელეფონი"
    }
  } as const;

  const t = translations[language];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t.restaurants}</h2>
        <Button onClick={() => setIsCreating(true)}>
          {t.addRestaurans}
        </Button>
      </div>

      {isCreating && (
        <div className="border p-4 rounded-lg ">
          <h3 className="text-lg font-semibold mb-4">{t.addRestaurans}</h3>
          <CreateRestaurantForm 
            onSubmit={handleCreate} 
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {restaurants?.map((restaurant: Restaurant) => (
           <Card key={restaurant.id} className="hover:shadow-lg transition-shadow group overflow-hidden">
           <CardHeader className="relative">
             <div className="flex justify-between items-start">
               <CardTitle className="text-lg font-semibold tracking-tight line-clamp-2">
                {restaurant.title}
               </CardTitle>
             </div>
           </CardHeader>
           
           <CardContent className="space-y-3">
           <div className="flex items-center gap-2">
               <div className="p-2">
                 <MapPin className="w-4 h-4" />
               </div>
               <div>
                 <p className="text-xs text-muted-foreground">{t.address}</p>
                 <a 
                   className="text-sm font-medium hover:text-primary transition-colors"
                 >
                    {restaurant.address}
                 </a>
               </div>
             </div>
  
             <div className="flex items-center gap-2">
               <div className="p-2">
                 <Phone className="w-4 h-4" />
               </div>
               <div>
                 <p className="text-xs text-muted-foreground">{t.phone}</p>
                 <a 
                   href={`tel:123`} 
                   className="text-sm font-medium hover:text-primary transition-colors"
                 >
                   +7 123 456-78-90
                 </a>
               </div>
             </div>
             
             <div className="pt-1">
               <div className="flex items-center gap-2 mb-1">
                 <div className="p-2">
                   <Clock className="w-4 h-4" />
                 </div>
                 <h4 className="text-sm font-medium">{t.openingHours}</h4>
               </div>
               <div className="ml-10">
               <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                 <div className="flex items-center justify-between">
                   <span className="text-muted-foreground">Пн</span>
                   <span>{"-"}</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-muted-foreground">Вт</span>
                   <span>{"-"}</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-muted-foreground">Ср</span>
                   <span>{"-"}</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-muted-foreground">Чт</span>
                   <span>{"-"}</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-muted-foreground">Пт</span>
                   <span>{"-"}</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-muted-foreground">Сб</span>
                   <span>{"-"}</span>
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <span className="text-muted-foreground">Вс</span>
                   <span>{"-"}</span>
                 </div>
               </div>
             </div>
          
             </div>
           </CardContent>
      
           <CardFooter className="flex justify-end items-center pt-0">
             
             <div className="flex gap-2">
               <Button 
                  asChild
                  variant="outline" 
                  size="sm"
                  className="group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors"
               >
                <Link href={`/restaurants/${restaurant.id}`}>{t.edit}</Link>
               </Button>
             </div>
           </CardFooter>
         </Card>
        ))}
      </div>
      </div>
  );
}