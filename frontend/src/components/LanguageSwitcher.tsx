// frontend/src/components/LanguageSwitcher.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200
          ${i18n.language === 'en' ? 'bg-orange-safety text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('vi')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200
          ${i18n.language === 'vi' ? 'bg-orange-safety text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
      >
        VN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
