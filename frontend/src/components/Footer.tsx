// frontend/src/components/Footer.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Link } from 'react-router-dom';
import { CONTACT_INFO } from '../constants/contactInfo';

const Footer: React.FC = () => {
  const { t, i18n } = useTranslation(); // Initialize useTranslation
  const [showMap, setShowMap] = useState(false);
  const contactAddress =
    i18n.resolvedLanguage?.startsWith('en') ? CONTACT_INFO.address_en : CONTACT_INFO.address_vi;
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
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <img
                src="/logo.webp"
                alt="HASC VN"
                className="h-[150px] w-[216px] rounded-full object-contain opacity-90"
                loading="lazy"
              />
              <img
                src="/approval.webp"
                alt="HASC approval badge"
                className="h-[96px] w-[96px] translate-x-0 rounded-full object-contain opacity-90 sm:h-[115px] sm:w-[115px] sm:translate-x-5"
                loading="lazy"
              />
            </div>
          </div>

          {/* Section 2: Contact + Map */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
            <div className="flex-1 rounded-lg border border-slate-200 bg-white/10 p-4">
              <h3 className="text-lg font-semibold mb-3">{t('common.contact')}</h3>
              <p className="text-sm text-gray-300">
                {t('common.email')}:
                <span className="ml-2">
                  {CONTACT_INFO.emails.map((email, index) => (
                    <span key={email}>
                      {email}
                      {index < CONTACT_INFO.emails.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </span>
              </p>
              <p className="text-sm text-gray-300">
                {t('common.phone')}:
                <span className="ml-2">
                  {CONTACT_INFO.phones.map((phone, index) => (
                    <span key={phone}>
                      {phone}
                      {index < CONTACT_INFO.phones.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </span>
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-gray-300">
                <span>{t('common.find_us', { defaultValue: 'Find us' })}</span>
                <div className="flex items-center gap-2">
                  <a
                    href={CONTACT_INFO.socials.zalo}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Zalo"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/60 text-xs font-bold text-gray-200 transition-colors hover:border-orange-400 hover:text-white"
                  >
                    <img src="/icons8-zalo.svg" alt="" className="h-4 w-4 object-contain" />
                  </a>
                  <a
                    href={CONTACT_INFO.socials.facebook}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/60 text-xs font-bold text-gray-200 transition-colors hover:border-orange-400 hover:text-white"
                  >
                    <img src="/icons8-facebook.svg" alt="" className="h-4 w-4 object-contain" />
                  </a>
                  <a
                    href="mailto:hasc@hascvn.com.vn"
                    aria-label="Gmail"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/60 text-xs font-bold text-gray-200 transition-colors hover:border-orange-400 hover:text-white"
                  >
                    <img src="/icons8-gmail.svg" alt="" className="h-4 w-4 object-contain" />
                  </a>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-300 font-mono">
                {contactAddress}
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
              {showMap ? (
                <iframe
                  className="h-full w-full"
                  src={CONTACT_INFO.mapsEmbedUrl}
                  allowFullScreen
                  loading="lazy"
                  title="HASC VN Map"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-xs text-gray-300">
                  <p>{t('common.map_hint', { defaultValue: 'Map loads on demand to avoid blockers.' })}</p>
                  <button
                    type="button"
                    onClick={() => setShowMap(true)}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-200 transition-colors hover:border-orange-400 hover:text-white"
                  >
                    {t('common.map_load', { defaultValue: 'Load Map' })}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-5 pt-5 text-sm text-gray-400">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.2em] text-gray-400">
              <Link to="/privacy" className="hover:text-white transition-colors duration-200">
                {t('common.privacy_policy')}
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
