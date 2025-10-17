'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface NewsItem {
  title: string;
  description: string;
  pubDate: string;
  link: string;
  image_url?: string;
}
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const NewsUpdates: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/news');
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        // Ensure data.results exists and is an array
        setNews(Array.isArray(data.results) ? data.results : []);
      } catch (error) {
        console.error('Error loading news:', error);
        setError('Failed to load news. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  if (loading) {
    return (
      <section className="py-16 text-center bg-[var(--white)]">
        <p className="text-[var(--medium-green)] font-semibold">
          Loading the latest agricultural updates...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 text-center bg-[var(--white)]">
        <p className="text-red-600 font-semibold">{error}</p>
      </section>
    );
  }

  return (
    <section className="py-16 bg-[var(--white)]" id="news">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-[var(--medium-green)]">
          Latest News and Updates
        </h2>
        <div className="bg-[var(--yellow)] h-[3px] w-[60px] mx-auto mt-4 mb-8 rounded-full"></div>

        {/* ✅ Safe rendering of news items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {(news || []).slice(0, 6).map((item, index) => (
            <div
              key={index}
              className="bg-[var(--white)] rounded-xl shadow-md hover:shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative w-full h-48 overflow-hidden">
                {/* <Image
                  src={item.image_url || '/default-news.jpg'}
                  alt={item.title || 'News Image'}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                /> */}
                <Image
  src={item.image_url && isValidUrl(item.image_url) ? item.image_url : '/default-news.jpg'}
  alt={item.title || 'News Image'}
  fill
  className="object-cover transition-transform duration-500 hover:scale-105"
/>
              </div>

              <div className="p-5">
                <p className="text-sm text-gray-500 mb-2">{item.pubDate}</p>
                <h3 className="text-lg font-semibold text-[var(--medium-green)] mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                  {item.description}
                </p>

                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[var(--medium-green)] text-[var(--white)] px-4 py-2 rounded-full font-semibold text-sm hover:bg-[var(--dark-green)] transition-all duration-300"
                >
                  Read More →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <a
            href="/news"
            className="inline-block bg-[var(--yellow)] text-[var(--medium-green)] font-semibold px-6 py-3 rounded-full hover:bg-[var(--medium-green)] hover:text-[var(--white)] transition-all duration-300"
          >
            View All Updates
          </a>
        </div>
      </div>
    </section>
  );
};

export default NewsUpdates;
