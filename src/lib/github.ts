const GITHUB_API_URL = 'https://api.github.com/users';

// 1. Dönecek profil bilgisinin haritası (Interface)
export interface GithubProfile {
  name: string;
  avatarUrl: string;
  bio: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  profileUrl: string;
}

// 2. Dönecek repo bilgisinin haritası (Interface)
export interface GithubRepo {
  id: number;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
  updatedAt: string;
}

// 3. Kullanıcı Profilini Çeken Fonksiyon
export const fetchGithubProfile = async (username: string): Promise<GithubProfile | null> => {
  try {
    const response = await fetch(`${GITHUB_API_URL}/${username}`);
    if (!response.ok) throw new Error('GitHub profili bulunamadı');
    const data = await response.json();
    return {
      name: data.name || data.login,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      publicRepos: data.public_repos,
      followers: data.followers,
      following: data.following,
      profileUrl: data.html_url
    };
  } catch (error) {
    console.error('GitHub profil hatası:', error);
    return null;
  }
};

// 4. Kullanıcının Repolarını Çeken Fonksiyon
export const fetchGithubRepos = async (username: string, limit: number = 10): Promise<GithubRepo[]> => {
  try {
    const response = await fetch(`${GITHUB_API_URL}/${username}/repos?sort=pushed&per_page=${limit}`);
    if (!response.ok) throw new Error('GitHub repoları bulunamadı');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await response.json();
    
    return data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      url: repo.html_url,
      updatedAt: repo.pushed_at
    }));
  } catch (error) {
    console.error('GitHub repo hatası:', error);
    return [];
  }
};

// 5. Kullanıcının Dillerini Analiz Eden Fonksiyon
export const analyzeTopLanguages = (repos: GithubRepo[]): string[] => {
  const languageCounts: Record<string, number> = {};
  
  repos.forEach((repo) => {
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
    }
  });

  return Object.entries(languageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([language]) => language);
};

// 6. Sonsuz Havuz (Discover) Projelerini Çeken Fonksiyon
export const fetchDiscoverProjects = async (
  page: number = 1,
  likedLanguages: string[] = [],
  seenIds: string[] = [],
  userRepoCount: number = 0
) => {
  try {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    const dateString = date.toISOString().split('T')[0];

    // Kullanıcı seviyesine göre proje büyüklüğü
    const maxStars = userRepoCount < 5 ? 2000 : userRepoCount < 15 ? 8000 : 50000;
    const minStars = 50;

    const languageFilter = likedLanguages.length > 0
      ? `language:${likedLanguages[Math.floor(Math.random() * likedLanguages.length)]}`
      : '';

    const randomPage = page === 1 ? 1 : Math.floor(Math.random() * 8) + 1;

    // good-first-issues:>3 → en az 3 başlangıç issue'su olan projeler
    // stars aralığı → çok büyük değil, katkı yapılabilir boyutta
    const query = encodeURIComponent(
      `good-first-issues:>3 stars:${minStars}..${maxStars} pushed:>${dateString} ${languageFilter}`
    );

    const response = await fetch(
      `https://api.github.com/search/repositories?q=${query}&sort=updated&order=desc&per_page=30&page=${randomPage}`,
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );

    if (!response.ok) throw new Error("GitHub API hatası");
    const data = await response.json();

    let filtered = data.items
      .filter((repo: any) => !seenIds.includes(repo.id.toString()))
      .filter((repo: any) => repo.description) // açıklaması olmayan projeleri ele
      .slice(0, 9);

    if (filtered.length < 3) {
      const extraResponse = await fetch(
        `https://api.github.com/search/repositories?q=${query}&sort=updated&order=desc&per_page=30&page=${randomPage + 1}`,
        { headers: { Accept: 'application/vnd.github.v3+json' } }
      );
      const extraData = await extraResponse.json();
      const extraFiltered = extraData.items
        .filter((repo: any) => !seenIds.includes(repo.id.toString()))
        .filter((repo: any) => repo.description)
        .slice(0, 9 - filtered.length);
      filtered = [...filtered, ...extraFiltered];
    }

    return filtered.map((repo: any) => ({
      id: repo.id.toString(),
      name: repo.full_name,
      description: repo.description || '',
      language: repo.language || "Bilinmiyor",
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      issues: repo.open_issues_count,
      url: repo.html_url,
      topics: repo.topics?.slice(0, 4) || [],
      goodFirstIssues: repo.good_first_issues_count || 0,
    }));

  } catch (error) {
    console.error("Projeler çekilemedi:", error);
    return [];
  }
};
export const calculateMatchScore = (
  project: any,
  userLanguages: string[],
  likedLanguages: string[]
): { score: number; reason: string } => {
  let score = 40; // base
  const reasons: string[] = [];
  const allUserLangs = [...new Set([...userLanguages, ...likedLanguages])];

  // Dil eşleşmesi
  if (project.language && allUserLangs.map(l => l.toLowerCase()).includes(project.language.toLowerCase())) {
    score += 30;
    reasons.push(`${project.language} deneyimin var`);
  }

  // Topic eşleşmesi
  const topicMatch = project.topics?.filter((t: string) =>
    allUserLangs.some(l => l.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(l.toLowerCase()))
  ).length || 0;
  if (topicMatch > 0) {
    score += Math.min(topicMatch * 10, 20);
    reasons.push(`${project.topics[0]} ilgi alanınla örtüşüyor`);
  }

  // Good first issue bolluğu
  if (project.issues > 10) { score += 10; }
  if (project.issues > 30) { score += 10; }

  // Skor 95'i geçmesin
  score = Math.min(score, 95);

  const reason = reasons.length > 0
    ? reasons[0]
    : `${project.language || 'Bu teknoloji'} stack'ine uygun`;

  return { score, reason };
};