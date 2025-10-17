'use client'; // Ensure this is a client component for Next.js

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { createUserWithEmailAndPassword, AuthError } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/app/lib/firebase';

// Define the structure of country data
interface Country {
  name: string;
  dial_code: string;
  code: string;
  flag: string;
}

const SignupPage = () => {
  // State for form inputs and UI
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null); // Explicitly typed as string | null
  const [country, setCountry] = useState<string>('Benin');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  // Country data for dropdown
  const countryData: Country[] = [
    { name: 'Benin', dial_code: '+229', code: 'BJ', flag: '/flags/bj.png' },
    { name: 'Burkina Faso', dial_code: '+226', code: 'BF', flag: '/flags/bf.png' },
    { name: 'Cape Verde', dial_code: '+238', code: 'CV', flag: '/flags/cv.png' },
    { name: "Côte d'Ivoire", dial_code: '+225', code: 'CI', flag: '/flags/ci.png' },
    { name: 'Gambia', dial_code: '+220', code: 'GM', flag: '/flags/gm.png' },
    { name: 'Ghana', dial_code: '+233', code: 'GH', flag: '/flags/gh.png' },
    { name: 'Guinea', dial_code: '+224', code: 'GN', flag: '/flags/gn.png' },
    { name: 'Guinea-Bissau', dial_code: '+245', code: 'GW', flag: '/flags/gw.png' },
    { name: 'Liberia', dial_code: '+231', code: 'LR', flag: '/flags/lr.png' },
    { name: 'Mali', dial_code: '+223', code: 'ML', flag: '/flags/ml.png' },
    { name: 'Niger', dial_code: '+227', code: 'NE', flag: '/flags/ne.png' },
    { name: 'Nigeria', dial_code: '+234', code: 'NG', flag: '/flags/ng.png' },
    { name: 'Senegal', dial_code: '+221', code: 'SN', flag: '/flags/sn.png' },
    { name: 'Sierra Leone', dial_code: '+232', code: 'SL', flag: '/flags/sl.png' },
    { name: 'Togo', dial_code: '+228', code: 'TG', flag: '/flags/tg.png' },
  ];

  // Function to get country details by name
  const getCountryDetails = (countryName: string): Country | undefined => {
    return countryData.find((country) => country.name === countryName);
  };

  // Handle form submission for signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear any existing error

    // Validate country selection
    const countryDetails = getCountryDetails(country);
    if (!countryDetails) {
      setError('Invalid country selected.');
      return;
    }

    // Normalize phone number
    let normalizedPhoneNumber = phoneNumber.replace(/\s+/g, '');
    if (!normalizedPhoneNumber.startsWith(countryDetails.dial_code)) {
      normalizedPhoneNumber = `${countryDetails.dial_code}${normalizedPhoneNumber}`;
    }

    // Validate phone number country code
    const phoneCountryCode = normalizedPhoneNumber.substring(0, countryDetails.dial_code.length);
    if (phoneCountryCode !== countryDetails.dial_code) {
      setError('The phone number country code does not match the selected country.');
      return;
    }

    // Validate phone number format (basic regex for digits after country code)
    const phoneRegex = /^\+\d{1,4}\d{6,}$/;
    if (!phoneRegex.test(normalizedPhoneNumber)) {
      setError('Please enter a valid phone number with the correct country code.');
      return;
    }

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user details in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        occupation,
        gender,
        email,
        phoneNumber: normalizedPhoneNumber,
        country,
        createdAt: new Date(),
      });

      console.log('User signed up and data stored in Firestore!');
      router.push('/login'); // Redirect to login page
    } catch (error: unknown) {
      // Use AuthError type for Firebase errors
      const authError = error as AuthError;
      if (authError.code === 'auth/email-already-in-use') {
        setError(
          'This email is already associated with an existing account. Please log in or use a different email.'
        );
      } else {
        setError(`Error signing up: ${authError.message || 'Unknown error'}`);
      }
    }
  };

  // Text for welcome message
  const text =
    'Welcome to ECOWAS Agricultural Information System (ECOAGRIS). Sign up by entering your details and selecting your country.';

  return (
    <div className="bg-[var(--yellow)] min-h-screen flex flex-col">
      {/* Navbar component */}
      <Navbar />

      {/* Main content */}
      <div className="flex-grow">
        <div className="bg-[var(--medium-green)] grid grid-cols-1 sm:grid-cols-2 w-[90%] max-w-5xl mx-auto mt-10 mb-10 px-5 py-4 rounded-lg">
          {/* Left section with background image and welcome text */}
          <div
            className="relative rounded-lg p-10 bg-cover bg-center"
            style={{ backgroundImage: "url('/about.jpg')" }}
          >
            <span className="absolute inset-0 bg-black/20 z-0 rounded-lg"></span>
            <div className="relative z-10">
              <div className="flex items-center justify-start gap-2 mb-7">
                <Image src="/logo.png" alt="EcoAgris logo" width={40} height={40} />
                <h1 className="font-bold text-[var(--white)] text-[17px] sm:text-[20px]">
                  EcoAgris
                </h1>
              </div>
              <div className="flex flex-col leading-none">
                <h1 className="text-[var(--white)] text-[40px] sm:text-[60px] font-semibold">
                  Hello,
                </h1>
                <h1 className="text-[var(--yellow)] text-[40px] sm:text-[60px] font-bold">
                  Welcome!
                </h1>
              </div>
              <div className="mt-7">
                <h3 className="bg-[var(--olive-green)] px-4 py-3 rounded-lg text-[var(--white)] text-[12px] sm:text-[15px] font-medium">
                  {text}
                </h3>
              </div>
            </div>
          </div>

          {/* Right section with signup form */}
          <div className="ml-0 sm:ml-5 p-6 bg-[var(--white)] rounded-lg">
            <form onSubmit={handleEmailSignup} className="space-y-4">
              {/* First and Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label htmlFor="firstName" className="sr-only">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    placeholder="First Name"
                    onChange={(e) => setFirstName(e.target.value)}
                    className="text-[var(--olive-green)] bg-[var(--white)] p-2 rounded-lg border border-[var(--medium-green)] focus:ring-2 focus:ring-[var(--yellow)] outline-none w-full"
                    required
                    aria-label="First Name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="sr-only">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    placeholder="Last Name"
                    onChange={(e) => setLastName(e.target.value)}
                    className="text-[var(--olive-green)] bg-[var(--white)] p-2 rounded-lg border border-[var(--medium-green)] focus:ring-2 focus:ring-[var(--yellow)] outline-none w-full"
                    required
                    aria-label="Last Name"
                  />
                </div>
              </div>

              {/* Occupation and Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label htmlFor="occupation" className="sr-only">
                    Occupation
                  </label>
                  <input
                    id="occupation"
                    type="text"
                    value={occupation}
                    placeholder="Occupation"
                    onChange={(e) => setOccupation(e.target.value)}
                    className="text-[var(--olive-green)] bg-[var(--white)] p-2 rounded-lg border border-[var(--medium-green)] focus:ring-2 focus:ring-[var(--yellow)] outline-none w-full"
                    required
                    aria-label="Occupation"
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="sr-only">
                    Gender
                  </label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="text-[var(--olive-green)] bg-[var(--white)] p-2 rounded-lg border border-[var(--medium-green)] focus:ring-2 focus:ring-[var(--yellow)] outline-none w-full"
                    required
                    aria-label="Gender"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Phone Number and Country Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label htmlFor="phoneNumber" className="sr-only">
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    placeholder="Phone Number (e.g., +22912345678)"
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="text-[var(--olive-green)] bg-[var(--white)] p-2 rounded-lg border border-[var(--medium-green)] focus:ring-2 focus:ring-[var(--yellow)] outline-none w-full"
                    required
                    aria-label="Phone Number"
                  />
                </div>
                <div className="relative">
                  <label htmlFor="country" className="block text-[12px] sm:text-[15px] text-[var(--dark-green)] mb-1">
                    Select Your Country
                  </label>
                  {/* Hidden select for form submission */}
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="hidden"
                    required
                    aria-hidden="true"
                  >
                    {countryData.map((country) => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  {/* Custom dropdown button */}
                  <div
                    className="text-[var(--olive-green)] bg-[var(--white)] p-2 rounded-lg border border-[var(--medium-green)] focus:ring-2 focus:ring-[var(--yellow)] outline-none cursor-pointer flex items-center gap-2"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    role="button"
                    aria-label={`Select country, current: ${country}`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setIsDropdownOpen(!isDropdownOpen);
                      }
                    }}
                  >
                    <Image
                      src={getCountryDetails(country)?.flag || '/flags/bj.png'}
                      alt={`${country} flag`}
                      width={20}
                      height={20}
                      className="inline-block"
                    />
                    <span>{country}</span>
                  </div>
                  {/* Custom dropdown menu */}
                  {isDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-[var(--white)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {countryData.map((country) => (
                        <div
                          key={country.code}
                          className="flex items-center gap-2 p-2 hover:bg-[var(--yellow)]/50 cursor-pointer text-[var(--olive-green)]"
                          onClick={() => {
                            setCountry(country.name);
                            setIsDropdownOpen(false);
                          }}
                          role="option"
                          aria-selected={country.name === country} // Fixed: Should be country.name === state country
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setCountry(country.name);
                              setIsDropdownOpen(false);
                            }
                          }}
                        >
                          <Image
                            src={country.flag}
                            alt={`${country.name} flag`}
                            width={20}
                            height={20}
                            className="inline-block"
                          />
                          <span>{country.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  placeholder="Email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-[var(--olive-green)] bg-[var(--white)] p-2 rounded-lg border border-[var(--medium-green)] focus:ring-2 focus:ring-[var(--yellow)] outline-none w-full"
                  required
                  aria-label="Email"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  placeholder="Password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-[var(--olive-green)] bg-[var(--white)] p-2 rounded-lg border border-[var(--medium-green)] focus:ring-2 focus:ring-[var(--yellow)] outline-none w-full"
                  required
                  aria-label="Password"
                />
              </div>

              {/* Error Message and Submit Button */}
              <div className="mt-4">
                {error && (
                  <p className="text-red-500 text-sm" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  className="bg-[var(--wine)] hover:bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 w-full rounded-lg font-medium transition-all duration-300 ease-in-out focus:ring-2 focus:ring-[var(--yellow)] outline-none"
                  aria-label="Sign Up"
                >
                  Sign Up
                </button>
              </div>

              {/* Login Link */}
              <p className="text-[var(--dark-green)] text-[15px] mt-4 text-center">
                Already have an account?{' '}
                <Link
                  className="text-[var(--yellow)] hover:underline font-medium"
                  href="/login"
                >
                  Log In
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Footer component */}
      <Footer />
    </div>
  );
};

export default SignupPage;