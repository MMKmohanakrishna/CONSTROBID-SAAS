import express from 'express';
import uploader from '../middleware/upload';
import { uploadImages } from '../controllers/upload.controller';

const router = express.Router();

// POST /api/uploads - accepts multipart form-data with `images` field (multiple)
router.post('/', uploader.array('images', 10), uploadImages);

export default router;
