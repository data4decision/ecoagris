'use client';

// ADD THIS LINE — prevents static prerendering
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Upload, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  // Protect route
  useEffect(() => {
    const auth = localStorage.getItem('admin-auth');
    if (!auth) {
      router.push('/admin/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin-auth');
    router.push('/admin/login');
  };

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/admin/admin-dashboard' },
    { icon: Upload, label: 'Upload Data', href: '/admin/data-upload' },
    { icon: FileText, label: 'Data Files', href: '/admin/data-files' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
              <div className="bg-[var(--yellow)] p-2 rounded-full">
                <div className="bg-white p-1 rounded-full">
                  <span className="text-lg font-bold text-[var(--dark-green)]">EA</span>
                </div>
              </div>
              {sidebarOpen && <span className="font-bold text-[var(--dark-green)]">ECOAGRIS</span>}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition mb-2"
            >
              <item.icon className="w-5 h-5 text-[var(--dark-green)]" />
              {sidebarOpen && <span className="text-gray-700">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 transition w-full"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Upload Card */}
            <Link href="/admin/data-upload" className="block">
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <Upload className="w-10 h-10 text-[var(--dark-green)]" />
                  <span className="text-2xl font-bold text-gray-900">Upload</span>
                </div>
                <p className="text-gray-600">Upload new datasets in Excel format</p>
              </div>
            </Link>

            {/* Files Card */}
            <Link href="/admin/data-files" className="block">
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="w-10 h-10 text-[var(--dark-green)]" />
                  <span className="text-2xl font-bold text-gray-900">Files</span>
                </div>
                <p className="text-gray-600">View and manage uploaded data files</p>
              </div>
            </Link>

            {/* Stats Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="w-10 h-10 text-[var(--dark-green)]" />
                <span className="text-2xl font-bold text-gray-900">Stats</span>
              </div>
              <p className="text-gray-600">Monitor system performance and usage</p>
            </div>
          </div>

          <div className="mt-12 bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="p-4 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition">
                <p className="font-medium text-gray-900">Backup Database</p>
                <p className="text-sm text-gray-600">Create a full system backup</p>
              </button>
              <button className="p-4 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition">
                <p className="font-medium text-gray-900">Clear Cache</p>
                <p className="text-sm text-gray-600">Refresh all cached data</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}