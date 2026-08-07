import React, { useState } from 'react';
import { 
  Warehouse, 
  Boxes, 
  RefreshCw, 
  PlusCircle, 
  Check, 
  MapPin, 
  ArrowRightLeft, 
  X, 
  Building2, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Pencil,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Product } from '../types';

interface WarehousesProps {
  products: Product[];
  onUpdateProducts?: (newProducts: Product[]) => void;
  onUpdateProductStock?: (productId: string, newStock: number) => void;
}

interface WarehouseData {
  id: string;
  name: string;
  address: string;
  manager: string;
  capacity: string;
}

const INITIAL_WAREHOUSES: WarehouseData[] = [
  { id: 'wh1', name: 'Sede Central - Talatona', address: 'Talatona Centro Empresarial, Edifício 2A, Luanda', manager: 'António Venda Mais', capacity: 'Geral (85% ocupado)' },
  { id: 'wh2', name: 'Armazém Secundário - Viana', address: 'Zona Industrial de Viana, Pavilhão B3, Estrada Catete', manager: 'Lucas Cassanje', capacity: 'Grande Volume (32% ocupado)' },
  { id: 'wh3', name: 'Ponto de Distribuição - Maianga', address: 'Rua Direita da Maianga, Luanda', manager: 'Cláudio Ferreira', capacity: 'Pequeno Volume (60% ocupado)' }
];

