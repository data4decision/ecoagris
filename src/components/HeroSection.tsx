'use client';

import Image from 'next/image';
import React, { useState, useEffect } from 'react';

// Define the structure of the data headline descriptions
interface DataHeadline {
  title: string;
  description: string;
}

// Data headlines with descriptions
const dataHeadlines: DataHeadline[] = [
  {
    title: 'Agric Input',
    description: 'Explore data on fertilizers, seeds, and pesticides to optimize agricultural productivity across ECOWAS.',
  },
  {
    title: 'Agro-hydro-meteorology',
    description: 'Access weather and hydrological insights to support climate-smart farming practices.',
  },
  {
    title: 'Agricultural Production',
    description: 'Analyze crop yields and production trends to enhance food security in the region.',
  },
  {
    title: 'Agricultural Market',
    description: 'Track market prices and trade data to empower farmers and stakeholders.',
  },
  {
    title: 'Food Stocks',
    description: 'Monitor food reserves to ensure stability and preparedness for shortages.',
  },
  {
    title: 'Nutrition',
    description: 'Understand nutritional outcomes to promote healthier diets and food systems.',
  },
  {
    title: 'Livestock',
    description: 'Dive into livestock production and health data to boost animal husbandry.',
  },
  {
    title: 'Fishery',
    description: 'Discover fishery production and sustainability metrics for coastal communities.',
  },
  {
    title: 'Aquaculture',
    description: 'Learn about aquaculture practices to enhance fish farming and food supply.',
  },
  {
    title: 'Agric Research Results',
    description: 'Access cutting-edge research to drive innovation in agriculture.',
  },
  {
    title: 'Macroeconomics Indices',
    description: 'Examine economic indicators impacting agriculture for informed policy-making.',
  },
];

const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % dataHeadlines.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle manual slide navigation
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

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
          Empowering Sustainable Agriculture Across ECOWAS
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-2xl text-center mb-6">
          Connecting ECOWAS countries with agricultural insights for growth and resilience.
        </p>

        {/* CTA Button */}
        <div className="text-center mb-12">
          <button
            className="bg-[var(--yellow)] text-[var(--dark-green)] px-8 py-4 rounded-lg text-xl hover:bg-[var(--yellow)] transition focus:outline-none focus:ring-2 focus:ring-[var(--white)]"
            aria-label="Explore agricultural data"
          >
            Explore Data
          </button>
        </div>

        {/* Sliding Carousel for Data Headlines */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {dataHeadlines.map((headline, index) => (
              <div
                key={headline.title}
                className="min-w-full text-center p-6 bg-[var(--white)] bg-opacity-90 text-[var(--dark-green)] rounded-lg shadow-lg"
                role="region"
                aria-live="polite"
                aria-label={`Slide ${index + 1}: ${headline.title}`}
              >
                <h2 className="text-2xl font-bold mb-2">{headline.title}</h2>
                <p className="text-lg">{headline.description}</p>
              </div>
            ))}
          </div>

          {/* Navigation Dots */}
          {/* <div className="flex justify-center mt-4 space-x-2">
            {dataHeadlines.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full ${
                  currentSlide === index
                    ? 'bg-[var(--yellow)]'
                    : 'bg-[var(--white)] opacity-50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div> */}
        </div>
      </div>

      {/* CSS for Smooth Sliding */}
      <style jsx>{`
        .transition-transform {
          transition: transform 0.5s ease-in-out;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;