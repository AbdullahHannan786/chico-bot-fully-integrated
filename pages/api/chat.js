import dbConnect from '../../lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import Chat from '../../models/Chat';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });;

  await dbConnect();

  if (req.method === 'GET') {
    const { limit = 50 } = req.query;
    const doc = await Chat.findOne({ userId: session.user.id });
    return res.status(200).json({ success: true, messages: doc?.messages?.slice(-Number(limit)) || [] });
  }

  if (req.method === 'DELETE') {
    await Chat.findOneAndUpdate({ userId: session.user.id }, { $set: { messages: [] } }, { upsert: true });
    return res.status(200).json({ success: true });
  }

  if (req.method === 'POST') {
    const { message } = req.body || {};
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Missing message' });

    await Chat.findOneAndUpdate(
      { userId: session.user.id },
      { $push: { messages: { role: 'user', content: message, ts: new Date() } } },
      { upsert: true }
    );

    let replyText = 'Sorry, the bot is unavailable right now.';
    try {
      if (process.env.PYTHON_CHAT_API) {
        const r = await fetch(process.env.PYTHON_CHAT_API, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.user.id, message })
        });
        const j = await r.json();
        replyText = r.ok ? (j.reply || j.answer || replyText) : (j.message || replyText);
      } else {
        // fallback echo
        replyText = `You said: ${message}`;
      }
    } catch {/* keep fallback */}

    await Chat.findOneAndUpdate(
      { userId: session.user.id },
      { $push: { messages: { role: 'assistant', content: replyText, ts: new Date() } } }
    );

    return res.status(200).json({ success: true, reply:"pong" });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
