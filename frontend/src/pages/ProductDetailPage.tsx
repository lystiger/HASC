// frontend/src/pages/ProductDetailPage.tsx
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProduct } from '../api/productService';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: product, isLoading, error } = useProduct(id);

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
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
          {t('common.back_to_catalog')}
        </Link>
      </div>
    );
  }

  const imageUrl = product.images?.[0]?.web_url || '/placeholder.png';

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-10">
      <Link to="/" className="text-sm text-blue-600 hover:text-blue-700">
        {t('common.back_to_catalog')}
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100">
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{product.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span>SKU: {product.sku}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {product.category}
            </span>
          </div>
          <p className="mt-4 text-gray-700">{product.description}</p>

          {product.specific_attributes && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {t('common.specifications')}
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(product.specific_attributes).map(([key, value]) => (
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
