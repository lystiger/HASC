// frontend/src/api/productService.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type { Product } from '../types/product';

interface FetchProductsParams {
  category?: string;
  name?: string;
  sku?: string;
  status?: string;
}

const fetchProducts = async (params: FetchProductsParams): Promise<Product[]> => {
  const queryParams = new URLSearchParams();
  if (params.category) {
    queryParams.set('category', params.category);
  }
  if (params.name) {
    queryParams.set('name', params.name);
  }
  if (params.sku) {
    queryParams.set('sku', params.sku);
  }
  if (params.status) {
    queryParams.set('status', params.status);
  }

  const queryString = queryParams.toString();
  const endpoint = `/api/v1/products${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient<Product[]>(endpoint);
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to fetch products');
};

export const fetchProductById = async (productId: string): Promise<Product> => {
  const response = await apiClient<Product>(`/api/v1/products/${productId}`);
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to fetch product');
};

export interface ProductUpdatePayload {
  sku?: string;
  name?: string;
  description?: string | null;
  name_en?: string;
  name_vi?: string;
  description_en?: string | null;
  description_vi?: string | null;
  images?: Product['images'];
  category?: string;
  status?: Product['status'];
  specific_attributes?: Record<string, unknown>;
}

export const updateProductById = async (
  productId: string,
  payload: ProductUpdatePayload
): Promise<Product> => {
  const response = await apiClient<Product>(`/api/v1/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to update product');
};

export const useProducts = (params: FetchProductsParams) => {
  return useQuery<Product[], Error>({
    queryKey: ['products', params], // Query key includes params for re-fetching when params change
    queryFn: () => fetchProducts(params),
  });
};

export const useProduct = (productId?: string) => {
  return useQuery<Product, Error>({
    queryKey: ['product', productId],
    queryFn: () => fetchProductById(productId ?? ''),
    enabled: Boolean(productId),
  });
};
