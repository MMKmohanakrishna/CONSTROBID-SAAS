"use client";

import { useEffect, useState } from "react";
import { Trash2, BookLock } from "lucide-react";
import { financeDiaryApi } from "@/lib/api";

export default function DiaryTab({
  projectId,
  canWrite,
}: {
  projectId: string;
  canWrite: boolean;
}) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (projectId) load();
  }, [projectId]);

  async function load() {
    try {
      setLoading(true);
      setNotes((await financeDiaryApi.list(projectId)) || []);
    } catch (err: any) {
      setError(err?.message || "Could not load your diary.");
    } finally {
      setLoading(false);
    }
  }

  async function addNote(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !draft.trim()) return;

    try {
      setBusy(true);
      setError("");

      await financeDiaryApi.create(projectId, { note: draft.trim() });
      setDraft("");
      await load();
    } catch (err: any) {
      setError(err?.message || "Could not save that note.");
    } finally {
      setBusy(false);
    }
  }

  async function removeNote(id: string) {
    if (!window.confirm("Delete this note?")) return;

    try {
      await financeDiaryApi.remove(id);
      await load();
    } catch (err: any) {
      setError(err?.message || "Could not delete that note.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <BookLock size={15} className="mt-0.5 shrink-0 text-slate-400" />
        <span>
          Private to you. These notes never appear in reports, and the client and the ConstroBID
          inspection team cannot see them.
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={addNote} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <textarea
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!canWrite}
          placeholder="e.g. Client asked for extra sockets in the study — quote separately"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-primary disabled:bg-slate-50"
        />

        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={!canWrite || busy || !draft.trim()}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving..." : "Add Note"}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
          Loading...
        </p>
      ) : notes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
          <BookLock className="mx-auto text-slate-300" size={36} />
          <p className="mt-3 text-sm text-slate-500">No notes yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note._id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-400">
                  {new Date(note.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{note.note}</p>
              </div>

              <button
                type="button"
                onClick={() => removeNote(note._id)}
                disabled={!canWrite}
                aria-label="Delete note"
                className="shrink-0 text-rose-500 transition hover:text-rose-700 disabled:opacity-40"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
