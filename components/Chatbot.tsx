'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

type Message = {
  role: 'bot' | 'user';
  text: string;
};

const KEYWORD_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ['bonjour', 'salut', 'hello', 'bonsoir', 'coucou', 'hey'],
    response: 'Bonjour ! Bienvenue sur le portail AB DRIDI. Je suis votre assistant virtuel. Comment puis-je vous aider ? Vous pouvez me poser des questions sur les abonnements, les rendez-vous, la recherche de consultations, la concurrence ou nous contacter.',
  },
  {
    keywords: ['abonnement', 'prix', 'tarif', 'plan', 'offre', 'payer', 'gratuit', 'veille', 'souscrire', 'formule'],
    response: 'Nous proposons 2 formules :\n\n• **Découverte (Gratuit)** : 3 appels d\'offres/jour, résultats floutés au-delà de 3, prise de rendez-vous.\n\n• **Veille & Accompagnement (25,90€/mois)** : Appels d\'offres illimités, alertes email, concurrence complète, export CSV/Excel, support prioritaire.\n\nRendez-vous sur la page Abonnement pour souscrire !',
  },
  {
    keywords: ['rendez-vous', 'rdv', 'calendrier', 'accompagnement', 'montage', 'dossier', 'expert'],
    response: 'Vous pouvez demander un rendez-vous directement depuis la page de détail de n\'importe quelle consultation. Sélectionnez une date (lundi à samedi) et un créneau horaire (8h-18h). Nos experts vous accompagnent dans le montage de votre dossier de réponse aux appels d\'offres.',
  },
  {
    keywords: ['consultation', 'marche', 'marché', 'appel', 'offre', 'recherche', 'chercher', 'trouver'],
    response: 'Utilisez la page Consultations pour rechercher des appels d\'offres publics. Vous pouvez filtrer par mot-clé, nature (travaux, services, fournitures), département, et montant. Les résultats proviennent de 93 sources officielles (BOAMP, TED, DECP).',
  },
  {
    keywords: ['concurrence', 'concurrent', 'attribut', 'titulaire', 'attribu'],
    response: 'La page Concurrence vous permet d\'analyser les marchés déjà attribués. Identifiez vos concurrents, leurs montants et leurs marchés remportés. Cette fonctionnalité est disponible en version complète avec le plan Veille & Accompagnement.',
  },
  {
    keywords: ['alerte', 'notification', 'email', 'mail'],
    response: 'Les alertes email personnalisées vous notifient automatiquement quand un nouvel appel d\'offres correspond à vos critères. Configurez vos alertes depuis la page Alertes. Disponible avec le plan Veille & Accompagnement.',
  },
  {
    keywords: ['contact', 'email', 'aide', 'support', 'problème', 'question', 'telephone', 'téléphone'],
    response: 'Pour nous contacter :\n\n📧 Email : contact@abdridi.com\n\nNotre équipe vous répondra dans les plus brefs délais. Vous pouvez aussi demander un rendez-vous d\'accompagnement directement depuis la page de détail d\'une consultation.',
  },
  {
    keywords: ['export', 'csv', 'excel', 'télécharger', 'telecharger', 'données', 'donnees'],
    response: 'L\'export des données (CSV/Excel) est disponible avec le plan Veille & Accompagnement à 25,90€/mois. Vous pourrez exporter les résultats de vos recherches de consultations et d\'analyses concurrentielles.',
  },
  {
    keywords: ['cpv', 'code', 'filtre', 'filtrer', 'nature', 'département', 'departement', 'region', 'région'],
    response: 'Vous pouvez filtrer les consultations par :\n• Nature : Travaux, Services, Fournitures\n• Département ou Région\n• Code CPV\n• Montant (min/max)\n• Mot-clé dans le titre\n\nLes filtres avancés sont disponibles avec le plan Veille & Accompagnement.',
  },
  {
    keywords: ['merci', 'super', 'parfait', 'ok', 'compris', 'bien'],
    response: 'Avec plaisir ! N\'hésitez pas si vous avez d\'autres questions. Bonne navigation sur le portail AB DRIDI ! 🙂',
  },
];

const DEFAULT_RESPONSE = 'Je n\'ai pas compris votre question. Voici ce que je peux vous aider à comprendre :\n\n• **Abonnements & tarifs** — tapez "abonnement"\n• **Rendez-vous** — tapez "rendez-vous"\n• **Consultations** — tapez "consultation"\n• **Concurrence** — tapez "concurrence"\n• **Contact** — tapez "contact"\n\nOu contactez-nous à contact@abdridi.com';

const WELCOME_MESSAGE: Message = {
  role: 'bot',
  text: 'Bonjour ! 👋 Je suis l\'assistant AB DRIDI. Comment puis-je vous aider aujourd\'hui ?',
};

function getResponse(input: string): string {
  const lower = input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const entry of KEYWORD_RESPONSES) {
    for (const kw of entry.keywords) {
      const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(kwNorm)) {
        return entry.response;
      }
    }
  }
  return DEFAULT_RESPONSE;
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { role: 'user', text };
    const botReply: Message = { role: 'bot', text: getResponse(text) };
    setMessages(prev => [...prev, userMsg, botReply]);
    setInput('');
  }

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le chat"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <MessageCircle size={24} color="#fff" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="chatbot-panel" style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 370, maxHeight: 520,
          borderRadius: 16, overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'inherit',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Assistant AB DRIDI</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>En ligne</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer le chat"
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={16} color="#fff" />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 360, minHeight: 260 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                {msg.role === 'bot' && (
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={14} style={{ color: '#2563EB' }} />
                  </div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '10px 14px', borderRadius: 12,
                  fontSize: 13, lineHeight: 1.5,
                  ...(msg.role === 'user'
                    ? { background: '#2563EB', color: '#fff', borderBottomRightRadius: 4 }
                    : { background: '#F3F4F6', color: '#374151', borderBottomLeftRadius: 4 }
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
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={14} style={{ color: '#fff' }} />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: '12px 14px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tapez votre message..."
              style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#F9FAFB' }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              style={{
                width: 40, height: 40, borderRadius: 10,
                border: 'none', background: input.trim() ? 'linear-gradient(135deg, #2563EB, #3B82F6)' : '#E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
              }}
            >
              <Send size={16} color={input.trim() ? '#fff' : '#9CA3AF'} />
            </button>
          </form>
        </div>
      )}

      {/* Mobile responsive */}
      <style jsx>{`
        @media (max-width: 640px) {
          .chatbot-panel {
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-height: 100vh !important;
            border-radius: 16px 16px 0 0 !important;
          }
        }
      `}</style>
    </>
  );
}
