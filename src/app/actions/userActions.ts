
'use server';

import { adminFirestore } from '@/app/lib/firebaseAdmin';
import { revalidatePath } from 'next/cache';

export async function blockUserAction(userId: string, status: 'active' | 'blocked') {
  try {
    await adminFirestore.collection('users').doc(userId).update({
      status,
      lastActive: new Date(),
    });
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: unknown) {
    console.error('Block user error:', error);
    return { success: false, error: 'Failed to update user status' };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    await adminFirestore.collection('users').doc(userId).delete();
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: unknown) {
    console.error('Delete user error:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}