"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import LeftMarketingPanel from '@/components/LeftMarketingPanel';

const logoPng = new URL('../../../../assets/Logo.png', import.meta.url);

export default function AdminLogin() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      login(response.token);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[var(--cream)] overflow-hidden">
      <div className="h-full w-full grid md:grid-cols-2">
        <LeftMarketingPanel />

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex items-center justify-center h-screen bg-[#F8F6F4]">
          <div className="w-full max-w-xl bg-white p-12 rounded-2xl shadow-2xl">
            <div className="text-center mb-6">
              <div className="mb-2">
                <img src={logoPng.href} alt="ConstroBID" className="mx-auto w-24 h-auto object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-[#6b1b31]">Welcome Admin!</h2>
              <p className="text-xs text-gray-500">Sign in to your ConstroBID admin account</p>
            </div>

            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={16} />
                  </div>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your admin email" className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 text-primary rounded" />
                  Remember me
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-[#8b1830] font-semibold hover:underline">Forgot Password?</Link>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 bg-[#6b1b31] text-white text-sm font-semibold rounded-lg hover:opacity-95 shadow-md transition-all-300 flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <div className="text-xs text-gray-400">or</div>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button className="flex items-center justify-center gap-2 py-2 px-3 border rounded-lg text-sm hover:shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" className="text-gray-600"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor"/></svg>
                Single Sign-On (SSO)
              </button>
            </div>

            <div className="text-center text-sm text-gray-500 mt-6">
              Not an admin? Return to <Link href="/auth/login" className="text-[#8b1830] font-semibold hover:underline">Login</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
