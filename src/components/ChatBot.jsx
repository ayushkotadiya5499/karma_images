import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = "http://localhost:8000";

// ─────────────────────────────────────────────────────────────────
// Helpers: parse structured sections from AI reply
// ─────────────────────────────────────────────────────────────────
function extractSection(text, startEmoji, endEmoji) {
  const startMarker = startEmoji;
  const startIdx = text.indexOf(startMarker);
  if (startIdx === -1) return null;
  const contentStart = startIdx + startMarker.length;
  const endIdx = endEmoji ? text.indexOf(endEmoji, contentStart) : -1;
  const raw = endIdx === -1 ? text.slice(contentStart) : text.slice(contentStart, endIdx);
  return raw.trim() || null;
}

// ─────────────────────────────────────────────────────────────────
// Sub-components: Chat message bubbles
// ─────────────────────────────────────────────────────────────────
function UserBubble({ text }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex justify-end mb-3"
    >
      <div className="max-w-[80%] bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-lg">
        {text}
      </div>
    </motion.div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-xs px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors ml-2 shrink-0"
    >
      {copied ? "✅ Copied!" : "📋 Copy"}
    </button>
  );
}

function StructuredCard({ reply }) {
  const category = extractSection(reply, "📁 IMAGE CATEGORY", "🎨");
  const prompt = extractSection(reply, "🎨 RECOMMENDED PROMPT", "🎣");
  const hook = extractSection(reply, "🎣 FACEBOOK HOOK", "🗣️");
  const voice = extractSection(reply, "🗣️ SARVAM AI VOICE", "📱");
  const bestFor = extractSection(reply, "📱 BEST FOR", "🚀");
  const strategy = extractSection(reply, "🚀 FACEBOOK STRATEGY", "📊");
  const viral = extractSection(reply, "📊 VIRAL POTENTIAL:", null);

  // If the response has the structured format, show cards
  const isStructured = category || prompt || hook;

  if (!isStructured) {
    // Plain text response
    return (
      <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
        {reply}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {category && (
        <div className="bg-gradient-to-r from-violet-900/60 to-indigo-900/60 border border-violet-500/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📁</span>
            <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">Image Category</span>
          </div>
          <p className="text-sm text-white font-medium">{category}</p>
        </div>
      )}

      {prompt && (
        <div className="bg-gradient-to-r from-emerald-900/60 to-teal-900/60 border border-emerald-500/30 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎨</span>
              <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">AI Prompt</span>
            </div>
            <CopyButton text={prompt} />
          </div>
          <p className="text-sm text-emerald-100 font-mono leading-relaxed bg-black/20 rounded-lg p-2">
            {prompt}
          </p>
        </div>
      )}

      {hook && (
        <div className="bg-gradient-to-r from-orange-900/60 to-amber-900/60 border border-orange-500/30 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎣</span>
              <span className="text-xs font-semibold text-orange-300 uppercase tracking-wider">Facebook Hook</span>
            </div>
            <CopyButton text={hook} />
          </div>
          <p className="text-sm text-orange-100 italic">"{hook}"</p>
        </div>
      )}

      {voice && (
        <div className="bg-gradient-to-r from-pink-900/60 to-rose-900/60 border border-pink-500/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🗣️</span>
            <span className="text-xs font-semibold text-pink-300 uppercase tracking-wider">Sarvam AI Voice</span>
          </div>
          <p className="text-sm text-pink-100 whitespace-pre-line">{voice}</p>
        </div>
      )}

      {bestFor && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📱</span>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Best For</span>
          </div>
          <p className="text-sm text-slate-200 whitespace-pre-line">{bestFor}</p>
        </div>
      )}

      {strategy && (
        <div className="bg-gradient-to-r from-blue-900/60 to-cyan-900/60 border border-blue-500/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🚀</span>
            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Facebook Strategy</span>
          </div>
          <p className="text-sm text-blue-100 whitespace-pre-line">{strategy}</p>
        </div>
      )}

      {viral && (
        <div className="bg-gradient-to-r from-yellow-900/40 to-amber-900/40 border border-yellow-500/20 rounded-xl p-2">
          <p className="text-sm text-yellow-200">📊 <strong>Viral Potential:</strong> {viral}</p>
        </div>
      )}
    </div>
  );
}

function AiBubble({ text, isLoading }) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-start gap-2 mb-3"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs">🤖</span>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="flex gap-1 items-center h-5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 bg-violet-400 rounded-full"
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-2 mb-3"
    >
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-violet-500/30">
        <span className="text-xs">🤖</span>
      </div>
      <div className="max-w-[90%] bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg">
        <StructuredCard reply={text} />
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Suggestion pills
// ─────────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "I want a 3D bus image",
  "Create a realistic old man",
  "Make an anime student",
  "Dark moody sad story",
  "Spiritual temple image",
  "Motivational sunrise reel",
];

// ─────────────────────────────────────────────────────────────────
// Main ChatBot Component
// ─────────────────────────────────────────────────────────────────
export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;
    const userText = text.trim();
    setInput("");
    setError(null);

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, session_id: sessionId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      if (!sessionId) setSessionId(data.session_id);

      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `❌ Error: ${err.message}\n\nMake sure the backend is running:\n\`cd backend && python main.py\``,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = async () => {
    if (sessionId) {
      await fetch(`${BACKEND_URL}/chat/${sessionId}`, { method: "DELETE" }).catch(() => {});
    }
    setMessages([]);
    setSessionId(null);
    setError(null);
  };

  return (
    <>
      {/* ── Floating Action Button ── */}
      <motion.button
        id="chatbot-fab"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/40 flex items-center justify-center text-2xl"
        title="AI Image Advisor"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={isOpen ? "close" : "open"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {isOpen ? "✕" : "🤖"}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* ── Chat Drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chatbot-drawer"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-24px)] h-[600px] max-h-[calc(100vh-120px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10"
            style={{
              background: "linear-gradient(135deg, rgba(15,18,35,0.98) 0%, rgba(20,16,45,0.98) 100%)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-violet-900/50 to-indigo-900/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-sm">🤖</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Karma AI Advisor</p>
                  <p className="text-[10px] text-violet-300">Image · Prompt · Voice · Facebook</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
                    title="Clear chat"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth" style={{ scrollbarWidth: "thin" }}>
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-6"
                >
                  <div className="text-4xl mb-3">✨</div>
                  <p className="text-sm font-semibold text-white mb-1">Your AI Creative Advisor</p>
                  <p className="text-xs text-slate-400 mb-5 max-w-[280px] mx-auto">
                    Tell me what kind of image you want to create — I'll give you the perfect prompt, hook, and Sarvam voice!
                  </p>

                  {/* Suggestion Pills */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-xs bg-white/5 hover:bg-violet-500/20 border border-white/10 hover:border-violet-400/40 text-slate-300 hover:text-white rounded-full px-3 py-1.5 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((msg, i) =>
                msg.role === "user" ? (
                  <UserBubble key={i} text={msg.text} />
                ) : (
                  <AiBubble key={i} text={msg.text} />
                )
              )}

              {isLoading && <AiBubble isLoading={true} />}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 border-t border-white/10 shrink-0 bg-black/20">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  id="chatbot-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Describe what you want to create..."
                  disabled={isLoading}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all min-h-[42px] max-h-[120px] disabled:opacity-50"
                  style={{ scrollbarWidth: "none" }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                />
                <motion.button
                  id="chatbot-send"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-violet-500/30 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                </motion.button>
              </div>
              <p className="text-[10px] text-slate-600 text-center mt-1.5">Enter to send · Powered by Groq llama-3.3-70b</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
