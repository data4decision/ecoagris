'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import countryCodes from '@/assets/countryCodes.json';
import Image from 'next/image';

const FlagGrid: React.FC = () => {
  const { t } = useTranslation('common'); // ✅ use the correct namespace

  return (
    <section className="py-16 bg-[var(--yellow)]" id="countries">
      <div className="max-w-6xl mx-auto px-4">
        {/* Translated Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-center text-[var(--olive-green)] mb-8">
          {t('flagGrid.title')}
        </h2>

        {/* Translated Description */}
        <p className="text-center text-[var(--olive-green)] mb-10">
          {t('flagGrid.description')}
        </p>

        {/* Country Flag Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {countryCodes.map(({ code, name }) => (
            <a
              href={`/login`}
              key={code}
              className="flex flex-col items-center justify-center p-4 bg-white rounded shadow hover:shadow-lg hover:scale-105 transition-transform"
            >
              <Image
                src={`/${code.toLowerCase()}.png`}
                alt={`${name} Flag`}
                width={120}
                height={120}
                className="w-16 h-10 object-contain mb-2"
              />
              <span className="text-sm font-medium text-[var(--olive-green)]">{name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FlagGrid;
