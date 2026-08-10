/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  Layers, 
  Users, 
  DollarSign, 
  FileText, 
  Boxes, 
  ShieldCheck, 
  Activity, 
  PlusCircle, 
  ArrowRight, 
  AlertTriangle,
  Play,
  Moon,
  Sun,
  UserCheck
} from 'lucide-react';
import { Product, Customer, Invoice, KeysConfig, CompanyConfig, AppUser } from '../types';

interface DashboardProps {
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  keys: KeysConfig;
  company: CompanyConfig;
  currentUser?: AppUser;
  onNavigate: (tab: string) => void;
  onOpenQuickCustomer: () => void;
}

export default function Dashboard({
  products,
  customers,
  invoices,
  keys,
  company,
  currentUser,
  onNavigate,
  onOpenQuickCustomer
}: DashboardProps) {
  // Calculate stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentYearStr = new Date().getFullYear().toString();
  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  const todayInvoices = invoices.filter(inv => inv.date === todayStr);
  
  const salesToday = todayInvoices.reduce((sum, inv) => sum + inv.total, 0);

  // Filter invoices for current month, fallback to all invoices if none match current month in dev mode
  let monthlyInvoices = invoices.filter(inv => inv.date.startsWith(currentMonthPrefix));
  if (monthlyInvoices.length === 0) {
    monthlyInvoices = invoices;
  }
  const salesMonth = monthlyInvoices.reduce((sum, inv) => sum + inv.total, 0);

  // Filter invoices for current year, fallback to all invoices if none match current year
  let yearlyInvoices = invoices.filter(inv => inv.date.startsWith(currentYearStr));
  if (yearlyInvoices.length === 0) {
    yearlyInvoices = invoices;
  }
  const salesYear = yearlyInvoices.reduce((sum, inv) => sum + inv.total, 0);

  const totalInvoicesCount = invoices.length;
  const customersCount = customers.length;
  const activeProductsCount = products.length;
  
  const stockValue = products.reduce((sum, prod) => sum + (prod.stock * prod.price), 0);
  const stockCritical = products.filter(prod => prod.stock <= prod.minStock);

  // Payments breakdown
  const numerarioTotal = invoices
    .filter(inv => inv.paymentMethod === 'Numerário')
    .reduce((sum, inv) => sum + inv.total, 0);
  
  const multicaixaTotal = invoices
    .filter(inv => inv.paymentMethod === 'Multicaixa')
    .reduce((sum, inv) => sum + inv.total, 0);
  
  const OutrosTotal = invoices
    .filter(inv => inv.paymentMethod === 'Transferência' || inv.paymentMethod === 'Misto')
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalIva = invoices.reduce((sum, inv) => sum + inv.taxTotal, 0);

  // Active shift & real-time shift metrics calculation
  const activeShiftStr = typeof window !== 'undefined' ? localStorage.getItem('vm_active_shift') : null;
  let activeShiftObj: { isOpen?: boolean; openedAt?: string; operator?: string } | null = null;
  if (activeShiftStr) {
    try { activeShiftObj = JSON.parse(activeShiftStr); } catch {}
  }

  // Filter invoices for current shift or today's active session
  const shiftInvoices = invoices.filter(inv => {
    if (inv.status === 'ANULADO') return false;
    if (activeShiftObj?.isOpen && activeShiftObj?.openedAt) {
      const shiftDateStr = activeShiftObj.openedAt.split(',')[0];
      return inv.date === todayStr || inv.date.includes(shiftDateStr);
    }
    return inv.date === todayStr;
  });

  const shiftSalesTotal = shiftInvoices.reduce((sum, inv) => sum + (inv.type === 'NC' ? -inv.total : inv.total), 0);
  const shiftMulticaixaTotal = shiftInvoices
    .filter(inv => inv.paymentMethod === 'Multicaixa')
    .reduce((sum, inv) => sum + (inv.type === 'NC' ? -inv.total : inv.total), 0);
  const shiftNumerarioTotal = shiftInvoices
    .filter(inv => inv.paymentMethod === 'Numerário')
    .reduce((sum, inv) => sum + (inv.type === 'NC' ? -inv.total : inv.total), 0);
  const shiftIvaTotal = shiftInvoices.reduce((sum, inv) => sum + (inv.type === 'NC' ? -inv.taxTotal : inv.taxTotal), 0);

  // Format currency
  const formatKz = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' })
      .format(value)
      .replace('Kz', '')
      .trim() + ' Kz';
  };

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900" id="dash-title">Dashboard de Gestão</h1>
          <p className="text-sm text-gray-500">Visão analítica e conformidade fiscal do sistema VENDA MAIS</p>
        </div>
        <div className="flex items-center gap-3">
          {company.invoicingMode === 'electronic' ? (
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Modo Faturação: ELETRÓNICA (Tempo Real)
            </span>
          ) : (
            <span className="px-3 py-1 bg-brand-light text-brand border border-brand-light rounded-full text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand"></span>
              Modo Faturação: SAF-T (Assinatura Local)
            </span>
          )}
          <span className="text-xs text-gray-500 font-mono">
            {new Date().toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>
      
      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="metrics-grid">
        
        {/* Sales Today - col-span-4 */}
        <div className="col-span-12 md:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
            <span className="p-3 bg-brand-light text-brand rounded-2xl group-hover:bg-brand-light/80 transition-colors">
              <TrendingUp className="w-6 h-6" />
            </span>
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-500 font-bold uppercase tracking-wider">Hoje</span>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Vendas Hoje</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{formatKz(salesToday)}</p>
          </div>
        </div>

        {/* Faturamento Mensal - col-span-4 - Beautiful dark card with narrow sparkline */}
        <div className="col-span-12 md:col-span-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between group hover:shadow-2xl transition-all duration-300 border border-slate-800">
          <div className="absolute right-0 top-0 opacity-10 translate-x-6 -translate-y-6">
            <Activity className="w-44 h-44 text-brand" />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="p-3 bg-brand/20 text-brand rounded-2xl group-hover:bg-brand/30 transition-colors">
              <Activity className="w-6 h-6 text-brand-light" />
            </span>
            <span className="text-[10px] bg-brand/20 text-brand-light px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">Mês</span>
          </div>
          <div className="relative z-10">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Faturamento Mensal</p>
            <p className="text-2xl font-black text-white mt-1">{formatKz(salesMonth)}</p>
            
            {/* Extremely narrow sparkline (narrow peaks) */}
            <div className="flex gap-1.5 h-6 items-end mt-4">
              <div className="w-1.5 bg-white/10 rounded-full h-[40%] hover:bg-brand transition-all duration-200" title="S1"></div>
              <div className="w-1.5 bg-white/10 rounded-full h-[60%] hover:bg-brand transition-all duration-200" title="S2"></div>
              <div className="w-1.5 bg-brand/60 rounded-full h-[80%] hover:bg-brand transition-all duration-200" title="S3"></div>
              <div className="w-1.5 bg-brand rounded-full h-[95%] hover:bg-brand-dark transition-all duration-200" title="Hoje"></div>
            </div>
          </div>
        </div>

        {/* Faturamento Anual - col-span-4 - Premium dark card with narrow sparkline */}
        <div className="col-span-12 md:col-span-4 bg-slate-950 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between group hover:shadow-2xl transition-all duration-300 border border-slate-800">
          <div className="absolute right-0 top-0 opacity-10 translate-x-6 -translate-y-6">
            <DollarSign className="w-44 h-44 text-emerald-500" />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="p-3 bg-emerald-500/15 text-emerald-400 rounded-2xl group-hover:bg-emerald-500/25 transition-colors">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </span>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">Ano</span>
          </div>
          <div className="relative z-10">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Faturamento Anual</p>
            <p className="text-2xl font-black text-white mt-1">{formatKz(salesYear)}</p>
            
            {/* Extremely narrow sparkline (narrow peaks) */}
            <div className="flex gap-1.5 h-6 items-end mt-4">
              <div className="w-1.5 bg-white/10 rounded-full h-[30%] hover:bg-emerald-500 transition-all duration-200" title="Q1"></div>
              <div className="w-1.5 bg-white/10 rounded-full h-[50%] hover:bg-emerald-500 transition-all duration-200" title="Q2"></div>
              <div className="w-1.5 bg-emerald-500/50 rounded-full h-[70%] hover:bg-emerald-500 transition-all duration-200" title="Q3"></div>
              <div className="w-1.5 bg-emerald-500 rounded-full h-[95%] hover:bg-emerald-600 transition-all duration-200" title="Q4"></div>
            </div>
          </div>
        </div>

        {/* Faturas Emitidas - col-span-3 */}
        <div className="col-span-6 md:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Faturas Emitidas</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{totalInvoicesCount}</p>
          </div>
        </div>

        {/* Base de Clientes - col-span-3 */}
        <div className="col-span-6 md:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2.5 bg-zinc-50 text-zinc-600 rounded-xl group-hover:bg-zinc-100 transition-colors">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Base de Clientes</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{customersCount}</p>
          </div>
        </div>

        {/* Produtos Ativos - col-span-3 */}
        <div className="col-span-6 md:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2.5 bg-sky-50 text-sky-600 rounded-xl group-hover:bg-sky-100 transition-colors">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Produtos Ativos</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{activeProductsCount}</p>
          </div>
        </div>

        {/* Valor em Stock - col-span-3 */}
        <div className="col-span-6 md:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-2">
            <span className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl group-hover:bg-yellow-100 transition-colors">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Valor em Stock</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{formatKz(stockValue)}</p>
          </div>
        </div>

      </div>

      {/* Realtime Shift and Cash Register Summary */}
      <div className="bg-brand text-white rounded-2xl p-4 relative overflow-hidden shadow-md border border-white/20" id="shift-summary">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-8 translate-y-8">
          <Activity className="w-48 h-48" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeShiftObj?.isOpen ? 'bg-emerald-300 animate-ping' : 'bg-slate-300'}`}></span>
              <h2 className="text-base font-bold">Resumo em Tempo Real do Turno</h2>
              {activeShiftObj?.isOpen ? (
                <span className="text-[10px] bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                  Turno Aberto
                </span>
              ) : (
                <span className="text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full font-medium">
                  Turno Fechado
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/90 font-mono bg-white/20 px-2.5 py-0.5 rounded-full border border-white/10 font-bold">
              Operador: {currentUser?.name || currentUser?.username || activeShiftObj?.operator || 'Operador'}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-white/20 pt-3">
            <div>
              <p className="text-[11px] text-white/80">Total Bruto (Turno)</p>
              <p className="text-lg font-black mt-0.5">{formatKz(shiftSalesTotal)}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/80">Multicaixa</p>
              <p className="text-lg font-black mt-0.5">{formatKz(shiftMulticaixaTotal)}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/80">Numerário</p>
              <p className="text-lg font-black mt-0.5">{formatKz(shiftNumerarioTotal)}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/80">Total IVA (14%)</p>
              <p className="text-lg font-black mt-0.5">{formatKz(shiftIvaTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action & AGT Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="actions-and-compliance">
        
        {/* Quick Buttons - Spans 7 cols */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              id="btn-quick-pos"
              onClick={() => onNavigate('pos')}
              className="flex flex-col items-center justify-center p-6 bg-white hover:bg-brand-light/50 hover:text-brand hover:border-brand-light text-slate-700 border border-slate-200 rounded-3xl transition-all duration-300 text-center group shadow-xs hover:shadow-md"
            >
              <PlusCircle className="w-8 h-8 mb-2 text-brand group-hover:scale-110 transition duration-300" />
              <span className="font-bold text-sm text-slate-800 group-hover:text-brand-dark">Fatura Recibo</span>
              <span className="text-[11px] text-slate-400 mt-1">Lançar nova venda (POS)</span>
            </button>

            <button 
              id="btn-quick-cust"
              onClick={onOpenQuickCustomer}
              className="flex flex-col items-center justify-center p-6 bg-white hover:bg-purple-50/50 hover:text-purple-600 hover:border-purple-200 text-slate-700 border border-slate-200 rounded-3xl transition-all duration-300 text-center group shadow-xs hover:shadow-md"
            >
              <UserCheck className="w-8 h-8 mb-2 text-purple-600 group-hover:scale-110 transition duration-300" />
              <span className="font-bold text-sm text-slate-800 group-hover:text-purple-700">Novo Cliente</span>
              <span className="text-[11px] text-slate-400 mt-1">Registrar NIF de cliente</span>
            </button>

            <button 
              id="btn-quick-prod"
              onClick={() => onNavigate('products')}
              className="flex flex-col items-center justify-center p-6 bg-white hover:bg-amber-50/50 hover:text-amber-600 hover:border-amber-200 text-slate-700 border border-slate-200 rounded-3xl transition-all duration-300 text-center group shadow-xs hover:shadow-md"
            >
              <Boxes className="w-8 h-8 mb-2 text-amber-500 group-hover:scale-110 transition duration-300" />
              <span className="font-bold text-sm text-slate-800 group-hover:text-amber-700">Entrada de Stock</span>
              <span className="text-[11px] text-slate-400 mt-1">Cadastrar e ajustar artigos</span>
            </button>

            <button 
              id="btn-quick-saft"
              onClick={() => onNavigate('saft')}
              className="flex flex-col items-center justify-center p-6 bg-white hover:bg-emerald-50/50 hover:text-emerald-600 hover:border-emerald-200 text-slate-700 border border-slate-200 rounded-3xl transition-all duration-300 text-center group shadow-xs hover:shadow-md"
            >
              <ShieldCheck className="w-8 h-8 mb-2 text-emerald-500 group-hover:scale-110 transition duration-300" />
              <span className="font-bold text-sm text-slate-800 group-hover:text-emerald-700">Gerar SAF-T</span>
              <span className="text-[11px] text-slate-400 mt-1">Exportar XML para AGT</span>
            </button>
          </div>
        </div>

        {/* AGT Center Card - Spans 5 cols - STUNNING DARK CARD matching the bento template */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-6 rounded-3xl border border-slate-850 shadow-xl flex flex-col justify-between space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-white/5 border border-white/10 text-brand-light rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-white text-base">Integração AGT</h3>
                <p className="text-[11px] text-slate-400">Diagnóstico e conformidade do software</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[10px] bg-emerald-500/10 text-emerald-400 font-bold rounded-full border border-emerald-500/20 uppercase tracking-widest">
              Conectado
            </span>
          </div>

          <div className="space-y-3 flex-1 py-1">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Chave Ativa (RSA PEM)</p>
              <p className="text-xs font-mono truncate text-brand-light">
                {keys.status === 'Ativa' ? 'agt_pub_2026_9482...8291' : 'Chave Padrão Ativa de Teste'}
              </p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Estado da Licença</p>
                <p className="text-xs text-slate-200 mt-0.5 font-medium">Software Certificado nº {keys.certId}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-brand/20 text-brand-light rounded-full font-bold">V1.01_AO</span>
            </div>
          </div>

          <button 
            id="btn-agt-diag"
            onClick={() => onNavigate('saft')}
            className="w-full py-3 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg"
          >
            Validar Assinatura AGT
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition duration-150" />
          </button>
        </div>
      </div>

      {/* Analytics Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="charts-and-visuals">
        
        {/* Billing performance graph - Spans 7 cols */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Performance de Faturamento</h3>
            <p className="text-xs text-slate-500 mb-6">Volume diário de faturamento simulado nos últimos 7 dias</p>
          </div>
          
          <div className="h-44 w-full flex items-end justify-between relative pt-6" id="billing-chart">
            {/* Draw Simulated Line with SVG */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand, #0891b2)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--color-brand, #0891b2)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1="0" y1="20" x2="100%" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="65" x2="100%" y2="65" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="110" x2="100%" y2="110" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              
              {/* Path line */}
              <path 
                d="M 10 110 Q 80 90 150 120 T 300 40 T 450 60 T 600 30" 
                fill="none" 
                stroke="var(--color-brand, #0891b2)" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
              />
              {/* Fill Area */}
              <path 
                d="M 10 110 Q 80 90 150 120 T 300 40 T 450 60 T 600 30 L 600 150 L 10 150 Z" 
                fill="url(#chartGrad)" 
              />
              
              {/* Active Dot */}
              <circle cx="600" cy="30" r="3.5" fill="var(--color-brand, #0891b2)" stroke="#ffffff" strokeWidth="1.5" />
            </svg>
            
            <div className="absolute right-4 top-0 bg-brand text-white text-[10px] px-2.5 py-1 rounded-md font-mono font-bold shadow-xs">
              {formatKz(salesMonth)} Mês
            </div>
          </div>
          
          <div className="flex justify-between text-slate-400 text-[10px] font-mono mt-4 border-t border-slate-100 pt-3">
            <span>D-6</span>
            <span>D-5</span>
            <span>D-4</span>
            <span>D-3</span>
            <span>D-2</span>
            <span>Ontem</span>
            <span className="text-brand font-bold">Hoje</span>
          </div>
        </div>

        {/* Payment Methods Breakdowns - Spans 5 cols */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-1">Meios de Pagamento</h3>
            <p className="text-xs text-slate-500 mb-6">Distribuição por preferência de liquidação financeira</p>
          </div>
          
          <div className="space-y-4 py-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Numerário
                </span>
                <span className="text-slate-800 font-bold">{formatKz(numerarioTotal)}</span>
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${salesMonth > 0 ? (numerarioTotal / salesMonth) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand"></span> Multicaixa (Débito)
                </span>
                <span className="text-slate-800 font-bold">{formatKz(multicaixaTotal)}</span>
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-brand h-full transition-all duration-500" 
                  style={{ width: `${salesMonth > 0 ? (multicaixaTotal / salesMonth) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Transferência / Outros
                </span>
                <span className="text-slate-800 font-bold">{formatKz(OutrosTotal)}</span>
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-500 h-full transition-all duration-500" 
                  style={{ width: `${salesMonth > 0 ? (OutrosTotal / salesMonth) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <p className="text-[9px] text-slate-400 mt-4 text-center border-t border-slate-50 pt-2 leading-relaxed">
            Meios sincronizados no SAF-T (AO) para fins de fiscalização fiscal periódica.
          </p>
        </div>
      </div>

      {/* Leaderboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="leaderboards-grid">
        
        {/* Most sold */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-3">Artigos Mais Vendidos</h4>
            {products.slice(0, 3).length > 0 ? (
              <div className="divide-y divide-slate-100">
                {products.slice(0, 3).map((prod, idx) => (
                  <div key={prod.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400">0{idx + 1}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-900 line-clamp-1">{prod.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{prod.code}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-800 font-mono">{formatKz(prod.price)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">Sem dados de artigos.</p>
            )}
          </div>
        </div>

        {/* Top sellers */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-3">Top Operadores / Caixas</h4>
            <div className="divide-y divide-slate-100">
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-brand-light text-brand text-[10px] font-bold flex items-center justify-center">
                    OP
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Operador Geral</p>
                    <p className="text-[10px] text-slate-400 font-mono">{invoices.length} documentos emitidos</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-800 font-mono">{formatKz(salesMonth)}</span>
              </div>
              <div className="py-3 flex items-center justify-between opacity-50">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                    C2
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Caixa 2 (Fechado)</p>
                    <p className="text-[10px] text-slate-400 font-mono">0 documentos</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-800 font-mono">0,00 Kz</span>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Stock */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-3">Stock Crítico</h4>
            {stockCritical.length > 0 ? (
              <div className="space-y-2">
                {stockCritical.slice(0, 3).map((prod) => (
                  <div key={prod.id} className="p-2.5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-rose-900 truncate">{prod.name}</p>
                      <p className="text-[10px] text-rose-500 font-mono">Qtd: {prod.stock} {prod.unit}</p>
                    </div>
                    <span className="p-1 bg-rose-600 text-white rounded-xl text-[9px] font-bold flex-shrink-0">
                      AJUSTAR
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold">
                  Nível de Stock Saudável
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Latest activities log */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" id="activities-panel">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Últimas Atividades</h3>
            <p className="text-xs text-slate-400">Registro recente de transações no sistema</p>
          </div>
          <button 
            id="btn-all-invoices"
            onClick={() => onNavigate('invoices')}
            className="text-xs text-brand font-bold hover:underline flex items-center gap-1"
          >
            Ver Histórico Completo
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4 px-6">Código / Série</th>
                  <th className="p-4 px-6">Cliente Beneficiário</th>
                  <th className="p-4 px-6">Data / Hora</th>
                  <th className="p-4 px-6 text-right">Montante Final</th>
                  <th className="p-4 px-6 text-center">Protocolo AGT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {invoices.slice(-5).reverse().map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 px-6 font-mono font-bold text-slate-900">
                      <span className="px-2 py-0.5 bg-brand-light text-brand rounded mr-2 text-[10px] font-black">
                        {inv.type}
                      </span>
                      {inv.invoiceNo}
                    </td>
                    <td className="p-4 px-6">
                      <p className="font-bold text-slate-800">{inv.customer.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">NIF: {inv.customer.nif}</p>
                    </td>
                    <td className="p-4 px-6 text-slate-500 font-mono">
                      {inv.date} 12:00
                    </td>
                    <td className="p-4 px-6 text-right font-bold text-slate-900 font-mono">
                      {formatKz(inv.total)}
                    </td>
                    <td className="p-4 px-6 text-center">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
                        EMITIDO
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <p className="font-medium text-sm">Sem faturas emitidas neste período</p>
            <p className="text-xs text-slate-400 mt-1">Abra o Fatura Recibo no painel acima para registrar vendas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
