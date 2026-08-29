"use client";
import React, { useState } from 'react';
import { monitoringApi } from '../../lib/api';

export default function QualityForm({ projectId, onDone }: { projectId: string; onDone?: () => void }) {
  const [score, setScore] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await monitoringApi.qualityCheck(projectId, score === '' ? undefined : Number(score), notes);
      setScore(''); setNotes(''); if (onDone) onDone();
    } catch (err) { alert('Failed to record quality check'); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="qualityScore" className="block text-sm">Quality Score (0-100)</label>
        <input id="qualityScore" type="number" min={0} max={100} value={score as any} onChange={(e) => setScore(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border rounded p-2" placeholder="e.g., 85" aria-label="Quality score" />
      </div>
      <div>
        <label htmlFor="qualityNotes" className="block text-sm">Notes / Issues</label>
        <textarea id="qualityNotes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded p-2" rows={3} placeholder="Describe quality issues or observations" aria-label="Quality notes" />
      </div>
      <div>
        <button type="submit" className="px-4 py-2 bg-[#70153a] text-white rounded" disabled={loading}>{loading ? 'Recording...' : 'Record Quality Check'}</button>
      </div>
    </form>
  );
}
