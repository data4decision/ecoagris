'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Search,
  Download,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Trash2,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

// Server Actions
import { blockUserAction, deleteUserAction } from '@/app/actions/userActions';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  occupation: string;
  country: string;
  createdAt: Date;
  status: 'active' | 'blocked';
  role: string;
  lastActive?: Date;
}

export default function UsersClient({
  initialUsers,
  error,
}: {
  initialUsers: User[];
  error: string | null;
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const usersPerPage = 10;

  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.phone.includes(term)
      );
    }

    if (statusFilter !== 'all') filtered = filtered.filter((u) => u.status === statusFilter);
    if (roleFilter !== 'all') filtered = filtered.filter((u) => u.role === roleFilter);

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter, users]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const showNotification = (message: string, type: 'success' | 'error') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 4000);
  };

  const handleBlockToggle = async (userId: string, currentStatus: 'active' | 'blocked') => {
    startTransition(async () => {
      const result = await blockUserAction(userId, currentStatus === 'active' ? 'blocked' : 'active');
      if (result.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, status: currentStatus === 'active' ? 'blocked' : 'active' }
              : u
          )
        );
        showNotification(
          `User ${currentStatus === 'active' ? 'blocked' : 'unblocked'} successfully`,
          'success'
        );
      } else {
        showNotification(result.error || 'Operation failed', 'error');
      }
    });
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;

    setDeletingId(userId);
    startTransition(async () => {
      const result = await deleteUserAction(userId);
      if (result.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        showNotification('User deleted permanently', 'success');
      } else {
        showNotification(result.error || 'Delete failed', 'error');
      }
      setDeletingId(null);
    });
  };

  const exportUsers = () => {
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Country', 'Joined'];
    const rows = filteredUsers.map((u) => [
      `${u.firstName} ${u.lastName}`,
      u.email,
      u.phone,
      u.role,
      u.status,
      u.country,
      format(u.createdAt, 'PPP'),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Users exported successfully!', 'success');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[var(--red)] mx-auto mb-4" />
          <p className="text-xl text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast */}
      {showToast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white font-medium animate-slide-in-right ${
            showToast.type === 'success'
              ? 'bg-[var(--medium-green)]'
              : 'bg-[var(--red)]'
          }`}
        >
          {showToast.type === 'success' ? <UserCheck size={22} /> : <AlertCircle size={22} />}
          <span>{showToast.message}</span>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-[var(--dark-green)]">User Management</h1>
            <p className="mt-2 text-lg text-[var(--dark-green)]">Control access and manage registered users</p>
          </div>

          {/* Controls */}
          <div className="bg-[var(--dark-green)] rounded-2xl shadow-lg border border-[var(--yellow)] p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--wine)]" size={20} />
                <input
                  type="text"
                  placeholder="Search name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-[var(--white)] text-[var(--white)] rounded-xl focus:border-[var(--yellow)] focus:ring-4 focus:ring-[var(--wine)]/20 outline-none transition-all text-base text-[var(--white)] "
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
                className="px-5 py-4 border-2 border-[var(--white)] text-[var(--white)] rounded-xl focus:border-[var(--yellow)] focus:ring-4 focus:ring-[var(--wine)]/20 outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-5 py-4 border-2 border-[var(--white)] text-[var(--white)] rounded-xl focus:border-[var(--yellow)] focus:ring-4 focus:ring-[var(--wine)]/20 outline-none"
              >
                <option value="all">All Roles</option>
                <option value="User">User</option>
              </select>

              <button
                onClick={exportUsers}
                className="flex items-center justify-center gap-3 bg-[var(--yellow)] text-white px-6 py-4 rounded-xl hover:bg-[var(--wine)]/90 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                <Download size={20} />
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
              <p className="text-sm text-gray-600 font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{users.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
              <p className="text-sm text-gray-600 font-medium">Active</p>
              <p className="text-3xl font-bold text-[var(--medium-green)] mt-2">
                {users.filter((u) => u.status === 'active').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
              <p className="text-sm text-gray-600 font-medium">Blocked</p>
              <p className="text-3xl font-bold text-[var(--red)] mt-2">
                {users.filter((u) => u.status === 'blocked').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
              <p className="text-sm text-gray-600 font-medium">This Month</p>
              <p className="text-3xl font-bold text-[var(--yellow)] mt-2">
                {users.filter((u) => u.createdAt.getMonth() === new Date().getMonth()).length}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[var(--dark-green)] to-[var(--olive-green)] text-white">
                  <tr>
                    <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wider">User</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wider">Role</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold uppercase tracking-wider">Last Active</th>
                    <th className="px-6 py-5 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-all">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[var(--medium-green)] to-[var(--dark-green)] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-4 py-2 text-xs font-bold rounded-full bg-[var(--yellow)] text-[var(--dark-green)]">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`px-4 py-2 text-xs font-bold rounded-full ${
                            user.status === 'active'
                              ? 'bg-[var(--medium-green)] text-white'
                              : 'bg-[var(--red)] text-white'
                          }`}
                        >
                          {user.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-700">
                        {format(user.createdAt, 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-500">
                        {user.lastActive ? format(user.lastActive, 'MMM d, yyyy p') : 'Never'}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleBlockToggle(user.id, user.status)}
                            disabled={isPending}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all shadow-md ${
                              user.status === 'active'
                                ? 'bg-[var(--red)] text-white hover:bg-[var(--red)]/90'
                                : 'bg-[var(--medium-green)] text-white hover:bg-[var(--medium-green)]/90'
                            }`}
                          >
                            {isPending ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : user.status === 'active' ? (
                              <>
                                <UserX size={18} /> Block
                              </>
                            ) : (
                              <>
                                <UserCheck size={18} /> Unblock
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={isPending || deletingId === user.id}
                            className="p-2.5 rounded-lg bg-[var(--wine)]/10 text-[var(--wine)] hover:bg-[var(--wine)]/20 transition-all"
                          >
                            {deletingId === user.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-5 border-t border-gray-200 flex justify-between items-center">
                <p className="text-sm text-gray-700 font-medium">
                  Showing {(currentPage - 1) * usersPerPage + 1} to{' '}
                  {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length}{' '}
                  users
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-5 py-3 border-2 border-[var(--medium-green)] rounded-xl hover:bg-[var(--medium-green)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
                  >
                    <ChevronLeft size={20} /> Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-5 py-3 bg-[var(--medium-green)] text-white rounded-xl hover:bg-[var(--dark-green)] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
                  >
                    Next <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out;
        }
      `}</style>
    </>
  );
}