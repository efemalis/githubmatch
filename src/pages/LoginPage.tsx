import { Github, ArrowRight, Zap, BookOpen, Bot, Code2, Star, GitBranch, ChevronDown } from 'lucide-react';
import { Page } from '../types';
import { signInWithGitHub } from '../lib/auth';

interface LoginPageProps {
  onLogin: (page: Page) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const scrollToLogin = () => {
    document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-surface-base">

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-surface-border bg-surface-base/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-surface-raised border border-surface-border flex items-center justify-center">
              <div className="w-3 h-3 rounded-sm bg-tx-secondary" />
            </div>
            <span className="text-sm font-semibold text-tx-primary tracking-tight">devmatch</span>
          </div>
          <button
            onClick={scrollToLogin}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-tx-primary text-surface-base text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Github size={14} />
            GitHub ile Giriş
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-400/20 bg-purple-400/10 text-purple-400 text-xs font-medium mb-6">
            <Zap size={11} />
            AI destekli geliştirici platformu
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-tx-primary mb-6 leading-tight">
            Proje fikri bulmakta<br />
            <span className="text-purple-400">zorlanıyor musun?</span>
          </h1>

          <p className="text-lg text-tx-secondary mb-8 max-w-xl mx-auto leading-relaxed">
            DevMatch GitHub profilini analiz eder, sana özel proje önerileri sunar. 
            Her projenin yanında seni adım adım yönlendiren bir AI mentor seni bekliyor.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={scrollToLogin}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-tx-primary text-surface-base font-medium hover:opacity-90 transition-opacity"
            >
              <Github size={16} />
              Ücretsiz Başla
              <ArrowRight size={14} />
            </button>
            <p className="text-xs text-tx-muted">Kredi kartı gerekmez</p>
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section className="py-20 px-4 border-t border-surface-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-tx-primary text-center mb-4">Neler sunuyor?</h2>
          <p className="text-sm text-tx-secondary text-center mb-12 max-w-md mx-auto">
            Sadece fikir değil, o fikri gerçeğe dönüştürecek her şey burada.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Star size={20} className="text-yellow-400" />,
                title: 'Kişiselleştirilmiş Öneriler',
                desc: 'GitHub profilin analiz edilir, dillerin ve ilgi alanlarına göre sana özel proje fikirleri üretilir.',
                badge: 'AI',
                badgeColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
              },
              {
                icon: <Bot size={20} className="text-blue-400" />,
                title: 'Build Mode AI Mentor',
                desc: 'Projeye başla, seviyeni seç. Sıfırdan başlayanlar için "VSCode\'u aç, bu klasörü oluştur" seviyesinde anlatım.',
                badge: 'Yeni',
                badgeColor: 'text-green-400 bg-green-400/10 border-green-400/20',
              },
              {
                icon: <BookOpen size={20} className="text-orange-400" />,
                title: 'Detaylı Proje Rehberleri',
                desc: 'Her fikir için adım adım yol haritası, zorluklar ve "bir adım ileri" önerileri AI tarafından hazırlanır.',
                badge: 'AI',
                badgeColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
              },
              {
                icon: <Code2 size={20} className="text-cyan-400" />,
                title: 'CV Analizi',
                desc: 'CV\'ni yükle, AI güçlü ve eksik yönlerini tespit eder. Kariyer hedefine göre ne yapman gerektiğini söyler.',
                badge: 'AI',
                badgeColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
              },
              {
                icon: <GitBranch size={20} className="text-pink-400" />,
                title: 'Açık Kaynak Keşfi',
                desc: 'Good-first-issue etiketli gerçek GitHub projelerini keşfet, beğendiklerini kaydet, katkı yapmaya başla.',
                badge: 'GitHub',
                badgeColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
              },
              {
                icon: <Zap size={20} className="text-purple-400" />,
                title: 'Anlatım Seviyesi Seç',
                desc: '"Sıfırdan başlıyorum" dan "İleri seviye" ye kadar 4 farklı mentor modu. AI sana göre konuşur.',
                badge: 'Özel',
                badgeColor: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
              },
            ].map((feature, i) => (
              <div key={i} className="bg-surface-raised border border-surface-border rounded-2xl p-6 hover:border-purple-400/30 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-overlay border border-surface-border flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${feature.badgeColor}`}>
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-tx-primary mb-2">{feature.title}</h3>
                <p className="text-xs text-tx-secondary leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="py-20 px-4 border-t border-surface-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-tx-primary text-center mb-4">Nasıl çalışır?</h2>
          <p className="text-sm text-tx-secondary text-center mb-12">3 adımda başla</p>

          <div className="space-y-4">
            {[
              {
                step: '01',
                title: 'GitHub ile giriş yap',
                desc: 'Tek tıkla giriş. DevMatch GitHub profilini okur, kullandığın dilleri ve repolarını analiz eder.',
                color: 'text-blue-400',
              },
              {
                step: '02',
                title: 'Proje fikirlerini keşfet',
                desc: 'AI sana özel 6 proje fikri üretir. Beğendikçe öneriler daha da kişiselleşir. İstersen kendi fikrinden de başlayabilirsin.',
                color: 'text-purple-400',
              },
              {
                step: '03',
                title: 'Build Mode ile yap',
                desc: 'Projeye başla, seviyeni seç. AI mentor seni adım adım yönlendirir. Takıldığında sor, hata alınca yapıştır — çözelim.',
                color: 'text-green-400',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 p-5 bg-surface-raised border border-surface-border rounded-2xl">
                <span className={`text-3xl font-bold ${item.color} shrink-0 font-mono`}>{item.step}</span>
                <div>
                  <p className="text-sm font-semibold text-tx-primary mb-1">{item.title}</p>
                  <p className="text-xs text-tx-secondary leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scroll indicator */}
      <div className="flex justify-center py-4 animate-bounce">
        <ChevronDown size={20} className="text-tx-muted" />
      </div>

      {/* Login section */}
      <section id="login-section" className="py-20 px-4 border-t border-surface-border">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-tx-primary mb-2">Başlamaya hazır mısın?</h2>
            <p className="text-sm text-tx-secondary">Ücretsiz, GitHub hesabın yeterli.</p>
          </div>

          <div className="bg-surface-raised border border-surface-border rounded-2xl p-8">
            <button
              onClick={signInWithGitHub}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-tx-primary text-surface-base text-sm font-medium hover:opacity-90 transition-opacity group"
            >
              <Github size={16} />
              GitHub ile Giriş Yap
              <ArrowRight size={14} className="ml-auto group-hover:translate-x-0.5 transition-transform" />
            </button>

            <div className="mt-6 pt-6 border-t border-surface-border">
              <p className="text-xs text-tx-muted text-center leading-relaxed">
                Giriş yaparak{' '}
                <span className="text-tx-secondary">Kullanım Koşulları</span>
                {' '}ve{' '}
                <span className="text-tx-secondary">Gizlilik Politikasını</span>
                {' '}kabul etmiş olursunuz.
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[
              { value: '6', label: 'AI Özellik' },
              { value: '∞', label: 'Proje Fikri' },
              { value: '4', label: 'Mentor Modu' },
            ].map(({ value, label }) => (
              <div key={label} className="p-3 bg-surface-raised border border-surface-border rounded-xl">
                <div className="text-lg font-bold text-tx-primary">{value}</div>
                <div className="text-[11px] text-tx-muted mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-surface-raised border border-surface-border flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-sm bg-tx-secondary" />
            </div>
            <span className="text-sm font-semibold text-tx-primary">devmatch</span>
          </div>
          <p className="text-xs text-tx-muted">AI destekli geliştirici platformu</p>
        </div>
      </footer>
    </div>
  );
}