import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  UserCheck, 
  Key, 
  Lock, 
  Pencil, 
  Trash2, 
  Search, 
  Eye, 
  EyeOff, 
  X, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  LogOut,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { AppUser, UserRole } from '../types';

interface UserManagementProps {
  users: AppUser[];
  currentUser: AppUser;
  onAddUser: (user: AppUser) => void;
  onUpdateUser: (user: AppUser) => void;
  onDeleteUser: (id: string) => void;
  onSwitchUser: (user: AppUser) => void;
}

export default function UserManagement({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onSwitchUser
}: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'operator'>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showPins, setShowPins] = useState<{ [key: string]: boolean }>({});
  
  // Form State
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'operator' as UserRole,
    pin: '0000',
    active: true
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || u.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const operatorCount = users.filter((u) => u.role === 'operator').length;

  const handleOpenAddModal = () => {
    setEditingUserId(null);
    setForm({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'operator',
      pin: '0000',
      active: true
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: AppUser) => {
    setEditingUserId(user.id);
    setForm({
      name: user.name,
      username: user.username,
      email: user.email || '',
      password: user.password || '',
      role: user.role,
      pin: user.pin || '0000',
      active: user.active
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleTogglePinVisibility = (id: string) => {
    setShowPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError('O Nome Completo é obrigatório.');
      return;
    }
    if (!form.username.trim()) {
      setFormError('O Nome de Utilizador (username) é obrigatório.');
      return;
    }

    // Check username uniqueness
    const exists = users.some(
      (u) => u.username.toLowerCase() === form.username.trim().toLowerCase() && u.id !== editingUserId
    );
    if (exists) {
      setFormError('Este Nome de Utilizador já está registado.');
      return;
    }

    if (editingUserId) {
      const existing = users.find((u) => u.id === editingUserId);
      if (existing) {
        const updated: AppUser = {
          ...existing,
          name: form.name.trim(),
          username: form.username.trim().toLowerCase(),
          email: form.email.trim() || undefined,
          password: form.password.trim() || existing.password || '123456',
          role: form.role,
          pin: form.pin.trim() || '0000',
          active: form.active
        };
        onUpdateUser(updated);
        setSuccessMsg(`Utilizador "${updated.name}" actualizado com sucesso!`);
      }
    } else {
      const newUser: AppUser = {
        id: 'usr-' + Date.now(),
        name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim() || undefined,
        password: form.password.trim() || '123456',
        role: form.role,
        pin: form.pin.trim() || '0000',
        active: form.active,
        createdAt: new Date().toISOString()
      };
      onAddUser(newUser);
      setSuccessMsg(`Utilizador "${newUser.name}" criado com sucesso!`);
    }

    setIsModalOpen(false);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleDelete = (user: AppUser) => {
    if (user.id === currentUser.id) {
      alert('Não pode eliminar o utilizador que está atualmente com sessão iniciada.');
      return;
    }

    if (user.role === 'admin' && adminCount <= 1) {
      alert('Não é possível eliminar o único Administrador do sistema.');
      return;
    }

    if (confirm(`Tem certeza que deseja eliminar o utilizador "${user.name}" (@${user.username})?`)) {
      onDeleteUser(user.id);
      setSuccessMsg(`Utilizador "${user.name}" eliminado.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn" id="user-management-module">
      
      {/* SUCCESS NOTIFICATION */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-emerald-800 animate-slideDown">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-extrabold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-2xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Gestão de Utilizadores</h2>
              <span className="bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                Controlo de Acessos
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Crie e gira contas de Administrador (Acesso Total) e Usuário Normal (Acesso Limitado ao POS).
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-2 transition shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          NOVO UTILIZADOR
        </button>
      </div>

      {/* STATS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">TOTAL UTILIZADORES</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{users.length}</p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-purple-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">ADMINISTRADORES</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-black text-purple-950">{adminCount}</p>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                Acesso Total
              </span>
            </div>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">USUÁRIOS NORMAIS / OPERADORES</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-black text-emerald-950">{operatorCount}</p>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                Acesso Limitado
              </span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Pesquisar utilizador por nome, username ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterRole('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
              filterRole === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setFilterRole('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
              filterRole === 'admin'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            Administradores ({adminCount})
          </button>
          <button
            onClick={() => setFilterRole('operator')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
              filterRole === 'operator'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Usuários Normais ({operatorCount})
          </button>
        </div>
      </div>

      {/* USERS LIST CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredUsers.map((user) => {
          const isCurrentSession = user.id === currentUser.id;
          const isAdmin = user.role === 'admin';

          return (
            <div
              key={user.id}
              className={`bg-white rounded-3xl border-2 p-6 flex flex-col justify-between transition-all duration-200 shadow-xs relative overflow-hidden ${
                isCurrentSession
                  ? 'border-brand ring-2 ring-brand/20'
                  : isAdmin
                  ? 'border-purple-200 hover:border-purple-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Top Banner if Active Session */}
              {isCurrentSession && (
                <div className="absolute top-0 right-0 bg-brand text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-2xl shadow-2xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-white" />
                  Sessão Ativa
                </div>
              )}

              <div>
                {/* User Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 shadow-sm ${
                      isAdmin
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">
                      {user.name}
                    </h3>
                    <p className="text-xs font-semibold text-slate-400 truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>

                {/* Role Badge & Status */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between gap-2">
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 text-[11px] font-extrabold">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                        Administrador (Acesso Total)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-extrabold">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Usuário Normal (Acesso Limitado)
                      </span>
                    )}

                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        user.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {user.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {user.email && (
                    <p className="text-xs text-slate-500 font-medium truncate">
                      <span className="font-bold text-slate-700">Email:</span> {user.email}
                    </p>
                  )}

                  {/* PIN Display */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-700">PIN:</span>
                      <span className="font-black text-slate-900 tracking-wider">
                        {showPins[user.id] ? user.pin || '----' : '••••'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePinVisibility(user.id)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition"
                      title={showPins[user.id] ? 'Ocultar PIN' : 'Mostrar PIN'}
                    >
                      {showPins[user.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Scope Description Box */}
                <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-500 border border-slate-100 mb-4 leading-relaxed">
                  {isAdmin ? (
                    <span className="text-purple-900 font-semibold">
                      ⚡ <strong>Permissões:</strong> Acesso irrestrito a Relatórios, Faturação, SAF-T, Armazéns, Configurações e Perfis.
                    </span>
                  ) : (
                    <span className="text-slate-700 font-semibold">
                      🔒 <strong>Permissões:</strong> Emissão de Faturas, POS, Clientes e Guia de Remessa. Bloqueado em Relatórios e Configurações.
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {!isCurrentSession ? (
                  <button
                    onClick={() => onSwitchUser(user)}
                    className="flex-1 px-3 py-2 bg-slate-900 hover:bg-brand text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Entrar Perfil
                  </button>
                ) : (
                  <span className="text-xs font-bold text-brand px-3 py-2 bg-brand-light rounded-xl flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sessão Atual
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(user)}
                    className="p-2 text-slate-400 hover:text-brand hover:bg-brand-light rounded-xl transition cursor-pointer"
                    title="Editar utilizador"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    disabled={isCurrentSession}
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      isCurrentSession
                        ? 'text-slate-200 cursor-not-allowed'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                    }`}
                    title={isCurrentSession ? 'Não é possível eliminar a sua própria sessão' : 'Eliminar utilizador'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleIn">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-light text-brand rounded-2xl border border-brand-light">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    {editingUserId ? 'Editar Utilizador' : 'Cadastrar Novo Utilizador'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Defina o perfil de acesso e os dados de identificação
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Perfil Selection Box */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                  Perfil de Acesso (Nível de Permissão) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      form.role === 'admin'
                        ? 'border-purple-600 bg-purple-50/50 text-purple-950 font-extrabold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 font-semibold'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 text-purple-700 text-xs font-black">
                        <ShieldCheck className="w-4 h-4" />
                        Administrador
                      </div>
                      <input
                        type="radio"
                        name="userRole"
                        value="admin"
                        checked={form.role === 'admin'}
                        onChange={() => setForm({ ...form, role: 'admin' })}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">
                      Acesso Total a Relatórios, Faturação, SAF-T e Definições.
                    </p>
                  </label>

                  <label
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      form.role === 'operator'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-extrabold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 font-semibold'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-black">
                        <UserCheck className="w-4 h-4" />
                        Usuário Normal
                      </div>
                      <input
                        type="radio"
                        name="userRole"
                        value="operator"
                        checked={form.role === 'operator'}
                        onChange={() => setForm({ ...form, role: 'operator' })}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">
                      Acesso Limitado ao POS, Faturação e Clientes.
                    </p>
                  </label>
                </div>
              </div>

              {/* Nome Completo */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Paulo Silva"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Username / Utilizador *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: joao.silva"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Email de Login *
                  </label>
                  <input
                    type="email"
                    placeholder="Ex: operador@empresa.co.ao"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Senha */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Senha de Acesso (Password) *
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>

                {/* PIN */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    PIN Rápido (4 dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Ex: 1234"
                    value={form.pin}
                    onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-slate-900 tracking-widest focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              {/* Checkbox Ativo */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-user-active"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand cursor-pointer"
                />
                <label htmlFor="chk-user-active" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  Utilizador Ativo no Sistema
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-dark transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Salvar Utilizador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
