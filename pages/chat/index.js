import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";

const Avatar = dynamic(() => import("../../components/ChikoAvatar"), { ssr: false });

export default function ChatPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id || "anon";
  const convId = useMemo(() => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`), []);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [emotion, setEmotion] = useState("idle");

  // ✅ BLUE = Voice On
  const [voiceOn, setVoiceOn] = useState(true);

  const audioRef = useRef(null);
  const idleTimerRef = useRef(null);

  const setIdleSoon = (ms = 1200) => {
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setEmotion("idle"), ms);
  };

  const hardStopSpeech = () => {
    try {
      audioRef.current?.pause();
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      }
    } catch {}
    try {
      window.speechSynthesis?.cancel();
    } catch {}
  };

  const mapEmotion = (e) => {
    const lc = (e || "").toLowerCase();
    if (lc.includes("angry")) return "angry";
    if (lc.includes("wave") || lc.includes("hello")) return "wave";
    if (lc.includes("defeat") || lc.includes("sad")) return "defeated";
    if (lc.includes("talk") || lc.includes("speak") || lc.includes("say")) return "talk";
    return "idle";
    };

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = "auto";
    audioRef.current.crossOrigin = "anonymous";
    const toIdle = () => setEmotion("idle");
    audioRef.current.addEventListener("ended", toIdle);
    audioRef.current.addEventListener("error", toIdle);

    // nuke any old LS keys from previous builds (safety)
    try { localStorage.removeItem("chat_history_v1"); } catch {}

    return () => {
      audioRef.current?.removeEventListener("ended", toIdle);
      audioRef.current?.removeEventListener("error", toIdle);
      hardStopSpeech();
      clearTimeout(idleTimerRef.current);
    };
  }, []);

  useEffect(() => { if (!voiceOn) hardStopSpeech(); }, [voiceOn]);

  const playAudio = (data) => {
    if (!audioRef.current || !voiceOn) return;
    let src = null;

    if (data.audio_url) {
      const u = data.audio_url.startsWith("http") ? data.audio_url : `http://127.0.0.1:5001${data.audio_url}`;
      src = `/api/proxy-audio?url=${encodeURIComponent(u)}`; // keep your existing audio proxy route name if different
    } else if (data.audioBase64 || data.audio_base64 || data.audio) {
      const b64 = data.audioBase64 || data.audio_base64 || data.audio;
      const mime = (data.audio_mime || "audio/mpeg").toLowerCase();
      src = `data:${mime};base64,${b64}`;
    }

    if (!src) return setIdleSoon(1000);

    try {
      audioRef.current.src = src;
      audioRef.current.currentTime = 0;
      setEmotion("talk");
      audioRef.current.play().catch(() => setIdleSoon(600));
    } catch {
      setIdleSoon(600);
    }
  };

  const send = async (preset) => {
    const content = (preset ?? text).trim();
    if (!content || sending) return;

    setSending(true);
    setMessages((m) => [...m, { role: "user", content }]);
    setText("");
    setEmotion("talk");

    try {
      const res = await fetch("/api/proxy-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 🚫 No history array — stateless
        body: JSON.stringify({ text: content, userId, convId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error("backend failed");

      const reply = data.text || data.reply || data.message || "...";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      const nextEmotion = mapEmotion(data.emotion || reply);
      setEmotion(nextEmotion);
      playAudio(data);

      if (!data.audio_url && !data.audioBase64 && !data.audio_base64 && !data.audio) {
        setIdleSoon(Math.min(4000, 600 + reply.length * 20));
      }
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "system", content: "Sorry, backend failed." }]);
      setIdleSoon(800);
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
    setMessages([]);
    hardStopSpeech();
    setEmotion("idle");
    // tell backend to forget this conversation (and any global cache)
    try {
      await fetch("/api/proxy-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true, userId, convId }),
      });
    } catch {}
  };

  return (
    <div className="container-fluid py-4">
      <div className="row g-4 align-items-stretch">
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

        <div className="col-12 col-lg-6">
          <div className="card chat-card h-100 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center px-3 pt-3">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="voiceSwitch"
                  checked={voiceOn}
                  onChange={() => setVoiceOn((v) => !v)}
                />
                <label className="form-check-label" htmlFor="voiceSwitch">
                  {voiceOn ? "Voice: On" : "Muted"}
                </label>
              </div>
              <button className="btn btn-outline-danger btn-sm" onClick={clearChat}>
                Clear chat
              </button>
            </div>

            <div className="chat-body">
              {messages.map((m, i) => (
                <div key={i} className={`bubble ${m.role}`}>
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
                  disabled={sending}
                />
                <button className="btn btn-primary" disabled={sending} onClick={() => send()}>
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>

              <div className="pt-2 d-flex gap-2 flex-wrap">
                {["hi", "wave", "angry", "tell me a joke"].map((p) => (
                  <button key={p} className="btn btn-outline-secondary btn-sm" onClick={() => send(p)} disabled={sending}>
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
