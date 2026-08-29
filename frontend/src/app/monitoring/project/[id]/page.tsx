"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { projectApi } from '../../../../lib/api';
import { monitoringApi } from '../../../../lib/api';
import ProgressUpdateForm from '../../../../components/monitoring/ProgressUpdateForm';
import DelayHistory from '../../../../components/monitoring/DelayHistory';
import QualityIssues from '../../../../components/monitoring/QualityIssues';
import CorrectiveActions from '../../../../components/monitoring/CorrectiveActions';

export default function ProjectDetail() {
  const params = useParams();
  const id = params?.id as string;
  const [project, setProject] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    projectApi.getById(id).then((p) => setProject(p)).catch(() => setProject(null));
    monitoringApi.listUpdates({ projectId: id }).then((u) => setUpdates(Array.isArray(u) ? u : [])).catch(() => setUpdates([]));
    monitoringApi.listVisits({ projectId: id }).then((v) => setVisits(Array.isArray(v) ? v : [])).catch(() => setVisits([]));
  }, [id]);

  if (!id) return <div className="p-4">Project id missing</div>;
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Project Detail</h2>
      {project ? (
        <div className="mb-6">
          <div className="font-medium">{project.title || 'Untitled'}</div>
          <div className="text-sm text-gray-600">{project.address || ''}</div>
        </div>
      ) : <div>Loading project...</div>}

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Add Progress Update</h3>
        <ProgressUpdateForm projectId={id} onDone={() => monitoringApi.listUpdates({ projectId: id }).then((u) => setUpdates(Array.isArray(u) ? u : []))} />
      </div>

      <div>
        <h3 className="font-semibold mb-2">Timeline</h3>
        {(() => {
          const combined = [
            ...updates.map((u) => ({ type: 'update', time: new Date(u.createdAt).getTime(), data: u })),
            ...visits.map((v) => ({ type: 'visit', time: new Date(v.visitDate || v.createdAt).getTime(), data: v })),
          ].sort((a, b) => b.time - a.time);

          return combined.length ? combined.map((entry: any) => (
            <div key={`${entry.type}-${entry.data._id}`} className="p-2 border-b">
              <div className="text-sm text-gray-600">{new Date(entry.time).toLocaleString()}</div>
              {entry.type === 'update' ? (
                <>
                  <div>{entry.data.notes}</div>
                  <div className="text-xs text-gray-500">{entry.data.percentComplete !== undefined ? `Percent: ${entry.data.percentComplete}%` : ''}</div>
                </>
              ) : (
                <>
                  <div className="font-medium">Site Visit</div>
                  <div>{entry.data.notes}</div>
                  {entry.data.geoLocation && <div className="text-xs text-gray-500">Lat: {entry.data.geoLocation.lat} Lng: {entry.data.geoLocation.lng}</div>}
                </>
              )}
            </div>
          )) : <div>No timeline events yet.</div>;
        })()}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-1">
          <h3 className="font-semibold mb-2">Delay History</h3>
          <DelayHistory projectId={id} />
        </div>
        <div className="col-span-1 md:col-span-1">
          <h3 className="font-semibold mb-2">Quality Issues</h3>
          <QualityIssues projectId={id} />
        </div>
        <div className="col-span-1 md:col-span-1">
          <h3 className="font-semibold mb-2">Corrective Actions</h3>
          <CorrectiveActions projectId={id} />
        </div>
      </div>
    </div>
  );
}
