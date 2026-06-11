import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';

export class VerifyResetCodeDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Code must be a 6-digit number' })
  code: string;

  @ApiPropertyOptional({ enum: ['dashboard'], description: 'When set, only admin accounts may reset' })
  @IsOptional()
  @IsString()
  @IsIn(['dashboard'])
  client?: 'dashboard';
}
