/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Printer, 
  X, 
  Check, 
  AlertCircle,
  Hash,
  Building2,
  ShieldCheck,
  CreditCard,
  FileCode2,
  RotateCcw,
  Plus,
  AlertTriangle,
  RefreshCw,
  FileX
} from 'lucide-react';
import { Invoice, CompanyConfig, KeysConfig, Product, InvoiceLine, AppUser } from '../types';
import { printElement } from '../utils/print';
import { signInvoice } from '../utils/signature';
import { getDocumentPrintFormat } from './PrintSettingsModal';

interface InvoicesListProps {
  invoices: Invoice[];
  company: CompanyConfig;
  keys?: KeysConfig;
  products?: Product[];
  currentUser?: AppUser;
  onEmitCreditNote?: (creditNote: Invoice, originalInvoiceNo: string, restoreStock: boolean) => void;
}

export default function InvoicesList({
  invoices,
  company,
  keys,
  products = [],
  currentUser,
  onEmitCreditNote
}: InvoicesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'FR' | 'FT' | 'FP' | 'NC'>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [printFormat, setPrintFormat] = useState<'ticket' | 'a4'>('ticket');

  useEffect(() => {
    if (selectedInvoice) {
      const docConf = getDocumentPrintFormat(selectedInvoice.type);
      setPrintFormat(docConf.format === 'A4' ? 'a4' : 'ticket');
    }
  }, [selectedInvoice]);

  // Credit Note Modal state
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [targetInvoiceForNc, setTargetInvoiceForNc] = useState<Invoice | null>(null);

  // Filter invoices list
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (inv.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (inv.customer?.nif || '').includes(searchTerm) ||
                          (inv.rectifiedInvoiceNo || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || inv.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatKz = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' })
      .format(value)
      .replace('Kz', '')
      .trim() + ' Kz';
  };

  const handleOpenCreditNoteModal = (inv?: Invoice) => {
    setTargetInvoiceForNc(inv || null);
    setShowCreditNoteModal(true);
  };

  return (
    <div className="space-y-6" id="invoices-list-root">
      
      {/* Title and Top Header Action */}
      <div className="border-b border-gray-100 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Histórico de Documentos</h1>
          <p className="text-sm text-gray-500">Consulta de faturas emitidas, controle de assinaturas e emissão de Notas de Crédito</p>
        </div>
        <div>
          <button
            id="btn-emit-nc-header"
            onClick={() => handleOpenCreditNoteModal()}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-2 text-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Emitir Nota de Crédito</span>
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between" id="invoices-filters">
        <div className="relative w-full md:max-w-xs">
          <input 
            type="text"
            id="invoice-search"
            placeholder="Pesquisar por nº, NIF ou doc rectificado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>

        {/* Filter type buttons */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterType === 'ALL'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos ({invoices.length})
          </button>
          <button
            onClick={() => setFilterType('FR')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterType === 'FR'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Facturas-Recibo (FR)
          </button>
          <button
            onClick={() => setFilterType('FT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterType === 'FT'
                ? 'bg-brand text-white shadow-xs'
                : 'bg-brand-light text-brand hover:bg-brand-light/80'
            }`}
          >
            Facturas (FT)
          </button>
          <button
            onClick={() => setFilterType('FP')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterType === 'FP'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            Proforma (FP)
          </button>
          <button
            onClick={() => setFilterType('NC')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filterType === 'NC'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Notas de Crédito (NC)
          </button>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden" id="invoices-table-container">
        {filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Código / Série</th>
                  <th className="p-4">Tipo & Estado</th>
                  <th className="p-4">Cliente Beneficiário</th>
                  <th className="p-4">Data Emissão</th>
                  <th className="p-4 text-right">Subtotal</th>
                  <th className="p-4 text-right">IVA (14%)</th>
                  <th className="p-4 text-right">Valor Final</th>
                  <th className="p-4 text-center">Assinatura Control</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInvoices.slice().reverse().map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4">
                      <p className="font-mono font-bold text-gray-900">{inv.invoiceNo}</p>
                      {inv.rectifiedInvoiceNo && (
                        <p className="text-[10px] text-amber-700 font-medium flex items-center gap-1 mt-0.5">
                          <RotateCcw className="w-3 h-3 shrink-0" />
                          <span>Rectifica: {inv.rectifiedInvoiceNo}</span>
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          inv.type === 'FR' ? 'bg-brand-light text-brand' : 
                          inv.type === 'FT' ? 'bg-emerald-50 text-emerald-700' : 
                          inv.type === 'FP' ? 'bg-purple-50 text-purple-700' : 
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {inv.type === 'NC' ? 'NOTA DE CRÉDITO' : inv.type}
                        </span>

                        {inv.status === 'RECTIFICADO' && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                            RECTIFICADO
                          </span>
                        )}
                        {inv.status === 'ANULADO' && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                            ANULADO
                          </span>
                        )}
                        {inv.status === 'EMITIDO' && inv.type !== 'NC' && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-emerald-50 text-emerald-700">
                            EMITIDO
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{inv.customer?.name || 'Cliente Geral'}</p>
                      <p className="text-[10px] text-gray-400 font-mono">NIF: {inv.customer?.nif || '999999999'}</p>
                    </td>
                    <td className="p-4 text-gray-500 font-mono">{inv.date}</td>
                    <td className="p-4 text-right font-mono text-gray-600">{formatKz(inv.subtotal)}</td>
                    <td className="p-4 text-right font-mono text-gray-600">{formatKz(inv.taxTotal)}</td>
                    <td className={`p-4 text-right font-bold font-mono ${inv.type === 'NC' ? 'text-amber-700' : 'text-gray-900'}`}>
                      {inv.type === 'NC' ? `- ${formatKz(inv.total)}` : formatKz(inv.total)}
                    </td>
                    <td className="p-4 text-center font-mono">
                      <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded font-extrabold text-[10px] text-gray-700">
                        {inv.hashControl}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          id={`btn-reprint-inv-${inv.sequenceNumber}`}
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPrintFormat('ticket');
                          }}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition inline-flex items-center gap-1 font-bold text-[11px]"
                          title="Reimprimir Recibo POS (80mm)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Recibo</span>
                        </button>
                        <button
                          id={`btn-reprint-a4-${inv.sequenceNumber}`}
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPrintFormat('a4');
                          }}
                          className="p-1.5 bg-brand-light hover:bg-brand-light/80 text-brand rounded-lg transition inline-flex items-center gap-1 font-bold text-[11px]"
                          title="Imprimir Fatura em Folha A4"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Folha A4</span>
                        </button>

                        {/* Button to issue Credit Note directly for active invoices */}
                        {inv.type !== 'NC' && inv.type !== 'FP' && inv.status !== 'RECTIFICADO' && inv.status !== 'ANULADO' && (
                          <button
                            id={`btn-issue-nc-${inv.sequenceNumber}`}
                            onClick={() => handleOpenCreditNoteModal(inv)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition inline-flex items-center gap-1 font-bold text-[11px]"
                            title="Emitir Nota de Crédito para esta fatura"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>NC</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="font-medium text-sm">Nenhum documento encontrado</p>
            <p className="text-xs text-gray-400 mt-1">Lançe faturas-recibo no POS ou amplie o termo da pesquisa.</p>
          </div>
        )}
      </div>

      {/* CREDIT NOTE ISSUANCE MODAL */}
      {showCreditNoteModal && (
        <CreditNoteModal
          targetInvoice={targetInvoiceForNc}
          invoices={invoices}
          company={company}
          keys={keys}
          products={products}
          onClose={() => {
            setShowCreditNoteModal(false);
            setTargetInvoiceForNc(null);
          }}
          onEmitCreditNote={(ncInvoice, origNo, restoreStock) => {
            if (onEmitCreditNote) {
              onEmitCreditNote(ncInvoice, origNo, restoreStock);
            }
            setShowCreditNoteModal(false);
            setTargetInvoiceForNc(null);
            // Open print preview for newly emitted credit note
            setSelectedInvoice(ncInvoice);
            setPrintFormat('a4');
          }}
        />
      )}

      {/* PRINT DIALOG */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`bg-white rounded-3xl border border-gray-100 shadow-2xl w-full p-6 flex flex-col h-[92vh] transition-all duration-300 ${
            printFormat === 'a4' ? 'max-w-4xl' : 'max-w-md'
          }`}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-brand" />
                <h3 className="font-bold text-gray-900 text-sm">
                  {selectedInvoice.type === 'NC' ? 'Visualizar / Imprimir Nota de Crédito' : 'Visualizar / Reimprimir Fatura'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Print Format Switcher */}
                {(() => {
                  const docConf = getDocumentPrintFormat(selectedInvoice.type);
                  return (
                    <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPrintFormat('ticket')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          printFormat === 'ticket' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        <span>Ticket ({docConf.ticketSize || '80mm'})</span>
                        {docConf.format === 'Ticket' && (
                          <span className="text-[9px] bg-brand-light text-brand px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                            Predefinido
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintFormat('a4')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          printFormat === 'a4' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        <span>Folha A4</span>
                        {docConf.format === 'A4' && (
                          <span className="text-[9px] bg-brand-light text-brand px-1.5 py-0.2 rounded font-black uppercase tracking-wider">
                            Predefinido
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })()}

                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-y-auto py-6 flex justify-center bg-gray-50/50 rounded-2xl my-4">
              
              {/* POS TICKET PREVIEW (80mm) */}
              {printFormat === 'ticket' && (
                <div 
                  id="printed-invoice-ticket" 
                  className="bg-white border border-gray-200 shadow-sm w-[300px] p-4 text-[10px] font-mono leading-tight text-gray-800 space-y-3"
                >
                  {/* Header Company Details */}
                  <div className="text-center space-y-1">
                    {company.logoUrl && (
                      <div className="flex justify-center mb-1">
                        <img src={company.logoUrl} alt={company.name} className="max-h-12 object-contain" />
                      </div>
                    )}
                    <h4 className="font-extrabold text-xs text-gray-900">{company.name}</h4>
                    <p>{company.address}, {company.city}</p>
                    <p>NIF: {company.nif}</p>
                    <p>Tel: {company.phone}</p>
                  </div>

                  <div className="border-t border-dashed border-gray-300 my-2"></div>

                  {/* Doc type / Number */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>DOCUMENTO:</span>
                      <span className="font-bold">
                        {selectedInvoice.type === 'NC' ? 'NOTA DE CRÉDITO' : selectedInvoice.type === 'FR' ? 'FACTURA RECIBO' : selectedInvoice.type === 'FT' ? 'FACTURA' : 'PROFORMA'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>NÚMERO:</span>
                      <span className="font-bold">{selectedInvoice.invoiceNo}</span>
                    </div>
                    {selectedInvoice.rectifiedInvoiceNo && (
                      <div className="flex justify-between text-amber-800 font-bold">
                        <span>RECTIFICA:</span>
                        <span>{selectedInvoice.rectifiedInvoiceNo}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>DATA EMISSÃO:</span>
                      <span>{selectedInvoice.date} 12:00</span>
                    </div>
                  </div>

                  {selectedInvoice.reason && (
                    <div className="bg-amber-50 p-2 rounded border border-amber-200 text-[9px] text-amber-900">
                      <strong>Motivo:</strong> {selectedInvoice.reason}
                    </div>
                  )}

                  <div className="border-t border-dashed border-gray-300 my-2"></div>

                  {/* Customer */}
                  <div className="space-y-0.5">
                    <p className="font-bold">CLIENTE: {selectedInvoice.customer?.name || 'Cliente Geral'}</p>
                    <p>NIF: {selectedInvoice.customer?.nif || '999999999'}</p>
                    {selectedInvoice.customer?.address && <p>Endereço: {selectedInvoice.customer.address}</p>}
                  </div>

                  <div className="border-t border-dashed border-gray-300 my-2"></div>

                  {/* Items */}
                  <table className="w-full text-left">
                    <thead>
                      <tr className="font-bold text-gray-900 border-b border-dashed border-gray-200">
                        <th>Artigo</th>
                        <th className="text-center">Qtd</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((line, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-1">
                            <p className="font-bold">{line.productName}</p>
                            <p className="text-[8px] text-gray-500">{formatKz(line.price)} {line.taxRate > 0 ? '(14%)' : '(Isento)'}</p>
                          </td>
                          <td className="text-center">{line.quantity}</td>
                          <td className="text-right">{formatKz(line.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="space-y-1 text-right pt-2 border-t border-dashed border-gray-200">
                    <p>Subtotal: {formatKz(selectedInvoice.subtotal)}</p>
                    <p>Total IVA: {formatKz(selectedInvoice.taxTotal)}</p>
                    <p className="font-extrabold text-xs text-gray-900 pt-1">
                      TOTAL: {selectedInvoice.type === 'NC' ? `- ${formatKz(selectedInvoice.total)}` : formatKz(selectedInvoice.total)}
                    </p>
                  </div>

                  <div className="border-t border-dashed border-gray-300 my-2"></div>

                  {/* Encryption Audit and Signatures */}
                  <div className="space-y-1 text-center text-[8px] text-gray-500">
                    <p className="font-bold text-gray-700">ELEMENTO DE CONTROLO AGT</p>
                    <div className="bg-gray-100 p-1 rounded font-mono text-center text-[9px] text-gray-800 font-bold border border-gray-200">
                      Hash: {selectedInvoice.hashControl}
                    </div>
                    <p className="line-clamp-2 text-xxs font-mono">{selectedInvoice.hash}</p>
                    <p className="pt-2">
                      Processado por Programa Certificado nº {selectedInvoice.signedBy} / VENDA MAIS
                    </p>
                    {selectedInvoice.type === 'NC' ? (
                      <p className="font-bold text-amber-800">DOCUMENTO DE RECTIFICAÇÃO DE FATURA</p>
                    ) : (
                      <p className="font-semibold text-gray-600">Reimpressão Autorizada por Lei</p>
                    )}
                  </div>

                </div>
              )}

              {/* A4 PRINTABLE DOCUMENT PREVIEW */}
              {printFormat === 'a4' && (
                <div 
                  id="printed-invoice-a4" 
                  className="bg-white border border-slate-200 shadow-md w-full max-w-3xl p-8 rounded-xl font-sans text-slate-800 space-y-6 text-xs leading-relaxed"
                >
                  {/* Company Header & Document Badge */}
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-6 gap-4">
                    <div className="space-y-1.5">
                      {company.logoUrl ? (
                        <div className="mb-2">
                          <img src={company.logoUrl} alt={company.name} className="max-h-16 max-w-[220px] object-contain" />
                          <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase mt-1">{company.name}</h2>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-6 h-6 text-brand" />
                          <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">{company.name}</h2>
                        </div>
                      )}
                      <p className="text-slate-600 font-medium">{company.address}, {company.city} — {company.country}</p>
                      <div className="flex flex-wrap gap-x-4 text-slate-600 font-semibold text-xxs">
                        <span><strong>NIF:</strong> {company.nif}</span>
                        <span><strong>Tel:</strong> {company.phone}</span>
                        <span><strong>Email:</strong> {company.email}</span>
                      </div>
                      <p className="text-xxs text-slate-500 font-medium pt-0.5">Regime Fiscal: <strong>{company.regime || 'Regime Geral'}</strong></p>
                    </div>

                    {/* Document Status / Number Box */}
                    <div className={`${selectedInvoice.type === 'NC' ? 'bg-amber-900' : 'bg-slate-900'} text-white p-4 rounded-2xl text-right min-w-[240px] shadow-sm space-y-1.5`}>
                      <div className={`inline-block px-2.5 py-0.5 rounded-full font-black text-[10px] tracking-wider uppercase mb-1 ${selectedInvoice.type === 'NC' ? 'bg-amber-500 text-slate-950' : 'bg-brand text-white'}`}>
                        {selectedInvoice.type === 'NC' ? 'NOTA DE CRÉDITO' : selectedInvoice.type === 'FR' ? 'FACTURA RECIBO' : selectedInvoice.type === 'FT' ? 'FACTURA' : 'PROFORMA'}
                      </div>
                      <h3 className="text-lg font-black font-mono tracking-tight text-white">{selectedInvoice.invoiceNo}</h3>
                      <div className="text-[11px] text-slate-200 font-medium space-y-0.5">
                        <p>Data Emissão: <strong className="text-white font-mono">{selectedInvoice.date}</strong></p>
                        {selectedInvoice.rectifiedInvoiceNo && (
                          <p className="text-amber-200 font-bold">Doc. Rectificado: <strong className="text-white font-mono">{selectedInvoice.rectifiedInvoiceNo}</strong></p>
                        )}
                        <p>Moeda: <strong className="text-white font-mono">AOA (Kz)</strong></p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information & Rectification Reason Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Dados do Cliente / Adquirente</span>
                      <h4 className="font-extrabold text-sm text-slate-900">{selectedInvoice.customer?.name || 'Consumidor Final / Cliente Geral'}</h4>
                      <p className="text-slate-600 font-medium"><strong>NIF:</strong> {selectedInvoice.customer?.nif || '999999999'}</p>
                      {selectedInvoice.customer?.address && (
                        <p className="text-slate-600"><strong>Endereço:</strong> {selectedInvoice.customer.address}</p>
                      )}
                    </div>

                    {selectedInvoice.type === 'NC' && (
                      <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-900 block flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" /> Motivo da Rectificação
                        </span>
                        <p className="text-xs font-bold text-amber-950">{selectedInvoice.reason || 'Devolução / Anulação Total ou Parcial do Documento'}</p>
                        <p className="text-[10px] text-amber-800">Conforme Artigo 78.º do Código do IVA da AGT Angola.</p>
                      </div>
                    )}
                  </div>

                  {/* Line Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5">Código</th>
                          <th className="py-2.5">Descrição do Artigo / Serviço</th>
                          <th className="py-2.5 text-center">Qtd</th>
                          <th className="py-2.5 text-right">Preço Unit.</th>
                          <th className="py-2.5 text-center">Taxa IVA</th>
                          <th className="py-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {selectedInvoice.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 font-mono text-slate-500 text-xxs">{item.productCode}</td>
                            <td className="py-2.5 font-bold text-slate-900">{item.productName}</td>
                            <td className="py-2.5 text-center font-mono">{item.quantity}</td>
                            <td className="py-2.5 text-right font-mono text-slate-600">{formatKz(item.price)}</td>
                            <td className="py-2.5 text-center font-mono text-slate-500">
                              {item.taxRate > 0 ? `${item.taxRate}%` : 'Isento'}
                            </td>
                            <td className="py-2.5 text-right font-mono font-bold text-slate-900">{formatKz(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals & Summary */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-200">
                    <div className="space-y-2 text-xxs text-slate-500 max-w-sm">
                      <p><strong>Operador:</strong> {selectedInvoice.operator || currentUser?.name || currentUser?.username || 'Operador'}</p>
                      {selectedInvoice.notes && <p><strong>Observações:</strong> {selectedInvoice.notes}</p>}
                    </div>

                    <div className="w-full sm:w-64 space-y-1.5 text-right bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Subtotal Liquidado:</span>
                        <span className="font-mono">{formatKz(selectedInvoice.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Total Imposto (IVA 14%):</span>
                        <span className="font-mono">{formatKz(selectedInvoice.taxTotal)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-slate-900">
                        <span>VALOR TOTAL:</span>
                        <span className="font-mono text-brand">{selectedInvoice.type === 'NC' ? `- ${formatKz(selectedInvoice.total)}` : formatKz(selectedInvoice.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* AGT Certification and Signature Footer */}
                  <div className="border-t border-slate-200 pt-6 mt-6 space-y-2 text-center text-slate-400 text-xxs">
                    <div className="flex justify-center items-center gap-2 font-mono text-slate-700 bg-slate-100 py-1.5 px-3 rounded-lg w-max mx-auto border border-slate-200 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{selectedInvoice.hashControl}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500 font-normal truncate max-w-md">{selectedInvoice.hash}</span>
                    </div>
                    <p className="font-medium text-slate-500">
                      Processado por programa certificado n.º <strong>{selectedInvoice.signedBy}</strong> / VENDA MAIS (AGT Angola)
                    </p>
                    {selectedInvoice.type === 'NC' ? (
                      <p className="font-bold text-amber-800 uppercase tracking-wider">Documento de Anulação / Rectificação de Fatura</p>
                    ) : (
                      <p className="font-semibold text-slate-600">Este documento não serve de fatura sem a respectiva quitação de pagamento.</p>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-mono">
                Hash AGT: <strong className="text-gray-900">{selectedInvoice.hashControl}</strong>
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 font-bold rounded-xl text-gray-700 text-xs transition"
                >
                  Fechar
                </button>
                <button
                  id="btn-print-active-doc"
                  onClick={() => {
                    const docConf = getDocumentPrintFormat(selectedInvoice.type);
                    const targetId = printFormat === 'ticket' ? 'printed-invoice-ticket' : 'printed-invoice-a4';
                    const width = printFormat === 'ticket'
                      ? (docConf.ticketSize === '80mm' ? '420px' : docConf.ticketSize === '55mm' ? '280px' : '340px')
                      : '800px';
                    printElement(targetId, width);
                  }}
                  className="px-5 py-2 bg-brand hover:bg-brand/90 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Agora</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// SUBCOMPONENT: CREDIT NOTE EMISSION MODAL
interface CreditNoteModalProps {
  targetInvoice: Invoice | null;
  invoices: Invoice[];
  company: CompanyConfig;
  keys?: KeysConfig;
  products: Product[];
  onClose: () => void;
  onEmitCreditNote: (creditNote: Invoice, originalInvoiceNo: string, restoreStock: boolean) => void;
}

function CreditNoteModal({
  targetInvoice: initialTarget,
  invoices,
  company,
  keys,
  products,
  onClose,
  onEmitCreditNote
}: CreditNoteModalProps) {
  // Available invoices eligible for credit note (FT, FR, or non-canceled)
  const eligibleInvoices = invoices.filter(inv => inv.type !== 'NC' && inv.type !== 'FP' && inv.status !== 'RECTIFICADO' && inv.status !== 'ANULADO');

  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState<string>(initialTarget?.invoiceNo || (eligibleInvoices[0]?.invoiceNo || ''));
  const [selectedReasonOption, setSelectedReasonOption] = useState<string>('Devolução de Mercadoria / Artigos');
  const [customReasonText, setCustomReasonText] = useState<string>('');
  const [restoreStock, setRestoreStock] = useState<boolean>(true);

  const currentOriginalInvoice = invoices.find(inv => inv.invoiceNo === selectedInvoiceNo) || initialTarget || eligibleInvoices[0];

  // Items state with quantity to credit
  const [itemQuantities, setItemQuantities] = useState<{ [index: number]: number }>(() => {
    if (!currentOriginalInvoice) return {};
    const initialMap: { [index: number]: number } = {};
    currentOriginalInvoice.items.forEach((item, idx) => {
      initialMap[idx] = item.quantity;
    });
    return initialMap;
  });

  // When original invoice changes, update item quantities
  const handleSelectInvoiceChange = (invoiceNo: string) => {
    setSelectedInvoiceNo(invoiceNo);
    const found = invoices.find(inv => inv.invoiceNo === invoiceNo);
    if (found) {
      const newMap: { [index: number]: number } = {};
      found.items.forEach((item, idx) => {
        newMap[idx] = item.quantity;
      });
      setItemQuantities(newMap);
    }
  };

  // Predefined AGT compliance reasons
  const reasonOptions = [
    'Devolução de Mercadoria / Artigos',
    'Erro nos Dados / Preço de Faturação',
    'Desconto Comercial Concedido A Posteriori',
    'Anulação Total do Documento por Cancelamento',
    'Outro Motivo Devidamente Justificado'
  ];

  if (!currentOriginalInvoice) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-md p-6 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-extrabold text-gray-900">Sem Faturas Disponíveis</h3>
          <p className="text-xs text-gray-500">
            Não existem faturas ativas (FT ou FR) disponíveis para emitir Nota de Crédito.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 text-white font-bold rounded-xl text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals for credited items
  const creditedItems: InvoiceLine[] = currentOriginalInvoice.items
    .map((item, idx) => {
      const qtyToCredit = Math.max(0, Math.min(item.quantity, itemQuantities[idx] ?? item.quantity));
      if (qtyToCredit <= 0) return null;
      const itemSubtotal = qtyToCredit * item.price;
      const itemTax = item.taxRate > 0 ? itemSubtotal * 0.14 : 0;
      return {
        ...item,
        quantity: qtyToCredit,
        total: itemSubtotal + itemTax
      };
    })
    .filter((item): item is InvoiceLine => item !== null);

  const subtotal = creditedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const taxTotal = creditedItems.reduce((sum, item) => sum + (item.taxRate > 0 ? (item.quantity * item.price * 0.14) : 0), 0);
  const total = subtotal + taxTotal;

  const handleConfirmEmitNc = () => {
    if (creditedItems.length === 0) {
      alert("Por favor selecione pelo menos 1 artigo para creditar/retificar.");
      return;
    }

    const finalReason = selectedReasonOption === 'Outro Motivo Devidamente Justificado' 
      ? (customReasonText.trim() || 'Outro motivo de retificação') 
      : selectedReasonOption;

    const ncCount = invoices.filter(i => i.type === 'NC').length + 1;
    const year = new Date().getFullYear();
    const invoiceNo = `NC VMAIS${year}/${String(ncCount).padStart(3, '0')}`;
    const dateStr = new Date().toISOString().slice(0, 10);
    const systemEntryDate = new Date().toISOString().slice(0, 19);

    const lastInvoiceHash = (invoices.length > 0) ? invoices[invoices.length - 1].hash : '';
    const privateKey = keys?.privateKey || '';

    // Generate AGT hash
    const { hash, hashControl } = signInvoice(
      dateStr,
      systemEntryDate,
      invoiceNo,
      total,
      lastInvoiceHash,
      privateKey
    );

    const creditNoteInvoice: Invoice = {
      id: 'nc-' + Date.now(),
      invoiceNo,
      sequenceNumber: invoices.length + 1,
      type: 'NC',
      date: dateStr,
      customer: currentOriginalInvoice.customer,
      items: creditedItems,
      subtotal,
      discountTotal: 0,
      taxTotal,
      total,
      paymentMethod: currentOriginalInvoice.paymentMethod,
      status: 'EMITIDO',
      rectifiedInvoiceNo: currentOriginalInvoice.invoiceNo,
      reason: finalReason,
      hash,
      hashControl,
      previousHash: lastInvoiceHash,
      signedBy: keys?.certId || '320/AGT/2026'
    };

    onEmitCreditNote(creditNoteInvoice, currentOriginalInvoice.invoiceNo, restoreStock);
  };

  const formatKz = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' })
      .format(value)
      .replace('Kz', '')
      .trim() + ' Kz';
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-2xl p-6 flex flex-col max-h-[92vh] transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base">Emissão de Nota de Crédito (NC)</h3>
              <p className="text-xs text-gray-500">Documento de retificação e anulação em conformidade com a AGT</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 text-xs">
          
          {/* Select original document */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-gray-800 block">
              1. Documento de Origem a Retificar:
            </label>
            <select
              id="select-orig-invoice-nc"
              value={selectedInvoiceNo}
              onChange={(e) => handleSelectInvoiceChange(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {eligibleInvoices.map((inv) => (
                <option key={inv.id} value={inv.invoiceNo}>
                  {inv.invoiceNo} — {inv.customer?.name || 'Cliente Geral'} ({formatKz(inv.total)})
                </option>
              ))}
            </select>
          </div>

          {/* Reason selector */}
          <div className="space-y-1.5">
            <label className="font-extrabold text-gray-800 block">
              2. Motivo da Retificação / Anulação (Obrigatório AGT):
            </label>
            <select
              id="select-nc-reason"
              value={selectedReasonOption}
              onChange={(e) => setSelectedReasonOption(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {reasonOptions.map((r, i) => (
                <option key={i} value={r}>{r}</option>
              ))}
            </select>

            {selectedReasonOption === 'Outro Motivo Devidamente Justificado' && (
              <input
                type="text"
                id="input-nc-custom-reason"
                placeholder="Especifique o motivo exato..."
                value={customReasonText}
                onChange={(e) => setCustomReasonText(e.target.value)}
                className="w-full p-2.5 mt-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            )}
          </div>

          {/* Items & quantities table */}
          <div className="space-y-2">
            <label className="font-extrabold text-gray-800 block">
              3. Artigos a Creditar / Devolver:
            </label>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold">
                    <th className="p-3">Artigo</th>
                    <th className="p-3 text-center">Qtd Orig.</th>
                    <th className="p-3 text-center">Qtd a Creditar</th>
                    <th className="p-3 text-right">Preço Unit.</th>
                    <th className="p-3 text-right">Subtotal Creditar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentOriginalInvoice.items.map((line, idx) => {
                    const currentQtyToCredit = itemQuantities[idx] !== undefined ? itemQuantities[idx] : line.quantity;
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="p-3 font-bold text-gray-900">{line.productName}</td>
                        <td className="p-3 text-center font-mono text-gray-500">{line.quantity}</td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={line.quantity}
                            value={currentQtyToCredit}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setItemQuantities(prev => ({ ...prev, [idx]: val }));
                            }}
                            className="w-16 p-1 text-center font-bold bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </td>
                        <td className="p-3 text-right font-mono text-gray-600">{formatKz(line.price)}</td>
                        <td className="p-3 text-right font-mono font-bold text-amber-800">
                          {formatKz(currentQtyToCredit * line.price)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Return stock checkbox */}
          <div className="bg-amber-50/60 border border-amber-200/80 p-3 rounded-2xl flex items-center gap-3">
            <input
              type="checkbox"
              id="chk-restore-stock"
              checked={restoreStock}
              onChange={(e) => setRestoreStock(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
            />
            <label htmlFor="chk-restore-stock" className="text-xs font-bold text-amber-950 cursor-pointer">
              Devolver artigos ao Stock / Inventário automaticamente
            </label>
          </div>

          {/* Totals Summary Box */}
          <div className="bg-gray-900 text-white p-4 rounded-2xl space-y-1.5 text-right font-mono">
            <div className="flex justify-between text-gray-300 text-xs">
              <span>Subtotal Creditado:</span>
              <span>{formatKz(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-300 text-xs">
              <span>IVA (14%):</span>
              <span>{formatKz(taxTotal)}</span>
            </div>
            <div className="border-t border-gray-800 pt-2 flex justify-between font-extrabold text-sm text-amber-400">
              <span>TOTAL NOTA DE CRÉDITO:</span>
              <span>- {formatKz(total)}</span>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-50 font-bold rounded-xl text-gray-700 text-xs transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            id="btn-confirm-emit-nc"
            onClick={handleConfirmEmitNc}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Emitir e Assinar NC</span>
          </button>
        </div>

      </div>
    </div>
  );
}
