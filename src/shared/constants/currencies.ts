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

export function isSupportedCurrency(code: string): code is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}

export function normalizeCurrency(code: string | undefined | null): SupportedCurrency {
  if (!code) return POLAR_DEFAULT_CURRENCY;
  const upper = code.toUpperCase();
  return isSupportedCurrency(upper) ? upper : POLAR_DEFAULT_CURRENCY;
}
