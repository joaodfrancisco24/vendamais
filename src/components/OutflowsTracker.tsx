import React, { useState, useEffect } from 'react';
import { Coins, PlusCircle, Trash2, Calendar, FileText, TrendingDown, ArrowUpCircle, CheckCircle2 } from 'lucide-react';

interface Outflow {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
}

const INITIAL_OUTFLOWS: Outflow[] = [
  { id: '1', description: 'Compra de Resmas de Papel A4 para escritório', category: 'Consumíveis', amount: 15000, date: '2026-07-06' },
  { id: '2', description: 'Pagamento de Energia Elétrica (ENDE)', category: 'Utilidades', amount: 35000, date: '2026-07-05' },
  { id: '3', description: 'Reposição de Fundo de Maneio de Caixa', category: 'Tesouraria', amount: 50000, date: '2026-07-04' }
];

export default function OutflowsTracker() {
  const [outflows, setOutflows] = useState<Outflow[]>([]);
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('Consumíveis');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem('vm_outflows');
    if (cached) setOutflows(JSON.parse(cached));
    else {
      setOutflows(INITIAL_OUTFLOWS);
      localStorage.setItem('vm_outflows', JSON.stringify(INITIAL_OUTFLOWS));
    }
  }, []);

  const saveOutflows = (newOutflows: Outflow[]) => {
    setOutflows(newOutflows);
    localStorage.setItem('vm_outflows', JSON.stringify(newOutflows));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const newOutflow: Outflow = {
      id: String(Date.now()),
      description: desc,
      category,
      amount: Number(amount),
      date
    };

    const updated = [newOutflow, ...outflows];
    saveOutflows(updated);
    
    setToastMsg(`Saída/Despesa de ${newOutflow.amount.toLocaleString()} Kz registrada e guardada com sucesso!`);
    setTimeout(() => setToastMsg(null), 4000);

    setDesc('');
    setAmount('');
  };

  const handleDelete = (id: string) => {
    const updated = outflows.filter(o => o.id !== id);
    saveOutflows(updated);
  };

  const totalOutflow = outflows.reduce((acc, curr) => acc + curr.amount, 0);

  const formatKz = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="outflows-tracker-root">
      {/* Title */}
      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Saídas / Pagamentos (Despesas)</h1>
        <p className="text-sm text-slate-500">Registe pagamentos a fornecedores, compras à vista, consumíveis e outras saídas de tesouraria</p>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <h4 className="font-extrabold text-xs">{toastMsg}</h4>
            <p className="text-xxs text-emerald-600">O movimento financeiro foi atualizado e guardado com sucesso.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Creation form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
            <PlusCircle className="w-4 h-4 text-rose-600" />
            Registar Nova Saída / Despesa
          </h3>

          <form onSubmit={handleAdd} className="space-y-4">
            {/* Desc */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Descrição do Pagamento *</label>
              <input
                type="text"
                required
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Ex: Pagamento de portagem ou água..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Categoria *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="Consumíveis">Consumíveis / Escritório</option>
                <option value="Utilidades">Utilidades (Água, Luz, Net)</option>
                <option value="Salários">Salários / Pessoal</option>
                <option value="Fornecedores">Fornecedores de Mercadoria</option>
                <option value="Impostos">Impostos / Taxas AGT</option>
                <option value="Outros">Outras Despesas de Caixa</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Amount */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Valor do Pagamento *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Data *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/10"
            >
              <Coins className="w-4 h-4" />
              Lançar Pagamento de Caixa
            </button>
          </form>
        </div>

        {/* List of outflows */}
        <div className="lg:col-span-7 space-y-6">
          {/* Outflow Stats Card */}
          <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block">Total Saídas / Pagos</span>
              <h2 className="text-2xl font-black text-rose-950 font-mono">{formatKz(totalOutflow)}</h2>
              <p className="text-xxs text-rose-700 font-semibold">Fluxo de Caixa em Saída Acumulado</p>
            </div>
            <span className="p-3.5 bg-rose-100 text-rose-600 rounded-2xl">
              <TrendingDown className="w-6 h-6" />
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-600" />
              Historial de Lançamentos de Despesa
            </h3>

            <div className="overflow-hidden rounded-2xl border border-slate-100 text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase">
                    <th className="p-3">Data</th>
                    <th className="p-3">Descrição</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3 text-right">Valor</th>
                    <th className="p-3 text-center">Excluir</th>
                  </tr>
                </thead>
                <tbody>
                  {outflows.length > 0 ? (
                    outflows.map((out) => (
                      <tr key={out.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 font-mono text-slate-400 text-[10px]">{out.date}</td>
                        <td className="p-3 font-bold text-slate-800">{out.description}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[9px] uppercase">
                            {out.category}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-rose-600">{formatKz(out.amount)}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDelete(out.id)}
                            className="text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Nenhuma despesa ou saída de caixa lançada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
