export const resolveMediaUrl = (url: string | undefined | null) => {
  if (!url) {
    return '';
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    const base = import.meta.env.VITE_API_BASE_URL || '';
    return `${base}${url}`;
  }
  return url;
};
