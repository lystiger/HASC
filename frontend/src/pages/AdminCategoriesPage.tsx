// frontend/src/pages/AdminCategoriesPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  deleteCategory,
  updateCategory,
  useCategories,
} from '../api/categoryService';
import type { Category } from '../types/category';
import { getStoredUserRole } from '../utils/auth';
import { Link } from 'react-router-dom';

const normalizeCode = (value: string) => {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9_]+/g, '_').replace(/_+/g, '_');
  return normalized.replace(/^_+|_+$/g, '');
};

const parseCsv = (content: string) => {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      current.push(field);
      field = '';
      continue;
    }
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (field.length > 0 || current.length > 0) {
        current.push(field);
        rows.push(current);
        current = [];
        field = '';
      }
      continue;
    }
    field += char;
  }
  if (field.length > 0 || current.length > 0) {
    current.push(field);
    rows.push(current);
  }
  return rows.map((row) => row.map((cell) => cell.trim()));
};

const AdminCategoriesPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: categories, isLoading, isError, error } = useCategories();
  const [formValues, setFormValues] = useState({ code: '', name_en: '', name_vi: '' });
  const [formError, setFormError] = useState('');
  const [formFieldErrors, setFormFieldErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({ name_en: '', name_vi: '' });
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [rowError, setRowError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [importError, setImportError] = useState('');
  const [importSummary, setImportSummary] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const isAdmin = getStoredUserRole() === 'ADMIN';
  const sortedCategories = useMemo(() => {
    return [...(categories ?? [])].sort((a, b) => a.code.localeCompare(b.code));
  }, [categories]);

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setFormValues({ code: '', name_en: '', name_vi: '' });
      setFormError('');
      setFormFieldErrors({});
      setSaveMessage(t('admin.categories.save_success', { defaultValue: 'Category saved.' }));
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
      setSaveMessage(t('admin.categories.save_success', { defaultValue: 'Category saved.' }));
    },
    onError: (err) => {
      setRowError((err as Error).message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onMutate: async (categoryId: number) => {
      await queryClient.cancelQueries({ queryKey: ['categories'] });
      const previous = queryClient.getQueryData<Category[]>(['categories']);
      queryClient.setQueryData<Category[]>(
        ['categories'],
        (old) => old?.filter((item) => item.id !== categoryId) ?? []
      );
      return { previous };
    },
    onError: (err, _categoryId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['categories'], context.previous);
      }
      setRowError((err as Error).message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    const nextErrors: Record<string, string> = {};
    const code = normalizeCode(formValues.code.trim());
    const nameEn = formValues.name_en.trim();
    const nameVi = formValues.name_vi.trim();
    if (!code || !nameEn || !nameVi) {
      if (!code) {
        nextErrors.code = t('admin.categories.error_code_required', { defaultValue: 'Code is required.' });
      }
      if (!nameEn) {
        nextErrors.name_en = t('admin.categories.error_name_en_required', { defaultValue: 'English name is required.' });
      }
      if (!nameVi) {
        nextErrors.name_vi = t('admin.categories.error_name_vi_required', { defaultValue: 'Vietnamese name is required.' });
      }
      setFormFieldErrors(nextErrors);
      return;
    }
    if (!/^[A-Z0-9_]+$/.test(code)) {
      nextErrors.code = t('admin.categories.error_code_format', { defaultValue: 'Use uppercase letters, numbers, underscore.' });
      setFormFieldErrors(nextErrors);
      return;
    }
    setFormFieldErrors({});
    createMutation.mutate({ code, name_en: nameEn, name_vi: nameVi });
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditValues({ name_en: category.name_en, name_vi: category.name_vi });
    setEditFieldErrors({});
    setRowError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFieldErrors({});
    setRowError('');
  };

  const handleSave = (categoryId: number) => {
    const nextErrors: Record<string, string> = {};
    const nameEn = editValues.name_en.trim();
    const nameVi = editValues.name_vi.trim();
    if (!nameEn || !nameVi) {
      if (!nameEn) {
        nextErrors.name_en = t('admin.categories.error_name_en_required', { defaultValue: 'English name is required.' });
      }
      if (!nameVi) {
        nextErrors.name_vi = t('admin.categories.error_name_vi_required', { defaultValue: 'Vietnamese name is required.' });
      }
      setEditFieldErrors(nextErrors);
      return;
    }
    setEditFieldErrors({});
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

  useEffect(() => {
    if (!saveMessage) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setSaveMessage('');
    }, 4000);
    return () => window.clearTimeout(timeout);
  }, [saveMessage]);

  const handleCsvUpload = async (file: File) => {
    setImportError('');
    setImportSummary('');
    setIsImporting(true);
    try {
      const content = await file.text();
      const rows = parseCsv(content);
      if (rows.length < 2) {
        setImportError(t('admin.categories.import_error_empty', { defaultValue: 'CSV has no data rows.' }));
        return;
      }
      const header = rows[0].map((cell) => cell.toLowerCase());
      const codeIndex = header.indexOf('code');
      const enIndex = header.indexOf('name_en');
      const viIndex = header.indexOf('name_vi');
      if (codeIndex === -1 || enIndex === -1 || viIndex === -1) {
        setImportError(t('admin.categories.import_error_header', { defaultValue: 'CSV header must include code,name_en,name_vi.' }));
        return;
      }
      let created = 0;
      let failed = 0;
      for (let i = 1; i < rows.length; i += 1) {
        const row = rows[i];
        if (row.length === 0 || row.every((cell) => cell === '')) {
          continue;
        }
        const code = normalizeCode(row[codeIndex] ?? '');
        const nameEn = (row[enIndex] ?? '').trim();
        const nameVi = (row[viIndex] ?? '').trim();
        if (!code || !nameEn || !nameVi) {
          failed += 1;
          continue;
        }
        try {
          await createCategory({ code, name_en: nameEn, name_vi: nameVi });
          created += 1;
        } catch {
          failed += 1;
        }
      }
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setImportSummary(
        t('admin.categories.import_summary', {
          defaultValue: 'Imported {{created}}. Failed {{failed}}.',
          created,
          failed,
        })
      );
    } catch (err) {
      setImportError((err as Error).message);
    } finally {
      setIsImporting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-6 py-10 max-w-screen-md font-sans">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            {t('admin.categories.denied_title', { defaultValue: 'Admin Access Required' })}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {t('admin.categories.denied_body', {
              defaultValue: 'You need an admin account to manage categories.',
            })}
          </p>
          <Link
            to="/login?next=/admin/categories"
            className="mt-4 inline-flex items-center justify-center rounded-md border border-orange-600 bg-orange-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-orange-700 hover:bg-orange-700"
          >
            {t('auth.sign_in', { defaultValue: 'Sign In' })}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-screen-xl font-sans">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-industrial">
            {t('admin.categories.title', { defaultValue: 'Category Manager' })}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t('admin.categories.subtitle', {
              defaultValue: 'Maintain bilingual category labels for the catalog and inquiry form.',
            })}
          </p>
        </div>
        <Link
          to="/admin"
          className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 hover:border-orange-300 hover:text-orange-600"
        >
          {t('admin.categories.back_to_admin', { defaultValue: 'Back to Admin' })}
        </Link>
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
            {formFieldErrors.code && <span className="mt-1 block text-xs text-red-600">{formFieldErrors.code}</span>}
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
            {formFieldErrors.name_en && (
              <span className="mt-1 block text-xs text-red-600">{formFieldErrors.name_en}</span>
            )}
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
            {formFieldErrors.name_vi && (
              <span className="mt-1 block text-xs text-red-600">{formFieldErrors.name_vi}</span>
            )}
          </label>
        </div>
        {formError && (
          <p className="mt-3 text-xs text-red-600">{formError}</p>
        )}
      </form>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {t('admin.categories.import_title', { defaultValue: 'Bulk Import (CSV)' })}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {t('admin.categories.import_help', {
                defaultValue: 'Headers: code,name_en,name_vi',
              })}
            </p>
          </div>
          <label className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 hover:border-orange-300 hover:text-orange-600">
            {isImporting
              ? t('admin.categories.importing', { defaultValue: 'Importing...' })
              : t('admin.categories.import_button', { defaultValue: 'Upload CSV' })}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  handleCsvUpload(file);
                }
                event.currentTarget.value = '';
              }}
              disabled={isImporting}
            />
          </label>
        </div>
        {importError && <p className="mt-3 text-xs text-red-600">{importError}</p>}
        {importSummary && <p className="mt-3 text-xs text-emerald-600">{importSummary}</p>}
      </div>

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
                          <div>
                            <input
                              type="text"
                              value={editValues.name_en}
                              onChange={(event) =>
                                setEditValues((prev) => ({ ...prev, name_en: event.target.value }))
                              }
                              className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700"
                            />
                            {editFieldErrors.name_en && (
                              <span className="mt-1 block text-xs text-red-600">{editFieldErrors.name_en}</span>
                            )}
                          </div>
                        ) : (
                          category.name_en
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {isEditing ? (
                          <div>
                            <input
                              type="text"
                              value={editValues.name_vi}
                              onChange={(event) =>
                                setEditValues((prev) => ({ ...prev, name_vi: event.target.value }))
                              }
                              className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700"
                            />
                            {editFieldErrors.name_vi && (
                              <span className="mt-1 block text-xs text-red-600">{editFieldErrors.name_vi}</span>
                            )}
                          </div>
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
      {saveMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg">
          {saveMessage}
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
