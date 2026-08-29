"use client";
import React, { useState } from 'react';
import { completionApi } from '../../../lib/api';

export default function FinalInspectionPage() {
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  async function submit() {
    setCreating(true);
    try {
      // Create a punchlist from inspection notes
      await completionApi.createPunchList({ projectId: undefined, items: [{ description: notes }] });
      setNotes('');
      alert('Punchlist created');
    } catch (err) { alert('Failed'); }
    setCreating(false);
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-[#70153a]">Final Inspection</h2>
      <div className="mt-4">
        <label htmlFor="inspectionNotes" className="block text-sm">Notes</label>
        <textarea id="inspectionNotes" title="Inspection notes" placeholder="Enter inspection observations" value={notes} onChange={(e)=>setNotes(e.target.value)} className="w-full border rounded p-2" rows={4} />
        <div className="mt-2">
          <button onClick={submit} className="px-3 py-2 rounded bg-[#efc975]">{creating ? 'Creating...' : 'Create Punchlist'}</button>
        </div>
      </div>
    </div>
  );
}
