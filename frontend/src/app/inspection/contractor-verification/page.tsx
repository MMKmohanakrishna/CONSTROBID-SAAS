'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Search,
  Phone,
  Mail,
  FileText
} from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

export default function ContractorVerification() {
  const { token, loading } = useAuth();
  const { setNotification } = useNotification();
  const [tab, setTab] =
  useState<
    'PENDING_VERIFICATION'
    | 'VERIFIED'
    | 'REJECTED'
    | 'ALL'
    | 'UNDER_REVIEW'
  >('ALL');
  const [allContractors, setAllContractors] = useState<any[]>([]);
  const [showBlockModal, setShowBlockModal] = useState(false);

const [selectedContractor, setSelectedContractor] = useState<any>(null);

const [blockReason, setBlockReason] = useState("");

const [blocking, setBlocking] = useState(false);
const [showConfirmBlockModal, setShowConfirmBlockModal] =
  useState(false);
  const [list, setList] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [cityFilter, setCityFilter] = useState<string>('All Cities');
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories');
  const [experienceFilter, setExperienceFilter] = useState<string>('All');

  useEffect(() => {
    if (!loading) fetchList();
  }, [tab, loading]);

  const fetchList = async () => {
  setLoadingList(true);

  try {
    // Always fetch all contractors
    const allData =
      await apiRequest(
        "/inspection/contractors"
      );
    console.log("ALL DATA", allData);

console.table(
  allData.map((c: any) => ({
    company: c.companyName,
    status: c.status,
  }))
);

    setAllContractors(allData || []);

    // Filter according to tab. Treat BLOCKED as part of REJECTED view.
    if (tab === "ALL") {
      setList(allData || []);
    } else if (tab === "REJECTED") {
      setList(
        (allData || []).filter((c: any) => (c.status === "REJECTED" || c.status === "BLOCKED"))
      );
    } else {
      setList((allData || []).filter((c: any) => c.status === tab));
    }
  } catch (e) {
    console.error(e);
    setList([]);
    setAllContractors([]);
  } finally {
    setLoadingList(false);
  }
};  

  const refresh = async () => { await fetchList(); };

  const approve = async (id: string) => {
    if (!confirm('Approve this contractor?')) return;
    try {
      await apiRequest(`/inspection/contractors/${id}/approve`, { method: 'POST' });
      setNotification({ type: 'success', message: 'Contractor approved' });
      await fetchList();
    } catch (e: any) {
      console.error(e);
      setNotification({ type: 'error', message: e?.message || 'Network error' });
    }
  };

  const reject = async (id: string) => {
    const reason = prompt('Enter rejection reason (optional)');
    try {
      await apiRequest(`/inspection/contractors/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason: reason || '' }) });
      setNotification({ type: 'success', message: 'Contractor rejected' });
      await fetchList();
    } catch (e: any) {
      console.error(e);
      setNotification({ type: 'error', message: e?.message || 'Network error' });
    }
  };

  const requestDocs = async (id: string) => {
    const message = prompt('Message to contractor (request documents)');
    if (!message) return;
    try {
      await apiRequest(`/inspection/contractors/${id}/request-documents`, { method: 'POST', body: JSON.stringify({ message }) });
      setNotification({ type: 'success', message: 'Requested documents from contractor' });
      await fetchList();
    } catch (e: any) {
      console.error(e);
      setNotification({ type: 'error', message: e?.message || 'Network error' });
    }
  };

  const counts = useMemo(() => {
    const total =
  allContractors.length;

const pending =
  allContractors.filter(
    c =>
      c.status ===
      "PENDING_VERIFICATION"
  ).length;

const verified =
  allContractors.filter(
    c =>
      c.status ===
      "VERIFIED"
  ).length;

const rejected =
  allContractors.filter(c => c.status === "REJECTED" || c.status === "BLOCKED").length;
    const expiring = list.filter(c => (c.documents || []).some((d: any) => d.expiresAt && (new Date(d.expiresAt).getTime() - Date.now()) <= 1000*60*60*24*30)).length;
    return { total, pending, verified, rejected, expiring };
  }, [allContractors]);

  const cities = useMemo(
  () =>
    Array.from(
      new Set(
        allContractors.flatMap(
          c =>
            c.serviceCities || []
        )
      )
    ),
  [allContractors]
);
  const categories = useMemo(
  () =>
    Array.from(
      new Set(
        allContractors.flatMap(
          c =>
            c.serviceCategories || []
        )
      )
    ),
  [allContractors]
);

  const filtered = useMemo(() => {
    return list.filter(c => {
      if (query) {
        const q = query.toLowerCase();
        const hay = `${c.companyName || ''} ${c.name || ''} ${c.email || ''} ${(c.gst||'')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter !== 'All' && statusFilter !== '') {
        if (statusFilter.toUpperCase() === 'REJECTED') {
          if (!['REJECTED', 'BLOCKED'].includes((c.status || '').toUpperCase())) return false;
        } else {
          if ((c.status || '').toUpperCase() !== statusFilter.toUpperCase()) return false;
        }
      }
      if (cityFilter !== 'All Cities' && cityFilter !== '') {
        if (!((c.serviceCities||[]).includes(cityFilter))) return false;
      }
      if (categoryFilter !== 'All Categories' && categoryFilter !== '') {
        if (!((c.serviceCategories||[]).includes(categoryFilter))) return false;
      }
      if (experienceFilter !== 'All' && experienceFilter !== '') {
        if (experienceFilter === '0-3' && (c.experience || 0) > 3) return false;
        if (experienceFilter === '4-7' && ((c.experience || 0) < 4 || (c.experience || 0) > 7)) return false;
        if (experienceFilter === '8+' && (c.experience || 0) < 8) return false;
      }
      return true;
    });
  }, [list, query, statusFilter, cityFilter, categoryFilter, experienceFilter]);

  const blockContractor = async () => {
  if (!selectedContractor) return;

  if (!blockReason.trim()) {
    setNotification({
      type: "error",
      message: "Please enter a reason.",
    });
    return;
  }
  if (
  !window.confirm(
    "Are you sure you want to permanently block this contractor?"
  )
) {
  return;
}

  try {
    setBlocking(true);

    await apiRequest(
      `/inspection/contractors/${selectedContractor._id}/block`,
      {
        method: "POST",
        body: JSON.stringify({
          reason: blockReason,
        }),
      }
    );

    setNotification({
      type: "success",
      message: "Contractor blocked successfully.",
    });

    setShowBlockModal(false);
    setSelectedContractor(null);
    setBlockReason("");

    await fetchList();
  } catch (e: any) {
    console.error(e);

    setNotification({
      type: "error",
      message: e?.message || "Failed to block contractor.",
    });
  } finally {
    setBlocking(false);
  }
};

  return (
    <div className="min-h-screen">
  <div className="max-w-[1380px] mx-auto p-6 bg-white rounded-2xl glass-card border border-white/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--primary)]">Contractor Verification</h2>
            <p className="text-sm text-gray-600 mt-2">Review contractor registrations and approve or request additional documents.</p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {/* Top stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="
relative
rounded-3xl
p-6
border
border-[#FBE5A8]
bg-[#FFF8E8]
shadow-[0_8px_30px_rgba(0,0,0,0.05)]
hover:-translate-y-1
hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)]
transition-all
duration-300
">
              <div className="absolute top-4 right-4 rounded-full bg-[#FFF0C2] p-3 shadow-md">
                <Clock size={24} className="text-orange-600" />
              </div>
              <div className="text-xs uppercase tracking-[0.24em] font-semibold text-orange-800">Pending Verification</div>
              <div className="mt-5 text-4xl font-bold text-slate-900">{counts.pending}</div>
              <div className="mt-2 text-sm text-slate-600">Requires your action</div>
            </div>

            <div className="relative rounded-3xl p-6 shadow-sm border border-[#D7F4E2] bg-[#EEFDF3]">
              <div className="absolute top-4 right-4 rounded-full bg-[#DDF8E7] p-3 shadow-md">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
              <div className="text-xs uppercase tracking-[0.24em] font-semibold text-emerald-800">Verified Contractors</div>
              <div className="mt-5 text-4xl font-bold text-slate-900">{counts.verified}</div>
              <div className="mt-2 text-sm text-slate-600">Approved & Active</div>
            </div>

            <div className="relative rounded-3xl p-6 shadow-sm border border-[#F7D7E5] bg-[#FDF2F7]">
              <div className="absolute top-4 right-4 rounded-full bg-[#F8DFEA] p-3 shadow-md">
                <XCircle size={24} className="text-red-600" />
              </div>
              <div className="text-xs uppercase tracking-[0.24em] font-semibold text-red-800">Rejected Contractors</div>
              <div className="mt-5 text-4xl font-bold text-slate-900">{counts.rejected}</div>
              <div className="mt-2 text-sm text-slate-600">Not approved</div>
            </div>

            <div className="relative rounded-3xl p-6 shadow-sm border border-[#D7E7FF] bg-[#EEF5FF]">
              <div className="absolute top-4 right-4 rounded-full bg-[#DCEBFF] p-3 shadow-md">
                <Users size={24} className="text-sky-600" />
              </div>
              <div className="text-xs uppercase tracking-[0.24em] font-semibold text-sky-800">All Contractors</div>
              <div className="mt-5 text-4xl font-bold text-slate-900">{counts.total}</div>
              <div className="mt-2 text-sm text-slate-600">Registered contractors</div>
            </div>
          </div>

          {/* Search & Filters */}
          
          <div className="flex items-center gap-4 w-[97%] mx-auto">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                <input aria-label="Search contractors" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by company name, email, phone, GST..." className="pl-10 pr-3 py-2 w-full rounded-md border" />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select aria-label="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded">
                <option>All</option>
                <option>PENDING_VERIFICATION</option>
                <option>VERIFIED</option>
                <option>REJECTED</option>
                <option>UNDER_REVIEW</option>
              </select>
              <select aria-label="Filter by city" value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="px-3 py-2 border rounded">
                <option>All Cities</option>
                {cities.map(c => <option key={c}>{c}</option>)}
              </select>
              <select aria-label="Filter by category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 border rounded">
                <option>All Categories</option>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
              <select aria-label="Filter by experience" value={experienceFilter} onChange={e => setExperienceFilter(e.target.value)} className="px-3 py-2 border rounded">
                <option>All</option>
                <option value="0-3">0-3 yrs</option>
                <option value="4-7">4-7 yrs</option>
                <option value="8+">8+ yrs</option>
              </select>

            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4 w-[97%] mx-auto mt-4">
            <div className={`px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap ${tab === 'ALL' ? 'bg-[var(--primary)] text-white' : 'bg-gray-100 hover:bg-gray-200'}`} onClick={() => setTab('ALL')}>All ({counts.total})</div>
            <div className={`px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap ${tab === 'PENDING_VERIFICATION' ? 'bg-yellow-600 text-white' : 'bg-gray-100'}`} onClick={() => setTab('PENDING_VERIFICATION')}>Pending ({counts.pending})</div>
            <div className={`px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap ${tab === 'VERIFIED' ? 'bg-green-600 text-white' : 'bg-gray-100'}`} onClick={() => setTab('VERIFIED')}>Verified ({counts.verified})</div>
            <div className={`px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap ${tab === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-gray-100'}`} onClick={() => setTab('REJECTED')}>Rejected ({counts.rejected})</div>
            <div className={`px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap ${tab === 'UNDER_REVIEW' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`} onClick={() => setTab('UNDER_REVIEW')}>Under Review</div>
            <div className="ml-auto mr-4 text-sm text-gray-500">Sort by: <select aria-label="Sort contractors" className="ml-2 border rounded px-2 py-1"><option>Latest</option><option>Oldest</option></select></div>
          </div>

          {/* Contractor grid */}
          <div className="mt-4">
            {loadingList ? (
              <div>Loading...</div>
            ) : (
              <div>
                {filtered.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">No contractors match the filters.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((c: any) => (
                     <div
                       key={c._id}
                         className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6">
                        <div className="flex flex-col">
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">

  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold
      ${
        c.status === "VERIFIED"
          ? "bg-green-100 text-green-700"
          : c.status === "PENDING_VERIFICATION"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-red-100 text-red-700"
      }`}
  >
    {c.status === "VERIFIED"
      ? "VERIFIED"
      : c.status === "PENDING_VERIFICATION"
      ? "PENDING"
      : c.status === "BLOCKED"
      ? "BLOCKED"
      : "REJECTED"}
  </span>

  <span className="text-sm font-medium text-gray-500">
    {c.experience || 0} Years
  </span>

</div>

<h2 className="mt-2 text-2xl font-bold text-[#70153a]">
  {c.companyName || c.name}
</h2>

<p className="text-gray-500 mt-2">
  {c.serviceCategories?.join(", ") || "General Contractor"}
</p>
                            <div className="text-sm text-gray-500">{(c.serviceCities||[]).join(', ') || '-'}</div>
                            <div className="mt-5 space-y-3">

  <div className="flex items-center gap-3 text-gray-600">
    <Phone size={18} className="text-[#70153a]" />
    <span>{c.phone || "-"}</span>
  </div>

  <div className="flex items-center gap-3 text-gray-600">
    <Mail size={18} className="text-[#70153a]" />
    <span>{c.userId?.email || c.email || "-"}</span>
  </div>

</div>
                            <div className="mt-6">

  <p className="text-sm font-semibold text-gray-600 mb-3">
    Documents
  </p>

  <div className="flex flex-wrap gap-2">
                              <div className={`px-2 py-1 rounded text-xs ${c.aadhaar ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>Aadhaar</div>
                              <div className={`px-2 py-1 rounded text-xs ${c.pan ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>PAN</div>
                              <div className={`px-2 py-1 rounded text-xs ${c.gst ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>GST</div>
                            </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-3">

  <Link
    href={`/inspection/contractors/${c._id}`}
    className="flex-1 h-12 rounded-xl bg-[#70153a] hover:bg-[#5d1230] text-white font-semibold flex items-center justify-center transition"
  >
    View Details
  </Link>

  {c.status === "VERIFIED" && (
    <button
      onClick={() => {
    setSelectedContractor(c);
    setBlockReason("");
    setShowBlockModal(true);
}}
      className="px-6 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition"
    >
      Block
    </button>
  )}

  {c.status === "PENDING_VERIFICATION" && (
    <>
      <button
        onClick={() => approve(c._id)}
        className="px-3 py-2 bg-green-600 text-white rounded-lg"
      >
        Approve
      </button>

      <button
        onClick={() => reject(c._id)}
        className="px-3 py-2 bg-red-600 text-white rounded-lg"
      >
        Reject
      </button>
    </>
  )}

</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {showBlockModal && (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">

    <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl p-8">

        <h2 className="text-2xl font-bold text-red-600">
            Block Contractor
        </h2>

        <p className="mt-3 text-gray-600">
            Are you sure you want to block this contractor?
        </p>

        <div className="mt-6">

            <label className="block font-semibold mb-2">
                Reason
            </label>

            <textarea
                value={blockReason}
                onChange={(e)=>setBlockReason(e.target.value)}
                rows={5}
                placeholder="Enter reason..."
                className="w-full rounded-xl border p-4 resize-none"
            />

        </div>

        <div className="mt-8 flex justify-end gap-3">

            <button
                onClick={()=>{
                    setShowBlockModal(false);
                }}
                className="px-6 py-3 rounded-xl border"
            >
                Cancel
            </button>

            <button
    onClick={blockContractor}
    disabled={blocking}
    className="px-6 py-3 rounded-xl bg-red-600 text-white disabled:opacity-50"
>
    {blocking ? "Blocking..." : "Block Contractor"}
</button>

        </div>

    </div>

</div>
)}
    </div>
  );
}
