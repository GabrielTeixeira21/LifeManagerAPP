import { useState } from 'react';
import { supabase } from './lib/supabase';
import { Crown, ArrowRight, Lock, User as UserIcon } from 'lucide-react';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const authEmail = `${username.trim().toLowerCase().replace(/\s+/g, '')}@lifemanager.app`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Preenche o username e a palavra-passe.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: password,
          options: {
            data: {
              full_name: username.trim(),
              username: username.trim().toLowerCase(),
            },
          },
        });
        if (error) throw error;

        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: username.trim(),
            username: username.trim().toLowerCase(),
            theme: 'gold'
          });
        }
      }
    } catch (err: any) {
      console.error('Erro na autenticação:', err);
      setErrorMsg(
        err.message === 'Invalid login credentials'
          ? 'Username ou palavra-passe incorretos.'
          : err.message || 'Ocorreu um erro na autenticação.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#080b0e] text-zinc-100">
      <div className="w-full max-w-md rounded-3xl p-8 border border-[#d4af37]/30 bg-[#0e1217]/95 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        {/* Glow Dourado de Fundo */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow-lg shadow-[#d4af37]/10">
            <Crown className="w-6 h-6 fill-[#d4af37]/30 text-[#d4af37]" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
              Life Manager <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-amber-300 to-amber-500 text-zinc-950 font-black rounded shadow-sm">PRO</span>
            </h1>
            <p className="text-xs text-zinc-400">O teu ecossistema de performance diária</p>
          </div>
        </div>

        {/* Seletor Iniciar Sessão / Criar Conta */}
        <div className="grid grid-cols-2 p-1 bg-black/50 rounded-xl border border-white/[0.08] mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setErrorMsg(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isLogin
                ? 'bg-[#d4af37]/25 text-[#f5d77f] border border-[#d4af37]/50 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Iniciar Sessão
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setErrorMsg(null); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !isLogin
                ? 'bg-[#d4af37]/25 text-[#f5d77f] border border-[#d4af37]/50 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Mensagem de Erro */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Username</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: atleta_10"
                className="w-full bg-[#080b0e] border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Palavra-passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#080b0e] border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #fce082 0%, #ffd700 50%, #d4af37 100%)',
              color: '#0a0d12',
            }}
            className="w-full mt-3 py-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-[#d4af37]/20 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'A processar...' : isLogin ? 'Entrar' : 'Criar Registo'}</span>
            <ArrowRight className="w-4 h-4 text-zinc-950" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(null); }}
            className="text-[11px] text-zinc-400 hover:text-[#f5d77f] transition-colors cursor-pointer"
          >
            {isLogin ? 'Não tens conta? Criar novo registo' : 'Já tens conta? Iniciar Sessão'}
          </button>
        </div>
      </div>
    </div>
  );
}