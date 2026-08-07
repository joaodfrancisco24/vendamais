import React, { useState, useEffect, useRef } from 'react';
import { User, Plus, Search, Check, X } from 'lucide-react';
import { Customer } from '../types';

interface CustomerSearchSelectorProps {
  id?: string;
  customers: Customer[];
  value: string;
  onChange: (id: string) => void;
  onAddCustomer: (customer: Customer) => void;
  placeholder?: string;
}

export default function CustomerSearchSelector({
  id = 'customer-selector',
  customers,
  value,
  onChange,
  onAddCustomer,
  placeholder = 'Pesquisar cliente...'
}: CustomerSearchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // New Customer Form State
  const [newName, setNewName] = useState('');
  const [newNif, setNewNif] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [formError, setFormError] = useState('');

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCustomer = customers.find(c => c.id === value) || customers[0];

  const filteredCustomers = customers.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      (c.nif && c.nif.includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query))
    );
  });

  const handleSelect = (customerId: string) => {
    onChange(customerId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newName.trim()) {
      setFormError('O nome do cliente é obrigatório.');
      return;
    }
    if (!newNif.trim()) {
      setFormError('O NIF é obrigatório.');
      return;
    }
    // NIF length check or simple validation if necessary
    if (newNif.trim().length < 9) {
      setFormError('O NIF deve ter pelo menos 9 caracteres.');
      return;
    }

    const nifExists = customers.some(c => c.nif === newNif.trim() && c.nif !== '999999999');
    if (nifExists) {
      setFormError('Já existe um cliente registado com este NIF.');
      return;
    }

    const newCust: Customer = {
      id: 'cust-' + Math.random().toString(36).substring(2, 9),
      name: newName.trim(),
      nif: newNif.trim(),
      email: newEmail.trim() || undefined,
      address: newAddress.trim() || undefined
    };

    onAddCustomer(newCust);
    onChange(newCust.id);
    
    // Reset Form
    setNewName('');
    setNewNif('');
    setNewEmail('');
    setNewAddress('');
    setShowAddModal(false);
  };

  return (
    <div className="relative w-full" ref={containerRef} id={`wrapper-${id}`}>
      <div className="flex gap-2 items-center">
        {/* Custom Dropdown Trigger */}
        <div className="relative flex-1">
          <button
            type="button"
            id={`trigger-${id}`}
            onClick={() => setIsOpen(!isOpen)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 text-left focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand flex items-center justify-between cursor-pointer shadow-2xs min-h-[38px]"
          >
            <span className="truncate">
              {selectedCustomer ? `${selectedCustomer.name} (NIF: ${selectedCustomer.nif})` : 'Selecione um cliente'}
            </span>
            <span className="text-slate-400 text-[10px]">▼</span>
          </button>
          <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>

        {/* Quick Add Button */}
        <button
          type="button"
          id={`btn-quick-add-${id}`}
          onClick={() => setShowAddModal(true)}
          className="p-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl transition shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center shrink-0 min-h-[38px]"
          title="Adicionar Novo Cliente"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-slideDown max-h-64 flex flex-col">
          {/* Search Input Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center relative">
            <input
              type="text"
              id={`search-input-${id}`}
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand"
              autoFocus
            />
            <Search className="absolute left-4 top-3.5 w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Options list */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(c.id)}
                    className={`w-full px-3 py-2.5 text-left text-xs flex items-center justify-between transition cursor-pointer ${
                      isSelected ? 'bg-brand-light text-brand font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">NIF: {c.nif}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-brand shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-400 text-xs">
                Nenhum cliente encontrado
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline Quick Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-gray-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-brand" />
                Registar Cliente Rápido
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              {formError && (
                <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-semibold rounded-lg text-center">
                  {formError}
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do cliente ou empresa"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">NIF *</label>
                <input
                  type="text"
                  required
                  placeholder="NIF de 9 dígitos"
                  value={newNif}
                  onChange={(e) => setNewNif(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">E-mail (Opcional)</label>
                <input
                  type="email"
                  placeholder="exemplo@email.ao"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Endereço (Opcional)</label>
                <input
                  type="text"
                  placeholder="Luanda, Angola"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand hover:bg-brand-hover text-white font-bold rounded-xl text-xs transition shadow-sm"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
