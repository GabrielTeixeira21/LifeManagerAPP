import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Trophy, Plus, Dumbbell, Timer, 
  Calendar, Trash2 
} from 'lucide-react';

interface AthleticsViewProps {
  userId: string;
}

export const AthleticsView: React.FC<AthleticsViewProps> = ({ userId }) => {
  const [subTab, setSubTab] = useState<'track' | 'gym' | 'pbs' | 'comps'>('track');
  const [loading, setLoading] = useState(false);

  // --- Estados de Pista ---
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutType, setWorkoutType] = useState('Velocidade');
  const [targetPace, setTargetPace] = useState('');
  const [recoveryInterval, setRecoveryInterval] = useState('2min');
  const [repsData, setRepsData] = useState<{ rep: number; dist: string; time: string }[]>([
    { rep: 1, dist: '200m', time: '' },
    { rep: 2, dist: '200m', time: '' }
  ]);

  // --- Estados de Ginásio ---
  const [gymLogs, setGymLogs] = useState<any[]>([]);
  const [gymExercise, setGymExercise] = useState('Bulgarian Split Squat');
  const [gymWeight, setGymWeight] = useState('');
  const [gymSets, setGymSets] = useState(3);
  const [gymReps, setGymReps] = useState(8);
  const [gymNotes, setGymNotes] = useState('');

  // --- Estados de PBs & SBs ---
  const [pbs, setPbs] = useState<any[]>([]);
  const [pbEvent, setPbEvent] = useState('400m');
  const [pbTime, setPbTime] = useState('');
  const [pbSeason, setPbSeason] = useState('2026/27');
  const [pbLocation, setPbLocation] = useState('');
  const [isPBType, setIsPBType] = useState(true);

  // --- Estados de Competições ---
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [compName, setCompName] = useState('');
  const [compDate, setCompDate] = useState('');
  const [compLocation, setCompLocation] = useState('');
  const [compEvents, setCompEvents] = useState('400m, 4x400m');
  const [compTarget, setCompTarget] = useState('50.00s');

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
        .order('mark_seconds', { ascending: true });
      if (data) setPbs(data);
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

  // --- Handlers de Pista ---
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
      setRepsData([
        { rep: 1, dist: '200m', time: '' },
        { rep: 2, dist: '200m', time: '' }
      ]);
      loadAthleticsData();
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    await supabase.from('track_workouts').delete().eq('id', id);
    loadAthleticsData();
  };

  // --- Handlers de Ginásio ---
  const handleAddGymSet = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(gymWeight.replace(',', '.'));
    if (isNaN(weightNum) || !gymExercise) return;

    // Criar/obter exercício primeiro
    let exerciseId = '00000000-0000-0000-0000-000000000000';
    const { data: exData } = await supabase
      .from('gym_exercises')
      .select('id')
      .eq('user_id', userId)
      .eq('name', gymExercise)
      .maybeSingle();

    if (exData) {
      exerciseId = exData.id;
    } else {
      const { data: newEx } = await supabase
        .from('gym_exercises')
        .insert({ user_id: userId, name: gymExercise, category: 'Geral' })
        .select('id')
        .single();
      if (newEx) exerciseId = newEx.id;
    }

    const { error } = await supabase.from('gym_sets').insert({
      user_id: userId,
      exercise_id: exerciseId,
      date: new Date().toISOString().split('T')[0],
      sets: gymSets,
      reps: gymReps,
      weight_kg: weightNum,
      notes: gymNotes || gymExercise
    });

    if (!error) {
      setGymWeight('');
      setGymNotes('');
      loadAthleticsData();
    }
  };

  const handleDeleteGymSet = async (id: string) => {
    await supabase.from('gym_sets').delete().eq('id', id);
    loadAthleticsData();
  };

  // --- Handlers de PBs ---
  const handleAddPB = async (e: React.FormEvent) => {
    e.preventDefault();
    const seconds = parseFloat(pbTime.replace(',', '.'));
    if (isNaN(seconds)) return;

    const { error } = await supabase.from('personal_bests').insert({
      user_id: userId,
      event_name: pbEvent,
      mark_seconds: seconds,
      mark_display: pbTime,
      is_pb: isPBType,
      season: pbSeason,
      location: pbLocation,
      date: new Date().toISOString().split('T')[0]
    });

    if (!error) {
      setPbTime('');
      setPbLocation('');
      loadAthleticsData();
    }
  };

  const handleDeletePB = async (id: string) => {
    await supabase.from('personal_bests').delete().eq('id', id);
    loadAthleticsData();
  };

  // --- Handlers de Competições ---
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
      loadAthleticsData();
    }
  };

  const handleUpdateCompResult = async (id: string, result: string) => {
    await supabase.from('competitions').update({ actual_result: result }).eq('id', id);
    loadAthleticsData();
  };

  // Função auxiliar de contagem decrescente
  const calculateCountdown = (targetDateStr: string) => {
    const diff = new Date(targetDateStr).getTime() - new Date().getTime();
    if (diff <= 0) return 'Concluída';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    return `⏳ ${days}d ${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Sub-Navegação dos 4 Pilares de Atletismo */}
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

      {/* 1. SEPARADOR: PISTA */}
      {subTab === 'track' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddTrackWorkout} className="bg-zinc-900/80 border border-zinc-800/80 p-5 rounded-2xl space-y-4 h-fit">
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
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white focus:outline-none"
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
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Recuperação entre séries</label>
              <input
                type="text"
                value={recoveryInterval}
                onChange={e => setRecoveryInterval(e.target.value)}
                placeholder="Ex: 2min ou 90s"
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-zinc-300">Séries e Tempos</span>
                <button
                  type="button"
                  onClick={() => setRepsData([...repsData, { rep: repsData.length + 1, dist: repsData[repsData.length - 1]?.dist || '200m', time: '' }])}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer font-medium"
                >
                  + Adicionar Repetição
                </button>
              </div>

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
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Guardar Sessão de Pista
            </button>
          </form>

          {/* Histórico de Treinos */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Histórico de Treinos</span>
              <span className="text-xs font-normal text-zinc-500">{workouts.length} registos</span>
            </h3>

            {loading ? (
              <div className="p-8 text-center text-xs text-zinc-500">A carregar treinos...</div>
            ) : workouts.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800/80 rounded-2xl text-xs text-zinc-500">
                Ainda não registaste treinos de pista. Usa o formulário ao lado para começar!
              </div>
            ) : (
              workouts.map(w => (
                <div key={w.id} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl space-y-3 relative group">
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
                      title="Eliminar treino"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Array.isArray(w.reps_data) && w.reps_data.map((r: any, i: number) => (
                      <span key={i} className="text-[11px] bg-zinc-800/70 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-700/40">
                        R{r.rep} ({r.dist}): <strong className="text-emerald-400 font-mono">{r.time || '—'}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. SEPARADOR: GINÁSIO */}
      {subTab === 'gym' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddGymSet} className="bg-zinc-900/80 border border-zinc-800/80 p-5 rounded-2xl space-y-4 h-fit">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-emerald-400" /> Registar Exercício
            </h3>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Exercício</label>
              <input
                type="text"
                value={gymExercise}
                onChange={e => setGymExercise(e.target.value)}
                placeholder="Ex: Hip Thrust, Agachamento, Búlgaro"
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Séries</label>
                <input
                  type="number"
                  min="1"
                  value={gymSets}
                  onChange={e => setGymSets(parseInt(e.target.value) || 1)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-center text-white"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Reps</label>
                <input
                  type="number"
                  min="1"
                  value={gymReps}
                  onChange={e => setGymReps(parseInt(e.target.value) || 1)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-center text-white"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Carga (kg)</label>
                <input
                  type="text"
                  value={gymWeight}
                  onChange={e => setGymWeight(e.target.value)}
                  placeholder="Ex: 60"
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-center text-white font-bold placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Notas / Sensações</label>
              <input
                type="text"
                value={gymNotes}
                onChange={e => setGymNotes(e.target.value)}
                placeholder="Ex: RPE 8, boa velocidade na subida"
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Guardar Série de Cargas
            </button>
          </form>

          {/* Histórico de Ginásio */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Histórico de Força & Hipertrofia</span>
              <span className="text-xs font-normal text-zinc-500">{gymLogs.length} registos</span>
            </h3>

            {gymLogs.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800/80 rounded-2xl text-xs text-zinc-500">
                Ainda não registaste exercícios de ginásio.
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
                      <div className="text-xs text-zinc-400">{log.date} • {log.sets} séries × {log.reps} repetições</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-base font-black text-emerald-400 font-mono">{log.weight_kg} kg</div>
                      <span className="text-[10px] text-zinc-500">Sobrecarga</span>
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

      {/* 3. SEPARADOR: PBs & RECORDES */}
      {subTab === 'pbs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddPB} className="bg-zinc-900/80 border border-zinc-800/80 p-5 rounded-2xl space-y-4 h-fit">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" /> Adicionar Recorde
            </h3>
            
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

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Pista / Local</label>
              <input
                type="text"
                value={pbLocation}
                onChange={e => setPbLocation(e.target.value)}
                placeholder="Ex: Pista de Coimbra / Leiria"
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPBType(true)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${isPBType ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}
              >
                Personal Best (PB)
              </button>
              <button
                type="button"
                onClick={() => setIsPBType(false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${!isPBType ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}
              >
                Season Best (SB)
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Registar Marca Oficial
            </button>
          </form>

          {/* Cards de PBs */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {pbs.length === 0 ? (
              <div className="sm:col-span-2 p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-500">
                Ainda não adicionaste nenhum PB ou SB oficial.
              </div>
            ) : (
              pbs.map(pb => (
                <div key={pb.id} className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-900/60 border border-amber-500/20 p-5 rounded-2xl relative flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">{pb.event_name}</span>
                    <button
                      onClick={() => handleDeletePB(pb.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="my-3">
                    <div className="text-3xl font-black text-white font-mono tracking-tight">{pb.mark_display}s</div>
                    <div className="text-[11px] text-zinc-400 mt-1">{pb.location || 'Competição Oficial'}</div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] border-t border-zinc-800/80 pt-2 text-zinc-400">
                    <span>Época {pb.season}</span>
                    <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${pb.is_pb ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'}`}>
                      {pb.is_pb ? '🏆 PB Absoluto' : '⚡ SB da Época'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 4. SEPARADOR: COMPETIÇÕES & COUNTDOWN */}
      {subTab === 'comps' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddCompetition} className="bg-zinc-900/80 border border-zinc-800/80 p-5 rounded-2xl space-y-4 h-fit">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" /> Nova Competição
            </h3>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Nome da Competição</label>
              <input
                type="text"
                value={compName}
                onChange={e => setCompName(e.target.value)}
                placeholder="Ex: Campeonato Nacional Universitário"
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

            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Objetivo de Tempo</label>
                <input
                  type="text"
                  value={compTarget}
                  onChange={e => setCompTarget(e.target.value)}
                  placeholder="Ex: 50.00s"
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Adicionar ao Calendário
            </button>
          </form>

          {/* Lista de Competições com Countdown */}
          <div className="lg:col-span-2 space-y-3.5">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Calendário Competitivo</span>
              <span className="text-xs font-normal text-zinc-500">{competitions.length} provas</span>
            </h3>

            {competitions.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-500">
                Ainda não adicionaste competições ao calendário.
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
                      <span className="text-[10px] text-zinc-400">Meta: {comp.target_result || 'Recorde'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-zinc-800/60 gap-2">
                    <div className="flex gap-1.5">
                      {Array.isArray(comp.events_registered) && comp.events_registered.map((ev: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                          {ev}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Resultado obtido (ex: 50.82s)"
                        defaultValue={comp.actual_result || ''}
                        onBlur={(e) => handleUpdateCompResult(comp.id, e.target.value)}
                        className="bg-zinc-800/70 border border-zinc-700/60 rounded-lg px-2.5 py-1 text-xs text-white placeholder-zinc-500"
                      />
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