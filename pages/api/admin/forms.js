// pages/api/admin/forms.js
// List all forms (admin only)

import dbConnect from '../../../lib/mongodb';
import Form from '../../../models/Form';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]'; // <- export authOptions in that file

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Read the NextAuth session from cookies (server-side, no extra fetch)
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Admin check: role === 'admin' OR email in allow-list
  const isRoleAdmin = session.user.role === 'admin';

  const allowList = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  const isAllowListed = allowList.length
    ? allowList.includes((session.user.email || '').toLowerCase())
    : false;

  if (!isRoleAdmin && !isAllowListed) {
    return res.status(403).json({ success: false, message: 'Admins only' });
  }

  try {
    // If Form.userId is a ref, populate name/email; otherwise fallback
    let forms;
    try {
      forms = await Form.find({}).sort({ createdAt: -1 }).populate('userId', 'name email');
    } catch {
      forms = await Form.find({}).sort({ createdAt: -1 });
    }

    return res.status(200).json({ success: true, forms });
  } catch (err) {
    console.error('Error fetching forms:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
