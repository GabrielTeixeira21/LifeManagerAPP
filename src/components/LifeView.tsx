import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Droplets, Moon, Dumbbell, 
  Smile, Activity, Save, Plus, Minus, Scale, Trash2, Ruler, RotateCcw, Sparkles, Quote, ChevronLeft, ChevronRight
} from 'lucide-react';

interface LifeViewProps {
  userId: string;
}

interface WeightLog {
  id: string;
  weight_kg: number;
  date: string;
}

export const LifeView: React.FC<LifeViewProps> = ({ userId }) => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [loading, setLoading] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Hidratação
  const [waterMl, setWaterMl] = useState<number>(0);
  const [waterGoal, setWaterGoal] = useState<number>(2500);
  const [customMl, setCustomMl] = useState<string>('');

  // Bem-estar e Cargas
  const [moodScore, setMoodScore] = useState<number>(5);
  const [sleepHours, setSleepHours] = useState<string>('');
  const [sleepQuality, setSleepQuality] = useState<string>('');
  const [workoutHours, setWorkoutHours] = useState<string>('');
  const [studyHours, setStudyHours] = useState<string>('');
  const [sorenessScore, setSorenessScore] = useState<number>(0);

  // Altura & Pesagens
  const [heightCm, setHeightCm] = useState<string>('180');
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [newWeight, setNewWeight] = useState<string>('');
  const [weightDate, setWeightDate] = useState<string>(todayStr);

  // Máquina do Tempo (Semanas de Segunda a Domingo)
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [weekLogs, setWeekLogs] = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      loadLifeData();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadWeekLogs(weekOffset);
    }
  }, [userId, weekOffset]);

  const loadLifeData = async () => {
    try {
      setLoading(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('height_cm')
        .eq('id', userId)
        .maybeSingle();

      if (profile && profile.height_cm) {
        setHeightCm(String(profile.height_cm));
      }

      const { data: todayData } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', todayStr)
        .maybeSingle();

      if (todayData) {
        setWaterMl(Number(todayData.water_ml) || 0);
        setMoodScore(Number(todayData.mood_score) || 5);
        setSleepHours(todayData.sleep_hours !== null && todayData.sleep_hours !== undefined ? String(todayData.sleep_hours) : '');
        setSleepQuality(todayData.sleep_quality !== null && todayData.sleep_quality !== undefined ? String(todayData.sleep_quality) : '');
        setWorkoutHours(todayData.workout_hours !== null && todayData.workout_hours !== undefined ? String(todayData.workout_hours) : '');
        setStudyHours(todayData.study_hours !== null && todayData.study_hours !== undefined ? String(todayData.study_hours) : '');
        setSorenessScore(Number(todayData.muscle_soreness) || 0);
      }

      const { data: wData } = await supabase
        .from('body_weight_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });
      if (wData) setWeightLogs(wData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // CÁLCULO RIGOROSO: SEMANA DE SEGUNDA-FEIRA A DOMINGO
  // =========================================================================
  const getDatesForOffset = (offset: number) => {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    
    // Distância até à Segunda-feira desta semana
    const distToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

    // Segunda-feira da semana avaliada
    const startMonday = new Date(now);
    startMonday.setDate(now.getDate() - distToMonday - (offset * 7));
    startMonday.setHours(0, 0, 0, 0);

    // Domingo da semana avaliada
    const endSunday = new Date(startMonday);
    endSunday.setDate(startMonday.getDate() + 6);
    endSunday.setHours(23, 59, 59, 999);

    return { start: startMonday, end: endSunday };
  };

  const loadWeekLogs = async (offset: number) => {
    const { start, end } = getDatesForOffset(offset);
    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];

    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', startDateStr)
      .lte('log_date', endDateStr)
      .order('log_date', { ascending: false });
    
    setWeekLogs(data || []);
  };

  const formatDateRange = (offset: number) => {
    const { start, end } = getDatesForOffset(offset);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `Seg, ${start.toLocaleDateString('pt-PT', opts)} — Dom, ${end.toLocaleDateString('pt-PT', opts)}`;
  };

  const handleUpdateWater = async (newAmount: number) => {
    setWaterMl(newAmount); 

    const parsedSleep = sleepHours.trim() !== '' ? parseFloat(sleepHours.replace(',', '.')) : null;
    const parsedQuality = sleepQuality.trim() !== '' ? parseInt(sleepQuality, 10) : null;
    const parsedWorkout = workoutHours.trim() !== '' ? parseFloat(workoutHours.replace(',', '.')) : null;
    const parsedStudy = studyHours.trim() !== '' ? parseFloat(studyHours.replace(',', '.')) : null;

    const payload = {
      user_id: userId,
      log_date: todayStr,
      water_ml: newAmount,
      mood_score: Number(moodScore) || 0,
      sleep_hours: parsedSleep && !isNaN(parsedSleep) ? parsedSleep : null,
      sleep_quality: parsedQuality && !isNaN(parsedQuality) ? parsedQuality : null,
      workout_hours: parsedWorkout && !isNaN(parsedWorkout) ? parsedWorkout : null,
      study_hours: parsedStudy && !isNaN(parsedStudy) ? parsedStudy : null,
      muscle_soreness: Number(sorenessScore) || 0
    };

    await supabase.from('daily_logs').upsert(payload, { onConflict: 'user_id, log_date' });
    if (weekOffset === 0) loadWeekLogs(0);
  };

  const handleSaveLog = async () => {
    try {
      setLoading(true);
      setSaved(false);
      setErrorMessage('');

      const parsedSleep = sleepHours.trim() !== '' ? parseFloat(sleepHours.replace(',', '.')) : null;
      const parsedQuality = sleepQuality.trim() !== '' ? parseInt(sleepQuality, 10) : null;
      const parsedWorkout = workoutHours.trim() !== '' ? parseFloat(workoutHours.replace(',', '.')) : null;
      const parsedStudy = studyHours.trim() !== '' ? parseFloat(studyHours.replace(',', '.')) : null;

      const payload = {
        user_id: userId,
        log_date: todayStr,
        water_ml: Number(waterMl) || 0,
        mood_score: Number(moodScore) || 0,
        sleep_hours: parsedSleep && !isNaN(parsedSleep) ? parsedSleep : null,
        sleep_quality: parsedQuality && !isNaN(parsedQuality) ? parsedQuality : null,
        workout_hours: parsedWorkout && !isNaN(parsedWorkout) ? parsedWorkout : null,
        study_hours: parsedStudy && !isNaN(parsedStudy) ? parsedStudy : null,
        muscle_soreness: Number(sorenessScore) || 0
      };

      const { error } = await supabase
        .from('daily_logs')
        .upsert(payload, { onConflict: 'user_id, log_date' });

      if (error) {
        console.error('Erro ao guardar:', error);
        setErrorMessage(error.message);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        if (weekOffset === 0) loadWeekLogs(0);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDefaults = () => {
    setWaterMl(0);
    setCustomMl('');
    setMoodScore(5);
    setSleepHours('');
    setSleepQuality('');
    setWorkoutHours('');
    setStudyHours('');
    setSorenessScore(0);
    setErrorMessage('');
  };

  const handleDeleteTodayLog = async () => {
    try {
      setLoading(true);
      await supabase
        .from('daily_logs')
        .delete()
        .eq('user_id', userId)
        .eq('log_date', todayStr);
      
      handleResetDefaults();
      if (weekOffset === 0) loadWeekLogs(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHeight = async (val: string) => {
    setHeightCm(val);
    const num = parseFloat(val.replace(',', '.'));
    if (!isNaN(num) && num > 50) {
      await supabase.from('profiles').upsert({ id: userId, height_cm: num });
    }
  };

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const wVal = parseFloat(newWeight.replace(',', '.'));
    if (isNaN(wVal) || !weightDate) return;

    const { error } = await supabase.from('body_weight_logs').insert({
      user_id: userId,
      weight_kg: wVal,
      date: weightDate
    });

    if (!error) {
      setNewWeight('');
      loadLifeData();
    }
  };

  const handleDeleteWeight = async (id: string) => {
    await supabase.from('body_weight_logs').delete().eq('id', id);
    loadLifeData();
  };

  const applyCustomMl = (isAdd: boolean) => {
    const amount = parseInt(customMl, 10) || 0;
    if (amount <= 0) return;
    
    const newAmount = isAdd ? waterMl + amount : Math.max(0, waterMl - amount);
    handleUpdateWater(newAmount);
    setCustomMl('');
  };

  // Funções Utilitárias para o Sumário Inteligente
  const getNumericAverage = (field: string) => {
    if (!weekLogs || weekLogs.length === 0) return 0;
    const valid = weekLogs.filter(l => l && l[field] !== null && l[field] !== undefined && !isNaN(Number(l[field])));
    if (valid.length === 0) return 0;
    const total = valid.reduce((acc, curr) => acc + Number(curr[field]), 0);
    return total / valid.length;
  };

  const getTotal = (field: string) => {
    if (!weekLogs || weekLogs.length === 0) return 0;
    return weekLogs.reduce((acc, curr) => acc + (Number(curr[field]) || 0), 0);
  };

  const calcAverage = (field: string) => {
    const avg = getNumericAverage(field);
    return avg > 0 ? avg.toFixed(1) : '—';
  };

  // ========================================================
  // LÓGICA DO MENTOR INTELIGENTE
  // ========================================================
  const getWeeklyInsight = () => {
    if (weekLogs.length === 0) return null;

    const avgWater = getNumericAverage('water_ml');
    const avgSleep = getNumericAverage('sleep_hours');
    const avgMood = getNumericAverage('mood_score');
    const totalWorkout = getTotal('workout_hours');
    const totalStudy = getTotal('study_hours');

    let title = "Balanço Neutro ⚖️";
    let text = "Semana constante. Lembra-te que consistência não significa perfeição, mas sim não desistir nos dias difíceis.";
    let colorClass = "from-zinc-800 to-zinc-900 border-zinc-700";
    let textColor = "text-amber-400";
    let iconColor = "text-amber-400";

    if (weekLogs.length < 3) {
      title = weekOffset > 0 ? "Poucos Registos 👻" : "Semana a Começar 🧱";
      text = weekOffset > 0 
        ? `Tiveste apenas ${weekLogs.length} dia(s) registado(s) nesta semana. Continua a registar para obteres análises fiáveis!` 
        : `Tens ${weekLogs.length} dia(s) apontado(s) esta semana. Continua a registar diariamente!`;
      colorClass = "from-zinc-800 to-zinc-900 border-zinc-700";
      textColor = "text-zinc-300";
      iconColor = "text-emerald-400";
    } 
    else if (avgSleep > 0 && avgSleep < 6.5) {
      title = "Atenção ao Sono 🔋";
      text = `Média de sono em ${avgSleep.toFixed(1)}h. O teu rendimento na pista e na faculdade depende diretamente de recuperares o sistema nervoso central. Prioriza a cama!`;
      colorClass = "from-rose-950/40 to-zinc-900 border-rose-500/30";
      textColor = "text-rose-400";
      iconColor = "text-rose-500";
    } 
    else if (avgWater < (waterGoal * 0.6)) {
      title = "Alerta Hidratação 💧";
      text = `Média de ${avgWater.toFixed(0)}ml/dia. Estás muito abaixo do teu objetivo de hidratação. Manter o corpo hidratado previne cãibras e lesões.`;
      colorClass = "from-sky-950/40 to-zinc-900 border-sky-500/30";
      textColor = "text-sky-400";
      iconColor = "text-sky-500";
    } 
    else if (totalWorkout >= 8) {
      title = "Semana de Campeão 🚀";
      text = `Acumulaste ${totalWorkout.toFixed(1)}h de treino! O volume e a dedicação física estão num nível excelente. Cuida da flexibilidade e da alimentação.`;
      colorClass = "from-emerald-950/40 to-zinc-900 border-emerald-500/30";
      textColor = "text-emerald-400";
      iconColor = "text-emerald-500";
    } 
    else if (totalStudy >= 15) {
      title = "Modo Engenharia On 📚";
      text = `Grande dedicação aos estudos (${totalStudy.toFixed(1)}h)! Mantém a mente focada nos teus objetivos académicos sem esquecer de respirar fundo.`;
      colorClass = "from-indigo-950/40 to-zinc-900 border-indigo-500/30";
      textColor = "text-indigo-400";
      iconColor = "text-indigo-500";
    } 
    else if (weekLogs.length >= 5 && avgMood >= 7.5 && avgSleep >= 7 && avgWater >= (waterGoal * 0.8)) {
      title = "Semana de Ouro! 🌟";
      text = "Ritmo perfeito: bom sono, excelente hidratação e boa disposição. Estás a construir a tua melhor versão!";
      colorClass = "from-amber-950/40 to-zinc-900 border-amber-500/30";
      textColor = "text-amber-400";
      iconColor = "text-amber-500";
    }

    return { title, text, colorClass, textColor, iconColor };
  };

  const insight = getWeeklyInsight();

  const quotes = [
    "A disciplina é a ponte entre os teus objetivos e as tuas conquistas.",
    "O suor de hoje é a vitória de amanhã. Mantém o foco.",
    "Não é sobre ter tempo, é sobre criar tempo para o que importa.",
    "Consistência supera a intensidade ocasional. Um dia de cada vez.",
    "O descanso também faz parte do treino. Ouve o teu corpo.",
    "Bate o teu próprio recorde. O único adversário és tu mesmo.",
    "Pequenos progressos diários levam a resultados massivos."
  ];
  const dailyQuote = quotes[new Date().getDay() % quotes.length];

  const validGoal = Number(waterGoal) > 0 ? Number(waterGoal) : 2500;
  const currentWater = Number(waterMl) || 0;
  const waterProgress = Math.min(100, Math.max(0, Math.round((currentWater / validGoal) * 100)));

  const latestWeight = weightLogs && weightLogs.length > 0 ? Number(weightLogs[weightLogs.length - 1].weight_kg) : null;
  const heightMeters = parseFloat(heightCm) && parseFloat(heightCm) > 0 ? parseFloat(heightCm) / 100 : null;

  const currentIMC = (latestWeight && heightMeters && heightMeters > 0 && !isNaN(latestWeight)) 
    ? (latestWeight / (heightMeters * heightMeters)).toFixed(1) 
    : null;

  const getIMCStatus = (imc: number) => {
    if (isNaN(imc)) return null;
    if (imc < 18.5) return { label: 'Abaixo do peso', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    if (imc <= 24.9) return { label: 'Peso Saudável / Ideal', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (imc <= 29.9) return { label: 'Sobrepeso / Massa Elevada', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' };
    return { label: 'Obesidade', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  };

  const imcStatus = currentIMC ? getIMCStatus(parseFloat(currentIMC)) : null;

  const renderWeightChart = () => {
    if (!weightLogs || weightLogs.length < 2) {
      return (
        <div className="h-36 flex items-center justify-center text-xs text-zinc-500 italic">
          Regista pelo menos 2 pesagens para ver a linha temporal.
        </div>
      );
    }

    const weights = weightLogs.map(w => Number(w.weight_kg)).filter(n => !isNaN(n));
    if (weights.length < 2) return null;

    const minW = Math.min(...weights) - 0.5;
    const maxW = Math.max(...weights) + 0.5;
    const range = maxW - minW || 1;

    const svgWidth = 560;
    const svgHeight = 150;
    const paddingX = 35;
    const paddingTop = 25;
    const paddingBottom = 35;

    const points = weightLogs.map((w, idx) => {
      const val = Number(w.weight_kg) || minW;
      const x = paddingX + (idx / (weightLogs.length - 1)) * (svgWidth - paddingX * 2);
      const y = paddingTop + (1 - (val - minW) / range) * (svgHeight - paddingTop - paddingBottom);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-36 overflow-visible">
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {weightLogs.map((w, idx) => {
            const val = Number(w.weight_kg) || minW;
            const x = paddingX + (idx / (weightLogs.length - 1)) * (svgWidth - paddingX * 2);
            const y = paddingTop + (1 - (val - minW) / range) * (svgHeight - paddingTop - paddingBottom);
            const displayDate = w.date ? String(w.date).slice(5) : '';

            return (
              <g key={w.id || idx}>
                <line x1={x} y1={y} x2={x} y2={svgHeight - paddingBottom + 5} stroke="#27272a" strokeDasharray="3 3" />
                <circle cx={x} cy={y} r="4.5" fill="#10b981" stroke="#09090b" strokeWidth="1.5" />
                <text x={x} y={y - 8} fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {w.weight_kg}kg
                </text>
                <text x={x} y={svgHeight - 10} fill="#71717a" fontSize="9" textAnchor="middle" fontFamily="monospace">
                  {displayDate}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* NAVEGAÇÃO DA MÁQUINA DO TEMPO (SEGUNDA A DOMINGO) */}
      <div className="flex items-center justify-between bg-zinc-900/90 border border-zinc-800 p-2.5 rounded-2xl shadow-sm">
        <button 
          onClick={() => setWeekOffset(prev => prev + 1)}
          className="p-2.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors cursor-pointer border border-zinc-700/50"
          title="Ver semana anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-white uppercase tracking-widest mb-0.5">
            {weekOffset === 0 ? 'Esta Semana' : `${weekOffset} Semana${weekOffset > 1 ? 's' : ''} Atrás`}
          </span>
          <span className="text-[10px] text-emerald-400 font-mono font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
            {formatDateRange(weekOffset)}
          </span>
        </div>

        <button 
          onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
          disabled={weekOffset === 0}
          className={`p-2.5 rounded-xl transition-colors border ${
            weekOffset === 0 
            ? 'opacity-30 cursor-not-allowed border-transparent text-zinc-600' 
            : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700/50 cursor-pointer'
          }`}
          title="Ver semana seguinte"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* MENTOR INTELIGENTE */}
      {insight && (
        <div className={`bg-gradient-to-br ${insight.colorClass} border p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden transition-all`}>
          <div className="flex items-center gap-2 relative z-10">
            <Sparkles className={`w-5 h-5 ${insight.iconColor}`} />
            <h3 className={`text-sm font-extrabold uppercase tracking-wider ${insight.textColor}`}>
              {insight.title}
            </h3>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed relative z-10">
            {insight.text}
          </p>
          {weekOffset === 0 && (
            <div className="flex items-center gap-2 mt-2 pt-3 border-t border-white/5 relative z-10">
              <Quote className="w-3.5 h-3.5 text-white/30" />
              <span className="text-[11px] text-white/50 italic">{dailyQuote}</span>
            </div>
          )}
        </div>
      )}

      {/* Médias da Semana Selecionada */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-900 border border-zinc-800 p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Médias da Semana</h3>
          <span className="text-[10px] text-zinc-500 font-mono">{weekLogs.length} dia(s) com registo</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 block">Mood</span>
            <span className="text-base font-bold text-white font-mono">{calcAverage('mood_score')}/10</span>
          </div>
          <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 block">Sono</span>
            <span className="text-base font-bold text-white font-mono">{calcAverage('sleep_hours')}h</span>
          </div>
          <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 block">Água</span>
            <span className="text-base font-bold text-white font-mono">{calcAverage('water_ml')} ml</span>
          </div>
          <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 block">Dor Musc.</span>
            <span className="text-base font-bold text-white font-mono">{calcAverage('muscle_soreness')}/10</span>
          </div>
          <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 block">Treino</span>
            <span className="text-base font-bold text-white font-mono">{calcAverage('workout_hours')}h</span>
          </div>
          <div className="bg-zinc-800/40 p-3 rounded-xl border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 block">Estudo</span>
            <span className="text-base font-bold text-white font-mono">{calcAverage('study_hours')}h</span>
          </div>
        </div>
      </div>

      {/* Formulário diário para a semana atual */}
      {weekOffset === 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hidratação */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-sky-400" />
                  <h4 className="text-sm font-bold text-white">Hidratação (Hoje)</h4>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <input
                    type="text"
                    value={waterMl}
                    onChange={(e) => setWaterMl(parseInt(e.target.value, 10) || 0)}
                    onBlur={(e) => handleUpdateWater(parseInt(e.target.value, 10) || 0)}
                    className="w-16 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-right font-mono font-bold text-sky-400"
                  />
                  <span>/</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={waterGoal}
                      onChange={(e) => setWaterGoal(parseInt(e.target.value, 10) || 2500)}
                      className="w-16 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-right font-mono text-zinc-200"
                      title="Clica para mudar a meta diária"
                    />
                    <span>ml</span>
                  </div>
                </div>
              </div>

              <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full transition-all" style={{ width: `${waterProgress}%` }} />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateWater(Math.max(0, waterMl - 200))}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" /> 200 ml
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateWater(waterMl + 200)}
                  className="flex-1 py-2.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> 200 ml
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                <input
                  type="text"
                  placeholder="Qtd (ex: 350)"
                  value={customMl}
                  onChange={(e) => setCustomMl(e.target.value)}
                  className="w-32 bg-zinc-800/60 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => applyCustomMl(false)}
                  className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  - Personaliz.
                </button>
                <button
                  type="button"
                  onClick={() => applyCustomMl(true)}
                  className="py-2 px-3 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  + Personaliz.
                </button>
              </div>
            </div>

            {/* Mood & Dor Muscular */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smile className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">Mood (Hoje)</h4>
                </div>
                <span className="text-base font-bold text-amber-400 font-mono">{moodScore}/10</span>
              </div>

              <input 
                type="range" 
                min="0" 
                max="10" 
                value={moodScore} 
                onChange={(e) => setMoodScore(parseInt(e.target.value, 10) || 0)}
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
                onChange={(e) => setSorenessScore(parseInt(e.target.value, 10) || 0)}
                className="w-full accent-rose-400 cursor-pointer"
              />
            </div>

            {/* Sono */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">Sono (Noite Passada)</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Horas Dormidas</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 8.5"
                    value={sleepHours} 
                    onChange={(e) => setSleepHours(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Qualidade (0-10)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 8"
                    value={sleepQuality} 
                    onChange={(e) => setSleepQuality(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Cargas do Dia */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Cargas do Dia (Horas)</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Treino Feito (h)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 2.0"
                    value={workoutHours} 
                    onChange={(e) => setWorkoutHours(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Estudo Feito (h)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 3.5"
                    value={studyHours} 
                    onChange={(e) => setStudyHours(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex-1 sm:flex-none py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                title="Limpar campos do ecrã"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Repor Valores
              </button>
              <button
                type="button"
                onClick={handleDeleteTodayLog}
                className="flex-1 sm:flex-none py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                title="Limpar registo de hoje da base de dados"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpar Registo de Hoje
              </button>
            </div>

            <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
              {errorMessage && (
                <span className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
                  Erro: {errorMessage}
                </span>
              )}
              <button
                onClick={handleSaveLog}
                disabled={loading}
                className="w-full sm:w-auto py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'A guardar...' : saved ? '✓ Registado com Sucesso!' : 'Guardar Dados de Hoje'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Histórico Geral: Peso, Altura e IMC */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl space-y-6 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <Ruler className="w-4 h-4 text-indigo-400" /> A Tua Altura
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={heightCm}
                  onChange={(e) => handleSaveHeight(e.target.value)}
                  className="w-16 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm font-bold font-mono text-white text-right"
                />
                <span className="text-xs text-zinc-400">cm</span>
              </div>
            </div>
            <span className="text-[10px] text-zinc-500">Editável</span>
          </div>

          <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <Scale className="w-4 h-4 text-emerald-400" /> Último Peso
              </div>
              <div className="text-xl font-black text-white font-mono">
                {latestWeight ? `${latestWeight} kg` : '—'}
              </div>
            </div>
            <span className="text-[10px] text-zinc-500">{weightLogs.length} registos</span>
          </div>

          <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">IMC Calculado</span>
              {imcStatus && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${imcStatus.color}`}>
                  {imcStatus.label}
                </span>
              )}
            </div>
            <div className="text-xl font-black text-white font-mono mt-1">
              {currentIMC ? `${currentIMC}` : '—'} <span className="text-xs text-zinc-500 font-normal">kg/m²</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleAddWeight} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-800/30 p-4 rounded-xl border border-zinc-800">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Peso (kg)</label>
            <input
              type="text"
              placeholder="Ex: 72.5"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs text-white font-bold"
              required
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Data da Pesagem</label>
            <input
              type="date"
              value={weightDate}
              onChange={(e) => setWeightDate(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs text-white"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              + Registar Pesagem
            </button>
          </div>
        </form>

        <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-zinc-400">Curva de Tendência com Datas</span>
            <span className="text-[10px] text-zinc-500 font-mono">Valores em kg e datas (Mês-Dia)</span>
          </div>
          {renderWeightChart()}
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Histórico de Pesagens</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {weightLogs.slice(-8).reverse().map((w, idx) => (
              <div key={w.id || idx} className="p-3 bg-zinc-800/40 border border-zinc-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold font-mono text-white">{w.weight_kg} kg</div>
                  <div className="text-[10px] text-zinc-400">{w.date}</div>
                </div>
                <button
                  onClick={() => handleDeleteWeight(w.id)}
                  className="text-zinc-600 hover:text-red-400 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>F
    </div>
  );
};