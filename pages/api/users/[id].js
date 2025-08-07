import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });
      return res.status(200).json({ success: true, updatedUser });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await User.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  res.status(405).json({ message: 'Method not allowed' });
}
