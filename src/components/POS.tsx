/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  FileText, 
  X, 
  Check, 
  Printer, 
  Coins, 
  CreditCard, 
  Percent, 
  Clock, 
  Settings, 
  AlertCircle,
  Package,
  Lock,
  Unlock,
  Sliders,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { Product, Customer, Invoice, InvoiceLine, InvoiceType, CompanyConfig, KeysConfig, AppUser } from '../types';
import { signInvoice } from '../utils/signature';
import { printElement } from '../utils/print';
import PrintSettingsModal, { getDocumentPrintFormat } from './PrintSettingsModal';
import CustomerSearchSelector from './CustomerSearchSelector';

interface POSProps {
  products: Product[];
  customers: Customer[];
  company: CompanyConfig;
  keys: KeysConfig;
  currentUser?: AppUser;
  onEmitInvoice: (invoice: Invoice) => void;
  onNavigate: (tab: string) => void;
  lastInvoiceHash: string;
  onAddCustomer?: (customer: Customer) => void;
  onAddProduct?: (product: Product) => void;
  onUpdateCompany?: (company: CompanyConfig) => void;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // percentage
}

export default function POS({
  products,
  customers,
  company,
  keys,
  currentUser,
  onEmitInvoice,
  onNavigate,
  lastInvoiceHash,
  onAddCustomer = () => {},
  onAddProduct,
  onUpdateCompany
}: POSProps) {
  // POS States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '1');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'PROD' | 'SERV'>('ALL');
  const [generalDiscount, setGeneralDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Numerário' | 'Multicaixa' | 'Transferência' | 'Misto'>('Numerário');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('FR'); // FR is default for retail
  const [paymentTerm, setPaymentTerm] = useState('Pronto Pagamento');
  const [withholdingTaxRate, setWithholdingTaxRate] = useState<number>(0);

  // Quick Product Add state
  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);
  const [quickProductCode, setQuickProductCode] = useState('');
  const [quickProductName, setQuickProductName] = useState('');
  const [quickProductPrice, setQuickProductPrice] = useState<number>(0);
  const [quickProductIsService, setQuickProductIsService] = useState(false);
  const [quickProductTaxType, setQuickProductTaxType] = useState<'IVA14' | 'ISE'>('IVA14');
  const [quickProductStock, setQuickProductStock] = useState<number>(10);
  const [quickProductCategory, setQuickProductCategory] = useState('INFORMÁTICA');

  // Quick Bank Add state
  const [isQuickBankOpen, setIsQuickBankOpen] = useState(false);
  const [quickBankName, setQuickBankName] = useState('');
  const [quickBankIban, setQuickBankIban] = useState('AO06');
  const [quickBankAccount, setQuickBankAccount] = useState('');
  const [quickBankHolder, setQuickBankHolder] = useState(company.name || '');

  const openQuickAddProduct = () => {
    setQuickProductCode(Math.floor(100000 + Math.random() * 900000).toString());
    setQuickProductName(searchTerm.trim());
    setQuickProductPrice(0);
    setQuickProductIsService(false);
    setQuickProductTaxType('IVA14');
    setQuickProductStock(10);
    setQuickProductCategory('INFORMÁTICA');
    setIsQuickProductOpen(true);
  };

  const handleSaveQuickBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBankName.trim() || !quickBankIban.trim()) return;

    const newAcc = {
      id: Math.random().toString(36).substr(2, 9),
      bankName: quickBankName.trim().toUpperCase(),
      iban: quickBankIban.trim().toUpperCase(),
      accountNumber: quickBankAccount.trim(),
      holderName: quickBankHolder.trim() || company.name,
      isDefault: true
    };

    const currentAccounts = company.bankAccounts || [];
    const updatedAccounts = [
      ...currentAccounts.map(acc => ({ ...acc, isDefault: false })),
      newAcc
    ];

    if (onUpdateCompany) {
      onUpdateCompany({
        ...company,
        bankAccounts: updatedAccounts
      });
    }

    setQuickBankName('');
    setQuickBankIban('AO06');
    setQuickBankAccount('');
    setQuickBankHolder(company.name || '');
    setIsQuickBankOpen(false);
  };

  const handleSaveQuickProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickProductName.trim() || !quickProductCode.trim()) return;

    const newProd: Product = {
      id: Math.random().toString(36).substr(2, 9),
      code: quickProductCode.trim(),
      name: quickProductName.trim(),
      category: quickProductCategory,
      price: quickProductPrice,
      buyPrice: 0,
      taxType: quickProductTaxType,
      exemptionReason: quickProductTaxType === 'ISE' ? 'Isento nos termos do Artigo 12.º do CIVA' : undefined,
      stock: quickProductIsService ? 0 : quickProductStock,
      minStock: 2,
      maxStock: 100,
      unit: 'UN',
      isService: quickProductIsService,
      warehouseId: 'wh1',
      warehouse: 'Armazém Central (Sede)'
    };

    if (onAddProduct) {
      onAddProduct(newProd);
    }

    addToCart(newProd);
    setSearchTerm('');
    setIsQuickProductOpen(false);
  };

  // Shift state check
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

  const [showClosedShiftModal, setShowClosedShiftModal] = useState(false);

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
    window.addEventListener('storage', checkShift);
    window.addEventListener('shift_change', checkShift);
    return () => {
      window.removeEventListener('focus', checkShift);
      window.removeEventListener('storage', checkShift);
      window.removeEventListener('shift_change', checkShift);
    };
  }, []);

  // Payment and receipt details
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [cardReceived, setCardReceived] = useState<number>(0);
  const [paymentRef, setPaymentRef] = useState<string>('');

  // Modals / Overlays
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [issuedInvoice, setIssuedInvoice] = useState<Invoice | null>(null);
  const [isPrintSettingsOpen, setIsPrintSettingsOpen] = useState(false);
  const [posPrintFormat, setPosPrintFormat] = useState<'A4' | 'Ticket'>('Ticket');

  useEffect(() => {
    if (issuedInvoice) {
      const docConf = getDocumentPrintFormat(issuedInvoice.type);
      setPosPrintFormat(docConf.format);

      if (docConf.autoPrint) {
        setTimeout(() => {
          const targetId = docConf.format === 'A4' ? 'printed-invoice-a4' : 'printed-receipt-view';
          const width = docConf.format === 'A4'
            ? '800px'
            : docConf.ticketSize === '80mm' ? '420px' : docConf.ticketSize === '55mm' ? '280px' : '340px';
          printElement(targetId, width);
        }, 400);
      }
    }
  }, [issuedInvoice]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search match
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category match
      if (activeCategory === 'PROD') {
        return matchesSearch && !p.isService;
      }
      if (activeCategory === 'SERV') {
        return matchesSearch && p.isService;
      }
      return matchesSearch;
    });
  }, [products, searchTerm, activeCategory]);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || customers[0] || {
      id: '999999999',
      name: 'Consumidor Final',
      nif: '999999999',
      address: 'Consumidor Final',
      phone: '',
      email: ''
    };
  }, [customers, selectedCustomerId]);

  // Cart math
  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    cart.forEach((item) => {
      const lineBase = item.product.price * item.quantity;
      const lineDiscount = (lineBase * item.discount) / 100;
      const lineAfterDiscount = lineBase - lineDiscount;
      
      let lineTax = 0;
      if (item.product.taxType === 'IVA14') {
        // Calculate tax: if price is tax-inclusive:
        lineTax = lineAfterDiscount - (lineAfterDiscount / 1.14);
      }

      subtotal += lineAfterDiscount;
      taxTotal += lineTax;
      discountTotal += lineDiscount;
    });

    // Apply general discount
    const generalDiscountAmount = (subtotal * generalDiscount) / 100;
    const finalSubtotal = subtotal - generalDiscountAmount;
    discountTotal += generalDiscountAmount;

    // Recalculate tax if general discount affects base (typically pro-rated)
    const finalTaxTotal = taxTotal * (1 - generalDiscount / 100);
    
    // In Angola, withholding tax (Retenção na Fonte) is calculated on the taxable basis (Subtotal excluding IVA)
    const baseTributavel = finalSubtotal - finalTaxTotal;
    const withholdingTaxAmount = baseTributavel * (withholdingTaxRate / 100);
    const total = finalSubtotal - withholdingTaxAmount;

    return {
      subtotal: finalSubtotal + discountTotal - finalTaxTotal, // Net total
      discountTotal,
      taxTotal: finalTaxTotal,
      withholdingTaxAmount,
      total // Gross total after withholding tax deduction
    };
  }, [cart, generalDiscount, withholdingTaxRate]);

  // Add to cart
  const addToCart = (product: Product) => {
    if (!isShiftOpen) {
      setShowClosedShiftModal(true);
      return;
    }

    if (product.stock <= 0 && !product.isService) {
      alert(`Artigo ${product.name} sem stock disponível.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock && !product.isService) {
          alert(`Limite de stock atingido para ${product.name}`);
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  // Adjust cart item quantity
  const updateQuantity = (productId: string, delta: number) => {
    if (!isShiftOpen) {
      setShowClosedShiftModal(true);
      return;
    }

    setCart((prev) => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock && !item.product.isService) {
            alert(`Limite de stock atingido para ${item.product.name}`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    if (window.confirm('Tem a certeza que deseja cancelar a venda actual?')) {
      setCart([]);
      setGeneralDiscount(0);
      setInvoiceNotes('');
    }
  };

  // Finalize invoice emit
  const handleFinalizeEmission = () => {
    try {
      if (!isShiftOpen) {
        setShowClosedShiftModal(true);
        alert('Atenção: Não é possível emitir faturas com o turno de caixa FECHADO.');
        return;
      }

      if (cart.length === 0) {
        alert('O carrinho está vazio.');
        return;
      }

      const docDate = new Date().toISOString().slice(0, 10);
      const systemDate = new Date().toISOString();
      
      // Auto-generate invoice numbers
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const invoiceNo = `${invoiceType} VMAIS2026/${randomSeq}`;

      // Map cart items to invoice lines
      const items: InvoiceLine[] = cart.map(item => {
        const base = item.product.price * item.quantity;
        const lineDisc = (base * item.discount) / 100;
        const finalPrice = item.product.price - (item.product.price * item.discount / 100);
        const taxRate = item.product.taxType === 'IVA14' ? 14 : 0;
        
        const itemTotal = base - lineDisc;
        const taxAmount = taxRate > 0 ? (itemTotal - (itemTotal / 1.14)) : 0;

        return {
          productId: item.product.id,
          productName: item.product.name,
          productCode: item.product.code,
          quantity: item.quantity,
          price: item.product.price,
          discount: item.discount,
          taxRate,
          taxAmount,
          total: itemTotal
        };
      });

      // Hash generation using Private Key
      const { hash, hashControl } = signInvoice(
        docDate,
        systemDate,
        invoiceNo,
        cartTotals.total,
        lastInvoiceHash || '',
        keys?.privateKey || ''
      );

      const changeAmount = paymentMethod === 'Numerário' ? Math.max(0, (cashReceived || 0) - cartTotals.total) : 0;

      const newInvoice: Invoice = {
        id: Math.random().toString(36).substr(2, 9),
        invoiceNo,
        sequenceNumber: randomSeq,
        type: invoiceType,
        date: docDate,
        customer: selectedCustomer,
        items,
        subtotal: cartTotals.subtotal,
        discountTotal: cartTotals.discountTotal,
        taxTotal: cartTotals.taxTotal,
        total: cartTotals.total,
        withholdingTaxRate,
        withholdingTaxAmount: cartTotals.withholdingTaxAmount,
        paymentMethod,
        cashReceived: paymentMethod === 'Numerário' || paymentMethod === 'Misto' ? (cashReceived || 0) : undefined,
        cardReceived: paymentMethod === 'Misto' ? (cardReceived || 0) : undefined,
        changeAmount: paymentMethod === 'Numerário' ? changeAmount : undefined,
        paymentRef: paymentMethod === 'Multicaixa' || paymentMethod === 'Transferência' ? (paymentRef || '') : undefined,
        notes: invoiceNotes || '',
        operator: currentUser?.name || currentUser?.username || 'Operador',
        status: 'EMITIDO',
        hash,
        hashControl,
        previousHash: lastInvoiceHash || '',
        signedBy: keys?.certId || '320/AGT/2026'
      };

      onEmitInvoice(newInvoice);
      setIssuedInvoice(newInvoice);
      setIsCheckoutOpen(false);
      setCart([]);
      setGeneralDiscount(0);
      setWithholdingTaxRate(0);
      setInvoiceNotes('');
      setCashReceived(0);
      setCardReceived(0);
      setPaymentRef('');
    } catch (err: any) {
      console.error('Erro ao finalizar emissão:', err);
      alert('Erro ao finalizar emissão: ' + err.message);
    }
  };

  const formatKz = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' })
      .format(value)
      .replace('Kz', '')
      .trim() + ' Kz';
  };

  return (
    <div className="space-y-4">
      {/* CLOSED SHIFT WARNING BANNER */}
      {!isShiftOpen && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-rose-950 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shrink-0 shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs tracking-tight text-rose-950 flex items-center gap-2">
                <span>TURNO DE CAIXA FECHADO</span>
                <span className="bg-rose-200 text-rose-900 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Venda Bloqueada
                </span>
              </h4>
              <p className="text-xxs text-rose-800 leading-tight mt-0.5">
                Não é possível realizar vendas, adicionar artigos ao carrinho ou emitir faturas sem antes abrir o turno de caixa no módulo de Turnos.
              </p>
            </div>
          </div>
          <button
            id="btn-pos-open-shift"
            type="button"
            onClick={() => onNavigate('turnos')}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-2 shrink-0 shadow-md shadow-rose-600/20 cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
            Abrir Turno de Caixa
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:h-[calc(100vh-100px)] h-auto min-h-screen xl:min-h-0 animate-fadeIn" id="pos-root-container">
      {/* LEFT SIDEBAR: Cart and Summary Config */}
      <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden h-[620px] xl:h-full" id="pos-left-panel">
        
        {/* Company and Totals Card */}
        <div className="bg-brand text-white p-3.5 space-y-2.5" id="company-totals-card">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-white/80 uppercase font-bold tracking-wider">Empresa</p>
              <h3 className="font-bold text-sm">{company.name}</h3>
              <p className="text-[10px] text-white/80 font-mono">NIF: {company.nif}</p>
            </div>
            <span className="p-1.5 bg-white/20 rounded-lg">
              <Coins className="w-4 h-4" />
            </span>
          </div>

          <div className="border-t border-white/20 pt-2 grid grid-cols-2 gap-y-1 text-[11px]">
            <div className="text-white/80">Subtotal:</div>
            <div className="text-right font-mono">{formatKz(cartTotals.subtotal)}</div>
            <div className="text-white/80">IVA (14%):</div>
            <div className="text-right font-mono">{formatKz(cartTotals.taxTotal)}</div>
            <div className="text-white/80">Desconto Geral:</div>
            <div className="text-right font-mono">-{formatKz(cartTotals.discountTotal)}</div>
            <div className="text-white/80">Retenção ({withholdingTaxRate}%):</div>
            <div className="text-right font-mono">-{formatKz(cartTotals.withholdingTaxAmount || 0)}</div>
          </div>

          <div className="border-t border-white/30 pt-2 flex justify-between items-center">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-white/80 font-semibold block">Cliente Selecionado</span>
              <span className="font-bold text-xs tracking-tight truncate max-w-[180px] block">{selectedCustomer.name}</span>
            </div>
            <div className="text-right">
              <p className="text-xl font-black font-mono">{formatKz(cartTotals.total)}</p>
            </div>
          </div>
        </div>

        {/* SCROLLABLE CONTAINER FOR CART AND INPUTS */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-between" id="pos-scrollable-content-area">
          
          {/* CART ITEMS LIST */}
          {cart.length > 0 && (
            <div className="p-3 space-y-2.5" id="cart-items-wrapper">
              {cart.map((item) => {
                const lineTotal = (item.product.price * item.quantity) * (1 - item.discount / 100);
                return (
                  <div key={item.product.id} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-slate-200 transition duration-150">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-300 relative overflow-hidden shrink-0">
                        {item.product.imageUrl ? (
                          <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Package className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="text-[8px] font-bold text-brand bg-brand-light px-1.5 py-0.5 rounded uppercase">
                          {item.product.category || 'Geral'}
                        </span>
                        <h4 className="font-bold text-slate-800 text-xs truncate">{item.product.name}</h4>
                        <p className="text-[9.5px] text-slate-500 font-mono">
                          {formatKz(item.product.price)} x {item.quantity} {item.product.unit}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Qty adjustments */}
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                        <button 
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1 hover:bg-slate-100 text-slate-600 rounded-md transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1 hover:bg-slate-100 text-slate-600 rounded-md transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total & Trash */}
                      <div className="text-right min-w-[70px]">
                        <p className="text-xs font-bold text-slate-900 font-mono">{formatKz(lineTotal)}</p>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition duration-150"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* INPUTS AND INVOICE CONFIGURATION */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/60 space-y-3 mt-auto" id="pos-billing-inputs">
            {/* Customer Selection */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cartão Cliente / NIF</label>
              <CustomerSearchSelector
                id="pos-customer"
                customers={customers}
                value={selectedCustomerId}
                onChange={setSelectedCustomerId}
                onAddCustomer={onAddCustomer}
                placeholder="Pesquisar cliente por nome ou NIF..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Observação Geral da Fatura...</label>
              <input 
                type="text"
                id="pos-notes-input"
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="Ex: Mercadoria entregue no armazém..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* General Discount */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Desc. Geral %</label>
                <div className="relative">
                  <input 
                    type="number"
                    id="pos-discount-input"
                    min="0"
                    max="100"
                    value={generalDiscount || ''}
                    onChange={(e) => setGeneralDiscount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full pl-7 pr-1 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                  <Percent className="absolute left-2 top-2.5 w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* Retenção na Fonte */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Retenção %</label>
                <div className="relative">
                  <select
                    id="pos-withholding-select"
                    value={withholdingTaxRate}
                    onChange={(e) => setWithholdingTaxRate(Number(e.target.value))}
                    className="w-full pl-7 pr-1 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="0">Sem Ret.</option>
                    <option value="6.5">6.5% (Serv.)</option>
                  </select>
                  <Sliders className="absolute left-2 top-2.5 w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* General Payment term */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Vencimento</label>
                <div className="relative">
                  <select
                    id="pos-term-select"
                    value={paymentTerm}
                    onChange={(e) => setPaymentTerm(e.target.value)}
                    className="w-full pl-7 pr-1 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="Pronto Pagamento">Pronto</option>
                    <option value="30 Dias">30 Dias</option>
                    <option value="60 Dias">60 Dias</option>
                  </select>
                  <Clock className="absolute left-2 top-2.5 w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <button
                type="button"
                id="pos-btn-print-settings"
                onClick={() => setIsPrintSettingsOpen(true)}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
              >
                <Printer className="w-3.5 h-3.5 text-brand" />
                DEFINIÇÕES DE IMPRESSÃO
              </button>
            </div>
          </div>

        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="p-4 bg-white border-t border-slate-150 grid grid-cols-2 gap-2" id="pos-actions-bar">
          <button
            id="pos-btn-cancel"
            onClick={clearCart}
            disabled={cart.length === 0}
            className="py-3 px-4 bg-slate-50 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-100 transition disabled:opacity-50"
          >
            CANCELAR VENDA
          </button>
          <button
            id="pos-btn-checkout"
            onClick={() => {
              if (!isShiftOpen) {
                setShowClosedShiftModal(true);
                return;
              }
              setCashReceived(cartTotals.total);
              setCardReceived(0);
              setPaymentRef('');
              setIsCheckoutOpen(true);
            }}
            disabled={cart.length === 0}
            className="py-3 px-4 bg-brand text-white rounded-xl font-bold text-xs hover:bg-brand-dark transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            EMITIR DOCUMENTO
          </button>
        </div>

      </div>

      {/* RIGHT PANEL: Product Selection Grid */}
      <div className="xl:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between overflow-hidden h-[600px] xl:h-full" id="pos-right-panel">
        
        {/* Search Bar & Filters */}
        <div className="space-y-4" id="pos-search-area">
          <div className="relative">
            <input 
              type="text"
              id="pos-product-search"
              placeholder="Pesquisar por código ou descrição do artigo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand focus:border-brand transition"
            />
            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
          </div>

          <div className="flex gap-2">
            <span className="px-3 py-1.5 bg-brand-light text-brand text-xxs font-bold rounded-lg flex items-center gap-1.5">
              Filtro Ativo: Código / Nome
            </span>
          </div>
        </div>

        {/* PRODUCTS GRID */}
        <div className="flex-1 overflow-y-auto mt-3 pr-1 min-h-[150px]" id="pos-products-grid">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pb-3">
              {filteredProducts.map((p) => {
                const outOfStock = p.stock <= 0 && !p.isService;
                return (
                  <button
                    key={p.id}
                    id={`product-card-${p.code}`}
                    onClick={() => addToCart(p)}
                    disabled={outOfStock}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between h-[135px] transition group hover:-translate-y-0.5 ${
                      outOfStock 
                        ? 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-60' 
                        : 'bg-white border-gray-100 hover:border-brand-light hover:shadow-xs'
                    }`}
                  >
                    <div className="flex gap-2 items-start w-full">
                      <div className="flex-1 min-w-0">
                        {/* Category Header */}
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider truncate">
                            {p.isService ? 'SERVIÇO' : p.category || 'PRODUTO'}
                          </span>
                          {p.taxType === 'IVA14' && (
                            <span className="text-[8px] font-bold bg-brand-light text-brand px-1 py-0.2 rounded">
                              14%
                            </span>
                          )}
                        </div>
                        
                        {/* Name */}
                        <h4 className="font-bold text-gray-900 text-[11px] leading-tight mt-1 line-clamp-2 group-hover:text-brand transition">
                          {p.name}
                        </h4>
                      </div>

                      {/* Product Thumbnail image on POS card */}
                      <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 relative overflow-hidden shrink-0">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Package className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex justify-between items-end">
                      <div>
                        <p className="text-[9px] text-gray-400 font-mono">{p.code}</p>
                        <p className="text-xs font-extrabold text-gray-950 mt-0.5 font-mono">
                          {formatKz(p.price)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        {p.isService ? (
                          <span className="text-[8px] font-semibold text-brand bg-brand-light px-1.5 py-0.5 rounded-full">
                            Serviço
                          </span>
                        ) : (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            outOfStock 
                              ? 'bg-rose-50 text-rose-600' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            QTD DISP. {p.stock} {p.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* If search term is active, show the Quick Add square card at the end of the results */}
              {searchTerm.trim() !== '' && (
                <button
                  type="button"
                  onClick={openQuickAddProduct}
                  className="p-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand hover:bg-brand-light/10 flex flex-col items-center justify-center h-[135px] text-slate-400 hover:text-brand transition cursor-pointer group"
                  title="Cadastrar novo artigo na hora"
                >
                  <Plus className="w-8 h-8 stroke-[3] group-hover:scale-110 transition" />
                  <span className="text-[10px] font-black uppercase mt-1 tracking-wider text-slate-400 group-hover:text-brand">Cadastrar</span>
                </button>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-10 text-gray-400">
              <AlertCircle className="w-10 h-10 text-gray-300 mb-2" />
              <p className="font-semibold text-sm">Nenhum artigo encontrado</p>
              <p className="text-xs text-gray-400 mt-1 mb-6">Deseja cadastrar "{searchTerm}" agora sem sair da página?</p>
              
              <button
                type="button"
                onClick={openQuickAddProduct}
                className="w-[135px] h-[135px] bg-white border-2 border-dashed border-slate-300 hover:border-brand rounded-2xl flex flex-col items-center justify-center transition active:scale-95 group shadow-xxs cursor-pointer"
                title="Cadastrar artigo na hora"
              >
                <Plus className="w-12 h-12 text-slate-400 group-hover:text-brand transition stroke-[3]" />
                <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-brand mt-2 tracking-wider">Cadastrar</span>
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM CATEGORY SWITCHER */}
        <div className="border-t border-gray-100 pt-4 flex gap-2 overflow-x-auto" id="pos-category-tabs">
          <button
            id="tab-cat-all"
            onClick={() => setActiveCategory('ALL')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition ${
              activeCategory === 'ALL'
                ? 'bg-brand text-white shadow-sm'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            TODOS
          </button>
          <button
            id="tab-cat-prod"
            onClick={() => setActiveCategory('PROD')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition ${
              activeCategory === 'PROD'
                ? 'bg-brand text-white shadow-sm'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            PRODUTOS
          </button>
          <button
            id="tab-cat-serv"
            onClick={() => setActiveCategory('SERV')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition ${
              activeCategory === 'SERV'
                ? 'bg-brand text-white shadow-sm'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            SERVIÇOS
          </button>
        </div>

      </div>

      {/* CHECKOUT WIZARD MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-gray-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-md w-full p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-950">Confirmar Emissão de Documento</h3>
                <p className="text-xs text-gray-400">Selecione o tipo de fatura e o método de pagamento</p>
              </div>
              <button 
                id="btn-close-checkout"
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Document Type Selector */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Tipo de Documento</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    id="btn-type-ft"
                    onClick={() => setInvoiceType('FT')}
                    className={`py-2 px-2 border rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${
                      invoiceType === 'FT'
                        ? 'border-brand bg-brand-light text-brand'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold bg-brand-light px-1.5 py-0.5 rounded text-brand">FT</span>
                    Factura
                  </button>
                  <button
                    id="btn-type-fr"
                    onClick={() => setInvoiceType('FR')}
                    className={`py-2 px-2 border rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${
                      invoiceType === 'FR'
                        ? 'border-brand bg-brand-light text-brand'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold bg-brand-light px-1.5 py-0.5 rounded text-brand">FR</span>
                    Factura-Recibo
                  </button>
                  <button
                    id="btn-type-fp"
                    onClick={() => setInvoiceType('FP')}
                    className={`py-2 px-2 border rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 ${
                      invoiceType === 'FP'
                        ? 'border-purple-500 bg-purple-50/50 text-purple-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold bg-purple-600/10 px-1.5 py-0.5 rounded text-purple-800">FP</span>
                    Proforma
                  </button>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Método de Liquidação</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn-pay-cash"
                    onClick={() => {
                      setPaymentMethod('Numerário');
                      setCashReceived(cartTotals.total);
                    }}
                    className={`py-2.5 px-3 border rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      paymentMethod === 'Numerário'
                        ? 'border-brand bg-brand-light text-brand'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Coins className="w-4 h-4 text-brand" />
                    Numerário
                  </button>
                  <button
                    id="btn-pay-card"
                    onClick={() => {
                      setPaymentMethod('Multicaixa');
                      setPaymentRef('');
                    }}
                    className={`py-2.5 px-3 border rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      paymentMethod === 'Multicaixa'
                        ? 'border-brand bg-brand-light text-brand'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-brand" />
                    Multicaixa
                  </button>
                  <button
                    id="btn-pay-transfer"
                    onClick={() => {
                      setPaymentMethod('Transferência');
                      setPaymentRef('');
                    }}
                    className={`py-2.5 px-3 border rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      paymentMethod === 'Transferência'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-purple-600" />
                    Transferência
                  </button>
                  <button
                    id="btn-pay-mix"
                    onClick={() => {
                      setPaymentMethod('Misto');
                      setCashReceived(Math.round(cartTotals.total / 2));
                      setCardReceived(cartTotals.total - Math.round(cartTotals.total / 2));
                    }}
                    className={`py-2.5 px-3 border rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      paymentMethod === 'Misto'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Coins className="w-4 h-4 text-amber-600" />
                    Misto
                  </button>
                </div>
              </div>

              {/* Contextual Payment Details */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                {paymentMethod === 'Numerário' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Valor Recebido</label>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Em Dinheiro</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        id="checkout-cash-received"
                        value={cashReceived || ''}
                        onChange={(e) => setCashReceived(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-brand"
                        placeholder="Insira o valor entregue"
                        min="0"
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60">
                      <span className="font-semibold text-slate-500">Troco a entregar:</span>
                      <span className={`font-mono font-bold text-sm ${cashReceived >= cartTotals.total ? 'text-brand' : 'text-rose-500'}`}>
                        {formatKz(Math.max(0, cashReceived - cartTotals.total))}
                      </span>
                    </div>
                    {cashReceived < cartTotals.total && (
                      <p className="text-[9px] text-rose-500 font-semibold">
                        Aviso: Valor entregue é inferior ao total da venda!
                      </p>
                    )}
                  </div>
                )}

                {paymentMethod === 'Multicaixa' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Ref. Operação / ID do TPA</label>
                    <input
                      type="text"
                      id="checkout-payment-ref"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand"
                      placeholder="Ex: TPA983726 ou Ref. de Pagamento"
                    />
                    <p className="text-[9px] text-slate-400">Indique o número do comprovativo de pagamento do terminal.</p>
                  </div>
                )}

                {paymentMethod === 'Transferência' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">Ref. Transferência Bancária / Banco</label>
                    <input
                      type="text"
                      id="checkout-payment-ref"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: BAI-827364 ou BFA-Transf"
                    />
                    <p className="text-[9px] text-slate-400">Insira a referência ou o nome do banco de origem da transferência.</p>
                  </div>
                )}

                {paymentMethod === 'Misto' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pagar em Numerário</label>
                        <input
                          type="number"
                          id="checkout-cash-received"
                          value={cashReceived || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCashReceived(val);
                            setCardReceived(Math.max(0, cartTotals.total - val));
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="0,00 Kz"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pagar em Multicaixa</label>
                        <input
                          type="number"
                          id="checkout-card-received"
                          value={cardReceived || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCardReceived(val);
                            setCashReceived(Math.max(0, cartTotals.total - val));
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="0,00 Kz"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                      <span className="font-semibold text-slate-500">Total Distribuído:</span>
                      <span className={`font-mono font-bold ${(cashReceived + cardReceived) === cartTotals.total ? 'text-brand' : 'text-amber-600'}`}>
                        {formatKz(cashReceived + cardReceived)} de {formatKz(cartTotals.total)}
                      </span>
                    </div>
                    {(cashReceived + cardReceived) !== cartTotals.total && (
                      <p className="text-[9px] text-amber-600 font-semibold">
                        A distribuição foi recalculada automaticamente para somar exatamente o total de {formatKz(cartTotals.total)}.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Totals Breakdown in checkout */}
              <div className="px-1 text-xxs text-slate-500 space-y-1 my-2">
                <div className="flex justify-between">
                  <span>Subtotal Liquidado:</span>
                  <span className="font-mono font-semibold">{formatKz(cartTotals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Imposto (IVA 14%):</span>
                  <span className="font-mono font-semibold">{formatKz(cartTotals.taxTotal)}</span>
                </div>
                {withholdingTaxRate > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Retenção na Fonte ({withholdingTaxRate}%):</span>
                    <span className="font-mono font-bold">-{formatKz(cartTotals.withholdingTaxAmount || 0)}</span>
                  </div>
                )}
              </div>

              {/* Total Display */}
              <div className="p-4 bg-brand text-white rounded-2xl flex justify-between items-center shadow-md">
                <span className="text-xs font-bold">Valor Líquido a Pagar</span>
                <span className="text-xl font-black font-mono">
                  {formatKz(cartTotals.total)}
                </span>
              </div>
            </div>

            {/* Validation Banner if missing key */}
            {keys?.status !== 'Ativa' && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-[10px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Assinatura de Produção Ausente</span>
                  O sistema usará chaves criptográficas de teste padrão para gerar a assinatura digital obrigatória por lei da AGT.
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-checkout-back"
                onClick={() => setIsCheckoutOpen(false)}
                className="py-3 px-4 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition"
              >
                Voltar
              </button>
              <button
                id="btn-checkout-confirm"
                onClick={handleFinalizeEmission}
                disabled={!isShiftOpen}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm ${
                  !isShiftOpen
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                    : 'bg-brand text-white hover:bg-brand-dark cursor-pointer'
                }`}
              >
                <Check className="w-4 h-4" />
                {!isShiftOpen ? 'Turno Fechado (Bloqueado)' : 'Confirmar e Assinar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT PREVIEW OVERLAY */}
      {issuedInvoice && (() => {
        const docConf = getDocumentPrintFormat(issuedInvoice.type);
        return (
          <div className="fixed inset-0 z-50 bg-gray-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className={`bg-white rounded-3xl border border-gray-100 shadow-2xl w-full p-6 flex flex-col h-[90vh] transition-all duration-300 ${
              posPrintFormat === 'A4' ? 'max-w-4xl' : 'max-w-lg'
            }`}>
              
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-black text-gray-900 tracking-tight">Fatura Emitida com Sucesso</h3>
                  <p className="text-[10px] text-gray-400 font-medium">Assinado e autenticado conforme o regulamento da AGT</p>
                </div>
                <button 
                  id="btn-close-receipt"
                  onClick={() => setIssuedInvoice(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* FORMAT TOGGLE SELECTOR */}
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl my-3">
                <button
                  type="button"
                  onClick={() => setPosPrintFormat('Ticket')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
                    posPrintFormat === 'Ticket'
                      ? 'bg-white text-brand shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>FORMATO TICKET ({docConf.ticketSize || '58mm'})</span>
                  {docConf.format === 'Ticket' && (
                    <span className="text-[9px] bg-brand-light text-brand px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
                      Predefinido
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setPosPrintFormat('A4')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
                    posPrintFormat === 'A4'
                      ? 'bg-white text-brand shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>FOLHA COMPLETA (A4)</span>
                  {docConf.format === 'A4' && (
                    <span className="text-[9px] bg-brand-light text-brand px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
                      Predefinido
                    </span>
                  )}
                </button>
              </div>

              {/* DOCUMENT VIEW CONTAINER */}
              <div className="flex-1 overflow-y-auto my-1 bg-slate-50/80 p-4 rounded-2xl flex justify-center border border-slate-100">
                
                {/* 1. TICKET FORMAT VIEW */}
                {posPrintFormat === 'Ticket' && (
                  <div className="bg-white border border-gray-200 p-6 shadow-xs w-full max-w-[340px] font-mono text-[10px] text-gray-800 space-y-4" id="printed-receipt-view">
                    
                    {/* Header */}
                    <div className="text-center space-y-1">
                      {company.logoUrl && (
                        <img src={company.logoUrl} alt="Logo" className="max-h-12 max-w-[120px] object-contain mx-auto mb-1.5" />
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
                          {issuedInvoice.type === 'FR' ? 'FACTURA RECIBO' : issuedInvoice.type === 'FT' ? 'FACTURA' : issuedInvoice.type === 'FP' ? 'FATURA PROFORMA' : 'NOTA DE CRÉDITO'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>NÚMERO:</span>
                        <span className="font-bold">{issuedInvoice.invoiceNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DATA:</span>
                        <span>{issuedInvoice.date} 12:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>OPERADOR:</span>
                        <span>{issuedInvoice.operator || currentUser?.name || currentUser?.username || 'Operador'}</span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-300 my-2"></div>

                    {/* Customer */}
                    <div className="space-y-0.5">
                      <p className="font-bold">CLIENTE: {issuedInvoice.customer.name}</p>
                      <p>NIF: {issuedInvoice.customer.nif}</p>
                      {issuedInvoice.customer.address && <p>Endereço: {issuedInvoice.customer.address}</p>}
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
                        {issuedInvoice.items.map((line, idx) => (
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
                      <p>Subtotal: {formatKz(issuedInvoice.subtotal)}</p>
                      <p>Total IVA: {formatKz(issuedInvoice.taxTotal)}</p>
                      <p>Desconto Total: -{formatKz(issuedInvoice.discountTotal)}</p>
                      {issuedInvoice.withholdingTaxRate && issuedInvoice.withholdingTaxRate > 0 ? (
                        <p>Retenção ({issuedInvoice.withholdingTaxRate}%): -{formatKz(issuedInvoice.withholdingTaxAmount || 0)}</p>
                      ) : null}
                      <p className="font-extrabold text-xs text-gray-900 pt-1">
                        TOTAL PAGO: {formatKz(issuedInvoice.total)}
                      </p>
                      <p className="text-[9px] text-gray-500 font-bold">Método: {issuedInvoice.paymentMethod}</p>
                      
                      {issuedInvoice.paymentMethod === 'Numerário' && (
                        <div className="text-[9px] text-gray-600 space-y-0.5 mt-1 border-t border-dotted border-gray-200 pt-1">
                          <p>Valor Entregue: {formatKz(issuedInvoice.cashReceived ?? issuedInvoice.total)}</p>
                          <p className="font-bold text-gray-800">Troco: {formatKz(issuedInvoice.changeAmount ?? 0)}</p>
                        </div>
                      )}

                      {(issuedInvoice.paymentMethod === 'Multicaixa' || issuedInvoice.paymentMethod === 'Transferência') && issuedInvoice.paymentRef && (
                        <div className="text-[9px] text-gray-600 mt-1 border-t border-dotted border-gray-200 pt-1">
                          <p className="font-mono">Ref/Comprovativo: {issuedInvoice.paymentRef}</p>
                        </div>
                      )}

                      {issuedInvoice.paymentMethod === 'Misto' && (
                        <div className="text-[9px] text-gray-600 space-y-0.5 mt-1 border-t border-dotted border-gray-200 pt-1">
                          <p>Dinheiro (Cash): {formatKz(issuedInvoice.cashReceived ?? 0)}</p>
                          <p>Cartão (TPA): {formatKz(issuedInvoice.cardReceived ?? 0)}</p>
                        </div>
                      )}
                    </div>

                    {/* Bank Details on Ticket */}
                    <div className="space-y-1 text-[9px] leading-tight text-gray-600 my-2 pt-2 border-t border-dashed border-gray-200 text-left">
                      {company.bankAccounts && company.bankAccounts.length > 0 ? (
                        <div>
                          <p className="font-bold text-gray-700 uppercase tracking-wider text-[8px] mb-1">DADOS BANCÁRIOS:</p>
                          {company.bankAccounts.filter(acc => acc.isDefault || company.bankAccounts!.length === 1).map((acc) => (
                            <div key={acc.id} className="font-mono bg-gray-50 p-1 rounded border border-gray-100 my-1">
                              <p className="font-bold text-gray-800">{acc.bankName}</p>
                              <p>IBAN: {acc.iban}</p>
                              {acc.accountNumber && <p>CONTA: {acc.accountNumber}</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-amber-50 p-1.5 rounded border border-amber-200 text-center space-y-1">
                          <p className="font-bold text-amber-800 text-[8px] uppercase">Sem Dados Bancários!</p>
                          {onUpdateCompany && (
                            <button
                              type="button"
                              onClick={() => {
                                setQuickBankHolder(company.name || '');
                                setIsQuickBankOpen(true);
                              }}
                              className="w-full py-1 bg-amber-600 text-white text-[8px] font-bold rounded cursor-pointer"
                            >
                              + Cadastrar Coordenadas
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-dashed border-gray-300 my-2"></div>

                    {/* Encryption Audit and Signatures */}
                    <div className="space-y-1 text-center text-[8px] text-gray-500">
                      <p className="font-bold text-gray-700">ELEMENTO DE CONTROLO AGT</p>
                      <div className="bg-gray-100 p-1 rounded font-mono text-center text-[9px] text-gray-800 font-bold border border-gray-200">
                        Hash: {issuedInvoice.hashControl}
                      </div>
                      <p className="line-clamp-2 text-xxs font-mono">{issuedInvoice.hash}</p>
                      <p className="pt-2">
                        Processado por Programa Certificado nº {issuedInvoice.signedBy} / VENDA MAIS
                      </p>
                      {company.invoicingMode === 'electronic' ? (
                        <p className="font-bold text-brand bg-brand-light py-0.5 px-1 rounded border border-brand-light mt-1">
                          Transmissão AGT: Faturação Eletrónica (Tempo Real)
                        </p>
                      ) : (
                        <p className="font-bold text-slate-700 bg-slate-100 py-0.5 px-1 rounded border border-slate-200 mt-1">
                          Modo: Faturação por SAF-T (Assinatura Local)
                        </p>
                      )}
                      <p className="font-semibold text-gray-600 pt-1">Obrigado pela sua preferência!</p>
                    </div>

                  </div>
                )}

                {/* 2. A4 FORMAT VIEW */}
                {posPrintFormat === 'A4' && (
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
                      <div className={`${issuedInvoice.type === 'NC' ? 'bg-amber-900' : 'bg-slate-900'} text-white p-4 rounded-2xl text-right min-w-[240px] shadow-xs space-y-1.5`}>
                        <div className={`inline-block px-2.5 py-0.5 rounded-full font-black text-[10px] tracking-wider uppercase mb-1 ${issuedInvoice.type === 'NC' ? 'bg-amber-500 text-slate-950' : 'bg-brand text-white'}`}>
                          {issuedInvoice.type === 'NC' ? 'NOTA DE CRÉDITO' : issuedInvoice.type === 'FR' ? 'FACTURA RECIBO' : issuedInvoice.type === 'FT' ? 'FACTURA' : 'PROFORMA'}
                        </div>
                        <h3 className="text-lg font-black font-mono tracking-tight text-white">{issuedInvoice.invoiceNo}</h3>
                        <div className="text-[11px] text-slate-200 font-medium space-y-0.5">
                          <p>Data Emissão: <strong className="text-white font-mono">{issuedInvoice.date}</strong></p>
                          <p>Moeda: <strong className="text-white font-mono">AOA (Kz)</strong></p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Dados do Cliente / Adquirente</span>
                        <h4 className="font-extrabold text-sm text-slate-900">{issuedInvoice.customer?.name || 'Consumidor Final'}</h4>
                        <p className="text-slate-600 font-medium"><strong>NIF:</strong> {issuedInvoice.customer?.nif || '999999999'}</p>
                        {issuedInvoice.customer?.address && (
                          <p className="text-slate-600"><strong>Endereço:</strong> {issuedInvoice.customer.address}</p>
                        )}
                      </div>

                      <div className="space-y-1 text-right sm:text-left border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Detalhes de Liquidação</span>
                        <p className="text-slate-700 font-medium"><strong>Método de Pagamento:</strong> {issuedInvoice.paymentMethod}</p>
                        <p className="text-slate-700 font-medium"><strong>Operador:</strong> {issuedInvoice.operator || currentUser?.name || currentUser?.username || 'Operador'}</p>
                      </div>
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
                          {issuedInvoice.items.map((item, idx) => (
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
                      <div className="space-y-2 text-xxs text-slate-500 max-w-sm text-left">
                        <p><strong>Operador:</strong> {issuedInvoice.operator || currentUser?.name || currentUser?.username || 'Operador'}</p>
                        {issuedInvoice.notes && <p><strong>Observações:</strong> {issuedInvoice.notes}</p>}

                        {/* Bank details or Prompt to register */}
                        <div className="mt-4 border-t border-slate-150 pt-3">
                          {company.bankAccounts && company.bankAccounts.length > 0 ? (
                            <div className="space-y-1.5">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Coordenadas Bancárias para Pagamento</span>
                              {company.bankAccounts.filter(acc => acc.isDefault || company.bankAccounts!.length === 1).map((acc) => (
                                <div key={acc.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 space-y-0.5">
                                  <p className="font-bold text-slate-700">{acc.bankName} {acc.holderName ? `· ${acc.holderName}` : ''}</p>
                                  <p className="font-mono text-[10px] text-slate-900">IBAN: <strong>{acc.iban}</strong></p>
                                  {acc.accountNumber && <p className="text-slate-500">Nº Conta: {acc.accountNumber}</p>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-amber-50/50 border border-amber-200/55 p-3 rounded-xl space-y-1.5 flex flex-col items-start">
                              <p className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                Sem Coordenadas Bancárias
                              </p>
                              <p className="text-[9px] text-amber-700 leading-normal">
                                Seus dados bancários não estão configurados. Cadastre-os agora para aparecerem na fatura.
                              </p>
                              {onUpdateCompany && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuickBankHolder(company.name || '');
                                    setIsQuickBankOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition active:scale-95 cursor-pointer"
                                >
                                  + CADASTRAR AGORA
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-full sm:w-64 space-y-1.5 text-right bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="flex justify-between text-slate-600 font-medium">
                          <span>Subtotal Liquidado:</span>
                          <span className="font-mono">{formatKz(issuedInvoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 font-medium">
                          <span>Total Imposto (IVA 14%):</span>
                          <span className="font-mono">{formatKz(issuedInvoice.taxTotal)}</span>
                        </div>
                        {issuedInvoice.withholdingTaxRate && issuedInvoice.withholdingTaxRate > 0 ? (
                          <div className="flex justify-between text-rose-600 font-medium border-t border-slate-100 pt-1">
                            <span>Retenção ({issuedInvoice.withholdingTaxRate}%):</span>
                            <span className="font-mono">-{formatKz(issuedInvoice.withholdingTaxAmount || 0)}</span>
                          </div>
                        ) : null}
                        <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-slate-900">
                          <span>{issuedInvoice.type === 'FT' ? (issuedInvoice.linkedReceiptNo ? 'TOTAL PAGO:' : 'TOTAL A PAGAR:') : 'VALOR TOTAL:'}</span>
                          <span className="font-mono text-brand">{formatKz(issuedInvoice.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* AGT Certification and Signature Footer */}
                    <div className="border-t border-slate-200 pt-6 mt-6 space-y-2 text-center text-slate-400 text-xxs">
                      <div className="flex justify-center items-center gap-2 font-mono text-slate-700 bg-slate-100 py-1.5 px-3 rounded-lg w-max mx-auto border border-slate-200 font-bold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>{issuedInvoice.hashControl}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-500 font-normal truncate max-w-md">{issuedInvoice.hash}</span>
                      </div>
                      <p className="font-medium text-slate-500">
                        Processado por programa certificado n.º <strong>{issuedInvoice.signedBy}</strong> / VENDA MAIS (AGT Angola)
                      </p>
                      <p className="font-semibold text-slate-600">Obrigado pela sua preferência!</p>
                    </div>

                  </div>
                )}

              </div>

              {/* ACTION FOOTER */}
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  id="btn-print-receipt"
                  onClick={() => {
                    if (posPrintFormat === 'A4') {
                      printElement('printed-invoice-a4', '800px');
                    } else {
                      const width = docConf.ticketSize === '80mm' ? '420px' : docConf.ticketSize === '55mm' ? '280px' : '340px';
                      printElement('printed-receipt-view', width);
                    }
                  }}
                  className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-xl text-xs font-extrabold hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-brand-light" />
                  Imprimir Documento ({posPrintFormat})
                </button>
                <button
                  id="btn-finish-receipt"
                  onClick={() => setIssuedInvoice(null)}
                  className="py-3 px-6 bg-brand hover:bg-brand-dark text-white rounded-xl text-xs font-extrabold transition cursor-pointer shadow-xs"
                >
                  Nova Venda
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* CLOSED SHIFT MODAL OVERLAY */}
      {showClosedShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scaleUp">
            <div className="px-6 py-5 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">Venda Bloqueada - Turno Fechado</h3>
                  <p className="text-[10px] text-rose-100">Controlo fiscal e administrativo de caixa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClosedShiftModal(false)}
                className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-center">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-left space-y-1">
                <p className="text-xs font-black flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  Abertura de Turno Obrigatória
                </p>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Para efetuar qualquer operação de venda ou emissão de documento no POS, é necessário primeiro declarar a abertura do turno de caixa e o saldo inicial.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  id="btn-modal-open-shift"
                  type="button"
                  onClick={() => {
                    setShowClosedShiftModal(false);
                    onNavigate('turnos');
                  }}
                  className="w-full py-3 bg-brand hover:bg-brand-dark text-white font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  Ir para Gestão de Turnos & Abrir Caixa
                </button>
                <button
                  type="button"
                  onClick={() => setShowClosedShiftModal(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar / Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT SETTINGS MODAL */}
      <PrintSettingsModal
        isOpen={isPrintSettingsOpen}
        onClose={() => setIsPrintSettingsOpen(false)}
      />

      {/* QUICK ADD PRODUCT/SERVICE MODAL */}
      {isQuickProductOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-opacity duration-250 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 w-full max-w-lg shadow-2xl relative space-y-4 text-left">
            <button
              onClick={() => setIsQuickProductOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 transition text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-brand-light text-brand flex items-center justify-center">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Cadastrar Artigo na Hora</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adicionar novo produto ou serviço ao inventário</p>
              </div>
            </div>

            <form onSubmit={handleSaveQuickProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Tipo de Artigo</label>
                  <div className="grid grid-cols-2 gap-2 font-sans">
                    <button
                      type="button"
                      onClick={() => {
                        setQuickProductIsService(false);
                        setQuickProductStock(10);
                      }}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        !quickProductIsService
                          ? 'bg-brand/10 border-brand text-brand shadow-xxs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Produto
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickProductIsService(true);
                        setQuickProductStock(0);
                      }}
                      className={`py-2 text-xs font-bold rounded-xl border transition ${
                        quickProductIsService
                          ? 'bg-brand/10 border-brand text-brand shadow-xxs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Serviço
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Código de Barra / Ref *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 123456"
                    value={quickProductCode}
                    onChange={(e) => setQuickProductCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 font-sans">Descrição / Nome do Artigo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Teclado Mecânico"
                  value={quickProductName}
                  onChange={(e) => setQuickProductName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Preço de Venda *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    placeholder="Ex: 5000"
                    value={quickProductPrice || ''}
                    onChange={(e) => setQuickProductPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 font-sans">Taxa de IVA</label>
                  <select
                    value={quickProductTaxType}
                    onChange={(e) => setQuickProductTaxType(e.target.value as 'IVA14' | 'ISE')}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  >
                    <option value="IVA14">IVA 14%</option>
                    <option value="ISE">Isento (0%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 font-sans">Qtd em Stock</label>
                  <input
                    type="number"
                    required
                    disabled={quickProductIsService}
                    min="0"
                    placeholder="10"
                    value={quickProductIsService ? '' : quickProductStock}
                    onChange={(e) => setQuickProductStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand disabled:opacity-50 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 font-sans">Categoria</label>
                <select
                  value={quickProductCategory}
                  onChange={(e) => setQuickProductCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="INFORMÁTICA">INFORMÁTICA</option>
                  <option value="ESCRITÓRIO">ESCRITÓRIO</option>
                  <option value="BEBIDAS">BEBIDAS</option>
                  <option value="ALIMENTAÇÃO">ALIMENTAÇÃO</option>
                  <option value="SERVIÇOS GERAIS">SERVIÇOS GERAIS</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3 font-sans">
                <button
                  type="button"
                  onClick={() => setIsQuickProductOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  GRAVAR E ADICIONAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD BANK ACCOUNT MODAL */}
      {isQuickBankOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-opacity duration-250 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 w-full max-w-md shadow-2xl relative space-y-4 text-left">
            <button
              onClick={() => setIsQuickBankOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 transition text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-brand-light text-brand flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Cadastrar Dados Bancários</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adicionar conta para a fatura</p>
              </div>
            </div>

            <form onSubmit={handleSaveQuickBank} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Nome do Banco *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: BANCO BAI, BFA, BIC"
                  value={quickBankName}
                  onChange={(e) => setQuickBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand focus:border-brand transition font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 font-sans">IBAN *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: AO06..."
                  value={quickBankIban}
                  onChange={(e) => setQuickBankIban(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand focus:border-brand transition font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Nº da Conta</label>
                  <input
                    type="text"
                    placeholder="Opcional"
                    value={quickBankAccount}
                    onChange={(e) => setQuickBankAccount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand focus:border-brand transition font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 font-sans">Titular da Conta</label>
                  <input
                    type="text"
                    placeholder="Ex: Nome da Empresa"
                    value={quickBankHolder}
                    onChange={(e) => setQuickBankHolder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand focus:border-brand transition font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsQuickBankOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  GRAVAR CONTA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    </div>
  );
}
