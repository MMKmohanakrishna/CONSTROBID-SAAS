'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await authApi.forgotPassword(email);
      setMessage(response.message || 'Password reset instructions sent.');
    } catch (err: any) {
      setError(err.message || 'Error occurred. Please verify your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto w-full sm:max-w-md text-center">
        <Link href="/auth/login" className="inline-flex items-center gap-2 mb-6">
          <div className="w-8 h-8 flex items-center justify-center bg-primary rounded-lg shadow-md">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-secondary" strokeWidth="2.5">
              <path d="M3 21h18M3 10l9-7 9 7v11H3V10z" />
              <path d="M9 21v-6h6v6" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-primary font-serif">CONSTROBID</span>
        </Link>
        <h2 className="text-3xl font-extrabold text-primary font-serif">
          Reset your password
        </h2>
        <p className="mt-2 text-xs text-gray-500">
          Enter your registered email address below to receive password recovery instructions.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 sm:mx-auto w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow-lg rounded-xl sm:px-10 border border-gray-100">
          {message && (
            <div className="mb-4 p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 block">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover shadow-md transition-all-300 flex items-center justify-center gap-2 disabled:bg-gray-400"
            >
              {loading ? 'Sending instruction...' : 'Send Recovery Email'}
              {!loading && <Send size={15} />}
            </button>

            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 text-xs font-bold text-gray-500 hover:text-primary pt-2 transition-colors"
            >
              <ArrowLeft size={14} />
              Back to Login
            </Link>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
