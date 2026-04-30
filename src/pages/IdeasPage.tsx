import { useEffect, useState } from 'react';
import { Lightbulb, Code2, Loader2, Sparkles, Heart, X, RefreshCw, Zap, BookOpen, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchGithubRepos, analyzeTopLanguages } from '../lib/github';
import { generateProjectIdeas, generateIdeasFromPrompt, generateIdeaDetail, saveLikedIdea, getLikedIdeas, ProjectIdea } from '../lib/ai';

const difficultyColor: Record<string, string> = {
  'Başlangıç': 'text-green-400 bg-green-400/10 border-green-400/20',
  'Orta': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  'İleri': 'text-red-400 bg-red-400/10 border-red-400/20',
};

function renderMarkdown(text: string) {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold text-tx-primary mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold text-tx-primary mt-6 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold text-tx-primary mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-tx-primary font-semibold">$1</strong>')
    .replace(/^\d+\. (.+)$/gm, '<div class="flex gap-2 mb-1"><span class="text-accent shrink-0">•</span><span>$1</span></div>')
    .replace(/^- (.+)$/gm, '<div class="flex gap-2 mb-1"><span class="text-tx-muted shrink-0">–</span><span>$1</span></div>')
    .replace(/\n\n/g, '<div class="mb-3"></div>');
}

