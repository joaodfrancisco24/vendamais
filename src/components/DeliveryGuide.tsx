import React, { useState } from 'react';
import { Truck, Users, PlusCircle, Trash2, Calendar, FileText, CheckCircle2, ChevronRight, MapPin, Printer, History, Search, Eye, ArrowLeft, ShieldAlert } from 'lucide-react';
import { Product, Customer, CompanyConfig } from '../types';
import { printElement } from '../utils/print';
import CustomerSearchSelector from './CustomerSearchSelector';

interface DeliveryGuideProps {
  products: Product[];
  customers: Customer[];
  company: CompanyConfig;
  onAddCustomer?: (customer: Customer) => void;
  guideType?: 'remessa' | 'transporte';
  key?: React.Key;
}

interface GuideItem {
  product: Product;
  quantity: number;
}

export default function DeliveryGuide({ products, customers, company, onAddCustomer, guideType = 'remessa' }: DeliveryGuideProps) {
  const isTransport = guideType === 'transporte';
  const labelDocSingular = isTransport ? 'Guia de Transporte' : 'Guia de Remessa';
  const prefixDoc = isTransport ? 'GT' : 'GR';
  const storageSeqKey = isTransport ? 'transport_guide_seq' : 'delivery_guide_seq';
  const storageGuidesKey = isTransport ? 'saved_transport_guides' : 'saved_delivery_guides';

  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [deleteConfirmGuide, setDeleteConfirmGuide] = useState<any | null>(null);
  
  const [guideSeq, setGuideSeq] = useState(() => {
    const saved = localStorage.getItem(storageSeqKey);
    return saved ? parseInt(saved, 10) : 24;
  });

  const generateGuideNo = (seq: number) => `${prefixDoc} 04P2026/${seq}`;

  const [guideNumber, setGuideNumber] = useState(() => generateGuideNo(guideSeq));
  const [vRef, setVRef] = useState(() => generateGuideNo(guideSeq));
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('----------');
  
  const [driverName, setDriverName] = useState('Mateus da Silva Mandinga');
  const [plateNumber, setPlateNumber] = useState('LD-88-22-AA');
  
  const [loadingDateTime, setLoadingDateTime] = useState(`${new Date().toISOString().split('T')[0]} - 10:35`);
  const [unloadingDateTime, setUnloadingDateTime] = useState(`${new Date().toISOString().split('T')[0]} - 11:30`);
  const [loadingPlace, setLoadingPlace] = useState(company.address || 'Belas Business Park, Talatona');

  const initialCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];
  const [unloadingPlace, setUnloadingPlace] = useState(
    initialCustomer?.address || 'Av. Che Guevara 189 / 195, 3543 / 3245 Luanda, Angola'
  );
  
  const [observations, setObservations] = useState('');
  
  const [cartItems, setCartItems] = useState<GuideItem[]>(() => {
    if (products.length > 0) {
      return [{ product: products[0], quantity: 2 }];
    }
    return [];
  });
  
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [qty, setQty] = useState(1);
  const [issuedGuide, setIssuedGuide] = useState<any | null>(null);

  const [savedGuides, setSavedGuides] = useState<any[]>(() => {
    const saved = localStorage.getItem(storageGuidesKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [searchTerm, setSearchTerm] = useState('');

  const handleGuideNumberChange = (val: string) => {
    if (vRef === guideNumber) {
      setVRef(val);
    }
    setGuideNumber(val);
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const selected = customers.find(c => c.id === customerId);
    if (selected && selected.address) {
      setUnloadingPlace(selected.address);
    }
  };

  const addItem = () => {
    const prod = products.find(p => p.id === selectedProdId);
    if (!prod) return;
    
    const existing = cartItems.find(item => item.product.id === prod.id);
    if (existing) {
      setCartItems(cartItems.map(item => 
        item.product.id === prod.id ? { ...item, quantity: item.quantity + qty } : item
      ));
    } else {
      setCartItems([...cartItems, { product: prod, quantity: qty }]);
    }
    setQty(1);
  };

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.product.id !== id));
  };

  const handleEmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    const customer = customers.find(c => c.id === selectedCustomerId) || customers[0] || {
      id: '5410002547',
      name: 'SISTEC',
      nif: '5410002547',
      address: 'Av. Che Guevara 189 / 195, 3543 / 3245 Luanda',
      phone: '923000111',
      email: 'geral@sistec.co.ao'
    };
    
    const hash = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const newGuide = {
      id: Date.now().toString(),
      guideNumber,
      vRef,
      issueDate,
      dueDate,
      customer,
      driverName,
      plateNumber,
      loadingDateTime,
      unloadingDateTime,
      loadingPlace,
      unloadingPlace,
      observations,
      items: [...cartItems],
      createdAt: new Date().toISOString(),
      hash,
    };

    // Increment guide sequence for next guide emission
    const nextSeq = guideSeq + 1;
    setGuideSeq(nextSeq);
    localStorage.setItem(storageSeqKey, nextSeq.toString());

    // Save to history
    const updatedGuides = [newGuide, ...savedGuides];
    setSavedGuides(updatedGuides);
    localStorage.setItem(storageGuidesKey, JSON.stringify(updatedGuides));

    setIssuedGuide(newGuide);
  };

  const handleEmitNewGuide = () => {
    const nextNumber = generateGuideNo(guideSeq);
    setGuideNumber(nextNumber);
    setVRef(nextNumber);
    setIssuedGuide(null);
  };

  const handleDeleteGuide = (guide: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmGuide(guide);
  };

  const handleConfirmDeleteGuide = () => {
    if (deleteConfirmGuide) {
      const updated = savedGuides.filter(g => g.id !== deleteConfirmGuide.id);
      setSavedGuides(updated);
      localStorage.setItem(storageGuidesKey, JSON.stringify(updated));
      setDeleteConfirmGuide(null);
    }
  };

  const filteredGuides = savedGuides.filter(g => 
    g.guideNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.customer?.nif?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fadeIn" id="delivery-guide-root">
      {/* Title */}
      <div className="border-b border-slate-100 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">{labelDocSingular}</h1>
          <p className="text-sm text-slate-500">Emissão e consulta de documentos de circulação de mercadorias no formato oficial AGT</p>
        </div>

        {!issuedGuide && (
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-white text-brand shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Emitir Novo Documento
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-brand shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              Histórico de Documentos ({savedGuides.length})
            </button>
          </div>
        )}
      </div>

      {!issuedGuide ? (
        activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Creation form */}
          <form onSubmit={handleEmit} className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck className="w-4 h-4 text-brand" />
              Emitir Nova {labelDocSingular} (AGT)
            </h3>

            {/* Step 1: Customer & Transport details */}
            <div className="space-y-4">
              <span className="text-[10px] font-black text-brand bg-brand-light px-2 py-0.5 rounded uppercase tracking-wider">
                1. Identificação do Documento e Destinatário
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* N.º da Guia */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">N.º {labelDocSingular} *</label>
                  <input
                    type="text"
                    required
                    value={guideNumber}
                    onChange={(e) => handleGuideNumberChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>

                {/* V/ Ref */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">V/ Ref. *</label>
                  <input
                    type="text"
                    required
                    value={vRef}
                    onChange={(e) => setVRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>

                {/* Data de Emissão */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Data de Emissão *</label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                    />
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Cliente Destinatário */}
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Destinatário (Cliente / Empresa) *</label>
                  <CustomerSearchSelector
                    id="guide-customer-select"
                    customers={customers}
                    value={selectedCustomerId}
                    onChange={handleCustomerChange}
                    onAddCustomer={(c) => {
                      if (onAddCustomer) {
                        onAddCustomer(c);
                      }
                      handleCustomerChange(c.id);
                    }}
                    placeholder="Pesquisar ou adicionar cliente..."
                  />
                </div>

                {/* Motorista */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Motorista Responsável</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                    placeholder="Nome do motorista"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Dados de Transporte (Carga / Descarga) */}
            <div className="space-y-4">
              <span className="text-[10px] font-black text-brand bg-brand-light px-2 py-0.5 rounded uppercase tracking-wider">
                2. Dados de Transporte (Carga e Descarga)
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {/* Local e Data de Carga */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase block flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand" /> Ponto de Carga (Origem)
                  </label>
                  <input
                    type="text"
                    required
                    value={loadingPlace}
                    onChange={(e) => setLoadingPlace(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                    placeholder="Endereço de Carga"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Data/Hora Carga:</span>
                    <input
                      type="text"
                      value={loadingDateTime}
                      onChange={(e) => setLoadingDateTime(e.target.value)}
                      className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-none"
                      placeholder="2026-07-20 - 10:35"
                    />
                  </div>
                </div>

                {/* Local e Data de Descarga */}
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase block flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> Ponto de Descarga (Destino)
                  </label>
                  <input
                    type="text"
                    required
                    value={unloadingPlace}
                    onChange={(e) => setUnloadingPlace(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                    placeholder="Endereço de Descarga"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Data/Hora Descarga:</span>
                    <input
                      type="text"
                      value={unloadingDateTime}
                      onChange={(e) => setUnloadingDateTime(e.target.value)}
                      className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 focus:outline-none"
                      placeholder="2026-07-20 - 11:30"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Observações / Equipamentos / Modems */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-brand bg-brand-light px-2 py-0.5 rounded uppercase tracking-wider">
                3. Observações / Equipamentos / Números de Série
              </span>
              <textarea
                rows={4}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand leading-relaxed"
                placeholder="Insira as observações, números de série dos modems, rádios, equipamentos ou detalhes da encomenda..."
              />
            </div>

            {/* Step 4: Articles List */}
            <div className="space-y-4">
              <span className="text-[10px] font-black text-brand bg-brand-light px-2 py-0.5 rounded uppercase tracking-wider">
                4. Artigos / Equipamentos na Guia
              </span>
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <select
                    value={selectedProdId}
                    onChange={(e) => setSelectedProdId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.code || p.id}] {p.name} (Stock: {p.stock} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-center focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-dark transition flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Incluir
                </button>
              </div>

              {/* Table of added items */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase">
                      <th className="p-3">Código</th>
                      <th className="p-3">Descrição do Artigo</th>
                      <th className="p-3 text-center">Unidade</th>
                      <th className="p-3 text-center">Qtd.</th>
                      <th className="p-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.length > 0 ? (
                      cartItems.map((item) => (
                        <tr key={item.product.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-slate-700">{item.product.code || item.product.id}</td>
                          <td className="p-3 font-bold text-slate-800">{item.product.name}</td>
                          <td className="p-3 text-center text-slate-500">{item.product.unit || 'Uni.'}</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-900">{item.quantity}</td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.product.id)}
                              className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          Nenhum artigo adicionado à {labelDocSingular} ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 flex justify-end">
              <button
                type="submit"
                disabled={cartItems.length === 0}
                className="px-6 py-3 bg-brand text-white font-black text-xs rounded-xl hover:bg-brand-dark transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                GERAR {labelDocSingular.toUpperCase()} (MODELO OFICIAL)
              </button>
            </div>
          </form>

          {/* Right column - compliance details */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-brand" />
                {labelDocSingular} Oficial
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Este documento segue rigorosamente o layout e campos legais utilizados em Angola para acompanhamento de mercadorias em circulação (SISTEC / ITECMA).
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex gap-3 text-xs">
                  <ChevronRight className="w-4 h-4 text-brand-light flex-shrink-0 mt-0.5" />
                  <p className="text-slate-400"><strong className="text-slate-200">Cabeçalho Completo:</strong> Dados do emitente, NIF, contactos e cliente destinatário.</p>
                </div>
                <div className="flex gap-3 text-xs">
                  <ChevronRight className="w-4 h-4 text-brand-light flex-shrink-0 mt-0.5" />
                  <p className="text-slate-400"><strong className="text-slate-200">Campos de Transporte:</strong> Registo exato de Carga e Descarga com data e hora.</p>
                </div>
                <div className="flex gap-3 text-xs">
                  <ChevronRight className="w-4 h-4 text-brand-light flex-shrink-0 mt-0.5" />
                  <p className="text-slate-400"><strong className="text-slate-200">Bloco de Assinaturas:</strong> Espaço para assinaturas de Entreguei e Recebi com carimbo.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        ) : (
          /* History View */
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-brand" />
                  Guias de Remessa Emitidas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Histórico completo de guias geradas no sistema com opção de reimpressão</p>
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar por N.º, Cliente ou NIF..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Guides Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase">
                    <th className="p-3">N.º Guia</th>
                    <th className="p-3">Data Emissão</th>
                    <th className="p-3">Cliente / Destinatário</th>
                    <th className="p-3">NIF</th>
                    <th className="p-3 text-center">Qtd. Artigos</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGuides.length > 0 ? (
                    filteredGuides.map((guide) => (
                      <tr key={guide.id || guide.guideNumber} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-mono font-bold text-brand">{guide.guideNumber}</td>
                        <td className="p-3 text-slate-600 font-medium">{guide.issueDate}</td>
                        <td className="p-3 font-bold text-slate-800">{guide.customer?.name}</td>
                        <td className="p-3 font-mono text-slate-500">{guide.customer?.nif}</td>
                        <td className="p-3 text-center font-bold text-slate-700">
                          {guide.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIssuedGuide(guide)}
                              className="px-3 py-1.5 bg-brand-light text-brand font-bold text-xs rounded-lg hover:bg-brand hover:text-white transition flex items-center gap-1 cursor-pointer"
                              title="Visualizar e Imprimir"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Visualizar / Imprimir
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteGuide(guide.id, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Remover do histórico"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        {searchTerm ? 'Nenhuma guia encontrada para a pesquisa.' : `Nenhuma ${labelDocSingular.toLowerCase()} emitida ainda.`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Issued Guide document layout view - faithful replica of uploaded physical paper document */
        <div className="space-y-6 animate-scaleUp">
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-3xl flex justify-between items-center shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{labelDocSingular} ({issuedGuide.guideNumber})</h4>
                <p className="text-xs text-slate-500">Documento pronto para impressão e acompanhamento de transporte rodoviário.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                id="btn-print-delivery-guide"
                type="button"
                onClick={() => printElement('printed-delivery-guide', '800px')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimir Documento
              </button>
              <button
                id="btn-emit-new-guide"
                type="button"
                onClick={handleEmitNewGuide}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Emitir Nova Guia
              </button>
              {savedGuides.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIssuedGuide(null);
                    setActiveTab('history');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar ao Histórico
                </button>
              )}
            </div>
          </div>

          {/* Legal document print format replica matching uploaded image */}
          <div 
            id="printed-delivery-guide" 
            className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden max-w-3xl mx-auto font-sans p-8 md:p-12 text-slate-900 space-y-6 relative"
            style={{ color: '#000000', backgroundColor: '#ffffff' }}
          >
            {/* 1. Header (Company Left, Customer Right) */}
            <div className="flex justify-between items-start pt-2">
              {/* Company Info Left */}
              <div className="space-y-0.5 text-xs">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt={company.name} className="max-h-14 max-w-[200px] object-contain mb-2" />
                ) : (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center gap-0.5 justify-center font-black text-xs">
                      IT
                    </div>
                    <div>
                      <h2 className="font-black text-sm tracking-wide text-black uppercase leading-tight">{company.name || 'IITECMA, LDA'}</h2>
                      <p className="text-[10px] font-bold text-slate-600 tracking-wider uppercase">INTERNET SEM LIMITES</p>
                    </div>
                  </div>
                )}
                
                <p className="font-bold text-black uppercase">{company.name || 'IITECMA, LDA'}</p>
                <p className="font-extrabold text-[11px] text-slate-700 tracking-wider">INTERNET SEM LIMITES</p>
                <p className="text-slate-700">{company.address || 'Belas Business Park'}</p>
                <p className="text-slate-700">{company.city || 'talatona'}</p>
                <p className="text-slate-700"><strong className="text-black">Contribuinte:</strong> {company.nif || '5417292109'}</p>
                <p className="text-slate-700"><strong className="text-black">Website:</strong> www.itecma.co.ao</p>
                <p className="text-slate-700"><strong className="text-black">E-mail:</strong> {company.email || 'geral@itecma.co.ao'}</p>
                <p className="text-slate-700"><strong className="text-black">Tel:</strong> {company.phone || '922 573 580 - 991 226 020'}</p>
              </div>

              {/* Customer Info & Copy Status Right */}
              <div className="text-right space-y-4">
                <span className="text-[11px] font-semibold text-slate-600 block">Original</span>
                <div className="text-left text-xs space-y-0.5 min-w-[200px] border-l-2 border-slate-200 pl-4 py-1">
                  <p className="font-black text-sm text-black uppercase">{issuedGuide.customer.name}</p>
                  <p className="text-slate-800 font-medium">{issuedGuide.customer.address || 'Av. Che Guevara 189 / 195'}</p>
                  <p className="text-slate-800 font-medium">{issuedGuide.customer.city || '3543 / 3245 luanda'}</p>
                  <p className="text-slate-800 font-medium">{issuedGuide.customer.country || 'Angola'}</p>
                </div>
              </div>
            </div>

            {/* 2. Document Title */}
            <div className="pt-4">
              <h3 className="font-black text-base text-black tracking-tight">
                {labelDocSingular} n.º {issuedGuide.guideNumber}
              </h3>
            </div>

            {/* 3. Metadata Table (4 Columns with top and bottom lines) */}
            <div className="border-t border-b border-slate-900 py-2 my-2 text-xs grid grid-cols-4 gap-4 items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-800 block">Data de Emissão</span>
                <span className="font-medium text-slate-900 block mt-1">{issuedGuide.issueDate}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-800 block">Vencimento</span>
                <span className="font-medium text-slate-900 block mt-1">{issuedGuide.dueDate || '----------'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-800 block">Contribuinte</span>
                <span className="font-medium text-slate-900 block mt-1">{issuedGuide.customer.nif}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-800 block">V/ Ref.</span>
                <span className="font-medium text-slate-900 block mt-1">{issuedGuide.vRef}</span>
              </div>
            </div>

            {/* 4. Observações */}
            {issuedGuide.observations && (
              <div className="text-xs space-y-1 pt-1">
                <p className="font-bold text-black">Observações:</p>
                <div className="whitespace-pre-line text-slate-800 leading-relaxed font-mono text-[11px] pl-1">
                  {issuedGuide.observations}
                </div>
              </div>
            )}

            {/* 5. Dados de Transporte */}
            <div className="pt-4 space-y-2">
              <div className="border-t border-slate-900 pt-2">
                <h4 className="font-black text-xs text-black uppercase tracking-wider mb-2">Dados de Transporte</h4>
              </div>

              <div className="grid grid-cols-2 gap-8 text-xs">
                {/* Carga */}
                <div>
                  <div className="border-b border-slate-900 pb-0.5 flex justify-between items-center">
                    <span className="font-bold text-black">Carga</span>
                    <span className="font-mono text-slate-800">{issuedGuide.loadingDateTime}</span>
                  </div>
                  <p className="text-slate-800 pt-1 font-medium">{issuedGuide.loadingPlace}</p>
                </div>

                {/* Descarga */}
                <div>
                  <div className="border-b border-slate-900 pb-0.5 flex justify-between items-center">
                    <span className="font-bold text-black">Descarga</span>
                    <span className="font-mono text-slate-800">{issuedGuide.unloadingDateTime}</span>
                  </div>
                  <p className="text-slate-800 pt-1 font-medium">{issuedGuide.unloadingPlace}</p>
                </div>
              </div>
            </div>

            {/* 6. Assinaturas (Entreguei / Recebi) */}
            <div className="pt-8 grid grid-cols-2 gap-12 text-xs">
              {/* Entreguei */}
              <div className="space-y-2 text-center">
                <div className="border-t border-slate-900 pt-1">
                  <p className="font-bold text-black">Entreguei (Assinatura)</p>
                </div>
                <div className="h-16"></div>
              </div>

              {/* Recebi */}
              <div className="space-y-2 text-center">
                <div className="border-t border-slate-900 pt-1">
                  <p className="font-bold text-black">Recebi (Assinatura)</p>
                </div>
                <div className="h-16"></div>
              </div>
            </div>

            {/* 7. Tabela de Artigos / Equipamentos */}
            <div className="pt-4 space-y-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-t border-b border-slate-900 font-bold text-black">
                    <th className="py-1.5 px-2 w-28">Código</th>
                    <th className="py-1.5 px-2">Descrição</th>
                    <th className="py-1.5 px-2 text-center w-16">Uni.</th>
                    <th className="py-1.5 px-2 text-right w-16">Qtd.</th>
                  </tr>
                </thead>
                <tbody>
                  {issuedGuide.items.map((item: any) => (
                    <tr key={item.product.id} className="border-b border-slate-200 font-medium">
                      <td className="py-2 px-2 font-mono text-slate-800">{item.product.code || item.product.id}</td>
                      <td className="py-2 px-2 text-slate-900 font-bold">{item.product.name}</td>
                      <td className="py-2 px-2 text-center text-slate-700">{item.product.unit || 'Uni.'}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-black">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 8. Footer */}
            <div className="pt-12 flex justify-between items-end text-[10px] text-slate-600 font-medium border-t border-slate-200">
              <div>
                <p>Processado por programa certificado n.º 00/AGT/2026</p>
              </div>
              <div className="text-right font-semibold text-black">
                Página 1/1
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmGuide && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-2xl border border-rose-100">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">Remover {labelDocSingular}</h3>
                <p className="text-xs text-slate-500 font-medium">Esta ação é irreversível</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tem a certeza de que deseja remover a <strong className="text-slate-900">{labelDocSingular} ({deleteConfirmGuide.guideNumber})</strong> do histórico?
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmGuide(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteGuide}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

