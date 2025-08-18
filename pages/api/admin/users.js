import { getAuth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/nextjs/server';
import dbConnect from '../../../lib/mongodb';
import Form from '../../../models/Form';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
  await dbConnect();

  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // Get current user to check if admin
  try {
    const currentUser = await clerkClient.users.getUser(userId);
    const isAdmin = currentUser.publicMetadata?.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to verify admin status" });
  }

  if (req.method === "GET") {
    try {
      // Get all forms (this shows users who have created profiles)
      const forms = await Form.find({}).sort({ createdAt: -1 });
      
      // Get Clerk user data for each form
      const usersWithProfiles = await Promise.all(
        forms.map(async (form) => {
          try {
            const clerkUser = await clerkClient.users.getUser(form.userId);
            return {
              clerkId: form.userId,
              email: clerkUser.emailAddresses?.[0]?.emailAddress,
              fullName: clerkUser.fullName,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              role: clerkUser.publicMetadata?.role || 'user',
              profileData: {
                name: form.name,
                phone: form.phone,
                city: form.city,
                degree: form.degree,
                age: form.age,
                avatarUrl: form.avatarUrl,
                createdAt: form.createdAt,
                updatedAt: form.updatedAt
              }
            };
          } catch (error) {
            console.error(`Error fetching Clerk user ${form.userId}:`, error);
            return {
              clerkId: form.userId,
              email: 'Unknown',
              fullName: 'Unknown User',
              role: 'user',
              error: 'Failed to fetch from Clerk',
              profileData: {
                name: form.name,
                phone: form.phone,
                city: form.city,
                degree: form.degree,
                age: form.age,
                avatarUrl: form.avatarUrl,
                createdAt: form.createdAt,
                updatedAt: form.updatedAt
              }
            };
          }
        })
      );

      return res.status(200).json({ 
        success: true, 
        users: usersWithProfiles,
        totalUsers: usersWithProfiles.length 
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
  }

  if (req.method === "POST") {
    const { clerkId, role } = req.body;
    
    if (!clerkId || !role) {
      return res.status(400).json({ success: false, message: "Missing clerkId or role" });
    }

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: "Role must be 'user' or 'admin'" });
    }

    try {
      // Update user role in Clerk
      await clerkClient.users.updateUserMetadata(clerkId, {
        publicMetadata: { role }
      });

      return res.status(200).json({ 
        success: true, 
        message: `User role updated to ${role}` 
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      return res.status(500).json({ success: false, message: "Failed to update user role" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
