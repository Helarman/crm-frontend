"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { authSchema, AuthFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { authApi } from "@/lib/api/auth";
import { toast } from "sonner";
import { AxiosError } from "axios";
import Cookies from "js-cookie";  
import { LogOut } from "lucide-react";

interface AuthFormProps {
  isLogin?: boolean;
}

export const AuthForm = ({ isLogin = true }: AuthFormProps) => {
  const router = useRouter();
  const { setUser } = useAuth();

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: AuthFormValues) => {
    try {
      const response = await toast.promise(
        authApi.post(isLogin ? '/auth/login' : '/auth/register', values, {
          withCredentials: true
        }),
        {
          loading: isLogin ? 'Выполняется вход...' : 'Регистрируем...',
          success: (res) => {
            const { user: userData, accessToken } = res.data;
            
            // Сохраняем accessToken в куки
            Cookies.set('accessToken', accessToken, {
              expires: 1, // 1 день
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax'
            });
            
            // Устанавливаем заголовок авторизации
            authApi.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            
            // Обновляем состояние
            setUser(userData);
            isLogin && router.push('/')
            return isLogin 
              ? `Добро пожаловать, ${userData.email}!`
              : `Аккаунт ${userData.email} успешно создан!`;
          },
          error: (error: AxiosError) => {
            if (error.response) {
              switch (error.response.status) {
                case 401: return 'Неверный email или пароль';
                case 404: return 'Пользователь не найден';
                case 500: return 'Ошибка сервера';
                default: return 'Ошибка при входе';
              }
            }
            return error.message || 'Ошибка соединения';
          },
        }
      );
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Произошла ошибка', {
        description: 'Попробуйте еще раз'
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
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
                <Input type="password" placeholder="Пароль" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full" 
          disabled={form.formState.isSubmitting}
        >
          Войти
        </Button>
      </form>
    </Form>
  );
};