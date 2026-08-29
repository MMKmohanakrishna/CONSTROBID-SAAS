'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { projectApi } from '@/lib/api';

export default function ContractorProjectDetails() {
  const { id } = useParams();
  const searchParams = useSearchParams();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'details' | 'boq' | 'design'>('details');

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'boq' || tab === 'design') {
      setSelectedTab(tab);
    } else {
      setSelectedTab('details');
    }
  }, [searchParams]);

  async function fetchProject() {
    try {
      const data = await projectApi.getById(id as string);
      setProject(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-center">
        Loading Project...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-10 text-center">
        Project Not Found
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto p-8">

      <div className="bg-white rounded-2xl border shadow-sm p-8">

        <div className="flex justify-between items-start">

          <div>

            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
              {project.category}
            </span>

            <h1 className="mt-4 text-4xl font-bold text-primary">
              {project.title}
            </h1>

            <p className="mt-3 text-gray-600">
              {project.description}
            </p>

          </div>

          <div className="text-right">
            <div className="text-gray-500 font-medium">
              📍 {project.city}
            </div>
          </div>

        </div>

        <div className="mt-6 flex flex-wrap gap-3 items-center">
          {project.boqs?.length > 0 ? (
            <a
              href={project.boqs[0].fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-dark transition"
            >
              Open BOQ
            </a>
          ) : (
            <span className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500">
              BOQ not available
            </span>
          )}

          {project.designFiles?.length > 0 ? (
            <a
              href={project.designFiles[0].fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-dark transition"
            >
              Open Design
            </a>
          ) : (
            <span className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500">
              Design not available
            </span>
          )}
        </div>

        <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-3">BOQ Documents</h3>
          {project.boqs?.length > 0 ? (
            <div className="space-y-2">
              {project.boqs.map((boq: any, index: number) => (
                <div key={boq._id || index} className="flex items-center justify-between gap-4 rounded-lg bg-white p-4 border border-gray-200">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{boq.filename || `BOQ ${index + 1}`}</p>
                    <p className="text-xs text-gray-500">Status: {boq.status || 'Unknown'}</p>
                  </div>
                  <a
                    href={boq.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Open file
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No BOQ files uploaded for this project yet.</p>
          )}
        </div>

        <div className="mt-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Design Documents</h3>
          {project.designFiles?.length > 0 ? (
            <div className="space-y-2">
              {project.designFiles.map((design: any, index: number) => (
                <div key={design._id || index} className="flex items-center justify-between gap-4 rounded-lg bg-white p-4 border border-gray-200">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{design.filename || `Design ${index + 1}`}</p>
                    <p className="text-xs text-gray-500">Status: {design.status || 'Unknown'}</p>
                  </div>
                  <a
                    href={design.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Open file
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No design files uploaded for this project yet.</p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">

  <div className="bg-gray-50 rounded-xl p-4 text-center">
    <p className="text-xs text-gray-500">Client</p>
    <p className="mt-2 font-bold text-primary">
      {project.clientName || "Loading..."}
    </p>
  </div>

  <div className="bg-gray-50 rounded-xl p-4 text-center">
    <p className="text-xs text-gray-500">Area</p>
    <p className="mt-2 font-bold">
      {project.squareFeet} sq.ft
    </p>
  </div>

  <div className="bg-gray-50 rounded-xl p-4 text-center">
    <p className="text-xs text-gray-500">Budget</p>
    <p className="mt-2 font-bold text-green-600">
      ₹ {project.budget?.toLocaleString()}
    </p>
  </div>

  <div className="bg-gray-50 rounded-xl p-4 text-center">
  <p className="text-xs text-gray-500">Inspection</p>

  <p
    className={`mt-2 font-bold ${
      project.inspectionCompleted
        ? "text-green-600"
        : "text-orange-500"
    }`}
  >
    {project.inspectionCompleted
      ? "✅ Completed"
      : "⏳ Pending"}
  </p>
</div>

<div className="bg-gray-50 rounded-xl p-4 text-center">
  <p className="text-xs text-gray-500">BOQ</p>

  <p
    className={`mt-2 font-bold ${
      project.boqCompleted
        ? "text-green-600"
        : "text-orange-500"
    }`}
  >
    {project.boqCompleted
      ? "✅ Available"
      : "⏳ Pending"}
  </p>
</div>

<div className="bg-gray-50 rounded-xl p-4 text-center">
  <p className="text-xs text-gray-500">Design</p>

  <p
    className={`mt-2 font-bold ${
      project.designCompleted
        ? "text-green-600"
        : "text-orange-500"
    }`}
  >
    {project.designCompleted
      ? "✅ Available"
      : "⏳ Pending"}
  </p>
</div>

</div>

      </div>

    </div>
  </div>
);
}