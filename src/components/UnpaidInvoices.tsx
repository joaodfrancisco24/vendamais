/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Clock, 
  AlertCircle, 
  Calendar, 
  ArrowRight,
  Filter,
  Users,
  CheckCircle,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { Invoice, CompanyConfig, Customer } from '../types';

interface UnpaidInvoicesProps {
  invoices: Invoice[];
  customers: Customer[];
  company: CompanyConfig;
  onViewInvoice: (invoiceNo: string) => void;
  onSettleInvoice: (invoice: Invoice) => void;
}

export default function UnpaidInvoices({
  invoices,
  customers,
  company,
  onViewInvoice,
  onSettleInvoice
}: UnpaidInvoicesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CURRENT' | 'OVERDUE'>('ALL');

  // Format currency helper matching app style
  const formatKz = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    })
      .format(value)
      .replace('AOA', '')
      .trim() + ' Kz';
  };

  // Helper to calculate days difference
  const getDaysDifference = (d1: Date, d2: Date) => {
    const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
    return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
  };

  // Process all unpaid invoices (FT)
  const unpaidInvoicesData = useMemo(() => {
    const receiptsList = invoices.filter(inv => inv.type === 'RC' && inv.status === 'EMITIDO');
    
    // Get all FT invoices that are EMITIDO and not credited by an NC
    const activeFts = invoices.filter(
      inv => inv.type === 'FT' && 
             inv.status === 'EMITIDO' &&
             !invoices.some(i => i.type === 'NC' && i.rectifiedInvoiceNo === inv.invoiceNo)
    );

    const today = new Date();

    return activeFts.map(ft => {
      // Calculate total payments made via RC
      let paidAmount = 0;
      receiptsList.forEach(rc => {
        rc.items.forEach(line => {
          if (line.productCode === ft.invoiceNo) {
            paidAmount += line.total;
          }
        });
      });

      const unpaidBalance = Math.max(0, ft.total - paidAmount);
      
      // Calculate due date (30 days from emission date)
      const emissionDate = new Date(ft.date);
      const dueDate = new Date(emissionDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const daysPassed = getDaysDifference(emissionDate, today);
      const isOverdue = daysPassed > 30;
      const daysOverdue = isOverdue ? daysPassed - 30 : 0;
      const daysRemaining = !isOverdue ? 30 - daysPassed : 0;

      return {
        invoice: ft,
        paidAmount,
        unpaidBalance,
        dueDate,
        isOverdue,
        daysOverdue,
        daysRemaining
      };
    }).filter(item => item.unpaidBalance > 0);
  }, [invoices]);

  // Statistics calculation
  const stats = useMemo(() => {
    let totalUnpaid = 0;
    let currentDebt = 0;
    let overdueDebt = 0;

    unpaidInvoicesData.forEach(item => {
      totalUnpaid += item.unpaidBalance;
      if (item.isOverdue) {
        overdueDebt += item.unpaidBalance;
      } else {
        currentDebt += item.unpaidBalance;
      }
    });

    return {
      totalUnpaid,
      currentDebt,
      overdueDebt,
      totalCount: unpaidInvoicesData.length,
      currentCount: unpaidInvoicesData.filter(i => !i.isOverdue).length,
      overdueCount: unpaidInvoicesData.filter(i => i.isOverdue).length,
    };
  }, [unpaidInvoicesData]);

  // Filter and Search list
  const filteredInvoices = useMemo(() => {
    return unpaidInvoicesData.filter(item => {
      const ft = item.invoice;
      const matchesSearch = 
        ft.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ft.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ft.customer?.nif || '').includes(searchTerm);

      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'CURRENT' && !item.isOverdue) ||
        (statusFilter === 'OVERDUE' && item.isOverdue);

      return matchesSearch && matchesStatus;
    });
  }, [unpaidInvoicesData, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            FATURA POR LIQUIDAR
          </h2>
          <p className="text-xs text-slate-500">
            Acompanhamento e gestão de faturas emitidas com saldos pendentes ou em atraso.
          </p>
        </div>
      </div>

      {/* Top Cards for Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: VALOR TOTAL */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                VALOR TOTAL
              </span>
              <p className="text-[10px] text-slate-500 font-medium">
                Valor que o cliente não pagou
              </p>
            </div>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-500">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight block">
              {formatKz(stats.totalUnpaid)}
            </span>
          </div>
        </div>

        {/* Card 2: DÍVIDA CORRENTE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                DÍVIDA CORRENTE
              </span>
              <p className="text-[10px] text-slate-500 font-medium">
                Valor a receber dentro do prazo
              </p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight block">
              {formatKz(stats.currentDebt)}
            </span>
          </div>
        </div>

        {/* Card 3: DÍVIDA VENCIDA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-[120px]">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                DÍVIDA VENCIDA
              </span>
              <p className="text-[10px] text-slate-500 font-medium">
                Valor que já deveria ter sido pago
              </p>
            </div>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight block">
              {formatKz(stats.overdueDebt)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Controls Bar (Search + Tabs) */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4 justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por NIF, cliente ou fatura..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          <div className="flex gap-1 bg-slate-200/50 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              TODAS ({stats.totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('CURRENT')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                statusFilter === 'CURRENT'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              CORRENTES ({stats.currentCount})
            </button>
            <button
              onClick={() => setStatusFilter('OVERDUE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                statusFilter === 'OVERDUE'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              VENCIDAS ({stats.overdueCount})
            </button>
          </div>
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">
                Nenhuma fatura por liquidar encontrada
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Todas as faturas estão liquidadas ou não correspondem ao filtro selecionado.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-4">Nº FATURA</th>
                  <th className="p-4">CLIENTE</th>
                  <th className="p-4">DATA EMISSÃO</th>
                  <th className="p-4">VENCIMENTO</th>
                  <th className="p-4">ESTADO / PRAZO</th>
                  <th className="p-4 text-right">VALOR TOTAL</th>
                  <th className="p-4 text-right">VALOR PAGO</th>
                  <th className="p-4 text-right">SALDO EM DÍVIDA</th>
                  <th className="p-4 text-center">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredInvoices.map((item) => {
                  const ft = item.invoice;
                  return (
                    <tr 
                      key={ft.id} 
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {ft.invoiceNo}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">
                          {ft.customer?.name || 'Cliente Geral'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          NIF: {ft.customer?.nif || '999999999'}
                        </div>
                      </td>
                      <td className="p-4 text-slate-500 font-mono">
                        {ft.date}
                      </td>
                      <td className="p-4 text-slate-500 font-mono">
                        {item.dueDate.toISOString().slice(0, 10)}
                      </td>
                      <td className="p-4">
                        {item.isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                            <span className="w-1 h-1 rounded-full bg-amber-500" />
                            Vencido há {item.daysOverdue} {item.daysOverdue === 1 ? 'dia' : 'dias'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            No prazo ({item.daysRemaining} {item.daysRemaining === 1 ? 'dia' : 'dias'} rest.)
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-mono text-slate-600">
                        {formatKz(ft.total)}
                      </td>
                      <td className="p-4 text-right font-mono text-emerald-600 font-medium">
                        {formatKz(item.paidAmount)}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-rose-600 bg-rose-50/20">
                        {formatKz(item.unpaidBalance)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onSettleInvoice(ft)}
                            title="LIQUIDAR FATURA"
                            className="px-2.5 py-1 bg-brand text-white font-bold text-[10px] rounded-lg hover:bg-brand/90 active:scale-95 transition flex items-center gap-1"
                          >
                            <span>LIQUIDAR</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onViewInvoice(ft.invoiceNo)}
                            title="VER DETALHES"
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-[10px] rounded-lg transition"
                          >
                            VER
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
