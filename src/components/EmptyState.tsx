import { Video as LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-xl bg-surface-raised border border-surface-border flex items-center justify-center mb-4">
        <Icon size={20} className="text-tx-muted" />
      </div>
      <h3 className="text-sm font-semibold text-tx-primary mb-1">{title}</h3>
      <p className="text-sm text-tx-muted max-w-xs leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-4 py-2 rounded-md bg-surface-raised border border-surface-border text-tx-secondary text-sm hover:text-tx-primary hover:bg-surface-overlay transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
