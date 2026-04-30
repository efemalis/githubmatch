import { supabase } from './supabase';
import { Project } from '../types';

export const saveProjectToDb = async (userId: string, project: Project) => {
  const { data, error } = await supabase
    .from('saved_projects')
    .insert({
      user_id: userId,
      project_id: project.id,
      name: project.name,
      description: project.description,
      language: project.language,
      url: project.repoUrl,
      stars: project.stars,
    })
    .select()
    .single();

  if (error) {
    console.error('Proje kaydedilemedi:', error.message);
    return null;
  }
  return data;
};

export const getSavedProjectsFromDb = async (userId: string) => {
  const { data, error } = await supabase
    .from('saved_projects')
    .select('project_id, name, description, language, url, stars')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Projeler çekilemedi:', error.message);
    return [];
  }

  return data.map((row) => ({
    id: row.project_id,
    name: row.name,
    description: row.description,
    language: row.language,
    repoUrl: row.url,
    stars: row.stars,
    // Zorunlu alanlar için varsayılan değerler
    techStack: [],
    difficulty: 'Easy' as const,
    activityStatus: 'Active' as const,
    forks: 0,
    openIssues: 0,
    owner: '',
    topics: [],
  })) as Project[];
};