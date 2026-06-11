import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: ['dashboard'], description: 'When set, only admin accounts may reset' })
  @IsOptional()
  @IsString()
  @IsIn(['dashboard'])
  client?: 'dashboard';
}
