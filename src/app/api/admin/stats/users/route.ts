import { adminAuth } from '@/app/lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const list = await adminAuth.listUsers();
    return NextResponse.json({ count: list.users.length });
  } catch (error: unknown) {
    // Safely extract message from unknown error
    const message = error instanceof Error ? error.message : 'Internal server error';

    console.error('Error listing users:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}