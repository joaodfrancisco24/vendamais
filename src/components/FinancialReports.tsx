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

  // Real Monthly Revenue Trend data aggregation
  const yearsInInvoices = invoices.map(inv => inv.date.slice(0, 4)).filter(Boolean);
  const latestYear = yearsInInvoices.length > 0 
    ? Math.max(...yearsInInvoices.map(Number)).toString() 
    : new Date().getFullYear().toString();

  const monthlyTrendData = [
    { key: '01', name: 'Jan', value: 0 },
    { key: '02', name: 'Fev', value: 0 },
    { key: '03', name: 'Mar', value: 0 },
    { key: '04', name: 'Abr', value: 0 },
    { key: '05', name: 'Mai', value: 0 },
    { key: '06', name: 'Jun', value: 0 },
    { key: '07', name: 'Jul', value: 0 },
    { key: '08', name: 'Ago', value: 0 },
    { key: '09', name: 'Set', value: 0 },
    { key: '10', name: 'Out', value: 0 },
    { key: '11', name: 'Nov', value: 0 },
    { key: '12', name: 'Dez', value: 0 },
  ];

  invoices.forEach((inv) => {
    const invYear = inv.date.slice(0, 4);
    const invMonth = inv.date.slice(5, 7);
    if (invYear === latestYear) {
      const found = monthlyTrendData.find(m => m.key === invMonth);
      if (found) {
        found.value += inv.total;
      }
    }
  });

  const maxMonthValue = Math.max(...monthlyTrendData.map(m => m.value), 0);
  const maxValForScale = maxMonthValue > 0 ? maxMonthValue : 1;
  
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
            Tendência de Receita Mensal ({latestYear})
          </h3>
          
          <div className="h-[170px] flex items-end justify-between gap-1 pt-4">
            {monthlyTrendData.map((month) => {
              const percentHeight = maxMonthValue > 0 ? (month.value / maxValForScale) * 100 : 0;
              return (
                <div key={month.key} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-3 sm:w-4.5 bg-slate-50 hover:bg-slate-100 rounded-lg h-[120px] flex items-end overflow-hidden transition relative">
                    <div 
                      style={{ height: `${percentHeight}%` }}
                      className="w-full bg-brand group-hover:bg-brand-dark transition-all rounded-t flex items-center justify-center relative shadow-xs"
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-9 bg-slate-950 text-white font-mono text-[9px] px-2 py-0.5 rounded-lg transition font-bold shadow-md z-10 whitespace-nowrap">
                        {formatKz(month.value)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{month.name}</span>
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
