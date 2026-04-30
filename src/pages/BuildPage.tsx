import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Loader2, Bot, User, Code2, Zap, ChevronDown, RotateCcw } from 'lucide-react';

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-advice`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const mentorLevels = [
  { id: 'sifir', label: 'Sıfırdan Başlıyorum', desc: 'Terminal nedir bilmiyorum', emoji: '🌱' },
  { id: 'baslangic', label: 'Başlangıç', desc: 'Temel programlama biliyorum', emoji: '📚' },
  { id: 'orta', label: 'Orta', desc: 'Bu teknolojiyi az biliyorum', emoji: '⚡' },
  { id: 'ileri', label: 'İleri', desc: 'Derinlemesine tartışalım', emoji: '🚀' },
];

interface Props {
  project: any;
  onBack: () => void;
}

function renderMessage(text: string) {
  return text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_: string, lang: string, code: string) =>
      `<div class="my-3 rounded-lg overflow-hidden border border-surface-border">
        ${lang ? `<div class="px-3 py-1 text-[11px] font-mono text-tx-muted bg-surface-overlay border-b border-surface-border">${lang}</div>` : ''}
        <pre class="px-4 py-3 text-xs font-mono text-tx-primary bg-surface-base overflow-x-auto whitespace-pre">${code.trim()}</pre>
      </div>`
    )
    .replace(/`([^`]+)`/g, '<code class="bg-surface-overlay px-1.5 py-0.5 rounded text-xs font-mono text-tx-primary">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-tx-primary font-semibold">$1</strong>')
    .replace(/^## (.+)$/gm, '<p class="text-sm font-semibold text-tx-primary mt-4 mb-2">$1</p>')
    .replace(/^### (.+)$/gm, '<p class="text-xs font-semibold text-tx-secondary mt-3 mb-1 uppercase tracking-wide">$1</p>')
    .replace(/^\d+\. (.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-accent shrink-0 font-mono text-xs mt-0.5">→</span><span>$1</span></div>')
    .replace(/^- (.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-tx-muted shrink-0">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '<div class="mb-2"></div>')
    .replace(/\n/g, '<br/>');
}

export default function BuildPage({ project, onBack }: Props) {
  const storageKey = `devmatch_build_${project.id}`;
  const levelKey = `${storageKey}_level`;

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [mentorLevel, setMentorLevel] = useState<string>(() =>
    localStorage.getItem(levelKey) || 'orta'
  );

  const [levelSelected, setLevelSelected] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved).length > 0 : false;
    } catch { return false; }
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentLevel = mentorLevels.find(l => l.id === mentorLevel) ?? mentorLevels[2];

  const saveMessages = (msgs: Message[]) => {
    localStorage.setItem(storageKey, JSON.stringify(msgs));
  };

  const startSession = async (level: string) => {
    setMentorLevel(level);
    setLevelSelected(true);
    localStorage.setItem(levelKey, level);
    setLoading(true);

    const welcomePrompt = `Merhaba! "${project.name}" projesine başlıyorum. Bana bu projeyi nasıl yapacağımı anlat.`;
    const userMsg: Message = { role: 'user', content: welcomePrompt };
    setMessages([userMsg]);

    try {
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
        body: JSON.stringify({ type: 'build', project, messages: [userMsg], mentorLevel: level }),
      });
      const data = await res.json();
      const updated: Message[] = [userMsg, { role: 'assistant', content: data.reply ?? 'Cevap alınamadı.' }];
      setMessages(updated);
      saveMessages(updated);
    } catch {
      const updated: Message[] = [userMsg, { role: 'assistant', content: 'Bağlantı hatası.' }];
      setMessages(updated);
      saveMessages(updated);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
        body: JSON.stringify({ type: 'build', project, messages: newMessages, mentorLevel }),
      });
      const data = await res.json();
      const updated: Message[] = [...newMessages, { role: 'assistant', content: data.reply ?? 'Cevap alınamadı.' }];
      setMessages(updated);
      saveMessages(updated);
    } catch {
      const updated: Message[] = [...newMessages, { role: 'assistant', content: 'Bağlantı hatası, tekrar dene.' }];
      setMessages(updated);
      saveMessages(updated);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const changeLevelMidSession = (newLevel: string) => {
    setMentorLevel(newLevel);
    localStorage.setItem(levelKey, newLevel);
    setShowLevelMenu(false);
    const notice: Message = {
      role: 'assistant',
      content: `Anlatım seviyesi **${mentorLevels.find(l => l.id === newLevel)?.label}** olarak değiştirildi. Bundan sonraki cevaplarımı bu seviyeye göre ayarlayacağım.`,
    };
    const updated = [...messages, notice];
    setMessages(updated);
    saveMessages(updated);
  };

  const resetSession = () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(levelKey);
    setMessages([]);
    setLevelSelected(false);
    setMentorLevel('orta');
  };

  if (!levelSelected) {
    return (
      <div className="min-h-screen bg-surface-base flex flex-col">
        <div className="border-b border-surface-border px-6 h-14 flex items-center gap-4 shrink-0">
          <button onClick={onBack} className="text-tx-muted hover:text-tx-primary transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-accent" />
            <span className="text-sm font-semibold text-tx-primary">{project.name}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-surface-border flex items-center justify-center mx-auto mb-4">
              <Zap size={28} className="text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-tx-primary mb-2">Build Mode</h1>
            <p className="text-sm text-tx-secondary max-w-sm">
              AI mentor seviyeni seç. Buna göre her şeyi sana özel anlatacak.
            </p>
          </div>

          <div className="w-full max-w-md space-y-3">
            {mentorLevels.map(level => (
              <button
                key={level.id}
                onClick={() => startSession(level.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-surface-border bg-surface-raised hover:border-accent/50 hover:bg-surface-overlay transition-all text-left"
              >
                <span className="text-3xl">{level.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-tx-primary">{level.label}</p>
                  <p className="text-xs text-tx-secondary">{level.desc}</p>
                </div>
                <span className="text-tx-muted text-xs">→</span>
              </button>
            ))}
          </div>

          <div className="w-full max-w-md p-4 rounded-xl bg-surface-raised border border-surface-border">
            <p className="text-xs text-tx-muted mb-2">YAPACAĞIN PROJE</p>
            <p className="text-sm font-medium text-tx-primary mb-1">{project.name}</p>
            <p className="text-xs text-tx-secondary line-clamp-2">{project.description}</p>
            {(project.tech_stack || project.language) && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(project.tech_stack || [project.language]).filter(Boolean).map((t: string) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-surface-overlay border border-surface-border text-tx-muted font-mono">{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base flex flex-col">
      <div className="border-b border-surface-border px-6 h-14 flex items-center gap-3 shrink-0 bg-surface-base">
        <button onClick={onBack} className="text-tx-muted hover:text-tx-primary transition-colors shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Code2 size={15} className="text-accent shrink-0" />
          <span className="text-sm font-semibold text-tx-primary truncate">{project.name}</span>
        </div>

        <button
          onClick={resetSession}
          className="text-xs text-tx-muted hover:text-red-400 transition-colors flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-surface-overlay"
          title="Sohbeti sıfırla"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Sıfırla</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowLevelMenu(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border text-xs text-tx-secondary hover:bg-surface-overlay transition-colors"
          >
            <span>{currentLevel.emoji}</span>
            <span className="hidden sm:inline">{currentLevel.label}</span>
            <ChevronDown size={12} />
          </button>
          {showLevelMenu && (
            <div className="absolute right-0 top-10 bg-surface-base border border-surface-border rounded-xl shadow-lg z-10 w-56 overflow-hidden">
              {mentorLevels.map(level => (
                <button
                  key={level.id}
                  onClick={() => changeLevelMidSession(level.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-overlay transition-colors ${mentorLevel === level.id ? 'bg-surface-overlay' : ''}`}
                >
                  <span>{level.emoji}</span>
                  <div>
                    <p className="text-xs font-medium text-tx-primary">{level.label}</p>
                    <p className="text-[11px] text-tx-muted">{level.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-3xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-tx-primary' : 'bg-surface-raised border border-surface-border'
            }`}>
              {msg.role === 'user'
                ? <User size={14} className="text-surface-base" />
                : <Bot size={14} className="text-accent" />
              }
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-tx-primary text-surface-base rounded-tr-sm'
                : 'bg-surface-raised border border-surface-border text-tx-secondary rounded-tl-sm'
            }`}>
              {msg.role === 'user'
                ? msg.content
                : <div dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }} />
              }
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-raised border border-surface-border flex items-center justify-center shrink-0">
              <Bot size={14} className="text-accent" />
            </div>
            <div className="bg-surface-raised border border-surface-border px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
              <Loader2 size={14} className="text-accent animate-spin" />
              <span className="text-xs text-tx-muted">Düşünüyor...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-surface-border px-4 py-4 bg-surface-base shrink-0">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Bir şey sor veya hata mesajını yapıştır... (Enter ile gönder)"
            rows={1}
            className="flex-1 bg-surface-raised border border-surface-border rounded-2xl px-4 py-3 text-sm text-tx-primary placeholder:text-tx-muted resize-none focus:outline-none focus:border-accent transition-colors"
            style={{ minHeight: '48px', maxHeight: '160px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-2xl bg-tx-primary text-surface-base flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-center text-[11px] text-tx-muted mt-2">
          Hata aldıysan mesajı direkt yapıştır, çözelim.
        </p>
      </div>
    </div>
  );
}