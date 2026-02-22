'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, User } from 'lucide-react';
import { findBestResponse } from '@/lib/chatbot-knowledge';

type Message = {
  role: 'bot' | 'user';
  text: string;
};

const WELCOME_MESSAGE: Message = {
  role: 'bot',
  text: 'Bonjour ! 👋 Je suis Dribi, votre assistant AB DRIDI. Comment puis-je vous aider aujourd\'hui ?',
};

/* ─── Dribi mascot SVG (60×60 for bubble, 30×30 for header) ─── */
function DribiMascot({ size = 60 }: { size?: number }) {
  const s = size / 60; // scale factor
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <defs>
        <linearGradient id="headGrad" x1="10" y1="5" x2="50" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
        <linearGradient id="bodyGrad" x1="18" y1="34" x2="42" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      {/* Body */}
      <rect x="18" y="34" width="24" height="18" rx="8" fill="url(#bodyGrad)" />

      {/* Left arm */}
      <rect x="10" y="37" width="10" height="7" rx="3.5" fill="#3B82F6" />
      {/* Right arm */}
      <rect x="40" y="37" width="10" height="7" rx="3.5" fill="#3B82F6" />

      {/* Head circle */}
      <circle cx="30" cy="20" r="17" fill="url(#headGrad)" />

      {/* Left eye white */}
      <ellipse cx="23" cy="19" rx="5" ry="5.5" fill="#fff" />
      {/* Right eye white */}
      <ellipse cx="37" cy="19" rx="5" ry="5.5" fill="#fff" />

      {/* Left pupil */}
      <ellipse cx="24" cy="19.5" rx="2.5" ry="3" fill="#1E293B" />
      {/* Right pupil */}
      <ellipse cx="38" cy="19.5" rx="2.5" ry="3" fill="#1E293B" />

      {/* Left eye shine */}
      <circle cx="22.5" cy="18" r="1" fill="#fff" />
      {/* Right eye shine */}
      <circle cx="36.5" cy="18" r="1" fill="#fff" />

      {/* Blush left */}
      <ellipse cx="17" cy="24" rx="3.5" ry="2" fill="#FCA5A5" opacity="0.6" />
      {/* Blush right */}
      <ellipse cx="43" cy="24" rx="3.5" ry="2" fill="#FCA5A5" opacity="0.6" />

      {/* Smile */}
      <path d="M25 26 Q30 31 35 26" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || thinking) return;

    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    // Simulate thinking delay (500-1000ms)
    const delay = 500 + Math.random() * 500;
    setTimeout(() => {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.text }));
      const response = findBestResponse(text, history);
      const botReply: Message = { role: 'bot', text: response };
      setMessages(prev => [...prev, botReply]);
      setThinking(false);
    }, delay);
  }

  return (
    <>
      {/* ─── Floating bubble with Dribi mascot ─── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le chat Dribi"
          className="dribi-float-btn"
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
            width: 68, height: 68, borderRadius: '50%',
            background: 'linear-gradient(135deg, #DBEAFE, #EFF6FF)',
            border: '3px solid #93C5FD',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(37, 99, 235, 0.3)',
            padding: 0,
            transition: 'box-shadow 0.3s',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(37, 99, 235, 0.45)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(37, 99, 235, 0.3)')}
        >
          <DribiMascot size={50} />
        </button>
      )}

      {/* ─── Close bubble when open ─── */}
      {open && (
        <button
          onClick={() => setOpen(false)}
          aria-label="Fermer le chat"
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 10000,
            width: 52, height: 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, #EF4444, #F87171)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
          }}
        >
          <X size={22} color="#fff" />
        </button>
      )}

      {/* ─── Chat panel ─── */}
      {open && (
        <div className="chatbot-panel" style={{
          position: 'fixed', bottom: 84, right: 20, zIndex: 9999,
          width: 380, maxHeight: 540,
          borderRadius: 16, overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'inherit',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
            }}>
              <DribiMascot size={30} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Dribi — Assistant AB DRIDI</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
                En ligne
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 12px',
            display: 'flex', flexDirection: 'column', gap: 10,
            maxHeight: 370, minHeight: 260,
            background: '#FAFBFC',
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 7, alignItems: 'flex-end',
              }}>
                {msg.role === 'bot' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#EFF6FF', border: '1px solid #DBEAFE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden',
                  }}>
                    <DribiMascot size={22} />
                  </div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '10px 14px', borderRadius: 12,
                  fontSize: 13, lineHeight: 1.55,
                  ...(msg.role === 'user'
                    ? { background: '#2563EB', color: '#fff', borderBottomRightRadius: 4 }
                    : { background: '#fff', color: '#374151', borderBottomLeftRadius: 4, border: '1px solid #E5E7EB' }
                  ),
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {msg.text.split(/(\*\*.*?\*\*)/).map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={j}>{part.slice(2, -2)}</strong>;
                    }
                    return <span key={j}>{part}</span>;
                  })}
                </div>
                {msg.role === 'user' && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#2563EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <User size={14} color="#fff" />
                  </div>
                )}
              </div>
            ))}

            {/* Thinking indicator */}
            {thinking && (
              <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#EFF6FF', border: '1px solid #DBEAFE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, overflow: 'hidden',
                }}>
                  <DribiMascot size={22} />
                </div>
                <div style={{
                  padding: '10px 16px', borderRadius: 12, borderBottomLeftRadius: 4,
                  background: '#fff', border: '1px solid #E5E7EB',
                  fontSize: 13, color: '#9CA3AF', fontStyle: 'italic',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span className="dribi-dots">
                    <span className="dribi-dot" />
                    <span className="dribi-dot" />
                    <span className="dribi-dot" />
                  </span>
                  Dribi réfléchit...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length <= 1 && !thinking && (
            <div style={{
              padding: '6px 12px 4px', display: 'flex', flexWrap: 'wrap', gap: 6,
              background: '#FAFBFC', borderTop: '1px solid #F3F4F6',
            }}>
              {['Abonnements', 'Rendez-vous', 'Marchés publics', 'Conseils'].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  style={{
                    padding: '5px 12px', borderRadius: 20, border: '1px solid #DBEAFE',
                    background: '#EFF6FF', color: '#2563EB', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#DBEAFE')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#EFF6FF')}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend} style={{
            padding: '10px 12px', borderTop: '1px solid #E5E7EB',
            display: 'flex', gap: 8, background: '#fff',
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tapez votre message..."
              disabled={thinking}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit',
                outline: 'none', background: thinking ? '#F9FAFB' : '#fff',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              style={{
                width: 40, height: 40, borderRadius: 10,
                border: 'none',
                background: input.trim() && !thinking ? 'linear-gradient(135deg, #2563EB, #3B82F6)' : '#E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
              }}
            >
              <Send size={16} color={input.trim() && !thinking ? '#fff' : '#9CA3AF'} />
            </button>
          </form>
        </div>
      )}

      {/* ─── CSS animations ─── */}
      <style jsx>{`
        @keyframes dribiFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        .dribi-float-btn {
          animation: dribiFloat 3s ease-in-out infinite;
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
        .dribi-dots {
          display: inline-flex;
          gap: 3px;
          margin-right: 4px;
        }
        .dribi-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #9CA3AF;
          display: inline-block;
          animation: dotBounce 1.2s infinite ease-in-out;
        }
        .dribi-dot:nth-child(1) { animation-delay: 0s; }
        .dribi-dot:nth-child(2) { animation-delay: 0.15s; }
        .dribi-dot:nth-child(3) { animation-delay: 0.3s; }

        @media (max-width: 640px) {
          .chatbot-panel {
            bottom: 72px !important;
            right: 8px !important;
            left: 8px !important;
            width: auto !important;
            max-height: calc(100vh - 100px) !important;
            border-radius: 16px !important;
          }
        }
      `}</style>
    </>
  );
}
