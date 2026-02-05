// frontend/src/components/Footer.tsx
import React from 'react';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Link } from 'react-router-dom';
import { CONTACT_INFO } from '../constants/contactInfo';

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
            <img
              src="/logo.webp"
              alt="HASC VN"
              className="mt-4 ml-[30%] h-[150px] w-[216px] rounded-full object-contain opacity-90"
              loading="lazy"
            />
          </div>

          {/* Section 2: Contact + Map */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
            <div className="flex-1 rounded-lg border border-slate-200 bg-white/10 p-4">
              <h3 className="text-lg font-semibold mb-3">{t('common.contact')}</h3>
              <p className="text-sm text-gray-300">
                {t('common.email')}: {CONTACT_INFO.email}
              </p>
              <p className="text-sm text-gray-300">
                {t('common.phone')}: {CONTACT_INFO.phone}
              </p>
              <p className="mt-3 text-sm text-gray-300 font-mono">
                {CONTACT_INFO.address}
              </p>
              <a
                href={CONTACT_INFO.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-200 transition-colors hover:border-orange-400 hover:text-white"
              >
                Open in Google Maps
              </a>
            </div>
            <div className="flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white/10">
              <iframe
                className="h-full w-full"
                src={CONTACT_INFO.mapsEmbedUrl}
                allowFullScreen
                loading="lazy"
                title="HASC VN Map"
              />
            </div>
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
