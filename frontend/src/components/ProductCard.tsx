// frontend/src/components/ProductCard.tsx
import React from 'react';
import type { Product, ProductStatus } from '../types/product';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../utils/media';
import { getProductDisplayDescription, getProductDisplayName } from '../utils/productDisplay';

interface ProductCardProps {
  product: Product;
}

const getStatusBadgeClasses = (status: ProductStatus) => {
  switch (status) {
    case 'PUBLISHED':
      return 'bg-green-100 text-green-800';
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800';
    case 'ARCHIVED':
      return 'bg-yellow-100 text-yellow-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { t, i18n } = useTranslation(); // Initialize useTranslation
  const isPubliclyVisible = product.status === 'PUBLISHED';
  const cardOpacity = isPubliclyVisible ? 'opacity-100' : 'opacity-60'; // Mute non-published cards

  const CardWrapper = isPubliclyVisible ? Link : 'div';

  return (
    <CardWrapper
      {...(isPubliclyVisible ? { to: `/products/${product.id}` } : {})}
      className={`group relative flex h-full flex-col rounded-lg bg-white shadow-md transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl ${cardOpacity}`}
    >
      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
        <img
          src={resolveMediaUrl(product.images?.[0]?.web_url) || '/placeholder.png'}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <span className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClasses(product.status)}`}>
          {t(`status.${product.status}`)} {/* Translate status */}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
          {getProductDisplayName(product, i18n.resolvedLanguage ?? 'en')}
        </h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
          {getProductDisplayDescription(product, i18n.resolvedLanguage ?? 'en')}
        </p>
        <div className="flex justify-end items-center mt-auto">
          {isPubliclyVisible ? (
            <span
              className="px-3 py-1 text-sm rounded border border-orange-600 bg-orange-600 text-white transition-all duration-200 group-hover:border-orange-700 group-hover:bg-gradient-to-r group-hover:from-orange-600 group-hover:to-orange-700"
            >
              {t('common.view_details')}
            </span>
          ) : (
            <span
              className="px-3 py-1 text-sm rounded border border-orange-400 bg-orange-400 text-white opacity-60 cursor-not-allowed"
            >
              {t('common.view_details')}
            </span>
          )}
        </div>
      </div>
    </CardWrapper>
  );
};

export default ProductCard;
