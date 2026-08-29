import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  User, Trophy, Flame, Dumbbell, 
  GraduationCap, LogOut, Save 
} from 'lucide-react';

interface ProfileViewProps {
  userId: string;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ userId, onLogout }) => {
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setFullName(data.full_name || '');
      setBio(data.bio || '');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: fullName,
      bio: bio
    });

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setLoading(false);
  };

  const achievements = [
    { title: 'Primeiro PB', desc: 'Registar um recorde pessoal oficial', icon: Trophy, unlocked: true },
    { title: '7 Dias em Chama', desc: 'Completar mais de 85% dos objetivos durante 7 dias', icon: Flame, unlocked: true },
    { title: 'Atleta Consistente', desc: 'Registar 10 treinos de pista e ginásio', icon: Dumbbell, unlocked: true },
    { title: 'Excelência Académica', desc: 'Manter a média acima de 15 valores', icon: GraduationCap, unlocked: true },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Card Principal de Perfil */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{fullName || 'Estudante Atleta'}</h2>
            <p className="text-xs text-zinc-400">{bio || 'Performance Diária & Organização'}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="py-2 px-4 bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 border border-zinc-700/60 hover:border-red-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Terminar Sessão
        </button>
      </div>

      {/* Editar Perfil */}
      <form onSubmit={handleSaveProfile} className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white">Editar Perfil Pessoal</h3>
        
        <div>
          <label className="text-xs text-zinc-400 block mb-1">Nome Completo</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="O teu nome"
            className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-400 block mb-1">Bio / Descrição</label>
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Ex: Velocista 400m | Engenharia Informática"
            className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {loading ? 'A guardar...' : saved ? 'Guardado com Sucesso!' : 'Atualizar Perfil'}
        </button>
      </form>

      {/* Conquistas / Achievements */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" /> Galeria de Conquistas (Achievements)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {achievements.map((ach, i) => {
            const Icon = ach.icon;
            return (
              <div key={i} className="p-4 bg-zinc-800/40 border border-zinc-800 rounded-xl flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{ach.title}</h4>
                  <p className="text-[11px] text-zinc-400">{ach.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};