import { useEffect, useState } from 'react';
import { Star, GitFork, AlertCircle, Loader2, ExternalLink, Heart, X, RefreshCw, BookOpen, Check } from 'lucide-react';
import { fetchDiscoverProjects, calculateMatchScore, analyzeTopLanguages, fetchGithubRepos } from '../lib/github';
import { supabase } from '../lib/supabase';
import { motion, useMotionValue, useTransform, AnimatePresence, animate } from 'framer-motion';

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

function SwipeCard({ project, isTop, onSkip, onSave, onDetail, userLanguages, getLikedLanguages, calculateMatchScore }: any) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const cardOpacity = useTransform(x, [-200, 0, 200], [0.8, 1, 0.8]);
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const skipOpacity = useTransform(x, [-20, -100], [0, 1]);

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      animate(x, 500, { duration: 0.3, ease: "easeOut" });
      setTimeout(() => onSave(project), 200);
    } else if (info.offset.x < -threshold) {
      animate(x, -500, { duration: 0.3, ease: "easeOut" });
      setTimeout(() => onSkip(project.id), 200);
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 20 });
    }
  };

  const { score, reason } = calculateMatchScore(project, userLanguages, getLikedLanguages());
  const matchColor = score >= 75
    ? 'text-green-400 bg-green-400/10 border-green-400/20'
    : score >= 55
    ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    : 'text-tx-muted bg-surface-overlay border-surface-border';

  return (
    <motion.div
      style={{ x, rotate, opacity: cardOpacity, pointerEvents: isTop ? 'auto' : 'none' }}
      animate={{
        scale: isTop ? 1 : 0.92,
        y: isTop ? 0 : 25,
        zIndex: isTop ? 10 : 1,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      className="absolute w-full cursor-grab active:cursor-grabbing select-none touch-none"
    >
      {/* Yeşil Onay Damgası */}
      <motion.div
        style={{ opacity: likeOpacity, rotate: -12 }}
        className="absolute top-6 left-5 z-30 pointer-events-none"
      >
        <div className="relative flex items-center justify-center w-20 h-20">
          <div className="absolute inset-0 rounded-full border-[3px] border-green-400 bg-green-950/80" />
          <div className="absolute inset-2 rounded-full bg-green-500/10" />
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="relative z-10">
            <path d="M7 19L14 26L29 11" stroke="#4ade80" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-center text-[10px] font-bold text-green-400 tracking-widest mt-1">KAYDET</p>
      </motion.div>

      {/* Kırmızı Ret Damgası */}
      <motion.div
        style={{ opacity: skipOpacity, rotate: 12 }}
        className="absolute top-6 right-5 z-30 pointer-events-none"
      >
        <div className="relative flex items-center justify-center w-20 h-20">
          <div className="absolute inset-0 rounded-full border-[3px] border-red-400 bg-red-950/80" />
          <div className="absolute inset-2 rounded-full bg-red-500/10" />
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="relative z-10">
            <path d="M8 8L24 24M24 8L8 24" stroke="#f87171" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-center text-[10px] font-bold text-red-400 tracking-widest mt-1">GEÇ</p>
      </motion.div>

      <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 shadow-2xl h-[470px] flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-tx-primary truncate pr-3">{project.name}</h3>
          <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-tx-muted hover:text-accent transition-colors shrink-0">
            <ExternalLink size={18} />
          </a>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${matchColor}`}>
            🧠 AI Match: %{score}
          </span>
          <span className="text-[10px] text-tx-muted truncate">{reason}</span>
        </div>

        <p className="text-sm text-tx-secondary line-clamp-4 mb-4 flex-grow">{project.description}</p>

        {project.topics?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.topics.slice(0, 4).map((topic: string) => (
              <span key={topic} className="px-2 py-0.5 text-[10px] rounded bg-surface-overlay border border-surface-border text-tx-muted font-mono">{topic}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-tx-secondary text-xs"><Star size={13} className="text-yellow-500" />{(project.stars || 0).toLocaleString()}</div>
            <div className="flex items-center gap-1 text-tx-secondary text-xs"><GitFork size={13} />{(project.forks || 0).toLocaleString()}</div>
          </div>
          <span className="text-[10px] font-medium text-tx-primary px-2 py-0.5 rounded bg-surface-overlay border border-surface-border font-mono">{project.language || 'Bilinmiyor'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (isTop) { animate(x, -500, { duration: 0.2 }); setTimeout(() => onSkip(project.id), 200); } }}
            className="flex items-center justify-center py-3 px-4 rounded-xl border border-surface-border text-tx-secondary hover:bg-surface-overlay hover:text-red-400 transition-all"
          >
            <X size={18} />
          </button>
          <button
            onClick={() => isTop && onDetail(project)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-surface-border text-tx-secondary hover:bg-surface-overlay hover:text-accent transition-all font-medium text-sm"
          >
            <BookOpen size={16} /> Detay
          </button>
          <button
            onClick={() => { if (isTop) { animate(x, 500, { duration: 0.2 }); setTimeout(() => onSave(project), 200); } }}
            className="flex items-center justify-center py-3 px-4 rounded-xl bg-tx-primary text-surface-base hover:opacity-90 transition-all"
          >
            <Heart size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ProjectDetailModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [detail, setDetail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idea = {
      title: project.name,
      description: project.description,
      techStack: [project.language, ...(project.topics || [])].filter(Boolean),
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
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-xl font-bold text-tx-primary truncate pr-4">{project.name}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-overlay text-tx-secondary transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>
        <div className="flex items-center gap-4 px-6 py-3 border-b border-surface-border shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-tx-secondary"><Star size={13} className="text-yellow-500" />{(project.stars || 0).toLocaleString()}</div>
          <div className="flex items-center gap-1.5 text-xs text-tx-secondary"><GitFork size={13} />{(project.forks || 0).toLocaleString()}</div>
          <div className="flex items-center gap-1.5 text-xs text-green-400"><AlertCircle size={13} />{project.issues || 0} açık issue</div>
          <span className="text-xs font-medium text-tx-primary px-2 py-0.5 rounded bg-surface-overlay border border-surface-border font-mono">{project.language || 'Bilinmiyor'}</span>
          {project.topics?.map(t => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-surface-overlay border border-surface-border text-tx-muted font-mono">{t}</span>
          ))}
        </div>
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

  const getSeenIds = (): string[] => {
    try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; }
  };
  const getLikedLanguages = (): string[] => {
    try { return JSON.parse(localStorage.getItem(LIKED_LANGS_KEY) || '[]'); } catch { return []; }
  };
  const addSeenIds = (ids: string[]) => {
    try {
      const current = getSeenIds();
      const updated = [...new Set([...current, ...ids])];
      localStorage.setItem(SEEN_KEY, JSON.stringify(updated.slice(-200)));
    } catch {}
  };
  const addLikedLanguage = (language: string) => {
    if (!language || language === 'Bilinmiyor') return;
    try {
      const current = getLikedLanguages();
      if (!current.includes(language)) {
        localStorage.setItem(LIKED_LANGS_KEY, JSON.stringify([...current, language]));
      }
    } catch {}
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

  useEffect(() => {
    loadProjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    project.topics?.forEach(t => addLikedLanguage(t));
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
    <div className="max-w-6xl mx-auto pb-20 animate-slide-up overflow-hidden">
      {selectedProject && (
        <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}

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
        <button
          onClick={() => { setPersonalizedMode(p => !p); setPage(1); setProjects([]); }}
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
      ) : projects?.length === 0 ? (
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
        <>
          {/* MOBİL: Tinder Deste */}
          <div className="md:hidden relative h-[520px] w-full">
            <AnimatePresence>
              {projects?.slice(0, 3).reverse().map((project, index, array) => {
                const isTop = index === array.length - 1;
                return (
                  <SwipeCard
                    key={project.id}
                    project={project}
                    isTop={isTop}
                    onSkip={handleSkip}
                    onSave={handleSave}
                    onDetail={setSelectedProject}
                    userLanguages={userLanguages}
                    getLikedLanguages={getLikedLanguages}
                    calculateMatchScore={calculateMatchScore}
                  />
                );
              })}
            </AnimatePresence>
            <div className="absolute -bottom-8 left-0 right-0 flex justify-between px-4">
              <p className="text-[11px] text-tx-muted/70 font-medium tracking-wide">← GEÇ</p>
              <p className="text-[11px] text-tx-muted/70 font-medium tracking-wide">KAYDET →</p>
            </div>
          </div>

          {/* MASAÜSTÜ: Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map((project) => {
              const { score, reason } = calculateMatchScore(project, userLanguages, likedLanguages);
              const matchColor = score >= 75
                ? 'text-green-400 bg-green-400/10 border-green-400/20'
                : score >= 55
                ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                : 'text-tx-muted bg-surface-overlay border-surface-border';
              return (
                <div key={project.id} className="bg-surface-raised border border-surface-border rounded-xl p-6 hover:border-accent/50 transition-colors flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-base font-semibold text-tx-primary truncate pr-3" title={project.name}>{project.name}</h3>
                    <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-tx-muted hover:text-accent transition-colors shrink-0"><ExternalLink size={16} /></a>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${matchColor}`}>🧠 AI Match: %{score}</span>
                    <span className="text-[10px] text-tx-muted truncate">{reason}</span>
                  </div>
                  <p className="text-sm text-tx-secondary line-clamp-3 mb-4 flex-grow">{project.description}</p>
                  {project.topics?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {project.topics.map((topic: string) => (
                        <span key={topic} className="px-2 py-0.5 text-[10px] rounded bg-surface-overlay border border-surface-border text-tx-muted font-mono">{topic}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-tx-secondary text-xs"><Star size={13} className="text-yellow-500" />{(project.stars || 0).toLocaleString()}</div>
                      <div className="flex items-center gap-1 text-tx-secondary text-xs"><GitFork size={13} />{(project.forks || 0).toLocaleString()}</div>
                      <div className="flex items-center gap-1 text-green-400 text-xs"><AlertCircle size={13} />{project.issues || 0}</div>
                    </div>
                    <span className="text-[10px] font-medium text-tx-primary px-2 py-0.5 rounded bg-surface-overlay border border-surface-border font-mono">{project.language || 'Bilinmiyor'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <button onClick={() => handleSkip(project.id)} className="flex items-center justify-center py-2.5 px-3 rounded-lg border border-surface-border text-tx-secondary hover:bg-surface-overlay hover:text-red-400 transition-all text-sm"><X size={15} /></button>
                    <button onClick={() => setSelectedProject(project)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-surface-border text-tx-secondary hover:bg-surface-overlay hover:text-accent transition-all font-medium text-sm"><BookOpen size={14} /> Detay</button>
                    <button onClick={() => handleSave(project)} className="flex items-center justify-center py-2.5 px-3 rounded-lg bg-tx-primary text-surface-base hover:opacity-90 transition-all text-sm"><Heart size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}