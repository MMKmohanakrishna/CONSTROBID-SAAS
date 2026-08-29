"use client";

import React from "react";
import { CheckCircle2, Circle, Lock } from "lucide-react";

interface ClientSelectionCardProps {
  project: any;
  selectedDesignId: string;
  setSelectedDesignId: React.Dispatch<React.SetStateAction<string>>;
  selectedBoqId: string;
  setSelectedBoqId: React.Dispatch<React.SetStateAction<string>>;
  onConfirm: () => void;
  saving: boolean;
  canConfirm: boolean;
  boqLocked: boolean;
  onUnlockBoq: () => void;
  unlocking: boolean;
}

function FileColumn({
  label,
  files,
  selectedId,
  onSelect,
  emptyText,
  locked = false,
}: {
  label: string;
  files: any[];
  selectedId: string;
  onSelect: (id: string) => void;
  emptyText: string;
  locked?: boolean;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{label} Files</h3>

      {files.length === 0 ? (
        <div className="text-gray-500 text-sm">{emptyText}</div>
      ) : (
        <div className="space-y-3">
          {files.map((file: any, index: number) => {
            const isSelected = selectedId === file._id;
            return (
              <div
                key={file._id}
                className={`flex items-center justify-between rounded-xl p-4 border transition ${
                  isSelected ? "border-green-600 bg-green-50" : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  <div className="font-semibold">
                    {label} V{files.length - index}
                  </div>
                  {locked ? (
                    <span className="inline-flex items-center gap-1 text-sm text-slate-400">
                      <Lock className="h-3.5 w-3.5" />
                      Locked
                    </span>
                  ) : (
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm hover:underline"
                    >
                      View
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onSelect(file._id)}
                  className="p-2 rounded-full"
                  aria-label={isSelected ? "Selected" : `Select ${label}`}
                  title={isSelected ? "Selected" : `Select ${label}`}
                >
                  {isSelected ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 transition-colors duration-200 cursor-pointer" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400 hover:text-[#6B0F2D] transition-colors duration-200 cursor-pointer" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ClientSelectionCard({
  project,
  selectedDesignId,
  setSelectedDesignId,
  selectedBoqId,
  setSelectedBoqId,
  onConfirm,
  saving,
  canConfirm,
  boqLocked,
  onUnlockBoq,
  unlocking,
}: ClientSelectionCardProps) {
  const designFiles = project?.designFiles || [];
  const boqFiles = project?.boqFiles || [];

  const selectedDesignIndex = designFiles.findIndex((design: any) => design._id === selectedDesignId);
  const selectedDesignVersion =
    selectedDesignIndex >= 0 ? designFiles.length - selectedDesignIndex : undefined;

  const selectedBoqIndex = boqFiles.findIndex((boq: any) => boq._id === selectedBoqId);
  const selectedBoqVersion =
    selectedBoqIndex >= 0 ? boqFiles.length - selectedBoqIndex : undefined;

  // Files are listed newest first, so version N sits at index (length - N).
  function fileAtVersion(files: any[], version: number) {
    return files[files.length - version];
  }

  // Selecting a version on one side auto-selects the same version on the other.
  function selectDesign(designId: string) {
    setSelectedDesignId(designId);

    const index = designFiles.findIndex((design: any) => design._id === designId);
    if (index < 0) return;

    const match = fileAtVersion(boqFiles, designFiles.length - index);
    if (match) setSelectedBoqId(match._id);
  }

  function selectBoq(boqId: string) {
    setSelectedBoqId(boqId);

    const index = boqFiles.findIndex((boq: any) => boq._id === boqId);
    if (index < 0) return;

    const match = fileAtVersion(designFiles, boqFiles.length - index);
    if (match) setSelectedDesignId(match._id);
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-6">Design &amp; BOQ Review</h2>

      <div className="grid gap-8 md:grid-cols-2">
        <FileColumn
          label="Design"
          files={designFiles}
          selectedId={selectedDesignId}
          onSelect={selectDesign}
          emptyText="No Design uploaded yet."
        />

        <div>
          <FileColumn
            label="BOQ"
            files={boqFiles}
            selectedId={selectedBoqId}
            onSelect={selectBoq}
            emptyText="No BOQ uploaded yet."
            locked={boqLocked}
          />

          {boqLocked && boqFiles.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <Lock className="h-4 w-4" />
                BOQ locked
              </p>

              <p className="mt-1 text-sm text-amber-800">
                Unlock the Bill of Quantity for this project with a one-time payment of
                &#8377;29. This covers every future BOQ revision — you will not be
                charged again if you request changes.
              </p>

              <button
                type="button"
                onClick={onUnlockBoq}
                disabled={unlocking}
                className="mt-3 rounded-xl bg-[#6B0F2D] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {unlocking ? "Opening payment..." : "Unlock BOQ for ₹29"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 border-t pt-4 grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-sm text-gray-500">Selected Design:</div>
          <div className="font-semibold">
            {selectedDesignVersion ? `Design V${selectedDesignVersion}` : "Not Selected"}
          </div>
        </div>

        <div className="md:text-right">
          <div className="text-sm text-gray-500">Selected BOQ:</div>
          <div className="font-semibold">
            {selectedBoqVersion ? `BOQ V${selectedBoqVersion}` : "Not Selected"}
          </div>
        </div>
      </div>

      <div className="border-t pt-6 mt-6">
        <button
          onClick={onConfirm}
          disabled={!canConfirm || saving}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl transition disabled:opacity-60"
        >
          {saving ? "Saving..." : "Confirm Selected Design & BOQ"}
        </button>
        {!canConfirm && selectedDesignId ? (
          <p className="mt-3 text-xs text-orange-600">
            Please select a Design from the official project uploads before confirming.
          </p>
        ) : null}
      </div>
    </div>
  );
}
