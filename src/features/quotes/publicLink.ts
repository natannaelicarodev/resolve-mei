import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { z } from 'zod';

import { env } from '@/config/env';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

const decisionSchema = z.object({
  reason: z.string().nullable().optional(),
  respondedAt: z.string(),
  responderName: z.string(),
  source: z.literal('client_link').optional(),
  value: z.enum(['approved', 'rejected']),
  version: z.number().int().positive().optional(),
});

export const ownerLinkStateSchema = z.object({
  decision: decisionSchema.optional(),
  expiresAt: z.string().optional(),
  issuedAt: z.string().optional(),
  revokedAt: z.string().optional(),
  state: z.enum(['none', 'active', 'responded', 'expired', 'revoked']),
  version: z.number().int().positive().optional(),
});

const issuedLinkSchema = z.object({
  expiresAt: z.string(),
  quoteStatus: z.literal('sent'),
  state: z.literal('active'),
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  version: z.number().int().positive(),
});

const publicItemSchema = z.object({
  description: z.string().nullable(),
  name: z.string(),
  quantity: z.number().int().positive(),
  totalCents: z.number().int().nonnegative(),
  unitPriceCents: z.number().int().nonnegative(),
});

const publicQuoteSchema = z.object({
  client: z.object({ name: z.string() }),
  discountCents: z.number().int().nonnegative(),
  issuedOn: z.string(),
  items: z.array(publicItemSchema).min(1),
  provider: z.object({
    businessName: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }),
  quoteNumber: z.number().int().positive(),
  status: z.literal('sent'),
  subtotalCents: z.number().int().nonnegative(),
  totalCents: z.number().int().nonnegative(),
  validUntil: z.string(),
  version: z.number().int().positive(),
});

export const publicQuoteResultSchema = z.object({
  decision: decisionSchema.optional(),
  expiresAt: z.string().optional(),
  quote: publicQuoteSchema.optional(),
  state: z.enum(['available', 'responded', 'unavailable']),
});

const responseResultSchema = z.object({
  decision: z.enum(['approved', 'rejected']).optional(),
  respondedAt: z.string().optional(),
  responderName: z.string().optional(),
  state: z.enum(['responded', 'unavailable']),
});

export type OwnerLinkState = z.infer<typeof ownerLinkStateSchema>;
export type PublicQuoteResult = z.infer<typeof publicQuoteResultSchema>;

export class PublicQuoteRequestError extends Error {
  constructor(readonly safeCode: string) {
    super(safeCode);
    this.name = 'PublicQuoteRequestError';
  }
}

export function getPublicQuoteErrorCode(error: unknown) {
  return error instanceof PublicQuoteRequestError
    ? error.safeCode
    : 'PUBLIC-NETWORK';
}

export async function getOwnerLinkState(quoteId: string) {
  const { data, error } = await supabase.rpc('get_quote_public_link_state', {
    p_quote_id: quoteId,
  });
  if (error) throw error;
  return ownerLinkStateSchema.parse(data);
}

export async function issuePublicQuoteLink(quoteId: string) {
  const { data, error } = await supabase.rpc('issue_quote_public_link', {
    p_quote_id: quoteId,
  });
  if (error) throw error;
  return issuedLinkSchema.parse(data);
}

export async function revokePublicQuoteLink(quoteId: string) {
  const { data, error } = await supabase.rpc('revoke_quote_public_link', {
    p_quote_id: quoteId,
  });
  if (error) throw error;
  return z.object({ state: z.enum(['revoked', 'none']) }).parse(data);
}

export function buildPublicQuoteUrl(token: string) {
  const configured = env.EXPO_PUBLIC_CLIENT_QUOTE_BASE_URL?.replace(/\/$/, '');
  const localWeb =
    Platform.OS === 'web' && __DEV__ && typeof location !== 'undefined'
      ? `${location.origin}/q`
      : null;
  const base = configured ?? localWeb;
  return base ? `${base}#token=${encodeURIComponent(token)}` : null;
}

export function hasPublicQuoteBaseUrl() {
  return Boolean(
    env.EXPO_PUBLIC_CLIENT_QUOTE_BASE_URL ||
    (Platform.OS === 'web' && __DEV__ && typeof location !== 'undefined'),
  );
}

const publicSupabase = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  },
);

export async function resolvePublicQuote(token: string) {
  const { data, error } = await publicSupabase.rpc('resolve_public_quote', {
    p_token: token,
  });
  if (error)
    throw new PublicQuoteRequestError(
      `PUBLIC-RPC-${error.code || 'UNKNOWN'}`,
    );
  const parsed = publicQuoteResultSchema.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join('.') || 'root';
    throw new PublicQuoteRequestError(
      `PUBLIC-DTO-${path}-${issue?.code || 'UNKNOWN'}`,
    );
  }
  return parsed.data;
}

export async function respondPublicQuote(input: {
  decision: 'approved' | 'rejected';
  name: string;
  reason?: string;
  token: string;
}) {
  const { data, error } = await publicSupabase.rpc('respond_public_quote', {
    p_decision: input.decision,
    p_reason: input.reason?.trim() || null,
    p_responder_name: input.name,
    p_token: input.token,
  });
  if (error) throw error;
  return responseResultSchema.parse(data);
}
