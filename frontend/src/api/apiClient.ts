// frontend/src/api/apiClient.ts

interface ApiResponse<T> {
  data: T | null;
  status: number;
  message: string | null;
  // Add product_id and task_ids for 202 responses
  productId?: string;
  taskIds?: string[];
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const isFormData =
    typeof FormData !== 'undefined' && options?.body instanceof FormData;
  const token =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('access_token') || window.localStorage.getItem('token')
      : null;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, config);

    if (response.status === 202) {
      // Handle 202 Accepted status:
      // The design doc states: "Backend returns product_id and task_ids."
      // Assuming these are in the response body.
      const result = await response.json();
      return {
        data: null, // No immediate data, as processing is ongoing
        status: response.status,
        message: 'Request accepted for processing.',
        productId: result.product_id,
        taskIds: result.task_ids,
      };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return {
        data: null,
        status: response.status,
        message: errorData.detail || 'An error occurred.',
      };
    }

    const data: T = await response.json();
    return {
      data,
      status: response.status,
      message: 'Success',
    };
  } catch (error) {
    console.error('API client error:', error);
    return {
      data: null,
      status: 500,
      message: error instanceof Error ? error.message : 'Network error or unknown issue.',
    };
  }
}
