import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  PieChart, 
  Landmark, 
  Coins, 
  FileText, 
  Printer, 
  ArrowLeft, 
  Calendar, 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  Users, 
  Lock, 
  Wallet, 
  Scale, 
  Award, 
  FileCheck,
  TrendingDown,
  Clock,
  Briefcase
} from 'lucide-react';
import { Invoice, Product, Customer, CompanyConfig } from '../types';
import { printElement } from '../utils/print';

interface FinancialReportsProps {
  invoices: Invoice[];
  products: Product[];
  customers: Customer[];
  company: CompanyConfig;
  onNavigate: (tab: string) => void;
}

type ReportType = 'vendas-mensais' | 'lucros-produto' | 'vendas-usuario' | 'mapa-iva' | 'imposto-selo' | 'conta-corrente';

export default function FinancialReports({ invoices, products, customers, company, onNavigate }: FinancialReportsProps) {
  // Date states - Defaulting to July 31st 2026 to August 10th 2026 as shown in the user's image
  const [startDate, setStartDate] = useState<string>('2026-07-31');
  const [endDate, setEndDate] = useState<string>('2026-08-10');
  
  // Selection states
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  // Printing trigger
  const [triggerPrint, setTriggerPrint] = useState<boolean>(false);

  // Auto-print effect when PDF is clicked
  useEffect(() => {
    if (selectedReport && triggerPrint) {
      const timer = setTimeout(() => {
        printElement(`printed-${selectedReport}`, '1000px');
        setTriggerPrint(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedReport, triggerPrint]);

  // General Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const invDate = inv.date.slice(0, 10);
    return invDate >= startDate && invDate <= endDate;
  });

  const formatKz = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  // Handler to open report
  const handleOpenReport = (type: ReportType, isPdf: boolean = false) => {
    setSelectedReport(type);
    if (isPdf) {
      setTriggerPrint(true);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="financial-reports-root">
      {/* HEADER */}
      <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Relatórios Financeiros</h1>
          <p className="text-sm text-slate-500">
            {selectedReport 
              ? 'Visualize, filtre e exporte os detalhes analíticos do relatório selecionado.' 
              : 'Analise a evolução de vendas, custos operacionais, apuramento de IVA e lucros detalhados do ecossistema.'}
          </p>
        </div>
        {selectedReport && (
          <button
            id="btn-back-to-reports"
            onClick={() => setSelectedReport(null)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-2 shrink-0 border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos Relatórios
          </button>
        )}
      </div>

      {/* DATE FILTER BLOCK */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Start Date */}
          <div className="space-y-1.5 flex-1 sm:flex-none">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Data Início</label>
            <div className="relative">
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-[180px] py-2 px-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1.5 flex-1 sm:flex-none">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Data Fim</label>
            <div className="relative">
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-[180px] py-2 px-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand/30 focus:border-brand transition"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            FILTRE POR PERÍODO PARA OBTER DADOS PRECISOS.
          </p>
          <p className="text-[11px] font-semibold text-brand mt-0.5">
            {filteredInvoices.length} documentos encontrados neste período
          </p>
        </div>
      </div>

      {/* MAIN VIEW: REPORT GRID */}
      {!selectedReport ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* CARD 1: VENDAS MENSAIS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between min-h-[190px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800">
                  <TrendingUp className="w-5 h-5 text-slate-700" />
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Vendas Mensais</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Resumo de vendas por mês com totais acumulados.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
              <button 
                onClick={() => handleOpenReport('vendas-mensais', false)}
                className="text-xxs font-black text-sky-600 hover:text-sky-800 uppercase tracking-widest transition cursor-pointer"
              >
                VISUALIZAR
              </button>
              <span className="text-slate-200">|</span>
              <button 
                onClick={() => handleOpenReport('vendas-mensais', true)}
                className="text-xxs font-black text-sky-600 hover:text-sky-800 uppercase tracking-widest transition cursor-pointer"
              >
                PDF
              </button>
            </div>
          </div>

          {/* CARD 2: LUCROS POR PRODUTO */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between min-h-[190px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800">
                  <Coins className="w-5 h-5 text-slate-700" />
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Lucros por Produto</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Visão detalhada de ganhos brutos por item.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
              <button 
                onClick={() => handleOpenReport('lucros-produto', false)}
                className="text-xxs font-black text-sky-600 hover:text-sky-800 uppercase tracking-widest transition cursor-pointer"
              >
                VISUALIZAR
              </button>
              <span className="text-slate-200">|</span>
              <button 
                onClick={() => handleOpenReport('lucros-produto', true)}
                className="text-xxs font-black text-sky-600 hover:text-sky-800 uppercase tracking-widest transition cursor-pointer"
              >
                PDF
              </button>
            </div>
          </div>

          {/* CARD 3: VENDAS POR USUÁRIO */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between min-h-[190px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800">
                  <Users className="w-5 h-5 text-slate-700" />
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Vendas por Usuário</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Desempenho de vendas da equipe.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
              <button 
                onClick={() => handleOpenReport('vendas-usuario', false)}
                className="text-xxs font-black text-sky-600 hover:text-sky-800 uppercase tracking-widest transition cursor-pointer"
              >
                VISUALIZAR
              </button>
              <span className="text-slate-200">|</span>
              <button 
                onClick={() => handleOpenReport('vendas-usuario', true)}
                className="text-xxs font-black text-sky-600 hover:text-sky-800 uppercase tracking-widest transition cursor-pointer"
              >
                PDF
              </button>
            </div>
          </div>

          {/* CARD 4: MAPA DO IVA */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between min-h-[190px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800">
                  <BarChart2 className="w-5 h-5 text-slate-700" />
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Mapa do IVA</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Resumo para obrigações fiscais.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
              <button 
                onClick={() => handleOpenReport('mapa-iva', false)}
                className="text-xxs font-black text-sky-600 hover:text-sky-800 uppercase tracking-widest transition cursor-pointer"
              >
                VISUALIZAR
              </button>
              <span className="text-slate-200">|</span>
              <button 
                onClick={() => handleOpenReport('mapa-iva', true)}
                className="text-xxs font-black text-sky-600 hover:text-sky-800 uppercase tracking-widest transition cursor-pointer"
              >
                PDF
              </button>
            </div>
          </div>

          {/* CARD 5: IMPOSTO DE SELO */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between min-h-[190px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800">
                  <FileText className="w-5 h-5 text-slate-700" />
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Imposto de Selo</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Monitoramento de taxas de selo.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
              <button 
                onClick={() => handleOpenReport('imposto-selo', false)}
                className="text-xxs font-black text-sky-600 hover:text-sky-800 uppercase tracking-widest transition cursor-pointer"
              >
                VISUALIZAR
              </button>
              <span className="text-slate-200">|</span>
              <button 
                onClick={() => handleOpenReport('imposto-selo', true)}
                className="text-xxs font-black text-sky-600 hover:text-sky-800 uppercase tracking-widest transition cursor-pointer"
              >
                PDF
              </button>
            </div>
          </div>

          {/* CARD 6: CONTA CORRENTE */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between min-h-[190px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800">
                  <BookOpen className="w-5 h-5 text-slate-700" />
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Conta Corrente</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Extrato de dívida de cliente ou fornecedor.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-50">
              <button 
                onClick={() => handleOpenReport('conta-corrente', false)}
                className="text-xxs font-black text-sky-600 hover:text-sky-800 uppercase tracking-widest transition cursor-pointer"
              >
                ACESSAR EXTRATOS
              </button>
            </div>
          </div>

          {/* CARD 7: GESTÃO DE TURNOS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between min-h-[190px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800">
                  <Lock className="w-5 h-5 text-slate-700" />
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Gestão de Turnos (Caixa)</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Consulte os turnos antigos e fechos de caixa.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-50">
              <button 
                onClick={() => onNavigate('turnos')}
                className="text-xxs font-black text-sky-600 hover:text-sky-800 uppercase tracking-widest transition cursor-pointer"
              >
                ACESSAR HISTÓRICO
              </button>
            </div>
          </div>

          {/* CARD 8: SAÍDAS / PAGAMENTOS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between min-h-[190px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800">
                  <Coins className="w-5 h-5 text-slate-700" />
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Saídas / Pagamentos</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Emissão e consulta de notas de pagamento (saídas de tesouraria).
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-50">
              <button 
                onClick={() => onNavigate('pagamentos')}
                className="text-xxs font-black text-sky-600 hover:text-sky-800 uppercase tracking-widest transition cursor-pointer"
              >
                ACESSAR HISTÓRICO
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* DETAILED REPORT VIEW CONTAINER */
        <div className="space-y-6">
          
          {/* ACTIONS BAR FOR DETAILED VIEW */}
          <div className="flex justify-end items-center gap-3">
            <button
              id={`btn-print-${selectedReport}`}
              onClick={() => printElement(`printed-${selectedReport}`, '1000px')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm shrink-0"
            >
              <Printer className="w-4 h-4" />
              Imprimir Relatório (PDF)
            </button>
          </div>

          {/* REPORT PRINTER AREA */}
          <div 
            id={`printed-${selectedReport}`} 
            className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6"
          >
            {/* PRINTER COMPANY HEADER (Visible in print) */}
            <div className="text-center space-y-1 pb-6 border-b border-slate-100">
              <h1 className="text-[26px] font-black text-[#0266b3] tracking-tight">
                {company.name}
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
                NIF: {company.nif} {company.address && `| ${company.address}`} {company.city && `| ${company.city}`} {company.phone && `| Tel: ${company.phone}`} {company.email && `| Email: ${company.email}`}
              </p>
              <h2 className="text-xs font-black text-slate-600 tracking-widest uppercase mt-3 pt-2 border-t border-slate-100">
                {selectedReport === 'vendas-mensais' && 'RELATÓRIO DE VENDAS MENSAIS'}
                {selectedReport === 'lucros-produto' && 'RELATÓRIO DE LUCROS POR PRODUTO'}
                {selectedReport === 'vendas-usuario' && 'RELATÓRIO DE DESEMPENHO DE VENDAS POR USUÁRIO'}
                {selectedReport === 'mapa-iva' && 'RELATÓRIO FISCAL - MAPA DO IVA'}
                {selectedReport === 'imposto-selo' && 'RELATÓRIO DE IMPOSTO DE SELO'}
                {selectedReport === 'conta-corrente' && 'EXTRATO DE CONTA CORRENTE'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Período: {startDate.split('-').reverse().join('/')} a {endDate.split('-').reverse().join('/')}
              </p>
            </div>

            {/* REPORT SPECIFIC CONTENT */}
            
            {/* 1. VENDAS MENSAIS */}
            {selectedReport === 'vendas-mensais' && (
              <ReportVendasMensais 
                filteredInvoices={filteredInvoices} 
                formatKz={formatKz} 
              />
            )}

            {/* 2. LUCROS POR PRODUTO */}
            {selectedReport === 'lucros-produto' && (
              <ReportLucrosProduto 
                filteredInvoices={filteredInvoices} 
                products={products}
                formatKz={formatKz} 
              />
            )}

            {/* 3. VENDAS POR USUÁRIO */}
            {selectedReport === 'vendas-usuario' && (
              <ReportVendasUsuario 
                filteredInvoices={filteredInvoices} 
                formatKz={formatKz} 
              />
            )}

            {/* 4. MAPA DO IVA */}
            {selectedReport === 'mapa-iva' && (
              <ReportMapaIva 
                filteredInvoices={filteredInvoices} 
                products={products}
                formatKz={formatKz} 
              />
            )}

            {/* 5. IMPOSTO DE SELO */}
            {selectedReport === 'imposto-selo' && (
              <ReportImpostoSelo 
                filteredInvoices={filteredInvoices} 
                formatKz={formatKz} 
              />
            )}

            {/* 6. CONTA CORRENTE */}
            {selectedReport === 'conta-corrente' && (
              <ReportContaCorrente 
                invoices={invoices} 
                customers={customers}
                selectedCustomerId={selectedCustomerId}
                setSelectedCustomerId={setSelectedCustomerId}
                formatKz={formatKz} 
                startDate={startDate}
                endDate={endDate}
              />
            )}

            {/* Shared Document print footer */}
            <div className="text-center text-[10px] text-slate-400 font-medium pt-8 border-t border-slate-100 mt-12">
              Documento gerado em {new Date().toLocaleDateString('pt-PT')} {new Date().toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})} | {company.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   SUB-COMPONENTS FOR SPECIFIC DETAILED REPORTS
   ========================================== */

// 1. VENDAS MENSAIS
interface ReportVendasMensaisProps {
  filteredInvoices: Invoice[];
  formatKz: (value: number) => string;
}
function ReportVendasMensais({ filteredInvoices, formatKz }: ReportVendasMensaisProps) {
  // Helper to format raw numbers in Portuguese style without the currency suffix
  const formatNum = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  // Grouping by Month (YYYY-MM)
  const monthlyData: Record<string, { 
    monthName: string;
    documentos: number;
    facturas: number;
    creditos: number;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  }> = {};

  const monthNamesMap: Record<string, string> = {
    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
    '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
    '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
  };

  filteredInvoices.forEach((inv) => {
    if (inv.status === 'ANULADO') return;
    const year = inv.date.slice(0, 4);
    const month = inv.date.slice(5, 7);
    const key = `${year}-${month}`;
    const name = `${monthNamesMap[month] || month} / ${year}`;
    
    if (!monthlyData[key]) {
      monthlyData[key] = { 
        monthName: name, 
        documentos: 0, 
        facturas: 0, 
        creditos: 0, 
        subtotal: 0, 
        discount: 0, 
        tax: 0, 
        total: 0 
      };
    }

    const sign = inv.type === 'NC' ? -1 : 1;
    
    // Total documents count
    monthlyData[key].documentos += 1;
    if (inv.type === 'NC') {
      monthlyData[key].creditos += 1;
    } else {
      monthlyData[key].facturas += 1;
    }

    // Subtotal is the taxable baseline before tax (Total minus Tax)
    monthlyData[key].subtotal += (inv.total - inv.taxTotal) * sign;
    monthlyData[key].discount += (inv.discountTotal || 0) * sign;
    monthlyData[key].tax += inv.taxTotal * sign;
    monthlyData[key].total += inv.total * sign;
  });

  const monthsArray = Object.keys(monthlyData).sort().map(key => ({
    key,
    ...monthlyData[key]
  }));

  const grandTotals = monthsArray.reduce((acc, curr) => ({
    documentos: acc.documentos + curr.documentos,
    facturas: acc.facturas + curr.facturas,
    creditos: acc.creditos + curr.creditos,
    subtotal: acc.subtotal + curr.subtotal,
    discount: acc.discount + curr.discount,
    tax: acc.tax + curr.tax,
    total: acc.total + curr.total
  }), { documentos: 0, facturas: 0, creditos: 0, subtotal: 0, discount: 0, tax: 0, total: 0 });

  // Payment method totals
  let cashTotal = 0;
  let cardTotal = 0;
  let bankTotal = 0;

  filteredInvoices.forEach((inv) => {
    if (inv.status === 'ANULADO') return;
    const sign = inv.type === 'NC' ? -1 : 1;
    if (inv.paymentMethod === 'Numerário') {
      cashTotal += inv.total * sign;
    } else if (inv.paymentMethod === 'Multicaixa') {
      cardTotal += inv.total * sign;
    } else if (inv.paymentMethod === 'Transferência') {
      bankTotal += inv.total * sign;
    } else { // Misto
      cashTotal += (inv.cashReceived || (inv.total * 0.5)) * sign;
      cardTotal += (inv.cardReceived || (inv.total * 0.5)) * sign;
    }
  });

  const maxTotal = Math.max(...monthsArray.map(m => m.total), 1);

  return (
    <div className="space-y-6">
      {/* Cards summaries (On-screen helper cards, hidden in print) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Faturação Total (Líquida)</span>
          <span className="text-lg font-black text-slate-900 font-mono mt-1 block">{formatKz(grandTotals.total)}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Total IVA Liquidado</span>
          <span className="text-lg font-black text-emerald-600 font-mono mt-1 block">{formatKz(grandTotals.tax)}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Volume de Documentos</span>
          <span className="text-lg font-black text-slate-900 font-mono mt-1 block">{grandTotals.documentos} un.</span>
        </div>
      </div>

      {/* Main Table styled exactly like the provided user template */}
      <div className="overflow-hidden border border-slate-200 rounded-lg text-xs bg-white shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0266b3] text-white text-[10px] font-bold uppercase tracking-wider">
              <th className="p-3 py-2.5 font-bold text-left pl-4">MÊS</th>
              <th className="p-3 py-2.5 font-bold text-center">DOCUMENTOS</th>
              <th className="p-3 py-2.5 font-bold text-center">FACTURAS</th>
              <th className="p-3 py-2.5 font-bold text-center">CRÉDITOS</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">VALOR BASE</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">IVA</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">TOTAL GERAL</th>
            </tr>
          </thead>
          <tbody>
            {monthsArray.length > 0 ? (
              monthsArray.map((m, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/40 text-slate-700">
                  <td className="p-3 pl-4 font-semibold text-slate-800">{m.monthName}</td>
                  <td className="p-3 text-center font-bold font-mono">{m.documentos}</td>
                  <td className="p-3 text-center font-semibold font-mono text-slate-600">{m.facturas}</td>
                  <td className="p-3 text-center font-semibold font-mono text-slate-600">{m.creditos}</td>
                  <td className="p-3 text-right pr-4 font-mono">{formatNum(m.subtotal)}</td>
                  <td className="p-3 text-right pr-4 font-mono">{formatNum(m.tax)}</td>
                  <td className="p-3 text-right pr-4 font-mono font-bold text-slate-900">{formatNum(m.total)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                  Sem dados de faturamento para o período selecionado.
                </td>
              </tr>
            )}
            {/* Grand Totals */}
            <tr className="bg-[#f0f7fc] font-black text-slate-900 border-t border-slate-300">
              <td className="p-3 pl-4 text-xs font-black uppercase">TOTAIS</td>
              <td className="p-3 text-center font-mono font-black">{grandTotals.documentos}</td>
              <td className="p-3 text-center font-mono font-black">{grandTotals.facturas}</td>
              <td className="p-3 text-center font-mono font-black">{grandTotals.creditos}</td>
              <td className="p-3 text-right pr-4 font-mono font-black">{formatNum(grandTotals.subtotal)}</td>
              <td className="p-3 text-right pr-4 font-mono font-black">{formatNum(grandTotals.tax)}</td>
              <td className="p-3 text-right pr-4 font-mono font-black text-slate-950">{formatNum(grandTotals.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment methods breakdown (no-print) */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 no-print">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <PieChart className="w-4 h-4 text-slate-600" />
          Distribuição dos Meios de Pagamento
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {/* Cash */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xxs font-bold text-slate-500 uppercase tracking-wider">
              <span>Numerário</span>
              <span className="font-mono">{formatKz(cashTotal)}</span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                style={{ width: `${grandTotals.total > 0 ? (cashTotal / grandTotals.total) * 100 : 0}%` }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          </div>
          {/* Card */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xxs font-bold text-slate-500 uppercase tracking-wider">
              <span>Multicaixa (TPA)</span>
              <span className="font-mono">{formatKz(cardTotal)}</span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                style={{ width: `${grandTotals.total > 0 ? (cardTotal / grandTotals.total) * 100 : 0}%` }}
                className="h-full bg-brand rounded-full"
              />
            </div>
          </div>
          {/* Bank Transfer */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xxs font-bold text-slate-500 uppercase tracking-wider">
              <span>Transferência Bancária</span>
              <span className="font-mono">{formatKz(bankTotal)}</span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                style={{ width: `${grandTotals.total > 0 ? (bankTotal / grandTotals.total) * 100 : 0}%` }}
                className="h-full bg-indigo-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. LUCROS POR PRODUTO
interface ReportLucrosProdutoProps {
  filteredInvoices: Invoice[];
  products: Product[];
  formatKz: (value: number) => string;
}
function ReportLucrosProduto({ filteredInvoices, products, formatKz }: ReportLucrosProdutoProps) {
  // Map to group sales by product
  const productData: Record<string, {
    code: string;
    name: string;
    qty: number;
    buyPrice: number;
    sellPriceAvg: number;
    revenue: number;
    cost: number;
    profit: number;
  }> = {};

  filteredInvoices.forEach((inv) => {
    if (inv.status === 'ANULADO') return;
    const sign = inv.type === 'NC' ? -1 : 1;

    inv.items.forEach((item) => {
      const prodId = item.productId;
      if (!productData[prodId]) {
        // Find product to get buyPrice
        const product = products.find(p => p.id === prodId);
        const buyPrice = product ? product.buyPrice : (item.price * 0.6); // default to 60% of item price if product details missing

        productData[prodId] = {
          code: item.productCode || 'N/A',
          name: item.productName,
          qty: 0,
          buyPrice,
          sellPriceAvg: 0,
          revenue: 0,
          cost: 0,
          profit: 0
        };
      }

      productData[prodId].qty += item.quantity * sign;
      productData[prodId].revenue += item.total * sign;
    });
  });

  const productsArray = Object.keys(productData).map(id => {
    const p = productData[id];
    p.cost = p.qty * p.buyPrice;
    p.profit = p.revenue - p.cost;
    p.sellPriceAvg = p.qty > 0 ? p.revenue / p.qty : 0;
    const margin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
    return {
      id,
      margin,
      ...p
    };
  }).sort((a, b) => b.profit - a.profit); // Sort by highest gross profit

  const grandTotals = productsArray.reduce((acc, curr) => ({
    qty: acc.qty + curr.qty,
    revenue: acc.revenue + curr.revenue,
    cost: acc.cost + curr.cost,
    profit: acc.profit + curr.profit
  }), { qty: 0, revenue: 0, cost: 0, profit: 0 });

  const totalMargin = grandTotals.revenue > 0 ? (grandTotals.profit / grandTotals.revenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Cards summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Volume de Vendas (Faturação)</span>
          <span className="text-lg font-black text-slate-900 font-mono mt-1 block">{formatKz(grandTotals.revenue)}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Custo de Aquisição Est.</span>
          <span className="text-lg font-black text-slate-600 font-mono mt-1 block">{formatKz(grandTotals.cost)}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Margem Bruta Média</span>
          <span className="text-lg font-black text-brand font-mono mt-1 block">{totalMargin.toFixed(1)}%</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Lucro Bruto Total</span>
          <span className="text-lg font-black text-emerald-600 font-mono mt-1 block">{formatKz(grandTotals.profit)}</span>
        </div>
      </div>

      {/* Products list table */}
      <div className="overflow-hidden border border-slate-200 rounded-lg text-xs bg-white shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0266b3] text-white text-[10px] font-bold uppercase tracking-wider">
              <th className="p-3 py-2.5 font-bold text-left pl-4">Ref/Cód</th>
              <th className="p-3 py-2.5 font-bold text-left">Designação do Artigo</th>
              <th className="p-3 py-2.5 font-bold text-center">Unidades</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">Custo Unit.</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">Preço Médio</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">Vendas Brutas</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">Custo Merc.</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">Lucro Bruto</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">Margem %</th>
            </tr>
          </thead>
          <tbody>
            {productsArray.length > 0 ? (
              productsArray.map((p, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/40 text-slate-700">
                  <td className="p-3 pl-4 font-mono font-bold text-slate-400">{p.code}</td>
                  <td className="p-3 font-semibold text-slate-800">{p.name}</td>
                  <td className="p-3 text-center font-bold font-mono text-slate-600">{p.qty}</td>
                  <td className="p-3 text-right pr-4 font-mono">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(p.buyPrice)}</td>
                  <td className="p-3 text-right pr-4 font-mono">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(p.sellPriceAvg)}</td>
                  <td className="p-3 text-right pr-4 font-mono">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(p.revenue)}</td>
                  <td className="p-3 text-right pr-4 font-mono">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(p.cost)}</td>
                  <td className={`p-3 text-right pr-4 font-mono font-bold ${p.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(p.profit)}
                  </td>
                  <td className="p-3 text-right pr-4 font-bold font-mono">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      p.margin > 30 ? 'bg-emerald-50 text-emerald-700' : p.margin > 15 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {p.margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                  Sem dados de vendas ou lucros para o período selecionado.
                </td>
              </tr>
            )}
            {/* Grand Totals */}
            <tr className="bg-[#f0f7fc] font-black text-slate-900 border-t border-slate-300">
              <td colSpan={2} className="p-3 pl-4 text-xs font-black uppercase">TOTAIS DE DESEMPENHO</td>
              <td className="p-3 text-center font-mono font-black">{grandTotals.qty}</td>
              <td className="p-3"></td>
              <td className="p-3"></td>
              <td className="p-3 text-right pr-4 font-mono font-black">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grandTotals.revenue)}</td>
              <td className="p-3 text-right pr-4 font-mono font-black text-slate-500">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grandTotals.cost)}</td>
              <td className="p-3 text-right pr-4 font-mono font-black text-emerald-600 bg-emerald-50/10">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grandTotals.profit)}</td>
              <td className="p-3 text-right pr-4 font-mono font-black text-slate-950">{totalMargin.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 3. VENDAS POR USUÁRIO
interface ReportVendasUsuarioProps {
  filteredInvoices: Invoice[];
  formatKz: (value: number) => string;
}
function ReportVendasUsuario({ filteredInvoices, formatKz }: ReportVendasUsuarioProps) {
  const operatorData: Record<string, {
    count: number;
    qty: number;
    revenue: number;
    cash: number;
    multicaixa: number;
    transfer: number;
  }> = {};

  filteredInvoices.forEach((inv) => {
    if (inv.status === 'ANULADO') return;
    const operator = inv.operator || 'Operador Geral';
    const sign = inv.type === 'NC' ? -1 : 1;

    if (!operatorData[operator]) {
      operatorData[operator] = { count: 0, qty: 0, revenue: 0, cash: 0, multicaixa: 0, transfer: 0 };
    }

    operatorData[operator].count += 1;
    operatorData[operator].revenue += inv.total * sign;

    const itemsQty = inv.items.reduce((acc, item) => acc + item.quantity, 0);
    operatorData[operator].qty += itemsQty * sign;

    if (inv.paymentMethod === 'Numerário') {
      operatorData[operator].cash += inv.total * sign;
    } else if (inv.paymentMethod === 'Multicaixa') {
      operatorData[operator].multicaixa += inv.total * sign;
    } else if (inv.paymentMethod === 'Transferência') {
      operatorData[operator].transfer += inv.total * sign;
    } else { // Misto
      operatorData[operator].cash += (inv.cashReceived || (inv.total * 0.5)) * sign;
      operatorData[operator].multicaixa += (inv.cardReceived || (inv.total * 0.5)) * sign;
    }
  });

  const operatorsArray = Object.keys(operatorData).map(name => {
    const d = operatorData[name];
    const ticketAvg = d.count > 0 ? d.revenue / d.count : 0;
    return {
      name,
      ticketAvg,
      ...d
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const grandTotals = operatorsArray.reduce((acc, curr) => ({
    count: acc.count + curr.count,
    qty: acc.qty + curr.qty,
    revenue: acc.revenue + curr.revenue,
    cash: acc.cash + curr.cash,
    multicaixa: acc.multicaixa + curr.multicaixa,
    transfer: acc.transfer + curr.transfer
  }), { count: 0, qty: 0, revenue: 0, cash: 0, multicaixa: 0, transfer: 0 });

  const maxRevenue = Math.max(...operatorsArray.map(o => o.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Top statistics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
          <span className="p-2.5 bg-brand-light text-brand rounded-xl">
            <Award className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Melhor Operador</span>
            <span className="text-sm font-black text-slate-900 mt-0.5 block">
              {operatorsArray.length > 0 ? operatorsArray[0].name : 'Nenhum'}
            </span>
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
          <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Operadores Ativos</span>
            <span className="text-sm font-black text-slate-900 mt-0.5 block">{operatorsArray.length} na equipa</span>
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
          <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Scale className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Ticket Médio Geral</span>
            <span className="text-sm font-black text-slate-900 mt-0.5 block font-mono">
              {operatorsArray.length > 0 ? formatKz(grandTotals.revenue / grandTotals.count) : formatKz(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Performance list table */}
      <div className="overflow-hidden border border-slate-200 rounded-lg text-xs bg-white shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0266b3] text-white text-[10px] font-bold uppercase tracking-wider">
              <th className="p-3 py-2.5 font-bold text-left pl-4">Operador / Vendedor</th>
              <th className="p-3 py-2.5 font-bold text-center">N.º Doc.</th>
              <th className="p-3 py-2.5 font-bold text-center">Artigos Vendidos</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">Vendas Cash</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">Vendas TPA</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">Vendas IBAN</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">Faturação Total</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">Ticket Médio</th>
            </tr>
          </thead>
          <tbody>
            {operatorsArray.length > 0 ? (
              operatorsArray.map((o, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/40 text-slate-700">
                  <td className="p-3 pl-4 font-semibold text-slate-800 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-extrabold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {o.name}
                  </td>
                  <td className="p-3 text-center font-bold font-mono text-slate-500">{o.count}</td>
                  <td className="p-3 text-center font-mono text-slate-500">{o.qty} un</td>
                  <td className="p-3 text-right pr-4 font-mono">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(o.cash)}</td>
                  <td className="p-3 text-right pr-4 font-mono">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(o.multicaixa)}</td>
                  <td className="p-3 text-right pr-4 font-mono">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(o.transfer)}</td>
                  <td className="p-3 text-right pr-4 font-mono font-bold text-slate-900">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(o.revenue)}</td>
                  <td className="p-3 text-right pr-4 font-mono text-slate-600">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(o.ticketAvg)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                  Nenhum operador registou vendas no período selecionado.
                </td>
              </tr>
            )}
            {/* Grand Totals */}
            <tr className="bg-[#f0f7fc] font-black text-slate-900 border-t border-slate-300">
              <td className="p-3 pl-4 text-xs font-black uppercase">TOTAIS DE EQUIPA</td>
              <td className="p-3 text-center font-mono font-black">{grandTotals.count}</td>
              <td className="p-3 text-center font-mono font-black">{grandTotals.qty} un</td>
              <td className="p-3 text-right pr-4 font-mono font-black">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grandTotals.cash)}</td>
              <td className="p-3 text-right pr-4 font-mono font-black">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grandTotals.multicaixa)}</td>
              <td className="p-3 text-right pr-4 font-mono font-black">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grandTotals.transfer)}</td>
              <td className="p-3 text-right pr-4 font-mono font-black text-slate-950 bg-slate-50">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grandTotals.revenue)}</td>
              <td className="p-3 text-right pr-4 font-mono font-black text-slate-600">
                {grandTotals.count > 0 ? new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grandTotals.revenue / grandTotals.count) : '0,00'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 4. MAPA DO IVA
interface ReportMapaIvaProps {
  filteredInvoices: Invoice[];
  products: Product[];
  formatKz: (value: number) => string;
}
function ReportMapaIva({ filteredInvoices, products, formatKz }: ReportMapaIvaProps) {
  // VAT grouping
  let normalBase = 0;
  let normalTax = 0;
  let exemptBase = 0;

  // Group exemptions by reason/code
  const exemptionsMap: Record<string, { code: string, reason: string, base: number }> = {};

  filteredInvoices.forEach((inv) => {
    if (inv.status === 'ANULADO') return;
    const sign = inv.type === 'NC' ? -1 : 1;

    inv.items.forEach((item) => {
      const isExempt = item.taxRate === 0;
      const val = item.total * sign;

      if (!isExempt) {
        normalTax += item.taxAmount * sign;
        normalBase += (item.total - item.taxAmount) * sign;
      } else {
        exemptBase += val;
        // Attempt to extract exemption details from products
        const product = products.find(p => p.id === item.productId);
        const code = product?.exemptionCode || 'M00';
        const reason = product?.exemptionReason || 'Isento nos termos da lei em vigor';
        const key = `${code}-${reason}`;

        if (!exemptionsMap[key]) {
          exemptionsMap[key] = { code, reason, base: 0 };
        }
        exemptionsMap[key].base += val;
      }
    });
  });

  const exemptionsArray = Object.values(exemptionsMap);
  const totalBase = normalBase + exemptBase;
  const totalTax = normalTax;
  const totalWithTax = totalBase + totalTax;

  return (
    <div className="space-y-6">
      {/* Summary card highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Valor Tributável (Incidência 14%)</span>
          <span className="text-lg font-black text-slate-900 font-mono mt-1 block">{formatKz(normalBase)}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Total IVA Liquidado (14%)</span>
          <span className="text-lg font-black text-brand font-mono mt-1 block">{formatKz(normalTax)}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Isenções de IVA (0%)</span>
          <span className="text-lg font-black text-emerald-600 font-mono mt-1 block">{formatKz(exemptBase)}</span>
        </div>
      </div>

      {/* Main VAT breakdown table */}
      <div className="overflow-hidden border border-slate-200 rounded-lg text-xs bg-white shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0266b3] text-white text-[10px] font-bold uppercase tracking-wider">
              <th className="p-3 py-2.5 font-bold text-left pl-4">Código/Enquadramento</th>
              <th className="p-3 py-2.5 font-bold text-left">Motivo de Isenção Legal</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">Incidência / Base</th>
              <th className="p-3 py-2.5 font-bold text-center">Taxa %</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">IVA Liquidado</th>
            </tr>
          </thead>
          <tbody>
            {/* Taxable line */}
            <tr className="border-b border-slate-100 hover:bg-slate-50/40 text-slate-700">
              <td className="p-3 pl-4 font-bold text-slate-800">Regime Geral (Normal)</td>
              <td className="p-3 text-slate-500">Operações sujeitas à taxa geral de 14% de acordo com o CIVA</td>
              <td className="p-3 text-right pr-4 font-mono font-semibold text-slate-600">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(normalBase)}</td>
              <td className="p-3 text-center font-bold font-mono text-slate-700">14%</td>
              <td className="p-3 text-right pr-4 font-mono font-black text-slate-900">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(normalTax)}</td>
            </tr>

            {/* Exemption lines */}
            {exemptionsArray.length > 0 ? (
              exemptionsArray.map((ex, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/40 text-slate-600">
                  <td className="p-3 pl-4 font-mono font-bold text-emerald-600">{ex.code}</td>
                  <td className="p-3 text-slate-500 font-medium">{ex.reason}</td>
                  <td className="p-3 text-right pr-4 font-mono font-semibold text-slate-600">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(ex.base)}</td>
                  <td className="p-3 text-center font-bold font-mono text-emerald-600">ISENTO</td>
                  <td className="p-3 text-right pr-4 font-mono text-slate-400">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(0)}</td>
                </tr>
              ))
            ) : (
              exemptBase > 0 && (
                <tr className="border-b border-slate-100 text-slate-500">
                  <td className="p-3 pl-4 font-mono font-bold text-emerald-600">ISE</td>
                  <td className="p-3">Isenção Geral de IVA</td>
                  <td className="p-3 text-right pr-4 font-mono">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(exemptBase)}</td>
                  <td className="p-3 text-center font-bold font-mono text-emerald-600">ISENTO</td>
                  <td className="p-3 text-right pr-4 font-mono">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(0)}</td>
                </tr>
              )
            )}

            {/* Grand Totals */}
            <tr className="bg-[#f0f7fc] font-black text-slate-900 border-t border-slate-300">
              <td colSpan={2} className="p-3 pl-4 text-xs font-black uppercase">TOTAIS DE ENQUADRAMENTO FISCAL</td>
              <td className="p-3 text-right pr-4 font-mono font-black">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalBase)}</td>
              <td className="p-3 text-center font-mono font-black">14% / 0%</td>
              <td className="p-3 text-right pr-4 font-mono font-black text-slate-950">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalTax)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* AGT Informative Footer Note */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[10px] text-slate-400 space-y-1">
        <p className="font-bold uppercase text-slate-500 tracking-wider">Nota Informativa Fiscal:</p>
        <p>Este mapa foi gerado em conformidade com as regras de preenchimento do ficheiro SAF-T (AO) e respetivas obrigações de reporte de IVA perante a Administração Geral Tributária (AGT) de Angola.</p>
      </div>
    </div>
  );
}

// 5. IMPOSTO DE SELO
interface ReportImpostoSeloProps {
  filteredInvoices: Invoice[];
  formatKz: (value: number) => string;
}
function ReportImpostoSelo({ filteredInvoices, formatKz }: ReportImpostoSeloProps) {
  // In Angola, Stamp Duty is calculated at 1% on receipts/cash operations or similar transactions
  const stampDutyRate = 0.01; // 1%

  // Filter invoices representing payments or cash sales (FR are immediate payments, FT with RC represents cash payment, or general payment methods = Cash / Multicaixa)
  const qualifiedDocs = filteredInvoices.filter(inv => {
    if (inv.status === 'ANULADO') return false;
    // FR and Receipts represent immediate liquid cash received.
    return inv.type === 'FR' || inv.type === 'RC' || (inv.type === 'FT' && inv.paymentMethod === 'Numerário');
  });

  const docsArray = qualifiedDocs.map(inv => {
    const base = inv.total;
    const sign = inv.type === 'NC' ? -1 : 1;
    const duty = base * stampDutyRate * sign;
    return {
      date: inv.date.slice(0, 10),
      docNo: inv.invoiceNo,
      customer: inv.customer?.name || 'Cliente Geral',
      method: inv.paymentMethod,
      total: inv.total * sign,
      base: base * sign,
      duty
    };
  });

  const grandTotals = docsArray.reduce((acc, curr) => ({
    total: acc.total + curr.total,
    base: acc.base + curr.base,
    duty: acc.duty + curr.duty
  }), { total: 0, base: 0, duty: 0 });

  return (
    <div className="space-y-6">
      {/* Highlighting Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Volume Sujeito a Selo</span>
          <span className="text-lg font-black text-slate-900 font-mono mt-1 block">{formatKz(grandTotals.base)}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Total Imposto de Selo (1.0%)</span>
          <span className="text-lg font-black text-brand font-mono mt-1 block">{formatKz(grandTotals.duty)}</span>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Documentos Cobertos</span>
          <span className="text-lg font-black text-slate-900 font-mono mt-1 block">{docsArray.length} recibos/pagamentos</span>
        </div>
      </div>

      {/* Documents breakdown table */}
      <div className="overflow-hidden border border-slate-200 rounded-lg text-xs bg-white shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0266b3] text-white text-[10px] font-bold uppercase tracking-wider">
              <th className="p-3 py-2.5 font-bold text-left pl-4">Data</th>
              <th className="p-3 py-2.5 font-bold text-left">N.º Documento</th>
              <th className="p-3 py-2.5 font-bold text-left">Cliente</th>
              <th className="p-3 py-2.5 font-bold text-center">Método Pagamento</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">Total Documento</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">Incidência (Selo)</th>
              <th className="p-3 py-2.5 font-bold text-right pr-4">Imposto Liquidado (1%)</th>
            </tr>
          </thead>
          <tbody>
            {docsArray.length > 0 ? (
              docsArray.map((d, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/40 text-slate-700">
                  <td className="p-3 pl-4 font-mono">{d.date.split('-').reverse().join('/')}</td>
                  <td className="p-3 font-bold text-slate-800">{d.docNo}</td>
                  <td className="p-3 font-medium text-slate-700">{d.customer}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-semibold uppercase">
                      {d.method}
                    </span>
                  </td>
                  <td className="p-3 text-right pr-4 font-mono">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(d.total)}</td>
                  <td className="p-3 text-right pr-4 font-mono">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(d.base)}</td>
                  <td className="p-3 text-right pr-4 font-mono font-bold text-brand">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(d.duty)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                  Sem recebimentos ou vendas em dinheiro sujeitas a Imposto de Selo neste período.
                </td>
              </tr>
            )}
            {/* Grand Totals */}
            <tr className="bg-[#f0f7fc] font-black text-slate-900 border-t border-slate-300">
              <td colSpan={4} className="p-3 pl-4 text-xs font-black uppercase">TOTAIS DE IMPOSTO DE SELO</td>
              <td className="p-3 text-right pr-4 font-mono font-black">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grandTotals.total)}</td>
              <td className="p-3 text-right pr-4 font-mono font-black">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grandTotals.base)}</td>
              <td className="p-3 text-right pr-4 font-mono font-black text-[#0266b3] bg-brand-light/10">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grandTotals.duty)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 6. CONTA CORRENTE (CUSTOMER LEDGER)
interface ReportContaCorrenteProps {
  invoices: Invoice[];
  customers: Customer[];
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  formatKz: (value: number) => string;
  startDate: string;
  endDate: string;
}
function ReportContaCorrente({ 
  invoices, 
  customers, 
  selectedCustomerId, 
  setSelectedCustomerId, 
  formatKz,
  startDate,
  endDate
}: ReportContaCorrenteProps) {
  
  // Set default customer if none selected
  useEffect(() => {
    if (!selectedCustomerId && customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId, setSelectedCustomerId]);

  const activeCustomer = customers.find(c => c.id === selectedCustomerId);

  // Ledger transactions computation for the selected customer
  let totalDebit = 0;
  let totalCredit = 0;
  
  const ledgerEntries = invoices
    .filter(inv => inv.customer?.id === selectedCustomerId && inv.status !== 'ANULADO')
    .map(inv => {
      let debit = 0;
      let credit = 0;

      // Logic:
      // Invoices (FT, FR) raise debt (Debit). 
      // FR (Fatura-Recibo) is paid instantly, so it is both a Debit and Credit.
      // Recibos (RC) clear debt (Credit).
      // Credit Notes (NC) lower debt (Credit).
      if (inv.type === 'FT') {
        debit = inv.total;
      } else if (inv.type === 'FR') {
        debit = inv.total;
        credit = inv.total;
      } else if (inv.type === 'RC') {
        credit = inv.total;
      } else if (inv.type === 'NC') {
        credit = inv.total;
      }

      totalDebit += debit;
      totalCredit += credit;

      return {
        date: inv.date.slice(0, 10),
        docNo: inv.invoiceNo,
        type: inv.type,
        debit,
        credit,
        runningBalance: 0 // Will calculate sequentially
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date)); // Chronological order

  // Calculating running cumulative balance sequentially
  let running = 0;
  ledgerEntries.forEach(entry => {
    running += (entry.debit - entry.credit);
    entry.runningBalance = running;
  });

  // Filter chronologically for the selected date range for table view
  const filteredLedgerEntries = ledgerEntries.filter(entry => entry.date >= startDate && entry.date <= endDate);

  const outstandingBalance = totalDebit - totalCredit;

  return (
    <div className="space-y-6">
      {/* Customer selector (Not printed in PDF thanks to CSS hidden or selector layout) */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div className="space-y-1 w-full sm:w-auto">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Selecionar Cliente</label>
          <select 
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full sm:w-[320px] py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand/30 transition"
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} (NIF: {c.nif})</option>
            ))}
          </select>
        </div>

        {activeCustomer && (
          <div className="text-left sm:text-right text-xs">
            <p className="font-bold text-slate-800">Ficha de Cliente:</p>
            <p className="text-slate-500">NIF: <span className="font-mono font-bold text-slate-700">{activeCustomer.nif}</span></p>
            {activeCustomer.email && <p className="text-slate-500">E-mail: {activeCustomer.email}</p>}
          </div>
        )}
      </div>

      {activeCustomer ? (
        <>
          {/* Summary ledger boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Total Faturado (Débito)</span>
              <span className="text-lg font-black text-slate-900 font-mono mt-1 block">{formatKz(totalDebit)}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Total Liquidado (Crédito)</span>
              <span className="text-lg font-black text-emerald-600 font-mono mt-1 block">{formatKz(totalCredit)}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Saldo em Dívida (Outstanding)</span>
              <span className={`text-lg font-black font-mono mt-1 block ${outstandingBalance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {formatKz(outstandingBalance)}
              </span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-hidden border border-slate-200 rounded-lg text-xs bg-white shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0266b3] text-white text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-3 py-2.5 font-bold text-left pl-4">Data</th>
                  <th className="p-3 py-2.5 font-bold text-left">Documento / Código</th>
                  <th className="p-3 py-2.5 font-bold text-center">Tipo</th>
                  <th className="p-3 py-2.5 font-bold text-right pr-4">Débito (Faturado)</th>
                  <th className="p-3 py-2.5 font-bold text-right pr-4">Crédito (Recebido)</th>
                  <th className="p-3 py-2.5 font-bold text-right pr-4">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedgerEntries.length > 0 ? (
                  filteredLedgerEntries.map((e, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/40 text-slate-700">
                      <td className="p-3 pl-4 font-mono">{e.date.split('-').reverse().join('/')}</td>
                      <td className="p-3 font-bold text-slate-800">{e.docNo}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          e.type === 'FT' ? 'bg-amber-50 text-amber-700' :
                          e.type === 'FR' ? 'bg-emerald-50 text-emerald-700' :
                          e.type === 'RC' ? 'bg-sky-50 text-sky-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {e.type}
                        </span>
                      </td>
                      <td className="p-3 text-right pr-4 font-mono">
                        {e.debit > 0 ? new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(e.debit) : '-'}
                      </td>
                      <td className="p-3 text-right pr-4 font-mono">
                        {e.credit > 0 ? new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(e.credit) : '-'}
                      </td>
                      <td className={`p-3 text-right pr-4 font-mono font-bold ${e.runningBalance > 0 ? 'text-red-500' : 'text-slate-800'}`}>
                        {new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(e.runningBalance)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                      Sem movimentos de conta corrente registados para este período.
                    </td>
                  </tr>
                )}
                {/* Grand totals */}
                <tr className="bg-[#f0f7fc] font-black text-slate-900 border-t border-slate-300">
                  <td colSpan={3} className="p-3 pl-4 text-xs font-black uppercase">TOTAIS DE CONTA CORRENTE</td>
                  <td className="p-3 text-right pr-4 font-mono font-black text-red-500">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalDebit)}</td>
                  <td className="p-3 text-right pr-4 font-mono font-black text-emerald-600">{new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalCredit)}</td>
                  <td className={`p-3 text-right pr-4 font-mono font-black bg-[#f0f7fc] ${outstandingBalance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(outstandingBalance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="p-12 text-center text-slate-400 font-bold border border-slate-200 rounded-3xl">
          Nenhum cliente registado no sistema para gerar extrato de conta corrente.
        </div>
      )}
    </div>
  );
}
