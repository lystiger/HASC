// frontend/src/components/ProductUploadForm.tsx
import React, { useState } from 'react';
import { useCategories } from '../api/categoryService';
import { apiClient } from '../api/apiClient';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { getCategoryDisplayName } from '../utils/categoryDisplay';

interface ProductUploadFormProps {
  onUploadSuccess: (
    productId: string,
    taskIds: string[],
    details: {
      name_en: string;
      name_vi: string;
      sku: string;
      category: string;
      description_en: string;
      description_vi: string;
    }
  ) => void;
}

const ProductUploadForm: React.FC<ProductUploadFormProps> = ({ onUploadSuccess }) => {
  const { t, i18n } = useTranslation(); // Initialize useTranslation
  const { data: categories, isLoading: isLoadingCategories, isError: isErrorCategories, error: categoriesError } = useCategories();

  const [nameEn, setNameEn] = useState('');
  const [nameVi, setNameVi] = useState('');
  const [sku, setSku] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionVi, setDescriptionVi] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!sku || !nameEn || !nameVi || !descriptionEn || !descriptionVi || !categoryCode || imageFiles.length === 0) {
      setError(t('common.fill_all_fields'));
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('sku', sku);
    formData.append('name_en', nameEn);
    formData.append('name_vi', nameVi);
    formData.append('description_en', descriptionEn);
    formData.append('description_vi', descriptionVi);
    formData.append('category', categoryCode);
    formData.append('specific_attributes', JSON.stringify({}));
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    try {
      // Assuming a /v1/products endpoint for creating products
      const response = await apiClient<{ product_id: string; task_ids: string[] }>('/api/v1/products/', {
        method: 'POST',
        body: formData,
      });

      if (response.status === 202 && response.productId && response.taskIds) {
        onUploadSuccess(response.productId, response.taskIds, {
          name_en: nameEn,
          name_vi: nameVi,
          sku,
          category: categoryCode,
          description_en: descriptionEn,
          description_vi: descriptionVi,
        });
        // Clear form
        setSku('');
        setNameEn('');
        setNameVi('');
        setDescriptionEn('');
        setDescriptionVi('');
        setCategoryCode('');
        setImageFiles([]);
      } else if (response.message) {
        setError(response.message);
      } else {
        setError(t('common.an_error_occurred'));
      }
    } catch (err) {
      setError((err as Error).message || t('common.network_error_upload'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-slate-industrial mb-6">{t('common.upload_new_product')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label htmlFor="name-en" className="block text-sm font-medium text-gray-700">
            {t('common.product_name_en', { defaultValue: 'Product Name (EN)' })}
            <input
              type="text"
              id="name-en"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('common.product_name_hint', { defaultValue: 'Use the official product name customers recognize.' })}
            </p>
          </label>
          <label htmlFor="name-vi" className="block text-sm font-medium text-gray-700">
            {t('common.product_name_vi', { defaultValue: 'Product Name (VI)' })}
            <input
              type="text"
              id="name-vi"
              value={nameVi}
              onChange={(e) => setNameVi(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </label>
        </div>
        <div>
          <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
            SKU
          </label>
          <input
            type="text"
            id="sku"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            {t('common.sku_hint', { defaultValue: 'Short unique code (e.g., HASC-2024-001).' })}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label htmlFor="description-en" className="block text-sm font-medium text-gray-700">
            {t('common.description_en', { defaultValue: 'Description (EN)' })}
            <textarea
              id="description-en"
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            ></textarea>
            <p className="mt-1 text-xs text-gray-500">
              {t('common.description_hint', { defaultValue: 'Include key specs, usage, and material details.' })}
            </p>
          </label>
          <label htmlFor="description-vi" className="block text-sm font-medium text-gray-700">
            {t('common.description_vi', { defaultValue: 'Description (VI)' })}
            <textarea
              id="description-vi"
              value={descriptionVi}
              onChange={(e) => setDescriptionVi(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            ></textarea>
          </label>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            {t('common.category')}
          </label>
          {isLoadingCategories ? (
            <p className="mt-1 text-gray-500">{t('common.loading_categories')}</p>
          ) : isErrorCategories ? (
            <p className="mt-1 text-red-600">{t('common.error_loading_categories')}: {categoriesError?.message}</p>
          ) : (
            <select
              id="category"
              value={categoryCode}
              onChange={(e) => setCategoryCode(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              <option value="">{t('common.select_category')}</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.code}>
                  {getCategoryDisplayName(cat, i18n.resolvedLanguage ?? 'en')}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700">
            {t('common.product_image')}
          </label>
          <input
            type="file"
            id="image"
            accept="image/*" // Allow all image types, backend will convert to WebP
            multiple
            onChange={(e) => setImageFiles(e.target.files ? Array.from(e.target.files) : [])}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-slate-industrial file:text-white
              hover:file:bg-slate-900"
            required
          />
        </div>
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}
        <button
          type="submit"
          className="w-full py-2 px-4 rounded-md border border-orange-600 bg-orange-600 text-sm font-semibold text-white shadow-sm transition-colors hover:border-orange-700 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
          disabled={isLoading}
        >
          {isLoading ? t('common.uploading') : t('common.upload_product')}
        </button>
      </form>
    </div>
  );
};

export default ProductUploadForm;
