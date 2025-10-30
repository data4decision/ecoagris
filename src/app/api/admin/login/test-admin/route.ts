// src/app/api/test-admin/route.ts
import { adminAuth } from '@/app/lib/firebaseAdmin';

export async function GET() {
  try {
    const list = await adminAuth.listUsers(1);
    return Response.json({ success: true, users: list.users.length });
  } catch (error: unknown) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}