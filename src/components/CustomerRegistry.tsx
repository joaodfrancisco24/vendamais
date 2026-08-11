/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, Edit, Check, Users, ArrowLeft, Printer } from 'lucide-react';
import { Customer, CompanyConfig } from '../types';
import { printElement } from '../utils/print';

interface CustomerRegistryProps {
  customers: Customer[];
  company: CompanyConfig;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  isOpenDirectly?: boolean;
  onCloseDirectly?: () => void;
}

export default function CustomerRegistry({
  customers,
  company,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  isOpenDirectly = false,
  onCloseDirectly
}: CustomerRegistryProps) {
  const [isFormOpen, setIsFormOpen] = useState(isOpenDirectly);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [nif, setNif] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const openNewForm = () => {
    setEditingCustomer(null);
    setName('');
    setNif('');
    setEmail('');
    setPhone('');
    setAddress('');
    setIsFormOpen(true);
  };

  const openEditForm = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setNif(cust.nif);
    setEmail(cust.email || '');
    setPhone(cust.phone || '');
    setAddress(cust.address || '');
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nif) {
      alert('Por favor, preencha o Nome e o NIF.');
      return;
    }

    if (nif.trim().length !== 9) {
      alert('O NIF em Angola deve conter exatamente 9 dígitos numéricos.');
      return;
    }

    const payload: Customer = {
      id: editingCustomer ? editingCustomer.id : Math.random().toString(36).substr(2, 9),
      name,
      nif: nif.trim(),
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined
    };

    if (editingCustomer) {
      onUpdateCustomer(payload);
      setToastMsg(`Cliente "${payload.name}" guardado com sucesso!`);
    } else {
      onAddCustomer(payload);
      setToastMsg(`Novo cliente "${payload.name}" guardado com sucesso!`);
    }
    setTimeout(() => setToastMsg(null), 4000);
    
    setIsFormOpen(false);
    if (onCloseDirectly) {
      onCloseDirectly();
    }
  };

  return (
    <div className="space-y-6" id="customer-registry-root">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 animate-fadeIn shadow-xs">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <h4 className="font-extrabold text-xs">{toastMsg}</h4>
            <p className="text-xxs text-emerald-600">As alterações do cliente foram gravadas no sistema com sucesso.</p>
          </div>
        </div>
      )}
      {/* Header Info */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Base de Clientes</h1>
          <p className="text-sm text-gray-500">Cadastro de contribuintes e entidades compradoras para facturação</p>
        </div>
        {!isFormOpen && (
          <div className="flex items-center gap-2">
            <button
              id="btn-print-customers"
              onClick={() => printElement('printed-customer-list', '900px')}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition flex items-center gap-2 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Imprimir Lista de Clientes
            </button>
            <button
              id="btn-add-customer"
              onClick={openNewForm}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              REGISTRAR CLIENTE
            </button>
          </div>
        )}
      </div>

      {isFormOpen || isOpenDirectly ? (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6 max-w-xl mx-auto" id="customer-form">
          <div className="flex justify-between items-center border-b border-gray-50 pb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              {editingCustomer ? 'Editar Informações do Cliente' : 'Ficha de Novo Cliente'}
            </span>
            {onCloseDirectly && (
              <button 
                type="button" 
                onClick={onCloseDirectly}
                className="text-xs text-gray-400 hover:text-gray-600 font-bold"
              >
                Fechar
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nome Completo / Razão Social *</label>
              <input 
                type="text"
                id="cust-name-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Manuel dos Santos"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* NIF */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Número de Identificação Fiscal (NIF) *</label>
              <input 
                type="text"
                id="cust-nif-input"
                required
                maxLength={9}
                value={nif}
                onChange={(e) => setNif(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 541234567 (9 dígitos)"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[9px] text-gray-400 mt-1">Obrigatório para emissão de facturas válidas perante a AGT.</p>
            </div>

            {/* Email */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Correio Electrónico (E-mail)</label>
              <input 
                type="email"
                id="cust-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: cliente@venda.ao"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Contacto Telefónico</label>
              <input 
                type="text"
                id="cust-phone-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 923456789"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
              />
            </div>

            {/* Address */}
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Endereço Residencial / Comercial</label>
              <input 
                type="text"
                id="cust-address-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Av. Deolinda Rodrigues, Luanda"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end border-t border-gray-50 pt-4">
            <button
              type="button"
              id="btn-cust-cancel"
              onClick={() => {
                setIsFormOpen(false);
                if (onCloseDirectly) onCloseDirectly();
              }}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-cust-save"
              className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-2 shadow-xs"
            >
              <Check className="w-4 h-4" />
              GRAVAR CLIENTE
            </button>
          </div>
        </form>
      ) : (
        /* MAIN LIST VIEW */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden p-6 print:p-8" id="printed-customer-list">
          {/* PRINTER COMPANY HEADER (Visible only in print) */}
          <div className="hidden print:block text-center space-y-1 pb-6 border-b border-slate-100 mb-6">
            <h1 className="text-[26px] font-black text-[#0266b3] tracking-tight">
              {company?.name || 'Sistema Negomil'}
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
              NIF: {company?.nif || '999999999'} {company?.address && `| ${company.address}`} {company?.city && `| ${company.city}`} {company?.phone && `| Tel: ${company.phone}`} {company?.email && `| Email: ${company.email}`}
            </p>
            <h2 className="text-xs font-black text-slate-600 tracking-widest uppercase mt-3 pt-2 border-t border-slate-100">
              LISTA GERAL DE CLIENTES
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="p-4">NIF</th>
                  <th className="p-4">Nome do Cliente</th>
                  <th className="p-4">Contacto</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Endereço</th>
                  <th className="p-4 text-center no-print">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-mono font-bold text-gray-900">{c.nif}</td>
                    <td className="p-4 font-bold text-gray-800">{c.name}</td>
                    <td className="p-4 text-gray-500 font-mono">{c.phone || '—'}</td>
                    <td className="p-4 text-gray-500 font-mono">{c.email || '—'}</td>
                    <td className="p-4 text-gray-500">{c.address || '—'}</td>
                    <td className="p-4 text-center no-print">
                      {c.nif === '999999999' ? (
                        <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded font-bold">
                          PADRÃO
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            id={`btn-edit-cust-${c.id}`}
                            onClick={() => openEditForm(c)}
                            className="p-1.5 bg-brand-light text-brand rounded-lg hover:bg-brand-light/80 transition"
                            title="Editar"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-del-cust-${c.id}`}
                            onClick={() => setCustomerToDelete(c)}
                            className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Document print centered signature/info block */}
          <div className="hidden print:block text-center text-[10px] text-slate-400 font-medium pt-8 border-t border-slate-100 mt-12">
            Documento gerado em {new Date().toLocaleDateString('pt-PT')} {new Date().toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})} | {company?.name || 'Sistema Negomil'}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Customer Deletion */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Eliminar Cliente</h3>
                <p className="text-xs text-gray-500">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>
            
            <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
              Tem a certeza que deseja eliminar o cliente <strong className="text-gray-900">{customerToDelete.name}</strong> (NIF: <span className="font-mono">{customerToDelete.nif}</span>)?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                id="btn-cancel-delete-customer"
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-customer"
                onClick={() => {
                  onDeleteCustomer(customerToDelete.id);
                  setCustomerToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition"
              >
                Sim, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