export default function Warehouses({ products, onUpdateProducts }: WarehousesProps) {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>(() => {
    const cached = localStorage.getItem('vm_warehouses');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        return INITIAL_WAREHOUSES;
      }
    }
    return INITIAL_WAREHOUSES;
  });

  const [activeWarehouse, setActiveWarehouse] = useState('wh1');
  
  // New Warehouse Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newManager, setNewManager] = useState('');
  const [newCapacity, setNewCapacity] = useState('Geral (0% ocupado)');

  // Edit Warehouse Modal state
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editManager, setEditManager] = useState('');
  const [editCapacity, setEditCapacity] = useState('');

  // Delete Warehouse Modal state
  const [deletingWarehouse, setDeletingWarehouse] = useState<WarehouseData | null>(null);
  const [targetWhForMove, setTargetWhForMove] = useState('');

  // Toast message
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Stock Transfer state
  const [sourceWhId, setSourceWhId] = useState('wh1');
  const [destWhId, setDestWhId] = useState('wh2');
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [transferQty, setTransferQty] = useState(1);
  const [showTransferSuccess, setShowTransferSuccess] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferLog, setTransferLog] = useState<string[]>([]);

  const saveWarehouses = (updated: WarehouseData[]) => {
    setWarehouses(updated);
    localStorage.setItem('vm_warehouses', JSON.stringify(updated));
  };

  const handleCreateWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newWh: WarehouseData = {
      id: `wh-${Date.now()}`,
      name: newName.trim(),
      address: newAddress.trim() || 'Luanda, Angola',
      manager: newManager.trim() || 'Responsável Geral',
      capacity: newCapacity.trim() || 'Capacidade Padrão (0% ocupado)'
    };

    const updated = [...warehouses, newWh];
    saveWarehouses(updated);
    setActiveWarehouse(newWh.id);
    setIsCreateModalOpen(false);

    setNewName('');
    setNewAddress('');
    setNewManager('');
    setNewCapacity('Geral (0% ocupado)');

    setToastMsg(`Novo armazém "${newWh.name}" cadastrado e guardado com sucesso!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Open Edit Modal
  const handleOpenEditModal = (wh: WarehouseData) => {
    setEditingWarehouse(wh);
    setEditName(wh.name);
    setEditAddress(wh.address);
    setEditManager(wh.manager);
    setEditCapacity(wh.capacity);
  };

  // Save Edit Warehouse
  const handleSaveEditedWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarehouse || !editName.trim()) return;

    const oldName = editingWarehouse.name;
    const updatedName = editName.trim();

    const updatedWh: WarehouseData = {
      ...editingWarehouse,
      name: updatedName,
      address: editAddress.trim() || 'Luanda, Angola',
      manager: editManager.trim() || 'Responsável Geral',
      capacity: editCapacity.trim() || 'Capacidade Padrão'
    };

    const updatedWarehouses = warehouses.map(w => w.id === editingWarehouse.id ? updatedWh : w);
    saveWarehouses(updatedWarehouses);

    // Update warehouse name in products if name changed
    if (oldName !== updatedName && onUpdateProducts) {
      const updatedProducts = products.map(p => {
        if (p.warehouseId === editingWarehouse.id || p.warehouse === oldName) {
          return { ...p, warehouse: updatedName };
        }
        return p;
      });
      onUpdateProducts(updatedProducts);
    }

    setEditingWarehouse(null);
    setToastMsg(`Armazém "${updatedName}" atualizado com sucesso!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (wh: WarehouseData) => {
    if (warehouses.length <= 1) {
      alert('Não é possível apagar o único armazém registado no sistema. Deve manter pelo menos um armazém ativo.');
      return;
    }
    const otherWhs = warehouses.filter(w => w.id !== wh.id);
    setDeletingWarehouse(wh);
    setTargetWhForMove(otherWhs[0]?.id || '');
  };

  // Confirm Delete Warehouse & Move Products
  const handleConfirmDeleteWarehouse = () => {
    if (!deletingWarehouse) return;

    const targetWh = warehouses.find(w => w.id === targetWhForMove);
    
    // Find products linked to deleting warehouse
    const productsInWh = products.filter(p => !p.isService && (
      p.warehouseId === deletingWarehouse.id ||
      p.warehouse === deletingWarehouse.name ||
      (!p.warehouseId && deletingWarehouse.id === 'wh1')
    ));

    // Reassign products to target warehouse
    if (productsInWh.length > 0 && targetWh && onUpdateProducts) {
      const updatedProducts = products.map(p => {
        const belongs = p.warehouseId === deletingWarehouse.id ||
          p.warehouse === deletingWarehouse.name ||
          (!p.warehouseId && deletingWarehouse.id === 'wh1');
        if (belongs) {
          return {
            ...p,
            warehouseId: targetWh.id,
            warehouse: targetWh.name
          };
        }
        return p;
      });
      onUpdateProducts(updatedProducts);
    }

    const updatedWarehouses = warehouses.filter(w => w.id !== deletingWarehouse.id);
    saveWarehouses(updatedWarehouses);

    // If active warehouse was deleted, switch active warehouse to target
    if (activeWarehouse === deletingWarehouse.id) {
      setActiveWarehouse(targetWh ? targetWh.id : (updatedWarehouses[0]?.id || ''));
    }

    // Fix transfer dropdown references if deleted warehouse was selected
    if (sourceWhId === deletingWarehouse.id) {
      setSourceWhId(targetWh ? targetWh.id : updatedWarehouses[0]?.id || '');
    }
    if (destWhId === deletingWarehouse.id) {
      setDestWhId(updatedWarehouses.find(w => w.id !== sourceWhId)?.id || updatedWarehouses[0]?.id || '');
    }

    const countMoved = productsInWh.length;
    const deletedName = deletingWarehouse.name;
    setDeletingWarehouse(null);

    setToastMsg(
      countMoved > 0 && targetWh
        ? `Armazém "${deletedName}" eliminado com sucesso! ${countMoved} artigo(s) foram movidos para "${targetWh.name}".`
        : `Armazém "${deletedName}" eliminado com sucesso!`
    );
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);

    if (sourceWhId === destWhId) {
      setTransferError('O armazém de origem e o de destino devem ser diferentes.');
      return;
    }
    
    const prod = products.find(p => p.id === selectedProdId);
    if (!prod) {
      setTransferError('Selecione um artigo válido para transferir.');
      return;
    }

    if (transferQty <= 0) {
      setTransferError('A quantidade a transferir deve ser superior a zero.');
      return;
    }

    if (transferQty > prod.stock) {
      setTransferError(`Quantidade indisponível! O artigo "${prod.name}" possui apenas ${prod.stock} ${prod.unit} em estoque no armazém de origem. Não é possível transferir ${transferQty} ${prod.unit}.`);
      return;
    }

    const sourceWhName = warehouses.find(w => w.id === sourceWhId)?.name || '';
    const destWhName = warehouses.find(w => w.id === destWhId)?.name || '';

    const newLog = `Transferidos ${transferQty} ${prod.unit} de "${prod.name}" de [${sourceWhName}] para [${destWhName}]. Data: ${new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}`;
    setTransferLog([newLog, ...transferLog]);
    
    setShowTransferSuccess(true);
    setTimeout(() => setShowTransferSuccess(false), 3000);
    setTransferQty(1);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="warehouses-root">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 animate-fadeIn shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <h4 className="font-extrabold text-xs">{toastMsg}</h4>
            <p className="text-xxs text-emerald-600">A operação nos locais de depósito foi registada e sincronizada no sistema.</p>
          </div>
        </div>
      )}

      {/* Title & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Armazéns / Locais de Depósito</h1>
          <p className="text-sm text-slate-500">Gestão multi-armazém, cadastramento, edição, eliminação, depósitos de stock e transferência interna de mercadorias</p>
        </div>
        <button
          id="btn-open-create-warehouse"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Cadastrar Armazém
        </button>
      </div>

      {/* Grid of warehouses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {warehouses.map((wh) => {
          const isActive = activeWarehouse === wh.id;
          return (
            <div
              key={wh.id}
              onClick={() => setActiveWarehouse(wh.id)}
              className={`p-5 rounded-3xl border text-left transition flex flex-col justify-between min-h-[180px] cursor-pointer relative group ${
                isActive
                  ? 'bg-brand border-brand text-white shadow-lg shadow-brand/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-xs'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`p-2 rounded-xl inline-block ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-600'
                  }`}>
                    <Warehouse className="w-5 h-5" />
                  </span>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      title="Editar Armazém"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(wh);
                      }}
                      className={`p-1.5 rounded-lg transition ${
                        isActive
                          ? 'hover:bg-white/20 text-white/90 hover:text-white'
                          : 'hover:bg-slate-100 text-slate-500 hover:text-brand'
                      }`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Apagar Armazém"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDeleteModal(wh);
                      }}
                      className={`p-1.5 rounded-lg transition ${
                        isActive
                          ? 'hover:bg-rose-500/40 text-white/90 hover:text-rose-200'
                          : 'hover:bg-rose-50 text-slate-500 hover:text-rose-600'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-sm tracking-tight">{wh.name}</h3>
                <p className={`text-xxs leading-relaxed flex items-center gap-1 ${
                  isActive ? 'text-white/80' : 'text-slate-500'
                }`}>
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {wh.address}
                </p>
              </div>
              
              <div className={`pt-3 border-t text-[10px] flex justify-between ${
                isActive ? 'border-white/20 text-white/80' : 'border-slate-50 text-slate-400'
              }`}>
                <span>Responsável: <strong className={isActive ? 'text-white' : 'text-slate-600'}>{wh.manager}</strong></span>
                <span>{wh.capacity}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Products in selected warehouse */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Boxes className="w-4 h-4 text-brand" />
              Inventário do Armazém Seleccionado
            </h3>
            <span className="text-[10px] font-bold text-brand bg-brand-light border border-brand-light px-2 py-0.5 rounded-full">
              {warehouses.find(w => w.id === activeWarehouse)?.name || 'Central'}
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-bold uppercase">
                  <th className="p-3">Código</th>
                  <th className="p-3">Artigo</th>
                  <th className="p-3 text-center">Unidade</th>
                  <th className="p-3 text-right">Stock Ativo</th>
                </tr>
              </thead>
              <tbody>
                {products.filter(p => !p.isService).map((p) => {
                  const currentWh = warehouses.find(w => w.id === activeWarehouse);
                  const belongsToActive = p.warehouseId 
                    ? p.warehouseId === activeWarehouse 
                    : (currentWh && p.warehouse === currentWh.name) || activeWarehouse === 'wh1';

                  let whStock = belongsToActive ? p.stock : 0;
                  
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-slate-400 text-xxs">{p.code}</td>
                      <td className="p-3 font-bold text-slate-800">{p.name}</td>
                      <td className="p-3 text-center text-slate-500">{p.unit}</td>
                      <td className="p-3 text-right font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded-md ${
                          whStock <= p.minStock && whStock > 0 
                            ? 'bg-amber-50 text-amber-700 font-black' 
                            : whStock === 0 
                            ? 'bg-slate-100 text-slate-400'
                            : 'text-slate-900'
                        }`}>
                          {whStock} {p.unit}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Transfer Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
              <ArrowRightLeft className="w-4 h-4 text-brand" />
              Transferência de Stock Interna
            </h3>
            <p className="text-xs text-slate-500">
              Mova inventário com segurança de um depósito para o outro sem emitir faturas comerciais.
            </p>

            {showTransferSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs flex items-center gap-1.5 animate-pulse">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="font-medium">Transferência registada com sucesso!</span>
              </div>
            )}

            {transferError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-extrabold text-rose-900 text-xs">Transferência Recusada</p>
                  <p className="text-[11px] leading-tight text-rose-700 mt-0.5">{transferError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Origem */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Origem</label>
                  <select
                    value={sourceWhId}
                    onChange={(e) => {
                      setSourceWhId(e.target.value);
                      setTransferError(null);
                    }}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                {/* Destino */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Destino</label>
                  <select
                    value={destWhId}
                    onChange={(e) => {
                      setDestWhId(e.target.value);
                      setTransferError(null);
                    }}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Artigo */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Artigo a Transferir</label>
                <select
                  value={selectedProdId}
                  onChange={(e) => {
                    setSelectedProdId(e.target.value);
                    setTransferError(null);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  {products.filter(p => !p.isService).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantidade */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Quantidade</label>
                  {(() => {
                    const selectedProd = products.find(p => p.id === selectedProdId);
                    if (!selectedProd) return null;
                    const isOver = transferQty > selectedProd.stock;
                    return (
                      <span className={`text-[10px] font-bold ${isOver ? 'text-rose-600 font-extrabold' : 'text-slate-500'}`}>
                        Disponível em Stock: <strong className={isOver ? 'text-rose-600' : 'text-brand'}>{selectedProd.stock} {selectedProd.unit}</strong>
                      </span>
                    );
                  })()}
                </div>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferQty}
                  onChange={(e) => {
                    setTransferQty(Number(e.target.value));
                    setTransferError(null);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Sincronizar Transferência
              </button>
            </form>
          </div>

          {/* Transfer Logs */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-3 max-h-[220px] overflow-y-auto">
            <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">Histórico de Transferências</h4>
            <div className="space-y-2 text-[10px] font-mono text-slate-500 leading-relaxed">
              {transferLog.length > 0 ? (
                transferLog.map((log, i) => (
                  <div key={i} className="p-2 bg-white rounded-lg border border-slate-200/55 text-slate-600">
                    {log}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic">Nenhuma transferência registada nesta sessão.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CADASTRAR ARMAZÉM */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleUp">
            <div className="px-6 py-5 bg-brand text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">Cadastrar Novo Armazém</h3>
                  <p className="text-[10px] text-white/80">Novo local de depósito ou ponto de distribuição de stock</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Nome do Armazém / Depósito *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Armazém Geral Cazenga"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Endereço / Localização
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rua dos Comandos, Pavilhão 4, Luanda"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Responsável / Fiel do Armazém
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Manuel Silva"
                    value={newManager}
                    onChange={(e) => setNewManager(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Capacidade / Volume
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Geral (0% ocupado)"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-md flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Guardar Armazém
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR ARMAZÉM */}
      {editingWarehouse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleUp">
            <div className="px-6 py-5 bg-brand text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">Editar Armazém</h3>
                  <p className="text-[10px] text-white/80">Atualizar informações do local de depósito</p>
                </div>
              </div>
              <button
                onClick={() => setEditingWarehouse(null)}
                className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedWarehouse} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Nome do Armazém / Depósito *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Endereço / Localização
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Responsável / Fiel do Armazém
                  </label>
                  <input
                    type="text"
                    value={editManager}
                    onChange={(e) => setEditManager(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Capacidade / Volume
                  </label>
                  <input
                    type="text"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingWarehouse(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-md flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Guardar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR ARMAZÉM & MOVER ARTIGOS */}
      {deletingWarehouse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleUp">
            <div className="px-6 py-5 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">Apagar Armazém</h3>
                  <p className="text-[10px] text-rose-100">Confirmação de eliminação e transferência de inventário</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingWarehouse(null)}
                className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <p className="text-xs font-black text-slate-800">{deletingWarehouse.name}</p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {deletingWarehouse.address}
                </p>
              </div>

              {/* Check products in deleting warehouse */}
              {(() => {
                const productsInWh = products.filter(p => !p.isService && (
                  p.warehouseId === deletingWarehouse.id ||
                  p.warehouse === deletingWarehouse.name ||
                  (!p.warehouseId && deletingWarehouse.id === 'wh1')
                ));

                const otherWarehouses = warehouses.filter(w => w.id !== deletingWarehouse.id);

                return (
                  <div className="space-y-4">
                    {productsInWh.length > 0 ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-extrabold text-xs text-amber-900">
                              Existem {productsInWh.length} artigo(s) associados a este armazém
                            </h4>
                            <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                              Para onde deseja mover estes artigos antes de apagar definitivamente este armazém?
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-amber-900 uppercase block mb-1">
                            Armazém de Destino para Reatribuição *
                          </label>
                          <select
                            value={targetWhForMove}
                            onChange={(e) => setTargetWhForMove(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            {otherWarehouses.map(w => (
                              <option key={w.id} value={w.id}>
                                {w.name} ({w.address})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-brand-light border border-brand-light rounded-2xl flex items-center gap-3 text-slate-800">
                        <CheckCircle2 className="w-5 h-5 text-brand shrink-0" />
                        <p className="text-xs font-semibold">
                          Nenhum artigo está atualmente associado a este armazém. O armazém pode ser apagado em segurança.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingWarehouse(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteWarehouse}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-md shadow-rose-600/20 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Mover Artigos e Apagar Armazém
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
