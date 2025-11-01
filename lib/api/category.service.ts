import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export interface CategoryDto {
  id?: string;
  title: string;
  description: string;
  slug: string;
  image?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  parentId?: string;
  order?: number;
  children?: CategoryDto[];
  products?: any[];
  parent?: CategoryDto | null;
}

export const CategoryService = {
  // Получение категории по ID
  getById: async (id: string): Promise<CategoryDto> => {
    const { data } = await api.get(`/categories/by-id/${id}`);
    return data;
  },

  // Создание новой категории (требует авторизации)
  create: async (dto: Omit<CategoryDto, 'id'>): Promise<CategoryDto> => {
    const { data } = await api.post('/categories', dto);
    return data;
  },

  // Обновление категории (требует авторизации)
  update: async (id: string, dto: Partial<CategoryDto>): Promise<CategoryDto> => {
    const { data } = await api.put(`/categories/${id}`, dto);
    return data;
  },

  // Удаление категории (требует авторизации)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },

  // Получение всех продуктов по категории
  getProductsByCategory: async (id: string): Promise<CategoryDto> => {
    const { data } = await api.get(`/categories/${id}/products`);
    return data;
  },

  // Получение всех родительских категорий
  getAll: async (searchTerm?: string): Promise<CategoryDto[]> => {
    const { data } = await api.get('/categories', {
      params: { searchTerm }
    });
    return data;
  },

  // Получение дерева категорий
  getTree: async (): Promise<CategoryDto[]> => {
    const { data } = await api.get('/categories/tree');
    return data;
  },

  // Получение категорий по уровню вложенности (опционально)
  getByLevel: async (level: number = 1): Promise<CategoryDto[]> => {
    const allCategories = await CategoryService.getTree();

    const getCategoriesByLevel = (categories: CategoryDto[], currentLevel: number, targetLevel: number): CategoryDto[] => {
      if (currentLevel === targetLevel) {
        return categories;
      }

      return categories.flatMap(category =>
        getCategoriesByLevel(category.children || [], currentLevel + 1, targetLevel)
      );
    };

    return getCategoriesByLevel(allCategories, 1, level);
  },

  // Получение всех категорий в плоском виде (опционально)
  getAllFlat: async (): Promise<CategoryDto[]> => {
    const tree = await CategoryService.getTree();

    const flattenCategories = (categories: CategoryDto[]): CategoryDto[] => {
      return categories.flatMap(category => [
        { ...category, children: undefined },
        ...flattenCategories(category.children || [])
      ]);
    };

    return flattenCategories(tree);
  },

  updateOrder: async (id: string, order: number) => {
    const { data } = await api.post(`/categories/${id}/order`, { order });
    return data;
  },

  updateClientOrder: async (id: string, clientOrder: number) => {
    const { data } = await api.post(`/categories/${id}/client-order`, { clientOrder });
    return data;
  },

  moveUp: async (id: string) => {
    const { data } = await api.post(`/categories/${id}/move-up`);
    return data;
  },

  moveDown: async (id: string) => {
    const { data } = await api.post(`/categories/${id}/move-down`);
    return data;
  },

  moveUpOnClient: async (id: string) => {
    const { data } = await api.post(`/categories/${id}/move-up-client`);
    return data;
  },

  moveDownOnClient: async (id: string) => {
    const { data } = await api.post(`/categories/${id}/move-down-client`);
    return data;
  }
};