export interface ProjectIdea {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  difficulty: 'Başlangıç' | 'Orta' | 'İleri';
  why: string;
  category: string;
}

const LIKED_KEY = 'devmatch_liked_ideas';
const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-advice`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const saveLikedIdea = (idea: ProjectIdea) => {
  const current = getLikedIdeas();
  const updated = [idea, ...current.filter(i => i.id !== idea.id)].slice(0, 20);
  localStorage.setItem(LIKED_KEY, JSON.stringify(updated));
};

export const getLikedIdeas = (): ProjectIdea[] =>
  JSON.parse(localStorage.getItem(LIKED_KEY) || '[]');

export const generateProjectIdeas = async (
  languages: string[],
  repoNames: string[],
  likedIdeas: ProjectIdea[]
): Promise<ProjectIdea[]> => {
  try {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ type: 'ideas', languages, repoNames, likedIdeas }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.ideas ?? getFallbackIdeas();
  } catch (error) {
    console.error('generateProjectIdeas hatası:', error);
    return getFallbackIdeas();
  }
};

export const generateIdeaDetail = async (idea: ProjectIdea): Promise<string> => {
  try {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ type: 'detail', idea }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.detail ?? 'Detay üretilemedi.';
  } catch (error) {
    console.error('generateIdeaDetail hatası:', error);
    return 'Detay yüklenirken bir hata oluştu.';
  }
};

export const generateAIAdvice = async (
  languages: string[],
  repoCount: number
): Promise<string> => {
  const ideas = await generateProjectIdeas(languages, [], []);
  return ideas.map(i => `• ${i.title}: ${i.description}`).join('\n\n');
};

const getFallbackIdeas = (): ProjectIdea[] => [
  {
    id: 'fallback-1',
    title: 'Kişisel Harcama Takipçisi',
    description: 'Aylık harcamalarını kategorilere göre takip et, görsel grafiklerle analiz et.',
    techStack: ['React', 'Chart.js', 'LocalStorage'],
    difficulty: 'Başlangıç',
    why: 'Temel React ve veri görselleştirme için ideal.',
    category: 'web'
  },
  {
    id: 'fallback-2',
    title: 'AI Destekli Not Özetleyici',
    description: 'Uzun notları yapıştır, AI ile özetle. Önemli noktaları otomatik çıkar.',
    techStack: ['Next.js', 'Groq API', 'Tailwind'],
    difficulty: 'Orta',
    why: 'AI API entegrasyonunu öğrenmek için harika.',
    category: 'ai'
  },
  {
    id: 'fallback-3',
    title: 'Pomodoro + Görev Yöneticisi',
    description: 'Pomodoro tekniğiyle çalış, görevleri takip et, verimlilik istatistikleri gör.',
    techStack: ['React', 'TypeScript', 'Supabase'],
    difficulty: 'Başlangıç',
    why: 'State management ve timer mantığını pekiştirmek için ideal.',
    category: 'web'
  },
  {
    id: 'fallback-4',
    title: 'GitHub Profil Analiz Aracı',
    description: 'GitHub kullanıcı adı gir, aktivite analizi ve dil dağılımı gör.',
    techStack: ['React', 'GitHub API', 'D3.js'],
    difficulty: 'Orta',
    why: 'API entegrasyonu ve veri görselleştirme bir arada.',
    category: 'devtool'
  },
  {
    id: 'fallback-5',
    title: 'Terminal Renk Teması Üretici',
    description: 'Renk paleti seç, terminal için otomatik tema dosyası üret.',
    techStack: ['React', 'Color.js', 'File API'],
    difficulty: 'Başlangıç',
    why: 'Developer tooling dünyasına giriş için eğlenceli.',
    category: 'devtool'
  },
  {
    id: 'fallback-6',
    title: 'Multiplayer Kelime Oyunu',
    description: 'Arkadaşlarınla gerçek zamanlı kelime tahmin oyunu oyna.',
    techStack: ['React', 'Supabase Realtime', 'TypeScript'],
    difficulty: 'İleri',
    why: 'WebSocket ve realtime öğrenmek isteyenler için.',
    category: 'game'
  },
];
export const generateIdeasFromPrompt = async (
  userPrompt: string,
  languages: string[],
  likedIdeas: ProjectIdea[]
): Promise<ProjectIdea[]> => {
  try {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ type: 'custom', userPrompt, languages, likedIdeas }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.ideas ?? getFallbackIdeas();
  } catch (error) {
    console.error('generateIdeasFromPrompt hatası:', error);
    return getFallbackIdeas();
  }
};