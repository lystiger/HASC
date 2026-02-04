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
import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';

const queryClient = new QueryClient();

function App() {
  const { t } = useTranslation(); // Initialize useTranslation
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const threshold = document.documentElement.scrollHeight * 0.85;
      setShowBackToTop(scrollPosition >= threshold);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
                <nav className="flex flex-wrap items-center gap-4 text-sm">
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
            {showBackToTop && (
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg transition-colors hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600"
                aria-label="Back to top"
              >
                <ArrowUp className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </BrowserRouter>
      </TaskMonitoringProvider>
    </QueryClientProvider>
  );
}

export default App;
