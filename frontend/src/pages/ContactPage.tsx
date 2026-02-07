// frontend/src/pages/ContactPage.tsx
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { CONTACT_INFO } from '../constants/contactInfo';
import { useCategories } from '../api/categoryService';
import { getCategoryDisplayName } from '../utils/categoryDisplay';

const ContactPage: React.FC = () => {
  const { t, i18n } = useTranslation(); // Initialize useTranslation
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();
  const industryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.code,
        label: getCategoryDisplayName(category, i18n.resolvedLanguage ?? 'en'),
      })),
    [categories, i18n.resolvedLanguage]
  );
  const [formValues, setFormValues] = useState({
    name: '',
    company: '',
    email: '',
    industry: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!formValues.name.trim()) {
      nextErrors.name = t('contact.errors.name', { defaultValue: 'Name is required.' });
    }
    if (!formValues.company.trim()) {
      nextErrors.company = t('contact.errors.company', { defaultValue: 'Company is required.' });
    }
    if (!formValues.email.trim()) {
      nextErrors.email = t('contact.errors.email', { defaultValue: 'Email is required.' });
    } else if (!/^\S+@\S+\.\S+$/.test(formValues.email)) {
      nextErrors.email = t('contact.errors.email_format', { defaultValue: 'Enter a valid email address.' });
    }
    if (!formValues.industry) {
      nextErrors.industry = t('contact.errors.industry', { defaultValue: 'Select an industry sector.' });
    }
    if (!formValues.message.trim()) {
      nextErrors.message = t('contact.errors.message', { defaultValue: 'Message is required.' });
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    setToastMessage('');

    window.setTimeout(() => {
      setIsSubmitting(false);
      setFormValues({ name: '', company: '', email: '', industry: '', message: '' });
      setErrors({});
      setToastMessage(
        t('contact.success', { defaultValue: 'Thanks! Your inquiry has been queued for review.' })
      );
    }, 600);
  };

  return (
    <div className="mx-auto min-h-screen max-w-screen-xl px-6 py-10 font-sans">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
          {t('contact.kicker', { defaultValue: 'Direct & Geometric' })}
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-industrial">
          {t('common.contact_us')}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600">
          {t('contact.subtitle', { defaultValue: 'Fast-track technical inquiries for procurement teams.' })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7">
          <h2 className="text-2xl font-semibold text-slate-900">
            {t('contact.inquiry_title', { defaultValue: 'Send a Technical Inquiry' })}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {t('contact.inquiry_subtitle', {
              defaultValue: 'Tell us about your project scope and we will respond within 24 hours.',
            })}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-600">
              {t('contact.form.name', { defaultValue: 'Name' })}
              <input
                type="text"
                value={formValues.name}
                onChange={(event) => setFormValues((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
              />
              {errors.name && <span className="mt-1 block text-xs text-red-600">{errors.name}</span>}
            </label>

            <label className="text-sm text-slate-600">
              {t('contact.form.company', { defaultValue: 'Company' })}
              <input
                type="text"
                value={formValues.company}
                onChange={(event) => setFormValues((prev) => ({ ...prev, company: event.target.value }))}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
              />
              {errors.company && <span className="mt-1 block text-xs text-red-600">{errors.company}</span>}
            </label>

            <label className="text-sm text-slate-600 md:col-span-2">
              {t('contact.form.email', { defaultValue: 'Email' })}
              <input
                type="email"
                value={formValues.email}
                onChange={(event) => setFormValues((prev) => ({ ...prev, email: event.target.value }))}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
              />
              {errors.email && <span className="mt-1 block text-xs text-red-600">{errors.email}</span>}
            </label>

            <label className="text-sm text-slate-600 md:col-span-2">
              {t('contact.form.industry', { defaultValue: 'Industry Sector' })}
              <select
                value={formValues.industry}
                onChange={(event) => setFormValues((prev) => ({ ...prev, industry: event.target.value }))}
                disabled={categoriesLoading || Boolean(categoriesError)}
                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <option value="">
                  {categoriesLoading
                    ? t('common.loading', { defaultValue: 'Loading' })
                    : t('contact.form.select', { defaultValue: 'Select a sector' })}
                </option>
                {industryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {categoriesError && (
                <span className="mt-1 block text-xs text-red-600">
                  {t('common.error_loading_categories', { defaultValue: 'Error loading categories.' })}
                </span>
              )}
              {errors.industry && <span className="mt-1 block text-xs text-red-600">{errors.industry}</span>}
            </label>

            <label className="text-sm text-slate-600 md:col-span-2">
              {t('contact.form.message', { defaultValue: 'Message' })}
              <textarea
                rows={4}
                value={formValues.message}
                onChange={(event) => setFormValues((prev) => ({ ...prev, message: event.target.value }))}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
              />
              {errors.message && <span className="mt-1 block text-xs text-red-600">{errors.message}</span>}
            </label>

            <div className="md:col-span-2 flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-md bg-orange-safety px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? t('contact.form.sending', { defaultValue: 'Sending...' })
                  : t('contact.form.submit', { defaultValue: 'Send Technical Inquiry' })}
              </button>
              <span className="text-xs text-slate-400">
                {t('contact.note', { defaultValue: 'We respond within 24 hours on business days.' })}
              </span>
            </div>
          </form>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5">
          <h2 className="text-xl font-semibold text-slate-900">
            {t('contact.info_title', { defaultValue: 'Information Hub' })}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {t('contact.info_subtitle', { defaultValue: 'Direct lines for procurement and logistics.' })}
          </p>

          <div className="mt-6 space-y-5 text-sm text-slate-700">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {t('common.our_address')}
              </p>
              <p className="mt-2 text-sm text-slate-700">
                {CONTACT_INFO.address}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {t('common.phone')}
              </p>
              <p className="mt-2 mono-data text-sm text-slate-700">{CONTACT_INFO.phone}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {t('common.email')}
              </p>
              <p className="mt-2 mono-data text-sm text-slate-700">{CONTACT_INFO.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {t('common.business_hours')}
              </p>
              <p className="mt-2 text-sm text-slate-700">Mon – Fri: 08:00 – 17:00</p>
            </div>
          </div>
        </aside>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-6">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-lg">
            {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactPage;
