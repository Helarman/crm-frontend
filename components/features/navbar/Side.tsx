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
// Компонент для отображения информации о пользователе
function UserInfo({ collapsed, handleLogout }: { collapsed: boolean, handleLogout: any }) {
  const { user } = useAuth()
  const { language } = useLanguageStore()
  const { theme, setTheme } = useTheme()
  const { setLanguage } = useLanguageStore()
  const t = sideTranslations[language]

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title={t.settings}
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 dark:bg-gray-800" align="start">
              {/* Переключение темы */}
              <div className="px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.theme}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                        {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        <span className="text-sm">
                          {theme === 'light' ? t.light : theme === 'dark' ? t.dark : t.system}
                        </span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40 dark:bg-gray-800">
                      <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                        <DropdownMenuRadioItem value="light" className="dark:hover:bg-gray-700">
                          <Sun className="w-4 h-4 mr-2" />
                          {t.light}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="dark" className="dark:hover:bg-gray-700">
                          <Moon className="w-4 h-4 mr-2" />
                          {t.dark}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="glass" className="dark:hover:bg-gray-700">
                          <Moon className="w-4 h-4 mr-2" />
                          Glass
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="system" className="dark:hover:bg-gray-700">
                          <SettingsIcon className="w-4 h-4 mr-2" />
                          {t.system}
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <DropdownMenuSeparator className="dark:bg-gray-700" />

              {/* Переключение языка */}
              <div className="px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.language}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Languages className="w-4 h-4" />
                        <span className="text-sm">
                          {language === 'ru' ? 'Русский' : 'ქართული'}
                        </span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40 dark:bg-gray-800">
                      <DropdownMenuRadioGroup value={language} onValueChange={(value) => setLanguage(value as Language)}>
                        <DropdownMenuRadioItem value="ru" className="dark:hover:bg-gray-700">
                          🇷🇺 {t.russian}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="ka" className="dark:hover:bg-gray-700">
                          🇬🇪 {t.georgian}
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title={t.settings}
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 dark:bg-gray-800" align="end">
              {/* Переключение темы */}
              <div className="px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.theme}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                        {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        <span className="text-sm">
                          {theme === 'light' ? t.light : theme === 'dark' ? t.dark : t.system}
                        </span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40 dark:bg-gray-800">
                      <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                        <DropdownMenuRadioItem value="light" className="dark:hover:bg-gray-700">
                          <Sun className="w-4 h-4 mr-2" />
                          {t.light}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="dark" className="dark:hover:bg-gray-700">
                          <Moon className="w-4 h-4 mr-2" />
                          {t.dark}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="glass" className="dark:hover:bg-gray-700">
                          <Moon className="w-4 h-4 mr-2" />
                          Glass
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="system" className="dark:hover:bg-gray-700">
                          <SettingsIcon className="w-4 h-4 mr-2" />
                          {t.system}
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <DropdownMenuSeparator className="dark:bg-gray-700" />

              {/* Переключение языка */}
              <div className="px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.language}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Languages className="w-4 h-4" />
                        <span className="text-sm">
                          {language === 'ru' ? 'Русский' : 'ქართული'}
                        </span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40 dark:bg-gray-800">
                      <DropdownMenuRadioGroup value={language} onValueChange={(value) => setLanguage(value as Language)}>
                        <DropdownMenuRadioItem value="ru" className="dark:hover:bg-gray-700">
                          🇷🇺 {t.russian}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="ka" className="dark:hover:bg-gray-700">
                          🇬🇪 {t.georgian}
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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
        className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 active:scale-95 ${collapsed ? 'absolute left-1/2 transform -translate-x-1/2' : ''
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
  const { language } = useLanguageStore();
  const t = sideTranslations[language];
  const router = useRouter();
  const { setUser, mutate } = useAuth();

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
      // Сравниваем scrollHeight с clientHeight
      const hasVerticalScroll = navRef.current.scrollHeight > navRef.current.clientHeight;
      setHasScroll(hasVerticalScroll);
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
    <div className={`bg-white dark:bg-gray-900 border-r flex flex-col h-screen sticky top-0 transition-all duration-300 ${collapsed ? 'w-24' : 'w-80'}`}>
      <Logo collapsed={collapsed} toggleCollapse={toggleCollapse} />

      {/* Навигационное меню */}
      <nav
        ref={navRef}
        className="flex-1 px-2 py-2 overflow-y-auto text-xl scrollbar-hide"
        onLoad={checkScroll} // Проверяем при загрузке
      >
        <ul className={`space-y-1 ${collapsed ? 'flex flex-col items-center' : ''} ${hasScroll && collapsed ? 'pr-2' : ''}`}>
          {activeItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href} className={`${collapsed ? 'w-full flex justify-center' : ''}`}>
                <Link
                  href={item.href}
                  className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-3 rounded-lg transition-colors ${collapsed ? 'w-12 h-12 mx-auto' : 'mx-1'} ${isActive
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
        {/* UserInfo теперь содержит и настройки и выход */}
        <UserInfo collapsed={collapsed} handleLogout={handleLogout} />

        {!collapsed && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 px-3 text-center">{t.version} 0.1.0</p>
        )}
      </div>
    </div>
  )
}

function MobileBottomBar({ activeItems, pathname }: { activeItems: any[], pathname: string }) {
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
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden">
      <nav className="px-2 py-2">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {activeItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center min-w-16 px-3 py-2 rounded-lg transition-colors flex-shrink-0 ${isActive
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