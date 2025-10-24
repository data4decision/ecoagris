'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const HeroSection: React.FC = () => {
  const { t } = useTranslation('common');
  const [currentSlide, setCurrentSlide] = useState(0);

  // ✅ Define slides with static translation keys
  const slides = [
    'agricInput',
    'agroHydro',
    'agricProduction',
    'agricMarket',
    'foodStocks',
    'nutrition',
    'livestock',
    'fishery',
    'aquaculture',
    'research',
    'macro'
  ];

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section className="relative bg-[var(--medium-green)] text-white py-20 px-6 sm:px-12">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/Hero.jpg"
          alt="Agriculture in ECOWAS"
          fill
          className="object-cover opacity-60"
          priority
          sizes="100vw"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center">
          {t('hero.headline')}
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-2xl text-center mb-6">
          {t('hero.subheadline')}
        </p>

        {/* CTA Button */}
        <div className="text-center mb-12">
          <button
            className="bg-[var(--yellow)] text-[var(--dark-green)] px-8 py-4 rounded-lg text-xl hover:bg-[var(--yellow)] transition focus:outline-none focus:ring-2 focus:ring-[var(--white)]"
          >
            {t('hero.cta')}
          </button>
        </div>

        {/* Carousel */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((key, index) => (
              <div
                key={key}
                className="min-w-full text-center p-6 text-[var(--white)]"
              >
                <h2 className="text-3xl font-bold mb-2">
                  {t(`hero.slides.${key}.title`)}
                </h2>
                <p className="text-[17px] sm:text-[20px] font-semibold">
                  {t(`hero.slides.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
