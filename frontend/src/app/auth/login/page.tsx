'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
const constructionBg = new URL('../../../../assets/Construction-bg.png', import.meta.url);
const logoImg = new URL('../../../../assets/Logo-B&W.png', import.meta.url);
const logoPng = new URL('../../../../assets/Logo.png', import.meta.url);


export default function Login() {
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

console.log("LOGIN RESPONSE:", response);

await login(response.token);
    } 
    catch (err: any) {
  console.log("LOGIN ERROR:", err);

  const message =
    err?.response?.data?.error ||
    err?.error ||
    err?.message;

  if (message === 'EMAIL_NOT_FOUND') {
    setError('Email is not registered. Please create an account.');
  } 
  else if (message === 'INVALID_PASSWORD') {
    setError('Incorrect password. Please try again.');
  }
  else if (message === 'NOT_INSPECTION_TEAM') {
    setError('This account is not an Inspection Team account.');
  }
  else {
    setError('Login failed. Please try again.');
  }
}finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[var(--cream)] overflow-hidden">
      <div className="h-full w-full grid md:grid-cols-2">
        {/* Left marketing panel */}
        <div className="hidden md:flex flex-col justify-center p-16 text-white relative h-screen overflow-hidden">
          <div className="absolute inset-0">
            <img src={constructionBg.href} alt="Construction Background" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-[rgba(40,0,15,0.82)] to-[rgba(25,0,10,0.92)]" />
          </div>
          <div className="absolute inset-0 bg-[#7A002C]/55"></div>
          <div className="relative z-10 mb-23">
            <img
              src={logoImg.href}
              alt="ConstroBID"
              className="w-[300px] h-auto object-contain top-50"
            />
          </div>

          <h1 className="relative z-10 text-5xl font-bold leading-tight mb-6 text-white">India's Smart Construction Management Platform</h1>
          <p className="relative z-10 text-xl text-white/90 mb-8">Streamlining construction projects, contractor management, and inspections with transparency and efficiency.</p>

          <div className="relative z-10 grid grid-cols-2 gap-4 mt-12">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col items-start gap-3">
              <Shield className="text-white" />
              <div className="text-sm font-semibold">Verified Contractors</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" className="text-white"><path d="M3 7h18M6 11h12M9 15h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              <div className="text-sm font-semibold">Transparent Bidding</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" className="text-white"><path d="M3 7h18M5 12h14M7 17h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              <div className="text-sm font-semibold">Quality Inspections</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" className="text-white"><path d="M3 21v-6l6-6 6 6 6-6v12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
              <div className="text-sm font-semibold">Real-time Tracking</div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex items-center justify-center h-screen bg-[#F8F6F4]">
          <div className="w-full max-w-xl bg-white p-12 rounded-2xl shadow-2xl">
            <div className="text-center mb-6">
              <div className="mb-2">
                <img src={logoPng.href} alt="ConstroBID" className="mx-auto w-32 h-auto object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-[#6b1b31]">Welcome Back!</h2>
              <p className="text-xs text-gray-500">Sign in to your ConstroBID account</p>
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
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark" />
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
               
                <Link href="/auth/forgot-password" className="text-sm text-[#8b1830] font-semibold hover:underline">Forgot Password?</Link>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 bg-[#6b1b31] text-white text-sm font-semibold rounded-lg hover:opacity-95 shadow-md transition-all-300 flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <div className="text-xs text-gray-400">or continue with</div>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 py-2 px-3 border rounded-lg text-sm hover:shadow-sm">
                <img src="/images/google.svg" alt="google" className="w-4 h-4" />
                Sign in with Google
              </button>
              <button className="flex items-center justify-center gap-2 py-2 px-3 border rounded-lg text-sm hover:shadow-sm">
                <img src="/images/microsoft.svg" alt="microsoft" className="w-4 h-4" />
                Sign in with Microsoft
              </button>
            </div>

            <div className="text-center text-sm text-gray-500 mt-6">
              Don't have an account? <Link href="/auth/register" className="text-[#8b1830] font-semibold hover:underline">Sign up here</Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
