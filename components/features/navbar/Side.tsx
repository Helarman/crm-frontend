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
  Truck,
  Package,
  PersonStanding,
  Hexagon,
  Network,
  BookText,
  ClockFading,
  CircleCheck
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

function Logo({ collapsed, toggleCollapse }: { collapsed: boolean; toggleCollapse: () => void }) {
  const { user } = useAuth()
  const roleColor = ROLE_COLORS[user?.role as keyof typeof ROLE_COLORS] || 'text-gray-500 dark:text-gray-400'

  return (
    <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 px-4 relative">
      {/* Логотип и название */}
      <div className={`flex items-center gap-3 transition-all duration-300 ${collapsed ? 'justify-center w-full' : ''}`}>
        <div className="flex items-center min-w-0">
          {!collapsed &&
            <div className="flex items-center justify-center mr-1">
              <CircleCheck className="h-5 w-5 text-red-400" />
            </div>
          }
          {!collapsed && (
            <div className="flex items-top min-w-0">
              <h1 className="text-xl font-semibold uppercase text-red-400 truncate">Appetit</h1>
              {user?.role && user.role !== 'NONE' && (
                <span className={`text-xs font-medium uppercase whitespace-nowrap ${roleColor}`}>
                  {user.role.toLowerCase()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Кнопка меню */}
      <button
        onClick={toggleCollapse}
        className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 active:scale-95 ${
          collapsed ? 'absolute left-1/2 transform -translate-x-1/2' : ''
        }`}
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  )
} 
function DesktopSidebar({ 
  collapsed, 
  toggleCollapse, 
  activeItems, 
  pathname 
}: { 
  collapsed: boolean
  toggleCollapse: () => void
  activeItems: any[]
  pathname: string
}) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguageStore();
  const t = sideTranslations[language];
  const router = useRouter();
  const { setUser, user, mutate } = useAuth();

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

function MobileBottomBar({ activeItems, pathname }: { activeItems: any[], pathname: string }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden">
      <nav className="px-2 py-2">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {activeItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center min-w-16 px-3 py-2 rounded-lg transition-colors flex-shrink-0 ${
                  isActive
                    ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className={`${isActive ? 'text-primary dark:text-primary-foreground' : 'text-gray-500 dark:text-gray-400'}`}>
                  {item.icon}
                </span>
                <span className="text-xs mt-1 whitespace-nowrap">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
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
        const mobile = window.innerWidth < 1200
        setIsMobile(mobile)
        if (mobile) {
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
        icon: <LayoutDashboard className="w-5 h-5" />,
        roles: ['NONE', 'STOREMAN', 'COURIER', 'COOK', 'CHEF', 'WAITER', 'CASHIER', 'MANAGER', 'SUPERVISOR']
      },
      { 
        name: t.orders, 
        href: "/orders", 
        icon: <ClipboardList className="w-5 h-5" />,
        roles: ['WAITER', 'CASHIER', 'MANAGER', 'SUPERVISOR']
      },
      { 
        name: t.kitchen, 
        href: "/kitchen", 
        icon: <Utensils className="w-5 h-5" />,
        roles: ['COOK', 'CHEF', 'MANAGER', 'SUPERVISOR']
      },
        { 
        name: t.preorders, 
        href: "/preorders", 
        icon: <ClockFading className="w-5 h-5" />,
        roles: ['COOK', 'CHEF','WAITER', 'CASHIER', 'MANAGER', 'SUPERVISOR']
      },
       { 
        name: t.delivery, 
        href: "/delivery", 
        icon: <Truck className="w-5 h-5" />,
        roles: ['COURIER', 'MANAGER', 'SUPERVISOR']
      },
      { 
        name: t.restaurants, 
        href: "/restaurants", 
        icon: <Store className="w-5 h-5" />,
        roles: ['MANAGER', 'SUPERVISOR']
      },
      { 
        name: t.menu, 
        href: "/products", 
        icon: <BookOpen className="w-5 h-5" />,
        roles: ['MANAGER', 'SUPERVISOR', 'COOK', 'CHEF']
      },
       { 
        name: t.warehouse, 
        href: "/warehouse", 
        icon: <Package className="w-5 h-5" />,
        roles: ['MANAGER', 'SUPERVISOR']
      },
      { 
        name: t.staff, 
        href: "/users", 
        icon: <Users className="w-5 h-5" />,
        roles: ['MANAGER', 'SUPERVISOR']
      },
      { 
        name: t.shifts, 
        href: "/shifts", 
        icon: <CalendarClock className="w-5 h-5" />,
        roles: [/*'STOREMAN', 'COURIER', 'COOK', 'CHEF', 'WAITER', 'CASHIER', */'MANAGER', 'SUPERVISOR']
      },
      { 
        name: t.loyality, 
        href: "/loyality", 
        icon: <PersonStanding className="w-5 h-5" />,
        roles: ['SUPERVISOR']
      },
      { 
        name: t.analytics, 
        href: "/analytics", 
        icon: <LineChart className="w-5 h-5" />,
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

    if (isMobile) {
      return <MobileBottomBar activeItems={activeItems} pathname={pathname} />
    }

    return (
      <DesktopSidebar 
        collapsed={collapsed}
        toggleCollapse={toggleCollapse}
        activeItems={activeItems}
        pathname={pathname}
      />
    )
}