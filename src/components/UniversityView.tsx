import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit3, Clock, MapPin, AlertCircle, 
  CheckCircle2, CalendarDays, ChevronUp, ChevronDown, X, 
  Calculator, Target, Award, BookOpen, FileText, Check
} from 'lucide-react';

interface UniversityViewProps {
  userId: string;
  isRoseTheme?: boolean;
}

interface ScheduleItem {
  id: string;
  course_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room?: string;
  class_type?: string;
}

interface SimExam {
  id: string;
  name: string;
  score: number | string;
  max: number | string;
  weight: number | string;
}

interface AcademicCourse {
  id: string;
  name: string;
}

interface AcademicGrade {
  id: string;
  course_id: string;
  title: string;
  score: number;
  max_score: number;
}

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const START_HOUR = 8;  
const END_HOUR = 19;   
const ROW_HEIGHT_PX = 48; 
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

export function UniversityView({ userId, isRoseTheme = false }: UniversityViewProps) {
  // === ABAS INTERNAS ===
  const [activeTab, setActiveTab] = useState<'horario' | 'disciplinas' | 'simulador'>('horario');

  // === ESTADOS DO CALENDÁRIO ===
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [courseName, setCourseName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Segunda');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [room, setRoom] = useState('');
  const [classType, setClassType] = useState('Teórica');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === ESTADOS DAS DISCIPLINAS & NOTAS ===
  const [courses, setCourses] = useState<AcademicCourse[]>([]);
  const [grades, setGrades] = useState<AcademicGrade[]>([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingCourseName, setEditingCourseName] = useState('');

  const [newGradeTitle, setNewGradeTitle] = useState('');
  const [newGradeScore, setNewGradeScore] = useState<string>('');
  const [newGradeMax, setNewGradeMax] = useState<string>('');

  // === ESTADOS DO SIMULADOR DE NOTAS ===
  const [simMode, setSimMode] = useState<'absoluto' | 'percentagem'>('percentagem');
  const [simExams, setSimExams] = useState<SimExam[]>([
    { id: '1', name: 'Frequência 1', score: '', max: '20', weight: '50' }
  ]);
  const [simTarget, setSimTarget] = useState<number | string>('15');
  const [simTargetMax, setSimTargetMax] = useState<number | string>('20');
  const [simNextMax, setSimNextMax] = useState<number | string>('20');
  const [simNextWeight, setSimNextWeight] = useState<number | string>('50');

  useEffect(() => {
    if (userId) {
      loadSchedule();
      loadAcademicData();
    }
  }, [userId]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('academic_schedule').select('*').eq('user_id', userId).order('start_time', { ascending: true });
      if (data) setSchedule(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAcademicData = async () => {
    try {
      const { data: cData } = await supabase.from('academic_courses').select('*').eq('user_id', userId).order('name');
      if (cData) setCourses(cData);

      const { data: gData } = await supabase.from('academic_grades').select('*').eq('user_id', userId);
      if (gData) setGrades(gData);
    } catch (err) {
      console.error('Erro ao carregar disciplinas/notas', err);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        user_id: userId,
        course_name: courseName.trim(),
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        room: room.trim() || null,
        class_type: isRoseTheme ? 'Prática' : classType 
      };

      if (editingId) {
        const { data, error } = await supabase.from('academic_schedule').update(payload).eq('id', editingId).eq('user_id', userId).select().single();
        if (error) throw error;
        setSchedule(prev => prev.map(item => item.id === editingId ? data : item));
        setSuccessMsg(`Aula de ${courseName} atualizada!`);
      } else {
        const { data, error } = await supabase.from('academic_schedule').insert([payload]).select().single();
        if (error) throw error;
        setSchedule(prev => [...prev, data]);
        setSuccessMsg(`Aula de ${courseName} adicionada com sucesso!`);
      }
      resetForm();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao guardar dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setCourseName(item.course_name);
    setDayOfWeek(item.day_of_week);
    setStartTime(item.start_time.slice(0, 5));
    setEndTime(item.end_time.slice(0, 5));
    setRoom(item.room || '');
    setClassType(item.class_type || 'Teórica');
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setCourseName('');
    setRoom('');
    setStartTime('09:00');
    setEndTime('11:00');
    setClassType('Teórica');
    setShowAddForm(false);
  };

  const handleDeleteSchedule = async (id: string, name: string) => {
    if (!confirm(`Apagar a aula de "${name}"?`)) return;
    await supabase.from('academic_schedule').delete().eq('id', id).eq('user_id', userId);
    setSchedule(prev => prev.filter(item => item.id !== id));
  };

  const calculateCardPosition = (startTimeStr: string, endTimeStr: string) => {
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);
    const startMinutesFromBase = (startH - START_HOUR) * 60 + startM;
    const endMinutesFromBase = (endH - START_HOUR) * 60 + endM;
    const durationMinutes = Math.max(30, endMinutesFromBase - startMinutesFromBase);
    const pxPerMinute = ROW_HEIGHT_PX / 60;
    const top = Math.max(0, startMinutesFromBase * pxPerMinute);
    const height = Math.max(20, durationMinutes * pxPerMinute - 2);
    return { top, height };
  };

  // ==============================================================
  // EFEITO VIDRO (FROSTED GLASS)
  // ==============================================================
  const getClassTheme = (type?: string) => {
    // 1. TEMA ROSA DA TUA NAMORADA (Acrílico / Vidro Azul translúcido, limpo e sem TE/PR)
    if (isRoseTheme) {
      return { 
        card: 'bg-gradient-to-br from-sky-500/30 to-sky-600/15 backdrop-blur-xl border border-sky-400/40 text-white hover:from-sky-500/40 hover:to-sky-600/25 shadow-[0_4px_20px_rgba(56,189,248,0.15)]', 
        badge: 'hidden' 
      };
    }

    // 2. A TUA CONTA (TEMA GOLD) - Cores mistas originais com vidro escuro
    switch (type) {
      case 'Teórica': return { 
        card: 'bg-gradient-to-br from-emerald-500/25 to-emerald-950/40 backdrop-blur-xl border border-emerald-500/40 text-emerald-100 hover:border-emerald-400', 
        badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
      };
      case 'Prática': return { 
        card: 'bg-gradient-to-br from-sky-500/25 to-sky-950/40 backdrop-blur-xl border border-sky-500/40 text-sky-100 hover:border-sky-400', 
        badge: 'bg-sky-500/20 text-sky-300 border border-sky-500/30' 
      };
      case 'Teórico-Prática': default: return { 
        card: 'bg-gradient-to-br from-amber-500/25 to-amber-950/40 backdrop-blur-xl border border-amber-500/40 text-amber-100 hover:border-amber-400', 
        badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
      };
    }
  };

  const totalGridHeight = HOURS.length * ROW_HEIGHT_PX;

  // === LÓGICA DAS DISCIPLINAS E NOTAS ===
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;
    const { data } = await supabase.from('academic_courses').insert([{ user_id: userId, name: newCourseName.trim() }]).select().single();
    if (data) setCourses([...courses, data]);
    setNewCourseName('');
  };

  const handleStartEditCourse = (course: AcademicCourse) => {
    setEditingCourseId(course.id);
    setEditingCourseName(course.name);
  };

  const handleSaveEditCourse = async (courseId: string) => {
    if (!editingCourseName.trim()) return;
    const { error } = await supabase
      .from('academic_courses')
      .update({ name: editingCourseName.trim() })
      .eq('id', courseId)
      .eq('user_id', userId);

    if (!error) {
      setCourses(courses.map(c => c.id === courseId ? { ...c, name: editingCourseName.trim() } : c));
      setEditingCourseId(null);
      setEditingCourseName('');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Apagar esta disciplina e todas as suas notas?')) return;
    await supabase.from('academic_courses').delete().eq('id', id);
    setCourses(courses.filter(c => c.id !== id));
    setGrades(grades.filter(g => g.course_id !== id));
  };

  const handleAddGrade = async (courseId: string) => {
    const s = Number(newGradeScore);
    const m = Number(newGradeMax);
    if (!newGradeTitle.trim() || isNaN(s) || isNaN(m)) return;

    const { data } = await supabase.from('academic_grades').insert([{
      user_id: userId,
      course_id: courseId,
      title: newGradeTitle.trim(),
      score: s,
      max_score: m
    }]).select().single();

    if (data) {
      setGrades([...grades, data]);
      setNewGradeTitle('');
      setNewGradeScore('');
      setNewGradeMax('');
    }
  };

  const handleDeleteGrade = async (id: string) => {
    await supabase.from('academic_grades').delete().eq('id', id);
    setGrades(grades.filter(g => g.id !== id));
  };

  // === LÓGICA DO SIMULADOR ===
  const handleAddSimExam = () => {
    setSimExams([...simExams, { id: Date.now().toString(), name: `Avaliação ${simExams.length + 1}`, score: '', max: '20', weight: '50' }]);
  };

  const handleUpdateSimExam = (id: string, field: keyof SimExam, value: string) => {
    setSimExams(simExams.map(exam => exam.id === id ? { ...exam, [field]: value } : exam));
  };

  const handleRemoveSimExam = (id: string) => {
    setSimExams(simExams.filter(e => e.id !== id));
  };

  let isAlreadyDone = false;
  let isPossible = true;
  let verdictText = '';

  if (simMode === 'absoluto') {
    const currentScore = simExams.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
    const neededScore = (Number(simTarget) || 0) - currentScore;
    const maxAvailable = Number(simNextMax) || 0;
    const totalMaxPossible = currentScore + maxAvailable;

    isAlreadyDone = neededScore <= 0;
    isPossible = neededScore <= maxAvailable;

    if (isAlreadyDone) verdictText = `Já atingiste o teu objetivo! Tens ${currentScore}.`;
    else if (!isPossible) verdictText = `Impossível. O máximo que consegues é ${totalMaxPossible}.`;
    else verdictText = `Precisas de tirar ${neededScore} valores (em ${maxAvailable}) no próximo teste.`;

  } else {
    const target = Number(simTarget) || 0;
    const targetMax = Number(simTargetMax) || 20;
    const targetPerc = (target / targetMax) * 100;

    let currentPerc = 0;
    simExams.forEach(exam => {
      const s = Number(exam.score) || 0;
      const m = Number(exam.max) || 20;
      const w = Number(exam.weight) || 0;
      if (m > 0) currentPerc += (s / m) * w;
    });

    const nextW = Number(simNextWeight) || 0;
    const nextM = Number(simNextMax) || 20;

    const neededPerc = targetPerc - currentPerc;
    const neededScore = nextW > 0 ? (neededPerc / nextW) * nextM : 0;
    
    const maxFinalPerc = currentPerc + nextW;
    const totalMaxPossible = (maxFinalPerc / 100) * targetMax;

    isAlreadyDone = neededPerc <= 0;
    isPossible = neededScore <= nextM;

    if (isAlreadyDone) {
      verdictText = `Já atingiste o objetivo! Já garantiste ${parseFloat(((currentPerc/100) * targetMax).toFixed(2))} valores em ${targetMax}.`;
    } else if (!isPossible) {
      verdictText = `Impossível. O máximo que consegues na disciplina é ${parseFloat(totalMaxPossible.toFixed(2))} valores em ${targetMax}.`;
    } else {
      verdictText = `Precisas de tirar ${parseFloat(neededScore.toFixed(2))} valores (em ${nextM}) no próximo teste para atingir a tua meta.`;
    }
  }

  const hideArrowsClass = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <span className="text-[10px] font-mono text-sky-400 font-semibold uppercase tracking-wider">
          Área Académica
        </span>
        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
          Gestão Universitária
        </h2>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 p-1.5 bg-zinc-900/60 rounded-xl border border-zinc-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('horario')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'horario' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <CalendarDays className="w-4 h-4" /> Horário Semanal
        </button>
        <button
          onClick={() => setActiveTab('disciplinas')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'disciplinas' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <BookOpen className="w-4 h-4" /> Notas & Disciplinas
        </button>
        <button
          onClick={() => setActiveTab('simulador')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'simulador' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Calculator className="w-4 h-4" /> Simulador de Exames
        </button>
      </div>

      {/* Alertas Gerais */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" /><span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" /><span>{successMsg}</span>
        </div>
      )}

      {/* CONTEÚDO DA ABA HORÁRIO */}
      {activeTab === 'horario' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => { if (showAddForm) resetForm(); else setShowAddForm(true); }}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              {showAddForm ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showAddForm ? 'Fechar Painel' : 'Adicionar Aula'}
            </button>
          </div>

          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl p-5 bg-zinc-900/90 border border-zinc-800 shadow-xl overflow-hidden"
              >
                <form onSubmit={handleSaveSchedule} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-medium">Nome da Disciplina *</label>
                    <input type="text" placeholder="Ex: Análise Matemática..." value={courseName} onChange={(e) => setCourseName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-medium">Dia da Semana</label>
                    <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500">
                      {DAYS.map(d => <option key={d} value={d}>{d}-feira</option>)}
                    </select>
                  </div>
                  
                  {!isRoseTheme && (
                    <div className="space-y-1">
                      <label className="text-[11px] text-zinc-400 font-medium">Tipo de Aula</label>
                      <select value={classType} onChange={(e) => setClassType(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500">
                        <option value="Teórica">Teórica</option><option value="Prática">Prática</option><option value="Teórico-Prática">Teórico-Prática</option>
                      </select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-medium">Hora de Início</label>
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-medium">Hora de Fim</label>
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 font-medium">Sala / Bloco (Opcional)</label>
                    <input type="text" placeholder="Ex: Sala D.2.1" value={room} onChange={(e) => setRoom(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500" />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 mt-1">
                    {editingId && <button type="button" onClick={resetForm} className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer">Cancelar</button>}
                    <button type="submit" disabled={isSubmitting} className={`px-4 py-1.5 rounded-xl text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${editingId ? 'bg-amber-400 hover:bg-amber-300' : 'bg-sky-500 hover:bg-sky-400'}`}>
                      {editingId ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {isSubmitting ? 'A guardar...' : editingId ? 'Guardar' : 'Confirmar e Adicionar'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="rounded-2xl p-4 bg-zinc-900/60 border border-zinc-800 shadow-xl overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Calendário Semanal</h3>
                </div>
                
                {!isRoseTheme && (
                  <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/> Teórica</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400 inline-block"/> Prática</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/> T-Prática</span>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="text-xs text-zinc-500 py-8 text-center font-mono">A carregar horário...</div>
              ) : (
                <div className="w-full">
                  <div className="grid grid-cols-[56px_repeat(5,1fr)] border-b border-zinc-800 pb-1.5 text-center text-xs font-bold text-zinc-400">
                    <div className="font-mono text-[11px] text-zinc-500">Hora</div>
                    {DAYS.map(day => (
                      <div key={day} className="border-l border-zinc-800/60 text-zinc-200">{day}</div>
                    ))}
                  </div>

                  <div className="relative grid grid-cols-[56px_repeat(5,1fr)]" style={{ height: `${totalGridHeight}px` }}>
                    <div className="col-span-6 absolute inset-0 pointer-events-none flex flex-col">
                      {HOURS.map(h => <div key={h} style={{ height: `${ROW_HEIGHT_PX}px` }} className="border-b border-zinc-800/40 w-full" />)}
                    </div>
                    <div className="flex flex-col z-10 select-none">
                      {HOURS.map(h => <div key={h} style={{ height: `${ROW_HEIGHT_PX}px` }} className="flex items-start justify-center font-mono text-[11px] text-zinc-500 font-semibold pt-1">{h.toString().padStart(2, '0')}:00</div>)}
                    </div>

                    {DAYS.map(day => {
                      const dayClasses = schedule.filter(item => item.day_of_week.toLowerCase().startsWith(day.toLowerCase()));
                      return (
                        <div key={day} className="relative border-l border-zinc-800/60 h-full">
                          {dayClasses.map(c => {
                            const { top, height } = calculateCardPosition(c.start_time, c.end_time);
                            const theme = getClassTheme(c.class_type);
                            
                            // DETETA SE A AULA É CURTA (< 52px)
                            const isShortBlock = height < 52; 

                            return (
                              <div 
                                key={c.id} 
                                style={{ position: 'absolute', top: `${top}px`, height: `${height}px`, left: '4px', right: '4px' }} 
                                className={`rounded-lg p-1.5 text-xs flex overflow-hidden transition-all group z-20 ${theme.card} ${isShortBlock ? 'items-center' : 'flex-col justify-between'}`}
                              >
                                {isShortBlock ? (
                                  /* === LAYOUT COMPACTO (Aulas curtas) === */
                                  <div className="flex items-center justify-between w-full h-full gap-1">
                                    <span className={`font-bold text-[10px] sm:text-[11px] truncate flex-1 ${isRoseTheme ? 'text-sky-950' : 'text-white'}`}>
                                      {c.course_name}
                                    </span>
                                    
                                    <div className="flex items-center gap-1 shrink-0">
                                      {!isRoseTheme && c.class_type && (
                                        <span className={`text-[7px] font-bold px-1 py-0.5 rounded border uppercase tracking-widest ${theme.badge}`}>
                                          {c.class_type.substring(0, 2)}
                                        </span>
                                      )}
                                      {/* BOTÕES SEMPRE VISÍVEIS NO MOBILE (opacity-80) E COM HOVER NO DESKTOP */}
                                      <div className="flex items-center opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 bg-black/60 rounded p-0.5">
                                        <button onClick={() => handleStartEdit(c)} className="hover:text-amber-400 text-zinc-300 transition-colors cursor-pointer p-0.5"><Edit3 className="w-2.5 h-2.5" /></button>
                                        <button onClick={() => handleDeleteSchedule(c.id, c.course_name)} className="hover:text-rose-400 text-zinc-300 transition-colors cursor-pointer p-0.5"><Trash2 className="w-2.5 h-2.5" /></button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* === LAYOUT NORMAL (Aulas compridas) === */
                                  <>
                                    <div>
                                      <div className="flex items-start justify-between gap-1 leading-none">
                                        <span className={`font-bold text-[10px] sm:text-[11px] line-clamp-2 leading-tight ${isRoseTheme ? 'text-sky-950' : 'text-white'}`}>
                                          {c.course_name}
                                        </span>
                                        {/* BOTÕES SEMPRE VISÍVEIS NO MOBILE (opacity-80) E COM HOVER NO DESKTOP */}
                                        <div className="flex flex-col gap-1 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 bg-black/60 rounded p-1">
                                          <button onClick={() => handleStartEdit(c)} className="hover:text-amber-400 text-zinc-300 transition-colors cursor-pointer"><Edit3 className="w-3 h-3" /></button>
                                          <button onClick={() => handleDeleteSchedule(c.id, c.course_name)} className="hover:text-rose-400 text-zinc-300 transition-colors cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                      </div>
                                      <div className={`text-[9px] font-mono opacity-85 mt-1 flex items-center gap-1 ${isRoseTheme ? 'text-sky-800' : ''}`}>
                                        <Clock className="w-2.5 h-2.5 shrink-0" />
                                        <span>{c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-1 mt-0.5">
                                      {c.room ? (
                                        <div className={`text-[9px] font-mono opacity-80 flex items-center gap-1 truncate ${isRoseTheme ? 'text-sky-800' : ''}`}>
                                          <MapPin className="w-2.5 h-2.5 shrink-0" /><span className="truncate">{c.room}</span>
                                        </div>
                                      ) : <span />}
                                      
                                      {!isRoseTheme && c.class_type && (
                                        <span className={`text-[8px] font-bold px-1 py-0.5 rounded border uppercase tracking-widest shrink-0 ${theme.badge}`}>
                                          {c.class_type.substring(0, 2)}
                                        </span>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA DISCIPLINAS E NOTAS */}
      {activeTab === 'disciplinas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <form onSubmit={handleAddCourse} className="flex gap-2 p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
              <input
                type="text"
                placeholder="Nome da Disciplina..."
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-500"
                required
              />
              <button type="submit" className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </form>

            <div className="space-y-3">
              {courses.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-zinc-800 rounded-2xl text-xs text-zinc-500">
                  Nenhuma disciplina registada. Adiciona a tua primeira cadeira acima.
                </div>
              ) : (
                courses.map(course => {
                  const courseGrades = grades.filter(g => g.course_id === course.id);
                  const isExpanded = expandedCourse === course.id;
                  const isEditingThis = editingCourseId === course.id;
                  const currentTotal = courseGrades.reduce((acc, g) => acc + g.score, 0);

                  return (
                    <div key={course.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
                      <div 
                        onClick={() => {
                          if (!isEditingThis) {
                            setExpandedCourse(isExpanded ? null : course.id);
                          }
                        }}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 mr-2">
                          <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                          
                          {/* CAMPO DE EDIÇÃO OU TEXTO NORMAL */}
                          {isEditingThis ? (
                            <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editingCourseName}
                                onChange={(e) => setEditingCourseName(e.target.value)}
                                className="bg-zinc-950 border border-sky-500 rounded-lg px-2 py-1 text-xs text-white outline-none w-full max-w-[200px]"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEditCourse(course.id);
                                  if (e.key === 'Escape') setEditingCourseId(null);
                                }}
                              />
                              <button 
                                onClick={() => handleSaveEditCourse(course.id)} 
                                className="p-1 text-emerald-400 hover:text-emerald-300 bg-zinc-800 rounded"
                                title="Guardar"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => setEditingCourseId(null)} 
                                className="p-1 text-zinc-400 hover:text-white bg-zinc-800 rounded"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-bold text-white flex items-center gap-2">
                                {course.name}
                              </div>
                              <div className="text-[10px] text-zinc-500">{courseGrades.length} registos • Total Atingido: {currentTotal} pts</div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {!isEditingThis && (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleStartEditCourse(course); 
                              }} 
                              className="text-zinc-500 hover:text-amber-400 p-1 transition-colors"
                              title="Editar nome da disciplina"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleDeleteCourse(course.id); 
                            }} 
                            className="text-zinc-600 hover:text-rose-400 p-1 transition-colors"
                            title="Apagar disciplina"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-zinc-800/50 bg-zinc-950/30">
                          <div className="flex flex-wrap gap-2 mt-4">
                            <input type="text" placeholder="Ex: Frequência 1" value={newGradeTitle} onChange={(e) => setNewGradeTitle(e.target.value)} className="flex-1 min-w-[120px] bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white" />
                            <input type="number" placeholder="Tive..." value={newGradeScore} onChange={(e) => setNewGradeScore(e.target.value)} className={`w-20 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-center text-white ${hideArrowsClass}`} />
                            <span className="text-xs text-zinc-500 self-center">em</span>
                            <input type="number" placeholder="Total..." value={newGradeMax} onChange={(e) => setNewGradeMax(e.target.value)} className={`w-20 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-center text-white ${hideArrowsClass}`} />
                            <button onClick={() => handleAddGrade(course.id)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-sky-400 text-xs font-bold rounded-lg transition-colors cursor-pointer">
                              Guardar
                            </button>
                          </div>

                          <div className="mt-4 space-y-2">
                            {courseGrades.map(grade => (
                              <div key={grade.id} className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-xl border border-zinc-800/80">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5 text-zinc-500" />
                                  <span className="text-xs text-zinc-300">{grade.title}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-mono font-bold text-white">{grade.score} <span className="text-zinc-500 font-normal">/ {grade.max_score}</span></span>
                                  <button onClick={() => handleDeleteGrade(grade.id)} className="text-zinc-600 hover:text-rose-400"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="hidden lg:flex flex-col items-center justify-center p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
            <BookOpen className="w-12 h-12 text-zinc-800 mb-3" />
            <h4 className="font-bold text-zinc-400 mb-1">O teu Diário de Bordo</h4>
            <p className="text-xs max-w-sm">Cria as tuas disciplinas e regista todas as notas de testes, frequências e trabalhos ao longo do semestre para nunca perderes o rasto à tua média.</p>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA SIMULADOR */}
      {activeTab === 'simulador' && (
        <div className="max-w-2xl mx-auto rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-xl overflow-hidden flex flex-col">
          
          <div className="p-5 border-b border-zinc-800 bg-gradient-to-r from-emerald-950/30 to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calculator className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Simulador de Exames</h3>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Descobre exatamente quanto precisas de tirar no próximo teste para atingir a tua meta.
                </p>
              </div>

              {/* TOGGLE MODO DE CÁLCULO */}
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0">
                <button 
                  onClick={() => setSimMode('absoluto')} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${simMode === 'absoluto' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Absolutos
                </button>
                <button 
                  onClick={() => setSimMode('percentagem')} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${simMode === 'percentagem' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Percentagens (%)
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-5 space-y-5">
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                Avaliações já realizadas
              </label>
              
              {simExams.map((exam) => (
                <div key={exam.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-zinc-800/40 p-3 rounded-xl border border-zinc-700/50">
                  <input
                    type="text"
                    value={exam.name}
                    onChange={(e) => handleUpdateSimExam(exam.id, 'name', e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white font-semibold focus:outline-none placeholder:text-zinc-600"
                    placeholder="Nome da Avaliação"
                  />
                  
                  <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 flex-wrap">
                    Tive 
                    <input 
                      type="number" 
                      value={exam.score} 
                      onChange={(e) => handleUpdateSimExam(exam.id, 'score', e.target.value)} 
                      className={`w-12 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-center text-white ${hideArrowsClass}`} 
                    />
                    {simMode === 'absoluto' ? 'num total de' : 'em'}
                    <input 
                      type="number" 
                      value={exam.max} 
                      onChange={(e) => handleUpdateSimExam(exam.id, 'max', e.target.value)} 
                      className={`w-12 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-center text-white ${hideArrowsClass}`} 
                    />
                    
                    {simMode === 'percentagem' && (
                      <>
                        <span className="text-zinc-500 mx-1">→ Vale</span>
                        <input 
                          type="number" 
                          value={exam.weight} 
                          onChange={(e) => handleUpdateSimExam(exam.id, 'weight', e.target.value)} 
                          className={`w-12 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-center text-white ${hideArrowsClass}`} 
                        />
                        %
                      </>
                    )}

                    <button onClick={() => handleRemoveSimExam(exam.id)} className="ml-1 p-1.5 text-zinc-500 hover:text-rose-400 transition-colors bg-zinc-900 rounded-lg shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={handleAddSimExam}
                className="w-full py-2.5 border border-dashed border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Avaliação Feita
              </button>
            </div>

            <div className="h-px bg-zinc-800 my-4" />

            <div className={`grid gap-4 ${simMode === 'percentagem' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
              {simMode === 'percentagem' && (
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1.5 font-medium">Peso do Próximo (%)</label>
                  <input 
                    type="number" 
                    value={simNextWeight}
                    onChange={(e) => setSimNextWeight(e.target.value)}
                    className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-lg text-center text-white font-mono font-bold focus:border-emerald-500 outline-none ${hideArrowsClass}`}
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1.5 font-medium">Cotado para (Max)</label>
                <input 
                  type="number" 
                  value={simNextMax}
                  onChange={(e) => setSimNextMax(e.target.value)}
                  className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-lg text-center text-white font-mono font-bold focus:border-emerald-500 outline-none ${hideArrowsClass}`}
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1.5 font-medium">Nota Desejada</label>
                <input 
                  type="number" 
                  value={simTarget}
                  onChange={(e) => setSimTarget(e.target.value)}
                  className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-lg text-center text-white font-mono font-bold focus:border-emerald-500 outline-none ${hideArrowsClass}`}
                />
              </div>

              {simMode === 'percentagem' && (
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1.5 font-medium">Cotada para (Max)</label>
                  <input 
                    type="number" 
                    value={simTargetMax}
                    onChange={(e) => setSimTargetMax(e.target.value)}
                    className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-lg text-center text-white font-mono font-bold focus:border-emerald-500 outline-none ${hideArrowsClass}`}
                  />
                </div>
              )}
            </div>

            <div className={`mt-2 p-5 rounded-xl border-2 flex items-center gap-4 ${
              isAlreadyDone ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
              !isPossible ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
              'bg-sky-500/10 border-sky-500/30 text-sky-400'
            }`}>
              {isAlreadyDone ? <Award className="w-8 h-8 shrink-0" /> : !isPossible ? <AlertCircle className="w-8 h-8 shrink-0" /> : <Target className="w-8 h-8 shrink-0" />}
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-0.5">Veredicto</div>
                <div className="text-base font-bold leading-tight">
                  {verdictText}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}