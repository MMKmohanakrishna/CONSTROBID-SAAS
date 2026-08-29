"use client";

import { ChangeEvent, FormEvent } from "react";
import { Search, CalendarDays, Filter, FileText } from "lucide-react";

export type AttendanceStatusFilter = '' | 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';

export interface AttendanceFiltersState {
  from: string;
  status: AttendanceStatusFilter;
}

interface AttendanceFiltersProps {
  filters: AttendanceFiltersState;
  onChange: (nextFilters: AttendanceFiltersState) => void;
  onApply: () => void;
  onReset: () => void;
  onExportCsv: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  loading: boolean;
}

export default function AttendanceFilters({ filters, onChange, onApply, onReset, onExportCsv, onExportExcel, onExportPdf, loading }: AttendanceFiltersProps) {
  const handleInput = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    onChange({ ...filters, [name]: value });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Filters</p>
          <p className="text-sm text-slate-500">Search attendance by date, marked by, or status.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <button type="button" onClick={onExportCsv} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700">
            <FileText size={16} /> CSV
          </button>
          <button type="button" onClick={onExportExcel} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
            <FileText size={16} /> Excel
          </button>
          <button type="button" onClick={onExportPdf} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            <FileText size={16} /> PDF
          </button>
        </div>
      </div>

      <form onSubmit={(event: FormEvent) => { event.preventDefault(); onApply(); }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        

        
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">From</span>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
            <CalendarDays size={18} className="text-slate-400" />
            <input
              name="from"
              type="date"
              value={filters.from}
              onChange={handleInput}
              className="w-full bg-transparent text-sm text-slate-900 outline-none"
            />
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Status</span>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
            <Filter size={18} className="text-slate-400" />
            <select
              name="status"
              value={filters.status}
              onChange={handleInput}
              className="w-full bg-transparent text-sm text-slate-900 outline-none"
            >
              <option value="">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="LEAVE">Leave</option>
            </select>
          </div>
        </label>

        <div className="flex items-end gap-3">
          <button type="submit" className="inline-flex min-w-[120px] items-center justify-center rounded-2xl bg-[#70153A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5d1031]">{loading ? 'Applying...' : 'Apply'}</button>
          <button type="button" onClick={onReset} className="inline-flex min-w-[120px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Reset</button>
        </div>
      </form>
    </div>
  );
}
