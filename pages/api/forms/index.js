import { getAuth } from '@clerk/nextjs/server';
import dbConnect from '../../../lib/mongodb';
import Form from '../../../models/Form';

export default async function handler(req, res) {
  await dbConnect();

  // Get authenticated user from Clerk
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const forms = await Form.find({ userId });
      return res.status(200).json({ success: true, forms });
    } catch (error) {
      console.error('Error fetching forms:', error);
      return res.status(500).json({ success: false, message: "Failed to fetch forms" });
    }
  }

  if (req.method === "POST") {
    const { name, age, city, degree, phone, avatarUrl } = req.body;
    if (!name || !age || !city || !degree || !phone) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
      const newForm = new Form({ userId, name, age, city, degree, phone, avatarUrl });
      await newForm.save();
      return res.status(201).json({ success: true, form: newForm });
    } catch (error) {
      console.error('Error creating form:', error);
      return res.status(500).json({ success: false, message: "Failed to create form" });
    }
  }

  if (req.method === "PUT") {
    const { name, age, city, degree, phone, avatarUrl } = req.body;
    if (!name || !age || !city || !degree || !phone) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
      const updated = await Form.findOneAndUpdate(
        { userId },
        { name, age, city, degree, phone, avatarUrl },
        { new: true }
      );

      if (!updated) return res.status(404).json({ success: false, message: "Form not found" });

      return res.status(200).json({ success: true, form: updated });
    } catch (error) {
      console.error('Error updating form:', error);
      return res.status(500).json({ success: false, message: "Failed to update form" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}