import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit3, Clock, MapPin, AlertCircle, 
  CheckCircle2, CalendarDays, ChevronUp, X
} from 'lucide-react';

interface UniversityViewProps {
  userId: string;
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

// 1. Removido o Sábado
const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const START_HOUR = 8;  // 08:00
const END_HOUR = 19;   // 19:00
// 2. Altura aumentada para melhor leitura (de 38 para 72)
const ROW_HEIGHT_PX = 72; 

const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

export function UniversityView({ userId }: UniversityViewProps) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Estados de Criação / Edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [courseName, setCourseName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Segunda');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [room, setRoom] = useState('');
  const [classType, setClassType] = useState('Teórica');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, [userId]);

  const loadSchedule = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('academic_schedule')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSchedule(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar horário:', err);
      setErrorMsg('Não foi possível carregar o horário.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) {
      setErrorMsg('Insere o nome da cadeira / disciplina.');
      return;
    }

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
        class_type: classType
      };

      if (editingId) {
        const { data, error } = await supabase
          .from('academic_schedule')
          .update(payload)
          .eq('id', editingId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;

        setSchedule(prev => prev.map(item => item.id === editingId ? data : item));
        setSuccessMsg(`Aula de ${courseName} atualizada!`);
      } else {
        const { data, error } = await supabase
          .from('academic_schedule')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        setSchedule(prev => [...prev, data]);
        setSuccessMsg(`Aula de ${courseName} adicionada com sucesso!`);
      }

      resetForm();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Erro ao gravar aula:', err);
      setErrorMsg(err.message || 'Erro ao guardar dados da aula.');
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tens a certeza que queres remover a aula de "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('academic_schedule')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      setSchedule(prev => prev.filter(item => item.id !== id));
      if (editingId === id) resetForm();
    } catch (err: any) {
      console.error('Erro ao apagar aula:', err);
      setErrorMsg('Erro ao remover aula.');
    }
  };

  const calculateCardPosition = (startTimeStr: string, endTimeStr: string) => {
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const [endH, endM] = endTimeStr.split(':').map(Number);

    const startMinutesFromBase = (startH - START_HOUR) * 60 + startM;
    const endMinutesFromBase = (endH - START_HOUR) * 60 + endM;
    const durationMinutes = Math.max(30, endMinutesFromBase - startMinutesFromBase);

    const pxPerMinute = ROW_HEIGHT_PX / 60;
    const top = Math.max(0, startMinutesFromBase * pxPerMinute);
    const height = Math.max(26, durationMinutes * pxPerMinute - 2);

    return { top, height };
  };

  const getClassTheme = (type?: string) => {
    switch (type) {
      case 'Teórica':
        return {
          card: 'bg-sky-950/90 border-sky-500/50 text-sky-200 hover:border-sky-400',
          badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
        };
      case 'Prática':
        return {
          card: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 hover:border-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        };
      case 'Teórico-Prática':
      default:
        return {
          card: 'bg-amber-950/90 border-amber-500/50 text-amber-200 hover:border-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        };
    }
  };

  const totalGridHeight = HOURS.length * ROW_HEIGHT_PX;

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono text-sky-400 font-semibold uppercase tracking-wider">
            Área Académica
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            Horário Semanal & Disciplinas
          </h2>
        </div>

        <button
          onClick={() => {
            if (showAddForm) resetForm();
            else setShowAddForm(true);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer shadow-md"
        >
          {showAddForm ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showAddForm ? 'Fechar Painel' : 'Adicionar Aula'}
        </button>
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Formulário Retrátil */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-5 bg-zinc-900/90 border border-zinc-800 shadow-xl backdrop-blur-md overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                {editingId ? <Edit3 className="w-3.5 h-3.5 text-amber-400" /> : <Plus className="w-3.5 h-3.5 text-sky-400" />}
                {editingId ? 'Editar Aula' : 'Nova Cadeira no Horário'}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSaveSchedule} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium">Nome da Disciplina *</label>
                <input
                  type="text"
                  placeholder="Ex: Análise Matemática..."
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium">Dia da Semana</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  {DAYS.map(d => (
                    <option key={d} value={d}>{d}-feira</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium">Tipo de Aula</label>
                <select
                  value={classType}
                  onChange={(e) => setClassType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Teórica">Teórica</option>
                  <option value="Prática">Prática</option>
                  <option value="Teórico-Prática">Teórico-Prática</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium">Hora de Início</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium">Hora de Fim</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium">Sala / Bloco (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Sala D.2.1"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 mt-1">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-1.5 rounded-xl text-zinc-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                    editingId ? 'bg-amber-400 hover:bg-amber-300' : 'bg-sky-500 hover:bg-sky-400'
                  }`}
                >
                  {editingId ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {isSubmitting ? 'A guardar...' : editingId ? 'Guardar Alterações' : 'Confirmar e Adicionar'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grelha Semanal (Scroll horizontal em ecrãs muito pequenos) */}
      <div className="rounded-2xl p-4 bg-zinc-900/60 border border-zinc-800 shadow-xl overflow-x-auto">
        <div className="min-w-[700px]"> {/* Força uma largura mínima para a tabela não esmagar em mobile */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Grelha Horária Semanal</h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400 inline-block"/> Teórica</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/> Prática</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/> Teórico-Prática</span>
            </div>
          </div>

          {loading ? (
            <div className="text-xs text-zinc-500 py-8 text-center font-mono">A carregar horário...</div>
          ) : (
            <div className="w-full">
              {/* Cabeçalho dos Dias (Alterado para 5 colunas de dias = grid-cols-5) */}
              <div className="grid grid-cols-[56px_repeat(5,1fr)] border-b border-zinc-800 pb-1.5 text-center text-xs font-bold text-zinc-400">
                <div className="font-mono text-[11px] text-zinc-500">Hora</div>
                {DAYS.map(day => (
                  <div key={day} className="border-l border-zinc-800/60 text-zinc-200">
                    {day}-feira
                  </div>
                ))}
              </div>

              {/* Corpo da Grelha (Alterado para 5 colunas de dias) */}
              <div className="relative grid grid-cols-[56px_repeat(5,1fr)]" style={{ height: `${totalGridHeight}px` }}>
                {/* Linhas de Fundo (Alterado para col-span-6: 1 hora + 5 dias) */}
                <div className="col-span-6 absolute inset-0 pointer-events-none flex flex-col">
                  {HOURS.map(h => (
                    <div 
                      key={h} 
                      style={{ height: `${ROW_HEIGHT_PX}px` }} 
                      className="border-b border-zinc-800/40 w-full"
                    />
                  ))}
                </div>

                {/* Coluna das Horas */}
                <div className="flex flex-col z-10 select-none">
                  {HOURS.map(h => (
                    <div 
                      key={h} 
                      style={{ height: `${ROW_HEIGHT_PX}px` }}
                      className="flex items-start justify-center font-mono text-[11px] text-zinc-500 font-semibold pt-1"
                    >
                      {h.toString().padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Colunas dos Dias da Semana */}
                {DAYS.map(day => {
                  const dayClasses = schedule.filter(item => 
                    item.day_of_week.toLowerCase().startsWith(day.toLowerCase())
                  );

                  return (
                    <div key={day} className="relative border-l border-zinc-800/60 h-full">
                      {dayClasses.map(c => {
                        const { top, height } = calculateCardPosition(c.start_time, c.end_time);
                        const theme = getClassTheme(c.class_type);

                        return (
                          <div
                            key={c.id}
                            style={{
                              position: 'absolute',
                              top: `${top}px`,
                              height: `${height}px`,
                              left: '4px',
                              right: '4px',
                            }}
                            className={`rounded-lg border p-2 text-xs flex flex-col justify-between overflow-hidden transition-all shadow-md group z-20 ${theme.card}`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1 leading-tight">
                                <span className="font-bold text-[12px] text-white line-clamp-2">
                                  {c.course_name}
                                </span>
                                
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-black/60 rounded px-1.5 py-1">
                                  <button
                                    onClick={() => handleStartEdit(c)}
                                    className="hover:text-amber-400 transition-colors cursor-pointer"
                                    title="Editar aula"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(c.id, c.course_name)}
                                    className="hover:text-rose-400 transition-colors cursor-pointer"
                                    title="Apagar aula"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="text-[10px] font-mono opacity-85 mt-1 flex items-center gap-1.5">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>{c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-1">
                              {c.room ? (
                                <div className="text-[10px] font-mono opacity-80 flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{c.room}</span>
                                </div>
                              ) : <span />}

                              {c.class_type && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${theme.badge}`}>
                                  {c.class_type}
                                </span>
                              )}
                            </div>
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
  );
}