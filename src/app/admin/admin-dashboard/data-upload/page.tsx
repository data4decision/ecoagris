'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaSpinner, FaCheckCircle, FaExclamationCircle, FaTrash, FaDownload } from 'react-icons/fa';
import Link from 'next/link';
import { db } from '@/app/lib/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface CloudinaryFile {
  id?: string;
  public_id: string;
  secure_url: string;
  format: string;
  created_at: string;
  bytes: number;
}

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
}

const UploadFile = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<CloudinaryFile[]>([]);

  // Handle file drop
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
    maxSize: 10 * 1024 * 1024, // 10MB limit
  });

  // REAL-TIME FETCH USING onSnapshot
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'uploads'),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          public_id: doc.data().public_id,
          secure_url: doc.data().url,
          format: doc.data().title.split('.').pop()?.toLowerCase() || 'unknown',
          created_at: doc.data().uploadedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          bytes: doc.data().size || 0,
        } as CloudinaryFile));
        setFiles(data);
      },
      (err) => {
        console.error('onSnapshot error:', err);
        setError('Failed to sync files in real time.');
      }
    );

    return () => unsub();
  }, []);

  // Handle file upload to Cloudinary
  const uploadFile = () => {
    if (!file) return;

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

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        setProgress(Math.round(percent));
      }
    });

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response: CloudinaryResponse = JSON.parse(xhr.responseText);
        setFileUrl(response.secure_url);
        setStatusMessage('File uploaded successfully!');
        setUploading(false);
        uploadToFirebase(response.secure_url, response.public_id);
      } else {
        setError('Upload failed. Please try again.');
        setUploading(false);
      }
    };

    xhr.onerror = () => {
      setError('Upload failed. Please try again.');
      setUploading(false);
    };

    xhr.send(formData);
  };

  // Save metadata to Firestore
  const uploadToFirebase = async (url: string, public_id: string) => {
    try {
      await addDoc(collection(db, 'uploads'), {
        public_id,
        url,
        title: file?.name || 'Untitled',
        size: file?.size || 0,
        status: 'pending',
        uploadedAt: serverTimestamp(),
        uploadedBy: 'admin@ecoagris.org',
      });
    } catch (err: any) {
      console.error('Error saving metadata:', err);
      setError(`Failed to save: ${err.message}`);
    }
  };

  // Delete file from Cloudinary
  const deleteFile = async (public_id: string) => {
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || !process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET) {
      setError('Cloudinary API credentials missing.');
      return;
    }

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/dmuvs05yp/resources/raw/upload/${public_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${btoa(`${process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY}:${process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET}`)}`,
        },
      });
      const data = await res.json();
      if (data.result === 'ok') {
        // List auto-updates via onSnapshot
      } else {
        setError('Delete failed on Cloudinary.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete file.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Upload File (Excel, PNG, or PDF)</h2>

      <div
        {...getRootProps()}
        className="border-2 border-dashed p-4 text-center rounded-lg cursor-pointer"
        style={{ borderColor: 'var(--olive-green)' }}
      >
        <input {...getInputProps()} />
        <p className="text-gray-500">Drag & drop a file here, or click to select (Excel, PNG, PDF)</p>
      </div>

      {file && (
        <div className="mt-4">
          <p className="font-semibold">File: {file.name}</p>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={uploadFile}
          disabled={uploading || !file}
          className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400 flex items-center justify-center"
        >
          {uploading ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            'Upload File'
          )}
        </button>
      </div>

      {uploading && (
        <div className="mt-4">
          <progress className="w-full h-2" value={progress} max={100} />
          <p className="text-center text-sm">{progress}%</p>
        </div>
      )}

      {statusMessage && (
        <div className="mt-4 text-green-600 flex items-center">
          <FaCheckCircle className="mr-2" />
          <p>{statusMessage}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-600 flex items-center">
          <FaExclamationCircle className="mr-2" />
          <p>{error}</p>
        </div>
      )}

      {fileUrl && (
        <div className="mt-4">
          <Link
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Download the uploaded file
          </Link>
        </div>
      )}

      {/* File List */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Uploaded Files</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 border text-[var(--dark-green)]">File ID</th>
                <th className="px-3 py-2 border text-[var(--dark-green)]">Format</th>
                <th className="px-3 py-2 border text-[var(--dark-green)]">Size</th>
                <th className="px-3 py-2 border text-[var(--dark-green)]">Created At</th>
                <th className="px-3 py-2 border text-[var(--dark-green)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.public_id}>
                  <td className="border px-3 py-2">{f.public_id}</td>
                  <td className="border px-3 py-2">{f.format}</td>
                  <td className="border px-3 py-2">{formatBytes(f.bytes)}</td>
                  <td className="border px-3 py-2">{new Date(f.created_at).toLocaleDateString()}</td>
                  <td className="border px-3 py-2 flex gap-2">
                    <Link
                      href={f.secure_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[var(--dark-green)] text-white px-2 py-1 rounded text-xs flex items-center"
                    >
                      <FaDownload className="mr-1" /> Download
                    </Link>
                    <button onClick={() => deleteFile(f.public_id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center">
                      <FaTrash className="mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UploadFile;
