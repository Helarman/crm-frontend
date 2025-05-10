"use client"

import Link from "next/link";
import { usePathname } from 'next/navigation'
import { useAuth } from "@/lib/hooks/useAuth";

const ROLE_COLORS = {
    NONE: 'text-gray-500',
    STOREMAN: 'text-blue-600',
    COURIER: 'text-green-600',
    COOK: 'text-amber-600',
    CHEF: 'text-orange-600',
    WAITER: 'text-emerald-600',
    CASHIER: 'text-purple-600',
    MANAGER: 'text-red-600',
    SUPERVISOR: 'text-indigo-600',
} as const;

export default function Logo() {
    
    const { user } = useAuth();
    const roleColor = ROLE_COLORS[user?.role as keyof typeof ROLE_COLORS] || 'text-gray-500';

    return (
        <div className="h-16 p-4 border-b flex items-center bg-white">
            <h1 className="text-xl font-bold text-primary">
                CRM
                {user?.role && user.role !== 'NONE' && (
                <span className={`uppercase text-xs font-medium ml-1 align-super ${roleColor}`}>
                    {user.role.toLowerCase()}
                </span>
                )}
            </h1>
        </div>
    );
  }

