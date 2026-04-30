import { useEffect, useState, useRef } from 'react';
import { Bookmark, Star, ExternalLink, Trash2, Loader2, Bot, X, Send, BookOpen, Code2, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-advice`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  onNavigate: (page: any, project?: any) => void;
}

const difficultyColor: Record<string, string> = {
  'Başlangıç': 'text-green-400 bg-green-400/10 border-green-400/20',
  'Orta': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  'İleri': 'text-red-400 bg-red-400/10 border-red-400/20',
};

function DetailModal({ project, onClose }: { project: any; onClose: () => void }) {
  const [detail, setDetail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idea = {
      title: project.name,
      description: project.description,
      techStack: project.tech_stack ?? [project.language].filter(Boolean),
      difficulty: project.difficulty ?? 'Orta',
    };
    fetch(EDGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ type: 'detail', idea }),
    })
      .then(r => r.json())
      .then(data => { setDetail(data.detail ?? 'Detay üretilemedi.'); setLoading(false); })
      .catch(() => { setDetail('Bağlantı hatası.'); setLoading(false); });
  }, [project]);

  function renderMarkdown(text: string) {
    return text
      .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold text-tx-primary mt-6 mb-2">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold text-tx-primary mt-4 mb-2">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-tx-primary font-semibold">$1</strong>')
      .replace(/^\d+\. (.+)$/gm, '<div class="flex gap-2 mb-1"><span class="text-accent shrink-0">•</span><span>$1</span></div>')
      .replace(/^- (.+)$/gm, '<div class="flex gap-2 mb-1"><span class="text-tx-muted shrink-0">–</span><span>$1</span></div>')
      .replace(/\n\n/g, '<div class="mb-3"></div>');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-surface-base border border-surface-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-surface-border shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {project.difficulty && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded border ${difficultyColor[project.difficulty] ?? ''}`}>{project.difficulty}</span>
              )}
              {project.category && (
                <span className="text-xs text-tx-muted px-2 py-0.5 rounded bg-surface-overlay border border-surface-border">{project.category}</span>
              )}
            </div>
            <h2 className="text-xl font-bold text-tx-primary">{project.name}</h2>
          </div>
          <button onClick={onClose} className="text-tx-muted hover:text-tx-primary transition-colors p-1 shrink-0 ml-4"><X size={20} /></button>
        </div>
        {project.tech_stack?.length > 0 && (
          <div className="flex flex-wrap gap-2 px-6 pt-4 shrink-0">
            {project.tech_stack.map((tech: string) => (
              <span key={tech} className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-surface-overlay border border-surface-border text-tx-muted font-mono">
                <Code2 size={10} />{tech}
              </span>
            ))}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <p className="text-tx-secondary text-sm">AI bu projeyi detaylı anlatıyor...</p>
            </div>
          ) : (
            <div className="text-sm text-tx-secondary leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(detail ?? '') }} />
          )}
        </div>
        <div className="p-6 border-t border-surface-border shrink-0">
          <p className="text-xs text-tx-muted text-center">Mentörüne sormak için modalı kapat ve "AI Mentörüne Sor" butonunu kullan.</p>
        </div>
      </div>
    </div>
  );
}

