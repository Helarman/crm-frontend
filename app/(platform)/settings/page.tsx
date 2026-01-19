'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useTheme } from "next-themes"
import { useLanguageStore, Language } from "@/lib/stores/language-store"
import { useAuth } from "@/lib/hooks/useAuth"
import { 
  Settings as SettingsIcon, 
  User, 
  Globe, 
  Moon, 
  Sun, 
  Monitor, 
  Languages,
  Check,
  Shield,
  Bell,
  Palette,
  Lock,
  Eye,
  EyeOff,
  Save,
  X,
  ArrowLeft,
  Loader2,
  Mail,
  Smartphone,
  BellOff,
  Volume2,
  LayoutTemplate,
  History,
  Clock,
  Building,
  Users,
  CreditCard,
  Database,
  Network
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from "@/components/ui/navigation-menu"
import { DialogContentExtraWide } from "@/components/ui/dialog"

// Массив всех поддерживаемых языков
const ALL_LANGUAGES = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺', nativeName: 'Русский', disabled: false },
  { code: 'ka', name: 'Грузинский', flag: '🇬🇪', nativeName: 'ქართული',  disabled: false  },
  { code: 'kk', name: 'Казахский', flag: '🇰🇿', nativeName: 'Қазақша', disabled: true },
  { code: 'uz', name: 'Узбекский', flag: '🇺🇿', nativeName: "O'zbekcha", disabled: true },
  { code: 'zh', name: 'Китайский', flag: '🇨🇳', nativeName: '中文', disabled: true },
  { code: 'en', name: 'Английский', flag: '🇬🇧', nativeName: 'English', disabled: true },
  { code: 'de', name: 'Немецкий', flag: '🇩🇪', nativeName: 'Deutsch', disabled: true },
  { code: 'es', name: 'Испанский', flag: '🇪🇸', nativeName: 'Español', disabled: true },
  { code: 'it', name: 'Итальянский', flag: '🇮🇹', nativeName: 'Italiano', disabled: true },
] as const

type SettingsSection = 'personal' | 'appearance' | 'notifications' | 'security' | 'system'

