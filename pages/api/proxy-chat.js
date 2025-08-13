// pages/api/proxy-chat.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  const target = process.env.CHAT_BACKEND_URL || "http://127.0.0.1:5001/ask";

  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: req.body?.text ?? "" }),
    });

    const raw = await upstream.text();
    let data; try { data = JSON.parse(raw); } catch { data = { reply: raw }; }

    if (!upstream.ok) return res.status(upstream.status).json({ success: false, message: "Upstream failed", data });
    res.status(200).json(data);
  } catch (e) {
    console.error("Proxy error:", e);
    res.status(500).json({ success: false, message: "Proxy crashed" });
  }
}
