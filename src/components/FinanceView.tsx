import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Wallet, Plus, PiggyBank, ArrowUpRight, 
  ArrowDownRight, Trash2, Edit2, X, Check 
} from 'lucide-react';

interface FinanceViewProps {
  userId: string;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ userId }) => {
  const [subTab, setSubTab] = useState<'overview' | 'savings'>('overview');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [savings, setSavings] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Formulário Movimento
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'despesa' | 'receita'>('despesa');
  const [category, setCategory] = useState('Comida');
  const [description, setDescription] = useState('');

  // Formulário Nova Poupança
  const [savingTitle, setSavingTitle] = useState('');
  const [savingTarget, setSavingTarget] = useState('');
  const [adjustAmount, setAdjustAmount] = useState<{[key: string]: string}>({});

  // Edição de Poupança
  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTarget, setEditTarget] = useState('');

  useEffect(() => {
    loadFinanceData();
  }, [userId]);

  const loadFinanceData = async () => {
    const { data: transData, error: transError } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (transError) console.error('Erro transações:', transError);
    if (transData) setTransactions(transData);

    const { data: saveGoals, error: saveError } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (saveError) console.error('Erro metas:', saveError);
    if (saveGoals) setSavings(saveGoals);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      setErrorMessage('Introduz um valor válido superior a 0.');
      return;
    }

    const catValue = type === 'receita' ? 'Entrada' : category;
    const descValue = description.trim() || catValue;

    // Envia tanto 'category' como 'category_name' para cobrir qualquer versão da tabela
    const { error } = await supabase.from('finance_transactions').insert({
      user_id: userId,
      amount: val,
      type: type,
      category: catValue,
      category_name: catValue,
      description: descValue,
      date: new Date().toISOString().split('T')[0]
    });

    if (error) {
      console.error('Erro ao inserir:', error);
      setErrorMessage(error.message);
    } else {
      setAmount('');
      setDescription('');
      loadFinanceData();
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    await supabase.from('finance_transactions').delete().eq('id', id);
    loadFinanceData();
  };

  const handleAdjustSaving = async (goalId: string, currentVal: number, isDeposit: boolean) => {
    const rawVal = adjustAmount[goalId];
    const val = parseFloat(rawVal?.replace(',', '.') || '0');
    if (isNaN(val) || val <= 0) return;

    const newVal = isDeposit ? currentVal + val : Math.max(0, currentVal - val);

    await supabase.from('savings_goals').update({ current_amount: newVal }).eq('id', goalId);

    await supabase.from('finance_transactions').insert({
      user_id: userId,
      amount: val,
      type: isDeposit ? 'despesa' : 'receita',
      category: 'Poupança',
      category_name: 'Poupança',
      description: isDeposit ? 'Alocação para poupança' : 'Resgate de poupança',
      date: new Date().toISOString().split('T')[0]
    });

    setAdjustAmount({ ...adjustAmount, [goalId]: '' });
    loadFinanceData();
  };

  const handleSaveEditGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;
    const targetVal = parseFloat(editTarget.replace(',', '.'));
    if (isNaN(targetVal) || !editTitle.trim()) return;

    await supabase.from('savings_goals').update({
      title: editTitle.trim(),
      target_amount: targetVal
    }).eq('id', editingGoal.id);

    setEditingGoal(null);
    loadFinanceData();
  };

  const handleDeleteSavingGoal = async (id: string) => {
    await supabase.from('savings_goals').delete().eq('id', id);
    loadFinanceData();
  };

  const totalReceitas = transactions
    .filter(t => t.type === 'receita')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalDespesas = transactions
    .filter(t => t.type === 'despesa')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const saldoDisponivel = totalReceitas - totalDespesas;

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/20 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Saldo Disponível</span>
          <div className="text-3xl font-black text-white mt-1 font-mono">€{saldoDisponivel.toFixed(2)}</div>
          <p className="text-[11px] text-zinc-400 mt-1">Líquido após despesas e alocações</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Total Despesas</span>
          <div className="text-3xl font-black text-white mt-1 font-mono">€{totalDespesas.toFixed(2)}</div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Total em Poupanças</span>
          <div className="text-3xl font-black text-white mt-1 font-mono">
            €{savings.reduce((acc, curr) => acc + Number(curr.current_amount), 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Navegação */}
      <div className="flex gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <button
          onClick={() => setSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${subTab === 'overview' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-zinc-400'}`}
        >
          <Wallet className="w-4 h-4" /> Movimentos
        </button>
        <button
          onClick={() => setSubTab('savings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${subTab === 'savings' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'text-zinc-400'}`}
        >
          <PiggyBank className="w-4 h-4" /> Metas de Poupança
        </button>
      </div>

      {/* 1. MOVIMENTOS */}
      {subTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddTransaction} className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-4 h-fit">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Registar Movimento
            </h3>

            {errorMessage && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                {errorMessage}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('despesa')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer ${type === 'despesa' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-zinc-800 text-zinc-400'}`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => setType('receita')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer ${type === 'receita' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400'}`}
              >
                Receita
              </button>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Valor (€)</label>
              <input
                type="text"
                placeholder="Ex: 15.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white font-bold"
                required
              />
            </div>

            {type === 'despesa' && (
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
                  <option>Material</option>
                  <option>Suplementos</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-xs text-zinc-400 block mb-1">Descrição</label>
              <input
                type="text"
                placeholder={type === 'receita' ? 'Ex: Mesada, Bolsa' : 'Ex: Almoço'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
                required={type === 'receita'}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer transition-colors"
            >
              Guardar Movimento
            </button>
          </form>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Histórico de Transações</span>
              <span className="text-xs font-normal text-zinc-500">{transactions.length} registos</span>
            </h3>

            {transactions.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-500">
                Ainda não registaste movimentos.
              </div>
            ) : (
              transactions.map(t => (
                <div key={t.id} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${t.type === 'receita' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {t.type === 'receita' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{t.description}</div>
                      <div className="text-[10px] text-zinc-500">{t.date} {t.type === 'despesa' && `• ${t.category_name || t.category || 'Geral'}`}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-black font-mono ${t.type === 'receita' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.type === 'receita' ? '+' : '-'}€{Number(t.amount).toFixed(2)}
                    </span>
                    <button onClick={() => handleDeleteTransaction(t.id)} className="text-zinc-600 hover:text-red-400 p-1 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. POUPANÇAS */}
      {subTab === 'savings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={async (e) => {
            e.preventDefault();
            const target = parseFloat(savingTarget.replace(',', '.'));
            if (!savingTitle || isNaN(target) || target <= 0) return;
            await supabase.from('savings_goals').insert({ 
              user_id: userId, 
              title: savingTitle.trim(), 
              target_amount: target, 
              current_amount: 0 
            });
            setSavingTitle('');
            setSavingTarget('');
            loadFinanceData();
          }} className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-4 h-fit">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> Nova Meta de Poupança
            </h3>
            <input
              type="text"
              placeholder="Nome da Meta (ex: Spikes Novos)"
              value={savingTitle}
              onChange={(e) => setSavingTitle(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white"
              required
            />
            <input
              type="text"
              placeholder="Objetivo em € (ex: 200)"
              value={savingTarget}
              onChange={(e) => setSavingTarget(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-2.5 text-xs text-white font-bold"
              required
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer transition-colors"
            >
              Criar Objetivo
            </button>
          </form>

          <div className="lg:col-span-2 space-y-4">
            {savings.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-xs text-zinc-500">
                Ainda não tens metas de poupança criadas.
              </div>
            ) : (
              savings.map(s => {
                const current = Number(s.current_amount);
                const target = Number(s.target_amount);
                const progress = Math.min(100, Math.round((current / target) * 100));

                return (
                  <div key={s.id} className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl space-y-3 relative">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-white">{s.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-400">{progress}%</span>
                        <button
                          onClick={() => {
                            setEditingGoal(s);
                            setEditTitle(s.title);
                            setEditTarget(s.target_amount.toString());
                          }}
                          className="p-1 text-zinc-500 hover:text-emerald-400 cursor-pointer"
                          title="Editar Objetivo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSavingGoal(s.id)}
                          className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                          title="Eliminar Objetivo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Poupado: <strong className="text-white">€{current.toFixed(2)}</strong></span>
                      <span>Meta: <strong className="text-white">€{target.toFixed(2)}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60">
                      <input
                        type="text"
                        placeholder="€ Valor"
                        value={adjustAmount[s.id] || ''}
                        onChange={(e) => setAdjustAmount({ ...adjustAmount, [s.id]: e.target.value })}
                        className="w-24 bg-zinc-800/50 border border-zinc-700 rounded-xl p-2 text-xs text-white font-mono"
                      />
                      <button
                        onClick={() => handleAdjustSaving(s.id, current, true)}
                        className="flex-1 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold hover:bg-emerald-500/30 cursor-pointer"
                      >
                        + Depositar
                      </button>
                      <button
                        onClick={() => handleAdjustSaving(s.id, current, false)}
                        className="flex-1 py-2 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold hover:bg-rose-500/30 cursor-pointer"
                      >
                        - Retirar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Editar Meta de Poupança</h3>
              <button onClick={() => setEditingGoal(null)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditGoal} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Título da Meta</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Objetivo (€)</label>
                <input
                  type="text"
                  value={editTarget}
                  onChange={(e) => setEditTarget(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs text-white font-bold"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="flex-1 py-2.5 bg-zinc-800 text-zinc-400 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Guardar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};