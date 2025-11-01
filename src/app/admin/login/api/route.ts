// src/app/admin/login/api/route.ts
import { loginAction } from './action';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    const result = await loginAction(idToken);

    if (result?.error) {
      return Response.json({ error: result.error }, { status: 401 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
}