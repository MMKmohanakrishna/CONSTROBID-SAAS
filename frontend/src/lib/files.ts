const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "avif",
  "bmp",
  "svg",
  "heic",
];

/**
 * True when a URL points at something the browser can render as an image.
 *
 * Deliberately keyed off the file extension rather than the Cloudinary delivery
 * path: PDFs are frequently served from `/image/upload/` too, and those must
 * keep opening in a tab rather than being forced into an <img>.
 */
export function isImageUrl(url?: string | null) {
  if (!url) return false;

  try {
    // Strip query and hash before looking at the extension.
    const path = new URL(url, "http://localhost").pathname.toLowerCase();
    const extension = path.split(".").pop();
    return !!extension && IMAGE_EXTENSIONS.includes(extension);
  } catch {
    return false;
  }
}

/**
 * True for PDFs, which browsers render natively inside an <iframe>.
 *
 * Note: Cloudinary accounts have a "deliver PDF and ZIP files" setting that is
 * off by default. When it is off the URL returns 401 and the frame renders
 * empty, which is why the viewer always keeps an "Open original" escape hatch.
 */
export function isPdfUrl(url?: string | null) {
  if (!url) return false;

  try {
    const path = new URL(url, "http://localhost").pathname.toLowerCase();
    return path.endsWith(".pdf");
  } catch {
    return false;
  }
}

/** Best-effort display name for an uploaded file URL. */
export function fileNameFromUrl(url?: string | null) {
  if (!url) return "";

  try {
    const path = new URL(url, "http://localhost").pathname;
    return decodeURIComponent(path.split("/").pop() || "");
  } catch {
    return "";
  }
}
