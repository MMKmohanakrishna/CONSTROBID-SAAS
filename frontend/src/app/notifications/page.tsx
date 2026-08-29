"use client";
import React, { useEffect, useState } from 'react';

export default function NotificationsPage() {
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/notifications', { credentials: 'include' }).then(r => r.ok ? r.json() : []).then(setNotes).catch(()=>setNotes([]));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <ul className="mt-4">
        {notes.map(n=> (
          <li key={n._id} className="py-2 border-b">
            <div className="font-semibold">{n.title || n.type}</div>
            <div className="text-sm">{n.message}</div>
            <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
