'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
  Trash2,
  Check,
  Filter,
  Loader2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { db } from '@/app/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: unknown;
  link?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filtered, setFiltered] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | Notification['type']>('all');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, 'adminNotifications'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Notification[];
      setNotifications(data);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filter
  useEffect(() => {
    let result = notifications;
    if (filter === 'unread') result = result.filter((n) => !n.read);
    else if (filter !== 'all') result = result.filter((n) => n.type === filter);
    setFiltered(result);
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setShowToast({ message: msg, type });
    setTimeout(() => setShowToast(null), 4000);
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'adminNotifications', id), { read: true });
      showNotification('Marked as read', 'success');
    } catch (err) {
      showNotification('Failed to update', 'error');
    }
  };

  const markAllAsRead = async () => {
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, 'adminNotifications', n.id), { read: true });
    });
    await batch.commit();
    showNotification('All marked as read', 'success');
  };

  const deleteNotification = async (id: string) => {
    await deleteDoc(doc(db, 'adminNotifications', id));
    showNotification('Notification deleted', 'success');
  };

  const clearAll = async () => {
    const batch = writeBatch(db);
    notifications.forEach(n => batch.delete(doc(db, 'adminNotifications', n.id)));
    await batch.commit();
    showNotification('All cleared', 'success');
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-[var(--medium-green)]" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-[var(--yellow)]" />;
      case 'error': return <XCircle className="w-5 h-5 text-[var(--red)]" />;
      default: return <Info className="w-5 h-5 text-[var(--wine)]" />;
    }
  };

  return (
    <>
      {/* Toast */}
      {showToast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white font-medium animate-slide-in-right ${
            showToast.type === 'success' ? 'bg-[var(--medium-green)]' : 'bg-[var(--red)]'
          }`}
        >
          {showToast.type === 'success' ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
          <span>{showToast.message}</span>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-[var(--dark-green)] via-[var(--yellow)] to-[var(--olive-green)] py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-white/20">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--dark-green)] flex items-center gap-3">
                  <Bell className="w-10 h-10" />
                  Notifications
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
              <div className="flex gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-2 bg-[var(--medium-green)] text-white px-5 py-3 rounded-xl font-medium hover:bg-[var(--dark-green)] transition"
                  >
                    <Check size={18} /> Mark All Read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-2 bg-[var(--red)] text-white px-5 py-3 rounded-xl font-medium hover:bg-[var(--wine)] transition"
                  >
                    <Trash2 size={18} /> Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-5 py-2.5 rounded-xl font-medium transition ${
                  filter === 'all'
                    ? 'bg-[var(--dark-green)] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-5 py-2.5 rounded-xl font-medium transition ${
                  filter === 'unread'
                    ? 'bg-[var(--dark-green)] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread
              </button>
              {(['info', 'success', 'warning', 'error'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-5 py-2.5 rounded-xl font-medium transition capitalize ${
                    filter === t
                      ? 'bg-[var(--dark-green)] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* List */}
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 mx-auto animate-spin text-[var(--olive-green)]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-xl">No notifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((n) => (
                  <div
                    key={n.id}
                    className={`p-5 rounded-xl border transition-all ${
                      n.read ? 'bg-gray-50 border-gray-200' : 'bg-white border-[var(--yellow)] shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1">{getIcon(n.type)}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{n.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                          {n.link && (
                            <Link
                              href={n.link}
                              className="inline-block mt-2 text-sm text-[var(--wine)] underline hover:text-[var(--dark-green)]"
                            >
                              View details →
                            </Link>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!n.read && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="p-2 text-[var(--medium-green)] hover:bg-[var(--medium-green)]/10 rounded-lg transition"
                            title="Mark as read"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n.id)}
                          className="p-2 text-[var(--red)] hover:bg-[var(--red)]/10 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Back */}
            <div className="mt-10 text-center">
              <Link
                href="/admin/admin-dashboard"
                className="text-[var(--olive-green)] underline hover:text-[var(--dark-green)] font-medium"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.4s ease-out; }
      `}</style>
    </>
  );
}