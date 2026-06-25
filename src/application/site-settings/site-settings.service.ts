import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSettingEntity } from '../../infrastructure/database/entities/site-setting.entity';
import {
  AboutStatCard,
  DEFAULT_ABOUT_STATS,
} from './about-stats.defaults';
import {
  HeroSlide,
  DEFAULT_HERO_SLIDES,
} from './hero-slides.defaults';
import { SITE_SETTING_KEYS } from './constants';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';

export type PublicSiteSettings = {
  whatsappNumber1: string;
  whatsappNumber2: string;
  whatsappNumber1Enabled: boolean;
  whatsappNumber2Enabled: boolean;
  homePageVideoUrl: string;
  homePageVideoEnabled: boolean;
  aboutStats: AboutStatCard[];
  heroSlides: HeroSlide[];
};

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectRepository(SiteSettingEntity)
    private readonly repo: Repository<SiteSettingEntity>,
    private readonly config: ConfigService,
  ) {}

  private defaultWhatsappNumber1(): string {
    return (
      this.config.get<string>('SITE_WHATSAPP_NUMBER_1')?.trim() ||
      this.config.get<string>('SITE_WHATSAPP_NUMBER')?.trim() ||
      '+966500000000'
    );
  }

  private defaultWhatsappNumber2(number1Fallback: string): string {
    return (
      this.config.get<string>('SITE_WHATSAPP_NUMBER_2')?.trim() ||
      this.config.get<string>('SITE_WHATSAPP_SUPPORT_NUMBER')?.trim() ||
      number1Fallback
    );
  }

  private parseBool(value: string | null, defaultValue = true): boolean {
    if (value == null) return defaultValue;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'false' || normalized === '0') return false;
    if (normalized === 'true' || normalized === '1') return true;
    return defaultValue;
  }

  private boolToStorage(value: boolean): string {
    return value ? 'true' : 'false';
  }

  private normalizeAboutStats(raw: unknown): AboutStatCard[] {
    if (!Array.isArray(raw)) return [...DEFAULT_ABOUT_STATS];
    const parsed = raw
      .map((item) => {
        if (item == null || typeof item !== 'object') return null;
        const row = item as Record<string, unknown>;
        const icon = typeof row.icon === 'string' ? row.icon.trim() : '';
        const value =
          typeof row.value === 'number' && Number.isFinite(row.value)
            ? Math.max(0, Math.floor(row.value))
            : null;
        const suffix = typeof row.suffix === 'string' ? row.suffix : '';
        const labelEn = typeof row.labelEn === 'string' ? row.labelEn.trim() : '';
        const labelAr = typeof row.labelAr === 'string' ? row.labelAr.trim() : '';
        if (!icon || value == null || !labelEn || !labelAr) return null;
        return { icon, value, suffix, labelEn, labelAr };
      })
      .filter((item): item is AboutStatCard => item != null);
    if (parsed.length !== 4) return [...DEFAULT_ABOUT_STATS];
    return parsed;
  }

  private normalizeHeroSlides(raw: unknown): HeroSlide[] {
    if (!Array.isArray(raw)) return [...DEFAULT_HERO_SLIDES];
    type Parsed = HeroSlide & { _index: number };
    const parsed: Parsed[] = [];
    raw.forEach((item, index) => {
      if (item == null || typeof item !== 'object') return;
      const row = item as Record<string, unknown>;
      const imageUrl =
        typeof row.imageUrl === 'string' ? row.imageUrl.trim() : '';
      const altEn = typeof row.altEn === 'string' ? row.altEn.trim() : '';
      const altAr = typeof row.altAr === 'string' ? row.altAr.trim() : '';
      if (!imageUrl || !altEn || !altAr) return;
      const order =
        typeof row.order === 'number' && Number.isFinite(row.order)
          ? Math.max(0, Math.floor(row.order))
          : undefined;
      parsed.push({ imageUrl, altEn, altAr, order, _index: index });
    });
    const withOrder = parsed.filter((item) => item.order != null);
    const withoutOrder = parsed.filter((item) => item.order == null);
    withOrder.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    withoutOrder.sort((a, b) => a._index - b._index);
    const sorted = [...withOrder, ...withoutOrder].map(
      ({ _index: _, ...slide }) => slide,
    );
    return sorted.length > 0 ? sorted : [...DEFAULT_HERO_SLIDES];
  }

  private async getHeroSlides(): Promise<HeroSlide[]> {
    const stored = await this.getValue(SITE_SETTING_KEYS.HERO_SLIDES);
    if (!stored) return [...DEFAULT_HERO_SLIDES];
    try {
      return this.normalizeHeroSlides(JSON.parse(stored));
    } catch {
      return [...DEFAULT_HERO_SLIDES];
    }
  }

  private async getAboutStats(): Promise<AboutStatCard[]> {
    const stored = await this.getValue(SITE_SETTING_KEYS.ABOUT_STATS);
    if (!stored) return [...DEFAULT_ABOUT_STATS];
    try {
      return this.normalizeAboutStats(JSON.parse(stored));
    } catch {
      return [...DEFAULT_ABOUT_STATS];
    }
  }

  private async getValue(key: string): Promise<string | null> {
    const row = await this.repo.findOne({ where: { key } });
    return row?.value?.trim() || null;
  }

  private async upsert(key: string, value: string): Promise<void> {
    await this.repo.save({ key, value: value.trim() });
  }

  async getPublicSettings(): Promise<PublicSiteSettings> {
    const stored1 = await this.getValue(SITE_SETTING_KEYS.WHATSAPP_NUMBER_1);
    const number1 = stored1 || this.defaultWhatsappNumber1();
    const stored2 = await this.getValue(SITE_SETTING_KEYS.WHATSAPP_NUMBER_2);
    const enabled1 = this.parseBool(
      await this.getValue(SITE_SETTING_KEYS.WHATSAPP_NUMBER_1_ENABLED),
    );
    const enabled2 = this.parseBool(
      await this.getValue(SITE_SETTING_KEYS.WHATSAPP_NUMBER_2_ENABLED),
    );
    const homePageVideoUrl =
      (await this.getValue(SITE_SETTING_KEYS.HOME_PAGE_VIDEO_URL)) || '';
    const homePageVideoEnabled = this.parseBool(
      await this.getValue(SITE_SETTING_KEYS.HOME_PAGE_VIDEO_ENABLED),
      false,
    );
    return {
      whatsappNumber1: number1,
      whatsappNumber2: stored2 || this.defaultWhatsappNumber2(number1),
      whatsappNumber1Enabled: enabled1,
      whatsappNumber2Enabled: enabled2,
      homePageVideoUrl,
      homePageVideoEnabled,
      aboutStats: await this.getAboutStats(),
      heroSlides: await this.getHeroSlides(),
    };
  }

  async updateSettings(dto: UpdateSiteSettingsDto): Promise<PublicSiteSettings> {
    await this.upsert(
      SITE_SETTING_KEYS.WHATSAPP_NUMBER_1,
      dto.whatsappNumber1.trim(),
    );
    await this.upsert(
      SITE_SETTING_KEYS.WHATSAPP_NUMBER_2,
      dto.whatsappNumber2.trim(),
    );
    await this.upsert(
      SITE_SETTING_KEYS.WHATSAPP_NUMBER_1_ENABLED,
      this.boolToStorage(dto.whatsappNumber1Enabled),
    );
    await this.upsert(
      SITE_SETTING_KEYS.WHATSAPP_NUMBER_2_ENABLED,
      this.boolToStorage(dto.whatsappNumber2Enabled),
    );
    await this.upsert(
      SITE_SETTING_KEYS.HOME_PAGE_VIDEO_URL,
      dto.homePageVideoUrl.trim(),
    );
    await this.upsert(
      SITE_SETTING_KEYS.HOME_PAGE_VIDEO_ENABLED,
      this.boolToStorage(dto.homePageVideoEnabled),
    );
    await this.upsert(
      SITE_SETTING_KEYS.ABOUT_STATS,
      JSON.stringify(this.normalizeAboutStats(dto.aboutStats)),
    );
    await this.upsert(
      SITE_SETTING_KEYS.HERO_SLIDES,
      JSON.stringify(this.normalizeHeroSlides(dto.heroSlides)),
    );
    return this.getPublicSettings();
  }
}
