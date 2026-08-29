'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Star, Shield, User, ArrowRight, Menu, X } from 'lucide-react';
import { commonApi } from '@/lib/api';

export default function ContractorDirectory() {
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [cities, setCities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    searchPartners();
  }, [cityFilter, categoryFilter]);

  const fetchMetadata = async () => {
    try {
      const citiesData = await commonApi.getCities();
      const catsData = await commonApi.getCategories();
      setCities(citiesData);
      setCategories(catsData);
    } catch (err) {
      console.error(err);
    }
  };

  const searchPartners = async () => {
    setLoading(true);
    try {
      const list = await commonApi.searchContractors(cityFilter, categoryFilter);
      setContractors(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-brand-dark">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-150 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center bg-primary rounded-lg shadow-sm">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-secondary" strokeWidth="2.5">
                <path d="M3 21h18M3 10l9-7 9 7v11H3V10z" />
                <path d="M9 21v-6h6v6" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-primary font-serif">CONSTROBID</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/auth/login" className="text-xs font-bold text-primary px-4 py-2 border border-primary rounded-lg">
              Login
            </Link>
            <Link href="/auth/register" className="text-xs font-bold text-white px-4 py-2 bg-primary rounded-lg">
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* BODY */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 w-full">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-primary font-serif">Verified Partner Directory</h1>
          <p className="text-sm text-gray-500">Search and verify our registered contractors and interior designers across India.</p>
        </div>

        {/* Filter controls */}
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="city-select" className="text-[10px] font-bold text-gray-500 block">Select City</label>
            <select
              id="city-select"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none"
            >
              <option value="">All Cities</option>
              {cities.map((c, index) => (
                <option key={`${c._id || c.id || c.name || 'city'}-${index}`} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="category-select" className="text-[10px] font-bold text-gray-500 block">Select Category</label>
            <select
              id="category-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none"
            >
              <option value="">All Specialties</option>
              {categories.map((c, index) => (
                <option key={`${c._id || c.id || c.name || 'category'}-${index}`} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto" />
            <p className="text-xs text-gray-500 font-bold">Searching partner builders...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contractors.map((c) => (
              <div key={c.id} className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-primary leading-none">{c.companyName}</h3>
                      <span className="text-[10px] text-gray-400 block mt-1">Experience: {c.experience} Years</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-xs text-yellow-500 font-bold">
                      <Star size={13} className="fill-yellow-500" />
                      {c.rating > 0 ? c.rating.toFixed(1) : 'New'}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {c.serviceCategories.map((cat: string) => (
                      <span key={cat} className="px-2 py-0.5 bg-primary/5 text-primary text-[9px] font-semibold rounded">{cat}</span>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin size={12} />
                    <span>Operating in: {c.serviceCities.join(', ')}</span>
                  </div>
                </div>

                <Link
                  href={`/contractor/${c.id}`}
                  className="w-full py-2.5 bg-primary/5 text-primary text-xs font-bold rounded hover:bg-primary hover:text-white transition-all text-center flex items-center justify-center gap-1"
                >
                  View Public Profile
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))}

            {contractors.length === 0 && (
              <div className="col-span-3 py-16 text-center bg-white rounded-xl border border-gray-150 p-6 space-y-3">
                <Shield size={48} className="text-gray-300 mx-auto" />
                <h4 className="text-base font-bold text-gray-500">No partner contractors match search criteria</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">Try widening your filters to view all cities.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
