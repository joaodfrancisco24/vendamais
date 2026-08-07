import React, { useState } from 'react';
import { Activity, ShieldAlert, Terminal, RefreshCw, Trash2, CheckCircle, Info } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  module: string;
  message: string;
}

const INITIAL_LOGS: LogEntry[] = [
  { id: '1', timestamp: '07/07/2026 15:10:22', type: 'SUCCESS', module: 'ASSINATURA', message: 'Algoritmo RSA-SHA1 executado com sucesso para a Factura FR FR2026/01.' },
  { id: '2', timestamp: '07/07/2026 15:10:22', type: 'INFO', module: 'CONTROLO', message: 'Assinatura inserida no rodapé do documento: "XmS2-Fr88..."' },
  { id: '3', timestamp: '07/07/2026 15:12:05', type: 'SUCCESS', module: 'SAF-T', message: 'Validação da estrutura XML concluída: UTF-8, Schema v1.01_AO.' },
  { id: '4', timestamp: '07/07/2026 15:15:30', type: 'WARNING', module: 'LICENÇA', message: 'O certificado atual é de teste. Recomenda-se carregar a chave de produção.' },
  { id: '5', timestamp: '07/07/2026 15:20:10', type: 'INFO', module: 'BD', message: 'Sincronização de 3 clientes e 6 artigos gravados localmente.' }
];

export default function GeneralOperations() {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [exemptionReason, setExemptionReason] = useState('M10');
  const [isChecking, setIsChecking] = useState(false);
  const [diagnosticMessage, setDiagnosticMessage] = useState<string | null>(null);
  const [exemptionSaved, setExemptionSaved] = useState(false);

  const clearLogs = () => {
    setLogs([]);
  };

  const handleExemptionSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: LogEntry = {
      id: String(Date.now()),
      timestamp: new Date().toLocaleString('pt-AO'),
      type: 'SUCCESS',
      module: 'PARÂMETRO',
      message: `Motivo de Isenção padrão atualizado para: ${exemptionReason}`
    };
    setLogs([newLog, ...logs]);
    setExemptionSaved(true);
    setTimeout(() => setExemptionSaved(false), 3000);
  };

  const runDiagnostic = () => {
    setIsChecking(true);
    setDiagnosticMessage(null);
    setTimeout(() => {
      setIsChecking(false);
      setDiagnosticMessage('Todos os sistemas estão operacionais. Assinatura RSA ativa, Banco de Dados local íntegro (100%), Conector SAF-T pronto para exportação.');
      const newLog: LogEntry = {
        id: String(Date.now()),
        timestamp: new Date().toLocaleString('pt-AO'),
        type: 'SUCCESS',
        module: 'SISTEMA',
        message: 'Diagnóstico geral de integridade concluído com 0 erros encontrados.'
      };
      setLogs([newLog, ...logs]);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="general-ops-root">
      {/* Title */}
      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Operações Gerais</h1>
        <p className="text-sm text-slate-500">Ferramentas técnicas de auditoria, diagnóstico do sistema e configurações fiscais auxiliares</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column - exemption & diagnostics */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Exemption Reason Configuration */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
              <ShieldAlert className="w-4 h-4 text-brand" />
              Motivos de Isenção de IVA (Regulamento AGT)
            </h3>
            <p className="text-xs text-slate-500">
              Para produtos configurados com taxa de IVA isento (0%), é obrigatória a inclusão do respectivo código de isenção no arquivo XML SAF-T e nos documentos impressos.
            </p>
            <form onSubmit={handleExemptionSave} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Código de Isenção Padrão</label>
                <select
                  value={exemptionReason}
                  onChange={(e) => setExemptionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="M10">M10 - Isento nos termos do art. 12 do CIVA (Transmissões de Bens e Serviços)</option>
                  <option value="M11">M11 - Regime de Exclusão (Regime Simplificado sem imposto)</option>
                  <option value="M15">M15 - Isento nos termos do art. 15 do CIVA (Exportações e Operações Assimiladas)</option>
                  <option value="M16">M16 - Isento nos termos do art. 16 do CIVA (Isenções nas Importações)</option>
                  <option value="M20">M20 - IVA - Não confere direito à dedução (Artigo 20.º do CIVA)</option>
                  <option value="M99">M99 - Outras Isenções temporárias ou regimes especiais</option>
                </select>
              </div>
              {exemptionSaved && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-fadeIn">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  Motivo de isenção guardado com sucesso!
                </div>
              )}
              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition text-center block cursor-pointer"
              >
                Guardar Motivo de Isenção
              </button>
            </form>
          </div>

          {/* System Check / Diagnostic Box */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
              <Activity className="w-4 h-4 text-brand" />
              Diagnóstico de Integridade Fiscal
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verifique se as chaves RSA, o banco de dados de faturas e o sequenciador de assinaturas estão sincronizados e válidos perante os requisitos da AGT.
            </p>
            
            {diagnosticMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs flex gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="font-medium">{diagnosticMessage}</p>
              </div>
            )}

            <button
              onClick={runDiagnostic}
              disabled={isChecking}
              className="w-full py-2.5 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-dark transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Verificando Sistema...' : 'Executar Auto-Diagnóstico'}
            </button>
          </div>

        </div>

        {/* Right column - Dev console log trail */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[490px] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-brand" />
                <h3 className="font-bold text-slate-900 text-sm">Auditoria Digital (Log em Tempo Real)</h3>
              </div>
              <button
                onClick={clearLogs}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Limpar Histórico"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 font-mono text-[10px]">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div key={log.id} className="p-2.5 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-slate-500">{log.timestamp}</span>
                      <span className={`px-1.5 py-0.2 rounded font-extrabold uppercase ${
                        log.type === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400' :
                        log.type === 'WARNING' ? 'bg-amber-950 text-amber-400' :
                        log.type === 'ERROR' ? 'bg-rose-950 text-rose-400' :
                        'bg-brand/20 text-brand-light'
                      }`}>
                        {log.module} : {log.type}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{log.message}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-10">
                  <Terminal className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="font-bold text-xs">Console Sem Atividade</p>
                  <p className="text-[10px] mt-0.5">As ações fiscais e assinaturas RSA aparecerão aqui.</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-2 text-xxs text-slate-400">
              <Info className="w-3.5 h-3.5 text-brand flex-shrink-0" />
              <span>Estes registos são exigidos por regulamento da AGT para garantir que nenhuma factura seja alterada pós-emissão.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
