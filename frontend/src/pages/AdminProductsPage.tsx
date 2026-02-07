// frontend/src/pages/AdminProductsPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProductById, updateProductById, useProducts } from '../api/productService';
import { useCategories } from '../api/categoryService';
import type { Product } from '../types/product';
import { getCategoryDisplayNameByCode } from '../utils/categoryDisplay';
import { getProductDisplayName } from '../utils/productDisplay';
import { apiClient } from '../api/apiClient';
import { resolveMediaUrl } from '../utils/media';
import { Link } from 'react-router-dom';

const buildCsv = (rows: string[][]) =>
  rows
    .map((row) =>
      row
        .map((cell) => {
          const safe = String(cell ?? '');
          if (safe.includes('"') || safe.includes(',') || safe.includes('\n')) {
            return `"${safe.replace(/"/g, '""')}"`;
          }
          return safe;
        })
        .join(',')
    )
    .join('\n');

const downloadCsv = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const AdminProductsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const [searchName, setSearchName] = useState('');
  const [searchSku, setSearchSku] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editValues, setEditValues] = useState({
    sku: '',
    name_en: '',
    name_vi: '',
    description_en: '',
    description_vi: '',
    category: '',
    status: '',
    images: [] as Product['images'],
  });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [editMessage, setEditMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [pendingImageCount, setPendingImageCount] = useState(0);
  const [baseImageCount, setBaseImageCount] = useState(0);
  const [showProcessingIndicator, setShowProcessingIndicator] = useState(false);
  const [processingCountdownMs, setProcessingCountdownMs] = useState(0);
  const processingDisplayMs = 10000;

  const { data: products, isLoading, isError, error } = useProducts({
    category: categoryFilter || undefined,
    name: searchName || undefined,
    sku: searchSku || undefined,
    status: statusFilter || undefined,
  });

  const { data: refreshedProduct } = useQuery({
    queryKey: ['product', editingProduct?.id, 'edit'],
    queryFn: () => fetchProductById(String(editingProduct?.id)),
    enabled: Boolean(editingProduct),
    refetchInterval: isProcessingImages ? 2000 : false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await apiClient(`/api/v1/products/${productId}`, { method: 'DELETE' });
      if (response.status === 204 || response.status === 200) {
        return;
      }
      throw new Error(response.message || 'Failed to delete product');
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const previous = queryClient.getQueryData<Product[]>(['products', {
        category: categoryFilter || undefined,
        name: searchName || undefined,
        sku: searchSku || undefined,
        status: statusFilter || undefined,
      }]);
      queryClient.setQueryData<Product[]>(
        ['products', {
          category: categoryFilter || undefined,
          name: searchName || undefined,
          sku: searchSku || undefined,
          status: statusFilter || undefined,
        }],
        (old) => old?.filter((item) => item.id !== productId) ?? []
      );
      return { previous };
    },
    onError: (err, _productId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['products', {
          category: categoryFilter || undefined,
          name: searchName || undefined,
          sku: searchSku || undefined,
          status: statusFilter || undefined,
        }], context.previous);
      }
      setErrorMessage((err as Error).message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditValues({
      sku: product.sku,
      name_en: product.name_en,
      name_vi: product.name_vi,
      description_en: product.description_en,
      description_vi: product.description_vi,
      category: product.category,
      status: product.status,
      images: product.images || [],
    });
    setActiveImageIndex(0);
    setEditMessage('');
    setSaveMessage('');
    setIsProcessingImages(false);
    setPendingImageCount(0);
    setBaseImageCount(product.images?.length ?? 0);
    setShowProcessingIndicator(false);
    setProcessingCountdownMs(0);
  };

  const handleSetMainImage = (index: number) => {
    if (!editValues.images || editValues.images.length === 0) {
      return;
    }
    const nextImages = [...editValues.images];
    const [selected] = nextImages.splice(index, 1);
    nextImages.unshift(selected);
    setEditValues((prev) => ({ ...prev, images: nextImages }));
    setActiveImageIndex(0);
  };

  const handleSave = async () => {
    if (!editingProduct) {
      return;
    }
    setIsSaving(true);
    setEditMessage('');
    setSaveMessage('');
    try {
      await updateProductById(String(editingProduct.id), {
        sku: editValues.sku,
        name_en: editValues.name_en,
        name_vi: editValues.name_vi,
        description_en: editValues.description_en,
        description_vi: editValues.description_vi,
        category: editValues.category,
        status: editValues.status as Product['status'],
        images: editValues.images,
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSaveMessage(t('admin.products.save_success', { defaultValue: 'Product updated.' }));
      setEditingProduct(null);
    } catch (err) {
      setEditMessage((err as Error).message || t('admin.products.save_error', { defaultValue: 'Failed to save.' }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddImages = async (files: FileList | null) => {
    if (!files || !editingProduct) {
      return;
    }
    const filesToUpload = Array.from(files);
    if (filesToUpload.length === 0) {
      return;
    }
    const formData = new FormData();
    filesToUpload.forEach((file) => {
      formData.append('images', file);
    });
    setIsUploadingImages(true);
    setEditMessage('');
    try {
      const response = await apiClient(`/api/v1/products/${editingProduct.id}/images`, {
        method: 'POST',
        body: formData,
      });
      if (response.status === 202) {
        setEditMessage(t('admin.products.images_queued', { defaultValue: 'Images queued for processing.' }));
        setBaseImageCount(editValues.images.length);
        setPendingImageCount(filesToUpload.length);
        setIsProcessingImages(true);
        setShowProcessingIndicator(true);
        setProcessingCountdownMs(processingDisplayMs);
        queryClient.invalidateQueries({ queryKey: ['products'] });
      } else {
        setEditMessage(response.message || t('admin.products.images_error', { defaultValue: 'Failed to add images.' }));
      }
    } catch (err) {
      setEditMessage((err as Error).message || t('admin.products.images_error', { defaultValue: 'Failed to add images.' }));
    } finally {
      setIsUploadingImages(false);
    }
  };

  useEffect(() => {
    if (!isProcessingImages || !refreshedProduct) {
      return;
    }
    if (refreshedProduct.images.length >= baseImageCount + pendingImageCount) {
      setEditValues((prev) => ({ ...prev, images: refreshedProduct.images }));
      setIsProcessingImages(false);
      setPendingImageCount(0);
      setShowProcessingIndicator(false);
      setProcessingCountdownMs(0);
      setEditMessage(t('admin.products.images_done', { defaultValue: 'Images processed.' }));
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  }, [
    isProcessingImages,
    refreshedProduct,
    baseImageCount,
    pendingImageCount,
    queryClient,
    t,
  ]);

  useEffect(() => {
    if (!showProcessingIndicator) {
      return;
    }
    const start = Date.now();
    const end = start + processingDisplayMs;
    setProcessingCountdownMs(processingDisplayMs);
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, end - Date.now());
      setProcessingCountdownMs(remaining);
      if (remaining === 0) {
        setShowProcessingIndicator(false);
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, [showProcessingIndicator, processingDisplayMs]);

  useEffect(() => {
    if (!saveMessage) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setSaveMessage('');
    }, 4000);
    return () => window.clearTimeout(timeout);
  }, [saveMessage]);

  const filteredProducts = products ?? [];
  const totalCount = filteredProducts.length;

  const handleDelete = (productId: number) => {
    if (!window.confirm(t('admin.products.delete_confirm', { defaultValue: 'Delete this product?' }))) {
      return;
    }
    setErrorMessage('');
    deleteMutation.mutate(productId);
  };

  const handleExport = () => {
    const rows = [
      [
        'id',
        'sku',
        'name_en',
        'name_vi',
        'category_code',
        'category_label',
        'status',
        'updated_at',
      ],
      ...filteredProducts.map((product) => [
        product.id,
        product.sku,
        product.name_en,
        product.name_vi,
        product.category,
        getCategoryDisplayNameByCode(categories, product.category, i18n.resolvedLanguage ?? 'en'),
        product.status,
        product.updated_at,
      ]),
    ];
    const csv = buildCsv(rows as string[][]);
    downloadCsv('products.csv', csv);
  };

  const statusOptions = ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'FAILED'];

  return (
    <div className="container mx-auto px-6 py-8 max-w-screen-xl font-sans">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-industrial">
            {t('admin.products.title', { defaultValue: 'Product Manager' })}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('admin.products.subtitle', { defaultValue: 'Manage live products and clean up old entries.' })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 hover:border-orange-300 hover:text-orange-600"
          >
            {t('admin.products.export', { defaultValue: 'Export CSV' })}
          </button>
          <Link
            to="/admin"
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 hover:border-orange-300 hover:text-orange-600"
          >
            {t('admin.products.back_to_admin', { defaultValue: 'Back to Admin' })}
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {t('admin.products.filter_name', { defaultValue: 'Name' })}
            <input
              type="text"
              value={searchName}
              onChange={(event) => setSearchName(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
              placeholder={t('admin.products.filter_name_placeholder', { defaultValue: 'Search by name' })}
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {t('admin.products.filter_sku', { defaultValue: 'SKU' })}
            <input
              type="text"
              value={searchSku}
              onChange={(event) => setSearchSku(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
              placeholder={t('admin.products.filter_sku_placeholder', { defaultValue: 'Search by SKU' })}
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {t('admin.products.filter_category', { defaultValue: 'Category' })}
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="">{t('admin.products.filter_all', { defaultValue: 'All' })}</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.code}>
                  {getCategoryDisplayNameByCode(categories, category.code, i18n.resolvedLanguage ?? 'en')}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {t('admin.products.filter_status', { defaultValue: 'Status' })}
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="">{t('admin.products.filter_all', { defaultValue: 'All' })}</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {t(`status.${status}`, { defaultValue: status })}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 text-xs text-slate-400">
          {t('admin.products.results', { defaultValue: 'Results' })}: {totalCount}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {saveMessage && <p className="mb-3 text-xs text-emerald-600">{saveMessage}</p>}
        {isLoading && (
          <p className="text-sm text-slate-500">
            {t('admin.products.loading', { defaultValue: 'Loading products...' })}
          </p>
        )}
        {isError && (
          <p className="text-sm text-red-600">
            {t('admin.products.error_load', { defaultValue: 'Failed to load products.' })}: {error?.message}
          </p>
        )}
        {!isLoading && !isError && filteredProducts.length === 0 && (
          <p className="text-sm text-slate-500">
            {t('admin.products.empty', { defaultValue: 'No products found.' })}
          </p>
        )}
        {!isLoading && !isError && filteredProducts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-600">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="py-3 pr-4">{t('admin.products.table_image', { defaultValue: 'Image' })}</th>
                  <th className="py-3 pr-4">{t('admin.products.table_name', { defaultValue: 'Name' })}</th>
                  <th className="py-3 pr-4">{t('admin.products.table_sku', { defaultValue: 'SKU' })}</th>
                  <th className="py-3 pr-4">{t('admin.products.table_category', { defaultValue: 'Category' })}</th>
                  <th className="py-3 pr-4">{t('admin.products.table_status', { defaultValue: 'Status' })}</th>
                  <th className="py-3 pr-4">{t('admin.products.table_updated', { defaultValue: 'Updated' })}</th>
                  <th className="py-3">{t('admin.products.table_actions', { defaultValue: 'Actions' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="py-3 pr-4">
                      <div className="h-12 w-12 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                        <img
                          src={resolveMediaUrl(product.images?.[0]?.thumb_url || product.images?.[0]?.web_url)}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-slate-700">
                      {getProductDisplayName(product, i18n.resolvedLanguage ?? 'en')}
                    </td>
                    <td className="py-3 pr-4">{product.sku}</td>
                    <td className="py-3 pr-4">
                      {getCategoryDisplayNameByCode(categories, product.category, i18n.resolvedLanguage ?? 'en')}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {t(`status.${product.status}`, { defaultValue: product.status })}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-400">
                      {new Date(product.updated_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 hover:border-orange-300 hover:text-orange-600"
                        >
                          {t('admin.products.edit', { defaultValue: 'Edit' })}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-600 hover:border-red-300"
                        >
                          {t('admin.products.delete', { defaultValue: 'Delete' })}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {errorMessage && <p className="mt-3 text-xs text-red-600">{errorMessage}</p>}
      </div>

      {editingProduct && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {t('admin.products.edit_title', { defaultValue: 'Edit Product' })} #{editingProduct.id}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {t('admin.products.edit_subtitle', { defaultValue: 'Update details and reorder images.' })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-md border border-orange-600 bg-orange-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-orange-700 hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving
                  ? t('admin.products.saving', { defaultValue: 'Saving...' })
                  : t('admin.products.save', { defaultValue: 'Save' })}
              </button>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 hover:border-slate-300"
              >
                {t('admin.products.cancel', { defaultValue: 'Cancel' })}
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-600">
              {t('admin.products.field_name_en', { defaultValue: 'Product Name (EN)' })}
              <input
                type="text"
                value={editValues.name_en}
                onChange={(event) => setEditValues((prev) => ({ ...prev, name_en: event.target.value }))}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
              />
            </label>
            <label className="text-sm text-slate-600">
              {t('admin.products.field_name_vi', { defaultValue: 'Product Name (VI)' })}
              <input
                type="text"
                value={editValues.name_vi}
                onChange={(event) => setEditValues((prev) => ({ ...prev, name_vi: event.target.value }))}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
              />
            </label>
            <label className="text-sm text-slate-600 md:col-span-2">
              {t('admin.products.field_sku', { defaultValue: 'SKU' })}
              <input
                type="text"
                value={editValues.sku}
                onChange={(event) => setEditValues((prev) => ({ ...prev, sku: event.target.value }))}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
              />
            </label>
            <label className="text-sm text-slate-600">
              {t('admin.products.field_description_en', { defaultValue: 'Description (EN)' })}
              <textarea
                value={editValues.description_en}
                onChange={(event) => setEditValues((prev) => ({ ...prev, description_en: event.target.value }))}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                rows={4}
              />
            </label>
            <label className="text-sm text-slate-600">
              {t('admin.products.field_description_vi', { defaultValue: 'Description (VI)' })}
              <textarea
                value={editValues.description_vi}
                onChange={(event) => setEditValues((prev) => ({ ...prev, description_vi: event.target.value }))}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                rows={4}
              />
            </label>
            <label className="text-sm text-slate-600">
              {t('admin.products.field_category', { defaultValue: 'Category' })}
              <select
                value={editValues.category}
                onChange={(event) => setEditValues((prev) => ({ ...prev, category: event.target.value }))}
                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                {categories?.map((category) => (
                  <option key={category.id} value={category.code}>
                    {getCategoryDisplayNameByCode(categories, category.code, i18n.resolvedLanguage ?? 'en')}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              {t('admin.products.field_status', { defaultValue: 'Status' })}
              <select
                value={editValues.status}
                onChange={(event) => setEditValues((prev) => ({ ...prev, status: event.target.value }))}
                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {t(`status.${status}`, { defaultValue: status })}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="aspect-square w-full overflow-hidden rounded-md bg-white">
                  <img
                    src={resolveMediaUrl(editValues.images?.[activeImageIndex]?.web_url)}
                    alt={editingProduct.name}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {t('admin.products.images_title', { defaultValue: 'Images' })}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <label className="inline-flex items-center justify-center rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 hover:border-orange-300 hover:text-orange-600">
                  {isUploadingImages
                    ? t('admin.products.images_uploading', { defaultValue: 'Uploading...' })
                    : t('admin.products.images_add', { defaultValue: 'Add Images' })}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      handleAddImages(event.target.files);
                      event.currentTarget.value = '';
                    }}
                    disabled={isUploadingImages}
                  />
                </label>
                {isProcessingImages && (
                  showProcessingIndicator && (
                    <span className="inline-flex items-center gap-2 text-[11px] text-orange-500">
                      <span
                        className="relative flex h-4 w-4 items-center justify-center"
                        aria-hidden="true"
                      >
                        <span
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `conic-gradient(#f97316 ${
                              Math.round((processingCountdownMs / processingDisplayMs) * 360)
                            }deg, rgba(249, 115, 22, 0.2) ${
                              Math.round((processingCountdownMs / processingDisplayMs) * 360)
                            }deg)`,
                          }}
                        />
                        <span className="absolute inset-0 rounded-full border border-orange-200" />
                        <span className="relative z-10 text-[8px] font-semibold text-orange-700">
                          {Math.max(0, Math.ceil(processingCountdownMs / 1000))}
                        </span>
                      </span>
                      {t('admin.products.images_processing', {
                        defaultValue: 'Processing {{count}} image(s)...',
                        count: pendingImageCount,
                      })}
                    </span>
                  )
                )}
                <span className="text-[11px] text-slate-400">
                  {t('admin.products.images_hint', { defaultValue: 'New images will process in the background.' })}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {editValues.images.map((img, idx) => (
                  <div key={`${img.web_url}-${idx}`} className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`h-20 w-full overflow-hidden rounded-md border ${
                        idx === activeImageIndex ? 'border-orange-500' : 'border-slate-200'
                      }`}
                    >
                      <img
                        src={resolveMediaUrl(img.thumb_url || img.web_url)}
                        alt={`${editingProduct.name} ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextImages = editValues.images.filter((_, imageIndex) => imageIndex !== idx);
                        setEditValues((prev) => ({ ...prev, images: nextImages }));
                        setActiveImageIndex(0);
                      }}
                      className="absolute right-1 top-1 rounded-full bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-white"
                    >
                      {t('admin.products.images_remove', { defaultValue: 'Remove' })}
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleSetMainImage(activeImageIndex)}
                className="mt-3 w-full rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 hover:border-orange-300 hover:text-orange-600"
              >
                {t('admin.products.set_main', { defaultValue: 'Set as Main' })}
              </button>
            </div>
          </div>
          {editMessage && <p className="mt-3 text-xs text-slate-500">{editMessage}</p>}
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