function MentorModal({ project, onClose }: { project: any; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Merhaba! Ben **${project.name}** projesine özel mentörünüm. Kurulum, hatalar, best practice'ler, kod örnekleri — her şeyi sorabilirsin.` },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
        body: JSON.stringify({ type: 'mentor', project, messages: newMessages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply ?? 'Cevap alınamadı.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Bağlantı hatası, tekrar dene.' }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const renderText = (text: string) => text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-surface-overlay px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\n/g, '<br/>');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-surface-base border border-surface-border rounded-2xl w-full max-w-2xl flex flex-col" style={{ height: '80vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-surface-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-overlay border border-surface-border flex items-center justify-center">
              <Bot size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-tx-primary">{project.name} Mentörü</p>
              <p className="text-xs text-tx-secondary">Projeye özel AI asistan</p>
            </div>
          </div>
          <button onClick={onClose} className="text-tx-muted hover:text-tx-primary transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-tx-primary text-surface-base rounded-br-sm' : 'bg-surface-raised border border-surface-border text-tx-secondary rounded-bl-sm'}`}
                dangerouslySetInnerHTML={{ __html: renderText(msg.content) }}
              />
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-surface-raised border border-surface-border px-4 py-2.5 rounded-2xl rounded-bl-sm">
                <Loader2 size={14} className="text-accent animate-spin" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="p-4 border-t border-surface-border shrink-0">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Bir şey sor... (Enter ile gönder)"
              rows={1}
              className="flex-1 bg-surface-raised border border-surface-border rounded-xl px-4 py-2.5 text-sm text-tx-primary placeholder:text-tx-muted resize-none focus:outline-none focus:border-accent transition-colors"
              style={{ minHeight: '42px', maxHeight: '120px' }}
            />
            <button onClick={sendMessage} disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-tx-primary text-surface-base flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SavedPage({ onNavigate }: Props) {
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mentorProject, setMentorProject] = useState<any | null>(null);
  const [detailProject, setDetailProject] = useState<any | null>(null);

  useEffect(() => { fetchSavedProjects(); }, []);

  const fetchSavedProjects = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data, error } = await supabase.from('saved_projects').select('*').order('created_at', { ascending: false });
    if (!error && data) setSavedProjects(data);
    setLoading(false);
  };

  const handleRemove = async (id: string) => {
    setSavedProjects(prev => prev.filter(p => p.id !== id));
    await supabase.from('saved_projects').delete().eq('id', id);
  };

  const isAiIdea = (project: any) => !project.url || project.url === '';

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-slide-up">
      {mentorProject && <MentorModal project={mentorProject} onClose={() => setMentorProject(null)} />}
      {detailProject && <DetailModal project={detailProject} onClose={() => setDetailProject(null)} />}

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-surface-raised border border-surface-border flex items-center justify-center">
          <Bookmark className="text-tx-primary" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-tx-primary">Kaydedilenler</h1>
          <p className="text-sm text-tx-secondary">İlgini çeken projeler ve AI mentörün</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-tx-secondary animate-spin" /></div>
      ) : savedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-surface-border rounded-xl bg-surface-raised">
          <Bookmark className="w-12 h-12 text-tx-muted mb-4" />
          <p className="text-tx-secondary">Henüz bir proje kaydetmedin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savedProjects.map((project) => (
            <div key={project.id} className="bg-surface-raised border border-surface-border rounded-xl p-5 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 flex-wrap pr-2">
                  <h3 className="text-base font-semibold text-tx-primary truncate">{project.name}</h3>
                  {isAiIdea(project) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium border text-purple-400 bg-purple-400/10 border-purple-400/20">AI Fikir</span>
                  )}
                </div>
                <button onClick={() => handleRemove(project.id)} className="text-tx-muted hover:text-red-400 transition-colors shrink-0">
                  <Trash2 size={18} />
                </button>
              </div>

              <p className="text-sm text-tx-secondary line-clamp-2 mb-4 flex-grow">{project.description}</p>

              {project.tech_stack?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.tech_stack.slice(0, 3).map((tech: string) => (
                    <span key={tech} className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-surface-overlay border border-surface-border text-tx-muted font-mono">
                      <Code2 size={9} />{tech}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-surface-border mb-4">
                <div className="flex items-center gap-3">
                  {project.difficulty && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${difficultyColor[project.difficulty] ?? ''}`}>
                      {project.difficulty}
                    </span>
                  )}
                  {!isAiIdea(project) && (
                    <div className="flex items-center gap-1.5 text-tx-secondary text-xs">
                      <Star size={13} className="text-yellow-500" />
                      <span>{project.stars?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                {isAiIdea(project) ? (
                  <button onClick={() => setDetailProject(project)}
                    className="flex items-center gap-1.5 text-sm font-medium text-accent hover:opacity-80 transition-opacity">
                    <BookOpen size={14} /> Detayı Gör
                  </button>
                ) : (
                  <a href={project.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover transition-colors">
                    GitHub'a Git <ExternalLink size={14} />
                  </a>
                )}
              </div>

              <button
                onClick={() => onNavigate('build', project)}
               className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-all text-sm font-medium mb-2"
              >
                <Zap size={15} />
                Build Mode — Projeye Başla
              </button>

              <button onClick={() => setMentorProject(project)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-surface-border text-tx-secondary hover:bg-surface-overlay hover:text-accent transition-all text-sm font-medium">
                <Bot size={15} /> AI Mentörüne Sor
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}