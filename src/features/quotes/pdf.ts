import { Directory, EncodingType, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { getMyBusiness } from '@/features/business/api';
import { supabase } from '@/lib/supabase';
import { getQuote } from './api';
import {
  buildQuoteDocumentData,
  quotePdfFilename,
  renderQuoteDocumentHtml,
} from './document';
import type { QuoteDocumentData, QuoteDocumentIdentity } from './document';

const A4_WIDTH_POINTS = 595;
const A4_HEIGHT_POINTS = 842;

export interface GeneratedQuotePdf {
  filename: string;
  numberOfPages: number;
  uri: string;
}

export async function assertCurrentQuoteSession(expectedUserId: string) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (data.session?.user.id !== expectedUserId)
    throw new Error('QUOTE_PDF_SESSION_CHANGED');
}

export async function loadQuoteDocumentForExport(
  expected: QuoteDocumentIdentity,
  signal?: AbortSignal,
): Promise<QuoteDocumentData> {
  await assertCurrentQuoteSession(expected.userId);
  const [business, quote] = await Promise.all([
    getMyBusiness(expected.userId, signal),
    getQuote(expected.businessId, expected.quoteId, signal),
  ]);
  if (!business) throw new Error('QUOTE_PDF_BUSINESS_NOT_FOUND');
  if (!quote) throw new Error('QUOTE_PDF_QUOTE_NOT_FOUND');
  await assertCurrentQuoteSession(expected.userId);
  return buildQuoteDocumentData(quote, business, expected);
}

function safeDelete(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Cache cleanup must never replace the user-facing result with a new error.
  }
}

export function cleanupGeneratedQuotePdf(pdf: GeneratedQuotePdf | null) {
  if (pdf && Platform.OS !== 'web') safeDelete(pdf.uri);
}

export async function generateQuotePdf(
  document: QuoteDocumentData,
): Promise<GeneratedQuotePdf> {
  if (Platform.OS === 'web')
    throw new Error('QUOTE_PDF_FILE_UNAVAILABLE_ON_WEB');
  const html = renderQuoteDocumentHtml(document);
  const result = await Print.printToFileAsync({
    base64: true,
    height: A4_HEIGHT_POINTS,
    html,
    width: A4_WIDTH_POINTS,
  });
  if (!result.base64) {
    safeDelete(result.uri);
    throw new Error('QUOTE_PDF_BASE64_MISSING');
  }
  const filename = quotePdfFilename(document.number);
  const exportDirectory = new Directory(Paths.cache, 'quote-exports');
  const destination = new File(exportDirectory, filename);
  try {
    exportDirectory.create({ idempotent: true, intermediates: true });
    destination.create({ intermediates: true, overwrite: true });
    destination.write(result.base64, { encoding: EncodingType.Base64 });
    if (!destination.exists) throw new Error('QUOTE_PDF_CACHE_COPY_MISSING');
  } finally {
    safeDelete(result.uri);
  }
  return {
    filename,
    numberOfPages: result.numberOfPages,
    uri: destination.uri,
  };
}

export async function previewQuoteDocument(
  document: QuoteDocumentData,
  expectedUserId: string,
) {
  await assertCurrentQuoteSession(expectedUserId);
  await Print.printAsync({ html: renderQuoteDocumentHtml(document) });
}

export async function shareQuoteDocument(
  document: QuoteDocumentData,
  expectedUserId: string,
): Promise<'shared' | 'web-print-fallback'> {
  await assertCurrentQuoteSession(expectedUserId);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html: renderQuoteDocumentHtml(document) });
    return 'web-print-fallback';
  }

  let available: boolean;
  try {
    available = await Sharing.isAvailableAsync();
  } catch (error) {
    throw new Error('QUOTE_PDF_SHARING_MODULE_FAILED', { cause: error });
  }
  if (!available) throw new Error('QUOTE_PDF_SHARING_UNAVAILABLE');
  let pdf: GeneratedQuotePdf;
  try {
    pdf = await generateQuotePdf(document);
  } catch (error) {
    throw new Error('QUOTE_PDF_GENERATION_FAILED', { cause: error });
  }
  try {
    await assertCurrentQuoteSession(expectedUserId);
    try {
      await Sharing.shareAsync(pdf.uri, {
        dialogTitle: `Compartilhar ${pdf.filename}`,
        mimeType: 'application/pdf',
        UTI: '.pdf',
      });
    } catch (error) {
      throw new Error('QUOTE_PDF_SHARE_SHEET_FAILED', { cause: error });
    }
    return 'shared';
  } finally {
    cleanupGeneratedQuotePdf(pdf);
  }
}
