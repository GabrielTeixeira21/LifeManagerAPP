import React from 'react';
import { Flame, HeartHandshake, X, Zap } from 'lucide-react';

interface StreakReviveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRevive: () => void;
  chargesLeft: number;
  streakCount: number;
}

export const StreakReviveModal: React.FC<StreakReviveModalProps> = ({
  isOpen,
  onClose,
  onRevive,
  chargesLeft,
  streakCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 w-full max-w-md text-center space-y-5 shadow-2xl shadow-amber-500/10 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-20 h-20 bg-amber-500/15 border border-amber-500/30 rounded-3xl mx-auto flex items-center justify-center text-amber-400 animate-pulse">
          <Flame className="w-10 h-10 fill-amber-400/20" />
        </div>

        <div>
          <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            Alerta de Streak
          </span>
          <h2 className="text-2xl font-black text-white mt-2">A tua Chama Apagou!</h2>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Deixaste cair a consistência, mas estás dentro da janela de <strong className="text-zinc-200">2 dias</strong>. Podes usar 1 das tuas oportunidades mensais para recuperar os teus <strong className="text-amber-400">{streakCount} dias</strong>.
          </p>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 p-3.5 rounded-2xl flex items-center justify-between text-xs">
          <span className="text-zinc-400">Oportunidades este mês:</span>
          <span className="font-bold font-mono text-emerald-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> {chargesLeft} / 5 disponíveis
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Deixar Reiniciar
          </button>
          <button
            onClick={onRevive}
            disabled={chargesLeft <= 0}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            <HeartHandshake className="w-4 h-4" /> Restaurar Fogo (-1)
          </button>
        </div>
      </div>
    </div>
  );
};