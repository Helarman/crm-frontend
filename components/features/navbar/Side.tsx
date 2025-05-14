"use client"

import { useState, useEffect } from 'react'
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { useAuth } from "@/lib/hooks/useAuth"
import { authService } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";  
import { useTheme } from "next-themes";
import { useLanguageStore } from "@/lib/stores/language-store";
import { sideTranslations } from "./translations";

import {
  LayoutDashboard,
  ClipboardList,
  Utensils,
  BookOpen,
  Users,
  CalendarClock,
  LineChart,
  Tag,
  TrendingUp,
  Settings,
  LogOut,
  Store,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Moon,
  Sun,
  Languages,
  Truck
} from 'lucide-react'

const ROLE_COLORS = {
  NONE: 'text-gray-500 dark:text-gray-400',
  STOREMAN: 'text-blue-600 dark:text-blue-400',
  COURIER: 'text-green-600 dark:text-green-400',
  COOK: 'text-amber-600 dark:text-amber-400',
  CHEF: 'text-orange-600 dark:text-orange-400',
  WAITER: 'text-emerald-600 dark:text-emerald-400',
  CASHIER: 'text-purple-600 dark:text-purple-400',
  MANAGER: 'text-red-600 dark:text-red-400',
  SUPERVISOR: 'text-indigo-600 dark:text-indigo-400',
} as const

const hasAccess = (role: string | undefined, requiredRoles: string[]) => {
    if (!role) return false
    return requiredRoles.includes(role)
}

