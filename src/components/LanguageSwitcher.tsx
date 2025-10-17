'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Check window width only on the client side
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 640);
      // Optional: Handle window resize dynamically
      const handleResize = () => setIsMobile(window.innerWidth < 640);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const changeLanguage = (lang: string) => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  };

  return (
    <div className="mt-1">
      <select
        onChange={(e) => changeLanguage(e.target.value)}
        value={i18n.language}
        className="bg-[#f47b25] text-white rounded px-2 py-1 text-sm sm:px-3 sm:py-2 sm:text-base"
      >
        {/* Display short name for mobile, full name for desktop/tablet */}
        <option value="en">{isMobile ? 'EN' : 'English'}</option>
        <option value="fr">{isMobile ? 'FR' : 'Français'}</option>
        <option value="pt">{isMobile ? 'PT' : 'Português'}</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
