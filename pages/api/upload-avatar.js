import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const uploadDir = path.join(process.cwd(), "/public/uploads/avatars");
  fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    multiples: false,
    filter: ({ mimetype }) =>
      (mimetype || "").startsWith("image/"), // images only
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ message: "File upload failed" });
    }

    const candidate = files.avatar ?? files.file;
    if (!candidate) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const file = Array.isArray(candidate) ? candidate[0] : candidate;
    const absolute = file.filepath || file.filePath || file.path;
    if (!absolute) {
      return res.status(500).json({ message: "Could not determine file path" });
    }

    const publicUrl = `/uploads/avatars/${path.basename(absolute)}`;
    return res.status(200).json({ url: publicUrl });
  });
}
