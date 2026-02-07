import { apiClient } from './apiClient';

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export const loginWithPassword = async (email: string, password: string): Promise<LoginResponse> => {
  const body = new URLSearchParams();
  body.set('username', email);
  body.set('password', password);

  const response = await apiClient<LoginResponse>('/api/v1/login/access-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Failed to login');
};
