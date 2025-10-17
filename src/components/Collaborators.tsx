'use client';

import React from 'react';
import Image from 'next/image';

const partners = [
  { name: 'ECOWAS Commission', logo: '/ECOWAS Commission.png', role: 'Regional Coordination' },
  { name: 'FAO', logo: '/fao.png', role: 'Food Security & Data Systems' },
  { name: 'IFAD', logo: '/ifad.png', role: 'Agricultural Innovation' },
  { name: 'World Bank', logo: '/world.png', role: 'Sustainable Development' },
  { name: 'AfDB', logo: '/afdb.png', role: 'Investment & Capacity Building' },
];

const Collaborators: React.FC = () => {
  return (
    <section className="py-16 bg-[var(--white)]" id="partners">
      <div className="max-w-6xl mx-auto px-6 text-center">
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-[var(--medium-green)]">
          Our Partners and Collaborators
        </h2>

        {/* Decorative Divider */}
        <div className="bg-[var(--yellow)] h-[3px] w-[60px] mx-auto mt-4 mb-6 rounded-full"></div>

        {/* Subtext */}
        <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed">
          ECOAGRIS thrives on collaboration. Our partners — from ECOWAS institutions to international 
          organizations — work together to strengthen food systems, enhance data reliability, and 
          promote sustainable agricultural development across West Africa.
        </p>

        {/* Partner Logos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 mt-12 items-center justify-center">
          {partners.map((partner, index) => (
            <div
              key={index}
              className="bg-[var(--white)] shadow-md rounded-xl p-4 flex flex-col items-center justify-center 
                        hover:scale-105 hover:shadow-lg transition-all duration-300 ease-in-out border border-gray-100"
            >
              <Image
                src={partner.logo}
                alt={partner.name}
                width={120}
                height={80}
                className="object-contain w-24 h-16 mb-2"
              />
              <p className="text-[var(--medium-green)] font-semibold text-sm">{partner.name}</p>
              <p className="text-gray-600 text-xs">{partner.role}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-14 text-center">
          <p className="text-gray-700 font-medium mb-4">
            Interested in partnering with <span className="text-[var(--medium-green)] font-semibold">ECOAGRIS</span>?
          </p>
          <a
            href="/contact"
            className="inline-block bg-[var(--medium-green)] text-[var(--white)] px-6 py-3 rounded-full 
                       font-semibold shadow-md hover:bg-[var(--dark-green)] transition-all duration-300"
          >
            Become a Partner
          </a>
        </div>
      </div>
    </section>
  );
};

export default Collaborators;
