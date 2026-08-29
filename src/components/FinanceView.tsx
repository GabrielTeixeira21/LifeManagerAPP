import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Wallet, Plus, PiggyBank, ArrowUpRight, 
  ArrowDownRight, Trash2, Target 
} from 'lucide-react';

interface FinanceViewProps {
  userId: string;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ userId }) => {
  const [subTab, setSubTab] = useState<'overview' | 'savings'>('overview');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [savings, setSavings] = useState<any[]>([]);

  // Formulário Despesa / Receita
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'despesa' | 'receita'>('despesa');
  const [category, setCategory] = useState('Comida');
  const [description, setDescription] = useState('');

  // Formulário Poupança
  const [savingTitle, setSavingTitle] = useState('');
  const [savingTarget, setSavingTarget] = useState('');
  const [savingCurrent, setSavingCurrent] = useState('');

  useEffect(() => {
    loadFinanceData();
  }, [userId]);

  const loadFinanceData = async () => {
    const { data: transData } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (transData) setTransactions(transData);

    const { data: saveGoals } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (saveGoals) setSavings(saveGoals);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val)) return;

    const { error } = await supabase.from('finance_transactions').insert({
      user_id: userId,
      amount: val,
      type: type,
      category_name: category,
      description: description,
      date: new Date().toISOString().split('T')[0]
    });

    if (!error) {
      setAmount('');
      setDescription('');
      loadFinanceData();
    }
  };

  const handleAddSaving = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(savingTarget.replace(',', '.'));
    const currentVal = parseFloat(savingCurrent.replace(',', '.') || '0');
    if (isNaN(targetVal)) return;

    const { error } = await supabase.from('savings_goals').insert({
      user_id: userId,
      title: savingTitle,
      target_amount: targetVal,
      current_amount: currentVal
    });

    if (!error) {
      setSavingTitle('');
      setSavingTarget('');
      setSavingCurrent('');
      loadFinanceData();
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    await supabase.from('finance_transactions').delete().eq('id', id);
    loadFinanceData();
  };

  // Cálculos
  const totalReceitas = transactions
    .filter(t => t.type === 'receita')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalDespesas = transactions
    .filter(t => t.type === 'despesa')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const saldoDisponivel = totalReceitas - totalDespesas;

  return (
    <div className="space-y-6">
      {/* Top Banner Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/20 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Saldo Disponível</span>
          <div className="text-3xl font-black text-white mt-1 font-mono">€{saldoDisponivel.toFixed(2)}</div>
          <p className="text-[11px] text-zinc-400 mt-1">Atualizado em tempo real</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Total de Despesas</span>
          <div className="text-3xl font-black text-white mt-1 font-mono">€{totalDespesas.toFixed(2)}</div>
          <p className="text-[11px] text-zinc-400 mt-1">Gastos do período</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Total em Poupanças</span>
          <div className="text-3xl font-black text-white mt-1 font-mono">
            €{savings.reduce((acc, curr) => acc + Number(curr.current_amount), 0).toFixed(2)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Objetivos ativos</p>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            subTab === 'overview'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Wallet className="w-4 h-4" /> Movimentos & Despesas
        </button>
        <button
          onClick={() => setSubTab('savings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            subTab === 'savings'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <PiggyBank className="w-4 h-4" /> Metas de Poupança
        </button>
      </div>

      {/* 1. SEPARADOR: MOVIMENTOS */}
      {subTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddTransaction} className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-4 h-fit">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Registar Movimento
            </h3>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('despesa')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${type === 'despesa' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-zinc-800 text-zinc-400'}`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => setType('receita')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${type === 'receita' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'}`}
              >
                Receita / Entrada
              </button>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Valor (€)</label>
              <input
                type="text"
                placeholder="Ex: 12.50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                >
                  <option>Comida</option>
                  <option>Transportes</option>
                  <option>Lazer</option>
                  <option>Material Escolar</option>
                  <option>Equipamento / Spikes</option>
                  <option>Suplementação</option>
                  <option>Outro</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Almoço cantina"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Guardar Movimento
            </button>
          </form>

          {/* Lista de Movimentos */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-white">Histórico Recente</h3>
            {transactions.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-500">
                Nenhum movimento registado.
              </div>
            ) : (
              transactions.map(t => (
                <div key={t.id} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${t.type === 'receita' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {t.type === 'receita' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{t.description || t.category_name}</div>
                      <div className="text-[10px] text-zinc-400">{t.date} • {t.category_name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-black font-mono ${t.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.type === 'receita' ? '+' : '-'}€{Number(t.amount).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDeleteTransaction(t.id)}
                      className="text-zinc-600 hover:text-red-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. SEPARADOR: POUPANÇAS */}
      {subTab === 'savings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddSaving} className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-4 h-fit">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Novo Objetivo de Poupança
            </h3>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Título</label>
              <input
                type="text"
                placeholder="Ex: Viagem, Portátil, Spikes Nike"
                value={savingTitle}
                onChange={(e) => setSavingTitle(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Meta (€)</label>
                <input
                  type="text"
                  placeholder="Ex: 800"
                  value={savingTarget}
                  onChange={(e) => setSavingTarget(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Já Poupado (€)</label>
                <input
                  type="text"
                  placeholder="Ex: 150"
                  value={savingCurrent}
                  onChange={(e) => setSavingCurrent(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Criar Meta
            </button>
          </form>

          {/* Cards de Poupança */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savings.map(s => {
              const current = Number(s.current_amount);
              const target = Number(s.target_amount);
              const progress = Math.min(100, Math.round((current / target) * 100));

              return (
                <div key={s.id} className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white">{s.title}</h4>
                      <span className="text-xs text-zinc-400">Meta de Poupança</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 font-mono">{progress}%</span>
                  </div>

                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>

                  <div className="flex justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800">
                    <span>Poupado: <strong className="text-white">€{current}</strong></span>
                    <span>Objetivo: <strong className="text-white">€{target}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};