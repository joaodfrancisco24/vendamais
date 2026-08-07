/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Invoice, Product, Customer, CompanyConfig, KeysConfig } from '../types';

/**
 * Escapes strings for XML output
 */
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Normalizes NIF / TaxID to clean alphanumeric characters or default (min 10 chars)
 */
function normalizeTaxId(nif?: string, defaultVal: string = '9999999999'): string {
  if (!nif) return defaultVal;
  const clean = nif.trim().replace(/[^a-zA-Z0-9]/g, '');
  if (!clean) return defaultVal;
  if (clean.length < 10) {
    return clean.padEnd(10, '0');
  }
  return clean;
}

/**
 * Generates an Angolan AGT-compliant SAF-T (AO) 1.01_01 xml structure.
 */
export function generateSaftAoXml(
  company: CompanyConfig,
  products: Product[],
  customers: Customer[],
  invoices: Invoice[],
  keys: KeysConfig,
  startDate: string,
  endDate: string
): string {
  const dateCreated = new Date().toISOString().slice(0, 10);
  const year = startDate ? startDate.slice(0, 4) : new Date().getFullYear().toString();
  const companyTaxId = normalizeTaxId(company.nif, '5103105000');

  // Filter out Proforma invoices ('FP') because they are non-fiscal quotes and not allowed in SAF-T SalesInvoices
  const validFiscalInvoices = invoices.filter(inv => inv.type !== 'FP');
  
  // Calculate totals for SourceDocuments
  const numberOfEntries = validFiscalInvoices.length;
  let totalCredit = 0;
  let totalDebit = 0;

  validFiscalInvoices.forEach((inv) => {
    if (inv.status !== 'ANULADO') {
      if (inv.type === 'NC') {
        totalDebit += inv.total;
      } else {
        totalCredit += inv.total;
      }
    }
  });
  
  let xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:AO_1.01_01" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:OECD:StandardAuditFile-Tax:AO_1.01_01 https://raw.githubusercontent.com/assoft-portugal/SAF-T-AO/master/XSD/SAFTAO1.01_01.xsd">
	<Header>
		<AuditFileVersion>1.01_01</AuditFileVersion>
		<CompanyID>${escapeXml(companyTaxId)}</CompanyID>
		<TaxRegistrationNumber>${escapeXml(companyTaxId)}</TaxRegistrationNumber>
		<TaxAccountingBasis>F</TaxAccountingBasis>
		<CompanyName>${escapeXml(company.name || 'Empresa Comercial')}</CompanyName>
		<BusinessName>${escapeXml(company.name || 'Empresa Comercial')}</BusinessName>
		<CompanyAddress>
			<AddressDetail>${escapeXml(company.address || 'Avenida Principal')}</AddressDetail>
			<City>${escapeXml(company.city || 'Luanda')}</City>
			<PostalCode>0000</PostalCode>
			<Country>AO</Country>
		</CompanyAddress>
		<FiscalYear>${year}</FiscalYear>
		<StartDate>${startDate}</StartDate>
		<EndDate>${endDate}</EndDate>
		<CurrencyCode>AOA</CurrencyCode>
		<DateCreated>${dateCreated}</DateCreated>
		<TaxEntity>Global</TaxEntity>
		<ProductCompanyTaxID>${escapeXml(companyTaxId)}</ProductCompanyTaxID>
		<SoftwareValidationNumber>${escapeXml(keys.certId || '320/AGT/2026')}</SoftwareValidationNumber>
		<ProductID>VENDA MAIS/VENDA MAIS</ProductID>
		<ProductVersion>01.01.20</ProductVersion>
	</Header>
	<MasterFiles>
`;

  // 1. Customer Section
  customers.forEach((cust) => {
    const taxId = normalizeTaxId(cust.nif, '9999999999');
    xml += `		<Customer>
			<CustomerID>${cust.id}</CustomerID>
			<AccountID>Desconhecido</AccountID>
			<CustomerTaxID>${escapeXml(taxId)}</CustomerTaxID>
			<CompanyName>${escapeXml(cust.name)}</CompanyName>
			<BillingAddress>
				<AddressDetail>${escapeXml(cust.address || 'Consumidor Final')}</AddressDetail>
				<City>${escapeXml(company.city || 'Luanda')}</City>
				<PostalCode>0000</PostalCode>
				<Country>AO</Country>
			</BillingAddress>
			<SelfBillingIndicator>0</SelfBillingIndicator>
		</Customer>\n`;
  });

  // 2. Product Section
  products.forEach((prod) => {
    const type = prod.isService ? 'S' : 'P';
    xml += `		<Product>
			<ProductType>${type}</ProductType>
			<ProductCode>${escapeXml(prod.code)}</ProductCode>
			<ProductGroup>${escapeXml(prod.category || 'Geral')}</ProductGroup>
			<ProductDescription>${escapeXml(prod.name)}</ProductDescription>
			<ProductNumberCode>${escapeXml(prod.code)}</ProductNumberCode>
		</Product>\n`;
  });

  // 3. Tax Table Section
  xml += `		<TaxTable>
			<TaxTableEntry>
				<TaxType>IVA</TaxType>
				<TaxCountryRegion>AO</TaxCountryRegion>
				<TaxCode>NOR</TaxCode>
				<Description>Normal</Description>
				<TaxPercentage>14.000000</TaxPercentage>
			</TaxTableEntry>
			<TaxTableEntry>
				<TaxType>IVA</TaxType>
				<TaxCountryRegion>AO</TaxCountryRegion>
				<TaxCode>ISE</TaxCode>
				<Description>IVA Isento</Description>
				<TaxPercentage>0.000000</TaxPercentage>
			</TaxTableEntry>
		</TaxTable>
	</MasterFiles>
`;

  // 4. Invoices Section
  if (validFiscalInvoices.length > 0) {
    xml += `	<SourceDocuments>
		<SalesInvoices>
			<NumberOfEntries>${numberOfEntries}</NumberOfEntries>
			<TotalDebit>${totalDebit.toFixed(2)}</TotalDebit>
			<TotalCredit>${totalCredit.toFixed(2)}</TotalCredit>\n`;

    validFiscalInvoices.forEach((inv) => {
      const invoiceMonth = new Date(inv.date).getMonth() + 1;
      const statusDate = `${inv.date}T12:00:00`;
      const invStatus = inv.status === 'ANULADO' ? 'A' : 'N';
      const operator = inv.operator || 'Operador Principal';

      const methodStr = (inv.paymentMethod as string) || '';
      let pm = 'NU';
      if (methodStr === 'Multicaixa' || methodStr === 'Cartão' || methodStr === 'MB') {
        pm = 'MB';
      } else if (methodStr === 'Transferência' || methodStr === 'TB') {
        pm = 'TB';
      } else if (methodStr === 'Crédito' || methodStr === 'OU') {
        pm = 'OU';
      }

      xml += `			<Invoice>
				<InvoiceNo>${escapeXml(inv.invoiceNo)}</InvoiceNo>
				<DocumentStatus>
					<InvoiceStatus>${invStatus}</InvoiceStatus>
					<InvoiceStatusDate>${statusDate}</InvoiceStatusDate>
					<SourceID>${escapeXml(operator)}</SourceID>
					<SourceBilling>P</SourceBilling>
				</DocumentStatus>
				<Hash>${escapeXml(inv.hash || '0')}</Hash>
				<HashControl>1</HashControl>
				<Period>${invoiceMonth}</Period>
				<InvoiceDate>${inv.date}</InvoiceDate>
				<InvoiceType>${inv.type}</InvoiceType>
				<SpecialRegimes>
					<SelfBillingIndicator>0</SelfBillingIndicator>
					<CashVATSchemeIndicator>0</CashVATSchemeIndicator>
					<ThirdPartiesBillingIndicator>0</ThirdPartiesBillingIndicator>
				</SpecialRegimes>
				<SourceID>${escapeXml(operator)}</SourceID>
				<SystemEntryDate>${statusDate}</SystemEntryDate>
				<CustomerID>${inv.customer.id}</CustomerID>\n`;

      // Line items
      inv.items.forEach((item, idx) => {
        const lineNo = idx + 1;
        const taxCode = item.taxRate > 0 ? 'NOR' : 'ISE';
        const lineCredit = inv.type === 'NC' ? 0 : item.total;
        const lineDebit = inv.type === 'NC' ? item.total : 0;

        xml += `				<Line>
					<LineNumber>${lineNo}</LineNumber>
					<ProductCode>${escapeXml(item.productCode)}</ProductCode>
					<ProductDescription>${escapeXml(item.productName)}</ProductDescription>
					<Quantity>${item.quantity.toFixed(2)}</Quantity>
					<UnitOfMeasure>UN</UnitOfMeasure>
					<UnitPrice>${item.price.toFixed(2)}</UnitPrice>
					<TaxPointDate>${inv.date}</TaxPointDate>
					<Description>${escapeXml(item.productName)}</Description>\n`;

        if (inv.type === 'NC') {
          xml += `					<DebitAmount>${lineDebit.toFixed(2)}</DebitAmount>\n`;
        } else {
          xml += `					<CreditAmount>${lineCredit.toFixed(2)}</CreditAmount>\n`;
        }

        xml += `					<Tax>
						<TaxType>IVA</TaxType>
						<TaxCountryRegion>AO</TaxCountryRegion>
						<TaxCode>${taxCode}</TaxCode>
						<TaxPercentage>${item.taxRate.toFixed(2)}</TaxPercentage>
					</Tax>\n`;

        if (item.taxRate === 0) {
          const reason = "Isento nos termos do Artigo 12.º do CIVA";
          const exemptionCode = "M02";
          xml += `					<TaxExemptionReason>${escapeXml(reason)}</TaxExemptionReason>
					<TaxExemptionCode>${exemptionCode}</TaxExemptionCode>\n`;
        }

        if (item.discount > 0) {
          const discountAmt = (item.price * item.quantity * item.discount) / 100;
          xml += `					<SettlementAmount>${discountAmt.toFixed(2)}</SettlementAmount>\n`;
        }

        xml += `				</Line>\n`;
      });

      // Invoice Totals
      const netTotal = inv.total - inv.taxTotal;
      xml += `				<DocumentTotals>
					<TaxPayable>${inv.taxTotal.toFixed(2)}</TaxPayable>
					<NetTotal>${netTotal.toFixed(2)}</NetTotal>
					<GrossTotal>${inv.total.toFixed(2)}</GrossTotal>
					<Payment>
						<PaymentMechanism>${pm}</PaymentMechanism>
						<PaymentAmount>${inv.total.toFixed(2)}</PaymentAmount>
						<PaymentDate>${inv.date}</PaymentDate>
					</Payment>
				</DocumentTotals>
			</Invoice>\n`;
    });

    xml += `		</SalesInvoices>
	</SourceDocuments>\n`;
  } else {
    xml += `	<SourceDocuments>
		<SalesInvoices>
			<NumberOfEntries>0</NumberOfEntries>
			<TotalDebit>0.00</TotalDebit>
			<TotalCredit>0.00</TotalCredit>
		</SalesInvoices>
	</SourceDocuments>\n`;
  }

  xml += `</AuditFile>`;
  return xml;
}

