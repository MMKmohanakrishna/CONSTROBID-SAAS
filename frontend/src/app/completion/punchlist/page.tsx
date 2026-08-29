"use client";
import React, { useEffect, useState } from 'react';
import { completionApi } from '../../../lib/api';

export default function PunchListPage() {
  const [lists, setLists] = useState<any[]>([]);

  useEffect(() => { completionApi.getPunchLists().then((r) => setLists(Array.isArray(r) ? r : [])).catch(()=>setLists([])); }, []);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-[#70153a]">Punch List Management</h2>
      <div className="mt-4 space-y-3">
        {lists.length ? lists.map((pl) => (
          <div key={pl._id} className="p-3 border rounded">
            <div className="text-sm text-gray-500">Created {new Date(pl.createdAt).toLocaleString()}</div>
            <div className="mt-2">
              {pl.items && pl.items.map((it:any, idx:number)=> (
                <div key={idx} className="p-2 border rounded mb-2">
                  <div className="font-medium">{it.description}</div>
                  <div className="text-sm">Status: {it.status}</div>
                </div>
              ))}
            </div>
          </div>
        )) : <div className="text-sm text-gray-500">No punchlists found.</div>}
      </div>
    </div>
  );
}
