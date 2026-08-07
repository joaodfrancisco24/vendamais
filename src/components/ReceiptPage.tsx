/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  Coins,
  Plus,
  Trash2,
  PlusCircle,
  Receipt,
  Calendar,
  Clock,
  ChevronDown,
  ArrowRight,
  Info,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { Invoice, CompanyConfig, KeysConfig, Customer, InvoiceLine, InvoiceType, AppUser } from '../types';
import { printElement } from '../utils/print';
import { signInvoice } from '../utils/signature';

interface ReceiptPageProps {
  invoices: Invoice[];
  customers: Customer[];
  company: CompanyConfig;
  keys: KeysConfig;
  currentUser?: AppUser;
  onEmitInvoice: (invoice: Invoice) => void;
  lastInvoiceHash: string;
}

interface SettleInvoiceItem {
  invoice: Invoice;
  unpaidBalance: number;
  amountToPay: number;
  selected: boolean;
}

export default function ReceiptPage({
  invoices,
  customers,
  company,
  keys,
  currentUser,
  onEmitInvoice,
  lastInvoiceHash
}: ReceiptPageProps) {
  const [activeView, setActiveView] = useState<'list' | 'create'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Invoice | null>(null);
  const [printFormat, setPrintFormat] = useState<'ticket' | 'a4'>('ticket');

  // New Receipt form states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Numerário' | 'Multicaixa' | 'Transferência' | 'Misto'>('Numerário');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [cardReceived, setCardReceived] = useState<number>(0);
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [pendingItems, setPendingItems] = useState<SettleInvoiceItem[]>([]);

  // Shift check
  const [isShiftOpen, setIsShiftOpen] = useState<boolean>(() => {
    const cached = localStorage.getItem('vm_active_shift');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return Boolean(parsed.isOpen);
      } catch {
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    const checkShift = () => {
      const cached = localStorage.getItem('vm_active_shift');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setIsShiftOpen(Boolean(parsed.isOpen));
        } catch {
          setIsShiftOpen(false);
        }
      } else {
        setIsShiftOpen(false);
      }
    };
    checkShift();
    window.addEventListener('focus', checkShift);
    return () => window.removeEventListener('focus', checkShift);
  }, []);

  // Filter receipts (type === 'RC')
  const receiptsList = useMemo(() => {
    return invoices.filter(inv => inv.type === 'RC');
  }, [invoices]);

  const filteredReceipts = useMemo(() => {
    return receiptsList.filter((rc) => {
      const matchesSearch = rc.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (rc.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (rc.customer?.nif || '').includes(searchTerm);
      return matchesSearch;
    });
  }, [receiptsList, searchTerm]);

  // Format currency helpers
  const formatKz = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' })
      .format(value)
      .replace('Kz', '')
      .trim() + ' Kz';
  };

  // Calculate unpaid balance for all FTs of a customer
  const getCustomerOutstandingInvoices = (customerId: string) => {
    if (!customerId) return [];

    // 1. Get all FT invoices for this customer that are EMITIDO
    const customerFts = invoices.filter(
      inv => inv.type === 'FT' && inv.customer.id === customerId && inv.status === 'EMITIDO'
    );

    // 2. Map through each FT to calculate unpaid balance
    return customerFts.map((ft) => {
      // Find all RC payments applied to this specific invoice
      let paidAmount = 0;
      receiptsList.forEach((rc) => {
        if (rc.status === 'EMITIDO') {
          rc.items.forEach((line) => {
            if (line.productCode === ft.invoiceNo) {
              paidAmount += line.total;
            }
          });
        }
      });

      const unpaidBalance = Math.max(0, ft.total - paidAmount);
      return {
        invoice: ft,
        unpaidBalance,
        amountToPay: unpaidBalance, // Default to full payment
        selected: false
      };
    }).filter(item => item.unpaidBalance > 0); // Only return invoices with outstanding balance
  };

  // Update pending items whenever selected customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      const items = getCustomerOutstandingInvoices(selectedCustomerId);
      setPendingItems(items);
    } else {
      setPendingItems([]);
    }
    // Reset payment values
    setCashReceived(0);
    setCardReceived(0);
    setPaymentRef('');
  }, [selectedCustomerId, invoices, receiptsList]);

  // Handle invoice row checkbox toggle
  const handleToggleSelectItem = (idx: number) => {
    const updated = [...pendingItems];
    updated[idx].selected = !updated[idx].selected;
    setPendingItems(updated);
  };

  // Handle invoice pay amount input change
  const handleAmountToPayChange = (idx: number, val: number) => {
    const updated = [...pendingItems];
    const maxVal = updated[idx].unpaidBalance;
    updated[idx].amountToPay = Math.max(0, Math.min(maxVal, val));
    setPendingItems(updated);
  };

  // Calculate totals of selected items
  const selectedTotals = useMemo(() => {
    let subtotal = 0;
    pendingItems.forEach((item) => {
      if (item.selected) {
        subtotal += item.amountToPay;
      }
    });
    return {
      total: subtotal
    };
  }, [pendingItems]);

  // Adjust mixed payment distribution when totals change
  useEffect(() => {
    if (paymentMethod === 'Misto') {
      const half = Math.round(selectedTotals.total / 2);
      setCashReceived(half);
      setCardReceived(selectedTotals.total - half);
    } else if (paymentMethod === 'Numerário') {
      setCashReceived(selectedTotals.total);
      setCardReceived(0);
    } else {
      setCashReceived(0);
      setCardReceived(selectedTotals.total);
    }
  }, [selectedTotals.total, paymentMethod]);

  const handleEmitReceipt = () => {
    if (!selectedCustomerId) {
      alert('Por favor, selecione o cliente adquirente.');
      return;
    }

    const selectedLines = pendingItems.filter(item => item.selected && item.amountToPay > 0);
    if (selectedLines.length === 0) {
      alert('Por favor, selecione pelo menos uma fatura pendente com valor superior a 0 Kz para liquidar.');
      return;
    }

    if (!isShiftOpen) {
      alert('Abertura de Turno Obrigatória! Não pode emitir documentos fiscais com o caixa fechado.');
      return;
    }

    // Double check mixed payment validation
    if (paymentMethod === 'Misto' && (cashReceived + cardReceived) !== selectedTotals.total) {
      alert(`O total distribuído (${formatKz(cashReceived + cardReceived)}) deve ser exatamente igual ao valor a liquidar (${formatKz(selectedTotals.total)}).`);
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    // Create lines for the receipt
    // Each line in a receipt RC represents the invoice being paid
    const items: InvoiceLine[] = selectedLines.map((item) => ({
      productId: item.invoice.id,
      productName: `SVP de Factura ${item.invoice.invoiceNo}`,
      productCode: item.invoice.invoiceNo,
      quantity: 1,
      price: item.amountToPay,
      discount: 0,
      taxRate: 0,
      taxAmount: 0,
      total: item.amountToPay
    }));

    // Sequence Number
    const nextSeq = receiptsList.length + 1;
    const currentYear = new Date().getFullYear();
    const invoiceNo = `RC VMAIS${currentYear}/${nextSeq}`;

    // Cryptographic Signatures according to AGT
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toISOString();
    
    const signatureResult = signInvoice(
      dateStr,
      timeStr,
      invoiceNo,
      selectedTotals.total,
      lastInvoiceHash,
      keys?.privateKey || ''
    );

    const newReceipt: Invoice = {
      id: `rc-${Date.now()}`,
      invoiceNo,
      sequenceNumber: nextSeq,
      type: 'RC',
      date: dateStr,
      customer,
      items,
      subtotal: selectedTotals.total,
      discountTotal: 0,
      taxTotal: 0,
      total: selectedTotals.total,
      paymentMethod,
      cashReceived: paymentMethod === 'Numerário' || paymentMethod === 'Misto' ? cashReceived : undefined,
      cardReceived: paymentMethod === 'Multicaixa' || paymentMethod === 'Misto' ? cardReceived : undefined,
      changeAmount: paymentMethod === 'Numerário' ? Math.max(0, cashReceived - selectedTotals.total) : undefined,
      paymentRef: paymentMethod === 'Multicaixa' || paymentMethod === 'Transferência' ? paymentRef : undefined,
      notes: receiptNotes,
      status: 'EMITIDO',
      operator: currentUser?.name || currentUser?.username || 'Operador',
      hash: signatureResult.hash,
      hashControl: signatureResult.hashControl,
      previousHash: lastInvoiceHash,
      signedBy: keys?.certId || '320/AGT/2026'
    };

    onEmitInvoice(newReceipt);

    // Reset Form
    setSelectedCustomerId('');
    setReceiptNotes('');
    setPaymentRef('');
    setCashReceived(0);
    setCardReceived(0);

    // Open Print Preview Modal
    setSelectedReceipt(newReceipt);
    setPrintFormat('a4');
    setActiveView('list');
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="receipt-page-root">
      
      {/* Title Header */}
      <div className="border-b border-gray-100 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-brand" />
            <span>Recibos de Liquidação (RC)</span>
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Emissão de Recibos para quitação total ou parcial de Facturas (FT) a crédito em conformidade com a AGT Angola
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {activeView === 'list' ? (
            <button
              id="btn-nav-create-receipt"
              onClick={() => setActiveView('create')}
              className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white font-extrabold rounded-xl shadow-xs transition flex items-center gap-2 text-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>Emitir Novo Recibo</span>
            </button>
          ) : (
            <button
              id="btn-nav-list-receipt"
              onClick={() => setActiveView('list')}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition flex items-center gap-2 text-xs cursor-pointer"
            >
              <span>Voltar ao Histórico</span>
            </button>
          )}
        </div>
      </div>

      {/* SHIFT WARNING BAR */}
      {!isShiftOpen && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-extrabold text-xs text-rose-900 block uppercase">Operações Bloqueadas - Turno de Caixa Fechado</span>
            <p className="text-xs text-rose-800 leading-relaxed font-medium">
              Não é possível emitir Recibos (RC) ou faturas com o turno fechado. Por favor, abra o caixa na aba <strong>Gestão de Turnos</strong> antes de prosseguir.
            </p>
          </div>
        </div>
      )}

      {activeView === 'list' ? (
        <div className="space-y-4">
          
          {/* SEARCH & FILTER BAR */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <input 
                type="text"
                id="receipt-search"
                placeholder="Pesquisar por nº de recibo, cliente ou NIF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-2xs"
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            </div>

            <div className="text-slate-500 text-xxs font-bold uppercase tracking-wider">
              Total de Recibos Emitidos: <strong>{receiptsList.length}</strong>
            </div>
          </div>

          {/* HISTORICAL RECEIPTS TABLE */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
            {filteredReceipts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-extrabold uppercase tracking-wider text-xxs">
                      <th className="p-4">Recibo / Série</th>
                      <th className="p-4">Cliente Beneficiário</th>
                      <th className="p-4">Data Emissão</th>
                      <th className="p-4">Liquidado Por</th>
                      <th className="p-4 text-right">Valor Quitado</th>
                      <th className="p-4 text-center">Controlo AGT</th>
                      <th className="p-4 text-center">Operações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium">
                    {filteredReceipts.slice().reverse().map((rc) => (
                      <tr key={rc.id} className="hover:bg-gray-50/40 transition">
                        <td className="p-4">
                          <p className="font-mono font-black text-slate-900">{rc.invoiceNo}</p>
                          <span className="text-[9px] bg-brand-light text-brand font-black px-1.5 py-0.5 rounded uppercase tracking-wider mt-1 inline-block">
                            RC
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="font-extrabold text-slate-800">{rc.customer?.name || 'Cliente Geral'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">NIF: {rc.customer?.nif || '999999999'}</p>
                        </td>
                        <td className="p-4 text-slate-500 font-mono">{rc.date}</td>
                        <td className="p-4">
                          <span className="text-slate-700 font-bold">{rc.paymentMethod}</span>
                          {rc.paymentRef && (
                            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{rc.paymentRef}</p>
                          )}
                        </td>
                        <td className="p-4 text-right font-mono font-black text-emerald-700">
                          {formatKz(rc.total)}
                        </td>
                        <td className="p-4 text-center font-mono">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200/60 rounded font-black text-[10px] text-slate-700">
                            {rc.hashControl}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              id={`btn-print-rc-ticket-${rc.sequenceNumber}`}
                              onClick={() => {
                                setSelectedReceipt(rc);
                                setPrintFormat('ticket');
                              }}
                              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition border border-slate-200/40 flex items-center gap-1 font-bold text-[10px]"
                              title="Imprimir Recibo POS (80mm)"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Ticket</span>
                            </button>
                            <button
                              id={`btn-print-rc-a4-${rc.sequenceNumber}`}
                              onClick={() => {
                                setSelectedReceipt(rc);
                                setPrintFormat('a4');
                              }}
                              className="p-2 bg-brand-light hover:bg-brand-light/80 text-brand rounded-lg transition border border-brand-border/40 flex items-center gap-1 font-bold text-[10px]"
                              title="Imprimir Folha Completa A4"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>A4</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 text-center text-gray-400">
                <Receipt className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                <p className="font-bold text-sm text-slate-800">Nenhum Recibo Registado</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Ainda não emitiu recibos de quitação. Aceda a "Emitir Novo Recibo" para liquidar faturas pendentes de clientes.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        
        /* NEW RECEIPT EMISSION FORM */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="receipt-emission-form">
          
          {/* LEFT 2 COLUMNS: SELECTIONS */}
          <div className="xl:col-span-2 space-y-5">
            
            {/* STEP 1: SELECT CUSTOMER */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-gray-50 pb-3">
                <div className="w-7 h-7 bg-brand-light text-brand rounded-lg flex items-center justify-center font-extrabold text-xs">
                  1
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wider text-slate-950">Cliente Adquirente</h3>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Selecione o cliente para carregar faturas a crédito</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    Escolha o Cliente *
                  </label>
                  <select
                    id="receipt-customer-select"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  >
                    <option value="">-- Selecione o Cliente --</option>
                    {customers.map(c => {
                      const pending = getCustomerOutstandingInvoices(c.id);
                      if (pending.length === 0) return null; // Only show clients with outstanding bills
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} (NIF: {c.nif}) — {pending.length} Pendentes
                        </option>
                      );
                    }).filter(Boolean)}
                  </select>
                </div>

                {selectedCustomerId && (() => {
                  const cust = customers.find(c => c.id === selectedCustomerId);
                  if (!cust) return null;
                  return (
                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-200/40 text-xxs text-slate-600 space-y-1">
                      <p className="font-extrabold text-slate-800 uppercase tracking-wide">Ficha Resumo do Cliente</p>
                      <p><strong>Nome Completo:</strong> {cust.name}</p>
                      <p><strong>NIF Fiscal:</strong> <code className="font-bold text-slate-900 font-mono">{cust.nif}</code></p>
                      {cust.address && <p><strong>Endereço:</strong> {cust.address}</p>}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* STEP 2: SELECT INVOICES & SPECIFY PAYMENTS */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-gray-50 pb-3">
                <div className="w-7 h-7 bg-brand-light text-brand rounded-lg flex items-center justify-center font-extrabold text-xs">
                  2
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wider text-slate-950">Facturas Pendentes a Liquidar</h3>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Selecione e defina os valores de pagamento de cada fatura</p>
                </div>
              </div>

              {selectedCustomerId ? (
                pendingItems.length > 0 ? (
                  <div className="space-y-3">
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase">
                            <th className="p-3 text-center w-12">Pagar?</th>
                            <th className="p-3">Série / Código FT</th>
                            <th className="p-3">Data</th>
                            <th className="p-3 text-right">Total Fatura</th>
                            <th className="p-3 text-right">Saldo Devedor</th>
                            <th className="p-3 text-right w-44">Valor a Liquidar (Kz)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                          {pendingItems.map((item, idx) => (
                            <tr key={item.invoice.id} className={`transition ${item.selected ? 'bg-brand-light/20' : ''}`}>
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={item.selected}
                                  onChange={() => handleToggleSelectItem(idx)}
                                  className="w-4.5 h-4.5 text-brand bg-slate-100 rounded border-slate-200 focus:ring-brand focus:ring-2 cursor-pointer"
                                />
                              </td>
                              <td className="p-3">
                                <span className="font-mono font-bold text-slate-900">{item.invoice.invoiceNo}</span>
                              </td>
                              <td className="p-3 text-slate-500 font-mono">{item.invoice.date}</td>
                              <td className="p-3 text-right font-mono text-slate-600">
                                {formatKz(item.invoice.total)}
                              </td>
                              <td className="p-3 text-right font-mono text-rose-700 font-bold">
                                {formatKz(item.unpaidBalance)}
                              </td>
                              <td className="p-3 text-right">
                                <input
                                  type="number"
                                  disabled={!item.selected}
                                  value={item.amountToPay || ''}
                                  onChange={(e) => handleAmountToPayChange(idx, Number(e.target.value))}
                                  className={`w-full px-2.5 py-1.5 border rounded-xl text-right font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-brand ${
                                    item.selected ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                  }`}
                                  placeholder="0,00"
                                  min="0"
                                  max={item.unpaidBalance}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-start gap-2 text-[10px] text-blue-800">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        O sistema calcula o <strong>Saldo Devedor</strong> de cada FT subtraindo todas as amortizações já registadas em recibos (RC) anteriores. É suportado o pagamento de parcelas (liquidação parcial).
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-xs text-slate-800">Cliente Sem Pendências</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Todas as faturas a crédito deste cliente encontram-se totalmente pagas.</p>
                  </div>
                )
              ) : (
                <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="font-bold text-xs text-slate-500">Aguardando Seleção de Cliente</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Por favor, indique primeiro o cliente adquirente acima.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 1 COLUMN: TOTALS & EMISSION SUMMARY */}
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-gray-50 pb-3">
                <div className="w-7 h-7 bg-brand-light text-brand rounded-lg flex items-center justify-center font-extrabold text-xs">
                  3
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wider text-slate-950">Liquidação & Caixa</h3>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Valores de cobrança e tesouraria</p>
                </div>
              </div>

              {/* PAYMENT METHOD SELECTOR */}
              <div className="space-y-3">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase block tracking-wider">
                  Método de Cobrança *
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Numerário')}
                    className={`py-2 px-2.5 border rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      paymentMethod === 'Numerário'
                        ? 'border-brand bg-brand-light text-brand'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>Numerário</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Multicaixa')}
                    className={`py-2 px-2.5 border rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      paymentMethod === 'Multicaixa'
                        ? 'border-brand bg-brand-light text-brand'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Multicaixa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Transferência')}
                    className={`py-2 px-2.5 border rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      paymentMethod === 'Transferência'
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Transferência</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Misto')}
                    className={`py-2 px-2.5 border rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      paymentMethod === 'Misto'
                        ? 'border-amber-600 bg-amber-50 text-amber-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>Misto</span>
                  </button>
                </div>
              </div>

              {/* PAYMENT DETAILS INPUTS */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-xxs">
                {paymentMethod === 'Numerário' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-500 uppercase">Valor Entregue</span>
                      <span className="font-semibold text-slate-400">Numerário</span>
                    </div>
                    <input
                      type="number"
                      value={cashReceived || ''}
                      onChange={(e) => setCashReceived(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand"
                      placeholder="Insira o valor entregue"
                    />
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 text-xs">
                      <span className="font-semibold text-slate-500">Troco a devolver:</span>
                      <span className={`font-mono font-black ${cashReceived >= selectedTotals.total ? 'text-brand' : 'text-rose-600'}`}>
                        {formatKz(Math.max(0, cashReceived - selectedTotals.total))}
                      </span>
                    </div>
                  </div>
                )}

                {(paymentMethod === 'Multicaixa' || paymentMethod === 'Transferência') && (
                  <div className="space-y-2">
                    <label className="font-bold text-slate-500 uppercase block">Referência / Banco</label>
                    <input
                      type="text"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand"
                      placeholder="Ex: Ref. BFA-8237 ou Comprovativo"
                    />
                  </div>
                )}

                {paymentMethod === 'Misto' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-500 uppercase block mb-1">Numerário (Kz)</label>
                        <input
                          type="number"
                          value={cashReceived || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCashReceived(val);
                            setCardReceived(Math.max(0, selectedTotals.total - val));
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-500 uppercase block mb-1">TPA / Cartão (Kz)</label>
                        <input
                          type="number"
                          value={cardReceived || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCardReceived(val);
                            setCashReceived(Math.max(0, selectedTotals.total - val));
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand"
                        />
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 text-slate-500 font-semibold flex justify-between">
                      <span>Total Conciliado:</span>
                      <span className={`font-bold font-mono ${(cashReceived + cardReceived) === selectedTotals.total ? 'text-emerald-700' : 'text-amber-600'}`}>
                        {formatKz(cashReceived + cardReceived)} de {formatKz(selectedTotals.total)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* NOTES */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase block tracking-wider">
                  Observações do Recibo (Opcional)
                </label>
                <textarea
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand h-16 resize-none"
                  placeholder="Observações complementares a imprimir..."
                />
              </div>

              {/* SUMMARY BOX */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-slate-300 font-bold text-[10px] uppercase tracking-wide">
                  <span>Total Cobrado</span>
                  <span>AOA</span>
                </div>
                <div className="text-xl font-extrabold font-mono text-brand">
                  {formatKz(selectedTotals.total)}
                </div>
              </div>

              {/* ACTION EMIT */}
              <button
                id="btn-confirm-emit-receipt"
                type="button"
                disabled={!isShiftOpen || selectedTotals.total <= 0}
                onClick={handleEmitReceipt}
                className={`w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm ${
                  !isShiftOpen || selectedTotals.total <= 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                    : 'bg-brand hover:bg-brand-dark text-white cursor-pointer'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Confirmar & Emitir Recibo (RC)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED PRINT DIALOG PREVIEW OVERLAY */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className={`bg-white rounded-3xl border border-gray-100 shadow-2xl w-full p-6 flex flex-col h-[92vh] transition-all duration-300 ${
            printFormat === 'a4' ? 'max-w-4xl' : 'max-w-md'
          }`}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-brand" />
                <h3 className="font-bold text-gray-900 text-sm">Visualizar / Imprimir Recibo de Liquidação</h3>
              </div>
              <div className="flex items-center gap-2">
                
                {/* Print Format Switcher */}
                <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPrintFormat('ticket')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      printFormat === 'ticket' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Ticket (80mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintFormat('a4')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      printFormat === 'a4' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Folha A4
                  </button>
                </div>

                <button 
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Document Content */}
            <div className="flex-1 overflow-y-auto py-6 flex justify-center bg-gray-50/50 rounded-2xl my-4 border border-slate-100">
              
              {/* TICKET FORMAT PREVIEW (80mm) */}
              {printFormat === 'ticket' && (
                <div 
                  id="printed-receipt-ticket" 
                  className="bg-white border border-gray-200 shadow-sm w-[300px] p-4 text-[10px] font-mono leading-tight text-gray-800 space-y-3"
                >
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

                  <div className="space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>RECIBO DE LIQUIDAÇÃO:</span>
                      <span>{selectedReceipt.invoiceNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DATA EMISSÃO:</span>
                      <span>{selectedReceipt.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>OPERADOR:</span>
                      <span>{selectedReceipt.operator || 'Operador'}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-300 my-2"></div>

                  <div className="space-y-0.5">
                    <p className="font-bold">CLIENTE: {selectedReceipt.customer?.name}</p>
                    <p>NIF: {selectedReceipt.customer?.nif}</p>
                  </div>

                  <div className="border-t border-dashed border-gray-300 my-2"></div>

                  <table className="w-full text-left">
                    <thead>
                      <tr className="font-bold text-gray-900 border-b border-dashed border-gray-200">
                        <th>Fatura Original</th>
                        <th className="text-right">Liquidado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReceipt.items.map((line, idx) => (
                        <tr key={idx} className="border-b border-gray-50">
                          <td className="py-1">
                            <p className="font-bold">{line.productCode}</p>
                            <p className="text-[8px] text-gray-500">Liquidação de Factura</p>
                          </td>
                          <td className="text-right font-bold">{formatKz(line.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="space-y-1 text-right pt-2 border-t border-dashed border-gray-200 font-bold">
                    <p className="font-black text-xs text-slate-950">
                      TOTAL QUITADO: {formatKz(selectedReceipt.total)}
                    </p>
                    <p className="text-[8px] text-slate-500 font-medium">Forma: {selectedReceipt.paymentMethod}</p>
                    {selectedReceipt.paymentRef && <p className="text-[8px] text-slate-500 font-medium">Ref: {selectedReceipt.paymentRef}</p>}
                  </div>

                  <div className="border-t border-dashed border-gray-300 my-2"></div>

                  <div className="space-y-1 text-center text-[8px] text-gray-500">
                    <p className="font-bold text-gray-700">ELEMENTO DE CONTROLO AGT</p>
                    <div className="bg-gray-100 p-1 rounded font-mono text-center text-[9px] text-gray-800 font-bold border border-gray-200">
                      Hash: {selectedReceipt.hashControl}
                    </div>
                    <p className="line-clamp-2 text-xxs font-mono">{selectedReceipt.hash}</p>
                    <p className="pt-2">
                      Processado por Programa Certificado nº {selectedReceipt.signedBy} / VENDA MAIS
                    </p>
                    <p className="font-semibold text-gray-600">Obrigado pela preferência!</p>
                  </div>
                </div>
              )}

              {/* A4 FORMAT PREVIEW */}
              {printFormat === 'a4' && (
                <div 
                  id="printed-receipt-a4" 
                  className="bg-white border border-slate-200 shadow-md w-full max-w-3xl p-8 rounded-xl font-sans text-slate-800 space-y-6 text-xs leading-relaxed"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-950 pb-6 gap-4">
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

                    <div className="bg-slate-950 text-white p-4 rounded-2xl text-right min-w-[240px] shadow-sm space-y-1.5">
                      <div className="inline-block px-2.5 py-0.5 rounded-full font-black text-[10px] tracking-wider uppercase mb-1 bg-brand text-white">
                        RECIBO DE LIQUIDAÇÃO
                      </div>
                      <h3 className="text-lg font-black font-mono tracking-tight text-white">{selectedReceipt.invoiceNo}</h3>
                      <div className="text-[11px] text-slate-200 font-medium space-y-0.5">
                        <p>Data de Emissão: <strong className="text-white font-mono">{selectedReceipt.date}</strong></p>
                        <p>Moeda: <strong className="text-white font-mono">AOA (Kz)</strong></p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information & Settle Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Cliente / Sujeito Passivo</span>
                      <h4 className="font-extrabold text-sm text-slate-900">{selectedReceipt.customer?.name}</h4>
                      <p className="text-slate-600 font-medium"><strong>NIF:</strong> {selectedReceipt.customer?.nif || '999999999'}</p>
                      {selectedReceipt.customer?.address && (
                        <p className="text-slate-600"><strong>Endereço:</strong> {selectedReceipt.customer.address}</p>
                      )}
                    </div>

                    <div className="space-y-1 text-right sm:text-left border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Dados Financeiros & Cobrança</span>
                      <p className="text-slate-700 font-medium"><strong>Forma de Cobrança:</strong> {selectedReceipt.paymentMethod}</p>
                      {selectedReceipt.paymentRef && (
                        <p className="text-slate-700 font-medium"><strong>Ref. Pagamento:</strong> <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">{selectedReceipt.paymentRef}</code></p>
                      )}
                      <p className="text-slate-700 font-medium"><strong>Operador:</strong> {selectedReceipt.operator}</p>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5">Nº do Documento Quitado</th>
                          <th className="py-2.5">Descrição da Operação</th>
                          <th className="py-2.5 text-center">Quant.</th>
                          <th className="py-2.5 text-right">Taxa IVA</th>
                          <th className="py-2.5 text-right">Valor Pago (Kz)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {selectedReceipt.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 font-mono font-bold text-slate-950">{item.productCode}</td>
                            <td className="py-2.5 text-slate-600 font-bold">Liquidação de Crédito de Factura Original</td>
                            <td className="py-2.5 text-center font-mono">1</td>
                            <td className="py-2.5 text-right text-slate-500 font-mono">Isento (M02)</td>
                            <td className="py-2.5 text-right font-mono font-bold text-slate-900">{formatKz(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals & Notes */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-200">
                    <div className="space-y-2 text-xxs text-slate-500 max-w-sm">
                      {selectedReceipt.notes && <p><strong>Observações:</strong> {selectedReceipt.notes}</p>}
                      <p className="leading-relaxed">
                        Este documento serve como prova de quitação de saldos de faturas de crédito correspondentes. Conservar em conformidade com as normas contabilísticas angolanas.
                      </p>
                    </div>

                    <div className="w-full sm:w-64 space-y-1.5 text-right bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Valor Principal Quitado:</span>
                        <span className="font-mono">{formatKz(selectedReceipt.total)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Impostos Liquidado:</span>
                        <span className="font-mono">{formatKz(0)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-slate-900">
                        <span>VALOR TOTAL QUITADO:</span>
                        <span className="font-mono text-brand">{formatKz(selectedReceipt.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* AGT Certification and Signature Footer */}
                  <div className="border-t border-slate-200 pt-6 mt-6 space-y-2 text-center text-slate-400 text-xxs">
                    <div className="flex justify-center items-center gap-2 font-mono text-slate-700 bg-slate-100 py-1.5 px-3 rounded-lg w-max mx-auto border border-slate-200 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{selectedReceipt.hashControl}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-500 font-normal truncate max-w-md">{selectedReceipt.hash}</span>
                    </div>
                    <p className="font-medium text-slate-500">
                      Processado por programa certificado n.º <strong>{selectedReceipt.signedBy}</strong> / VENDA MAIS (AGT Angola)
                    </p>
                    <p className="font-semibold text-slate-600">Documento impresso em conformidade legal</p>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION FOOTER */}
            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                id="btn-print-receipt-preview"
                onClick={() => {
                  if (printFormat === 'a4') {
                    printElement('printed-receipt-a4', '800px');
                  } else {
                    printElement('printed-receipt-ticket', '420px');
                  }
                }}
                className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-xl text-xs font-extrabold hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4 text-brand-light" />
                <span>Imprimir Documento ({printFormat === 'a4' ? 'A4' : 'Ticket'})</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="py-3 px-6 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-xs"
              >
                Voltar ao Histórico
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
