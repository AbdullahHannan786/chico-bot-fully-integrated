import dbConnect from '../../../lib/mongodb';
import Form from '../../../models/Form';
import { getAuth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/nextjs/server';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // Check if user is admin
    const user = await clerkClient.users.getUser(userId);
    if (user.publicMetadata?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { formId } = req.body;
    if (!formId) {
      return res.status(400).json({ success: false, message: 'Form ID is required' });
    }

    // Delete the form (admin can delete any form)
    const deleted = await Form.findByIdAndDelete(formId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    return res.status(200).json({ 
      success: true, 
      message: `Form deleted successfully`,
      deletedForm: {
        id: deleted._id,
        name: deleted.name
      }
    });
  } catch (error) {
    console.error('Admin delete form error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
}
