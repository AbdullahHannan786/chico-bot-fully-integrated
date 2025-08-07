import cloudinary from 'cloudinary';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const form = formidable({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) throw err;

      const file = files.avatar?.[0];
      const email = fields.email?.[0];
      const oldPublicId = fields.oldPublicId?.[0];

      if (!file || !email) return res.status(400).json({ error: 'Missing file or email' });

      // 1. Delete old avatar if publicId provided
      if (oldPublicId) {
        await cloudinary.v2.uploader.destroy(oldPublicId);
      }

      // 2. Upload new avatar
      const result = await cloudinary.v2.uploader.upload(file.filepath, {
        folder: 'avatars',
        public_id: `avatar-${Date.now()}`,
        transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
      });

      return res.status(200).json({
        url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (e) {
      console.error('Upload error:', e);
      return res.status(500).json({ error: 'Upload failed' });
    }
  });
}
