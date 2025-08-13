// Forwards chat to your Python server and supports reset.
// Expects env CHAT_BACKEND_URL like "http://127.0.0.1:5001/ask"
// and optional RESET endpoint "http://127.0.0.1:5001/reset"

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ success: false, message: "Method not allowed" });

  const base = process.env.CHAT_BACKEND_URL || "http://127.0.0.1:5001/ask";
  const resetUrl =
    process.env.CHAT_BACKEND_RESET_URL ||
    base.replace(/\/ask$/, "/reset"); // default: same host /reset

  try {
    const { text, userId, convId, reset } = req.body || {};

    // tell backend to clear any server-side memory for this user/conv
    if (reset) {
      try {
        const r = await fetch(resetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, convId }),
        });
        // ignore body; just return ok
      } catch (e) {
        console.warn("Reset call failed:", e);
      }
      return res.status(200).json({ success: true, reset: true });
    }

    // normal chat call — stateless, but we include userId/convId
    const upstream = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text ?? "", userId, convId }),
    });

    const raw = await upstream.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { reply: raw };
    }

    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ success: false, message: "Upstream failed", data });
    }

    return res.status(200).json(data);
  } catch (e) {
    console.error("Proxy error:", e);
    return res.status(500).json({ success: false, message: "Proxy crashed" });
  }
}
