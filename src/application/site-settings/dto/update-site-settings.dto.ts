import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class UpdateSiteSettingsDto {
  @ApiProperty({ example: '+966500000000' })
  @IsString()
  @MinLength(7)
  @Matches(/^\+?[\d\s-]+$/, {
    message: 'whatsappNumber must contain only digits, spaces, dashes, and an optional leading +',
  })
  whatsappNumber: string;
}
