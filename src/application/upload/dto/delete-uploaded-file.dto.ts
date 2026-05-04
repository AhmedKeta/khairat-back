import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class DeleteUploadedFileDto {
  @ApiProperty({ example: '/uploads/images/abc-123.jpg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  url: string;
}
