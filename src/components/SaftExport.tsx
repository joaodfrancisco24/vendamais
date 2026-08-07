/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Calendar, 
  Code, 
  Info, 
  FileText,
  CheckCircle,
  Database,
  Building2
} from 'lucide-react';
import { Product, Customer, Invoice, KeysConfig, CompanyConfig } from '../types';
import { generateSaftAoXml } from '../utils/saftGenerator';

interface SaftExportProps {
  company: CompanyConfig;
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  keys: KeysConfig;
}

export default function SaftExport({
  company,
  products,
  customers,
  invoices,
  keys
}: SaftExportProps) {

  // Date selectors for SAF-T range
  const currentMonthStart = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }, []);

  const todayStr = useMemo(() => {
    return new Date().toISOString().slice(0, 10);
  }, []);

  const [startDate, setStartDate] = useState(currentMonthStart);
  const [endDate, setEndDate] = useState(todayStr);

  // Filter invoices for the chosen period
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      return inv.date >= startDate && inv.date <= endDate;
    });
  }, [invoices, startDate, endDate]);

  // Totals for selected period
  const totalInvoicedPeriod = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  }, [filteredInvoices]);

  // Generate and trigger download of SAF-T (AO)
  const handleDownloadSaft = () => {
    try {
      const xmlContent = generateSaftAoXml(
        company,
        products,
        customers,
        filteredInvoices,
        keys,
        startDate,
        endDate
      );

      // Create Blob and trigger download
      const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SAFT_AO_${startDate}_to_${endDate}.xml`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`Ficheiro SAF-T (AO) exportado com sucesso contendo ${filteredInvoices.length} faturas correspondentes ao período selecionado.`);
    } catch (err: any) {
      alert('Erro ao exportar ficheiro SAF-T: ' + err.message);
    }
  };

  // Live XML Preview code block
  const xmlPreview = useMemo(() => {
    const previewInvoices = filteredInvoices.slice(0, 1);
    try {
      const fullXml = generateSaftAoXml(
        company,
        products,
        customers,
        previewInvoices,
        keys,
        startDate,
        endDate
      );
      // slice first 38 lines for preview
      return fullXml.split('\n').slice(0, 38).join('\n') + '\n  ...\n  <!-- Conteúdo adicional omitido para pré-visualização -->\n</AuditFile>';
    } catch {
      return 'Nenhum dado disponível para visualização de XML.';
    }
  }, [company, products, customers, filteredInvoices, keys, startDate, endDate]);

  const formatKz = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' })
      .format(value)
      .replace('Kz', '')
      .trim() + ' Kz';
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="saft-export-root">
      
      {/* Title */}
      <div className="border-b border-slate-100 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Módulo SAF-T (AO)</h1>
          <p className="text-sm text-slate-500">
            Exportação do Ficheiro de Auditoria Fiscal Padrão em formato XML para a AGT
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-brand-light text-brand border border-brand-light rounded-full text-xs font-bold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Versão SAF-T: {company.saftVersion || '1.01_01'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: SAF-T Period Selection & Export Actions */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-4 h-4 text-brand" />
              Selecione o Período de Auditoria Fiscal
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start date */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Data Inicial *</label>
                  <div className="relative">
                    <input 
                      type="date"
                      id="saft-start-date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                    />
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* End date */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Data Final *</label>
                  <div className="relative">
                    <input 
                      type="date"
                      id="saft-end-date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                    />
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Resumo do Período Selecionado</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold block">Clientes</span>
                    <span className="text-sm font-black text-slate-900 font-mono">{customers.length}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold block">Artigos</span>
                    <span className="text-sm font-black text-slate-900 font-mono">{products.length}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold block">Documentos</span>
                    <span className="text-sm font-black text-brand font-mono">{filteredInvoices.length}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold block">Total Faturado</span>
                    <span className="text-xs font-black text-brand font-mono truncate block">{formatKz(totalInvoicedPeriod)}</span>
                  </div>
                </div>
              </div>

              {/* Action button */}
              <button
                id="btn-trigger-saft-download"
                onClick={handleDownloadSaft}
                className="w-full py-3.5 bg-brand text-white text-xs font-bold rounded-xl hover:bg-brand-dark transition flex items-center justify-center gap-2 shadow-md group"
              >
                <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition" />
                GERAR E DESCARREGAR SAF-T (AO) XML
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Information on SAF-T Regulations */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 bg-brand-light/70 border border-brand-light rounded-3xl text-slate-900 space-y-3">
            <div className="flex items-center gap-2 text-brand">
              <Info className="w-5 h-5 flex-shrink-0" />
              <h4 className="font-extrabold text-sm">O que é o Ficheiro SAF-T (AO)?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              O Standard Audit File for Tax Purpose - Angola (SAF-T AO) é um ficheiro estruturado em formato XML que reúne o catálogo de artigos, ficheiro de clientes e o histórico cronológico e assinado de todas as faturas e documentos comerciais.
            </p>
            <div className="space-y-2 pt-2 text-xs border-t border-brand-light">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <span className="text-slate-700">Submissão mensal obrigatória no Portal da AGT até ao dia 15 do mês seguinte.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <span className="text-slate-700">Garante a autenticidade e não adulteração dos documentos emitidos.</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Structured XML preview code layout */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm" id="xml-code-preview">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-bold text-slate-950 text-sm flex items-center gap-1.5">
              <Code className="w-4 h-4 text-brand" />
              Estrutura Técnica do Ficheiro XML SAF-T (AO)
            </h3>
            <p className="text-xxs text-slate-400">Pré-visualização em tempo real do cabeçalho e estrutura XML gerada</p>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded">
            UTF-8 / XML v1.01_01
          </span>
        </div>

        <div className="relative">
          <pre className="bg-slate-950 text-emerald-400 text-xxs font-mono p-4 rounded-2xl overflow-x-auto h-64 leading-normal select-all">
            {xmlPreview}
          </pre>
        </div>
      </div>

    </div>
  );
}
