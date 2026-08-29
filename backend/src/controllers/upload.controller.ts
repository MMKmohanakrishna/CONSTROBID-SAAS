import { Request, Response } from 'express';

export const uploadImages = async (req: Request, res: Response) => {
  try {
    const files = (req as any).files || [];
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Map files to expected return shape
    const result = files.map((f: any) => ({
      url: f.path || f.secure_url || f.url || null,
      publicId: f.filename || f.public_id || null,
    }));

    return res.json(result);
  } catch (err: any) {
    console.error('Upload error', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
};
