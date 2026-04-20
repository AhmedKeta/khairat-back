export type CountrySeedRow = {
  name: string;
  code: string;
  currency: string;
  priceMultiplier: number;
  flagEmoji: string;
  phoneCode: string;
};

export const SEED_COUNTRIES: CountrySeedRow[] = [
  { name: 'Saudi Arabia', code: 'SA', currency: 'SAR', priceMultiplier: 3.75, flagEmoji: '🇸🇦', phoneCode: '+966' },
  { name: 'United Arab Emirates', code: 'AE', currency: 'AED', priceMultiplier: 3.67, flagEmoji: '🇦🇪', phoneCode: '+971' },
  { name: 'Kuwait', code: 'KW', currency: 'KWD', priceMultiplier: 0.31, flagEmoji: '🇰🇼', phoneCode: '+965' },
  { name: 'Qatar', code: 'QA', currency: 'QAR', priceMultiplier: 3.64, flagEmoji: '🇶🇦', phoneCode: '+974' },
  { name: 'Bahrain', code: 'BH', currency: 'BHD', priceMultiplier: 0.38, flagEmoji: '🇧🇭', phoneCode: '+973' },
  { name: 'Oman', code: 'OM', currency: 'OMR', priceMultiplier: 0.38, flagEmoji: '🇴🇲', phoneCode: '+968' },
  { name: 'Jordan', code: 'JO', currency: 'JOD', priceMultiplier: 0.71, flagEmoji: '🇯🇴', phoneCode: '+962' },
  { name: 'Egypt', code: 'EG', currency: 'EGP', priceMultiplier: 30.9, flagEmoji: '🇪🇬', phoneCode: '+20' },
  { name: 'Morocco', code: 'MA', currency: 'MAD', priceMultiplier: 10.0, flagEmoji: '🇲🇦', phoneCode: '+212' },
  { name: 'Pakistan', code: 'PK', currency: 'PKR', priceMultiplier: 278.0, flagEmoji: '🇵🇰', phoneCode: '+92' },
  { name: 'Turkey', code: 'TR', currency: 'TRY', priceMultiplier: 27.0, flagEmoji: '🇹🇷', phoneCode: '+90' },
  { name: 'United States', code: 'US', currency: 'USD', priceMultiplier: 1.0, flagEmoji: '🇺🇸', phoneCode: '+1' },
  { name: 'United Kingdom', code: 'GB', currency: 'GBP', priceMultiplier: 0.79, flagEmoji: '🇬🇧', phoneCode: '+44' },
  { name: 'Malaysia', code: 'MY', currency: 'MYR', priceMultiplier: 4.67, flagEmoji: '🇲🇾', phoneCode: '+60' },
  { name: 'Indonesia', code: 'ID', currency: 'IDR', priceMultiplier: 15600, flagEmoji: '🇮🇩', phoneCode: '+62' },
];
