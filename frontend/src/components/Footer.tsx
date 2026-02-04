// frontend/src/components/Footer.tsx
import React from 'react';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const { t } = useTranslation(); // Initialize useTranslation
  return (
    <footer className="bg-slate-industrial text-white py-4 mt-6">
      <div className="container mx-auto px-6 max-w-screen-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Section 1: About Us */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('common.about_us')}</h3>
            <p className="text-sm text-gray-300">
              {t('common.about_us_text')}
            </p>
          </div>

          {/* Section 2: Contact Info (Basic) */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('common.contact')}</h3>
            <p className="text-sm text-gray-300">{t('common.email')}: info@hascvn.com</p>
            <p className="text-sm text-gray-300">{t('common.phone')}: +1 (555) 123-4567</p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-5 pt-5 text-sm text-gray-400">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.2em] text-gray-400">
              <Link to="/privacy" className="hover:text-white transition-colors duration-200">
                {t('common.privacy_policy')}
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors duration-200">
                {t('common.terms_of_service')}
              </Link>
              <Link to="/shipping" className="hover:text-white transition-colors duration-200">
                {t('common.shipping_returns')}
              </Link>
            </div>
            <div className="text-xs text-gray-400">
              © {new Date().getFullYear()} HASC VN. {t('common.all_rights_reserved')}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
