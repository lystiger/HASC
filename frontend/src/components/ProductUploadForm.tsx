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
    details: { name: string; sku: string; category: string; description: string }
  ) => void;
}

const ProductUploadForm: React.FC<ProductUploadFormProps> = ({ onUploadSuccess }) => {
  const { t, i18n } = useTranslation(); // Initialize useTranslation
  const { data: categories, isLoading: isLoadingCategories, isError: isErrorCategories, error: categoriesError } = useCategories();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!sku || !name || !description || !categoryCode || imageFiles.length === 0) {
      setError(t('common.fill_all_fields'));
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('sku', sku);
    formData.append('name', name);
    formData.append('description', description);
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
          name,
          sku,
          category: categoryCode,
          description,
        });
        // Clear form
        setSku('');
        setName('');
        setDescription('');
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
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            {t('common.product_name')}
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
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
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            {t('common.description')}
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          ></textarea>
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
