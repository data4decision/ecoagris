'use client'; // Ensure this is at the top

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; 
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link'
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/app/lib/firebase';

const Page = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [country, setCountry] = useState<string>('Benin');
  const router = useRouter(); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


  const countryData = [
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

  const getCountryDetails = (countryName: string) => {
    return countryData.find((country) => country.name === countryName);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear any existing error

    const countryDetails = getCountryDetails(country); // Get country details
    if (!countryDetails) {
      setError('Error: Invalid country selected.');
      return;
    }

    // Normalize phone number
    let normalizedPhoneNumber = phoneNumber.replace(/\s+/g, '');
    if (!normalizedPhoneNumber.startsWith('+')) {
      normalizedPhoneNumber = `+${normalizedPhoneNumber}`;
    }

    // Validate phone number country code
    const phoneCountryCode = normalizedPhoneNumber.substring(0, countryDetails.dial_code.length);
    if (phoneCountryCode !== countryDetails.dial_code) {
      setError('Error: The country code you entered does not match the country you selected.');
      return;
    }

    // Create user with Firebase Authentication
    try {
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
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already associated with an existing account. Please log in or use a different email.');
      } else {
        setError('Error signing up: ' + error.message);
      }
    }
  };
  const text =
    'Welcome ECOWAS Agricultural Information System (ECOAGRIS). To sign up for EcoAgris, visit the signup page, enter your first name, last name, occupation, gender, email, password, phone number, select your country with its flag, and click "Sign Up".';

  return (
    <div className="bg-[var(--yellow)]">
      <Navbar />
      <div className="bg-[var(--yellow)]">
        <div className="bg-[var(--medium-green)] grid grid-cols-1 sm:grid-cols-2 w-[80%] m-auto mt-10 mb-10 px-5 py-4">
          <div
            className="relative rounded-lg pl-10 pr-10 py-5  bg-cover bg-center object-contain rounded-tl-lg rounded-bl-xl"
              style={{ backgroundImage: "url('/about.jpg')" }}
              >
                    <span className="absolute inset-0 z-0"></span>
                    <div className="flex items-center justify-start gap-2 mt-7">
                      <Image src="/logo.png" alt="EcoAgris logo" width={40} height={40} />
                      <h1 className="font-bold text-[var(--medium-green)] text-[17px] sm:text-[20px]">EcoAgris</h1>
                    </div>
                    <div className="flex flex-col leading-none mt-15">
                      <h1 className="text-[var(--white)] text-[60px] font-semibold">Hello,</h1>
                      <h1 className="text-[var(--yellow)] text-[60px] font-bold">
                        <b>Welcome!</b>
                      </h1>
                    </div>
                    <div className="mt-7">
                      <h3 className="bg-[var(--olive-green)] px-2 py-2 rounded-lg text-[var(--white)] sm:text-[15px] text-[10px] font-semibold">
                        {text}
                      </h3>
                    </div>
                  </div>
                  
          <div className="ml-5">
            <form onSubmit={handleEmailSignup}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={firstName}
                  placeholder="First Name"
                  onChange={(e) => setFirstName(e.target.value)}
                  className="text-[var(--olive-green)] bg-[var(--white)] p-2 rounded-lg border border-[var(--white)] focus:ring-2 focus:ring-[var(--yellow)] outline-none w-full"
                  required
                />
                <input
                  type="text"
                  value={lastName}
                  placeholder="Last Name"
                  onChange={(e) => setLastName(e.target.value)}
                  className="text-[var(--olive-green)] bg-[var(--white)] p-2 rounded-lg border border-[var(--white)] focus:ring-2 focus:ring-[var(--yellow)] outline-none w-full"
                  required
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={occupation}
                  placeholder="Occupation"
                  onChange={(e) => setOccupation(e.target.value)}
                  className="text-[var(--olive-green)] bg-[var(--white)] p-2 rounded-lg w-full border border-[var(--white)] focus:ring-2 focus:ring-[var(--yellow)] outline-none"
                  required
                />
                <input
                  type="text"
                  value={gender}
                  placeholder="Gender"
                  onChange={(e) => setGender(e.target.value)}
                  className="text-[var(--olive-green)] bg-[var(--white)] p-2 rounded-lg w-full border border-[var(--white)] focus:ring-2 focus:ring-[var(--yellow)] outline-none"
                  required
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="tel" // Use type="tel" for phone numbers
                  value={phoneNumber}
                  placeholder="Phone Number"
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="text-[var(--olive-green)] bg-[var(--white)] mt-6 p-2 rounded-lg w-full border border-[var(--white)] focus:ring-2 focus:ring-[var(--yellow)] outline-none"
                  required
                />
                
                  <div className="w-full relative">
  <label className="block text-[10px] sm:text-[15px] text-[var(--white)]">Select Your Country</label>
  {/* Hidden select to maintain form functionality */}
  <select
    value={country}
    onChange={(e) => setCountry(e.target.value)}
    className="hidden" // Hide the select
    required
  >
    {countryData.map((country) => (
      <option key={country.code} value={country.name}>
        {country.name}
      </option>
    ))}
  </select>
  {/* Custom dropdown button */}
  <div
    className="text-[var(--olive-green)] bg-[var(--white)] p-2 rounded-lg w-full border border-[var(--white)] focus:ring-2 focus:ring-[var(--yellow)] outline-none cursor-pointer flex items-center gap-2"
    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
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
    <div className="absolute z-10 mt-1 w-full bg-[var(--white)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
      {countryData.map((country) => (
        <div
          key={country.code}
          className="flex items-center gap-2 p-2 hover:bg-[var(--yellow)]/50 cursor-pointer text-[var(--olive-green)]"
          onClick={() => {
            setCountry(country.name);
            setIsDropdownOpen(false);
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
                  <div>
                </div>
              </div>
              <input
                type="email"
                value={email}
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
                className="text-[var(--olive-green)] bg-[var(--white)] p-2 rounded-lg w-full border border-[var(--white)] focus:ring-2 focus:ring-[var(--yellow)] outline-none mt-2"
                required
              />
              <input
                type="password"
                value={password}
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                className="text-[var(--olive-green)] bg-[var(--white)] p-2 rounded-lg w-full border border-[var(--white)] focus:ring-2 focus:ring-[var(--yellow)] outline-none mt-2"
                required
              />
              <div className="mt-2">
                {error && <p className="text-red-500">{error}</p>}
                <button
                  type="submit"
                  className="bg-[var(--wine)] hover:bg-[var(--white)] px-3 py-2 w-full mt-3 rounded-lg text-[var(--white)] hover:text-[var(--dark-green)] font-medium transition-all duration-300 ease-in-out"
                >
                  Sign Up
                </button>
              </div>
              <p className="text-[var(--white)] text-[15px] mt-4">
                Already have an account?{' '}
                <Link className="text-[var(--yellow)] text-[17px]" href="/login">
                  Log In
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Page;