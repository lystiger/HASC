// frontend/src/pages/AboutPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const gallery = [
  { src: '/about1.webp', label: 'HASC Facility 01' },
  { src: '/about2.webp', label: 'HASC Facility 02' },
  { src: '/about3.webp', label: 'HASC Facility 03' },
  { src: '/about4.jpeg', label: 'HASC Facility 04' },
  { src: '/about5.jpeg', label: 'HASC Facility 05' },
  { src: '/about6.jpeg', label: 'HASC Facility 06' },
  { src: '/about7.jpeg', label: 'HASC Facility 07' },
  { src: '/about8.jpeg', label: 'HASC Facility 08' },
];

const AboutPage: React.FC = () => {
  const { t } = useTranslation();
  const businessLinesRaw = t('about.business_lines', { returnObjects: true }) as unknown;
  const businessLines = Array.isArray(businessLinesRaw) ? businessLinesRaw : [];
  const coreStatementsRaw = t('about.core_statements', { returnObjects: true }) as unknown;
  const coreStatements = Array.isArray(coreStatementsRaw) ? coreStatementsRaw : [];
  const typedCoreStatements = coreStatements.filter(
    (item): item is { title: string; body: string } =>
      Boolean(item && typeof item === 'object' && 'title' in item && 'body' in item)
  );

  return (
    <div className="font-sans">
      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <img
            src="/about1.webp"
            alt="HASC VN facility"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-slate-900/70" />
        </div>
        <div className="relative z-10 mx-auto flex max-w-screen-xl flex-col gap-6 px-6 py-16">
          <p className="text-xs uppercase tracking-[0.4em] text-orange-200">
            {t('about.hero_kicker')}
          </p>
          <h1 className="max-w-3xl text-4xl font-bold text-white md:text-5xl">
            {t('about.hero_title')}
          </h1>
          <p className="max-w-2xl text-base text-slate-100 md:text-lg">
            {t('about.hero_subtitle')}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-screen-xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
              {t('about.profile_kicker')}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-industrial">
              {t('about.profile_title')}
            </h2>
            <p className="mt-4 text-sm text-slate-600">
              {t('about.profile_subtitle')}
            </p>
          </div>
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-slate-800">
                  {t('about.company_name')}
                </p>
                <p className="text-sm text-slate-500">
                  {t('about.tax_label')}: <span className="mono-data">0108049836</span>
                </p>
              </div>
              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {t('about.business_lines_label')}
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                  {businessLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-screen-xl px-6 py-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                {t('about.gallery_kicker')}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-industrial">
                {t('about.gallery_title')}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {t('about.gallery_subtitle')}
              </p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {gallery.map((item) => (
              <figure
                key={item.label}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <img src={item.src} alt={item.label} className="h-48 w-full object-cover" loading="lazy" />
                <figcaption className="px-4 py-3 text-sm font-medium text-slate-700">{item.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-screen-xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
              {t('about.values_kicker')}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-industrial">
              {t('about.values_title')}
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              {t('about.values_subtitle')}
            </p>
          </div>
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {typedCoreStatements.map((statement) => (
                <div key={statement.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">{statement.title}</h3>
                  <p className="mt-3 text-sm text-slate-600">{statement.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-screen-xl flex-col items-start gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Next Step</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-industrial">
              Ready to discuss enterprise supply needs?
            </h3>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-md bg-orange-safety px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600"
          >
            Contact Sales
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
