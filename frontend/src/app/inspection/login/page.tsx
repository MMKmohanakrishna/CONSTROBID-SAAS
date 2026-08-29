'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import { parseJwt } from '@/lib/auth';
import LeftMarketingPanel from '@/components/LeftMarketingPanel';

const logoPng = new URL('../../../../assets/Logo.png', import.meta.url);

export default function InspectorLogin() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (response?.token) {
        const payload = parseJwt(response.token);

        if (
          payload?.role === 'INSPECTOR' ||
          payload?.role === 'INSPECTION_TEAM'
        ) {
          login(response.token);
        } else {
          setError('Unauthorized role');
        }
      } else {
        setError('Invalid login response');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[var(--cream)] overflow-hidden">
      <div className="h-full w-full grid md:grid-cols-2">

        {/* Left Side */}
        <LeftMarketingPanel />

        {/* Right Side */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center justify-center h-screen bg-[#F8F6F4]"
        >
          <div className="w-full max-w-xl bg-white p-12 rounded-2xl shadow-2xl">

            {/* Logo */}
            <div className="text-center mb-6">
              <img
                src={logoPng.href}
                alt="ConstroBID"
                className="mx-auto w-28 h-auto object-contain mb-4"
              />

              <h2 className="text-2xl font-bold text-[#6b1b31]">
                Welcome Inspector!
              </h2>

              <p className="text-xs text-gray-500">
                Sign in to your ConstroBID Inspector account
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">
                  Email Address
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Mail size={16} />
                  </div>

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter inspector email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">
                  Password
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Lock size={16} />
                  </div>

                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                  >
                    {showPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <div className="flex items-center justify-between">

                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-[#8b1830] font-semibold"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#6b1b31] text-white rounded-lg font-semibold"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* SSO */}
            <button className="w-full border rounded-lg py-3 text-sm hover:bg-gray-50">
              Single Sign-On (SSO)
            </button>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 mt-6">
              Not an inspector?{' '}
              <Link
                href="/auth/login"
                className="text-[#8b1830] font-semibold"
              >
                Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
