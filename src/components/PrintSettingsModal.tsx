import React, { useState, useEffect } from 'react';
import { X, Printer, FileText, Check, Settings, Sliders, Shield, Save } from 'lucide-react';
import { PrintSettingsConfig, DocumentPrintConfig } from '../types';

export const DEFAULT_PRINT_SETTINGS: PrintSettingsConfig = {
  defaultPrinter: 'Impressora Térmica de Talões (58mm/80mm)',
  copies: 1,
  showLogo: true,
  showBankDetails: true,
  openCashDrawer: true,
  activeProfile: 'Caixa Padrão',
  documents: {
    FT: { format: 'Ticket', autoPrint: true, ticketSize: '58mm' },
    FR: { format: 'A4', autoPrint: true, ticketSize: '58mm' },
    NC: { format: 'A4', autoPrint: true, ticketSize: '58mm' },
    RC: { format: 'Ticket', autoPrint: true, ticketSize: '58mm' },
    PP: { format: 'Ticket', autoPrint: true, ticketSize: '58mm' },
    OR: { format: 'A4', autoPrint: false, ticketSize: '58mm' },
    PF: { format: 'A4', autoPrint: false, ticketSize: '58mm' },
    GR: { format: 'A4', autoPrint: true, ticketSize: '58mm' },
    GT: { format: 'A4', autoPrint: true, ticketSize: '58mm' }
  }
};

export function getStoredPrintSettings(): PrintSettingsConfig {
  if (typeof window === 'undefined') return DEFAULT_PRINT_SETTINGS;
  try {
    const cached = localStorage.getItem('vm_print_settings');
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...DEFAULT_PRINT_SETTINGS,
        ...parsed,
        documents: {
          ...DEFAULT_PRINT_SETTINGS.documents,
          ...(parsed.documents || {})
        }
      };
    }
  } catch (err) {
    console.error('Erro ao carregar definições de impressão:', err);
  }
  return DEFAULT_PRINT_SETTINGS;
}

export function saveStoredPrintSettings(settings: PrintSettingsConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('vm_print_settings', JSON.stringify(settings));
    window.dispatchEvent(new Event('print_settings_updated'));
  } catch (err) {
    console.error('Erro ao gravar definições de impressão:', err);
  }
}

export function getDocumentPrintFormat(type: string): {
  format: 'A4' | 'Ticket';
  autoPrint: boolean;
  ticketSize: '55mm' | '58mm' | '80mm';
} {
  const settings = getStoredPrintSettings();
  let key: keyof PrintSettingsConfig['documents'] = 'FT';

  const t = (type || '').toUpperCase();
  if (t === 'FR') key = 'FR';
  else if (t === 'FT') key = 'FT';
  else if (t === 'NC') key = 'NC';
  else if (t === 'RC') key = 'RC';
  else if (t === 'PP') key = 'PP';
  else if (t === 'OR') key = 'OR';
  else if (t === 'PF' || t === 'FP') key = 'PF';
  else if (t === 'GR') key = 'GR';
  else if (t === 'GT') key = 'GT';

  const docConf = settings.documents?.[key] || settings.documents?.['FT'];
  return {
    format: docConf?.format === 'A4' ? 'A4' : 'Ticket',
    autoPrint: docConf?.autoPrint ?? true,
    ticketSize: docConf?.ticketSize || '58mm'
  };
}

interface PrintSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (settings: PrintSettingsConfig) => void;
}

