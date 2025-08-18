import { getAuth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/nextjs/server';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { makeAdmin } = req.body;
  
  if (!makeAdmin) {
    return res.status(400).json({ message: 'Missing makeAdmin confirmation' });
  }

  try {
    // Make the current user an admin
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: { role: 'admin' }
    });

    return res.status(200).json({ 
      success: true, 
      message: 'You have been granted admin access! Please refresh the page.' 
    });
  } catch (error) {
    console.error('Error making user admin:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to grant admin access: ' + error.message 
    });
  }
}
