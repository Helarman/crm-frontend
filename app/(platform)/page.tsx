'use client'


import { AccessCheck } from "@/components/AccessCheck";
import { useAuth } from "@/lib/hooks/useAuth"
import { useLanguageStore } from "@/lib/stores/language-store";

export default function HomePage() {

  const { user } = useAuth();
  const { language } = useLanguageStore();

  const translations = {
    ru: {
      hello: "Добро пожаловать"
    },
    ka: {
      hello: "მოგესალმებით"
    }
  } as const;

  const t = translations[language];

  return (
    <AccessCheck allowedRoles={['NONE', 'STOREMAN', 'COURIER', 'COOK', 'CHEF', 'WAITER', 'CASHIER', 'MANAGER', 'SUPERVISOR']}>
      <div className="p-4 ">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-medium">{t.hello}, <span className="font-bold">{user?.name}</span>!</h1>
        </div>
      </div>
    </AccessCheck>
  );
}