export default function PrintSettingsModal({ isOpen, onClose, onSave }: PrintSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'GERAL' | 'DOCUMENTOS' | 'PERFIS' | 'AVANÇADO'>('DOCUMENTOS');
  const [settings, setSettings] = useState<PrintSettingsConfig>(getStoredPrintSettings());
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getStoredPrintSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateDocumentConfig = (key: keyof PrintSettingsConfig['documents'], patch: Partial<DocumentPrintConfig>) => {
    setSettings((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [key]: {
          ...prev.documents[key],
          ...patch
        }
      }
    }));
  };

  const handleSave = () => {
    saveStoredPrintSettings(settings);
    if (onSave) onSave(settings);
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      onClose();
    }, 600);
  };

  const docList: Array<{ key: keyof PrintSettingsConfig['documents']; label: string; desc: string }> = [
    { key: 'FT', label: 'FACTURA (FT)', desc: 'Factura padrão de venda a crédito ou pronto pagamento' },
    { key: 'FR', label: 'FACTURA RECIBO (FR)', desc: 'Factura recibo imediata pós liquidação no POS' },
    { key: 'NC', label: 'NOTA DE CRÉDITO (NC)', desc: 'Documento rectificativo / devolução de venda' },
    { key: 'RC', label: 'RECIBO (RC)', desc: 'Comprovativo de liquidação de factura a crédito' },
    { key: 'PP', label: 'PRÉ-FATURA PROVISÓRIA (PP)', desc: 'Talão prévio de conferência para cliente' },
    { key: 'OR', label: 'ORÇAMENTO (OR)', desc: 'Cotação prévia sem valor fiscal' },
    { key: 'PF', label: 'PROFORMA (PF)', desc: 'Fatura proforma prévia para pagamento bancário' },
    { key: 'GR', label: 'GUIA DE REMESSA (GR)', desc: 'Documento de transporte e entrega de mercadoria' },
    { key: 'GT', label: 'GUIA DE TRANSPORTE (GT)', desc: 'Guia de circulação de bens em vias públicas' }
  ];

  const applyProfile = (profileName: string, formatAll: 'A4' | 'Ticket', ticketSize: '55mm' | '58mm' | '80mm' = '58mm') => {
    const newDocs = { ...settings.documents };
    Object.keys(newDocs).forEach((k) => {
      const key = k as keyof PrintSettingsConfig['documents'];
      newDocs[key] = {
        ...newDocs[key],
        format: formatAll,
        ticketSize: ticketSize
      };
    });
    setSettings((prev) => ({
      ...prev,
      activeProfile: profileName,
      documents: newDocs
    }));
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-light text-brand rounded-2xl border border-brand-light">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">DEFINIÇÕES DE IMPRESSÃO</h2>
              <p className="text-xs text-slate-500 font-medium">Configure os formatos de saída e impressoras predefinidas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-5 pt-2 bg-slate-50/30 gap-1 overflow-x-auto">
          {(['GERAL', 'DOCUMENTOS', 'PERFIS', 'AVANÇADO'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-black tracking-wider transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? 'border-brand text-brand bg-white rounded-t-xl shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* TAB 1: GERAL */}
          {activeTab === 'GERAL' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Impressora Padrão do Sistema
                </label>
                <select
                  value={settings.defaultPrinter || ''}
                  onChange={(e) => setSettings({ ...settings, defaultPrinter: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand focus:outline-none"
                >
                  <option value="Impressora Térmica de Talões (58mm/80mm)">Impressora Térmica de Talões (58mm / 80mm)</option>
                  <option value="Impressora de Secretária A4 (Jacto / Laser)">Impressora de Secretária A4 (Jacto / Laser)</option>
                  <option value="Impressora Virtual PDF (Navegador)">Impressora Virtual PDF (Navegador)</option>
                </select>
                <p className="text-xxs text-slate-400">
                  Esta impressora será sugerida por omissão ao acionar o comando de impressão rápida.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Número de Cópias por Documento
                </label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSettings({ ...settings, copies: num })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        settings.copies === num
                          ? 'bg-brand text-white border-brand shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {num} {num === 1 ? 'Cópia' : 'Cópias'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">Imprimir Logótipo no Cabeçalho</h4>
                    <p className="text-xxs text-slate-500">Incluir imagem do logótipo da empresa nos talões e A4</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, showLogo: !settings.showLogo })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      settings.showLogo ? 'bg-brand' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                        settings.showLogo ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="border-t border-slate-200/60 pt-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">Imprimir Dados Bancários no Rodapé</h4>
                    <p className="text-xxs text-slate-500">Exibir IBAN padrão da empresa nas faturas impressas</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, showBankDetails: !settings.showBankDetails })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      settings.showBankDetails ? 'bg-brand' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                        settings.showBankDetails ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENTOS (Exact layout as user screenshot) */}
          {activeTab === 'DOCUMENTOS' && (
            <div className="space-y-3 animate-fadeIn">
              {docList.map(({ key, label }) => {
                const docConf = settings.documents[key] || { format: 'A4', autoPrint: true, ticketSize: '58mm' };
                return (
                  <div key={key} className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
                    <h3 className="font-extrabold text-xs text-slate-900 tracking-wide uppercase">
                      {label}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      {/* FORMATO */}
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          FORMATO
                        </span>
                        <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-2xs gap-1">
                          <button
                            type="button"
                            onClick={() => updateDocumentConfig(key, { format: 'A4' })}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              docConf.format === 'A4'
                                ? 'bg-brand text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            A4
                          </button>
                          <button
                            type="button"
                            onClick={() => updateDocumentConfig(key, { format: 'Ticket' })}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              docConf.format === 'Ticket'
                                ? 'bg-brand text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            Ticket
                          </button>
                        </div>
                      </div>

                      {/* AUTO IMPRESSÃO */}
                      <div className="flex flex-col items-start sm:items-end">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          AUTO IMPRESSÃO
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateDocumentConfig(key, { autoPrint: !docConf.autoPrint })}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                              docConf.autoPrint ? 'bg-brand' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                                docConf.autoPrint ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="text-xs font-bold text-slate-600">
                            {docConf.autoPrint ? 'Sim' : 'Não'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* TAMANHO DO TICKET */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        TAMANHO DO TICKET
                      </span>
                      <div className="grid grid-cols-3 gap-2 max-w-sm">
                        {(['55mm', '58mm', '80mm'] as const).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => updateDocumentConfig(key, { ticketSize: sz })}
                            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition border cursor-pointer text-center ${
                              docConf.ticketSize === sz
                                ? 'bg-brand text-white border-brand shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: PERFIS */}
          {activeTab === 'PERFIS' && (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-xs text-slate-500 font-medium">
                Selecione um perfil de impressão predefinido para configurar todos os documentos de uma só vez:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => applyProfile('Caixa Rápido (Ticket 58mm)', 'Ticket', '58mm')}
                  className={`p-4 rounded-2xl border text-left space-y-2 transition cursor-pointer ${
                    settings.activeProfile === 'Caixa Rápido (Ticket 58mm)'
                      ? 'bg-brand-light/50 border-brand ring-2 ring-brand'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 bg-brand/10 text-brand rounded-xl w-fit">
                    <Printer className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900">Caixa Rápido (58mm)</h4>
                  <p className="text-xxs text-slate-500">Todos os documentos configurados para Ticket Térmico de 58mm.</p>
                </button>

                <button
                  type="button"
                  onClick={() => applyProfile('Balcão Comercial (Ticket 80mm)', 'Ticket', '80mm')}
                  className={`p-4 rounded-2xl border text-left space-y-2 transition cursor-pointer ${
                    settings.activeProfile === 'Balcão Comercial (Ticket 80mm)'
                      ? 'bg-brand-light/50 border-brand ring-2 ring-brand'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-xl w-fit">
                    <Printer className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900">Balcão Comercial (80mm)</h4>
                  <p className="text-xxs text-slate-500">Todos os documentos configurados para Ticket Térmico de 80mm largo.</p>
                </button>

                <button
                  type="button"
                  onClick={() => applyProfile('Escritório e Gestão (A4)', 'A4', '58mm')}
                  className={`p-4 rounded-2xl border text-left space-y-2 transition cursor-pointer ${
                    settings.activeProfile === 'Escritório e Gestão (A4)'
                      ? 'bg-brand-light/50 border-brand ring-2 ring-brand'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl w-fit">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900">Escritório & Gestão (A4)</h4>
                  <p className="text-xxs text-slate-500">Todos os documentos em formato oficial Folha Completa A4.</p>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: AVANÇADO */}
          {activeTab === 'AVANÇADO' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">Abertura de Gaveta de Dinheiro</h4>
                    <p className="text-xxs text-slate-500">Enviar sinal ESC/POS para abrir gaveta de notas ao emitir no POS</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, openCashDrawer: !settings.openCashDrawer })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      settings.openCashDrawer ? 'bg-brand' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                        settings.openCashDrawer ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-xs text-slate-800">Modo de Impressão Direta</h4>
                <p className="text-xxs text-slate-500">
                  O sistema aciona a janela padrão do navegador com as margens pré-calculadas para o papel selecionado (A4 ou Ticket de 55mm / 58mm / 80mm).
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer button matching screenshot: GUARDAR DEFINIÇÕES */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
          {showSavedToast && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fadeIn">
              <Check className="w-4 h-4 stroke-[3]" /> Definições Gravadas!
            </span>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-8 py-3 bg-brand hover:bg-brand-dark text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            GUARDAR DEFINIÇÕES
          </button>
        </div>

      </div>
    </div>
  );
}
