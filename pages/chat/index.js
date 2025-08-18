import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/router";
import useModelMemoryReset from "../../hooks/useModelMemoryReset";

const Avatar = dynamic(() => import("../../components/ChikoAvatar"), { ssr: false });

export default function ChatPage() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  
  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  const userId = user?.id || "anon";
  const convId = useMemo(() => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`), []);

  // Use the custom hook to handle model memory reset on page refresh
  const { manualReset } = useModelMemoryReset(convId, {
    clearOnMount: true,
    clearOnUnload: true,
    endpoint: '/api/proxy-chat'
  });

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [emotion, setEmotion] = useState("idle");
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [questionHistory, setQuestionHistory] = useState([]);

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

  // Function to check if user is asking repeated questions
  const checkRepeatedQuestion = (newQuestion) => {
    const normalizedQuestion = newQuestion.toLowerCase().trim();
    
    // Check if this question (or very similar) was asked recently
    const recentQuestions = questionHistory.slice(-5); // Check last 5 questions
    let similarCount = 0;
    
    for (const prevQuestion of recentQuestions) {
      const normalizedPrev = prevQuestion.toLowerCase().trim();
      
      // Check for exact match or very similar questions
      if (normalizedPrev === normalizedQuestion) {
        similarCount++;
      } else {
        // Check similarity by comparing words
        const currentWords = normalizedQuestion.split(' ').filter(w => w.length > 2);
        const prevWords = normalizedPrev.split(' ').filter(w => w.length > 2);
        
        if (currentWords.length > 0 && prevWords.length > 0) {
          const commonWords = currentWords.filter(word => prevWords.includes(word));
          const similarity = commonWords.length / Math.max(currentWords.length, prevWords.length);
          
          if (similarity > 0.6) { // 60% similarity threshold
            similarCount++;
          }
        }
      }
    }
    
    return similarCount >= 2; // If 2 or more similar questions in recent history
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

    // Show wave animation on first visit with delay
    if (isFirstVisit) {
      // Start with idle, then delay before wave
      setEmotion("idle");
      
      const delayTimer = setTimeout(() => {
        setEmotion("wave");
        
        // Return to idle after wave animation
        const waveTimer = setTimeout(() => {
          setEmotion("idle");
          setIsFirstVisit(false);
        }, 3000); // Wave for 3 seconds
        
        return () => clearTimeout(waveTimer);
      }, 1500); // 1.5 second delay before wave starts

      return () => {
        clearTimeout(delayTimer);
        audioRef.current?.removeEventListener("ended", toIdle);
        audioRef.current?.removeEventListener("error", toIdle);
        hardStopSpeech();
        clearTimeout(idleTimerRef.current);
      };
    }

    return () => {
      audioRef.current?.removeEventListener("ended", toIdle);
      audioRef.current?.removeEventListener("error", toIdle);
      hardStopSpeech();
      clearTimeout(idleTimerRef.current);
    };
  }, [isFirstVisit]);

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

    // Check for repeated questions
    const isRepeated = checkRepeatedQuestion(content);
    
    setSending(true);
    setMessages((m) => [...m, { role: "user", content }]);
    setText("");
    
    // Add question to history for tracking repetition
    setQuestionHistory(prev => [...prev.slice(-9), content]); // Keep last 10 questions
    
    // If repeated question, show angry emotion immediately
    if (isRepeated) {
      setEmotion("angry");
    } else {
      // Don't set talk emotion here - wait for response
      setEmotion("idle");
    }

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
      
      // Determine emotion based on repetition or response content
      let nextEmotion;
      if (isRepeated) {
        nextEmotion = "angry";
        // For repeated questions, modify the reply to show frustration
        const frustratedReplies = [
          "I've already answered this question! Please try asking something different.",
          "We just discussed this. Could you ask me something new?",
          "You keep asking the same thing. Let's talk about something else!",
          "I'm getting a bit frustrated with the repetition. What else would you like to know?"
        ];
        const frustratedReply = frustratedReplies[Math.floor(Math.random() * frustratedReplies.length)];
        setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: frustratedReply }]);
      } else {
        // Now set the talk emotion after receiving the response
        nextEmotion = mapEmotion(data.emotion || reply);
      }
      
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
    setQuestionHistory([]);
    setIsFirstVisit(true);
    hardStopSpeech();
    setEmotion("idle"); // Start with idle
    
    // Add delay before wave animation when clearing chat
    setTimeout(() => {
      setEmotion("wave"); // Show wave animation after delay
      
      // Return to idle after wave animation
      setTimeout(() => {
        setEmotion("idle");
        setIsFirstVisit(false);
      }, 3000); // Wave for 3 seconds
    }, 800); // 0.8 second delay before wave starts
    
    // Use the manual reset function from the hook
    await manualReset();
  };

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Don't render chat if not signed in (will redirect)
  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="container-fluid py-4">
      <div className="row g-4 align-items-stretch">
        <div className="col-12 col-lg-6">
          <div className="card chat-card h-100">
            <div className="canvas-wrap" style={{ height: "70vh", maxHeight: 700 }}>
              <Avatar emotion={emotion} />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card chat-card h-100 d-flex flex-column">
            <div className="chat-header d-flex justify-content-between align-items-center px-4 py-3">
              <div>
                <h5 className="mb-1 chat-title">💬 Chat with Chico</h5>
                <small className="chat-subtitle">Ask me anything! I'm here to help you.</small>
              </div>
              <div className="d-flex gap-2 align-items-center">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="voiceSwitch"
                    checked={voiceOn}
                    onChange={() => setVoiceOn((v) => !v)}
                  />
                  <label className="form-check-label voice-label" htmlFor="voiceSwitch">
                    <span className="d-none d-md-inline">{voiceOn ? "🔊 Voice: On" : "🔇 Muted"}</span>
                    <span className="d-md-none">{voiceOn ? "🔊 Voice" : "🔇 Muted"}</span>
                  </label>
                </div>
                <button className="btn btn-outline-danger btn-sm clear-btn" onClick={clearChat}>
                  <span className="d-none d-md-inline">🗑️ Clear</span>
                  <span className="d-md-none">🗑️</span>
                </button>
              </div>
            </div>

            <div className="chat-body flex-grow-1">
              {messages.length === 0 && (
                <div className="welcome-message">
                  <div className="welcome-icon">👋</div>
                  <h6 className="welcome-title">Welcome to Chico Chat!</h6>
                  <p className="welcome-text">Start a conversation by typing a message or using the quick buttons below.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`message-bubble ${m.role}`}>
                  <div className="bubble-content">
                    {m.role === "user" && <div className="message-label">You</div>}
                    {m.role === "assistant" && <div className="message-label">🤖 Chico</div>}
                    {m.role === "system" && <div className="message-label">⚠️ System</div>}
                    <div className="message-text">
                      {m.role === "user" ? <strong>{m.content}</strong> : m.content}
                    </div>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="message-bubble assistant">
                  <div className="bubble-content">
                    <div className="message-label">🤖 Chico</div>
                    <div className="message-text">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="chat-input-section">
              <div className="quick-actions">
                <div className="quick-buttons">
                  {[
                    { text: "👋 Hi there!", value: "hi", short: "👋 Hi" },
                    { text: "😊 Tell me a joke", value: "tell me a joke", short: "😊 Joke" },
                    { text: "❓ How can you help?", value: "how can you help me", short: "❓ Help" },
                    { text: "🌟 What's new?", value: "what's new", short: "🌟 New" }
                  ].map((p) => (
                    <button 
                      key={p.value} 
                      className="btn btn-outline-secondary btn-sm quick-btn" 
                      onClick={() => send(p.value)} 
                      disabled={sending}
                    >
                      <span className="d-none d-md-inline">{p.text}</span>
                      <span className="d-md-none">{p.short}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="input-bar">
                <div className="input-group">
                  <input
                    className="form-control chat-input"
                    placeholder="💭 Type your message here... (Press Enter to send)"
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
                  <button 
                    className="btn btn-primary send-btn" 
                    disabled={sending || !text.trim()} 
                    onClick={() => send()}
                  >
                    {sending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        <span className="d-none d-sm-inline">Sending...</span>
                        <span className="d-sm-none">...</span>
                      </>
                    ) : (
                      <>
                        <span className="send-icon">📤</span>
                        <span className="d-none d-sm-inline">Send</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
