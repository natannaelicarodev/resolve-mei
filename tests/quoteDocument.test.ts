import type { Business } from '@/features/business/api';
import type { QuoteWithItems } from '@/features/quotes/api';
import {
  buildQuoteDocumentData,
  escapeQuoteHtml,
  quotePdfFilename,
  renderQuoteDocumentHtml,
} from '@/features/quotes/document';

const identity = {
  businessId: 'business-1',
  quoteId: 'quote-1',
  userId: 'user-1',
};

const business: Business = {
  id: identity.businessId,
  owner_id: identity.userId,
  business_name: 'Resolve Elétrica',
  document_type: 'cnpj',
  document_number: '11222333000181',
  professional_phone: '11987654321',
  email: 'contato@example.com',
  street: 'Rua que não vai para o PDF',
  number: '10',
  complement: null,
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  postal_code: '01001000',
  pix_key: 'segredo@example.com',
  logo_path: null,
  onboarding_completed: true,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
};

function quote(overrides: Partial<QuoteWithItems> = {}): QuoteWithItems {
  return {
    id: identity.quoteId,
    business_id: identity.businessId,
    client_id: 'client-1',
    quote_number: 2,
    status: 'draft',
    issued_on: '2026-08-30',
    valid_until: '2026-09-30',
    subtotal_cents: 250000,
    discount_cents: 10000,
    total_cents: 240000,
    notes: 'Materiais inclusos.',
    client_name_snapshot: 'Cliente do snapshot',
    client_document_snapshot: '12345678901',
    client_phone_snapshot: '11999998888',
    client_email_snapshot: 'cliente@example.com',
    created_at: '2026-08-30T12:00:00Z',
    updated_at: '2026-08-30T12:00:00Z',
    items: [
      {
        id: 'item-1',
        quote_id: identity.quoteId,
        service_id: 'service-1',
        name_snapshot: 'Instalação preservada',
        description_snapshot: 'Descrição preservada',
        quantity: 2,
        unit_price_cents: 125000,
        item_total_cents: 250000,
        position: 0,
        created_at: '2026-08-30T12:00:00Z',
        updated_at: '2026-08-30T12:00:00Z',
      },
    ],
    ...overrides,
  };
}

describe('quote document model', () => {
  it('preserves quote snapshots, persisted totals and civil dates', () => {
    const document = buildQuoteDocumentData(
      quote(),
      business,
      identity,
      new Date('2026-08-31T12:00:00Z'),
    );
    expect(document.client.name).toBe('Cliente do snapshot');
    expect(document.items[0]).toEqual({
      description: 'Descrição preservada',
      name: 'Instalação preservada',
      quantity: 2,
      totalCents: 250000,
      unitPriceCents: 125000,
    });
    expect(document).toMatchObject({
      discountCents: 10000,
      issuedOn: '2026-08-30',
      status: 'draft',
      subtotalCents: 250000,
      totalCents: 240000,
      validUntil: '2026-09-30',
    });
  });

  it('supports empty optional fields without inventing content', () => {
    const document = buildQuoteDocumentData(
      quote({
        client_document_snapshot: null,
        client_email_snapshot: null,
        client_phone_snapshot: null,
        notes: null,
      }),
      { ...business, document_number: null },
      identity,
    );
    expect(document.client).toMatchObject({
      document: null,
      email: null,
      phone: null,
    });
    expect(document.issuer.document).toBeNull();
    expect(document.notes).toBeNull();
  });

  it('rejects business, quote and item identity mismatches', () => {
    expect(() =>
      buildQuoteDocumentData(
        quote(),
        { ...business, owner_id: 'user-b' },
        identity,
      ),
    ).toThrow('QUOTE_DOCUMENT_BUSINESS_IDENTITY_MISMATCH');
    expect(() =>
      buildQuoteDocumentData(
        quote({ business_id: 'business-b' }),
        business,
        identity,
      ),
    ).toThrow('QUOTE_DOCUMENT_QUOTE_IDENTITY_MISMATCH');
    expect(() =>
      buildQuoteDocumentData(
        quote({ items: [{ ...quote().items[0]!, quote_id: 'quote-b' }] }),
        business,
        identity,
      ),
    ).toThrow('QUOTE_DOCUMENT_ITEM_IDENTITY_MISMATCH');
  });

  it('refuses contradictory persisted item and quote totals', () => {
    expect(() =>
      buildQuoteDocumentData(
        quote({ items: [{ ...quote().items[0]!, item_total_cents: 1 }] }),
        business,
        identity,
      ),
    ).toThrow('QUOTE_DOCUMENT_ITEM_TOTAL_MISMATCH');
    expect(() =>
      buildQuoteDocumentData(quote({ total_cents: 1 }), business, identity),
    ).toThrow('QUOTE_DOCUMENT_TOTALS_MISMATCH');
  });

  it('labels draft, approved, canceled and expired without implying payment', () => {
    const at = new Date('2026-10-01T12:00:00Z');
    expect(buildQuoteDocumentData(quote(), business, identity, at).status).toBe(
      'draft',
    );
    expect(
      buildQuoteDocumentData(
        quote({ status: 'approved' }),
        business,
        identity,
        at,
      ).status,
    ).toBe('approved');
    expect(
      buildQuoteDocumentData(
        quote({ status: 'canceled' }),
        business,
        identity,
        at,
      ).status,
    ).toBe('canceled');
    expect(
      buildQuoteDocumentData(quote({ status: 'sent' }), business, identity, at)
        .status,
    ).toBe('expired');
  });
});

