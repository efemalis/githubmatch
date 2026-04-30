import { useEffect, useState } from 'react';
import { Star, GitFork, AlertCircle, Loader2, ExternalLink, Heart, X, RefreshCw, BookOpen } from 'lucide-react';
import { fetchDiscoverProjects, calculateMatchScore, analyzeTopLanguages, fetchGithubRepos } from '../lib/github';
import { supabase } from '../lib/supabase';

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-advice`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface Project {
  id: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  issues: number;
  url: string;
  topics: string[];
  goodFirstIssues?: number;
}

const SEEN_KEY = 'devmatch_seen_ids';
const LIKED_LANGS_KEY = 'devmatch_liked_langs';

// Proje detay modalı
function ProjectDetailModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [detail, setDetail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idea = {
      title: project.name,
      description: project.description,
      techStack: [project.language, ...project.topics].filter(Boolean),
      difficulty: 'Orta',
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
      .replace(/^\d+\. (.+)$/gm, '<div class="flex gap-2 mb-1.5"><span class="text-accent shrink-0 font-mono text-xs mt-0.5">→</span><span>$1</span></div>')
      .replace(/^- (.+)$/gm, '<div class="flex gap-2 mb-1.5"><span class="text-tx-muted shrink-0">•</span><span>$1</span></div>')
      .replace(/`([^`]+)`/g, '<code class="bg-surface-overlay px-1.5 py-0.5 rounded text-xs font-mono text-tx-primary">$1</code>')
      .replace(/\n\n/g, '<div class="mb-3"></div>');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-surface-base border border-surface-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Modal Header (Hatalı kısım düzeltildi, sadece proje adı gösteriliyor) */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-xl font-bold text-tx-primary">{project.name} Raporu</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-overlay text-tx-secondary transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-surface-border shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-tx-secondary">
            <Star size={13} className="text-yellow-500" />
            {project.stars.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-tx-secondary">
            <GitFork size={13} />
            {project.forks.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <AlertCircle size={13} />
            {project.issues} açık issue
          </div>
          <span className="text-xs font-medium text-tx-primary px-2 py-0.5 rounded bg-surface-overlay border border-surface-border font-mono">
            {project.language}
          </span>
          {project.topics.map(t => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-surface-overlay border border-surface-border text-tx-muted font-mono">{t}</span>
          ))}
        </div>

        {/* AI Detay */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <p className="text-tx-secondary text-sm">AI bu projeyi analiz ediyor...</p>
            </div>
          ) : (
            <div className="text-sm text-tx-secondary leading-relaxed" dangerouslySetInnerHTML={{ __html: renderMarkdown(detail ?? '') }} />
          )}
        </div>

        <div className="p-4 border-t border-surface-border shrink-0">
          <p className="text-xs text-tx-muted text-center">Projeyi beğendiysen kart ekranına dön ve "Kaydet" butonuna bas.</p>
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const [userLanguages, setUserLanguages] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [userRepoCount, setUserRepoCount] = useState(0);
  const [personalizedMode, setPersonalizedMode] = useState(true);

  const getSeenIds = (): string[] => JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
  const getLikedLanguages = (): string[] => JSON.parse(localStorage.getItem(LIKED_LANGS_KEY) || '[]');

  const addSeenIds = (ids: string[]) => {
    const current = getSeenIds();
    const updated = [...new Set([...current, ...ids])];
    localStorage.setItem(SEEN_KEY, JSON.stringify(updated.slice(-200)));
  };

  const addLikedLanguage = (language: string) => {
    if (!language || language === 'Bilinmiyor') return;
    const current = getLikedLanguages();
    if (!current.includes(language)) {
      localStorage.setItem(LIKED_LANGS_KEY, JSON.stringify([...current, language]));
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.preferred_username) {
        try {
          const username = session.user.user_metadata.preferred_username;
          const [userRes, repos] = await Promise.all([
            fetch(`https://api.github.com/users/${username}`).then(r => r.json()),
            fetchGithubRepos(username, 20),
          ]);
          setUserRepoCount(userRes.public_repos || 0);
          setUserLanguages(analyzeTopLanguages(repos));
        } catch {}
      }
    };
    fetchUserInfo();
  }, []);

  // İstenen değişiklik 3 ve 4: loadProjects güncellendi ve useEffect bağımlılığı eklendi
  useEffect(() => {
    loadProjects();
  }, [page, personalizedMode]);

  const loadProjects = async () => {
    setLoading(true);
    const seenIds = getSeenIds();
    const likedLanguages = personalizedMode ? getLikedLanguages() : [];
    const fetched = await fetchDiscoverProjects(page, likedLanguages, seenIds, userRepoCount);
    addSeenIds(fetched.map((p: Project) => p.id));
    setProjects(fetched);
    setLoading(false);
  };

  const handleSkip = (id: string) => setProjects(prev => prev.filter(p => p.id !== id));

  const handleSave = async (project: Project) => {
    setProjects(prev => prev.filter(p => p.id !== project.id));
    addLikedLanguage(project.language);
    project.topics.forEach(t => addLikedLanguage(t));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from('saved_projects').insert({
      user_id: session.user.id,
      project_id: project.id,
      name: project.name,
      description: project.description,
      language: project.language,
      url: project.url,
      stars: project.stars,
    });
  };

  const likedLanguages = getLikedLanguages();

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-slide-up">

      {selectedProject && (
        <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}

      {/* İstenen değişiklik 2: Header Div Bloğu değiştirildi */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-tx-primary">Açık Kaynak Projeleri Keşfet</h1>
          <p className="text-sm text-tx-secondary mt-1">
            {personalizedMode
              ? likedLanguages.length > 0
                ? `Beğenilerine göre öneriliyor: ${likedLanguages.slice(-3).join(', ')}`
                : 'Seviyene uygun projeler'
              : 'Tüm kategorilerden rastgele projeler'}
          </p>
        </div>
        
        {/* Mod switch */}
        <button
          onClick={() => {
            setPersonalizedMode(p => !p);
            setPage(1);
            setProjects([]);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all shrink-0 ${
            personalizedMode
              ? 'border-purple-400/30 bg-purple-400/10 text-purple-400'
              : 'border-surface-border text-tx-secondary hover:bg-surface-overlay'
          }`}
        >
          <span>{personalizedMode ? '🎯' : '🌍'}</span>
          {personalizedMode ? 'Bana Göre' : 'Rastgele Keşfet'}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 text-accent animate-spin" />
          <p className="text-tx-secondary text-sm">
            {personalizedMode && likedLanguages.length > 0 ? 'Beğendiklerine benzer projeler aranıyor...' : 'Sana uygun projeler aranıyor...'}
          </p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border border-surface-border rounded-xl bg-surface-raised text-center px-4">
          <div className="w-16 h-16 rounded-full bg-surface-overlay flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-tx-muted" />
          </div>
          <h3 className="text-lg font-semibold text-tx-primary mb-2">Bu partideki projeler bitti!</h3>
          <p className="text-tx-secondary text-sm max-w-sm mb-8">Sana yeni projeler buluyorum.</p>
          <button
            onClick={() => setPage(prev => prev + 1)}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-tx-primary text-surface-base font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={18} />
            Daha Fazla Proje Getir
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-surface-raised border border-surface-border rounded-xl p-6 hover:border-accent/50 transition-colors flex flex-col h-full">

              <div className="flex justify-between items-start mb-3">
                <h3 className="text-base font-semibold text-tx-primary truncate pr-3" title={project.name}>
                  {project.name}
                </h3>
                <a href={project.url} target="_blank" rel="noopener noreferrer"
                  className="text-tx-muted hover:text-accent transition-colors shrink-0">
                  <ExternalLink size={16} />
                </a>
              </div>

              {(() => {
                const { score, reason } = calculateMatchScore(project, userLanguages, getLikedLanguages());
                const color = score >= 75 ? 'text-green-400 bg-green-400/10 border-green-400/20'
                  : score >= 55 ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                  : 'text-tx-muted bg-surface-overlay border-surface-border';
                return (
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${color}`}>
                      🧠 AI Match: %{score}
                    </span>
                    <span className="text-[10px] text-tx-muted truncate">{reason}</span>
                  </div>
                );
              })()}

              <p className="text-sm text-tx-secondary line-clamp-3 mb-4 flex-grow">{project.description}</p>

              {project.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.topics.map(topic => (
                    <span key={topic} className="px-2 py-0.5 text-[10px] rounded bg-surface-overlay border border-surface-border text-tx-muted font-mono">{topic}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-tx-secondary text-xs">
                    <Star size={13} className="text-yellow-500" />{project.stars.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-tx-secondary text-xs">
                    <GitFork size={13} />{project.forks.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-green-400 text-xs">
                    <AlertCircle size={13} />{project.issues}
                  </div>
                </div>
                <span className="text-[10px] font-medium text-tx-primary px-2 py-0.5 rounded bg-surface-overlay border border-surface-border font-mono">
                  {project.language}
                </span>
              </div>

              {/* 3 buton */}
              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={() => handleSkip(project.id)}
                  className="flex items-center justify-center py-2.5 px-3 rounded-lg border border-surface-border text-tx-secondary hover:bg-surface-overlay hover:text-red-400 transition-all text-sm"
                >
                  <X size={15} />
                </button>
                <button
                  onClick={() => setSelectedProject(project)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-surface-border text-tx-secondary hover:bg-surface-overlay hover:text-accent transition-all font-medium text-sm"
                >
                  <BookOpen size={14} />
                  Detay
                </button>
                <button
                  onClick={() => handleSave(project)}
                  className="flex items-center justify-center py-2.5 px-3 rounded-lg bg-tx-primary text-surface-base hover:opacity-90 transition-all text-sm"
                >
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