export type HeroSlide = {
  imageUrl: string;
  imageUrlMobile?: string;
  altEn: string;
  altAr: string;
  order?: number;
};

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [];
