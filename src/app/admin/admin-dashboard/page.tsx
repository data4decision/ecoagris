import { adminFirestore } from '@/app/lib/firebaseAdmin';
import { format } from 'date-fns';
import DashboardClient from './DashboardClient';



export default async function DashboardHome() {
  let stats = null;
  let error = null;

  try {
    // Use .collection() and .get() methods on Firestore instance
    const [
      usersSnap,
      uploadsSnap,
      macroSnap,
      agricSnap,
      livestockSnap,
      nutritionSnap,
      riceSnap,
      logsQuery,
    ] = await Promise.all([
      adminFirestore.collection('users').get(),
      adminFirestore.collection('uploads').get(),
      adminFirestore.collection('data_macro').get(),
      adminFirestore.collection('data_agric').get(),
      adminFirestore.collection('data_livestock').get(),
      adminFirestore.collection('data_nutrition').get(),
      adminFirestore.collection('data_rice').get(),
      // Last 24 hours logs
      adminFirestore
        .collection('admin_logs')
        .where('timestamp', '>', new Date(Date.now() - 24 * 60 * 60 * 1000))
        .get(),
    ]);

    const totalProducts =
      macroSnap.size +
      agricSnap.size +
      livestockSnap.size +
      nutritionSnap.size +
      riceSnap.size;

    // Find latest upload
    const uploadDocs = uploadsSnap.docs;
    const lastUploadDoc = uploadDocs
      .filter((doc) => doc.get('timestamp')?.toDate?.() instanceof Date)
      .sort((a, b) => {
        const aTime = a.get('timestamp')?.toMillis() || 0;
        const bTime = b.get('timestamp')?.toMillis() || 0;
        return bTime - aTime;
      })[0];

    stats = {
      totalUsers: usersSnap.size,
      activeAdmins: usersSnap.docs.filter((d) => d.get('role') === 'admin').length,
      totalUploads: uploadsSnap.size,
      pendingUploads: uploadsSnap.docs.filter((d) => d.get('status') === 'pending').length,
      totalProducts,
      recentLogs: logsQuery.size,
      lastUpload: lastUploadDoc
        ? format(lastUploadDoc.get('timestamp').toDate(), 'PPP p')
        : 'No uploads yet',
    };
  } catch (err: unknown) {
    console.error('Dashboard fetch error:', err);
    error = 'Failed to load dashboard data. Please try again later.';
  }

  return <DashboardClient stats={stats} error={error} />;
}