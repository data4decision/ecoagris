'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFacebookF, FaLinkedinIn, FaTwitter, FaYoutube } from 'react-icons/fa';

const ContactSection: React.FC = () => {
  // ✅ explicitly use the "common" namespace
  const { t } = useTranslation('common');

  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <section
      id="contact"
      className="py-20 bg-[var(--yellow)] text-[var(--medium-green)] animate-slideInFromBottom"
    >
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-[60%_40%] gap-12 items-center">
        {/* Left - Contact Form */}
        <div className="bg-[var(--white)] rounded-2xl p-8 shadow-xl text-[var(--dark-green)]">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-[var(--medium-green)]">
            {t('contact.title')}
          </h2>
          <p className="text-center text-gray-600 mb-8">{t('contact.subtitle')}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <input
              type="text"
              name="name"
              placeholder={t('contact.form.name')}
              value={formData.name}
              onChange={handleChange}
              required
              className="p-3 rounded-lg border border-[var(--medium-green)] focus:ring-2 focus:ring-[var(--yellow)] outline-none"
            />
            <input
              type="email"
              name="email"
              placeholder={t('contact.form.email')}
              value={formData.email}
              onChange={handleChange}
              required
              className="p-3 rounded-lg border border-[var(--medium-green)] focus:ring-2 focus:ring-[var(--yellow)] outline-none"
            />
            <textarea
              name="message"
              placeholder={t('contact.form.message')}
              rows={4}
              value={formData.message}
              onChange={handleChange}
              required
              className="p-3 rounded-lg border border-[var(--medium-green)] focus:ring-2 focus:ring-[var(--yellow)] outline-none resize-none"
            />
            <button
              type="submit"
              className="bg-[var(--medium-green)] text-[var(--white)] hover:bg-[var(--yellow)] hover:text-[var(--dark-green)] transition-all duration-300 py-3 rounded-full font-semibold shadow-md"
            >
              {t('contact.form.submit')}
            </button>
          </form>

          {success && (
            <p className="mt-4 text-center text-[var(--medium-green)] font-semibold">
              ✅ {t('contact.success')}
            </p>
          )}
        </div>

        {/* Right - Info & Socials */}
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <h3 className="text-2xl font-semibold text-[var(--yellow)]">
            {t('contact.joinTitle')}
          </h3>
          <p className="text-[var(--white)] max-w-sm">{t('contact.joinDesc')}</p>

          {/* Social Links */}
          <div className="flex gap-5 mt-4">
            <a
              href="https://facebook.com"
              target="_blank"
              className="bg-[var(--dark-green)] hover:bg-[var(--white)] text-[var(--white)] hover:text-blue-700 transition-all p-3 rounded-full shadow-md"
            >
              <FaFacebookF size={18} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              className="bg-[var(--dark-green)] hover:bg-blue-500 text-[var(--white)] transition-all p-3 rounded-full shadow-md"
            >
              <FaTwitter size={18} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              className="bg-[var(--dark-green)] hover:bg-blue-800 text-[var(--white)] transition-all p-3 rounded-full shadow-md"
            >
              <FaLinkedinIn size={18} />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              className="bg-[var(--dark-green)] hover:bg-[var(--white)] text-[var(--white)] hover:text-red-500 transition-all p-3 rounded-full shadow-md"
            >
              <FaYoutube size={18} />
            </a>
          </div>

          {/* Contact Info */}
          <div className="mt-8 text-sm leading-6">
            <p>📍 {t('contact.info.address')}</p>
            <p>✉️ {t('contact.info.email')}</p>
            <p>☎️ {t('contact.info.phone')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
