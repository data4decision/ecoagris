import { adminAuth } from '@/app/lib/firebaseAdmin';

export async function GET() {
  try {
    const list = await adminAuth.listUsers();
    return Response.json({ count: list.users.length });
  } catch (error: unknown) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}