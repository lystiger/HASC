// frontend/src/components/ProductUploadForm.tsx
import React, { useState } from 'react';
import { useCategories } from '../api/categoryService';
import { apiClient } from '../api/apiClient';
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface ProductUploadFormProps {
  onUploadSuccess: (productId: string, taskIds: string[]) => void;
}

const ProductUploadForm: React.FC<ProductUploadFormProps> = ({ onUploadSuccess }) => {
  const { t } = useTranslation(); // Initialize useTranslation
  const { data: categories, isLoading: isLoadingCategories, isError: isErrorCategories, error: categoriesError } = useCategories();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!name || !description || price === '' || !categoryId || !imageFile) {
      setError(t('common.fill_all_fields'));
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price.toString());
    formData.append('category_id', categoryId);
    formData.append('image', imageFile);

    try {
      // Assuming a /v1/products endpoint for creating products
      const response = await apiClient<{ product_id: string; task_ids: string[] }>('/api/v1/products', {
        method: 'POST',
        body: formData,
      });

      if (response.status === 202 && response.productId && response.taskIds) {
        onUploadSuccess(response.productId, response.taskIds);
        // Clear form
        setName('');
        setDescription('');
        setPrice('');
        setCategoryId('');
        setImageFile(null);
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
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            {t('common.price')}
          </label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            step="0.01"
            required
          />
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
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            >
              <option value="">{t('common.select_category')}</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
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
            onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-orange-safety file:text-white
              hover:file:bg-orange-600"
            required
          />
        </div>
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}
        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          {isLoading ? t('common.uploading') : t('common.upload_product')}
        </button>
      </form>
    </div>
  );
};

export default ProductUploadForm;
