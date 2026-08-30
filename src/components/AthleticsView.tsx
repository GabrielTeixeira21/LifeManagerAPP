import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Trophy, Plus, Dumbbell, Timer, 
  Calendar, Trash2, TrendingUp, Activity
} from 'lucide-react';

interface AthleticsViewProps {
  userId: string;
}

export const AthleticsView: React.FC<AthleticsViewProps> = ({ userId }) => {
  const [subTab, setSubTab] = useState<'track' | 'gym' | 'pbs' | 'comps'>('track');
  const [loading, setLoading] = useState(false);

  // Pista
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutType, setWorkoutType] = useState('Velocidade');
  const [targetPace, setTargetPace] = useState('');
  const [recoveryInterval, setRecoveryInterval] = useState('2min');
  // Séries vazias por padrão
  const [repsData, setRepsData] = useState<{ rep: number; dist: string; time: string }[]>([]);

  // Ginásio
  const [gymLogs, setGymLogs] = useState<any[]>([]);
  const [gymExercise, setGymExercise] = useState('');
  const [gymWeight, setGymWeight] = useState('');
  const [gymSets, setGymSets] = useState('');
  const [gymReps, setGymReps] = useState('');

  // PBs & SBs com Gráficos
  const [pbs, setPbs] = useState<any[]>([]);
  const [pbCategory, setPbCategory] = useState<'atletismo' | 'ginasio'>('atletismo');
  
  // Estados para Atletismo
  const [pbEvent, setPbEvent] = useState('400m');
  const [pbTime, setPbTime] = useState('');
  const [pbSeason, setPbSeason] = useState('2026/27');
  const [pbLocation, setPbLocation] = useState('');
  const [isPBType, setIsPBType] = useState(true);
  
  // Estados para Ginásio
  const [gymRecordExercise, setGymRecordExercise] = useState('');
  const [gymRecordWeight, setGymRecordWeight] = useState('');
  
  // Data comum para o recorde
  const [pbDate, setPbDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [selectedChartEvent, setSelectedChartEvent] = useState('400m');

  // Competições
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [compName, setCompName] = useState('');
  const [compDate, setCompDate] = useState('');
  const [compLocation, setCompLocation] = useState('');
  const [compEvents, setCompEvents] = useState('400m');
  const [compTarget, setCompTarget] = useState('');

  useEffect(() => {
    loadAthleticsData();
  }, [userId, subTab]);

  const loadAthleticsData = async () => {
    setLoading(true);
    if (subTab === 'track') {
      const { data } = await supabase
        .from('track_workouts')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (data) setWorkouts(data);
    } else if (subTab === 'gym') {
      const { data } = await supabase
        .from('gym_sets')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (data) setGymLogs(data);
    } else if (subTab === 'pbs') {
      const { data } = await supabase
        .from('personal_bests')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });
      if (data) {
        setPbs(data);
        const athletics = data.filter(d => !d.pb_category || d.pb_category === 'atletismo');
        if (athletics.length > 0 && !selectedChartEvent) {
          setSelectedChartEvent(athletics[0].event_name);
        }
      }
    } else if (subTab === 'comps') {
      const { data } = await supabase
        .from('competitions')
        .select('*')
        .eq('user_id', userId)
        .order('event_date', { ascending: true });
      if (data) setCompetitions(data);
    }
    setLoading(false);
  };

  const handleAddTrackWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutTitle) return;

    const { error } = await supabase.from('track_workouts').insert({
      user_id: userId,
      date: new Date().toISOString().split('T')[0],
      title: workoutTitle,
      workout_type: workoutType,
      target_pace: targetPace,
      recovery_interval: recoveryInterval,
      reps_data: repsData
    });

    if (!error) {
      setWorkoutTitle('');
      setTargetPace('');
      setRepsData([]); // Volta a ficar sem séries após guardar
      loadAthleticsData();
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    await supabase.from('track_workouts').delete().eq('id', id);
    loadAthleticsData();
  };

  const handleAddGymSet = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(gymWeight.replace(',', '.'));
    if (isNaN(weightNum) || !gymExercise.trim()) return;

    let exerciseId = '00000000-0000-0000-0000-000000000000';
    const { data: exData } = await supabase
      .from('gym_exercises')
      .select('id')
      .eq('user_id', userId)
      .eq('name', gymExercise.trim())
      .maybeSingle();

    if (exData) {
      exerciseId = exData.id;
    } else {
      const { data: newEx } = await supabase
        .from('gym_exercises')
        .insert({ user_id: userId, name: gymExercise.trim(), category: 'Geral' })
        .select('id')
        .single();
      if (newEx) exerciseId = newEx.id;
    }

    const { error } = await supabase.from('gym_sets').insert({
      user_id: userId,
      exercise_id: exerciseId,
      date: new Date().toISOString().split('T')[0],
      sets: gymSets ? parseInt(gymSets) : null,
      reps: gymReps ? parseInt(gymReps) : null,
      weight_kg: weightNum,
      notes: gymExercise.trim()
    });

    if (!error) {
      setGymExercise('');
      setGymWeight('');
      setGymSets('');
      setGymReps('');
      loadAthleticsData();
    }
  };

  const handleDeleteGymSet = async (id: string) => {
    await supabase.from('gym_sets').delete().eq('id', id);
    loadAthleticsData();
  };

  const handleAddPB = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pbCategory === 'atletismo') {
      const seconds = parseFloat(pbTime.replace(',', '.'));
      if (isNaN(seconds)) return;

      const { error } = await supabase.from('personal_bests').insert({
        user_id: userId,
        event_name: pbEvent.trim(),
        mark_seconds: seconds,
        mark_display: pbTime,
        is_pb: isPBType,
        season: pbSeason,
        location: pbLocation,
        date: pbDate,
        pb_category: 'atletismo'
      });

      if (!error) {
        setPbTime('');
        setPbLocation('');
        loadAthleticsData();
      }
    } else {
      const weightNum = parseFloat(gymRecordWeight.replace(',', '.'));
      if (isNaN(weightNum) || !gymRecordExercise.trim()) return;

      const { error } = await supabase.from('personal_bests').insert({
        user_id: userId,
        exercise: gymRecordExercise.trim(),
        mark_seconds: weightNum, // Guarda o peso em número
        mark_display: gymRecordWeight, // Mantém como texto para mostrar
        is_pb: true, // No ginásio assume sempre como Recorde
        date: pbDate,
        pb_category: 'ginasio'
      });

      if (!error) {
        setGymRecordExercise('');
        setGymRecordWeight('');
        loadAthleticsData();
      }
    }
  };

  const handleDeletePB = async (id: string) => {
    await supabase.from('personal_bests').delete().eq('id', id);
    loadAthleticsData();
  };

  const handleAddCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName || !compDate) return;

    const eventsArray = compEvents.split(',').map(s => s.trim()).filter(Boolean);

    const { error } = await supabase.from('competitions').insert({
      user_id: userId,
      name: compName,
      event_date: new Date(compDate).toISOString(),
      location: compLocation,
      events_registered: eventsArray,
      target_result: compTarget
    });

    if (!error) {
      setCompName('');
      setCompDate('');
      setCompLocation('');
      setCompTarget('');
      loadAthleticsData();
    }
  };

  const calculateCountdown = (targetDateStr: string) => {
    const diff = new Date(targetDateStr).getTime() - new Date().getTime();
    if (diff <= 0) return 'Concluída';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    return `⏳ ${days}d ${hours}h ${mins}m`;
  };

  // Filtra PBs de acordo com a categoria selecionada (Para a tabela)
  const currentPbs = pbs.filter(p => pbCategory === 'atletismo' 
    ? (!p.pb_category || p.pb_category === 'atletismo')
    : p.pb_category === 'ginasio'
  );

  // Lista de provas únicas apenas para atletismo (para o gráfico)
  const athleticsPbs = pbs.filter(p => !p.pb_category || p.pb_category === 'atletismo');
  const uniqueEvents = Array.from(new Set(athleticsPbs.map(p => p.event_name)));

  const renderPbProgressionChart = () => {
    const eventPbs = athleticsPbs.filter(p => p.event_name === selectedChartEvent);

    if (eventPbs.length < 2) {
      return (
        <div className="h-32 flex items-center justify-center text-xs text-zinc-500 italic">
          Regista pelo menos 2 marcas em {selectedChartEvent} para ver a curva de progressão.
        </div>
      );
    }

    const times = eventPbs.map(p => Number(p.mark_seconds));
    const minT = Math.min(...times) - 0.2;
    const maxT = Math.max(...times) + 0.2;
    const range = maxT - minT || 1;

    const svgWidth = 500;
    const svgHeight = 130;
    const padding = 25;

    const points = eventPbs.map((p, idx) => {
      const x = padding + (idx / (eventPbs.length - 1)) * (svgWidth - padding * 2);
      const y = padding + ((Number(p.mark_seconds) - minT) / range) * (svgHeight - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-32 overflow-visible">
          <polyline
            fill="none"
            stroke="#fbbf24"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {eventPbs.map((p, idx) => {
            const x = padding + (idx / (eventPbs.length - 1)) * (svgWidth - padding * 2);
            const y = padding + ((Number(p.mark_seconds) - minT) / range) * (svgHeight - padding * 2);
            return (
              <g key={p.id}>
                <circle cx={x} cy={y} r="4" fill="#fbbf24" />
                <text x={x} y={y - 8} fill="#fef08a" fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                  {p.mark_display}s
                </text>
                <text x={x} y={svgHeight - 2} fill="#71717a" fontSize="8" textAnchor="middle">
                  {p.date}
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
      {/* NAVEGAÇÃO PRINCIPAL DO DESPORTO */}
      <div className="flex gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
        {[
          { id: 'track', label: 'Treinos de Pista', icon: Timer },
          { id: 'gym', label: 'Ginásio & Cargas', icon: Dumbbell },
          { id: 'pbs', label: 'PBs & Recordes', icon: Trophy },
          { id: 'comps', label: 'Competições & Countdown', icon: Calendar },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. PISTA */}
      {subTab === 'track' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddTrackWorkout} className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-4 h-fit">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Registar Novo Treino
            </h3>
            
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Título da Sessão</label>
              <input
                type="text"
                value={workoutTitle}
                onChange={e => setWorkoutTitle(e.target.value)}
                placeholder="Ex: 10 × 200m"
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Tipo</label>
                <select
                  value={workoutType}
                  onChange={e => setWorkoutType(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                >
                  <option>Velocidade</option>
                  <option>Resistência Lática</option>
                  <option>Barreiras</option>
                  <option>Ritmo / Volume</option>
                  <option>Técnica</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Target Pace</label>
                <input
                  type="text"
                  value={targetPace}
                  onChange={e => setTargetPace(e.target.value)}
                  placeholder="Ex: 28.0s"
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Recuperação</label>
              <input
                type="text"
                value={recoveryInterval}
                onChange={e => setRecoveryInterval(e.target.value)}
                placeholder="Ex: 2min"
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-zinc-300">Séries e Tempos</span>
                <button
                  type="button"
                  onClick={() => setRepsData([...repsData, { rep: repsData.length + 1, dist: repsData.length > 0 ? repsData[repsData.length - 1].dist : '200m', time: '' }])}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer font-medium"
                >
                  + Adicionar Repetição
                </button>
              </div>

              {repsData.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {repsData.map((rep, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 w-7">R{rep.rep}</span>
                      <input
                        type="text"
                        value={rep.dist}
                        onChange={e => {
                          const updated = [...repsData];
                          updated[idx].dist = e.target.value;
                          setRepsData(updated);
                        }}
                        className="w-20 bg-zinc-800/50 border border-zinc-700/60 rounded-lg p-1.5 text-xs text-center text-white"
                        placeholder="Dist"
                      />
                      <input
                        type="text"
                        placeholder="Tempo (ex: 27.9s)"
                        value={rep.time}
                        onChange={e => {
                          const updated = [...repsData];
                          updated[idx].time = e.target.value;
                          setRepsData(updated);
                        }}
                        className="flex-1 bg-zinc-800/50 border border-zinc-700/60 rounded-lg p-1.5 text-xs text-white"
                      />
                      <button 
                        type="button" 
                        onClick={() => setRepsData(repsData.filter((_, i) => i !== idx).map((r, i) => ({...r, rep: i + 1})))}
                        className="text-zinc-600 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Guardar Sessão de Pista
            </button>
          </form>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Histórico de Treinos</span>
              <span className="text-xs font-normal text-zinc-500">{workouts.length} registos</span>
            </h3>

            {loading ? (
              <div className="p-8 text-center text-xs text-zinc-500">A carregar treinos...</div>
            ) : workouts.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-500">
                Ainda não registaste treinos de pista.
              </div>
            ) : (
              workouts.map(w => (
                <div key={w.id} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{w.title}</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-medium">
                          {w.workout_type}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        {w.date} {w.target_pace && `• Target: ${w.target_pace}`} {w.recovery_interval && `• Rec: ${w.recovery_interval}`}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteWorkout(w.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {Array.isArray(w.reps_data) && w.reps_data.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {w.reps_data.map((r: any, i: number) => (
                        <span key={i} className="text-[11px] bg-zinc-800/70 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-700/40">
                          R{r.rep} ({r.dist}): <strong className="text-emerald-400 font-mono">{r.time || '—'}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. GINÁSIO */}
      {subTab === 'gym' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddGymSet} className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-4 h-fit">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-emerald-400" /> Registar Exercício / Carga
            </h3>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Nome do Exercício</label>
              <input
                type="text"
                value={gymExercise}
                onChange={e => setGymExercise(e.target.value)}
                placeholder="Ex: Bulgarian Split Squat, Hip Thrust"
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Carga Máxima (kg)</label>
              <input
                type="text"
                value={gymWeight}
                onChange={e => setGymWeight(e.target.value)}
                placeholder="Ex: 85"
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white font-bold placeholder-zinc-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Séries (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: 3"
                  value={gymSets}
                  onChange={e => setGymSets(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-center text-white"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Reps (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: 8"
                  value={gymReps}
                  onChange={e => setGymReps(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-center text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Guardar Carga
            </button>
          </form>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Histórico de Sobrecarga</span>
              <span className="text-xs font-normal text-zinc-500">{gymLogs.length} registos</span>
            </h3>

            {gymLogs.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-500">
                Ainda não registaste cargas de ginásio.
              </div>
            ) : (
              gymLogs.map(log => (
                <div key={log.id} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{log.notes || 'Exercício'}</div>
                      <div className="text-xs text-zinc-400">
                        {log.date} {log.sets && log.reps ? `• ${log.sets} séries × ${log.reps} reps` : '• Carga registada'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-base font-black text-emerald-400 font-mono">{log.weight_kg} kg</div>
                    </div>
                    <button
                      onClick={() => handleDeleteGymSet(log.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. PBs & RECORDES */}
      {subTab === 'pbs' && (
        <div className="space-y-6">
          {/* SELETOR ATLETISMO vs GINÁSIO */}
          <div className="flex justify-center mb-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-1 inline-flex">
              <button
                onClick={() => setPbCategory('atletismo')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  pbCategory === 'atletismo' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Activity className="w-4 h-4" /> Atletismo
              </button>
              <button
                onClick={() => setPbCategory('ginasio')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  pbCategory === 'ginasio' ? 'bg-amber-500 text-zinc-950 shadow-md' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Dumbbell className="w-4 h-4" /> Ginásio
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleAddPB} className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-4 h-fit">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" /> 
                {pbCategory === 'atletismo' ? 'Adicionar Marca de Pista' : 'Adicionar Recorde de Ginásio'}
              </h3>
              
              {pbCategory === 'atletismo' ? (
                // FORMULÁRIO ATLETISMO
                <>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Prova</label>
                    <input
                      type="text"
                      value={pbEvent}
                      onChange={e => setPbEvent(e.target.value)}
                      placeholder="Ex: 400m, 400m Barreiras, 200m"
                      className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Marca (segundos)</label>
                      <input
                        type="text"
                        value={pbTime}
                        onChange={e => setPbTime(e.target.value)}
                        placeholder="Ex: 51.96"
                        className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Época</label>
                      <input
                        type="text"
                        value={pbSeason}
                        onChange={e => setPbSeason(e.target.value)}
                        className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Local / Pista</label>
                      <input
                        type="text"
                        value={pbLocation}
                        onChange={e => setPbLocation(e.target.value)}
                        placeholder="Ex: Pombal"
                        className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Data</label>
                      <input
                        type="date"
                        value={pbDate}
                        onChange={e => setPbDate(e.target.value)}
                        className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPBType(true)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${isPBType ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}
                    >
                      PB Absoluto
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPBType(false)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${!isPBType ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}
                    >
                      SB da Época
                    </button>
                  </div>
                </>
              ) : (
                // FORMULÁRIO GINÁSIO
                <>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Exercício</label>
                    <input
                      type="text"
                      value={gymRecordExercise}
                      onChange={e => setGymRecordExercise(e.target.value)}
                      placeholder="Ex: Squat, Bench Press..."
                      className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Carga (kg)</label>
                      <input
                        type="text"
                        value={gymRecordWeight}
                        onChange={e => setGymRecordWeight(e.target.value)}
                        placeholder="Ex: 120"
                        className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Data</label>
                      <input
                        type="date"
                        value={pbDate}
                        onChange={e => setPbDate(e.target.value)}
                        className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Guardar {pbCategory === 'atletismo' ? 'Marca Oficial' : 'Recorde de Ginásio'}
              </button>
            </form>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {currentPbs.length === 0 ? (
                <div className="sm:col-span-2 p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-500">
                  {pbCategory === 'atletismo' ? 'Ainda não adicionaste nenhum PB ou SB.' : 'Ainda não adicionaste recordes de carga.'}
                </div>
              ) : (
                currentPbs.map(pb => (
                  <div key={pb.id} className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-900/60 border border-amber-500/20 p-5 rounded-2xl relative flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
                        {pbCategory === 'atletismo' ? pb.event_name : pb.exercise}
                      </span>
                      <button
                        onClick={() => handleDeletePB(pb.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="my-3">
                      <div className="text-3xl font-black text-white font-mono tracking-tight">
                        {pbCategory === 'atletismo' ? `${pb.mark_display}s` : `${pb.mark_display} kg`}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] border-t border-zinc-800/80 pt-2 text-zinc-400">
                      {pbCategory === 'atletismo' ? (
                        <>
                          <span>Época {pb.season}</span>
                          <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${pb.is_pb ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'}`}>
                            {pb.is_pb ? '🏆 PB Absoluto' : '⚡ SB'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>Registado a:</span>
                          <span className="font-mono text-amber-400/80">{pb.date}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PAINEL DO GRÁFICO (Só visível em Atletismo) */}
          {pbCategory === 'atletismo' && uniqueEvents.length > 0 && (
            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Curva de Progressão por Prova</h3>
                </div>

                <div className="flex gap-2">
                  {uniqueEvents.map(ev => (
                    <button
                      key={ev}
                      onClick={() => setSelectedChartEvent(ev)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedChartEvent === ev
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {ev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800">
                {renderPbProgressionChart()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. COMPETIÇÕES */}
      {subTab === 'comps' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddCompetition} className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-4 h-fit">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" /> Nova Competição
            </h3>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Nome da Competição</label>
              <input
                type="text"
                value={compName}
                onChange={e => setCompName(e.target.value)}
                placeholder="Ex: Campeonato Nacional"
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Data e Hora</label>
                <input
                  type="datetime-local"
                  value={compDate}
                  onChange={e => setCompDate(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Local</label>
                <input
                  type="text"
                  value={compLocation}
                  onChange={e => setCompLocation(e.target.value)}
                  placeholder="Ex: Pombal / Braga"
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Provas Inscritas</label>
              <input
                type="text"
                value={compEvents}
                onChange={e => setCompEvents(e.target.value)}
                placeholder="400m, 200m"
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Adicionar ao Calendário
            </button>
          </form>

          <div className="lg:col-span-2 space-y-3.5">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Calendário Competitivo</span>
              <span className="text-xs font-normal text-zinc-500">{competitions.length} provas</span>
            </h3>

            {competitions.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-500">
                Ainda não adicionaste competições.
              </div>
            ) : (
              competitions.map(comp => (
                <div key={comp.id} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{comp.name}</h4>
                      <span className="text-xs text-zinc-400">{new Date(comp.event_date).toLocaleString('pt-PT')} • {comp.location || 'Pista'}</span>
                    </div>
                    <div className="bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-xl text-right">
                      <div className="text-xs font-mono font-bold text-sky-400">{calculateCountdown(comp.event_date)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};