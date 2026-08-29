"use client";

import { motion } from "framer-motion";

interface AttendanceTableProps {
  records: Array<{
    attendanceDate?: string;
    checkInTime?: string;
    status?: string;
    markedBy?: string;
  }>;
}

const statusStyles: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700',
  ABSENT: 'bg-rose-100 text-rose-700',
  HALF_DAY: 'bg-amber-100 text-amber-700',
  LEAVE: 'bg-sky-100 text-sky-700',
};

function formatTime(value?: string) {
  if (!value) return '--';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value?: string) {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('en-GB');
}

function formatDay(value?: string) {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('en-GB', { weekday: 'long' });
}

export default function AttendanceTable({ records }: AttendanceTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">#</th>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">Date</th>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">Day</th>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">Check In</th>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">Attendance Status</th>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">Marked By</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">No attendance records found.</td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr key={`${record.attendanceDate}-${index}`} className="border-t border-slate-200 even:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">{index + 1}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-700">{formatDate(record.attendanceDate)}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-700">{formatDay(record.attendanceDate)}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-700">{formatTime(record.checkInTime)}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[record.status || 'PRESENT'] || 'bg-slate-100 text-slate-700'}`}>
                      {record.status || 'PRESENT'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-700">{record.markedBy || 'System'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
