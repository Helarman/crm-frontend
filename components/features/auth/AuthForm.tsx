'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Loader2, LogIn, UserPlus, Bitcoin, CircleCheck } from 'lucide-react'
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
import Image from 'next/image'
import { authSchema, type AuthFormValues } from '@/lib/schemas'
import { useAuth } from '@/lib/hooks/useAuth'
import { authApi } from '@/lib/api/auth'
import Cookies from 'js-cookie'
import { AxiosError } from 'axios'

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
        className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
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
        className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
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

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: AuthFormValues) => {
    setIsLoading(true)
    try {
      // Убираем пробелы из email перед отправкой
      const sanitizedValues = {
        ...values,
        email: values.email.replace(/\s/g, '')
      }

      const response = await authApi.post(
        activeTab === 'login' ? '/auth/login' : '/auth/register', 
        sanitizedValues, 
        { withCredentials: true }
      )

      const { user: userData, accessToken } = response.data
      
      // Сохраняем accessToken в куки
      Cookies.set('accessToken', accessToken, {
        expires: 1,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      
      // Устанавливаем заголовок авторизации
      authApi.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      
      // Обновляем состояние
      setUser(userData)
      
      toast.success(
        activeTab === 'login' 
          ? `Добро пожаловать, ${userData.email}!` 
          : `Аккаунт ${userData.email} успешно создан!`
      )
      
      router.push('/')
    } catch (error) {
      console.error('Auth error:', error)
      
      let errorMessage = 'Произошла ошибка'
      
      if (error instanceof AxiosError) {
        if (error.response) {
          switch (error.response.status) {
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
        message: 'Неверные данные. Пожалуйста, попробуйте еще раз.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
    // Убираем пробелы при вводе
    const valueWithoutSpaces = e.target.value.replace(/\s/g, '')
    onChange(valueWithoutSpaces)
  }

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab)
    form.reset()
    form.clearErrors()
  }

  return (
    <div className=" relative min-h-screen flex-col items-center justify-center grid lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-white" />
        
        <div className="relative z-20 flex items-center justify-center h-full">
          <div className='flex gap-4'>
            <CircleCheck className='h-24 w-24 text-red-400'/>
            <h1 className='text-8xl uppercase text-red-400'>Appetit</h1>
          </div>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <footer className="text-sm">Appetit © {new Date().getFullYear()}</footer>
          </blockquote>
        </div>
      </div>
      
      <div className=" w-full hidden md:flex ">
          <Card className="border-0 shadow-none sm:border sm:shadow-sm w-full mx-auto max-w-none md:max-w-[400px]">
            <CardHeader className="space-y-1 w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardTitle className="text-2xl">
                    С возвращением
                  </CardTitle>
                  <CardDescription>
                    Войдите с помощью email и пароля
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
                      key={`form-${activeTab}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
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
                                onChange={(e) => handleEmailChange(e, field.onChange)}
                                value={field.value}
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                    ) :( 
                      <>
                        <LogIn className="h-4 w-4" />
                        Войти
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
      </div>
      <div className="md:hidden w-screen min-h-screen bg-background fixed inset-0 p-4">
        <div className="w-full h-full flex items-center justify-center">
          <Card className="w-full border-0 shadow-none max-w-none">
            <CardHeader className="w-full">
              <CardTitle className="text-2xl">С возвращением</CardTitle>
              <CardDescription>Войдите с помощью email и пароля</CardDescription>
            </CardHeader>
            
            <CardContent className="w-full">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4  w-full min-w-0">
                        <AnimatePresence mode="wait">
                          <motion.div
                            className="space-y-4"
                            key={`form-${activeTab}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
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
                                      onChange={(e) => handleEmailChange(e, field.onChange)}
                                      value={field.value}
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
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
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
                          ) :( 
                            <>
                              <LogIn className="h-4 w-4" />
                              Войти
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