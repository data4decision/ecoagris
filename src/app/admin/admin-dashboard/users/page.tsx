// app/admin/users/page.tsx  (or wherever your page is)
import { adminFirestore } from '@/app/lib/firebaseAdmin';
import { format } from 'date-fns';
import UsersClient from '@/components/UsersClient';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  occupation: string;
  country: string;
  createdAt: Date;
  status: 'active' | 'blocked';
  role: string;
  lastActive?: Date;
}

export default async function UsersPage() {
  let users: User[] = [];
  let error: string | null = null;

  try {
    const snapshot = await adminFirestore.collection('users').get();

    users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        gender: data.gender || '',
        occupation: data.occupation || '',
        country: data.country || 'Nigeria',
        createdAt: data.createdAt?.toDate() || new Date(),
        status: data.status || 'active',
        role: data.role || 'User',
        lastActive: data.lastActive?.toDate() || data.createdAt?.toDate(),
      };
    });

    // Sort by newest first
    users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  } catch (err) {
    console.error('Failed to fetch users:', err);
    error = 'Failed to load users. Please try again later.';
  }

  return <UsersClient initialUsers={users} error={error} />;
}