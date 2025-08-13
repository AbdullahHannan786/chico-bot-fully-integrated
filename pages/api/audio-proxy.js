// pages/api/audio-proxy.js
export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('Missing url');

    // Fetch audio from your Python server (mp3/wav/ogg)
    const r = await fetch(url);
    if (!r.ok) return res.status(r.status).send('Upstream error');

    const ct = r.headers.get('content-type') || 'audio/mpeg';
    const buf = Buffer.from(await r.arrayBuffer());

    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(buf);
  } catch (e) {
    console.error('audio-proxy error:', e);
    res.status(500).send('Audio proxy failed');
  }
}
