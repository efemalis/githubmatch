import { useState, useEffect } from 'react';
import { Page } from './types';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import DiscoverPage from './pages/DiscoverPage';
import SavedPage from './pages/SavedPage';
import IssueDetailPage from './pages/IssueDetailPage';
import IdeasPage from './pages/IdeasPage';
import ProfilePage from './pages/ProfilePage';
import { supabase } from './lib/supabase';
import BuildPage from './pages/BuildPage';

export default function App() {
  const [page, setPage] = useState<Page>('login');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [buildProject, setBuildProject] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setPage('discover');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setPage('discover');
      } else {
        setPage('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (targetPage: Page) => setPage(targetPage);

  const handleViewIssues = (project: any) => {
    setSelectedProject(project);
    setPage('issue-detail');
  };

  const handleBack = () => {
    setPage('saved');
    setSelectedProject(null);
  };

const handleNavigate = (target: Page, project?: any) => {
  if (target !== 'issue-detail') setSelectedProject(null);
  if (target === 'build' && project) setBuildProject(project);
  setPage(target);
};

  if (!session && page === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-surface-base text-tx-primary font-sans">
      <Navbar
        currentPage={page}
        onNavigate={handleNavigate}
        user={session?.user}
      />
      <main className="pt-14">
        {page === 'build' && buildProject && (
  <BuildPage project={buildProject} onBack={() => setPage('saved')} />
)}
        {page === 'discover' && <DiscoverPage />}
        {page === 'saved' && <SavedPage onNavigate={handleNavigate} />}
        {page === 'issue-detail' && selectedProject && (
          <IssueDetailPage project={selectedProject} onBack={handleBack} />
        )}
        {page === 'ideas' && <IdeasPage />}
        {page === 'profile' && <ProfilePage session={session} onNavigate={handleNavigate} />}
      </main>
    </div>
  );
}