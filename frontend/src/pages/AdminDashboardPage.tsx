// frontend/src/pages/AdminDashboardPage.tsx
import React from 'react';
import ProductUploadForm from '../components/ProductUploadForm';
import { useTaskMonitoring } from '../context/TaskMonitoringContext';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation(); // Initialize useTranslation
  const { addTask } = useTaskMonitoring();

  const handleUploadSuccess = (productId: string, taskIds: string[]) => {
    // For simplicity, we'll assume one product_id maps to one primary monitoring task
    // and multiple task_ids can be internal to that product's processing.
    // The useProductPolling hook will handle the actual polling based on the product_id.
    addTask(productId, t('common.product_upload_initiated', { productId })); // Translated
    alert(t('common.product_upload_initiated', { productId })); // Translated
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-screen-xl font-sans">
      <h1 className="text-4xl font-bold text-slate-industrial mb-8">{t('common.admin_dashboard')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <ProductUploadForm onUploadSuccess={handleUploadSuccess} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-industrial mb-4">{t('common.queue_status')}</h2>
          <div className="bg-white p-6 rounded-lg shadow-md min-h-[200px] flex items-center justify-center text-gray-500">
            <p>{t('common.task_queue_status_placeholder')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;