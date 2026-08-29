import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Target, Plus, CheckCircle2, Circle, 
  Flame, Trash2, Trophy, Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GoalsViewProps {
  userId: string;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ userId }) => {
  const [goals, setGoals] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'atletismo' | 'universidade' | 'pessoal'>('atletismo');

  useEffect(() => {
    loadGoals();
  }, [userId]);

  const loadGoals = async () => {
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setGoals(data);
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const { error } = await supabase.from('goals').insert({
      user_id: userId,
      title: newTitle,
      category: newCategory,
      completed: false
    });

    if (!error) {
      setNewTitle('');
      loadGoals();
    }
  };

  const handleToggleGoal = async (goal: any) => {
    const nextState = !goal.completed;
    
    // Se completou, lança microinteração de confetes
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

    loadGoals();
  };

  const handleDeleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    loadGoals();
  };

  // Cálculo da Chama / Streak 85%
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.completed).length;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  const streakAchieved = completionRate >= 85;

  return (
    <div className="space-y-6">
      {/* Banner de Streak Diário */}
      <div className={`p-6 rounded-2xl border transition-all ${
        streakAchieved 
          ? 'bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border-amber-500/40' 
          : 'bg-zinc-900/80 border-zinc-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${streakAchieved ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-500'}`}>
              <Flame className={`w-8 h-8 ${streakAchieved ? 'animate-bounce text-amber-400' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Chama do Dia (Regra dos 85%)</h3>
                {streakAchieved && (
                  <span className="text-[10px] bg-amber-500 text-zinc-950 font-black px-2 py-0.5 rounded-full uppercase">
                    CHAMA ATIVA 🔥
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {streakAchieved 
                  ? 'Fantástico! Ultrapassaste os 85% de objetivos hoje.' 
                  : `Completa mais ${Math.max(0, Math.ceil(totalGoals * 0.85) - completedGoals)} objetivo(s) para acender a chama hoje.`}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black font-mono text-white">{completionRate}%</div>
            <span className="text-[11px] text-zinc-400">{completedGoals} de {totalGoals} feitos</span>
          </div>
        </div>

        <div className="w-full bg-zinc-800 rounded-full h-2 mt-4 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${streakAchieved ? 'bg-amber-400' : 'bg-emerald-500'}`}
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Adicionar Objetivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleAddGoal} className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-4 h-fit">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" /> Novo Objetivo
          </h3>

          <input
            type="text"
            placeholder="Ex: Treinar 5x esta semana, Ler 20 pág."
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

        {/* Lista de Objetivos por Categoria */}
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