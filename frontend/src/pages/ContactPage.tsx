// frontend/src/pages/ContactPage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const ContactPage: React.FC = () => {
  const { t } = useTranslation(); // Initialize useTranslation
  return (
    <div className="container mx-auto px-6 py-8 max-w-screen-xl font-sans min-h-screen">
      <h1 className="text-4xl font-bold text-slate-industrial mb-8">{t('common.contact_us')}</h1>

      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <p className="text-lg text-gray-700 mb-4">
          {t('common.contact_intro')} {/* New key for intro text */}
        </p>

        <div className="space-y-4 text-gray-800">
          <div>
            <h2 className="text-xl font-semibold mb-1">{t('common.our_address')}</h2> {/* New key */}
            <p>123 Industrial Park Road</p>
            <p>Innovation City, State 98765</p>
            <p>Country</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-1">{t('common.phone')}</h2>
            <p>+1 (555) 123-4567</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-1">{t('common.email')}</h2>
            <p>info@hascvn.com</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-1">{t('common.business_hours')}</h2> {/* New key */}
            <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
            <p>Saturday: 10:00 AM - 2:00 PM</p>
            <p>Sunday: Closed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;