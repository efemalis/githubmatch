import { Compass, Bookmark, Lightbulb, LucideIcon, Zap } from 'lucide-react';
import { Page } from '../types';

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  user?: any;
}

interface NavItem {
  id: Page;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: 'discover', label: 'Keşfet', icon: Compass, badge: 'GitHub' },
  { id: 'ideas', label: 'Fikirler', icon: Lightbulb, badge: 'AI' },
  { id: 'saved', label: 'Kaydedilenler', icon: Bookmark },
];

const getActiveBuildCount = (): number => {
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('devmatch_build_') && !key.endsWith('_level')) {
      try {
        const msgs = JSON.parse(localStorage.getItem(key) || '[]');
        if (msgs.length > 0) count++;
      } catch {}
    }
  }
  return count;
};

export default function Navbar({ currentPage, onNavigate, user }: NavbarProps) {
  const activeBuildCount = getActiveBuildCount();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-surface-border bg-surface-base">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <button
          onClick={() => onNavigate('discover')}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-7 h-7 rounded-lg bg-surface-raised border border-surface-border flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm bg-tx-secondary group-hover:bg-tx-primary transition-colors" />
          </div>
          <span className="text-sm font-semibold text-tx-primary tracking-tight">devmatch</span>
        </button>

        <nav className="flex items-center gap-1">
          {activeBuildCount > 0 && (
            <button
              onClick={() => onNavigate('saved')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-purple-400 bg-purple-400/10 border border-purple-400/20 hover:bg-purple-400/20 transition-colors mr-1"
            >
              <Zap size={12} />
              <span className="hidden sm:inline">Build devam ediyor</span>
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            </button>
          )}

          {navItems.map(({ id, label, icon: Icon, badge }) => {
            const isActive = currentPage === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-surface-raised text-tx-primary'
                    : 'text-tx-secondary hover:text-tx-primary hover:bg-surface-hover'
                }`}
              >
                <Icon size={15} strokeWidth={isActive ? 2 : 1.75} />
                <span className="hidden sm:inline">{label}</span>
                {badge && (
                  <span className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                    badge === 'AI'
                      ? 'text-purple-400 bg-purple-400/10 border-purple-400/20'
                      : 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                  }`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {user && user.user_metadata?.avatar_url ? (
          <button
            onClick={() => onNavigate('profile')}
            className={`w-8 h-8 rounded-full overflow-hidden border transition-colors ${
              currentPage === 'profile' ? 'border-accent' : 'border-surface-border hover:border-accent'
            }`}
            title="Profilim"
          >
            <img src={user.user_metadata.avatar_url} alt="Profil" className="w-full h-full object-cover" />
          </button>
        ) : (
          <button
            onClick={() => onNavigate('profile')}
            className="w-8 h-8 rounded-full bg-surface-raised border border-surface-border flex items-center justify-center hover:border-accent transition-colors"
          >
            <span className="text-xs font-medium text-tx-secondary">?</span>
          </button>
        )}
      </div>
    </header>
  );
}