// src/app/api/admin/logs/recent/route.ts
import { adminFirestore } from '@/app/lib/firebaseAdmin'; 

export async function GET() {
  try {
    const snap = await adminFirestore
      .collection('adminLogs')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();

    const logs = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.().toISOString()
    }));

    return Response.json(logs);
  } catch (error: unknown) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
