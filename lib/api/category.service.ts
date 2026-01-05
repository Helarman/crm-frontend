import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export interface CategoryDto {
  id?: string;
  title: string;
  networkId?: string;
  description: string;
  slug: string;
  image?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  metaContent?: string;
  parentId?: any;
  order?: number;
  clientOrder?: number;
  children?: CategoryDto[];
  products?: any[];
  parent?: CategoryDto | null;
  restaurants?: any[]; 
  restaurantIds?: string[]; 
  published?: any;
  isMain?: any;
}

export const CategoryService = {
  getById: async (id: string): Promise<CategoryDto> => {
    const { data } = await api.get(`/categories/by-id/${id}`);
    return data;
  },

  create: async (dto: Omit<CategoryDto, 'id'>): Promise<CategoryDto> => {
    const { data } = await api.post('/categories', dto);
    return data;
  },

  update: async (id: string, dto: Partial<CategoryDto>): Promise<CategoryDto> => {
    const { data } = await api.put(`/categories/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },

  getProductsByCategory: async (id: string): Promise<CategoryDto> => {
    const { data } = await api.get(`/categories/${id}/products`);
    return data;
  },

  getAll: async (searchTerm?: string): Promise<CategoryDto[]> => {
    const { data } = await api.get('/categories', {
      params: { searchTerm }
    });
    return data;
  },

  getTree: async (): Promise<CategoryDto[]> => {
    const { data } = await api.get('/categories/tree');
    return data;
  },

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
  },

  getByRestaurant: async (restaurantId: string): Promise<CategoryDto[]> => {
    const { data } = await api.get(`/categories/restaurant/${restaurantId}`);
    return data;
  },

  getTreeByRestaurant: async (restaurantId: string): Promise<CategoryDto[]> => {
    const { data } = await api.get(`/categories/restaurant/${restaurantId}/tree`);
    return data;
  },

  getByRestaurantAndLevel: async (restaurantId: string, level: number = 1): Promise<CategoryDto[]> => {
    const allCategories = await CategoryService.getTreeByRestaurant(restaurantId);

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

  getAllFlatByRestaurant: async (restaurantId: string): Promise<CategoryDto[]> => {
    const tree = await CategoryService.getTreeByRestaurant(restaurantId);

    const flattenCategories = (categories: CategoryDto[]): CategoryDto[] => {
      return categories.flatMap(category => [
        { ...category, children: undefined },
        ...flattenCategories(category.children || [])
      ]);
    };

    return flattenCategories(tree);
  },

  addToRestaurant: async (categoryId: string, restaurantId: string): Promise<CategoryDto> => {
    const category = await CategoryService.getById(categoryId);
    const currentRestaurantIds = category.restaurants?.map(r => r.id) || [];
    
    if (!currentRestaurantIds.includes(restaurantId)) {
      const updatedRestaurantIds = [...currentRestaurantIds, restaurantId];
      return CategoryService.update(categoryId, { restaurantIds: updatedRestaurantIds });
    }
    
    return category;
  },

  removeFromRestaurant: async (categoryId: string, restaurantId: string): Promise<CategoryDto> => {
    const category = await CategoryService.getById(categoryId);
    const currentRestaurantIds = category.restaurants?.map(r => r.id) || [];
    
    const updatedRestaurantIds = currentRestaurantIds.filter(id => id !== restaurantId);
    return CategoryService.update(categoryId, { restaurantIds: updatedRestaurantIds });
  },

  updateRestaurantCategories: async (restaurantId: string, categoryIds: string[]): Promise<void> => {
    const currentCategories = await CategoryService.getByRestaurant(restaurantId);
    
    const categoriesToRemove = currentCategories.filter(cat => !categoryIds.includes(cat.id!));
    
    const categoriesToAdd = categoryIds.filter(id => 
      !currentCategories.some(cat => cat.id === id)
    );

    for (const category of categoriesToRemove) {
      await CategoryService.removeFromRestaurant(category.id!, restaurantId);
    }

    for (const categoryId of categoriesToAdd) {
      await CategoryService.addToRestaurant(categoryId, restaurantId);
    }
  },

 getByNetwork: async (networkId: string): Promise<CategoryDto[]> => {
    const { data } = await api.get(`/categories/network/${networkId}`);
    return data;
  },

  getTreeByNetwork: async (networkId: string): Promise<CategoryDto[]> => {
    const { data } = await api.get(`/categories/network/${networkId}/tree`);
    return data;
  },

  normalizeRestaurantOrders: async (restaurantId: string, parentId?: string): Promise<number> => {
    const { data } = await api.post('/categories/normalize-orders', { parentId });
    return data;
  },

  normalizeRestaurantClientOrders: async (restaurantId: string, parentId?: string): Promise<number> => {
    const { data } = await api.post('/categories/normalize-client-orders', { parentId });
    return data;
  }

};