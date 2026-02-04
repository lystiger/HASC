// frontend/src/hooks/useProductPolling.ts
import { useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useTaskMonitoring } from '../context/TaskMonitoringContext';
import type { Product, ProductStatus } from '../types/product';
import { apiClient } from '../api/apiClient';
import { TASK_STATUS } from '../types/task';

interface ProductPollingOptions {
  productId: string;
  taskId: string;
  onSuccess?: (product: Product) => void;
  onError?: (error: Error) => void;
}

const fetchProductStatus = async (productId: string): Promise<Product> => {
  const response = await apiClient<Product>(`/api/v1/products/${productId}`);
  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to fetch product status');
};

export const useProductPolling = ({ productId, taskId, onSuccess, onError }: ProductPollingOptions) => {
  const { updateTaskStatus } = useTaskMonitoring();
  const queryClient = useQueryClient();

  const { data: product, status, error, isSuccess, isError, isFetchedAfterMount } = useQuery<Product, Error>({
    queryKey: ['productStatus', productId],
    queryFn: () => fetchProductStatus(productId),
    enabled: !!productId, // Only enable if productId is available
    refetchInterval: 2000, // Poll every 2 seconds as per design.md
    retry: false, // Do not retry on failure, let the task status handle it
    select: (data) => {
      // Ensure we only return necessary data to avoid unnecessary re-renders
      return data;
    },
  });

  useEffect(() => {
    if (!product || !isFetchedAfterMount) return;

    const terminalStatuses: ProductStatus[] = ['PUBLISHED', 'ARCHIVED', 'FAILED'];

    if (terminalStatuses.includes(product.status)) {
      queryClient.invalidateQueries({ queryKey: ['productStatus', productId] }); // Stop polling
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Invalidate product list to show updated product

      if (product.status === 'PUBLISHED') {
        updateTaskStatus(taskId, TASK_STATUS.COMPLETED, `Product "${product.name}" published.`);
        onSuccess?.(product);
      } else if (product.status === 'ARCHIVED') {
        updateTaskStatus(taskId, TASK_STATUS.COMPLETED, `Product "${product.name}" archived.`);
        onSuccess?.(product);
      } else if (product.status === 'FAILED') {
        updateTaskStatus(taskId, TASK_STATUS.FAILED, `Product "${product.name}" failed to process.`);
        onError?.(new Error(`Product processing failed for ${product.name}`));
      }
    } else {
      updateTaskStatus(taskId, TASK_STATUS.IN_PROGRESS, `Processing product "${product.name}"... Status: ${product.status}`);
    }
  }, [product, isFetchedAfterMount, updateTaskStatus, taskId, onSuccess, onError, queryClient]);

  useEffect(() => {
    if (isError) {
      updateTaskStatus(taskId, TASK_STATUS.FAILED, `Polling failed: ${error?.message}`);
      onError?.(error);
    }
  }, [isError, error, updateTaskStatus, taskId, onError]);

  return { product, status, error };
};
