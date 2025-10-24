'use client';

import Image from 'next/image';
import React from 'react';
import { FaSeedling, FaLeaf } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const AboutECOAGRIS: React.FC = () => {
  const { t } = useTranslation('common');

  return (
    <section className="bg-white text-green-800 py-20 px-6 sm:px-12">
      <div className="container mx-auto flex flex-col md:flex-row items-center md:space-x-12 space-y-12 md:space-y-0">
        
        {/* Left side (Image and Experience) */}
        <div className="md:w-1/2 flex justify-center items-center">
          <div className="relative">
            <Image
              src="/about.jpg"
              alt="Team"
              className="w-full h-auto rounded-lg shadow-2xl"
              width={500}
              height={400}
            />
            <div className="absolute bottom-6 left-6 bg-green-600 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg">
              {t('about.experience')}
            </div>
          </div>
        </div>

        {/* Right side (Text Content) */}
        <div className="md:w-1/2 space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-center md:text-left leading-tight">
            {t('about.title')}
          </h2>
          <p className="text-lg md:text-xl mb-6 text-center md:text-left">
            {t('about.description')}
          </p>
          
          {/* Mission and Vision */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-x-0 md:space-x-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center shadow-md">
                  <FaSeedling size={40}/>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-green-700">{t('about.missionTitle')}</h3>
                  <p className="text-base">{t('about.mission')}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center space-x-0 md:space-x-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-yellow-400 text-white rounded-full flex items-center justify-center shadow-md">
                  <FaLeaf size={40}/>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-green-700">{t('about.visionTitle')}</h3>
                  <p className="text-base">{t('about.vision')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex justify-center md:justify-start space-x-6 mt-8">
            <a
              href="tel:+2347040009930"
              className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-green-700 transition duration-300 shadow-lg"
            >
              {t('about.callUs')}
            </a>
            <a
              href="#"
              className="bg-yellow-500 text-green-800 px-8 py-4 rounded-lg text-lg hover:bg-yellow-600 transition duration-300 shadow-lg"
            >
              {t('about.readMore')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutECOAGRIS;
