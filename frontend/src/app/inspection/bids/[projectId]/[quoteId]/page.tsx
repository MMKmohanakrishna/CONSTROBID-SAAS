'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { projectApi, apiRequest } from '@/lib/api';
import { ArrowLeft, Upload, FileCheck2 } from 'lucide-react';

export default function QuotationDetailsPage() {
  const { projectId, quoteId } = useParams();
  const router = useRouter();

  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // The ConstroBID quotation is what the client will see, so it must be
  // uploaded before this quote can be verified.
  const [constrobidQuotation, setConstrobidQuotation] = useState("");
  const [constrobidQuotationName, setConstrobidQuotationName] = useState("");
  const [uploadingQuotation, setUploadingQuotation] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (projectId && quoteId) {
      loadQuotation();
    }
  }, [projectId, quoteId]);

  const loadQuotation = async () => {
    try {
      setLoading(true);

      const data = await projectApi.getQuotationById(
        projectId as string,
        quoteId as string
      );

      console.log("Quotation Details:", data);

      setQuotation(data);
      setConstrobidQuotation(data?.constrobidQuotation || "");
      setConstrobidQuotationName(data?.constrobidQuotationName || "");

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadConstrobidQuotation = async (file: File) => {
    setUploadError("");
    setUploadingQuotation(true);

    try {
      const form = new FormData();
      form.append("images", file);

      const res: any = await apiRequest("/uploads", {
        method: "POST",
        body: form,
      });

      const url = res?.[0]?.url;
      if (!url) throw new Error("Upload failed");

      setConstrobidQuotation(url);
      setConstrobidQuotationName(file.name);
    } catch (err: any) {
      console.error(err);
      // Show what the server actually rejected, so the fix is obvious.
      setUploadError(err?.message || "Upload failed. Please try again.");
    } finally {
      setUploadingQuotation(false);
    }
  };

  const verifyQuotation = async () => {
  if (!constrobidQuotation) {
    setUploadError("Please upload the ConstroBID Team Quotation before verifying.");
    return;
  }

  try {
    setSubmitting(true);

    await projectApi.verifyQuotation(
      projectId as string,
      quoteId as string,
      {
        remarks,
        constrobidQuotation,
        constrobidQuotationName,
      }
    );

    alert("Quotation Verified Successfully");

    router.push(`/inspection/bids/${projectId}`);

  } catch (err) {
    console.error(err);
    alert("Failed to verify quotation");
  } finally {
    setSubmitting(false);
  }
};

const requestRequote = async () => {
  try {
    setSubmitting(true);

    await projectApi.requestRequote(
      projectId as string,
      quoteId as string,
      {
        remarks,
      }
    );

    alert("Re Quote Requested");

    router.push(`/inspection/bids/${projectId}`);

  } catch (err) {
    console.error(err);
    alert("Failed to request a re quote");
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <div className="p-10 text-center text-lg">
        Loading quotation...
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-10 text-center text-red-600">
        Quotation not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      <div className="max-w-6xl mx-auto mb-6">
        <button
          type="button"
          onClick={() => router.push(`/inspection/bids/${projectId}`)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-primary"
          aria-label="Back to bid quotes"
          title="Back to bid quotes"
        >
          <ArrowLeft size={18} />
          Back to Bid Quotes
        </button>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow p-8">

        <div className="border-b pb-8">

  <div className="flex items-center justify-between">

    <div>

      <h1 className="text-4xl font-bold text-primary">
        {quotation.contractorId?.companyName}
      </h1>

      <p className="mt-2 text-slate-500">
        Submitted by{" "}
        <span className="font-semibold">
          {quotation.contractorId?.name}
        </span>
      </p>

    </div>

    {quotation.isVerified ? (

  <div className="rounded-full bg-green-100 px-5 py-3 font-semibold text-green-700">
    Verified
  </div>

) : quotation.rejected ? (

  <div className="rounded-full bg-red-100 px-5 py-3 font-semibold text-red-700">
    Rejected
  </div>

) : quotation.requoteRequested ? (

  <div className="rounded-full bg-orange-100 px-5 py-3 font-semibold text-orange-700">
    Re Quote Requested
  </div>

) : quotation.requoted ? (

  <div className="rounded-full bg-orange-100 px-5 py-3 font-semibold text-orange-700">
    Contractor Requoted Quotation
  </div>

) : (

  <div className="rounded-full bg-amber-100 px-5 py-3 font-semibold text-amber-700">
    Pending Verification
  </div>

)}

  </div>

</div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8">

  <h2 className="text-2xl font-bold text-primary">
    Contractor Information
  </h2>

<div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8">

  <h2 className="text-2xl font-bold text-primary">
    Quotation Attachment
  </h2>

  <div className="mt-6 flex flex-wrap gap-4">

  {quotation.quotationExcel && (
    <a
      href={quotation.quotationExcel}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-xl bg-green-600 px-6 py-3 text-white font-semibold hover:bg-green-700 transition"
    >
      📊 Download Excel
    </a>
  )}

  {quotation.quotationPdf && (
    <a
      href={quotation.quotationPdf}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-xl bg-red-600 px-6 py-3 text-white font-semibold hover:bg-red-700 transition"
    >
      📄 Download PDF
    </a>
  )}

  {!quotation.quotationExcel && !quotation.quotationPdf && (
    <div className="rounded-xl bg-slate-50 p-6 text-slate-500">
      No Quotation Attachments Uploaded
    </div>
  )}

</div>

</div>

<div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8">

  <h2 className="text-2xl font-bold text-primary">
    Inspector Uploaded (ConstroBID Team Quotation)
  </h2>

  <p className="mt-2 text-sm text-slate-500">
    This is the quotation the ConstroBID inspection team prepared and shared with the client.
  </p>

  {constrobidQuotation ? (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
      <FileCheck2 size={20} className="text-green-700" />

      <span className="font-semibold text-green-800">
        {constrobidQuotationName || "ConstroBID Quotation"}
      </span>

      <a
        href={constrobidQuotation}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto inline-flex items-center rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:opacity-90 transition"
      >
        View
      </a>
    </div>
  ) : (
    <div className="mt-6 rounded-xl bg-slate-50 p-6 text-slate-500">
      Nothing uploaded by the inspector yet.
    </div>
  )}

</div>

  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

    <div>
      <p className="text-sm text-slate-500">
        Company Name
      </p>

      <p className="mt-1 font-semibold">
        {quotation.contractorId?.companyName || "-"}
      </p>
    </div>

    <div>
      <p className="text-sm text-slate-500">
        Contractor Name
      </p>

      <p className="mt-1 font-semibold">
        {quotation.contractorId?.name || "-"}
      </p>
    </div>

    <div>
      <p className="text-sm text-slate-500">
        Experience
      </p>

      <p className="mt-1 font-semibold">
        {quotation.contractorId?.experience || 0} Years
      </p>
    </div>

    <div>
      <p className="text-sm text-slate-500">
        City
      </p>

      <p className="mt-1 font-semibold">
        {quotation.contractorId?.serviceCities?.[0] || "-"}
      </p>
    </div>

    <div>
      <p className="text-sm text-slate-500">
        Quote Amount
      </p>

      <p className="mt-1 font-semibold text-green-600">
        ₹{quotation.cost?.toLocaleString()}
      </p>
    </div>

    <div>
      <p className="text-sm text-slate-500">
        Validity
      </p>

      <p className="mt-1 font-semibold">
        {quotation.validityDays} Days
      </p>
    </div>

  </div>

</div>

{!quotation.isVerified && !quotation.rejected && (

<div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8">

  <div className="flex flex-wrap items-center gap-3">
    <h2 className="text-2xl font-bold text-primary">
      ConstroBID Team Quotation
    </h2>
    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
      Required
  </span>
  </div>

  <p className="mt-2 text-sm text-slate-500">
    Upload the quotation prepared by the ConstroBID team. This is the only
    quotation the client will see — the contractor&apos;s own files stay internal.
  </p>

  <div className="mt-6">
    <label
      htmlFor="constrobid-quotation"
      className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition ${
        uploadingQuotation ? "bg-slate-400" : "bg-primary hover:opacity-90"
      }`}
    >
      <Upload size={18} />
      {uploadingQuotation
        ? "Uploading..."
        : constrobidQuotation
        ? "Replace Quotation"
        : "Upload Quotation"}
    </label>

    <input
      id="constrobid-quotation"
      type="file"
      accept=".pdf,.xlsx,.xls,.csv,image/*"
      className="hidden"
      disabled={uploadingQuotation}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) uploadConstrobidQuotation(file);
        e.target.value = "";
      }}
    />
  </div>

  {constrobidQuotation && (
    <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
      <FileCheck2 size={20} className="text-green-700" />

      <span className="font-semibold text-green-800">
        {constrobidQuotationName || "ConstroBID Quotation"}
      </span>

      <a
        href={constrobidQuotation}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto font-semibold text-primary hover:underline"
      >
        View
      </a>
    </div>
  )}

  {uploadError && (
    <p className="mt-4 font-semibold text-red-600">
      {uploadError}
    </p>
  )}

  <h2 className="mt-10 text-2xl font-bold text-primary">
    Inspector Remarks
  </h2>

  <textarea
    rows={5}
    value={remarks}
    onChange={(e) => setRemarks(e.target.value)}
    placeholder="Enter verification remarks..."
    className="mt-6 w-full rounded-2xl border border-slate-300 p-4 focus:border-primary focus:outline-none"
  />

</div>

)}

        {!quotation.isVerified && !quotation.rejected ? (

<div className="mt-10 flex justify-end gap-4">

  <button
    onClick={requestRequote}
    disabled={submitting}
    className="rounded-xl border border-red-500 px-8 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
  >
    {submitting ? "Requesting..." : "Re Quote"}
  </button>

  <button
    onClick={verifyQuotation}
    disabled={submitting || uploadingQuotation || !constrobidQuotation}
    title={
      !constrobidQuotation
        ? "Upload the ConstroBID Team Quotation first"
        : "Verify this quotation"
    }
    className="rounded-xl bg-primary px-8 py-3 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {submitting ? "Verifying..." : "Verify Quotation"}
  </button>

</div>

) : (

<div className="mt-10 flex justify-end">

  <button
    onClick={() => router.push(`/inspection/bids/${projectId}`)}
    className="rounded-xl bg-primary px-8 py-3 font-semibold text-white"
  >
    Back to Quotations
  </button>

</div>

)}

      </div>

    </div>
  );
}   
