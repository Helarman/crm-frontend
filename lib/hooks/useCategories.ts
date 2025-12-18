import useSWR from 'swr';
import { CategoryService } from '@/lib/api/category.service';

export const useCategories = () => {
  return useSWR('categories', () => CategoryService.getAll());
};