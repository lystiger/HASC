// frontend/src/pages/AdminCategoriesPage.tsx
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  deleteCategory,
  updateCategory,
  useCategories,
} from '../api/categoryService';
import type { Category } from '../types/category';

const normalizeCode = (value: string) => {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9_]+/g, '_').replace(/_+/g, '_');
  return normalized.replace(/^_+|_+$/g, '');
};

const AdminCategoriesPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: categories, isLoading, isError, error } = useCategories();
  const [formValues, setFormValues] = useState({ code: '', name_en: '', name_vi: '' });
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({ name_en: '', name_vi: '' });
  const [rowError, setRowError] = useState('');

  const sortedCategories = useMemo(() => {
    return [...(categories ?? [])].sort((a, b) => a.code.localeCompare(b.code));
  }, [categories]);

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setFormValues({ code: '', name_en: '', name_vi: '' });
      setFormError('');
    },
    onError: (err) => {
      setFormError((err as Error).message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { name_en: string; name_vi: string } }) =>
      updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditingId(null);
      setRowError('');
    },
    onError: (err) => {
      setRowError((err as Error).message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setRowError('');
    },
    onError: (err) => {
      setRowError((err as Error).message);
    },
  });

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    const code = normalizeCode(formValues.code.trim());
    const nameEn = formValues.name_en.trim();
    const nameVi = formValues.name_vi.trim();
    if (!code || !nameEn || !nameVi) {
      setFormError(t('admin.categories.error_save', { defaultValue: 'Failed to save category.' }));
      return;
    }
    if (!/^[A-Z0-9_]+$/.test(code)) {
      setFormError(t('admin.categories.code_help', { defaultValue: 'Uppercase letters, numbers, underscore.' }));
      return;
    }
    createMutation.mutate({ code, name_en: nameEn, name_vi: nameVi });
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditValues({ name_en: category.name_en, name_vi: category.name_vi });
    setRowError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setRowError('');
  };

  const handleSave = (categoryId: number) => {
    const nameEn = editValues.name_en.trim();
    const nameVi = editValues.name_vi.trim();
    if (!nameEn || !nameVi) {
      setRowError(t('admin.categories.error_save', { defaultValue: 'Failed to save category.' }));
      return;
    }
    updateMutation.mutate({ id: categoryId, payload: { name_en: nameEn, name_vi: nameVi } });
  };

  const handleDelete = (categoryId: number) => {
    const shouldDelete = window.confirm(
      t('admin.categories.delete_confirm', { defaultValue: 'Delete this category?' })
    );
    if (!shouldDelete) {
      return;
    }
    deleteMutation.mutate(categoryId);
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-screen-xl font-sans">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-industrial">
          {t('admin.categories.title', { defaultValue: 'Category Manager' })}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {t('admin.categories.subtitle', {
            defaultValue: 'Maintain bilingual category labels for the catalog and inquiry form.',
          })}
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {t('admin.categories.create_title', { defaultValue: 'Add Category' })}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {t('admin.categories.code_help', { defaultValue: 'Uppercase letters, numbers, underscore.' })}
            </p>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center justify-center rounded-md border border-orange-600 bg-orange-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-orange-700 hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {t('admin.categories.create', { defaultValue: 'Create' })}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="text-sm text-slate-600">
            {t('admin.categories.code', { defaultValue: 'Code' })}
            <input
              type="text"
              value={formValues.code}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, code: normalizeCode(event.target.value) }))
              }
              placeholder={t('admin.categories.code_placeholder', { defaultValue: 'e.g., PACKAGING' })}
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="text-sm text-slate-600">
            {t('admin.categories.name_en', { defaultValue: 'English Name' })}
            <input
              type="text"
              value={formValues.name_en}
              onChange={(event) => setFormValues((prev) => ({ ...prev, name_en: event.target.value }))}
              placeholder={t('admin.categories.name_en_placeholder', { defaultValue: 'e.g., Packaging' })}
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
          <label className="text-sm text-slate-600">
            {t('admin.categories.name_vi', { defaultValue: 'Vietnamese Name' })}
            <input
              type="text"
              value={formValues.name_vi}
              onChange={(event) => setFormValues((prev) => ({ ...prev, name_vi: event.target.value }))}
              placeholder={t('admin.categories.name_vi_placeholder', { defaultValue: 'e.g., Bao bi' })}
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </label>
        </div>
        {formError && (
          <p className="mt-3 text-xs text-red-600">{formError}</p>
        )}
      </form>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {isLoading && (
          <p className="text-sm text-slate-500">
            {t('admin.categories.loading', { defaultValue: 'Loading categories...' })}
          </p>
        )}
        {isError && (
          <p className="text-sm text-red-600">
            {t('admin.categories.error_load', { defaultValue: 'Failed to load categories.' })}: {error?.message}
          </p>
        )}
        {!isLoading && !isError && sortedCategories.length === 0 && (
          <p className="text-sm text-slate-500">
            {t('admin.categories.empty', { defaultValue: 'No categories yet.' })}
          </p>
        )}

        {!isLoading && !isError && sortedCategories.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-600">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="py-3 pr-4">{t('admin.categories.code', { defaultValue: 'Code' })}</th>
                  <th className="py-3 pr-4">{t('admin.categories.name_en', { defaultValue: 'English Name' })}</th>
                  <th className="py-3 pr-4">{t('admin.categories.name_vi', { defaultValue: 'Vietnamese Name' })}</th>
                  <th className="py-3 pr-4">{t('admin.categories.updated_at', { defaultValue: 'Updated' })}</th>
                  <th className="py-3">{t('admin.categories.actions', { defaultValue: 'Actions' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedCategories.map((category) => {
                  const isEditing = editingId === category.id;
                  return (
                    <tr key={category.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 font-semibold text-slate-700">{category.code}</td>
                      <td className="py-3 pr-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.name_en}
                            onChange={(event) =>
                              setEditValues((prev) => ({ ...prev, name_en: event.target.value }))
                            }
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700"
                          />
                        ) : (
                          category.name_en
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValues.name_vi}
                            onChange={(event) =>
                              setEditValues((prev) => ({ ...prev, name_vi: event.target.value }))
                            }
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700"
                          />
                        ) : (
                          category.name_vi
                        )}
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-400">
                        {new Date(category.updated_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        {isEditing ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleSave(category.id)}
                              className="rounded-md border border-orange-600 bg-orange-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-orange-700 hover:bg-orange-700"
                            >
                              {t('admin.categories.save', { defaultValue: 'Save' })}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 hover:border-slate-300"
                            >
                              {t('admin.categories.cancel', { defaultValue: 'Cancel' })}
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(category)}
                              className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 hover:border-orange-300 hover:text-orange-600"
                            >
                              {t('admin.categories.edit', { defaultValue: 'Edit' })}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(category.id)}
                              className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-600 hover:border-red-300"
                            >
                              {t('admin.categories.delete', { defaultValue: 'Delete' })}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {rowError && (
          <p className="mt-3 text-xs text-red-600">{rowError}</p>
        )}
      </div>
    </div>
  );
};

export default AdminCategoriesPage;
