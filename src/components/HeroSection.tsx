'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';

// JSON data imported (replace this with the real data or fetch from an API)
const simulatedInputData = [
  {
    country: "Benin",
    fertilizerTons: 94672,
    cerealSeedsTons: 62384,
    pesticideLiters: 25865,
    improvedSeedUsePct: 26.1,
    fertilizerKgPerHa: 28.8,
  },
  {
    country: "Burkina Faso",
    fertilizerTons: 162064,
    cerealSeedsTons: 95862,
    pesticideLiters: 45232,
    improvedSeedUsePct: 25.0,
    fertilizerKgPerHa: 40.7,
  },
  // Add other countries here
];

const HeroSection: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>('Benin');
  const [countryData, setCountryData] = useState<any>(simulatedInputData[0]);

  // Function to change selected country (for location selector)
  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const countryName = event.target.value;
    setSelectedCountry(countryName);

    // Find the data for the selected country
    const countryData = simulatedInputData.find(
      (data) => data.country === countryName
    );
    if (countryData) setCountryData(countryData);
  };

  return (
    <section className="relative bg-green-600 text-white py-20 px-6 sm:px-12">
      {/* Background image with subtle animations */}
      <div className="absolute inset-0">
        <Image
          src="/Hero.jpg"
          alt="Agriculture in ECOWAS"
          className="w-full h-full object-cover opacity-60" width={500} height={500}
        />
      </div>

      <div className="relative z-10">
        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center">
          Empowering Sustainable Agriculture Across ECOWAS
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-2xl text-center mb-6">
          Connecting ECOWAS countries with agricultural insights for growth and resilience.
        </p>

        {/* Location Selector */}
        <div className="text-center mb-8">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            className="bg-white text-green-600 border-2 border-green-600 p-2 rounded-md"
          >
            {simulatedInputData.map((data) => (
              <option key={data.country} value={data.country}>
                {data.country}
              </option>
            ))}
          </select>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <button className="bg-yellow-500 text-green-800 px-8 py-4 rounded-lg text-xl hover:bg-yellow-600 transition">
            Explore Data
          </button>
        </div>

        {/* Statistics Snapshot */}
        <div className="flex justify-center space-x-4 mt-12">
          <div className="bg-white text-green-600 p-4 rounded-md shadow-lg w-32 text-center">
            <p className="font-bold text-2xl">{countryData.fertilizerTons}</p>
            <p>Fertilizer Tons</p>
          </div>
          <div className="bg-white text-green-600 p-4 rounded-md shadow-lg w-32 text-center">
            <p className="font-bold text-2xl">{countryData.cerealSeedsTons}</p>
            <p>Cereal Seeds Tons</p>
          </div>
          <div className="bg-white text-green-600 p-4 rounded-md shadow-lg w-32 text-center">
            <p className="font-bold text-2xl">{countryData.pesticideLiters}</p>
            <p>Pesticide Liters</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
