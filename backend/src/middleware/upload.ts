import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';
import express from 'express';

const ALLOWED_FORMATS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'pdf',
  'xls',
  'xlsx'
];

const storage = new CloudinaryStorage({
  cloudinary: cloudinary as any,
  params: async (req, file) => {
  // Same reason as the fileFilter: trust the extension, since Office files
  // often arrive with a generic MIME type. Sending a spreadsheet to Cloudinary
  // as resource_type "image" corrupts or rejects it.
  const extension = String(file.originalname || "").split(".").pop()?.toLowerCase() || "";

  const isDocument =
    ["pdf", "xls", "xlsx"].includes(extension) ||
    [
      "application/pdf",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ].includes(file.mimetype);

  // Make filename Cloudinary-safe
  const safeFileName = file.originalname
    .replace(/\s+/g, "-")       // Replace spaces
    .replace(/&/g, "-")         // Replace &
    .replace(/[^a-zA-Z0-9._-]/g, ""); // Remove invalid characters

  return {
    folder: "constrobid/projects",
    resource_type: isDocument ? "raw" : "image",
    public_id: `${Date.now()}-${safeFileName}`,
  };
},
});

const uploader = multer({
  storage,
  limits: { files: 10, fileSize: 10 * 1024 * 1024 }, // max 10 files, 10MB each
  fileFilter: (
  req: express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  // Browsers report inconsistent MIME types for Office files: an .xlsx can
  // arrive as application/octet-stream, application/x-msexcel or similar
  // depending on the OS, so the file extension is the reliable signal.
  const extension = String(file.originalname || '').split('.').pop()?.toLowerCase() || '';

  if (allowedMimeTypes.includes(file.mimetype) || ALLOWED_FORMATS.includes(extension)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Only JPG, JPEG, PNG, WEBP, PDF, XLS and XLSX files are allowed.'
      )
    );
  }
},
});

export default uploader;
