import type { Business } from '@/features/business/api';
import { formatClientDocument, formatPhone } from '@/features/clients/format';
import { digitsOnly, formatDocument } from '@/utils/documents';
import type { QuoteWithItems } from './api';
import { formatDateForDisplay } from './date';
import {
  formatMoney,
  formatQuoteNumber,
  getDisplayQuoteStatus,
  quoteStatusLabels,
} from './domain';
import type { DisplayQuoteStatus } from './domain';

export interface QuoteDocumentItem {
  description: string | null;
  name: string;
  quantity: number;
  totalCents: number;
  unitPriceCents: number;
}

export interface QuoteDocumentData {
  client: {
    document: string | null;
    email: string | null;
    name: string;
    phone: string | null;
  };
  discountCents: number;
  id: string;
  issuedOn: string;
  issuer: {
    document: string | null;
    documentLabel: 'CPF' | 'CNPJ' | null;
    email: string;
    name: string;
    phone: string;
  };
  items: QuoteDocumentItem[];
  notes: string | null;
  number: number;
  status: DisplayQuoteStatus;
  subtotalCents: number;
  totalCents: number;
  validUntil: string;
}

export interface QuoteDocumentIdentity {
  businessId: string;
  quoteId: string;
  userId: string;
}

function optionalText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function formatSnapshotDocument(value: string | null) {
  const normalized = optionalText(value);
  if (!normalized) return null;
  const digits = digitsOnly(normalized);
  if (digits.length === 11) return formatClientDocument(digits, 'person');
  if (digits.length === 14) return formatClientDocument(digits, 'company');
  return normalized;
}

function assertSafeCents(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`INVALID_QUOTE_DOCUMENT_${field}`);
}

export function buildQuoteDocumentData(
  quote: QuoteWithItems,
  business: Business,
  expected: QuoteDocumentIdentity,
  today = new Date(),
): QuoteDocumentData {
  if (
    business.id !== expected.businessId ||
    business.owner_id !== expected.userId
  )
    throw new Error('QUOTE_DOCUMENT_BUSINESS_IDENTITY_MISMATCH');
  if (
    quote.id !== expected.quoteId ||
    quote.business_id !== expected.businessId
  )
    throw new Error('QUOTE_DOCUMENT_QUOTE_IDENTITY_MISMATCH');
  if (!quote.items.length) throw new Error('QUOTE_DOCUMENT_REQUIRES_ITEMS');

  let calculatedSubtotal = 0;
  const items = quote.items.map((item) => {
    if (item.quote_id !== quote.id)
      throw new Error('QUOTE_DOCUMENT_ITEM_IDENTITY_MISMATCH');
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0)
      throw new Error('INVALID_QUOTE_DOCUMENT_QUANTITY');
    assertSafeCents(item.unit_price_cents, 'UNIT_PRICE');
    assertSafeCents(item.item_total_cents, 'ITEM_TOTAL');
    const expectedTotal = item.quantity * item.unit_price_cents;
    if (
      !Number.isSafeInteger(expectedTotal) ||
      expectedTotal !== item.item_total_cents
    )
      throw new Error('QUOTE_DOCUMENT_ITEM_TOTAL_MISMATCH');
    calculatedSubtotal += item.item_total_cents;
    if (!Number.isSafeInteger(calculatedSubtotal))
      throw new Error('QUOTE_DOCUMENT_SUBTOTAL_TOO_LARGE');
    return {
      description: optionalText(item.description_snapshot),
      name: item.name_snapshot.trim(),
      quantity: item.quantity,
      totalCents: item.item_total_cents,
      unitPriceCents: item.unit_price_cents,
    };
  });

  assertSafeCents(quote.subtotal_cents, 'SUBTOTAL');
  assertSafeCents(quote.discount_cents, 'DISCOUNT');
  assertSafeCents(quote.total_cents, 'TOTAL');
  if (
    calculatedSubtotal !== quote.subtotal_cents ||
    quote.discount_cents > quote.subtotal_cents ||
    quote.total_cents !== quote.subtotal_cents - quote.discount_cents
  )
    throw new Error('QUOTE_DOCUMENT_TOTALS_MISMATCH');

  const issuerDocument = optionalText(business.document_number);
  return {
    client: {
      document: formatSnapshotDocument(quote.client_document_snapshot),
      email: optionalText(quote.client_email_snapshot),
      name: quote.client_name_snapshot.trim(),
      phone: optionalText(quote.client_phone_snapshot)
        ? formatPhone(quote.client_phone_snapshot ?? '')
        : null,
    },
    discountCents: quote.discount_cents,
    id: quote.id,
    issuedOn: quote.issued_on,
    issuer: {
      document: issuerDocument
        ? formatDocument(issuerDocument, business.document_type)
        : null,
      documentLabel: issuerDocument
        ? business.document_type === 'cnpj'
          ? 'CNPJ'
          : 'CPF'
        : null,
      email: business.email.trim(),
      name: business.business_name.trim(),
      phone: formatPhone(business.professional_phone),
    },
    items,
    notes: optionalText(quote.notes),
    number: quote.quote_number,
    status: getDisplayQuoteStatus(quote.status, quote.valid_until, today),
    subtotalCents: quote.subtotal_cents,
    totalCents: quote.total_cents,
    validUntil: quote.valid_until,
  };
}

