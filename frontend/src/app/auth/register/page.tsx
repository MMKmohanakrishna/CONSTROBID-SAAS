 'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Shield, Briefcase, Mail, Phone, Lock, FileText, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import LeftMarketingPanel from '@/components/LeftMarketingPanel';
const logoPng = new URL('../../../../assets/Logo.png', import.meta.url);

export default function Register() {
  const router = useRouter();
  const { login } = useAuth();

  const [role, setRole] = useState<'CLIENT' | 'CONTRACTOR'>('CLIENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Client specific fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Contractor specific fields
  const [ownerName, setOwnerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [experience, setExperience] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [showOtherCategory, setShowOtherCategory] = useState(false);
  const [otherCategory, setOtherCategory] = useState('');
  const [showOtherCity, setShowOtherCity] = useState(false);
  const [otherCity, setOtherCity] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [gst, setGst] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP step — shown after the form is submitted and the code has been sent.
  // Nothing is created in the database until this step succeeds.
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpChannel, setOtpChannel] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    // Read optional role query parameter e.g. from hero CTAs
    const r = new URLSearchParams(window.location.search).get('role');
    if (r === 'CONTRACTOR') {
      setRole('CONTRACTOR');
    } else {
      setRole('CLIENT');
    }
  }, []);

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleCity = (ct: string) => {
    setCities((prev) =>
      prev.includes(ct) ? prev.filter((c) => c !== ct) : [...prev, ct]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // A typed "Other" value is appended alongside the preset pills rather
    // than replacing them, so a contractor can pick presets and add one more.
    const allCategories = [...categories, ...(otherCategory.trim() ? [otherCategory.trim()] : [])];
    const allCities = [...cities, ...(otherCity.trim() ? [otherCity.trim()] : [])];

    const payload: any = {
      email,
      password,
      role,
      name: role === 'CLIENT' ? name : ownerName,
      phone,
    };

    if (role === 'CLIENT') {
      payload.address = address;
      payload.city = city;
    } else {
      payload.companyName = companyName;
      payload.ownerName = ownerName;
      payload.experience = experience;
      payload.serviceCategories = allCategories;
      payload.serviceCities = allCities;
      payload.aadhaar = aadhaar;
      payload.pan = pan;
      payload.gst = gst;
    }

    try {
      if (role === 'CONTRACTOR' && (allCategories.length === 0 || allCities.length === 0)) {
        throw new Error('Please select at least one service category and city.');
      }
      const response = await authApi.requestRegistrationOtp(payload);
      setOtpChannel(response.channel || (role === 'CONTRACTOR' ? 'SMS' : 'EMAIL'));
      setOtp('');
      setOtpError('');
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setVerifying(true);
    try {
      const response = await authApi.verifyRegistrationOtp({ email, otp });
      login(response.token);
    } catch (err: any) {
      setOtpError(err.message || 'Incorrect OTP. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setResendMessage('');
    setOtpError('');
    setResending(true);
    try {
      await authApi.resendRegistrationOtp(email);
      setResendMessage('A new code has been sent.');
    } catch (err: any) {
      setOtpError(err.message || 'Could not resend the code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const categoryOptions = ['Interior Design', 'Civil Construction', 'Plumbing', 'Electrical', 'Painting', 'Carpentry'];
  const cityOptions = ['Mumbai', 'Bangalore', 'Delhi NCR', 'Hyderabad', 'Pune'];

  return (
    <div className="min-h-screen w-full bg-[var(--cream)]">
      <div className="min-h-screen w-full grid md:grid-cols-2">
        <LeftMarketingPanel />

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex items-center justify-center min-h-screen bg-[#F8F6F4] px-4 py-8">
          <div className="w-full max-w-lg bg-white p-6 rounded-2xl shadow-xl">
            <div className="sm:mx-auto w-full sm:max-w-xl text-center mb-4">
              <img src={logoPng.href} alt="ConstroBID" className="mx-auto w-[250px] h-auto mt-5 object-contain" />
                
              <h2 className="text-2xl font-extrabold text-primary font-serif">Create your account</h2>
              <p className="mt-2 text-xs text-gray-500">Already registered? <Link href="/auth/login" className="font-semibold text-primary hover:underline">Sign in here</Link></p>
            </div>

            <div className="bg-white py-2 px-0">
              {step === 'otp' ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    {otpChannel === 'EMAIL'
                      ? <>We&apos;ve sent a 6-digit code to <span className="font-semibold text-gray-800">{email}</span>.</>
                      : <>We&apos;ve sent a 6-digit code by SMS to <span className="font-semibold text-gray-800">{phone}</span>.</>}
                    {' '}Enter it below to finish creating your account.
                  </p>

                  {otpError && (
                    <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg">
                      {otpError}
                    </div>
                  )}
                  {resendMessage && (
                    <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg">
                      {resendMessage}
                    </div>
                  )}

                  <form className="space-y-4" onSubmit={handleVerifyOtp}>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600 block">Verification Code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoFocus
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="6-digit code"
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm tracking-[0.3em] text-center font-bold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={verifying || otp.length !== 6}
                      className="w-full py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover shadow-md transition-all-300 flex items-center justify-center gap-2 disabled:bg-gray-400"
                    >
                      {verifying ? 'Verifying...' : 'Verify & Create Account'}
                      {!verifying && <CheckCircle2 size={16} />}
                    </button>
                  </form>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setStep('form')}
                      className="font-semibold text-gray-500 hover:text-gray-700"
                    >
                      &larr; Back to edit details
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resending}
                      className="font-semibold text-primary hover:underline disabled:text-gray-400"
                    >
                      {resending ? 'Resending...' : 'Resend code'}
                    </button>
                  </div>
                </div>
              ) : (
              <>
              {error && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg">
                  {error}
                </div>
              )}

              {/* Toggle Role Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setRole('CLIENT')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all-300 ${
                    role === 'CLIENT' ? 'bg-white text-primary shadow' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <User size={14} />
                  Homeowner
                </button>
                <button
                  type="button"
                  onClick={() => setRole('CONTRACTOR')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all-300 ${
                    role === 'CONTRACTOR' ? 'bg-white text-primary shadow' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Briefcase size={14} />
                  Partner Contractor
                </button>
              </div>

              <form className="space-y-1" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                {role === 'CLIENT' ? (
  <div className="space-y-1">
    <label className="text-xs font-bold text-gray-600 block">
      Full Name <span className="text-red-500">*</span>
    </label>

    <input
      type="text"
      required
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="e.g. Amit Kumar"
      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm"
    />
  </div>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

    <div className="space-y-1">
      <label className="text-xs font-bold text-gray-600 block">
        Owner Name <span className="text-red-500">*</span>
      </label>

      <input
        type="text"
        required
        value={ownerName}
        onChange={(e) => setOwnerName(e.target.value)}
        placeholder="e.g. Naveen Kumar"
        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm"
      />
    </div>

    <div className="space-y-1">
  <label className="text-xs font-bold text-gray-600">
    Company Name <span className="text-red-500">*</span>
  </label>

  <input
    type="text"
    required
    value={companyName}
    onChange={(e) => setCompanyName(e.target.value)}
    placeholder="e.g. Supreme Builders"
    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
  />
</div>

  </div>
)}
              </div>

              <div className="space-y-2 ">
                <label className="text-xs font-bold text-gray-600 block">Phone Number <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 99999 88888"
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 block">Email Address <span className="text-red-500">*</span></label>
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
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 block">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Client-specific details */}
            {role === 'CLIENT' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">Address <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, Locality"
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">City <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bangalore"
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                  />
                </div>
              </motion.div>
            )}

            {/* Contractor-specific details */}
            {role === 'CONTRACTOR' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 block">Years Experience <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 block">Aadhaar Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={aadhaar}
                      onChange={(e) => setAadhaar(e.target.value)}
                      placeholder="12-digit UID"
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 block">PAN Number <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={pan}
                      onChange={(e) => setPan(e.target.value)}
                      placeholder="10-digit PAN"
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 block">GST Number (Optional)</label>
                  <input
                    type="text"
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    placeholder="15-digit GSTIN"
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                  />
                </div>

                {/* Categories Multiselect */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 block">Operating Service Categories <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions.map((cat) => {
                      const isSelected = categories.includes(cat);
                      return (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all-300 ${
                            isSelected 
                              ? 'bg-primary text-white border-primary' 
                              : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setShowOtherCategory((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all-300 ${
                        showOtherCategory || otherCategory.trim()
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                      }`}
                    >
                      Other
                    </button>
                  </div>
                  {showOtherCategory && (
                    <input
                      type="text"
                      value={otherCategory}
                      onChange={(e) => setOtherCategory(e.target.value)}
                      placeholder="Type your service category"
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                    />
                  )}
                </div>

                {/* Cities Multiselect */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 block">Operating Cities <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {cityOptions.map((ct) => {
                      const isSelected = cities.includes(ct);
                      return (
                        <button
                          type="button"
                          key={ct}
                          onClick={() => toggleCity(ct)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all-300 ${
                            isSelected 
                              ? 'bg-primary text-white border-primary' 
                              : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                          }`}
                        >
                          {ct}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setShowOtherCity((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all-300 ${
                        showOtherCity || otherCity.trim()
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                      }`}
                    >
                      Other
                    </button>
                  </div>
                  {showOtherCity && (
                    <input
                      type="text"
                      value={otherCity}
                      onChange={(e) => setOtherCity(e.target.value)}
                      placeholder="Type your city"
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-brand-dark"
                    />
                  )}
                </div>
              </motion.div>
            )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover shadow-md transition-all-300 flex items-center justify-center gap-2 disabled:bg-gray-400"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                  {!loading && <CheckCircle2 size={16} />}
                </button>
              </form>
              </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