describe('professional quote HTML', () => {
  it('escapes malicious user content and has no external dependencies', () => {
    const malicious = `<script>alert('x')</script><img src="https://evil.test/x">`;
    const document = buildQuoteDocumentData(
      quote({
        client_name_snapshot: malicious,
        notes: malicious,
        items: [
          {
            ...quote().items[0]!,
            name_snapshot: malicious,
            description_snapshot: malicious,
          },
        ],
      }),
      business,
      identity,
    );
    const html = renderQuoteDocumentHtml(document);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).not.toMatch(/(?:src|href)=["']https?:\/\//i);
  });

  it('renders A4, complete BRL values, dates and conditional discount', () => {
    const html = renderQuoteDocumentHtml(
      buildQuoteDocumentData(quote(), business, identity),
    );
    expect(html).toContain('@page { size: A4');
    expect(html).toContain('30/08/2026');
    expect(html).toContain('30/09/2026');
    expect(html).toContain('R$\u00a02.400,00');
    expect(html).toContain('Desconto');
    expect(html).toContain('RASCUNHO');
    expect(html).not.toContain(business.pix_key ?? '');
    expect(html).not.toContain(business.street);
    expect(html).not.toContain('123.456.789-01');
  });

  it('keeps every long item in the controlled document', () => {
    const baseItem = quote().items[0]!;
    const items = Array.from({ length: 40 }, (_, index) => ({
      ...baseItem,
      id: `item-${index}`,
      name_snapshot: `Serviço longo ${index} ${'ab'.repeat(80)}`,
      position: index,
    }));
    const subtotal = items.reduce(
      (sum, item) => sum + item.item_total_cents,
      0,
    );
    const html = renderQuoteDocumentHtml(
      buildQuoteDocumentData(
        quote({
          discount_cents: 0,
          items,
          subtotal_cents: subtotal,
          total_cents: subtotal,
        }),
        business,
        identity,
      ),
    );
    expect((html.match(/Serviço longo/g) ?? []).length).toBe(40);
    expect(html).toContain('page-break-inside: avoid');
  });
});

it('uses a safe filename containing only the quote number', () => {
  expect(quotePdfFilename(2)).toBe('orcamento-000002.pdf');
  expect(quotePdfFilename(2)).not.toMatch(/Cliente|119|user/i);
});

it('escapes all HTML-significant characters', () => {
  expect(escapeQuoteHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
});
