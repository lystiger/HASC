// frontend/src/api/categoryService.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type { Category } from '../types/category';

export type CategoryCreateInput = {
  code: string;
  name_en: string;
  name_vi: string;
};

export type CategoryUpdateInput = {
  name_en?: string;
  name_vi?: string;
};

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

export const createCategory = async (payload: CategoryCreateInput): Promise<Category> => {
  const response = await apiClient<Category>('/api/v1/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to create category');
};

export const updateCategory = async (
  categoryId: number,
  payload: CategoryUpdateInput
): Promise<Category> => {
  const response = await apiClient<Category>(`/api/v1/categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to update category');
};

export const deleteCategory = async (categoryId: number): Promise<void> => {
  const response = await apiClient<null>(`/api/v1/categories/${categoryId}`, {
    method: 'DELETE',
  });
  if (response.status === 204 || response.status === 200) {
    return;
  }
  throw new Error(response.message || 'Failed to delete category');
};
