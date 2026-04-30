import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Clock, BarChart2, Sparkles, File, ChevronRight } from 'lucide-react';
import { Project, Issue } from '../types';
import { mockIssues } from '../data/mockData';
import { DifficultyBadge, LabelBadge } from '../components/Badge';
import { IssueCardSkeleton } from '../components/LoadingSkeleton';

interface IssueDetailPageProps {
  project: Project;
  onBack: () => void;
}

function IssueList({
  issues,
  onSelect,
}: {
  issues: Issue[];
  onSelect: (issue: Issue) => void;
}) {
  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <button
          key={issue.id}
          onClick={() => onSelect(issue)}
          className="w-full text-left p-4 rounded-[10px] bg-surface-raised border border-surface-border hover:border-accent-strong transition-colors group animate-fade-in"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-sm font-medium text-tx-primary leading-snug group-hover:text-tx-primary line-clamp-2">
              {issue.title}
            </h3>
            <ChevronRight size={14} className="text-tx-muted mt-0.5 flex-shrink-0 group-hover:text-tx-secondary transition-colors" />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <DifficultyBadge difficulty={issue.difficulty} />
            <span className="text-xs text-tx-muted flex items-center gap-1">
              <Clock size={11} />
              {issue.estimatedTime}
            </span>
            {issue.labels.slice(0, 2).map((l) => (
              <LabelBadge key={l} label={l} />
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

function IssueDetail({ issue, onBack }: { issue: Issue; onBack: () => void }) {
  const confidenceColors: Record<string, string> = {
    Low: '#EF4444',
    Medium: '#F59E0B',
    High: '#22C55E',
  };

  return (
    <div className="animate-slide-up">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-tx-secondary hover:text-tx-primary transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Back to issues
      </button>

      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-6">
        <div className="space-y-5">
          <div className="bg-surface-raised border border-surface-border rounded-[10px] p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-base font-semibold text-tx-primary leading-snug">{issue.title}</h2>
              <a
                href="#"
                className="flex-shrink-0 flex items-center gap-1 text-xs text-tx-muted hover:text-tx-secondary transition-colors"
              >
                <ExternalLink size={12} />
                Open
              </a>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <DifficultyBadge difficulty={issue.difficulty} />
              {issue.labels.map((l) => <LabelBadge key={l} label={l} />)}
            </div>
            <div className="prose-sm">
              <div className="text-sm text-tx-secondary whitespace-pre-line leading-relaxed max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                {issue.description}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 lg:mt-0 space-y-4">
          <div className="bg-surface-raised border border-surface-border rounded-[10px] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={14} className="text-tx-secondary" />
              <h3 className="text-sm font-semibold text-tx-primary">AI Explanation</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'What is this issue about?', content: issue.aiExplanation.whatIsThis },
                { label: 'What is expected from you?', content: issue.aiExplanation.whatIsExpected },
                { label: 'Where should you start?', content: issue.aiExplanation.whereToStart },
              ].map(({ label, content }) => (
                <div key={label}>
                  <p className="text-xs font-medium text-tx-muted uppercase tracking-wider mb-1.5">{label}</p>
                  <p className="text-sm text-tx-secondary leading-relaxed">{content}</p>
                </div>
              ))}

              <div>
                <p className="text-xs font-medium text-tx-muted uppercase tracking-wider mb-2">Possible files to check</p>
                <div className="space-y-1.5">
                  {issue.aiExplanation.filesToCheck.map((file) => (
                    <div
                      key={file}
                      className="flex items-center gap-2 px-3 py-2 rounded bg-surface-overlay border border-surface-border"
                    >
                      <File size={12} className="text-tx-muted flex-shrink-0" />
                      <span className="text-xs font-mono text-tx-secondary truncate">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-raised border border-surface-border rounded-[10px] p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center mb-1">
                  <BarChart2 size={13} className="text-tx-muted" />
                </div>
                <div className="text-xs text-tx-muted mb-0.5">Difficulty</div>
                <DifficultyBadge difficulty={issue.difficulty} />
              </div>
              <div>
                <div className="flex items-center justify-center mb-1">
                  <Clock size={13} className="text-tx-muted" />
                </div>
                <div className="text-xs text-tx-muted mb-0.5">Est. Time</div>
                <div className="text-xs font-medium text-tx-primary">{issue.estimatedTime}</div>
              </div>
              <div>
                <div className="flex items-center justify-center mb-1">
                  <Sparkles size={13} className="text-tx-muted" />
                </div>
                <div className="text-xs text-tx-muted mb-0.5">Confidence</div>
                <div
                  className="text-xs font-medium"
                  style={{ color: confidenceColors[issue.confidenceLevel] }}
                >
                  {issue.confidenceLevel}
                </div>
              </div>
            </div>
          </div>

          <button className="w-full py-2.5 rounded-md bg-surface-overlay border border-surface-border text-sm font-medium text-tx-primary hover:bg-accent-subtle hover:border-accent transition-colors">
            Start Contributing
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IssueDetailPage({ project, onBack }: IssueDetailPageProps) {
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const projectIssues = mockIssues.filter((i) => i.projectId === project.id);
      const genericIssues: Issue[] = projectIssues.length === 0
        ? [{
            id: `generic-${project.id}`,
            projectId: project.id,
            projectName: project.name,
            title: `Add unit tests for the core utility functions in ${project.name}`,
            description: `## Summary\n\nMany of the core utility functions in this codebase currently lack unit tests. This is a great opportunity for new contributors to get familiar with the codebase while improving overall test coverage.\n\n## What needs to be done\n\nWrite unit tests for the utility functions located in the utils/ directory. Focus on edge cases and error conditions.\n\n## Good First Issue\n\nThis issue is ideal for developers who are new to the project. The work is isolated and well-defined.`,
            labels: ['good first issue', 'testing', 'help wanted'],
            difficulty: 'Easy',
            estimatedTime: '2–3 hours',
            confidenceLevel: 'High',
            aiExplanation: {
              whatIsThis: `This issue asks you to write unit tests for utility functions in ${project.name}. It's a well-scoped task ideal for getting familiar with the codebase.`,
              whatIsExpected: 'Write Jest or Vitest tests covering normal usage, edge cases, and error handling for each utility function.',
              whereToStart: 'Look in the utils/ or lib/ directory for the functions that need testing. Check if there\'s already a test file (*.test.ts) — if so, look at the pattern and follow it.',
              filesToCheck: ['utils/index.ts', '__tests__/utils.test.ts', 'jest.config.js'],
            },
            createdAt: '2024-03-10',
            commentCount: 3,
          }]
        : projectIssues;
      setIssues(genericIssues);
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [project.id]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {!selectedIssue && (
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-tx-secondary hover:text-tx-primary transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            Back to saved
          </button>
          <h1 className="text-lg font-semibold text-tx-primary mb-1">
            Issues — {project.owner}/{project.name}
          </h1>
          <p className="text-sm text-tx-secondary">
            Select an issue to see an AI-powered explanation and get started.
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => <IssueCardSkeleton key={i} />)}
        </div>
      ) : selectedIssue ? (
        <IssueDetail issue={selectedIssue} onBack={() => setSelectedIssue(null)} />
      ) : (
        <IssueList issues={issues} onSelect={setSelectedIssue} />
      )}
    </div>
  );
}
