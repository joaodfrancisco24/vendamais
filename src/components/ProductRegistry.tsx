/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  ArrowLeft, 
  Boxes, 
  Settings, 
  Info, 
  Package, 
  Tag,
  Printer,
  Warehouse
} from 'lucide-react';
import { Product } from '../types';
import { printElement } from '../utils/print';

interface ProductRegistryProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export default function ProductRegistry({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onNavigate
}: ProductRegistryProps) {
  // Navigation states inside inventory view
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const availableWarehouses = useMemo(() => {
    const cached = localStorage.getItem('vm_warehouses');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return [
      { id: 'wh1', name: 'Armazém Central (Sede)' },
      { id: 'wh2', name: 'Depósito Secundário (Viana)' },
      { id: 'wh3', name: 'Loja Principal (Showroom)' }
    ];
  }, [isFormOpen]);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('INFORMÁTICA');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [warehouseId, setWarehouseId] = useState('wh1');
  const [warehouseName, setWarehouseName] = useState('Armazém Central (Sede)');
  const [taxType, setTaxType] = useState<'IVA14' | 'ISE'>('IVA14');
  const [exemptionReason, setExemptionReason] = useState('Isento nos termos do Artigo 12.º do CIVA');
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [margin, setMargin] = useState<number>(30); // profit margin
  const [price, setPrice] = useState<number>(0); // calculated or entered selling price
  const [stock, setStock] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(2);
  const [maxStock, setMaxStock] = useState<number>(100);
  const [unit, setUnit] = useState('UN');
  const [isService, setIsService] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // Handle open form for brand new item
  const openNewForm = () => {
    setEditingProduct(null);
    setCode(Math.floor(100000 + Math.random() * 900000).toString());
    setName('');
    setCategory('INFORMÁTICA');
    setBrand('');
    setModel('');
    const defaultWh = availableWarehouses[0] || { id: 'wh1', name: 'Armazém Central (Sede)' };
    setWarehouseId(defaultWh.id);
    setWarehouseName(defaultWh.name);
    setTaxType('IVA14');
    setExemptionReason('Isento nos termos do Artigo 12.º do CIVA');
    setBuyPrice(0);
    setMargin(30);
    setPrice(0);
    setStock(10);
    setMinStock(2);
    setMaxStock(100);
    setUnit('UN');
    setIsService(false);
    setImageUrl('');
    setIsFormOpen(true);
  };

  // Handle open form to edit existing item
  const openEditForm = (prod: Product) => {
    setEditingProduct(prod);
    setCode(prod.code);
    setName(prod.name);
    setCategory(prod.category || 'INFORMÁTICA');
    setBrand(prod.brand || '');
    setModel(prod.model || '');
    const currentWhId = prod.warehouseId || availableWarehouses[0]?.id || 'wh1';
    const currentWh = availableWarehouses.find((w: any) => w.id === currentWhId);
    setWarehouseId(currentWhId);
    setWarehouseName(prod.warehouse || currentWh?.name || 'Armazém Central (Sede)');
    setTaxType(prod.taxType);
    setExemptionReason(prod.exemptionReason || 'Isento nos termos do Artigo 12.º do CIVA');
    setBuyPrice(prod.buyPrice);
    setMargin(prod.buyPrice > 0 ? Math.round(((prod.price - prod.buyPrice) / prod.buyPrice) * 100) : 30);
    setPrice(prod.price);
    setStock(prod.stock);
    setMinStock(prod.minStock);
    setMaxStock(prod.maxStock);
    setUnit(prod.unit);
    setIsService(!!prod.isService);
    setImageUrl(prod.imageUrl || '');
    setIsFormOpen(true);
  };

  // Pricing helper math
  const calculateSellingPrice = (cost: number, marginPct: number) => {
    const calculated = cost * (1 + marginPct / 100);
    setPrice(Number(calculated.toFixed(2)));
  };

  const handleBuyPriceChange = (val: number) => {
    setBuyPrice(val);
    calculateSellingPrice(val, margin);
  };

  const handleMarginChange = (val: number) => {
    setMargin(val);
    calculateSellingPrice(buyPrice, val);
  };

  const handleSellingPriceChange = (val: number) => {
    setPrice(val);
    if (buyPrice > 0) {
      setMargin(Math.round(((val - buyPrice) / buyPrice) * 100));
    }
  };

  // Form submission
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      alert('Por favor, preencha o Nome e o Código de barras do artigo.');
      return;
    }

    const payload: Product = {
      id: editingProduct ? editingProduct.id : Math.random().toString(36).substr(2, 9),
      code,
      name,
      category,
      brand,
      model,
      warehouseId,
      warehouse: warehouseName,
      price: price || 0,
      buyPrice: buyPrice || 0,
      taxType,
      exemptionReason: taxType === 'ISE' ? exemptionReason : undefined,
      stock: isService ? 0 : (stock || 0),
      minStock: minStock || 0,
      maxStock: maxStock || 0,
      unit,
      isService,
      imageUrl: imageUrl || undefined
    };

    if (editingProduct) {
      onUpdateProduct(payload);
      setToastMsg(`Artigo "${payload.name}" guardado com sucesso!`);
    } else {
      onAddProduct(payload);
      setToastMsg(`Novo artigo "${payload.name}" guardado com sucesso!`);
    }
    setTimeout(() => setToastMsg(null), 4000);
    setIsFormOpen(false);
  };

  const formatKz = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' })
      .format(value)
      .replace('Kz', '')
      .trim() + ' Kz';
  };

  // Derived calculations for visual form
  const computedIvaVal = useMemo(() => {
    if (taxType === 'IVA14') {
      return price - (price / 1.14);
    }
    return 0;
  }, [price, taxType]);

  const computedProfit = useMemo(() => {
    return price - buyPrice - computedIvaVal;
  }, [price, buyPrice, computedIvaVal]);

  return (
    <div className="space-y-6" id="product-registry-root">
      
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 animate-fadeIn shadow-xs">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <h4 className="font-extrabold text-xs">{toastMsg}</h4>
            <p className="text-xxs text-emerald-600">As alterações foram gravadas no sistema com sucesso.</p>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Cadastro de Produtos & Artigos</h1>
          <p className="text-sm text-gray-500">Gestão integrada do inventário e precificação para faturamento</p>
        </div>
        {!isFormOpen && (
          <div className="flex items-center gap-2">
            <button
              id="btn-print-inventory"
              onClick={() => printElement('printed-inventory-list', '900px')}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition flex items-center gap-2 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Imprimir Inventário
            </button>
            <button
              id="btn-add-product"
              onClick={openNewForm}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              CADASTRAR PRODUTO
            </button>
          </div>
        )}
      </div>

      {/* 1. EDITING/REGISTRATION FORM VIEW */}
      {isFormOpen ? (
        <form onSubmit={handleSave} className="space-y-6" id="product-entry-form">
          
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <Boxes className="w-4 h-4 text-emerald-600" />
              <span>{editingProduct ? 'EDITANDO ARTIGO:' : 'NOVO CADASTRO DE PRODUTO'}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                id="btn-form-close"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 transition"
              >
                Voltar
              </button>
              <button
                type="submit"
                id="btn-form-save"
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 shadow-xs"
              >
                <Check className="w-4 h-4" />
                GRAVAR
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left side: Main configuration fields */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* PRIMARY INFO */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">Informações Principais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Barcode/UPC */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Cód. Barra/UPC *</label>
                    <input 
                      type="text"
                      id="input-prod-code"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Ex: 560123456789"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nome do Produto *</label>
                    <input 
                      type="text"
                      id="input-prod-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Teclado Mecânico RGB Pro"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Category */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Categoria</label>
                    <select
                      id="select-prod-cat"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="INFORMÁTICA">INFORMÁTICA</option>
                      <option value="ESCRITÓRIO">ESCRITÓRIO</option>
                      <option value="BEBIDAS">BEBIDAS</option>
                      <option value="ALIMENTAÇÃO">ALIMENTAÇÃO</option>
                      <option value="SERVIÇOS GERAIS">SERVIÇOS GERAIS</option>
                    </select>
                  </div>

                  {/* Armazém / Depósito */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Armazém / Depósito</label>
                    <select
                      id="select-prod-warehouse"
                      value={warehouseId}
                      onChange={(e) => {
                        const selId = e.target.value;
                        setWarehouseId(selId);
                        const matchWh = availableWarehouses.find((w: any) => w.id === selId);
                        setWarehouseName(matchWh ? matchWh.name : 'Armazém Central');
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      {availableWarehouses.map((w: any) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Marca</label>
                    <input 
                      type="text"
                      id="input-prod-brand"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Ex: Logitech"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                    />
                  </div>

                  {/* Model */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Modelo</label>
                    <input 
                      type="text"
                      id="input-prod-model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Ex: MX Keys S"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tax Type */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Imposto</label>
                    <select
                      id="select-prod-tax"
                      value={taxType}
                      onChange={(e) => setTaxType(e.target.value as 'IVA14' | 'ISE')}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="IVA14">IVA Normal (14%)</option>
                      <option value="ISE">Isento de IVA (0%)</option>
                    </select>
                  </div>

                  {/* Tax Percentage read-only */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Taxa (%)</label>
                    <input 
                      type="text"
                      readOnly
                      value={taxType === 'IVA14' ? '14,00 %' : '0,00 %'}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-500 font-semibold"
                    />
                  </div>
                </div>

                {/* Exemption fields (shown only if exempt) */}
                {taxType === 'ISE' && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-amber-800 uppercase block mb-1">Motivo de Isenção (SAF-T / AGT)</label>
                      <select
                        id="select-prod-exemption"
                        value={exemptionReason}
                        onChange={(e) => setExemptionReason(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="Isento nos termos do Artigo 12.º do CIVA">Isento nos termos do Artigo 12.º do CIVA (Cesta Básica)</option>
                        <option value="Isento nos termos do Artigo 13.º do CIVA">Isento nos termos do Artigo 13.º do CIVA (Serviços Médicos)</option>
                        <option value="Regime de Exclusão nos termos do Artigo 15.º do CIVA">Regime de Exclusão nos termos do Artigo 15.º do CIVA</option>
                        <option value="Isenção Geral de Microempresas">Isenção Geral de Microempresas (Simplificado)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-amber-800 uppercase block mb-1">Descrição Detalhada na Fatura</label>
                      <textarea
                        rows={2}
                        readOnly
                        value={exemptionReason}
                        className="w-full p-2 bg-white border border-amber-200 rounded-lg text-xs text-amber-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* PRICING AND INVENTORY */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">Precificação & Inventário</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Purchase cost */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Custo Compra (Kz)</label>
                    <input 
                      type="number"
                      id="input-prod-buy"
                      value={buyPrice || ''}
                      onChange={(e) => handleBuyPriceChange(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:bg-white"
                    />
                  </div>

                  {/* Margin */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Margem Lucro (%)</label>
                    <input 
                      type="number"
                      id="input-prod-margin"
                      value={margin || ''}
                      onChange={(e) => handleMarginChange(Number(e.target.value))}
                      placeholder="30"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                    />
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Preço de Venda Final (Kz) *</label>
                    <input 
                      type="number"
                      id="input-prod-price"
                      required
                      value={price || ''}
                      onChange={(e) => handleSellingPriceChange(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-emerald-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Sub-calculated fields in Kz */}
                <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-4 text-xs">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Valor IVA Incorporado</span>
                    <span className="text-sm font-extrabold text-brand font-mono block mt-1">
                      {formatKz(computedIvaVal)}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Lucro Bruto Estimado</span>
                    <span className="text-sm font-extrabold text-emerald-600 font-mono block mt-1">
                      {formatKz(computedProfit)}
                    </span>
                  </div>
                </div>

                {/* Stocks */}
                {!isService && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-gray-50 pt-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Stock Actual</label>
                      <input 
                        type="number"
                        id="input-prod-stock"
                        value={stock || ''}
                        onChange={(e) => setStock(Number(e.target.value))}
                        placeholder="10"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Stock Mínimo</label>
                      <input 
                        type="number"
                        id="input-prod-min"
                        value={minStock || ''}
                        onChange={(e) => setMinStock(Number(e.target.value))}
                        placeholder="2"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Stock Máximo</label>
                      <input 
                        type="number"
                        id="input-prod-max"
                        value={maxStock || ''}
                        onChange={(e) => setMaxStock(Number(e.target.value))}
                        placeholder="100"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Unidade</label>
                      <select
                        id="select-prod-unit"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="UN">Unidade (UN)</option>
                        <option value="KG">Kilograma (KG)</option>
                        <option value="L">Litro (L)</option>
                        <option value="M">Metro (M)</option>
                        <option value="M2">Metro Quadrado (M²)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right side: Auxiliary boxes & toggles */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Image box */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-full text-left">Imagem do Artigo</h4>
                
                <div className="w-full h-56 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200 text-gray-300 relative overflow-hidden">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Imagem do Produto" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <Package className="w-12 h-12 text-gray-300" />
                      <span className="text-[10px] text-gray-400">Sem imagem</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 text-[8px] font-semibold text-gray-400 bg-white/95 border border-gray-100 px-2 py-0.5 rounded-full shadow-xxs">
                    {imageUrl ? 'Imagem Ativa' : 'Sem Imagem'}
                  </span>
                </div>
                
                <div className="w-full space-y-2">
                  <label className="cursor-pointer inline-flex items-center justify-center w-full px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100 hover:bg-emerald-100 transition shadow-xxs">
                    <span>Carregar Foto</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            alert('A imagem é muito grande. Escolha uma imagem de até 2MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setImageUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="h-[1px] bg-gray-100 flex-1"></span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">Ou URL da imagem</span>
                    <span className="h-[1px] bg-gray-100 flex-1"></span>
                  </div>

                  <input 
                    type="text" 
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem.png"
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-[10px] focus:outline-none focus:bg-white text-center"
                  />

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-700 block mx-auto pt-1"
                    >
                      Remover Imagem
                    </button>
                  )}
                </div>
              </div>

              {/* Extra restriction settings */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">Configurações & Restrições</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input 
                      type="checkbox"
                      id="chk-prod-service"
                      checked={isService}
                      onChange={(e) => setIsService(e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Serviço (Isento de stock)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer opacity-50">
                    <input type="checkbox" readOnly checked={false} className="rounded border-gray-300 w-4 h-4" />
                    <span>Lucro Part.</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer opacity-50">
                    <input type="checkbox" readOnly checked={false} className="rounded border-gray-300 w-4 h-4" />
                    <span>Balança Peso</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer opacity-50">
                    <input type="checkbox" readOnly checked={false} className="rounded border-gray-300 w-4 h-4" />
                    <span>Bloquear Artigo</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer opacity-50">
                    <input type="checkbox" readOnly checked={false} className="rounded border-gray-300 w-4 h-4" />
                    <span>Venda Personalizada</span>
                  </label>
                </div>
              </div>

            </div>

          </div>

        </form>
      ) : (
        /* 2. MAIN INVENTORY TABLE VIEW */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden" id="printed-inventory-list">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Lista de Artigos Registrados ({products.length})</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100/60 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Cód / Código de barras</th>
                  <th className="p-4">Descrição do Artigo</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Armazém / Depósito</th>
                  <th className="p-4 text-right">Preço de Venda</th>
                  <th className="p-4 text-center">Imposto</th>
                  <th className="p-4 text-center">Disponível</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition duration-150">
                    <td className="p-4 font-mono font-bold text-gray-900">{p.code}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0 shadow-xxs" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                            <Package className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-800">{p.name}</p>
                          {p.brand || p.model ? (
                            <p className="text-[10px] text-gray-400">{p.brand} {p.model}</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold uppercase">
                        {p.category || 'Geral'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 w-max border border-slate-200/80">
                        <Warehouse className="w-3 h-3 text-slate-500 shrink-0" />
                        {p.warehouse || 'Armazém Central'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-gray-900 font-mono">
                      {formatKz(p.price)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.taxType === 'IVA14' 
                          ? 'bg-brand-light text-brand border border-brand-light' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {p.taxType === 'IVA14' ? 'IVA 14%' : 'ISENTO'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {p.isService ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Serviço
                        </span>
                      ) : (
                        <span className={`font-mono font-bold ${
                          p.stock <= p.minStock ? 'text-rose-600 font-extrabold' : 'text-gray-700'
                        }`}>
                          {p.stock} {p.unit}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          id={`btn-edit-prod-${p.code}`}
                          onClick={() => openEditForm(p)}
                          className="p-1.5 bg-brand-light text-brand rounded-lg hover:bg-brand-light/80 transition"
                          title="Editar Artigo"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-del-prod-${p.code}`}
                          onClick={() => {
                            if (window.confirm(`Tem a certeza que deseja eliminar o artigo "${p.name}"?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition"
                          title="Eliminar Artigo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
