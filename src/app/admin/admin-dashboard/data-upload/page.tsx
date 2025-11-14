'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import Link from 'next/link';
import { db, auth } from '@/app/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const playSuccessSound = () => {
    const audio = new Audio('/sound/cinematic-hit-3-317170.mp3');
    audio.volume = 0.6;
    audio.play().catch(() => {});
  };

  const triggerToast = (message: string, type: 'success' | 'error') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 4000);
  };

  const uploadFile = async () => {
    if (!file) return;

    const user = auth.currentUser;
    if (!user?.email) {
      triggerToast('You must be logged in with an email.', 'error');
      return;
    }

    setUploading(true);
    setProgress(0);
    setStatusMessage('');
    setError(null);

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ecoagris');
    formData.append('cloud_name', 'dmuvs05yp');

    xhr.open('POST', 'https://api.cloudinary.com/v1_1/dmuvs05yp/upload', true);

    xhr.upload.addEventListener('progress', (e: ProgressEvent) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        setProgress(Math.round(percent));
      }
    });

    xhr.onload = async () => {
      if (xhr.status !== 200) {
        setError('Upload to Cloudinary failed.');
        triggerToast('Upload failed.', 'error');
        setUploading(false);
        return;
      }

      let response: unknown;
      try {
        response = JSON.parse(xhr.responseText);
      } catch {
        setError('Invalid response from Cloudinary.');
        triggerToast('Upload failed: Invalid response.', 'error');
        setUploading(false);
        return;
      }

      const res = response as { public_id: string; secure_url: string };

      try {
        // CRITICAL: uploadedBy must match user.email
        const uploadData = {
          public_id: res.public_id,
          url: res.secure_url,
          title: file.name,
          size: file.size,
          format: file.name.split('.').pop()?.toLowerCase() || 'unknown',
          uploadedAt: serverTimestamp(),
          uploadedBy: user.email, // Must match auth.email
        };

        await addDoc(collection(db, 'uploads'), uploadData);

        // Notification
        await addDoc(collection(db, 'adminNotifications'), {
          title: 'New File Uploaded',
          message: `"${file.name}" uploaded by ${user.email}.`,
          type: 'success',
          read: false,
          createdAt: serverTimestamp(),
          link: '/admin/admin-dashboard/files',
        });

        setStatusMessage('Uploaded successfully!');
        triggerToast(`"${file.name}" uploaded!`, 'success');
        playSuccessSound();
        setUploading(false);

        setTimeout(() => {
          window.location.href = '/admin/admin-dashboard/files';
        }, 1200);

      } catch (fireErr: unknown) {
        console.error('Firestore error:', fireErr);
        const msg = fireErr instanceof Error ? fireErr.message : 'Permission denied';
        setError(msg);
        triggerToast(`Save failed: ${msg}`, 'error');
        setUploading(false);
      }
    };

    xhr.onerror = () => {
      setError('Network error.');
      triggerToast('Network error.', 'error');
      setUploading(false);
    };

    xhr.send(formData);
  };

  return (
    <>
      {showToast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white font-medium animate-slide-in-right ${
            showToast.type === 'success' ? 'bg-[var(--medium-green)]' : 'bg-[var(--red)]'
          }`}
        >
          {showToast.type === 'success' ? <FaCheckCircle size={22} /> : <FaExclamationCircle size={22} />}
          <span>{showToast.message}</span>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-[var(--dark-green)] via-[var(--yellow)] to-[var(--olive-green)] py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-white/20">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--dark-green)] mb-6 text-center">
              Upload File (Excel)
            </h2>

            <div
              {...getRootProps()}
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 hover:border-[var(--olive-green)] hover:bg-[var(--olive-green)]/5"
              style={{ borderColor: 'var(--olive-green)' }}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center">
                <div className="bg-[var(--olive-green)]/10 p-4 rounded-full mb-4">
                  <svg className="w-12 h-12 text-[var(--olive-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">Drag & drop a file here, or click to select</p>
                <p className="text-sm text-gray-500 mt-1">( Excel • Max 10MB)</p>
              </div>
            </div>

            {file && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Selected:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={uploadFile}
                disabled={!file || uploading}
                className="inline-flex items-center gap-2 bg-[var(--dark-green)] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[var(--dark-green)]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <FaSpinner className="animate-spin" /> Uploading... {progress}%
                  </>
                ) : (
                  'Upload File'
                )}
              </button>
            </div>

            {statusMessage && (
              <p className="mt-4 text-center text-green-600 font-medium flex items-center justify-center gap-2">
                <FaCheckCircle /> {statusMessage}
              </p>
            )}
            {error && (
              <p className="mt-4 text-center text-red-600 font-medium flex items-center justify-center gap-2">
                <FaExclamationCircle /> {error}
              </p>
            )}

            <div className="mt-8 text-center">
              <Link
                href="/admin/admin-dashboard/files"
                className="text-[var(--olive-green)] underline hover:text-[var(--dark-green)] font-medium"
              >
                View all uploaded files
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
};

export default UploadPage;