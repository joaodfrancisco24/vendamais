import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  AlertCircle,
  Building2
} from 'lucide-react';
import { AppUser, CompanyConfig } from '../types';

interface LoginPageProps {
  company: CompanyConfig;
  users: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
}

export default function LoginPage({ company, users, onLoginSuccess }: LoginPageProps) {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginIdentifier.trim()) {
      setErrorMsg('Por favor, introduza o seu Email ou Nome de Utilizador.');
      return;
    }

    if (!password) {
      setErrorMsg('Por favor, introduza a sua senha.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try server endpoint first
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginIdentifier: loginIdentifier.trim(),
          password
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          onLoginSuccess(data.user);
          setIsLoading(false);
          return;
        }
      }

      // If server returned an error response
      if (res.status === 401 || res.status === 403 || res.status === 400) {
        const data = await res.json().catch(() => ({}));
        if (data.error) {
          setErrorMsg(data.error);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('API login failed, falling back to client users list check:', e);
    }

    // 2. Client-side fallback check against users array
    const cleanInput = loginIdentifier.trim().toLowerCase();
    const matchUser = users.find((u) => {
      const matchEmail = u.email && u.email.toLowerCase() === cleanInput;
      const matchUsername = u.username && u.username.toLowerCase() === cleanInput;
      return matchEmail || matchUsername;
    });

    if (!matchUser) {
      setErrorMsg('Utilizador ou Email não encontrado.');
      setIsLoading(false);
      return;
    }

    if (!matchUser.active) {
      setErrorMsg('Esta conta de utilizador está inativa.');
      setIsLoading(false);
      return;
    }

    // Check password only (no PIN option)
    let matchPassword = false;
    const isSha256 = /^[a-f0-9]{64}$/i.test(matchUser.password || '');
    
    if (isSha256) {
      try {
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        matchPassword = (hashHex === matchUser.password);
      } catch (cryptoErr) {
        console.error('Client-side cryptography failed:', cryptoErr);
        matchPassword = (matchUser.password === password);
      }
    } else {
      matchPassword = (matchUser.password === password);
    }

    if (matchPassword) {
      onLoginSuccess(matchUser);
    } else {
      setErrorMsg('Senha incorreta.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-0 bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-scaleIn">
        
        {/* Left Side: Brand Banner */}
        <div className="lg:col-span-5 p-8 lg:p-10 bg-gradient-to-br from-brand via-brand-dark to-slate-900 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

          <div className="relative z-10">
            {/* Company / App Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-lg shadow-lg">
                <Building2 className="w-6 h-6 text-brand-light" />
              </div>
              <div>
                <h1 className="font-black text-xl tracking-tight text-white">VENDA MAIS</h1>
                <p className="text-[11px] text-brand-light font-bold uppercase tracking-wider">Sistema de Faturação AGT</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/20 border border-brand-light/30 text-brand-light text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-brand-light" />
                Seguro & Certificado
              </div>
              <h2 className="text-2xl lg:text-3xl font-black text-white leading-tight">
                Gestão Comercial e Ponto de Venda
              </h2>
              <p className="text-xs text-brand-light/90 font-medium leading-relaxed">
                Acesse o painel com as suas credenciais. Controlo de stock, faturação em tempo real e relatórios financeiros.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-7 p-8 lg:p-10 bg-white flex flex-col justify-center">
          
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Início de Sessão</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Introduza o seu email ou utilizador e a senha para aceder ao sistema.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-bold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email or Username input */}
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                Email ou Nome de Utilizador *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="admin@vendamais.co.ao ou admin"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand transition"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Senha de Acesso *
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 bg-brand hover:bg-brand-dark text-white font-black text-xs uppercase tracking-wider rounded-2xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <span>A Autenticar...</span>
              ) : (
                <>
                  <span>ENTRAR NO SISTEMA</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
