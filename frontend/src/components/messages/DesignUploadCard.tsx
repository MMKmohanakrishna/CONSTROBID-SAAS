"use client";

import React, { useRef, useState } from "react";

type FileCategory = "DESIGN" | "BOQ";

function UploadField({
  projectId,
  category,
  title,
  description,
}: {
  projectId?: string;
  category: FileCategory;
  title: string;
  description: string;
}) {
  const ref = useRef<HTMLInputElement | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  async function onSelect(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    try {
      console.log("================================");
      console.log(`${category} Upload Started`);
      console.log("================================");

      const selectedFiles = Array.from(
        e.target.files || []
      ) as File[];

      console.log("Selected Files:", selectedFiles);

      if (selectedFiles.length === 0) {
        console.log("No files selected.");
        return;
      }

      setFiles(selectedFiles);

      const form = new FormData();

      selectedFiles.forEach((file) => {
        form.append("images", file);
      });

      form.append("fileCategory", category);
      form.append("projectId", projectId || "");

      console.log("Project ID:", projectId);

      setUploading(true);

      const token = localStorage.getItem("token");

      console.log("Sending request...");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messages/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        }
      );

      console.log("HTTP Status:", res.status);

      const data = await res.json();

      console.log("Server Response:");
      console.log(data);

      if (!res.ok) {
        alert("Upload Failed");
        return;
      }

      alert(`${title} Uploaded Successfully`);
    } catch (err) {
      console.error("Upload Error:", err);
      alert("Upload Error");
    } finally {
      setUploading(false);

      if (ref.current) {
        ref.current.value = "";
      }
    }
  }

  const inputId = `${category.toLowerCase()}-upload`;

  return (
    <div>
      <h5 className="text-sm font-semibold">{title}</h5>

      <p className="text-xs text-slate-500 mb-3">
        {description}
      </p>

      <label htmlFor={inputId} className="sr-only">
        {title} Files
      </label>

      <input
        ref={ref}
        id={inputId}
        type="file"
        multiple
        accept=".pdf,image/*"
        onChange={onSelect}
        className="
          w-full
          border
          rounded-lg
          p-2
          text-sm
          text-gray-700
          file:mr-4
          file:px-4
          file:py-2
          file:border-0
          file:rounded-lg
          file:bg-[#6B0F2D]
          file:text-white
          file:cursor-pointer
        "
      />

      {files.length > 0 && (
        <div className="mt-3">
          <p className="text-green-600 text-sm">
            {files.length} file(s) selected
          </p>

          {files.map((file, index) => (
            <p
              key={index}
              className="text-xs text-gray-500"
            >
              {file.name}
            </p>
          ))}
        </div>
      )}

      {uploading && (
        <p className="mt-3 text-blue-600 text-sm">
          Uploading...
        </p>
      )}
    </div>
  );
}

export default function DesignUploadCard({
  projectId,
}: {
  projectId?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white shadow-sm grid gap-6 md:grid-cols-2">
      <UploadField
        projectId={projectId}
        category="DESIGN"
        title="Upload Design"
        description="Upload design PDFs or images for client review."
      />

      <UploadField
        projectId={projectId}
        category="BOQ"
        title="Upload BOQ"
        description="Upload the Bill of Quantity (BOQ) PDFs or images for client review."
      />
    </div>
  );
}
