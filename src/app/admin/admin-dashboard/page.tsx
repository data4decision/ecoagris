import { adminFirestore } from '@/app/lib/firebaseAdmin';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic'; // Optional: revalidate on every request

export default async function DashboardHome() {
  let stats = null;
  let error = null;

  try {
    const [
      usersSnap,
      uploadsSnap,
      macroSnap,
      agricSnap,
      livestockSnap,
      nutritionSnap,
      riceSnap,
      logsSnap,
    ] = await Promise.all([
      getDocs(collection(adminFirestore, 'users')),
      getDocs(collection(adminFirestore, 'uploads')),
      getDocs(collection(adminFirestore, 'data_macro')),
      getDocs(collection(adminFirestore, 'data_agric')),
      getDocs(collection(adminFirestore, 'data_livestock')),
      getDocs(collection(adminFirestore, 'data_nutrition')),
      getDocs(collection(adminFirestore, 'data_rice')),
      getDocs(query(collection(adminFirestore, 'admin_logs'), where('timestamp', '>', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000))))),
    ]);

    const totalProducts =
      macroSnap.size +
      agricSnap.size +
      livestockSnap.size +
      nutritionSnap.size +
      riceSnap.size;

    const lastUploadDoc = uploadsSnap.docs
      .sort((a, b) => (b.data().timestamp?.toDate() || 0) - (a.data().timestamp?.toDate() || 0))[0];

    stats = {
      totalUsers: usersSnap.size,
      activeAdmins: usersSnap.docs.filter((d) => d.data().role === 'admin').length,
      totalUploads: uploadsSnap.size,
      pendingUploads: uploadsSnap.docs.filter((d) => d.data().status === 'pending').length,
      totalProducts,
      recentLogs: logsSnap.size,
      lastUpload: lastUploadDoc
        ? format(lastUploadDoc.data().timestamp.toDate(), 'PPP p')
        : null,
    };
  } catch (err: unknown) {
    console.error('Dashboard fetch error:', err);
    error = 'Failed to load dashboard data';
  }

  return <DashboardClient stats={stats} error={error} />;
}