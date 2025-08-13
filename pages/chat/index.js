import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Avatar renders its own Canvas (from earlier step)
const Avatar = dynamic(() => import("../../components/ChikoAvatar"), { ssr: false });

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [emotion, setEmotion] = useState("idle");
  const [muted, setMuted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = "auto";
    audioRef.current.crossOrigin = "anonymous";
    return () => {
      try { audioRef.current?.pause(); } catch {}
      audioRef.current = null;
    };
  }, []);

  const playAudio = (data) => {
    if (!audioRef.current || muted) return;

    // Try common shapes: audio_url, audioBase64, audio_base64, audio
    let src = null;

    if (data.audio_url) {
      const u = data.audio_url.startsWith("http")
        ? data.audio_url
        : `http://127.0.0.1:5001${data.audio_url}`;
      src = `/api/audio-proxy?url=${encodeURIComponent(u)}`;
    } else if (data.audioBase64 || data.audio_base64 || data.audio) {
      const b64 = data.audioBase64 || data.audio_base64 || data.audio;
      // Guess mime (change to audio/wav if your server uses wav)
      const mime = (data.audio_mime || "audio/mpeg").toLowerCase();
      src = `data:${mime};base64,${b64}`;
    }

    if (src) {
      audioRef.current.src = src;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn("Audio play failed:", err);
      });
    }
  };

  const mapEmotion = (e) => {
    const lc = (e || "").toLowerCase();
    if (lc.includes("angry")) return "angry";
    if (lc.includes("wave") || lc.includes("hello")) return "wave";
    if (lc.includes("defeat") || lc.includes("sad")) return "defeated";
    if (lc.includes("talk") || lc.includes("speak") || lc.includes("say")) return "talk";
    return "idle";
  };

  const send = async (preset) => {
    const content = (preset ?? text).trim();
    if (!content) return;

    setSending(true);
    setMessages((m) => [...m, { role: "user", content }]);
    setText("");

    try {
      const res = await fetch("/api/proxy-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Flask: we decided to send { text }
        body: JSON.stringify({ text: content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("backend failed");

      const reply = data.text || data.reply || data.message || "...";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);

      // Emotion: prefer explicit field, otherwise infer from reply
      const nextEmotion = mapEmotion(data.emotion || reply);
      setEmotion(nextEmotion);

      // 🔊 Play TTS if present
      playAudio(data);
    } catch {
      setMessages((m) => [...m, { role: "system", content: "Sorry, backend failed." }]);
    } finally {
      setSending(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    try { audioRef.current?.pause(); } catch {}
  };

  return (
    <div className="container-fluid py-4">
      <div className="row g-4 align-items-stretch">
        {/* 3D panel */}
        <div className="col-12 col-lg-6">
          <div className="card chat-card h-100">
            <div className="canvas-wrap" style={{ height: "62vh", maxHeight: 620 }}>
              <Avatar emotion={emotion} />
            </div>

            <div className="p-3 d-flex gap-2 justify-content-center flex-wrap">
              {["wave", "angry", "defeated", "talk", "idle"].map((k) => (
                <button
                  key={k}
                  className={`btn btn-sm fx-btn ${emotion === k ? "btn-primary" : ""}`}
                  onClick={() => setEmotion(k)}
                >
                  {k[0].toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat panel */}
        <div className="col-12 col-lg-6">
          <div className="card chat-card h-100 d-flex flex-column">
            {/* Toolbar: mute + clear */}
            <div className="d-flex justify-content-between align-items-center px-3 pt-3">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="muteSwitch"
                  checked={muted}
                  onChange={() => setMuted((v) => !v)}
                />
                <label className="form-check-label" htmlFor="muteSwitch">
                  {muted ? "Muted" : "Voice: On"}
                </label>
              </div>
              <button className="btn btn-outline-danger btn-sm" onClick={clearChat}>
                Clear chat
              </button>
            </div>

            <div className="chat-body">
              {messages.map((m, i) => (
                <div key={i} className={`bubble ${m.role}`}>
                  {/* Make user questions stand out */}
                  {m.role === "user" ? <strong>{m.content}</strong> : m.content}
                </div>
              ))}
            </div>

            <div className="chat-input-bar p-3">
              <div className="input-group">
                <input
                  className="form-control"
                  placeholder="Type your question... (Enter to send)"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
                <button className="btn btn-primary" disabled={sending} onClick={() => send()}>
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>

              <div className="pt-2 d-flex gap-2 flex-wrap">
                {["hi", "wave", "angry", "tell me a joke"].map((p) => (
                  <button key={p} className="btn btn-outline-secondary btn-sm quick" onClick={() => send(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
