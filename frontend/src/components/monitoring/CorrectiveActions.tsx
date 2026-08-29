"use client";
import React, { useState, useEffect } from 'react';
import { monitoringApi } from '../../lib/api';

export default function CorrectiveActions({ projectId }: { projectId?: string }) {
  const [actions, setActions] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { monitoringApi.listUpdates({ projectId }).then((u) => setActions(Array.isArray(u) ? u.filter((x: any) => /CORRECTIVE|corrective/i.test(x.notes || '')) : [])).catch(() => setActions([])); }, [projectId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await monitoringApi.createUpdate({ projectId, notes: `CORRECTIVE: ${text}` }); setText('');
      const u = await monitoringApi.listUpdates({ projectId }); setActions(Array.isArray(u) ? u.filter((x: any) => /CORRECTIVE|corrective/i.test(x.notes || '')) : []);
    } catch (err) { alert('Failed to add corrective action'); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="space-y-2">
        <div>
          <label htmlFor="correctiveText" className="block text-sm">Corrective Action</label>
          <input id="correctiveText" name="correctiveText" value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe corrective action" className="w-full border rounded p-2" aria-label="Corrective action" />
        </div>
        <div>
          <button type="submit" className="px-3 py-2 bg-[#efc975] text-black rounded" disabled={loading}>{loading ? 'Adding...' : 'Add Action'}</button>
        </div>
      </form>
      <div>
        {actions.length ? actions.map((a) => (
          <div key={a._id} className="p-2 border rounded mt-2">
            <div className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleString()}</div>
            <div className="mt-1">{a.notes}</div>
          </div>
        )) : <div className="text-sm text-gray-500">No corrective actions.</div>}
      </div>
    </div>
  );
}
