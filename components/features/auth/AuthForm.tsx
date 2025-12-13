'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Loader2, LogIn, UserPlus, CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordInput } from '@/components/ui/password-input'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { authSchema, type AuthFormValues, registerSchema, type RegisterFormValues } from '@/lib/schemas'
import { useAuth } from '@/lib/hooks/useAuth'
import { authApi } from '@/lib/api/auth'
import Cookies from 'js-cookie'
import { AxiosError } from 'axios'
import { Checkbox } from '@/components/ui/checkbox'

const AuthFormTabs = ({
  activeTab,
  onTabChange,
}: {
  activeTab: 'login' | 'register'
  onTabChange: (tab: 'login' | 'register') => void
}) => {
  return (
    <div className="flex space-x-1 rounded-md bg-muted p-1">
      <button
        type="button"
        onClick={() => onTabChange('login')}
        className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
          activeTab === 'login'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Вход
      </button>
      <button
        type="button"
        onClick={() => onTabChange('register')}
        className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
          activeTab === 'register'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Регистрация
      </button>
    </div>
  )
}

export const AuthForm = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [isLoading, setIsLoading] = useState(false)
  const { setUser } = useAuth()
  const router = useRouter()

  const form = useForm<AuthFormValues | RegisterFormValues>({
    resolver: zodResolver(activeTab === 'login' ? authSchema : registerSchema),
    defaultValues: {
      email: '',
      password: '',
      ...(activeTab === 'register' && {
        name: '',
        confirmPassword: '',
        acceptTerms: false,
      }),
    },
  })

  const onSubmit = async (values: AuthFormValues | RegisterFormValues) => {
    setIsLoading(true)
    try {
      const response = await authApi.post(
        activeTab === 'login' ? '/auth/login' : '/auth/register', 
        values, 
        { withCredentials: true }
      )

      if (activeTab === 'register') {
        // После успешной регистрации, автоматически логиним пользователя
        const loginResponse = await authApi.post('/auth/login', {
          email: values.email,
          password: values.password,
        }, { withCredentials: true })
        
        const { user: userData, accessToken } = loginResponse.data
        
        Cookies.set('accessToken', accessToken, {
          expires: 1,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })
        
        authApi.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        setUser(userData)
        
        toast.success(`Аккаунт ${userData.email} успешно создан!`)
        router.push('/')
      } else {
        // Для логина оставляем как было
        const { user: userData, accessToken } = response.data
        
        Cookies.set('accessToken', accessToken, {
          expires: 1,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })
        
        authApi.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        setUser(userData)
        
        toast.success(`Добро пожаловать, ${userData.email}!`)
        router.push('/')
      }
    } catch (error) {
      console.error('Auth error:', error)
      
      let errorMessage = 'Произошла ошибка'
      
      if (error instanceof AxiosError) {
        if (error.response) {
          switch (error.response.status) {
            case 400:
              errorMessage = activeTab === 'register' 
                ? 'Пользователь с таким email уже существует'
                : 'Неверные данные'
              break
            case 401: 
              errorMessage = 'Неверный email или пароль'
              break
            case 404: 
              errorMessage = 'Пользователь не найден'
              break
            case 500: 
              errorMessage = 'Ошибка сервера'
              break
            default: 
              errorMessage = 'Ошибка при авторизации'
          }
        } else {
          errorMessage = error.message || 'Ошибка соединения'
        }
      }
      
      toast.error(errorMessage, {
        description: 'Попробуйте еще раз'
      })
      
      form.setError('root', {
        type: 'manual',
        message: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab)
    form.reset()
    form.clearErrors()
  }

  const PasswordStrengthIndicator = ({ password }: { password: string }) => {
    if (!password) return null
    
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const isLongEnough = password.length >= 8
    
    const criteria = [
      { label: 'Минимум 8 символов', met: isLongEnough },
      { label: 'Заглавные буквы', met: hasUpperCase },
      { label: 'Строчные буквы', met: hasLowerCase },
      { label: 'Цифры', met: hasNumbers },
      { label: 'Специальные символы', met: hasSpecialChar },
    ]
    
    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar, isLongEnough]
      .filter(Boolean).length
    
    return (
      <motion.div 
        className="mt-2 space-y-2"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between text-xs">
          <span>Сложность пароля:</span>
          <span className={`font-medium ${
            strength >= 4 ? 'text-green-600' : 
            strength >= 3 ? 'text-yellow-600' : 
            'text-red-600'
          }`}>
            {strength >= 4 ? 'Сильный' : strength >= 3 ? 'Средний' : 'Слабый'}
          </span>
        </div>
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              strength >= 4 ? 'w-full bg-green-500' : 
              strength >= 3 ? 'w-3/4 bg-yellow-500' : 
              'w-1/2 bg-red-500'
            }`}
          />
        </div>
        <div className="space-y-1">
          {criteria.map((criterion, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${criterion.met ? 'bg-green-500' : 'bg-muted'}`} />
              <span className={`text-xs ${criterion.met ? 'text-foreground' : 'text-muted-foreground'}`}>
                {criterion.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="relative min-h-screen flex-col items-center justify-center grid lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-white" />
        
        <div className="relative z-20 flex items-center justify-center h-full">
          <div className='flex gap-4'>
            <CircleCheck className='h-24 w-24 text-red-400'/>
            <h1 className='text-8xl uppercase text-red-400'><span className='text-white'>C</span>yber<span className='text-white'>C</span>hef</h1>
          </div>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <footer className="text-sm">CyberChef © {new Date().getFullYear()}</footer>
          </blockquote>
        </div>
      </div>
      
      <div className="w-full hidden md:flex">
        <Card className="border-0 shadow-none sm:border sm:shadow-sm w-full mx-auto max-w-none md:max-w-[450px]">
          <CardHeader className="space-y-1 w-full">
            <AuthFormTabs activeTab={activeTab} onTabChange={handleTabChange} />
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <CardTitle className="text-2xl">
                  {activeTab === 'login' ? 'С возвращением' : 'Создание аккаунта'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'login' 
                    ? 'Войдите с помощью email и пароля'
                    : 'Заполните форму для регистрации'
                  }
                </CardDescription>
              </motion.div>
            </AnimatePresence>
          </CardHeader>
          
          <CardContent className="grid gap-4 w-full">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    className="space-y-4"
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'register' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Имя</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ваше имя"
                                  {...field}
                                  autoComplete="name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    )}
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="email@example.com"
                              {...field}
                              autoComplete="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Пароль</FormLabel>
                          <FormControl>
                            <PasswordInput 
                              placeholder="••••••••" 
                              {...field} 
                              autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                            />
                          </FormControl>
                          {activeTab === 'register' && (
                            <PasswordStrengthIndicator password={field.value} />
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {activeTab === 'register' && (
                      <>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Подтверждение пароля</FormLabel>
                                <FormControl>
                                  <PasswordInput 
                                    placeholder="••••••••" 
                                    {...field} 
                                    autoComplete="new-password"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FormField
                            control={form.control}
                            name="acceptTerms"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="mt-1"
                                  />
                                </FormControl>
                                <div className="space-y-0 leading-none">
                                  <FormLabel className="text-xs font-normal leading-relaxed">
                                    <p>
                                    Я соглашаюсь с{' '}
                                    <a 
                                      href="/terms" 
                                      className="text-primary hover:underline inline font-semibold"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      условиями использования
                                    </a>{' '}
                                    и{' '}
                                    <a 
                                      href="/privacy" 
                                      className="text-primary hover:underline inline font-semibold"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      политикой конфиденциальности
                                    </a></p>
                                  </FormLabel>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />
                        </motion.div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                {form.formState.errors.root && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium text-destructive"
                  >
                    {form.formState.errors.root.message}
                  </motion.p>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full gap-2" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Обработка...
                    </>
                  ) : activeTab === 'login' ? (
                    <>
                      <LogIn className="h-4 w-4" />
                      Войти
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Зарегистрироваться
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      
      {/* Mobile View */}
      <div className="md:hidden w-screen min-h-screen bg-background fixed inset-0 p-4">
        <div className="w-full h-full flex items-center justify-center">
          <Card className="w-full border-0 shadow-none max-w-none">
            <CardHeader className="w-full">
              <AuthFormTabs activeTab={activeTab} onTabChange={handleTabChange} />
              <CardTitle className="text-2xl">
                {activeTab === 'login' ? 'С возвращением' : 'Создание аккаунта'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'login' 
                  ? 'Войдите с помощью email и пароля'
                  : 'Заполните форму для регистрации'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="w-full">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full min-w-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      className="space-y-4"
                      key={activeTab}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {activeTab === 'register' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Имя</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Ваше имя"
                                    {...field}
                                    autoComplete="name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                      )}
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="email@example.com"
                                {...field}
                                autoComplete="email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Пароль</FormLabel>
                            <FormControl>
                              <PasswordInput 
                                placeholder="••••••••" 
                                {...field} 
                                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                              />
                            </FormControl>
                            {activeTab === 'register' && (
                              <PasswordStrengthIndicator password={field.value} />
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {activeTab === 'register' && (
                        <>
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <FormField
                              control={form.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Подтверждение пароля</FormLabel>
                                  <FormControl>
                                    <PasswordInput 
                                      placeholder="••••••••" 
                                      {...field} 
                                      autoComplete="new-password"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </motion.div>
                          
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <FormField
                              control={form.control}
                              name="acceptTerms"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      className="mt-1"
                                    />
                                  </FormControl>
                                  <div className="space-y-0 leading-none">
                                    <FormLabel className="text-xs font-normal leading-relaxed">
                                      <p>
                                      Я соглашаюсь с{' '}
                                      <a 
                                        href="/terms" 
                                        className="text-primary hover:underline inline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        условиями использования
                                      </a>{' '}
                                      и{' '}
                                      <a 
                                        href="/privacy" 
                                        className="text-primary hover:underline inline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        политикой конфиденциальности
                                      </a>
                                      </p>
                                    </FormLabel>
                                    <FormMessage />
                                  </div>
                                </FormItem>
                              )}
                            />
                          </motion.div>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {form.formState.errors.root && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-medium text-destructive"
                    >
                      {form.formState.errors.root.message}
                    </motion.p>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full gap-2" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Обработка...
                      </>
                    ) : activeTab === 'login' ? (
                      <>
                        <LogIn className="h-4 w-4" />
                        Войти
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Зарегистрироваться
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}