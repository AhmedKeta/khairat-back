export class Country {
  id: string;
  name: string;
  code: string;
  currency: string;
  priceMultiplier: number;
  flagEmoji: string;
  phoneCode: string;
  isActive: boolean;
  createdAt: Date;

  constructor(partial: Partial<Country>) {
    Object.assign(this, partial);
  }

  convertPrice(priceInUSD: number): number {
    return priceInUSD * this.priceMultiplier;
  }
}
