import dbConnect from '../../../lib/mongodb';
import Form from '../../../models/Form';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });

    const forms = await Form.find({ userId });
    return res.status(200).json({ success: true, forms });
  }

  if (req.method === "POST") {
    const { userId, name, age, city, degree, phone, avatarUrl } = req.body;
    if (!userId || !name || !age || !city || !degree || !phone) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const newForm = new Form({ userId, name, age, city, degree, phone, avatarUrl });
    await newForm.save();
    return res.status(201).json({ success: true, form: newForm });
  }

  if (req.method === "PUT") {
  const { userId, name, age, city, degree, phone, avatarUrl } = req.body;
  if (!userId || !name || !age || !city || !degree || !phone) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const updated = await Form.findOneAndUpdate(
    { userId },
    { name, age, city, degree, phone, avatarUrl }, // Include avatarUrl if needed
    { new: true }
  );

  if (!updated) return res.status(404).json({ success: false, message: "Form not found" });

  return res.status(200).json({ success: true, form: updated });
}

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
