// frontend/src/App.tsx
import './App.css';
import PublicCatalogPage from './pages/PublicCatalogPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ShippingReturnsPage from './pages/ShippingReturnsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AboutPage from './pages/AboutPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskMonitoringProvider } from './context/TaskMonitoringContext';
import TaskMonitoringNotification from './components/TaskMonitoringNotification';
import Footer from './components/Footer';
import LanguageSwitcher from './components/LanguageSwitcher'; // Imported
import { useTranslation } from 'react-i18next'; // Imported
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';

const queryClient = new QueryClient();

const ScrollToTop: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return null;
};

const AppLayout: React.FC = () => {
  const { t } = useTranslation();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const umamiScriptUrl = import.meta.env.VITE_UMAMI_SCRIPT_URL as string | undefined;
  const umamiWebsiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;
  const navRef = useRef<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const location = useLocation();

  const navLinks = useMemo(
    () => [
      { to: '/', label: t('common.products') },
      { to: '/contact', label: t('common.contact_us_link') },
      { to: '/about', label: t('common.about_nav', { defaultValue: 'About' }) },
      { to: '/admin', label: t('common.admin_nav', { defaultValue: 'Admin' }) },
    ],
    [t]
  );

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

  useEffect(() => {
    if (!umamiScriptUrl || !umamiWebsiteId) {
      return;
    }
    if (document.querySelector(`script[data-umami-script]`)) {
      return;
    }
    const script = document.createElement('script');
    script.src = umamiScriptUrl;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-website-id', umamiWebsiteId);
    script.setAttribute('data-umami-script', 'true');
    document.head.appendChild(script);
  }, [umamiScriptUrl, umamiWebsiteId]);

  useLayoutEffect(() => {
    if (!navRef.current) {
      return;
    }
    const active = navRef.current.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
    if (!active) {
      return;
    }
    const navRect = navRef.current.getBoundingClientRect();
    const linkRect = active.getBoundingClientRect();
    setIndicatorStyle({
      left: Math.round(linkRect.left - navRect.left),
      width: Math.round(linkRect.width),
    });
  }, [location.pathname, navLinks]);

  return (
    <>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <header className="bg-slate-industrial text-white px-4 py-3">
          <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <a href="/#hero" className="brand-wordmark" aria-label="Welcome to HASC">
                <span className="brand-intro">Welcome to</span>
                <span className="brand-h">H</span>
                <span className="brand-a">A</span>
                <span className="brand-sc">SC</span>
              </a>
            </div>
            <nav className="flex flex-wrap items-center gap-4 text-sm">
              <div ref={navRef} className="nav-indicator">
                <span
                  className="nav-indicator__card"
                  style={{
                    transform: `translateX(${indicatorStyle.left}px)`,
                    width: `${indicatorStyle.width}px`,
                  }}
                  aria-hidden="true"
                />
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `nav-indicator__link ${isActive ? 'is-active' : 'text-slate-200 hover:text-white'}`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </nav>
            <LanguageSwitcher />
          </div>
        </header>
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<PublicCatalogPage />} />
            <Route path="/about" element={<AboutPage />} />
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
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TaskMonitoringProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </TaskMonitoringProvider>
    </QueryClientProvider>
  );
}

export default App;
