import { Difficulty, ActivityStatus } from '../types';

interface BadgeProps {
  label: string;
  variant?: 'tech' | 'difficulty' | 'activity' | 'label' | 'tag';
  difficulty?: Difficulty;
  activity?: ActivityStatus;
}

const difficultyConfig: Record<Difficulty, { color: string; bg: string }> = {
  Easy: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  Medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  Hard: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
};

const activityConfig: Record<ActivityStatus, { color: string; dot: string }> = {
  'Very Active': { color: '#A1A1A1', dot: '#22C55E' },
  'Active': { color: '#A1A1A1', dot: '#22C55E' },
  'Moderate': { color: '#A1A1A1', dot: '#F59E0B' },
  'Low': { color: '#A1A1A1', dot: '#6B6B6B' },
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const cfg = difficultyConfig[difficulty];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.color}22` }}
    >
      {difficulty}
    </span>
  );
}

export function ActivityBadge({ status }: { status: ActivityStatus }) {
  const cfg = activityConfig[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: cfg.color }}>
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: cfg.dot }}
      />
      {status}
    </span>
  );
}

export function TechBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-surface-overlay text-tx-secondary border border-surface-border">
      {label}
    </span>
  );
}

export function LabelBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-surface-overlay text-tx-secondary border border-surface-border">
      {label}
    </span>
  );
}

export function TagBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs bg-accent-subtle text-tx-secondary">
      {label}
    </span>
  );
}

export default Badge;

function Badge({ label, variant = 'tech', difficulty, activity }: BadgeProps) {
  if (variant === 'difficulty' && difficulty) return <DifficultyBadge difficulty={difficulty} />;
  if (variant === 'activity' && activity) return <ActivityBadge status={activity} />;
  if (variant === 'label') return <LabelBadge label={label} />;
  if (variant === 'tag') return <TagBadge label={label} />;
  return <TechBadge label={label} />;
}
