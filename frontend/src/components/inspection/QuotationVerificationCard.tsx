"use client";

import Link from "next/link";
import { useState } from "react";
import { projectApi } from "@/lib/api";

interface Props {
  quotation: any;
  onUpdated?: () => void;
}

export default function QuotationVerificationCard({
  quotation,
  onUpdated,
}: Props) {
  console.log("Quotation Card:", quotation);

  const [submitting, setSubmitting] = useState<"requote" | "verify" | null>(null);

  const requoteRequested = quotation.requoteRequested === true;

  // Contractor already sent revised figures back — still awaiting verification,
  // but it should not read like a first-time submission.
  const requoted = !requoteRequested && quotation.requoted === true;

  const highlighted = requoteRequested || requoted;

  const runAction = async (
    action: "requote" | "verify",
    call: () => Promise<any>,
    failureMessage: string
  ) => {
    try {
      setSubmitting(action);
      await call();
      onUpdated?.();
    } catch (err) {
      console.error(err);
      alert(failureMessage);
    } finally {
      setSubmitting(null);
    }
  };

  const requestRequote = () =>
    runAction(
      "requote",
      () =>
        projectApi.requestRequote(
          String(quotation.projectId),
          String(quotation._id),
          { remarks: "" }
        ),
      "Failed to request a re quote"
    );

  const verify = () =>
    runAction(
      "verify",
      () =>
        projectApi.verifyQuotation(
          String(quotation.projectId),
          String(quotation._id),
          { remarks: "" }
        ),
      "Failed to verify quotation"
    );

  return (
    <div
      className={`rounded-3xl border bg-white p-6 shadow-sm hover:shadow-lg transition-all ${
        highlighted
          ? "border-orange-300 ring-2 ring-orange-200 bg-orange-50/40"
          : "border-slate-200"
      }`}
    >

      {/* Header */}
      <div className="flex items-start justify-between">

        <div>

          <h2 className="text-2xl font-bold text-primary">
            {quotation.contractorId?.companyName ||
              quotation.contractorId?.name}
          </h2>

          <p className="mt-1 text-slate-500">
            {quotation.contractorId?.name}
          </p>

        </div>

        <div>
  {quotation.isVerified ? (
    <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
      Verified
    </div>
  ) : quotation.rejected ? (
    <div className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
      Rejected
    </div>
  ) : requoteRequested ? (
    <div className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
      Re Quote Requested
    </div>
  ) : requoted ? (
    <div className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
      Contractor Requoted Quotation
    </div>
  ) : (
    <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
      Pending Verification
    </div>
  )}
</div>

      </div>

      {highlighted && (
        <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-800">
          <div className="font-bold">
            {requoteRequested ? "Re Quote Requested" : "Contractor Requoted Quotation"}
          </div>
          <p className="mt-1 text-sm">
            {requoteRequested
              ? quotation.inspectorRemarks || "Waiting for the contractor to submit a revised quotation."
              : "These are revised figures submitted after your re quote request."}
          </p>
        </div>
      )}

      {/* Information Grid */}

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-5">

        <div className="rounded-xl bg-blue-50 p-4">

          <p className="text-sm text-slate-500">
            Experience
          </p>

          <h3 className="mt-2 text-2xl font-bold text-blue-700">
            {quotation.contractorId?.experience} Years
          </h3>

        </div>

        <div className="rounded-xl bg-green-50 p-4">

          <p className="text-sm text-slate-500">
            Quote Amount
          </p>

          <h3 className="mt-2 text-2xl font-bold text-green-700">
            ₹{quotation.cost.toLocaleString()}
          </h3>

        </div>

        <div className="rounded-xl bg-purple-50 p-4">

          <p className="text-sm text-slate-500">
            Validity
          </p>

          <h3 className="mt-2 text-2xl font-bold text-purple-700">
            {quotation.validityDays} Days
          </h3>

        </div>

        <div className="rounded-xl bg-orange-50 p-4">

          <p className="text-sm text-slate-500">
            City
          </p>

          <h3 className="mt-2 text-2xl font-bold text-orange-700">
            {quotation.contractorId?.serviceCities?.[0]}
          </h3>

        </div>

      </div>

      {/* Footer */}

      <div className="mt-8 flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-500">
            Submitted
          </p>

          <p className="font-semibold">
            {new Date(
              quotation.createdAt
            ).toLocaleDateString()}
          </p>

        </div>

        <div className="flex gap-3">

  <Link
    href={`/inspection/bids/${quotation.projectId}/${quotation._id}`}
    className="rounded-xl border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-100 transition"
  >
    View Details
  </Link>

</div>

      </div>

    </div>
  );
}