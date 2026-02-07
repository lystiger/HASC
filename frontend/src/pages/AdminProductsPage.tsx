// frontend/src/pages/AdminProductsPage.tsx
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProducts } from '../api/productService';
import { useCategories } from '../api/categoryService';
import type { Product } from '../types/product';
import { getCategoryDisplayNameByCode } from '../utils/categoryDisplay';
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

  const { data: products, isLoading, isError, error } = useProducts({
    category: categoryFilter || undefined,
    name: searchName || undefined,
    sku: searchSku || undefined,
    status: statusFilter || undefined,
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
        'name',
        'category_code',
        'category_label',
        'status',
        'updated_at',
      ],
      ...filteredProducts.map((product) => [
        product.id,
        product.sku,
        product.name,
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
                    <td className="py-3 pr-4 font-semibold text-slate-700">{product.name}</td>
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
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-600 hover:border-red-300"
                      >
                        {t('admin.products.delete', { defaultValue: 'Delete' })}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {errorMessage && <p className="mt-3 text-xs text-red-600">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default AdminProductsPage;
