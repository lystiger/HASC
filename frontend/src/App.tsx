// frontend/src/App.tsx
import './App.css';
import PublicCatalogPage from './pages/PublicCatalogPage'; // Will switch to this for final demo
// import AdminDashboardPage from './pages/AdminDashboardPage';
// import ContactPage from './pages/ContactPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskMonitoringProvider } from './context/TaskMonitoringContext';
import TaskMonitoringNotification from './components/TaskMonitoringNotification';
import Footer from './components/Footer';
import LanguageSwitcher from './components/LanguageSwitcher'; // Imported
import { useTranslation } from 'react-i18next'; // Imported

const queryClient = new QueryClient();

function App() {
  const { t } = useTranslation(); // Initialize useTranslation

  return (
    <QueryClientProvider client={queryClient}>
      <TaskMonitoringProvider>
        <div className="flex flex-col min-h-screen">
          <header className="bg-slate-industrial text-white p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">{t('common.product_catalog')}</h1> {/* Translated title */}
            <LanguageSwitcher />
          </header>
          <main className="flex-grow">
            {/* For demonstration, let's switch back to PublicCatalogPage */}
            <PublicCatalogPage />
            {/* Previously: <ContactPage /> or <AdminDashboardPage /> */}
          </main>
          <TaskMonitoringNotification />
          <Footer />
        </div>
      </TaskMonitoringProvider>
    </QueryClientProvider>
  );
}

export default App;
