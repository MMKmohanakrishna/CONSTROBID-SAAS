"use client";
import React, { useEffect, useState } from 'react';
import { projectApi } from '../../lib/api';
import Link from 'next/link';

export default function MonitoringList() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectApi.list()
      .then((res) => setProjects(Array.isArray(res) ? res : []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4">Loading projects...</div>;
  if (!projects.length) return <div className="p-4">No projects found.</div>;

  return (
    <div className="space-y-2">
      {projects.map((p) => (
        <div key={p._id} className="p-3 border rounded flex justify-between items-center">
          <div>
            <div className="font-medium">{p.title || 'Untitled Project'}</div>
            <div className="text-sm text-gray-500">{p.address || ''}</div>
          </div>
          <div>
            <Link href={`/monitoring/project/${p._id}`} className="px-3 py-1 bg-[#70153a] text-white rounded">View</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