export function quotePdfFilename(number: number) {
  return `orcamento-${formatQuoteNumber(number)}.pdf`;
}

export function escapeQuoteHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function detail(label: string, value: string | null) {
  return value
    ? `<div class="detail"><span>${escapeQuoteHtml(label)}</span><strong>${escapeQuoteHtml(value)}</strong></div>`
    : '';
}

export function renderQuoteDocumentHtml(data: QuoteDocumentData) {
  const status = quoteStatusLabels[data.status].toUpperCase();
  const items = data.items
    .map(
      (item) => `<tr>
        <td><strong>${escapeQuoteHtml(item.name)}</strong>${
          item.description
            ? `<small>${escapeQuoteHtml(item.description)}</small>`
            : ''
        }</td>
        <td class="number">${item.quantity.toLocaleString('pt-BR')}</td>
        <td class="number">${escapeQuoteHtml(formatMoney(item.unitPriceCents))}</td>
        <td class="number total-cell">${escapeQuoteHtml(formatMoney(item.totalCents))}</td>
      </tr>`,
    )
    .join('');
  const issuerDocument =
    data.issuer.document && data.issuer.documentLabel
      ? `${data.issuer.documentLabel}: ${data.issuer.document}`
      : null;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Orçamento ${formatQuoteNumber(data.number)}</title>
  <style>
    @page { size: A4; margin: 15mm 14mm 18mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; color: #26232d; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.42; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; padding-bottom: 14px; border-bottom: 2px solid #4c3a9e; }
    .brand { color: #4c3a9e; font-size: 9pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    h1 { margin: 3px 0 0; font-size: 24pt; line-height: 1.1; }
    .number-block { text-align: right; white-space: nowrap; }
    .number-block strong { display: block; font-size: 13pt; }
    .status { display: inline-block; margin-top: 7px; padding: 4px 8px; border: 1px solid #4c3a9e; border-radius: 999px; color: #4c3a9e; font-size: 8pt; font-weight: 700; letter-spacing: .06em; }
    .status.draft { border-style: dashed; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
    .panel { border: 1px solid #dedbe7; border-radius: 10px; padding: 12px; break-inside: avoid; }
    .panel h2, .section-title { margin: 0 0 8px; color: #4c3a9e; font-size: 8.5pt; letter-spacing: .08em; text-transform: uppercase; }
    .detail { margin-top: 5px; }
    .detail span { display: block; color: #676270; font-size: 8pt; }
    .detail strong { font-weight: 600; overflow-wrap: anywhere; }
    .dates { display: flex; justify-content: space-between; gap: 18px; margin-top: 12px; padding: 10px 12px; background: #f6f4fa; border-radius: 8px; break-inside: avoid; }
    .dates div { flex: 1; }
    .dates span { display: block; color: #676270; font-size: 8pt; }
    .dates strong { font-size: 10.5pt; }
    .items { margin-top: 18px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    thead { display: table-header-group; }
    th { padding: 8px 7px; color: #fff; background: #4c3a9e; font-size: 8pt; text-align: left; text-transform: uppercase; }
    th:first-child { border-radius: 6px 0 0 6px; width: 49%; }
    th:last-child { border-radius: 0 6px 6px 0; }
    th.number, td.number { text-align: right; }
    tbody tr { break-inside: avoid; page-break-inside: avoid; }
    td { padding: 9px 7px; border-bottom: 1px solid #e8e5ed; vertical-align: top; overflow-wrap: anywhere; }
    td small { display: block; margin-top: 3px; color: #676270; font-size: 8.3pt; line-height: 1.35; }
    .total-cell { font-weight: 700; }
    .closing { display: grid; grid-template-columns: minmax(0, 1fr) 240px; gap: 16px; align-items: start; margin-top: 18px; }
    .notes { min-height: 80px; padding: 12px; border: 1px solid #dedbe7; border-radius: 10px; white-space: pre-wrap; overflow-wrap: anywhere; break-inside: avoid; }
    .notes p { margin: 0; }
    .summary { padding: 12px; background: #f6f4fa; border-radius: 10px; break-inside: avoid; }
    .summary-row { display: flex; justify-content: space-between; gap: 12px; margin: 5px 0; }
    .summary-row span:last-child { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .grand-total { margin-top: 9px; padding-top: 9px; border-top: 1px solid #c9c3d8; color: #4c3a9e; font-size: 14pt; font-weight: 700; }
    .footer { position: fixed; left: 0; right: 0; bottom: -12mm; display: flex; justify-content: space-between; color: #77717f; font-size: 7.5pt; }
    .page-number::after { content: counter(page); }
    @media (max-width: 520px) { .grid, .closing { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header class="header">
    <div><div class="brand">ResolveMEI</div><h1>Orçamento</h1></div>
    <div class="number-block"><span>Número</span><strong>#${formatQuoteNumber(data.number)}</strong><span class="status ${data.status}">${escapeQuoteHtml(status)}</span></div>
  </header>
  <section class="grid">
    <div class="panel"><h2>Emissor</h2>${detail('Profissional', data.issuer.name)}${detail('Telefone', data.issuer.phone)}${detail('E-mail', data.issuer.email)}${detail('Documento', issuerDocument)}</div>
    <div class="panel"><h2>Cliente</h2>${detail('Nome', data.client.name)}${detail('Telefone', data.client.phone)}${detail('E-mail', data.client.email)}</div>
  </section>
  <section class="dates"><div><span>Emissão</span><strong>${formatDateForDisplay(data.issuedOn)}</strong></div><div><span>Validade</span><strong>${formatDateForDisplay(data.validUntil)}</strong></div></section>
  <section class="items"><h2 class="section-title">Itens do orçamento</h2><table><thead><tr><th>Serviço</th><th class="number">Qtd.</th><th class="number">Valor unitário</th><th class="number">Total</th></tr></thead><tbody>${items}</tbody></table></section>
  <section class="closing">
    <div>${data.notes ? `<div class="notes"><h2 class="section-title">Observações</h2><p>${escapeQuoteHtml(data.notes)}</p></div>` : ''}</div>
    <div class="summary"><h2 class="section-title">Resumo</h2><div class="summary-row"><span>Subtotal</span><span>${escapeQuoteHtml(formatMoney(data.subtotalCents))}</span></div>${data.discountCents > 0 ? `<div class="summary-row"><span>Desconto</span><span>− ${escapeQuoteHtml(formatMoney(data.discountCents))}</span></div>` : ''}<div class="summary-row grand-total"><span>Total</span><span>${escapeQuoteHtml(formatMoney(data.totalCents))}</span></div></div>
  </section>
  <footer class="footer"><span>Gerado com ResolveMEI · ${escapeQuoteHtml(data.issuer.phone)}</span><span>Página <span class="page-number"></span></span></footer>
</body>
</html>`;
}
