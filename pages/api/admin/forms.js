import dbConnect from '../../../lib/mongodb';
import Form from '../../../models/Form';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  await dbConnect();

  // Allow only GET requests
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' });
  }

  // Verify admin session
  const session = await getSession({ req });
  if (!session || session.user.role !== 'admin') {
    return res
      .status(403)
      .json({ success: false, message: 'Access denied. Admin only.' });
  }

  try {
    // Fetch all forms and include user information (email + name)
    const forms = await Form.find({}).populate('userId', 'name email');

    return res.status(200).json({
      success: true,
      message: 'Forms fetched successfully',
      forms,
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching forms',
    });
  }
}
