import { v2 as cloudinary } from 'cloudinary';

// Verify environment variables
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error(
    'Missing Cloudinary environment variables. Check your .env file.'
  );
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Test connection on startup
(async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary Connected:', result);
  } catch (error) {
    console.error('❌ Cloudinary Connection Failed:', error);
  }
})();

export default cloudinary;