import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, Matches, MinLength } from 'class-validator';

const PHONE_PATTERN = /^\+?[\d\s-]+$/;

export class UpdateSiteSettingsDto {
  @ApiProperty({ example: '+966500000000', description: 'WhatsApp number 1 (Sales)' })
  @IsString()
  @MinLength(7)
  @Matches(PHONE_PATTERN, {
    message: 'whatsappNumber1 must contain only digits, spaces, dashes, and an optional leading +',
  })
  whatsappNumber1: string;

  @ApiProperty({ example: '+966500000001', description: 'WhatsApp number 2 (Support)' })
  @IsString()
  @MinLength(7)
  @Matches(PHONE_PATTERN, {
    message: 'whatsappNumber2 must contain only digits, spaces, dashes, and an optional leading +',
  })
  whatsappNumber2: string;

  @ApiProperty({ example: true, description: 'Show WhatsApp number 1 on the public site' })
  @IsBoolean()
  whatsappNumber1Enabled: boolean;

  @ApiProperty({ example: true, description: 'Show WhatsApp number 2 in the floating picker' })
  @IsBoolean()
  whatsappNumber2Enabled: boolean;
}
