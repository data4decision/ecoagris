'use client';

import { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '@/app/lib/firebase';
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { FaSpinner, FaCheck, FaUserPlus, FaKey, FaUser, FaEnvelope } from 'react-icons/fa';
import Link from 'next/link';

// Define types
interface Admin {
  uid: string;
  email: string;
  name: string;
  role: string;
  createdAt: Timestamp | null; // Firestore Timestamp
}

export default function ManageAdmins() {
  // Form state
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admins list
  const [admins, setAdmins] = useState<Admin[]>([]);

  // Load all admins
  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const q = query(collection(db, 'newAdmin'), where('role', '==', 'admin'));
        const snap = await getDocs(q);
        const list: Admin[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            uid: d.id,
            email: data.email ?? '',
            name: data.name ?? '',
            role: data.role ?? 'admin',
            createdAt: data.createdAt ?? null,
          };
        });
        setAdmins(list);
      } catch (e) {
        console.error('Failed to load admins:', e);
      }
    };
    loadAdmins();
  }, []);

  // Add new admin
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Validation
    if (!name.trim()) return setMessage({ type: 'error', text: 'Name is required.' });
    if (!email.endsWith('@ecoagris.org')) return setMessage({ type: 'error', text: 'Only @ecoagris.org emails allowed.' });
    if (password.length < 6) return setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });

    setLoading(true);
    setMessage(null);

    try {
      // 1. Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      console.log('Creating user with UID:', uid); // DEBUG

      // 2. Save user profile
      await setDoc(doc(db, 'newAdmin', uid), {
        uid,
        email: email.toLowerCase(),
        name: name.trim(),
        role: 'admin',
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.email ?? 'unknown',
      });

      // 3. Send password reset (welcome email)
      await sendPasswordResetEmail(auth, email);

      setMessage({
        type: 'success',
        text: `Admin "${name}" created! They can log in now.`,
      });

      // Reset form
      setName('');
      setEmail('');
      setPassword('');

      // Optimistically add to UI (createdAt will be null until read back)
      setAdmins((prev) => [
        ...prev,
        { uid, email, name, role: 'admin', createdAt: null },
      ]);
    } catch (err: unknown) {
      console.error('Create error:', err);
      let text = 'Failed to add admin.';
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code;
        if (code === 'auth/email-already-in-use') text = 'Email already registered.';
        else if (code === 'auth/weak-password') text = 'Password too weak.';
      }
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--yellow)] to-[var(--dark-green)] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--dark-green)]">Manage Admins</h1>
            <p className="text-[var(--olive-green)]">Create new admin accounts with username & password</p>
          </div>
          <Link href="/admin/admin-dashboard" className="text-[var(--dark-green)] hover:underline">
            Dashboard
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Add Admin Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-[var(--dark-green)] mb-4 flex items-center gap-2">
              Add New Admin
            </h2>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--dark-green)] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-4 py-2 border border-[var(--wine)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--yellow)]"
                  required
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[var(--dark-green)] mb-1">
                  Email (@ecoagris.org)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@ecoagris.org"
                  className="w-full px-4 py-2 border border-[var(--wine)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--yellow)]"
                  required
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-[var(--dark-green)] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-[var(--wine)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--yellow)]"
                  required
                  minLength={6}
                  disabled={loading}
                />
                <p className="text-xs text-[var(--olive-green)] mt-1">Minimum 6 characters</p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--dark-green)] hover:bg-[var(--yellow)] text-white py-2 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    Create Admin
                  </>
                )}
              </button>
            </form>

            {/* Message */}
            {message && (
              <div
                className={`mt-4 p-3 rounded-lg text-sm font-medium text-center ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}
          </div>

          {/* Current Admins */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-[var(--dark-green)] mb-4">
              Current Admins
            </h2>

            {admins.length === 0 ? (
              <p className="text-[var(--olive-green)] text-center py-8">No admins yet.</p>
            ) : (
              <div className="space-y-3">
                {admins.map((a) => (
                  <div
                    key={a.uid}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-[var(--dark-green)] flex items-center gap-2">
                        {a.name}
                      </p>
                      <p className="text-sm text-[var(--olive-green)]">{a.email}</p>
                    </div>
                    <span className="text-green-600 flex items-center gap-1">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}