// GET /api/admin/forms?page=1&limit=10&q=lahore
import dbConnect from '../../../lib/mongodb';
import Form from '../../../models/Form';
import { getAuth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/nextjs/server';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
  
  // Check if user is admin
  const user = await clerkClient.users.getUser(userId);
  if (user.publicMetadata?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
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
