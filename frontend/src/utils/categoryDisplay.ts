import type { Category } from '../types/category';

export const getCategoryDisplayName = (category: Category, language: string) => {
  const isVietnamese = language?.toLowerCase().startsWith('vi');
  if (isVietnamese) {
    return category.name_vi || category.name_en || category.code;
  }
  return category.name_en || category.name_vi || category.code;
};

export const getCategoryDisplayNameByCode = (
  categories: Category[] | undefined,
  code: string,
  language: string
) => {
  const match = categories?.find((category) => category.code === code);
  if (!match) {
    return code;
  }
  return getCategoryDisplayName(match, language);
};
