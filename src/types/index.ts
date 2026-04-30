export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type Page = 'login' | 'discover' | 'saved' | 'issue-detail' | 'ideas' | 'profile' | 'build';

export type ActivityStatus = 'Very Active' | 'Active' | 'Moderate' | 'Low';

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  difficulty: Difficulty;
  activityStatus: ActivityStatus;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  owner: string;
  repoUrl: string;
  topics: string[];
}

export interface Issue {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  labels: string[];
  difficulty: Difficulty;
  estimatedTime: string;
  confidenceLevel: 'Low' | 'Medium' | 'High';
  aiExplanation: {
    whatIsThis: string;
    whatIsExpected: string;
    whereToStart: string;
    filesToCheck: string[];
  };
  createdAt: string;
  commentCount: number;
}

export interface ProjectIdea {
  id: string;
  title: string;
  explanation: string;
  whyItFits: string;
  difficulty: Difficulty;
  estimatedBuildTime: string;
  techStack: string[];
  tags: string[];
}


export type CareerGoal = 'staj' | 'is' | 'freelance' | 'startup' | 'ogrenme';

export interface ProjectStatus {
  id: string;
  user_id: string;
  project_id: string;
  project_name: string;
  status: 'saved' | 'in_progress' | 'completed';
  progress: number;
  github_url?: string;
  demo_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  type: string;
  unlocked_at: string;
}