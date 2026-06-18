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

export interface ServiceCategorySummary {
  id: string;
  name: ServiceTitle;
  slug: string;
}

export interface ServiceVoiceReviewSummary {
  id: string;
  reviewerName: string;
  audioUrl: string;
  transcript: string | null;
  transcriptAr: string | null;
  rating: number;
  displayOrder: number;
  isVisible: boolean;
}

export interface ServiceMarkSummary {
  id: string;
  name: ServiceTitle;
  backgroundColor: string;
  textColor: string;
  displayOrder: number;
  isActive: boolean;
  makesUnavailable: boolean;
}

export function computeIsPurchasable(
  isActive: boolean,
  marks?: ServiceMarkSummary[],
): boolean {
  if (!isActive) return false;
  const blocked = marks?.some(
    (m) => m.isActive && m.makesUnavailable,
  );
  return !blocked;
}

export class Service {
  id: string;
  title: ServiceTitle;
  description: ServiceDescription;
  price: number;
  currency: string;
  prices: ServicePrice[];
  sharePrices: ServicePrice[];
  shareDescription: ServiceDescription | null;
  feedsCount: number | null;
  images: string[];
  videos: string[];
  isActive: boolean;
  polarProductId: string | null;
  displayOrder: number;
  categoryId: string | null;
  category?: ServiceCategorySummary | null;
  marks?: ServiceMarkSummary[];
  voiceReviews?: ServiceVoiceReviewSummary[];
  isPurchasable: boolean;
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
