'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import {
  FolderKanban,
  CheckCircle2,
  Activity,
  IndianRupee,
Star,
TrendingUp,
TriangleAlert,
XCircle,
Timer,
BadgeCheck,
CreditCard,
Building2,
} from "lucide-react";

export default function ContractorDetail() {
  const { id } = useParams() as { id: string };
  const { token } = useAuth();
  const router = useRouter();
  const { setNotification } = useNotification();

  const [contractor, setContractor] = useState<any | null>(null);
const [performance, setPerformance] = useState<any>(null);
const [inspectorNotes, setInspectorNotes] = useState("");
const [relatedProjects, setRelatedProjects] = useState<any[]>([]);
const [showAadhaar, setShowAadhaar] = useState(false);
const [showPan, setShowPan] = useState(false);
const [showGST, setShowGST] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const json = await apiRequest(`/inspection/contractors/${id}`);

setContractor(json.contractor);
setPerformance(json.performance);
setInspectorNotes(json.inspectorNotes);
setRelatedProjects(json.relatedProjects || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const doAction = async (action: 'approve' | 'reject' | 'request-documents') => {
    const proceed = action === 'approve' ? confirm('Approve this contractor?') : true;
    if (!proceed) return;
    let body: any = {};
    if (action === 'reject') {
      const reason = prompt('Enter rejection reason (optional)');
      body.reason = reason || '';
    }
    if (action === 'request-documents') {
      const message = prompt('Message to contractor requesting documents', 'Please upload Aadhaar/PAN/GST/Portfolio');
      if (!message) return;
      body.message = message;
    }

    setActionLoading(true);
    try {
      const endpoint = `/inspection/contractors/${id}/${action === 'request-documents' ? 'request-documents' : action}`;
      await apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) });
      setNotification({
        type: 'success',
        message: 'Action completed'
      });
      router.push('/inspection/contractor-verification');
    } catch (err: any) {
      console.error(err);
      setNotification({
        type: 'error',
        message: err.message || 'Network error'
      });
    } finally {
      setActionLoading(false);
    }
  };


  if (loading) return <div>Loading...</div>;
  if (!contractor) return <div>Contractor not found</div>;

  const renderStatCard = (
  title: string,
  value: string | number,
  icon: React.ReactNode
) => (
  <div className="group rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6">

    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm text-gray-500">
          {title}
        </p>

        <h3 className="mt-3 text-4xl font-bold text-[#70153a]">
          {value}
        </h3>
      </div>

      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#70153a]/10 to-[#70153a]/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
        {icon}
      </div>

    </div>

  </div>
);
const renderSummaryCard = (
  title: string,
  value: string | number,
  valueColor: string,
  icon: React.ReactNode
) => (
  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 p-6">

    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm text-gray-500">
          {title}
        </p>

        <h3 className={`mt-4 text-4xl font-bold ${valueColor}`}>
          {value}
        </h3>
      </div>

      <div className="w-14 h-14 rounded-2xl bg-[#70153a]/10 flex items-center justify-center">
        {icon}
      </div>

    </div>

  </div>
);


  return (
    <div className="min-h-screen p-8 bg-gray-50">
  <div className="max-w-7xl mx-auto">
        <div className="mb-8">

  <button
    onClick={() => router.back()}
    className="text-[#70153a] font-medium hover:underline"
  >
    ← Back to Contractor Verification
  </button>

  <div className="mt-5 flex items-center justify-between">

    <div>

      <h1 className="text-4xl font-bold text-[#70153a]">
        Contractor Details
      </h1>

      <div className="mt-3 flex items-center gap-3">

        <span
          className={`px-4 py-1 rounded-full text-sm font-semibold
          ${
            contractor.status === "VERIFIED"
              ? "bg-green-100 text-green-700"
              : contractor.status === "PENDING_VERIFICATION"
              ? "bg-yellow-100 text-yellow-700"
              : contractor.status === "BLOCKED"
              ? "bg-gray-900 text-white"
              : "bg-red-100 text-red-700"
          }`}
        >
          {contractor.status}
        </span>

        <span className="text-gray-500">
          Contractor Registration Details
        </span>

      </div>

    </div>

    <div className="flex gap-3">

      {contractor.status === "PENDING_VERIFICATION" && (
        <>
          <button
            onClick={() => doAction("approve")}
            className="h-11 px-6 rounded-xl bg-green-600 text-white"
          >
            Approve
          </button>

          <button
            onClick={() => doAction("reject")}
            className="h-11 px-6 rounded-xl bg-red-600 text-white"
          >
            Reject
          </button>
        </>
      )}

      {contractor.status === "VERIFIED" && (
        <button
          className="h-11 px-6 rounded-xl bg-red-600 text-white"
        >
          Block Contractor
        </button>
      )}

    </div>

  </div>

</div>

        <div className="mt-8 rounded-3xl border border-gray-200 bg-white shadow-lg overflow-hidden">

  <div className="bg-gradient-to-r from-[#70153a] to-[#8d1f4b] px-8 py-6 text-white">

    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

      <div className="flex items-center gap-6">

        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold border-4 border-white">
          {contractor.companyName?.charAt(0) || "C"}
        </div>

        <div>

          <h2 className="text-3xl font-bold">
            {contractor.companyName || "Contractor"}
          </h2>

          <p className="mt-2 text-white/90">
            {contractor.name || "Owner"}
          </p>

        </div>

      </div>

      <div>

        <span
          className={`px-4 py-2 rounded-full font-semibold
          ${
            contractor.status === "VERIFIED"
              ? "bg-green-500"
              : contractor.status === "PENDING_VERIFICATION"
              ? "bg-yellow-500 text-black"
              : contractor.status === "BLOCKED"
              ? "bg-gray-900"
              : "bg-red-500"
          }`}
        >
          {contractor.status}
        </span>

      </div>

    </div>

  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">

    <div>
      <p className="text-sm text-gray-500">Email</p>
      <p className="font-semibold mt-1">
        {contractor.userId?.email || "—"}
      </p>
    </div>

    <div>
      <p className="text-sm text-gray-500">Phone</p>
      <p className="font-semibold mt-1">
        {contractor.phone || "—"}
      </p>
    </div>

    <div>
      <p className="text-sm text-gray-500">Experience</p>
      <p className="font-semibold mt-1">
        {contractor.experience || 0} Years
      </p>
    </div>

    <div>
      <p className="text-sm text-gray-500">Service Cities</p>
      <p className="font-semibold mt-1">
        {(contractor.serviceCities || []).join(", ") || "—"}
      </p>
    </div>

    <div>
      <p className="text-sm text-gray-500">Categories</p>
      <p className="font-semibold mt-1">
        {(contractor.serviceCategories || []).join(", ") || "—"}
      </p>
    </div>

    <div>
      <p className="text-sm text-gray-500">Registered On</p>
      <p className="font-semibold mt-1">
        {contractor.userId?.createdAt
          ? new Date(contractor.userId.createdAt).toLocaleDateString()
          : "—"}
      </p>
    </div>

  </div>
  <hr className="border-gray-200" />

<div className="px-8 ">
  <h2 className="w-full text-2xl font-bold text-[#70153a] mb-6 leading-none">
    Performance Statistics
  </h2>

</div>
<div className="flex justify-end">
  </div>
<div className="grid w-full max-w-7xl grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">

  {renderStatCard(
  "Projects Completed",
  performance?.projectsCompleted ?? 0,
  <FolderKanban className="w-8 h-8 text-blue-600" />
)}

{renderStatCard(
  "Average Rating",
  performance?.averageRating ?? 0,
  <Star className="w-8 h-8 text-yellow-500 fill-yellow-400" />
)}

{renderStatCard(
  "Completion Rate",
  `${performance?.completionRate ?? 0}%`,
  <TrendingUp className="w-8 h-8 text-green-600" />
)}

{renderStatCard(
  "Disputes",
  performance?.disputes ?? 0,
  <TriangleAlert className="w-8 h-8 text-orange-500" />
)}

{renderStatCard(
  "Cancelled Projects",
  performance?.cancelledProjects ?? 0,
  <XCircle className="w-8 h-8 text-red-500" />
)}

{renderStatCard(
  "On-Time Delivery",
  `${performance?.onTimeDelivery ?? 0}%`,
  <Timer className="w-8 h-8 text-purple-600" />
)}

</div>
<div className="px-8">
  <div className="mt-8 w-full"></div>
  <h2 className="w-full text-2xl font-bold text-[#70153a] mb-6 leading-none">
    Government Information
  </h2>

</div>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

<div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 p-6">

  <div className="flex items-start justify-between">

    <div className="flex-1">

      <p className="text-sm text-gray-500">
        Aadhaar Number
      </p>

      <h3 className="mt-3 text-lg font-semibold text-gray-900">
        {showAadhaar
          ? contractor.aadhaar
          : contractor.aadhaar
          ? "•••• •••• " + contractor.aadhaar.slice(-4)
          : "Not Available"}
      </h3>

      <button
        onClick={() => setShowAadhaar(!showAadhaar)}
        className="mt-4 text-sm font-semibold text-[#70153a] hover:underline"
      >
        {showAadhaar ? "🙈 Hide" : "👁 View"}
      </button>

    </div>

    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shadow-inner">
  <BadgeCheck className="w-8 h-8 text-blue-600" />
</div>

  </div>

</div>

<div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 p-6">

  <div className="flex items-start justify-between">

    <div className="flex-1">

      <p className="text-sm text-gray-500">
        PAN Number
      </p>

      <h3 className="mt-3 text-lg font-semibold text-gray-900">
        {showPan
          ? contractor.pan
          : contractor.pan
          ? "••••••" + contractor.pan.slice(-3)
          : "Not Available"}
      </h3>

      <button
        onClick={() => setShowPan(!showPan)}
        className="mt-4 text-sm font-semibold text-[#70153a] hover:underline"
      >
        {showPan ? "🙈 Hide" : "👁 View"}
      </button>

    </div>

    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner">
  <CreditCard className="w-8 h-8 text-emerald-600" />
</div>

  </div>

</div>

<div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 p-6">

  <div className="flex items-start justify-between">

    <div className="flex-1">

      <p className="text-sm text-gray-500">
        GST Number
      </p>

      <h3 className="mt-3 text-lg font-semibold text-gray-900">
        {contractor.gst
          ? showGST
            ? contractor.gst
            : "••••••••" + contractor.gst.slice(-4)
          : "Not Available"}
      </h3>

      {contractor.gst && (
        <button
          onClick={() => setShowGST(!showGST)}
          className="mt-4 text-sm font-semibold text-[#70153a] hover:underline"
        >
          {showGST ? "🙈 Hide" : "👁 View"}
        </button>
      )}

    </div>

    <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center shadow-inner">
  <Building2 className="w-8 h-8 text-purple-600" />
</div>

  </div>

</div>

</div>
<div className="px-8">
  <div className="mt-8 w-full"></div>
  <h2 className="w-full text-2xl font-bold text-[#70153a] mb-6 leading-none">
    Project Summary
  </h2>

  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

  {renderSummaryCard(
    "Total Projects",
    relatedProjects.length,
    "text-[#70153a]",
    <FolderKanban className="w-8 h-8 text-[#70153a]" />
  )}

  {renderSummaryCard(
    "Completed",
    relatedProjects.filter(
      (p: any) => p.status === "PROJECT_COMPLETED"
    ).length,
    "text-green-600",
    <CheckCircle2 className="w-8 h-8 text-green-600" />
  )}

  {renderSummaryCard(
    "Active",
    relatedProjects.filter(
      (p: any) => p.status !== "PROJECT_COMPLETED"
    ).length,
    "text-blue-600",
    <Activity className="w-8 h-8 text-blue-600" />
  )}

  {renderSummaryCard(
    "Total Budget",
    `₹${relatedProjects
      .reduce(
        (sum: number, p: any) => sum + (p.budget || 0),
        0
      )
      .toLocaleString()}`,
    "text-[#70153a]",
    <IndianRupee className="w-8 h-8 text-[#70153a]" />
  )}

</div>

</div>
<div className="px-8">
  <div className="mt-8 w-full"></div>

  <h2 className="w-full text-2xl font-bold text-[#70153a] mb-6 leading-none">
    Related Projects
  </h2>
  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

  <table className="w-full">

    <thead>
<tr>
<th className="px-6 py-4 text-left">Project</th>

<th className="px-6 py-4 text-left">Client</th>

<th className="px-6 py-4 text-left">City</th>

<th className="px-6 py-4 text-left">Budget</th>

<th className="px-6 py-4 text-left">Status</th>
</tr>
</thead>

    <tbody>
  {relatedProjects.length > 0 ? (
    relatedProjects.map((project: any) => (
      <tr
        key={project._id}
        className="border-t hover:bg-gray-50 transition"
      >
        <td className="px-6 py-5 font-semibold">
          {project.title}
        </td>

        <td className="px-6 py-5">
          {project.clientId?.name || "—"}
        </td>

        <td className="px-6 py-5">
          {project.city || "—"}
        </td>

        <td className="px-6 py-5 font-semibold text-green-700">
          ₹{(project.budget || 0).toLocaleString()}
        </td>

        <td className="px-6 py-5">
          <span
  className={`px-3 py-1 rounded-full text-xs font-semibold
  ${
    project.status === "PROJECT_COMPLETED"
      ? "bg-green-100 text-green-700"
      : project.status === "IN_PROGRESS"
      ? "bg-blue-100 text-blue-700"
      : project.status === "CONTRACTOR_CONFIRMED"
      ? "bg-purple-100 text-purple-700"
      : project.status === "INSPECTION_COMPLETED"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-gray-100 text-gray-700"
  }`}
>
  {project.status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c: string) => c.toUpperCase())}
</span>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan={6} className="py-10 text-center text-gray-500">
        No Related Projects Found
      </td>
    </tr>
  )}
</tbody>

  </table>

</div>

</div>

</div>
</div>
  </div>
  );
}
