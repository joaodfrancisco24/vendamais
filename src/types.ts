/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  code: string; // Barcode or internal reference
  name: string;
  category: string;
  brand?: string;
  model?: string;
  price: number; // Selling price (including or excluding VAT based on config, we'll store final price)
  buyPrice: number; // Purchase price
  taxType: 'IVA14' | 'ISE'; // IVA 14% or Exempt (Isento)
  exemptionReason?: string; // e.g. "Isento nos termos do Artigo 12.º do CIVA"
  exemptionCode?: string; // AGT Exemption Code, e.g., "M02"
  stock: number;
  minStock: number;
  maxStock: number;
  unit: string; // e.g., 'UN', 'KG', 'L'
  imageUrl?: string;
  isService?: boolean;
  warehouseId?: string;
  warehouse?: string; // Warehouse name for quick rendering
}

export interface Customer {
  id: string;
  name: string;
  nif: string; // Angolan Fiscal Identification Number (9 digits)
  email?: string;
  phone?: string;
  address?: string;
}

export interface InvoiceLine {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  price: number;
  discount: number; // percentage or fixed
  taxRate: number; // 14 or 0
  taxAmount: number;
  total: number; // final total for line after discount
}

export type InvoiceType = 'FR' | 'FT' | 'NC' | 'FP' | 'RC'; // FR=Factura Recibo, FT=Factura, NC=Nota de Crédito, FP=Fatura Proforma, RC=Recibo de Liquidação

export interface Invoice {
  id: string;
  invoiceNo: string; // e.g. FR VMAIS2026/001
  sequenceNumber: number;
  type: InvoiceType;
  date: string; // ISO String or YYYY-MM-DD
  customer: Customer;
  items: InvoiceLine[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  withholdingTaxRate?: number;
  withholdingTaxAmount?: number;
  paymentMethod: 'Numerário' | 'Multicaixa' | 'Transferência' | 'Misto';
  cashReceived?: number;
  cardReceived?: number;
  changeAmount?: number;
  paymentRef?: string;
  notes?: string;
  status: 'EMITIDO' | 'RECTIFICADO' | 'ANULADO';
  operator?: string;
  hash: string; // Signature hash generated from Private Key (SHA-1 RSA)
  hashControl: string; // Characters index/signature of hash for printing (e.g. "XyZ1")
  previousHash: string; // Hash of previous invoice in chain
  signedBy: string; // Certificate ID / developer ID
  rectifiedInvoiceNo?: string; // Original invoice number rectifying e.g. "FT VMAIS2026/001"
  reason?: string; // Reason for credit note / rectification
  linkedReceiptNo?: string; // For FT - linked receipt invoiceNo
  linkedInvoiceNo?: string; // For RC - linked invoice invoiceNo
}

export interface KeysConfig {
  privateKey: string;
  publicKey: string;
  certId: string; // e.g., "320/AGT/2026"
  keyName: string; // e.g., "Chave de Produção AGT"
  status: 'Ativa' | 'Não Configurada';
}

export interface BankAccount {
  id: string;
  bankName: string;
  iban: string;
  accountNumber?: string;
  holderName?: string;
  swiftCode?: string;
  isDefault?: boolean;
}

export interface DocumentPrintConfig {
  format: 'A4' | 'Ticket';
  autoPrint: boolean;
  ticketSize?: '55mm' | '58mm' | '80mm';
}

export interface PrintSettingsConfig {
  defaultPrinter?: string;
  copies?: number;
  showLogo?: boolean;
  showBankDetails?: boolean;
  openCashDrawer?: boolean;
  activeProfile?: string;
  documents: {
    FT: DocumentPrintConfig;
    FR: DocumentPrintConfig;
    NC: DocumentPrintConfig;
    RC: DocumentPrintConfig;
    PP: DocumentPrintConfig;
    OR: DocumentPrintConfig;
    PF: DocumentPrintConfig;
    GR: DocumentPrintConfig;
    GT: DocumentPrintConfig;
  };
}

export interface CompanyConfig {
  name: string;
  nif: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  shareCapital: number;
  regime: string; // "Geral" | "Simplificado" | "Exen"
  saftVersion: string; // "1.01_01"
  iban?: string;
  invoicingMode?: 'saft' | 'electronic';
  primaryColor?: string;
  logoUrl?: string;
  bankAccounts?: BankAccount[];
  showBankDetailsOnInvoices?: boolean;
  printSettings?: PrintSettingsConfig;
  themeMode?: 'light' | 'dark';
}

export type UserRole = 'admin' | 'operator';

export interface AppUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  password?: string;
  pin?: string;
  active: boolean;
  createdAt: string;
}

export interface AppState {
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  keys: KeysConfig;
  company: CompanyConfig;
  users?: AppUser[];
  currentUser?: AppUser;
}
