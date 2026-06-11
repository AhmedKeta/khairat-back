import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSettingEntity } from '../../infrastructure/database/entities/site-setting.entity';
import { SITE_SETTING_KEYS } from './constants';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';

export type PublicSiteSettings = {
  whatsappNumber1: string;
  whatsappNumber2: string;
  whatsappNumber1Enabled: boolean;
  whatsappNumber2Enabled: boolean;
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
    return {
      whatsappNumber1: number1,
      whatsappNumber2: stored2 || this.defaultWhatsappNumber2(number1),
      whatsappNumber1Enabled: enabled1,
      whatsappNumber2Enabled: enabled2,
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
    return this.getPublicSettings();
  }
}
