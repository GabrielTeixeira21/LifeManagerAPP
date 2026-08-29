import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  GraduationCap, Plus, Calendar, 
  Calculator, Clock, Trash2, CheckCircle2 
} from 'lucide-react';

interface UniversityViewProps {
  userId: string;
}

export const UniversityView = ({ userId }: UniversityViewProps) => {
  const [subTab, setSubTab] = useState<'schedule' | 'grades' | 'deadlines'>('grades');
  const [loading, setLoading] = useState(false);

  // Estados de Cadeiras e Notas
  const [courses, setCourses] = useState<any[]>([]);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseEcts, setNewCourseEcts] = useState(6);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  
  // Notas
  const [evalName, setEvalName] = useState('');
  const [evalWeight, setEvalWeight] = useState('');
  const [evalGrade, setEvalGrade] = useState('');
  const [courseGrades, setCourseGrades] = useState<any[]>([]);

  // Deadlines & Exames
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [deadlineTitle, setDeadlineTitle] = useState('');
  const [deadlineType, setDeadlineType] = useState('exame');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineLocation, setDeadlineLocation] = useState('');

  useEffect(() => {
    loadUniversityData();
  }, [userId, subTab]);

  const loadUniversityData = async () => {
    setLoading(true);
    // Carregar cadeiras
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (coursesData) {
      setCourses(coursesData);
      if (!selectedCourseId && coursesData.length > 0) {
        setSelectedCourseId(coursesData[0].id);
      }
    }

    // Carregar notas
    const { data: gradesData } = await supabase
      .from('course_grades')
      .select('*, courses(name)')
      .eq('user_id', userId);
    if (gradesData) setCourseGrades(gradesData);

    // Carregar deadlines
    const { data: deadlinesData } = await supabase
      .from('academic_deadlines')
      .select('*, courses(name)')
      .eq('user_id', userId)
      .order('deadline_date', { ascending: true });
    if (deadlinesData) setDeadlines(deadlinesData);

    setLoading(false);
  };

  // Criar cadeira
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName) return;

    const { data, error } = await supabase
      .from('courses')
      .insert({
        user_id: userId,
        name: newCourseName,
        ects: newCourseEcts,
        status: 'em_curso'
      })
      .select()
      .single();

    if (!error && data) {
      setNewCourseName('');
      setSelectedCourseId(data.id);
      loadUniversityData();
    }
  };

  // Adicionar avaliação à cadeira selecionada
  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !evalName || !evalGrade || !evalWeight) return;

    const gradeVal = parseFloat(evalGrade.replace(',', '.'));
    const weightVal = parseFloat(evalWeight.replace(',', '.'));

    const { error } = await supabase.from('course_grades').insert({
      user_id: userId,
      course_id: selectedCourseId,
      evaluation_name: evalName,
      grade: gradeVal,
      weight_percent: weightVal
    });

    if (!error) {
      setEvalName('');
      setEvalGrade('');
      setEvalWeight('');
      loadUniversityData();
    }
  };

  // Adicionar Deadline / Exame
  const handleAddDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadlineTitle || !deadlineDate) return;

    const { error } = await supabase.from('academic_deadlines').insert({
      user_id: userId,
      course_id: selectedCourseId || null,
      title: deadlineTitle,
      type: deadlineType,
      deadline_date: new Date(deadlineDate).toISOString(),
      location: deadlineLocation,
      status: 'por_comecar'
    });

    if (!error) {
      setDeadlineTitle('');
      setDeadlineDate('');
      setDeadlineLocation('');
      loadUniversityData();
    }
  };

  const calculateCourseAverage = (courseId: string) => {
    const grades = courseGrades.filter(g => g.course_id === courseId);
    if (grades.length === 0) return null;

    let totalWeighted = 0;
    let totalWeight = 0;

    grades.forEach(g => {
      totalWeighted += (Number(g.grade) * Number(g.weight_percent));
      totalWeight += Number(g.weight_percent);
    });

    if (totalWeight === 0) return null;
    return (totalWeighted / totalWeight).toFixed(2);
  };

  const calculateGlobalAverage = () => {
    const averages: number[] = [];
    courses.forEach(c => {
      const avg = calculateCourseAverage(c.id);
      if (avg !== null) averages.push(parseFloat(avg));
    });
    if (averages.length === 0) return '—';
    return (averages.reduce((a, b) => a + b, 0) / averages.length).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner de Média Global */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-900 border border-indigo-500/20 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Média Atual</span>
          <div className="text-3xl font-black text-white mt-1 font-mono">{calculateGlobalAverage()} <span className="text-xs text-zinc-400 font-normal">/ 20</span></div>
          <p className="text-[11px] text-zinc-400 mt-1">Calculada automaticamente com pesos</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cadeiras Ativas</span>
          <div className="text-3xl font-black text-white mt-1 font-mono">{courses.length}</div>
          <p className="text-[11px] text-emerald-400 mt-1">Semestre Atual</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Próximos Exames</span>
          <div className="text-3xl font-black text-white mt-1 font-mono">
            {deadlines.filter(d => d.type === 'exame' || d.type === 'frequencia').length}
          </div>
          <p className="text-[11px] text-amber-400 mt-1">Avaliações agendadas</p>
        </div>
      </div>

      {/* Navegação Secundária */}
      <div className="flex gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
        {[
          { id: 'grades', label: 'Cadeiras & Médias', icon: Calculator },
          { id: 'deadlines', label: 'Exames & Deadlines', icon: Clock },
          { id: 'schedule', label: 'Horário Semanal', icon: Calendar },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SEPARADOR: CADEIRAS & NOTAS */}
      {subTab === 'grades' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            {/* Criar Cadeira */}
            <form onSubmit={handleAddCourse} className="bg-zinc-900/80 border border-zinc-800/80 p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" /> Nova Cadeira
              </h3>
              <input
                type="text"
                placeholder="Ex: Programação, Álgebra, Redes"
                value={newCourseName}
                onChange={e => setNewCourseName(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                required
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="ECTS (ex: 6)"
                  value={newCourseEcts}
                  onChange={e => setNewCourseEcts(parseInt(e.target.value) || 6)}
                  className="w-24 bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-center text-white"
                />
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
            </form>

            {/* Adicionar Nota à Cadeira Selecionada */}
            {courses.length > 0 && (
              <form onSubmit={handleAddGrade} className="bg-zinc-900/80 border border-zinc-800/80 p-5 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-sky-400" /> Registar Avaliação
                </h3>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Cadeira</label>
                  <select
                    value={selectedCourseId}
                    onChange={e => setSelectedCourseId(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Elemento (ex: Teste 1, Projeto)"
                  value={evalName}
                  onChange={e => setEvalName(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                  required
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nota (0-20)"
                    value={evalGrade}
                    onChange={e => setEvalGrade(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-center text-white font-bold"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Peso % (ex: 40)"
                    value={evalWeight}
                    onChange={e => setEvalWeight(e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-center text-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Guardar Nota
                </button>
              </form>
            )}
          </div>

          {/* Lista de Cadeiras com Médias e Notas Detalhadas */}
          <div className="lg:col-span-2 space-y-4">
            {courses.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-500">
                Ainda não adicionaste cadeiras este semestre.
              </div>
            ) : (
              courses.map(course => {
                const grades = courseGrades.filter(g => g.course_id === course.id);
                const courseAvg = calculateCourseAverage(course.id);

                return (
                  <div key={course.id} className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-base font-bold text-white">{course.name}</h4>
                        <span className="text-xs text-zinc-400">{course.ects} ECTS</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-zinc-400 block">Média da Cadeira</span>
                        <span className="text-xl font-black text-sky-400 font-mono">
                          {courseAvg ? `${courseAvg} val` : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
                      {grades.length === 0 ? (
                        <span className="text-xs text-zinc-500 italic">Sem notas registadas.</span>
                      ) : (
                        grades.map(g => (
                          <div key={g.id} className="flex justify-between items-center text-xs p-2 bg-zinc-800/40 rounded-lg">
                            <span className="text-zinc-300 font-medium">{g.evaluation_name} <span className="text-zinc-500">({g.weight_percent}%)</span></span>
                            <span className="font-bold font-mono text-emerald-400">{g.grade}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SEPARADOR: DEADLINES & EXAMES */}
      {subTab === 'deadlines' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddDeadline} className="bg-zinc-900/80 border border-zinc-800/80 p-5 rounded-2xl space-y-4 h-fit">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-400" /> Agendar Exame / Deadline
            </h3>

            <input
              type="text"
              placeholder="Título (ex: Exame Época Normal)"
              value={deadlineTitle}
              onChange={e => setDeadlineTitle(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
              required
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                value={deadlineType}
                onChange={e => setDeadlineType(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
              >
                <option value="exame">Exame</option>
                <option value="frequencia">Frequência</option>
                <option value="entrega">Trabalho</option>
                <option value="apresentacao">Apresentação</option>
              </select>

              <input
                type="datetime-local"
                value={deadlineDate}
                onChange={e => setDeadlineDate(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                required
              />
            </div>

            <input
              type="text"
              placeholder="Sala / Local (ex: Sala B2)"
              value={deadlineLocation}
              onChange={e => setDeadlineLocation(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
            />

            <button
              type="submit"
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Adicionar Deadline
            </button>
          </form>

          <div className="lg:col-span-2 space-y-3">
            {deadlines.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-500">
                Nenhum exame ou deadline pendente.
              </div>
            ) : (
              deadlines.map(d => (
                <div key={d.id} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400">{d.type}</span>
                    <h4 className="text-sm font-bold text-white">{d.title}</h4>
                    <span className="text-xs text-zinc-400">{new Date(d.deadline_date).toLocaleString('pt-PT')} {d.location && `• ${d.location}`}</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-lg">
                    {d.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SEPARADOR: HORÁRIO */}
      {subTab === 'schedule' && (
        <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-400">
          <Calendar className="w-8 h-8 text-sky-400 mx-auto mb-2" />
          Grelha de Horário Semanal por dias da semana ativa no Supabase.
        </div>
      )}
    </div>
  );
};