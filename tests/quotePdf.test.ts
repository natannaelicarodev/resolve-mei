import { Platform } from 'react-native';

import { getMyBusiness } from '@/features/business/api';
import { getQuote } from '@/features/quotes/api';
import type { QuoteDocumentData } from '@/features/quotes/document';
import {
  assertCurrentQuoteSession,
  generateQuotePdf,
  loadQuoteDocumentForExport,
  previewQuoteDocument,
  shareQuoteDocument,
} from '@/features/quotes/pdf';
import { supabase } from '@/lib/supabase';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const mockFileStore = new Set<string>();
const mockDirectoryStore = new Set<string>();

function mockJoinUri(parts: (string | { uri: string })[]) {
  return parts
    .map((part) => (typeof part === 'string' ? part : part.uri))
    .reduce(
      (uri, part) =>
        uri ? `${uri.replace(/\/+$/, '')}/${part.replace(/^\/+/, '')}` : part,
      '',
    );
}

jest.mock('expo-file-system', () => {
  class MockFile {
    uri: string;

    constructor(...parts: (string | { uri: string })[]) {
      this.uri = mockJoinUri(parts);
    }

    get exists() {
      return mockFileStore.has(this.uri);
    }

    async copy(destination: MockFile) {
      mockFileStore.add(destination.uri);
    }

    create() {
      mockFileStore.add(this.uri);
    }

    write() {}

    delete() {
      mockFileStore.delete(this.uri);
    }
  }
  class MockDirectory {
    uri: string;

    constructor(...parts: (string | { uri: string })[]) {
      this.uri = mockJoinUri(parts);
    }

    create() {
      mockDirectoryStore.add(this.uri);
    }
  }
  return {
    Directory: MockDirectory,
    EncodingType: { Base64: 'base64' },
    File: MockFile,
    Paths: { cache: { uri: 'file:///cache' } },
  };
});
jest.mock('expo-print', () => ({
  printAsync: jest.fn(),
  printToFileAsync: jest.fn(),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));
jest.mock('@/features/business/api', () => ({ getMyBusiness: jest.fn() }));
jest.mock('@/features/quotes/api', () => ({ getQuote: jest.fn() }));
jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { getSession: jest.fn() } },
}));

const expected = {
  businessId: 'business-1',
  quoteId: 'quote-1',
  userId: 'user-1',
};

const document: QuoteDocumentData = {
  client: { document: null, email: null, name: 'Cliente', phone: null },
  discountCents: 0,
  id: expected.quoteId,
  issuedOn: '2026-08-30',
  issuer: {
    document: null,
    documentLabel: null,
    email: 'mei@example.com',
    name: 'Meu negócio',
    phone: '(11) 99999-9999',
  },
  items: [
    {
      description: null,
      name: 'Serviço',
      quantity: 1,
      totalCents: 10000,
      unitPriceCents: 10000,
    },
  ],
  notes: null,
  number: 2,
  status: 'draft',
  subtotalCents: 10000,
  totalCents: 10000,
  validUntil: '2026-09-30',
};

function sessionResult(userId: string | null) {
  return {
    data: { session: userId ? { user: { id: userId } } : null },
    error: null,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFileStore.clear();
  mockDirectoryStore.clear();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  jest
    .mocked(supabase.auth.getSession)
    .mockResolvedValue(sessionResult(expected.userId) as never);
});

it('rejects a divergent or logged-out session', async () => {
  jest
    .mocked(supabase.auth.getSession)
    .mockResolvedValue(sessionResult('user-b') as never);
  await expect(assertCurrentQuoteSession(expected.userId)).rejects.toThrow(
    'QUOTE_PDF_SESSION_CHANGED',
  );
  jest
    .mocked(supabase.auth.getSession)
    .mockResolvedValue(sessionResult(null) as never);
  await expect(assertCurrentQuoteSession(expected.userId)).rejects.toThrow(
    'QUOTE_PDF_SESSION_CHANGED',
  );
});

