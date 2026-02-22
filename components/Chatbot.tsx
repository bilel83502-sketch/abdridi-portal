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
  text: 'Bonjour, je suis Dribi, votre assistant AB DRIDI. Comment puis-je vous aider ?',
};

/* ─── Headset SVG icon (clean, professional) ─── */
function HeadsetIcon({ size = 24, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z" />
      <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z" />
    </svg>
  );
}

/* ─── Small headset for bot avatar in messages ─── */
function BotAvatar() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: '#EFF6FF', border: '1px solid #DBEAFE',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <HeadsetIcon size={15} color="#2563EB" />
    </div>
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
      {/* ─── Floating bubble ─── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le chat"
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(37, 99, 235, 0.35)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            padding: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(37, 99, 235, 0.45)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(37, 99, 235, 0.35)'; }}
        >
          <HeadsetIcon size={24} color="#fff" />
        </button>
      )}

      {/* ─── Close button when open ─── */}
      {open && (
        <button
          onClick={() => setOpen(false)}
          aria-label="Fermer le chat"
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 10000,
            width: 48, height: 48, borderRadius: '50%',
            background: '#374151', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          <X size={20} color="#fff" />
        </button>
      )}

      {/* ─── Chat panel ─── */}
      {open && (
        <div className="chatbot-panel" style={{
          position: 'fixed', bottom: 80, right: 20, zIndex: 9999,
          width: 380, maxHeight: 540,
          borderRadius: 12, overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'inherit',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #1E40AF, #2563EB)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <HeadsetIcon size={18} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Dribi — Assistant AB DRIDI</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', gap: 4 }}>
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
                {msg.role === 'bot' && <BotAvatar />}
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
                <BotAvatar />
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
                  Dribi analyse...
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
              {['Abonnements', 'Rendez-vous', 'Consultations', 'Conseils'].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  style={{
                    padding: '5px 12px', borderRadius: 6, border: '1px solid #E5E7EB',
                    background: '#fff', color: '#374151', fontSize: 11, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
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
                flex: 1, padding: '10px 14px', borderRadius: 8,
                border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit',
                outline: 'none', background: thinking ? '#F9FAFB' : '#fff',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || thinking}
              style={{
                width: 40, height: 40, borderRadius: 8,
                border: 'none',
                background: input.trim() && !thinking ? 'linear-gradient(135deg, #1E40AF, #2563EB)' : '#E5E7EB',
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

      {/* ─── CSS ─── */}
      <style jsx>{`
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
            border-radius: 12px !important;
          }
        }
      `}</style>
    </>
  );
}
