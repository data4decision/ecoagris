'use client';

import Image from 'next/image';
import React, { useState } from 'react';

// Define the structure of the country data
interface CountryData {
  country: string;
  fertilizerTons: number;
  cerealSeedsTons: number;
  pesticideLiters: number;
  improvedSeedUsePct: number;
  fertilizerKgPerHa: number;
}

// Simulated data (replace with API fetch in production)
const simulatedInputData: CountryData[] = [
  {
    country: 'Benin',
    fertilizerTons: 94672,
    cerealSeedsTons: 62384,
    pesticideLiters: 25865,
    improvedSeedUsePct: 26.1,
    fertilizerKgPerHa: 28.8,
  },
  {
    country: 'Burkina Faso',
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
  const [countryData, setCountryData] = useState<CountryData>(
    simulatedInputData[0]
  );

  // Handle country selection change
  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const countryName = event.target.value;
    setSelectedCountry(countryName);

    const selectedData = simulatedInputData.find(
      (data) => data.country === countryName
    );
    if (selectedData) {
      setCountryData(selectedData);
    }
  };

  return (
    <section className="relative bg-green-600 text-white py-20 px-6 sm:px-12">
      {/* Background image with subtle animations */}
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
          Empowering Sustainable Agriculture Across ECOWAS
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-2xl text-center mb-6">
          Connecting ECOWAS countries with agricultural insights for growth and
          resilience.
        </p>

        {/* Location Selector */}
        <div className="text-center mb-8">
          <label htmlFor="country-select" className="sr-only">
            Select a country
          </label>
          <select
            id="country-select"
            value={selectedCountry}
            onChange={handleCountryChange}
            className="bg-white text-green-600 border-2 border-green-600 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            aria-label="Select a country"
          >
            {simulatedInputData.map((data) => (
              <option key={data.country} value={data.country}>
                {data.country}
              </option>
            ))}
          </select>
        </div>

        {/* CTA Button */}
        <div className="text-center mb-12">
          <button
            className="bg-yellow-500 text-green-800 px-8 py-4 rounded-lg text-xl hover:bg-yellow-600 transition focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Explore agricultural data"
          >
            Explore Data
          </button>
        </div>

        {/* Statistics Snapshot */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 justify-center mt-12">
          <div className="bg-white text-green-600 p-4 rounded-md shadow-lg text-center">
            <p className="font-bold text-2xl">
              {countryData.fertilizerTons.toLocaleString()}
            </p>
            <p className="text-sm">Fertilizer (Tons)</p>
          </div>
          <div className="bg-white text-green-600 p-4 rounded-md shadow-lg text-center">
            <p className="font-bold text-2xl">
              {countryData.cerealSeedsTons.toLocaleString()}
            </p>
            <p className="text-sm">Cereal Seeds (Tons)</p>
          </div>
          <div className="bg-white text-green-600 p-4 rounded-md shadow-lg text-center">
            <p className="font-bold text-2xl">
              {countryData.pesticideLiters.toLocaleString()}
            </p>
            <p className="text-sm">Pesticides (Liters)</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;