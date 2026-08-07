import React from 'react';
import { BarChart2, TrendingUp, DollarSign, Percent, PieChart, Landmark, Coins, FileText, Printer } from 'lucide-react';
import { Invoice, Product } from '../types';
import { printElement } from '../utils/print';

interface FinancialReportsProps {
  invoices: Invoice[];
  products: Product[];
}

export default function FinancialReports({ invoices, products }: FinancialReportsProps) {
  // Financial Calculations
  const totalSales = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalTax = invoices.reduce((acc, inv) => acc + inv.taxTotal, 0);
  const totalNet = totalSales - totalTax;
  
  // Estimate costs: assume average profit margin is 40% (cost = 60%)
  const estimatedCost = totalSales * 0.6;
  const estimatedProfit = totalSales - estimatedCost - totalTax;
  const profitMargin = totalSales > 0 ? (estimatedProfit / totalSales) * 100 : 0;
  
  // Payment methods breakdown
  let cashSales = 0;
  let multicaixaSales = 0;
  let transferSales = 0;

  invoices.forEach((inv) => {
    if (inv.paymentMethod === 'Numerário') {
      cashSales += inv.total;
    } else if (inv.paymentMethod === 'Multicaixa') {
      multicaixaSales += inv.total;
    } else if (inv.paymentMethod === 'Transferência') {
      transferSales += inv.total;
    } else { // Misto
      cashSales += inv.total * 0.5;
      multicaixaSales += inv.total * 0.5;
    }
  });

  const formatKz = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  // Top products from invoices
  const productSalesMap: Record<string, { name: string, qty: number, total: number }> = {};
  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.productName, qty: 0, total: 0 };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].total += item.price * item.quantity;
    });
  });

  const sortedTopProducts = Object.values(productSalesMap).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div className="space-y-6 animate-fadeIn" id="financial-reports-root">
      {/* Title */}
      <div className="border-b border-slate-100 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Relatórios Financeiros</h1>
          <p className="text-sm text-slate-500">Analise a evolução de vendas, custos operacionais, apuramento de IVA e lucros detalhados do ecossistema</p>
        </div>
        <button
          id="btn-print-financial-report"
          onClick={() => printElement('printed-financial-report', '900px')}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-sm shrink-0"
        >
          <Printer className="w-4 h-4" />
          Imprimir Relatório
        </button>
      </div>

      <div id="printed-financial-report" className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Vendas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Faturação Acumulada</p>
            <p className="text-xl font-black text-slate-900 font-mono">{formatKz(totalSales)}</p>
            <p className="text-[10px] text-emerald-500 font-semibold">Total de documentos: {invoices.length}</p>
          </div>
          <span className="p-3 bg-brand-light text-brand rounded-2xl">
            <TrendingUp className="w-5 h-5" />
          </span>
        </div>

        {/* Lucro Estimado */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Lucro Líquido Est.</p>
            <p className="text-xl font-black text-slate-900 font-mono">{formatKz(Math.max(0, estimatedProfit))}</p>
            <p className="text-[10px] text-slate-400 font-semibold">Após custos e deduções fiscais</p>
          </div>
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <DollarSign className="w-5 h-5" />
          </span>
        </div>

        {/* Margem de Lucro */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Margem Média</p>
            <p className="text-xl font-black text-slate-900 font-mono">{profitMargin.toFixed(1)}%</p>
            <p className="text-[10px] text-brand font-semibold">Rentabilidade Operacional</p>
          </div>
          <span className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Percent className="w-5 h-5" />
          </span>
        </div>

        {/* Imposto de IVA */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">IVA Apurado (14%)</p>
            <p className="text-xl font-black text-slate-900 font-mono">{formatKz(totalTax)}</p>
            <p className="text-[10px] text-amber-500 font-semibold">Saldos provisionados para AGT</p>
          </div>
          <span className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <FileText className="w-5 h-5" />
          </span>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales trend custom bar chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
            <BarChart2 className="w-4 h-4 text-brand" />
            Tendência de Receita Mensal (Mock)
          </h3>
          
          <div className="h-[220px] flex items-end justify-between gap-2 pt-4">
            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'].map((month, idx) => {
              // Custom scale heights based on index
              const heights = [30, 45, 60, 50, 75, 90, 80];
              const height = heights[idx];
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full bg-slate-50 hover:bg-slate-100 rounded-xl h-[180px] flex items-end overflow-hidden transition relative">
                    <div 
                      style={{ height: `${height}%` }}
                      className="w-full bg-brand group-hover:bg-brand-dark transition-all rounded-t-lg flex items-center justify-center relative shadow-sm"
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-950 text-white font-mono text-[9px] px-2 py-0.5 rounded-lg transition font-bold shadow-md z-10">
                        {formatKz((totalSales || 1000000) * (height / 80))}
                      </span>
                    </div>
                  </div>
                  <span className="text-xxs font-bold text-slate-400 uppercase">{month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
              <PieChart className="w-4 h-4 text-brand" />
              Métodos de Pagamento
            </h3>
            
            <div className="space-y-4 pt-3">
              {/* Multicaixa */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><Landmark className="w-4 h-4 text-brand" /> Multicaixa (TPA)</span>
                  <span className="font-mono">{formatKz(multicaixaSales)}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${totalSales > 0 ? (multicaixaSales / totalSales) * 100 : 40}%` }}
                    className="h-full bg-brand rounded-full"
                  />
                </div>
              </div>

              {/* Cash */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><Coins className="w-4 h-4 text-emerald-500" /> Numerário (Cash)</span>
                  <span className="font-mono">{formatKz(cashSales)}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${totalSales > 0 ? (cashSales / totalSales) * 100 : 35}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </div>

              {/* Transfer */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-indigo-500" /> Transf. Bancária (IBAN)</span>
                  <span className="font-mono">{formatKz(transferSales)}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${totalSales > 0 ? (transferSales / totalSales) * 100 : 25}%` }}
                    className="h-full bg-indigo-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-6 pt-3 border-t border-slate-50 leading-relaxed italic">
            * Valores calculados com base nos prazos de vencimento especificados nas Facturas.
          </p>
        </div>

      </div>

      {/* Top selling products table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand" />
          Ranking de Artigos mais Vendidos (Top Faturação)
        </h3>
        
        <div className="overflow-hidden rounded-2xl border border-slate-100 text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase">
                <th className="p-3">Artigo</th>
                <th className="p-3 text-center">Unidades Vendidas</th>
                <th className="p-3 text-right">Volume de Negócio</th>
              </tr>
            </thead>
            <tbody>
              {sortedTopProducts.length > 0 ? (
                sortedTopProducts.map((p, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-brand-light text-brand font-extrabold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {p.name}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-500">{p.qty} un</td>
                    <td className="p-3 text-right font-mono font-black text-slate-950">{formatKz(p.total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-400">
                    Nenhuma fatura emitida ainda para calcular o ranking de vendas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
