'use client';

import React from 'react';
import { FaRegSun, FaDatabase, FaWrench, FaChartLine } from 'react-icons/fa'; // Importing some sample icons for challenges and solutions
import Image from 'next/image'; // Assuming you have images/icons for the challenges and solutions

const AgriculturalChallengesAndSolutions: React.FC = () => {
  return (
    <section className="py-16 px-4 bg-white" id="challenges-solutions">
      <div className="max-w-6xl mx-auto">
        {/* Section Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-center text-[var(--medium-green)] mb-8">
          Addressing Agricultural Challenges in ECOWAS
        </h2>

        {/* Supporting Text */}
        <p className="text-center text-[var(--medium-green)] mb-12">
          Innovation and data are crucial to overcoming the pressing agricultural challenges faced by ECOWAS countries. At ECOAGRIS, we are committed to delivering practical solutions for a sustainable future.
        </p>

        {/* Split Layout for Challenges and Solutions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Challenges */}
          <div className="space-y-6">
            <div className="bg-[var(--yellow)] p-6 rounded-lg shadow-lg hover:scale-105 transition-transform">
              <div className="flex items-center mb-4">
                <FaRegSun className="text-4xl text-[var(--dark-green)] mr-4" />
                <h3 className="text-xl font-semibold text-[var(--dark-green)]">Climate Change</h3>
              </div>
              <p className="text-[var(--dark-green)]">Climate change affects crop yields, water availability, and farming conditions across the ECOWAS region.</p>
            </div>
            <div className="bg-[var(--yellow)] p-6 rounded-lg shadow-lg hover:scale-105 transition-transform">
              <div className="flex items-center mb-4">
                <FaDatabase className="text-4xl text-[var(--dark-green)] mr-4" />
                <h3 className="text-xl font-semibold text-[var(--dark-green)]">Limited Access to Data</h3>
              </div>
              <p className="text-[var(--dark-green)]">Many farmers lack access to up-to-date agricultural data that could help them make informed decisions.</p>
            </div>
            <div className="bg-[var(--yellow)] p-6 rounded-lg shadow-lg hover:scale-105 transition-transform">
              <div className="flex items-center mb-4">
                <FaWrench className="text-4xl text-[var(--dark-green)] mr-4" />
                <h3 className="text-xl font-semibold text-[var(--dark-green)]">Poor Infrastructure</h3>
              </div>
              <p className="text-[var(--dark-green)]">Inadequate infrastructure hinders efficient transportation and distribution of agricultural products.</p>
            </div>
            <div className="bg-[var(--yellow)] p-6 rounded-lg shadow-lg hover:scale-105 transition-transform">
              <div className="flex items-center mb-4">
                <FaChartLine className="text-4xl text-[var(--dark-green)] mr-4" />
                <h3 className="text-xl font-semibold text-[var(--dark-green)]">Low Productivity</h3>
              </div>
              <p className="text-[var(--dark-green)]">Many regions face stagnant or low agricultural productivity due to outdated farming practices and lack of innovation.</p>
            </div>
          </div>

          {/* Solutions */}
          <div className="space-y-6">
            <div className="bg-[var(--medium-green)] text-[var(--white)] p-6 rounded-lg shadow-lg hover:scale-105 transition-transform">
              <div className="flex items-center mb-4">
                <FaRegSun className="text-4xl text-[var(--white)] mr-4" />
                <h3 className="text-xl font-semibold">Climate-Smart Agriculture</h3>
              </div>
              <p>Implementing climate-smart agriculture practices that improve resilience to climate change and boost productivity.</p>
            </div>
            <div className="bg-[var(--medium-green)] text-[var(--white)] p-6 rounded-lg shadow-lg hover:scale-105 transition-transform">
              <div className="flex items-center mb-4">
                <FaDatabase className="text-4xl text-[var(--white)] mr-4" />
                <h3 className="text-xl font-semibold">Data Transparency</h3>
              </div>
              <p>Providing farmers with transparent, accurate, and timely data to make better decisions about crops, weather, and resources.</p>
            </div>
            <div className="bg-[var(--medium-green)] text-[var(--white)] p-6 rounded-lg shadow-lg hover:scale-105 transition-transform">
              <div className="flex items-center mb-4">
                <FaWrench className="text-4xl text-[var(--white)] mr-4" />
                <h3 className="text-xl font-semibold">Resource Optimization</h3>
              </div>
              <p>Optimizing the use of resources such as water, fertilizers, and land to improve yield efficiency and sustainability.</p>
            </div>
            <div className="bg-[var(--medium-green)] text-[var(--white)] p-6 rounded-lg shadow-lg hover:scale-105 transition-transform">
              <div className="flex items-center mb-4">
                <FaChartLine className="text-4xl text-[var(--white)] mr-4" />
                <h3 className="text-xl font-semibold">Regional Collaboration</h3>
              </div>
              <p>Promoting regional collaboration for shared agricultural knowledge, infrastructure, and policy development to enhance productivity.</p>
            </div>
          </div>
        </div>

        {/* Call-to-action Button */}
        <div className="text-center mt-12">
          <a
            href="#impact"
            className="bg-[var(--medium-green)] text-[var(--white)] px-6 py-3 rounded-lg hover:bg-[var(--dark-green)] transition-all"
          >
            Learn More About Our Impact
          </a>
        </div>
      </div>
    </section>
  );
};

export default AgriculturalChallengesAndSolutions;
