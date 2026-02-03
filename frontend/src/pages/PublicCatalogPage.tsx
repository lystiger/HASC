// frontend/src/pages/PublicCatalogPage.tsx
import React, { useState } from 'react';
import { useProducts } from '../api/productService';
import ProductCard from '../components/ProductCard';
import CategoryFilterSidebar from '../components/CategoryFilterSidebar';
import type { Product } from '../types/product';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const PublicCatalogPage: React.FC = () => {
  const { t } = useTranslation(); // Initialize useTranslation
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const { data: products, isLoading, isError, error } = useProducts({
    category_ids: selectedCategoryIds,
  });

  const handleFilterChange = (newSelectedIds: string[]) => {
    setSelectedCategoryIds(newSelectedIds);
  };

  return (
    <div className="font-sans">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-orange-50">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-slate-200/60 blur-3xl" />
        <div className="container mx-auto px-6 pt-12 pb-16 max-w-screen-xl relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500 mb-4">
                {t('common.hero_kicker')}
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                {t('common.hero_title')}
              </h1>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl">
                {t('common.hero_subtitle')}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#catalog"
                  className="inline-flex items-center justify-center rounded-md bg-orange-safety px-5 py-2.5 text-white font-semibold hover:bg-orange-600 transition-colors"
                >
                  {t('common.hero_cta_primary')}
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 px-5 py-2.5 text-slate-700 font-semibold hover:border-slate-400 hover:text-slate-900 transition-colors"
                >
                  {t('common.hero_cta_secondary')}
                </a>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-2xl font-bold text-slate-900">20+</p>
                    <p className="text-sm text-slate-600">{t('common.hero_stat_products')}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-2xl font-bold text-slate-900">99%</p>
                    <p className="text-sm text-slate-600">{t('common.hero_stat_quality')}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-2xl font-bold text-slate-900">24h</p>
                    <p className="text-sm text-slate-600">{t('common.hero_stat_support')}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-2xl font-bold text-slate-900">VN</p>
                    <p className="text-sm text-slate-600">{t('common.hero_stat_location')}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-slate-900 text-white p-4">
                  <p className="text-sm uppercase tracking-wider text-orange-200">
                    {t('common.hero_panel_title')}
                  </p>
                  <p className="mt-2 text-sm text-slate-100">
                    {t('common.hero_panel_body')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="catalog" className="container mx-auto px-6 py-8 max-w-screen-xl">
        <h2 className="text-3xl font-bold text-slate-industrial mb-8">{t('common.product_catalog')}</h2>
        <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar for filters */}
        <aside className="md:w-1/4">
          <CategoryFilterSidebar onFilterChange={handleFilterChange} />
        </aside>

        {/* Main content for product listings */}
        <main className="md:w-3/4">
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md h-72 animate-pulse"></div>
              ))}
            </div>
          )}

          {isError && (
            <div className="text-red-600 text-center py-10">
              <p>{t('common.error_loading_products')}: {error?.message}</p>
            </div>
          )}

          {!isLoading && !isError && products && products.length === 0 && (
            <div className="text-center py-10 text-gray-600">
              <p>{t('common.no_products_found')}</p>
            </div>
          )}

          {!isLoading && !isError && products && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
        </div>
      </div>
    </div>
  );
};

export default PublicCatalogPage;
