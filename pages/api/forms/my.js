import { getAuth } from '@clerk/nextjs/server';
import dbConnect from '../../../lib/mongodb';
import Form from '../../../models/Form';

export default async function handler(req, res) {
  await dbConnect();
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ success: false });

  try {
    const form = await Form.findOne({ userId });
    res.status(200).json({ success: true, form });
  } catch (error) {
    res.status(500).json({ success: false });
  }
}