function Logo({ collapsed, toggleCollapse }: { collapsed: boolean, toggleCollapse: () => void }) {
  const { user } = useAuth()
  const roleColor = ROLE_COLORS[user?.role as keyof typeof ROLE_COLORS] || 'text-gray-500 dark:text-gray-400'

  return (
    <div className="h-16 border-b flex items-center justify-center  bg-white dark:bg-gray-900 relative">  
      <button 
        onClick={toggleCollapse}
        className={`absolute right-4 w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
          collapsed ? 'left-auto right-auto' : ''
        }`}
      >
        {collapsed ? <Menu className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
      </button>

      <div className={`flex-1 flex justify-start ${collapsed ? 'ml-10' : ''}`}>
        {!collapsed ? (
          <h1 className="text-xl font-bold flex items-start px-4 ext-gray-700 dark:text-gray-300">
            CRM
            {user?.role && user.role !== 'NONE' && (
              <span className={`uppercase text-xs font-medium ml-1 align-super ${roleColor}`}>
                {user.role.toLowerCase()}
              </span>
            )}
          </h1>
        ) : null }
      </div>
    </div>
  )
}

export default function Side() {
    const router = useRouter();
    const { mutate, setUser, user } = useAuth();
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const { theme, setTheme } = useTheme();
    const { language, setLanguage } = useLanguageStore();
    const t = sideTranslations[language];

    const handleLogout = async () => {
      try {
        await authService.logout();
        Cookies.remove('accessToken');
        setUser(null);
        mutate(null);
        router.push('/login');
      } catch (error) {
        console.error('Logout error:', error);
        router.push('/login');
      }
    };

    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768)
        if (window.innerWidth < 768) {
          setCollapsed(true)
        }
      }

      handleResize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])

    const navItems = [
      { 
        name: t.home, 
        href: "/", 
        icon: <LayoutDashboard className="w-7 h-7" />,
        roles: ['NONE', 'STOREMAN', 'COURIER', 'COOK', 'CHEF', 'WAITER', 'CASHIER', 'MANAGER', 'SUPERVISOR']
      },
      { 
        name: t.orders, 
        href: "/orders", 
        icon: <ClipboardList className="w-7 h-7" />,
        roles: ['WAITER', 'CASHIER', 'MANAGER', 'SUPERVISOR']
      },
      { 
        name: t.kitchen, 
        href: "/kitchen", 
        icon: <Utensils className="w-7 h-7" />,
        roles: ['COOK', 'CHEF', 'MANAGER', 'SUPERVISOR']
      },
      { 
        name: t.restaurants, 
        href: "/restaurants", 
        icon: <Store className="w-7 h-7" />,
        roles: ['MANAGER', 'SUPERVISOR']
      },
      { 
        name: t.menu, 
        href: "/products", 
        icon: <BookOpen className="w-7 h-7" />,
        roles: ['MANAGER', 'SUPERVISOR']
      },
      { 
        name: t.dlivery, 
        href: "/delivery", 
        icon: <Truck className="w-7 h-7" />,
        roles: ['MANAGER', 'SUPERVISOR']
      },
      { 
        name: t.staff, 
        href: "/staff", 
        icon: <Users className="w-7 h-7" />,
        roles: ['MANAGER', 'SUPERVISOR']
      },
      { 
        name: t.shifts, 
        href: "/shifts", 
        icon: <CalendarClock className="w-7 h-7" />,
        roles: [/*'STOREMAN', 'COURIER', 'COOK', 'CHEF', 'WAITER', 'CASHIER', */'MANAGER', 'SUPERVISOR']
      },
      { 
        name: t.discounts, 
        href: "/discounts", 
        icon: <Tag className="w-7 h-7" />,
        roles: []
      },
      { 
        name: t.bonuses, 
        href: "/bonuses", 
        icon: <TrendingUp className="w-7 h-7" />,
        roles: []
      },
      { 
        name: t.analytics, 
        href: "/analytics", 
        icon: <LineChart className="w-7 h-7" />,
        roles: []
      },
    ]

    const [activeItems, inactiveItems] = navItems.reduce<
    [typeof navItems, typeof navItems]
  >(
    ([active, inactive], item) => {
      const isAllowed = hasAccess(user?.role, item.roles)
      return isAllowed 
        ? [[...active, item], inactive] 
        : [active, [...inactive, item]]
    },
    [[], []]
  )

    const toggleCollapse = () => {
      setCollapsed(!collapsed)
    }

    return (
      <div className={`bg-white dark:bg-gray-900 border-r flex flex-col h-screen sticky top-0 transition-all duration-300 ${collapsed ? 'w-24' : 'w-80'}`}>
        <Logo collapsed={collapsed} toggleCollapse={toggleCollapse} />
      
        <nav className="flex-1 px-2 py-6 overflow-y-auto text-xl">
          <ul className="space-y-1">
          {activeItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-3 rounded-lg transition-colors mx-1  ${
                      isActive
                        ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <span className={isActive ? 'text-primary dark:text-primary-foreground' : 'text-gray-500 dark:text-gray-400'}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="whitespace-nowrap">
                        {item.name}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}

            {inactiveItems.length > 0 && (
              <li className="border-t border-gray-200 dark:border-gray-700 my-2"></li>
            )}

            {inactiveItems.map((item) => (
              <li key={item.href}>
                <div 
                  className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-3 rounded-lg mx-1 opacity-50 cursor-not-allowed`}
                  title={collapsed ? item.name : `${item.name} (${t.notAvailable})`}
                >
                  <span className="text-gray-400 dark:text-gray-500">
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="whitespace-nowrap">
                      {item.name}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </nav>
      
        {/*<div className="p-2 border-t dark:border-gray-700 space-y-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-3 rounded-lg transition-colors mx-1 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300`}
            title={collapsed ? t.theme : undefined}
          >
            {theme === 'dark' ? <Sun className="w-7 h-7" /> : <Moon className="w-7 h-7" />}
            {!collapsed && <span>{t.theme}</span>}
          </button>

          <button
            onClick={() => setLanguage(language === 'ru' ? 'ka' : 'ru')}
            className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-3 rounded-lg transition-colors mx-1 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300`}
            title={collapsed ? t.language : undefined}
          >
            <Languages className="w-7 h-7" />
            {!collapsed && <span>{t.language}: {language === 'ru' ? 'Рус' : 'ქარ'}</span>}
          </button>
          
          <button 
              onClick={handleLogout}
              className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 w-full px-3 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-red-500 dark:hover:text-red-400 transition-colors mx-1`}
              title={collapsed ? t.logout : undefined}
          >
            <LogOut className="w-7 h-7" />
            {!collapsed && (
              <span className="whitespace-nowrap">
                {t.logout}
              </span>
            )}
          </button>
            
          {!collapsed && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 px-3">{t.version} 0.1.0</p>
          )}
        </div>*/}
      </div>
    )
}