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
  Languages
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
import { Language, useLanguageStore } from "@/lib/stores/language-store";
import { navTranslations } from "./translations"; 

export default function Nav() {
  const router = useRouter();
  const { mutate, setUser, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguageStore();
  const t = navTranslations[language];

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
    <header className="bg-white dark:bg-gray-900 border-b h-16 flex items-center justify-end">
      <div className="flex items-center space-x-4 mr-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar>
                <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium dark:text-white">{user?.name}</p>
              <ChevronDown className="dark:text-white"/>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mr-4 dark:bg-gray-800">
            <DropdownMenuLabel>{t.account}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="dark:hover:bg-gray-700">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{t.profile}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="dark:hover:bg-gray-700">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>{t.settings}</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="dark:hover:bg-gray-700">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4" />
                  <span>{t.language}</span>
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="dark:bg-gray-800">
                <DropdownMenuRadioGroup value={language} onValueChange={(value) => setLanguage(value as Language)}>
                  <DropdownMenuRadioItem value="ru" className="dark:hover:bg-gray-700">
                    {t.russian}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="ka" className="dark:hover:bg-gray-700">
                    {t.georgian}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="dark:hover:bg-gray-700">
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  <span>{t.theme}</span>
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="dark:bg-gray-800">
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light" className="dark:hover:bg-gray-700">
                    {t.light}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark" className="dark:hover:bg-gray-700">
                    {t.dark}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system" className="dark:hover:bg-gray-700">
                    {t.system}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem className="dark:hover:bg-gray-700" onClick={handleLogout}>
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span>{t.logout}</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}