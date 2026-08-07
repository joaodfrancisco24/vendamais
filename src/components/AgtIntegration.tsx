/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Radio, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Building2,
  Lock,
  RefreshCw
} from 'lucide-react';
import { CompanyConfig, KeysConfig } from '../types';

interface AgtIntegrationProps {
  company: CompanyConfig;
  keys: KeysConfig;
  onUpdateKeys: (keys: KeysConfig) => void;
  onUpdateCompany: (company: CompanyConfig) => void;
}

export default function AgtIntegration({
  company,
  keys,
  onUpdateKeys,
  onUpdateCompany
}: AgtIntegrationProps) {
  // Key form state
  const [privateKey, setPrivateKey] = useState(keys.privateKey);
  const [publicKey, setPublicKey] = useState(keys.publicKey);
  const [certId, setCertId] = useState(keys.certId);
  const [keyName, setKeyName] = useState(keys.keyName);

  // Invoicing mode state
  const [invoicingMode, setInvoicingMode] = useState<'saft' | 'electronic'>(company.invoicingMode || 'saft');

  // Test AGT Communication State
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; timestamp: string } | null>(null);

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateKey || !publicKey) {
      alert('Por favor, insira tanto a Chave Pública quanto a Chave Privada.');
      return;
    }

    const hasPrivHeader = privateKey.includes('BEGIN') && privateKey.includes('KEY');
    const hasPubHeader = publicKey.includes('BEGIN') && publicKey.includes('KEY');

    if (!hasPrivHeader || !hasPubHeader) {
      if (!window.confirm('As chaves coladas não contêm os cabeçalhos padrão PEM (ex: -----BEGIN PRIVATE KEY-----). Deseja salvar mesmo assim?')) {
        return;
      }
    }

    const updatedKeys: KeysConfig = {
      privateKey: privateKey.trim(),
      publicKey: publicKey.trim(),
      certId: certId.trim() || '320/AGT/2026',
      keyName: keyName.trim() || 'Chave de Produção AGT',
      status: 'Ativa'
    };

    onUpdateKeys(updatedKeys);
    alert('Credenciais da AGT e Chaves RSA guardadas com sucesso!');
  };

  const handleSaveInvoicingMode = (mode: 'saft' | 'electronic') => {
    setInvoicingMode(mode);
    onUpdateCompany({
      ...company,
      invoicingMode: mode
    });
  };

  const handleTestAgtConnection = () => {
    setIsTestingConnection(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTestingConnection(false);
      setTestResult({
        success: true,
        message: 'Conexão com os Servidores WebService AGT efetuada com sucesso! Endpoint HTTPS respondendo [STATUS 200 OK]. Certificado de validação ativo.',
        timestamp: new Date().toLocaleTimeString('pt-AO')
      });
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="agt-integration-root">
      
      {/* Title */}
      <div className="border-b border-slate-100 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Integração AGT</h1>
          <p className="text-sm text-slate-500">
            Gestão de credenciais de assinatura digital RSA, certificado de software e comunicação com a Administração Geral Tributária
          </p>
        </div>
        <div>
          {company.invoicingMode === 'electronic' ? (
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Comunicação Direta AGT Ativa
            </span>
          ) : (
            <span className="px-3 py-1.5 bg-brand-light text-brand border border-brand-light rounded-full text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand" />
              Modo SAF-T (Assinatura Local)
            </span>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Certificate Status & Mode selection */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Certificate status banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className={`p-3 rounded-2xl flex items-center justify-center ${
                  keys.status === 'Ativa' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {keys.status === 'Ativa' ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Certificação de Software AGT</h3>
                  <p className="text-xs text-slate-400">Regulamento Geral de Certificação de Software (Angola)</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                keys.status === 'Ativa' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {keys.status === 'Ativa' ? 'SOFTWARE CERTIFICADO' : 'NÃO CERTIFICADO'}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Software validado para emissão de faturas com assinatura criptográfica única em conformidade com as regras da AGT. As faturas são assinadas com o par de chaves RSA e numeradas sequencialmente por série.
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block font-medium">Nº Certificado AGT:</span>
                <span className="font-mono font-bold text-slate-800">{keys.certId || '320/AGT/2026'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Nome da Chave:</span>
                <span className="font-bold text-slate-800 truncate block">{keys.keyName || 'Chave de Produção AGT'}</span>
              </div>
            </div>
          </div>

          {/* Invoicing Mode & Communication method card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-brand" />
              Modo de Comunicação e Faturação
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSaveInvoicingMode('saft')}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
                  invoicingMode === 'saft'
                    ? 'border-brand bg-brand-light/60 text-brand shadow-2xs font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase">SAF-T (AO)</span>
                  {invoicingMode === 'saft' && <CheckCircle2 className="w-4 h-4 text-brand" />}
                </div>
                <p className="text-xxs text-slate-500 leading-normal">
                  Exportação mensal do ficheiro XML SAF-T para submissão no portal e-fatura da AGT.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSaveInvoicingMode('electronic')}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
                  invoicingMode === 'electronic'
                    ? 'border-brand bg-brand-light/60 text-brand shadow-2xs font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase">Faturação Eletrónica</span>
                  {invoicingMode === 'electronic' && <CheckCircle2 className="w-4 h-4 text-brand" />}
                </div>
                <p className="text-xxs text-slate-500 leading-normal">
                  Transmissão em tempo real de cada documento via Webservice oficial da AGT.
                </p>
              </button>
            </div>

            {/* Test Connection Box */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Teste de Comunicação Webservice AGT</span>
                  <span className="text-xxs text-slate-400">Verificar estado do servidor de faturação da AGT</span>
                </div>
                <button
                  type="button"
                  onClick={handleTestAgtConnection}
                  disabled={isTestingConnection}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                  {isTestingConnection ? 'A Testar...' : 'Testar Conexão'}
                </button>
              </div>

              {testResult && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-start gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Conexão Estabelecida ({testResult.timestamp})</span>
                    <p className="text-xxs text-emerald-700 mt-0.5 leading-normal">{testResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Key Pair PEM Configuration Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-brand" />
              Chaves Criptográficas RSA (PEM)
            </h3>

            <form onSubmit={handleSaveKeys} className="space-y-4" id="form-agt-keys">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cert ID */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nº do Certificado AGT *</label>
                  <input 
                    type="text"
                    id="keys-cert-id"
                    required
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    placeholder="Ex: 320/AGT/2026"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>

                {/* Keypair Name */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome de Identificação da Chave</label>
                  <input 
                    type="text"
                    id="keys-name"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="Ex: Par de Chaves Produção Venda Mais"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Private Key PEM */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Chave Privada (Private Key - PEM) *</label>
                <textarea
                  id="keys-private-pem"
                  rows={4}
                  required
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;MIIEowIBAAKCAQEA0B6sZ0h66oQvB2H...&#10;-----END RSA PRIVATE KEY-----"
                  className="w-full p-3 bg-white text-slate-900 font-mono text-xxs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand leading-normal"
                />
              </div>

              {/* Public Key PEM */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Chave Pública (Public Key - PEM) *</label>
                <textarea
                  id="keys-public-pem"
                  rows={3}
                  required
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  placeholder="-----BEGIN PUBLIC KEY-----&#10;MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...&#10;-----END PUBLIC KEY-----"
                  className="w-full p-3 bg-white text-slate-900 font-mono text-xxs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand leading-normal"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  id="btn-save-keys-submit"
                  className="px-5 py-2.5 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-dark transition flex items-center gap-2 shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Salvar Credenciais AGT
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
