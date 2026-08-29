import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Droplets, Moon, Dumbbell, 
  BookOpen, Smile, Activity, Save
} from 'lucide-react';

interface LifeViewProps {
  userId: string;
}

export const LifeView: React.FC<LifeViewProps> = ({ userId }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Métricas Diárias
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [waterGoal] = useState(2500); // ml
  const [moodScore, setMoodScore] = useState(8);
  const [sleepHours, setSleepHours] = useState(8.0);
  const [sleepQuality, setSleepQuality] = useState(8);
  const [workoutHours, setWorkoutHours] = useState(2.0);
  const [studyHours, setStudyHours] = useState(3.5);
  const [sorenessScore, setSorenessScore] = useState(3);
  const [notes, setNotes] = useState('');

  // Histórico para médias
  const [weekLogs, setWeekLogs] = useState<any[]>([]);

  useEffect(() => {
    loadDailyLog();
  }, [userId]);

  const loadDailyLog = async () => {
    setLoading(true);
    // Log de hoje
    const { data: todayData } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', todayStr)
      .maybeSingle();

    if (todayData) {
      setWaterGlasses(todayData.water_glasses || 0);
      setMoodScore(todayData.mood_score ?? 8);
      setSleepHours(Number(todayData.sleep_hours) || 8.0);
      setSleepQuality(todayData.sleep_quality ?? 8);
      setWorkoutHours(Number(todayData.workout_hours) || 2.0);
      setStudyHours(Number(todayData.study_hours) || 3.5);
      setSorenessScore(todayData.muscle_soreness ?? 3);
      setNotes(todayData.notes || '');
    }

    // Últimos 7 dias
    const { data: logsData } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(7);

    if (logsData) setWeekLogs(logsData);
    setLoading(false);
  };

  const handleSaveLog = async () => {
    setLoading(true);
    setSaved(false);

    const payload = {
      user_id: userId,
      log_date: todayStr,
      water_glasses: waterGlasses,
      water_ml: waterGlasses * 200,
      mood_score: moodScore,
      sleep_hours: sleepHours,
      sleep_quality: sleepQuality,
      workout_hours: workoutHours,
      study_hours: studyHours,
      muscle_soreness: sorenessScore,
      notes: notes
    };

    const { error } = await supabase
      .from('daily_logs')
      .upsert(payload, { onConflict: 'user_id, log_date' });

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      loadDailyLog();
    }
    setLoading(false);
  };

  const calcAverage = (field: string) => {
    if (weekLogs.length === 0) return '—';
    const valid = weekLogs.filter(l => l[field] !== null && l[field] !== undefined);
    if (valid.length === 0) return '—';
    const total = valid.reduce((acc, curr) => acc + Number(curr[field]), 0);
    return (total / valid.length).toFixed(1);
  };

  const currentWaterMl = waterGlasses * 200;
  const waterProgress = Math.min(100, Math.round((currentWaterMl / waterGoal) * 100));

  return (
    <div className="space-y-6">
      {/* Resumo Semanal */}
      <div className="bg-gradient-to-r from-emerald-950/30 via-zinc-900 to-zinc-900 border border-emerald-500/20 p-5 rounded-2xl">
        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">Média dos Últimos 7 Dias</h3>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block">Mood Médio</span>
            <span className="text-base font-bold text-white font-mono">{calcAverage('mood_score')}/10</span>
          </div>
          <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block">Sono Médio</span>
            <span className="text-base font-bold text-white font-mono">{calcAverage('sleep_hours')}h</span>
          </div>
          <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block">Água Média</span>
            <span className="text-base font-bold text-white font-mono">{calcAverage('water_ml')} ml</span>
          </div>
          <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block">Dor Muscular</span>
            <span className="text-base font-bold text-white font-mono">{calcAverage('muscle_soreness')}/10</span>
          </div>
          <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block">Treino Médio</span>
            <span className="text-base font-bold text-white font-mono">{calcAverage('workout_hours')}h</span>
          </div>
          <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block">Estudo Médio</span>
            <span className="text-base font-bold text-white font-mono">{calcAverage('study_hours')}h</span>
          </div>
        </div>
      </div>

      {/* Registo de Hoje */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hidratação & Copos */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-sky-400" />
              <h4 className="text-sm font-bold text-white">Hidratação</h4>
            </div>
            <span className="text-xs font-mono font-bold text-sky-400">{currentWaterMl} / {waterGoal} ml ({waterProgress}%)</span>
          </div>

          <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-sky-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${waterProgress}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {[...Array(12)].map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setWaterGlasses(i + 1 === waterGlasses ? i : i + 1)}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all ${
                  i < waterGlasses
                    ? 'bg-sky-500 text-zinc-950 scale-105 shadow-md shadow-sky-500/20'
                    : 'bg-zinc-800/60 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                💧 200ml
              </button>
            ))}
          </div>
        </div>

        {/* Mood & Recuperação */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smile className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-bold text-white">Estado de Espírito (Mood)</h4>
            </div>
            <span className="text-base font-bold text-amber-400 font-mono">{moodScore}/10</span>
          </div>

          <input 
            type="range" 
            min="0" 
            max="10" 
            value={moodScore} 
            onChange={(e) => setMoodScore(parseInt(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400" />
              <h4 className="text-sm font-bold text-white">Dor Muscular</h4>
            </div>
            <span className="text-base font-bold text-rose-400 font-mono">{sorenessScore}/10</span>
          </div>

          <input 
            type="range" 
            min="0" 
            max="10" 
            value={sorenessScore} 
            onChange={(e) => setSorenessScore(parseInt(e.target.value))}
            className="w-full accent-rose-400 cursor-pointer"
          />
        </div>

        {/* Horas de Sono */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm font-bold text-white">Sono & Descanso</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Horas Dormidas</label>
              <input 
                type="number" 
                step="0.5" 
                value={sleepHours} 
                onChange={(e) => setSleepHours(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Qualidade (0-10)</label>
              <input 
                type="number" 
                min="0" 
                max="10" 
                value={sleepQuality} 
                onChange={(e) => setSleepQuality(parseInt(e.target.value) || 0)}
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Carga Diária: Treino e Estudo */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Cargas Diárias (Horas)</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Treino Feito (h)</label>
              <input 
                type="number" 
                step="0.25" 
                value={workoutHours} 
                onChange={(e) => setWorkoutHours(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Estudo Feito (h)</label>
              <input 
                type="number" 
                step="0.25" 
                value={studyHours} 
                onChange={(e) => setStudyHours(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botão de Guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveLog}
          disabled={loading}
          className="py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'A guardar...' : saved ? '✓ Registado com Sucesso!' : 'Guardar Dados de Hoje'}
        </button>
      </div>
    </div>
  );
};