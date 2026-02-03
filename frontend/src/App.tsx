// frontend/src/App.tsx
import './App.css';
import PublicCatalogPage from './pages/PublicCatalogPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ShippingReturnsPage from './pages/ShippingReturnsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskMonitoringProvider } from './context/TaskMonitoringContext';
import TaskMonitoringNotification from './components/TaskMonitoringNotification';
import Footer from './components/Footer';
import LanguageSwitcher from './components/LanguageSwitcher'; // Imported
import { useTranslation } from 'react-i18next'; // Imported
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';

const queryClient = new QueryClient();

function App() {
  const { t } = useTranslation(); // Initialize useTranslation

  return (
    <QueryClientProvider client={queryClient}>
      <TaskMonitoringProvider>
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <header className="bg-slate-industrial text-white px-4 py-3">
              <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src="/logo.webp" alt="HASC VN" className="h-8 w-8 rounded-full object-cover" />
                  <h1 className="text-xl font-bold">HASC VN</h1>
                </div>
                <nav className="flex items-center gap-4 text-sm">
                  <NavLink
                    to="/"
                    className={({ isActive }) =>
                      `transition-colors ${isActive ? 'text-white' : 'text-slate-200 hover:text-white'}`
                    }
                  >
                    {t('common.products')}
                  </NavLink>
                  <NavLink
                    to="/contact"
                    className={({ isActive }) =>
                      `transition-colors ${isActive ? 'text-white' : 'text-slate-200 hover:text-white'}`
                    }
                  >
                    {t('common.contact_us_link')}
                  </NavLink>
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      `transition-colors ${isActive ? 'text-white' : 'text-slate-200 hover:text-white'}`
                    }
                  >
                    Admin
                  </NavLink>
                </nav>
                <LanguageSwitcher />
              </div>
            </header>
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<PublicCatalogPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/shipping" element={<ShippingReturnsPage />} />
                <Route path="*" element={<PublicCatalogPage />} />
              </Routes>
            </main>
            <TaskMonitoringNotification />
            <Footer />
          </div>
        </BrowserRouter>
      </TaskMonitoringProvider>
    </QueryClientProvider>
  );
}

export default App;