it('loads fresh authorized data and rejects missing records', async () => {
  jest.mocked(getMyBusiness).mockResolvedValue({
    id: expected.businessId,
    owner_id: expected.userId,
  } as never);
  jest.mocked(getQuote).mockResolvedValue({
    id: expected.quoteId,
    business_id: expected.businessId,
    items: [],
  } as never);
  await expect(loadQuoteDocumentForExport(expected)).rejects.toThrow(
    'QUOTE_DOCUMENT_REQUIRES_ITEMS',
  );

  jest.mocked(getMyBusiness).mockResolvedValue(null);
  await expect(loadQuoteDocumentForExport(expected)).rejects.toThrow(
    'QUOTE_PDF_BUSINESS_NOT_FOUND',
  );
  jest.mocked(getMyBusiness).mockResolvedValue({} as never);
  jest.mocked(getQuote).mockResolvedValue(null);
  await expect(loadQuoteDocumentForExport(expected)).rejects.toThrow(
    'QUOTE_PDF_QUOTE_NOT_FOUND',
  );
});

it('discards a delayed result when the account changes', async () => {
  let release!: (value: never) => void;
  const delayedBusiness = new Promise<never>((resolve) => {
    release = resolve;
  });
  jest.mocked(getMyBusiness).mockReturnValue(delayedBusiness);
  jest.mocked(getQuote).mockResolvedValue({} as never);
  jest
    .mocked(supabase.auth.getSession)
    .mockResolvedValueOnce(sessionResult(expected.userId) as never)
    .mockResolvedValueOnce(sessionResult('user-b') as never);
  const result = loadQuoteDocumentForExport(expected);
  release({
    id: expected.businessId,
    owner_id: expected.userId,
  } as never);
  await expect(result).rejects.toThrow('QUOTE_PDF_SESSION_CHANGED');
});

it('opens the controlled HTML as a preview without changing quote status', async () => {
  jest.mocked(Print.printAsync).mockResolvedValue();
  await previewQuoteDocument(document, expected.userId);
  expect(Print.printAsync).toHaveBeenCalledWith({
    html: expect.stringContaining('Orçamento'),
  });
});

it('generates an A4 PDF and preserves its safe display filename', async () => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'android',
  });
  mockFileStore.add('file:///cache/generated.pdf');
  jest.mocked(Print.printToFileAsync).mockResolvedValue({
    base64: 'JVBERi0xLjQ=',
    numberOfPages: 2,
    uri: 'file:///cache/generated.pdf',
  });
  const pdf = await generateQuotePdf(document);
  expect(Print.printToFileAsync).toHaveBeenCalledWith(
    expect.objectContaining({ base64: true, height: 842, width: 595 }),
  );
  expect(pdf).toEqual({
    filename: 'orcamento-000002.pdf',
    numberOfPages: 2,
    uri: 'file:///cache/quote-exports/orcamento-000002.pdf',
  });
  expect(mockDirectoryStore).toContain('file:///cache/quote-exports');
  expect(mockFileStore.has('file:///cache/generated.pdf')).toBe(false);
  expect(
    mockFileStore.has('file:///cache/quote-exports/orcamento-000002.pdf'),
  ).toBe(true);
});

it('shares natively, treats sheet return as neutral and cleans the exact file', async () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  mockFileStore.add('file:///cache/generated.pdf');
  jest.mocked(Print.printToFileAsync).mockResolvedValue({
    base64: 'JVBERi0xLjQ=',
    numberOfPages: 1,
    uri: 'file:///cache/generated.pdf',
  });
  jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(true);
  jest.mocked(Sharing.shareAsync).mockResolvedValue();
  await expect(shareQuoteDocument(document, expected.userId)).resolves.toBe(
    'shared',
  );
  expect(Sharing.shareAsync).toHaveBeenCalledWith(
    'file:///cache/quote-exports/orcamento-000002.pdf',
    expect.objectContaining({ mimeType: 'application/pdf' }),
  );
  expect(
    mockFileStore.has('file:///cache/quote-exports/orcamento-000002.pdf'),
  ).toBe(false);
});

it('fails safely when native sharing is unavailable', async () => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'android',
  });
  jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(false);
  await expect(shareQuoteDocument(document, expected.userId)).rejects.toThrow(
    'QUOTE_PDF_SHARING_UNAVAILABLE',
  );
  expect(Print.printToFileAsync).not.toHaveBeenCalled();
});

it('uses the browser print/save fallback instead of local URI sharing', async () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  jest.mocked(Print.printAsync).mockResolvedValue();
  await expect(shareQuoteDocument(document, expected.userId)).resolves.toBe(
    'web-print-fallback',
  );
  expect(Print.printAsync).toHaveBeenCalled();
  expect(Sharing.shareAsync).not.toHaveBeenCalled();
  expect(Print.printToFileAsync).not.toHaveBeenCalled();
});
