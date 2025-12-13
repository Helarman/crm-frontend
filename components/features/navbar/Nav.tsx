"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/hooks/useAuth";
import { getInitials } from "@/lib/utils"
import {
  Settings,
  User,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  DollarSign,
  CreditCard,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { authService } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";

export default function Nav() {
  const router = useRouter();
  const { mutate, setUser, user } = useAuth();
  const { theme, setTheme } = useTheme();

  const isControlUser = user?.role === 'CONTROL';

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

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleFinances = () => {
    router.push('/finances');
  };

  const handleTariffs = () => {
    router.push('/tariffs');
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b h-16 flex items-center justify-between px-4">
      {/* Левая часть с логотипом */}
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold dark:text-white hidden md:block">
            CyberChef
          </span>
        </Link>
      </div>

      {/* Правая часть с меню пользователя */}
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar>
                <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium dark:text-white">{user?.name}</p>
              <ChevronDown className="dark:text-white w-4 h-4"/>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mr-4 dark:bg-gray-800">
            <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Меню для CONTROL пользователей */}
            {isControlUser && (
              <>
                <DropdownMenuItem 
                  className="dark:hover:bg-gray-700 cursor-pointer"
                  onClick={handleFinances}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Финансы</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem 
                  className="dark:hover:bg-gray-700 cursor-pointer"
                  onClick={handleTariffs}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Тарифы</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
              </>
            )}

            {/* Настройки системы */}
            <DropdownMenuItem 
              className="dark:hover:bg-gray-700 cursor-pointer"
              onClick={handleSettings}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>Настройки</span>
              </div>
            </DropdownMenuItem>
            
            {/* Тема оформления */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="dark:hover:bg-gray-700 cursor-pointer">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  <span>Тема</span>
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="dark:bg-gray-800">
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light" className="dark:hover:bg-gray-700 cursor-pointer">
                    Светлая
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark" className="dark:hover:bg-gray-700 cursor-pointer">
                    Тёмная
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system" className="dark:hover:bg-gray-700 cursor-pointer">
                    Как в системе
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            <DropdownMenuSeparator />
            
            {/* Кнопка выхода */}
            <DropdownMenuItem 
              className="dark:hover:bg-gray-700 cursor-pointer text-red-600 dark:text-red-400"
              onClick={handleLogout}
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span>Выйти</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}