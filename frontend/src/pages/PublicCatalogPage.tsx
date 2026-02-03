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
    <div className="container mx-auto px-6 py-8 max-w-screen-xl font-sans">
      <h1 className="text-4xl font-bold text-slate-industrial mb-8">{t('common.product_catalog')}</h1>

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
  );
};

export default PublicCatalogPage;
