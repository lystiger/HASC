// frontend/src/pages/AdminDashboardPage.tsx
import React, { useState } from 'react';
import ProductUploadForm from '../components/ProductUploadForm';
import { useTaskMonitoring } from '../context/TaskMonitoringContext';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { useCategories } from '../api/categoryService';
import { updateProductById } from '../api/productService';
import { getCategoryDisplayName } from '../utils/categoryDisplay';
import { Link } from 'react-router-dom';
import { getStoredUserRole } from '../utils/auth';

const AdminDashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation(); // Initialize useTranslation
  const { addTask } = useTaskMonitoring();
  const [currentStep, setCurrentStep] = useState(1);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [uploadedProductId, setUploadedProductId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const umamiDashboardUrl = import.meta.env.VITE_UMAMI_DASHBOARD_URL as string | undefined;
  const { data: categories, isLoading: isLoadingCategories, isError: isErrorCategories } = useCategories();
  const isAdmin = getStoredUserRole() === 'ADMIN';

  const handleUploadSuccess = (
    productId: string,
    taskIds: string[],
    details: { name: string; sku: string; category: string; description: string }
  ) => {
    // For simplicity, we'll assume one product_id maps to one primary monitoring task
    // and multiple task_ids can be internal to that product's processing.
    // The useProductPolling hook will handle the actual polling based on the product_id.
    addTask(productId, t('common.product_upload_initiated', { productId })); // Translated
    alert(t('common.product_upload_initiated', { productId })); // Translated
    setHasUploaded(true);
    setUploadedProductId(productId);
    setFormValues(details);
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-screen-xl font-sans">
      <h1 className="text-4xl font-bold text-slate-industrial mb-6">{t('common.admin_dashboard')}</h1>
      <p className="text-sm text-slate-500 mb-8">
        {t('admin.subtitle', {
          defaultValue: 'A guided workflow for non-technical admins to upload, verify, and publish products.',
        })}
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <aside className="space-y-4 lg:col-span-1">
          <div className="h-fit rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 mb-4">
              {t('admin.steps_title', { defaultValue: 'Steps' })}
            </h2>
            <ol className="space-y-4 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`flex w-full items-start gap-3 text-left ${
                    currentStep === 1 ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                    currentStep === 1 ? 'border-orange-500 text-orange-600' : 'border-slate-200'
                  }`}>
                    1
                  </span>
                  <div>
                    <p className="font-semibold">
                      {t('admin.step_upload_title', { defaultValue: 'Upload' })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t('admin.step_upload_desc', { defaultValue: 'Drop product images to begin processing.' })}
                    </p>
                  </div>
                </button>
              </li>
              <li>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      if (hasUploaded) {
                        setCurrentStep(2);
                      }
                    }}
                    disabled={!hasUploaded}
                    className={`flex w-full items-start gap-3 text-left ${
                      currentStep === 2 ? 'text-slate-900' : 'text-slate-400'
                    } ${!hasUploaded ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                      currentStep === 2 ? 'border-orange-500 text-orange-600' : 'border-slate-200'
                    }`}>
                      2
                    </span>
                    <div>
                      <p className="font-semibold">
                        {t('admin.step_details_title', { defaultValue: 'Details' })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t('admin.step_details_desc', { defaultValue: 'Add specs, category, and pricing.' })}
                      </p>
                    </div>
                  </button>
                  {!hasUploaded && (
                    <span className="pointer-events-none absolute left-full top-1/2 ml-3 w-56 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
                      {t('admin.step_locked', { defaultValue: 'Complete the upload step to unlock this section.' })}
                    </span>
                  )}
                </div>
              </li>
              <li>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      if (hasUploaded) {
                        setCurrentStep(3);
                      }
                    }}
                    disabled={!hasUploaded}
                    className={`flex w-full items-start gap-3 text-left ${
                      currentStep === 3 ? 'text-slate-900' : 'text-slate-400'
                    } ${!hasUploaded ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                      currentStep === 3 ? 'border-orange-500 text-orange-600' : 'border-slate-200'
                    }`}>
                      3
                    </span>
                    <div>
                      <p className="font-semibold">
                        {t('admin.step_review_title', { defaultValue: 'Review & Publish' })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t('admin.step_review_desc', { defaultValue: 'Confirm output and make it live.' })}
                      </p>
                    </div>
                  </button>
                  {!hasUploaded && (
                    <span className="pointer-events-none absolute left-full top-1/2 ml-3 w-56 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
                      {t('admin.step_locked', { defaultValue: 'Complete the upload step to unlock this section.' })}
                    </span>
                  )}
                </div>
              </li>
            </ol>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-600">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 mb-4">
              {t('admin.analytics_title', { defaultValue: 'Analytics' })}
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-700">
                  {t('admin.analytics_heading', { defaultValue: 'Traffic & Product Views' })}
                </p>
                <p className="text-xs text-slate-400">
                  {t('admin.analytics_subtitle', { defaultValue: 'Open Umami dashboard for full insights.' })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {umamiDashboardUrl ? (
                  <a
                    href={umamiDashboardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-orange-600 bg-orange-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:border-orange-700 hover:bg-orange-700"
                  >
                    {t('admin.analytics_cta', { defaultValue: 'Open Dashboard' })}
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">
                    {t('admin.analytics_empty', {
                      defaultValue: 'Set `VITE_UMAMI_DASHBOARD_URL` to enable.',
                    })}
                  </span>
                )}
                {isAdmin && (
                  <Link
                    to="/admin/categories"
                    className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 hover:border-orange-300 hover:text-orange-600"
                  >
                    {t('admin.categories_cta', { defaultValue: 'Manage Categories' })}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-industrial">
                  {t('admin.upload_title', { defaultValue: 'Upload Product Images' })}
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  {t('admin.upload_subtitle', {
                    defaultValue: 'Start by uploading high-resolution product images. We will optimize them automatically.',
                  })}
                </p>
              </div>
              <ProductUploadForm onUploadSuccess={(productId, taskIds, details) => {
                handleUploadSuccess(productId, taskIds, details);
                setCurrentStep(2);
              }} />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-industrial">
                  {t('admin.details_title', { defaultValue: 'Add Product Details' })}
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  {t('admin.details_subtitle', {
                    defaultValue: 'Fill in SKU, category, specifications, and pricing. This step is coming next.',
                  })}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-600">
                  {t('admin.field_name', { defaultValue: 'Product Name' })}
                  <input
                    type="text"
                    value={formValues.name}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, name: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    placeholder="e.g., Industrial Filter Cartridge"
                  />
                </label>
                <label className="text-sm text-slate-600">
                  {t('admin.field_sku', { defaultValue: 'SKU' })}
                  <input
                    type="text"
                    value={formValues.sku}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, sku: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    placeholder="e.g., HASC-2024-001"
                  />
                </label>
                <label className="text-sm text-slate-600 md:col-span-2">
                  {t('admin.field_category', { defaultValue: 'Category' })}
                  {isLoadingCategories ? (
                    <div className="mt-2 text-xs text-slate-500">
                      {t('admin.loading_categories', { defaultValue: 'Loading categories...' })}
                    </div>
                  ) : isErrorCategories ? (
                    <div className="mt-2 text-xs text-red-600">
                      {t('admin.error_categories', { defaultValue: 'Failed to load categories.' })}
                    </div>
                  ) : (
                    <select
                      value={formValues.category}
                      onChange={(event) => setFormValues((prev) => ({ ...prev, category: event.target.value }))}
                      className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    >
                      <option value="">{t('admin.select_category', { defaultValue: 'Select a category' })}</option>
                      {categories?.map((category) => (
                        <option key={category.id} value={category.code}>
                          {getCategoryDisplayName(category, i18n.resolvedLanguage ?? 'en')}
                        </option>
                      ))}
                    </select>
                  )}
                </label>
                <label className="text-sm text-slate-600 md:col-span-2">
                  {t('admin.field_description', { defaultValue: 'Description' })}
                  <textarea
                    value={formValues.description}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, description: event.target.value }))}
                    className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    rows={4}
                    placeholder="Describe the product, usage, and key specs."
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
                  onClick={() => setCurrentStep(1)}
                >
                  {t('admin.back', { defaultValue: 'Back' })}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-orange-600 bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:border-orange-700 hover:bg-orange-700"
                  disabled={isSavingDetails}
                  onClick={async () => {
                    const { name, sku, category, description } = formValues;
                    if (!uploadedProductId) {
                      setErrorMessage(
                        t('admin.error_upload_first', {
                          defaultValue: 'Upload images first so we can attach details.',
                        })
                      );
                      return;
                    }
                    if (!name || !sku || !category || !description) {
                      setErrorMessage(
                        t('admin.error_required', {
                          defaultValue: 'Please complete all required fields before continuing.',
                        })
                      );
                      return;
                    }
                    setIsSavingDetails(true);
                    try {
                      await updateProductById(uploadedProductId, {
                        name,
                        sku,
                        category,
                        description,
                      });
                      setCurrentStep(3);
                    } catch (err) {
                      setErrorMessage(
                        (err as Error).message ||
                          t('admin.error_save', { defaultValue: 'Failed to save product details.' })
                      );
                    } finally {
                      setIsSavingDetails(false);
                    }
                  }}
                >
                  {isSavingDetails
                    ? t('admin.saving', { defaultValue: 'Saving...' })
                    : t('admin.continue', { defaultValue: 'Continue' })}
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-industrial">
                  {t('admin.review_title', { defaultValue: 'Review & Publish' })}
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                  {t('admin.review_subtitle', {
                    defaultValue: 'Verify the optimized images and confirm all specifications before publishing.',
                  })}
                </p>
              </div>
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                {t('admin.review_placeholder', { defaultValue: 'Review checklist placeholder.' })}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
                  onClick={() => setCurrentStep(2)}
                >
                  {t('admin.back', { defaultValue: 'Back' })}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-orange-600 bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:border-orange-700 hover:bg-orange-700"
                  disabled={isPublishing}
                  onClick={async () => {
                    const { name, sku, category, description } = formValues;
                    if (!uploadedProductId) {
                      setErrorMessage(
                        t('admin.error_upload_publish', {
                          defaultValue: 'Upload images first so we can publish.',
                        })
                      );
                      return;
                    }
                    if (!name || !sku || !category || !description) {
                      setErrorMessage(
                        t('admin.error_required_publish', {
                          defaultValue: 'Please complete all required fields before publishing.',
                        })
                      );
                      return;
                    }
                    setIsPublishing(true);
                    try {
                      await updateProductById(uploadedProductId, { status: 'PUBLISHED' });
                      alert(t('admin.publish_success', { defaultValue: 'Product published successfully.' }));
                    } catch (err) {
                      setErrorMessage(
                        (err as Error).message ||
                          t('admin.error_publish', { defaultValue: 'Failed to publish product.' })
                      );
                    } finally {
                      setIsPublishing(false);
                    }
                  }}
                >
                  {isPublishing
                    ? t('admin.publishing', { defaultValue: 'Publishing...' })
                    : t('admin.publish', { defaultValue: 'Publish Product' })}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6">
          <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {t('admin.error_title', { defaultValue: 'Missing information' })}
            </h3>
            <p className="mt-2 text-sm text-slate-600">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="mt-4 inline-flex items-center justify-center rounded-md border border-orange-600 bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:border-orange-700 hover:bg-orange-700"
            >
              {t('admin.ok', { defaultValue: 'OK' })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
