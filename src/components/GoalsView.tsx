import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, CheckCircle2, Circle, 
  Flame, Trash2, Crown, Zap, Sparkles, HeartPulse 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GoalsViewProps {
  userId: string;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ userId }) => {
  const [goals, setGoals] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'atletismo' | 'universidade' | 'pessoal'>('atletismo');
  
  // Estado do Streak e Vidas lidos diretamente do Supabase
  const [streakDays, setStreakDays] = useState(0);
  const [chargesLeft, setChargesLeft] = useState(5);

  useEffect(() => {
    loadGoalsAndProfile();
  }, [userId]);

  const loadGoalsAndProfile = async () => {
    // 1. Carregar Objetivos
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (goalsData) setGoals(goalsData);

    // 2. Carregar Perfil Real (Streak e Vidas)
    const { data: prof } = await supabase
      .from('profiles')
      .select('streak_days, streak_freeze_charges')
      .eq('id', userId)
      .maybeSingle();
    
    if (prof) {
      setStreakDays(prof.streak_days ?? 0);
      setChargesLeft(prof.streak_freeze_charges ?? 5);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const { error } = await supabase.from('goals').insert({
      user_id: userId,
      title: newTitle.trim(),
      category: newCategory,
      completed: false
    });

    if (!error) {
      setNewTitle('');
      loadGoalsAndProfile();
    }
  };

  const handleToggleGoal = async (goal: any) => {
    const nextState = !goal.completed;
    
    if (nextState) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 }
      });
    }

    await supabase
      .from('goals')
      .update({
        completed: nextState,
        completed_at: nextState ? new Date().toISOString() : null
      })
      .eq('id', goal.id);

    loadGoalsAndProfile();
  };

  const handleDeleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    loadGoalsAndProfile();
  };

  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.completed).length;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  const isTodayActive = completionRate >= 85;

  // Lógica dos 5 Níveis com Marcos
  const getFlameLevel = (days: number) => {
    if (days >= 365) {
      return {
        title: 'Chama Mítica (1 Ano)',
        badge: '👑 LENDÁRIO • 365 DIAS',
        bg: 'from-purple-950/50 via-zinc-900 to-zinc-900 border-purple-500/50 shadow-purple-500/10',
        flameColor: 'text-purple-400 fill-purple-400/20 drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]',
        barColor: 'bg-purple-500',
        textColor: 'text-purple-300',
        icon: Crown,
      };
    }
    if (days >= 180) {
      return {
        title: 'Chama de Ouro (6 Meses)',
        badge: '⚡ ELITE • 180 DIAS',
        bg: 'from-amber-950/50 via-zinc-900 to-zinc-900 border-amber-400/50 shadow-amber-400/10',
        flameColor: 'text-amber-300 fill-amber-300/20 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]',
        barColor: 'bg-amber-400',
        textColor: 'text-amber-300',
        icon: Zap,
      };
    }
    if (days >= 90) {
      return {
        title: 'Chama de Esmeralda (3 Meses)',
        badge: '💎 INQUEBRÁVEL • 90 DIAS',
        bg: 'from-emerald-950/50 via-zinc-900 to-zinc-900 border-emerald-500/50 shadow-emerald-500/10',
        flameColor: 'text-emerald-400 fill-emerald-400/20 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]',
        barColor: 'bg-emerald-500',
        textColor: 'text-emerald-300',
        icon: Sparkles,
      };
    }
    if (days >= 30) {
      return {
        title: 'Chama de Safira (1 Mês)',
        badge: '💠 CONSISTENTE • 30 DIAS',
        bg: 'from-cyan-950/50 via-zinc-900 to-zinc-900 border-cyan-500/50 shadow-cyan-500/10',
        flameColor: 'text-cyan-400 fill-cyan-400/20 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]',
        barColor: 'bg-cyan-500',
        textColor: 'text-cyan-300',
        icon: Flame,
      };
    }
    if (days >= 7) {
      return {
        title: 'Chama de Bronze (7 Dias)',
        badge: '🔥 RITMO ATIVO • 7 DIAS',
        bg: 'from-amber-950/40 via-zinc-900 to-zinc-900 border-amber-600/40 shadow-amber-600/10',
        flameColor: 'text-amber-500 fill-amber-500/20 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]',
        barColor: 'bg-amber-500',
        textColor: 'text-amber-400',
        icon: Flame,
      };
    }
    return {
      title: 'Chama Inicial',
      badge: 'FOGO INICIAL',
      bg: 'from-zinc-900 to-zinc-900/60 border-zinc-800',
      flameColor: 'text-orange-400 fill-orange-400/10',
      barColor: 'bg-orange-500',
      textColor: 'text-zinc-300',
      icon: Flame,
    };
  };

  const currentFlame = getFlameLevel(streakDays);
  const FlameIcon = currentFlame.icon;

  const milestones = [
    { label: '7 Dias', days: 7, color: 'text-amber-500 border-amber-500/30 bg-amber-500/10' },
    { label: '1 Mês', days: 30, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
    { label: '3 Meses', days: 90, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
    { label: '6 Meses', days: 180, color: 'text-amber-300 border-amber-400/30 bg-amber-400/10' },
    { label: '1 Ano', days: 365, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner Principal com Nível Real da Base de Dados */}
      <div className={`p-6 rounded-2xl border bg-gradient-to-r ${currentFlame.bg} shadow-lg transition-all`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl flex items-center justify-center">
              <FlameIcon className={`w-9 h-9 ${currentFlame.flameColor} ${isTodayActive ? 'animate-bounce' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{currentFlame.title}</h3>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${currentFlame.textColor} bg-zinc-950/60 border-current`}>
                  {currentFlame.badge}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {totalGoals === 0 
                  ? '⚠️ Cria objetivos para hoje. Sem tarefas concluídas o streak não avança.'
                  : isTodayActive 
                    ? '🔥 Atingiste mais de 85%! O teu streak de 124 dias continua ativo.' 
                    : `Completa mais ${Math.max(0, Math.ceil(totalGoals * 0.85) - completedGoals)} objetivo(s) para manter a chama acesa.`}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
            <div className="text-3xl font-black font-mono text-white tracking-tight">
              {streakDays} <span className="text-xs font-normal text-zinc-400">dias</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 px-3 py-1 rounded-xl text-xs">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-zinc-400">Vidas Restantes:</span>
              <strong className="text-emerald-400 font-mono">{chargesLeft}/5</strong>
            </div>
          </div>
        </div>

        {/* Barra de Progresso dos 85% */}
        <div className="w-full bg-zinc-950/80 rounded-full h-2.5 mt-5 overflow-hidden border border-zinc-800">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${currentFlame.barColor}`}
            style={{ width: `${completionRate}%` }}
          />
        </div>

        {/* Marcos de Evolução */}
        <div className="grid grid-cols-5 gap-2 pt-5 mt-4 border-t border-zinc-800/60">
          {milestones.map((m, idx) => {
            const unlocked = streakDays >= m.days;
            return (
              <div 
                key={idx} 
                className={`p-2 rounded-xl text-center border transition-all ${
                  unlocked ? m.color : 'bg-zinc-900/40 border-zinc-800 text-zinc-600'
                }`}
              >
                <div className="text-[10px] uppercase font-bold">{m.label}</div>
                <div className="text-[11px] font-mono font-bold mt-0.5">{unlocked ? '✓ Desbloqueado' : `${m.days}d`}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Formulário e Lista de Metas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleAddGoal} className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-4 h-fit">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" /> Novo Objetivo Diário
          </h3>

          <input
            type="text"
            placeholder="Ex: Treino de Pista, 3h de Estudo, 2.5L Água"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
            required
          />

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Categoria</label>
            <select
              value={newCategory}
              onChange={(e: any) => setNewCategory(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
            >
              <option value="atletismo">🏃 Atletismo</option>
              <option value="universidade">🎓 Faculdade</option>
              <option value="pessoal">👤 Pessoal</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Adicionar à Lista
          </button>
        </form>

        <div className="lg:col-span-2 space-y-4">
          {['atletismo', 'universidade', 'pessoal'].map(catKey => {
            const groupGoals = goals.filter(g => g.category === catKey);
            const catLabels: any = {
              atletismo: '🏃 Atletismo',
              universidade: '🎓 Faculdade',
              pessoal: '👤 Pessoal'
            };

            return (
              <div key={catKey} className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl space-y-2.5">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  {catLabels[catKey]} ({groupGoals.filter(g => g.completed).length}/{groupGoals.length})
                </h4>

                {groupGoals.length === 0 ? (
                  <span className="text-[11px] text-zinc-500 italic block">Sem objetivos nesta categoria.</span>
                ) : (
                  groupGoals.map(goal => (
                    <div 
                      key={goal.id} 
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        goal.completed 
                          ? 'bg-zinc-900/40 border-zinc-800/40 text-zinc-500 line-through' 
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-100'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleGoal(goal)}
                        className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                      >
                        {goal.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-500 shrink-0" />
                        )}
                        <span className="text-xs font-medium">{goal.title}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-zinc-600 hover:text-red-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};