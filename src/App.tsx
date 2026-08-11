/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Layers, 
  Users, 
  FileText, 
  Boxes, 
  ShieldCheck, 
  PlusCircle, 
  Menu, 
  X,
  Building,
  Key,
  Clock,
  LayoutDashboard,
  ShoppingCart,
  Activity,
  Truck,
  Navigation,
  Warehouse,
  Coins,
  Lock,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  LogOut,
  ShieldAlert,
  Sparkles,
  UserPlus,
  Receipt
} from 'lucide-react';

import { Product, Customer, Invoice, KeysConfig, CompanyConfig, AppState, AppUser } from './types';
import { ThemePalette } from './utils/theme';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import ProductRegistry from './components/ProductRegistry';
import CustomerRegistry from './components/CustomerRegistry';
import SaftExport from './components/SaftExport';
import AgtIntegration from './components/AgtIntegration';
import InvoicesList from './components/InvoicesList';
import SettingsConfig from './components/SettingsConfig';
import GeneralOperations from './components/GeneralOperations';
import DeliveryGuide from './components/DeliveryGuide';
import Warehouses from './components/Warehouses';
import FinancialReports from './components/FinancialReports';
import OutflowsTracker from './components/OutflowsTracker';
import ShiftManagement from './components/ShiftManagement';
import UserManagement from './components/UserManagement';
import LoginPage from './components/LoginPage';
import ReceiptPage from './components/ReceiptPage';
import UnpaidInvoices from './components/UnpaidInvoices';

const DEFAULT_USERS: AppUser[] = [
  {
    id: 'usr-admin-1',
    name: 'Administrador do Sistema',
    username: 'admin',
    email: 'geral@itecma.ao',
    role: 'admin',
    password: '@Tecnico789',
    pin: '1234',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-operador-1',
    name: 'Operador de Caixa',
    username: 'operador',
    email: 'caixa@vendamais.co.ao',
    role: 'operator',
    password: 'caixa123',
    pin: '0000',
    active: true,
    createdAt: new Date().toISOString()
  }
];

// Initial Seed Data if local storage is blank
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod1',
    code: '000101',
    name: 'Computador Portátil Intel i5 16GB RAM SSD 512GB',
    category: 'INFORMÁTICA',
    brand: 'Négomil',
    model: 'N-Pro Book',
    price: 350000,
    buyPrice: 250000,
    taxType: 'IVA14',
    stock: 5,
    minStock: 2,
    maxStock: 20,
    unit: 'UN'
  },
  {
    id: 'prod2',
    code: '000102',
    name: 'Rato Sem Fios Óptico Ergonómico Recarregável',
    category: 'INFORMÁTICA',
    brand: 'Logitech',
    model: 'M330',
    price: 15000,
    buyPrice: 9000,
    taxType: 'IVA14',
    stock: 18,
    minStock: 5,
    maxStock: 50,
    unit: 'UN'
  },
  {
    id: 'prod3',
    code: '000201',
    name: 'Caderno A4 Pautado Capa Dura 100 Folhas',
    category: 'ESCRITÓRIO',
    brand: 'Kores',
    model: 'Classic',
    price: 1200,
    buyPrice: 600,
    taxType: 'ISE',
    exemptionReason: 'Isento nos termos do Artigo 12.º do CIVA',
    stock: 0, // Critical stock simulation
    minStock: 10,
    maxStock: 200,
    unit: 'UN'
  },
  {
    id: 'prod4',
    code: '000301',
    name: 'Hambúrguer Especial Venda Mais Completo',
    category: 'ALIMENTAÇÃO',
    brand: 'Chef',
    model: 'Gourmet',
    price: 3500,
    buyPrice: 1800,
    taxType: 'IVA14',
    stock: 49,
    minStock: 15,
    maxStock: 100,
    unit: 'UN'
  },
  {
    id: 'prod5',
    code: '000401',
    name: 'Sumo Natural de Laranja Fresca 500ml',
    category: 'BEBIDAS',
    brand: 'Sumol',
    model: 'Frescos',
    price: 1200,
    buyPrice: 500,
    taxType: 'IVA14',
    stock: 99,
    minStock: 20,
    maxStock: 150,
    unit: 'UN'
  },
  {
    id: 'prod6',
    code: '000402',
    name: 'Pudim de Leite Condensado Caseiro Cremoso',
    category: 'ALIMENTAÇÃO',
    brand: 'Caseiros',
    model: 'Doce',
    price: 1500,
    buyPrice: 700,
    taxType: 'IVA14',
    stock: 0, // Out of stock simulation
    minStock: 5,
    maxStock: 50,
    unit: 'UN'
  },
  {
    id: 'prod7',
    code: '000999',
    name: 'Consultoria e Configuração de Redes de Computador',
    category: 'SERVIÇOS GERAIS',
    price: 85000,
    buyPrice: 0,
    taxType: 'IVA14',
    stock: 0,
    minStock: 0,
    maxStock: 0,
    unit: 'UN',
    isService: true
  }
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', name: 'CONSUMIDOR FINAL', nif: '999999999', email: 'vendas@vendamais.ao', address: 'Luanda, Angola' },
  { id: '2', name: 'João Silva d\'Oliveira', nif: '541283749', email: 'joao.silva@net.ao', address: 'Maianga, Luanda' },
  { id: '3', name: 'Empresa Industrial ABC Lda', nif: '500128937', email: 'geral@abc.co.ao', address: 'Viana Park, Estrada de Catete' }
];

const INITIAL_COMPANY: CompanyConfig = {
  name: 'VENDA MAIS ECOSSISTEMA LDA (DEMO)',
  nif: '541928374',
  address: 'Via AL16, Talatona Centro Empresarial, Edifício 2A',
  city: 'Luanda',
  country: 'Angola',
  phone: '+244 923 000 000',
  email: 'geral@vendamais.ao',
  shareCapital: 15000000,
  regime: 'Geral',
  saftVersion: '1.01_01',
  invoicingMode: 'saft',
  showBankDetailsOnInvoices: true,
  bankAccounts: [
    {
      id: '1',
      bankName: 'BANCO BAI',
      iban: 'AO0683364862846221',
      accountNumber: '682638263238',
      holderName: 'ITECMA LDA',
      swiftCode: 'BAIPAULOX',
      isDefault: true
    }
  ],
  themeMode: 'light'
};

