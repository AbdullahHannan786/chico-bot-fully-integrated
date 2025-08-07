import { getSession } from 'next-auth/react';
import connectDB from '@/lib/mongodb';
import Form from '@/models/Form';

export default async function handler(req, res) {
  await connectDB();

  const {
    query: { id },
    method,
  } = req;

  if (method === 'GET') {
    try {
      const form = await Form.findOne({ email: id });
      if (!form) return res.status(404).json({ message: 'Form not found' });
      return res.status(200).json(form);
    } catch (err) {
      return res.status(500).json({ message: 'Server error', error: err });
    }
  }

  if (method === 'PUT') {
    try {
      const session = await getSession({ req });
      if (!session || session.user.email !== id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const updated = await Form.findOneAndUpdate({ email: id }, req.body, {
        new: true,
        runValidators: true,
      });

      if (!updated) return res.status(404).json({ message: 'Form not found' });
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(500).json({ message: 'Update failed', error: err });
    }
  }

  // Fallback
  return res.status(405).json({ message: `Method ${method} Not Allowed` });
}
