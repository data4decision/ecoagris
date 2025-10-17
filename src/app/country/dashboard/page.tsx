'use client';

import { useParams } from 'next/navigation';

export default function CountryDashboard() {
  const params = useParams();
  const country = params.country as string;

  return (
    <div>
      <h1>Welcome to {country.toUpperCase()} Dashboard</h1>
      <p>Your EcoAgris dashboard for {country}.</p>
    </div>
  );
}