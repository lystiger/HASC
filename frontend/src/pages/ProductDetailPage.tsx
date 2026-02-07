// frontend/src/pages/ProductDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProduct } from '../api/productService';
import { useCategories } from '../api/categoryService';
import { getCategoryDisplayNameByCode } from '../utils/categoryDisplay';
import { resolveMediaUrl } from '../utils/media';
import { getProductDisplayDescription, getProductDisplayName } from '../utils/productDisplay';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { data: product, isLoading, error } = useProduct(id);
  const { data: categories } = useCategories();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageIndexByProduct, setImageIndexByProduct] = useState<Record<string, number>>({});
  const images = product?.images ?? [];

  useEffect(() => {
    if (!id) {
      return;
    }
    const storedIndex = imageIndexByProduct[id];
    setActiveImageIndex(storedIndex ?? 0);
  }, [id, images.length, imageIndexByProduct]);
  if (isLoading) {
    return (
      <div className="mx-auto max-w-screen-xl px-6 py-10">
        <p className="text-sm text-gray-500">{t('common.loading')}...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-screen-xl px-6 py-10">
        <p className="text-sm text-red-600">
          {t('common.unexpected_error')}: {error?.message ?? 'Product not found'}
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center rounded-full border border-blue-600 px-4 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
        >
          {t('common.back_to_catalog')}
        </Link>
      </div>
    );
  }

  const activeImage = images[activeImageIndex];
  const mainImageUrl =
    resolveMediaUrl(activeImage?.web_url) ||
    resolveMediaUrl(images[0]?.web_url) ||
    '/hero-placeholder.svg';
  const isPublished = product.status === 'PUBLISHED';

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-10">
      <Link
        to="/"
        className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-600 transition-colors hover:border-orange-400 hover:text-orange-600"
        aria-label={t('common.back_to_catalog')}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
              {images.map((img, idx) => (
                <button
                  key={`${img.web_url}-${idx}`}
                  type="button"
                  onClick={() => {
                    setActiveImageIndex(idx);
                    if (id) {
                      setImageIndexByProduct((prev) => ({ ...prev, [id]: idx }));
                    }
                  }}
                  className={`rounded-md border-2 p-1 transition-colors hover:border-orange-400 hover:shadow-[0_0_0_2px_rgba(251,146,60,0.3)] ${
                    activeImageIndex === idx ? 'border-orange-500 shadow-[0_0_0_2px_rgba(249,115,22,0.35)]' : 'border-slate-200'
                  } ${!isPublished ? 'opacity-50' : ''}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <img
                      src={resolveMediaUrl(img.thumb_url || img.web_url)}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      className="h-20 w-20 object-cover"
                      loading="lazy"
                    />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      #{idx + 1}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <div className="lg:col-span-2">
              <div className="group relative aspect-square w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 product-zoom">
                {isPublished ? (
                  <img
                    src={mainImageUrl}
                    alt={product.name}
                    className="h-full w-full object-contain mix-blend-multiply transition-transform duration-300 ease-out group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-200 text-slate-500">
                    <span className="text-sm font-medium">Optimizing Technical View...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {getProductDisplayName(product, i18n.resolvedLanguage ?? 'en')}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span>SKU: {product.sku}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {getCategoryDisplayNameByCode(categories, product.category, i18n.resolvedLanguage ?? 'en')}
            </span>
          </div>
          <p className="mt-4 text-gray-700">
            {getProductDisplayDescription(product, i18n.resolvedLanguage ?? 'en')}
          </p>

          {product.specific_attributes && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t('common.specifications')}
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.isArray((product.specific_attributes as { items?: unknown }).items)
                  ? (product.specific_attributes as { items: Array<Record<string, unknown>> }).items
                      .map((item, index) => {
                        const isVi = (i18n.resolvedLanguage ?? 'en') === 'vi';
                        const key =
                          (isVi ? item.key_vi : item.key_en) ??
                          (isVi ? item.key_en : item.key_vi) ??
                          '';
                        const value =
                          (isVi ? item.value_vi : item.value_en) ??
                          (isVi ? item.value_en : item.value_vi) ??
                          '';
                        if (!key && !value) {
                          return null;
                        }
                        return (
                          <div
                            key={`${String(key)}-${index}`}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-gray-700"
                          >
                            <div className="text-xs uppercase text-gray-500">{String(key)}</div>
                            <div className="mt-1 font-medium">{String(value)}</div>
                          </div>
                        );
                      })
                      .filter(Boolean)
                  : Object.entries(product.specific_attributes as Record<string, unknown>).map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-gray-700"
                      >
                        <div className="text-xs uppercase text-gray-500">{key}</div>
                        <div className="mt-1 font-medium">{String(value)}</div>
                      </div>
                    ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
