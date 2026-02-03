// frontend/src/components/ProductCard.tsx
import React from 'react';
import type { Product, ProductStatus } from '../types/product';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Link } from 'react-router-dom';

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
  const { t } = useTranslation(); // Initialize useTranslation
  const isPubliclyVisible = product.status === 'PUBLISHED';
  const cardOpacity = isPubliclyVisible ? 'opacity-100' : 'opacity-60'; // Mute non-published cards

  return (
    <div className={`group relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ${cardOpacity} flex flex-col h-full`}>
      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
        <img
          src={product.images?.[0]?.web_url || '/placeholder.png'}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClasses(product.status)}`}>
          {t(`status.${product.status}`)} {/* Translate status */}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
          {product.description}
        </p>
        <div className="flex justify-end items-center mt-auto">
          {isPubliclyVisible ? (
            <Link
              to={`/products/${product.id}`}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded transition-colors duration-200 group-hover:bg-blue-700"
            >
              {t('common.view_details')}
            </Link>
          ) : (
            <button
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded opacity-60 cursor-not-allowed"
              disabled
            >
              {t('common.view_details')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
