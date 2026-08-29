'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { projectApi } from '@/lib/api';
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import QuotationVerificationCard from "@/components/inspection/QuotationVerificationCard";

export default function ViewQuotationPage() {
  const { projectId } = useParams();

  const [quotations, setQuotations] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadQuotations();
    }
  }, [projectId]);

  const loadQuotations = async () => {
    try {
      setLoading(true);

  const response = await projectApi.getProjectQuotations(
  projectId as string
);

console.log("Backend Response:", response);

setProject(response.project);
setQuotations(response.quotations || []);


    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const prices = quotations.map((q: any) => q.cost);

const lowestQuote =
  prices.length > 0 ? Math.min(...prices) : 0;

const highestQuote =
  prices.length > 0 ? Math.max(...prices) : 0;

const averageQuote =
  prices.length > 0
    ? Math.round(
        prices.reduce((a: number, b: number) => a + b, 0) /
          prices.length
      )
    : 0;
    const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">

        <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">

          <button
  onClick={() => router.push("/inspection/bids")}
  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm "
>
  <ArrowLeft size={18} />
  Back
</button>

  <h1 className="text-4xl font-bold text-primary">
    {project?.title}
  </h1>

  <p className="mt-2 text-slate-500">
    {project?.propertyType} • {project?.city}
  </p>

  <p className="mt-1 text-slate-500">
    Client :
    <span className="font-semibold text-slate-700">
      {" "}
      {project?.clientId?.name}
    </span>
  </p>

  <div className="mt-8 grid grid-cols-4 gap-5">

    <div className="rounded-2xl bg-blue-50 p-5">
      <p className="text-slate-500 text-sm">
        Total Quotations
      </p>

      <h2 className="mt-2 text-3xl font-bold text-blue-700">
        {quotations.length}
      </h2>
    </div>

    <div className="rounded-2xl bg-green-50 p-5">
      <p className="text-slate-500 text-sm">
        Lowest Quote
      </p>

      <h2 className="mt-2 text-3xl font-bold text-green-700">
        ₹{lowestQuote.toLocaleString()}
      </h2>
    </div>

    <div className="rounded-2xl bg-red-50 p-5">
      <p className="text-slate-500 text-sm">
        Highest Quote
      </p>

      <h2 className="mt-2 text-3xl font-bold text-red-700">
        ₹{highestQuote.toLocaleString()}
      </h2>
    </div>

    <div className="rounded-2xl bg-purple-50 p-5">
      <p className="text-slate-500 text-sm">
        Average Quote
      </p>

      <h2 className="mt-2 text-3xl font-bold text-purple-700">
        ₹{averageQuote.toLocaleString()}
      </h2>
    </div>

  </div>

</div>

        <div className="mt-8">

          {loading && (
            <p>Loading...</p>
          )}

        {!loading &&
  quotations.map((quote: any) => (
    <QuotationVerificationCard
      key={quote._id}
      quotation={quote}
      onUpdated={loadQuotations}
    />
  ))}

        </div>

      </div>
    </div>
  );
}