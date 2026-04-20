import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Visit payload — supports **camelCase** and **snake_case** (misimu / storefront).
 * All keys are declared so Nest `forbidNonWhitelisted` does not reject the body.
 */
export class CreateVisitDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  guestId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  guest_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  utmSource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  utm_source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  utmMedium?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  utm_medium?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  utmCampaign?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  utm_campaign?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  utmTerm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  utm_term?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  utmContent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  utm_content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  path?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  referrer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  user_agent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  ip_address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  location?: string;
}

/** Normalized shape used inside TrackingService (camel only). */
export type NormalizedVisitInput = {
  guestId?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  path?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  country?: string | null;
  location?: string | null;
};

export function normalizeCreateVisitDto(dto: CreateVisitDto): NormalizedVisitInput {
  const pair = (a?: string, b?: string): string | null => {
    const v = a?.trim() || b?.trim();
    return v || null;
  };
  const one = (a?: string): string | null => {
    const v = a?.trim();
    return v || null;
  };

  return {
    guestId: pair(dto.guestId, dto.guest_id),
    utmSource: pair(dto.utmSource, dto.utm_source),
    utmMedium: pair(dto.utmMedium, dto.utm_medium),
    utmCampaign: pair(dto.utmCampaign, dto.utm_campaign),
    utmTerm: pair(dto.utmTerm, dto.utm_term),
    utmContent: pair(dto.utmContent, dto.utm_content),
    path: one(dto.path),
    referrer: one(dto.referrer),
    userAgent: pair(dto.userAgent, dto.user_agent),
    ipAddress: pair(dto.ipAddress, dto.ip_address),
    country: one(dto.country),
    location: one(dto.location),
  };
}
