'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MapPin, Star, Shield, ArrowLeft, Building, ClipboardList, Clock } from 'lucide-react';
import { commonApi } from '@/lib/api';

export default function ContractorProfile() {
  const params = useParams();
  const slug = params.slug as string;

  const [contractor, setContractor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchProfile();
    }
  }, [slug]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await commonApi.getContractorProfile(slug);
      setContractor(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-serif text-brand-dark">
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
          <Link href="/contractor" className="text-xs font-bold text-gray-500 hover:text-primary flex items-center gap-1">
            <ArrowLeft size={14} /> Back to Directory
          </Link>
        </div>
      </header>

      {/* BODY */}
      {loading ? (
        <div className="py-24 text-center space-y-4 flex-1">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto" />
          <p className="text-xs text-gray-500 font-bold">Loading contractor credentials...</p>
        </div>
      ) : contractor ? (
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 w-full">
          {/* Header Card */}
          <div className="bg-white p-8 rounded-xl border border-gray-150 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-primary font-serif">{contractor.companyName}</h1>
                  <div className="px-2.5 py-0.5 bg-green-50 border border-green-150 text-green-700 text-[10px] font-bold rounded flex items-center gap-1">
                    <Shield size={10} /> Verified
                  </div>
                </div>
                <p className="text-xs text-gray-550 font-semibold">{contractor.experience} Years Active Industry Experience</p>
              </div>
              <div className="flex items-center gap-1.5 bg-yellow-50 px-4 py-2 border border-yellow-150 rounded-lg text-yellow-600 font-extrabold text-sm w-fit">
                <Star size={16} className="fill-yellow-500" />
                {contractor.avgRating > 0 ? contractor.avgRating.toFixed(1) : 'New'} ({contractor.reviewCount} Reviews)
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {contractor.serviceCategories.map((cat: string) => (
                <span key={cat} className="px-3 py-1 bg-primary/5 text-primary text-xs font-semibold rounded">{cat}</span>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-400" />
                <strong>Cities:</strong> {contractor.serviceCities.join(', ')}
              </div>
              <div className="flex items-center gap-2">
                <Building size={14} className="text-gray-400" />
                <strong>Completed Projects:</strong> {contractor.completedProjects.length}
              </div>
            </div>
          </div>

          {/* Portfolio & Reviews grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Portfolio Column (Columns: 2) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Portfolio */}
              <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-primary font-serif">Project Portfolio</h3>
                {contractor.portfolio.length === 0 ? (
                  <p className="text-xs text-gray-450">No portfolio images uploaded by contractor yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {contractor.portfolio.map((img: string, i: number) => (
                      <div key={i} className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-150 shadow-sm hover:scale-[1.02] transition-transform duration-200">
                        <img src={img} alt="portfolio construction layout" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completed Projects */}
              <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-primary font-serif">Completed Works</h3>
                {contractor.completedProjects.length === 0 ? (
                  <p className="text-xs text-gray-450">No completed project records registered on ConstroBID yet.</p>
                ) : (
                  <div className="space-y-3">
                    {contractor.completedProjects.map((p: any) => (
                      <div key={p.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <h4 className="font-bold text-primary">{p.title}</h4>
                          <span className="text-gray-400 font-semibold">{p.category} | {p.city}</span>
                        </div>
                        <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded uppercase">Completed</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right reviews sidebar (Columns: 1) */}
            <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-4 h-fit">
              <h3 className="text-base font-bold text-primary font-serif">Client Reviews</h3>
              <div className="space-y-4">
                {contractor.reviews.map((rev: any) => (
                  <div key={rev.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary">{rev.projectTitle}</span>
                      <div className="flex gap-0.5 text-yellow-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} size={11} className="fill-yellow-500 text-yellow-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 italic font-medium">"{rev.comment}"</p>
                    <span className="text-[9px] text-gray-400 block text-right">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
                {contractor.reviews.length === 0 && (
                  <p className="text-xs text-gray-450 text-center py-8">No feedback reviews submitted yet for this contractor.</p>
                )}
              </div>
            </div>
          </div>
        </main>
      ) : (
        <div className="py-24 text-center space-y-4 flex-1">
          <Shield className="text-red-500 mx-auto" size={48} />
          <h2 className="text-lg font-bold text-gray-550">Contractor profile not found or unapproved</h2>
          <Link href="/contractor" className="text-xs font-semibold text-primary hover:underline">Return to directory list</Link>
        </div>
      )}
    </div>
  );
}
