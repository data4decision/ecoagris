'use client';

import { useState } from 'react';
import {
  Search,
  Mail,
  BookOpen,
  Youtube,
  FileText,
  Github,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  MessageCircle,
  Download,
} from 'lucide-react';

import Link from 'next/link';

export default function HelpSupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const faqs = [
    {
      q: 'How do I upload a new dataset?',
      a: 'Go to "Data Upload" → Drag & drop your Excel/CSV file (max 10MB) → Click "Upload File". Progress is shown in real time.',
    },
    {
      q: 'Can I delete an uploaded file?',
      a: 'Yes! Go to "Files" → Click the red trash icon → Confirm deletion. The file is permanently removed from Cloudinary and our database.',
    },
    {
      q: 'How do I block or unblock a user?',
      a: 'In "User Management", find the user → Click "Block" (red) or "Unblock" (green) → Action is instant with confirmation toast.',
    },
    {
      q: 'How do I export user data?',
      a: 'Use the "Export CSV" button at the top of the Users page. It downloads all filtered users with name, email, role, status, and join date.',
    },
    {
      q: 'Where are files stored?',
      a: 'All uploaded files are securely stored on Cloudinary. Metadata (URL, size, upload date) is saved in Firebase Firestore.',
    },
  ];

  const showNotification = (message: string, type: 'success' | 'error') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 4000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@ecoagris.org');
    showNotification('Email copied to clipboard!', 'success');
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
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--yellow)] rounded-full mb-4">
                <HelpCircle className="w-9 h-9 text-[var(--dark-green)]" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--dark-green)] mb-3">
                Help & Support
              </h1>
              <p className="text-lg text-[var(--dark-green)] max-w-2xl mx-auto">
                Get answers fast. Learn how to upload data, manage users, and troubleshoot common issues.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <button
                onClick={handleCopyEmail}
                className="bg-gradient-to-br from-[var(--dark-green)] to-[var(--olive-green)] text-white p-6 rounded-xl hover:shadow-xl transition-all group"
              >
                <Mail className="w-10 h-10 mx-auto mb-3 group-hover:scale-110 transition" />
                <h3 className="font-bold text-lg">Email Support</h3>
                <p className="text-sm opacity-90 mt-1">support@ecoagris.com</p>
                <p className="text-xs mt-2 opacity-75">Click to copy</p>
              </button>

              <div
               
                className="bg-white border-2 border-[var(--yellow)] p-6 rounded-xl hover:shadow-xl transition-all group"
              >
                <BookOpen className="w-10 h-10 mx-auto mb-3 text-[var(--dark-green)] group-hover:scale-110 transition" />
                <h3 className="font-bold text-lg text-[var(--dark-green)]">User Guide</h3>
                <p className="text-sm text-gray-600 mt-1">Step-by-step tutorials</p>
              </div>

              <a
                href="https://youtube.com/@ecoagris"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-600 text-white p-6 rounded-xl hover:shadow-xl transition-all group"
              >
                <Youtube className="w-10 h-10 mx-auto mb-3 group-hover:scale-110 transition" />
                <h3 className="font-bold text-lg">Video Tutorials</h3>
                <p className="text-sm opacity-90 mt-1">Watch walkthroughs</p>
              </a>
            </div>

            {/* FAQ Accordion */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-[var(--dark-green)] mb-6 flex items-center gap-2">
                <MessageCircle className="w-7 h-7" />
                Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition"
                    >
                      <span className="font-medium text-gray-800 pr-4">{faq.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-[var(--wine)] transition-transform ${
                          openFaq === i ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openFaq === i && (
                      <div className="px-6 pb-4 pt-2 text-gray-600 border-t border-gray-200">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            
            {/* Final CTA */}
            <div className="text-center bg-gradient-to-r from-[var(--yellow)] to-[var(--wine)]/20 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-[var(--dark-green)] mb-3">
                Still Need Help?
              </h3>
              <p className="text-gray-700 mb-6 max-w-xl mx-auto">
                Our support team is available 24/7 to assist with any technical or data-related issues.
              </p>
              <button
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-3 bg-[var(--dark-green)] text-white px-8 py-4 rounded-xl font-bold hover:bg-[var(--dark-green)]/90 transition shadow-lg"
              >
                <Mail size={22} />
                Email Support: support@ecoagris.com
              </button>
            </div>

            {/* Back Link */}
            <div className="mt-8 text-center">
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