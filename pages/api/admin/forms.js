// GET /api/admin/forms?page=1&limit=10&q=lahore
import dbConnect from '../../../lib/mongodb';
import Form from '../../../models/Form';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  // admin check (role or allow-list)
  const isAdminRole = session.user.role === 'admin';
  const allowList = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  const isAllowListed = allowList.length
    ? allowList.includes((session.user.email || '').toLowerCase())
    : false;

  if (!isAdminRole && !isAllowListed) {
    return res.status(403).json({ success: false, message: 'Admins only' });
  }

  try {
    // pagination & search
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '10', 10), 1);
    const skip = (page - 1) * limit;
    const q = (req.query.q || '').trim().toLowerCase();

    const filter = q
      ? {
          $or: [
            { name:   { $regex: q, $options: 'i' } },
            { city:   { $regex: q, $options: 'i' } },
            { degree: { $regex: q, $options: 'i' } },
            { phone:  { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      Form.countDocuments(filter),
      // newest first
      Form.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    const pages = Math.max(Math.ceil(total / limit), 1);

    return res.status(200).json({
      success: true,
      forms: items,
      page,
      pages,
      total,
      limit,
    });
  } catch (err) {
    console.error('Admin forms pagination error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
