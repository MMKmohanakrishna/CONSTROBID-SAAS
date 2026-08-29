"use client";
import React from 'react';

export default function CompletedMembers({ members }:{ members?: any[] }){
  if (!members || members.length === 0) return (
    <div className="p-4 text-sm text-gray-500">No completed inspections yet.</div>
  );

  return (
    <div className="p-4">
      <h4 className="text-sm font-semibold mb-3">Inspection Completed Members</h4>
      <ul className="space-y-3">
        {members.map((m: any) => (
          <li key={m._id || m.id} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
              {m.profilePhoto ? <img src={m.profilePhoto} alt={m.fullName || m.email} className="w-full h-full object-cover" /> : <div className="text-xs text-gray-500">{(m.fullName||m.email||'I').charAt(0)}</div>}
            </div>
            <div>
              <div className="text-sm font-medium">{m.fullName || m.email || 'Inspector'}</div>
              <div className="text-xs text-gray-400">{m.email || ''}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
