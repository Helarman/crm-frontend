"use client"

import { useState, useEffect, useRef } from 'react'
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { useAuth } from "@/lib/hooks/useAuth"
import { authService } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useTheme } from "next-themes";
import { Language, useLanguageStore } from "@/lib/stores/language-store";
import { sideTranslations } from "./translations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  ChevronDown,
  LayoutDashboard,
  ClipboardList,
  BookUser,
  Utensils,
  BookOpen,
  Users,
  CalendarClock,
  LineChart,
  Tag,
  TrendingUp,
  Settings as SettingsIcon,
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
  CircleCheck,
  User
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

// Компонент для отображения информации о пользователе
function UserInfo({ collapsed, handleLogout, t }: { 
  collapsed: boolean, 
  handleLogout: any,
  t: any 
}) {
  const { user } = useAuth()
  const { language } = useLanguageStore()
  const { theme, setTheme } = useTheme()
  const { setLanguage } = useLanguageStore()
  const router = useRouter()
  const roleColor = ROLE_COLORS[user?.role as keyof typeof ROLE_COLORS] || 'text-gray-500 dark:text-gray-400'

  const getRoleTranslation = (role: string) => {
    const roleTranslations: Record<string, string> = {
      'NONE': t.role_none,
      'STOREMAN': t.role_storeman,
      'COURIER': t.role_courier,
      'COOK': t.role_cook,
      'CHEF': t.role_chef,
      'WAITER': t.role_waiter,
      'CASHIER': t.role_cashier,
      'MANAGER': t.role_manager,
      'SUPERVISOR': t.role_supervisor,
    }
    return roleTranslations[role] || role.toLowerCase()
  }

  if (collapsed) {
    return (
      <div className="flex flex-col items-center space-y-2 p-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
          <User className="w-5 h-5 text-primary dark:text-primary-foreground" />
        </div>
        
        {/* Настройки и выход в collapsed режиме */}
        <div className="flex space-x-1 w-full justify-center">
            <button
              onClick={() => router.push('/settings')}
                className="flex justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title={t.settings}
              >
                <SettingsIcon className="w-5 h-5" />
              </button>

          <button
            onClick={handleLogout}
            className="flex justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title={t.logout}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-primary dark:text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {user?.name || t.guest}
            </h3>
            <div className={`text-sm font-medium ${roleColor}`}>
              {user?.role ? getRoleTranslation(user.role) : t.no_role}
            </div>
          </div>
        </div>
        
        {/* Кнопки настроек и выхода в не-collapsed режиме */}
        <div className="flex space-x-1">
          <button
              onClick={() => router.push('/settings')}
                className="flex justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title={t.settings}
              >
                <SettingsIcon className="w-5 h-5" />
              </button>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title={t.logout}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Logo({ collapsed, toggleCollapse }: { collapsed: boolean; toggleCollapse: () => void }) {
  return (
    <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 px-4 relative">
      <div className={`flex items-center gap-3 transition-all duration-300 ${collapsed ? 'justify-center w-full' : ''}`}>
        <div className="flex items-center min-w-0">
          {!collapsed &&
            <div className="flex items-center justify-center mr-1">
              <CircleCheck className="h-5 w-5 text-red-400" />
            </div>
          }
          {!collapsed && (
            <div className="flex items-top min-w-0">
              <h1 className="text-xl font-semibold uppercase text-red-400 truncate">Cyberchef</h1>
            </div>
          )}
        </div>
      </div>

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
  pathname,
  t
}: {
  collapsed: boolean
  toggleCollapse: () => void
  activeItems: any[]
  pathname: string
  t: any
}) {
  const { language } = useLanguageStore();
  const router = useRouter();
  const { setUser, mutate } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);
  const isDropdownOpenRef = useRef(false);

  // Реф для навигационного меню
  const navRef = useRef<HTMLElement>(null);
  // Состояние для отслеживания наличия скролла
  const [hasScroll, setHasScroll] = useState(false);

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

  // Функция для проверки наличия скролла
  const checkScroll = () => {
    if (navRef.current) {
      const hasVerticalScroll = navRef.current.scrollHeight > navRef.current.clientHeight;
      setHasScroll(hasVerticalScroll);
    }
  };

  // Обработчик клика вне сайдбара
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) &&
        !isDropdownOpenRef.current &&
        !collapsed
      ) {
        toggleCollapse();
      }
    };

    if (!collapsed) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [collapsed, toggleCollapse]);

  // Обработчики для дропдаунов
  const handleDropdownOpenChange = (open: boolean) => {
    isDropdownOpenRef.current = open;
  };

  const handleMouseEnter = () => {
    isHoveringRef.current = true;
    
    if (collapsed) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      
      hoverTimeoutRef.current = setTimeout(() => {
        if (isHoveringRef.current && !isDropdownOpenRef.current) {
          toggleCollapse();
        }
      }, 30); 
    }
  };

  const handleMouseLeave = () => {
    isHoveringRef.current = false;
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Не сворачиваем при уходе мыши, если открыт дропдаун
    if (!collapsed && !isDropdownOpenRef.current) {
      // Только сворачиваем при клике вне сайдбара
    }
  };

  // Проверяем наличие скролла при изменении размера окна и активных элементов
  useEffect(() => {
    checkScroll();

    // Добавляем обработчик изменения размера окна
    window.addEventListener('resize', checkScroll);

    return () => {
      window.removeEventListener('resize', checkScroll);
    };
  }, [collapsed, activeItems]);

  return (
    <div 
      ref={sidebarRef}
      className={`bg-white dark:bg-gray-900 border-r flex flex-col h-screen sticky top-0 transition-all duration-300 ${
        collapsed ? 'w-24' : 'w-80'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Logo collapsed={collapsed} toggleCollapse={toggleCollapse} />

      {/* Навигационное меню */}
      <nav
        ref={navRef}
        className="flex-1 px-2 py-2 overflow-y-auto text-xl scrollbar-hide"
        onLoad={checkScroll}
      >
        <ul className={`space-y-1 ${collapsed ? 'flex flex-col items-center' : ''} ${hasScroll && collapsed ? 'pr-2' : ''}`}>
          {activeItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href} className={`${collapsed ? 'w-full flex justify-center' : ''}`}>
                <Link
                  href={item.href}
                  className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-3 rounded-lg transition-colors ${
                    collapsed ? 'w-12 h-12 mx-auto' : 'mx-1'
                  } ${
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

      <div className={`p-2 border-t dark:border-gray-700 ${collapsed ? '' : ''}`}>
        {/* Оборачиваем UserInfo для отслеживания дропдаунов */}
        <div 
          onMouseEnter={(e) => e.stopPropagation()}
          onMouseLeave={(e) => e.stopPropagation()}
        >
          <UserInfo collapsed={collapsed} handleLogout={handleLogout} t={t} />
        </div>

        {!collapsed && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 px-3 text-center">{t.version} 0.1.0</p>
        )}
      </div>
    </div>
  )
}

function MobileBottomBar({ 
  activeItems, 
  pathname, 
  t 
}: { 
  activeItems: any[], 
  pathname: string,
  t: any 
}) {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguageStore();
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

          {/* Кнопка настроек */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex flex-col items-center justify-center min-w-16 px-3 py-2 rounded-lg transition-colors flex-shrink-0 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <SettingsIcon className="w-5 h-5" />
                <span className="text-xs mt-1 whitespace-nowrap">{t.settings}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 dark:bg-gray-800" align="center" side="top">
              <div className="p-2">
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.theme}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex-1 px-3 py-2 rounded text-sm ${theme === 'light' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
                    >
                      {t.light}
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex-1 px-3 py-2 rounded text-sm ${theme === 'dark' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
                    >
                      {t.dark}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.language}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setLanguage('ru')}
                      className={`flex-1 px-3 py-2 rounded text-sm ${language === 'ru' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
                    >
                      🇷🇺 Русский
                    </button>
                    <button
                      onClick={() => setLanguage('ka')}
                      className={`flex-1 px-3 py-2 rounded text-sm ${language === 'ru' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
                    >
                      🇬🇪 ქართული
                    </button>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator className="dark:bg-gray-700" />

              {/* Кнопка выхода внутри настроек */}
              <button
                onClick={handleLogout}
                className="w-full px-2 py-2 text-left text-red-500 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t.logout}
              </button>
            </DropdownMenuContent>
          </DropdownMenu>
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
  const { language } = useLanguageStore();
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
      roles: ['COOK', 'CHEF', 'WAITER', 'CASHIER', 'MANAGER', 'SUPERVISOR']
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
      href: "/menu",
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
      roles: ['MANAGER', 'SUPERVISOR']
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
    {
      name: 'Бронирование',
      href: "/reservation",
      icon: <BookUser className="w-5 h-5" />,
      roles: [ 'WAITER', 'CASHIER', 'MANAGER', 'SUPERVISOR']
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
    return <MobileBottomBar activeItems={activeItems} pathname={pathname} t={t} />
  }

  return (
    <DesktopSidebar
      collapsed={collapsed}
      toggleCollapse={toggleCollapse}
      activeItems={activeItems}
      pathname={pathname}
      t={t}
    />
  )
}