import { PartialType } from '@nestjs/swagger';
import { CreateServiceMarkDto } from './create-service-mark.dto';

export class UpdateServiceMarkDto extends PartialType(CreateServiceMarkDto) {}
