import dbConnect from '../../../lib/mongodb';
import Form from '../../../models/Form';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  await dbConnect();

  const {
    query: { id },
    method,
  } = req;

  const session = await getServerSession(req, res, authOptions);

  // Helper: only owner (by userId) or admin can modify/delete
  const canWrite = async () => {
    if (!session?.user) return false;
    if (session.user.role === 'admin') return true;
    const doc = await Form.findById(id).select('userId');
    return doc && String(doc.userId) === String(session.user.id);
  };

  try {
    if (method === 'GET') {
      const form = await Form.findById(id);
      if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
      return res.status(200).json({ success: true, form });
    }

    if (method === 'PUT') {
      if (!(await canWrite())) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const { name, age, city, degree, phone, avatarUrl } = req.body;
      const updated = await Form.findByIdAndUpdate(
        id,
        { name, age, city, degree, phone, avatarUrl },
        { new: true, runValidators: true }
      );
      if (!updated) return res.status(404).json({ success: false, message: 'Form not found' });
      return res.status(200).json({ success: true, form: updated });
    }

    if (method === 'DELETE') {
      if (!(await canWrite())) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const deleted = await Form.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Form not found' });
      return res.status(200).json({ success: true, message: 'Form deleted' });
    }

    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  } catch (err) {
    console.error('forms/[id] error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
