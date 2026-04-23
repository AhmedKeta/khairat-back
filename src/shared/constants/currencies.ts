/**
 * All currencies the app can *display* (navbar, dashboard form, service pages).
 * Includes Middle-Eastern currencies that Polar does NOT accept for charging.
 */
export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'EGP',
  'SAR',
  'KWD',
  'QAR',
  'AED',
  'BHD',
  'OMR',
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const POLAR_DEFAULT_CURRENCY: SupportedCurrency = 'USD';

/**
 * Currencies that Polar actually accepts for charging customers.
 * Can be overridden by `POLAR_CHARGEABLE_CURRENCIES` env var
 * (comma-separated, e.g. "USD,EUR,GBP,CAD,AUD").
 *
 * Currencies outside this list (EGP, SAR, KWD, QAR, AED, BHD, OMR) are
 * display-only: the customer sees the price in their local currency but is
 * charged the USD equivalent at checkout.
 */
const DEFAULT_POLAR_CHARGEABLE: readonly string[] = ['USD', 'EUR', 'GBP'];

function parseChargeable(): readonly string[] {
  const raw = process.env.POLAR_CHARGEABLE_CURRENCIES;
  if (!raw) return DEFAULT_POLAR_CHARGEABLE;
  const list = raw
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  return list.length > 0 ? list : DEFAULT_POLAR_CHARGEABLE;
}

export const POLAR_CHARGEABLE_CURRENCIES = parseChargeable();

export function isSupportedCurrency(code: string): code is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}

export function isPolarChargeable(code: string): boolean {
  return POLAR_CHARGEABLE_CURRENCIES.includes(code.toUpperCase());
}

export function normalizeCurrency(code: string | undefined | null): SupportedCurrency {
  if (!code) return POLAR_DEFAULT_CURRENCY;
  const upper = code.toUpperCase();
  return isSupportedCurrency(upper) ? upper : POLAR_DEFAULT_CURRENCY;
}
