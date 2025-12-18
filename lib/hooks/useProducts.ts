import useSWR from 'swr';
import { ProductService } from '@/lib/api/product.service';

export const useProducts = (categoryId?: string) => {
  return useSWR(
    ['products', categoryId], 
    () => categoryId ? ProductService.getByCategory(categoryId) : [],
    {
      revalidateOnFocus: false
    }
  );
};