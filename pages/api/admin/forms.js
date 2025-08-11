// List all forms (admin only)
import dbConnect from '../../../lib/mongodb';
import Form from '../../../models/Form';
import { getAuth, clerkClient } from '@clerk/nextjs/server';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const auth = getAuth(req);
  if (!auth?.userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const user = await clerkClient.users.getUser(auth.userId);
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    const allow = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    if (!email || !allow.includes(email)) {
      return res.status(403).json({ success: false, message: 'Admins only' });
    }

    const forms = await Form.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, forms });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
