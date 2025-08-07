import mongoose from 'mongoose';

const FormSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    city: { type: String, required: true },
    degree: { type: String, required: true },
    phone: { type: String, required: true },
    avatarUrl: { type: String },
    avatarPublicId: String,  // ✅ Add this line
  },
  { timestamps: true }
);

export default mongoose.models.Form || mongoose.model('Form', FormSchema);
