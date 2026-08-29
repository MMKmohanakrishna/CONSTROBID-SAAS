"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { monitoringApi } from '../../../../lib/api';
import SiteVisitCard from '../../../../components/monitoring/SiteVisitCard';

export default function VisitDetail() {
  const params = useParams();
  const id = params?.id as string;
  const [visit, setVisit] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    monitoringApi.listVisits({ id }).then((list) => {
      const found = Array.isArray(list) ? list.find((l: any) => l._id === id) : null;
      setVisit(found || null);
    }).catch(() => setVisit(null));
  }, [id]);

  if (!id) return <div className="p-4">Visit id missing</div>;
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Site Visit</h2>
      {visit ? <SiteVisitCard visit={visit} /> : <div>Loading...</div>}
    </div>
  );
}