function DetailModal({ idea, onClose }: { idea: ProjectIdea; onClose: () => void }) {
  const [detail, setDetail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateIdeaDetail(idea).then(text => { setDetail(text); setLoading(false); });
  }, [idea]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-surface-base border border-surface-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-surface-border shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded border ${difficultyColor[idea.difficulty]}`}>{idea.difficulty}</span>
              <span className="text-xs text-tx-muted px-2 py-0.5 rounded bg-surface-overlay border border-surface-border">{idea.category}</span>
            </div>
            <h2 className="text-xl font-bold text-tx-primary">{idea.title}</h2>
          </div>
          <button onClick={onClose} className="text-tx-muted hover:text-tx-primary transition-colors p-1 shrink-0 ml-4"><X size={20} /></button>
        </div>
        <div className="flex flex-wrap gap-2 px-6 pt-4 shrink-0">
          {idea.techStack.map(tech => (
            <span key={tech} className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-surface-overlay border border-surface-border text-tx-muted font-mono">
              <Code2 size={10} />{tech}
            </span>
          ))}
        </div>
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
          <p className="text-xs text-tx-muted text-center">Fikri beğendiysen kart ekranına dön ve "Beğen" butonuna bas.</p>
        </div>
      </div>
    </div>
  );
}

export default function IdeasPage() {
  const [loading, setLoading] = useState(true);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [topLanguages, setTopLanguages] = useState<string[]>([]);
  const [repoNames, setRepoNames] = useState<string[]>([]);
  const [repoCount, setRepoCount] = useState(0);
  const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
  const [started, setStarted] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<ProjectIdea | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  useEffect(() => {
    const analyzeProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const username = session.user.user_metadata?.preferred_username;
      if (!username) { setLoading(false); return; }
      const userRepos = await fetchGithubRepos(username, 20);
      setRepoCount(userRepos.length);
      setTopLanguages(analyzeTopLanguages(userRepos));
      setRepoNames(userRepos.map(r => r.name));
      setLoading(false);
    };
    analyzeProfile();
  }, []);

  const loadIdeas = async () => {
    setIdeasLoading(true);
    setStarted(true);
    const likedIdeas = getLikedIdeas();
    const newIdeas = await generateProjectIdeas(topLanguages, repoNames, likedIdeas);
    setIdeas(newIdeas);
    setIdeasLoading(false);
  };

  const loadCustomIdeas = async () => {
    if (!customPrompt.trim()) return;
    setIdeasLoading(true);
    setStarted(true);
    const likedIdeas = getLikedIdeas();
    const newIdeas = await generateIdeasFromPrompt(customPrompt, topLanguages, likedIdeas);
    setIdeas(newIdeas);
    setIdeasLoading(false);
  };

  const handleSkip = (id: string) => setIdeas(prev => prev.filter(i => i.id !== id));

  const handleSave = async (idea: ProjectIdea) => {
    setIdeas(prev => prev.filter(i => i.id !== idea.id));
    saveLikedIdea(idea);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('saved_projects').insert({
      user_id: session.user.id,
      project_id: idea.id,
      name: idea.title,
      description: idea.description,
      language: idea.techStack[0] ?? '',
      url: '',
      stars: 0,
      tech_stack: idea.techStack,
      difficulty: idea.difficulty,
      category: idea.category,
    });
  };

  const likedCount = getLikedIdeas().length;

  return (
    <div className="max-w-6xl mx-auto animate-slide-up pb-20">
      {selectedIdea && <DetailModal idea={selectedIdea} onClose={() => setSelectedIdea(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-raised border border-surface-border flex items-center justify-center">
            <Lightbulb className="text-tx-primary" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-tx-primary">Proje Fikirleri</h1>
            <p className="text-sm text-tx-secondary">
              {likedCount > 0 ? `${likedCount} beğenine göre kişiselleştirildi` : 'GitHub profiline göre öneriliyor'}
            </p>
          </div>
        </div>
        {started && (
          <button onClick={loadIdeas} disabled={ideasLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-border text-tx-secondary hover:bg-surface-overlay transition-all text-sm">
            <RefreshCw size={15} className={ideasLoading ? 'animate-spin' : ''} />
            Yeni Fikirler
          </button>
        )}
      </div>

      {/* Custom Prompt Kutusu — her zaman görünür */}
      {!loading && (
        <div className="mb-8 p-4 bg-surface-raised border border-surface-border rounded-xl">
          <p className="text-sm font-medium text-tx-primary mb-3">Aklında bir proje var mı?</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadCustomIdeas()}
              placeholder="Örn: 2D basit bir oyun yapmak istiyorum, Python CLI aracı, mobil alışveriş uygulaması..."
              className="flex-1 bg-surface-base border border-surface-border rounded-lg px-4 py-2.5 text-sm text-tx-primary placeholder:text-tx-muted focus:outline-none focus:border-accent transition-colors"
            />
            <button
              onClick={loadCustomIdeas}
              disabled={!customPrompt.trim() || ideasLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-tx-primary text-surface-base text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {ideasLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Üret
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-8 h-8 text-tx-secondary animate-spin" />
          <p className="text-tx-secondary text-sm">GitHub profilin analiz ediliyor...</p>
        </div>

      ) : !started ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="w-16 h-16 rounded-full bg-surface-raised border border-surface-border flex items-center justify-center">
            <Sparkles className="text-tx-primary" size={28} />
          </div>
          {topLanguages.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Code2 size={14} className="text-tx-muted" />
              {topLanguages.map(lang => (
                <span key={lang} className="px-2.5 py-1 rounded text-xs text-tx-primary bg-surface-overlay border border-surface-border font-mono">{lang}</span>
              ))}
              <span className="text-xs text-tx-muted">· {repoCount} repo analiz edildi</span>
            </div>
          )}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-tx-primary mb-2">Profilin hazır</h3>
            <p className="text-sm text-tx-secondary max-w-sm">
              Yukarıdaki kutuya yazmadan da devam edebilirsin — sana GitHub'ına göre öneriler üretelim.
            </p>
          </div>
          <button onClick={loadIdeas}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-tx-primary text-surface-base font-medium hover:opacity-90 transition-opacity">
            <Sparkles size={16} /> Fikirleri Göster
          </button>
        </div>

      ) : ideasLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 text-accent animate-spin" />
          <p className="text-tx-secondary text-sm">
            {customPrompt.trim() ? `"${customPrompt}" için fikirler üretiliyor...` : likedCount > 0 ? 'Beğendiklerine benzer fikirler üretiliyor...' : 'Sana özel fikirler hazırlanıyor...'}
          </p>
        </div>

      ) : ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border border-surface-border rounded-xl bg-surface-raised text-center px-4">
          <h3 className="text-lg font-semibold text-tx-primary mb-2">Hepsini gördün!</h3>
          <p className="text-tx-secondary text-sm max-w-sm mb-8">Yeni fikirler üretelim mi?</p>
          <button onClick={loadIdeas}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-tx-primary text-surface-base font-medium hover:opacity-90 transition-opacity">
            <RefreshCw size={18} /> Yeni Fikirler Üret
          </button>
        </div>

      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => (
            <div key={idea.id} className="bg-surface-raised border border-surface-border rounded-xl p-6 hover:border-accent/50 transition-colors flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <span className={`text-xs font-medium px-2 py-1 rounded border ${difficultyColor[idea.difficulty]}`}>{idea.difficulty}</span>
                <span className="text-xs text-tx-muted px-2 py-1 rounded bg-surface-overlay border border-surface-border">{idea.category}</span>
              </div>
              <h3 className="text-lg font-semibold text-tx-primary mb-2">{idea.title}</h3>
              <p className="text-sm text-tx-secondary line-clamp-3 mb-4 flex-grow">{idea.description}</p>
              <div className="flex items-start gap-2 mb-4 p-2 rounded-lg bg-surface-overlay border border-surface-border">
                <Zap size={13} className="text-accent mt-0.5 shrink-0" />
                <p className="text-xs text-tx-secondary">{idea.why}</p>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {idea.techStack.map(tech => (
                  <span key={tech} className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-surface-overlay border border-surface-border text-tx-muted font-mono">
                    <Code2 size={10} />{tech}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <button onClick={() => handleSkip(idea.id)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-surface-border text-tx-secondary hover:bg-surface-overlay hover:text-red-400 transition-all font-medium text-sm">
                  <X size={15} />
                </button>
                <button onClick={() => setSelectedIdea(idea)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-surface-border text-tx-secondary hover:bg-surface-overlay hover:text-accent transition-all font-medium text-sm">
                  <BookOpen size={15} /> Detay
                </button>
                <button onClick={() => handleSave(idea)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-tx-primary text-surface-base hover:opacity-90 transition-all font-medium text-sm">
                  <Heart size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}