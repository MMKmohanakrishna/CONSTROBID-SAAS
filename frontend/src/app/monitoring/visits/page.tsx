"use client";
import React, { useEffect, useState } from 'react';
import { monitoringApi } from '../../../lib/api';
import Link from 'next/link';
import SiteVisitCard from '../../../components/monitoring/SiteVisitCard';

export default function VisitsPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    monitoringApi.listVisits().then((v) => setVisits(Array.isArray(v) ? v : [])).catch(() => setVisits([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Site Visits</h2>
        <Link href="/monitoring/visits/create" className="px-3 py-1 bg-[#70153a] text-white rounded">Create Visit</Link>
      </div>
      {loading ? <div>Loading...</div> : (
        visits.length ? (
          <div className="grid gap-3">
            {visits.map((v) => (
              <Link key={v._id} href={`/monitoring/visits/${v._id}`}>
                <a>
                  <SiteVisitCard visit={v} />
                </a>
              </Link>
            ))}
          </div>
        ) : <div>No visits recorded.</div>
      )}
    </div>
  );
}
