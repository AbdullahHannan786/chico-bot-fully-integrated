import dbConnect from '../../lib/mongodb';
import User from '../../models/User';


export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const user = await User.create(req.body);
      return res.status(201).json({ success: true, message: "Form submitted", user });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'GET') {
    const users = await User.find();
    return res.status(200).json({ success: true, users });
  }

  res.status(405).json({ message: 'Method not allowed' });
}
