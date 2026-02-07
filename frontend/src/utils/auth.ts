type JwtPayload = {
  role?: string;
  sub?: string;
  exp?: number;
};

const parseJwtPayload = (token: string): JwtPayload | null => {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '='));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
};

export const getStoredAccessToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return (
    window.localStorage.getItem('access_token') ||
    window.localStorage.getItem('token') ||
    null
  );
};

export const setStoredAccessToken = (token: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem('access_token', token);
  window.dispatchEvent(new Event('auth:changed'));
};

export const clearStoredAccessToken = () => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem('access_token');
  window.localStorage.removeItem('token');
  window.dispatchEvent(new Event('auth:changed'));
};

export const getStoredUserRole = (): string | null => {
  const token = getStoredAccessToken();
  if (!token) {
    return null;
  }
  const payload = parseJwtPayload(token);
  return payload?.role ?? null;
};
