import { adminFirestore } from '@/app/lib/firebaseAdmin';
import { collection, getDocs, query, where, Timestamp } from 'firebase-admin/firestore';
import { format } from 'date-fns';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

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
      getDocs(
        query(
          collection(adminFirestore, 'admin_logs'),
          where('timestamp', '>', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)))
        )
      ),
    ]);

    const totalProducts =
      macroSnap.size +
      agricSnap.size +
      livestockSnap.size +
      nutritionSnap.size +
      riceSnap.size;

    // Safely get the most recent upload
    const uploadDocs = uploadsSnap.docs;
    const lastUploadDoc = uploadDocs
      .filter((doc) => doc.data()?.timestamp instanceof Timestamp)
      .sort((a, b) => {
        const aTime = a.data().timestamp?.toMillis() || 0;
        const bTime = b.data().timestamp?.toMillis() || 0;
        return bTime - aTime;
      })[0];

    stats = {
      totalUsers: usersSnap.size,
      activeAdmins: usersSnap.docs.filter((d) => d.data()?.role === 'admin').length,
      totalUploads: uploadsSnap.size,
      pendingUploads: uploadsSnap.docs.filter((d) => d.data()?.status === 'pending').length,
      totalProducts,
      recentLogs: logsSnap.size,
      lastUpload: lastUploadDoc
        ? format(lastUploadDoc.data().timestamp.toDate(), 'PPP p')
        : 'No uploads yet',
    };
  } catch (err: unknown) {
    console.error('Dashboard fetch error:', err);
    error = 'Failed to load dashboard data. Please try again later.';
  }

  return <DashboardClient stats={stats} error={error} />;
}