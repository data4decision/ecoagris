'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import countryCode from '@/app/flags/countryCode.json'; // Adjust path to your countryCode.json

interface Country {
  name: string;
  dial_code: string;
  code: string;
  flag: string;
}

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="bg-[var(--medium-green)] text-white shadow-md px-6 py-4 md:flex justify-between">
      <div className="flex items-center justify-between">
        <Link href="https://www.data4decision.org/" passHref>
          <div className="text-xl font-bold flex items-center">
            <Image
              src="/logo.png"
              alt="Data4Decision Logo"
              width={32}
              height={32}
              className="inline-block w-8 mr-2"
            />
            Data4Decision
          </div>
        </Link>

        {/* Hamburger menu for mobile */}
        <button
          className="md:hidden focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Menu Links (visible on md and up OR when toggled on mobile) */}
      <ul
        className={`mt-4 md:mt-0 md:flex items-center space-y-4 md:space-y-0 md:space-x-6 ${menuOpen ? 'block' : 'hidden'} md:block`}
      >
        <li>
          <Link
            href="https://www.data4decision.org/about"
            className="hover:text-[var(--yellow)] block"
          >
            About
          </Link>
        </li>

        <li className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="hover:text-[var(--yellow)] block w-full text-left"
          >
            Countries ▾
          </button>
          {dropdownOpen && (
            <ul className="absolute z-50 bg-[var(--white)] text-[var(--medium-green)] shadow-lg rounded-md w-52 mt-2">
              {countryCode.map(({ code, name, flag }: Country) => (
                <li
                  key={code}
                  className="border-b last:border-0 hover:bg-gray-100"
                >
                  <Link
                    href={`/${code.toLowerCase()}/login`} // Country-specific login URL
                    className="flex items-center px-4 py-2"
                  >
                    <Image
                      src={flag}
                      alt={`${name} flag`}
                      width={20}
                      height={20}
                      className="mr-2 object-contain"
                    />
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>

        <li>
          <Link
            href="/admin/login"
            className="hover:text-[var(--yellow)] block"
          >
            Admin Login
          </Link>
        </li>

        <li>
          <Link
            href="/signup"
            className="bg-[var(--yellow)] text-[var(--medium-green)] px-4 py-2 rounded hover:bg-opacity-90 transition block text-center"
          >
            Get Started
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
