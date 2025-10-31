// app/admin/page.tsx
'use client';

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Welcome to Admin Panel</h1>
      <p>You are logged in!</p>
      <button
        onClick={() => {
          localStorage.removeItem('admin-auth');
          window.location.href = '/admin/login';
        }}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
      >
        Logout
      </button>
    </div>
  );
}