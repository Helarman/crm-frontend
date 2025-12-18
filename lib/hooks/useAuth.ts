"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { authApi } from "@/lib/api/auth";
import Cookies from "js-cookie";
import { AxiosError } from "axios";

export const useAuth = () => {
  const { 
    data: user, 
    error,
    mutate,
    isLoading 
  } = useSWR(
    '/auth/me',
    async (url) => {
      const accessToken = Cookies.get('accessToken');
  
      if (!accessToken) {
        throw new Error('No access token');
      }

      try {
        //Устанавливаем токен в заголовки
        authApi.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        //Делаем запрос за данными пользователя
        const { data } = await authApi.get(url);
        return data;
      } catch (error) {
        //Ошибки обрабатываем в interceptor'е
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const setUser = (userData: any) => mutate(userData, false);

  return {
    user,
    loading: isLoading && !error, // Не показываем загрузку при ошибке
    error,
    setUser,
    mutate,
  };
};