const INITIAL_KEYS: KeysConfig = {
  privateKey: `-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEA0B6sZ0h66oQvB2HM91XW3b7x5V98+YpLpM1sCfeR5S9Vv0W1
g1uK1M3vC6a7dGg2kM9r8Z7mXm6a9t1uN3x9M2y8n3kXv4m7t9u8z1m3Y7t9u8M
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0B6sZ0h66oQvB2HM91XW
v4m7t9u8z1m3Y7t9u8M4pLpM1sCfeR5S9Vv0W1g1uK1M3vC6a7dGg2kM9r8Z7mXm
-----END RSA PRIVATE KEY-----`,
  publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0B6sZ0h66oQvB2HM91XW
3b7x5V98+YpLpM1sCfeR5S9Vv0W1g1uK1M3vC6a7dGg2kM9r8Z7mXm6a9t1uN3x9
M2y8n3kXv4m7t9u8z1m3Y7t9u8M4pLpM1sCfeR5S9Vv0W1g1uK1M3vC6a7dGg2k
-----END PUBLIC KEY-----`,
  certId: '320/AGT/2026',
  keyName: 'Chave de Desenvolvimento Padrão AGT',
  status: 'Não Configurada' // User must upload theirs or will sign with standard test
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [preselectedInvoiceForReceipt, setPreselectedInvoiceForReceipt] = useState<Invoice | null>(null);
  const [selectedInvoiceNoToView, setSelectedInvoiceNoToView] = useState<string | null>(null);
  const [selectedReceiptNoToView, setSelectedReceiptNoToView] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState<boolean>(false);
  const [isGuiasExpanded, setIsGuiasExpanded] = useState<boolean>(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState<boolean>(false);
  const [isRelatoriosExpanded, setIsRelatoriosExpanded] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Users & Roles State
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('vm_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    const saved = localStorage.getItem('venda_mais_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_USERS[0]; // Admin default
  });

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedAuth = localStorage.getItem('venda_mais_auth');
    return savedAuth === 'true';
  });

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('venda_mais_auth', 'true');
    localStorage.setItem('venda_mais_current_user', JSON.stringify(user));
    if (user.role === 'operator' && ['dashboard', 'armazens', 'products', 'saft', 'agt', 'relatorios', 'pagamentos', 'users', 'config'].includes(activeTab)) {
      setActiveTab('pos');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('venda_mais_auth');
    localStorage.removeItem('venda_mais_current_user');
    setIsAuthenticated(false);
  };

  // Authorization / User Switch modals
  const [isUserSwitchModalOpen, setIsUserSwitchModalOpen] = useState<boolean>(false);
  const [restrictedModalTab, setRestrictedModalTab] = useState<string | null>(null);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [targetUserToSwitch, setTargetUserToSwitch] = useState<AppUser | null>(null);
  const [userPinInput, setUserPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // Central State
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [keys, setKeys] = useState<KeysConfig>(INITIAL_KEYS);
  const [company, setCompany] = useState<CompanyConfig>(() => {
    try {
      const saved = localStorage.getItem('vm_company');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.primaryColor) {
          ThemePalette.applyTheme(parsed.primaryColor);
        }
        return parsed;
      }
    } catch (e) {}
    const themeColor = localStorage.getItem('vm_theme_color');
    if (themeColor) {
      ThemePalette.applyTheme(themeColor);
    }
    return INITIAL_COMPANY;
  });
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; usingFallback: boolean; error: string }>({
    connected: false,
    usingFallback: true,
    error: 'A carregar...',
  });

  // Processing screen & initial loading state
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('A inicializar o VENDA MAIS...');

  // Load and sync from Node.js Express server
  const [syncTrigger, setSyncTrigger] = useState(0);

  useEffect(() => {
    if (activeTab === 'guia' || activeTab === 'guia-transporte') {
      setIsGuiasExpanded(true);
    }
  }, [activeTab]);

  useEffect(() => {
    if (company && company.themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [company]);

  useEffect(() => {
    const handleDbStatusChanged = () => {
      setSyncTrigger(prev => prev + 1);
    };
    window.addEventListener('db-status-changed', handleDbStatusChanged);
    return () => window.removeEventListener('db-status-changed', handleDbStatusChanged);
  }, []);

  useEffect(() => {
    async function initSync() {
      setLoadingMessage('A verificar ligação com a base de dados MySQL...');
      // 1. Fetch Database status
      let currentStatus = { connected: false, usingFallback: true, error: '', forceOriginalDb: false };
      try {
        const resStatus = await fetch('/api/db-status');
        if (resStatus.ok) {
          const status = await resStatus.json();
          currentStatus = status;
          setDbStatus(status);
        }
      } catch (err) {
        console.warn('Could not contact database status endpoint:', err);
      }

      setLoadingMessage('A carregar catálogo de produtos...');
      // 2. Load Products
      let fetchedProducts: Product[] = [];
      let productsLoaded = false;
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          fetchedProducts = await res.json();
          productsLoaded = true;
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      }

      if (productsLoaded && fetchedProducts) {
        setProducts(fetchedProducts);
        localStorage.setItem('vm_products', JSON.stringify(fetchedProducts));
      } else if (!currentStatus.forceOriginalDb) {
        const cached = localStorage.getItem('vm_products');
        if (cached) {
          const parsed = JSON.parse(cached);
          setProducts(parsed);
          // Sync back to server
          fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed)
          }).catch(err => console.error(err));
        } else {
          setProducts(INITIAL_PRODUCTS);
          localStorage.setItem('vm_products', JSON.stringify(INITIAL_PRODUCTS));
          // Sync back to server
          fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(INITIAL_PRODUCTS)
          }).catch(err => console.error(err));
        }
      } else {
        setProducts([]);
      }

      setLoadingMessage('A carregar base de clientes...');
      // 3. Load Customers
      let fetchedCustomers: Customer[] = [];
      let customersLoaded = false;
      try {
        const res = await fetch('/api/customers');
        if (res.ok) {
          fetchedCustomers = await res.json();
          customersLoaded = true;
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
      }

      if (customersLoaded && fetchedCustomers) {
        setCustomers(fetchedCustomers);
        localStorage.setItem('vm_customers', JSON.stringify(fetchedCustomers));
      } else if (!currentStatus.forceOriginalDb) {
        const cached = localStorage.getItem('vm_customers');
        if (cached) {
          const parsed = JSON.parse(cached);
          setCustomers(parsed);
          fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed)
          }).catch(err => console.error(err));
        } else {
          setCustomers(INITIAL_CUSTOMERS);
          localStorage.setItem('vm_customers', JSON.stringify(INITIAL_CUSTOMERS));
          fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(INITIAL_CUSTOMERS)
          }).catch(err => console.error(err));
        }
      } else {
        setCustomers([]);
      }

      setLoadingMessage('A carregar documentos de facturação...');
      // 4. Load Invoices
      let fetchedInvoices: Invoice[] = [];
      let invoicesLoaded = false;
      try {
        const res = await fetch('/api/invoices');
        if (res.ok) {
          fetchedInvoices = await res.json();
          invoicesLoaded = true;
        }
      } catch (err) {
        console.error('Error fetching invoices:', err);
      }

      if (invoicesLoaded && Array.isArray(fetchedInvoices)) {
        setInvoices(fetchedInvoices);
        localStorage.setItem('vm_invoices', JSON.stringify(fetchedInvoices));
      } else if (!currentStatus.forceOriginalDb) {
        const cached = localStorage.getItem('vm_invoices');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              setInvoices(parsed);
              fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed)
              }).catch(err => console.error(err));
            } else {
              setInvoices([]);
            }
          } catch (e) {
            setInvoices([]);
          }
        } else {
          setInvoices([]);
        }
      } else {
        setInvoices([]);
      }

      // 5. Load Keys
      const cachedKeys = localStorage.getItem('vm_keys');
      if (cachedKeys) {
        setKeys(JSON.parse(cachedKeys));
      } else {
        setKeys(INITIAL_KEYS);
      }

      setLoadingMessage('A carregar dados da empresa e tema...');
      // 6. Load Company Config
      let fetchedCompany: CompanyConfig | null = null;
      let companyLoaded = false;
      try {
        const res = await fetch('/api/company');
        if (res.ok) {
          fetchedCompany = await res.json();
          companyLoaded = true;
        }
      } catch (err) {
        console.error('Error fetching company:', err);
      }

      if (companyLoaded && fetchedCompany && fetchedCompany.name) {
        setCompany(fetchedCompany);
        if (fetchedCompany.primaryColor) {
          ThemePalette.applyTheme(fetchedCompany.primaryColor);
        }
        localStorage.setItem('vm_company', JSON.stringify(fetchedCompany));
      } else if (!currentStatus.forceOriginalDb) {
        const cached = localStorage.getItem('vm_company');
        if (cached) {
          const parsed = JSON.parse(cached);
          setCompany(parsed);
          if (parsed.primaryColor) {
            ThemePalette.applyTheme(parsed.primaryColor);
          }
          fetch('/api/company', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed)
          }).catch(err => console.error(err));
        } else {
          setCompany(INITIAL_COMPANY);
          localStorage.setItem('vm_company', JSON.stringify(INITIAL_COMPANY));
          fetch('/api/company', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(INITIAL_COMPANY)
          }).catch(err => console.error(err));
        }
      } else {
        setCompany(INITIAL_COMPANY);
      }

      setLoadingMessage('A sincronizar utilizadores e permissões...');
      // 7. Load Users
      let fetchedUsers: AppUser[] = [];
      let usersLoaded = false;
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          fetchedUsers = await res.json();
          usersLoaded = true;
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }

      if (usersLoaded && Array.isArray(fetchedUsers) && fetchedUsers.length > 0) {
        setUsers(fetchedUsers);
        localStorage.setItem('vm_users', JSON.stringify(fetchedUsers));
        const current = fetchedUsers.find((u) => u.id === currentUser.id);
        if (current) {
          setCurrentUser(current);
          localStorage.setItem('venda_mais_current_user', JSON.stringify(current));
        }
      } else if (!currentStatus.forceOriginalDb) {
        const cached = localStorage.getItem('vm_users');
        if (cached) {
          const parsed = JSON.parse(cached);
          setUsers(parsed);
        } else {
          setUsers(DEFAULT_USERS);
          localStorage.setItem('vm_users', JSON.stringify(DEFAULT_USERS));
        }
      }

      // Finish loading
      setIsInitialLoading(false);
    }

    initSync();
  }, [syncTrigger]);

  // Sync state helpers to push to local storage and server backend in real time
  const addUser = (newUser: AppUser) => {
    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('vm_users', JSON.stringify(updated));
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    }).catch(err => console.error('Error add user:', err));
  };

  const updateUser = (updatedUser: AppUser) => {
    const updated = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updated);
    localStorage.setItem('vm_users', JSON.stringify(updated));
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem('venda_mais_current_user', JSON.stringify(updatedUser));
    }
    fetch(`/api/users/${encodeURIComponent(updatedUser.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser)
    }).catch(err => console.error('Error update user:', err));
  };

  const deleteUser = (id: string) => {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    localStorage.setItem('vm_users', JSON.stringify(updated));
    fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch(err => console.error('Error delete user:', err));
  };

  const handleSwitchUser = (user: AppUser) => {
    if (user.pin && user.pin !== '0000' && user.pin !== '') {
      setTargetUserToSwitch(user);
      setUserPinInput('');
      setAuthError('');
    } else {
      setCurrentUser(user);
      localStorage.setItem('venda_mais_current_user', JSON.stringify(user));
      setIsUserSwitchModalOpen(false);
      setTargetUserToSwitch(null);
    }
  };

  const handleConfirmUserPinSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserToSwitch) return;

    if (userPinInput.trim() === (targetUserToSwitch.pin || '')) {
      setCurrentUser(targetUserToSwitch);
      localStorage.setItem('venda_mais_current_user', JSON.stringify(targetUserToSwitch));
      setIsUserSwitchModalOpen(false);
      setTargetUserToSwitch(null);
      setUserPinInput('');
      setAuthError('');
    } else {
      setAuthError('PIN incorreto para ' + targetUserToSwitch.name);
    }
  };

  const handleNavigateWithPermission = (tab: string) => {
    const restrictedTabsForOperator = [
      'dashboard',
      'armazens',
      'products',
      'saft',
      'agt',
      'relatorios',
      'pagamentos',
      'config',
      'users'
    ];

    if (currentUser.role === 'operator' && restrictedTabsForOperator.includes(tab)) {
      setRestrictedModalTab(tab);
      setAdminPinInput('');
      setAuthError('');
      return;
    }

    setActiveTab(tab);
    if (['operacoes', 'users', 'config'].includes(tab)) {
      setIsConfigExpanded(true);
    }
    if (['relatorios', 'pagamentos', 'turnos'].includes(tab)) {
      setIsRelatoriosExpanded(true);
    }
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleAuthorizeAdminTab = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const admins = users.filter(u => u.role === 'admin' && u.active);
    const isValid = admins.some(a => (a.pin || '1234') === adminPinInput.trim());

    if (isValid) {
      if (restrictedModalTab) {
        setActiveTab(restrictedModalTab);
        if (['operacoes', 'users', 'config'].includes(restrictedModalTab)) {
          setIsConfigExpanded(true);
        }
        if (['relatorios', 'pagamentos', 'turnos'].includes(restrictedModalTab)) {
          setIsRelatoriosExpanded(true);
        }
        setRestrictedModalTab(null);
      }
      setAdminPinInput('');
    } else {
      setAuthError('PIN de Administrador incorreto.');
    }
  };

  // Sync state helpers to push to local storage and server backend in real time
  const saveProducts = (newProds: Product[]) => {
    setProducts(newProds);
    localStorage.setItem('vm_products', JSON.stringify(newProds));
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProds)
    }).catch(err => console.error('Error sync products:', err));
  };

  const saveCustomers = (newCusts: Customer[]) => {
    setCustomers(newCusts);
    localStorage.setItem('vm_customers', JSON.stringify(newCusts));
    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCusts)
    }).catch(err => console.error('Error sync customers:', err));
  };

  const saveInvoices = (newInvs: Invoice[]) => {
    setInvoices(newInvs);
    localStorage.setItem('vm_invoices', JSON.stringify(newInvs));
    fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInvs)
    }).catch(err => console.error('Error sync invoices:', err));
  };

  const saveKeys = (newKeys: KeysConfig) => {
    setKeys(newKeys);
    localStorage.setItem('vm_keys', JSON.stringify(newKeys));
  };

  const saveCompany = (newCompany: CompanyConfig) => {
    setCompany(newCompany);
    if (newCompany.primaryColor) {
      ThemePalette.applyTheme(newCompany.primaryColor);
    }
    localStorage.setItem('vm_company', JSON.stringify(newCompany));
    fetch('/api/company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCompany)
    }).catch(err => console.error('Error sync company config:', err));
  };

  // Sync theme palette whenever company updates
  useEffect(() => {
    const savedThemeColor = localStorage.getItem('vm_theme_color');
    if (company && company.primaryColor) {
      ThemePalette.applyTheme(company.primaryColor);
    } else if (savedThemeColor) {
      ThemePalette.applyTheme(savedThemeColor);
    }
  }, [company?.primaryColor]);

  // Realtime clock simulator
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Inventory modifications
  const addProduct = (prod: Product) => {
    const updated = [...products, prod];
    saveProducts(updated);
  };

  const updateProduct = (prod: Product) => {
    const updated = products.map(p => p.id === prod.id ? prod : p);
    saveProducts(updated);
  };

  const deleteProduct = (id: string) => {
    const currentProducts = Array.isArray(products) ? products : [];
    const updated = currentProducts.filter(p => p.id !== id);
    saveProducts(updated);
    fetch(`/api/products/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch(err => console.error('Error delete product API:', err));
  };

  // Customer modifications
  const addCustomer = (cust: Customer) => {
    const currentCustomers = Array.isArray(customers) ? customers : [];
    const updated = [...currentCustomers, cust];
    saveCustomers(updated);
  };

  const updateCustomer = (cust: Customer) => {
    const currentCustomers = Array.isArray(customers) ? customers : [];
    const updated = currentCustomers.map(c => c.id === cust.id ? cust : c);
    saveCustomers(updated);
  };

  const deleteCustomer = (id: string) => {
    const currentCustomers = Array.isArray(customers) ? customers : [];
    const updated = currentCustomers.filter(c => c.id !== id);
    saveCustomers(updated);
    fetch(`/api/customers/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch(err => console.error('Error delete customer API:', err));
  };

  // Emit invoice & decrement stock
  const handleEmitInvoice = (invoice: Invoice) => {
    const currentInvoices = Array.isArray(invoices) ? invoices : [];
    
    let updatedInvoices = [...currentInvoices];
    if (invoice.type === 'RC' && invoice.linkedInvoiceNo) {
      updatedInvoices = updatedInvoices.map((inv) => {
        if (inv.invoiceNo === invoice.linkedInvoiceNo) {
          return {
            ...inv,
            linkedReceiptNo: invoice.invoiceNo
          };
        }
        return inv;
      });
    }
    
    const finalInvoices = [...updatedInvoices, invoice];
    saveInvoices(finalInvoices);

    // Decrement stock for inventory products
    const currentProducts = Array.isArray(products) ? products : [];
    const updatedProducts = currentProducts.map((prod) => {
      const line = invoice.items.find(item => item.productId === prod.id);
      if (line && !prod.isService) {
        return {
          ...prod,
          stock: Math.max(0, (prod.stock || 0) - line.quantity)
        };
      }
      return prod;
    });
    saveProducts(updatedProducts);
  };

  // Emit Credit Note (NC) & mark original invoice as RECTIFICADO & restore stock
  const handleEmitCreditNote = (creditNote: Invoice, originalInvoiceNo: string, restoreStock: boolean = true) => {
    const currentInvoices = Array.isArray(invoices) ? invoices : [];
    
    // Mark original invoice as RECTIFICADO
    const updatedInvoices = currentInvoices.map((inv) => {
      if (inv.invoiceNo === originalInvoiceNo) {
        return {
          ...inv,
          status: 'RECTIFICADO' as const
        };
      }
      return inv;
    });

    const finalInvoices = [...updatedInvoices, creditNote];
    saveInvoices(finalInvoices);

    // Restore stock if requested and items are physical products
    if (restoreStock && creditNote.items && creditNote.items.length > 0) {
      const currentProducts = Array.isArray(products) ? products : [];
      const updatedProducts = currentProducts.map((prod) => {
        const line = creditNote.items.find(item => item.productId === prod.id);
        if (line && !prod.isService) {
          return {
            ...prod,
            stock: (prod.stock || 0) + line.quantity
          };
        }
        return prod;
      });
      saveProducts(updatedProducts);
    }
  };

  // Get last invoice signature hash for chaining (mandatory for SAF-T AO audit trail)
  const lastInvoiceHash = (Array.isArray(invoices) && invoices.length > 0) ? invoices[invoices.length - 1].hash : '';

  // Initial Processing Screen
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden select-none">
        {/* Ambient Glows */}
        <div className="absolute w-96 h-96 rounded-full bg-brand/20 blur-3xl -top-20 -left-20 pointer-events-none animate-pulse" />
        <div className="absolute w-96 h-96 rounded-full bg-brand/20 blur-3xl -bottom-20 -right-20 pointer-events-none animate-pulse" />

        <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-md p-8 rounded-3xl border border-slate-700/80 shadow-2xl text-center space-y-6 relative z-10 animate-fadeIn">
          {/* Logo Badge */}
          <div className="mx-auto w-20 h-20 bg-brand rounded-2xl flex items-center justify-center p-2 shadow-lg shadow-brand/30 relative">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center p-1 shadow-inner">
              <span className="text-xs font-black text-brand tracking-tight text-center leading-tight">
                VENDA<br/>MAIS
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-black tracking-tight text-white uppercase">VENDA MAIS</h2>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Ecossistema de Gestão & Facturação</p>
          </div>

          {/* Loading Spinner & Dynamic Message */}
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-300">
                {loadingMessage}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-700/70 rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-brand rounded-full animate-pulse transition-all duration-300 w-full" />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 font-medium">
            Conectando com o servidor MySQL (.env) e sincronizando sistema...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginPage 
        company={company}
        users={users}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#ecf1f7] flex" id="venda-mais-main-shell">
      
      {/* MOBILE HEADER BUTTON */}
      <div className="fixed top-4 left-4 z-40 lg:hidden">
        <button 
          id="btn-toggle-mobile-menu"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2.5 bg-white border border-gray-100 rounded-xl shadow-md text-gray-700"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* LEFT SIDE NAVIGATION BAR (VENDA MAIS THEME) */}
      <aside 
        id="venda-mais-navigation"
        className={`fixed inset-y-0 left-0 z-30 ${
          isCollapsed ? 'lg:w-16' : 'lg:w-60'
        } w-60 bg-[#191f29] border-r border-slate-800/80 flex flex-col justify-between transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Brand Header Block */}
          <div className="bg-[#10141d] text-white px-3 py-2.5 h-13 flex items-center justify-between border-b border-slate-800/80 relative overflow-hidden shrink-0">
            <div className="flex items-center gap-2.5">
              {/* White Rounded Square Badge */}
              <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center p-0.5 flex-shrink-0 shadow-2xs">
                <span className="text-[8px] font-black text-white tracking-tight text-center leading-none">
                  VENDA<br/>MAIS
                </span>
              </div>
              
              {/* Brand Titles */}
              {!isCollapsed && (
                <div className="animate-fadeIn">
                  <h1 className="font-black text-white tracking-wider text-xs uppercase">VENDA MAIS</h1>
                  <p className="text-[7.5px] text-brand font-extrabold uppercase tracking-widest mt-0.5">ECOSSISTEMA WEB</p>
                </div>
              )}
            </div>

            {/* Menu Toggle inside header */}
            {!isCollapsed && (
              <button 
                onClick={() => setIsCollapsed(true)} 
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition lg:block hidden"
                title="Colapsar Menu"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links Scrollable Area */}
          <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-3">
            
            {/* SECTION 1: PRINCIPAL (Admin Only) */}
            {currentUser.role === 'admin' && (
              <div className="space-y-1">
                {!isCollapsed ? (
                  <span className="text-[9px] font-black text-slate-400 px-3 uppercase tracking-widest block mb-1">
                    PRINCIPAL
                  </span>
                ) : (
                  <div className="border-t border-slate-800 my-1.5" />
                )}
                
                <button
                  id="nav-btn-dashboard"
                  onClick={() => handleNavigateWithPermission('dashboard')}
                  className={`w-full py-2 px-3 rounded-lg text-xs transition flex items-center justify-between ${
                    activeTab === 'dashboard'
                      ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                  }`}
                  title="PAINEL GERAL"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-brand' : 'text-slate-400'}`} />
                    {!isCollapsed && <span>PAINEL GERAL</span>}
                  </div>
                </button>
              </div>
            )}

            {/* SECTION 2: OPERACIONAL */}
            <div className="space-y-1">
              {!isCollapsed ? (
                <span className="text-[9px] font-black text-slate-400 px-3 uppercase tracking-widest block mb-1">
                  OPERACIONAL
                </span>
              ) : (
                <div className="border-t border-slate-800 my-1.5" />
              )}

              {/* Fatura Recibo */}
              <button
                id="nav-btn-pos"
                onClick={() => handleNavigateWithPermission('pos')}
                className={`w-full py-2 px-3 rounded-lg text-xs transition flex items-center justify-between ${
                  activeTab === 'pos'
                    ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                }`}
                title="FATURA RECIBO"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className={`w-4 h-4 ${activeTab === 'pos' ? 'text-brand' : 'text-slate-400'}`} />
                  {!isCollapsed && <span>FATURA RECIBO</span>}
                </div>
              </button>

              {/* Recibos (RC) */}
              <button
                id="nav-btn-recibo"
                onClick={() => handleNavigateWithPermission('recibo')}
                className={`w-full py-2 px-3 rounded-lg text-xs transition flex items-center justify-between ${
                  activeTab === 'recibo'
                    ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                }`}
                title="RECIBOS (RC)"
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className={`w-4 h-4 ${activeTab === 'recibo' ? 'text-brand' : 'text-slate-400'}`} />
                  {!isCollapsed && <span>RECIBOS (RC)</span>}
                </div>
              </button>

              {/* Faturas por Liquidar */}
              <button
                id="nav-btn-faturas-por-liquidar"
                onClick={() => handleNavigateWithPermission('faturas-por-liquidar')}
                className={`w-full py-2 px-3 rounded-lg text-xs transition flex items-center justify-between ${
                  activeTab === 'faturas-por-liquidar'
                    ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                }`}
                title="FATURA POR LIQUIDAR"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className={`w-4 h-4 ${activeTab === 'faturas-por-liquidar' ? 'text-brand' : 'text-slate-400'}`} />
                  {!isCollapsed && <span>FATURA POR LIQUIDAR</span>}
                </div>
              </button>

              {/* GUIAS Section (Expandable) */}
              <div className="space-y-1">
                <button
                  id="nav-btn-guias-group"
                  onClick={() => setIsGuiasExpanded(!isGuiasExpanded)}
                  className={`w-full py-2 px-3 rounded-lg text-xs transition flex items-center justify-between ${
                    activeTab === 'guia' || activeTab === 'guia-transporte'
                      ? 'bg-slate-800/30 text-white font-bold'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                  }`}
                  title="GUIAS DE CIRCULAÇÃO"
                >
                  <div className="flex items-center gap-2.5">
                    <Truck className={`w-4 h-4 ${activeTab === 'guia' || activeTab === 'guia-transporte' ? 'text-brand' : 'text-slate-400'}`} />
                    {!isCollapsed && <span>GUIAS</span>}
                  </div>
                  {!isCollapsed && (
                    isGuiasExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )
                  )}
                </button>

                {/* Submenu Options */}
                {isGuiasExpanded && (
                  <div className={`${!isCollapsed ? 'pl-4' : 'pl-0'} mt-1 space-y-1`}>
                    {/* Guia de Remessa */}
                    <button
                      id="nav-btn-guia"
                      onClick={() => handleNavigateWithPermission('guia')}
                      className={`w-full py-1.5 px-3 rounded-lg text-[11px] transition flex items-center justify-between ${
                        activeTab === 'guia'
                          ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                      }`}
                      title="GUIA DE REMESSA"
                    >
                      <div className="flex items-center gap-2">
                        <span>GUIA DE REMESSA</span>
                      </div>
                    </button>

                    {/* Guia de Transporte */}
                    <button
                      id="nav-btn-guia-transporte"
                      onClick={() => handleNavigateWithPermission('guia-transporte')}
                      className={`w-full py-1.5 px-3 rounded-lg text-[11px] transition flex items-center justify-between ${
                        activeTab === 'guia-transporte'
                          ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                      }`}
                      title="GUIA DE TRANSPORTE"
                    >
                      <div className="flex items-center gap-2">
                        <span>GUIA DE TRANSPORTE</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Documentos */}
              <button
                id="nav-btn-invoices"
                onClick={() => handleNavigateWithPermission('invoices')}
                className={`w-full py-2 px-3 rounded-lg text-xs transition flex items-center justify-between ${
                  activeTab === 'invoices'
                    ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                }`}
                title="DOCUMENTOS"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className={`w-4 h-4 ${activeTab === 'invoices' ? 'text-brand' : 'text-slate-400'}`} />
                  {!isCollapsed && <span>DOCUMENTOS</span>}
                </div>
              </button>
            </div>

            {/* SECTION 3: GESTÃO DE STOCK (Admin Only) */}
            {currentUser.role === 'admin' && (
              <div className="space-y-1">
                {!isCollapsed ? (
                  <span className="text-[9px] font-black text-slate-400 px-3 uppercase tracking-widest block mb-1">
                    GESTÃO DE STOCK
                  </span>
                ) : (
                  <div className="border-t border-slate-800 my-1.5" />
                )}

                {/* Armazéns */}
                <button
                  id="nav-btn-armazens"
                  onClick={() => handleNavigateWithPermission('armazens')}
                  className={`w-full py-2 px-3 rounded-lg text-xs transition flex items-center justify-between ${
                    activeTab === 'armazens'
                      ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                  }`}
                  title="ARMAZÉNS"
                >
                  <div className="flex items-center gap-2.5">
                    <Warehouse className={`w-4 h-4 ${activeTab === 'armazens' ? 'text-brand' : 'text-slate-400'}`} />
                    {!isCollapsed && <span>ARMAZÉNS</span>}
                  </div>
                </button>

                {/* Meus Produtos */}
                <button
                  id="nav-btn-products"
                  onClick={() => handleNavigateWithPermission('products')}
                  className={`w-full py-2 px-3 rounded-lg text-xs transition flex items-center justify-between ${
                    activeTab === 'products'
                      ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                  }`}
                  title="MEUS PRODUTOS"
                >
                  <div className="flex items-center gap-2.5">
                    <Boxes className={`w-4 h-4 ${activeTab === 'products' ? 'text-brand' : 'text-slate-400'}`} />
                    {!isCollapsed && <span>MEUS PRODUTOS</span>}
                  </div>
                </button>
              </div>
            )}

            {/* SECTION 4: TESOURARIA */}
            <div className="space-y-1">
              {!isCollapsed ? (
                <span className="text-[9px] font-black text-slate-400 px-3 uppercase tracking-widest block mb-1">
                  TESOURARIA
                </span>
              ) : (
                <div className="border-t border-slate-800 my-1.5" />
              )}

              {/* Módulo SAF-T (AO) (Admin only) */}
              {currentUser.role === 'admin' && (
                <button
                  id="nav-btn-saft"
                  onClick={() => handleNavigateWithPermission('saft')}
                  className={`w-full py-2 px-3 rounded-lg text-xs transition flex items-center justify-between ${
                    activeTab === 'saft'
                      ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                  }`}
                  title="MÓDULO SAF-T (AO)"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className={`w-4 h-4 ${activeTab === 'saft' ? 'text-brand' : 'text-slate-400'}`} />
                    {!isCollapsed && <span>MÓDULO SAF-T (AO)</span>}
                  </div>
                </button>
              )}

              {/* Integração AGT (Admin only) */}
              {currentUser.role === 'admin' && (
                <button
                  id="nav-btn-agt"
                  onClick={() => handleNavigateWithPermission('agt')}
                  className={`w-full py-2 px-3 rounded-lg text-xs transition flex items-center justify-between ${
                    activeTab === 'agt'
                      ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                  }`}
                  title="INTEGRAÇÃO AGT"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className={`w-4 h-4 ${activeTab === 'agt' ? 'text-brand' : 'text-slate-400'}`} />
                    {!isCollapsed && <span>INTEGRAÇÃO AGT</span>}
                  </div>
                </button>
              )}

              {/* RELATÓRIOS FINANCEIROS Section (Expandable) */}
              <div className="space-y-1">
                <button
                  id="nav-btn-relatorios-group"
                  onClick={() => setIsRelatoriosExpanded(!isRelatoriosExpanded)}
                  className={`w-full py-2 px-3 rounded-lg text-xs transition flex items-center justify-between ${
                    ['relatorios', 'pagamentos', 'turnos'].includes(activeTab)
                      ? 'bg-slate-800/30 text-white font-bold'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                  }`}
                  title="RELATÓRIOS FINANCEIROS"
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className={`w-4 h-4 ${['relatorios', 'pagamentos', 'turnos'].includes(activeTab) ? 'text-brand' : 'text-slate-400'}`} />
                    {!isCollapsed && <span>RELATÓRIOS FINANCEIROS</span>}
                  </div>
                  {!isCollapsed && (
                    isRelatoriosExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )
                  )}
                </button>

                {isRelatoriosExpanded && (
                  <div className={`${!isCollapsed ? 'pl-4' : 'pl-0'} mt-1 space-y-1`}>
                    {/* Relatórios Financeiros */}
                    {currentUser.role === 'admin' && (
                      <button
                        id="nav-btn-relatorios"
                        onClick={() => handleNavigateWithPermission('relatorios')}
                        className={`w-full py-1.5 px-3 rounded-lg text-[11px] transition flex items-center justify-between ${
                          activeTab === 'relatorios'
                            ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                        }`}
                        title="RELATÓRIOS FINANCEIROS"
                      >
                        <div className="flex items-center gap-2">
                          <span>RELATÓRIOS FINANCEIROS</span>
                        </div>
                      </button>
                    )}

                    {/* Saídas / Pagamentos */}
                    {currentUser.role === 'admin' && (
                      <button
                        id="nav-btn-pagamentos"
                        onClick={() => handleNavigateWithPermission('pagamentos')}
                        className={`w-full py-1.5 px-3 rounded-lg text-[11px] transition flex items-center justify-between ${
                          activeTab === 'pagamentos'
                            ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                        }`}
                        title="SAÍDAS / PAGAMENTOS"
                      >
                        <div className="flex items-center gap-2">
                          <span>SAÍDAS / PAGAMENTOS</span>
                        </div>
                      </button>
                    )}

                    {/* Gestão de Turnos */}
                    <button
                      id="nav-btn-turnos"
                      onClick={() => handleNavigateWithPermission('turnos')}
                      className={`w-full py-1.5 px-3 rounded-lg text-[11px] transition flex items-center justify-between ${
                        activeTab === 'turnos'
                          ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                      }`}
                      title="GESTÃO DE TURNOS"
                    >
                      <div className="flex items-center gap-2">
                        <span>GESTÃO DE TURNOS</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 5: CLIENTES */}
            <div className="space-y-1">
              <button
                id="nav-btn-customers"
                onClick={() => handleNavigateWithPermission('customers')}
                className={`w-full py-2 px-3 rounded-lg text-xs transition flex items-center justify-between ${
                  activeTab === 'customers'
                    ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                }`}
                title="CLIENTES"
              >
                <div className="flex items-center gap-2.5">
                  <Users className={`w-4 h-4 ${activeTab === 'customers' ? 'text-brand' : 'text-slate-400'}`} />
                  {!isCollapsed && <span>CLIENTES</span>}
                </div>
              </button>
            </div>

            {/* SECTION 6: CONFIGURAÇÕES E ACESSOS (Admin Only) */}
            {currentUser.role === 'admin' && (
              <div className="space-y-1">
                <button
                  id="nav-btn-config-group"
                  onClick={() => setIsConfigExpanded(!isConfigExpanded)}
                  className={`w-full py-2 px-3 rounded-lg text-xs transition flex items-center justify-between ${
                    ['operacoes', 'users', 'config'].includes(activeTab)
                      ? 'bg-slate-800/30 text-white font-bold'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                  }`}
                  title="CONFIGURAÇÕES & ACESSOS"
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className={`w-4 h-4 ${['operacoes', 'users', 'config'].includes(activeTab) ? 'text-brand' : 'text-slate-400'}`} />
                    {!isCollapsed && <span>CONFIGURAÇÕES & ACESSOS</span>}
                  </div>
                  {!isCollapsed && (
                    isConfigExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )
                  )}
                </button>

                {isConfigExpanded && (
                  <div className={`${!isCollapsed ? 'pl-4' : 'pl-0'} mt-1 space-y-1`}>
                    {/* Operações Gerais */}
                    <button
                      id="nav-btn-operacoes"
                      onClick={() => handleNavigateWithPermission('operacoes')}
                      className={`w-full py-1.5 px-3 rounded-lg text-[11px] transition flex items-center justify-between ${
                        activeTab === 'operacoes'
                          ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                      }`}
                      title="OPERAÇÕES GERAIS"
                    >
                      <div className="flex items-center gap-2">
                        <span>OPERAÇÕES GERAIS</span>
                      </div>
                    </button>

                    {/* Utilizadores & Perfis */}
                    <button
                      id="nav-btn-users"
                      onClick={() => handleNavigateWithPermission('users')}
                      className={`w-full py-1.5 px-3 rounded-lg text-[11px] transition flex items-center justify-between ${
                        activeTab === 'users'
                          ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                      }`}
                      title="UTILIZADORES & ACESSOS"
                    >
                      <div className="flex items-center gap-2">
                        <span>UTILIZADORES & PERFIS</span>
                      </div>
                    </button>

                    {/* Configurações Gerais */}
                    <button
                      id="nav-btn-config"
                      onClick={() => handleNavigateWithPermission('config')}
                      className={`w-full py-1.5 px-3 rounded-lg text-[11px] transition flex items-center justify-between ${
                        activeTab === 'config'
                          ? 'bg-[#10141d] border-r-4 border-brand text-white font-black shadow-2xs'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-bold'
                      }`}
                      title="CONFIGURAÇÕES"
                    >
                      <div className="flex items-center gap-2">
                        <span>CONFIGURAÇÕES GERAIS</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Footer with clock & Collapse Button */}
        <div className="p-4 border-t border-slate-800/80 bg-[#12171f] flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            {!isCollapsed ? (
              <div className="flex items-center gap-2 text-xxs text-slate-400 font-bold">
                <Clock className="w-3.5 h-3.5 text-brand" />
                <span>{currentTime || '--:--:--'}</span>
              </div>
            ) : (
              <div className="w-2" />
            )}
            
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition lg:block hidden"
              title={isCollapsed ? "Expandir Menu" : "Colapsar Menu"}
            >
              <ChevronLeft className={`w-4 h-4 transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {!isCollapsed && (
            <div className="flex items-center gap-1.5 text-[9px] font-black border-t border-slate-200/60 pt-2">
              <span className={`inline-block w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span className={`${dbStatus.connected ? 'text-emerald-600' : 'text-amber-600'} uppercase tracking-wide`}>
                {dbStatus.connected ? 'MYSQL LIGADO' : 'FICHEIROS LOCAIS (FALLBACK)'}
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN VIEW CONTENT PANEL */}
      <main className="flex-1 min-w-0 p-3 sm:p-4 space-y-3 overflow-x-hidden" id="venda-mais-viewport">
        
        {/* TOP SYSTEM & USER SESSION HEADER */}
        <div className="bg-white p-2.5 px-3 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-light text-brand border border-brand-light flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
              {company.name ? company.name.substring(0, 2).toUpperCase() : 'VM'}
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-xs text-slate-900 truncate tracking-tight">{company.name}</h2>
              <p className="text-[10px] text-slate-500 font-bold">NIF: {company.nif} • Regime {company.regime}</p>
            </div>
          </div>

          {/* User Profile Badge & Switch Button */}
          <div className="flex items-center gap-2.5 bg-slate-50 p-1.5 pl-2.5 rounded-xl border border-slate-200/60 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs text-white ${
                currentUser.role === 'admin' ? 'bg-purple-600' : 'bg-emerald-600'
              }`}>
                {currentUser.name.charAt(0).toUpperCase()}
              </div>

              <div className="text-left leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-slate-900 truncate max-w-[140px]">{currentUser.name}</span>
                  {currentUser.role === 'admin' ? (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[9px] font-black uppercase tracking-wider">
                      <ShieldCheck className="w-2.5 h-2.5 text-purple-600" /> ADMIN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                      <UserCheck className="w-2.5 h-2.5 text-emerald-600" /> USUÁRIO NORMAL
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-mono">@{currentUser.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-1 transition cursor-pointer shadow-2xs"
                title="Sair / Encerrar Sessão"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Content router */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            products={products}
            customers={customers}
            invoices={invoices}
            keys={keys}
            company={company}
            currentUser={currentUser}
            onNavigate={(tab) => handleNavigateWithPermission(tab)}
            onOpenQuickCustomer={() => setIsQuickCustomerOpen(true)}
          />
        )}

        {activeTab === 'pos' && (
          <POS 
            products={products}
            customers={customers}
            company={company}
            keys={keys}
            currentUser={currentUser}
            onEmitInvoice={handleEmitInvoice}
            onNavigate={(tab) => handleNavigateWithPermission(tab)}
            lastInvoiceHash={lastInvoiceHash}
            onAddCustomer={addCustomer}
            onAddProduct={addProduct}
            onUpdateCompany={saveCompany}
          />
        )}

        {activeTab === 'operacoes' && (
          <GeneralOperations />
        )}

        {activeTab === 'guia' && (
          <DeliveryGuide 
            key="guia-remessa"
            guideType="remessa"
            products={products}
            customers={customers}
            company={company}
            onAddCustomer={addCustomer}
          />
        )}

        {activeTab === 'guia-transporte' && (
          <DeliveryGuide 
            key="guia-transporte"
            guideType="transporte"
            products={products}
            customers={customers}
            company={company}
            onAddCustomer={addCustomer}
          />
        )}

        {activeTab === 'armazens' && (
          <Warehouses 
            products={products}
            onUpdateProducts={saveProducts}
          />
        )}

        {activeTab === 'products' && (
          <ProductRegistry 
            products={products}
            company={company}
            onAddProduct={addProduct}
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct}
            onNavigate={(tab) => handleNavigateWithPermission(tab)}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerRegistry 
            customers={customers}
            company={company}
            onAddCustomer={addCustomer}
            onUpdateCustomer={updateCustomer}
            onDeleteCustomer={deleteCustomer}
          />
        )}

        {activeTab === 'saft' && (
          <SaftExport 
            company={company}
            products={products}
            customers={customers}
            invoices={invoices}
            keys={keys}
          />
        )}

        {activeTab === 'agt' && (
          <AgtIntegration 
            company={company}
            keys={keys}
            onUpdateKeys={saveKeys}
            onUpdateCompany={saveCompany}
          />
        )}

        {activeTab === 'relatorios' && (
          <FinancialReports 
            invoices={invoices}
            products={products}
            customers={customers}
            company={company}
            onNavigate={(tab) => handleNavigateWithPermission(tab)}
          />
        )}

        {activeTab === 'pagamentos' && (
          <OutflowsTracker />
        )}

        {activeTab === 'turnos' && (
          <ShiftManagement currentUser={currentUser} />
        )}

        {activeTab === 'invoices' && (
          <InvoicesList 
            invoices={invoices}
            company={company}
            keys={keys}
            products={products}
            currentUser={currentUser}
            onEmitCreditNote={handleEmitCreditNote}
            selectedInvoiceNoToView={selectedInvoiceNoToView}
            onClearSelectedInvoiceNoToView={() => setSelectedInvoiceNoToView(null)}
            onNavigateToReceipt={(invoice, createNew = false) => {
              if (createNew) {
                setPreselectedInvoiceForReceipt(invoice);
                setSelectedReceiptNoToView(null); // Clear any view targets
              } else if (invoice.linkedReceiptNo) {
                setSelectedReceiptNoToView(invoice.linkedReceiptNo);
                setPreselectedInvoiceForReceipt(null);
              }
              setActiveTab('recibo');
            }}
            onUpdateCompany={saveCompany}
          />
        )}

        {activeTab === 'recibo' && (
          <ReceiptPage 
            invoices={invoices}
            customers={customers}
            company={company}
            keys={keys}
            currentUser={currentUser}
            onEmitInvoice={handleEmitInvoice}
            lastInvoiceHash={lastInvoiceHash}
            preselectedInvoice={preselectedInvoiceForReceipt}
            onClearPreselected={() => setPreselectedInvoiceForReceipt(null)}
            selectedReceiptNoToView={selectedReceiptNoToView}
            onClearSelectedReceiptNoToView={() => setSelectedReceiptNoToView(null)}
            onNavigateToInvoice={(invoiceNo) => {
              setSelectedInvoiceNoToView(invoiceNo);
              setActiveTab('invoices');
            }}
          />
        )}

        {activeTab === 'faturas-por-liquidar' && (
          <UnpaidInvoices 
            invoices={invoices}
            customers={customers}
            company={company}
            onViewInvoice={(invoiceNo) => {
              setSelectedInvoiceNoToView(invoiceNo);
              setActiveTab('invoices');
            }}
            onSettleInvoice={(invoice) => {
              setPreselectedInvoiceForReceipt(invoice);
              setSelectedReceiptNoToView(null);
              setActiveTab('recibo');
            }}
          />
        )}

        {activeTab === 'users' && (
          <UserManagement 
            users={users}
            currentUser={currentUser}
            onAddUser={addUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
            onSwitchUser={(u) => {
              handleSwitchUser(u);
            }}
          />
        )}

        {activeTab === 'config' && (
          <SettingsConfig 
            company={company}
            onUpdateCompany={saveCompany}
          />
        )}

      </main>

      {/* QUICK NEW CUSTOMER FLOATING OVERLAY DIALOG */}
      {isQuickCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-gray-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-2 w-full max-w-lg shadow-2xl border border-gray-100">
            <CustomerRegistry 
              customers={customers}
              company={company}
              onAddCustomer={addCustomer}
              onUpdateCustomer={updateCustomer}
              onDeleteCustomer={deleteCustomer}
              isOpenDirectly={true}
              onCloseDirectly={() => setIsQuickCustomerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* SWITCH USER MODAL */}
      {isUserSwitchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-light text-brand rounded-2xl border border-brand-light">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Trocar de Utilizador</h3>
                  <p className="text-xs text-slate-500 font-medium">Selecione a conta para iniciar sessão</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsUserSwitchModalOpen(false);
                  setTargetUserToSwitch(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {!targetUserToSwitch ? (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {users.filter(u => u.active).map((user) => {
                    const isCurrent = user.id === currentUser.id;
                    const isAdmin = user.role === 'admin';

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSwitchUser(user)}
                        className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                          isCurrent
                            ? 'bg-brand-light border-brand ring-2 ring-brand/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white ${
                            isAdmin ? 'bg-purple-600' : 'bg-emerald-600'
                          }`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-xs text-slate-900">{user.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">@{user.username}</p>
                          </div>
                        </div>

                        {isAdmin ? (
                          <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                            ADMIN
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            OPERADOR
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <form onSubmit={handleConfirmUserPinSwitch} className="space-y-4">
                  <div className="p-3 bg-brand-light border border-brand-light rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand text-white font-black flex items-center justify-center">
                      {targetUserToSwitch.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-slate-900">{targetUserToSwitch.name}</p>
                      <p className="text-[10px] text-brand font-bold uppercase tracking-wider">
                        {targetUserToSwitch.role === 'admin' ? 'Administrador' : 'Usuário Normal'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                      Introduza o PIN do Utilizador *
                    </label>
                    <input
                      type="password"
                      autoFocus
                      required
                      maxLength={6}
                      placeholder="• • • •"
                      value={userPinInput}
                      onChange={(e) => setUserPinInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-center text-lg font-mono font-black tracking-widest focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setTargetUserToSwitch(null)}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-brand text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-brand-dark transition shadow-md cursor-pointer"
                    >
                      Confirmar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RESTRICTED ACCESS MODAL FOR OPERATOR */}
      {restrictedModalTab && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-amber-200 shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl border border-amber-200">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Acesso Restrito ao Administrador</h3>
                  <p className="text-xs text-amber-800 font-semibold">Perfil Limitado (Usuário Normal)</p>
                </div>
              </div>
              <button 
                onClick={() => setRestrictedModalTab(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                A funcionalidade que tenta aceder requer privilégios de <strong className="text-purple-700">Administrador</strong>.
              </p>

              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthorizeAdminTab} className="space-y-3 pt-1">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                    Digite o PIN de Administrador para Acesso
                  </label>
                  <input
                    type="password"
                    autoFocus
                    required
                    maxLength={6}
                    placeholder="• • • •"
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-center text-base font-mono font-black tracking-widest focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    Dica: O PIN padrão de Administrador é <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">1234</code>.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRestrictedModalTab(null);
                      setIsUserSwitchModalOpen(true);
                    }}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                  >
                    Trocar Utilizador
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-purple-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-purple-500 transition shadow-md shadow-purple-600/10 cursor-pointer"
                  >
                    Desbloquear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
