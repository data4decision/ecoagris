'use client';

import React, { useState, useEffect } from 'react';
import { FaTrash, FaDownload, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import Link from 'next/link';
import { db } from '@/app/lib/firebase';
import { collection, onSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';

interface CloudinaryFile {
  id?: string;
  public_id: string;
  secure_url: string;
  format: string;
  created_at: string;
  bytes: number;
}

const FilesPage = () => {
  const [files, setFiles] = useState<CloudinaryFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [fileToDelete, setFileToDelete] = useState<CloudinaryFile | null>(null);

  // Real-time listener
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'uploads'),
      (snapshot: QuerySnapshot<DocumentData>) => {
        const data: CloudinaryFile[] = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            public_id: d.public_id || '',
            secure_url: d.url || '',
            format: (d.title?.split('.').pop()?.toLowerCase() as string) || 'unknown',
            created_at: d.uploadedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            bytes: d.size || 0,
          };
        });
        setFiles(data);
      },
      (err) => {
        console.error(err);
        setError('Failed to load files.');
      }
    );
    return () => unsub();
  }, []);

  const deleteFile = async (public_id: string) => {
    setError(null);
    try {
      const res = await fetch('/api/deleteFile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id }),
      });
      const data = await res.json();

      if (res.status === 200) {
        setStatusMessage('File deleted successfully!');
        setFiles((prev) => prev.filter((f) => f.public_id !== public_id));
        setIsModalOpen(false);
      } else {
        setError(data.error || 'Failed to delete file.');
      }
    } catch (err) {
      setError('Network error while deleting.');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--dark-green)] via-[var(--yellow)] to-[var(--olive-green)] py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-white/20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--dark-green)]">
              Uploaded Files
            </h2>
            <Link
              href="/admin/admin-dashboard/data-upload"
              className="bg-[var(--dark-green)] text-white px-6 py-2 rounded-lg font-medium hover:bg-[var(--dark-green)]/90 transition"
            >
              + Upload New
            </Link>
          </div>

          {/* Delete Confirmation Modal */}
          {isModalOpen && fileToDelete && (
            <div className="fixed inset-0 flex justify-center items-center bg-[var(--yellow)] bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                <h3 className="text-lg font-bold text-[var(--dark-green)]">Confirm Deletion</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Are you sure you want to delete this file? This action cannot be undone.
                </p>
                <div className="mt-6 flex justify-end gap-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-[var(--dark-green)] rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteFile(fileToDelete.public_id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status messages */}
          {statusMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
              <FaCheckCircle /> {statusMessage}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
              <FaExclamationCircle /> {error}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gradient-to-r from-[var(--dark-green)]/10 to-[var(--olive-green)]/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--dark-green)] uppercase tracking-wider">File ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--dark-green)] uppercase tracking-wider hidden sm:table-cell">Format</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--dark-green)] uppercase tracking-wider hidden md:table-cell">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--dark-green)] uppercase tracking-wider hidden lg:table-cell">Uploaded</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--dark-green)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      No files uploaded yet. <Link href="admin/admin-dashboard/data-upload" className="text-[var(--olive-green)] underline">Upload one</Link>
                    </td>
                  </tr>
                ) : (
                  files.map((f) => (
                    <tr key={f.public_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{f.public_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-full">
                          {f.format.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                        {formatBytes(f.bytes)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                        {new Date(f.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <Link
                            href={f.secure_url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-[var(--dark-green)] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[var(--dark-green)]/90 transition"
                          >
                            <FaDownload /> <span className="hidden sm:inline">Download</span>
                          </Link>
                          <button
                            onClick={() => {
                              setFileToDelete(f);
                              setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition"
                          >
                            <FaTrash /> <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilesPage;