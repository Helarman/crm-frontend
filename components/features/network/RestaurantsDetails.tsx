'use client'

import { Button } from '@/components/ui/button';
import { MapPin, Globe, Clock, Phone } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import Image from 'next/image';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/lib/stores/language-store";

interface Restaurant {
  id: string;
  title: string;
  description: string;
  address: string;
  images: string[];
  latitude: string;
  longitude: string;
  phone?: string;
  openingHours?: string;
  network: any;
}

interface RestaurantsDetailsProps {
  restaurants: Restaurant[];
  color: string;
}

export function RestaurantsDetails({ restaurants, color }: RestaurantsDetailsProps) {
  const { language } = useLanguageStore();

  const translations = {
    ru: {
      noRestaurants: "Нет доступных ресторанов",
      viewOnMap: "Посмотреть на карте",
      visitWebsite: "Перейти на сайт",
      openingHours: "Часы работы",
      address: "Адрес",
      phone: "Телефон",
      edit: "Редактировать"
    },
    ka: {
      noRestaurants: "რესტორნები არ არის ხელმისაწვდომი",
      viewOnMap: "იხილეთ რუკაზე",
      visitWebsite: "ვებგვერდზე გადასვლა",
      openingHours: "გახსნის საათები",
      address: "მისამართი",
      phone: "ტელეფონი",
      edit: "რედაქტირება"
    }
  } as const;

  const t = translations[language];

  return (
    <div className="grid gap-4">
      {restaurants?.length > 0 ? (
        <div className="grid gap-4">
          {restaurants.map((restaurant) => (
            <Card 
                key={restaurant.id} 
                className={cn(
                    "hover:shadow-lg transition-shadow group overflow-hidden",
                    color && `border-t-4`
                )}
                style={{
                    borderTopColor: color || undefined
                }}
                >
                <CardHeader className="relative">
                    <CardTitle 
                    className="text-lg font-semibold tracking-tight line-clamp-2"
                    style={{
                        color: color || undefined
                    }}
                    >
                    {restaurant.title}
                    </CardTitle>
                    {restaurant.description && (
                    <CardDescription className="line-clamp-2">
                        {restaurant.description}
                    </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Address Info */}
                    <div className="flex items-center gap-2">
                    <div 
                        className="p-2 rounded-full"
                        style={{
                        backgroundColor: color ? `${color}20` : "bg-muted"
                        }}
                    >
                        <MapPin 
                        className="w-4 h-4" 
                        style={{
                            color: color || undefined
                        }}
                        />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">{t.address}</p>
                        <p className="text-sm font-medium">
                        {restaurant.address}
                        </p>
                    </div>
                    </div>

                    {/* Phone Info */}
                    {restaurant.phone && (
                    <div className="flex items-center gap-2">
                        <div 
                        className="p-2 rounded-full"
                        style={{
                            backgroundColor: color ? `${color}20` : "bg-muted"
                        }}
                        >
                        <Phone 
                            className="w-4 h-4" 
                            style={{
                            color: color || undefined
                            }}
                        />
                        </div>
                        <div>
                        <p className="text-xs text-muted-foreground">{t.phone}</p>
                        <a 
                            href={`tel:${restaurant.phone}`} 
                            className="text-sm font-medium hover:text-primary transition-colors"
                        >
                            {restaurant.phone}
                        </a>
                        </div>
                    </div>
                    )}
                </CardContent>

                <CardFooter className="flex justify-end items-center pt-0">
                    <div className="flex gap-2">
                    <Button 
                        asChild
                        variant="outline" 
                        size="sm"
                        className={cn(
                        "group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors",
                        color && "group-hover:border-primary/30"
                        )}
                        style={{
                        borderColor: color ? `${color}30` : undefined,
                        color: color || undefined,
                        backgroundColor: color ? `${color}10` : undefined
                        }}
                    >
                        <Link href={`/restaurants/${restaurant.id}`}>{t.edit}</Link>
                    </Button>
                    </div>
                </CardFooter>
                </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t.noRestaurants}</p>
        </div>
      )}
    </div>
  );
}