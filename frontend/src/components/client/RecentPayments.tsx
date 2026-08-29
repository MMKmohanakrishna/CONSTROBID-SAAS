import React from 'react';

export default function RecentPayments({ payments = [] }: { payments?: any[] }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-primary">Recent Payments</h4>
        <button className="text-xs text-primary font-semibold">View All</button>
      </div>
      <div className="mt-3 space-y-3 text-sm text-gray-700">
        {payments.length === 0 ? (
          <div className="text-gray-400">No payments</div>
        ) : (
          payments.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between py-2">
              <div>
                <div className="font-bold text-primary">{p.invoice}</div>
                <div className="text-[11px] text-gray-400">{p.project}</div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-green-600">₹{Number(p.amount).toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-gray-400">{p.date}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
