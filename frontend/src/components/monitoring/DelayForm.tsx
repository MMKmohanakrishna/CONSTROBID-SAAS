"use client";
import React, { useState } from 'react';
import { monitoringApi } from '../../lib/api';

export default function DelayForm({ projectId, onDone }: { projectId: string; onDone?: () => void }) {
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState<'low'|'medium'|'high'>('medium');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await monitoringApi.flagDelay(projectId, `${severity.toUpperCase()}: ${reason}`);
      setReason(''); setSeverity('medium');
      if (onDone) onDone();
    } catch (err) { alert('Failed to flag delay'); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="delayReason" className="block text-sm">Reason</label>
        <input id="delayReason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe cause of delay" className="w-full border rounded p-2" aria-label="Delay reason" />
      </div>
      <div>
        <label htmlFor="delaySeverity" className="block text-sm">Severity</label>
        <select id="delaySeverity" value={severity} onChange={(e) => setSeverity(e.target.value as any)} className="w-full border rounded p-2" aria-label="Delay severity">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div>
        <button type="submit" className="px-4 py-2 bg-[#efc975] text-black rounded" disabled={loading}>{loading ? 'Flagging...' : 'Flag Delay'}</button>
      </div>
    </form>
  );
}
