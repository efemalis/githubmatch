import { useEffect, useState } from 'react';
import { User, GitBranch, Star, Bookmark, Lightbulb, LogOut, ChevronRight, Zap, Code2, Target, Trophy, RefreshCw, Loader2, FileText, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchGithubProfile, fetchGithubRepos, analyzeTopLanguages } from '../lib/github';
import { getLikedIdeas } from '../lib/ai';
import { Page } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-advice`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const careerGoals = [
  { id: 'staj', label: 'Staj Bulmak', emoji: '🎯' },
  { id: 'is', label: 'İş Bulmak', emoji: '💼' },
  { id: 'freelance', label: 'Freelance', emoji: '🌍' },
  { id: 'startup', label: 'Startup Kurmak', emoji: '🚀' },
  { id: 'ogrenme', label: 'Teknoloji Öğrenmek', emoji: '🧠' },
];

const skillAreas = [
  { id: 'frontend', label: 'Frontend', langs: ['JavaScript', 'TypeScript', 'React', 'Vue', 'CSS', 'HTML'] },
  { id: 'backend', label: 'Backend', langs: ['Python', 'Node.js', 'Java', 'Go', 'Ruby', 'PHP', 'C#'] },
  { id: 'mobile', label: 'Mobile', langs: ['Swift', 'Kotlin', 'Dart', 'Flutter'] },
  { id: 'data', label: 'Data / AI', langs: ['Python', 'R', 'Julia'] },
  { id: 'devops', label: 'DevOps', langs: ['Shell', 'Dockerfile', 'HCL'] },
];

const achievementList = [
  { id: 'first_save', label: 'İlk Kayıt', desc: 'İlk projeyi kaydettin', emoji: '🌱', threshold: 1, type: 'save' },
  { id: 'five_saves', label: 'Koleksiyoner', desc: '5 proje kaydetttin', emoji: '📚', threshold: 5, type: 'save' },
  { id: 'ten_saves', label: 'Araştırmacı', desc: '10 proje kaydetttin', emoji: '🔍', threshold: 10, type: 'save' },
  { id: 'first_like', label: 'İlk Beğeni', desc: 'İlk fikri beğendin', emoji: '💡', threshold: 1, type: 'like' },
  { id: 'five_likes', label: 'Vizyoner', desc: '5 fikir beğendin', emoji: '🎨', threshold: 5, type: 'like' },
];

interface Props {
  session: any;
  onNavigate: (page: Page) => void;
}

export default function ProfilePage({ session, onNavigate }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [careerGoal, setCareerGoal] = useState<string>('');
  const [savingGoal, setSavingGoal] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cvText, setCvText] = useState<string>('');
  const [cvAnalysis, setCvAnalysis] = useState<string | null>(null);
  const [cvLoading, setCvLoading] = useState(false);

  const username = session?.user?.user_metadata?.preferred_username;
  const avatarUrl = session?.user?.user_metadata?.avatar_url;
  const fullName = session?.user?.user_metadata?.full_name;
  const likedIdeas = getLikedIdeas();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (username) {
        const [githubProfile, userRepos] = await Promise.all([
          fetchGithubProfile(username),
          fetchGithubRepos(username, 30),
        ]);
        setProfile(githubProfile);
        setRepos(userRepos);
        setLanguages(analyzeTopLanguages(userRepos));
      }

      const { count } = await supabase
        .from('saved_projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
      setSavedCount(count ?? 0);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('career_goal, cv_text')
        .eq('id', session.user.id)
        .single();
      if (profileData?.career_goal) setCareerGoal(profileData.career_goal);
      if (profileData?.cv_text) setCvText(profileData.cv_text);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCareerGoal = async (goal: string) => {
    setCareerGoal(goal);
    setSavingGoal(true);
    await supabase.from('profiles').update({ career_goal: goal }).eq('id', session.user.id);
    setSavingGoal(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  // PDF'den metin çıkar
  const extractPdfText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

 const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  console.log('Dosya seçildi:', file.name);
  setCvLoading(true);
  try {
    const text = await extractPdfText(file);
    console.log('Çıkarılan metin:', text.slice(0, 200));
    setCvText(text);
    await supabase.from('profiles').update({ cv_text: text }).eq('id', session.user.id);
    await analyzeCv(text);
  } catch (err) {
    console.error('CV hata:', err);
    setCvLoading(false);
  }
};

  const analyzeCv = async (text?: string) => {
    const cvContent = text ?? cvText;
    if (!cvContent) return;
    setCvLoading(true);
    try {
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
        body: JSON.stringify({
          type: 'cv',
          cvText: cvContent,
          languages,
          repoCount: repos.length,
          careerGoal,
        }),
      });
      const data = await res.json();
      setCvAnalysis(data.analysis ?? 'Analiz üretilemedi.');
    } catch {
      setCvAnalysis('Bağlantı hatası.');
    }
    setCvLoading(false);
  };

  const loadAiFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
        body: JSON.stringify({
          type: 'feedback',
          languages,
          repoCount: repos.length,
          savedCount,
          likedCount: likedIdeas.length,
          careerGoal,
          repoNames: repos.map(r => r.name).slice(0, 10),
          cvText: cvText || undefined,
        }),
      });
      const data = await res.json();
      setAiFeedback(data.feedback ?? 'Analiz üretilemedi.');
    } catch {
      setAiFeedback('Bağlantı hatası, tekrar dene.');
    }
    setFeedbackLoading(false);
  };

  const getSkillScore = (area: typeof skillAreas[0]) =>
    languages.filter(l => area.langs.includes(l)).length;

  const topSkillArea = skillAreas.reduce((a, b) => getSkillScore(a) > getSkillScore(b) ? a : b);

  const unlockedAchievements = achievementList.filter(a => {
    if (a.type === 'save') return savedCount >= a.threshold;
    if (a.type === 'like') return likedIdeas.length >= a.threshold;
    return false;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-8 h-8 text-tx-secondary animate-spin" />
        <p className="text-tx-secondary text-sm">Profil yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-slide-up px-4">

      {/* Hero */}
      <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-surface-border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-surface-overlay border border-surface-border flex items-center justify-center">
                <User size={28} className="text-tx-muted" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-tx-primary">{fullName || username}</h1>
              <p className="text-sm text-tx-secondary">@{username}</p>
              {profile?.bio && <p className="text-xs text-tx-muted mt-1 max-w-sm">{profile.bio}</p>}
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-tx-muted hover:text-red-400 transition-colors">
            <LogOut size={14} /> Çıkış
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-surface-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-tx-primary">{repos.length}</p>
            <p className="text-xs text-tx-secondary mt-1 flex items-center justify-center gap-1"><GitBranch size={11} /> Repo</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-tx-primary">{savedCount}</p>
            <p className="text-xs text-tx-secondary mt-1 flex items-center justify-center gap-1"><Bookmark size={11} /> Kaydedilen</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-tx-primary">{likedIdeas.length}</p>
            <p className="text-xs text-tx-secondary mt-1 flex items-center justify-center gap-1"><Lightbulb size={11} /> Beğenilen Fikir</p>
          </div>
        </div>
      </div>

      {/* Skill Analytics */}
      <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Code2 size={18} className="text-tx-primary" />
          <h2 className="text-base font-semibold text-tx-primary">Yetenek Analizi</h2>
        </div>
        {languages.length > 0 ? (
          <>
            <p className="text-xs text-tx-muted mb-3">EN ÇOK KULLANILAN DİLLER</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {languages.map(lang => (
                <span key={lang} className="px-3 py-1.5 rounded-lg text-xs text-tx-primary bg-surface-overlay border border-surface-border font-mono">{lang}</span>
              ))}
            </div>
            <p className="text-xs text-tx-muted mb-3">ALAN DAĞILIMI</p>
            <div className="space-y-2">
              {skillAreas.map(area => {
                const score = getSkillScore(area);
                const maxScore = Math.max(...skillAreas.map(a => getSkillScore(a)), 1);
                const pct = Math.round((score / maxScore) * 100);
                return (
                  <div key={area.id} className="flex items-center gap-3">
                    <span className="text-xs text-tx-secondary w-20 shrink-0">{area.label}</span>
                    <div className="flex-1 h-1.5 bg-surface-overlay rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-tx-muted w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-surface-overlay border border-surface-border">
              <p className="text-xs text-tx-secondary">
                <span className="text-tx-primary font-medium">Güçlü alan:</span> {topSkillArea.label}
                {skillAreas.filter(a => getSkillScore(a) === 0).length > 0 && (
                  <span className="ml-2 text-tx-muted">· Gelişim alanı: {skillAreas.filter(a => getSkillScore(a) === 0).map(a => a.label).join(', ')}</span>
                )}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-tx-secondary">GitHub'da henüz yeterli repo verisi yok.</p>
        )}
      </div>

      {/* Career Mode */}
      <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Target size={18} className="text-tx-primary" />
          <h2 className="text-base font-semibold text-tx-primary">Hedefin Ne?</h2>
          {savingGoal && <Loader2 size={13} className="text-tx-muted animate-spin ml-auto" />}
        </div>
        <p className="text-xs text-tx-secondary mb-4">Seçimin proje önerilerini kişiselleştirir.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {careerGoals.map(goal => (
            <button
              key={goal.id}
              onClick={() => handleCareerGoal(goal.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                careerGoal === goal.id
                  ? 'border-accent bg-accent/10 text-tx-primary'
                  : 'border-surface-border text-tx-secondary hover:bg-surface-overlay'
              }`}
            >
              <span>{goal.emoji}</span>
              <span>{goal.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CV Analizi */}
      <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-tx-primary" />
          <h2 className="text-base font-semibold text-tx-primary">CV Analizi</h2>
          {cvText && <span className="ml-auto text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded">CV Yüklendi</span>}
        </div>

        {!cvText ? (
          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-surface-border rounded-xl">
            <FileText size={28} className="text-tx-muted mb-3" />
            <p className="text-sm text-tx-secondary mb-4">CV'ni yükle, AI güçlü/eksik yönlerini analiz etsin</p>
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-tx-primary text-surface-base text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">
              <Upload size={15} />
              PDF Yükle
              <input type="file" accept=".pdf" className="hidden" onChange={handleCvUpload} />
            </label>
            {cvLoading && (
              <div className="flex items-center gap-2 mt-3">
                <Loader2 size={14} className="animate-spin text-accent" />
                <p className="text-xs text-tx-secondary">CV okunuyor ve analiz ediliyor...</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {cvLoading ? (
              <div className="flex items-center justify-center py-8 gap-3">
                <Loader2 className="w-5 h-5 text-accent animate-spin" />
                <p className="text-sm text-tx-secondary">CV analiz ediliyor...</p>
              </div>
            ) : cvAnalysis ? (
              <div className="text-sm text-tx-secondary leading-relaxed whitespace-pre-wrap mb-4">{cvAnalysis}</div>
            ) : (
              <p className="text-sm text-tx-secondary mb-4">CV yüklendi. Analiz için butona bas.</p>
            )}
            {!cvLoading && (
              <div className="flex gap-3">
                <button
                  onClick={() => analyzeCv()}
                  disabled={cvLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-border text-tx-secondary hover:bg-surface-overlay transition-all text-sm"
                >
                  <RefreshCw size={14} />
                  {cvAnalysis ? 'Yeniden Analiz Et' : 'Analiz Et'}
                </button>
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-border text-tx-secondary hover:bg-surface-overlay transition-all text-sm cursor-pointer">
                  <Upload size={14} />
                  CV Değiştir
                  <input type="file" accept=".pdf" className="hidden" onChange={handleCvUpload} />
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Feedback */}
      <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-tx-primary" />
            <h2 className="text-base font-semibold text-tx-primary">AI Koç Analizi</h2>
          </div>
          <button
            onClick={loadAiFeedback}
            disabled={feedbackLoading}
            className="flex items-center gap-1.5 text-xs text-tx-secondary hover:text-tx-primary transition-colors border border-surface-border px-3 py-1.5 rounded-lg hover:bg-surface-overlay"
          >
            {feedbackLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {aiFeedback ? 'Yenile' : 'Analiz Et'}
          </button>
        </div>
        {!aiFeedback && !feedbackLoading && (
          <p className="text-sm text-tx-secondary text-center py-8">
            {cvText ? 'GitHub + CV verilerine göre analiz yapılacak.' : 'AI koçun GitHub verilerini analiz edip sana özel geri bildirim verecek.'}
          </p>
        )}
        {feedbackLoading && (
          <div className="flex items-center justify-center py-8 gap-3">
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
            <p className="text-sm text-tx-secondary">Analiz ediliyor...</p>
          </div>
        )}
        {aiFeedback && !feedbackLoading && (
          <div className="text-sm text-tx-secondary leading-relaxed whitespace-pre-wrap">{aiFeedback}</div>
        )}
      </div>

      {/* Achievements */}
      <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Trophy size={18} className="text-tx-primary" />
          <h2 className="text-base font-semibold text-tx-primary">Başarılar</h2>
          <span className="text-xs text-tx-muted ml-auto">{unlockedAchievements.length}/{achievementList.length}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievementList.map(a => {
            const unlocked = unlockedAchievements.find(u => u.id === a.id);
            return (
              <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${unlocked ? 'border-accent/30 bg-accent/5' : 'border-surface-border opacity-40'}`}>
                <span className="text-2xl">{a.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-tx-primary">{a.label}</p>
                  <p className="text-xs text-tx-secondary">{a.desc}</p>
                </div>
                {unlocked && <span className="ml-auto text-accent text-xs">✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* GitHub Özeti */}
      <div className="bg-surface-raised border border-surface-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch size={18} className="text-tx-primary" />
          <h2 className="text-base font-semibold text-tx-primary">GitHub Özeti</h2>
          <a href={`https://github.com/${username}`} target="_blank" rel="noopener noreferrer"
            className="ml-auto text-xs text-accent hover:opacity-80 transition-opacity">
            GitHub'a Git →
          </a>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-surface-overlay border border-surface-border">
            <p className="text-xs text-tx-muted mb-1">Toplam Repo</p>
            <p className="text-xl font-bold text-tx-primary">{profile?.publicRepos ?? repos.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-surface-overlay border border-surface-border">
            <p className="text-xs text-tx-muted mb-1">Takipçi</p>
            <p className="text-xl font-bold text-tx-primary">{profile?.followers ?? '—'}</p>
          </div>
        </div>
        {repos.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-tx-muted mb-3">ÖNE ÇIKAN REPOLAR</p>
            <div className="space-y-2">
              {[...repos].sort((a, b) => b.stars - a.stars).slice(0, 3).map(repo => (
                <a key={repo.id} href={repo.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-overlay border border-surface-border hover:border-accent/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-tx-primary">{repo.name}</p>
                    {repo.description && <p className="text-xs text-tx-muted line-clamp-1">{repo.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-tx-muted shrink-0 ml-3">
                    <Star size={11} className="text-yellow-500" />
                    {repo.stars}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hızlı Erişim */}
      <div className="bg-surface-raised border border-surface-border rounded-2xl p-6">
        <h2 className="text-base font-semibold text-tx-primary mb-4">Hızlı Erişim</h2>
        <div className="space-y-2">
          {[
            { label: 'Proje Keşfet', desc: 'GitHub projelerine bak, katkı yap', page: 'discover' as Page },
            { label: 'Proje Fikirleri', desc: 'AI destekli kişisel proje önerileri', page: 'ideas' as Page },
            { label: 'Kaydedilenler', desc: 'Beğendiğin projeler ve AI mentörün', page: 'saved' as Page },
          ].map(item => (
            <button key={item.page} onClick={() => onNavigate(item.page)}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-surface-border hover:bg-surface-overlay transition-colors text-left">
              <div>
                <p className="text-sm font-medium text-tx-primary">{item.label}</p>
                <p className="text-xs text-tx-muted">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-tx-muted shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}