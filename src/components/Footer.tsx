'use client';
import React from 'react';
import Link from 'next/link';
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaYoutube } from 'react-icons/fa';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--medium-green)] text-[var(--white)] pt-12 pb-6 px-6 md:px-16">
      {/* Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-b border-[var(--olive-green)] pb-10">
        {/* About Section */}
        <div>
          <h2 className="text-2xl font-bold mb-3 text-[var(--yellow)]">ECOAGRIS</h2>
          <p className="text-sm leading-relaxed">
            Empowering Agricultural Intelligence Across ECOWAS.
            <br />
            ECOAGRIS connects ECOWAS countries through smart agricultural data systems that
            drive evidence-based decision-making and regional food security.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-[var(--yellow)]">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-[var(--yellow)] transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-[var(--yellow)] transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link href="/data-dashboard" className="hover:text-[var(--yellow)] transition-colors">
                Data Dashboard
              </Link>
            </li>
            <li>
              <Link href="/news" className="hover:text-[var(--yellow)] transition-colors">
                News & Updates
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-[var(--yellow)] transition-colors">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Social */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-[var(--yellow)]">Connect With Us</h3>
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

          <div className="text-sm space-y-1">
            <Link href="/privacy" className="block hover:text-[var(--yellow)]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="block hover:text-[var(--yellow)]">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-6 text-center text-sm opacity-80">
        <p>
          © {currentYear} ECOAGRIS. All Rights Reserved. | Powered by{' '}
          <span className="text-[var(--yellow)] font-semibold">Data4Decision International</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
