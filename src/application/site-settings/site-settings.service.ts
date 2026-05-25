import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSettingEntity } from '../../infrastructure/database/entities/site-setting.entity';
import { SITE_SETTING_KEYS } from './constants';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';

export type PublicSiteSettings = {
  whatsappNumber: string;
};

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectRepository(SiteSettingEntity)
    private readonly repo: Repository<SiteSettingEntity>,
    private readonly config: ConfigService,
  ) {}

  private defaultWhatsappNumber(): string {
    return (
      this.config.get<string>('SITE_WHATSAPP_NUMBER')?.trim() ||
      '+966500000000'
    );
  }

  private async getValue(key: string): Promise<string | null> {
    const row = await this.repo.findOne({ where: { key } });
    return row?.value?.trim() || null;
  }

  private async upsert(key: string, value: string): Promise<void> {
    await this.repo.save({ key, value: value.trim() });
  }

  async getPublicSettings(): Promise<PublicSiteSettings> {
    const stored = await this.getValue(SITE_SETTING_KEYS.WHATSAPP_NUMBER);
    return {
      whatsappNumber: stored || this.defaultWhatsappNumber(),
    };
  }

  async updateSettings(dto: UpdateSiteSettingsDto): Promise<PublicSiteSettings> {
    const normalized = dto.whatsappNumber.trim();
    await this.upsert(SITE_SETTING_KEYS.WHATSAPP_NUMBER, normalized);
    return this.getPublicSettings();
  }
}
