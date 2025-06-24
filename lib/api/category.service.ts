import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});


export interface CategoryDto {
  id?: string
  title: string;
  description?: string;
}

export const CategoryService = {
  // Получение категории по ID
  getById: async (id: string) => {
    const { data } = await api.get(`/categories/by-id/${id}`);
    return data;
  },

  // Создание новой категории (требует авторизации)
  create: async (dto: CategoryDto) => {
    const { data } = await api.post('/categories', dto);
    return data;
  },

  // Обновление категории (требует авторизации)
  update: async (id: string, dto: CategoryDto) => {
    const { data } = await api.put(`/categories/${id}`, dto);
    return data;
  },

  // Удаление категории (требует авторизации)
  delete: async (id: string) => {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
  },

  // Получение всех продуктов по категории
  getProductsByCategory: async (id: string) => {
    const { data } = await api.get(`/categories/${id}/products`);
    return data;
  },

  // Дополнительно можно добавить метод для получения всех категорий,
  // если у вас есть соответствующий endpoint на бэкенде
  getAll: async (searchTerm?: string) => {
    const { data } = await api.get('/categories', {
      params: { searchTerm }
    });
    return data;
  }
};