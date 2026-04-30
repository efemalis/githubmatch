import { Star, GitFork, CircleDot, ThumbsUp, X } from 'lucide-react';
import { Project } from '../types';
import { DifficultyBadge, ActivityBadge, TechBadge } from './Badge';
import { formatStars } from '../data/mockData';

interface ProjectCardProps {
  project: Project;
  onInterested?: () => void;
  onSkip?: () => void;
  showActions?: boolean;
  onViewIssues?: () => void;
  variant?: 'discover' | 'saved';
}

export default function ProjectCard({
  project,
  onInterested,
  onSkip,
  showActions = true,
  onViewIssues,
  variant = 'discover',
}: ProjectCardProps) {
  return (
    <div className="bg-surface-raised border border-surface-border rounded-[10px] p-5 hover:border-accent transition-colors animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-tx-muted font-mono">{project.owner}/</span>
            <h3 className="text-sm font-semibold text-tx-primary truncate">{project.name}</h3>
          </div>
          <p className="text-sm text-tx-secondary leading-relaxed line-clamp-2">{project.description}</p>
        </div>
        <DifficultyBadge difficulty={project.difficulty} />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {project.techStack.slice(0, 4).map((tech) => (
          <TechBadge key={tech} label={tech} />
        ))}
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs text-tx-muted">
        <span className="flex items-center gap-1">
          <Star size={12} />
          {formatStars(project.stars)}
        </span>
        <span className="flex items-center gap-1">
          <GitFork size={12} />
          {formatStars(project.forks)}
        </span>
        <span className="flex items-center gap-1">
          <CircleDot size={12} />
          {project.openIssues} issues
        </span>
        <ActivityBadge status={project.activityStatus} />
      </div>

      {showActions && variant === 'discover' && (
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md border border-surface-border text-tx-secondary text-sm hover:bg-surface-overlay hover:text-tx-primary transition-colors"
          >
            <X size={14} />
            Skip
          </button>
          <button
            onClick={onInterested}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md bg-surface-overlay border border-surface-border text-tx-primary text-sm hover:bg-accent-subtle transition-colors"
          >
            <ThumbsUp size={14} />
            Interested
          </button>
        </div>
      )}

      {variant === 'saved' && (
        <button
          onClick={onViewIssues}
          className="w-full py-2 rounded-md border border-surface-border text-tx-secondary text-sm hover:bg-surface-overlay hover:text-tx-primary transition-colors"
        >
          View Issues
        </button>
      )}
    </div>
  );
}