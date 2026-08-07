import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Coins, PlusCircle, MinusCircle, FileText, CheckCircle2, ShieldCheck, Printer } from 'lucide-react';
import { printElement } from '../utils/print';

import { AppUser } from '../types';

interface ShiftManagementProps {
  currentUser?: AppUser;
}

interface ShiftSession {
  isOpen: boolean;
  openedAt: string;
  openingCash: number;
  cashAdditions: number;
  cashRemovals: number;
  operator: string;
}

interface ShiftHistory {
  id: string;
  openedAt: string;
  closedAt: string;
  openingCash: number;
  totalSales: number;
  additions: number;
  removals: number;
  finalCash: number;
  operator: string;
}

const INITIAL_SHIFT: ShiftSession = {
  isOpen: false,
  openedAt: '',
  openingCash: 30000,
  cashAdditions: 0,
  cashRemovals: 0,
  operator: 'Operador Principal'
};

const INITIAL_HISTORY: ShiftHistory[] = [
  { id: 'h1', openedAt: '06/07/2026, 08:00', closedAt: '06/07/2026, 18:30', openingCash: 30000, totalSales: 480000, additions: 10000, removals: 5000, finalCash: 515000, operator: 'Operador Principal' }
];

export default function ShiftManagement({ currentUser }: ShiftManagementProps) {
  const [session, setSession] = useState<ShiftSession>(INITIAL_SHIFT);
  const [history, setHistory] = useState<ShiftHistory[]>([]);
  
  // Forms
  const [openingBalance, setOpeningBalance] = useState<number>(30000);
  const [cashAmount, setCashAmount] = useState<number | ''>('');
  const [cashReason, setCashReason] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const [showZReport, setShowZReport] = useState<any | null>(null);

  useEffect(() => {
    const cachedSession = localStorage.getItem('vm_active_shift');
    const cachedHistory = localStorage.getItem('vm_shift_history');
    
    if (cachedSession) {
      try {
        setSession(JSON.parse(cachedSession));
      } catch {
        setSession(INITIAL_SHIFT);
      }
    } else {
      setSession(INITIAL_SHIFT);
      localStorage.setItem('vm_active_shift', JSON.stringify(INITIAL_SHIFT));
    }

    if (cachedHistory) setHistory(JSON.parse(cachedHistory));
    else {
      setHistory(INITIAL_HISTORY);
      localStorage.setItem('vm_shift_history', JSON.stringify(INITIAL_HISTORY));
    }
  }, []);

  const saveSession = (newSess: ShiftSession) => {
    setSession(newSess);
    localStorage.setItem('vm_active_shift', JSON.stringify(newSess));
    window.dispatchEvent(new Event('shift_change'));
    window.dispatchEvent(new Event('storage'));
  };

  const saveHistory = (newHist: ShiftHistory[]) => {
    setHistory(newHist);
    localStorage.setItem('vm_shift_history', JSON.stringify(newHist));
  };

  const handleOpenShift = () => {
    const newSession: ShiftSession = {
      isOpen: true,
      openedAt: new Date().toLocaleString('pt-AO'),
      openingCash: openingBalance,
      cashAdditions: 0,
      cashRemovals: 0,
      operator: currentUser?.name || currentUser?.username || 'Operador Principal'
    };
    saveSession(newSession);
    setShowZReport(null);
    setToastMsg(`Turno de caixa aberto com valor inicial de ${openingBalance.toLocaleString('pt-AO')} Kz! O POS está autorizado para vendas.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleCashAdjustment = (type: 'ADD' | 'REMOVE') => {
    if (!cashAmount || cashAmount <= 0) return;
    
    if (type === 'ADD') {
      const updated = {
        ...session,
        cashAdditions: session.cashAdditions + Number(cashAmount)
      };
      saveSession(updated);
      setToastMsg(`Entrada (Suprimento) de ${Number(cashAmount).toLocaleString()} Kz guardada com sucesso!`);
    } else {
      const updated = {
        ...session,
        cashRemovals: session.cashRemovals + Number(cashAmount)
      };
      saveSession(updated);
      setToastMsg(`Saída (Sangria) de ${Number(cashAmount).toLocaleString()} Kz guardada com sucesso!`);
    }

    setTimeout(() => setToastMsg(null), 4000);
    setCashAmount('');
    setCashReason('');
  };

  const handleCloseShift = () => {
    const closedAt = new Date().toLocaleString('pt-AO');
    
    // Fetch actual sales sum from stored invoices
    let actualSalesSum = 0;
    const storedInvoices = localStorage.getItem('vm_invoices');
    if (storedInvoices) {
      try {
        const invoices = JSON.parse(storedInvoices);
        if (Array.isArray(invoices)) {
          actualSalesSum = invoices.reduce((acc: number, inv: any) => {
            if (inv.status !== 'ANULADO') {
              return acc + (inv.total || 0);
            }
            return acc;
          }, 0);
        }
      } catch {
        actualSalesSum = 0;
      }
    }

    const finalExpected = session.openingCash + actualSalesSum + session.cashAdditions - session.cashRemovals;

    const newHistoryEntry: ShiftHistory = {
      id: String(Date.now()),
      openedAt: session.openedAt || new Date().toLocaleString('pt-AO'),
      closedAt,
      openingCash: session.openingCash,
      totalSales: actualSalesSum,
      additions: session.cashAdditions,
      removals: session.cashRemovals,
      finalCash: finalExpected,
      operator: session.operator || 'Operador Principal'
    };

    const updatedHistory = [newHistoryEntry, ...history];
    saveHistory(updatedHistory);

    const closedSession = {
      isOpen: false,
      openedAt: '',
      openingCash: 0,
      cashAdditions: 0,
      cashRemovals: 0,
      operator: ''
    };
    saveSession(closedSession);

    // Show Z-Report PDF/receipt visual mockup
    setShowZReport(newHistoryEntry);
  };

  const formatKz = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="shift-management-root">
      {/* Title */}
      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Controlo de Turnos & Caixa</h1>
        <p className="text-sm text-slate-500">Gestão de abertura e fecho de caixa por operador, suprimentos, sangrias e relatórios de fecho (Z)</p>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <h4 className="font-extrabold text-xs">{toastMsg}</h4>
            <p className="text-xxs text-emerald-600">A operação de caixa foi executada e registada com sucesso.</p>
          </div>
        </div>
      )}

      {session.isOpen ? (
        /* OPEN SESSION DASHBOARD */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Shift Details */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <div className="flex items-center gap-2">
                <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Unlock className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Turno Ativo (Aberto)</h3>
                  <p className="text-xxs text-slate-400">Iniciado em: {session.openedAt}</p>
                </div>
              </div>
              <button
                onClick={handleCloseShift}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                FECHAR TURNO (FIM DO DIA)
              </button>
            </div>

            {/* Calculations metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Fundo Abertura</span>
                <span className="font-mono text-sm font-bold text-slate-800">{formatKz(session.openingCash)}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Reforços (Suprimento)</span>
                <span className="font-mono text-sm font-bold text-emerald-600">+{formatKz(session.cashAdditions)}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Retiradas (Sangria)</span>
                <span className="font-mono text-sm font-bold text-rose-600">-{formatKz(session.cashRemovals)}</span>
              </div>
              <div className="bg-brand-light/50 p-4 rounded-2xl border border-brand-light/50 space-y-1">
                <span className="text-[9px] font-bold text-brand uppercase tracking-wider block">Saldo Estimado</span>
                <span className="font-mono text-sm font-black text-brand font-bold">
                  {formatKz(session.openingCash + session.cashAdditions - session.cashRemovals)}
                </span>
              </div>
            </div>

            {/* Forms for additions/removals */}
            <div className="pt-4 border-t border-slate-50 space-y-4">
              <h4 className="font-bold text-slate-800 text-xs">Movimentos de Ajuste de Fundo (Dinheiro em Caixa)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Form layout */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Montante do Movimento (AOA)</label>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(Number(e.target.value))}
                      placeholder="Ex: 5000"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Justificação / Motivo</label>
                    <input
                      type="text"
                      value={cashReason}
                      onChange={(e) => setCashReason(e.target.value)}
                      placeholder="Ex: Trocos de moedas ou pagamento avulso..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCashAdjustment('ADD')}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Reforço
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCashAdjustment('REMOVE')}
                      className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <MinusCircle className="w-4 h-4" />
                      Sangria
                    </button>
                  </div>
                </div>

                {/* Operator info and compliance tip */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">DICA DE AUDITORIA</span>
                    <p className="text-xxs text-slate-500 leading-relaxed font-sans">
                      Sempre que realizar uma sangria (retirada de caixa) para pagamentos fora da gaveta, registre a justificação para que o fecho de caixa bata certo no final do expediente de vendas.
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-400 border-t pt-2 mt-2">
                    Operador logado: <strong className="text-slate-700">{session.operator}</strong>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* History */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
              <FileText className="w-4 h-4 text-brand" />
              Histórico de Turnos Anteriores
            </h3>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {history.map((hist) => (
                <div key={hist.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xxs font-sans">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Fechado em: {hist.closedAt.split(',')[0]}</span>
                    <span className="text-brand">{hist.operator}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-500">
                    <p>Fundo Inicial: <strong className="font-mono text-slate-700">{formatKz(hist.openingCash)}</strong></p>
                    <p>Vendas Facturadas: <strong className="font-mono text-slate-700">{formatKz(hist.totalSales)}</strong></p>
                    <p>Movimentos: <strong className="font-mono text-emerald-600">+{formatKz(hist.additions)}</strong> | <strong className="font-mono text-rose-600">-{formatKz(hist.removals)}</strong></p>
                    <p>Dinheiro Final: <strong className="font-mono text-slate-900">{formatKz(hist.finalCash)}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* CLOSED SESSION VIEW - ASK TO OPEN */
        <div className="space-y-6">
          {showZReport && (
            /* Talão de Fecho de Turno */
            <div className="space-y-3 max-w-md mx-auto animate-scaleUp">
              <div id="printed-z-report" className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 font-mono text-xs text-slate-800 space-y-4">
                <div className="text-center space-y-1.5 border-b border-slate-100 pb-4">
                  <span className="p-2.5 bg-rose-50 text-rose-600 rounded-full inline-block">
                    <Lock className="w-5 h-5" />
                  </span>
                  <h3 className="font-bold text-sm tracking-tight text-slate-900">VENDA MAIS ECOSSISTEMA WEB</h3>
                  <p className="text-[10px] text-slate-400">RELATÓRIO DE FECHO DE CAIXA (Z)</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{showZReport.closedAt}</p>
                </div>

                <div className="space-y-2 text-[11px] leading-relaxed">
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span>Iniciado:</span>
                    <span className="font-bold">{showZReport.openedAt}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span>Encerrado:</span>
                    <span className="font-bold">{showZReport.closedAt}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span>Operador:</span>
                    <span>{showZReport.operator}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1 pt-2">
                    <span>Fundo Abertura:</span>
                    <span className="font-mono font-bold">{formatKz(showZReport.openingCash)}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span>Faturação (Turno):</span>
                    <span className="font-mono font-bold text-emerald-600">+{formatKz(showZReport.totalSales)}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span>Suprimentos (+):</span>
                    <span className="font-mono font-bold">+{formatKz(showZReport.additions)}</span>
                  </div>
                  <div className="flex justify-between border-b border-dotted pb-1">
                    <span>Sangrias (-):</span>
                    <span className="font-mono font-bold text-rose-600">-{formatKz(showZReport.removals)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black border-t border-slate-200 pt-3">
                    <span>TOTAL EM GAVETA:</span>
                    <span className="font-mono text-brand">{formatKz(showZReport.finalCash)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-dashed border-slate-200 text-center space-y-1 text-xxs text-slate-400 leading-relaxed">
                  <p>Software Certificado por Regulamento AGT</p>
                  <p>NÉGOMIL ECOSSISTEMA v1.0.1_AO</p>
                  <p className="mt-3 text-slate-600 font-bold">Assinatura do Operador:</p>
                  <div className="w-full h-8 border-b border-slate-200 mt-4"></div>
                </div>
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  id="btn-print-z-report"
                  onClick={() => printElement('printed-z-report', '360px')}
                  className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Fecho de Caixa (Relatório Z)
                </button>
              </div>
            </div>
          )}

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto text-center space-y-5">
            <span className="p-4 bg-slate-50 text-slate-400 rounded-full inline-block">
              <Lock className="w-8 h-8" />
            </span>
            <div className="space-y-1">
              <h3 className="font-black text-slate-900 text-lg">Caixa Fechado</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Para iniciar o processamento de vendas, emissão de faturas e receber pagamentos, abra um novo turno de caixa declarando o saldo inicial de abertura.
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Fundo de Caixa de Abertura (AOA)</label>
                <input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-bold text-sm focus:outline-none focus:bg-white"
                />
              </div>

              <button
                onClick={handleOpenShift}
                className="w-full py-3 bg-brand text-white font-black text-xs rounded-xl hover:bg-brand-dark transition shadow-md"
              >
                ABRIR NOVO TURNO DE VENDAS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
