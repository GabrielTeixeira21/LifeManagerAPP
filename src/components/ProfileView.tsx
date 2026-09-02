import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Trophy, Flame, Zap, Award, GraduationCap, 
  PiggyBank, CheckCircle2, User, Lock, Edit3, LogOut
} from 'lucide-react';

interface ProfileViewProps {
  userId: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  isUnlocked: boolean;
  progressText: string;
}

interface UserProfile {
  full_name?: string;
  bio?: string;
  avatar_url?: string;
}

export function ProfileView({ userId }: ProfileViewProps) {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [profile, setProfile] = useState<UserProfile>({});
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState({
    currentStreak: 0,
    bestStreak: 0,
  });

  useEffect(() => {
    if (userId) {
      loadProfileAndAchievements();
    }
  }, [userId]);

  const loadProfileAndAchievements = async () => {
    setLoading(true);
    try {
      // 1. Vai buscar o Email
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.email) setUserEmail(userData.user.email);

      // ==============================================================
      // ⚡ OTIMIZAÇÃO DE VELOCIDADE: Promise.all dispara tudo ao mesmo tempo!
      // ==============================================================
      const [
        { data: profileData },
        { data: streakData },
        { count: trackCount },
        { data: pbsData },
        { data: savingsData },
        { data: gradesData }
      ] = await Promise.all([
        supabase.from('profiles').select('full_name, bio, avatar_url').eq('id', userId).maybeSingle(),
        supabase.from('daily_streaks').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('track_workouts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('personal_bests').select('event_name, exercise, pb_category').eq('user_id', userId),
        supabase.from('savings_goals').select('current_amount, target_amount').eq('user_id', userId),
        supabase.from('academic_grades').select('score, max_score').eq('user_id', userId)
      ]);

      if (profileData) setProfile(profileData);

      // Streaks
      const currentStreak = streakData?.current_streak || 0;
      const bestStreak = Math.max(streakData?.best_streak || 0, currentStreak);
      setStats({ currentStreak, bestStreak });

      // Total de Treinos
      const totalTrackWorkouts = trackCount || 0;

      // Cálculo de PBs
      const pbCounts: Record<string, number> = {};
      let maxSameEvent = 0;

      pbsData?.forEach(item => {
        const key = (item.pb_category === 'ginasio' ? item.exercise : item.event_name)
          ?.toLowerCase()
          .trim();

        if (key) {
          pbCounts[key] = (pbCounts[key] || 0) + 1;
          if (pbCounts[key] > maxSameEvent) {
            maxSameEvent = pbCounts[key];
          }
        }
      });

      const recordesBatidos = Math.max(0, maxSameEvent - 1);

      // Poupanças
      const hasCompletedFinanceGoal = savingsData?.some(
        goal => Number(goal.current_amount) > 0 && Number(goal.current_amount) >= Number(goal.target_amount)
      ) || false;

      // Notas
      const topGrade = gradesData && gradesData.length > 0
        ? Math.max(...gradesData.map(g => (Number(g.score) / (Number(g.max_score) || 20)) * 20))
        : 0;

      // ==========================================
      // PROGRESSÕES
      // ==========================================
      let nextStreakTarget = 3;
      if (bestStreak >= 3) nextStreakTarget = 7;
      if (bestStreak >= 7) nextStreakTarget = 30;
      if (bestStreak >= 30) nextStreakTarget = 100;
      if (bestStreak >= 100) nextStreakTarget = 365;

      let nextPbTarget = 3;
      if (recordesBatidos >= 3) nextPbTarget = 4;
      if (recordesBatidos >= 4) nextPbTarget = 5;
      if (recordesBatidos >= 5) nextPbTarget = 10;
      if (recordesBatidos >= 10) nextPbTarget = 15;
      if (recordesBatidos >= 15) nextPbTarget = 20;
      if (recordesBatidos >= 20) nextPbTarget = 30;
      if (recordesBatidos >= 30) nextPbTarget = 50;

      const list: Achievement[] = [
        {
          id: 'streak_dynamic',
          title: 'Foco Inabalável',
          description: `Atinge a meta de ${nextStreakTarget} dias seguidos. Este objetivo evolui contigo!`,
          icon: Flame,
          isUnlocked: bestStreak >= nextStreakTarget && bestStreak > 0,
          progressText: `${bestStreak} / ${nextStreakTarget} dias`
        },
        {
          id: 'finance_complete',
          title: 'Mestre da Poupança',
          description: 'Atinge 100% de conclusão num dos teus objetivos financeiros.',
          icon: PiggyBank,
          isUnlocked: hasCompletedFinanceGoal,
          progressText: hasCompletedFinanceGoal ? 'Concluído' : 'Em progresso'
        },
        {
          id: 'track_10',
          title: 'Veterano da Pista',
          description: 'Regista pelo menos 10 treinos de atletismo.',
          icon: Zap,
          isUnlocked: totalTrackWorkouts >= 10,
          progressText: `${Math.min(totalTrackWorkouts, 10)} / 10 treinos`
        },
        {
          id: 'pr_dynamic',
          title: 'Quebra de Limites (RP)',
          description: `Bate o teu recorde pessoal (RP) na mesma prova ou exercício ${nextPbTarget} vezes.`,
          icon: Trophy,
          isUnlocked: recordesBatidos >= nextPbTarget && recordesBatidos > 0,
          progressText: `${recordesBatidos} / ${nextPbTarget} recordes`
        },
        {
          id: 'academic_elite',
          title: 'Estudante de Elite',
          description: 'Alcança uma nota de distinção (16 valores ou superior) numa cadeira.',
          icon: GraduationCap,
          isUnlocked: topGrade >= 16,
          progressText: topGrade >= 16 ? 'Atingido!' : `Máx: ${parseFloat(topGrade.toFixed(1))} / 16 val.`
        }
      ];

      setAchievements(list);
    } catch (err) {
      console.error('Erro ao calcular conquistas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const progressPercentage = achievements.length > 0 
    ? Math.round((unlockedCount / achievements.length) * 100) 
    : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* CABEÇALHO DO PERFIL COM BOTÕES */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl flex flex-col gap-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar do Perfil" 
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-950 border-2 border-amber-400 flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-amber-400" />
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-1">
                {profile.full_name || userEmail.split('@')[0] || 'Atleta'}
              </h2>
              <div className="text-sm text-zinc-400">
                {profile.bio ? profile.bio : 'Velocista e Barreirista | Engenharia Informatica'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors text-sm font-bold">
              <Edit3 className="w-4 h-4" /> Editar Perfil
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors text-sm font-bold">
              <Lock className="w-4 h-4" /> Alterar Password
            </button>
            <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-bold">
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </div>

      {/* SECÇÃO DE CONQUISTAS DINÂMICAS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Conquistas
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              As tuas conquistas atualizam automaticamente com base nos teus registos da app.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 px-4 py-2 rounded-xl">
            <span className="text-xs font-bold text-white">{unlockedCount}/{achievements.length}</span>
            <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-zinc-500">
            A verificar marcos e recordes alcançados...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((ach) => {
              const Icon = ach.icon;
              return (
                <div
                  key={ach.id}
                  className={`relative rounded-2xl p-4.5 border transition-all flex flex-col justify-between overflow-hidden ${
                    ach.isUnlocked
                      ? 'bg-zinc-900/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : 'bg-zinc-950/40 border-zinc-800/60 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className={`p-2.5 rounded-xl border ${
                        ach.isUnlocked
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {ach.isUnlocked ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Concluído
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" /> Bloqueado
                        </span>
                      )}
                    </div>

                    <h4 className={`text-sm font-bold mb-1.5 ${ach.isUnlocked ? 'text-white' : 'text-zinc-300'}`}>
                      {ach.title}
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {ach.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">Estado</span>
                    <span className={`font-bold ${ach.isUnlocked ? 'text-amber-400' : 'text-zinc-400'}`}>
                      {ach.progressText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}