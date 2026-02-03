// frontend/src/components/CategoryFilterSidebar.tsx
import React, { useState } from 'react';
import { useCategories } from '../api/categoryService';
import type { Category } from '../types/category';
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface CategoryFilterSidebarProps {
  onFilterChange: (selectedCategoryIds: string[]) => void;
}

const CategoryFilterSidebar: React.FC<CategoryFilterSidebarProps> = ({ onFilterChange }) => {
  const { t } = useTranslation(); // Initialize useTranslation
  const { data: categories, isLoading, isError, error } = useCategories();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const handleCheckboxChange = (categoryId: string) => {
    const newSelectedIds = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((id) => id !== categoryId)
      : [...selectedCategoryIds, categoryId];
    setSelectedCategoryIds(newSelectedIds);
    onFilterChange(newSelectedIds);
  };

  if (isLoading) {
    return (
      <div className="w-64 p-4 bg-white shadow-md rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">{t('common.categories')}</h3>
        <p>{t('common.loading_categories')}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-64 p-4 bg-white shadow-md rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">{t('common.categories')}</h3>
        <p className="text-red-600">{t('common.error_loading_categories')}: {error?.message}</p>
      </div>
    );
  }

  return (
    <div className="w-64 p-4 bg-white shadow-md rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{t('common.categories')}</h3>
      <div className="space-y-2">
        {categories?.map((category: Category) => (
          <label
            key={category.id}
            htmlFor={`category-${category.id}`}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
              selectedCategoryIds.includes(category.id)
                ? 'border-orange-safety bg-orange-50 text-orange-700'
                : 'border-transparent text-gray-700 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <input
              type="checkbox"
              id={`category-${category.id}`}
              checked={selectedCategoryIds.includes(category.id)}
              onChange={() => handleCheckboxChange(category.id)}
              className="h-4 w-4 text-orange-safety border-gray-300 rounded focus:ring-orange-safety"
            />
            <span className="text-sm">{category.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilterSidebar;
