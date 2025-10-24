'use client';

import React from 'react';
import Link from 'next/link';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation('common'); // ✅ using common.json

  return (
    <footer className="bg-[var(--medium-green)] text-[var(--white)] pt-12 pb-6 px-6 md:px-16">
      {/* Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-b border-[var(--olive-green)] pb-10">
        
        {/* About Section */}
        <div>
          <h2 className="text-2xl font-bold mb-3 text-[var(--yellow)]">ECOAGRIS</h2>
          <p className="text-sm leading-relaxed">
            {t('footer.about')}
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-[var(--yellow)]">
            {t('footer.quickLinks.title')}
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-[var(--yellow)] transition-colors">
                {t('footer.quickLinks.home')}
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-[var(--yellow)] transition-colors">
                {t('footer.quickLinks.about')}
              </Link>
            </li>
            <li>
              <Link href="/data-dashboard" className="hover:text-[var(--yellow)] transition-colors">
                {t('footer.quickLinks.dashboard')}
              </Link>
            </li>
            <li>
              <Link href="/news" className="hover:text-[var(--yellow)] transition-colors">
                {t('footer.quickLinks.news')}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-[var(--yellow)] transition-colors">
                {t('footer.quickLinks.contact')}
              </Link>
            </li>
          </ul>
        </div>

        {/* Social & Legal */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-[var(--yellow)]">
            {t('footer.connect.title')}
          </h3>

          {/* Social Icons */}
          <div className="flex space-x-4 mb-4">
            <a
              href="https://facebook.com"
              target="_blank"
              className="p-2 rounded-full bg-[var(--yellow)] text-[var(--dark-green)] hover:bg-[var(--dark-green)] hover:text-[var(--white)] transition-all transform hover:scale-110"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              className="p-2 rounded-full bg-[var(--yellow)] text-[var(--dark-green)] hover:bg-[var(--dark-green)] hover:text-[var(--white)] transition-all transform hover:scale-110"
            >
              <FaTwitter />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              className="p-2 rounded-full bg-[var(--yellow)] text-[var(--dark-green)] hover:bg-[var(--dark-green)] hover:text-[var(--white)] transition-all transform hover:scale-110"
            >
              <FaLinkedinIn />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              className="p-2 rounded-full bg-[var(--yellow)] text-[var(--dark-green)] hover:bg-[var(--dark-green)] hover:text-[var(--white)] transition-all transform hover:scale-110"
            >
              <FaYoutube />
            </a>
          </div>

          {/* Legal Links */}
          <div className="text-sm space-y-1">
            <Link href="/privacy" className="block hover:text-[var(--yellow)]">
              {t('footer.legal.privacy')}
            </Link>
            <Link href="/terms" className="block hover:text-[var(--yellow)]">
              {t('footer.legal.terms')}
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-6 text-center text-sm opacity-80">
        <p>
          © {currentYear} ECOAGRIS. {t('footer.rights')} | {t('footer.poweredBy')}{' '}
          <span className="text-[var(--yellow)] font-semibold">Data4Decision International</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
