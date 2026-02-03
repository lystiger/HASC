// frontend/src/api/productService.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type { Product } from '../types/product';

interface FetchProductsParams {
  category_ids?: string[];
  // Add other filter parameters as needed (e.g., search, min_price, max_price)
}

const fetchProducts = async (params: FetchProductsParams): Promise<Product[]> => {
  const queryParams = new URLSearchParams();
  params.category_ids?.forEach(id => queryParams.append('category_ids', id));
  // Add other params to queryParams

  const queryString = queryParams.toString();
  const endpoint = `/api/v1/products${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient<Product[]>(endpoint);
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to fetch products');
};

export const useProducts = (params: FetchProductsParams) => {
  return useQuery<Product[], Error>({
    queryKey: ['products', params], // Query key includes params for re-fetching when params change
    queryFn: () => fetchProducts(params),
  });
};
