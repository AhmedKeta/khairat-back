/**
 * Currencies the app uses for pricing and checkout (matches frontend navbar regions).
 */
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'EGP', 'SAR'] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const POLAR_DEFAULT_CURRENCY: SupportedCurrency = 'USD';

/**
 * Currencies that Polar actually accepts for charging customers.
 * Defaults to every supported currency - trusts whatever the Polar
 * organization allows in its dashboard. Narrow it via env var
 * `POLAR_CHARGEABLE_CURRENCIES="USD,EUR"` if Polar rejects any currency
 * for your org; customers who pick a rejected currency will be charged in
 * the fallback (USD) instead.
 */
function parseChargeable(): readonly string[] {
  const raw = process.env.POLAR_CHARGEABLE_CURRENCIES;
  if (!raw) return [...SUPPORTED_CURRENCIES];
  const list = raw
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  return list.length > 0 ? list : [...SUPPORTED_CURRENCIES];
}

export const POLAR_CHARGEABLE_CURRENCIES = parseChargeable();

/**
 * Currencies that Paymob accepts. An Egypt MID is EGP-only by default;
 * override with `PAYMOB_CHARGEABLE_CURRENCIES="EGP,SAR"` if the merchant
 * has negotiated additional currencies.
 */
function parsePaymobChargeable(): readonly string[] {
  const raw = process.env.PAYMOB_CHARGEABLE_CURRENCIES;
  if (!raw) return ['EGP'];
  const list = raw
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  return list.length > 0 ? list : ['EGP'];
}

export const PAYMOB_CHARGEABLE_CURRENCIES = parsePaymobChargeable();

export const PAYMOB_DEFAULT_CURRENCY = 'EGP';

export function isSupportedCurrency(code: string): code is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}

export function isPolarChargeable(code: string): boolean {
  return POLAR_CHARGEABLE_CURRENCIES.includes(code.toUpperCase());
}

export function isPaymobChargeable(code: string): boolean {
  return PAYMOB_CHARGEABLE_CURRENCIES.includes(code.toUpperCase());
}

/**
 * EasyKash Direct Payment hosted currencies per Pay API docs.
 * Override with `EASYKASH_CHARGEABLE_CURRENCIES="EGP,USD,..."`.
 */
const EASYKASH_DEFAULT_CHARGEABLE = ['EGP', 'USD', 'SAR', 'EUR'] as const;

function parseEasykashChargeable(): readonly string[] {
  const raw = process.env.EASYKASH_CHARGEABLE_CURRENCIES;
  if (!raw) return [...EASYKASH_DEFAULT_CHARGEABLE];
  const list = raw
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  return list.length > 0 ? list : [...EASYKASH_DEFAULT_CHARGEABLE];
}

export const EASYKASH_CHARGEABLE_CURRENCIES = parseEasykashChargeable();

export function isEasyKashChargeable(code: string): boolean {
  return EASYKASH_CHARGEABLE_CURRENCIES.includes(code.toUpperCase());
}

export function normalizeCurrency(code: string | undefined | null): SupportedCurrency {
  if (!code) return POLAR_DEFAULT_CURRENCY;
  const upper = code.toUpperCase();
  return isSupportedCurrency(upper) ? upper : POLAR_DEFAULT_CURRENCY;
}
