'use client';

import React from 'react';

export default function Profile() {
  return (
    <div className="min-h-screen">
      <div className="p-6 bg-white rounded-2xl glass-card border border-white/30 max-w-md">
        <h2 className="text-xl font-bold text-[var(--primary)]">Profile</h2>
        <p className="text-sm text-gray-600 mt-2">Manage your profile information and password.</p>
      </div>
    </div>
  );
}