const sections = [
  {
    id: 'personal',
    title: 'Персональные настройки',
    icon: User,
    color: 'bg-gradient-to-br from-emerald-500 to-green-400',
    description: 'Настройки профиля и аккаунта'
  },
  {
    id: 'appearance',
    title: 'Внешний вид',
    icon: Palette,
    color: 'bg-gradient-to-br from-purple-500 to-pink-400',
    description: 'Тема, язык и отображение'
  },

] as const

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguageStore()
  const { user } = useAuth()
  
  const [currentSection, setCurrentSection] = useState<SettingsSection>('personal')
  const [isSaving, setIsSaving] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  
  // Состояния для настроек
  const [settings, setSettings] = useState({
    // Персональные
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    
    // Внешний вид
    compactMode: false,
    showAvatars: true,
    animations: true,
    
    // Уведомления
    emailNotifications: true,
    pushNotifications: true,
    soundNotifications: false,
    
    // Безопасность
    twoFactorAuth: false,
    sessionTimeout: 30,
    
    // Система
    autoUpdates: true,
    backupEnabled: true,
  })
  
  // Состояния для смены пароля
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setCurrentSection(entry.target.id as SettingsSection);
          }
        });
      },
      {
        root: null,
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0
      }
    );

    sections.forEach(section => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [])

  const scrollToSection = (id: string) => {
    setIsScrolling(true);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    setTimeout(() => setIsScrolling(false), 1000);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
  }

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handlePasswordChange = (key: keyof typeof password, value: string) => {
    setPassword(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // Здесь будет API вызов для сохранения настроек
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Настройки сохранены')
    } catch (error) {
      toast.error('Ошибка сохранения настроек')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (password.newPassword !== password.confirmPassword) {
      toast.error('Пароли не совпадают')
      return
    }
    
    setIsSaving(true)
    try {
      // Здесь будет API вызов для смены пароля
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Пароль успешно изменен')
      setShowChangePassword(false)
      setPassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      toast.error('Ошибка смены пароля')
    } finally {
      setIsSaving(false)
    }
  }

  const renderSectionContent = (sectionId: SettingsSection) => {
    switch (sectionId) {
      case 'personal':
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Персональная информация</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Имя</Label>
                      <Input
                        id="name"
                        value={settings.name}
                        onChange={(e) => handleSettingChange('name', e.target.value)}
                        placeholder="Введите ваше имя"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.email}
                        onChange={(e) => handleSettingChange('email', e.target.value)}
                        placeholder="Введите ваш email"
                      />
                    </div>
                    
                    
                    <div className="pt-4">
                      <Button 
                        onClick={() => setShowChangePassword(true)}
                        variant="outline"
                        className="w-full"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Сменить пароль
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
        
      case 'appearance':
        return (
          <Card>
  <CardContent className="pt-6">
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Тема интерфейса</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => handleThemeChange('system')}
            variant={theme === 'system' ? 'default' : 'outline'}
            className={`h-32 flex flex-col items-center justify-center gap-3 p-4 ${
              theme === 'system' 
                ? 'border-2 border-primary' 
                : 'hover:border-primary/50'
            }`}
          >
            <div className="p-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 dark:text-white text-gray-900">
              <Monitor className="h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Системная</p>
              <p className="text-xs text-gray-600">Следует системным настройкам</p>
            </div>
            {theme === 'system' && (
              <Check className="h-5 w-5 text-primary absolute top-3 right-3" />
            )}
          </Button>
          
          <Button
            onClick={() => handleThemeChange('light')}
            variant={theme === 'light' ? 'default' : 'outline'}
            className={`h-32 flex flex-col items-center justify-center gap-3 p-4 ${
              theme === 'light' 
                ? 'border-2 border-primary' 
                : 'hover:border-primary/50'
            }`}
          >
            <div className="p-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-white">
              <Sun className="h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Светлая</p>
              <p className="text-xs text-gray-600">Светлый интерфейс</p>
            </div>
            {theme === 'light' && (
              <Check className="h-5 w-5 text-primary absolute top-3 right-3" />
            )}
          </Button>
          
          <Button
            onClick={() => handleThemeChange('dark')}
            variant={theme === 'dark' ? 'default' : 'outline'}
            className={`h-32 flex flex-col items-center justify-center gap-3 p-4 ${
              theme === 'dark' 
                ? 'border-2 border-primary' 
                : 'hover:border-primary/50'
            }`}
          >
            <div className="p-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 dark:text-white">
              <Moon className="h-8 w-8" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Темная</p>
              <p className="text-xs text-gray-700">Темный интерфейс</p>
            </div>
            {theme === 'dark' && (
              <Check className="h-5 w-5 text-primary absolute top-3 right-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
    
    <div className="space-y-6 mt-6">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Язык интерфейса</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => handleLanguageChange('ru')}
            variant={language === 'ru' ? 'default' : 'outline'}
            className={`h-32 flex flex-col items-center justify-center gap-3 p-4 ${
              language === 'ru' 
                ? 'border-2 border-primary' 
                : 'hover:border-primary/50'
            }`}
          >
            <div className="p-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
              
              <span className="text-2xl h-8 w-8 flex items-center justify-center">🇷🇺</span>
            </div>
            <div className="text-center">
              <p className="font-semibold">Русский</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Russian</p>
            </div>
            {language === 'ru' && (
              <Check className="h-5 w-5 text-primary absolute top-3 right-3" />
            )}
          </Button>
          
          <Button
            onClick={() => handleLanguageChange('ka')}
            variant={language === 'ka' ? 'default' : 'outline'}
            className={`h-32 flex flex-col items-center justify-center gap-3 p-4 ${
              language === 'ka' 
                ? 'border-2 border-primary' 
                : 'hover:border-primary/50'
            }`}
          >
            <div className="p-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
              <span className="text-2xl h-8 w-8 flex items-center justify-center">🇬🇪</span>
            </div>
            <div className="text-center">
              <p className="font-semibold">Грузинский</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">ქართული</p>
            </div>
            {language === 'ka' && (
              <Check className="h-5 w-5 text-primary absolute top-3 right-3" />
            )}
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="h-32 flex flex-col items-center justify-center gap-3 p-4 hover:border-primary/50"
              >
                <div className="p-3 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  <Languages className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Другие языки</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Скоро</p>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl">Выберите язык</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {ALL_LANGUAGES.filter(lang => !['ru', 'ka'].includes(lang.code)).map((lang) => (
                  <Button
                    key={lang.code}
                    variant="outline"
                    disabled={lang.disabled}
                    className={`h-28 flex flex-col items-center justify-center gap-2 p-4 ${
                      lang.disabled 
                        ? 'opacity-60 cursor-not-allowed' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => !lang.disabled && handleLanguageChange(lang.code as Language)}
                  >
                    <div className="h-8 w-8 flex items-center justify-center text-xl">
                      {lang.flag}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-sm">{lang.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{lang.nativeName}</p>
                    </div>
                    {lang.disabled && (
                      <span className="text-xs text-gray-500 mt-1">Скоро</span>
                    )}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  </CardContent>
</Card>
        )
        
      default:
        return null
    }
  }

  // Диалог смены пароля
  const ChangePasswordDialog = () => (
    <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Смена пароля</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Текущий пароль</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={password.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                placeholder="Введите текущий пароль"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPassword">Новый пароль</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={password.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                placeholder="Введите новый пароль"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={password.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                placeholder="Подтвердите новый пароль"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowChangePassword(false)
              setPassword({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              })
            }}
            className="h-11"
          >
            Отмена
          </Button>
          <Button
            onClick={handleChangePassword}
            disabled={isSaving}
            className="h-11"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              'Сменить пароль'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  // Иконки для кнопок
  const Download = (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )

  const FileText = (props: any) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )

  return (
    <div className="min-h-screen">
      {/* Навигация */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b supports-backdrop-blur:bg-white/60 dark:bg-gray-700/80 dark:text-white">
        <div className="py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              Настройки
            </h1>
           
          </div>

          {/* Навигационное меню */}
          <div className="mt-4">
            <NavigationMenu>
              <NavigationMenuList>
                {sections.map(section => {
                  const Icon = section.icon;
                  return (
                    <NavigationMenuItem key={section.id}>
                      <Button
                        variant="ghost"
                        onClick={() => scrollToSection(section.id)}
                        className={`relative gap-2 transition-all duration-300  dark:text-white ${
                          currentSection === section.id
                            ? "text-gray-900  dark:text-gray-900 bg-gray-100 "
                            : "text-gray-600 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {section.title}
                        {currentSection === section.id && (
                          <motion.div
                            layoutId="activeSection"
                            className="absolute inset-0 bg-gray-100 rounded-md -z-10"
                            initial={false}
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </Button>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      </nav>

      {/* Основной контент */}
      <div>
        <div className="py-6">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = currentSection === section.id;

            return (
              <div
                key={section.id}
                id={section.id}
                className="pt-8 scroll-mt-30"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-lg ${section.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{section.title}</h2>
                    <p className="text-gray-600">{section.description}</p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderSectionContent(section.id)}
                  </motion.div>
                </AnimatePresence>

                {/* Кнопка сохранения для каждой секции */}
                {section.id === 'personal' && (
                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      size="lg"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Сохранение...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Сохранить изменения
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Диалог смены пароля */}
      <ChangePasswordDialog />
    </div>
  )
}