import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  User, Trophy, Flame, LogOut, 
  Edit3, X, Check, Lock, Camera 
} from 'lucide-react';

interface ProfileViewProps {
  userId: string;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ userId, onLogout }) => {
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Modais
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [passError, setPassError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) {
      setFullName(data.full_name || '');
      setBio(data.bio || '');
      setAvatarUrl(data.avatar_url || '');
    }
  };

  // Upload e conversão direta para Base64 da imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setAvatarUrl(base64String);
        await supabase.from('profiles').upsert({ id: userId, avatar_url: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: fullName,
      bio: bio,
      avatar_url: avatarUrl
    });

    if (!error) {
      setMsg('Perfil atualizado com sucesso!');
      setTimeout(() => {
        setMsg('');
        setIsEditing(false);
      }, 1200);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setMsg('');

    if (newPassword.length < 6) {
      setPassError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('As palavras-passe não coincidem.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPassError(error.message);
    } else {
      setMsg('Palavra-passe alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setMsg('');
        setIsChangingPass(false);
      }, 1500);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Input invisível para carregar foto */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Header do Perfil */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* Clicar na imagem abre ficheiros no PC ou Telemóvel */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-2xl bg-zinc-800 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 overflow-hidden flex items-center justify-center text-emerald-400 cursor-pointer relative group transition-all"
            title="Clica para alterar foto"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-9 h-9 text-zinc-500" />
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
              <Camera className="w-6 h-6" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">{fullName || 'Estudante Atleta'}</h2>
            <p className="text-xs text-zinc-400">{bio || 'Clica na imagem para colocar foto de perfil'}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="py-2.5 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Edit3 className="w-4 h-4" /> Editar Perfil
          </button>
          <button
            onClick={() => setIsChangingPass(true)}
            className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4 text-amber-400" /> Alterar Password
          </button>
          <button
            onClick={onLogout}
            className="py-2.5 px-4 bg-zinc-800 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </div>

      {/* Modal: Editar Perfil */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Editar Perfil</h3>
              <button onClick={() => setIsEditing(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {msg && <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">{msg}</div>}

            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Bio / Descrição</label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ex: 400m Barreiras | Engenharia Informática"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 bg-zinc-800 text-zinc-400 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Alterar Password (2 Campos de Confirmação) */}
      {isChangingPass && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" /> Alterar Palavra-passe
              </h3>
              <button onClick={() => setIsChangingPass(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {passError && <div className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{passError}</div>}
            {msg && <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">{msg}</div>}

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nova Palavra-passe</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Confirmar Nova Palavra-passe</label>
                <input
                  type="password"
                  required
                  placeholder="Repete a nova palavra-passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPass(false)}
                  className="flex-1 py-2.5 bg-zinc-800 text-zinc-400 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Atualizar Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conquistas */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" /> Conquistas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 bg-zinc-800/40 border border-zinc-800 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Primeiro PB</h4>
              <p className="text-[11px] text-zinc-400">Registar um recorde pessoal oficial</p>
            </div>
          </div>
          <div className="p-4 bg-zinc-800/40 border border-zinc-800 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">7 Dias em Chama</h4>
              <p className="text-[11px] text-zinc-400">Streak diário superior a 85%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};