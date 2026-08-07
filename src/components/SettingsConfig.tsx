import React, { useState, useEffect } from 'react';
import { Building, Save, CheckCircle2, DollarSign, FileText, Landmark, Database, Wifi, WifiOff, AlertTriangle, Loader2, Info, HelpCircle, X, CreditCard, Plus, Pencil, Trash2, Star, Palette, Check, Upload, Image as ImageIcon, Eye, EyeOff, Printer, Sliders } from 'lucide-react';
import { CompanyConfig, BankAccount } from '../types';
import { ThemePalette } from '../utils/theme';
import PrintSettingsModal, { getStoredPrintSettings } from './PrintSettingsModal';

interface SettingsConfigProps {
  company: CompanyConfig;
  onUpdateCompany: (updated: CompanyConfig) => void;
}

export default function SettingsConfig({ company, onUpdateCompany }: SettingsConfigProps) {
  const [name, setName] = useState(company.name);
  const [nif, setNif] = useState(company.nif);
  const [address, setAddress] = useState(company.address);
  const [city, setCity] = useState(company.city || 'Luanda');
  const [country, setCountry] = useState(company.country || 'Angola');
  const [phone, setPhone] = useState(company.phone || '');
  const [email, setEmail] = useState(company.email || '');
  const [shareCapital, setShareCapital] = useState(company.shareCapital || 100000);
  const [regime, setRegime] = useState(company.regime || 'Geral');
  const [iban, setIban] = useState(company.iban || 'AO06.0006.0000.9999.8888.7777.6');
  const [invoicingMode, setInvoicingMode] = useState<'saft' | 'electronic'>(company.invoicingMode || 'saft');
  const [primaryColor, setPrimaryColor] = useState<string>(company.primaryColor || 'blue');
  const [logoUrl, setLogoUrl] = useState<string>(company.logoUrl || '');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(company.themeMode || 'light');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem do logótipo deve ter no máximo 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(
    company.bankAccounts && company.bankAccounts.length > 0
      ? company.bankAccounts
      : [
          {
            id: '1',
            bankName: 'BANCO BAI',
            iban: 'AO0683364862846221',
            accountNumber: '682638263238',
            holderName: 'ITECMA LDA',
            swiftCode: 'BAIPAULOX',
            isDefault: true
          }
        ]
  );
  const [showBankDetailsOnInvoices, setShowBankDetailsOnInvoices] = useState<boolean>(
    company.showBankDetailsOnInvoices !== false
  );

  // Bank Account Modal state
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    iban: '',
    accountNumber: '',
    holderName: '',
    swiftCode: '',
    isDefault: false
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    if (company) {
      setName(company.name || '');
      setNif(company.nif || '');
      setAddress(company.address || '');
      setCity(company.city || 'Luanda');
      setCountry(company.country || 'Angola');
      setPhone(company.phone || '');
      setEmail(company.email || '');
      setShareCapital(company.shareCapital || 100000);
      setRegime(company.regime || 'Geral');
      setIban(company.iban || 'AO06.0006.0000.9999.8888.7777.6');
      setInvoicingMode(company.invoicingMode || 'saft');
      setPrimaryColor(company.primaryColor || 'blue');
      setLogoUrl(company.logoUrl || '');
      if (company.bankAccounts && company.bankAccounts.length > 0) {
        setBankAccounts(company.bankAccounts);
      }
      setShowBankDetailsOnInvoices(company.showBankDetailsOnInvoices !== false);
      setThemeMode(company.themeMode || 'light');
    }
  }, [company]);

  // Database configuration states
  const [dbHost, setDbHost] = useState('');
  const [dbPort, setDbPort] = useState('3306');
  const [dbUser, setDbUser] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [showDbPassword, setShowDbPassword] = useState(false);
  const [dbName, setDbName] = useState('');
  const [forceOriginalDb, setForceOriginalDb] = useState(true);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbMessage, setDbMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [currentDbStatus, setCurrentDbStatus] = useState<any>(null);

  useEffect(() => {
    async function loadDbConfig() {
      try {
        const resConfig = await fetch('/api/db-config');
        if (resConfig.ok) {
          const config = await resConfig.json();
          setDbHost(config.host || '');
          setDbPort(String(config.port || '3306'));
          setDbUser(config.user || '');
          setDbPassword(config.password || '');
          setDbName(config.database || '');
          setForceOriginalDb(config.forceOriginalDb !== false);
        }
        
        const resStatus = await fetch('/api/db-status');
        if (resStatus.ok) {
          const status = await resStatus.json();
          setCurrentDbStatus(status);
        }
      } catch (err) {
        console.error('Erro ao carregar configurações de BD:', err);
      }
    }
    loadDbConfig();
  }, []);

  const handleRetryDb = async () => {
    setDbLoading(true);
    setDbMessage(null);
    try {
      const res = await fetch('/api/db-retry', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setDbMessage({ type: 'success', text: 'Ligação à Base de Dados MySQL (.env) estabelecida com sucesso!' });
        setCurrentDbStatus(data.status);
        window.dispatchEvent(new Event('db-status-changed'));
      } else {
        setDbMessage({ type: 'error', text: data.status?.error || 'Falha ao ligar à Base de Dados MySQL.' });
        if (data.status) {
          setCurrentDbStatus(data.status);
        }
      }
    } catch (err: any) {
      setDbMessage({ type: 'error', text: 'Falha na comunicação com o servidor.' });
    } finally {
      setDbLoading(false);
    }
  };

  const handleConnectDb = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbLoading(true);
    setDbMessage(null);
    try {
      const res = await fetch('/api/db-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: dbHost,
          port: Number(dbPort),
          user: dbUser,
          password: dbPassword,
          database: dbName,
          forceOriginalDb: forceOriginalDb
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDbMessage({ type: 'success', text: 'Conectado à Base de Dados Original com sucesso! Tabelas fiscais inicializadas.' });
        setCurrentDbStatus(data.status);
        // Fire custom event to let other components know the DB status has changed
        window.dispatchEvent(new Event('db-status-changed'));
      } else {
        setDbMessage({ type: 'error', text: data.error || 'Erro ao conectar à Base de Dados Original.' });
        if (data.status) {
          setCurrentDbStatus(data.status);
        }
      }
    } catch (err: any) {
      setDbMessage({ type: 'error', text: 'Erro de comunicação: ' + err.message });
    } finally {
      setDbLoading(false);
    }
  };

  const handleAddBank = () => {
    setEditingBankId(null);
    setBankForm({
      bankName: '',
      iban: '',
      accountNumber: '',
      holderName: name || 'ITECMA LDA',
      swiftCode: '',
      isDefault: bankAccounts.length === 0
    });
    setIsBankModalOpen(true);
  };

  const handleEditBank = (acc: BankAccount) => {
    setEditingBankId(acc.id);
    setBankForm({
      bankName: acc.bankName || '',
      iban: acc.iban || '',
      accountNumber: acc.accountNumber || '',
      holderName: acc.holderName || '',
      swiftCode: acc.swiftCode || '',
      isDefault: !!acc.isDefault
    });
    setIsBankModalOpen(true);
  };

  const handleDeleteBank = (id: string) => {
    const updated = bankAccounts.filter((b) => b.id !== id);
    if (updated.length > 0 && !updated.some((b) => b.isDefault)) {
      updated[0].isDefault = true;
    }
    setBankAccounts(updated);
  };

  const handleSetDefaultBank = (id: string) => {
    setBankAccounts((prev) =>
      prev.map((acc) => ({
        ...acc,
        isDefault: acc.id === id
      }))
    );
  };

  const handleSaveBankModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.bankName.trim() || !bankForm.iban.trim()) {
      alert('Por favor, preencha o Nome do Banco e o IBAN.');
      return;
    }

    let updatedList: BankAccount[];
    if (editingBankId) {
      updatedList = bankAccounts.map((acc) => {
        if (acc.id === editingBankId) {
          return {
            ...acc,
            bankName: bankForm.bankName.trim().toUpperCase(),
            iban: bankForm.iban.trim().toUpperCase(),
            accountNumber: bankForm.accountNumber.trim(),
            holderName: bankForm.holderName.trim().toUpperCase(),
            swiftCode: bankForm.swiftCode.trim().toUpperCase(),
            isDefault: bankForm.isDefault
          };
        }
        return bankForm.isDefault ? { ...acc, isDefault: false } : acc;
      });
    } else {
      const newAcc: BankAccount = {
        id: Date.now().toString(),
        bankName: bankForm.bankName.trim().toUpperCase(),
        iban: bankForm.iban.trim().toUpperCase(),
        accountNumber: bankForm.accountNumber.trim(),
        holderName: bankForm.holderName.trim().toUpperCase(),
        swiftCode: bankForm.swiftCode.trim().toUpperCase(),
        isDefault: bankForm.isDefault || bankAccounts.length === 0
      };

      if (newAcc.isDefault) {
        updatedList = bankAccounts.map((acc) => ({ ...acc, isDefault: false }));
        updatedList.push(newAcc);
      } else {
        updatedList = [...bankAccounts, newAcc];
      }
    }

    setBankAccounts(updatedList);
    setIsBankModalOpen(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    ThemePalette.applyTheme(primaryColor);
    onUpdateCompany({
      name,
      nif,
      address,
      city,
      country,
      phone,
      email,
      shareCapital: Number(shareCapital),
      regime: regime as 'Geral' | 'Isento' | 'Simplificado',
      iban,
      saftVersion: '1.01_01',
      invoicingMode,
      primaryColor,
      logoUrl,
      bankAccounts,
      showBankDetailsOnInvoices,
      themeMode
    });
    setIsConfirmOpen(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="settings-config-root">
      {/* Title */}
      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Configurações do Sistema</h1>
        <p className="text-sm text-slate-500">Gerencie os dados fiscais e operacionais da sua empresa no sistema VENDA MAIS</p>
      </div>

      <div className="max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand rounded-2xl">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Perfil da Empresa & Parametrização Fiscal</h2>
              <p className="text-xs text-slate-400">Estes dados constam nas faturas-recibo, guias de remessa e ficheiro SAF-T</p>
            </div>
          </div>
          {showSuccess && (
            <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              Alterações Gravadas!
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {showSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-xs">Configurações gravadas com sucesso!</h4>
                <p className="text-xxs text-emerald-600 mt-0.5">As alterações foram aplicadas ao perfil da empresa e parametrizadas no sistema.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logótipo da Empresa */}
            <div className="md:col-span-2 bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                    Logótipo da Empresa (Para Documentos Fiscais e Recibos)
                  </label>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Carregue o logótipo oficial da sua empresa (PNG, JPG, SVG até 5MB). Ele constará no cabeçalho das faturas e documentos.
                  </p>
                </div>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remover Logótipo
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                {logoUrl ? (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center min-w-[140px] max-w-[200px] max-h-24 overflow-hidden">
                    <img src={logoUrl} alt="Logótipo da empresa" className="max-h-20 object-contain" />
                  </div>
                ) : (
                  <div className="w-28 h-20 bg-slate-200/70 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 shrink-0">
                    <ImageIcon className="w-6 h-6 mb-1 text-slate-400" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Sem Logo</span>
                  </div>
                )}

                <div className="flex-1 w-full">
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:border-brand hover:text-brand text-slate-700 font-bold text-xs rounded-xl shadow-2xs cursor-pointer transition w-full sm:w-auto">
                    <Upload className="w-4 h-4" />
                    <span>{logoUrl ? 'Substituir Imagem do Logótipo' : 'Subir Logótipo da Empresa'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Recomendado: Fundo transparente ou branco em alta resolução.</p>
                </div>
              </div>
            </div>

            {/* Nome da Empresa */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome Comercial da Empresa *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                placeholder="Ex: VENDA MAIS ECOSSISTEMA LDA"
              />
            </div>

            {/* NIF */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">NIF da Empresa *</label>
              <input
                type="text"
                required
                value={nif}
                onChange={(e) => setNif(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                placeholder="Ex: 541928374"
              />
            </div>

            {/* Endereço */}
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Endereço da Sede *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                placeholder="Ex: Via AL16, Talatona Centro Empresarial, Edifício 2A"
              />
            </div>

            {/* Cidade */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cidade / Província *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                placeholder="Ex: Luanda"
              />
            </div>

            {/* País */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">País *</label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                placeholder="Ex: Angola"
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Contacto Telefónico</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                placeholder="Ex: +244 923 000 000"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">E-mail Corporativo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                placeholder="Ex: geral@vendamais.ao"
              />
            </div>

            {/* IBAN */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">IBAN Bancário para Faturas</label>
              <div className="relative">
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  placeholder="AO06.0006..."
                />
                <Landmark className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Capital Social */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Capital Social (AOA)</label>
              <div className="relative">
                <input
                  type="number"
                  value={shareCapital}
                  onChange={(e) => setShareCapital(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                />
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Regime de IVA */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Enquadramento em IVA (Regime) *</label>
              <select
                value={regime}
                onChange={(e) => setRegime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="Geral">Regime Geral (14%)</option>
                <option value="Simplificado">Regime Simplificado</option>
                <option value="Isento">Regime de Exclusão (Isento)</option>
              </select>
            </div>

            {/* Versão SAF-T */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Versão do Layout de Auditoria SAF-T</label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value="1.01_AO (Regulamento de Angola)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-semibold select-none cursor-not-allowed"
                />
                <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* MODO DE FATURAÇÃO */}
          <div className="pt-2 border-t border-slate-100">
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-light text-brand flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  MODO DE FATURAÇÃO
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option 1: Faturação por SAF-T */}
                <div
                  id="opt-invoicing-saft"
                  onClick={() => setInvoicingMode('saft')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3.5 bg-white ${
                    invoicingMode === 'saft'
                      ? 'border-brand shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="shrink-0">
                    {invoicingMode === 'saft' ? (
                      <div className="w-5 h-5 rounded-full border-2 border-brand flex items-center justify-center bg-white">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Faturação por SAF-T</h4>
                    <p className="text-xxs text-slate-500 mt-0.5">Assinatura local, envio mensal do XML.</p>
                  </div>
                </div>

                {/* Option 2: Faturação Eletrónica */}
                <div
                  id="opt-invoicing-electronic"
                  onClick={() => setInvoicingMode('electronic')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3.5 bg-white ${
                    invoicingMode === 'electronic'
                      ? 'border-brand shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="shrink-0">
                    {invoicingMode === 'electronic' ? (
                      <div className="w-5 h-5 rounded-full border-2 border-brand flex items-center justify-center bg-white">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Faturação Eletrónica</h4>
                    <p className="text-xxs text-slate-500 mt-0.5">Comunicação em tempo real c/ AGT.</p>
                  </div>
                </div>
              </div>

              {/* Callout Info box */}
              <div className="p-3.5 bg-brand-light/80 border border-brand-light rounded-2xl flex items-center gap-3 text-xs text-slate-800 font-medium">
                <Info className="w-4 h-4 text-brand shrink-0" />
                <span className="text-xxs sm:text-xs">
                  O modo de faturação só pode ser alterado pelo administrador do sistema através do painel administrativo.
                </span>
              </div>
            </div>
          </div>

          {/* IDENTIDADE VISUAL & CORES DA EMPRESA */}
          <div className="pt-2 border-t border-slate-100">
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0 shadow-2xs">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900 tracking-tight uppercase">Identidade Visual & Cores da Empresa</h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Escolha a cor principal da sua marca para personalizar os botões, destaques e navegação
                    </p>
                  </div>
                </div>
              </div>

              {/* Color Swatches Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {ThemePalette.PRESETS.map((preset) => {
                  const isSelected = primaryColor === preset.id || primaryColor === preset.primaryHex;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setPrimaryColor(preset.id);
                        ThemePalette.applyTheme(preset.id);
                      }}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-white border-slate-900 ring-2 ring-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: preset.primaryHex }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[11px] font-bold text-slate-800 truncate leading-tight">
                          {preset.name}
                        </span>
                        <span className="block text-[9px] font-mono text-slate-400 uppercase mt-0.5">
                          {preset.primaryHex}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Hex Picker Option */}
              <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg border border-slate-300 shadow-2xs shrink-0 flex items-center justify-center text-white"
                    style={{ backgroundColor: primaryColor.startsWith('#') ? primaryColor : '#2563eb' }}
                  >
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Cor Personalizada em Código Hexadecimal (HEX)</span>
                    <span className="text-[10px] text-slate-500 font-medium block">Insira o código exato da paleta oficial da sua marca</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="color"
                    value={primaryColor.startsWith('#') ? primaryColor : '#2563eb'}
                    onChange={(e) => {
                      setPrimaryColor(e.target.value);
                      ThemePalette.applyTheme(e.target.value);
                    }}
                    className="w-9 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer shrink-0"
                    title="Seletor de Cor"
                  />
                  <input
                    type="text"
                    placeholder="#2563eb"
                    value={primaryColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrimaryColor(val);
                      if (val.length === 7 && val.startsWith('#')) {
                        ThemePalette.applyTheme(val);
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 font-bold w-28 focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Tema do Sistema (Claro / Escuro) */}
              <div className="pt-4 border-t border-slate-200/60 space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Modo de Aparência (Tema)</span>
                  <span className="text-[10px] text-slate-500 font-medium block">Selecione o estilo visual preferido para a interface do sistema</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Modo Claro */}
                  <div
                    id="theme-mode-light"
                    onClick={() => {
                      setThemeMode('light');
                      document.documentElement.classList.remove('dark');
                    }}
                    className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-center gap-3.5 bg-white ${
                      themeMode === 'light'
                        ? 'border-brand shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="shrink-0">
                      {themeMode === 'light' ? (
                        <div className="w-5 h-5 rounded-full border-2 border-brand flex items-center justify-center bg-white">
                          <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">Tema Claro (Light)</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Interface clássica, limpa e com contrastes suaves.</p>
                    </div>
                  </div>

                  {/* Modo Escuro */}
                  <div
                    id="theme-mode-dark"
                    onClick={() => {
                      setThemeMode('dark');
                      document.documentElement.classList.add('dark');
                    }}
                    className={`p-4 rounded-xl border-2 transition cursor-pointer flex items-center gap-3.5 bg-white ${
                      themeMode === 'dark'
                        ? 'border-brand shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="shrink-0">
                      {themeMode === 'dark' ? (
                        <div className="w-5 h-5 rounded-full border-2 border-brand flex items-center justify-center bg-white">
                          <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">Tema Escuro (Dark)</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Interface escura, moderna e confortável para os olhos.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* DEFINIÇÕES DE IMPRESSÃO (Formatos e Impressoras por Documento) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-light text-brand flex items-center justify-center border border-brand-light shrink-0 shadow-2xs">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Definições de Impressão</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                      PREDEFINIR FORMATO (A4 / TICKET 55mm/58mm/80mm) E AUTO-IMPRESSÃO POR DOCUMENTO
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition shadow-sm hover:shadow cursor-pointer"
                >
                  <Sliders className="w-4 h-4" />
                  Configurar Impressão
                </button>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Factura (FT)</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{getStoredPrintSettings().documents.FT?.format || 'Ticket'} ({getStoredPrintSettings().documents.FT?.ticketSize || '58mm'})</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Factura Recibo (FR)</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{getStoredPrintSettings().documents.FR?.format || 'A4'} ({getStoredPrintSettings().documents.FR?.ticketSize || '58mm'})</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Nota Crédito (NC)</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{getStoredPrintSettings().documents.NC?.format || 'A4'} ({getStoredPrintSettings().documents.NC?.ticketSize || '58mm'})</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase block">Recibo (RC)</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{getStoredPrintSettings().documents.RC?.format || 'Ticket'} ({getStoredPrintSettings().documents.RC?.ticketSize || '58mm'})</span>
                </div>
              </div>
            </div>
          </div>

          {/* DADOS BANCÁRIOS */}
          <div className="pt-2 border-t border-slate-100">
            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-light text-brand flex items-center justify-center border border-brand-light shrink-0 shadow-2xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Dados Bancários</h3>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-0.5">
                      CONTAS PARA RECEBIMENTOS E FATURAS
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddBank}
                  className="px-4 py-2 bg-brand hover:bg-brand-dark text-white font-extrabold text-xs tracking-wider uppercase rounded-full flex items-center gap-1.5 transition shadow-sm hover:shadow active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  ADICIONAR
                </button>
              </div>

              {/* Accounts List */}
              <div className="space-y-3 pt-1">
                {bankAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className={`relative p-5 rounded-2xl border-2 transition bg-white ${
                      acc.isDefault
                        ? 'border-brand shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Badge */}
                    {acc.isDefault && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 bg-brand text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-2xs">
                          <Star className="w-3 h-3 fill-white text-white" />
                          PADRÃO NAS FATURAS
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm text-slate-900 uppercase tracking-wide">
                            {acc.bankName}
                          </h4>
                          {!acc.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultBank(acc.id)}
                              className="text-[10px] font-bold text-slate-400 hover:text-brand hover:underline cursor-pointer"
                            >
                              (Tornar Padrão)
                            </button>
                          )}
                        </div>

                        <p className="text-xs font-medium text-slate-600 font-mono">
                          <span className="font-bold text-slate-700">IBAN:</span> {acc.iban}
                          {acc.accountNumber && (
                            <span> &nbsp;•&nbsp; <span className="font-bold text-slate-700">Nº Conta:</span> {acc.accountNumber}</span>
                          )}
                        </p>

                        {(acc.holderName || acc.swiftCode) && (
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">
                            {acc.holderName}
                            {acc.swiftCode && <span> · {acc.swiftCode}</span>}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditBank(acc)}
                          className="p-2 text-slate-400 hover:text-brand hover:bg-brand-light rounded-xl transition cursor-pointer"
                          title="Editar conta"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBank(acc.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Eliminar conta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {bankAccounts.length === 0 && (
                  <div className="p-6 bg-white rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-400 font-medium">
                    Nenhuma conta bancária cadastrada. Clique no botão "+ ADICIONAR" acima.
                  </div>
                )}
              </div>

              {/* Bottom Toggle Switch */}
              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBankDetailsOnInvoices(!showBankDetailsOnInvoices)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      showBankDetailsOnInvoices ? 'bg-brand' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        showBankDetailsOnInvoices ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Mostrar dados bancários nas faturas</h4>
                    <p className="text-xxs text-slate-500 mt-0.5">
                      A conta marcada como "Padrão" aparecerá automaticamente nas faturas emitidas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-dark transition flex items-center gap-2 shadow-md"
            >
              <Save className="w-4 h-4" />
              Gravar Configurações
            </button>
          </div>
        </form>
      </div>

      {/* Permanent Database Connection Status Card */}
      <div className="max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-2xl">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Base de Dados Original (MySQL)</h2>
              <p className="text-xs text-slate-400">Conexão permanente configurada via ficheiro de ambiente (.env)</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {currentDbStatus?.connected ? (
              <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                LIGADO (MySQL)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold animate-pulse">
                <WifiOff className="w-3.5 h-3.5" />
                SISTEMA LOCAL (.env)
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Informational Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Conexão Permanente Ativa</p>
              <p className="text-slate-600 text-xxs sm:text-xs">
                A ligação à base de dados MySQL é carregada permanentemente a partir do ficheiro de configuração do ambiente <code className="bg-emerald-100/80 px-1 py-0.5 rounded font-mono font-bold text-emerald-800">.env</code>. A alteração manual de credenciais pela interface foi desativada para garantir integridade e alta disponibilidade.
              </p>
            </div>
          </div>

          {/* Config Parameters Display Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Servidor (Host)</span>
              <span className="text-xs font-mono font-bold text-slate-800 mt-1 block">{currentDbStatus?.config?.host || "34.34.246.252"}</span>
            </div>

            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Porta MySQL</span>
              <span className="text-xs font-mono font-bold text-slate-800 mt-1 block">3306</span>
            </div>

            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Utilizador BD</span>
              <span className="text-xs font-mono font-bold text-slate-800 mt-1 block">itecdmin_sistema_venda</span>
            </div>

            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nome da Base de Dados</span>
              <span className="text-xs font-mono font-bold text-slate-800 mt-1 block">itecdmin_sistema_venda</span>
            </div>

            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Forçar BD Original</span>
              <span className="text-xs font-bold text-emerald-600 mt-1 block flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                Ativo (DB_FORCE_ORIGINAL)
              </span>
            </div>

            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Origem dos Dados</span>
              <span className="text-xs font-bold text-slate-700 mt-1 block">Ficheiro .env</span>
            </div>
          </div>

          {dbMessage && (
            <div className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 ${
              dbMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {dbMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <span className="font-bold block mb-0.5">
                  {dbMessage.type === 'success' ? 'Conexão Bem-Sucedida!' : 'Resultado do Teste'}
                </span>
                <span className="font-medium opacity-90">{dbMessage.text}</span>
              </div>
            </div>
          )}

          {currentDbStatus?.error && !dbMessage && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-900 text-xs">Estado da Conexão MySQL:</span>
                  <p className="mt-0.5 text-slate-700 leading-relaxed">{currentDbStatus.error}</p>
                </div>
              </div>

              {currentDbStatus.error.includes('Acesso negado') && (
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200/80 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-slate-800 uppercase tracking-wide">
                      🔑 Como Autorizar o Acesso no cPanel (Servidor 95.217.5.136)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('34.34.246.252');
                        alert('IP 34.34.246.252 copiado!');
                      }}
                      className="px-2.5 py-1 bg-amber-600 text-white font-bold text-[10px] rounded-lg hover:bg-amber-700 transition flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      Copiar IP (34.34.246.252)
                    </button>
                  </div>
                  <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-1">
                    <li>Aceda ao cPanel da hospedagem do servidor <strong>95.217.5.136</strong></li>
                    <li>Procure a secção de bases de dados e clique em <strong>"Remote MySQL" (MySQL Remoto)</strong></li>
                    <li>No campo <em>Host/IP</em>, cole o IP <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-800">34.34.246.252</code> (ou digite <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-800">%</code> para todos os IPs)</li>
                    <li>Clique em <strong>Adicionar Host / Add Host</strong> e depois clique no botão abaixo para testar novamente!</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleRetryDb}
              disabled={dbLoading}
              className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {dbLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <Database className="w-4 h-4 text-emerald-400" />
              )}
              {dbLoading ? 'A Testar Ligação .env...' : 'Testar / Reconectar Base de Dados (.env)'}
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-5 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-light text-brand rounded-2xl">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Confirmar Alterações</h3>
                  <p className="text-xs text-slate-500">Parametrização do Sistema</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Tem certeza que deseja guardar as alterações efetuadas nas configurações da empresa?
            </p>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Empresa:</span>
                <span className="font-bold text-slate-900">{name || '—'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">NIF:</span>
                <span className="font-mono font-bold text-slate-900">{nif || '—'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium">Modo Faturação:</span>
                <span className="font-bold text-brand">
                  {invoicingMode === 'electronic' ? 'Faturação Eletrónica' : 'Faturação por SAF-T'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="flex-1 py-2.5 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-dark transition shadow-md flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                Confirmar e Gravar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BANK ACCOUNT ADD/EDIT MODAL */}
      {isBankModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-light text-brand rounded-2xl">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {editingBankId ? 'Editar Conta Bancária' : 'Adicionar Conta Bancária'}
                  </h3>
                  <p className="text-xs text-slate-500">Dados para transferência e recebimentos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBankModal} className="p-6 space-y-4">
              {/* Nome do Banco */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Nome do Banco *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: BANCO BAI, BFA, BIC, BCI"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                />
              </div>

              {/* IBAN */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  IBAN *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: AO06004000001234567890123"
                  value={bankForm.iban}
                  onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nº da Conta */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Nº da Conta
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 682638263238"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>

                {/* SWIFT / Código */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    SWIFT / Código
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: BAIPAULOX"
                    value={bankForm.swiftCode}
                    onChange={(e) => setBankForm({ ...bankForm, swiftCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              {/* Titular */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Titular da Conta
                </label>
                <input
                  type="text"
                  placeholder="Ex: ITECMA LDA"
                  value={bankForm.holderName}
                  onChange={(e) => setBankForm({ ...bankForm, holderName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                />
              </div>

              {/* Checkbox Default */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chk-default-bank"
                  checked={bankForm.isDefault}
                  onChange={(e) => setBankForm({ ...bankForm, isDefault: e.target.checked })}
                  className="w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand cursor-pointer"
                />
                <label htmlFor="chk-default-bank" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  Definir como Conta Padrão nas Faturas
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-dark transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT SETTINGS MODAL */}
      <PrintSettingsModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
}
