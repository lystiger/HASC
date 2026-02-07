import type { Product } from '../types/product';

export const getProductDisplayName = (product: Product, language: string) => {
  const isVietnamese = language?.toLowerCase().startsWith('vi');
  if (isVietnamese) {
    return product.name_vi || product.name_en || product.name;
  }
  return product.name_en || product.name_vi || product.name;
};

export const getProductDisplayDescription = (product: Product, language: string) => {
  const isVietnamese = language?.toLowerCase().startsWith('vi');
  if (isVietnamese) {
    return product.description_vi || product.description_en || product.description || '';
  }
  return product.description_en || product.description_vi || product.description || '';
};
