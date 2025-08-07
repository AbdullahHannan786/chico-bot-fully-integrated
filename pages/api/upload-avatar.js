const formidable = require('formidable');
const fs = require('fs');
const cloudinary = require('cloudinary');

import dbConnect from '@/lib/mongodb';
import Form from '@/models/Form';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  const form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ message: 'Upload failed (form parse)' });
    }

    const userId = fields.userId?.[0];
    const file = files.file?.[0];

    if (!userId || !file) {
      console.error('Missing userId or file:', { userId, file });
      return res.status(400).json({ message: 'Missing userId or file' });
    }

    try {
      const userForm = await Form.findOne({ userId });
      if (!userForm) {
        console.error('User form not found for userId:', userId);
        return res.status(404).json({ message: 'User form not found' });
      }

      const oldPublicId = userForm.avatarPublicId;

      const result = await cloudinary.v2.uploader.upload(file.filepath, {
        folder: 'avatars',
        public_id: `avatar_${Date.now()}`,
        transformation: [
          { width: 300, height: 300, gravity: 'face', crop: 'fill' },
          { radius: 'max' },
          { quality: 'auto' },
        ],
      });

      if (oldPublicId) {
        await cloudinary.v2.uploader.destroy(oldPublicId);
      }

      userForm.avatarUrl = result.secure_url;
      userForm.avatarPublicId = result.public_id;
      await userForm.save();

      return res.status(200).json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (e) {
      console.error('Cloudinary upload failed:', e);
      return res.status(500).json({ message: 'Upload failed (cloudinary)' });
    } finally {
      if (file?.filepath) fs.unlink(file.filepath, () => {});
    }
  });
}
