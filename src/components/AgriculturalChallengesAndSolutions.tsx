'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaRegSun, FaDatabase, FaWrench, FaChartLine } from 'react-icons/fa';

const AgriculturalChallengesAndSolutions: React.FC = () => {
  const { t } = useTranslation('common'); // ✅ use "common" namespace

  return (
    <section className="py-16 px-4 bg-white" id="challenges-solutions">
      <div className="max-w-6xl mx-auto">
        {/* Section Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-center text-[var(--medium-green)] mb-8">
          {t('challenges.title')}
        </h2>

        {/* Supporting Text */}
        <p className="text-center text-[var(--medium-green)] mb-12">
          {t('challenges.subtitle')}
        </p>

        {/* Split Layout for Challenges and Solutions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Challenges */}
          <div className="space-y-6">
            {[
              { icon: <FaRegSun />, title: t('challenges.list.climateChange.title'), desc: t('challenges.list.climateChange.desc') },
              { icon: <FaDatabase />, title: t('challenges.list.dataAccess.title'), desc: t('challenges.list.dataAccess.desc') },
              { icon: <FaWrench />, title: t('challenges.list.infrastructure.title'), desc: t('challenges.list.infrastructure.desc') },
              { icon: <FaChartLine />, title: t('challenges.list.lowProductivity.title'), desc: t('challenges.list.lowProductivity.desc') },
            ].map((item, idx) => (
              <div key={idx} className="bg-[var(--yellow)] p-6 rounded-lg shadow-lg hover:scale-105 transition-transform">
                <div className="flex items-center mb-4">
                  <div className="text-4xl text-[var(--dark-green)] mr-4">{item.icon}</div>
                  <h3 className="text-xl font-semibold text-[var(--dark-green)]">{item.title}</h3>
                </div>
                <p className="text-[var(--dark-green)]">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Solutions */}
          <div className="space-y-6">
            {[
              { icon: <FaRegSun />, title: t('solutions.list.climateSmart.title'), desc: t('solutions.list.climateSmart.desc') },
              { icon: <FaDatabase />, title: t('solutions.list.dataTransparency.title'), desc: t('solutions.list.dataTransparency.desc') },
              { icon: <FaWrench />, title: t('solutions.list.resourceOptimization.title'), desc: t('solutions.list.resourceOptimization.desc') },
              { icon: <FaChartLine />, title: t('solutions.list.regionalCollaboration.title'), desc: t('solutions.list.regionalCollaboration.desc') },
            ].map((item, idx) => (
              <div key={idx} className="bg-[var(--medium-green)] text-[var(--white)] p-6 rounded-lg shadow-lg hover:scale-105 transition-transform">
                <div className="flex items-center mb-4">
                  <div className="text-4xl text-[var(--white)] mr-4">{item.icon}</div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                </div>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call-to-action Button */}
        <div className="text-center mt-12">
          <a
            href="#impact"
            className="bg-[var(--medium-green)] text-[var(--white)] px-6 py-3 rounded-lg hover:bg-[var(--dark-green)] transition-all"
          >
            {t('challenges.cta')}
          </a>
        </div>
      </div>
    </section>
  );
};

export default AgriculturalChallengesAndSolutions;
