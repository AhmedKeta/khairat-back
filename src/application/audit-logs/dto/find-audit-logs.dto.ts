import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FindAuditLogsDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  entity?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  userEmail?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  statusCode?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minDuration?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxDuration?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  success?: boolean;

  @IsOptional()
  @IsString()
  correlationId?: string;
}
