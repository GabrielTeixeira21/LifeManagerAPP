import React, { useState } from 'react';
import { supabase } from './lib/supabase';
import { Flame, Lock, User, ArrowRight } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatEmailFromUsername = (u: string) => {
    // Normaliza o username para minúsculas e sem espaços
    const cleanUser = u.trim().toLowerCase().replace(/\s+/g, '');
    return `${cleanUser}@lifemanager.app`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    if (cleanUsername.length < 3) {
      setError('O username deve ter pelo menos 3 caracteres.');
      setLoading(false);
      return;
    }

    const syntheticEmail = formatEmailFromUsername(cleanUsername);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: syntheticEmail,
          password: password,
          options: {
            data: {
              username: cleanUsername,
              full_name: cleanUsername
            }
          }
        });
        if (error) throw error;

        // Se o Supabase tiver auto-confirm ativo, já cria a sessão diretamente
        if (data.session) {
          return;
        }

        alert('Conta criada com sucesso! Podes agora entrar com o teu username.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: syntheticEmail,
          password: password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Username ou palavra-passe incorretos.');
      } else if (err.message?.includes('User already registered')) {
        setError('Este username já está em uso. Escolhe outro.');
      } else {
        setError(err.message || 'Ocorreu um erro ao processar o login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Student Athlete OS</h1>
            <p className="text-xs text-zinc-400">O teu ecossistema de performance diária</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: gabriel21"
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-800/50 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Palavra-passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-800/50 border border-zinc-700/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'A processar...' : isSignUp ? 'Criar Conta' : 'Entrar no Hub'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer"
          >
            {isSignUp ? 'Já tens conta? Entrar com username' : 'Não tens conta? Criar novo registo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;