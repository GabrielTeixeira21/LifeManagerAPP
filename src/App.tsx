import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './Auth';

// Módulos Especializados
import { AthleticsView } from './components/AthleticsView';
import { UniversityView } from './components/UniversityView';
import { LifeView } from './components/LifeView';
import { FinanceView } from './components/FinanceView';
import { GoalsView } from './components/GoalsView';
import { ProfileView } from './components/ProfileView';

import {
  Home, Activity, GraduationCap, Heart,
  Wallet, Target, User, Flame, Droplets,
  Moon, Dumbbell, BookOpen, Plus
} from 'lucide-react';

type TabType = 'home' | 'athletics' | 'university' | 'life' | 'money' | 'goals' | 'profile';

export function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Estado Rápido do Dashboard Home
  const [waterGlasses, setWaterGlasses] = useState(4);
  const [sleepHours] = useState(8.5);
  const [workoutHours] = useState(2.2);
  const [studyHours] = useState(3.5);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
        A carregar ecossistema...
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const navItems = [
    { id: 'home', label: 'Hoje', icon: Home },
    { id: 'athletics', label: 'Atletismo', icon: Activity },
    { id: 'university', label: 'Faculdade', icon: GraduationCap },
    { id: 'life', label: 'Vida', icon: Heart },
    { id: 'money', label: 'Finanças', icon: Wallet },
    { id: 'goals', label: 'Objetivos', icon: Target },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-900/60 border-r border-zinc-800/80 p-5 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">Student Athlete</h1>
            <span className="text-[10px] text-zinc-400 tracking-wider uppercase font-semibold">Life OS</span>
          </div>
        </div>

        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 bg-zinc-800/30 border border-zinc-800/60 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-zinc-200">7 Dias em Chama</span>
          </div>
          <p className="text-[11px] text-zinc-400">Completa 85% dos objetivos hoje para prolongar o streak.</p>
        </div>
      </aside>

      {/* Viewport Principal */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full overflow-y-auto">
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Header com Streak */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 to-zinc-900/40 p-6 rounded-2xl border border-zinc-800/80">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Dashboard Diário</span>
                <h2 className="text-2xl font-bold text-white mt-1">Hoje no Teu Radar</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Visão consolidada do treino, faculdade e bem-estar.</p>
              </div>
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
                <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                <div>
                  <div className="text-xs font-bold text-amber-300">🔥 7 Dias de Streak</div>
                  <div className="text-[10px] text-zinc-400">88% concluído hoje</div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-zinc-900/70 border border-zinc-800/80 p-4 rounded-xl">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-medium">Hidratação</span>
                  <Droplets className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-lg font-bold text-white">{waterGlasses * 200} <span className="text-xs text-zinc-400">/ 2500 ml</span></div>
                <button
                  onClick={() => setWaterGlasses(v => v + 1)}
                  className="mt-2 text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> +1 Copo (200ml)
                </button>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800/80 p-4 rounded-xl">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-medium">Sono</span>
                  <Moon className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-lg font-bold text-white">{sleepHours}h <span className="text-xs text-zinc-400">(9/10)</span></div>
                <span className="text-[11px] text-emerald-400 font-medium">Recuperação Ótima</span>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800/80 p-4 rounded-xl">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-medium">Treino</span>
                  <Dumbbell className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-lg font-bold text-white">{workoutHours}h</div>
                <span className="text-[11px] text-zinc-400">Pista + Ginásio</span>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800/80 p-4 rounded-xl">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-medium">Estudo</span>
                  <BookOpen className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-lg font-bold text-white">{studyHours}h</div>
                <span className="text-[11px] text-zinc-400">Meta: 4h diárias</span>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900/70 border border-zinc-800/80 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Treino de Hoje (Pista)</h3>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-medium">17:30</span>
                </div>
                <div className="bg-zinc-800/40 p-3.5 rounded-xl border border-zinc-800/50 space-y-2">
                  <div className="text-sm font-bold text-zinc-200">10 × 200m (Rec. 2min)</div>
                  <div className="text-xs text-zinc-400">Target Pace: 28.0s</div>
                </div>
              </div>

              <div className="bg-zinc-900/70 border border-zinc-800/80 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-semibold text-white">Académico & Deadlines</h3>
                  </div>
                  <span className="text-xs text-zinc-400">Média Geral: 16.4</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-zinc-800/40 rounded-xl border border-zinc-800/50">
                    <div>
                      <div className="text-xs font-bold text-zinc-200">Trabalho de Programação</div>
                      <div className="text-[11px] text-zinc-400">Relatório Final</div>
                    </div>
                    <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Faltam 3 dias</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rotas dos Módulos */}
        {activeTab === 'athletics' && <AthleticsView userId={session.user.id} />}
        {activeTab === 'university' && <UniversityView userId={session.user.id} />}
        {activeTab === 'life' && <LifeView userId={session.user.id} />}
        {activeTab === 'money' && <FinanceView userId={session.user.id} />}
        {activeTab === 'goals' && <GoalsView userId={session.user.id} />}
        {activeTab === 'profile' && <ProfileView userId={session.user.id} onLogout={handleLogout} />}
      </main>

      {/* Bottom Bar Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900/90 border-t border-zinc-800/80 backdrop-blur-lg flex justify-around p-2 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`p-2 flex flex-col items-center gap-1 ${
                isActive ? 'text-emerald-400' : 'text-zinc-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default App;