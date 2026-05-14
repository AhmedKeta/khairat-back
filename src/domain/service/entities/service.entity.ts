export interface ServiceTitle {
  ar: string;
  en: string;
}

export interface ServiceDescription {
  ar: string;
  en: string;
}

export interface ServicePrice {
  currency: string;
  amount: number;
}

export class Service {
  id: string;
  title: ServiceTitle;
  description: ServiceDescription;
  price: number;
  currency: string;
  prices: ServicePrice[];
  feedsCount: number | null;
  images: string[];
  videos: string[];
  isActive: boolean;
  polarProductId: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Service>) {
    Object.assign(this, partial);
  }

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  getLocalizedTitle(locale: 'ar' | 'en' = 'en'): string {
    return this.title[locale] || this.title.en;
  }
}
