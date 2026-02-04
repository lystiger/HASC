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
  const [searchQuery, setSearchQuery] = useState('');
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);
  const { data: products, isLoading, isError, error } = useProducts({
    category_ids: selectedCategoryIds,
  });

  const handleFilterChange = (newSelectedIds: string[]) => {
    setSelectedCategoryIds(newSelectedIds);
  };

  const demoProducts: Product[] = [
    {
      id: 0,
      sku: 'DEMO-001',
      name: t('common.demo_product_name'),
      description: t('common.demo_product_description'),
      category: 'PACKAGING',
      status: 'PUBLISHED',
      images: [
        {
          original_name: 'hero-placeholder.svg',
          web_url: '/hero-placeholder.svg',
          thumb_url: '/hero-placeholder.svg',
        },
      ],
      specific_attributes: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 1,
      sku: 'DEMO-002',
      name: `${t('common.demo_product_name')} 2`,
      description: t('common.demo_product_description'),
      category: 'FILTERS',
      status: 'PUBLISHED',
      images: [
        {
          original_name: 'hero-placeholder.svg',
          web_url: '/hero-placeholder.svg',
          thumb_url: '/hero-placeholder.svg',
        },
      ],
      specific_attributes: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      sku: 'DEMO-003',
      name: `${t('common.demo_product_name')} 3`,
      description: t('common.demo_product_description'),
      category: 'CHEMICALS',
      status: 'PUBLISHED',
      images: [
        {
          original_name: 'hero-placeholder.svg',
          web_url: '/hero-placeholder.svg',
          thumb_url: '/hero-placeholder.svg',
        },
      ],
      specific_attributes: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const recentSearches = ['Microfiber wipers', 'Food-grade drums', 'Ventilation filters', 'Pallet stretch'];
  const partners = [
    { name: 'Partner 1', src: '/partner1.webp' },
    { name: 'Partner 2', src: '/partner2.webp' },
    { name: 'Partner 3', src: '/partner3.webp' },
    { name: 'Partner 4', src: '/partner4.webp' },
    { name: 'Partner 5', src: '/partner5.webp' },
    { name: 'Partner 6', src: '/partner6.webp' },
    { name: 'Partner 7', src: '/partner7.webp' },
    { name: 'Partner 8', src: '/partner8.webp' },
    { name: 'Partner 9', src: '/partner9.webp' },
    { name: 'Partner 10', src: '/partner10.webp' },
  ];

  const handlePartnerClick = (partnerName: string) => {
    setSearchQuery(partnerName);
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="font-sans">
      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img
            src="/img.webp"
            alt={t('common.hero_image_alt')}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-slate-900/70" />
        </div>
        <div className="relative z-10 container mx-auto px-6 pt-12 pb-16 max-w-screen-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <p className="text-sm uppercase tracking-[0.25em] text-orange-200 mb-4">
                {t('common.hero_kicker')}
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                {t('common.hero_title')}
              </h1>
              <p className="mt-4 text-lg text-slate-100 max-w-2xl">
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
                  className="inline-flex items-center justify-center rounded-md border border-white/60 px-5 py-2.5 text-white font-semibold hover:border-white hover:text-white transition-colors"
                >
                  {t('common.hero_cta_secondary')}
                </a>
              </div>
            </div>
            <div className="lg:col-span-5 lg:-mt-4">
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
        <div className="flex flex-col gap-4 mb-8">
          <h2 className="text-3xl font-bold text-slate-industrial">
            {t('common.product_catalog')}
          </h2>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar for filters */}
        <aside className="md:w-1/4">
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 mb-2">
              Find A Product
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-orange-300">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Try “ISO 9001 packaging”"
                className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                aria-label="Search products"
              />
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                Recent
              </span>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setSearchQuery(term)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 hover:border-orange-200 hover:text-orange-600 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
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
              <p className="mb-6">{t('common.no_products_found')}</p>
              <div className="w-full">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {demoProducts.map((demoProduct) => (
                    <ProductCard key={demoProduct.sku} product={demoProduct} />
                  ))}
                </div>
              </div>
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

      <section className="border-t border-slate-200 bg-white/70">
        <div className="container mx-auto px-6 py-10 max-w-screen-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Partners</p>
              <h3 className="text-2xl font-semibold text-slate-industrial">
                Trusted industrial supply network
              </h3>
            </div>
            <div
              className={`marquee w-full max-w-4xl overflow-hidden border border-slate-200 bg-white${isMarqueePaused ? ' is-paused' : ''}`}
              onTouchStart={() => setIsMarqueePaused(true)}
              onTouchEnd={() => setIsMarqueePaused(false)}
              onTouchCancel={() => setIsMarqueePaused(false)}
            >
              <div className="marquee__inner">
                <div className="marquee__track">
                  {partners.map((partner) => (
                    <button
                      key={partner.name}
                      type="button"
                      onClick={() => handlePartnerClick(partner.name)}
                      className="group"
                    >
                      <span className="flex h-12 w-28 items-center justify-center rounded-md border border-slate-200 bg-white/80 px-3 transition-colors group-hover:border-orange-500 group-hover:ring-2 group-hover:ring-orange-200">
                        <img
                          src={partner.src}
                          alt={partner.name}
                          className="h-9 w-full object-contain"
                          loading="lazy"
                        />
                      </span>
                    </button>
                  ))}
                </div>
                <div className="marquee__track" aria-hidden="true">
                  {partners.map((partner) => (
                    <span
                      key={`${partner.name}-ghost`}
                      className="flex h-12 w-28 items-center justify-center rounded-md border border-slate-200 bg-white/80 px-3"
                    >
                      <img
                        src={partner.src}
                        alt=""
                        className="h-9 w-full object-contain"
                        loading="lazy"
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublicCatalogPage;
