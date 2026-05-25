import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteSettingEntity } from '../../infrastructure/database/entities/site-setting.entity';
import { SiteSettingsController } from '../../presentation/controllers/site-settings.controller';
import { SiteSettingsService } from './site-settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([SiteSettingEntity])],
  controllers: [SiteSettingsController],
  providers: [SiteSettingsService],
  exports: [SiteSettingsService],
})
export class SiteSettingsModule {}
