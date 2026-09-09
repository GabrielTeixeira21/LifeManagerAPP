import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from './lib/supabase';
import { Auth } from './Auth';

// Módulos
import { AthleticsView } from './components/AthleticsView';
import { UniversityView } from './components/UniversityView';
import { LifeView } from './components/LifeView';
import { FinanceView } from './components/FinanceView';
import { GoalsView } from './components/GoalsView';
import { ProfileView } from './components/ProfileView';
import { StreakReviveModal } from './components/StreakReviveModal';

import {
  Home, Activity, GraduationCap, Heart,
  Wallet, Target, User, Flame, Droplets,
  Moon, Dumbbell, BookOpen, Plus, Sparkles, ChevronRight, Crown
} from 'lucide-react';

type TabType = 'home' | 'athletics' | 'university' | 'life' | 'money' | 'goals' | 'profile';

const MOTIVATIONAL_QUOTES = [
  "A consistência diária constrói o teu melhor resultado na pista e na vida.",
  "Foco no processo: cada repetição e cada hora de estudo contam.",
  "Mais um dia para manter a chama acesa e superar os teus limites.",
  "A disciplina de hoje é a vitória e o recorde de amanhã.",
  "Executa o plano com precisão. O teu futuro agradece o esforço de hoje."
];

export function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const [userProfile, setUserProfile] = useState<{ full_name?: string; username?: string; avatar_url?: string; theme?: string } | null>(null);
  const isRoseTheme = userProfile?.theme === 'rose';

  const [todayLog, setTodayLog] = useState<any>(null);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [nextDeadline, setNextDeadline] = useState<any>(null);
  const [globalAvg, setGlobalAvg] = useState<string>('—');
  const [streakData, setStreakData] = useState<{ rate: number; count: number; total: number }>({ rate: 0, count: 0, total: 0 });

  const [isReviveModalOpen, setIsReviveModalOpen] = useState(false);
  const [streakCharges, setStreakCharges] = useState(5);
  const [currentStreakCount, setCurrentStreakCount] = useState(0);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dayIndex = new Date().getDate() % MOTIVATIONAL_QUOTES.length;
  const currentQuote = MOTIVATIONAL_QUOTES[dayIndex];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        loadHomeData(session.user.id);
        checkStreakAndProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadHomeData(session.user.id);
        checkStreakAndProfile(session.user.id);
      } else {
        document.body.classList.remove('theme-rose');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && activeTab === 'home') {
      loadHomeData(session.user.id);
      checkStreakAndProfile(session.user.id);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isRoseTheme) {
      document.body.classList.add('theme-rose');
    } else {
      document.body.classList.remove('theme-rose');
    }
  }, [isRoseTheme]);

  // Lógica Inteligente de Avaliação de Dias
  const checkStreakAndProfile = async (userId: string) => {
    const now = new Date();
    const currentToday = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username, avatar_url, streak_days, streak_freeze_charges, last_streak_date, theme')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      setUserProfile(profile);
      const charges = profile.streak_freeze_charges ?? 5;
      setStreakCharges(charges);

      let currentStreak = profile.streak_days ?? 0;
      const lastDate = profile.last_streak_date;

      // VERIFICA O DIA DE ONTEM SE AINDA NÃO FOI AVALIADO
      if (lastDate !== currentToday && lastDate !== yesterdayStr) {
        const { data: yesterdayGoals } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId)
          .eq('target_date', yesterdayStr);

        const total = yesterdayGoals?.length || 0;
        const completed = yesterdayGoals?.filter((g: any) => g.completed).length || 0;
        const rate = total > 0 ? (completed / total) * 100 : 0;

        if (total > 0 && rate >= 85) {
          // Ganhou o fogo de ontem! Soma o streak.
          currentStreak += 1;
          await supabase.from('profiles').update({
            streak_days: currentStreak,
            last_streak_date: yesterdayStr
          }).eq('id', userId);
        } else {
          // Falhou ontem (ou não teve metas)
          if (currentStreak > 0) {
            const alreadyDismissed = sessionStorage.getItem('streak_revive_dismissed');
            if (charges > 0 && !alreadyDismissed) {
              setIsReviveModalOpen(true);
            } else if (charges <= 0) {
              // Sem vidas: perde o streak automaticamente e regista
              currentStreak = 0;
              await supabase.from('profiles').update({
                streak_days: 0,
                last_streak_date: yesterdayStr,
                streak_broken_at: new Date().toISOString()
              }).eq('id', userId);
            }
          } else {
            // O streak já estava a 0, apenas atualizamos a data para não voltar a avaliar
            await supabase.from('profiles').update({
              last_streak_date: yesterdayStr
            }).eq('id', userId);
          }
        }
      }

      setCurrentStreakCount(currentStreak);
    }
  };

  const handleReviveStreak = async () => {
    if (!session || streakCharges <= 0) return;
    const currentToday = new Date().toISOString().split('T')[0];

    const newCharges = streakCharges - 1;
    await supabase.from('profiles').update({
      streak_freeze_charges: newCharges,
      last_streak_date: currentToday, // Trancamos a data para hoje
      streak_broken_at: null
    }).eq('id', session.user.id);

    sessionStorage.setItem('streak_revive_dismissed', 'true');
    setStreakCharges(newCharges);
    setIsReviveModalOpen(false);
    loadHomeData(session.user.id);
    checkStreakAndProfile(session.user.id);
  };

  const handleResetStreak = async () => {
    if (!session) return;
    const currentToday = new Date().toISOString().split('T')[0];
    
    await supabase.from('profiles').update({
      streak_days: 0,
      last_streak_date: currentToday, // Impede que chateie de novo hoje
      streak_broken_at: new Date().toISOString() 
    }).eq('id', session.user.id);

    setCurrentStreakCount(0);
    sessionStorage.setItem('streak_revive_dismissed', 'true');
    setIsReviveModalOpen(false);
  };

  const loadHomeData = async (userId: string) => {
    const { data: log } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', todayStr)
      .maybeSingle();
    setTodayLog(log);

    const { data: workouts } = await supabase
      .from('track_workouts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1);
    if (workouts && workouts.length > 0) setTodayWorkout(workouts[0]);

    const { data: deadlines } = await supabase
      .from('academic_deadlines')
      .select('*')
      .eq('user_id', userId)
      .gte('deadline_date', new Date().toISOString())
      .order('deadline_date', { ascending: true })
      .limit(1);
    if (deadlines && deadlines.length > 0) setNextDeadline(deadlines[0]);

    const { data: grades } = await supabase
      .from('course_grades')
      .select('*')
      .eq('user_id', userId);
    if (grades && grades.length > 0) {
      let sum = 0;
      let totalW = 0;
      grades.forEach(g => {
        sum += Number(g.grade) * Number(g.weight_percent);
        totalW += Number(g.weight_percent);
      });
      if (totalW > 0) setGlobalAvg((sum / totalW).toFixed(1));
    }

    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('target_date', todayStr); // Avalia a percentagem só de hoje
    
    if (goals) {
      const total = goals.length;
      const completed = goals.filter(g => g.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      setStreakData({ rate, count: completed, total });
    }
  };

  const handleQuickAddWater = async () => {
    if (!session) return;
    const currentMl = Number(todayLog?.water_ml) || 0;
    const newMl = currentMl + 200;

    setTodayLog((prev: any) => ({
      ...prev,
      water_ml: newMl
    }));

    const { error } = await supabase.from('daily_logs').upsert({
      user_id: session.user.id,
      log_date: todayStr,
      water_ml: newMl
    }, { onConflict: 'user_id, log_date' });

    if (error) {
      console.error('Erro ao somar água:', error);
      loadHomeData(session.user.id);
    }
  };

  const handleLogout = async () => {
    document.body.classList.remove('theme-rose');
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-amber-400 text-xs font-mono tracking-wider">
        A CARREGAR ECOSSISTEMA...
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const navItems = [
    { id: 'home', label: 'Hoje', icon: Home },
    { id: 'athletics', label: 'Desporto', icon: Activity },
    { id: 'university', label: 'Educação', icon: GraduationCap },
    { id: 'life', label: 'Vida', icon: Heart },
    { id: 'money', label: 'Finanças', icon: Wallet },
    { id: 'goals', label: 'Objetivos', icon: Target },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  const currentWater = Number(todayLog?.water_ml) || 0;
  const streakAchieved = streakData.rate >= 85;

  return (
    <div className={`min-h-[100dvh] flex flex-col md:flex-row pb-20 md:pb-0 pt-[max(env(safe-area-inset-top),1rem)] md:pt-0 ${isRoseTheme ? 'selection:bg-pink-200' : 'selection:bg-amber-400/30'}`}>
      <StreakReviveModal
        isOpen={isReviveModalOpen}
        onClose={() => {
          sessionStorage.setItem('streak_revive_dismissed', 'true');
          setIsReviveModalOpen(false);
        }}
        onRevive={handleReviveStreak}
        onReset={handleResetStreak}
        chargesLeft={streakCharges}
        streakCount={currentStreakCount}
      />

      <aside className={`hidden md:flex flex-col w-64 p-5 backdrop-blur-2xl transition-colors duration-300 ${
        isRoseTheme 
          ? 'bg-white/80 border-r border-pink-200/60 shadow-sm' 
          : 'bg-[#0d0e12]/80 border-r border-amber-500/15'
      }`}>
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm border ${
            isRoseTheme 
              ? 'bg-gradient-to-br from-amber-200/40 via-pink-200 to-pink-300 border-pink-300 text-pink-600' 
              : 'bg-gradient-to-br from-amber-300/20 via-yellow-500/15 to-transparent border-amber-400/40 text-amber-300 shadow-amber-500/10'
          }`}>
            <Crown className={`w-4 h-4 ${isRoseTheme ? 'fill-pink-400 text-pink-600' : 'fill-amber-300/30 text-amber-300'}`} />
          </div>
          <div>
            <h1 className={`text-sm font-extrabold tracking-tight flex items-center gap-1.5 ${isRoseTheme ? 'text-slate-800' : 'text-white'}`}>
              Life Manager{' '}
              <span
                className={`text-[10px] px-1.5 py-0.5 font-black rounded-md shadow-sm ${
                  isRoseTheme
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/20'
                    : 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-zinc-950 shadow-amber-500/20 font-extrabold'
                }`}
              >
                {isRoseTheme ? 'ROSE' : 'GOLD'}
              </span>
            </h1>
            <span className={`text-[10px] font-semibold tracking-wider ${isRoseTheme ? 'text-pink-500' : 'text-amber-200/60'}`}>
              Estudante Atleta
            </span>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? isRoseTheme
                      ? 'bg-gradient-to-r from-pink-500/15 to-amber-400/10 text-pink-700 border border-pink-300 font-bold shadow-sm'
                      : 'bg-gradient-to-r from-amber-500/15 to-white/[0.05] text-amber-200 border border-amber-400/30 shadow-md shadow-amber-500/5'
                    : isRoseTheme
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-pink-50'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${
                    isActive 
                      ? isRoseTheme ? 'text-pink-600' : 'text-amber-300' 
                      : isRoseTheme ? 'text-slate-400' : 'text-zinc-500'
                  }`} />
                  {item.label}
                </div>
                {isActive && <ChevronRight className={`w-3.5 h-3.5 ${isRoseTheme ? 'text-pink-500' : 'text-amber-400/70'}`} />}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-5 md:p-8 max-w-6xl mx-auto w-full">
        {activeTab === 'home' && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="relative overflow-hidden glow-card rounded-3xl p-6 md:p-8 backdrop-blur-xl">
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative shrink-0">
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt="Foto de Perfil"
                        className={`w-16 h-16 rounded-2xl object-cover border-2 shadow-xl ${
                          isRoseTheme ? 'border-pink-300 shadow-pink-500/10' : 'border-amber-300/50 shadow-amber-500/10'
                        }`}
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center font-bold text-xl shadow-xl ${
                        isRoseTheme 
                          ? 'bg-gradient-to-br from-amber-100 via-pink-100 to-pink-200 border-pink-300 text-pink-600' 
                          : 'bg-gradient-to-br from-amber-300/20 via-zinc-900 to-zinc-950 border-amber-400/40 text-amber-300 shadow-amber-500/10'
                      }`}>
                        {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 p-1 rounded-lg border shadow-sm ${
                      isRoseTheme ? 'bg-white border-pink-300' : 'bg-[#0d0e12] border-amber-400/40'
                    }`}>
                      <Sparkles className={`w-3.5 h-3.5 animate-pulse ${isRoseTheme ? 'text-pink-500' : 'text-amber-300'}`} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono gold-gradient-text font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className={`w-3 h-3 inline ${isRoseTheme ? 'text-pink-500' : 'text-amber-300'}`} /> Dashboard Diário
                      </span>
                    </div>
                    <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isRoseTheme ? 'text-slate-800' : 'text-white'}`}>
                      Hoje no teu dia...
                    </h2>
                    <p className={`text-xs md:text-sm mt-1 italic max-w-xl leading-relaxed ${isRoseTheme ? 'text-slate-600' : 'text-zinc-300'}`}>
                      "{currentQuote}"
                    </p>
                  </div>
                </div>

                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border transition-all ${
                    streakAchieved 
                      ? isRoseTheme
                        ? 'bg-gradient-to-br from-amber-100/50 via-pink-50 to-white border-pink-300 shadow-md shadow-pink-500/10'
                        : 'bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-transparent border-amber-400/50 shadow-lg shadow-amber-500/15' 
                      : isRoseTheme
                        ? 'bg-white border-pink-200'
                        : 'bg-black/30 border-amber-500/20'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${
                    streakAchieved 
                      ? isRoseTheme ? 'bg-pink-100 border border-pink-200' : 'bg-amber-400/20 border border-amber-400/30' 
                      : isRoseTheme ? 'bg-slate-100' : 'bg-white/[0.05]'
                  }`}>
                    <Flame className={`w-6 h-6 ${
                      streakAchieved 
                        ? isRoseTheme ? 'text-pink-500 fill-pink-300/40 animate-pulse' : 'text-amber-300 fill-amber-300/40 animate-pulse' 
                        : isRoseTheme ? 'text-slate-400' : 'text-zinc-500'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-bold font-mono tracking-tight ${isRoseTheme ? 'text-slate-800' : 'text-white'}`}>
                        {currentStreakCount}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider gold-gradient-bg text-zinc-950 px-2 py-0.5 rounded-md shadow-sm">
                        Dias
                      </span>
                    </div>
                    <div className={`text-[11px] mt-0.5 ${isRoseTheme ? 'text-slate-500' : 'text-zinc-400'}`}>
                      {streakData.total === 0 ? 'Sem metas ativas' : `${streakData.rate}% concluído (${streakData.count}/${streakData.total})`}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="glow-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold ${isRoseTheme ? 'text-slate-700' : 'text-zinc-200'}`}>Hidratação</span>
                  <div className={`p-1.5 rounded-lg border ${
                    isRoseTheme ? 'bg-sky-100 text-sky-600 border-sky-200' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                  }`}>
                    <Droplets className="w-4 h-4" />
                  </div>
                </div>
                <div className={`text-2xl font-bold font-mono tracking-tight ${isRoseTheme ? 'text-slate-900' : 'text-white'}`}>
                  {currentWater} <span className={`text-xs font-sans font-normal ${isRoseTheme ? 'text-slate-500' : 'text-zinc-400'}`}>/ 2500ml</span>
                </div>
                <div className={`w-full rounded-full h-1.5 my-3 overflow-hidden ${isRoseTheme ? 'bg-slate-100 border border-slate-200' : 'bg-white/[0.06]'}`}>
                  <div 
                    className="bg-gradient-to-r from-sky-400 to-sky-300 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (currentWater / 2500) * 100)}%` }} 
                  />
                </div>
                <button
                  onClick={handleQuickAddWater}
                  className={`w-full py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    isRoseTheme 
                      ? 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200' 
                      : 'bg-white/[0.05] hover:bg-amber-400/15 text-white hover:text-amber-200 border-white/10 hover:border-amber-400/30'
                  }`}
                >
                  <Plus className={`w-3.5 h-3.5 ${isRoseTheme ? 'text-pink-600' : 'text-amber-300'}`} /> 200 ml
                </button>
              </motion.div>

              <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="glow-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold ${isRoseTheme ? 'text-slate-700' : 'text-zinc-200'}`}>Sono</span>
                  <div className={`p-1.5 rounded-lg border ${
                    isRoseTheme ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                  }`}>
                    <Moon className="w-4 h-4" />
                  </div>
                </div>
                <div className={`text-2xl font-bold font-mono tracking-tight ${isRoseTheme ? 'text-slate-900' : 'text-white'}`}>
                  {todayLog?.sleep_hours ? `${todayLog.sleep_hours}h` : '—'}
                </div>
                <div className={`text-xs mt-2 flex items-center gap-1 ${isRoseTheme ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Qualidade: <strong className={`font-mono font-bold ${isRoseTheme ? 'text-purple-700' : 'text-amber-200'}`}>
                    {todayLog?.sleep_quality ? `${todayLog.sleep_quality}/10` : '—'}
                  </strong>
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="glow-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold ${isRoseTheme ? 'text-slate-700' : 'text-zinc-200'}`}>Treino</span>
                  <div className={`p-1.5 rounded-lg border ${
                    isRoseTheme ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-amber-400/10 text-amber-300 border-amber-400/20'
                  }`}>
                    <Dumbbell className="w-4 h-4" />
                  </div>
                </div>
                <div className={`text-2xl font-bold font-mono tracking-tight ${isRoseTheme ? 'text-slate-900' : 'text-white'}`}>
                  {todayLog?.workout_hours ? `${todayLog.workout_hours}h` : '—'}
                </div>
                <div className={`text-xs mt-2 ${isRoseTheme ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Pista / Ginásio
                </div>
              </motion.div>

              <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="glow-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold ${isRoseTheme ? 'text-slate-700' : 'text-zinc-200'}`}>Estudo</span>
                  <div className={`p-1.5 rounded-lg border ${
                    isRoseTheme ? 'bg-pink-100 text-pink-600 border-pink-200' : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                  }`}>
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className={`text-2xl font-bold font-mono tracking-tight ${isRoseTheme ? 'text-slate-900' : 'text-white'}`}>
                  {todayLog?.study_hours ? `${todayLog.study_hours}h` : '—'}
                </div>
                <div className={`text-xs mt-2 ${isRoseTheme ? 'text-slate-500' : 'text-zinc-400'}`}>
                  Horas dedicadas
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glow-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className={`w-4 h-4 ${isRoseTheme ? 'text-pink-600' : 'text-amber-300'}`} />
                    <h3 className={`text-sm font-bold tracking-tight ${isRoseTheme ? 'text-slate-800' : 'text-white'}`}>
                      Último Treino / Treino de Hoje
                    </h3>
                  </div>
                  {todayWorkout && (
                    <span className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                      isRoseTheme ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                    }`}>
                      {todayWorkout.workout_type}
                    </span>
                  )}
                </div>
                {todayWorkout ? (
                  <div className={`p-4 rounded-xl border space-y-1 ${
                    isRoseTheme ? 'bg-pink-50/50 border-pink-100' : 'bg-black/40 border-white/[0.06]'
                  }`}>
                    <div className={`text-sm font-bold ${isRoseTheme ? 'text-slate-800' : 'text-zinc-100'}`}>{todayWorkout.title}</div>
                    <div className={`text-xs font-mono ${isRoseTheme ? 'text-slate-500' : 'text-zinc-400'}`}>
                      {todayWorkout.date} {todayWorkout.target_pace && `• Pace: ${todayWorkout.target_pace}`}
                    </div>
                  </div>
                ) : (
                  <div className={`text-xs p-4 rounded-xl border ${
                    isRoseTheme ? 'text-slate-500 bg-slate-50 border-slate-100' : 'text-zinc-400 bg-black/20 border-white/[0.04]'
                  }`}>
                    Sem treinos registados. Adiciona na aba Desporto.
                  </div>
                )}
              </div>

              <div className="glow-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className={`w-4 h-4 ${isRoseTheme ? 'text-amber-600' : 'text-sky-400'}`} />
                    <h3 className={`text-sm font-bold tracking-tight ${isRoseTheme ? 'text-slate-800' : 'text-white'}`}>
                      Próximo Deadline Académico
                    </h3>
                  </div>
                  <span className={`text-xs ${isRoseTheme ? 'text-slate-500' : 'text-zinc-400'}`}>
                    Média: <strong className={`font-mono font-bold ${isRoseTheme ? 'text-pink-600' : 'text-amber-300'}`}>{globalAvg}</strong>
                  </span>
                </div>
                {nextDeadline ? (
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${
                    isRoseTheme ? 'bg-amber-50/50 border-amber-100' : 'bg-black/40 border-white/[0.06]'
                  }`}>
                    <div>
                      <div className={`text-xs font-bold ${isRoseTheme ? 'text-slate-800' : 'text-zinc-100'}`}>{nextDeadline.title}</div>
                      <div className={`text-[11px] font-mono mt-0.5 ${isRoseTheme ? 'text-slate-500' : 'text-zinc-400'}`}>
                        {new Date(nextDeadline.deadline_date).toLocaleDateString('pt-PT')}
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      isRoseTheme ? 'text-amber-700 bg-amber-100 border-amber-200' : 'text-amber-300 bg-amber-500/10 border-amber-500/30'
                    }`}>
                      {nextDeadline.type}
                    </span>
                  </div>
                ) : (
                  <div className={`text-xs p-4 rounded-xl border ${
                    isRoseTheme ? 'text-slate-500 bg-slate-50 border-slate-100' : 'text-zinc-400 bg-black/20 border-white/[0.04]'
                  }`}>
                    Nenhum exame pendente no calendário.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Rotas dos Módulos */}
        {activeTab === 'athletics' && <AthleticsView userId={session.user.id} />}
        {activeTab === 'university' && <UniversityView userId={session.user.id} isRoseTheme={isRoseTheme} />}
        {activeTab === 'life' && <LifeView userId={session.user.id} />}
        {activeTab === 'money' && <FinanceView userId={session.user.id} />}
        {activeTab === 'goals' && <GoalsView userId={session.user.id} />}
        {activeTab === 'profile' && <ProfileView userId={session.user.id} onLogout={handleLogout} />}
      </main>

      <nav className={`md:hidden fixed bottom-0 left-0 right-0 p-2 z-50 backdrop-blur-xl flex justify-around border-t ${
        isRoseTheme ? 'bg-white/95 border-pink-200 shadow-lg' : 'bg-[#0d0e12]/95 border-amber-500/20'
      }`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`p-2 flex flex-col items-center gap-1 ${
                isActive 
                  ? isRoseTheme ? 'text-pink-600' : 'text-amber-300' 
                  : isRoseTheme ? 'text-slate-400' : 'text-zinc-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default App;