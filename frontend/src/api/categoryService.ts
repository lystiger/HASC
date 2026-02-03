// frontend/src/api/categoryService.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type { Category } from '../types/category';

const fetchCategories = async (): Promise<Category[]> => {
  const response = await apiClient<Category[]>('/api/v1/categories');
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to fetch categories');
};

export const useCategories = () => {
  return useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
};
